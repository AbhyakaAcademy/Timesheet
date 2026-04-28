import { apiFetch } from "@/lib/api";

export const tenantApi = {
  overview: () => apiFetch("/tenant/overview"),
  users: () => apiFetch("/tenant/users"),
  createUser: (payload) => apiFetch("/tenant/users", { method: "POST", body: JSON.stringify(payload) }),
  updateUser: (id, payload) => apiFetch(`/tenant/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteUser: (id) => apiFetch(`/tenant/users/${id}`, { method: "DELETE" }),
  departments: () => apiFetch("/tenant/departments"),
  createDepartment: (payload) => apiFetch("/tenant/departments", { method: "POST", body: JSON.stringify(payload) }),
  updateDepartment: (id, payload) => apiFetch(`/tenant/departments/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteDepartment: (id) => apiFetch(`/tenant/departments/${id}`, { method: "DELETE" }),
  policies: () => apiFetch("/tenant/policies"),
  createPolicy: (payload) => apiFetch("/tenant/policies", { method: "POST", body: JSON.stringify(payload) }),
  updatePolicy: (id, payload) => apiFetch(`/tenant/policies/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deletePolicy: (id) => apiFetch(`/tenant/policies/${id}`, { method: "DELETE" }),
  billingRates: () => apiFetch("/tenant/billing-rates"),
  createBillingRate: (payload) => apiFetch("/tenant/billing-rates", { method: "POST", body: JSON.stringify(payload) }),
  updateBillingRate: (id, payload) => apiFetch(`/tenant/billing-rates/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteBillingRate: (id) => apiFetch(`/tenant/billing-rates/${id}`, { method: "DELETE" }),
  overtimeRules: () => apiFetch("/tenant/overtime-rules"),
  createOvertimeRule: (payload) => apiFetch("/tenant/overtime-rules", { method: "POST", body: JSON.stringify(payload) }),
  updateOvertimeRule: (id, payload) => apiFetch(`/tenant/overtime-rules/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteOvertimeRule: (id) => apiFetch(`/tenant/overtime-rules/${id}`, { method: "DELETE" }),
  subscription: () => apiFetch("/tenant/subscription"),
  updateSubscription: (payload) => apiFetch("/tenant/subscription", { method: "PATCH", body: JSON.stringify(payload) }),
  settings: () => apiFetch("/tenant/settings"),
  updateSettings: (payload) => apiFetch("/tenant/settings", { method: "PATCH", body: JSON.stringify(payload) }),
  auditLogs: () => apiFetch("/tenant/audit-logs"),
};

export const adminApi = {
  overview: () => apiFetch("/admin/overview"),
  clients: () => apiFetch("/admin/clients"),
  createClient: (payload) => apiFetch("/admin/clients", { method: "POST", body: JSON.stringify(payload) }),
  updateClient: (id, payload) => apiFetch(`/admin/clients/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteClient: (id) => apiFetch(`/admin/clients/${id}`, { method: "DELETE" }),
  users: () => apiFetch("/admin/users"),
  createUser: (payload) => apiFetch("/admin/users", { method: "POST", body: JSON.stringify(payload) }),
  updateUser: (id, payload) => apiFetch(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteUser: (id) => apiFetch(`/admin/users/${id}`, { method: "DELETE" }),
  subscriptions: () => apiFetch("/admin/subscriptions"),
  updateSubscription: (payload) => apiFetch("/admin/subscriptions", { method: "PATCH", body: JSON.stringify(payload) }),
  revenue: () => apiFetch("/admin/revenue"),
  systemHealth: () => apiFetch("/admin/system-health"),
  dashboardActivity: () => apiFetch("/admin/dashboard-activity"),
  settings: () => apiFetch("/admin/settings"),
  updateSettings: (payload) => apiFetch("/admin/settings", { method: "PATCH", body: JSON.stringify(payload) }),
  invoices: () => apiFetch("/finance/invoices"),
};

export function formatCurrency(value, currency = "INR") {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
