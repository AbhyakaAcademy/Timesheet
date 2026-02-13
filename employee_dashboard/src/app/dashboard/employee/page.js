"use client";

import { useState } from "react";

// Components
import { DashboardHeader } from "./components/DashboardHeader";
import { MyTimeCard } from "./components/MyTimeCard";
import { TimerCard } from "./components/TimerCard";
import { TimesheetsTable } from "./components/TimesheetsTable";

export default function EmployeeDashboardPage() {
  const [isEditingTimesheet, setIsEditingTimesheet] = useState(false);
  const [timesheetRows, setTimesheetRows] = useState([
    {
      id: "ts-1",
      day: "Week Day",
      project: "Mobile Redesign",
      date: "Feb 6, 2026",
      time: "09:00 AM - 12:30 PM",
      shift: "Standard",
      description: "Accessibility review and UI polish",
      status: "Pending",
    },
    {
      id: "ts-2",
      day: "Week Day",
      project: "Billing Revamp",
      date: "Feb 6, 2026",
      time: "01:30 PM - 03:30 PM",
      shift: "Standard",
      description: "API wiring",
      status: "Pending",
    },
  ]);
  const [notifications, setNotifications] = useState([
    {
      id: "n-1",
      title: "Timesheet approved",
      message: "Your timesheet for Feb 3 - Feb 9 was approved.",
      time: "2h ago",
    },
    {
      id: "n-2",
      title: "Reminder",
      message: "Please submit this week's timesheet by Friday.",
      time: "Yesterday",
    },
  ]);
  const [unreadCount, setUnreadCount] = useState(2);

  const handleMarkNotificationsRead = () => {
    setUnreadCount(0);
    // TODO: API - mark notifications as read.
  };

  const handleAddTimesheetEntry = (entry) => {
    setTimesheetRows((prev) => [
      {
        id: `draft-${Date.now()}`,
        day: entry.day,
        project: entry.project,
        date: entry.date,
        time: entry.time,
        shift: entry.shift,
        description: entry.description,
        status: "Pending",
      },
      ...prev,
    ]);

    // TODO: API - append timer entry to draft timesheet.
  };

  const handleSubmitTimesheet = () => {
    setIsEditingTimesheet(false);

    // TODO: API - submit timesheet for manager approval.
  };

  const handleEditTimesheet = () => {
    setIsEditingTimesheet(true);

    // TODO: API - reopen submitted timesheet for edits.
  };

  const handleUpdateTimesheetRow = (id, field, value) => {
    setTimesheetRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );

    // TODO: API - update draft timesheet row.
  };

  const handleDeleteTimesheetRow = (id) => {
    setTimesheetRows((prev) => prev.filter((row) => row.id !== id));
    // TODO: API - delete timesheet row.
  };

  // TODO: API - fetch employee summary (time totals, timesheets, notifications).

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <DashboardHeader
        notificationCount={unreadCount}
        onNotificationClick={handleMarkNotificationsRead}
        notifications={notifications}
        initialName="John Doe"
        role="Software Engineer"
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <MyTimeCard todayHours={6.5} weekHours={32.5} monthHours={128} />

        <TimerCard onAddTimesheetEntry={handleAddTimesheetEntry} />

        {/* My Timesheets */}
        <TimesheetsTable
          rows={timesheetRows}
          onSubmit={handleSubmitTimesheet}
          onEdit={handleEditTimesheet}
          onUpdateRow={handleUpdateTimesheetRow}
          onDeleteRow={handleDeleteTimesheetRow}
          isEditing={isEditingTimesheet}
        />
      </main>
    </div>
  );
}
