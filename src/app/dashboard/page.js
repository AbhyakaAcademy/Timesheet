"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import { ChevronDown, Clock, Download, LogOut, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import RouteGuard from "@/components/auth/RouteGuard";
import { clearSession } from "@/lib/auth";

const navItems = ["Dashboard", "Users", "Departments", "Policies", "Billing & Subscription", "Audit Logs", "Settings"];
const settingsTabs = ["General Settings", "Billing Rates", "Overtime Rules", "Branding"];

const initialUsers = [
  ["Sarah Johnson", "sarah.johnson@company.com", "Admin", "Active", "Engineering"],
  ["Michael Chen", "michael.chen@company.com", "Manager", "Active", "Sales"],
  ["Emily Davis", "emily.davis@company.com", "Employee", "Active", "Marketing"]
];

const initialDepartmentCards = [
  { name: "Engineering", head: "Sarah Johnson", employees: "24 members", status: "Active", created: "Created Jan 2024" },
  { name: "Sales", head: "Michael Chen", employees: "18 members", status: "Pending", created: "Created Feb 2024" },
  { name: "Marketing", head: "Emily Davis", employees: "12 members", status: "Inactive", created: "Created Mar 2024" }
];

const initialAuditLogs = [
  {
    timestamp: "Feb 5, 2026 10:42 AM",
    user: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    action: "Created user account",
    resource: "john.doe@company.com",
    details: "New user John Doe was added to the Engineering department with Employee role."
  },
  {
    timestamp: "Feb 5, 2026 10:27 AM",
    user: "Michael Chen",
    email: "michael.chen@company.com",
    action: "Updated policy",
    resource: "Working Hours Policy",
    details: "Updated default shift timings and break policy for all departments."
  }
];

export default function DashboardPage() {
  const router = useRouter();
  const [active, setActive] = useState("Dashboard");
  const [tab, setTab] = useState("General Settings");
  const [toast, setToast] = useState("");

  const [showUserModal, setShowUserModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showOvertimeModal, setShowOvertimeModal] = useState(false);
  const [editingDepartmentIndex, setEditingDepartmentIndex] = useState(null);
  const [editingRateIndex, setEditingRateIndex] = useState(null);
  const [editingOvertimeIndex, setEditingOvertimeIndex] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planModalMode, setPlanModalMode] = useState("upgrade");
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);
  const [showAdminDetails, setShowAdminDetails] = useState(false);
  const [adminProfile, setAdminProfile] = useState({
    name: "Admin User",
    role: "Tenant Admin",
    email: "admin@acme-corp.com",
    phone: "+91 98765 43210"
  });
  const [adminDraft, setAdminDraft] = useState({
    name: "Admin User",
    role: "Tenant Admin",
    email: "admin@acme-corp.com",
    phone: "+91 98765 43210"
  });

  const [userForm, setUserForm] = useState({ name: "", email: "", role: "Employee", status: "Active", department: "General" });
  const [departmentForm, setDepartmentForm] = useState({ name: "", head: "", members: "", status: "Active" });
  const [policyForm, setPolicyForm] = useState({ name: "", description: "", appliesTo: "All users" });
  const [rateForm, setRateForm] = useState({ role: "", project: "All Projects", rate: "", type: "Hourly" });
  const [overtimeForm, setOvertimeForm] = useState({ title: "", threshold: "", multiplier: "", appliesTo: "All Employees" });

  const [usersRows, setUsersRows] = useState(initialUsers);
  const [departmentCards, setDepartmentCards] = useState(initialDepartmentCards);
  const [policies, setPolicies] = useState([
    {
      title: "Working Hours Policy",
      desc: "Defines standard working hours, break times, and flexible work arrangements",
      applies: "All departments",
      lastUpdated: "Jan 15, 2026",
      enabled: true,
      details: [
        "Standard shift 9:30 AM to 6:30 PM",
        "45-minute lunch break",
        "Flexible check-in up to 10:00 AM"
      ]
    },
    {
      title: "Approval Workflow Rules",
      desc: "Timesheet and leave approval flow with escalation",
      applies: "Managers & above",
      lastUpdated: "Jan 10, 2026",
      enabled: true,
      details: [
        "Timesheet approvals require manager sign-off",
        "Leave above 5 days needs department head approval"
      ]
    }
  ]);
  const [billingRates, setBillingRates] = useState([
    ["Software Engineer", "All Projects", "\u20B92,500/hour", "Hourly"],
    ["Project Manager", "All Projects", "\u20B94,000/hour", "Hourly"]
  ]);
  const [overtimeRules, setOvertimeRules] = useState([
    { title: "Standard Overtime", threshold: "After 40 hours", multiplier: "1.5x", appliesTo: "Hourly Staff", active: true },
    { title: "Double Overtime", threshold: "After 60 hours", multiplier: "2.0x", appliesTo: "Hourly Staff", active: false }
  ]);

  const [general, setGeneral] = useState({
    tenantName: "Acme Corporation",
    timeZone: "India Standard Time (IST) - UTC+5:30",
    currency: "Indian Rupee (\u20B9)",
    weekStart: "Monday",
    payPeriod: "Monthly",
    rounding: "15 minutes",
    maxHours: "12 hours",
    dateFormat: "DD-MM-YYYY (Indian format)",
    timeFormat: "24-hour (13:00)"
  });

  const [branding, setBranding] = useState({
    logoText: "AC",
    primary: "#4F46E5",
    secondary: "#9333EA",
    footerNotes: "Thank you for your business! Payment terms: Net 30 days."
  });
  const [planState, setPlanState] = useState({
    currentPlan: "Enterprise",
    billingCycle: "Annual",
    licenses: 500
  });

  const planRates = {
    Starter: { Monthly: 149, Annual: 119 },
    Professional: { Monthly: 599, Annual: 499 },
    Enterprise: { Monthly: 749, Annual: 649 }
  };

  const planUnitPrice = planRates[planState.currentPlan]?.[planState.billingCycle] ?? 0;
  const planTotalAmount = planUnitPrice * Math.max(planState.licenses, 0);
  const planAmountLabel = `\u20B9${planTotalAmount.toLocaleString("en-IN")}`;

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1600);
  };

  const downloadPdf = () => {
    const doc = new jsPDF();
    doc.text("Abhyaka Invoice", 20, 20);
    doc.text("INV-2026-02", 20, 35);
    doc.text(`Amount: ${planAmountLabel}`, 20, 45);
    doc.save("INV-2026-02.pdf");
    notify("Invoice downloaded");
  };

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  const statusStyle = (status) => {
    if (status === "Active") return "border-emerald-500 text-emerald-600 bg-emerald-50";
    if (status === "Pending") return "border-amber-500 text-amber-700 bg-amber-50";
    return "border-gray-400 text-gray-600 bg-gray-100";
  };

  const totalUsers = usersRows.length;
  const activeUsers = usersRows.filter((u) => u[3] === "Active").length;
  const activeDepartments = departmentCards.filter((d) => d.status === "Active").length;
  const pendingDepartments = departmentCards.filter((d) => d.status === "Pending").length;
  const usagePercent = totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0;
  const monthlyAddedUsers = Math.max(0, totalUsers - 144);

  const recentActivity = [
    { id: "S", text: <><span className="font-semibold">Sarah Johnson</span> created new user account for john.doe@company.com</>, time: "2 minutes ago" },
    { id: "M", text: <><span className="font-semibold">Michael Chen</span> updated Engineering Department working hours policy</>, time: "15 minutes ago" },
    { id: "E", text: <><span className="font-semibold">Emily Davis</span> approved 5 pending timesheet entries</>, time: "1 hour ago" },
    { id: "S", text: <><span className="font-semibold">System</span> generated monthly invoice for February 2026</>, time: "2 hours ago" },
    { id: "R", text: <><span className="font-semibold">Robert Wilson</span> deactivated user account maria.garcia@company.com</>, time: "3 hours ago" }
  ];

  const handleUserEdit = (idx) => {
    const current = usersRows[idx];
    const name = window.prompt("Edit name", current[0]);
    if (name === null) return;
    const role = window.prompt("Edit role", current[2]);
    if (role === null) return;
    const department = window.prompt("Edit department", current[4]);
    if (department === null) return;
    setUsersRows((prev) => prev.map((u, i) => (i === idx ? [name || u[0], u[1], role || u[2], u[3], department || u[4]] : u)));
    notify("User updated");
  };

  const handleUserToggle = (idx) => {
    const current = usersRows[idx];
    const nextStatus = current[3] === "Active" ? "Inactive" : "Active";
    const confirmMsg = current[3] === "Active"
      ? `Deactivate ${current[0]}?`
      : `Activate ${current[0]}?`;
    if (!window.confirm(confirmMsg)) return;
    setUsersRows((prev) => prev.map((u, i) => (i === idx ? [u[0], u[1], u[2], nextStatus, u[4]] : u)));
    notify(`User ${nextStatus.toLowerCase()}`);
  };

  const openCreateDepartmentModal = () => {
    setEditingDepartmentIndex(null);
    setDepartmentForm({ name: "", head: "", members: "", status: "Active" });
    setShowDepartmentModal(true);
  };

  const openEditDepartmentModal = (idx) => {
    const current = departmentCards[idx];
    setEditingDepartmentIndex(idx);
    setDepartmentForm({
      name: current.name,
      head: current.head,
      members: String(Number.parseInt(current.employees, 10) || 0),
      status: current.status
    });
    setShowDepartmentModal(true);
  };

  const handleDepartmentDelete = (idx) => {
    if (!window.confirm("Delete this department?")) return;
    setDepartmentCards((prev) => prev.filter((_, i) => i !== idx));
    notify("Department deleted");
  };

  const openCreateRateModal = () => {
    setEditingRateIndex(null);
    setRateForm({ role: "", project: "All Projects", rate: "", type: "Hourly" });
    setShowRateModal(true);
  };

  const openEditRateModal = (idx) => {
    const current = billingRates[idx];
    setEditingRateIndex(idx);
    setRateForm({ role: current[0], project: current[1], rate: current[2], type: current[3] });
    setShowRateModal(true);
  };

  const handleBillingRateDelete = (idx) => {
    if (!window.confirm("Delete this billing rate?")) return;
    setBillingRates((prev) => prev.filter((_, i) => i !== idx));
    notify("Billing rate deleted");
  };

  const openCreateOvertimeModal = () => {
    setEditingOvertimeIndex(null);
    setOvertimeForm({ title: "", threshold: "", multiplier: "", appliesTo: "All Employees" });
    setShowOvertimeModal(true);
  };

  const openEditOvertimeModal = (idx) => {
    const current = overtimeRules[idx];
    setEditingOvertimeIndex(idx);
    setOvertimeForm({
      title: current.title,
      threshold: current.threshold,
      multiplier: current.multiplier,
      appliesTo: current.appliesTo
    });
    setShowOvertimeModal(true);
  };

  const handleOvertimeRuleDelete = (idx) => {
    if (!window.confirm("Delete this overtime rule?")) return;
    setOvertimeRules((prev) => prev.filter((_, i) => i !== idx));
    notify("Overtime rule deleted");
  };

  const handleGeneralSettingsEdit = () => {
    const tenantName = window.prompt("Edit tenant name", general.tenantName);
    if (tenantName === null) return;
    const timeZone = window.prompt("Edit default time zone", general.timeZone);
    if (timeZone === null) return;
    const currency = window.prompt("Edit default currency", general.currency);
    if (currency === null) return;
    setGeneral((prev) => ({
      ...prev,
      tenantName: tenantName || prev.tenantName,
      timeZone: timeZone || prev.timeZone,
      currency: currency || prev.currency
    }));
    notify("General settings updated");
  };

  const handleBrandingEdit = () => {
    const logoText = window.prompt("Edit logo text", branding.logoText);
    if (logoText === null) return;
    const footerNotes = window.prompt("Edit invoice footer notes", branding.footerNotes);
    if (footerNotes === null) return;
    setBranding((prev) => ({
      ...prev,
      logoText: logoText || prev.logoText,
      footerNotes: footerNotes || prev.footerNotes
    }));
    notify("Branding updated");
  };

  const openAdminDetails = () => {
    setAdminDraft(adminProfile);
    setShowAdminDetails(true);
  };

  const saveAdminDetails = () => {
    if (!adminDraft.name || !adminDraft.role || !adminDraft.email) {
      notify("Name, role, and email are required");
      return;
    }
    setAdminProfile(adminDraft);
    setShowAdminDetails(false);
    notify("Admin user updated");
  };

  const header = (title, subtitle, btn, onClick) => (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">{title}</h1>
        <p className="text-base text-gray-600">{subtitle}</p>
      </div>
      {btn && (
        <button onClick={onClick} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {btn}
        </button>
      )}
    </div>
  );

  return (
    <RouteGuard allowedRoles={["admin", "tenant"]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
        {toast && <div className="fixed top-5 right-5 z-50 rounded-xl bg-slate-900 text-white px-4 py-2">{toast}</div>}

      {showPolicyModal && (
        <Modal title="Add New Policy" onClose={() => setShowPolicyModal(false)}>
          <div className="space-y-4">
            <Field label="Policy Name *" value={policyForm.name} onChange={(v) => setPolicyForm((p) => ({ ...p, name: v }))} />
            <TextField label="Description *" value={policyForm.description} onChange={(v) => setPolicyForm((p) => ({ ...p, description: v }))} />
            <SelectField label="Applies To *" value={policyForm.appliesTo} options={["All users", "All employees", "Managers & above", "Specific departments"]} onChange={(v) => setPolicyForm((p) => ({ ...p, appliesTo: v }))} />
            <ModalActions onCancel={() => setShowPolicyModal(false)} onSave={() => {
              if (!policyForm.name || !policyForm.description) return notify("Policy name and description required");
              setPolicies((prev) => [...prev, { title: policyForm.name, desc: policyForm.description, applies: policyForm.appliesTo, lastUpdated: "Feb 10, 2026", enabled: true, details: ["Custom policy details will be configured after creation."] }]);
              setPolicyForm({ name: "", description: "", appliesTo: "All users" });
              setShowPolicyModal(false);
              notify("Policy added");
            }} saveText="Add Policy" />
          </div>
        </Modal>
      )}

      {showDepartmentModal && (
        <Modal title={editingDepartmentIndex === null ? "Create Department" : "Edit Department"} onClose={() => { setShowDepartmentModal(false); setEditingDepartmentIndex(null); }}>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Department Name *" value={departmentForm.name} onChange={(v) => setDepartmentForm((p) => ({ ...p, name: v }))} />
            <Field label="Department Head *" value={departmentForm.head} onChange={(v) => setDepartmentForm((p) => ({ ...p, head: v }))} />
            <Field label="Total Employees *" value={departmentForm.members} onChange={(v) => setDepartmentForm((p) => ({ ...p, members: v }))} />
            <SelectField label="Status *" value={departmentForm.status} options={["Active", "Inactive", "Pending"]} onChange={(v) => setDepartmentForm((p) => ({ ...p, status: v }))} />
          </div>
          <ModalActions onCancel={() => { setShowDepartmentModal(false); setEditingDepartmentIndex(null); }} onSave={() => {
            if (!departmentForm.name || !departmentForm.head || !departmentForm.members) return notify("All department fields are required");
            if (editingDepartmentIndex !== null) {
              setDepartmentCards((prev) => prev.map((d, i) => i === editingDepartmentIndex ? { ...d, name: departmentForm.name, head: departmentForm.head, employees: `${departmentForm.members} members`, status: departmentForm.status } : d));
            } else {
              setDepartmentCards((prev) => [...prev, { name: departmentForm.name, head: departmentForm.head, employees: `${departmentForm.members} members`, status: departmentForm.status, created: "Created Feb 2026" }]);
            }
            setDepartmentForm({ name: "", head: "", members: "", status: "Active" });
            setShowDepartmentModal(false);
            setEditingDepartmentIndex(null);
            notify(editingDepartmentIndex !== null ? "Department updated" : "Department created");
          }} saveText={editingDepartmentIndex !== null ? "Update Department" : "Create Department"} />
        </Modal>
      )}

      {showUserModal && (
        <Modal title="Add User" onClose={() => setShowUserModal(false)}>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Name *" value={userForm.name} onChange={(v) => setUserForm((p) => ({ ...p, name: v }))} />
            <Field label="Email *" value={userForm.email} onChange={(v) => setUserForm((p) => ({ ...p, email: v }))} />
            <SelectField label="Role" value={userForm.role} options={["Admin", "Manager", "Employee"]} onChange={(v) => setUserForm((p) => ({ ...p, role: v }))} />
            <SelectField label="Status" value={userForm.status} options={["Active", "Inactive"]} onChange={(v) => setUserForm((p) => ({ ...p, status: v }))} />
            <Field label="Department" value={userForm.department} onChange={(v) => setUserForm((p) => ({ ...p, department: v }))} />
          </div>
          <ModalActions onCancel={() => setShowUserModal(false)} onSave={() => {
            if (!userForm.name || !userForm.email) return notify("Name and email are required");
            setUsersRows((prev) => [...prev, [userForm.name, userForm.email, userForm.role, userForm.status, userForm.department]]);
            setUserForm({ name: "", email: "", role: "Employee", status: "Active", department: "General" });
            setShowUserModal(false);
            notify("User added");
          }} saveText="Add User" />
        </Modal>
      )}

      {showRateModal && (
        <Modal title={editingRateIndex === null ? "Add Billing Rate" : "Edit Billing Rate"} onClose={() => { setShowRateModal(false); setEditingRateIndex(null); }}>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Role *" value={rateForm.role} onChange={(v) => setRateForm((p) => ({ ...p, role: v }))} />
            <Field label="Project" value={rateForm.project} onChange={(v) => setRateForm((p) => ({ ...p, project: v }))} />
            <Field label="Rate *" value={rateForm.rate} onChange={(v) => setRateForm((p) => ({ ...p, rate: v }))} />
            <SelectField label="Type" value={rateForm.type} options={["Hourly", "Daily", "Monthly"]} onChange={(v) => setRateForm((p) => ({ ...p, type: v }))} />
          </div>
          <ModalActions onCancel={() => { setShowRateModal(false); setEditingRateIndex(null); }} onSave={() => {
            if (!rateForm.role || !rateForm.rate) return notify("Role and rate are required");
            if (editingRateIndex !== null) {
              setBillingRates((prev) => prev.map((r, i) => i === editingRateIndex ? [rateForm.role, rateForm.project, rateForm.rate, rateForm.type] : r));
            } else {
              setBillingRates((prev) => [[rateForm.role, rateForm.project, rateForm.rate, rateForm.type], ...prev]);
            }
            setRateForm({ role: "", project: "All Projects", rate: "", type: "Hourly" });
            setShowRateModal(false);
            setEditingRateIndex(null);
            notify(editingRateIndex !== null ? "Billing rate updated" : "Billing rate added");
          }} saveText={editingRateIndex !== null ? "Update Rate" : "Add Rate"} />
        </Modal>
      )}

      {showOvertimeModal && (
        <Modal title={editingOvertimeIndex === null ? "Add Overtime Rule" : "Edit Overtime Rule"} onClose={() => { setShowOvertimeModal(false); setEditingOvertimeIndex(null); }}>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Rule Name *" value={overtimeForm.title} onChange={(v) => setOvertimeForm((p) => ({ ...p, title: v }))} />
            <Field label="Threshold *" value={overtimeForm.threshold} onChange={(v) => setOvertimeForm((p) => ({ ...p, threshold: v }))} />
            <Field label="Multiplier *" value={overtimeForm.multiplier} onChange={(v) => setOvertimeForm((p) => ({ ...p, multiplier: v }))} />
            <Field label="Applies To" value={overtimeForm.appliesTo} onChange={(v) => setOvertimeForm((p) => ({ ...p, appliesTo: v }))} />
          </div>
          <ModalActions onCancel={() => { setShowOvertimeModal(false); setEditingOvertimeIndex(null); }} onSave={() => {
            if (!overtimeForm.title || !overtimeForm.threshold || !overtimeForm.multiplier) return notify("Rule name, threshold, and multiplier are required");
            if (editingOvertimeIndex !== null) {
              setOvertimeRules((prev) => prev.map((r, i) => i === editingOvertimeIndex ? { ...r, title: overtimeForm.title, threshold: overtimeForm.threshold, multiplier: overtimeForm.multiplier, appliesTo: overtimeForm.appliesTo } : r));
            } else {
              setOvertimeRules((prev) => [{ ...overtimeForm, active: true }, ...prev]);
            }
            setOvertimeForm({ title: "", threshold: "", multiplier: "", appliesTo: "All Employees" });
            setShowOvertimeModal(false);
            setEditingOvertimeIndex(null);
            notify(editingOvertimeIndex !== null ? "Overtime rule updated" : "Overtime rule added");
          }} saveText={editingOvertimeIndex !== null ? "Update Rule" : "Add Rule"} />
        </Modal>
      )}

      {showPlanModal && (
        <Modal title={planModalMode === "upgrade" ? "Upgrade Plan" : "Manage Plan"} onClose={() => setShowPlanModal(false)}>
          <div className="grid md:grid-cols-2 gap-4">
            <SelectField
              label="Plan"
              value={planState.currentPlan}
              options={["Starter", "Professional", "Enterprise"]}
              onChange={(v) => setPlanState((p) => ({ ...p, currentPlan: v }))}
            />
            <SelectField
              label="Billing Cycle"
              value={planState.billingCycle}
              options={["Monthly", "Annual"]}
              onChange={(v) => setPlanState((p) => ({ ...p, billingCycle: v }))}
            />
            <Field
              label="User Licenses"
              value={String(planState.licenses)}
              onChange={(v) => setPlanState((p) => ({ ...p, licenses: Number.parseInt(v, 10) || 0 }))}
            />
          </div>
          <ModalActions
            onCancel={() => setShowPlanModal(false)}
            onSave={() => {
              setShowPlanModal(false);
              notify(planModalMode === "upgrade" ? "Plan upgraded" : "Plan settings updated");
            }}
            saveText={planModalMode === "upgrade" ? "Upgrade" : "Save Changes"}
          />
        </Modal>
      )}

      {selectedPolicy && (
        <Modal title={selectedPolicy.title} onClose={() => setSelectedPolicy(null)} wide>
          <p className="text-gray-600 mb-4">{selectedPolicy.desc}</p>
          <div className="grid md:grid-cols-2 gap-4 mb-5">
            <InfoTile label="Applies to" value={selectedPolicy.applies} />
            <InfoTile label="Last updated" value={selectedPolicy.lastUpdated} />
          </div>
          <div className="rounded-2xl bg-slate-100 p-5 mb-6">
            <p className="font-semibold text-gray-900 mb-3">Policy Details</p>
            <ul className="space-y-2 text-gray-700 list-disc pl-6">{selectedPolicy.details.map((d) => <li key={d}>{d}</li>)}</ul>
          </div>
          <div className="flex justify-end"><button onClick={() => setSelectedPolicy(null)} className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold">Close</button></div>
        </Modal>
      )}

      {selectedAuditLog && (
        <div className="fixed inset-0 z-50 bg-black/45 p-4 flex items-center justify-center">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-8">
            <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-semibold text-gray-900">Audit Log Details</h3><button onClick={() => setSelectedAuditLog(null)}><X className="w-7 h-7 text-gray-500" /></button></div>
            <div className="space-y-4 mb-6">
              <AuditTile label="Timestamp" value={selectedAuditLog.timestamp} />
              <AuditTile label="User" value={selectedAuditLog.user} subValue={selectedAuditLog.email} />
              <AuditTile label="Action" value={selectedAuditLog.action} />
              <AuditTile label="Resource" value={selectedAuditLog.resource} />
              <AuditTile label="Details" value={selectedAuditLog.details} />
            </div>
            <button onClick={() => setSelectedAuditLog(null)} className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-base font-semibold">Close</button>
          </div>
        </div>
      )}

      {showAdminDetails && (
        <Modal title="Admin User Details" onClose={() => setShowAdminDetails(false)}>
          <div className="space-y-4">
            <Field label="Name *" value={adminDraft.name} onChange={(v) => setAdminDraft((prev) => ({ ...prev, name: v }))} />
            <Field label="Role *" value={adminDraft.role} onChange={(v) => setAdminDraft((prev) => ({ ...prev, role: v }))} />
            <Field label="Email *" value={adminDraft.email} onChange={(v) => setAdminDraft((prev) => ({ ...prev, email: v }))} />
            <Field label="Phone" value={adminDraft.phone} onChange={(v) => setAdminDraft((prev) => ({ ...prev, phone: v }))} />
            <InfoTile label="Organization" value={general.tenantName} />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setShowAdminDetails(false)} className="px-6 py-2 rounded-xl border-2 border-gray-300">
              Cancel
            </button>
            <button onClick={saveAdminDetails} className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              Save Changes
            </button>
          </div>
        </Modal>
      )}

      <aside className="w-[308px] bg-white border-r-2 border-gray-300 flex flex-col">
        <Link href="/" className="p-6 border-b-2 border-gray-300 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center"><Clock className="w-6 h-6 text-white" /></div>
          <div><p className="text-2xl font-semibold text-gray-900">Abhyaka</p><p className="text-sm text-gray-600">Admin Dashboard</p></div>
        </Link>
        <nav className="p-4 flex-1">
          {navItems.map((item) => (<button key={item} onClick={() => setActive(item)} className={`w-full text-left px-4 py-3 rounded-2xl mb-2 ${active === item ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold" : "text-gray-900 hover:bg-gray-100"}`}>{item}</button>))}
        </nav>
        <div className="p-4 border-t-2 border-gray-300 space-y-3">
          <button onClick={openAdminDetails} className="w-full p-3 rounded-2xl bg-slate-100 flex items-center gap-3 text-left hover:bg-slate-200 transition-colors"><div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold inline-flex items-center justify-center">{adminProfile.name?.charAt(0)?.toUpperCase() || "A"}</div><div><p className="font-semibold text-gray-900">{adminProfile.name}</p><p className="text-sm text-gray-600">{adminProfile.role}</p></div></button>
          <button onClick={handleLogout} className="p-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 font-semibold inline-flex items-center gap-2"><LogOut className="w-4 h-4" />Logout</button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        {active === "Dashboard" && (
          <>
            {header("Dashboard Overview", "Welcome back, Admin. Here's what's happening in your organization.")}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <CardStat title="Total Users" value={String(totalUsers)} sub={`+${monthlyAddedUsers} this month`} />
              <CardStat title="Active Departments" value={String(activeDepartments)} sub={`${pendingDepartments} pending setup`} />
              <CardStat title="Current Plan" value={planState.currentPlan} sub={`${planState.licenses} user licenses`} />
              <CardStat title="Monthly Usage" value={`${usagePercent}%`} sub={`${activeUsers}/${totalUsers} active users`} />
            </div>
            <section className="bg-white border-2 border-gray-300 rounded-2xl p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-5">Recent Activity</h2>
              <div>
                {recentActivity.map((activity, idx) => (
                  <div key={`${activity.id}-${idx}`} className={`flex items-start gap-4 py-4 ${idx < recentActivity.length - 1 ? "border-b border-gray-200" : ""}`}>
                    <span className="w-11 h-11 rounded-full border-2 border-slate-400 inline-flex items-center justify-center text-slate-700 font-semibold">{activity.id}</span>
                    <div>
                      <p className="text-sm text-gray-900">{activity.text}</p>
                      <p className="text-xs text-slate-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {active === "Users" && (
          <>
            {header("Users", "Manage user accounts, roles, and permissions", "Add User", () => setShowUserModal(true))}
            <section className="bg-white border-2 border-gray-300 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 border-b border-gray-300"><tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Role</th><th className="p-4">Status</th><th className="p-4">Department</th><th className="p-4">Actions</th></tr></thead>
                <tbody>
                  {usersRows.map((row, idx) => (
                    <tr key={`${row[1]}-${idx}`} className="border-b border-gray-200"><td className="p-4">{row[0]}</td><td className="p-4">{row[1]}</td><td className="p-4">{row[2]}</td><td className="p-4"><span className={`px-3 py-1 rounded border ${row[3] === "Active" ? "border-emerald-500 text-emerald-600" : "border-gray-400 text-gray-600"}`}>{row[3]}</span></td><td className="p-4">{row[4]}</td><td className="p-4"><button className="px-3 py-1 border rounded mr-2" onClick={() => handleUserEdit(idx)}>Edit</button><button className="px-3 py-1 border rounded" onClick={() => handleUserToggle(idx)}>{row[3] === "Active" ? "Deactivate" : "Activate"}</button></td></tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}

        {active === "Departments" && (
          <>
            {header("Departments", "Organize teams and manage department structures", "Create Department", openCreateDepartmentModal)}
            <div className="grid md:grid-cols-2 gap-4">
              {departmentCards.map((d, idx) => (
                <article key={`${d.name}-${idx}`} className="bg-white border-2 border-gray-300 rounded-2xl p-4">
                  <div className="flex justify-between"><h3 className="text-2xl font-semibold">{d.name}</h3><div className="flex gap-2"><button className="w-8 h-8 border rounded" onClick={() => openEditDepartmentModal(idx)}><Pencil className="w-3.5 h-3.5 mx-auto" /></button><button className="w-8 h-8 border rounded" onClick={() => handleDepartmentDelete(idx)}><X className="w-3.5 h-3.5 mx-auto" /></button></div></div>
                  <p className="text-gray-600 text-sm mt-3">Department Head</p><p className="text-lg text-gray-900">{d.head}</p>
                  <p className="text-gray-600 text-sm mt-3">Total Employees</p><p className="text-lg text-gray-900">{d.employees}</p>
                  <p className="text-gray-600 text-sm mt-3">Status</p><span className={`inline-flex mt-1 px-3 py-1 rounded-lg border text-sm ${statusStyle(d.status)}`}>{d.status}</span>
                  <div className="mt-4 pt-4 border-t border-gray-200"><p className="text-slate-500 text-sm">{d.created}</p></div>
                </article>
              ))}
            </div>
          </>
        )}

        {active === "Policies" && (
          <>
            {header("Policies", "Configure organizational policies and compliance rules", "Add Policy", () => setShowPolicyModal(true))}
            <div className="space-y-4">
              {policies.map((p, i) => (
                <div key={`${p.title}-${i}`} className="bg-white border-2 border-indigo-300 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-6">
                  <div>
                      <h3 className="text-2xl font-semibold text-gray-900">{p.title}</h3>
                      <p className="text-base text-gray-700 mt-1">{p.desc}</p>
                      <div className="flex flex-wrap gap-5 mt-3 text-slate-500 text-sm"><p>Applies to: {p.applies}</p><p>Last updated: {p.lastUpdated}</p><button className="text-indigo-600 font-semibold" onClick={() => setSelectedPolicy(p)}>Click to view details -&gt;</button></div>
                    </div>
                    <div className="flex items-center gap-3 pt-1"><span className="text-sm text-slate-600">{p.enabled ? "ON" : "OFF"}</span><button onClick={() => setPolicies((prev) => prev.map((x, idx) => idx === i ? { ...x, enabled: !x.enabled } : x))} className={`w-12 h-6 rounded-full border-2 relative ${p.enabled ? "border-emerald-600 bg-emerald-100" : "border-gray-400 bg-gray-100"}`}><span className={`absolute top-0.5 w-4 h-4 rounded-full ${p.enabled ? "right-0.5 bg-emerald-600" : "left-0.5 bg-gray-500"}`} /></button></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {active === "Billing & Subscription" && (
          <>
            {header("Billing & Subscription", "Manage your subscription plan, usage, and payment history")}
            <section className="bg-white border-2 border-gray-300 rounded-2xl p-6 mb-8">
              <div className="flex justify-between items-start mb-6 gap-4"><div><h2 className="text-2xl font-semibold text-gray-900 mb-2">{planState.currentPlan} Plan</h2><p className="text-gray-600">Full access to all features with priority support</p></div><p className="text-3xl font-semibold text-gray-900">{planAmountLabel}<span className="text-lg text-gray-500">/{planState.billingCycle === "Annual" ? "yr" : "mo"}</span></p></div>
              <div className="grid md:grid-cols-3 gap-6 mb-6"><div><p className="text-gray-500">Plan Type</p><p className="text-xl font-semibold text-gray-900">{planState.billingCycle}</p></div><div><p className="text-gray-500">User Licenses</p><p className="text-xl font-semibold text-gray-900">{planState.licenses} seats</p></div><div><p className="text-gray-500">Next Billing Date</p><p className="text-xl font-semibold text-gray-900">Mar 1, 2026</p></div></div>
              <p className="text-gray-500 mb-2">License Usage</p>
              <div className="h-7 border-2 border-gray-300 rounded-md overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs inline-flex items-center justify-end pr-3"
                  style={{ width: `${Math.min(100, Math.round((activeUsers / Math.max(planState.licenses, 1)) * 100))}%` }}
                >
                  {activeUsers} / {planState.licenses} licenses used ({Math.min(100, Math.round((activeUsers / Math.max(planState.licenses, 1)) * 100))}%)
                </div>
              </div>
              <p className="text-gray-500 mb-6">{Math.max(planState.licenses - activeUsers, 0)} licenses available</p>
              <div className="flex gap-4">
                <button className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold" onClick={() => { setPlanModalMode("upgrade"); setShowPlanModal(true); }}>Upgrade Plan</button>
              </div>
            </section>
            <section className="bg-white border-2 border-gray-300 rounded-2xl p-6 overflow-hidden">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Invoice History</h2>
              <table className="w-full text-left"><thead className="bg-slate-100 border-b border-gray-300"><tr><th className="p-4">Invoice Number</th><th className="p-4">Date</th><th className="p-4">Plan</th><th className="p-4">Amount</th><th className="p-4">Actions</th></tr></thead><tbody><tr className="border-b border-gray-200"><td className="p-4">INV-2026-02</td><td className="p-4">Feb 1, 2026</td><td className="p-4">{planState.currentPlan}</td><td className="p-4 font-semibold">{planAmountLabel}</td><td className="p-4"><button onClick={downloadPdf} className="px-4 py-2 rounded-lg border-2 border-gray-400 inline-flex items-center gap-2"><Download className="w-4 h-4" />Download PDF</button></td></tr></tbody></table>
            </section>
          </>
        )}

        {active === "Audit Logs" && (
          <>
            {header("Audit Logs", "Track all system activities and user actions for compliance")}
            <section className="bg-white border-2 border-gray-300 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 border-b border-gray-300"><tr><th className="p-4">Timestamp</th><th className="p-4">User</th><th className="p-4">Action</th><th className="p-4">Resource</th><th className="p-4">Details</th></tr></thead>
                <tbody>{initialAuditLogs.map((log) => (<tr key={`${log.timestamp}-${log.resource}`} className="border-b border-gray-200"><td className="p-4">{log.timestamp}</td><td className="p-4">{log.user}</td><td className="p-4">{log.action}</td><td className="p-4">{log.resource}</td><td className="p-4"><button className="px-3 py-1 border rounded text-xs" onClick={() => setSelectedAuditLog(log)}>View</button></td></tr>))}</tbody>
              </table>
            </section>
          </>
        )}

        {active === "Settings" && (
          <>
            {header("Tenant Settings", "Configure organization-wide settings and preferences")}
            <section className="bg-white border-2 border-gray-300 rounded-2xl mb-8"><div className="px-6 pt-4 border-b border-gray-300 flex flex-wrap gap-8">{settingsTabs.map((t) => <button key={t} onClick={() => setTab(t)} className={`pb-4 ${tab === t ? "text-indigo-600 border-b-4 border-indigo-600 font-semibold" : "text-gray-700"}`}>{t}</button>)}</div></section>

            {tab === "General Settings" && (
            <section className="bg-white border-2 border-gray-300 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">General Tenant Configuration</h2>
                  <button onClick={handleGeneralSettingsEdit} className="px-4 py-2 rounded-lg border-2 border-gray-400">Edit</button>
                </div>
              <div className="grid md:grid-cols-2 gap-6">
                  <Field label="Tenant Name *" value={general.tenantName} onChange={(v) => setGeneral((s) => ({ ...s, tenantName: v }))} />
                  <SelectField label="Default Time Zone *" value={general.timeZone} options={["India Standard Time (IST) - UTC+5:30", "UTC", "Eastern Time", "Pacific Time"]} onChange={(v) => setGeneral((s) => ({ ...s, timeZone: v }))} />
                  <SelectField label="Default Currency *" value={general.currency} options={["Indian Rupee (\u20B9)", "US Dollar ($)", "British Pound (\u00A3)"]} onChange={(v) => setGeneral((s) => ({ ...s, currency: v }))} />
                  <SelectField label="Week Start Day *" value={general.weekStart} options={["Monday", "Sunday", "Saturday"]} onChange={(v) => setGeneral((s) => ({ ...s, weekStart: v }))} />
                  <SelectField label="Pay Period Frequency *" value={general.payPeriod} options={["Weekly", "Bi-weekly", "Monthly"]} onChange={(v) => setGeneral((s) => ({ ...s, payPeriod: v }))} />
                  <SelectField label="Time Rounding Increment (minutes) *" value={general.rounding} options={["5 minutes", "10 minutes", "15 minutes", "30 minutes"]} onChange={(v) => setGeneral((s) => ({ ...s, rounding: v }))} />
                  <SelectField label="Maximum Hours Per Day *" value={general.maxHours} options={["8 hours", "10 hours", "12 hours"]} onChange={(v) => setGeneral((s) => ({ ...s, maxHours: v }))} />
                  <SelectField label="Date Format *" value={general.dateFormat} options={["DD-MM-YYYY (Indian format)", "MM/DD/YYYY", "YYYY-MM-DD"]} onChange={(v) => setGeneral((s) => ({ ...s, dateFormat: v }))} />
                  <SelectField label="Time Format *" value={general.timeFormat} options={["24-hour (13:00)", "12-hour (1:00 PM)"]} onChange={(v) => setGeneral((s) => ({ ...s, timeFormat: v }))} />
              </div>
                <div className="my-8 border-t border-gray-300" />
                <h3 className="text-3xl font-semibold text-gray-900 mb-5">Organization Structure</h3>
                <div className="grid md:grid-cols-3 gap-5 mb-6"><div className="rounded-2xl bg-slate-100 p-5"><p className="text-slate-600 text-sm">Total Departments</p><p className="text-4xl font-semibold text-gray-900">12</p><p className="text-slate-500 text-sm">6 active, 6 pending</p></div><div className="rounded-2xl bg-slate-100 p-5"><p className="text-slate-600 text-sm">Locations</p><p className="text-4xl font-semibold text-gray-900">8</p><p className="text-slate-500 text-sm">Across 5 cities</p></div><div className="rounded-2xl bg-slate-100 p-5"><p className="text-slate-600 text-sm">Cost Centers</p><p className="text-4xl font-semibold text-gray-900">24</p><p className="text-slate-500 text-sm">For expense tracking</p></div></div>
                <p className="text-slate-600 text-lg">Configure departments, locations, and cost centers from their respective sections in the dashboard.</p>
                <div className="pt-8 mt-8 border-t border-gray-300 flex justify-end gap-4"><button className="px-7 py-3 rounded-2xl border-2 border-gray-400 text-gray-800 font-semibold">Discard Changes</button><button className="px-7 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold inline-flex items-center gap-2"><Save className="w-4 h-4" />Save Settings</button></div>
              </section>
            )}

            {tab === "Billing Rates" && (
              <section className="bg-white border-2 border-gray-300 rounded-2xl p-6">
                <div className="flex justify-between items-start mb-6 gap-4"><div><h2 className="text-2xl font-semibold text-gray-900 mb-2">Billing Rates Configuration</h2><p className="text-base text-gray-600">Define billing rates per role and project for invoicing</p></div><button onClick={openCreateRateModal} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold inline-flex items-center gap-2"><Plus className="w-4 h-4" />Add Billing Rate</button></div>
                <div className="overflow-hidden rounded-2xl border-2 border-gray-300 mb-5"><table className="w-full text-left"><thead className="border-b border-gray-300 bg-slate-100"><tr><th className="p-4">Role</th><th className="p-4">Project</th><th className="p-4">Rate (\u20B9)</th><th className="p-4">Type</th><th className="p-4">Actions</th></tr></thead><tbody>{billingRates.map((r, i) => (<tr key={`${r[0]}-${i}`} className="border-b border-gray-200"><td className="p-4 font-semibold text-gray-900">{r[0]}</td><td className="p-4 text-gray-700">{r[1]}</td><td className="p-4 text-gray-900">{r[2]}</td><td className="p-4 text-gray-700">{r[3]}</td><td className="p-4"><button onClick={() => openEditRateModal(i)} className="px-4 py-2 rounded-lg border-2 border-gray-400 mr-2">Edit</button><button onClick={() => handleBillingRateDelete(i)} className="px-4 py-2 rounded-lg border-2 border-red-400 text-red-600 inline-flex items-center gap-2"><Trash2 className="w-4 h-4" />Delete</button></td></tr>))}</tbody></table></div>
                <div className="rounded-2xl border border-blue-300 bg-blue-50 p-4 text-blue-800 text-xs"><p className="font-semibold mb-1 text-sm">Billing Rates Information</p><ul className="list-disc pl-5 space-y-1"><li>Billing rates are used to calculate project costs and generate client invoices</li><li>You can define different rates for the same role across different projects</li><li>Rates are applied to approved timesheet hours for billing calculations</li><li>Historical rates are preserved when changes are made</li></ul></div>
              </section>
            )}

            {tab === "Overtime Rules" && (
              <section className="bg-white border-2 border-gray-300 rounded-2xl p-6">
                <div className="flex justify-between items-start mb-6 gap-4"><div><h2 className="text-2xl font-semibold text-gray-900 mb-2">Overtime Rules Configuration</h2><p className="text-base text-gray-600">Define overtime eligibility, thresholds, and compensation multipliers</p></div><button onClick={openCreateOvertimeModal} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold inline-flex items-center gap-2"><Plus className="w-4 h-4" />Add Overtime Rule</button></div>
                <div className="space-y-6 mb-6">{overtimeRules.map((r, i) => (<article key={`${r.title}-${i}`} className="rounded-2xl border-2 border-gray-300 p-6"><div className="flex justify-between items-start mb-5"><div className="flex items-center gap-4"><h3 className="text-lg font-semibold text-gray-900">{r.title}</h3><span className={`px-3 py-1 rounded-md border text-xs ${r.active ? "border-emerald-500 bg-emerald-50 text-emerald-600" : "border-gray-400 bg-gray-100 text-gray-600"}`}>{r.active ? "Active" : "Inactive"}</span></div><div className="flex gap-2"><button onClick={() => openEditOvertimeModal(i)} className="px-3 py-2 text-sm rounded-lg border-2 border-gray-400">Edit</button><button onClick={() => setOvertimeRules((prev) => prev.map((x, idx) => idx === i ? { ...x, active: !x.active } : x))} className="px-3 py-2 text-sm rounded-lg border-2 border-gray-400">{r.active ? "Disable" : "Enable"}</button><button onClick={() => handleOvertimeRuleDelete(i)} className="px-3 py-2 text-sm rounded-lg border-2 border-red-400 text-red-600 inline-flex items-center gap-2"><Trash2 className="w-4 h-4" />Delete</button></div></div><div className="grid md:grid-cols-3 gap-6"><div><p className="text-gray-500 text-sm">Threshold (hours/week)</p><p className="text-lg font-semibold text-gray-900">{r.threshold}</p></div><div><p className="text-gray-500 text-sm">Pay Multiplier</p><p className="text-lg font-semibold text-gray-900">{r.multiplier}</p></div><div><p className="text-gray-500 text-sm">Applies To</p><p className="text-lg font-semibold text-gray-900">{r.appliesTo}</p></div></div></article>))}</div>
                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 text-xs"><p className="font-semibold mb-1 text-sm">Overtime Rules Information</p><ul className="list-disc pl-5 space-y-1"><li>Overtime rules are applied automatically to eligible employees based on weekly hours</li><li>Weekend and holiday overtime can have different multipliers</li><li>Rules are evaluated in order of priority - first matching rule applies</li><li>Ensure compliance with local labor laws and regulations</li><li>Changes to overtime rules apply to future periods only</li></ul></div>
              </section>
            )}

            {tab === "Branding" && (
              <section className="bg-white border-2 border-gray-300 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Tenant Branding Configuration</h2>
                  <button onClick={handleBrandingEdit} className="px-4 py-2 rounded-lg border-2 border-gray-400">Edit</button>
                </div>
                <div className="mb-6"><label className="block mb-2 text-gray-900">Invoice Footer Notes</label><textarea className="w-full min-h-28 rounded-xl border-2 border-gray-300 px-4 py-3" value={branding.footerNotes} onChange={(e) => setBranding((b) => ({ ...b, footerNotes: e.target.value }))} /></div>
                <div className="rounded-2xl p-4 mb-6" style={{ background: `linear-gradient(90deg, ${branding.primary}, ${branding.secondary})` }}><div className="bg-white rounded-2xl p-6"><div className="flex justify-between mb-6"><div className="w-16 h-16 rounded-2xl text-white text-3xl font-semibold inline-flex items-center justify-center" style={{ background: `linear-gradient(90deg, ${branding.primary}, ${branding.secondary})` }}>{branding.logoText}</div><div className="text-right"><p className="text-3xl font-semibold text-gray-900">INVOICE</p><p className="text-gray-600">INV-2026-001</p></div></div><div className="border-t border-gray-200 pt-4 text-gray-700">{branding.footerNotes}</div></div></div>
            </section>
            )}
          </>
        )}
      </main>
      </div>
    </RouteGuard>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center">
      <div className={`w-full ${wide ? "max-w-3xl" : "max-w-2xl"} rounded-3xl bg-white border-2 border-gray-200 p-8`}>
        <div className="flex items-center justify-between mb-6"><h3 className="text-2xl font-semibold text-gray-900">{title}</h3><button onClick={onClose}><X className="w-6 h-6 text-gray-500" /></button></div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onCancel, onSave, saveText }) {
  return <div className="mt-6 flex justify-end gap-3"><button onClick={onCancel} className="px-6 py-3 rounded-xl border-2 border-gray-300">Cancel</button><button onClick={onSave} className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white">{saveText}</button></div>;
}

function CardStat({ title, value, sub, sub2 }) {
  return <div className="bg-white border-2 border-gray-300 rounded-2xl p-6"><p className="text-gray-600 text-base">{title}</p><p className="text-4xl font-semibold text-gray-900">{value}</p><p className="text-base text-slate-500 mt-1">{sub}</p>{sub2 ? <p className="text-base text-slate-500">{sub2}</p> : null}</div>;
}

function InfoTile({ label, value }) {
  return <div className="rounded-2xl bg-slate-100 p-4"><p className="text-sm text-gray-500">{label}</p><p className="text-lg text-gray-900">{value}</p></div>;
}

function AuditTile({ label, value, subValue }) {
  return <div className="rounded-3xl bg-slate-100 p-4"><p className="text-xs text-slate-600">{label}</p><p className="text-sm text-gray-900">{value}</p>{subValue ? <p className="text-xs text-slate-600">{subValue}</p> : null}</div>;
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="block mb-2 text-gray-900">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border-2 border-gray-300 px-4 py-2" />
    </div>
  );
}

function TextField({ label, value, onChange }) {
  return (
    <div>
      <label className="block mb-2 text-gray-900">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} className="w-full min-h-28 rounded-xl border-2 border-gray-300 px-4 py-2" />
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div>
      <label className="block mb-2 text-gray-900">{label}</label>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full appearance-none rounded-xl border-2 border-gray-300 px-4 py-2 pr-10 bg-white">
          {options.map((opt) => <option key={opt}>{opt}</option>)}
        </select>
        <ChevronDown className="w-5 h-5 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}
