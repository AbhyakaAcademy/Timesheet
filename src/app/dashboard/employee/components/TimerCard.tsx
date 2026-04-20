"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock, Play, Square, Upload } from "lucide-react";

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
  activeEntry: { id: number; project: { id: number; name: string }; start_time?: string | null } | null;
  entries: ActivityEntry[];
  todayHours: number;
  maxDailyHours: number;
  onPunchIn: (payload: { projectId: number; note: string }) => Promise<void>;
  onPunchOut: (entryId: number, payload: { note: string }) => Promise<void>;
  onManualEntry: (payload: ManualPayload) => Promise<void>;
  onFilesUpload: (files: File[]) => Promise<void>;
  busy: boolean;
};

const formatTime = (date: Date) =>
  date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const getLocalDateValue = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const timeZoneOptionGroups = [
  {
    label: "India",
    options: [{ value: "Asia/Kolkata", label: "India (IST)" }],
  },
  {
    label: "United States",
    options: [
      { value: "America/New_York", label: "Eastern Time (ET)" },
      { value: "America/Chicago", label: "Central Time (CT)" },
      { value: "America/Denver", label: "Mountain Time (MT)" },
      { value: "America/Phoenix", label: "Arizona Time (MST)" },
      { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
      { value: "America/Anchorage", label: "Alaska Time (AKT)" },
      { value: "America/Adak", label: "Hawaii-Aleutian Time (HAT)" },
      { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
      { value: "America/Puerto_Rico", label: "Atlantic Time (Puerto Rico)" },
      { value: "Pacific/Pago_Pago", label: "Samoa Time (American Samoa)" },
      { value: "Pacific/Guam", label: "Chamorro Time (Guam)" },
    ],
  },
  {
    label: "United Kingdom",
    options: [{ value: "Europe/London", label: "UK (GMT/BST)" }],
  },
];

const getDateValueForTimeZone = (timeZone: string, value = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);

  const partMap = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${partMap.year}-${partMap.month}-${partMap.day}`;
};

const getTimeZoneOffsetMinutes = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const partMap = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const zonedTime = Date.UTC(
    Number(partMap.year),
    Number(partMap.month) - 1,
    Number(partMap.day),
    Number(partMap.hour),
    Number(partMap.minute),
    Number(partMap.second)
  );

  return (zonedTime - date.getTime()) / 60000;
};

const getZonedIso = (dateValue: string, timeValue: string, timeZone: string) => {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);
  const localAsUtc = Date.UTC(year, month - 1, day, hours, minutes, 0);
  const firstOffset = getTimeZoneOffsetMinutes(new Date(localAsUtc), timeZone);
  const firstUtc = localAsUtc - firstOffset * 60000;
  const finalOffset = getTimeZoneOffsetMinutes(new Date(firstUtc), timeZone);
  return new Date(localAsUtc - finalOffset * 60000).toISOString();
};

const formatDuration = (minutes: number) => {
  const totalSeconds = Math.max(Math.round(minutes * 60), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours === 0 && mins === 0) return `${secs}s`;
  if (hours === 0) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  if (secs > 0) return `${hours}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
  return `${hours}h ${mins.toString().padStart(2, "0")}m`;
};

const formatTwelveHourInput = (value: string) => {
  const upper = value.toUpperCase().replace(/\s+/g, " ").trim();
  const digits = upper.replace(/[^0-9APM]/g, "");
  const suffixMatch = digits.match(/(AM|PM)$/);
  const suffix = suffixMatch ? suffixMatch[1] : "";
  const timeDigits = digits.replace(/(AM|PM)$/g, "").slice(0, 4);

  if (timeDigits.length <= 2) {
    return `${timeDigits}${suffix ? ` ${suffix}` : ""}`.trim();
  }

  return `${timeDigits.slice(0, 2)}:${timeDigits.slice(2)}${suffix ? ` ${suffix}` : ""}`.trim();
};

const toTwentyFourHourTime = (value: string) => {
  const normalized = value.trim().toUpperCase();
  const match = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
    return null;
  }

  return { hours, minutes };
};

const toTwentyFourHourValue = (value: string, meridiem: string) => {
  const parsed = toTwentyFourHourTime(value);
  if (!parsed) return null;

  const { hours, minutes } = parsed;
  let hours24 = hours % 12;
  if (meridiem === "PM") {
    hours24 += 12;
  }

  return `${String(hours24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

export function TimerCard({
  projects,
  activeEntry,
  entries,
  todayHours,
  maxDailyHours,
  onPunchIn,
  onPunchOut,
  onManualEntry,
  onFilesUpload,
  busy,
}: TimerCardProps) {
  const [now, setNow] = useState(() => new Date());
  const [projectId, setProjectId] = useState<number | "">("");
  const [note, setNote] = useState("");

  const [manualProjectId, setManualProjectId] = useState<number | "">("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualDate, setManualDate] = useState(() => getLocalDateValue());
  const [manualStart, setManualStart] = useState("");
  const [manualStartMeridiem, setManualStartMeridiem] = useState("AM");
  const [manualEnd, setManualEnd] = useState("");
  const [manualEndMeridiem, setManualEndMeridiem] = useState("PM");
  const [manualTimeZone, setManualTimeZone] = useState("Asia/Kolkata");
  const [manualError, setManualError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadBusy, setUploadBusy] = useState(false);

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
    if (activeEntry.start_time) {
      const activeMinutes = Math.max(
        Math.round((now.getTime() - new Date(activeEntry.start_time).getTime()) / 60000),
        0
      );
      const nextTotalHours = todayHours + activeMinutes / 60;

      if (nextTotalHours > maxDailyHours) {
        setErrorMessage(`Daily limit reached. You cannot log more than ${maxDailyHours} hours in a day.`);
        return;
      }
    }

    setErrorMessage("");
    try {
      await onPunchOut(activeEntry.id, { note });
      setNote("");
    } catch (error: any) {
      setErrorMessage(error.message || "Punch out failed.");
    }
  };

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setSelectedFiles(files);
    setUploadMessage("Files selected. Click Submit Files to send them for manager review.");
    event.target.value = "";
  };

  const handleSubmitFiles = async () => {
    if (!selectedFiles.length) {
      setUploadMessage("Please choose at least one file before submitting.");
      return;
    }

    setUploadBusy(true);
    setUploadMessage("");
    try {
      await onFilesUpload(selectedFiles);
      setUploadMessage(`${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"} submitted for manager review.`);
      setSelectedFiles([]);
    } catch (error: any) {
      setUploadMessage(error.message || "File upload failed.");
    } finally {
      setUploadBusy(false);
    }
  };

  const handleManualEntry = async () => {
    if (!manualProjectId || !manualDate) {
      setManualError("Project, date, start, and end time are required.");
      return;
    }

    const parsedStart = toTwentyFourHourValue(manualStart, manualStartMeridiem);
    const parsedEnd = toTwentyFourHourValue(manualEnd, manualEndMeridiem);

    if (!parsedStart || !parsedEnd) {
      setManualError("Enter start and end time in hh:mm format and choose AM/PM.");
      return;
    }

    const startIso = getZonedIso(manualDate, parsedStart, manualTimeZone);
    const endIso = getZonedIso(manualDate, parsedEnd, manualTimeZone);
    const startDate = new Date(startIso);
    const endDate = new Date(endIso);
    if (endDate <= startDate) {
      setManualError("End time must be after start time.");
      return;
    }

    const durationHours = (endDate.getTime() - startDate.getTime()) / 3600000;
    if (durationHours > maxDailyHours) {
      setManualError(`Manual entry cannot exceed ${maxDailyHours} hours in a day.`);
      return;
    }

    const todayDate = getDateValueForTimeZone(manualTimeZone);
    if (manualDate === todayDate && todayHours + durationHours > maxDailyHours) {
      setManualError(`Daily limit reached. You cannot log more than ${maxDailyHours} hours in a day.`);
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
          <p className="text-xs text-gray-500">Limit: {maxDailyHours}h per day</p>
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
            <label className={`inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-8 py-4 text-base font-semibold text-indigo-700 transition hover:bg-indigo-100 ${busy || uploadBusy ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
              <Upload className="h-4 w-4" />
              Upload Files
              <input
                type="file"
                multiple
                disabled={busy || uploadBusy}
                className="sr-only"
                onChange={handleFilesSelected}
              />
            </label>
            {selectedFiles.length ? (
              <button
                type="button"
                onClick={handleSubmitFiles}
                disabled={busy || uploadBusy}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-8 py-4 text-base font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {uploadBusy ? "Submitting..." : "Submit Files"}
              </button>
            ) : null}
          </div>
          {selectedFiles.length ? (
            <div className="mt-3 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
              <p className="font-medium text-gray-800">Selected files</p>
              <p className="mt-1 truncate">{selectedFiles.map((file) => file.name).join(", ")}</p>
            </div>
          ) : null}
          {uploadMessage ? <p className="mt-2 text-xs text-indigo-700">{uploadMessage}</p> : null}
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
              max={getDateValueForTimeZone(manualTimeZone)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:col-span-2 md:grid-cols-[160px_160px_180px]">
            <div>
              <label className="text-xs font-medium text-gray-600">Start time</label>
              <div className="mt-1 grid grid-cols-[80px_72px] gap-2">
                <input
                  type="text"
                  value={manualStart}
                  onChange={(event) => setManualStart(formatTwelveHourInput(event.target.value))}
                  placeholder="hh:mm"
                  className="w-20 rounded-lg border border-gray-300 px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={manualStartMeridiem}
                  onChange={(event) => setManualStartMeridiem(event.target.value)}
                  className="w-[72px] rounded-lg border border-gray-300 px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">End time</label>
              <div className="mt-1 grid grid-cols-[80px_72px] gap-2">
                <input
                  type="text"
                  value={manualEnd}
                  onChange={(event) => setManualEnd(formatTwelveHourInput(event.target.value))}
                  placeholder="hh:mm"
                  className="w-20 rounded-lg border border-gray-300 px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={manualEndMeridiem}
                  onChange={(event) => setManualEndMeridiem(event.target.value)}
                  className="w-[72px] rounded-lg border border-gray-300 px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Time zone</label>
              <select
                value={manualTimeZone}
                onChange={(event) => {
                  setManualTimeZone(event.target.value);
                  setManualDate((currentDate) => {
                    const maxDate = getDateValueForTimeZone(event.target.value);
                    return currentDate > maxDate ? maxDate : currentDate;
                  });
                }}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {timeZoneOptionGroups.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
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
