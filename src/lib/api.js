import { clearSession, getApiBaseUrl, getSession } from "@/lib/auth";
import { reportDashboardActivity } from "@/lib/dashboardActivity";

export async function apiFetch(path, options = {}) {
  const { token } = getSession();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const startedAt = Date.now();
  let response;

  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...options,
      headers,
    });
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
  const { token } = getSession();
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
  });

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
        duration_ms: duration,
        metadata: { apiPath: path, method: options.method || "GET", status: response.status },
      });
    }

    throw new Error(message);
  }

  return response.blob();
}
