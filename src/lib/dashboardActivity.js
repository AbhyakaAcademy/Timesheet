import { getApiBaseUrl, getSession } from "@/lib/auth";

function canUseWindow() {
  return typeof window !== "undefined";
}

function getDashboardFromPath(pathname = "") {
  if (pathname.startsWith("/dashboard/admin")) return "admin";
  if (pathname.startsWith("/dashboard/manager")) return "manager";
  if (pathname.startsWith("/dashboard/employee")) return "employee";
  if (pathname.startsWith("/dashboard/finance")) return "finance";
  if (pathname.startsWith("/dashboard/tenant")) return "tenant";
  if (pathname === "/dashboard") return "tenant";
  return "general";
}

export function isDashboardPath(pathname = "") {
  return pathname.startsWith("/dashboard");
}

export function buildDashboardActivityPayload(payload = {}) {
  const pathname = canUseWindow() ? window.location.pathname : payload.path || "";
  return {
    dashboard: payload.dashboard || getDashboardFromPath(pathname),
    path: payload.path || pathname,
    event_type: payload.event_type || "activity",
    severity: payload.severity || "info",
    summary: payload.summary || "Dashboard activity",
    details: payload.details || "",
    duration_ms: payload.duration_ms,
    metadata: payload.metadata || {},
  };
}

export async function reportDashboardActivity(payload = {}) {
  if (!canUseWindow()) return;

  const pathname = window.location.pathname;
  if (!isDashboardPath(pathname)) return;

  const { token } = getSession();
  if (!token) return;

  const body = JSON.stringify(buildDashboardActivityPayload(payload));

  try {
    await fetch(`${getApiBaseUrl()}/dashboard/activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body,
      keepalive: true,
    });
  } catch {
    // Activity reporting should never interrupt the main UI flow.
  }
}

export function summarizeDashboardPath(pathname = "") {
  const dashboard = getDashboardFromPath(pathname);
  return dashboard.charAt(0).toUpperCase() + dashboard.slice(1);
}
