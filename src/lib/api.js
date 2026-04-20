import { clearSession, getApiBaseUrl, getSession } from "@/lib/auth";

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

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
  });

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
    throw new Error(message);
  }

  return response.blob();
}
