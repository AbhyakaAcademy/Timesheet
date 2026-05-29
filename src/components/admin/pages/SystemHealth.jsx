import { Activity, AlertTriangle, Database, Server, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminTenantApi";

const healthStatusStyles = {
  healthy: {
    dot: "bg-emerald-500",
    iconBg: "bg-emerald-50",
  },
  warning: {
    dot: "bg-amber-500",
    iconBg: "bg-amber-50",
  },
  danger: {
    dot: "bg-rose-500",
    iconBg: "bg-rose-50",
  },
  neutral: {
    dot: "bg-slate-400",
    iconBg: "bg-slate-100",
  },
};

function getCardStatusTone(title, value) {
  const normalizedValue = String(value ?? "").toLowerCase();

  if (title === "API Status" || title === "Database") {
    if (normalizedValue.includes("healthy") || normalizedValue.includes("online") || normalizedValue.includes("operational")) {
      return "healthy";
    }
    if (normalizedValue.includes("degraded") || normalizedValue.includes("slow")) {
      return "warning";
    }
    if (normalizedValue.includes("down") || normalizedValue.includes("offline") || normalizedValue.includes("error")) {
      return "danger";
    }
    return "neutral";
  }

  return "healthy";
}

function SectionCard({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-5">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function HealthMetricCard({ title, value, icon: Icon, color }) {
  const tone = healthStatusStyles[getCardStatusTone(title, value)] || healthStatusStyles.neutral;
  const compactValue = typeof value === "string" && value.length > 10;

  return (
    <article className="flex h-full flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone.iconBg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${tone.dot}`} aria-hidden="true" />
      </div>
      <div className="mt-8">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className={`mt-2 font-semibold tracking-tight text-gray-900 ${compactValue ? "text-lg" : "text-2xl"}`}>
          {value}
        </p>
      </div>
    </article>
  );
}

function EventRow({ title, detail, meta, severity }) {
  const severityTone =
    severity === "critical"
      ? "bg-rose-50 text-rose-700"
      : severity === "high"
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-600";

  return (
    <article className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="mt-1 text-sm leading-6 text-gray-600">{detail}</p>
        </div>
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${severityTone}`}>
          {severity || "info"}
        </span>
      </div>
      <p className="mt-3 text-xs text-gray-500">{meta}</p>
    </article>
  );
}

export function SystemHealth() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    adminApi.systemHealth().then(setHealth).catch(() => setHealth(null));
  }, []);

  const cards = [
    { title: "API Status", value: health?.api || "Unknown", icon: Activity, color: "text-emerald-600" },
    { title: "Organizations", value: health?.organizations ?? "-", icon: Server, color: "text-blue-600" },
    { title: "Database", value: health?.database || "Unknown", icon: Database, color: "text-violet-600" },
    { title: "Users", value: health?.users ?? "-", icon: AlertTriangle, color: "text-rose-600" },
    { title: "Active Subs", value: health?.activeSubscriptions ?? "-", icon: Zap, color: "text-emerald-600" },
    { title: "Issues 24h", value: health?.issuesLast24h ?? "-", icon: AlertTriangle, color: "text-amber-600" },
    { title: "Slow Req 24h", value: health?.slowRequestsLast24h ?? "-", icon: Activity, color: "text-orange-600" },
    { title: "Client Errors 24h", value: health?.clientErrorsLast24h ?? "-", icon: AlertTriangle, color: "text-rose-600" },
  ];

  const fallbackIssues = [
    {
      id: "fallback-api",
      title: "API health status",
      detail: `API is currently reporting as ${health?.api || "unknown"}.`,
      meta: "Platform overview",
      severity: "info",
    },
    {
      id: "fallback-db",
      title: "Database connectivity",
      detail: `Database connectivity is ${health?.database || "unknown"}.`,
      meta: "Infrastructure overview",
      severity: "info",
    },
    {
      id: "fallback-scale",
      title: "Tracked platform footprint",
      detail: `${health?.organizations ?? 0} organizations and ${health?.users ?? 0} users are currently tracked.`,
      meta: "Usage overview",
      severity: "info",
    },
  ];

  const recentIssues =
    health?.recentIssues?.length > 0
      ? health.recentIssues.map((issue) => ({
          id: issue.id,
          title: issue.summary,
          detail: issue.details || "No extra details provided.",
          meta: [issue.clientName, issue.dashboard, issue.actorName || issue.actorRole || "user", issue.timestamp]
            .filter(Boolean)
            .join(" | "),
          severity: issue.severity,
        }))
      : fallbackIssues;

  const recentActivity =
    health?.recentActivity?.length > 0
      ? health.recentActivity.map((entry) => ({
          id: entry.id,
          title: entry.summary,
          detail: entry.details || "No additional activity details provided.",
          meta: [entry.clientName, entry.dashboard, entry.actorName || entry.actorRole || "user", entry.timestamp]
            .filter(Boolean)
            .join(" | "),
          severity: entry.event_type,
        }))
      : [];

  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">System Health</h1>
        <p className="mt-2 text-base leading-7 text-gray-600">
          Monitor platform infrastructure, reliability signals, and the latest operational events in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <HealthMetricCard key={card.title} {...card} />
        ))}
      </div>

      <SectionCard
        title="Recent Issues"
        subtitle="Latest slow requests, client-side errors, and dashboard warnings."
      >
        <div className="space-y-4">
          {recentIssues.map((issue) => (
            <EventRow
              key={issue.id}
              title={issue.title}
              detail={issue.detail}
              meta={issue.meta}
              severity={issue.severity}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Recent Dashboard Activity"
        subtitle="Cross-dashboard activity reported from admin, client, manager, employee, and finance views."
      >
        {recentActivity.length > 0 ? (
          <div className="space-y-4">
            {recentActivity.map((entry) => (
              <EventRow
                key={entry.id}
                title={entry.title}
                detail={entry.detail}
                meta={entry.meta}
                severity={entry.severity}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
            No dashboard activity has been reported yet.
          </div>
        )}
      </SectionCard>
    </div>
  );
}
