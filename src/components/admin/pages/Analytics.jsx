import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { activityData } from '@/data/admin/mockData';

export function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Analytics</h1>
        <p className="mt-2 text-gray-600">Deep dive into platform usage and trends</p>
      </div>

      {/* Activity Chart */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">User Activity (7 Days)</h3>
          <p className="text-sm text-gray-600">Daily active users and sessions</p>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={activityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} name="Active Users" />
            <Line type="monotone" dataKey="sessions" stroke="#8b5cf6" strokeWidth={3} name="Sessions" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-gray-100">
        <p className="text-gray-600">Additional analytics features coming soon...</p>
      </div>
    </div>
  );
}

