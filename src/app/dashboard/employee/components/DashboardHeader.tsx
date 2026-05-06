"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, BookOpen, Check, Pencil, Settings, User, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { clearSession } from "@/lib/auth";

type PolicyItem = {
  id: string;
  title: string;
  description: string;
  appliesTo: string;
  details: string[];
  updated: string;
};

type DashboardHeaderProps = {
  notificationCount: number;
  onNotificationClick: () => void;
  onClearAllNotifications?: () => void;
  onClearNotification?: (notification: { id: string; title: string; message: string; time: string; source?: string; apiId?: number }) => void;
  notifications: { id: string; title: string; message: string; time: string; source?: string; apiId?: number }[];
  policies?: PolicyItem[];
  initialName?: string;
  initialEmail?: string;
  role?: string;
};

export function DashboardHeader({
  notificationCount,
  onNotificationClick,
  onClearAllNotifications,
  onClearNotification,
  notifications,
  policies = [],
  initialName = "John Doe",
  initialEmail = "employee@abhyaka.com",
  role = "Software Engineer",
}: DashboardHeaderProps) {
  const quickSettingsStorageKey = "employeeQuickSettings";
  const displayNameStorageKey = "employeeDashboardDisplayName";
  const emailStorageKey = "employeeDashboardEmail";
  const router = useRouter();
  const pathname = usePathname();
  const headerActionsRef = useRef<HTMLDivElement | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(() => {
    if (typeof window === "undefined") return initialName;
    const storedName = window.localStorage.getItem(displayNameStorageKey);
    return storedName?.trim() || initialName;
  });
  const [draftName, setDraftName] = useState(() => {
    if (typeof window === "undefined") return initialName;
    const storedName = window.localStorage.getItem(displayNameStorageKey);
    return storedName?.trim() || initialName;
  });
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") return initialEmail;
    const storedEmail = window.localStorage.getItem(emailStorageKey);
    return storedEmail?.trim() || initialEmail;
  });
  const [draftEmail, setDraftEmail] = useState(() => {
    if (typeof window === "undefined") return initialEmail;
    const storedEmail = window.localStorage.getItem(emailStorageKey);
    return storedEmail?.trim() || initialEmail;
  });
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isPoliciesOpen, setIsPoliciesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [quickSettings, setQuickSettings] = useState(() => {
    const defaultQuickSettings = {
      reminders: true,
      weeklySummary: true,
      compactCards: false,
    };

    if (typeof window === "undefined") return defaultQuickSettings;

    const storedSettings = window.localStorage.getItem(quickSettingsStorageKey);
    if (!storedSettings) return defaultQuickSettings;

    try {
      return { ...defaultQuickSettings, ...JSON.parse(storedSettings) };
    } catch {
      return defaultQuickSettings;
    }
  });

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!headerActionsRef.current?.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
        setIsPoliciesOpen(false);
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleStartEdit = () => {
    setDraftName(name);
    setDraftEmail(email);
    setIsEditingName(true);
  };

  const handleCancelEdit = () => {
    setDraftName(name);
    setIsEditingName(false);
  };

  const handleSaveEdit = () => {
    const trimmed = draftName.trim();
    const trimmedEmail = draftEmail.trim();
    if (trimmed) {
      setName(trimmed);
      window.localStorage.setItem(displayNameStorageKey, trimmed);
    }
    if (trimmedEmail) {
      setEmail(trimmedEmail);
      window.localStorage.setItem(emailStorageKey, trimmedEmail);
    }
    setIsEditingName(false);
    // TODO: API - persist updated employee display name.
  };

  const handleToggleNotifications = () => {
    setIsPoliciesOpen(false);
    setIsSettingsOpen(false);
    setIsNotificationsOpen((prev) => !prev);
    onNotificationClick();
  };

  const handleTogglePolicies = () => {
    setIsNotificationsOpen(false);
    setIsSettingsOpen(false);
    setIsPoliciesOpen((prev) => !prev);
  };

  const handleClearAllNotifications = () => {
    onClearAllNotifications?.();
    setIsNotificationsOpen(false);
  };

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  const handleSettings = () => {
    setIsNotificationsOpen(false);
    setIsPoliciesOpen(false);
    setIsSettingsOpen((prev) => !prev);
  };

  const handleQuickSettingChange = (key) => {
    setQuickSettings((prev) => {
      const nextSettings = { ...prev, [key]: !prev[key] };
      window.localStorage.setItem(quickSettingsStorageKey, JSON.stringify(nextSettings));
      return nextSettings;
    });
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Abhyaka
          </p>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white">
              <User className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="space-y-1">
                    <input
                      value={draftName}
                      onChange={(event) => setDraftName(event.target.value)}
                      className="w-48 rounded-md border border-gray-300 px-2 py-1 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      aria-label="Employee name"
                    />
                    <input
                      type="email"
                      value={draftEmail}
                      onChange={(event) => setDraftEmail(event.target.value)}
                      className="w-48 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      aria-label="Employee email"
                    />
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{name}</p>
                    <p className="text-xs text-gray-500">{email}</p>
                  </div>
                )}
                {isEditingName ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="rounded-full p-1 text-emerald-600 hover:bg-emerald-50"
                      aria-label="Save name"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
                      aria-label="Cancel edit"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
                    aria-label="Edit name"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
              {!isEditingName ? <p className="text-xs text-gray-500">{role}</p> : null}
            </div>
          </div>
        </div>

        <div ref={headerActionsRef} className="flex items-center gap-4 relative">
          <button
            type="button"
            onClick={handleTogglePolicies}
            className={`relative h-11 w-11 rounded-full border shadow-sm flex items-center justify-center transition ${
              isPoliciesOpen ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-300 bg-white hover:bg-gray-50"
            }`}
            aria-label="Policies"
          >
            <BookOpen className="h-5 w-5" />
          </button>

          {isPoliciesOpen && (
            <div className="absolute right-0 top-14 z-20 max-h-[28rem] w-[360px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
              <div className="border-b border-gray-100 px-4 py-4">
                <p className="text-sm font-semibold text-gray-900">Company Policies</p>
                <p className="mt-1 text-xs text-gray-500">Read the latest active policies for your organization.</p>
              </div>
              <div className="max-h-[22rem] space-y-3 overflow-y-auto p-4">
                {policies.map((policy) => (
                  <div key={policy.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{policy.title}</p>
                        <p className="mt-1 text-xs text-slate-500">Applies to {policy.appliesTo}</p>
                      </div>
                      <span className="rounded-full bg-white px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
                        {policy.updated || "Current"}
                      </span>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-600">{policy.description}</p>
                    {policy.details.length > 0 ? (
                      <ul className="mt-3 space-y-2 text-xs text-slate-700">
                        {policy.details.map((detail, index) => (
                          <li key={`${policy.id}-${index}`} className="rounded-xl bg-white px-3 py-2">
                            {detail}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
                {policies.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-xs text-slate-500">
                    No active policies are available right now.
                  </p>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleToggleNotifications}
            className="relative h-11 w-11 rounded-full border border-gray-300 bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-gray-700" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-14 w-[320px] rounded-2xl border border-gray-200 bg-white shadow-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">
                  Notifications
                </p>
                <button
                  type="button"
                  onClick={handleClearAllNotifications}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Clear
                </button>
              </div>
              <div className="mt-3 space-y-3">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.title}
                        </p>
                        <span className="text-xs text-gray-500">{item.time}</span>
                      </div>
                      {onClearNotification ? (
                        <button
                          type="button"
                          onClick={() => onClearNotification(item)}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-xs font-semibold leading-none text-gray-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Clear notification"
                        >
                          x
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-gray-600">
                      {item.message}
                    </p>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-xs text-gray-500">
                    You have no new notifications.
                  </p>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleSettings}
            aria-label="Settings"
            className={`h-11 w-11 rounded-full border transition inline-flex items-center justify-center ${
              pathname === "/dashboard/employee/settings"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Settings className="h-4 w-4" />
          </button>

          {isSettingsOpen && (
            <div className="absolute right-16 top-14 w-[300px] rounded-2xl border border-gray-200 bg-white shadow-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Quick Settings</p>
                  <p className="text-xs text-gray-500">Employee dashboard preferences</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  {
                    key: "reminders",
                    title: "Timesheet reminders",
                    description: "Keep weekly timesheet reminders enabled.",
                  },
                  {
                    key: "weeklySummary",
                    title: "Weekly summary",
                    description: "Show a weekly productivity summary.",
                  },
                  {
                    key: "compactCards",
                    title: "Compact cards",
                    description: "Use a tighter card layout for the dashboard.",
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{item.description}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(quickSettings[item.key])}
                      onChange={() => handleQuickSettingChange(item.key)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>
                ))}
              </div>

              <Link
                href="/dashboard/employee/settings"
                onClick={() => setIsSettingsOpen(false)}
                className="mt-4 block w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-center text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition"
              >
                Open Full Settings
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="h-11 rounded-xl border border-indigo-600 bg-indigo-50 px-4 text-sm font-medium text-indigo-700 transition inline-flex items-center justify-center hover:bg-indigo-100"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
