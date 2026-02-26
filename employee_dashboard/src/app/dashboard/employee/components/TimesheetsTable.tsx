"use client";

import { useState } from "react";
import { CheckCircle2, Clock3, Pencil, Save, Trash2 } from "lucide-react";

type TimesheetRow = {
  id: string;
  day: string;
  project: string;
  date: string;
  time: string;
  shift: string;
  description: string;
  status: string;
};

type TimesheetsTableProps = {
  rows: TimesheetRow[];
  onSubmit: () => void;
  onEdit: () => void;
  onUpdateRow: (id: string, field: keyof TimesheetRow, value: string) => void;
  onDeleteRow: (id: string) => void;
  isEditing: boolean;
};

export function TimesheetsTable({
  rows,
  onSubmit,
  onEdit,
  onUpdateRow,
  onDeleteRow,
  isEditing,
}: TimesheetsTableProps) {
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  const startEditingRow = (id: string) => {
    setEditingRowId(id);
    onEdit();
  };

  const stopEditingRow = () => setEditingRowId(null);

  return (
    <section className="bg-white border-2 border-gray-300 rounded-2xl p-6 md:p-8 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">My Timesheets</h2>
          <p className="text-sm text-gray-500">
            Logged work time with edit and submit actions
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSubmit}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white hover:from-indigo-500 hover:to-purple-500 transition"
          >
            Submit
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[120px_200px_140px_160px_120px_220px_140px_90px] bg-gray-50 text-xs font-semibold text-gray-600 px-4 py-3">
            <span>Day</span>
            <span>Project Name</span>
            <span>Date</span>
            <span>Time</span>
            <span>Shift</span>
            <span>Description</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          {rows.map((row) => {
            const isRowEditing = isEditing && editingRowId === row.id;
            return (
              <div
                key={row.id}
                className="grid grid-cols-[120px_200px_140px_160px_120px_220px_140px_90px] px-4 py-3 text-sm text-gray-700 border-t border-gray-100"
              >
                <span className="font-medium text-gray-900">{row.day}</span>
                <span>
                  {isRowEditing ? (
                    <input
                      value={row.project}
                      onChange={(event) =>
                        onUpdateRow(row.id, "project", event.target.value)
                      }
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                    />
                  ) : (
                    row.project
                  )}
                </span>
                <span>
                  {isRowEditing ? (
                    <input
                      value={row.date}
                      onChange={(event) =>
                        onUpdateRow(row.id, "date", event.target.value)
                      }
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                    />
                  ) : (
                    row.date
                  )}
                </span>
                <span>
                  {isRowEditing ? (
                    <input
                      value={row.time}
                      onChange={(event) =>
                        onUpdateRow(row.id, "time", event.target.value)
                      }
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                    />
                  ) : (
                    row.time
                  )}
                </span>
                <span>
                  {isRowEditing ? (
                    <input
                      value={row.shift}
                      onChange={(event) =>
                        onUpdateRow(row.id, "shift", event.target.value)
                      }
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                    />
                  ) : (
                    row.shift
                  )}
                </span>
                <span>
                  {isRowEditing ? (
                    <input
                      value={row.description}
                      onChange={(event) =>
                        onUpdateRow(row.id, "description", event.target.value)
                      }
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                    />
                  ) : (
                    row.description
                  )}
                </span>
                <span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                      row.status === "Approved"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {row.status === "Approved" ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Clock3 className="h-3.5 w-3.5" />
                    )}
                    {row.status}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  {isRowEditing ? (
                    <button
                      type="button"
                      onClick={stopEditingRow}
                      className="rounded-full p-1 text-emerald-600 hover:bg-emerald-50"
                      aria-label="Save row"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEditingRow(row.id)}
                      className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
                      aria-label="Edit row"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteRow(row.id)}
                    className="rounded-full p-1 text-rose-600 hover:bg-rose-50"
                    aria-label="Delete row"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* TODO: API - fetch/save timesheet rows, submit for approval. */}
    </section>
  );
}
