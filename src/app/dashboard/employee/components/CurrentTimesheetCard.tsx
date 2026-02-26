"use client";

import { useMemo, useState } from "react";
import { FileText, Send } from "lucide-react";

export type TimesheetRow = {
  id: string;
  project: string;
  task: string;
  hours: number;
  status: "Draft" | "Pending";
};

type CurrentTimesheetCardProps = {
  rows: TimesheetRow[];
  onSubmit: () => void;
  onEdit: () => void;
  onUpdateRow: (id: string, field: "task" | "hours", value: string) => void;
  isEditing: boolean;
};

export function CurrentTimesheetCard({
  rows,
  onSubmit,
  onEdit,
  onUpdateRow,  isEditing,
}: CurrentTimesheetCardProps) {
  const [note, setNote] = useState("");

  const totalHours = useMemo(
    () => rows.reduce((sum, row) => sum + row.hours, 0),
    [rows]
  );

  return (
    <section className="bg-white border-2 border-gray-300 rounded-2xl p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center">
          <FileText className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Current Timesheet
          </h2>
          <p className="text-sm text-gray-500">
            Review entries and submit for approval
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 bg-gray-50 text-xs font-semibold text-gray-600 px-4 py-3">
          <span>Project</span>
          <span>Task</span>
          <span>Hours</span>
          <span>Status</span>
        </div>
        {rows.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-1 md:grid-cols-4 px-4 py-3 text-sm text-gray-700 border-t border-gray-100"
          >
            <span className="font-medium text-gray-900">{row.project}</span>
            <span>
              {isEditing ? (
                <input
                  value={row.task}
                  onChange={(event) =>
                    onUpdateRow(row.id, "task", event.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                row.task
              )}
            </span>
            <span>
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  value={row.hours}
                  onChange={(event) =>
                    onUpdateRow(row.id, "hours", event.target.value)
                  }
                  className="w-full max-w-[120px] rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                `${row.hours.toFixed(1)}h`
              )}
            </span>
            <span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  row.status === "Pending"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {row.status}
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-600">Total hours</p>
          <p className="text-xl font-semibold text-gray-900">
            {totalHours.toFixed(1)}h
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-gray-800 border border-gray-300 bg-white hover:bg-gray-50 transition"
          >
            Edit Submitted Timesheet
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition"
          >
            <Send className="h-4 w-4" />
            Submit for Approval
          </button>
        </div>
      </div>

      <div className="mt-5">
        <label className="text-sm font-medium text-gray-700">
          Submission note (optional)
        </label>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Add context for your manager"
          className="mt-2 w-full min-h-[90px] rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* TODO: API - save submission notes and attach to approval request. */}
    </section>
  );
}

