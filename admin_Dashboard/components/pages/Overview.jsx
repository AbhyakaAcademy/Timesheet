import { Building2, Users, DollarSign, FileText, Ticket, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useRouter } from 'next/navigation';
import { KPICard } from '../KPICard';
import { StatusBadge } from '../StatusBadge';
import { kpiData, revenueData, subscriptionData, recentClients, systemHealth } from '../../data/mockData';

export function Overview() {
  const router = useRouter();

  const handleViewClient = (clientId) => {
    // Navigate to clients page (you could also pass client ID as a param)
    router.push('/dashboard/clients');
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Dashboard Overview</h1>
        <p className="mt-2 text-gray-600">Monitor your platform's performance and key metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard
          title="Total Clients"
          value={kpiData.totalClients.value}
          change={kpiData.totalClients.change}
          trend={kpiData.totalClients.trend}
          icon={Building2}
        />
        <KPICard
          title="Active Tenants"
          value={kpiData.activeTenants.value}
          change={kpiData.activeTenants.change}
          trend={kpiData.activeTenants.trend}
          icon={TrendingUp}
        />
        <KPICard
          title="Total Users"
          value={kpiData.totalUsers.value}
          change={kpiData.totalUsers.change}
          trend={kpiData.totalUsers.trend}
          icon={Users}
        />
        <KPICard
          title="Monthly Revenue"
          value={kpiData.monthlyRevenue.value}
          change={kpiData.monthlyRevenue.change}
          trend={kpiData.monthlyRevenue.trend}
          icon={DollarSign}
          prefix="$"
        />
        <KPICard
          title="Active Subscriptions"
          value={kpiData.activeSubscriptions.value}
          change={kpiData.activeSubscriptions.change}
          trend={kpiData.activeSubscriptions.trend}
          icon={FileText}
        />
        <KPICard
          title="Open Tickets"
          value={kpiData.openTickets.value}
          change={kpiData.openTickets.change}
          trend="down"
          icon={Ticket}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="rounded-2xl bg-white p-8 border-2 border-gray-300">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Over Time</h3>
            <p className="text-sm text-gray-600">Monthly revenue for the last 12 months</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Subscription Breakdown */}
        <div className="rounded-2xl bg-white p-8 border-2 border-gray-300">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Subscription Breakdown</h3>
            <p className="text-sm text-gray-600">Distribution across plan tiers</p>
          </div>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subscriptionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {subscriptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {client.name.charAt(0)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-500">{client.adminEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{client.plan}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.users}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={client.status} variant="compact" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${client.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.lastActivity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-blue-600 hover:text-blue-700 font-medium mr-3" onClick={() => handleViewClient(client.id)}>View</button>
                    <button className="text-gray-600 hover:text-gray-700 font-medium">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Health Panel */}
      <div className="rounded-2xl bg-white p-8 border-2 border-gray-300">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
          <p className="text-sm text-gray-600">Real-time platform status</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="flex items-center gap-3 rounded-xl border-2 border-gray-200 p-4">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <div>
              <p className="text-sm text-gray-600">API Status</p>
              <p className="font-semibold text-gray-900">{systemHealth.apiStatus}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border-2 border-gray-200 p-4">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <div>
              <p className="text-sm text-gray-600">Server Load</p>
              <p className="font-semibold text-gray-900">{systemHealth.serverLoad}%</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border-2 border-gray-200 p-4">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <div>
              <p className="text-sm text-gray-600">Database</p>
              <p className="font-semibold text-gray-900">{systemHealth.databaseHealth}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border-2 border-gray-200 p-4">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <div>
              <p className="text-sm text-gray-600">Error Rate</p>
              <p className="font-semibold text-gray-900">{systemHealth.errorRate}%</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border-2 border-gray-200 p-4">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <div>
              <p className="text-sm text-gray-600">Uptime</p>
              <p className="font-semibold text-gray-900">{systemHealth.uptime}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}