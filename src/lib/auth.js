const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api";

export const ROLE_DASHBOARD_MAP = {
  employee: "/dashboard/employee",
  manager: "/dashboard/manager",
  finance: "/dashboard/finance",
  admin: "/dashboard",
  tenant: "/dashboard/tenant",
};

export function getApiBaseUrl() {
  return API_BASE_URL.replace(/\/$/, "");
}

export async function loginWithCredentials({ username, password }) {
  const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const message =
      data?.error?.message || data?.detail || "Login failed. Check username/password.";
    throw new Error(message);
  }

  return data;
}

export function persistSession(payload) {
  const { access, refresh, user } = payload || {};
  if (!access || !user?.role) {
    throw new Error("Invalid login response.");
  }

  localStorage.setItem("accessToken", access);
  localStorage.setItem("refreshToken", refresh || "");
  localStorage.setItem("userRole", user.role);
  localStorage.setItem("userName", user.username || "");
  localStorage.setItem("userEmail", user.email || "");
  localStorage.setItem("isAuthenticated", "true");
}

export function clearSession() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("isAuthenticated");
}

export function getSession() {
  return {
    token: localStorage.getItem("accessToken"),
    role: localStorage.getItem("userRole"),
    userName: localStorage.getItem("userName"),
  };
}

export function getRoleHome(role) {
  return ROLE_DASHBOARD_MAP[role] || "/dashboard";
}
