"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";

const statusTone = {
  Pending: "border-amber-200 bg-amber-50 text-amber-700",
  Approved: "border-green-200 bg-green-50 text-green-600",
  Rejected: "border-red-200 bg-red-50 text-red-600",
};

function PersonIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="6" r="3" />
      <path d="M4.5 16a5.5 5.5 0 0 1 11 0" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="14" height="13" rx="2" />
      <path d="M6.5 2.8v2.4M13.5 2.8v2.4M3 8h14" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 6.5v3.8l2.6 1.5" />
    </svg>
  );
}

const displayDate = (isoDate) => {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function Table({ onPendingCountChange }) {
  const [filter, setFilter] = useState("All");
  const [timesheetsByStatus, setTimesheetsByStatus] = useState({ Pending: [], Approved: [], Rejected: [] });
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadTimesheets = useCallback(async () => {
    setErrorMessage("");
    setLoading(true);
    try {
      const [pending, approved, rejected] = await Promise.all([
        apiFetch("/manager/timesheets?status=pending"),
        apiFetch("/manager/timesheets?status=approved"),
        apiFetch("/manager/timesheets?status=rejected"),
      ]);

      const normalize = (list, status) =>
        (list || []).map((item) => ({
          id: item.id,
          code: `TS-${item.id}`,
          name: item.employee_name || item.employee_username || "Employee",
          email: item.employee_username || "-",
          weekEnding: displayDate(item.week_start),
          hours: Number(item.total_hours || 0),
          submitted: displayDate(item.week_start),
          status,
        }));

      const next = {
        Pending: normalize(pending, "Pending"),
        Approved: normalize(approved, "Approved"),
        Rejected: normalize(rejected, "Rejected"),
      };
      setTimesheetsByStatus(next);
      onPendingCountChange?.(next.Pending.length);
    } catch (error) {
      setErrorMessage(error.message || "Failed to load team timesheets.");
    } finally {
      setLoading(false);
    }
  }, [onPendingCountChange]);

  useEffect(() => {
    loadTimesheets();
  }, [loadTimesheets]);

  const counts = useMemo(
    () => ({
      Pending: timesheetsByStatus.Pending.length,
      Approved: timesheetsByStatus.Approved.length,
      Rejected: timesheetsByStatus.Rejected.length,
    }),
    [timesheetsByStatus]
  );

  const allRows = useMemo(
    () => [...timesheetsByStatus.Pending, ...timesheetsByStatus.Approved, ...timesheetsByStatus.Rejected],
    [timesheetsByStatus]
  );

  const filtered = useMemo(() => {
    if (filter === "All") return allRows;
    return allRows.filter((sheet) => sheet.status === filter);
  }, [filter, allRows]);

  const filters = [
    { key: "All", label: "All" },
    { key: "Pending", label: `Pending (${counts.Pending})` },
    { key: "Approved", label: `Approved (${counts.Approved})` },
    { key: "Rejected", label: `Rejected (${counts.Rejected})` },
  ];

  const openDetail = async (row) => {
    setSelectedTimesheet(row);
    setBusy(true);
    try {
      const detail = await apiFetch(`/manager/timesheets/${row.id}`);
      setSelectedDetail(detail);
    } catch (error) {
      setErrorMessage(error.message || "Unable to load timesheet detail.");
      setSelectedTimesheet(null);
      setSelectedDetail(null);
    } finally {
      setBusy(false);
    }
  };

  const runAction = async (action) => {
    if (!selectedTimesheet) return;
    const comment = window.prompt(`Optional ${action} comment`, "") || "";
    setBusy(true);
    try {
      await apiFetch(`/manager/timesheets/${selectedTimesheet.id}/${action}`, {
        method: "POST",
        body: JSON.stringify({ comment }),
      });
      setSelectedTimesheet(null);
      setSelectedDetail(null);
      await loadTimesheets();
    } catch (error) {
      setErrorMessage(error.message || `Unable to ${action} timesheet.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-base font-medium text-gray-700">Filter:</span>
        {filters.map((item) => {
          const active = item.key === filter;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                active ? "bg-blue-600 text-white" : "border border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {loading ? <p className="text-sm text-gray-600">Loading team timesheets...</p> : null}

      <div className="space-y-4">
        {filtered.map((row) => (
          <article key={row.id} className="rounded-xl border border-gray-200 bg-white p-4 transition hover:bg-gray-50">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <PersonIcon />
                  <h3 className="font-semibold text-gray-900">{row.name}</h3>
                  <span className="mx-1 text-sm text-gray-400">-</span>
                  <span className="text-sm text-gray-600">{row.email}</span>
                  <span className="mx-1 text-sm text-gray-400">-</span>
                  <span className="text-xs font-medium text-gray-500">{row.code}</span>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarIcon />
                    Week starting: {row.weekEnding}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ClockIcon />
                    {row.hours.toFixed(2)} hours
                  </span>
                </div>
              </div>

              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${statusTone[row.status]}`}>
                {row.status}
              </span>
            </div>

            <div className="mt-4 border-t border-gray-200 pt-3">
              <button type="button" onClick={() => openDetail(row)} className="text-sm font-medium text-blue-600 transition hover:text-blue-700">
                Review & Approve
              </button>
            </div>
          </article>
        ))}

        {!loading && filtered.length === 0 ? <p className="text-sm text-gray-500">No timesheets found for this filter.</p> : null}
      </div>

      {selectedTimesheet ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <header className="flex items-start justify-between bg-blue-600 px-6 py-4 text-white">
              <div>
                <h2 className="text-xl font-semibold">Timesheet Review</h2>
                <p className="mt-1 text-base">Week starting {selectedTimesheet.weekEnding}</p>
              </div>
              <button type="button" onClick={() => { setSelectedTimesheet(null); setSelectedDetail(null); }} className="rounded-md p-1.5 transition hover:bg-white/20" aria-label="Close timesheet review">
                <svg viewBox="0 0 20 20" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="m4 4 12 12M16 4 4 16" />
                </svg>
              </button>
            </header>

            <section className="max-h-[calc(90vh-96px)] overflow-y-auto">
              <div className="grid gap-6 border-b border-gray-200 bg-gray-50 px-6 py-6 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Employee</p>
                  <p className="text-xl font-semibold text-gray-900">{selectedTimesheet.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="text-xl font-semibold text-gray-900">{selectedDetail?.status || selectedTimesheet.status}</p>
                </div>
              </div>

              <div className="space-y-6 px-6 py-6">
                <h3 className="text-xl font-semibold text-gray-900">Time Entries</h3>

                <div className="space-y-4">
                  {(selectedDetail?.lines || []).map((entry) => (
                    <article key={entry.id} className="overflow-hidden rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-4">
                        <p className="text-lg font-semibold text-gray-900">{displayDate(entry.date)}</p>
                        <p className="text-lg font-medium text-gray-700">{Number(entry.hours).toFixed(2)} hours</p>
                      </div>
                      <div className="flex items-start justify-between px-5 py-4">
                        <div>
                          <p className="text-xl font-semibold text-gray-900">{entry.project?.name}</p>
                          <p className="mt-1 text-base text-gray-600">{entry.description || "No description"}</p>
                          <p className="mt-1 text-sm text-gray-500">Shift: {entry.shift}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                  {busy ? <p className="text-sm text-gray-500">Loading detail...</p> : null}
                </div>
              </div>

              <footer className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                <button type="button" onClick={() => { setSelectedTimesheet(null); setSelectedDetail(null); }} className="rounded-xl border border-gray-300 bg-white px-6 py-2 text-base font-medium text-gray-700 transition hover:bg-gray-100">
                  Close
                </button>
                <button type="button" disabled={busy || selectedDetail?.status !== "SUBMITTED"} onClick={() => runAction("reject")} className="rounded-xl bg-red-600 px-6 py-2 text-base font-semibold text-white transition hover:bg-red-700 disabled:opacity-60">
                  Reject
                </button>
                <button type="button" disabled={busy || selectedDetail?.status !== "SUBMITTED"} onClick={() => runAction("approve")} className="rounded-xl bg-green-600 px-6 py-2 text-base font-semibold text-white transition hover:bg-green-700 disabled:opacity-60">
                  Approve
                </button>
              </footer>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}
