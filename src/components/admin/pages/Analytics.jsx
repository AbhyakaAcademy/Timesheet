import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminTenantApi";

export function Analytics() {
  const [data, setData] = useState([]);

  useEffect(() => {
    adminApi
      .overview()
      .then((payload) =>
        setData((payload.revenueData || []).map((item) => ({ date: item.month, users: item.users, sessions: item.users * 2 })))
      )
      .catch(() => setData([]));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Analytics</h1>
        <p className="mt-2 text-gray-600">Deep dive into platform usage and trends</p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">User Activity</h3>
          <p className="text-sm text-gray-600">Derived from current platform overview</p>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: "12px" }} />
            <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
            <Tooltip />
            <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} name="Active Users" />
            <Line type="monotone" dataKey="sessions" stroke="#8b5cf6" strokeWidth={3} name="Sessions" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
