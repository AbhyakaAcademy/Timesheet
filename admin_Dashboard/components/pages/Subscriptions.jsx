import { TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { StatusBadge } from '../StatusBadge';

const subscriptionPlans = [
  { name: 'Basic', value: 425, color: '#3b82f6', price: 799, features: '10 users, 50GB storage' },
  { name: 'Pro', value: 578, color: '#8b5cf6', price: 1299, features: '50 users, 500GB storage' },
  { name: 'Enterprise', value: 200, color: '#06b6d4', price: 2499, features: 'Unlimited users, 5TB storage' },
];

const recentSubscriptions = [
  { id: 1, client: 'Acme Corporation', plan: 'Enterprise', status: 'Active', users: 245, mrr: 2499, renewalDate: 'Mar 15, 2026', paymentStatus: 'Current' },
  { id: 2, client: 'TechStart Inc', plan: 'Pro', status: 'Active', users: 87, mrr: 1299, renewalDate: 'Mar 20, 2026', paymentStatus: 'Current' },
  { id: 3, client: 'Global Dynamics', plan: 'Basic', status: 'Active', users: 34, mrr: 799, renewalDate: 'Apr 01, 2026', paymentStatus: 'Current' },
  { id: 4, client: 'Innovation Labs', plan: 'Enterprise', status: 'Active', users: 312, mrr: 2499, renewalDate: 'Mar 10, 2026', paymentStatus: 'Current' },
  { id: 5, client: 'Digital Solutions', plan: 'Pro', status: 'Cancelled', users: 0, mrr: 0, renewalDate: '-', paymentStatus: 'Cancelled' },
  { id: 6, client: 'Cloud Systems', plan: 'Basic', status: 'Active', users: 18, mrr: 799, renewalDate: 'Mar 25, 2026', paymentStatus: 'Current' },
  { id: 7, client: 'DataFlow Inc', plan: 'Enterprise', status: 'Active', users: 189, mrr: 2499, renewalDate: 'Apr 05, 2026', paymentStatus: 'Current' },
  { id: 8, client: 'NextGen Tech', plan: 'Pro', status: 'Trial', users: 25, mrr: 0, renewalDate: 'Feb 28, 2026', paymentStatus: 'Trial' },
];

export function Subscriptions() {
  const totalSubscriptions = subscriptionPlans.reduce((sum, plan) => sum + plan.value, 0);
  const totalMRR = recentSubscriptions.filter(sub => sub.status === 'Active').reduce((sum, sub) => sum + sub.mrr, 0);
  const activeSubscriptions = recentSubscriptions.filter(sub => sub.status === 'Active').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Subscriptions</h1>
        <p className="mt-2 text-gray-600">Manage platform subscriptions and plan tiers</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Subscriptions</p>
          <p className="text-2xl font-semibold text-gray-900">{totalSubscriptions}</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Active Subscriptions</p>
          <p className="text-2xl font-semibold text-gray-900">{activeSubscriptions}</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Monthly Recurring Revenue</p>
          <p className="text-2xl font-semibold text-gray-900">${totalMRR.toLocaleString()}</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-cyan-50 rounded-lg">
              <Calendar className="h-5 w-5 text-cyan-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Annual Recurring Revenue</p>
          <p className="text-2xl font-semibold text-gray-900">${(totalMRR * 12).toLocaleString()}</p>
        </div>
      </div>

      {/* Plans Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pie Chart */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Subscription Distribution</h3>
            <p className="text-sm text-gray-600">By plan type</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={subscriptionPlans}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {subscriptionPlans.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Details */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Plan Details</h3>
            <p className="text-sm text-gray-600">Available subscription tiers</p>
          </div>
          <div className="space-y-4">
            {subscriptionPlans.map((plan) => (
              <div key={plan.name} className="p-4 rounded-lg border border-gray-200 hover:border-blue-200 hover:bg-blue-50/50 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: plan.color }} />
                    <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">${plan.price}/mo</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">{plan.features}</p>
                  <p className="text-sm font-medium text-gray-900">{plan.value} subscribers</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="border-b border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900">All Subscriptions</h3>
          <p className="text-sm text-gray-600">Detailed subscription overview</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MRR</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Renewal Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentSubscriptions.map((subscription) => (
                <tr key={subscription.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {subscription.client.charAt(0)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{subscription.client}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{subscription.plan}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={subscription.status} variant="compact" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subscription.users}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    ${subscription.mrr.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{subscription.renewalDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={subscription.paymentStatus} variant="compact" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-blue-600 hover:text-blue-700 font-medium mr-3 transition-colors">Manage</button>
                    <button className="text-gray-600 hover:text-gray-700 font-medium transition-colors">History</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
