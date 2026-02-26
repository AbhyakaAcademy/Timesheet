import { Activity, AlertTriangle, Database, Server, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { systemHealth } from '@/data/admin/mockData';

const uptimeData = [
  { time: '00:00', uptime: 99.98 },
  { time: '04:00', uptime: 99.97 },
  { time: '08:00', uptime: 99.99 },
  { time: '12:00', uptime: 99.96 },
  { time: '16:00', uptime: 99.98 },
  { time: '20:00', uptime: 99.97 },
  { time: '24:00', uptime: 99.97 },
];

const errorData = [
  { time: '00:00', errors: 2 },
  { time: '04:00', errors: 1 },
  { time: '08:00', errors: 5 },
  { time: '12:00', errors: 3 },
  { time: '16:00', errors: 7 },
  { time: '20:00', errors: 4 },
  { time: '24:00', errors: 2 },
];

const performanceData = [
  { metric: 'API Response Time', value: '124ms', status: 'Healthy' },
  { metric: 'Database Queries', value: '45ms', status: 'Healthy' },
  { metric: 'Page Load Time', value: '1.2s', status: 'Healthy' },
  { metric: 'Memory Usage', value: '68%', status: 'Healthy' },
  { metric: 'CPU Usage', value: '42%', status: 'Healthy' },
];

export function SystemHealth() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">System Health</h1>
        <p className="mt-2 text-gray-600">Monitor platform infrastructure and performance</p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
          </div>
          <p className="text-sm text-gray-600 mb-1">API Status</p>
          <p className="text-xl font-semibold text-gray-900">{systemHealth.apiStatus}</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Server className="h-5 w-5 text-blue-600" />
            </div>
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Server Load</p>
          <p className="text-xl font-semibold text-gray-900">{systemHealth.serverLoad}%</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Database className="h-5 w-5 text-purple-600" />
            </div>
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Database</p>
          <p className="text-xl font-semibold text-gray-900">{systemHealth.databaseHealth}</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Error Rate</p>
          <p className="text-xl font-semibold text-gray-900">{systemHealth.errorRate}%</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <Zap className="h-5 w-5 text-green-600" />
            </div>
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Uptime</p>
          <p className="text-xl font-semibold text-gray-900">{systemHealth.uptime}%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Uptime Chart */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Server Uptime (24h)</h3>
            <p className="text-sm text-gray-600">Last 24 hours uptime percentage</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={uptimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis domain={[99.9, 100]} stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Area type="monotone" dataKey="uptime" stroke="#10b981" fill="#dcfce7" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Error Rate Chart */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Error Logs (24h)</h3>
            <p className="text-sm text-gray-600">Error count over last 24 hours</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={errorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="border-b border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
          <p className="text-sm text-gray-600">Real-time system performance indicators</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threshold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {performanceData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{item.metric}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{item.value}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700 border border-green-200">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Within limits</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Events */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Events</h3>
          <p className="text-sm text-gray-600">Latest system events and alerts</p>
        </div>
        <div className="space-y-4">
          <div className="flex items-start gap-4 border-b border-gray-100 pb-4">
            <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">System deployment completed</p>
              <p className="text-sm text-gray-500">Version 2.4.1 deployed successfully</p>
              <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-start gap-4 border-b border-gray-100 pb-4">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Server className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Server auto-scaling triggered</p>
              <p className="text-sm text-gray-500">Added 2 new instances due to high load</p>
              <p className="text-xs text-gray-400 mt-1">5 hours ago</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
              <Database className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Database backup completed</p>
              <p className="text-sm text-gray-500">Daily automated backup successful</p>
              <p className="text-xs text-gray-400 mt-1">8 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

