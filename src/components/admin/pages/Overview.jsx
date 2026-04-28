import { Building2, DollarSign, FileText, Ticket, TrendingUp, Users } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KPICard } from "../KPICard";
import { StatusBadge } from "../StatusBadge";
import { adminApi, formatCurrency } from "@/lib/adminTenantApi";

const subscriptionColors = ["#3b82f6", "#8b5cf6", "#06b6d4"];

export function Overview() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    adminApi
      .overview()
      .then((payload) => {
        if (active) setData(payload);
      })
      .catch((err) => {
        if (active) setError(err.message || "Failed to load overview.");
      });
    return () => {
      active = false;
    };
  }, []);

  const subscriptionData = useMemo(() => {
    const clients = data?.recentClients || [];
    const counts = clients.reduce((acc, item) => {
      acc[item.plan] = (acc[item.plan] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value], index) => ({
      name,
      value,
      color: subscriptionColors[index % subscriptionColors.length],
    }));
  }, [data]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Dashboard Overview</h1>
        <p className="mt-2 text-gray-600">Monitor your platform&apos;s performance and key metrics</p>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {!data ? <p className="text-sm text-gray-600">Loading overview...</p> : null}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard title="Total Clients" value={data?.totalClients || 0} icon={Building2} />
        <KPICard title="Active Tenants" value={data?.activeSubscriptions || 0} icon={TrendingUp} />
        <KPICard title="Total Users" value={data?.totalUsers || 0} icon={Users} />
        <KPICard title="Monthly Revenue" value={data ? formatCurrency(data.monthlyRevenue) : "-"} icon={DollarSign} />
        <KPICard title="Active Subscriptions" value={data?.activeSubscriptions || 0} icon={FileText} />
        <KPICard title="Platform Issues" value={data?.openPlatformIssues || 0} icon={Ticket} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-8 border-2 border-gray-300">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Over Time</h3>
            <p className="text-sm text-gray-600">Monthly revenue trend</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data?.revenueData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: "12px" }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ fill: "#3b82f6", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl bg-white p-8 border-2 border-gray-300">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Subscription Breakdown</h3>
            <p className="text-sm text-gray-600">Distribution across current recent tenants</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={subscriptionData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {subscriptionData.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl bg-white border-2 border-gray-300">
        <div className="border-b-2 border-gray-300 p-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Clients</h3>
          <p className="text-sm text-gray-600">Latest client activity and status</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data?.recentClients || []).map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {client.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{client.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.plan}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.users}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={client.status} variant="compact" /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(client.revenue)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-blue-600 hover:text-blue-700 font-medium" onClick={() => router.push("/dashboard/admin/clients")}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl bg-white border-2 border-gray-300 p-6">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-gray-900">Recent Dashboard Activity</h3>
          <p className="text-sm text-gray-600">Latest page opens, slow requests, and client-side issues across dashboards</p>
        </div>
        <div className="space-y-3">
          {(data?.recentActivity || []).map((entry) => (
            <div key={entry.id} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{entry.summary}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {entry.clientName} • {entry.actorRole || "user"} • {entry.dashboard} • {entry.timestamp}
                  </p>
                </div>
                <StatusBadge status={entry.severity} variant="compact" />
              </div>
              {entry.details ? <p className="mt-2 text-sm text-gray-700">{entry.details}</p> : null}
            </div>
          ))}
          {(!data?.recentActivity || data.recentActivity.length === 0) ? (
            <p className="text-sm text-gray-500">No dashboard activity has been reported yet.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
