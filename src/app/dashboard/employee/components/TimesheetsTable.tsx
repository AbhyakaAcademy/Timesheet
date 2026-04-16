"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, Pencil, Save } from "lucide-react";

type ProjectOption = {
  id: number;
  name: string;
  code: string;
};

type TimesheetRow = {
  id: number;
  date: string;
  projectId: number;
  projectName: string;
  hours: number;
  durationSeconds?: number;
  shift: string;
  description: string;
  status: string;
};

type TimesheetsTableProps = {
  rows: TimesheetRow[];
  status: string;
  projects: ProjectOption[];
  historyTimesheets: {
    id: number;
    week_start: string;
    status: string;
    total_hours: number;
  }[];
  onSubmit: () => Promise<void>;
  onUpdateRow: (id: number, payload: Partial<TimesheetRow>) => Promise<void>;
  busy: boolean;
};

type DraftTimesheetRow = Partial<TimesheetRow> & {
  durationInput?: string;
};

const formatTrackedTime = (secondsValue: number) => {
  const totalSeconds = Math.max(Math.round(Number(secondsValue || 0)), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours === 0 && minutes === 0) return `${seconds}s`;
  if (hours === 0) return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  if (seconds === 0 && minutes === 0) return `${hours}h`;
  if (seconds === 0) return `${hours}h ${minutes}m`;
  if (minutes === 0) return `${hours}h ${seconds}s`;
  return `${hours}h ${minutes}m`;
};

const formatDisplayDate = (dateValue: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [year, month, day] = dateValue.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return new Date(dateValue).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const toDurationInputValue = (hoursValue: number) => {
  const totalMinutes = Math.max(Math.round(Number(hoursValue || 0) * 60), 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const parseDurationInput = (value: string) => {
  const normalized = value.trim();
  const match = normalized.match(/^(\d{1,2}):([0-5]\d)$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 24 || (hours === 24 && minutes > 0)) return null;

  return Number((hours + minutes / 60).toFixed(2));
};

const formatDurationTypingValue = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

export function TimesheetsTable({
  rows,
  status,
  projects,
  historyTimesheets,
  onSubmit,
  onUpdateRow,
  busy,
}: TimesheetsTableProps) {
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [draftRow, setDraftRow] = useState<DraftTimesheetRow>({});
  const [errorMessage, setErrorMessage] = useState("");

  const isDraft = status === "DRAFT";
  const totalSeconds = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.durationSeconds || Math.round(Number(row.hours || 0) * 3600)), 0),
    [rows]
  );

  const startEditingRow = (row: TimesheetRow) => {
    setEditingRowId(row.id);
    setDraftRow({
      ...row,
      durationInput: toDurationInputValue(row.hours),
    });
  };

  const stopEditingRow = () => {
    setEditingRowId(null);
    setDraftRow({});
  };

  const saveRow = async () => {
    if (!editingRowId) return;
    setErrorMessage("");
    try {
      const nextPayload = { ...draftRow };
      if (typeof draftRow.durationInput === "string") {
        const parsedHours = parseDurationInput(draftRow.durationInput);
        if (parsedHours === null) {
          setErrorMessage("Enter time in HH:MM format, for example 02:30.");
          return;
        }
        nextPayload.hours = parsedHours;
      }
      delete nextPayload.durationInput;
      await onUpdateRow(editingRowId, nextPayload);
      stopEditingRow();
    } catch (error: any) {
      setErrorMessage(error.message || "Unable to update line.");
    }
  };

  const submitTimesheet = async () => {
    setErrorMessage("");
    try {
      await onSubmit();
    } catch (error: any) {
      setErrorMessage(error.message || "Unable to submit timesheet.");
    }
  };

  return (
    <section className="bg-white border-2 border-gray-300 rounded-2xl p-6 md:p-8 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">My Timesheet</h2>
          <p className="text-sm text-gray-500">Current week entries and approval status</p>
          <p className="mt-1 text-xs font-medium text-indigo-700">Status: {status}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={submitTimesheet}
            disabled={!isDraft || busy || rows.length === 0}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white hover:from-indigo-500 hover:to-purple-500 transition disabled:opacity-60"
          >
            Submit
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 overflow-x-auto">
        <div className="min-w-[860px]">
          <div className="grid grid-cols-[140px_220px_120px_120px_220px_120px_90px] bg-gray-50 text-xs font-semibold text-gray-600 px-4 py-3">
            <span>Date</span>
            <span>Project</span>
            <span>Hours</span>
            <span>Shift</span>
            <span>Description</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          {rows.map((row) => {
            const isRowEditing = isDraft && editingRowId === row.id;
            return (
              <div
                key={row.id}
                className="grid grid-cols-[140px_220px_120px_120px_220px_120px_90px] px-4 py-3 text-sm text-gray-700 border-t border-gray-100"
              >
                <span className="font-medium text-gray-900">{row.date}</span>
                <span>
                  {isRowEditing ? (
                    <select
                      value={draftRow.projectId || row.projectId}
                      onChange={(event) => {
                        const nextId = Number(event.target.value);
                        const selected = projects.find((project) => project.id === nextId);
                        setDraftRow((prev) => ({ ...prev, projectId: nextId, projectName: selected?.name || row.projectName }));
                      }}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                    >
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>{project.name} ({project.code})</option>
                      ))}
                    </select>
                  ) : (
                    row.projectName
                  )}
                </span>
                <span>
                  {isRowEditing ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="HH:MM"
                      value={String(draftRow.durationInput ?? toDurationInputValue(row.hours))}
                      onChange={(event) =>
                        setDraftRow((prev) => ({
                          ...prev,
                          durationInput: formatDurationTypingValue(event.target.value),
                        }))
                      }
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                    />
                  ) : (
                    formatTrackedTime(Number(row.durationSeconds || Math.round(Number(row.hours || 0) * 3600)))
                  )}
                </span>
                <span>
                  {isRowEditing ? (
                    <select
                      value={String(draftRow.shift ?? row.shift)}
                      onChange={(event) => setDraftRow((prev) => ({ ...prev, shift: event.target.value }))}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                    >
                      <option value="DAY">DAY</option>
                      <option value="EVENING">EVENING</option>
                      <option value="NIGHT">NIGHT</option>
                    </select>
                  ) : (
                    row.shift
                  )}
                </span>
                <span>
                  {isRowEditing ? (
                    <input
                      value={String(draftRow.description ?? row.description)}
                      onChange={(event) => setDraftRow((prev) => ({ ...prev, description: event.target.value }))}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                    />
                  ) : (
                    row.description || "-"
                  )}
                </span>
                <span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${row.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : row.status === "REJECTED" ? "bg-rose-100 text-rose-700" : row.status === "SUBMITTED" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"}`}>
                    {row.status === "APPROVED" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                    {row.status}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  {isRowEditing ? (
                    <button
                      type="button"
                      onClick={saveRow}
                      disabled={busy}
                      className="rounded-full p-1 text-emerald-600 hover:bg-emerald-50 disabled:opacity-60"
                      aria-label="Save row"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEditingRow(row)}
                      disabled={!isDraft || busy}
                      className="rounded-full p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-60"
                      aria-label="Edit row"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                </span>
              </div>
            );
          })}

          {rows.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-500 border-t border-gray-100">No timesheet lines yet. Punch in/out or add manual entry.</div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-700">
        <span>Total hours</span>
        <span className="font-semibold">{formatTrackedTime(totalSeconds)}</span>
      </div>

      {errorMessage ? <p className="mt-3 text-xs text-rose-600">{errorMessage}</p> : null}

      {historyTimesheets.length > 0 ? (
        <div className="mt-8 border-t border-gray-200 pt-5">
          <h3 className="text-sm font-semibold text-gray-800">Previous Timesheets</h3>
          <div className="mt-3 rounded-2xl border border-gray-200 overflow-x-auto">
            <div className="min-w-[860px]">
              <div className="grid grid-cols-[180px_220px_120px_120px_220px_120px] bg-gray-50 text-xs font-semibold text-gray-600 px-4 py-3">
                <span>Date</span>
                <span>Project</span>
                <span>Hours</span>
                <span>Shift</span>
                <span>Description</span>
                <span>Status</span>
              </div>

              {historyTimesheets.map((sheet) => (
                <div
                  key={sheet.id}
                  className="grid grid-cols-[180px_220px_120px_120px_220px_120px] px-4 py-3 text-sm text-gray-700 border-t border-gray-100"
                >
                  <span className="font-medium text-gray-900">{formatDisplayDate(sheet.week_start)}</span>
                  <span>Timesheet TS-{sheet.id}</span>
                  <span>{formatTrackedTime(Math.round(Number(sheet.total_hours || 0) * 3600))}</span>
                  <span>-</span>
                  <span>Week submission</span>
                  <span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${sheet.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : sheet.status === "REJECTED" ? "bg-rose-100 text-rose-700" : sheet.status === "SUBMITTED" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"}`}>
                      {sheet.status}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
