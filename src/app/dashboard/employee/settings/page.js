"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronLeft,
  Palette,
  Save,
} from "lucide-react";

import { DashboardHeader } from "../components/DashboardHeader";
import {
  applyEmployeePreferences,
  EMPLOYEE_SETTINGS_STORAGE_KEY,
} from "@/lib/employeePreferences";

const defaultSettings = {
  themeMode: "Light",
  fontSize: "Medium",
  notificationsEnabled: true,
  reminderNotifications: true,
  soundEnabled: false,
};

export default function EmployeeSettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(EMPLOYEE_SETTINGS_STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      const nextSettings = { ...defaultSettings, ...parsed };
      setSettings(nextSettings);
      applyEmployeePreferences(nextSettings);
    } catch {
      // Ignore malformed local data.
    }
  }, []);

  const notificationsPreview = useMemo(
    () => [
      {
        id: "settings-1",
        title: "Settings ready",
        message: "You can update your name, theme, font size, and notifications here.",
        time: "now",
      },
    ],
    []
  );

  const updateField = (key, value) => {
    setSettings((prev) => {
      const nextSettings = { ...prev, [key]: value };
      window.localStorage.setItem(EMPLOYEE_SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
      applyEmployeePreferences(nextSettings);
      return nextSettings;
    });
  };

  const handleSave = () => {
    window.localStorage.setItem(EMPLOYEE_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    applyEmployeePreferences(settings);
    setStatusMessage("Settings saved successfully.");
    window.setTimeout(() => setStatusMessage(""), 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <DashboardHeader
        notificationCount={0}
        onNotificationClick={() => {}}
        notifications={notificationsPreview}
        initialName="Employee"
        role="employee"
      />

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/dashboard/employee"
              className="inline-flex items-center gap-2 text-sm font-medium text-indigo-700 hover:text-indigo-800"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-semibold text-gray-900">Employee Settings</h1>
            <p className="text-sm text-gray-600">
              Manage your general app preferences.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-sm font-medium text-white shadow-sm"
          >
            <Save className="h-4 w-4" />
            Save Settings
          </button>
        </div>

        {statusMessage ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {statusMessage}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">General</h2>
                <p className="text-sm text-gray-500">Basic account preferences.</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Theme Mode</span>
                <select
                  value={settings.themeMode}
                  onChange={(event) => updateField("themeMode", event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option>Light</option>
                  <option>Dark</option>
                  <option>System Default</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Font Size</span>
                <select
                  value={settings.fontSize}
                  onChange={(event) => updateField("fontSize", event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option>Small</option>
                  <option>Medium</option>
                  <option>Large</option>
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">App Preferences</h2>
                <p className="text-sm text-gray-500">Simple options like most apps provide.</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                ["notificationsEnabled", "Notifications", "Turn app notifications on or off."],
                ["reminderNotifications", "Reminders", "Get reminder alerts for pending work."],
                ["soundEnabled", "Sound", "Play a sound for new notifications."],
              ].map(([key, title, description]) => (
                <label
                  key={key}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 px-4 py-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{title}</p>
                      <p className="text-xs text-gray-500">{description}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings[key])}
                    onChange={(event) => updateField(key, event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
              ))}
            </div>

            <p className="mt-4 text-xs text-gray-500">
              These settings are currently saved locally in your browser for the employee dashboard.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
