"use client";

import { useEffect, useMemo, useState } from "react";

import DashboardFrame from "@/components/dashboard/DashboardFrame";
import StatCard from "@/components/dashboard/StatCard";
import TeamReportsCharts from "@/components/dashboard/TeamReportsCharts";
import { apiFetch } from "@/lib/api";
import { getManagerDashboardSlice, setManagerDashboardSlice } from "@/lib/managerDashboardStorage";

function TeamMembersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 18a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="9" r="2.3" />
      <path d="M15 16.5a5 5 0 0 1 5.5 1.5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 16.5 10 10l4 4 6-6" />
      <path d="M16 8h4v4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8" />
      <path d="m8.5 12.2 2.2 2.2 4.8-5.2" />
    </svg>
  );
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(() => !getManagerDashboardSlice("reportsDatasets", null));
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingCount, setPendingCount] = useState(() => getManagerDashboardSlice("reportsPendingCount", 0));
  const [datasets, setDatasets] = useState(() =>
    getManagerDashboardSlice("reportsDatasets", {
      utilization: [],
      statusSplit: [],
      projectDistribution: [],
      teamPerformance: [],
      maxHours: 60,
    })
  );

  useEffect(() => {
    (async () => {
      setErrorMessage("");
      setLoading(true);
      try {
        const [pending, approved, rejected] = await Promise.all([
          apiFetch("/manager/timesheets?status=pending"),
          apiFetch("/manager/timesheets?status=approved"),
          apiFetch("/manager/timesheets?status=rejected"),
        ]);

        const statusSplit = [
          { label: "Pending", value: (pending || []).length, color: "#d97706", textClass: "text-amber-700" },
          { label: "Approved", value: (approved || []).length, color: "#16a34a", textClass: "text-green-600" },
          { label: "Rejected", value: (rejected || []).length, color: "#dc2626", textClass: "text-red-600" },
        ];

        const nextPendingCount = (pending || []).length;
        setPendingCount(nextPendingCount);
        setManagerDashboardSlice("reportsPendingCount", nextPendingCount);

        const all = [
          ...(pending || []).map((x) => ({ ...x, statusLabel: "Pending" })),
          ...(approved || []).map((x) => ({ ...x, statusLabel: "Approved" })),
          ...(rejected || []).map((x) => ({ ...x, statusLabel: "Rejected" })),
        ];

        const employeeMap = new Map();
        all.forEach((item) => {
          const employeeId = item.employee || item.employee_username || item.id;
          const employeeName = item.employee_name || item.employee_username || "Employee";
          const hours = Number(item.total_hours || 0);
          const existing = employeeMap.get(employeeId) || {
            employee: employeeName,
            totalHours: 0,
            timesheetCount: 0,
            pendingCount: 0,
            approvedCount: 0,
            rejectedCount: 0,
          };

          existing.totalHours += hours;
          existing.timesheetCount += 1;
          if (item.statusLabel === "Approved") existing.approvedCount += 1;
          if (item.statusLabel === "Rejected") existing.rejectedCount += 1;
          if (item.statusLabel === "Pending") existing.pendingCount += 1;
          employeeMap.set(employeeId, existing);
        });

        const employeeSummary = [...employeeMap.values()].sort((a, b) => b.totalHours - a.totalHours);

        const utilization = employeeSummary.map((item) => ({
          name: item.employee,
          hours: Number(item.totalHours.toFixed(2)),
        }));

        const teamPerformance = employeeSummary.map((item) => {
          let status = "Pending";
          if (item.pendingCount === 0 && item.rejectedCount === 0 && item.approvedCount > 0) {
            status = "Approved";
          } else if (item.pendingCount === 0 && item.rejectedCount > 0) {
            status = "Rejected";
          }

          return {
            employee: item.employee,
            totalHours: Number(item.totalHours.toFixed(2)),
            timesheets: `${item.timesheetCount} submitted`,
            status,
          };
        });

        const details = await Promise.all(all.map((item) => apiFetch(`/manager/timesheets/${item.id}`)));
        const projectMap = new Map();
        details.forEach((detail) => {
          (detail.lines || []).forEach((line) => {
            const key = line.project?.name || "Unknown";
            const prev = projectMap.get(key) || 0;
            projectMap.set(key, prev + Number(line.hours || 0));
          });
        });

        const projectDistribution = [...projectMap.entries()]
          .map(([project, hours]) => ({ project, hours: Math.round(hours) }))
          .sort((a, b) => b.hours - a.hours);

        const maxHoursValue = Math.max(...utilization.map((item) => item.hours), 8);
        const maxHours = Math.ceil(maxHoursValue / 5) * 5;

        const nextDatasets = { utilization, statusSplit, projectDistribution, teamPerformance, maxHours };
        setDatasets(nextDatasets);
        setManagerDashboardSlice("reportsDatasets", nextDatasets);
      } catch (error) {
        setErrorMessage(error.message || "Failed to load reports.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalMembers = datasets.utilization.length;
  const totalHours = useMemo(() => datasets.utilization.reduce((sum, item) => sum + item.hours, 0), [datasets.utilization]);
  const avgHours = totalMembers ? (totalHours / totalMembers).toFixed(1) : "0";

  return (
    <DashboardFrame activeTab="reports" pendingCount={pendingCount}>
      <div className="space-y-5">
        {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
        {loading ? <p className="text-sm text-gray-600">Loading reports...</p> : null}

        <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
          <StatCard title="Team Members" value={`${totalMembers}`} tone="blue" icon={<TeamMembersIcon />} />
          <StatCard title="Total Hours" value={`${totalHours.toFixed(2)}`} tone="green" icon={<ClockIcon />} />
          <StatCard title="Pending Approvals" value={`${pendingCount}`} tone="amber" icon={<TrendIcon />} />
          <StatCard title="Avg Hours/Week" value={`${avgHours}`} tone="violet" icon={<CheckIcon />} />
        </div>

        <TeamReportsCharts
          utilizationData={datasets.utilization}
          statusData={datasets.statusSplit}
          maxHours={datasets.maxHours}
          projectDistributionData={datasets.projectDistribution}
          teamPerformanceData={datasets.teamPerformance}
        />
      </div>
    </DashboardFrame>
  );
}
