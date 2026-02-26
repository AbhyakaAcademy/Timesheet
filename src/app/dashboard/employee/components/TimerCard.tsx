"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock, Play, Square } from "lucide-react";

type ProjectOption = {
  id: number;
  name: string;
  code: string;
};

type ActivityEntry = {
  id: string;
  project: string;
  description: string;
  start: string;
  end: string;
  durationMinutes: number;
  dateLabel: string;
};

type ManualPayload = {
  projectId: number;
  note: string;
  startIso: string;
  endIso: string;
};

type TimerCardProps = {
  projects: ProjectOption[];
  activeEntry: { id: number; project: { id: number; name: string } } | null;
  entries: ActivityEntry[];
  onPunchIn: (payload: { projectId: number; note: string }) => Promise<void>;
  onPunchOut: (entryId: number, payload: { note: string }) => Promise<void>;
  onManualEntry: (payload: ManualPayload) => Promise<void>;
  busy: boolean;
};

const formatTime = (date: Date) =>
  date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins.toString().padStart(2, "0")}m`;
};

export function TimerCard({
  projects,
  activeEntry,
  entries,
  onPunchIn,
  onPunchOut,
  onManualEntry,
  busy,
}: TimerCardProps) {
  const [now, setNow] = useState(() => new Date());
  const [projectId, setProjectId] = useState<number | "">("");
  const [note, setNote] = useState("");

  const [manualProjectId, setManualProjectId] = useState<number | "">("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [manualStart, setManualStart] = useState("09:00");
  const [manualEnd, setManualEnd] = useState("10:00");
  const [manualError, setManualError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const totalMinutesToday = useMemo(() => {
    return entries.reduce((sum, entry) => sum + entry.durationMinutes, 0);
  }, [entries]);

  const handlePunchIn = async () => {
    if (!projectId) {
      setErrorMessage("Please select a project before punching in.");
      return;
    }
    setErrorMessage("");
    try {
      await onPunchIn({ projectId: Number(projectId), note });
      setNote("");
    } catch (error: any) {
      setErrorMessage(error.message || "Punch in failed.");
    }
  };

  const handlePunchOut = async () => {
    if (!activeEntry) return;
    setErrorMessage("");
    try {
      await onPunchOut(activeEntry.id, { note });
      setNote("");
    } catch (error: any) {
      setErrorMessage(error.message || "Punch out failed.");
    }
  };

  const handleManualEntry = async () => {
    if (!manualProjectId || !manualDate || !manualStart || !manualEnd) {
      setManualError("Project, date, start, and end time are required.");
      return;
    }

    const startIso = `${manualDate}T${manualStart}:00`;
    const endIso = `${manualDate}T${manualEnd}:00`;
    const startDate = new Date(startIso);
    const endDate = new Date(endIso);
    if (endDate <= startDate) {
      setManualError("End time must be after start time.");
      return;
    }

    setManualError("");
    try {
      await onManualEntry({
        projectId: Number(manualProjectId),
        note: manualDescription,
        startIso,
        endIso,
      });
      setManualDescription("");
    } catch (error: any) {
      setManualError(error.message || "Manual entry failed.");
    }
  };

  return (
    <section className="bg-white border-2 border-gray-300 rounded-2xl p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center">
          <Clock className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Punch In/Out</h2>
          <p className="text-sm text-gray-500">Track time by project and submit to timesheets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white px-6 py-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-gray-500">Current time</p>
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${activeEntry ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}`}>
              <span className={`h-2 w-2 rounded-full ${activeEntry ? "bg-emerald-500" : "bg-gray-400"}`} />
              {activeEntry ? "Clocked In" : "Clocked Out"}
            </span>
          </div>
          <p className="text-3xl md:text-4xl font-semibold tracking-[0.2em] text-gray-900">{formatTime(now)}</p>
          <p className="text-sm text-gray-500">{formatDate(now)}</p>
          {activeEntry ? <p className="text-sm text-indigo-700">Active project: {activeEntry.project.name}</p> : null}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-5 flex flex-col justify-between">
          <p className="text-xs uppercase tracking-wide text-gray-500">Total today</p>
          <p className="text-2xl font-semibold text-gray-900">{formatDuration(totalMinutesToday)}</p>
          <p className="text-xs text-gray-500">From logged entries</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <label className="text-sm font-medium text-gray-700">Project worked on</label>
          <div className="mt-2 flex flex-col md:flex-row gap-3">
            <select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value ? Number(event.target.value) : "")}
              className="w-full md:w-72 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={busy || !!activeEntry}
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name} ({project.code})</option>
              ))}
            </select>
            <button
              type="button"
              onClick={activeEntry ? handlePunchOut : handlePunchIn}
              disabled={busy}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white transition disabled:opacity-60 ${activeEntry ? "bg-gray-900 hover:bg-gray-800" : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"}`}
            >
              {activeEntry ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {activeEntry ? "Punch Out" : "Punch In"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <label className="text-sm font-medium text-gray-700">What are you working on? (optional)</label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Describe what you are working on..."
            className="mt-2 w-full min-h-[90px] rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {errorMessage ? <p className="text-xs text-rose-600">{errorMessage}</p> : null}
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-800">Recent Activity</h3>
        <div className="mt-3 space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">{entry.project}</p>
                {entry.description ? <p className="text-xs text-gray-500 mt-1">{entry.description}</p> : null}
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-600">
                  <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-1">In: {entry.start}</span>
                  <span className="rounded-full bg-rose-50 text-rose-700 px-2 py-1">Out: {entry.end}</span>
                  <span className="rounded-full bg-gray-100 text-gray-600 px-2 py-1">{entry.dateLabel}</span>
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-gray-400" />
                {formatDuration(entry.durationMinutes)}
              </div>
            </div>
          ))}
          {entries.length === 0 ? <p className="text-sm text-gray-500">No recent entries.</p> : null}
        </div>
      </div>

      <div className="mt-8 border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-800">Manual Time Entry</h3>
        <p className="text-xs text-gray-500 mt-1">Record time with date and start/end time.</p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600">Project</label>
            <select
              value={manualProjectId}
              onChange={(event) => setManualProjectId(event.target.value ? Number(event.target.value) : "")}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name} ({project.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Description (optional)</label>
            <input
              value={manualDescription}
              onChange={(event) => setManualDescription(event.target.value)}
              placeholder="What did you work on?"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Date</label>
            <input
              type="date"
              value={manualDate}
              onChange={(event) => setManualDate(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Start time</label>
              <input
                type="time"
                value={manualStart}
                onChange={(event) => setManualStart(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">End time</label>
              <input
                type="time"
                value={manualEnd}
                onChange={(event) => setManualEnd(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {manualError ? <p className="mt-2 text-xs text-rose-600">{manualError}</p> : null}
        <button
          type="button"
          onClick={handleManualEntry}
          disabled={busy}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-gray-800 border border-gray-300 bg-white hover:bg-gray-50 transition disabled:opacity-60"
        >
          Add Manual Entry
        </button>
      </div>
    </section>
  );
}
