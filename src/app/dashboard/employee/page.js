"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { DashboardHeader } from "./components/DashboardHeader";
import { MyTimeCard } from "./components/MyTimeCard";
import { TimerCard } from "./components/TimerCard";
import { TimesheetsTable } from "./components/TimesheetsTable";
import { apiFetch } from "@/lib/api";

const formatDisplayDate = (isoDate) => {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

export default function EmployeeDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [me, setMe] = useState(null);
  const [projects, setProjects] = useState([]);
  const [timesheet, setTimesheet] = useState(null);
  const [summary, setSummary] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const loadData = useCallback(async () => {
    setErrorMessage("");
    const [meRes, summaryRes, timesheetRes, projectsRes, notificationsRes] = await Promise.all([
      apiFetch("/me/"),
      apiFetch("/employee/dashboard-summary"),
      apiFetch("/timesheets/current"),
      apiFetch("/projects"),
      apiFetch("/notifications"),
    ]);

    setMe(meRes);
    setSummary(summaryRes);
    setTimesheet(timesheetRes);
    setProjects(projectsRes || []);
    setNotifications(
      (notificationsRes || []).map((item) => ({
        id: String(item.id),
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

  const rows = useMemo(() => {
    if (!timesheet) return [];
    return (timesheet.lines || []).map((line) => ({
      id: line.id,
      date: formatDisplayDate(line.date),
      projectId: line.project.id,
      projectName: line.project.name,
      hours: Number(line.hours),
      shift: line.shift,
      description: line.description,
      status: timesheet.status,
    }));
  }, [timesheet]);

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
        start: "Logged",
        end: formatDisplayDate(line.date),
        durationMinutes: Math.round(Number(line.hours) * 60),
        dateLabel: formatDisplayDate(line.date),
      }));
  }, [timesheet]);

  const todayHours = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (timesheet?.lines || [])
      .filter((line) => line.date === today)
      .reduce((sum, line) => sum + Number(line.hours), 0);
  }, [timesheet]);

  const monthHours = useMemo(() => {
    const now = new Date();
    return (timesheet?.lines || []).reduce((sum, line) => {
      const d = new Date(line.date);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        return sum + Number(line.hours);
      }
      return sum;
    }, 0);
  }, [timesheet]);

  const userDisplayName = useMemo(() => {
    if (!me) return "Employee";
    const fullName = `${me.first_name || ""} ${me.last_name || ""}`.trim();
    return fullName || me.username || "Employee";
  }, [me]);

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
    setBusy(true);
    try {
      const entry = await apiFetch(`/time-entries/${entryId}/punch-out`, {
        method: "POST",
        body: JSON.stringify({ note }),
      });

      const hours = Math.max(Number(entry.duration_minutes || 0) / 60, 0.25);
      await addTimesheetLine({
        date: new Date(entry.end_time || new Date().toISOString()).toISOString().slice(0, 10),
        project_id: entry.project.id,
        description: entry.note || "Punch entry",
        hours: Number(hours.toFixed(2)),
        shift: "DAY",
        time_entry_id: entry.id,
      });

      await refreshData();
    } finally {
      setBusy(false);
    }
  };

  const handleManualEntry = async ({ projectId, note, startIso, endIso }) => {
    setBusy(true);
    try {
      const entry = await apiFetch("/time-entries/manual", {
        method: "POST",
        body: JSON.stringify({
          project_id: projectId,
          start_time: new Date(startIso).toISOString(),
          end_time: new Date(endIso).toISOString(),
          note,
        }),
      });

      const hours = Math.max(Number(entry.duration_minutes || 0) / 60, 0.25);
      await addTimesheetLine({
        date: new Date(startIso).toISOString().slice(0, 10),
        project_id: projectId,
        description: note || "Manual entry",
        hours: Number(hours.toFixed(2)),
        shift: "DAY",
        time_entry_id: entry.id,
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
      await refreshData();
    } catch {
      // no-op
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-600">Loading employee dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <DashboardHeader
        notificationCount={summary?.unread_notifications || 0}
        onNotificationClick={handleMarkNotificationsRead}
        notifications={notifications}
        initialName={userDisplayName}
        role={me?.role || "employee"}
      />

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}

        <MyTimeCard todayHours={todayHours} weekHours={Number(summary?.weekly_hours || 0)} monthHours={monthHours} />

        <TimerCard
          projects={projects}
          activeEntry={summary?.active_entry || null}
          entries={activityEntries}
          onPunchIn={handlePunchIn}
          onPunchOut={handlePunchOut}
          onManualEntry={handleManualEntry}
          busy={busy}
        />

        <TimesheetsTable
          rows={rows}
          status={timesheet?.status || "DRAFT"}
          projects={projects}
          onSubmit={handleSubmitTimesheet}
          onUpdateRow={handleUpdateTimesheetRow}
          onDeleteRow={handleDeleteTimesheetRow}
          busy={busy}
        />
      </main>
    </div>
  );
}
