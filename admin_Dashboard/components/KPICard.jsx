import { TrendingUp, TrendingDown } from 'lucide-react';

export function KPICard({ title, value, change, trend, icon: Icon, prefix }) {
  const isPositive = trend === 'up' ? change >= 0 : change < 0;

  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-gray-300 hover:shadow-lg transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl">
          <Icon className="w-6 h-6 text-indigo-600" />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>{Math.abs(change)}%</span>
        </div>
      </div>
      <div>
        <p className="text-gray-600 text-sm mb-1">{title}</p>
        <p className="text-3xl font-semibold text-gray-900">
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  );
}