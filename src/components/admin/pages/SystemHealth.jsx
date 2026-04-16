import { Activity, AlertTriangle, Database, Server, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminTenantApi";

export function SystemHealth() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    adminApi.systemHealth().then(setHealth).catch(() => setHealth(null));
  }, []);

  const cards = [
    { title: "API Status", value: health?.api || "Unknown", icon: Activity, color: "text-green-600" },
    { title: "Organizations", value: health?.organizations ?? "-", icon: Server, color: "text-blue-600" },
    { title: "Database", value: health?.database || "Unknown", icon: Database, color: "text-purple-600" },
    { title: "Users", value: health?.users ?? "-", icon: AlertTriangle, color: "text-red-600" },
    { title: "Active Subs", value: health?.activeSubscriptions ?? "-", icon: Zap, color: "text-green-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">System Health</h1>
        <p className="mt-2 text-gray-600">Monitor platform infrastructure and performance</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(({ title, value, icon: Icon, color }) => (
          <div key={title} className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
            </div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-xl font-semibold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Events</h3>
          <p className="text-sm text-gray-600">Platform health summary</p>
        </div>
        <div className="space-y-4 text-sm text-gray-700">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">API is currently reporting as {health?.api || "unknown"}.</div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">Database connectivity is {health?.database || "unknown"}.</div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">{health?.organizations ?? 0} organizations and {health?.users ?? 0} users are currently tracked.</div>
        </div>
      </div>
    </div>
  );
}
