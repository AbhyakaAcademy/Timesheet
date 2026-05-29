"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Play, Square, Upload } from "lucide-react";

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

type ManualRequestItem = {
  id: number | string;
  requestType: string;
  requestDate: string;
  comment: string;
  status: string;
  managerComment?: string;
  createdAt?: string;
};

type TimerCardProps = {
  projects: ProjectOption[];
  activeEntry: { id: number; project: { id: number; name: string }; start_time?: string | null } | null;
  entries: ActivityEntry[];
  manualRequests: ManualRequestItem[];
  todayHours: number;
  maxDailyHours: number;
  onPunchIn: (payload: { projectId: number; note: string }) => Promise<void>;
  onPunchOut: (entryId: number, payload: { note: string }) => Promise<void>;
  onManualEntryRequest: (payload: {
    requestType: string;
    requestDate: string;
    comment: string;
    projectId: number;
    startDateTime: string;
    endDateTime: string;
  }) => Promise<void>;
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

const formatDateTimeLabel = (value: string) => {
  if (!value) return "";
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const addOneDayToLocalDateTime = (value: string) => {
  const next = new Date(value);
  next.setDate(next.getDate() + 1);
  const year = next.getFullYear();
  const month = String(next.getMonth() + 1).padStart(2, "0");
  const day = String(next.getDate()).padStart(2, "0");
  const hours = String(next.getHours()).padStart(2, "0");
  const minutes = String(next.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getDatePart = (value: string) => value.slice(0, 10);

const getTimePart = (value: string) => value.slice(11, 16);

const buildLocalDateTime = (date: string, time: string) => {
  if (!date || !time) return "";

  const [hoursValue, minutes] = time.split(":");
  const hours = Number(hoursValue);

  return `${date}T${String(hours).padStart(2, "0")}:${minutes}`;
};

const mergeLocalDateTime = ({
  currentValue,
  nextDate,
  nextTime,
  fallbackDate,
  fallbackTime,
}: {
  currentValue: string;
  nextDate?: string;
  nextTime?: string;
  fallbackDate: string;
  fallbackTime: string;
}) => {
  const currentDate = getDatePart(currentValue);
  const currentTime = getTimePart(currentValue);
  const date = nextDate ?? (currentDate || fallbackDate);
  const time = nextTime ?? (currentTime || fallbackTime);
  return buildLocalDateTime(date, time);
};

const openNativePicker = (event: React.MouseEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
  const input = event.currentTarget as HTMLInputElement & { showPicker?: () => void };
  input.showPicker?.();
};

const timeOptions = Array.from({ length: 96 }, (_, index) => {
  const hours = Math.floor(index / 4);
  const minutes = (index % 4) * 15;
  const value = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  const label = new Date(2000, 0, 1, hours, minutes).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return { value, label };
});

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

const statusTone: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

export function TimerCard({
  projects,
  activeEntry,
  entries,
  manualRequests,
  todayHours,
  maxDailyHours,
  onPunchIn,
  onPunchOut,
  onManualEntryRequest,
  onFilesUpload,
  busy,
}: TimerCardProps) {
  const [now, setNow] = useState(() => new Date());
  const [projectId, setProjectId] = useState<number | "">("");

  const [manualRequestType, setManualRequestType] = useState("");
  const [manualRequestProjectId, setManualRequestProjectId] = useState<number | "">("");
  const [manualRequestStartDateTime, setManualRequestStartDateTime] = useState("");
  const [manualRequestEndDateTime, setManualRequestEndDateTime] = useState("");
  const [manualRequestComment, setManualRequestComment] = useState("");
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
      await onPunchIn({ projectId: Number(projectId), note: "" });
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
      await onPunchOut(activeEntry.id, { note: "" });
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

  const handleManualEntryRequest = async () => {
    const requestTypeInput = manualRequestType.trim();
    const commentInput = manualRequestComment.trim();
    const selectedProject = projects.find((project) => project.id === manualRequestProjectId);
    let normalizedEndDateTime = manualRequestEndDateTime;

    const missingFields: string[] = [];
    if (!requestTypeInput) missingFields.push("request reason");
    if (!manualRequestProjectId) missingFields.push("project");
    if (!manualRequestStartDateTime) missingFields.push("start date and time");
    if (!manualRequestEndDateTime) missingFields.push("end date and time");
    if (!commentInput) missingFields.push("employee details");

    if (missingFields.length > 0) {
      const missingLabel =
        missingFields.length === 1
          ? missingFields[0]
          : `${missingFields.slice(0, -1).join(", ")} and ${missingFields[missingFields.length - 1]}`;
      setManualError(`Please enter ${missingLabel}.`);
      return;
    }

    if (
      new Date(normalizedEndDateTime).getTime() <= new Date(manualRequestStartDateTime).getTime() &&
      normalizedEndDateTime.slice(0, 10) === manualRequestStartDateTime.slice(0, 10)
    ) {
      normalizedEndDateTime = addOneDayToLocalDateTime(normalizedEndDateTime);
      setManualRequestEndDateTime(normalizedEndDateTime);
    }

    if (new Date(normalizedEndDateTime).getTime() <= new Date(manualRequestStartDateTime).getTime()) {
      setManualError("End time must be after start time.");
      return;
    }

    setManualError("");
    try {
      const structuredComment = [
        `Project: ${selectedProject ? `${selectedProject.name} (${selectedProject.code})` : manualRequestProjectId}`,
        `Start: ${formatDateTimeLabel(manualRequestStartDateTime)}`,
        `End: ${formatDateTimeLabel(normalizedEndDateTime)}`,
        `Employee details: ${commentInput}`,
      ].join("\n");

      await onManualEntryRequest({
        requestType: requestTypeInput,
        requestDate: manualRequestStartDateTime.slice(0, 10),
        comment: structuredComment,
        projectId: Number(manualRequestProjectId),
        startDateTime: manualRequestStartDateTime,
        endDateTime: normalizedEndDateTime,
      });
      setManualRequestComment("");
      setManualRequestType("");
      setManualRequestProjectId("");
      setManualRequestStartDateTime("");
      setManualRequestEndDateTime("");
    } catch (error: any) {
      setManualError(error.message || "Manual request failed.");
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
        {errorMessage ? <p className="text-xs text-rose-600">{errorMessage}</p> : null}
      </div>

      <div className="mt-8 border-t border-gray-200 pt-6">
        <h3 className="text-lg font-bold text-gray-900">Missed Punch Request</h3>
        <p className="mt-1 text-xs text-gray-500">Include the reason, project, date range, and exact time details so your manager knows what to review.</p>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-gray-600">Request type or reason</label>
            <input
              type="text"
              value={manualRequestType}
              onChange={(event) => setManualRequestType(event.target.value)}
              placeholder="Type the request, for example: punch in not working"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Project</label>
            <select
              value={manualRequestProjectId}
              onChange={(event) => setManualRequestProjectId(event.target.value ? Number(event.target.value) : "")}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Start date and time</label>
            <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                type="date"
                value={getDatePart(manualRequestStartDateTime)}
                max={getLocalDateValue()}
                onClick={openNativePicker}
                onFocus={openNativePicker}
                onChange={(event) =>
                  setManualRequestStartDateTime(
                    mergeLocalDateTime({
                      currentValue: manualRequestStartDateTime,
                      nextDate: event.target.value,
                      fallbackDate: getLocalDateValue(),
                      fallbackTime: "09:00",
                    })
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={getTimePart(manualRequestStartDateTime)}
                onChange={(event) =>
                  setManualRequestStartDateTime(
                    mergeLocalDateTime({
                      currentValue: manualRequestStartDateTime,
                      nextTime: event.target.value,
                      fallbackDate: getLocalDateValue(),
                      fallbackTime: "09:00",
                    })
                  )
                }
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select time</option>
                {timeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">End date and time</label>
            <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                type="date"
                value={getDatePart(manualRequestEndDateTime)}
                max={getLocalDateValue()}
                onClick={openNativePicker}
                onFocus={openNativePicker}
                onChange={(event) =>
                  setManualRequestEndDateTime(
                    mergeLocalDateTime({
                      currentValue: manualRequestEndDateTime,
                      nextDate: event.target.value,
                      fallbackDate: getDatePart(manualRequestStartDateTime) || getLocalDateValue(),
                      fallbackTime: "18:00",
                    })
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={getTimePart(manualRequestEndDateTime)}
                onChange={(event) =>
                  setManualRequestEndDateTime(
                    mergeLocalDateTime({
                      currentValue: manualRequestEndDateTime,
                      nextTime: event.target.value,
                      fallbackDate: getDatePart(manualRequestStartDateTime) || getLocalDateValue(),
                      fallbackTime: "18:00",
                    })
                  )
                }
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select time</option>
                {timeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-[11px] text-gray-500">
              If the end time is earlier than the start time on the same date, it will be treated as a next-day night shift.
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-600">Employee details</label>
            <textarea
              value={manualRequestComment}
              onChange={(event) => setManualRequestComment(event.target.value)}
              placeholder="Explain what happened and any details your manager should know."
              className="mt-1 min-h-[110px] w-full rounded-lg border border-gray-300 px-3 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {manualError ? <p className="mt-2 text-xs text-rose-600">{manualError}</p> : null}
        <button
          type="button"
          onClick={handleManualEntryRequest}
          disabled={busy}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-60"
        >
          Submit Request
        </button>

        <div className="mt-6 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Recent Requests</h4>
          {manualRequests.slice(0, 3).map((request) => (
            <div key={request.id} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">
                  {request.requestType.replaceAll("_", " ")} - {request.requestDate}
                </p>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[request.status] || "bg-gray-200 text-gray-700"}`}>
                  {request.status}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{request.comment}</p>
              {request.managerComment ? (
                <p className="mt-2 text-xs text-gray-500">Manager comment: {request.managerComment}</p>
              ) : null}
            </div>
          ))}
          {manualRequests.length === 0 ? <p className="text-sm text-gray-500">No manual entry requests yet.</p> : null}
        </div>
      </div>
    </section>
  );
}
