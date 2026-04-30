"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { DashboardHeader } from "./components/DashboardHeader";
import { MyTimeCard } from "./components/MyTimeCard";
import { TimerCard } from "./components/TimerCard";
import { TimesheetsTable } from "./components/TimesheetsTable";
import { apiFetch } from "@/lib/api";
import HelpButton from "@/components/support/HelpButton";
import { clearClientNotification, clearClientNotifications, getClientNotifications, markClientNotificationsRead, subscribeToClientNotifications } from "@/lib/supportTickets";

const TENANT_DASHBOARD_STORAGE_KEY = "tenantAdminDashboardState";

const parseLocalDateValue = (value) => {
  if (!value) return new Date("");
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
};

const getLocalDateValue = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (isoDate) => {
  const d = parseLocalDateValue(isoDate);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatDisplayTime = (isoDate) => {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

const getLineDurationSeconds = (line) => {
  const exactSeconds = Number(line?.time_entry_detail?.duration_seconds || 0);
  if (exactSeconds > 0) return exactSeconds;
  return Math.max(Math.round(Number(line?.hours || 0) * 3600), 0);
};

const toRelative = (iso) => {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
};

const getLatestRejectionComment = (sheet) =>
  (sheet?.approvals || []).find((approval) => approval.action === "REJECTED")?.comment || "";

export default function EmployeeDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [me, setMe] = useState(null);
  const [projects, setProjects] = useState([]);
  const [timesheet, setTimesheet] = useState(null);
  const [timesheetHistory, setTimesheetHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [supportNotifications, setSupportNotifications] = useState([]);
  const [manualRequests, setManualRequests] = useState([]);
  const [maxDailyHours, setMaxDailyHours] = useState(12);

  useEffect(() => {
    const storedState = window.localStorage.getItem(TENANT_DASHBOARD_STORAGE_KEY);
    if (!storedState) return;

    try {
      const parsed = JSON.parse(storedState);
      const rawMaxHours = parsed?.general?.maxHours;
      const parsedHours = Number.parseInt(String(rawMaxHours || ""), 10);
      if (!Number.isNaN(parsedHours) && parsedHours > 0) {
        setMaxDailyHours(parsedHours);
      }
    } catch {
      // Ignore malformed local tenant settings.
    }
  }, []);

  const loadData = useCallback(async () => {
    setErrorMessage("");
    const [meRes, summaryRes, timesheetRes, historyRes, projectsRes, notificationsRes, manualRequestsRes] = await Promise.all([
      apiFetch("/me/"),
      apiFetch("/employee/dashboard-summary"),
      apiFetch("/timesheets/current"),
      apiFetch("/timesheets"),
      apiFetch("/projects"),
      apiFetch("/notifications"),
      apiFetch("/employee/manual-entry-requests"),
    ]);

    setMe(meRes);
    setSummary(summaryRes);
    setTimesheet(timesheetRes);
    setTimesheetHistory(historyRes || []);
    setProjects(projectsRes || []);
    setManualRequests(
      (manualRequestsRes || []).map((item) => ({
        id: item.id,
        requestType: item.request_type,
        requestDate: item.request_date,
        comment: item.comment,
        status: item.status,
        managerComment: item.manager_comment,
        createdAt: item.created_at,
      }))
    );
    setNotifications(
      (notificationsRes || []).map((item) => ({
        id: String(item.id),
        apiId: item.id,
        source: "api",
        title: item.title,
        message: item.message,
        time: toRelative(item.created_at),
        is_read: item.is_read,
      }))
    );
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await loadData();
      } catch (error) {
        setErrorMessage(error.message || "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadData]);

  useEffect(() => {
    setSupportNotifications(getClientNotifications());
    return subscribeToClientNotifications(setSupportNotifications);
  }, []);

  const rows = useMemo(() => {
    if (!timesheet) return [];
    return (timesheet.lines || []).map((line) => ({
      id: line.id,
      date: formatDisplayDate(line.date),
      projectId: line.project.id,
      projectName: line.project.name,
      hours: Number(line.hours),
      durationSeconds: getLineDurationSeconds(line),
      shift: line.shift,
      description: line.description,
      status: timesheet.status,
    }));
  }, [timesheet]);

  const previousTimesheets = useMemo(() => {
    const all = timesheetHistory || [];
    if (!timesheet?.id) return all;
    return all.filter((sheet) => sheet.id !== timesheet.id);
  }, [timesheetHistory, timesheet]);

  const currentWeekSheets = useMemo(() => {
    const currentWeekStart = timesheet?.week_start;
    if (!currentWeekStart) {
      return timesheet ? [timesheet] : [];
    }

    return [
      ...(timesheet ? [timesheet] : []),
      ...(timesheetHistory || []).filter((sheet) => sheet.week_start === currentWeekStart && sheet.id !== timesheet?.id),
    ];
  }, [timesheet, timesheetHistory]);

  const allVisibleLines = useMemo(
    () => currentWeekSheets.flatMap((sheet) => sheet?.lines || []),
    [currentWeekSheets]
  );

  const activityEntries = useMemo(() => {
    if (!timesheet) return [];
    return (timesheet.lines || [])
      .slice()
      .reverse()
      .slice(0, 5)
      .map((line) => ({
        id: String(line.id),
        project: line.project.name,
        description: line.description || "",
        start: line.time_entry_detail?.start_time ? formatDisplayTime(line.time_entry_detail.start_time) : "Logged",
        end: line.time_entry_detail?.end_time ? formatDisplayTime(line.time_entry_detail.end_time) : formatDisplayDate(line.date),
        durationMinutes: getLineDurationSeconds(line) / 60,
        dateLabel: formatDisplayDate(line.date),
      }));
  }, [timesheet]);

  const todaySeconds = useMemo(() => {
    const today = getLocalDateValue();
    return allVisibleLines
      .filter((line) => line.date === today)
      .reduce((sum, line) => sum + getLineDurationSeconds(line), 0);
  }, [allVisibleLines]);

  const weekSeconds = useMemo(() => {
    return currentWeekSheets.reduce(
      (sheetSum, sheet) =>
        sheetSum + (sheet.lines || []).reduce((lineSum, line) => lineSum + getLineDurationSeconds(line), 0),
      0
    );
  }, [currentWeekSheets]);

  const monthSeconds = useMemo(() => {
    const now = new Date();
    const allSheets = [
      ...(timesheet ? [timesheet] : []),
      ...(timesheetHistory || []).filter((sheet) => sheet.id !== timesheet?.id),
    ];

    return allSheets.reduce(
      (sheetSum, sheet) =>
        sheetSum +
        (sheet.lines || []).reduce((lineSum, line) => {
          const d = new Date(line.date);
          if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
            return lineSum + getLineDurationSeconds(line);
          }
          return lineSum;
        }, 0),
      0
    );
  }, [timesheet, timesheetHistory]);

  const userDisplayName = useMemo(() => {
    if (!me) return "Employee";
    const fullName = `${me.first_name || ""} ${me.last_name || ""}`.trim();
    return fullName || me.username || "Employee";
  }, [me]);

  const employeeSupportNotifications = useMemo(
    () =>
      supportNotifications
        .filter((item) => item.clientName === userDisplayName)
        .map((item) => ({
          id: String(item.id),
          source: "support",
          title: item.title,
          message: item.message,
          time: toRelative(item.time),
          is_read: item.read,
        })),
    [supportNotifications, userDisplayName]
  );

  const combinedNotifications = useMemo(() => {
    const seenIds = new Set();
    return [...employeeSupportNotifications, ...notifications].filter((item) => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });
  }, [employeeSupportNotifications, notifications]);

  const totalNotificationCount = useMemo(
    () => combinedNotifications.filter((item) => !item.is_read).length,
    [combinedNotifications]
  );

  const addTimesheetLine = async (payload) => {
    if (!timesheet?.id) throw new Error("Timesheet not available.");
    await apiFetch(`/timesheets/${timesheet.id}/lines`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  };

  const refreshData = async () => {
    await loadData();
  };

  const handlePunchIn = async ({ projectId, note }) => {
    setBusy(true);
    try {
      await apiFetch("/time-entries/punch-in", {
        method: "POST",
        body: JSON.stringify({ project_id: projectId, note }),
      });
      await refreshData();
    } finally {
      setBusy(false);
    }
  };

  const handlePunchOut = async (entryId, { note }) => {
    if (summary?.active_entry?.start_time) {
      const activeSeconds = Math.max(
        Math.round((Date.now() - new Date(summary.active_entry.start_time).getTime()) / 1000),
        0
      );
      const nextTotalHours = (todaySeconds + activeSeconds) / 3600;

      if (nextTotalHours > maxDailyHours) {
        setErrorMessage(`Daily limit reached. You cannot log more than ${maxDailyHours} hours in a day.`);
        return;
      }
    }

    setBusy(true);
    try {
      const entry = await apiFetch(`/time-entries/${entryId}/punch-out`, {
        method: "POST",
        body: JSON.stringify({ note }),
      });

      // Refresh immediately after successful punch-out so UI switches back to Punch In
      // even if later timesheet-line creation fails.
      await refreshData();

      try {
        const durationSeconds = Number(entry.duration_seconds || 0);
        const hours = durationSeconds > 0 ? durationSeconds / 3600 : Number(entry.duration_minutes || 0) / 60;
        await addTimesheetLine({
          date: getLocalDateValue(entry.end_time || new Date()),
          project_id: entry.project.id,
          description: entry.note || "Punch entry",
          hours: Math.max(Number(hours.toFixed(2)), 0.01),
          shift: "DAY",
          time_entry_id: entry.id,
        });
      } finally {
        await refreshData();
      }
    } finally {
      setBusy(false);
    }
  };

  const handleManualEntryRequest = async ({ requestType, requestDate, comment }) => {
    setBusy(true);
    try {
      await apiFetch("/employee/manual-entry-requests", {
        method: "POST",
        body: JSON.stringify({
          request_type: requestType,
          request_date: requestDate,
          comment,
        }),
      });
      await refreshData();
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitTimesheet = async () => {
    if (!timesheet?.id) return;
    setBusy(true);
    try {
      await apiFetch(`/timesheets/${timesheet.id}/submit`, { method: "POST" });
      await refreshData();
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateTimesheetRow = async (id, payload) => {
    const body = {};
    if (typeof payload.hours === "number") body.hours = Number(payload.hours.toFixed(2));
    if (payload.shift) body.shift = payload.shift;
    if (typeof payload.description === "string") body.description = payload.description;
    if (payload.projectId) body.project_id = payload.projectId;

    setBusy(true);
    try {
      await apiFetch(`/timesheet-lines/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      await refreshData();
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteTimesheetRow = async (id) => {
    setBusy(true);
    try {
      await apiFetch(`/timesheet-lines/${id}`, { method: "DELETE" });
      await refreshData();
    } finally {
      setBusy(false);
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      await apiFetch("/notifications/mark-read", {
        method: "POST",
        body: JSON.stringify({}),
      });
      markClientNotificationsRead(userDisplayName);
      await refreshData();
    } catch {
      // no-op
    }
  };

  const handleUploadFiles = async (files) => {
    if (!timesheet?.id) {
      throw new Error("Timesheet not available for file upload.");
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    await apiFetch(`/timesheets/${timesheet.id}/attachments`, {
      method: "POST",
      body: formData,
    });
  };

  const handleClearNotification = async (item) => {
    if (item.source === "api" && item.apiId) {
      setNotifications((prev) => prev.filter((notification) => notification.apiId !== item.apiId));
      await apiFetch(`/notifications/${item.apiId}`, { method: "DELETE" }).catch(() => {});
      return;
    }

    clearClientNotification(item.id);
    setSupportNotifications(getClientNotifications());
  };

  const handleClearAllNotifications = async () => {
    const apiIds = notifications.filter((item) => item.apiId).map((item) => item.apiId);
    setNotifications([]);
    clearClientNotifications(userDisplayName);
    setSupportNotifications(getClientNotifications());

    await Promise.all(apiIds.map((id) => apiFetch(`/notifications/${id}`, { method: "DELETE" }).catch(() => {})));
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-600">Loading employee dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <DashboardHeader
        notificationCount={totalNotificationCount}
        onNotificationClick={handleMarkNotificationsRead}
        onClearAllNotifications={handleClearAllNotifications}
        onClearNotification={handleClearNotification}
        notifications={combinedNotifications}
        initialName={userDisplayName}
        initialEmail={me?.email || ""}
        role={me?.role || "employee"}
      />

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}

        <MyTimeCard todaySeconds={todaySeconds} weekSeconds={weekSeconds} monthSeconds={monthSeconds} />

        <TimerCard
          projects={projects}
          activeEntry={summary?.active_entry || null}
          entries={activityEntries}
          manualRequests={manualRequests}
          todayHours={todaySeconds / 3600}
          maxDailyHours={maxDailyHours}
          onPunchIn={handlePunchIn}
          onPunchOut={handlePunchOut}
          onManualEntryRequest={handleManualEntryRequest}
          onFilesUpload={handleUploadFiles}
          busy={busy}
        />

        <TimesheetsTable
          rows={rows}
          status={timesheet?.status || "DRAFT"}
          rejectionComment={getLatestRejectionComment(timesheet)}
          projects={projects}
          historyTimesheets={previousTimesheets}
          onSubmit={handleSubmitTimesheet}
          onUpdateRow={handleUpdateTimesheetRow}
          busy={busy}
        />
      </main>
      <HelpButton
        dashboardName="Employee"
        clientName={userDisplayName}
        requesterName={userDisplayName}
      />
    </div>
  );
}
