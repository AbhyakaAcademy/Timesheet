"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Clock, Download, LogOut, Pencil, Settings, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import RouteGuard from "@/components/auth/RouteGuard";
import { clearSession } from "@/lib/auth";
import { tenantApi } from "@/lib/adminTenantApi";

const navItems = [
  "Dashboard",
  "Users",
  "Departments",
  "Policies",
  "Billing & Subscription",
  "Audit Logs",
];

const initialUsers = [
  { id: 1, name: "Sarah Johnson", email: "sarah.johnson@company.com", role: "Admin", status: "Active", department: "Engineering" },
  { id: 2, name: "Michael Chen", email: "michael.chen@company.com", role: "Manager", status: "Active", department: "Sales" },
  { id: 3, name: "Emily Davis", email: "emily.davis@company.com", role: "Employee", status: "Active", department: "Marketing" },
  { id: 4, name: "Robert Wilson", email: "robert.wilson@company.com", role: "Employee", status: "Active", department: "Engineering" },
  { id: 5, name: "Jennifer Lee", email: "jennifer.lee@company.com", role: "Manager", status: "Inactive", department: "HR" },
  { id: 6, name: "David Martinez", email: "david.martinez@company.com", role: "Employee", status: "Active", department: "Finance" },
  { id: 7, name: "Lisa Anderson", email: "lisa.anderson@company.com", role: "Employee", status: "Active", department: "Operations" },
  { id: 8, name: "James Taylor", email: "james.taylor@company.com", role: "Admin", status: "Active", department: "IT" },
];

const initialDepartments = [
  { id: 1, name: "Engineering", head: "Sarah Johnson", employees: "24 members", created: "Created Jan 2024" },
  { id: 2, name: "Sales", head: "Michael Chen", employees: "18 members", created: "Created Feb 2024" },
  { id: 3, name: "Marketing", head: "Emily Davis", employees: "12 members", created: "Created Mar 2024" },
  { id: 4, name: "Finance", head: "David Martinez", employees: "8 members", created: "Created Apr 2024" },
];

const initialPolicies = [
  {
    id: 1,
    title: "Working Hours Policy",
    description: "Defines standard working hours, break times, and flexible work arrangements",
    details: "Standard work is 9:00 AM to 6:00 PM with a one-hour lunch break. Flexible start times are allowed with manager approval.",
    appliesTo: "All departments",
    updated: "Jan 15, 2026",
    enabled: true,
  },
  {
    id: 2,
    title: "Approval Workflow Rules",
    description: "Multi-level approval process for timesheets, time-off requests, and overtime",
    details: "Employee submissions go to the reporting manager first. Overtime and exceptions require second-level approval from department heads.",
    appliesTo: "Managers & above",
    updated: "Dec 20, 2025",
    enabled: true,
  },
  {
    id: 3,
    title: "Access Control Policy",
    description: "Role-based access permissions for system features and data visibility",
    details: "Employees can access their own records, managers can review their teams, and admins can configure organization-wide settings.",
    appliesTo: "All users",
    updated: "Jan 1, 2026",
    enabled: true,
  },
  {
    id: 4,
    title: "Time-off Policy",
    description: "Leave accrual, request, and approval policies for different leave types",
    details: "Leave requests must be submitted before planned absence. Emergency leave can be regularized after manager review.",
    appliesTo: "All employees",
    updated: "Nov 30, 2025",
    enabled: true,
  },
];

const invoices = [
  { number: "INV-2026-02", date: "Feb 1, 2026", plan: "Enterprise", amount: "INR 1,87,500" },
  { number: "INV-2026-01", date: "Jan 1, 2026", plan: "Enterprise", amount: "INR 1,87,500" },
];

const subscriptionRegionMeta = {
  IN: { label: "India", symbol: "INR ", code: "INR", locale: "en-IN", multiplier: 1 },
  US: { label: "United States", symbol: "$", code: "USD", locale: "en-US", multiplier: 0.012 },
  UK: { label: "United Kingdom", symbol: "GBP ", code: "GBP", locale: "en-GB", multiplier: 0.0095 },
};

const subscriptionPlans = [
  {
    key: "starter",
    name: "Starter",
    monthlyMin: 149,
    monthlyMax: 249,
    annualMin: 1520,
    annualMax: 2540,
    seats: "Up to 25 users",
    usage: "42 / 100 licenses used (42%)",
    available: "58 licenses available",
    support: "Email support",
    description: "Small teams",
    features: ["Time capture", "Projects", "Manager approvals", "Basic reports", "CSV export"],
  },
  {
    key: "professional",
    name: "Professional",
    monthlyMin: 349,
    monthlyMax: 599,
    annualMin: 3560,
    annualMax: 6110,
    seats: "Up to 100 users",
    usage: "96 / 250 licenses used (38%)",
    available: "154 licenses available",
    support: "Priority support",
    description: "For growing organizations",
    features: ["Up to 100 users", "Advanced analytics", "Custom workflows", "Priority support", "API access", "Single Sign-On"],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    custom: true,
    seats: "Unlimited users",
    usage: "156 / 500 licenses used (31%)",
    available: "344 licenses available",
    support: "Dedicated support",
    description: "For large enterprises",
    features: ["Unlimited users", "White-label options", "Dedicated support", "Custom integrations", "SLA guarantee", "Advanced security"],
  },
];

const settingTabs = ["General Settings", "Billing Rates", "Overtime Rules", "Branding"];

const initialBillingRates = [
  { id: 1, role: "Software Engineer", project: "All Projects", rate: "INR 2,500/hour", type: "Hourly" },
  { id: 2, role: "Senior Software Engineer", project: "All Projects", rate: "INR 3,500/hour", type: "Hourly" },
  { id: 3, role: "Project Manager", project: "All Projects", rate: "INR 4,000/hour", type: "Hourly" },
  { id: 4, role: "Designer", project: "Project Alpha", rate: "INR 2,000/hour", type: "Hourly" },
  { id: 5, role: "QA Engineer", project: "All Projects", rate: "INR 1,800/hour", type: "Hourly" },
  { id: 6, role: "DevOps Engineer", project: "Infrastructure", rate: "INR 3,200/hour", type: "Hourly" },
];

const initialOvertimeRules = [
  { id: 1, name: "Standard Overtime", threshold: "After 40 hours", multiplier: "1.5x", appliesTo: "Hourly Staff", active: true },
  { id: 2, name: "Weekend Overtime", threshold: "Any hours", multiplier: "2.0x", appliesTo: "All Employees", active: true },
  { id: 3, name: "Holiday Overtime", threshold: "Any hours", multiplier: "2.5x", appliesTo: "All Employees", active: true },
];

const defaultSettings = {
  tenantName: "Acme Corporation",
  timeZone: "India Standard Time (IST) - UTC +5:30",
  currency: "Indian Rupee (INR)",
  weekStart: "Monday",
  payPeriod: "Monthly",
  rounding: "15 minutes",
  maxHours: "12 hours",
  dateFormat: "DD-MM-YYYY (Indian format)",
};

const fallbackAuditLog = {
  timestamp: "Feb 5, 2026 10:42 AM",
  user: "Sarah Johnson",
  email: "sarah.johnson@company.com",
  action: "Created user account",
  resource: "john.doe@company.com",
  details: "New user John Doe was added to the Engineering department with Employee role.",
};

const defaultProfile = {
  name: "Tenant Profile",
  email: "admin@abhyaka.com",
  role: "Tenant Admin",
  phone: "",
};

const TENANT_NOTIFICATIONS_STORAGE_KEY = "tenantDashboardNotifications";

const defaultTenantNotifications = [
  { id: 1, title: "Subscription", message: "Enterprise plan renews on Mar 1, 2026.", read: false },
  { id: 2, title: "Policy", message: "Working Hours Policy was updated recently.", read: false },
];

function titleCase(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function normalizeRole(value) {
  return String(value || "employee").toLowerCase();
}

function displayRole(value) {
  return titleCase(String(value || "employee"));
}

function formatBillingRateValue(value) {
  const numberValue = Number(value || 0);
  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return "INR 0/hour";
  }
  return `INR ${numberValue.toLocaleString("en-IN")}/hour`;
}

function extractRateNumber(value) {
  const cleaned = String(value || "").replace(/[^\d.]/g, "");
  return cleaned || "0";
}

function normalizeUser(user) {
  return {
    id: user.id,
    name: user.name || user.username || "",
    email: user.email || "",
    role: displayRole(user.role),
    status: user.status || (user.is_active ? "Active" : "Inactive"),
    department: user.department || "General",
  };
}

function normalizeDepartment(department) {
  return {
    id: department.id,
    name: department.name || "",
    head: department.head_name || department.headName || department.head || "",
    employees: department.employees || department.totalEmployees || "0 members",
    status: department.status || "Active",
    created: department.created || "Created Apr 2026",
  };
}

function normalizePolicy(policy) {
  const detailText = Array.isArray(policy.details) ? policy.details.join(" ") : policy.details;
  return {
    id: policy.id,
    title: policy.title || policy.name || "",
    description: policy.description || policy.desc || "",
    details: detailText || policy.description || policy.desc || "",
    appliesTo: policy.applies_to || policy.appliesTo || policy.applies || "All users",
    updated: policy.lastUpdated || policy.updated || "Apr 18, 2026",
    enabled: policy.enabled !== false,
  };
}

function normalizeBillingRate(rate) {
  return {
    id: rate.id,
    role: rate.role || "",
    project: rate.project || rate.project_name || "All Projects",
    rate: formatBillingRateValue(rate.hourly_rate || extractRateNumber(rate.rate)),
    type: rate.type || rate.rate_type || "Hourly",
  };
}

function normalizeOvertimeRule(rule) {
  return {
    id: rule.id,
    name: rule.name || rule.title || "",
    threshold: rule.threshold || "",
    multiplier: rule.multiplier || "",
    appliesTo: rule.appliesTo || rule.applies_to || "All Employees",
    active: rule.active !== false,
  };
}

function normalizeSettings(payload) {
  const organization = payload?.organization || payload || {};
  return {
    tenantName: organization.tenantName || organization.name || defaultSettings.tenantName,
    timeZone: organization.timeZone || organization.timezone || defaultSettings.timeZone,
    currency: organization.currency || defaultSettings.currency,
    weekStart: organization.weekStart || organization.week_start || defaultSettings.weekStart,
    payPeriod: organization.payPeriod || organization.pay_period || defaultSettings.payPeriod,
    rounding: organization.rounding || defaultSettings.rounding,
    maxHours: organization.maxHours || `${organization.max_hours || 12} hours`,
    dateFormat: organization.dateFormat || organization.date_format || defaultSettings.dateFormat,
  };
}

function normalizeSubscription(subscription) {
  const currentPlanName = subscription?.currentPlan || subscription?.plan_name || "Enterprise";
  const matchedPlan =
    subscriptionPlans.find((plan) => plan.name.toLowerCase() === String(currentPlanName).toLowerCase()) ||
    subscriptionPlans[2];
  const billingCycle = subscription?.billingCycle || subscription?.billing_cycle || "Annual";

  return {
    plan: matchedPlan,
    billing: String(billingCycle).toLowerCase().startsWith("month") ? "monthly" : "annual",
  };
}

function normalizeProfile(profile) {
  return {
    name: profile?.name || defaultProfile.name,
    email: profile?.email || defaultProfile.email,
    role: profile?.role || defaultProfile.role,
    phone: profile?.phone || defaultProfile.phone,
  };
}

function normalizeTenantNotification(notification) {
  return {
    id: notification.id,
    title: notification.title || "",
    message: notification.message || "",
    read: Boolean(notification.read),
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [active, setActive] = useState("Users");
  const [settingsTab, setSettingsTab] = useState("General Settings");
  const [users, setUsers] = useState(initialUsers);
  const [departments, setDepartments] = useState(initialDepartments);
  const [policies, setPolicies] = useState(initialPolicies);
  const [billingRates, setBillingRates] = useState(initialBillingRates);
  const [overtimeRules, setOvertimeRules] = useState(initialOvertimeRules);
  const [subscriptionPlan, setSubscriptionPlan] = useState(subscriptionPlans[2]);
  const [subscriptionRegion, setSubscriptionRegion] = useState("IN");
  const [subscriptionBilling, setSubscriptionBilling] = useState("annual");
  const [settings, setSettings] = useState(defaultSettings);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null);
  const [overview, setOverview] = useState(null);
  const [profile, setProfile] = useState(defaultProfile);
  const [auditLogs, setAuditLogs] = useState([fallbackAuditLog]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(defaultTenantNotifications);
  const notificationsReadyRef = useRef(false);

  const showToast = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  }, []);

  useEffect(() => {
    try {
      const storedNotifications = window.localStorage.getItem(TENANT_NOTIFICATIONS_STORAGE_KEY);
      if (storedNotifications) {
        const parsed = JSON.parse(storedNotifications);
        if (Array.isArray(parsed)) {
          setNotifications(parsed.map(normalizeTenantNotification));
        }
      } else {
        window.localStorage.setItem(TENANT_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(defaultTenantNotifications));
      }
    } catch {
      // Keep the built-in notifications if localStorage is unavailable or malformed.
    } finally {
      notificationsReadyRef.current = true;
    }

    let isMounted = true;

    async function loadTenantData() {
      setLoading(true);
      try {
        const [
          overviewData,
          usersData,
          departmentsData,
          policiesData,
          billingRatesData,
          overtimeRulesData,
          subscriptionData,
          settingsData,
          auditLogsData,
        ] = await Promise.all([
          tenantApi.overview(),
          tenantApi.users(),
          tenantApi.departments(),
          tenantApi.policies(),
          tenantApi.billingRates(),
          tenantApi.overtimeRules(),
          tenantApi.subscription(),
          tenantApi.settings(),
          tenantApi.auditLogs(),
        ]);

        if (!isMounted) return;

        const normalizedSubscription = normalizeSubscription(subscriptionData);
        setOverview(overviewData);
        setUsers((usersData || []).map(normalizeUser));
        setDepartments((departmentsData || []).map(normalizeDepartment));
        setPolicies((policiesData || []).map(normalizePolicy));
        setBillingRates((billingRatesData || []).map(normalizeBillingRate));
        setOvertimeRules((overtimeRulesData || []).map(normalizeOvertimeRule));
        setSubscriptionPlan(normalizedSubscription.plan);
        setSubscriptionBilling(normalizedSubscription.billing);
        setSettings(normalizeSettings(settingsData));
        setProfile(normalizeProfile(settingsData?.adminProfile || overviewData?.adminProfile));
        setAuditLogs(auditLogsData?.length ? auditLogsData : [fallbackAuditLog]);
      } catch (error) {
        if (isMounted) {
          showToast(error.message || "Tenant data could not load");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTenantData();
    return () => {
      isMounted = false;
    };
  }, [showToast]);

  useEffect(() => {
    if (!notificationsReadyRef.current) return;

    try {
      window.localStorage.setItem(TENANT_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // Ignore storage write failures so the dashboard still works normally.
    }
  }, [notifications]);

  const markAllNotificationsRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  };

  const saveUser = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      role: normalizeRole(formData.get("role")),
      status: formData.get("status"),
      department: formData.get("department"),
    };

    try {
      const savedUser = modal.item
        ? await tenantApi.updateUser(modal.item.id, payload)
        : await tenantApi.createUser(payload);
      const nextUser = normalizeUser(savedUser);
      setUsers((current) =>
        modal.item ? current.map((user) => (user.id === modal.item.id ? nextUser : user)) : [nextUser, ...current]
      );
      setModal(null);
      showToast(modal.item ? "User updated" : "User added");
    } catch (error) {
      showToast(error.message || "User could not be saved");
    }
  };

  const toggleUserStatus = async (targetUser) => {
    const nextStatus = targetUser.status === "Active" ? "Inactive" : "Active";
    try {
      const savedUser = await tenantApi.updateUser(targetUser.id, { status: nextStatus });
      const nextUser = normalizeUser(savedUser);
      setUsers((current) => current.map((user) => (user.id === targetUser.id ? nextUser : user)));
      showToast(`${targetUser.name} status updated`);
    } catch (error) {
      showToast(error.message || "User status could not be updated");
    }
  };

  const saveDepartment = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      head: formData.get("head"),
      status: modal.item?.status || "Active",
    };

    try {
      const savedDepartment = modal.item
        ? await tenantApi.updateDepartment(modal.item.id, payload)
        : await tenantApi.createDepartment(payload);
      const nextDepartment = normalizeDepartment(savedDepartment);
      setDepartments((current) =>
        modal.item
          ? current.map((department) => (department.id === modal.item.id ? nextDepartment : department))
          : [...current, nextDepartment]
      );
      setModal(null);
      showToast(modal.item ? "Department updated" : "Department created");
    } catch (error) {
      showToast(error.message || "Department could not be saved");
    }
  };

  const deleteDepartment = async (department) => {
    try {
      await tenantApi.deleteDepartment(department.id);
      setDepartments((current) => current.filter((item) => item.id !== department.id));
      showToast(`${department.name} removed`);
    } catch (error) {
      showToast(error.message || "Department could not be removed");
    }
  };

  const togglePolicy = async (policy) => {
    try {
      const savedPolicy = await tenantApi.updatePolicy(policy.id, { enabled: !policy.enabled });
      const nextPolicy = normalizePolicy(savedPolicy);
      setPolicies((current) => current.map((item) => (item.id === policy.id ? nextPolicy : item)));
      showToast(`${policy.title} ${policy.enabled ? "disabled" : "enabled"}`);
    } catch (error) {
      showToast(error.message || "Policy status could not be updated");
    }
  };

  const savePolicy = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const description = formData.get("description");
    const payload = {
      title: formData.get("title"),
      description,
      details: [description],
      applies_to: formData.get("appliesTo"),
      enabled: true,
    };

    try {
      const savedPolicy = await tenantApi.createPolicy(payload);
      setPolicies((current) => [...current, normalizePolicy(savedPolicy)]);
      setModal(null);
      showToast("Policy added");
    } catch (error) {
      showToast(error.message || "Policy could not be added");
    }
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextSettings = {
      tenantName: formData.get("tenantName"),
      timeZone: formData.get("timeZone"),
      currency: formData.get("currency"),
      weekStart: formData.get("weekStart"),
      payPeriod: formData.get("payPeriod"),
      rounding: formData.get("rounding"),
      maxHours: formData.get("maxHours"),
      dateFormat: formData.get("dateFormat"),
    };
    try {
      const savedSettings = await tenantApi.updateSettings(nextSettings);
      setSettings(normalizeSettings(savedSettings));
      showToast("Settings saved");
    } catch (error) {
      showToast(error.message || "Settings could not be saved");
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextProfile = {
      name: formData.get("name"),
      email: formData.get("email"),
    };

    try {
      const savedSettings = await tenantApi.updateSettings({ adminProfile: nextProfile });
      setProfile(normalizeProfile(savedSettings?.adminProfile || nextProfile));
      setModal(null);
      showToast("Tenant profile updated");
    } catch (error) {
      showToast(error.message || "Tenant profile could not be updated");
    }
  };

  const saveBillingRate = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      role: formData.get("role"),
      project_name: formData.get("project"),
      hourly_rate: extractRateNumber(formData.get("rate")),
      rate_type: formData.get("type"),
    };

    try {
      const savedRate = modal.item
        ? await tenantApi.updateBillingRate(modal.item.id, payload)
        : await tenantApi.createBillingRate(payload);
      const nextRate = normalizeBillingRate(savedRate);
      setBillingRates((current) =>
        modal.item ? current.map((rate) => (rate.id === modal.item.id ? nextRate : rate)) : [...current, nextRate]
      );
      setModal(null);
      showToast(modal.item ? "Billing rate updated" : "Billing rate added");
    } catch (error) {
      showToast(error.message || "Billing rate could not be saved");
    }
  };

  const deleteBillingRate = async (rate) => {
    try {
      await tenantApi.deleteBillingRate(rate.id);
      setBillingRates((current) => current.filter((item) => item.id !== rate.id));
      showToast(`${rate.role} billing rate deleted`);
    } catch (error) {
      showToast(error.message || "Billing rate could not be deleted");
    }
  };

  const saveOvertimeRule = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      title: formData.get("name"),
      threshold: formData.get("threshold"),
      multiplier: formData.get("multiplier"),
      applies_to: formData.get("appliesTo"),
      active: modal.item?.active ?? true,
    };

    try {
      const savedRule = modal.item
        ? await tenantApi.updateOvertimeRule(modal.item.id, payload)
        : await tenantApi.createOvertimeRule(payload);
      const nextRule = normalizeOvertimeRule(savedRule);
      setOvertimeRules((current) =>
        modal.item ? current.map((rule) => (rule.id === modal.item.id ? nextRule : rule)) : [...current, nextRule]
      );
      setModal(null);
      showToast(modal.item ? "Overtime rule updated" : "Overtime rule added");
    } catch (error) {
      showToast(error.message || "Overtime rule could not be saved");
    }
  };

  const deleteOvertimeRule = async (rule) => {
    try {
      await tenantApi.deleteOvertimeRule(rule.id);
      setOvertimeRules((current) => current.filter((item) => item.id !== rule.id));
      showToast(`${rule.name} deleted`);
    } catch (error) {
      showToast(error.message || "Overtime rule could not be deleted");
    }
  };

  const toggleOvertimeRule = async (rule) => {
    try {
      const savedRule = await tenantApi.updateOvertimeRule(rule.id, { active: !rule.active });
      const nextRule = normalizeOvertimeRule(savedRule);
      setOvertimeRules((current) => current.map((item) => (item.id === rule.id ? nextRule : item)));
      showToast(`${rule.name} ${rule.active ? "disabled" : "enabled"}`);
    } catch (error) {
      showToast(error.message || "Overtime rule status could not be updated");
    }
  };

  const selectSubscriptionPlan = async (plan) => {
    const monthlyRevenue = plan.custom
      ? 0
      : convertSubscriptionAmount(subscriptionBilling === "annual" ? plan.annualMin : plan.monthlyMin, subscriptionRegion);
    try {
      const savedSubscription = await tenantApi.updateSubscription({
        plan_name: plan.name,
        billing_cycle: subscriptionBilling === "annual" ? "Annual" : "Monthly",
        monthly_recurring_revenue: monthlyRevenue,
      });
      const normalizedSubscription = normalizeSubscription(savedSubscription);
      setSubscriptionPlan(normalizedSubscription.plan);
      setSubscriptionBilling(normalizedSubscription.billing);
      setModal(null);
      showToast(`${plan.name} plan selected`);
    } catch (error) {
      showToast(error.message || "Subscription could not be updated");
    }
  };

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  return (
    <RouteGuard allowedRoles={["admin", "tenant"]}>
      <div className="min-h-screen bg-[#f4f7fb] text-[15px] text-slate-950">
        {toast ? (
          <div className="fixed right-6 top-5 z-50 rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-lg">
            {toast}
          </div>
        ) : null}

        <aside className="fixed inset-y-0 left-0 flex w-[300px] flex-col border-r border-slate-200 bg-white">
          <div className="flex h-20 items-center gap-4 border-b border-slate-200 px-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-violet-700 text-white shadow-sm">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-none tracking-tight">Abhyaka</h1>
            </div>
          </div>

          <nav className="flex-1 space-y-2 px-4 py-7">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setActive(item)}
                className={`w-full rounded-lg px-5 py-3.5 text-left text-base font-semibold transition ${
                  active === item
                    ? "bg-gradient-to-r from-violet-700 to-fuchsia-600 text-white shadow-md"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-700 text-sm font-bold text-white">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{profile.name}</p>
                <p className="text-xs text-slate-500">{profile.email}</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="ml-[300px]">
          <TenantHeader
            profile={profile}
            notifications={notifications}
            showNotifications={showNotifications}
            onToggleNotifications={(nextValue) => {
              if (typeof nextValue === "boolean") {
                setShowNotifications(nextValue);
                return;
              }
              setShowNotifications((current) => {
                const nextOpen = !current;
                if (nextOpen) {
                  markAllNotificationsRead();
                }
                return nextOpen;
              });
            }}
            onClearNotifications={() => {
              setNotifications([]);
              setShowNotifications(false);
            }}
            onClearNotification={(id) => setNotifications((current) => current.filter((item) => item.id !== id))}
            onOpenProfile={() => setModal({ type: "profile" })}
            onOpenSettings={() => setActive("Settings")}
            onLogout={handleLogout}
          />

          <div className="px-9 py-7">
          {loading ? (
            <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
              Loading tenant data...
            </div>
          ) : null}
          {active === "Dashboard" ? <DashboardHome overview={overview} /> : null}
          {active === "Users" ? (
            <UsersPage
              users={users}
              onAdd={() => setModal({ type: "user" })}
              onEdit={(user) => setModal({ type: "user", item: user })}
              onToggleStatus={toggleUserStatus}
            />
          ) : null}
          {active === "Departments" ? (
            <DepartmentsPage
              departments={departments}
              onAdd={() => setModal({ type: "department" })}
              onEdit={(department) => setModal({ type: "department", item: department })}
              onDelete={deleteDepartment}
            />
          ) : null}
          {active === "Policies" ? (
            <PoliciesPage policies={policies} onAdd={() => setModal({ type: "policy" })} onToggle={togglePolicy} />
          ) : null}
          {active === "Billing & Subscription" ? (
            <BillingPage
              currentPlan={subscriptionPlan}
              region={subscriptionRegion}
              billing={subscriptionBilling}
              onManage={() => setModal({ type: "plans" })}
              onAction={showToast}
            />
          ) : null}
          {active === "Audit Logs" ? <AuditLogsPage logs={auditLogs} /> : null}
          {active === "Settings" ? (
            <SettingsPage
              activeTab={settingsTab}
              onTabChange={setSettingsTab}
              settings={settings}
              onSave={saveSettings}
              onAction={showToast}
              billingRates={billingRates}
              onAddBillingRate={() => setModal({ type: "billingRate" })}
              onEditBillingRate={(rate) => setModal({ type: "billingRate", item: rate })}
              onDeleteBillingRate={deleteBillingRate}
              overtimeRules={overtimeRules}
              onAddOvertimeRule={() => setModal({ type: "overtimeRule" })}
              onEditOvertimeRule={(rule) => setModal({ type: "overtimeRule", item: rule })}
              onDeleteOvertimeRule={deleteOvertimeRule}
              onToggleOvertimeRule={toggleOvertimeRule}
            />
          ) : null}
          </div>
        </main>

        {modal?.type === "user" ? <UserModal item={modal.item} onClose={() => setModal(null)} onSubmit={saveUser} /> : null}
        {modal?.type === "department" ? <DepartmentModal item={modal.item} onClose={() => setModal(null)} onSubmit={saveDepartment} /> : null}
        {modal?.type === "billingRate" ? <BillingRateModal item={modal.item} onClose={() => setModal(null)} onSubmit={saveBillingRate} /> : null}
        {modal?.type === "overtimeRule" ? <OvertimeRuleModal item={modal.item} onClose={() => setModal(null)} onSubmit={saveOvertimeRule} /> : null}
        {modal?.type === "policy" ? <PolicyModal onClose={() => setModal(null)} onSubmit={savePolicy} /> : null}
        {modal?.type === "profile" ? <ProfileModal profile={profile} onClose={() => setModal(null)} onSubmit={saveProfile} /> : null}
        {modal?.type === "plans" ? (
          <PlansModal
            currentPlan={subscriptionPlan}
            plans={subscriptionPlans}
            region={subscriptionRegion}
            billing={subscriptionBilling}
            onRegionChange={setSubscriptionRegion}
            onBillingChange={setSubscriptionBilling}
            onClose={() => setModal(null)}
            onSelect={selectSubscriptionPlan}
          />
        ) : null}
      </div>
    </RouteGuard>
  );
}

function TenantHeader({
  profile,
  notifications,
  showNotifications,
  onToggleNotifications,
  onClearNotifications,
  onClearNotification,
  onOpenProfile,
  onOpenSettings,
  onLogout,
}) {
  const headerActionsRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!headerActionsRef.current?.contains(event.target)) {
        onToggleNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [onToggleNotifications]);

  return (
    <header className="border-b border-gray-200 bg-white px-5 py-4 md:px-8">
      <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700"
            aria-label="Open tenant profile"
            title="Tenant Profile"
          >
            {profile.name.charAt(0).toUpperCase()}
          </button>
          <button type="button" onClick={onOpenProfile} className="text-left text-sm font-medium text-gray-600 hover:text-gray-900">
            Tenant Profile
          </button>
        </div>

        <div ref={headerActionsRef} className="relative">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onToggleNotifications}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {notifications.some((item) => !item.read) ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                  {notifications.filter((item) => !item.read).length}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Settings"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-50"
            >
              <Settings className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-indigo-600 bg-indigo-50 px-4 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>

          {showNotifications ? (
            <section className="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <h2 className="font-semibold text-gray-900">Notifications</h2>
                <button
                  type="button"
                  onClick={onClearNotifications}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Clear
                </button>
              </div>

              <ul className="max-h-80 overflow-auto py-1">
                {notifications.length === 0 ? (
                  <li className="px-4 py-5 text-sm text-gray-500">No notifications yet.</li>
                ) : null}
                {notifications.map((item) => (
                  <li
                    key={item.id}
                    className={`border-b border-gray-100 px-4 py-3 last:border-b-0 ${
                      item.read ? "bg-white" : "bg-blue-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-sm ${item.read ? "font-medium text-gray-900" : "font-semibold text-gray-950"}`}>
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">{item.message}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onClearNotification(item.id)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-xs font-semibold leading-none text-gray-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Clear notification"
                      >
                        x
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-8 flex items-start justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-950">{title}</h2>
        <p className="mt-3 text-base text-slate-600">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function PurpleButton({ children, onClick, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="rounded-lg bg-gradient-to-r from-violet-700 to-fuchsia-600 px-6 py-3 text-base font-bold text-white shadow-md"
    >
      {children}
    </button>
  );
}

function DashboardHome({ overview }) {
  const metrics = [
    { label: "Total Users", value: overview?.totalUsers ?? "500" },
    { label: "Departments", value: overview?.activeDepartments ?? "8" },
    { label: "Active Policies", value: overview?.activePolicies ?? "12" },
    { label: "License Usage", value: overview?.usagePercent ? `${overview.usagePercent}%` : "31%" },
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Monitor organization activity and account health" />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </div>
    </>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-300 bg-white p-6">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function UsersPage({ users, onAdd, onEdit, onToggleStatus }) {
  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Manage user accounts, roles, and permissions"
        action={<PurpleButton onClick={onAdd}>+ Add User</PurpleButton>}
      />

      <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
        <table className="w-full text-left">
          <thead className="border-b border-slate-300 bg-white">
            <tr>
              {["Name", "Email", "Role", "Status", "Department", "Actions"].map((heading) => (
                <th key={heading} className="px-6 py-4 text-sm font-bold text-slate-700">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-5 text-base text-slate-800">{user.name}</td>
                <td className="px-6 py-5 text-base text-slate-500">{user.email}</td>
                <td className="px-6 py-5 text-base text-slate-500">{user.role}</td>
                <td className="px-6 py-5"><StatusBadge value={user.status} /></td>
                <td className="px-6 py-5 text-base text-slate-500">{user.department}</td>
                <td className="px-6 py-5">
                  <div className="flex gap-2">
                    <OutlineButton onClick={() => onEdit(user)}>Edit</OutlineButton>
                    <OutlineButton onClick={() => onToggleStatus(user)}>
                      {user.status === "Active" ? "Deactivate" : "Activate"}
                    </OutlineButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function DepartmentsPage({ departments, onAdd, onEdit, onDelete }) {
  return (
    <>
      <PageHeader
        title="Departments"
        subtitle="Organize teams and manage department structures"
        action={<PurpleButton onClick={onAdd}>+ Create Department</PurpleButton>}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        {departments.map((department) => (
          <section key={department.id} className="rounded-xl border border-slate-300 bg-white p-7">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-bold">{department.name}</h3>
              <div className="flex gap-2">
                <SmallIconButton onClick={() => onEdit(department)}><Pencil className="h-3 w-3" /></SmallIconButton>
                <SmallIconButton onClick={() => onDelete(department)}>x</SmallIconButton>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <InfoBlock label="Department Head" value={department.head} />
              <InfoBlock label="Total Employees" value={department.employees} />
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <div className="mt-2"><StatusBadge value={department.status} /></div>
              </div>
            </div>
            <p className="mt-6 border-t border-slate-200 pt-5 text-sm text-slate-500">{department.created}</p>
          </section>
        ))}
      </div>
    </>
  );
}

function PoliciesPage({ policies, onAdd, onToggle }) {
  const [viewPolicy, setViewPolicy] = useState(null);

  return (
    <>
      <PageHeader
        title="Policies"
        subtitle="Configure organizational policies and compliance rules"
        action={<PurpleButton onClick={onAdd}>+ Add Policy</PurpleButton>}
      />

      <div className="max-w-5xl space-y-5">
        {policies.map((policy) => (
          <section key={policy.id} className="rounded-xl border border-slate-300 bg-white px-6 py-6">
            <div className="flex items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold">{policy.title}</h3>
              <p className="mt-3 text-base text-slate-600">{policy.description}</p>
              <div className="mt-5 flex gap-8 text-sm text-slate-500">
                <span>Applies to: {policy.appliesTo}</span>
                <span>Last updated: {policy.updated}</span>
              </div>
            </div>
              <div className="flex shrink-0 items-center gap-4">
                <OutlineButton onClick={() => setViewPolicy(viewPolicy?.id === policy.id ? null : policy)}>
                  {viewPolicy?.id === policy.id ? "Hide Policy" : "View Policy"}
                </OutlineButton>
                <span className="text-sm uppercase tracking-wide text-slate-500">{policy.enabled ? "On" : "Off"}</span>
                <ToggleSwitch enabled={policy.enabled} onClick={() => onToggle(policy)} />
              </div>
            </div>

            {viewPolicy?.id === policy.id ? (
              <div className="mt-5 rounded-lg border border-violet-100 bg-violet-50 px-5 py-4">
                <p className="text-sm font-semibold text-violet-900">Policy Details</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{policy.details}</p>
                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                  <span>Scope: {policy.appliesTo}</span>
                  <span>Status: {policy.enabled ? "Enabled" : "Disabled"}</span>
                  <span>Reviewed: {policy.updated}</span>
                </div>
              </div>
            ) : null}
          </section>
        ))}
      </div>
    </>
  );
}

function convertSubscriptionAmount(value, region) {
  return Math.round(value * subscriptionRegionMeta[region].multiplier);
}

function formatSubscriptionAmount(value, region) {
  const meta = subscriptionRegionMeta[region];
  return `${meta.symbol}${value.toLocaleString(meta.locale)}`;
}

function formatSubscriptionRange(plan, region, billing) {
  if (plan.custom) {
    return billing === "annual" ? "Custom per year" : "Custom per month";
  }

  const min = billing === "annual" ? plan.annualMin : plan.monthlyMin;
  const max = billing === "annual" ? plan.annualMax : plan.monthlyMax;
  return `${formatSubscriptionAmount(convertSubscriptionAmount(min, region), region)}-${formatSubscriptionAmount(convertSubscriptionAmount(max, region), region)}`;
}

function BillingPage({ currentPlan, region, billing, onManage, onAction }) {
  const usagePercent = currentPlan.name === "Starter" ? "42%" : currentPlan.name === "Professional" ? "38%" : "31%";
  const suffix = currentPlan.custom ? "" : billing === "annual" ? "/user/yr" : "/user/mo";
  const displayPrice = formatSubscriptionRange(currentPlan, region, billing);

  const downloadInvoicePdf = (invoice) => {
    const doc = new jsPDF();
    const regionLabel = `${subscriptionRegionMeta[region].label} (${subscriptionRegionMeta[region].code})`;

    doc.setFillColor(91, 33, 182);
    doc.rect(0, 0, 210, 34, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("Abhyaka Invoice", 14, 20);
    doc.setFontSize(10);
    doc.text("Tenant subscription billing summary", 14, 28);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text(`Invoice Number: ${invoice.number}`, 14, 50);
    doc.text(`Invoice Date: ${invoice.date}`, 14, 60);
    doc.text(`Plan: ${currentPlan.name}`, 14, 70);
    doc.text(`Region: ${regionLabel}`, 14, 80);
    doc.text(`Billing Cycle: ${billing === "annual" ? "Annual" : "Monthly"}`, 14, 90);
    doc.text(`Price: ${displayPrice}${suffix}`, 14, 100);
    doc.text(`License: ${currentPlan.seats}`, 14, 110);

    doc.setDrawColor(203, 213, 225);
    doc.line(14, 122, 196, 122);

    doc.setFontSize(14);
    doc.text("Subscription Details", 14, 136);
    doc.setFontSize(11);
    doc.text(`Usage: ${currentPlan.usage}`, 14, 148);
    doc.text(`Available: ${currentPlan.available}`, 14, 158);
    doc.text(`Support: ${currentPlan.support}`, 14, 168);

    doc.setDrawColor(203, 213, 225);
    doc.line(14, 180, 196, 180);
    doc.setFontSize(12);
    doc.text(`Amount: ${invoice.amount}`, 14, 194);
    doc.text("Status: Paid", 14, 204);

    doc.save(`${invoice.number}.pdf`);
    onAction(`${invoice.number} PDF downloaded`);
  };

  return (
    <>
      <PageHeader title="Billing & Subscription" subtitle="Manage your subscription plan, usage, and payment history" />

      <section className="rounded-xl border border-slate-300 bg-white p-7">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold">{currentPlan.name} Plan</h3>
            <p className="mt-3 text-base text-slate-600">{currentPlan.description}</p>
            <p className="mt-2 text-sm text-slate-500">
              Region: {subscriptionRegionMeta[region].label} ({subscriptionRegionMeta[region].code}) · {billing === "annual" ? "Annual" : "Monthly"} billing
            </p>
          </div>
          <p className={`${currentPlan.custom ? "text-2xl" : "text-3xl"} font-bold`}>
            {formatSubscriptionRange(currentPlan, region, billing)}
            {suffix ? <span className="text-base">{suffix}</span> : null}
          </p>
        </div>

        <div className="mt-7 grid gap-8 md:grid-cols-3">
          <InfoBlock label="Plan Type" value="Annual" large />
          <InfoBlock label="User License" value={currentPlan.seats} large />
          <InfoBlock label="Next Billing Date" value="Mar 1, 2026" large />
        </div>

        <div className="mt-8">
          <p className="mb-3 text-sm text-slate-500">License Usage</p>
          <div className="h-7 overflow-hidden rounded border border-slate-300 bg-white">
            <div
              className="h-full bg-gradient-to-r from-violet-700 to-fuchsia-600 text-center text-sm leading-7 text-slate-950"
              style={{ width: usagePercent }}
            >
              {currentPlan.usage}
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-500">{currentPlan.available}</p>
        </div>

        <div className="mt-8 flex gap-5">
          <PurpleButton onClick={onManage}>Upgrade Plan</PurpleButton>
          <OutlineButton onClick={onManage}>Manage Plan</OutlineButton>
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-slate-300 bg-white p-7">
        <h3 className="text-xl font-bold">Invoice History</h3>
        <div className="mt-8 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-100">
              <tr>
                {["Invoice Number", "Date", "Plan", "Amount", "Actions"].map((heading) => (
                  <th key={heading} className="px-5 py-4 text-sm font-bold text-slate-700">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.number}>
                  <td className="px-5 py-5 text-base font-medium">{invoice.number}</td>
                  <td className="px-5 py-5 text-base text-slate-500">{invoice.date}</td>
                  <td className="px-5 py-5 text-base text-slate-500">{invoice.plan}</td>
                  <td className="px-5 py-5 text-base font-semibold">{invoice.amount}</td>
                  <td className="px-5 py-5">
                    <OutlineButton onClick={() => downloadInvoicePdf(invoice)}>
                      <Download className="h-4 w-4" /> Download PDF
                    </OutlineButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function AuditLogsPage({ logs }) {
  const [selectedLogId, setSelectedLogId] = useState(null);
  const availableLogs = logs?.length ? logs : [fallbackAuditLog];
  const selectedLog = availableLogs.find((log) => log.id === selectedLogId) || availableLogs[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">Audit Logs</h2>
        <div className="mt-4 space-y-3">
          {availableLogs.map((log) => (
            <button
              key={log.id || `${log.timestamp}-${log.resource}`}
              type="button"
              onClick={() => setSelectedLogId(log.id || `${log.timestamp}-${log.resource}`)}
              className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                selectedLog === log ? "border-violet-500 bg-violet-50" : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <span className="block font-semibold text-slate-950">{log.action}</span>
              <span className="mt-1 block text-xs text-slate-500">{log.timestamp}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-[680px] rounded-xl border border-slate-200 bg-white px-7 py-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-slate-950">Audit Log Details</h2>
          <button type="button" className="text-2xl leading-none text-slate-500 hover:text-slate-800" aria-label="Close audit log details">
            x
          </button>
        </div>

        <div className="space-y-4">
          <AuditDetailBlock label="Timestamp">
            <p className="font-mono text-sm font-semibold text-slate-950">{selectedLog.timestamp}</p>
          </AuditDetailBlock>

          <AuditDetailBlock label="User">
            <p className="text-sm font-semibold text-slate-950">{selectedLog.user || "System"}</p>
            <p className="mt-1 text-sm text-slate-600">{selectedLog.email || "No email recorded"}</p>
          </AuditDetailBlock>

          <AuditDetailBlock label="Action">
            <p className="text-sm font-semibold text-slate-950">{selectedLog.action}</p>
          </AuditDetailBlock>

          <AuditDetailBlock label="Resource">
            <p className="font-mono text-sm font-semibold text-slate-950">{selectedLog.resource}</p>
          </AuditDetailBlock>

          <AuditDetailBlock label="Details">
            <p className="text-sm leading-6 text-slate-700">{selectedLog.details}</p>
          </AuditDetailBlock>
        </div>

        <button
          type="button"
          onClick={() => setSelectedLogId(null)}
          className="mt-6 w-full rounded-lg bg-gradient-to-r from-violet-700 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-md"
        >
          Close
        </button>
      </section>
    </div>
  );
}

function AuditDetailBlock({ label, children }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-4">
      <p className="mb-2 text-sm text-slate-500">{label}</p>
      {children}
    </div>
  );
}

function SettingsPage({
  activeTab,
  onTabChange,
  settings,
  onSave,
  onAction,
  billingRates,
  onAddBillingRate,
  onEditBillingRate,
  onDeleteBillingRate,
  overtimeRules,
  onAddOvertimeRule,
  onEditOvertimeRule,
  onDeleteOvertimeRule,
  onToggleOvertimeRule,
}) {
  return (
    <>
      <PageHeader title="Tenant Settings" subtitle="Configure organization-wide settings and preferences" />

      <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
        <div className="flex">
          {settingTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`px-7 py-4 text-base font-semibold ${
                activeTab === tab ? "border-b-4 border-violet-700 text-violet-700" : "text-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-7 rounded-xl border border-slate-300 bg-white p-8">
        {activeTab === "General Settings" ? <GeneralSettings settings={settings} onSave={onSave} /> : null}
        {activeTab === "Billing Rates" ? (
          <BillingRatesSettings
            rates={billingRates}
            onAdd={onAddBillingRate}
            onEdit={onEditBillingRate}
            onDelete={onDeleteBillingRate}
          />
        ) : null}
        {activeTab === "Overtime Rules" ? (
          <OvertimeRulesSettings
            rules={overtimeRules}
            onAdd={onAddOvertimeRule}
            onEdit={onEditOvertimeRule}
            onDelete={onDeleteOvertimeRule}
            onToggle={onToggleOvertimeRule}
          />
        ) : null}
        {activeTab === "Branding" ? <SimpleSettings title="Branding" onAction={onAction} /> : null}
      </section>
    </>
  );
}

function BillingRatesSettings({ rates, onAdd, onEdit, onDelete }) {
  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold">Billing Rates Configuration</h3>
          <p className="mt-3 text-base text-slate-600">Define billing rates per role and project for invoicing</p>
        </div>
        <PurpleButton onClick={onAdd}>+ Add Billing Rate</PurpleButton>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-300">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              {["Role", "Project", "Rate (INR)", "Type", "Actions"].map((heading) => (
                <th key={heading} className="px-5 py-4 text-sm font-bold text-slate-700">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {rates.map((rate) => (
              <tr key={rate.id}>
                <td className="px-5 py-5 text-base font-semibold">{rate.role}</td>
                <td className="px-5 py-5 text-base text-slate-500">{rate.project}</td>
                <td className="px-5 py-5 text-base">{rate.rate}</td>
                <td className="px-5 py-5 text-base text-slate-500">{rate.type}</td>
                <td className="px-5 py-5">
                  <div className="flex gap-2">
                    <OutlineButton onClick={() => onEdit(rate)}><Pencil className="h-4 w-4" /> Edit</OutlineButton>
                    <DangerButton onClick={() => onDelete(rate)}><Trash2 className="h-4 w-4" /> Delete</DangerButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-7 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
        <p className="font-semibold text-blue-900">Billing Rates Information</p>
        <p className="mt-2 text-sm text-blue-800">Billing rates are used to calculate project costs and generate client invoices.</p>
        <p className="mt-1 text-sm text-blue-800">You can define different rates for the same role across different projects.</p>
      </div>
    </div>
  );
}

function OvertimeRulesSettings({ rules, onAdd, onEdit, onDelete, onToggle }) {
  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold">Overtime Rules Configuration</h3>
          <p className="mt-3 text-base text-slate-600">Define overtime eligibility, thresholds, and compensation multipliers</p>
        </div>
        <PurpleButton onClick={onAdd}>+ Add Overtime Rule</PurpleButton>
      </div>

      <div className="space-y-5">
        {rules.map((rule) => (
          <section key={rule.id} className="rounded-xl border border-slate-300 bg-white px-7 py-7">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-4">
                  <h4 className="text-2xl font-bold">{rule.name}</h4>
                  <StatusBadge value={rule.active ? "Active" : "Inactive"} />
                </div>
                <div className="mt-6 grid gap-8 md:grid-cols-3">
                  <InfoBlock label="Threshold (hours/week)" value={rule.threshold} large />
                  <InfoBlock label="Pay Multiplier" value={rule.multiplier} large />
                  <InfoBlock label="Applies To" value={rule.appliesTo} large />
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <OutlineButton onClick={() => onToggle(rule)}>{rule.active ? "Disable" : "Enable"}</OutlineButton>
                <OutlineButton onClick={() => onEdit(rule)}><Pencil className="h-4 w-4" /> Edit</OutlineButton>
                <DangerButton onClick={() => onDelete(rule)}><Trash2 className="h-4 w-4" /> Delete</DangerButton>
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-7 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
        <p className="font-semibold text-amber-900">Overtime Rules Information</p>
        <p className="mt-2 text-sm text-amber-800">Rules determine when overtime applies and which multiplier should be used for pay and reporting.</p>
      </div>
    </div>
  );
}

function GeneralSettings({ settings, onSave }) {
  return (
    <form onSubmit={onSave}>
      <h3 className="text-2xl font-bold">General Tenant Configuration</h3>
      <div className="mt-7 grid gap-x-8 gap-y-6 md:grid-cols-2">
        <Field name="tenantName" label="Tenant Name *" value={settings.tenantName} />
        <SelectField name="timeZone" label="Default Time Zone *" value={settings.timeZone} />
        <SelectField name="currency" label="Default Currency *" value={settings.currency} helper="Used for billing rates and invoices" />
        <SelectField name="weekStart" label="Week Start Day *" value={settings.weekStart} />
        <SelectField
          name="payPeriod"
          label="Pay Period Frequency *"
          value={settings.payPeriod}
          options={["Biweekly", "Monthly", "Annually"]}
        />
        <SelectField name="rounding" label="Time Rounding Increment (minutes) *" value={settings.rounding} helper="Round time entries to nearest increment" />
        <SelectField
          name="maxHours"
          label="Maximum Hours Per Day *"
          value={settings.maxHours}
          options={["8 hours", "10 hours", "12 hours"]}
        />
        <SelectField name="dateFormat" label="Date Format *" value={settings.dateFormat} />
      </div>
      <div className="mt-7">
        <PurpleButton type="submit">Save Settings</PurpleButton>
      </div>
    </form>
  );
}

function SimpleSettings({ title, onAction }) {
  return (
    <div>
      <h3 className="text-2xl font-bold">{title}</h3>
      <p className="mt-3 text-base text-slate-600">Settings ready for configuration.</p>
      <div className="mt-6">
        <PurpleButton onClick={() => onAction(`${title} saved`)}>Save {title}</PurpleButton>
      </div>
    </div>
  );
}

function ProfileModal({ profile, onClose, onSubmit }) {
  return (
    <Modal title="Tenant Profile" onClose={onClose}>
      <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-base font-bold text-white">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">{profile.name}</p>
            <p className="text-sm text-slate-600">{profile.email}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{profile.role}</p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <ModalField name="name" label="Name" defaultValue={profile.name} />
        <ModalField name="email" label="Email" defaultValue={profile.email} type="email" />
        <ModalActions onClose={onClose} submitLabel="Save Profile" />
      </form>
    </Modal>
  );
}

function UserModal({ item, onClose, onSubmit }) {
  return (
    <Modal title={item ? "Edit User" : "Add User"} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <ModalField name="name" label="Name" defaultValue={item?.name || ""} />
        <ModalField name="email" label="Email" defaultValue={item?.email || ""} type="email" />
        <ModalSelect name="role" label="Role" defaultValue={item?.role || "Employee"} options={["Admin", "Manager", "Employee"]} />
        <ModalSelect name="status" label="Status" defaultValue={item?.status || "Active"} options={["Active", "Inactive"]} />
        <ModalField name="department" label="Department" defaultValue={item?.department || "Engineering"} />
        <ModalActions onClose={onClose} submitLabel={item ? "Save User" : "Add User"} />
      </form>
    </Modal>
  );
}

function DepartmentModal({ item, onClose, onSubmit }) {
  return (
    <Modal title={item ? "Edit Department" : "Create Department"} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <ModalField name="name" label="Department Name" defaultValue={item?.name || ""} />
        <ModalField name="head" label="Department Head" defaultValue={item?.head || ""} />
        <ModalField name="employees" label="Total Employees" defaultValue={item?.employees || "1 member"} />
        <ModalActions onClose={onClose} submitLabel={item ? "Save Department" : "Create Department"} />
      </form>
    </Modal>
  );
}

function BillingRateModal({ item, onClose, onSubmit }) {
  return (
    <Modal title={item ? "Edit Billing Rate" : "Add Billing Rate"} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <ModalField name="role" label="Role" defaultValue={item?.role || ""} />
        <ModalField name="project" label="Project" defaultValue={item?.project || "All Projects"} />
        <ModalField name="rate" label="Rate" defaultValue={item?.rate || "INR 2,500/hour"} />
        <ModalSelect name="type" label="Type" defaultValue={item?.type || "Hourly"} options={["Hourly", "Daily", "Monthly"]} />
        <ModalActions onClose={onClose} submitLabel={item ? "Save Billing Rate" : "Add Billing Rate"} />
      </form>
    </Modal>
  );
}

function OvertimeRuleModal({ item, onClose, onSubmit }) {
  return (
    <Modal title={item ? "Edit Overtime Rule" : "Add Overtime Rule"} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <ModalField name="name" label="Rule Name" defaultValue={item?.name || ""} />
        <ModalField name="threshold" label="Threshold" defaultValue={item?.threshold || "After 40 hours"} />
        <ModalField name="multiplier" label="Pay Multiplier" defaultValue={item?.multiplier || "1.5x"} />
        <ModalField name="appliesTo" label="Applies To" defaultValue={item?.appliesTo || "All Employees"} />
        <ModalActions onClose={onClose} submitLabel={item ? "Save Overtime Rule" : "Add Overtime Rule"} />
      </form>
    </Modal>
  );
}

function PolicyModal({ onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4">
      <button type="button" className="absolute inset-0" aria-label="Close policy modal" onClick={onClose} />
      <section className="relative z-10 w-full max-w-3xl rounded-2xl bg-white px-10 py-9 shadow-2xl">
        <div className="mb-7 flex items-center justify-between">
          <h3 className="text-3xl font-bold tracking-tight text-slate-950">Add New Policy</h3>
          <button type="button" onClick={onClose} className="text-3xl leading-none text-slate-500 hover:text-slate-800">x</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <label className="block">
            <span className="mb-3 block text-base font-semibold text-slate-800">Policy Name *</span>
            <input
              name="title"
              required
              className="h-12 w-full rounded-lg border border-slate-300 px-4 text-base outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
            />
          </label>

          <label className="block">
            <span className="mb-3 block text-base font-semibold text-slate-800">Description *</span>
            <textarea
              name="description"
              required
              rows={5}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
            />
          </label>

          <label className="block">
            <span className="mb-3 block text-base font-semibold text-slate-800">Applies To *</span>
            <select
              name="appliesTo"
              defaultValue="All users"
              className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-base outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
            >
              <option>All users</option>
              <option>All employees</option>
              <option>Managers & above</option>
              <option>Specific departments</option>
            </select>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <OutlineButton onClick={onClose}>Cancel</OutlineButton>
            <PurpleButton type="submit">Add Policy</PurpleButton>
          </div>
        </form>
      </section>
    </div>
  );
}

function PlansModal({ currentPlan, plans, region, billing, onRegionChange, onBillingChange, onClose, onSelect }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4">
      <button type="button" className="absolute inset-0" aria-label="Close plans" onClick={onClose} />
      <section className="relative z-10 w-full max-w-5xl rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-950">Choose Subscription Plan</h3>
            <p className="mt-2 text-sm text-slate-600">Select Starter, Professional, or Enterprise with the same pricing and regions as the subscription page.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded border border-slate-300 px-3 py-1 text-sm">x</button>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <span className="text-sm font-medium text-slate-700">Region:</span>
          {Object.entries(subscriptionRegionMeta).map(([key, meta]) => (
            <button
              key={key}
              type="button"
              onClick={() => onRegionChange(key)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                region === key ? "bg-gradient-to-r from-violet-700 to-fuchsia-600 text-white" : "bg-white text-slate-700"
              }`}
            >
              {meta.label}
            </button>
          ))}
          <span className="ml-auto text-sm text-slate-500">{subscriptionRegionMeta[region].code}</span>
        </div>

        <div className="mb-6 inline-flex rounded-xl border border-slate-200 bg-white p-1">
          {["monthly", "annual"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onBillingChange(option)}
              className={`rounded-lg px-6 py-2 text-sm font-semibold capitalize ${
                billing === option ? "bg-gradient-to-r from-violet-700 to-fuchsia-600 text-white" : "text-slate-700"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.name === currentPlan.name;
            const price = formatSubscriptionRange(plan, region, billing);
            const suffix = plan.custom ? "" : billing === "annual" ? "/user/yr" : "/user/mo";
            return (
              <article
                key={plan.name}
                className={`flex min-h-[320px] flex-col rounded-xl border p-5 ${
                  isCurrent ? "border-violet-500 bg-violet-50" : "border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-bold text-slate-950">{plan.name}</h4>
                  {isCurrent ? <StatusBadge value="Active" /> : null}
                </div>
                <p className={`${plan.custom ? "mt-4 text-2xl" : "mt-4 text-3xl"} font-bold text-slate-950`}>
                  {price}<span className="text-sm">{suffix}</span>
                </p>
                <p className="mt-4 text-sm leading-6 text-slate-600">{plan.description}</p>
                <div className="mt-5 space-y-3 text-sm text-slate-700">
                  <p>{plan.seats}</p>
                  <p>{plan.support}</p>
                  {plan.features.slice(0, 3).map((feature) => (
                    <p key={feature}>{feature}</p>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => onSelect(plan)}
                  className={`mt-auto rounded-lg px-4 py-3 text-sm font-bold ${
                    isCurrent
                      ? "border border-violet-500 bg-white text-violet-700"
                      : "bg-gradient-to-r from-violet-700 to-fuchsia-600 text-white"
                  }`}
                >
                  {isCurrent ? "Current Plan" : `Choose ${plan.name}`}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4">
      <button type="button" className="absolute inset-0" aria-label="Close modal" onClick={onClose} />
      <section className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-950">{title}</h3>
          <button type="button" onClick={onClose} className="rounded border border-slate-300 px-3 py-1 text-sm">x</button>
        </div>
        {children}
      </section>
    </div>
  );
}

function ModalField({ name, label, defaultValue, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required
        className="h-11 w-full rounded-lg border border-slate-300 px-3 text-base"
      />
    </label>
  );
}

function ModalSelect({ name, label, defaultValue, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <select name={name} defaultValue={defaultValue} className="h-11 w-full rounded-lg border border-slate-300 px-3 text-base">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function ModalActions({ onClose, submitLabel }) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <OutlineButton onClick={onClose}>Cancel</OutlineButton>
      <PurpleButton type="submit">{submitLabel}</PurpleButton>
    </div>
  );
}

function Field({ name, label, value }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        name={name}
        defaultValue={value}
        className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-900"
      />
    </label>
  );
}

function SelectField({ name, label, value, helper, options }) {
  const optionItems = options || [value];

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <select name={name} defaultValue={value} className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-900">
        {optionItems.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      {helper ? <span className="mt-2 block text-sm text-slate-500">{helper}</span> : null}
    </label>
  );
}

function StatusBadge({ value }) {
  const isActive = value === "Active";
  return (
    <span className={`inline-flex rounded border px-3 py-1 text-sm ${isActive ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-400 bg-slate-50 text-slate-600"}`}>
      {value}
    </span>
  );
}

function OutlineButton({ children, onClick, type = "button" }) {
  return (
    <button type={type} onClick={onClick} className="inline-flex items-center gap-2 rounded border border-slate-400 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
      {children}
    </button>
  );
}

function DangerButton({ children, onClick }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-2 rounded border border-red-400 bg-white px-4 py-2 text-sm font-semibold text-red-600">
      {children}
    </button>
  );
}

function SmallIconButton({ children, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex h-8 w-8 items-center justify-center rounded border border-slate-400 bg-white text-sm font-semibold">
      {children}
    </button>
  );
}

function InfoBlock({ label, value, large = false }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 font-semibold text-slate-950 ${large ? "text-xl" : "text-base"}`}>{value}</p>
    </div>
  );
}

function ToggleSwitch({ enabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex h-7 w-14 rounded-full border-2 transition ${
        enabled ? "border-emerald-600 bg-emerald-100" : "border-slate-400 bg-slate-100"
      }`}
    >
      <span className={`absolute top-1 h-4 w-4 rounded-full transition ${enabled ? "right-1 bg-emerald-600" : "left-1 bg-slate-400"}`} />
    </button>
  );
}
