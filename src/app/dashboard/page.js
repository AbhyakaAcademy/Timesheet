"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, Clock, CreditCard, Download, LogOut, MapPin, Pencil, Settings, Trash2 } from "lucide-react";
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

const accountCardBrandsByCountry = {
  "United States": ["Visa", "Mastercard", "American Express", "Discover"],
  India: ["Visa", "RuPay"],
  "United Kingdom": ["Visa", "Mastercard", "Maestro"],
};

function getCardBrand(value) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("4")) return "Visa";
  if (digits.startsWith("34") || digits.startsWith("37")) return "American Express";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  if (digits.startsWith("6")) return "Discover";
  if (digits.startsWith("8")) return "RuPay";
  if (/^(50|56|57|58|6[0-9])/.test(digits)) return "Maestro";
  return "Card type";
}

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  const groups = digits.match(/.{1,4}/g);
  return groups ? groups.join(" ") : "";
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

function CardLogo({ name, active }) {
  const baseClass = "inline-flex h-7 w-11 items-center justify-center overflow-hidden rounded shadow-sm ring-1 ring-slate-200 transition";
  const inactiveClass = active === false ? "opacity-40 grayscale" : "";

  if (name === "Mastercard") {
    return (
      <span className={`${baseClass} bg-[#111827] ${inactiveClass}`} aria-label="Mastercard">
        <svg viewBox="0 0 44 28" className="h-full w-full" role="img" aria-hidden="true">
          <circle cx="18" cy="14" r="8.5" fill="#eb001b" />
          <circle cx="26" cy="14" r="8.5" fill="#f79e1b" />
          <path d="M22 7.5a8.5 8.5 0 0 1 0 13 8.5 8.5 0 0 1 0-13Z" fill="#ff5f00" />
        </svg>
      </span>
    );
  }

  if (name === "Discover") {
    return (
      <span className={`${baseClass} bg-white ${inactiveClass}`} aria-label="Discover">
        <svg viewBox="0 0 44 28" className="h-full w-full" role="img" aria-hidden="true">
          <rect width="44" height="28" rx="3" fill="#ffffff" />
          <path d="M28 4h12v20H28a10 10 0 0 0 0-20Z" fill="#f58220" opacity="0.95" />
          <text x="5" y="16.5" fill="#111827" fontSize="6.2" fontWeight="800" fontFamily="Arial, sans-serif">DISC</text>
          <text x="23" y="16.5" fill="#111827" fontSize="6.2" fontWeight="800" fontFamily="Arial, sans-serif">VER</text>
        </svg>
      </span>
    );
  }

  if (name === "American Express") {
    return (
      <span className={`${baseClass} bg-[#2e9fd8] ${inactiveClass}`} aria-label="American Express">
        <svg viewBox="0 0 44 28" className="h-full w-full" role="img" aria-hidden="true">
          <rect width="44" height="28" rx="3" fill="#2e9fd8" />
          <text x="22" y="12" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif">AM</text>
          <text x="22" y="21" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif">EX</text>
        </svg>
      </span>
    );
  }

  if (name === "RuPay") {
    return (
      <span className={`${baseClass} bg-white ${inactiveClass}`} aria-label="RuPay">
        <svg viewBox="0 0 44 28" className="h-full w-full" role="img" aria-hidden="true">
          <rect width="44" height="28" rx="3" fill="#ffffff" />
          <text x="18" y="17" textAnchor="middle" fill="#1f5aa6" fontSize="9" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif">Ru</text>
          <text x="30" y="17" textAnchor="middle" fill="#0f9d58" fontSize="9" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif">Pay</text>
          <path d="M34 7l5 7-5 7h3l5-7-5-7h-3Z" fill="#f58220" />
        </svg>
      </span>
    );
  }

  if (name === "Maestro") {
    return (
      <span className={`${baseClass} bg-white ${inactiveClass}`} aria-label="Maestro">
        <svg viewBox="0 0 44 28" className="h-full w-full" role="img" aria-hidden="true">
          <rect width="44" height="28" rx="3" fill="#ffffff" />
          <circle cx="18" cy="12" r="7.5" fill="#009ddd" />
          <circle cx="26" cy="12" r="7.5" fill="#ed1c24" />
          <path d="M22 6.5a7.5 7.5 0 0 1 0 11 7.5 7.5 0 0 1 0-11Z" fill="#6c6bff" opacity="0.85" />
          <text x="22" y="23" textAnchor="middle" fill="#111827" fontSize="6" fontWeight="800" fontFamily="Arial, sans-serif">maestro</text>
        </svg>
      </span>
    );
  }

  return (
    <span className={`${baseClass} bg-[#064f96] ${inactiveClass}`} aria-label="Visa">
      <svg viewBox="0 0 44 28" className="h-full w-full" role="img" aria-hidden="true">
        <rect width="44" height="28" rx="3" fill="#064f96" />
        <text x="22" y="18" textAnchor="middle" fill="#ffffff" fontSize="12" fontStyle="italic" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif">VISA</text>
      </svg>
    </span>
  );
}

function CardLogoStrip({ brands, activeBrand }) {
  return (
    <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
      {brands.map((brand) => (
        <CardLogo
          key={brand}
          name={brand}
          active={!activeBrand || activeBrand === "Card type" || activeBrand === brand}
        />
      ))}
    </div>
  );
}

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

const settingTabs = [
  "General Settings",
  // "Accounts",
  "Billing Rates",
  "Overtime Rules",
  "Branding",
];

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
  billingAddress: {
    company: "Abhyaka Customer Billing",
    line1: "14 Lake View Road",
    line2: "Indiranagar",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560038",
    country: "India",
  },
  paymentMethods: [
    {
      id: "card-1",
      brand: "Visa",
      last4: "4242",
      expiry: "08/28",
      holder: "Sarah Johnson",
      billingAddress: "14 Lake View Road, Indiranagar, Bengaluru, Karnataka 560038, India",
      isDefault: true,
    },
    {
      id: "card-2",
      brand: "Mastercard",
      last4: "1881",
      expiry: "11/27",
      holder: "Sarah Johnson",
      billingAddress: "14 Lake View Road, Indiranagar, Bengaluru, Karnataka 560038, India",
      isDefault: false,
    },
  ],
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
  name: "Client Profile",
  email: "admin@abhyaka.com",
  role: "Client Admin",
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

function normalizeBillingAddressValue(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return defaultSettings.billingAddress;
  }

  const nextAddress = {
    ...defaultSettings.billingAddress,
    ...value,
  };

  const hasMeaningfulAddress = Object.values(nextAddress).some((item) => String(item || "").trim());
  return hasMeaningfulAddress ? nextAddress : defaultSettings.billingAddress;
}

function normalizePaymentMethodsValue(value) {
  if (!Array.isArray(value) || !value.length) {
    return defaultSettings.paymentMethods;
  }

  const nextCards = value
    .filter((card) => card && typeof card === "object")
    .map((card, index) => ({
      id: card.id || `card-fallback-${index + 1}`,
      brand: card.brand || "Card",
      last4: String(card.last4 || "").slice(-4) || "0000",
      expiry: card.expiry || "MM/YY",
      holder: card.holder || "Client Admin",
      billingAddress: card.billingAddress || defaultSettings.paymentMethods[0].billingAddress,
      isDefault: Boolean(card.isDefault),
    }));

  if (!nextCards.length) {
    return defaultSettings.paymentMethods;
  }

  if (!nextCards.some((card) => card.isDefault)) {
    nextCards[0] = { ...nextCards[0], isDefault: true };
  }

  return nextCards;
}

function normalizeSettings(payload) {
  const organization = payload?.organization || payload || {};
  const normalizedBillingAddress = normalizeBillingAddressValue(organization.billingAddress || organization.billing_address);
  const normalizedPaymentMethods = normalizePaymentMethodsValue(organization.paymentMethods || organization.payment_methods);

  return {
    tenantName: organization.tenantName || organization.name || defaultSettings.tenantName,
    timeZone: organization.timeZone || organization.timezone || defaultSettings.timeZone,
    currency: organization.currency || defaultSettings.currency,
    weekStart: organization.weekStart || organization.week_start || defaultSettings.weekStart,
    payPeriod: organization.payPeriod || organization.pay_period || defaultSettings.payPeriod,
    rounding: organization.rounding || defaultSettings.rounding,
    maxHours: organization.maxHours || `${organization.max_hours || 12} hours`,
    dateFormat: organization.dateFormat || organization.date_format || defaultSettings.dateFormat,
    billingAddress: normalizedBillingAddress,
    paymentMethods: normalizedPaymentMethods,
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

function buildFallbackOverview() {
  return {
    totalUsers: initialUsers.length,
    activeDepartments: initialDepartments.length,
    activePolicies: initialPolicies.filter((policy) => policy.enabled).length,
    usagePercent: 31,
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
        const nextUsers = usersData?.length ? usersData.map(normalizeUser) : initialUsers;
        const nextDepartments = departmentsData?.length ? departmentsData.map(normalizeDepartment) : initialDepartments;
        const nextPolicies = policiesData?.length ? policiesData.map(normalizePolicy) : initialPolicies;
        const nextBillingRates = billingRatesData?.length ? billingRatesData.map(normalizeBillingRate) : initialBillingRates;
        const nextOvertimeRules = overtimeRulesData?.length ? overtimeRulesData.map(normalizeOvertimeRule) : initialOvertimeRules;
        const hasOverviewData =
          overviewData &&
          [overviewData.totalUsers, overviewData.activeDepartments, overviewData.activePolicies, overviewData.usagePercent].some(
            (value) => value !== undefined && value !== null
          );

        setOverview(hasOverviewData ? overviewData : buildFallbackOverview());
        setUsers(nextUsers);
        setDepartments(nextDepartments);
        setPolicies(nextPolicies);
        setBillingRates(nextBillingRates);
        setOvertimeRules(nextOvertimeRules);
        setSubscriptionPlan(normalizedSubscription.plan);
        setSubscriptionBilling(normalizedSubscription.billing);
        setSettings(normalizeSettings(settingsData));
        setProfile(normalizeProfile(settingsData?.adminProfile || overviewData?.adminProfile));
        setAuditLogs(auditLogsData?.length ? auditLogsData : [fallbackAuditLog]);
      } catch (error) {
        if (isMounted) {
          showToast(error.message || "Client data could not load");
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
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
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
      if (modal.item) {
        showToast("User updated");
      } else {
        showToast(savedUser.invitation_url ? "User invited. Invite link generated." : "User invited by email");
      }
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
      enabled: modal?.item?.enabled ?? true,
    };

    try {
      const savedPolicy = modal?.item
        ? await tenantApi.updatePolicy(modal.item.id, payload)
        : await tenantApi.createPolicy(payload);
      const nextPolicy = normalizePolicy(savedPolicy);
      setPolicies((current) =>
        modal?.item ? current.map((item) => (item.id === modal.item.id ? nextPolicy : item)) : [...current, nextPolicy]
      );
      setModal(null);
      showToast(modal?.item ? "Policy updated" : "Policy added");
    } catch (error) {
      showToast(error.message || `Policy could not be ${modal?.item ? "updated" : "added"}`);
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
      showToast("Client profile updated");
    } catch (error) {
      showToast(error.message || "Client profile could not be updated");
    }
  };

  const saveAccountSettings = async (accountSettings) => {
    const savedSettings = await tenantApi.updateSettings(accountSettings);
    const normalizedSettings = normalizeSettings(savedSettings);
    setSettings(normalizedSettings);
    return normalizedSettings;
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
                C
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
              Loading client data...
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
            <PoliciesPage
              policies={policies}
              onAdd={() => setModal({ type: "policy" })}
              onEdit={(policy) => setModal({ type: "policy", item: policy })}
              onToggle={togglePolicy}
            />
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
              subscriptionPlan={subscriptionPlan}
              subscriptionBilling={subscriptionBilling}
              onAction={showToast}
              saveAccountSettings={saveAccountSettings}
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
        {modal?.type === "policy" ? <PolicyModal item={modal.item} onClose={() => setModal(null)} onSubmit={savePolicy} /> : null}
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
            aria-label="Open client profile"
            title="Client Profile"
          >
            C
          </button>
          <button type="button" onClick={onOpenProfile} className="text-left text-sm font-medium text-gray-600 hover:text-gray-900">
            Client Profile
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

function PoliciesPage({ policies, onAdd, onEdit, onToggle }) {
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
                <OutlineButton onClick={() => onEdit(policy)}>Edit Policy</OutlineButton>
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

  const meta = subscriptionRegionMeta[region];
  const min = billing === "annual" ? plan.annualMin : plan.monthlyMin;
  const max = billing === "annual" ? plan.annualMax : plan.monthlyMax;
  const formattedMin = convertSubscriptionAmount(min, region).toLocaleString(meta.locale);
  const formattedMax = convertSubscriptionAmount(max, region).toLocaleString(meta.locale);
  return `${meta.symbol}${formattedMin}-${formattedMax}`;
}

function BillingPage({ currentPlan, region, billing, onManage, onAction }) {
  const usagePercent = currentPlan.name === "Starter" ? "42%" : currentPlan.name === "Professional" ? "38%" : "31%";
  const suffix = currentPlan.custom ? "" : billing === "annual" ? "/user/yr" : "/user/mo";
  const displayPrice = formatSubscriptionRange(currentPlan, region, billing);
  const nextChargeDate = "May 27, 2026";

  const downloadInvoicePdf = (invoice) => {
    const doc = new jsPDF();
    const regionLabel = `${subscriptionRegionMeta[region].label} (${subscriptionRegionMeta[region].code})`;

    doc.setFillColor(91, 33, 182);
    doc.rect(0, 0, 210, 34, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("Abhyaka Invoice", 14, 20);
    doc.setFontSize(10);
    doc.text("Client subscription billing summary", 14, 28);

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
          <InfoBlock label="Plan Type" value={billing === "annual" ? "Annual" : "Monthly"} large />
          <InfoBlock label="User License" value={currentPlan.seats} large />
          <InfoBlock label="Next Billing Date" value={nextChargeDate} large />
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

function DetailRow({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function AuditLogsPage({ logs }) {
  const [selectedLogId, setSelectedLogId] = useState("default");
  const availableLogs = logs?.length ? logs : [fallbackAuditLog];
  const selectedLog =
    selectedLogId === null
      ? null
      : availableLogs.find((log) => (log.id || `${log.timestamp}-${log.resource}`) === selectedLogId) || availableLogs[0];

  return (
    <div className={`grid gap-6 ${selectedLog ? "xl:grid-cols-[360px_1fr]" : "max-w-[360px]"}`}>
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

      {selectedLog ? (
      <section className="max-w-[680px] rounded-xl border border-slate-200 bg-white px-7 py-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-slate-950">Audit Log Details</h2>
          <button
            type="button"
            onClick={() => setSelectedLogId(null)}
            className="text-2xl leading-none text-slate-500 hover:text-slate-800"
            aria-label="Close audit log details"
          >
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
      ) : null}
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
  subscriptionPlan,
  subscriptionBilling,
  onAction,
  saveAccountSettings,
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
      <PageHeader title="Client Settings" subtitle="Configure organization-wide settings and preferences" />

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
        {/* {activeTab === "Accounts" ? (
          <AccountsSettings
            settings={settings}
            currentPlan={subscriptionPlan}
            billing={subscriptionBilling}
            onAction={onAction}
            onSave={saveAccountSettings}
          />
        ) : null} */}
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

function AccountsSettings({ settings, currentPlan, billing, onAction, onSave }) {
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);
  const [savedCards, setSavedCards] = useState(null);
  const paymentCardSequenceRef = useRef(1);
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: "",
    expiry: "",
    cvc: "",
    country: "United States",
    zipCode: "",
  });
  const currentPaymentMethods = normalizePaymentMethodsValue(
    Array.isArray(savedCards) ? savedCards : settings?.paymentMethods
  );
  const defaultCard = currentPaymentMethods.find((card) => card.isDefault) || currentPaymentMethods[0];
  const currentSubscription = {
    plan: `${currentPlan?.name || "Professional"} Plan`,
    status: "Active",
    billingCycle: billing === "monthly" ? "Monthly" : "Annual",
    currentPeriodEnds: "May 26, 2026",
    renewsOn: "May 27, 2026",
    amount: billing === "monthly" ? "Current active monthly subscription" : "Current active annual subscription",
  };
  const billingAddress = normalizeBillingAddressValue(settings?.billingAddress);
  const supportedCardBrands = accountCardBrandsByCountry[paymentForm.country] || accountCardBrandsByCountry["United States"];
  const detectedCardBrand = getCardBrand(paymentForm.cardNumber);
  const cardBrandUnavailable =
    detectedCardBrand &&
    detectedCardBrand !== "Card type" &&
    !supportedCardBrands.includes(detectedCardBrand);

  const updatePaymentForm = (key, value) => {
    if (key === "cardNumber") {
      setPaymentForm((prev) => ({ ...prev, cardNumber: formatCardNumber(value) }));
      return;
    }

    if (key === "expiry") {
      setPaymentForm((prev) => ({ ...prev, expiry: formatExpiry(value) }));
      return;
    }

    if (key === "cvc") {
      setPaymentForm((prev) => ({ ...prev, cvc: value.replace(/\D/g, "").slice(0, 4) }));
      return;
    }

    if (key === "zipCode") {
      setPaymentForm((prev) => ({ ...prev, zipCode: value.replace(/[^\dA-Za-z -]/g, "").slice(0, 12) }));
      return;
    }

    setPaymentForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      cardNumber: "",
      expiry: "",
      cvc: "",
      country: "United States",
      zipCode: "",
    });
  };

  const persistPaymentMethods = async (nextCards, successMessage) => {
    try {
      const normalizedSettings = await onSave({ paymentMethods: nextCards });
      setSavedCards(normalizedSettings.paymentMethods);
      if (successMessage) {
        onAction(successMessage);
      }
    } catch (error) {
      onAction(error.message || "Payment methods could not be saved");
    }
  };

  const submitPaymentMethod = (event) => {
    event.preventDefault();
    const digits = paymentForm.cardNumber.replace(/\D/g, "");
    if (digits.length < 12 || paymentForm.expiry.length < 7 || paymentForm.cvc.length < 3 || !paymentForm.zipCode) {
      onAction("Complete all payment method fields");
      return;
    }
    if (cardBrandUnavailable) {
      onAction(`Use a supported card for ${paymentForm.country}`);
      return;
    }

    const brand = detectedCardBrand && detectedCardBrand !== "Card type" ? detectedCardBrand : "Card";

    const nextCards = [
      ...currentPaymentMethods,
      {
        id: `card-${paymentCardSequenceRef.current++}`,
        brand,
        last4: digits.slice(-4),
        expiry: paymentForm.expiry,
        holder: "Client Admin",
        billingAddress: `${paymentForm.country} - ${paymentForm.zipCode}`,
        isDefault: false,
      },
    ];
    setSavedCards(nextCards);
    persistPaymentMethods(nextCards, "Payment method added");
    resetPaymentForm();
    setShowAddPaymentForm(false);
  };

  const makeDefaultCard = (cardId) => {
    const nextCards = currentPaymentMethods.map((card) => ({
      ...card,
      isDefault: card.id === cardId,
    }));
    setSavedCards(nextCards);
    persistPaymentMethods(nextCards, "Default payment method updated");
  };

  const removeCard = (cardId) => {
    if (currentPaymentMethods.length === 1) {
      onAction("Add another payment method before deleting the only card on file");
      return;
    }

    const nextCards = currentPaymentMethods.filter((card) => card.id !== cardId);
    if (!nextCards.some((card) => card.isDefault) && nextCards[0]) {
      nextCards[0] = { ...nextCards[0], isDefault: true };
    }
    setSavedCards(nextCards);
    persistPaymentMethods(nextCards, "Payment method removed");
  };

  return (
    <div>
      <div className="mb-8">
        <h3 className="text-2xl font-bold">Accounts</h3>
        <p className="mt-3 text-base text-slate-600">See your subscription, payment method, default card, and billing address.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Current Subscription</p>
                <h4 className="mt-2 text-lg font-bold text-slate-950">{currentSubscription.plan}</h4>
                <p className="mt-1 text-sm text-slate-600">Your current paid plan and renewal details.</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                {currentSubscription.status}
              </span>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <DetailRow label="Billing cycle" value={currentSubscription.billingCycle} />
              <DetailRow label="Subscription amount" value={currentSubscription.amount} />
              <DetailRow label="Current period ends" value={currentSubscription.currentPeriodEnds} />
              <DetailRow label="Auto renews on" value={currentSubscription.renewsOn} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-violet-700" />
                <h4 className="text-lg font-bold text-slate-950">Payment Methods</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPaymentForm((prev) => !prev)}
                className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
              >
                + Add Payment Method
              </button>
            </div>
            {showAddPaymentForm ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h5 className="text-lg font-semibold text-slate-950">Add payment method</h5>
                  <button
                    type="button"
                    onClick={() => {
                      resetPaymentForm();
                      setShowAddPaymentForm(false);
                    }}
                    className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
                  >
                    Close
                  </button>
                </div>
                <form onSubmit={submitPaymentMethod} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Card number</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={paymentForm.cardNumber}
                        inputMode="numeric"
                        autoComplete="cc-number"
                        onChange={(event) => updatePaymentForm("cardNumber", event.target.value)}
                        placeholder="1234 1234 1234 1234"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-40 text-lg text-slate-950 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
                      />
                      <CardLogoStrip brands={supportedCardBrands} activeBrand={detectedCardBrand} />
                    </div>
                    {cardBrandUnavailable ? (
                      <p className="mt-2 text-sm text-rose-600">
                        {detectedCardBrand} is not available for {paymentForm.country}. Use {supportedCardBrands.join(", ")}.
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Expiration date</label>
                      <input
                        type="text"
                        value={paymentForm.expiry}
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        maxLength={7}
                        onChange={(event) => updatePaymentForm("expiry", event.target.value)}
                        placeholder="MM / YY"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg text-slate-950 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Security code</label>
                      <div className="relative">
                        <input
                          type="password"
                          value={paymentForm.cvc}
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          maxLength={4}
                          onChange={(event) => updatePaymentForm("cvc", event.target.value)}
                          placeholder="CVC"
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-16 text-lg text-slate-950 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
                        />
                        <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-slate-500">
                          <CreditCard className="h-5 w-5" />
                          <span className="text-xs font-bold">123</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Country</label>
                      <select
                        value={paymentForm.country}
                        onChange={(event) => updatePaymentForm("country", event.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 focus:border-slate-400 focus:outline-none"
                      >
                        <option>United States</option>
                        <option>India</option>
                        <option>United Kingdom</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">ZIP code</label>
                      <input
                        type="text"
                        value={paymentForm.zipCode}
                        onChange={(event) => updatePaymentForm("zipCode", event.target.value)}
                        placeholder="12345"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg text-slate-950 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="rounded-xl bg-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetPaymentForm();
                        setShowAddPaymentForm(false);
                      }}
                      className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : null}
            <div className="mt-5 space-y-4">
              {currentPaymentMethods.map((card) => (
                <div key={card.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-slate-950">
                          {card.brand} ending in {card.last4}
                        </p>
                        {card.isDefault ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Default
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-slate-600">Expires {card.expiry} · {card.holder}</p>
                      <p className="mt-3 text-sm text-slate-500">{card.billingAddress}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {!card.isDefault ? (
                        <button
                          type="button"
                          onClick={() => makeDefaultCard(card.id)}
                          className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
                        >
                          Make Default
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removeCard(card.id)}
                        disabled={currentPaymentMethods.length === 1}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-violet-700" />
              <h4 className="text-lg font-bold text-slate-950">Billing Address</h4>
            </div>
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">{billingAddress.company || "Client Billing"}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {billingAddress.line1 || "-"}
                {billingAddress.line2 ? <><br />{billingAddress.line2}</> : null}
                {(billingAddress.city || billingAddress.state || billingAddress.postalCode) ? (
                  <>
                    <br />
                    {[billingAddress.city, billingAddress.state, billingAddress.postalCode].filter(Boolean).join(", ")}
                  </>
                ) : null}
                {billingAddress.country ? <><br />{billingAddress.country}</> : null}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h4 className="text-lg font-bold text-slate-950">Default Payment Method</h4>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The default card is used for subscription renewals. To delete the current default card, first add another card and make that new card the default payment method.
            </p>
            {defaultCard ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-800">
                  Renewal card on file: {defaultCard.brand} ending in {defaultCard.last4}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
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
        <p className="mt-1 text-sm text-blue-800">Keep rates updated whenever project pricing or employee roles change.</p>
        <p className="mt-1 text-sm text-blue-800">Use project-specific rates when certain clients or engagements need separate billing rules.</p>
        <p className="mt-1 text-sm text-blue-800">Consistent rate setup helps keep invoice totals and revenue reporting accurate.</p>
      </div>
    </div>
  );
}

function OvertimeRulesSettings({ rules, onAdd, onEdit, onDelete, onToggle }) {
  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">Overtime Rules Configuration</h3>
          <p className="mt-2 text-sm text-slate-600">Define overtime eligibility, thresholds, and compensation multipliers</p>
        </div>
        <PurpleButton onClick={onAdd}>+ Add Overtime Rule</PurpleButton>
      </div>

      <div className="space-y-4">
        {rules.map((rule) => (
          <section key={rule.id} className="rounded-xl border border-slate-300 bg-white px-5 py-5">
            <div className="flex items-start justify-between gap-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h4 className="text-xl font-bold">{rule.name}</h4>
                  <StatusBadge value={rule.active ? "Active" : "Inactive"} />
                </div>
                <div className="mt-4 grid gap-6 md:grid-cols-3">
                  <InfoBlock label="Threshold (hours/week)" value={rule.threshold} />
                  <InfoBlock label="Pay Multiplier" value={rule.multiplier} />
                  <InfoBlock label="Applies To" value={rule.appliesTo} />
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

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
        <p className="font-semibold text-amber-900">Overtime Rules Information</p>
        <p className="mt-2 text-sm text-amber-800">Rules determine when overtime applies and which multiplier should be used for pay and reporting.</p>
        <p className="mt-1 text-sm text-amber-800">You can create separate rules for standard weekly overtime, weekends, and holidays.</p>
        <p className="mt-1 text-sm text-amber-800">Clear thresholds help managers review extra hours more consistently across teams.</p>
        <p className="mt-1 text-sm text-amber-800">Accurate overtime settings also improve payroll calculations and compliance reporting.</p>
      </div>
    </div>
  );
}

function GeneralSettings({ settings, onSave }) {
  return (
    <form onSubmit={onSave}>
      <h3 className="text-2xl font-bold">General Client Configuration</h3>
      <div className="mt-7 grid gap-x-8 gap-y-6 md:grid-cols-2">
        <Field name="tenantName" label="Client Name *" value={settings.tenantName} />
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
  const [formValues, setFormValues] = useState({
    name: profile.name || "",
    email: profile.email || "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleSubmit = (event) => {
    const nextErrors = {};
    const trimmedName = formValues.name.trim();
    const trimmedEmail = formValues.email.trim();

    if (!trimmedName) {
      nextErrors.name = "Name is required.";
    }

    if (!trimmedEmail) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (Object.keys(nextErrors).length) {
      event.preventDefault();
      setErrors(nextErrors);
      return;
    }

    onSubmit(event);
  };

  return (
    <Modal title="Client Profile" onClose={onClose}>
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

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <ModalField
          name="name"
          label="Name"
          value={formValues.name}
          onChange={(event) => handleChange("name", event.target.value)}
          error={errors.name}
        />
        <ModalField
          name="email"
          label="Email"
          value={formValues.email}
          onChange={(event) => handleChange("email", event.target.value)}
          error={errors.email}
          type="email"
        />
        <ModalActions onClose={onClose} submitLabel="Save Profile" />
      </form>
    </Modal>
  );
}

function UserModal({ item, onClose, onSubmit }) {
  const [formValues, setFormValues] = useState({
    name: item?.name || "",
    email: item?.email || "",
    department: item?.department || "Engineering",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleSubmit = (event) => {
    const nextErrors = {};
    const trimmedName = formValues.name.trim();
    const trimmedEmail = formValues.email.trim();

    if (!trimmedName) {
      nextErrors.name = "Name is required.";
    }

    if (!trimmedEmail) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!formValues.department.trim()) {
      nextErrors.department = "Department is required.";
    }

    if (Object.keys(nextErrors).length) {
      event.preventDefault();
      setErrors(nextErrors);
      return;
    }

    onSubmit(event);
  };

  return (
    <Modal title={item ? "Edit User" : "Add User"} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <ModalField
          name="name"
          label="Name"
          value={formValues.name}
          onChange={(event) => handleChange("name", event.target.value)}
          error={errors.name}
        />
        <ModalField
          name="email"
          label="Email"
          value={formValues.email}
          onChange={(event) => handleChange("email", event.target.value)}
          error={errors.email}
          type="email"
        />
        <ModalSelect name="role" label="Role" defaultValue={item?.role || "Employee"} options={["Admin", "Manager", "Employee"]} />
        <ModalSelect name="status" label="Status" defaultValue={item?.status || "Active"} options={["Active", "Inactive"]} />
        <ModalField
          name="department"
          label="Department"
          value={formValues.department}
          onChange={(event) => handleChange("department", event.target.value)}
          error={errors.department}
        />
        <ModalActions onClose={onClose} submitLabel={item ? "Save User" : "Add User"} />
      </form>
    </Modal>
  );
}

function DepartmentModal({ item, onClose, onSubmit }) {
  const [formValues, setFormValues] = useState({
    name: item?.name || "",
    head: item?.head || "",
    employees: item?.employees || "1 member",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleSubmit = (event) => {
    const nextErrors = {};

    if (!formValues.name.trim()) {
      nextErrors.name = "Department name is required.";
    }

    if (!formValues.head.trim()) {
      nextErrors.head = "Department head is required.";
    }

    if (!formValues.employees.trim()) {
      nextErrors.employees = "Total employees is required.";
    }

    if (Object.keys(nextErrors).length) {
      event.preventDefault();
      setErrors(nextErrors);
      return;
    }

    onSubmit(event);
  };

  return (
    <Modal title={item ? "Edit Department" : "Create Department"} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <ModalField name="name" label="Department Name" value={formValues.name} onChange={(event) => handleChange("name", event.target.value)} error={errors.name} />
        <ModalField name="head" label="Department Head" value={formValues.head} onChange={(event) => handleChange("head", event.target.value)} error={errors.head} />
        <ModalField name="employees" label="Total Employees" value={formValues.employees} onChange={(event) => handleChange("employees", event.target.value)} error={errors.employees} />
        <ModalActions onClose={onClose} submitLabel={item ? "Save Department" : "Create Department"} />
      </form>
    </Modal>
  );
}

function BillingRateModal({ item, onClose, onSubmit }) {
  const [formValues, setFormValues] = useState({
    role: item?.role || "",
    project: item?.project || "All Projects",
    rate: item?.rate || "INR 2,500/hour",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleSubmit = (event) => {
    const nextErrors = {};

    if (!formValues.role.trim()) {
      nextErrors.role = "Role is required.";
    }

    if (!formValues.project.trim()) {
      nextErrors.project = "Project is required.";
    }

    if (!formValues.rate.trim()) {
      nextErrors.rate = "Rate is required.";
    }

    if (Object.keys(nextErrors).length) {
      event.preventDefault();
      setErrors(nextErrors);
      return;
    }

    onSubmit(event);
  };

  return (
    <Modal title={item ? "Edit Billing Rate" : "Add Billing Rate"} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <ModalField name="role" label="Role" value={formValues.role} onChange={(event) => handleChange("role", event.target.value)} error={errors.role} />
        <ModalField name="project" label="Project" value={formValues.project} onChange={(event) => handleChange("project", event.target.value)} error={errors.project} />
        <ModalField name="rate" label="Rate" value={formValues.rate} onChange={(event) => handleChange("rate", event.target.value)} error={errors.rate} />
        <ModalSelect name="type" label="Type" defaultValue={item?.type || "Hourly"} options={["Hourly", "Daily", "Monthly"]} />
        <ModalActions onClose={onClose} submitLabel={item ? "Save Billing Rate" : "Add Billing Rate"} />
      </form>
    </Modal>
  );
}

function OvertimeRuleModal({ item, onClose, onSubmit }) {
  const [formValues, setFormValues] = useState({
    name: item?.name || "",
    threshold: item?.threshold || "After 40 hours",
    multiplier: item?.multiplier || "1.5x",
    appliesTo: item?.appliesTo || "All Employees",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleSubmit = (event) => {
    const nextErrors = {};

    if (!formValues.name.trim()) {
      nextErrors.name = "Rule name is required.";
    }

    if (!formValues.threshold.trim()) {
      nextErrors.threshold = "Threshold is required.";
    }

    if (!formValues.multiplier.trim()) {
      nextErrors.multiplier = "Pay multiplier is required.";
    }

    if (!formValues.appliesTo.trim()) {
      nextErrors.appliesTo = "Applies to is required.";
    }

    if (Object.keys(nextErrors).length) {
      event.preventDefault();
      setErrors(nextErrors);
      return;
    }

    onSubmit(event);
  };

  return (
    <Modal title={item ? "Edit Overtime Rule" : "Add Overtime Rule"} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <ModalField name="name" label="Rule Name" value={formValues.name} onChange={(event) => handleChange("name", event.target.value)} error={errors.name} />
        <ModalField name="threshold" label="Threshold" value={formValues.threshold} onChange={(event) => handleChange("threshold", event.target.value)} error={errors.threshold} />
        <ModalField name="multiplier" label="Pay Multiplier" value={formValues.multiplier} onChange={(event) => handleChange("multiplier", event.target.value)} error={errors.multiplier} />
        <ModalField name="appliesTo" label="Applies To" value={formValues.appliesTo} onChange={(event) => handleChange("appliesTo", event.target.value)} error={errors.appliesTo} />
        <ModalActions onClose={onClose} submitLabel={item ? "Save Overtime Rule" : "Add Overtime Rule"} />
      </form>
    </Modal>
  );
}

function PolicyModal({ item, onClose, onSubmit }) {
  const [formValues, setFormValues] = useState({
    title: item?.title || "",
    description: item?.description || "",
    appliesTo: item?.appliesTo || "All users",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleSubmit = (event) => {
    const nextErrors = {};

    if (!formValues.title.trim()) {
      nextErrors.title = "Policy name is required.";
    }

    if (!formValues.description.trim()) {
      nextErrors.description = "Description is required.";
    }

    if (Object.keys(nextErrors).length) {
      event.preventDefault();
      setErrors(nextErrors);
      return;
    }

    onSubmit(event);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4">
      <button type="button" className="absolute inset-0" aria-label="Close policy modal" onClick={onClose} />
      <section className="relative z-10 w-full max-w-3xl rounded-2xl bg-white px-10 py-9 shadow-2xl">
        <div className="mb-7 flex items-center justify-between">
          <h3 className="text-3xl font-bold tracking-tight text-slate-950">{item ? "Edit Policy" : "Add New Policy"}</h3>
          <button type="button" onClick={onClose} className="text-3xl leading-none text-slate-500 hover:text-slate-800">x</button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <label className="block">
            <span className="mb-3 block text-base font-semibold text-slate-800">Policy Name *</span>
            <input
              name="title"
              value={formValues.title}
              onChange={(event) => handleChange("title", event.target.value)}
              aria-invalid={errors.title ? "true" : "false"}
              className={`h-12 w-full rounded-lg border px-4 text-base outline-none focus:ring-2 ${
                errors.title
                  ? "border-red-500 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-100"
                  : "border-slate-300 focus:border-violet-600 focus:ring-violet-100"
              }`}
            />
            {errors.title ? <span className="mt-2 block text-sm font-medium text-red-600">{errors.title}</span> : null}
          </label>

          <label className="block">
            <span className="mb-3 block text-base font-semibold text-slate-800">Description *</span>
            <textarea
              name="description"
              rows={5}
              value={formValues.description}
              onChange={(event) => handleChange("description", event.target.value)}
              aria-invalid={errors.description ? "true" : "false"}
              className={`w-full rounded-lg border px-4 py-3 text-base outline-none focus:ring-2 ${
                errors.description
                  ? "border-red-500 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-100"
                  : "border-slate-300 focus:border-violet-600 focus:ring-violet-100"
              }`}
            />
            {errors.description ? <span className="mt-2 block text-sm font-medium text-red-600">{errors.description}</span> : null}
          </label>

          <label className="block">
            <span className="mb-3 block text-base font-semibold text-slate-800">Applies To *</span>
            <select
              name="appliesTo"
              value={formValues.appliesTo}
              onChange={(event) => handleChange("appliesTo", event.target.value)}
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
            <PurpleButton type="submit">{item ? "Save Policy" : "Add Policy"}</PurpleButton>
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

function ModalField({ name, label, defaultValue, value, onChange, error, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        {...(value !== undefined ? { value, onChange } : { defaultValue })}
        aria-invalid={error ? "true" : "false"}
        className={`h-11 w-full rounded-lg border px-3 text-base outline-none transition ${
          error
            ? "border-red-500 bg-red-50 text-red-900 placeholder:text-red-300 focus:border-red-500"
            : "border-slate-300 focus:border-slate-400"
        }`}
      />
      {error ? <span className="mt-2 block text-sm font-medium text-red-600">{error}</span> : null}
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
