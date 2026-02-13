import DashboardFrame from "@/components/dashboard/DashboardFrame";
import StatCard from "@/components/dashboard/StatCard";
import TeamReportsCharts from "@/components/dashboard/TeamReportsCharts";

const utilization = [
  { name: "Jessica Taylor", hours: 55 },
  { name: "Michael Johnson", hours: 42 },
  { name: "Sarah Chen", hours: 40 },
  { name: "David Park", hours: 40 },
  { name: "Emily Rodriguez", hours: 38 },
];

const maxHours = 60;

const statusSplit = [
  { label: "Pending", value: 3, color: "#d97706", textClass: "text-amber-700" },
  { label: "Approved", value: 1, color: "#16a34a", textClass: "text-green-600" },
  { label: "Rejected", value: 1, color: "#dc2626", textClass: "text-red-600" },
];

const projectDistribution = [
  { project: "Project Gamma", hours: 88 },
  { project: "Project Alpha", hours: 48 },
  { project: "Project Delta", hours: 35 },
  { project: "Project Beta", hours: 30 },
  { project: "Client Support", hours: 7 },
  { project: "Internal - Meetings", hours: 5 },
  { project: "Internal - Training", hours: 2 },
];

const teamPerformance = [
  { employee: "Jessica Taylor", totalHours: 55, timesheets: "1 submitted", status: "Pending" },
  { employee: "Michael Johnson", totalHours: 42, timesheets: "1 submitted", status: "Pending" },
  { employee: "Sarah Chen", totalHours: 40, timesheets: "1 submitted", status: "Pending" },
  { employee: "David Park", totalHours: 40, timesheets: "1 submitted", status: "Approved" },
  { employee: "Emily Rodriguez", totalHours: 38, timesheets: "1 submitted", status: "Rejected" },
];

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
  const totalMembers = utilization.length;
  const totalHours = utilization.reduce((sum, item) => sum + item.hours, 0);
  const pendingApprovals = statusSplit.find((item) => item.label === "Pending")?.value ?? 0;
  const avgHours = totalMembers ? (totalHours / totalMembers).toFixed(1) : "0";

  return (
    <DashboardFrame activeTab="reports">
      <div className="space-y-5">
        <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
          <StatCard title="Team Members" value={`${totalMembers}`} tone="blue" icon={<TeamMembersIcon />} />
          <StatCard title="Total Hours" value={`${totalHours}`} tone="green" icon={<ClockIcon />} />
          <StatCard title="Pending Approvals" value={`${pendingApprovals}`} tone="amber" icon={<TrendIcon />} />
          <StatCard title="Avg Hours/Week" value={`${avgHours}`} tone="violet" icon={<CheckIcon />} />
        </div>

        <TeamReportsCharts
          utilizationData={utilization}
          statusData={statusSplit}
          maxHours={maxHours}
          projectDistributionData={projectDistribution}
          teamPerformanceData={teamPerformance}
        />
      </div>
    </DashboardFrame>
  );
}
