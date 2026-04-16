"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Bell,
  Building2,
  Clock,
  CreditCard,
  Download,
  LogOut,
  Plus,
  RefreshCcw,
  Save,
  Settings,
  Shield,
  Users,
  X,
} from "lucide-react";
import RouteGuard from "@/components/auth/RouteGuard";
import HelpButton from "@/components/support/HelpButton";
import { clearSession } from "@/lib/auth";
import { formatCurrency, tenantApi } from "@/lib/adminTenantApi";
import { getClientNotifications, markClientNotificationsRead, subscribeToClientNotifications } from "@/lib/supportTickets";

const navItems = [
  "Dashboard",
  "Users",
  "Departments",
  "Policies",
  "Billing & Subscription",
  "Audit Logs",
  "Settings",
];

const settingsTabs = ["General Settings", "Billing Rates", "Overtime Rules", "Branding"];
const defaultUserForm = { id: null, name: "", email: "", role: "Employee", department: "General", status: "Active" };
const defaultDepartmentForm = { id: null, name: "", head: "", status: "Active" };
const defaultPolicyForm = { id: null, title: "", description: "", appliesTo: "All users" };
const defaultBillingRateForm = { id: null, role: "", project: "All Projects", rate: "2500", type: "Hourly" };
const defaultOvertimeRuleForm = { id: null, title: "", threshold: "After 40 hours", multiplier: "1.5x", appliesTo: "All Employees" };
const defaultSubscriptionForm = { currentPlan: "Enterprise", billingCycle: "Annual", licenses: 0 };
const defaultGeneralSettingsForm = { tenantName: "", timeZone: "", currency: "", weekStart: "", payPeriod: "", maxHours: "" };
const defaultBrandingForm = { logoText: "", primary: "", secondary: "", footerNotes: "" };

export default function DashboardPage() {
  const router = useRouter();
  const [active, setActive] = useState("Dashboard");
  const [settingsTab, setSettingsTab] = useState("General Settings");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [allNotifications, setAllNotifications] = useState(() => getClientNotifications());
  const [dialog, setDialog] = useState(null);
  const [userForm, setUserForm] = useState(defaultUserForm);
  const [departmentForm, setDepartmentForm] = useState(defaultDepartmentForm);
  const [policyForm, setPolicyForm] = useState(defaultPolicyForm);
  const [billingRateForm, setBillingRateForm] = useState(defaultBillingRateForm);
  const [overtimeRuleForm, setOvertimeRuleForm] = useState(defaultOvertimeRuleForm);
  const [subscriptionForm, setSubscriptionForm] = useState(defaultSubscriptionForm);
  const [generalSettingsForm, setGeneralSettingsForm] = useState(defaultGeneralSettingsForm);
  const [brandingForm, setBrandingForm] = useState(defaultBrandingForm);

  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [billingRates, setBillingRates] = useState([]);
  const [overtimeRules, setOvertimeRules] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [tenantSettings, setTenantSettings] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  const tenantName = tenantSettings?.organization?.tenantName || overview?.organization || "Tenant";
  const unreadNotifications = useMemo(
    () => allNotifications.filter((item) => item.clientName === tenantName && !item.read).length,
    [allNotifications, tenantName]
  );

  useEffect(() => {
    const unsubscribe = subscribeToClientNotifications(setAllNotifications);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard(showRefreshState = false) {
    if (showRefreshState) setRefreshing(true);
    else setLoading(true);
    setError("");

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

      setOverview(overviewData);
      setUsers(usersData);
      setDepartments(departmentsData);
      setPolicies(policiesData);
      setBillingRates(billingRatesData);
      setOvertimeRules(overtimeRulesData);
      setSubscription(subscriptionData);
      setTenantSettings(settingsData);
      setAdminProfile(settingsData.adminProfile || overviewData.adminProfile || null);
      setAuditLogs(auditLogsData);
    } catch (err) {
      setError(err.message || "Failed to load tenant dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function notify(message) {
    setToast(message);
  }

  function toggleNotifications() {
    const nextValue = !showNotifications;
    setShowNotifications(nextValue);
    if (nextValue && unreadNotifications > 0) {
      markClientNotificationsRead(tenantName);
      setAllNotifications(getClientNotifications());
    }
  }

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  function closeDialog() {
    setDialog(null);
  }

  function openUserDialog(user = null) {
    setUserForm(
      user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            status: user.status,
          }
        : { ...defaultUserForm, department: departments[0]?.name || "General" }
    );
    setDialog("user");
  }

  async function submitUserForm() {
    if (!userForm.name.trim() || !userForm.email.trim()) {
      notify("Name and email are required");
      return;
    }

    try {
      const payload = {
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        department: userForm.department,
        status: userForm.status,
      };
      const created = userForm.id
        ? await tenantApi.updateUser(userForm.id, payload)
        : await tenantApi.createUser(payload);
      if (userForm.id) {
        setUsers((prev) => prev.map((item) => (item.id === userForm.id ? created : item)));
        notify("User updated");
      } else {
        setUsers((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
        notify("User saved to PostgreSQL");
      }
      closeDialog();
      loadDashboard(true);
    } catch (err) {
      notify(err.message || "Could not save user");
    }
  }

  async function handleToggleUser(user) {
    const nextStatus = user.status === "Active" ? "Inactive" : "Active";
    if (!window.confirm(`${nextStatus} ${user.name}?`)) return;

    try {
      const updated = await tenantApi.updateUser(user.id, { status: nextStatus });
      setUsers((prev) => prev.map((item) => (item.id === user.id ? updated : item)));
      notify(`User ${nextStatus.toLowerCase()}`);
      loadDashboard(true);
    } catch (err) {
      notify(err.message || "Could not update user");
    }
  }

  async function handleDeleteUser(user) {
    if (!window.confirm(`Delete ${user.name}?`)) return;

    try {
      await tenantApi.deleteUser(user.id);
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      notify("User deleted");
      loadDashboard(true);
    } catch (err) {
      notify(err.message || "Could not delete user");
    }
  }

  function openDepartmentDialog(department = null) {
    setDepartmentForm(
      department
        ? {
            id: department.id,
            name: department.name,
            head: department.head || "",
            status: department.status,
          }
        : defaultDepartmentForm
    );
    setDialog("department");
  }

  async function submitDepartmentForm() {
    if (!departmentForm.name.trim()) {
      notify("Department name is required");
      return;
    }

    try {
      const payload = {
        name: departmentForm.name,
        head: departmentForm.head ? Number(departmentForm.head) : null,
        status: departmentForm.status,
      };
      const result = departmentForm.id
        ? await tenantApi.updateDepartment(departmentForm.id, payload)
        : await tenantApi.createDepartment(payload);
      setDepartments((prev) =>
        departmentForm.id ? prev.map((item) => (item.id === departmentForm.id ? result : item)) : [...prev, result]
      );
      notify(departmentForm.id ? "Department updated" : "Department saved to PostgreSQL");
      closeDialog();
      loadDashboard(true);
    } catch (err) {
      notify(err.message || "Could not save department");
    }
  }

  async function handleDeleteDepartment(department) {
    if (!window.confirm(`Delete ${department.name}?`)) return;

    try {
      await tenantApi.deleteDepartment(department.id);
      setDepartments((prev) => prev.filter((item) => item.id !== department.id));
      notify("Department deleted");
      loadDashboard(true);
    } catch (err) {
      notify(err.message || "Could not delete department");
    }
  }

  function openPolicyDialog(policy = null) {
    setPolicyForm(
      policy
        ? {
            id: policy.id,
            title: policy.title,
            description: policy.description || policy.desc,
            appliesTo: policy.applies_to || policy.applies,
          }
        : defaultPolicyForm
    );
    setDialog("policy");
  }

  async function submitPolicyForm() {
    if (!policyForm.title.trim() || !policyForm.description.trim()) {
      notify("Policy title and description are required");
      return;
    }

    try {
      const payload = {
        title: policyForm.title,
        description: policyForm.description,
        appliesTo: policyForm.appliesTo,
      };
      const result = policyForm.id
        ? await tenantApi.updatePolicy(policyForm.id, payload)
        : await tenantApi.createPolicy(payload);
      setPolicies((prev) => (policyForm.id ? prev.map((item) => (item.id === policyForm.id ? result : item)) : [...prev, result]));
      notify(policyForm.id ? "Policy updated" : "Policy saved to PostgreSQL");
      closeDialog();
      loadDashboard(true);
    } catch (err) {
      notify(err.message || "Could not save policy");
    }
  }

  async function handleTogglePolicy(policy) {
    try {
      const updated = await tenantApi.updatePolicy(policy.id, { enabled: !policy.enabled });
      setPolicies((prev) => prev.map((item) => (item.id === policy.id ? updated : item)));
      notify("Policy updated");
    } catch (err) {
      notify(err.message || "Could not update policy");
    }
  }

  async function handleDeletePolicy(policy) {
    if (!window.confirm(`Delete ${policy.title}?`)) return;

    try {
      await tenantApi.deletePolicy(policy.id);
      setPolicies((prev) => prev.filter((item) => item.id !== policy.id));
      notify("Policy deleted");
      loadDashboard(true);
    } catch (err) {
      notify(err.message || "Could not delete policy");
    }
  }

  function openBillingRateDialog(rate = null) {
    setBillingRateForm(
      rate
        ? {
            id: rate.id,
            role: rate.role,
            project: rate.project,
            rate: String(rate.hourly_rate ?? rate.rate ?? ""),
            type: rate.type,
          }
        : defaultBillingRateForm
    );
    setDialog("billingRate");
  }

  async function submitBillingRateForm() {
    if (!billingRateForm.role.trim() || !billingRateForm.rate) {
      notify("Role and rate are required");
      return;
    }

    try {
      const payload = {
        role: billingRateForm.role,
        project: billingRateForm.project,
        rate: billingRateForm.rate,
        type: billingRateForm.type,
      };
      const result = billingRateForm.id
        ? await tenantApi.updateBillingRate(billingRateForm.id, payload)
        : await tenantApi.createBillingRate(payload);
      setBillingRates((prev) => (billingRateForm.id ? prev.map((item) => (item.id === billingRateForm.id ? result : item)) : [...prev, result]));
      notify(billingRateForm.id ? "Billing rate updated" : "Billing rate saved");
      closeDialog();
      loadDashboard(true);
    } catch (err) {
      notify(err.message || "Could not save billing rate");
    }
  }

  async function handleDeleteBillingRate(rate) {
    if (!window.confirm(`Delete ${rate.role} / ${rate.project}?`)) return;

    try {
      await tenantApi.deleteBillingRate(rate.id);
      setBillingRates((prev) => prev.filter((item) => item.id !== rate.id));
      notify("Billing rate deleted");
      loadDashboard(true);
    } catch (err) {
      notify(err.message || "Could not delete billing rate");
    }
  }

  function openOvertimeRuleDialog(rule = null) {
    setOvertimeRuleForm(
      rule
        ? {
            id: rule.id,
            title: rule.title,
            threshold: rule.threshold,
            multiplier: rule.multiplier,
            appliesTo: rule.applies_to,
          }
        : defaultOvertimeRuleForm
    );
    setDialog("overtimeRule");
  }

  async function submitOvertimeRuleForm() {
    if (!overtimeRuleForm.title.trim()) {
      notify("Rule title is required");
      return;
    }

    try {
      const payload = {
        title: overtimeRuleForm.title,
        threshold: overtimeRuleForm.threshold,
        multiplier: overtimeRuleForm.multiplier,
        appliesTo: overtimeRuleForm.appliesTo,
      };
      const result = overtimeRuleForm.id
        ? await tenantApi.updateOvertimeRule(overtimeRuleForm.id, payload)
        : await tenantApi.createOvertimeRule(payload);
      setOvertimeRules((prev) => (overtimeRuleForm.id ? prev.map((item) => (item.id === overtimeRuleForm.id ? result : item)) : [...prev, result]));
      notify(overtimeRuleForm.id ? "Overtime rule updated" : "Overtime rule saved");
      closeDialog();
      loadDashboard(true);
    } catch (err) {
      notify(err.message || "Could not save overtime rule");
    }
  }

  async function handleToggleOvertimeRule(rule) {
    try {
      const updated = await tenantApi.updateOvertimeRule(rule.id, { active: !rule.active });
      setOvertimeRules((prev) => prev.map((item) => (item.id === rule.id ? updated : item)));
      notify("Overtime rule updated");
    } catch (err) {
      notify(err.message || "Could not update overtime rule");
    }
  }

  async function handleDeleteOvertimeRule(rule) {
    if (!window.confirm(`Delete ${rule.title}?`)) return;

    try {
      await tenantApi.deleteOvertimeRule(rule.id);
      setOvertimeRules((prev) => prev.filter((item) => item.id !== rule.id));
      notify("Overtime rule deleted");
      loadDashboard(true);
    } catch (err) {
      notify(err.message || "Could not delete overtime rule");
    }
  }

  function openSubscriptionDialog() {
    if (!subscription) return;
    setSubscriptionForm({
      currentPlan: subscription.currentPlan,
      billingCycle: subscription.billingCycle,
      licenses: subscription.licenses,
    });
    setDialog("subscription");
  }

  async function submitSubscriptionForm() {
    try {
      const updated = await tenantApi.updateSubscription({
        currentPlan: subscriptionForm.currentPlan,
        billingCycle: subscriptionForm.billingCycle,
        licenses: Number(subscriptionForm.licenses),
      });
      setSubscription(updated);
      notify("Subscription updated");
      closeDialog();
      loadDashboard(true);
    } catch (err) {
      notify(err.message || "Could not update subscription");
    }
  }

  function openGeneralSettingsDialog() {
    const organization = tenantSettings?.organization;
    if (!organization) return;
    setGeneralSettingsForm({
      tenantName: organization.tenantName || "",
      timeZone: organization.timeZone || "",
      currency: organization.currency || "",
      weekStart: organization.weekStart || "",
      payPeriod: organization.payPeriod || "",
      maxHours: organization.maxHours || "",
    });
    setDialog("generalSettings");
  }

  async function submitGeneralSettingsForm() {
    try {
      const updated = await tenantApi.updateSettings({
        tenantName: generalSettingsForm.tenantName,
        timeZone: generalSettingsForm.timeZone,
        currency: generalSettingsForm.currency,
        weekStart: generalSettingsForm.weekStart,
        payPeriod: generalSettingsForm.payPeriod,
        maxHours: generalSettingsForm.maxHours,
      });
      setTenantSettings(updated);
      setAdminProfile(updated.adminProfile || adminProfile);
      notify("General settings updated");
      closeDialog();
      loadDashboard(true);
    } catch (err) {
      notify(err.message || "Could not update settings");
    }
  }

  function openBrandingDialog() {
    const organization = tenantSettings?.organization;
    if (!organization) return;
    setBrandingForm({
      logoText: organization.logoText || "",
      primary: organization.primary || "",
      secondary: organization.secondary || "",
      footerNotes: organization.footerNotes || "",
    });
    setDialog("branding");
  }

  async function submitBrandingForm() {
    try {
      const updated = await tenantApi.updateSettings(brandingForm);
      setTenantSettings(updated);
      notify("Branding updated");
      closeDialog();
    } catch (err) {
      notify(err.message || "Could not update branding");
    }
  }

  function downloadInvoice() {
    if (!subscription) return;
    const organization = tenantSettings?.organization;
    const amount = Number(subscription.monthlyRevenue || 0);
    const invoiceId = `INV-${new Date().getFullYear()}-${String(subscription.id || 1).padStart(3, "0")}`;
    const currencyCode = organization?.currency === "USD" ? "USD" : "INR";
    const doc = new jsPDF();

    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 34, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(21);
    doc.text("Tenant Invoice", 14, 18);
    doc.setFontSize(10);
    doc.text(`${tenantName} subscription summary`, 14, 26);

    doc.setTextColor(17, 24, 39);
    doc.setFontSize(11);
    doc.text(`Invoice: ${invoiceId}`, 14, 48);
    doc.text(`Plan: ${subscription.currentPlan}`, 14, 56);
    doc.text(`Billing Cycle: ${subscription.billingCycle}`, 14, 64);
    doc.text(`Renewal Date: ${subscription.renewalDate}`, 14, 72);
    doc.text(`Admin Contact: ${adminProfile?.email || "-"}`, 14, 80);

    autoTable(doc, {
      startY: 90,
      head: [["Description", "Qty", "Unit Amount", "Total"]],
      body: [[
        `${subscription.currentPlan} plan`,
        String(subscription.licenses),
        formatCurrency(amount, currencyCode),
        formatCurrency(amount, currencyCode),
      ]],
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235] },
    });

    doc.setFontSize(10);
    doc.text(organization?.footerNotes || "Generated from tenant dashboard.", 14, (doc.lastAutoTable?.finalY || 120) + 20, {
      maxWidth: 180,
    });
    doc.save(`${invoiceId}.pdf`);
    notify("Invoice downloaded");
  }

  const notificationItems = allNotifications.filter((item) => item.clientName === tenantName);
  const organization = tenantSettings?.organization;

  return (
    <RouteGuard allowedRoles={["admin", "tenant"]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {toast ? <div className="fixed right-5 top-5 z-50 rounded-xl bg-slate-900 px-4 py-2 text-sm text-white">{toast}</div> : null}

        <div className="flex min-h-screen">
          <aside className="w-72 border-r border-slate-200 bg-white/90 px-6 py-8 backdrop-blur">
            <div className="mb-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg">
                <Building2 className="h-7 w-7" />
              </div>
              <h1 className="mt-4 text-2xl font-semibold text-slate-900">{tenantName}</h1>
              <p className="mt-1 text-sm text-slate-500">Tenant workspace backed by PostgreSQL</p>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setActive(item)}
                  className={`flex w-full items-center rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                    active === item
                      ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {item}
                </button>
              ))}
            </nav>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Admin</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{adminProfile?.name || "Tenant Admin"}</p>
              <p className="text-sm text-slate-500">{adminProfile?.email || "No email"}</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </aside>

          <main className="flex-1 px-6 py-8 md:px-10">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-700">Tenant Admin</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">{active}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Tenant and admin mock data is now loading from PostgreSQL-backed APIs.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={toggleNotifications}
                  className="relative rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 hover:bg-slate-50"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 ? (
                    <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                      {unreadNotifications}
                    </span>
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => loadDashboard(true)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>

            {showNotifications ? (
              <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Tenant Notifications</h3>
                    <p className="text-sm text-slate-500">Support updates tied to this tenant</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      markClientNotificationsRead(tenantName);
                      setAllNotifications(getClientNotifications());
                    }}
                    className="text-sm font-medium text-blue-700"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {notificationItems.length === 0 ? <p className="text-sm text-slate-500">No notifications yet.</p> : null}
                  {notificationItems.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                      <p className="mt-2 text-xs text-slate-500">{new Date(item.time).toLocaleString("en-IN")}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {error ? <p className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            {loading ? <p className="text-sm text-slate-600">Loading tenant data...</p> : null}

            {!loading && active === "Dashboard" ? (
              <div className="space-y-8">
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  <StatCard icon={Users} label="Total Users" value={overview?.totalUsers || 0} sub={`${overview?.activeUsers || 0} active`} />
                  <StatCard icon={Shield} label="Departments" value={overview?.activeDepartments || 0} sub={`${overview?.pendingDepartments || 0} pending`} />
                  <StatCard icon={CreditCard} label="Plan" value={overview?.currentPlan || "-"} sub={`${overview?.licenses || 0} licenses`} />
                  <StatCard icon={Clock} label="Usage" value={`${overview?.usagePercent || 0}%`} sub={formatCurrency(overview?.monthlyRevenue || 0)} />
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                  <Panel title="Tenant Summary" subtitle="Persisted organization data from PostgreSQL">
                    <div className="grid gap-4 md:grid-cols-2">
                      <InfoTile label="Organization" value={tenantName} />
                      <InfoTile label="Admin Email" value={adminProfile?.email || "-"} />
                      <InfoTile label="Time Zone" value={organization?.timeZone || "-"} />
                      <InfoTile label="Currency" value={organization?.currency || "-"} />
                      <InfoTile label="Billing Cycle" value={subscription?.billingCycle || "-"} />
                      <InfoTile label="Renewal Date" value={subscription?.renewalDate || "-"} />
                    </div>
                  </Panel>

                  <Panel title="Recent Audit Activity" subtitle="Latest system actions">
                    <div className="space-y-3">
                      {auditLogs.slice(0, 5).map((log) => (
                        <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-900">{log.action}</p>
                          <p className="mt-1 text-sm text-slate-600">{log.resource}</p>
                          <p className="mt-1 text-xs text-slate-500">{log.timestamp}</p>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </div>
              </div>
            ) : null}

            {!loading && active === "Users" ? (
              <Panel title="Tenant Users" subtitle="Create and manage users stored in PostgreSQL" action={<ActionButton icon={Plus} label="Add User" onClick={() => openUserDialog()} />}>
                <DataTable
                  columns={["Name", "Email", "Role", "Department", "Status", "Actions"]}
                  rows={users.map((user) => [
                    user.name,
                    user.email,
                    user.role,
                    user.department,
                    <StatusPill key={`status-${user.id}`} value={user.status} />,
                    <ActionRow
                      key={`actions-${user.id}`}
                      actions={[
                        { label: "Edit", onClick: () => openUserDialog(user) },
                        { label: user.status === "Active" ? "Deactivate" : "Activate", onClick: () => handleToggleUser(user) },
                        { label: "Delete", onClick: () => handleDeleteUser(user), danger: true },
                      ]}
                    />,
                  ])}
                />
              </Panel>
            ) : null}

            {!loading && active === "Departments" ? (
              <Panel
                title="Departments"
                subtitle="Department records are persisted and served by the backend"
                action={<ActionButton icon={Plus} label="Add Department" onClick={() => openDepartmentDialog()} />}
              >
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {departments.map((department) => (
                    <div key={department.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{department.name}</h3>
                          <p className="mt-1 text-sm text-slate-500">{department.head_name || "No head assigned"}</p>
                        </div>
                        <StatusPill value={department.status} />
                      </div>
                      <p className="mt-4 text-sm text-slate-600">{department.employees}</p>
                      <p className="mt-1 text-xs text-slate-500">{department.created}</p>
                      <div className="mt-5 flex gap-2">
                        <MiniButton label="Edit" onClick={() => openDepartmentDialog(department)} />
                        <MiniButton label="Delete" onClick={() => handleDeleteDepartment(department)} danger />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            ) : null}

            {!loading && active === "Policies" ? (
              <Panel title="Policies" subtitle="Policy definitions come from tenant policy records" action={<ActionButton icon={Plus} label="Add Policy" onClick={() => openPolicyDialog()} />}>
                <div className="space-y-4">
                  {policies.map((policy) => (
                    <div key={policy.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{policy.title}</h3>
                          <p className="mt-2 text-sm text-slate-600">{policy.desc}</p>
                          <p className="mt-2 text-xs text-slate-500">
                            Applies to {policy.applies} • Updated {policy.lastUpdated}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <MiniButton label="Edit" onClick={() => openPolicyDialog(policy)} />
                          <MiniButton label={policy.enabled ? "Disable" : "Enable"} onClick={() => handleTogglePolicy(policy)} />
                          <MiniButton label="Delete" onClick={() => handleDeletePolicy(policy)} danger />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            ) : null}

            {!loading && active === "Billing & Subscription" ? (
              <div className="space-y-8">
                <Panel
                  title="Subscription"
                  subtitle="Plan and billing data persisted in PostgreSQL"
                  action={<ActionButton icon={Save} label="Update Subscription" onClick={openSubscriptionDialog} />}
                >
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <InfoTile label="Current Plan" value={subscription?.currentPlan || "-"} />
                    <InfoTile label="Billing Cycle" value={subscription?.billingCycle || "-"} />
                    <InfoTile label="Licenses" value={subscription?.licenses || 0} />
                    <InfoTile label="Monthly Revenue" value={formatCurrency(subscription?.monthlyRevenue || 0)} />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <ActionButton icon={Download} label="Download Invoice" onClick={downloadInvoice} />
                  </div>
                </Panel>

                <Panel
                  title="Billing Rates"
                  subtitle="Rates stored in tenant billing tables"
                  action={<ActionButton icon={Plus} label="Add Rate" onClick={() => openBillingRateDialog()} />}
                >
                  <DataTable
                    columns={["Role", "Project", "Rate", "Type", "Actions"]}
                    rows={billingRates.map((rate) => [
                      rate.role,
                      rate.project,
                      rate.rate,
                      rate.type,
                      <ActionRow
                        key={`rate-${rate.id}`}
                        actions={[
                          { label: "Edit", onClick: () => openBillingRateDialog(rate) },
                          { label: "Delete", onClick: () => handleDeleteBillingRate(rate), danger: true },
                        ]}
                      />,
                    ])}
                  />
                </Panel>
              </div>
            ) : null}

            {!loading && active === "Audit Logs" ? (
              <Panel title="Audit Logs" subtitle="Recent tenant actions written by backend workflows">
                <DataTable
                  columns={["Timestamp", "User", "Action", "Resource", "Details"]}
                  rows={auditLogs.map((log) => [log.timestamp, log.user, log.action, log.resource, log.details])}
                />
              </Panel>
            ) : null}

            {!loading && active === "Settings" ? (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {settingsTabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setSettingsTab(tab)}
                      className={`rounded-2xl px-4 py-2 text-sm font-medium ${
                        settingsTab === tab ? "bg-blue-600 text-white" : "bg-white text-slate-700"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {settingsTab === "General Settings" ? (
                  <Panel title="General Settings" subtitle="Organization settings stored in PostgreSQL" action={<ActionButton icon={Save} label="Save" onClick={openGeneralSettingsDialog} />}>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <InfoTile label="Tenant Name" value={organization?.tenantName || "-"} />
                      <InfoTile label="Time Zone" value={organization?.timeZone || "-"} />
                      <InfoTile label="Currency" value={organization?.currency || "-"} />
                      <InfoTile label="Week Start" value={organization?.weekStart || "-"} />
                      <InfoTile label="Pay Period" value={organization?.payPeriod || "-"} />
                      <InfoTile label="Max Hours" value={organization?.maxHours || "-"} />
                    </div>
                  </Panel>
                ) : null}

                {settingsTab === "Billing Rates" ? (
                  <Panel title="Billing Rates" subtitle="Quick view of configured tenant rates">
                    <DataTable
                      columns={["Role", "Project", "Rate", "Type"]}
                      rows={billingRates.map((rate) => [rate.role, rate.project, rate.rate, rate.type])}
                    />
                  </Panel>
                ) : null}

                {settingsTab === "Overtime Rules" ? (
                  <Panel title="Overtime Rules" subtitle="Rules are loaded from the overtime rules table" action={<ActionButton icon={Plus} label="Add Rule" onClick={() => openOvertimeRuleDialog()} />}>
                    <div className="space-y-4">
                      {overtimeRules.map((rule) => (
                        <div key={rule.id} className="rounded-3xl border border-slate-200 bg-white p-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900">{rule.title}</h3>
                              <p className="mt-1 text-sm text-slate-600">
                                {rule.threshold} • {rule.multiplier} • {rule.applies_to}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <MiniButton label="Edit" onClick={() => openOvertimeRuleDialog(rule)} />
                              <MiniButton label={rule.active ? "Disable" : "Enable"} onClick={() => handleToggleOvertimeRule(rule)} />
                              <MiniButton label="Delete" onClick={() => handleDeleteOvertimeRule(rule)} danger />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Panel>
                ) : null}

                {settingsTab === "Branding" ? (
                  <Panel title="Branding" subtitle="Brand colors and footer notes stored on the tenant organization" action={<ActionButton icon={Settings} label="Update Branding" onClick={openBrandingDialog} />}>
                    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
                      <div className="space-y-4">
                        <InfoTile label="Logo Text" value={organization?.logoText || "-"} />
                        <InfoTile label="Primary Color" value={organization?.primary || "-"} />
                        <InfoTile label="Secondary Color" value={organization?.secondary || "-"} />
                      </div>
                      <div
                        className="rounded-3xl p-6 text-white shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${organization?.primary || "#2563eb"}, ${organization?.secondary || "#4338ca"})` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-semibold">
                            {organization?.logoText || "TN"}
                          </div>
                          <div>
                            <p className="text-sm uppercase tracking-[0.2em] text-white/70">Invoice Footer</p>
                            <p className="mt-2 text-sm leading-6 text-white/90">{organization?.footerNotes || "No footer notes configured."}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Panel>
                ) : null}
              </div>
            ) : null}
          </main>
        </div>

        <FormModal
          open={dialog === "user"}
          title={userForm.id ? "Edit User" : "Add User"}
          description="Create or update a tenant user with proper form fields."
          onClose={closeDialog}
          onSubmit={submitUserForm}
          submitLabel={userForm.id ? "Save User" : "Create User"}
        >
          <FormGrid>
            <TextInput label="Full Name" value={userForm.name} onChange={(value) => setUserForm((prev) => ({ ...prev, name: value }))} />
            <TextInput label="Email" type="email" value={userForm.email} onChange={(value) => setUserForm((prev) => ({ ...prev, email: value }))} />
            <SelectInput label="Role" value={userForm.role} onChange={(value) => setUserForm((prev) => ({ ...prev, role: value }))} options={["Employee", "Manager", "Tenant", "Admin", "Finance"]} />
            <SelectInput label="Status" value={userForm.status} onChange={(value) => setUserForm((prev) => ({ ...prev, status: value }))} options={["Active", "Inactive"]} />
            <TextInput label="Department" value={userForm.department} onChange={(value) => setUserForm((prev) => ({ ...prev, department: value }))} />
          </FormGrid>
        </FormModal>

        <FormModal
          open={dialog === "department"}
          title={departmentForm.id ? "Edit Department" : "Add Department"}
          description="Manage department details for this tenant."
          onClose={closeDialog}
          onSubmit={submitDepartmentForm}
          submitLabel={departmentForm.id ? "Save Department" : "Create Department"}
        >
          <FormGrid>
            <TextInput label="Department Name" value={departmentForm.name} onChange={(value) => setDepartmentForm((prev) => ({ ...prev, name: value }))} />
            <SelectInput
              label="Department Head"
              value={String(departmentForm.head)}
              onChange={(value) => setDepartmentForm((prev) => ({ ...prev, head: value }))}
              options={["", ...users.map((user) => String(user.id))]}
              labels={["No head assigned", ...users.map((user) => `${user.name} (${user.id})`)]}
            />
            <SelectInput label="Status" value={departmentForm.status} onChange={(value) => setDepartmentForm((prev) => ({ ...prev, status: value }))} options={["Active", "Pending", "Inactive"]} />
          </FormGrid>
        </FormModal>

        <FormModal
          open={dialog === "policy"}
          title={policyForm.id ? "Edit Policy" : "Add Policy"}
          description="Update tenant rules with a structured policy form."
          onClose={closeDialog}
          onSubmit={submitPolicyForm}
          submitLabel={policyForm.id ? "Save Policy" : "Create Policy"}
        >
          <FormGrid>
            <TextInput label="Policy Title" value={policyForm.title} onChange={(value) => setPolicyForm((prev) => ({ ...prev, title: value }))} />
            <SelectInput label="Applies To" value={policyForm.appliesTo} onChange={(value) => setPolicyForm((prev) => ({ ...prev, appliesTo: value }))} options={["All users", "All Employees", "Managers & above", "Finance", "Tenant Admins"]} />
          </FormGrid>
          <TextAreaInput label="Description" value={policyForm.description} onChange={(value) => setPolicyForm((prev) => ({ ...prev, description: value }))} />
        </FormModal>

        <FormModal
          open={dialog === "billingRate"}
          title={billingRateForm.id ? "Edit Billing Rate" : "Add Billing Rate"}
          description="Configure project billing with a dedicated form."
          onClose={closeDialog}
          onSubmit={submitBillingRateForm}
          submitLabel={billingRateForm.id ? "Save Rate" : "Create Rate"}
        >
          <FormGrid>
            <TextInput label="Role" value={billingRateForm.role} onChange={(value) => setBillingRateForm((prev) => ({ ...prev, role: value }))} />
            <TextInput label="Project" value={billingRateForm.project} onChange={(value) => setBillingRateForm((prev) => ({ ...prev, project: value }))} />
            <TextInput label="Hourly Rate" type="number" value={billingRateForm.rate} onChange={(value) => setBillingRateForm((prev) => ({ ...prev, rate: value }))} />
            <SelectInput label="Rate Type" value={billingRateForm.type} onChange={(value) => setBillingRateForm((prev) => ({ ...prev, type: value }))} options={["Hourly", "Daily", "Monthly"]} />
          </FormGrid>
        </FormModal>

        <FormModal
          open={dialog === "overtimeRule"}
          title={overtimeRuleForm.id ? "Edit Overtime Rule" : "Add Overtime Rule"}
          description="Set overtime thresholds and compensation rules."
          onClose={closeDialog}
          onSubmit={submitOvertimeRuleForm}
          submitLabel={overtimeRuleForm.id ? "Save Rule" : "Create Rule"}
        >
          <FormGrid>
            <TextInput label="Rule Title" value={overtimeRuleForm.title} onChange={(value) => setOvertimeRuleForm((prev) => ({ ...prev, title: value }))} />
            <TextInput label="Threshold" value={overtimeRuleForm.threshold} onChange={(value) => setOvertimeRuleForm((prev) => ({ ...prev, threshold: value }))} />
            <TextInput label="Multiplier" value={overtimeRuleForm.multiplier} onChange={(value) => setOvertimeRuleForm((prev) => ({ ...prev, multiplier: value }))} />
            <TextInput label="Applies To" value={overtimeRuleForm.appliesTo} onChange={(value) => setOvertimeRuleForm((prev) => ({ ...prev, appliesTo: value }))} />
          </FormGrid>
        </FormModal>

        <FormModal
          open={dialog === "subscription"}
          title="Update Subscription"
          description="Edit the current subscription details for this tenant."
          onClose={closeDialog}
          onSubmit={submitSubscriptionForm}
          submitLabel="Save Subscription"
        >
          <FormGrid>
            <SelectInput label="Plan" value={subscriptionForm.currentPlan} onChange={(value) => setSubscriptionForm((prev) => ({ ...prev, currentPlan: value }))} options={["Starter", "Professional", "Enterprise"]} />
            <SelectInput label="Billing Cycle" value={subscriptionForm.billingCycle} onChange={(value) => setSubscriptionForm((prev) => ({ ...prev, billingCycle: value }))} options={["Monthly", "Annual"]} />
            <TextInput label="Licenses" type="number" value={String(subscriptionForm.licenses)} onChange={(value) => setSubscriptionForm((prev) => ({ ...prev, licenses: value }))} />
          </FormGrid>
        </FormModal>

        <FormModal
          open={dialog === "generalSettings"}
          title="General Settings"
          description="Edit the main tenant configuration in one place."
          onClose={closeDialog}
          onSubmit={submitGeneralSettingsForm}
          submitLabel="Save Settings"
        >
          <FormGrid>
            <TextInput label="Tenant Name" value={generalSettingsForm.tenantName} onChange={(value) => setGeneralSettingsForm((prev) => ({ ...prev, tenantName: value }))} />
            <TextInput label="Time Zone" value={generalSettingsForm.timeZone} onChange={(value) => setGeneralSettingsForm((prev) => ({ ...prev, timeZone: value }))} />
            <TextInput label="Currency" value={generalSettingsForm.currency} onChange={(value) => setGeneralSettingsForm((prev) => ({ ...prev, currency: value }))} />
            <TextInput label="Week Start" value={generalSettingsForm.weekStart} onChange={(value) => setGeneralSettingsForm((prev) => ({ ...prev, weekStart: value }))} />
            <TextInput label="Pay Period" value={generalSettingsForm.payPeriod} onChange={(value) => setGeneralSettingsForm((prev) => ({ ...prev, payPeriod: value }))} />
            <TextInput label="Max Hours" value={generalSettingsForm.maxHours} onChange={(value) => setGeneralSettingsForm((prev) => ({ ...prev, maxHours: value }))} />
          </FormGrid>
        </FormModal>

        <FormModal
          open={dialog === "branding"}
          title="Branding"
          description="Update tenant colors, logo text, and invoice footer notes."
          onClose={closeDialog}
          onSubmit={submitBrandingForm}
          submitLabel="Save Branding"
        >
          <FormGrid>
            <TextInput label="Logo Text" value={brandingForm.logoText} onChange={(value) => setBrandingForm((prev) => ({ ...prev, logoText: value }))} />
            <TextInput label="Primary Color" value={brandingForm.primary} onChange={(value) => setBrandingForm((prev) => ({ ...prev, primary: value }))} />
            <TextInput label="Secondary Color" value={brandingForm.secondary} onChange={(value) => setBrandingForm((prev) => ({ ...prev, secondary: value }))} />
          </FormGrid>
          <TextAreaInput label="Footer Notes" value={brandingForm.footerNotes} onChange={(value) => setBrandingForm((prev) => ({ ...prev, footerNotes: value }))} />
        </FormModal>

        <HelpButton dashboardName="Tenant" clientName={tenantName} requesterName={adminProfile?.name || "Tenant Admin"} />
      </div>
    </RouteGuard>
  );
}

function Panel({ title, subtitle, action, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <Icon className="h-5 w-5 text-blue-700" />
      </div>
      <p className="mt-4 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{sub}</p>
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-base font-medium text-slate-900">{value}</p>
    </div>
  );
}

function DataTable({ columns, rows }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200">
      <table className="w-full min-w-[720px] text-left">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-500">
                No records available.
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-4 text-sm text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function StatusPill({ value }) {
  const styles =
    value === "Active"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : value === "Pending"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-slate-200 bg-slate-100 text-slate-600";

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles}`}>{value}</span>;
}

function ActionButton({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 text-sm font-semibold text-white shadow-sm"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function MiniButton({ label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2 text-sm font-medium ${
        danger ? "border-rose-200 text-rose-700 hover:bg-rose-50" : "border-slate-300 text-slate-700 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function ActionRow({ actions }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <MiniButton key={action.label} label={action.label} onClick={action.onClick} danger={action.danger} />
      ))}
    </div>
  );
}

function FormModal({ open, title, description, onClose, onSubmit, submitLabel, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h3 className="text-2xl font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">
          <button type="button" onClick={onClose} className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button type="button" onClick={onSubmit} className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm">
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormGrid({ children }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function TextInput({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function TextAreaInput({ label, value, onChange }) {
  return (
    <label className="mt-4 block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function SelectInput({ label, value, onChange, options, labels }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {options.map((option, index) => (
          <option key={`${label}-${option || "empty"}-${index}`} value={option}>
            {labels?.[index] || option}
          </option>
        ))}
      </select>
    </label>
  );
}
