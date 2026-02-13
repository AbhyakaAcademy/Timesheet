"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock, Play, Square } from "lucide-react";

type ActivityEntry = {
  id: string;
  project: string;
  description?: string;
  start: string;
  end?: string;
  durationMinutes: number;
  dateLabel: string;
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

type TimesheetDraft = {
  day: string;
  project: string;
  date: string;
  time: string;
  shift: string;
  description: string;
};

type TimerCardProps = {
  onAddTimesheetEntry?: (entry: TimesheetDraft) => void;
};

export function TimerCard({ onAddTimesheetEntry }: TimerCardProps) {
  const [now, setNow] = useState(() => new Date());
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [manualProject, setManualProject] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualDate, setManualDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [manualStart, setManualStart] = useState("09:00");
  const [manualEnd, setManualEnd] = useState("10:00");
  const [manualError, setManualError] = useState("");
  const [showProjectWarning, setShowProjectWarning] = useState(false);
  const [activeStart, setActiveStart] = useState<Date | null>(null);
  const [todayEntries, setTodayEntries] = useState<ActivityEntry[]>([
    {
      id: "entry-1",
      project: "Mobile Redesign",
      description: "Accessibility review and UI polish",
      start: "09:00 AM",
      end: "12:30 PM",
      durationMinutes: 210,
      dateLabel: formatDate(new Date()),
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const totalMinutesToday = useMemo(() => {
    return todayEntries.reduce((sum, entry) => sum + entry.durationMinutes, 0);
  }, [todayEntries]);

  const handlePunchIn = () => {
    if (!projectName.trim()) {
      setShowProjectWarning(true);
      return;
    }
    setShowProjectWarning(false);
    setIsClockedIn(true);
    setActiveStart(new Date());

    // TODO: API - create active time entry with project name and start time.
  };

  const handlePunchOut = () => {
    if (!activeStart) return;
    const endTime = new Date();
    const diffMinutes = Math.max(
      Math.round((endTime.getTime() - activeStart.getTime()) / 60000),
      1
    );

    const entry: ActivityEntry = {
      id: `entry-${Date.now()}`,
      project: projectName,
      description: taskDescription.trim() || undefined,
      start: formatTime(activeStart),
      end: formatTime(endTime),
      durationMinutes: diffMinutes,
      dateLabel: formatDate(endTime),
    };

    setTodayEntries((prev) => [entry, ...prev]);
    setIsClockedIn(false);
    setActiveStart(null);
    setTaskDescription("");

    const dayLabel = endTime.toLocaleDateString("en-US", {
      weekday: "long",
    });
    const dateLabel = endTime.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    onAddTimesheetEntry?.({
      day: dayLabel,
      project: projectName,
      date: dateLabel,
      time: `${formatTime(activeStart)} - ${formatTime(endTime)}`,
      shift: "Standard",
      description: taskDescription.trim() || "General work",
    });

    // TODO: API - close active time entry with end time and duration.
  };

  const handleManualEntry = () => {
    if (!manualProject.trim() || !manualDate || !manualStart || !manualEnd) {
      setManualError("Project, date, start, and end time are required.");
      return;
    }

    const startDate = new Date(`${manualDate}T${manualStart}`);
    const endDate = new Date(`${manualDate}T${manualEnd}`);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setManualError("Please enter valid start and end times.");
      return;
    }

    const diffMinutes = Math.max(
      Math.round((endDate.getTime() - startDate.getTime()) / 60000),
      1
    );

    const entry: ActivityEntry = {
      id: `manual-${Date.now()}`,
      project: manualProject.trim(),
      description: manualDescription.trim() || undefined,
      start: formatTime(startDate),
      end: formatTime(endDate),
      durationMinutes: diffMinutes,
      dateLabel: formatDate(startDate),
    };

    setTodayEntries((prev) => [entry, ...prev]);
    setManualError("");
    setManualProject("");
    setManualDescription("");

    const dayLabel = startDate.toLocaleDateString("en-US", {
      weekday: "long",
    });
    const dateLabel = startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    onAddTimesheetEntry?.({
      day: dayLabel,
      project: manualProject.trim(),
      date: dateLabel,
      time: `${formatTime(startDate)} - ${formatTime(endDate)}`,
      shift: "Standard",
      description: manualDescription.trim() || "Manual entry",
    });

    // TODO: API - create manual time entry with date, start, end, and description.
  };

  return (
    <section className="bg-white border-2 border-gray-300 rounded-2xl p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center">
          <Clock className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Punch In/Out</h2>
          <p className="text-sm text-gray-500">
            Track time by project and submit to timesheets
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white px-6 py-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Current time
            </p>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                isClockedIn
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isClockedIn ? "bg-emerald-500" : "bg-gray-400"
                }`}
              />
              {isClockedIn ? "Clocked In" : "Clocked Out"}
            </span>
          </div>
          <p className="text-3xl md:text-4xl font-semibold tracking-[0.2em] text-gray-900">
            {formatTime(now)}
          </p>
          <p className="text-sm text-gray-500">{formatDate(now)}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-5 flex flex-col justify-between">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Total today
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatDuration(totalMinutesToday)}
          </p>
          <p className="text-xs text-gray-500">Auto-calculated</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <label className="text-sm font-medium text-gray-700">
            Project worked on
          </label>
          <div className="mt-2 flex flex-col md:flex-row gap-3">
            <select
              value={projectName}
              onChange={(event) => {
                const value = event.target.value;
                setProjectName(value);
                if (value.trim()) setShowProjectWarning(false);
              }}
              className="w-full md:w-72 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select project</option>
              <option value="Mobile Redesign">Mobile Redesign</option>
              <option value="Billing Revamp">Billing Revamp</option>
              <option value="HRIS Refresh">HRIS Refresh</option>
            </select>
            <button
              type="button"
              onClick={isClockedIn ? handlePunchOut : handlePunchIn}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white transition ${
                isClockedIn
                  ? "bg-gray-900 hover:bg-gray-800"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
              }`}
            >
              {isClockedIn ? (
                <Square className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isClockedIn ? "Punch Out" : "Punch In"}
            </button>
          </div>
          {showProjectWarning && (
            <p className="mt-2 text-xs text-amber-600">
              Please enter a project before punching in.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <label className="text-sm font-medium text-gray-700">
            What are you working on? (optional)
          </label>
          <textarea
            value={taskDescription}
            onChange={(event) => setTaskDescription(event.target.value)}
            placeholder="Describe what you are working on..."
            className="mt-2 w-full min-h-[90px] rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-800">
          Today&apos;s Activity
        </h3>
        <div className="mt-3 space-y-3">
          {todayEntries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {entry.project}
                </p>
                {entry.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {entry.description}
                  </p>
                )}
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-600">
                  <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-1">
                    In: {entry.start}
                  </span>
                  {entry.end && (
                    <span className="rounded-full bg-rose-50 text-rose-700 px-2 py-1">
                      Out: {entry.end}
                    </span>
                  )}
                  <span className="rounded-full bg-gray-100 text-gray-600 px-2 py-1">
                    {entry.dateLabel}
                  </span>
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-gray-400" />
                {formatDuration(entry.durationMinutes)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-800">
          Manual Time Entry
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Record time with date and start/end time.
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600">Project</label>
            <input
              value={manualProject}
              onChange={(event) => setManualProject(event.target.value)}
              placeholder="Project name"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">
              Description (optional)
            </label>
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
              <label className="text-xs font-medium text-gray-600">
                Start time
              </label>
              <input
                type="time"
                value={manualStart}
                onChange={(event) => setManualStart(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">
                End time
              </label>
              <input
                type="time"
                value={manualEnd}
                onChange={(event) => setManualEnd(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {manualError && (
          <p className="mt-2 text-xs text-rose-600">{manualError}</p>
        )}
        <button
          type="button"
          onClick={handleManualEntry}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-gray-800 border border-gray-300 bg-white hover:bg-gray-50 transition"
        >
          Add Manual Entry
        </button>
      </div>
    </section>
  );
}
