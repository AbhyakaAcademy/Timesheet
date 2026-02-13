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
  const [notifications, setNotifications] = useState(initialNotifications);
  const popoverRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!popoverRef.current?.contains(event.target)) {
        setOpen(false);
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

  return (
    <header className="border-b border-gray-200 bg-white px-5 py-4 md:px-8">
      <div className="mx-auto flex w-full max-w-[1320px] items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Manager Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Timesheet Approvals & Team Reports
          </p>
        </div>

        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            className="relative mt-1 rounded-full p-2 text-gray-600 transition hover:bg-gray-100"
            aria-label="Notifications"
            onClick={() => setOpen((prev) => !prev)}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7"
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
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
                {unreadCount}
              </span>
            ) : null}
          </button>

          {open ? (
            <section className="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <h2 className="font-semibold text-gray-900">Notifications</h2>
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Mark all read
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
                    <p className="text-sm text-gray-900">{item.message}</p>
                    <p className="mt-1 text-xs text-gray-500">{item.time}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </header>
  );
}
