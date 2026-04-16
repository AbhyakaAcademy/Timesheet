import { DollarSign, TrendingUp, Wallet, CreditCard } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { adminApi, formatCurrency } from "@/lib/adminTenantApi";

export function Revenue() {
  const [data, setData] = useState(null);

  useEffect(() => {
    adminApi.revenue().then(setData).catch(() => setData(null));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Revenue</h1>
        <p className="mt-2 text-gray-600">Track your platform&apos;s financial performance</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard icon={DollarSign} title="Monthly Revenue" value={formatCurrency(data?.monthlyRevenue)} />
        <MetricCard icon={CreditCard} title="Quarterly Revenue" value={formatCurrency(data?.quarterlyRevenue)} />
        <MetricCard icon={Wallet} title="Annual Revenue" value={formatCurrency(data?.annualRevenue)} />
        <MetricCard icon={DollarSign} title="MRR" value={formatCurrency(data?.monthlyRevenue)} />
        <MetricCard icon={TrendingUp} title="ARR" value={formatCurrency(data?.annualRevenue)} />
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Growth</h3>
          <p className="text-sm text-gray-600">Current platform revenue snapshot</p>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={[{ month: "Current", revenue: Number(data?.monthlyRevenue || 0) }]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: "12px" }} />
            <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ fill: "#3b82f6", r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="border-b border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900">Top Paying Clients</h3>
          <p className="text-sm text-gray-600">Highest revenue contributors</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Annual Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data?.topPayingClients || []).map((client) => (
                <tr key={client.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{client.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{formatCurrency(client.revenue)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">{formatCurrency(Number(client.revenue) * 12)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, title, value }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-green-50 rounded-lg">
          <Icon className="h-5 w-5 text-green-600" />
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}
