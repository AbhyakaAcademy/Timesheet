"use client";

import { useEffect, useMemo, useState } from "react";

import DashboardFrame from "@/components/dashboard/DashboardFrame";
import { apiFetch } from "@/lib/api";
import { getManagerDashboardSlice, setManagerDashboardSlice } from "@/lib/managerDashboardStorage";

const defaultEmployees = [];

const emptyForm = {
  name: "",
  email: "",
  department: "",
  role: "Employee",
  status: "Invite Pending",
  employeeCode: "",
  hourlyRate: "",
  biWeeklyPay: "",
  monthlyPay: "",
  annualPay: "",
};

function normalizeEmployee(employee) {
  return {
    id: employee.id,
    name: employee.name || employee.username || "",
    email: employee.email || "",
    department: employee.department || "General",
    role: employee.role === "employee" ? "Employee" : employee.role || "Employee",
    status: employee.invitation_pending ? "Invite Pending" : employee.status || "Active",
    employeeCode: `EMP-${String(employee.id).padStart(3, "0")}`,
    hourlyRate: 0,
    biWeeklyPay: 0,
    monthlyPay: 0,
    annualPay: 0,
    invitationUrl: employee.invitation_url || "",
  };
}

const formatCurrency = (value) =>
  `Rs ${Number(value || 0).toLocaleString("en-IN")}`;

const rateOptions = [
  { key: "hourlyRate", label: "Hourly" },
  { key: "biWeeklyPay", label: "Bi-Weekly" },
  { key: "monthlyPay", label: "Monthly" },
  { key: "annualPay", label: "Annual" },
];

export default function ManagerEmployeesPage() {
  const [pendingCount] = useState(() => getManagerDashboardSlice("reportsPendingCount", 0));
  const [employees, setEmployees] = useState(defaultEmployees);
  const [rateSelections, setRateSelections] = useState(() =>
    getManagerDashboardSlice("managerEmployeeRateSelections", {})
  );
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [employeeForm, setEmployeeForm] = useState(emptyForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    let active = true;

    apiFetch("/manager/employees")
      .then((data) => {
        if (!active) return;
        setEmployees((data || []).map(normalizeEmployee));
      })
      .catch((error) => {
        if (!active) return;
        setErrorMessage(error.message || "Unable to load employees.");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setManagerDashboardSlice("managerEmployees", employees);
  }, [employees]);

  useEffect(() => {
    setManagerDashboardSlice("managerEmployeeRateSelections", rateSelections);
  }, [rateSelections]);

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.status === "Active").length,
    [employees]
  );

  const handleAddEmployee = async () => {
    const name = employeeForm.name.trim();
    const email = employeeForm.email.trim();
    const department = employeeForm.department.trim();
    const employeeCode = employeeForm.employeeCode.trim();

    if (!name || !email || !department || !employeeCode) {
      setErrorMessage("Enter all employee details before saving.");
      return;
    }

    const emailAlreadyExists = employees.some(
      (employee) => employee.email.toLowerCase() === email.toLowerCase()
    );

    if (emailAlreadyExists) {
      setErrorMessage("This employee email is already added.");
      return;
    }

    try {
      const savedEmployee = await apiFetch("/manager/employees", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          department,
        }),
      });

      const nextEmployee = {
        ...normalizeEmployee(savedEmployee),
        employeeCode,
        hourlyRate: Number(employeeForm.hourlyRate) || 0,
        biWeeklyPay: Number(employeeForm.biWeeklyPay) || 0,
        monthlyPay: Number(employeeForm.monthlyPay) || 0,
        annualPay: Number(employeeForm.annualPay) || 0,
      };

      setEmployees((current) => [nextEmployee, ...current]);
      setEmployeeForm(emptyForm);
      setErrorMessage("");
      setIsAddOpen(false);
      setToast(savedEmployee.invitation_url ? "Employee invited. Invite link generated." : "Employee invited by email.");
    } catch (error) {
      setErrorMessage(error.message || "Unable to invite employee.");
    }
  };

  useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  return (
    <DashboardFrame activeTab="employees" pendingCount={pendingCount}>
      <div className="space-y-6">
        {toast ? (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {toast}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
            <p className="text-sm text-slate-500">Total Employees</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{employees.length}</p>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
            <p className="text-sm text-slate-500">Active Employees</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{activeEmployees}</p>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
            <p className="text-sm text-slate-500">Departments</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {new Set(employees.map((employee) => employee.department)).size}
            </p>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Employee Details</h2>
              <p className="mt-1 text-sm text-slate-500">
                View your team and add employees when needed.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(true);
                setErrorMessage("");
              }}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Add Employee
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Employee
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Department
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Role
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Employee ID
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Rates
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {employees.map((employee) => {
                  const selectedRateKey = rateSelections[employee.id] || "hourlyRate";
                  const selectedRate = rateOptions.find((option) => option.key === selectedRateKey) || rateOptions[0];

                  return (
                    <tr key={employee.id}>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{employee.name}</div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{employee.email}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{employee.department}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{employee.role}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            employee.status === "Active"
                              ? "bg-green-50 text-green-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {employee.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{employee.employeeCode}</td>
                      <td className="px-5 py-4">
                        <div className="flex min-w-56 items-center gap-3">
                          <select
                            value={selectedRate.key}
                            onChange={(event) =>
                              setRateSelections((prev) => ({
                                ...prev,
                                [employee.id]: event.target.value,
                              }))
                            }
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500"
                            aria-label={`Rate type for ${employee.name}`}
                          >
                            {rateOptions.map((option) => (
                              <option key={option.key} value={option.key}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <span className="whitespace-nowrap text-sm font-semibold text-slate-800">
                            {formatCurrency(employee[selectedRate.key])}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {isAddOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Add Employee</h3>
                <p className="mt-1 text-sm text-slate-500">Enter the basic employee details.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddOpen(false);
                  setEmployeeForm(emptyForm);
                  setErrorMessage("");
                }}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close add employee"
              >
                <svg
                  viewBox="0 0 20 20"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="m5 5 10 10M15 5 5 15" />
                </svg>
              </button>
            </div>

            <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Name</span>
                <input
                  value={employeeForm.name}
                  onChange={(event) => setEmployeeForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Enter employee name"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <input
                  value={employeeForm.email}
                  onChange={(event) => setEmployeeForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="Enter employee email"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Department</span>
                <input
                  value={employeeForm.department}
                  onChange={(event) => setEmployeeForm((prev) => ({ ...prev, department: event.target.value }))}
                  placeholder="Enter department"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Employee ID</span>
                <input
                  value={employeeForm.employeeCode}
                  onChange={(event) => setEmployeeForm((prev) => ({ ...prev, employeeCode: event.target.value }))}
                  placeholder="Enter employee ID"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Role</span>
                <select
                  value={employeeForm.role}
                  onChange={(event) => setEmployeeForm((prev) => ({ ...prev, role: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                >
                  <option value="Employee">Employee</option>
                  <option value="Lead">Lead</option>
                  <option value="Intern">Intern</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Status</span>
                <select
                  value={employeeForm.status}
                  onChange={(event) => setEmployeeForm((prev) => ({ ...prev, status: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Hourly Pay</span>
                <input
                  type="number"
                  min="1"
                  value={employeeForm.hourlyRate}
                  onChange={(event) => setEmployeeForm((prev) => ({ ...prev, hourlyRate: event.target.value }))}
                  placeholder="Enter hourly pay"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Bi-Weekly Pay</span>
                <input
                  type="number"
                  min="1"
                  value={employeeForm.biWeeklyPay}
                  onChange={(event) => setEmployeeForm((prev) => ({ ...prev, biWeeklyPay: event.target.value }))}
                  placeholder="Enter bi-weekly pay"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Monthly Pay</span>
                <input
                  type="number"
                  min="1"
                  value={employeeForm.monthlyPay}
                  onChange={(event) => setEmployeeForm((prev) => ({ ...prev, monthlyPay: event.target.value }))}
                  placeholder="Enter monthly pay"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Annual Pay</span>
                <input
                  type="number"
                  min="1"
                  value={employeeForm.annualPay}
                  onChange={(event) => setEmployeeForm((prev) => ({ ...prev, annualPay: event.target.value }))}
                  placeholder="Enter annual pay"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                />
              </label>
            </div>

            {errorMessage ? (
              <div className="px-6 pb-2 text-sm font-medium text-rose-600">{errorMessage}</div>
            ) : null}

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setIsAddOpen(false);
                  setEmployeeForm(emptyForm);
                  setErrorMessage("");
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddEmployee}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Save Employee
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardFrame>
  );
}
