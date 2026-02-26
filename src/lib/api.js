import { getApiBaseUrl, getSession } from "@/lib/auth";

export async function apiFetch(path, options = {}) {
  const { token } = getSession();
  const headers = {
    "Content-Type": "application/json",
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
    throw new Error(message);
  }

  return data;
}
