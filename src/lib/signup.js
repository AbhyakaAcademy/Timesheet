import { getApiBaseUrl } from "@/lib/auth";

export async function requestTenantSignup(payload) {
  const response = await fetch(`${getApiBaseUrl()}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data?.detail || "Unable to start signup.");
  }

  return data;
}

export async function verifyTenantEmail(token) {
  const response = await fetch(`${getApiBaseUrl()}/auth/verify-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data?.detail || "Unable to verify email.");
  }

  return data;
}
