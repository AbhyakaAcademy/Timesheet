"use client";

import { useMemo, useState } from "react";

const timesheets = [
  {
    id: 1,
    name: "Sarah Chen",
    email: "sarah.chen@company.com",
    weekEnding: "Feb 7, 2026",
    hours: 40,
    submitted: "Feb 3, 2:30 PM",
    status: "Pending",
  },
  {
    id: 2,
    name: "Michael Johnson",
    email: "michael.johnson@company.com",
    weekEnding: "Feb 7, 2026",
    hours: 42,
    submitted: "Feb 4, 9:15 AM",
    status: "Pending",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    email: "emily.rodriguez@company.com",
    weekEnding: "Feb 7, 2026",
    hours: 38,
    submitted: "Feb 5, 4:45 PM",
    status: "Pending",
  },
  {
    id: 4,
    name: "David Park",
    email: "david.park@company.com",
    weekEnding: "Feb 7, 2026",
    hours: 40,
    submitted: "Feb 6, 10:20 AM",
    status: "Approved",
  },
  {
    id: 5,
    name: "Jessica Taylor",
    email: "jessica.taylor@company.com",
    weekEnding: "Feb 7, 2026",
    hours: 36,
    submitted: "Feb 6, 3:00 PM",
    status: "Rejected",
  },
];

const statusTone = {
  Pending: "border-amber-200 bg-amber-50 text-amber-700",
  Approved: "border-green-200 bg-green-50 text-green-600",
  Rejected: "border-red-200 bg-red-50 text-red-600",
};

const statusIcon = {
  Pending: (
    <svg
      viewBox="0 0 20 20"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="10" cy="10" r="8" />
      <path d="M10 6v5" />
      <circle cx="10" cy="13.5" r="0.5" fill="currentColor" />
    </svg>
  ),
  Approved: (
    <svg
      viewBox="0 0 20 20"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="10" cy="10" r="8" />
      <path d="m6.5 10.2 2.2 2.2 4.8-5.1" />
    </svg>
  ),
  Rejected: (
    <svg
      viewBox="0 0 20 20"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="10" cy="10" r="8" />
      <path d="m7 7 6 6M13 7l-6 6" />
    </svg>
  ),
};

function PersonIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 text-gray-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="10" cy="6" r="3" />
      <path d="M4.5 16a5.5 5.5 0 0 1 11 0" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 text-gray-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="14" height="13" rx="2" />
      <path d="M6.5 2.8v2.4M13.5 2.8v2.4M3 8h14" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 text-gray-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 6.5v3.8l2.6 1.5" />
    </svg>
  );
}

export default function Table() {
  const [filter, setFilter] = useState("All");
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);

  const counts = useMemo(
    () =>
      timesheets.reduce(
        (acc, item) => {
          acc[item.status] += 1;
          return acc;
        },
        { Pending: 0, Approved: 0, Rejected: 0 },
      ),
    [],
  );

  const filtered = useMemo(() => {
    if (filter === "All") {
      return timesheets;
    }
    return timesheets.filter((sheet) => sheet.status === filter);
  }, [filter]);

  const filters = [
    { key: "All", label: "All" },
    { key: "Pending", label: `Pending (${counts.Pending})` },
    { key: "Approved", label: `Approved (${counts.Approved})` },
    { key: "Rejected", label: `Rejected (${counts.Rejected})` },
  ];

  const timeEntriesBySheet = {
    1: [
      {
        dateLabel: "Monday, February 2, 2026",
        total: 8,
        project: "Project Alpha",
        task: "Sprint planning and task breakdown",
        hours: 8,
      },
      {
        dateLabel: "Tuesday, February 3, 2026",
        total: 8,
        project: "Project Alpha",
        task: "UI implementation for dashboard cards",
        hours: 8,
      },
    ],
    2: [
      {
        dateLabel: "Tuesday, February 3, 2026",
        total: 9,
        project: "Project Gamma",
        task: "Backend API development",
        hours: 9,
      },
      {
        dateLabel: "Wednesday, February 4, 2026",
        total: 8,
        project: "Project Gamma",
        task: "Database schema design",
        hours: 8,
      },
    ],
    3: [
      {
        dateLabel: "Thursday, February 5, 2026",
        total: 7,
        project: "Project Delta",
        task: "Integration testing",
        hours: 7,
      },
      {
        dateLabel: "Friday, February 6, 2026",
        total: 8,
        project: "Project Delta",
        task: "Bug fixes and documentation",
        hours: 8,
      },
    ],
    4: [
      {
        dateLabel: "Thursday, February 5, 2026",
        total: 8,
        project: "Project Beta",
        task: "Analytics module review",
        hours: 8,
      },
    ],
    5: [
      {
        dateLabel: "Friday, February 6, 2026",
        total: 6,
        project: "Project Omega",
        task: "Requirement clarifications",
        hours: 6,
      },
    ],
  };

  const selectedEntries = selectedTimesheet ? timeEntriesBySheet[selectedTimesheet.id] ?? [] : [];

  return (
    <div className="space-y-5">
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
                active
                  ? "bg-blue-600 text-white"
                  : "border border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {filtered.map((row) => (
          <article
            key={row.id}
            className="rounded-xl border border-gray-200 bg-white p-4 transition hover:bg-gray-50"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <PersonIcon />
                  <h3 className="font-semibold text-gray-900">{row.name}</h3>
                  <span className="mx-1 text-sm text-gray-400">-</span>
                  <span className="text-sm text-gray-600">{row.email}</span>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarIcon />
                    Week ending: {row.weekEnding}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ClockIcon />
                    {row.hours} hours
                  </span>
                  <span className="text-xs text-gray-500">Submitted: {row.submitted}</span>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${statusTone[row.status]}`}
              >
                {statusIcon[row.status]}
                {row.status}
              </span>
            </div>

            <div className="mt-4 border-t border-gray-200 pt-3">
              <button
                type="button"
                onClick={() => setSelectedTimesheet(row)}
                className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
              >
                Review & Approve
              </button>
            </div>
          </article>
        ))}
      </div>

      {selectedTimesheet ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <header className="flex items-start justify-between bg-blue-600 px-6 py-4 text-white">
              <div>
                <h2 className="text-xl font-semibold">Timesheet Review</h2>
                <p className="mt-1 text-base">Week ending {selectedTimesheet.weekEnding}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTimesheet(null)}
                className="rounded-md p-1.5 transition hover:bg-white/20"
                aria-label="Close timesheet review"
              >
                <svg
                  viewBox="0 0 20 20"
                  className="h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                >
                  <path d="m4 4 12 12M16 4 4 16" />
                </svg>
              </button>
            </header>

            <section className="max-h-[calc(90vh-96px)] overflow-y-auto">
              <div className="grid gap-6 border-b border-gray-200 bg-gray-50 px-6 py-6 md:grid-cols-2">
                <div className="flex items-start gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <PersonIcon />
                  </span>
                  <div>
                    <p className="text-sm text-gray-500">Employee</p>
                    <p className="text-xl font-semibold text-gray-900">{selectedTimesheet.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <svg
                      viewBox="0 0 20 20"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2.7" y="4.2" width="14.6" height="11.6" rx="2" />
                      <path d="m3.7 5.5 6.3 5.2 6.3-5.2" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-xl font-semibold text-gray-900">{selectedTimesheet.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <CalendarIcon />
                  </span>
                  <div>
                    <p className="text-sm text-gray-500">Submitted Date</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {selectedTimesheet.submitted.replace(", ", ", 2026 ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <ClockIcon />
                  </span>
                  <div>
                    <p className="text-sm text-gray-500">Total Hours</p>
                    <p className="text-xl font-semibold text-gray-900">{selectedTimesheet.hours} hours</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 px-6 py-6">
                <h3 className="text-xl font-semibold text-gray-900">Time Entries</h3>

                <div className="space-y-4">
                  {selectedEntries.map((entry) => (
                    <article key={entry.dateLabel} className="overflow-hidden rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-4">
                        <p className="text-lg font-semibold text-gray-900">{entry.dateLabel}</p>
                        <p className="text-lg font-medium text-gray-700">{entry.total} hours</p>
                      </div>
                      <div className="flex items-start justify-between px-5 py-4">
                        <div>
                          <p className="text-xl font-semibold text-gray-900">{entry.project}</p>
                          <p className="mt-1 text-base text-gray-600">{entry.task}</p>
                        </div>
                        <p className="text-xl font-semibold text-gray-900">{entry.hours}h</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <footer className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setSelectedTimesheet(null)}
                  className="rounded-xl border border-gray-300 bg-white px-6 py-2 text-base font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTimesheet(null)}
                  className="rounded-xl bg-red-600 px-6 py-2 text-base font-semibold text-white transition hover:bg-red-700"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTimesheet(null)}
                  className="rounded-xl bg-green-600 px-6 py-2 text-base font-semibold text-white transition hover:bg-green-700"
                >
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
