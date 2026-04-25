const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api";
const EMPTY_SESSION = Object.freeze({
  token: "",
  role: "",
  userName: "",
});
const AUTH_SESSION_EVENT = "auth-session-updated";

let cachedSessionKey = "";
let cachedSession = EMPTY_SESSION;

export const ROLE_DASHBOARD_MAP = {
  employee: "/dashboard/employee",
  manager: "/dashboard/manager",
  finance: "/dashboard/finance",
  admin: "/dashboard/admin/overview",
  tenant: "/dashboard",
};

export function getApiBaseUrl() {
  return API_BASE_URL.replace(/\/$/, "");
}

export async function loginWithCredentials({ username, password }) {
  let response;
  try {
    response = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    throw new Error(
      `Cannot reach the backend at ${getApiBaseUrl()}. Start the Django server and verify NEXT_PUBLIC_API_BASE_URL if needed.`
    );
  }

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
  cachedSession = {
    token: access,
    role: user.role,
    userName: user.username || "",
  };
  cachedSessionKey = `${cachedSession.token}|${cachedSession.role}|${cachedSession.userName}`;
  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

export function clearSession() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("isAuthenticated");
  cachedSession = EMPTY_SESSION;
  cachedSessionKey = "";
  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

function readSessionFromStorage() {
  if (typeof window === "undefined") {
    return EMPTY_SESSION;
  }

  return {
    token: localStorage.getItem("accessToken"),
    role: localStorage.getItem("userRole"),
    userName: localStorage.getItem("userName"),
  };
}

export function getSession() {
  return readSessionFromStorage();
}

export function getSessionSnapshot() {
  const nextSession = readSessionFromStorage();
  const nextKey = `${nextSession.token || ""}|${nextSession.role || ""}|${nextSession.userName || ""}`;

  if (nextKey === cachedSessionKey) {
    return cachedSession;
  }

  cachedSession = nextSession;
  cachedSessionKey = nextKey;
  return nextSession;
}

export function getRoleHome(role) {
  return ROLE_DASHBOARD_MAP[role] || "/dashboard";
}
