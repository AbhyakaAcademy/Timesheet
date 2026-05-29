import { clearSession, getApiBaseUrl, getSession, refreshSessionToken } from "@/lib/auth";
import { reportDashboardActivity } from "@/lib/dashboardActivity";

async function performFetch(path, options = {}, tokenOverride) {
  const { token } = getSession();
  const accessToken = tokenOverride ?? token;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
  });
}

async function maybeRefreshAndRetry(path, options, response) {
  const hasSessionToken = Boolean(getSession().token);
  if (response.status !== 401 || !hasSessionToken) {
    return response;
  }

  try {
    const refreshedToken = await refreshSessionToken();
    return performFetch(path, options, refreshedToken);
  } catch {
    return response;
  }
}

export async function apiFetch(path, options = {}) {
  const startedAt = Date.now();
  let response;

  try {
    response = await performFetch(path, options);
    response = await maybeRefreshAndRetry(path, options, response);
  } catch (error) {
    const duration = Date.now() - startedAt;
    if (!String(path).includes("/dashboard/activity")) {
      reportDashboardActivity({
        event_type: "request_error",
        severity: "high",
        summary: `Dashboard API request failed for ${path}`,
        details: error?.message || "Network request failed.",
        duration_ms: duration,
        metadata: { apiPath: path, method: options.method || "GET" },
      });
    }
    throw error;
  }

  const duration = Date.now() - startedAt;
  if (!String(path).includes("/dashboard/activity") && duration >= 10000) {
    reportDashboardActivity({
      event_type: "slow_request",
      severity: "high",
      summary: `Slow dashboard API request on ${path}`,
      details: `Request took ${duration}ms.`,
      duration_ms: duration,
      metadata: { apiPath: path, method: options.method || "GET", status: response.status },
    });
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.error?.message || data?.detail || "Request failed.";
    const isInvalidToken =
      response.status === 401 &&
      typeof message === "string" &&
      message.toLowerCase().includes("token");

    if (isInvalidToken) {
      clearSession();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    throw new Error(message);
  }

  return data;
}

export async function apiFetchBlob(path, options = {}) {
  const startedAt = Date.now();
  let response = await performFetch(path, options);
  response = await maybeRefreshAndRetry(path, options, response);

  if (!response.ok) {
    let message = "Request failed.";
    try {
      const data = await response.json();
      message = data?.error?.message || data?.detail || message;
    } catch {
      // Keep the generic message for non-JSON errors.
    }
    if (!String(path).includes("/dashboard/activity")) {
      reportDashboardActivity({
        event_type: "request_error",
        severity: response.status >= 500 ? "critical" : "medium",
        summary: `Dashboard API error on ${path}`,
        details: message,
        duration_ms: Date.now() - startedAt,
        metadata: { apiPath: path, method: options.method || "GET", status: response.status },
      });
    }

    const isInvalidToken =
      response.status === 401 &&
      typeof message === "string" &&
      message.toLowerCase().includes("token");

    if (isInvalidToken) {
      clearSession();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    throw new Error(message);
  }

  return response.blob();
}
