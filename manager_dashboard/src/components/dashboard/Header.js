"use client";

import { useMemo, useRef, useState, useEffect } from "react";

const initialNotifications = [
  {
    id: 1,
    message: "3 timesheets are pending your approval",
    time: "2m ago",
    read: false,
  },
  {
    id: 2,
    message: "Michael Johnson submitted 42 hours",
    time: "1h ago",
    read: false,
  },
  {
    id: 3,
    message: "Weekly team report is ready",
    time: "Yesterday",
    read: true,
  },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [quickSettings, setQuickSettings] = useState({
    approvalReminders: true,
    weeklyReports: true,
    compactRows: false,
  });
  const [notifications, setNotifications] = useState(initialNotifications);
  const popoverRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!popoverRef.current?.contains(event.target)) {
        setOpen(false);
        setSettingsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  function markAllAsRead() {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }

  function handleClearAllNotifications() {
    setNotifications([]);
    setOpen(false);
  }

  function handleClearNotification(notificationId) {
    setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
  }

  function handleToggleNotifications() {
    setSettingsOpen(false);
    setOpen((prev) => !prev);
    markAllAsRead();
  }

  function handleToggleSettings() {
    setOpen(false);
    setSettingsOpen((prev) => !prev);
  }

  function handleQuickSettingChange(key) {
    setQuickSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <header className="border-b border-gray-200 bg-white px-5 py-4 md:px-8">
      <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700"
            aria-label="Open manager profile"
            title="Manager Profile"
          >
            M
          </button>
          <span className="text-sm font-medium text-gray-600">Manager Profile</span>
        </div>

        <div className="relative" ref={popoverRef}>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50"
              aria-label="Notifications"
              onClick={handleToggleNotifications}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 0 0-5-5.9V4a1 1 0 1 0-2 0v1.1A6 6 0 0 0 6 11v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
                <path d="M9 17a3 3 0 0 0 6 0" />
              </svg>
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                  {unreadCount}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={handleToggleSettings}
              aria-label="Settings"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-50"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 17l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7A2 2 0 1 1 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z" />
              </svg>
            </button>

            <button
              type="button"
              className="flex h-11 items-center justify-center rounded-xl border border-indigo-600 bg-indigo-50 px-4 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
            >
              Logout
            </button>
          </div>

          {open ? (
            <section className="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <h2 className="font-semibold text-gray-900">Notifications</h2>
                <button
                  type="button"
                  onClick={handleClearAllNotifications}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Clear
                </button>
              </div>

              <ul className="max-h-80 overflow-auto py-1">
                {notifications.map((item) => (
                  <li
                    key={item.id}
                    className={`border-b border-gray-100 px-4 py-3 last:border-b-0 ${
                      item.read ? "bg-white" : "bg-blue-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-gray-900">{item.message}</p>
                      <button
                        type="button"
                        onClick={() => handleClearNotification(item.id)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-xs font-semibold leading-none text-gray-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Clear notification"
                      >
                        x
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{item.time}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {settingsOpen ? (
            <section className="absolute right-24 z-30 mt-2 w-[300px] rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Quick Settings</p>
                  <p className="text-xs text-gray-500">Manager dashboard preferences</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  ["approvalReminders", "Approval reminders", "Keep pending timesheet reminders enabled."],
                  ["weeklyReports", "Weekly reports", "Show weekly team report prompts."],
                  ["compactRows", "Compact rows", "Use a tighter layout for team timesheets."],
                ].map(([key, title, description]) => (
                  <label key={key} className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
                    <span>
                      <span className="block text-sm font-medium text-gray-900">{title}</span>
                      <span className="mt-0.5 block text-xs text-gray-500">{description}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={Boolean(quickSettings[key])}
                      onChange={() => handleQuickSettingChange(key)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      {profileOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
          <section className="w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-blue-600">Manager Profile</p>
                <h2 className="mt-1 text-xl font-semibold text-gray-900">Manager</h2>
              </div>
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="rounded-md p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close manager profile"
              >
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="m5 5 10 10M15 5 5 15" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Name</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">Manager</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Email</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">manager@abhyaka.com</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Role</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">Manager</p>
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-200 px-5 py-4">
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </header>
  );
}
