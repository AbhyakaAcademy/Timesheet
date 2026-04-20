import { TrendingUp, Users, DollarSign, Calendar } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "../StatusBadge";
import { adminApi, formatCurrency } from "@/lib/adminTenantApi";
import { createClientNotification } from "@/lib/supportTickets";

const colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#14b8a6"];

const getDaysUntilRenewal = (renewalDate) => {
  if (!renewalDate || renewalDate === "-") return null;
  const renewal = /^\d{4}-\d{2}-\d{2}$/.test(String(renewalDate))
    ? new Date(`${renewalDate}T00:00:00`)
    : new Date(renewalDate);
  if (Number.isNaN(renewal.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((renewal.getTime() - today.getTime()) / 86400000);
};

const getExpiryStatus = (renewalDate) => {
  const days = getDaysUntilRenewal(renewalDate);
  if (days === null) return { label: "No renewal date", tone: "bg-gray-50 text-gray-600 border-gray-200" };
  if (days < 0) return { label: `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`, tone: "bg-rose-50 text-rose-700 border-rose-200" };
  if (days === 0) return { label: "Expires today", tone: "bg-rose-50 text-rose-700 border-rose-200" };
  if (days <= 7) return { label: `Expires in ${days} day${days === 1 ? "" : "s"}`, tone: "bg-amber-50 text-amber-700 border-amber-200" };
  if (days <= 30) return { label: `Renews in ${days} days`, tone: "bg-blue-50 text-blue-700 border-blue-200" };
  return { label: `Renews in ${days} days`, tone: "bg-emerald-50 text-emerald-700 border-emerald-200" };
};

export function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const loadSubscriptions = async () => {
    setSubscriptions(await adminApi.subscriptions());
  };

  useEffect(() => {
    let active = true;

    adminApi.subscriptions().then((payload) => {
      if (active) {
        setSubscriptions(payload);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const distribution = useMemo(() => {
    const counts = subscriptions.reduce((acc, item) => {
      acc[item.plan] = (acc[item.plan] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value], index) => ({ name, value, color: colors[index % colors.length] }));
  }, [subscriptions]);

  const totalSubscriptions = subscriptions.length;
  const totalMRR = subscriptions.filter((sub) => sub.status === "Active").reduce((sum, sub) => sum + Number(sub.mrr || 0), 0);
  const activeSubscriptions = subscriptions.filter((sub) => sub.status === "Active").length;
  const expiringSoon = subscriptions.filter((sub) => {
    const days = getDaysUntilRenewal(sub.renewalDate);
    return days !== null && days >= 0 && days <= 30 && sub.status !== "Cancelled";
  });
  const expiredSubscriptions = subscriptions.filter((sub) => {
    const days = getDaysUntilRenewal(sub.renewalDate);
    return days !== null && days < 0 && sub.status !== "Cancelled";
  });

  const saveSubscription = async () => {
    await adminApi.updateSubscription(selectedSubscription);
    await loadSubscriptions();
    setShowManageDialog(false);
  };

  const notifyClient = (subscription) => {
    const expiry = getExpiryStatus(subscription.renewalDate);
    createClientNotification({
      clientName: subscription.client,
      title: "Subscription renewal reminder",
      message: `${subscription.plan} plan for ${subscription.client} ${expiry.label.toLowerCase()}. Please renew or update the subscription to avoid interruption.`,
    });
    setNotificationMessage(`Notification sent to ${subscription.client}.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Subscriptions</h1>
        <p className="mt-2 text-gray-600">Manage platform subscriptions and plan tiers</p>
      </div>

      {notificationMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {notificationMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100"><div className="mb-4 rounded-lg bg-blue-50 p-3 w-fit"><Users className="h-5 w-5 text-blue-600" /></div><p className="text-sm text-gray-600 mb-1">Total Subscriptions</p><p className="text-2xl font-semibold text-gray-900">{totalSubscriptions}</p></div>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100"><div className="mb-4 rounded-lg bg-green-50 p-3 w-fit"><TrendingUp className="h-5 w-5 text-green-600" /></div><p className="text-sm text-gray-600 mb-1">Active Subscriptions</p><p className="text-2xl font-semibold text-gray-900">{activeSubscriptions}</p></div>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100"><div className="mb-4 rounded-lg bg-purple-50 p-3 w-fit"><DollarSign className="h-5 w-5 text-purple-600" /></div><p className="text-sm text-gray-600 mb-1">Monthly Recurring Revenue</p><p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalMRR)}</p></div>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100"><div className="mb-4 rounded-lg bg-amber-50 p-3 w-fit"><Calendar className="h-5 w-5 text-amber-600" /></div><p className="text-sm text-gray-600 mb-1">Expiring in 30 Days</p><p className="text-2xl font-semibold text-gray-900">{expiringSoon.length}</p><p className="mt-1 text-xs text-rose-600">{expiredSubscriptions.length} expired</p></div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-amber-900">Renewal Attention</h3>
            <p className="text-sm text-amber-800">Review clients whose subscription is expired or renewing within 30 days, then notify them from the table.</p>
          </div>
          <p className="text-sm font-semibold text-amber-900">{expiredSubscriptions.length + expiringSoon.length} client{expiredSubscriptions.length + expiringSoon.length === 1 ? "" : "s"} need attention</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="mb-6"><h3 className="text-lg font-semibold text-gray-900">Subscription Distribution</h3><p className="text-sm text-gray-600">By plan type</p></div>
          <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={distribution} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} dataKey="value">{distribution.map((entry, index) => <Cell key={`${entry.name}-${index}`} fill={entry.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="border-b border-gray-100 p-6"><h3 className="text-lg font-semibold text-gray-900">All Subscriptions</h3><p className="text-sm text-gray-600">Detailed subscription overview</p></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Client</th><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Plan</th><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Users</th><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">MRR</th><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Renewal Date</th><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Expiry</th><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Payment Status</th><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {subscriptions.map((subscription) => {
                const expiry = getExpiryStatus(subscription.renewalDate);
                return (
                  <tr key={subscription.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{subscription.client}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{subscription.plan}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={subscription.status} variant="compact" /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subscription.users}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{formatCurrency(subscription.mrr)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{subscription.renewalDate || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${expiry.tone}`}>{expiry.label}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={subscription.paymentStatus} variant="compact" /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm"><button onClick={() => { setSelectedSubscription({ ...subscription }); setShowManageDialog(true); }} className="text-blue-600 hover:text-blue-700 font-medium mr-3 transition-colors">Manage</button><button onClick={() => notifyClient(subscription)} className="text-amber-600 hover:text-amber-700 font-medium mr-3 transition-colors">Notify Client</button><button onClick={() => { setSelectedSubscription(subscription); setShowHistoryDialog(true); }} className="text-gray-600 hover:text-gray-700 font-medium transition-colors">History</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showManageDialog && selectedSubscription ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowManageDialog(false)} />
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Manage Subscription</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Plan</label><select value={selectedSubscription.plan} onChange={(e) => setSelectedSubscription((prev) => ({ ...prev, plan: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"><option>Starter</option><option>Professional</option><option>Enterprise</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={selectedSubscription.status} onChange={(e) => setSelectedSubscription((prev) => ({ ...prev, status: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"><option>Active</option><option>Trial</option><option>Inactive</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Users</label><input type="number" value={selectedSubscription.users} onChange={(e) => setSelectedSubscription((prev) => ({ ...prev, users: Number(e.target.value || 0) }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
              <div className="flex gap-3 pt-4"><button onClick={() => setShowManageDialog(false)} className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700">Cancel</button><button onClick={saveSubscription} className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Save</button></div>
            </div>
          </div>
        </div>
      ) : null}

      {showHistoryDialog && selectedSubscription ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowHistoryDialog(false)} />
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Subscription History</h2>
            <div className="space-y-3">{(selectedSubscription.history || []).map((entry, index) => <div key={`${entry}-${index}`} className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">{entry}</div>)}</div>
            <button onClick={() => setShowHistoryDialog(false)} className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Close</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
