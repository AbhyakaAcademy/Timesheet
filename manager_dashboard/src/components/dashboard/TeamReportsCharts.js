"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const STATUS_COLORS = {
  Pending: "#d97706",
  Approved: "#16a34a",
  Rejected: "#dc2626",
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg">
      {label ? <p className="font-semibold text-gray-900">{label}</p> : null}
      {payload.map((item, index) => (
        <p key={`${item.dataKey || item.name || "value"}-${index}`} className="mt-1 text-gray-700">
          <span className="font-medium">{item.name}:</span> {item.value}
        </p>
      ))}
    </div>
  );
}

export default function TeamReportsCharts({
  utilizationData = [],
  statusData = [],
  maxHours = 60,
  projectDistributionData = [],
  teamPerformanceData = [],
}) {
  const [activeSliceIndex, setActiveSliceIndex] = useState(0);

  const normalizedStatus = useMemo(
    () =>
      statusData.map((item) => ({
        ...item,
        color: item.color || STATUS_COLORS[item.label] || "#2563eb",
      })),
    [statusData],
  );

  const totalStatus = useMemo(
    () => normalizedStatus.reduce((sum, item) => sum + item.value, 0),
    [normalizedStatus],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-gray-900">Employee Utilization</h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              Animated
            </span>
          </div>

          <div className="mt-4 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={utilizationData}
                margin={{ top: 8, right: 12, left: 0, bottom: 24 }}
                barGap={12}
              >
                <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  tick={{ fontSize: 11, fill: "#4b5563" }}
                />
                <YAxis
                  domain={[0, maxHours]}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  label={{ value: "Hours", angle: -90, position: "insideLeft", fill: "#6b7280" }}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(37,99,235,0.08)" }} />
                <Bar
                  dataKey="hours"
                  name="Weekly Hours"
                  fill="#2563eb"
                  radius={[8, 8, 0, 0]}
                  animationDuration={850}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-gray-900">Timesheet Status Distribution</h2>
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              Interactive
            </span>
          </div>

          <div className="mt-4 grid items-center gap-3 lg:grid-cols-[1fr_auto]">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={normalizedStatus}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={72}
                    outerRadius={102}
                    paddingAngle={3}
                    activeIndex={activeSliceIndex}
                    activeShape={(props) => <Sector {...props} outerRadius={(props.outerRadius || 102) + 8} />}
                    onMouseEnter={(_, index) => setActiveSliceIndex(index)}
                    animationDuration={900}
                  >
                    {normalizedStatus.map((item) => (
                      <Cell key={item.label} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-500">Total Submissions</p>
              <p className="text-2xl font-semibold text-gray-900">{totalStatus}</p>
              {normalizedStatus[activeSliceIndex] ? (
                <p className="text-sm text-gray-600">
                  Highlight:{" "}
                  <span className="font-medium text-gray-900">
                    {normalizedStatus[activeSliceIndex].label} ({normalizedStatus[activeSliceIndex].value})
                  </span>
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Project Time Distribution</h2>
        <div className="mt-4 h-[420px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={projectDistributionData}
              layout="vertical"
              margin={{ top: 12, right: 20, left: 24, bottom: 8 }}
              barCategoryGap={10}
            >
              <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#4b5563" }} />
              <YAxis
                type="category"
                dataKey="project"
                width={130}
                tick={{ fontSize: 11, fill: "#4b5563" }}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(139,92,246,0.08)" }} />
              <Legend />
              <Bar
                dataKey="hours"
                name="Hours"
                fill="#7c3aed"
                radius={[0, 6, 6, 0]}
                animationDuration={900}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Team Performance Overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Employee
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Total Hours
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Timesheets
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {teamPerformanceData.map((row) => (
                <tr key={row.employee}>
                  <td className="px-5 py-4 text-base font-semibold text-gray-900">{row.employee}</td>
                  <td className="px-5 py-4 text-base text-gray-800">{row.totalHours} hours</td>
                  <td className="px-5 py-4 text-base text-gray-800">{row.timesheets}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        row.status === "Approved"
                          ? "bg-green-100 text-green-700"
                          : row.status === "Rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
