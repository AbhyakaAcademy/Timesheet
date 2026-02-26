"use client";

import { useState } from "react";
import { Bell, Check, Pencil, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/auth";

type DashboardHeaderProps = {
  notificationCount: number;
  onNotificationClick: () => void;
  notifications: { id: string; title: string; message: string; time: string }[];
  initialName?: string;
  role?: string;
};

export function DashboardHeader({
  notificationCount,
  onNotificationClick,
  notifications,
  initialName = "John Doe",
  role = "Software Engineer",
}: DashboardHeaderProps) {
  const router = useRouter();
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(initialName);
  const [draftName, setDraftName] = useState(initialName);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleStartEdit = () => {
    setDraftName(name);
    setIsEditingName(true);
  };

  const handleCancelEdit = () => {
    setDraftName(name);
    setIsEditingName(false);
  };

  const handleSaveEdit = () => {
    const trimmed = draftName.trim();
    if (trimmed) {
      setName(trimmed);
    }
    setIsEditingName(false);
    // TODO: API - persist updated employee display name.
  };

  const handleToggleNotifications = () => {
    setIsNotificationsOpen((prev) => !prev);
    onNotificationClick();
  };

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
            Employee Dashboard
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Welcome back, {name}
          </p>
        </div>

        <div className="flex items-center gap-4 relative">
          <button
            type="button"
            onClick={handleLogout}
            className="h-11 rounded-xl border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Logout
          </button>
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
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </div>
              <div className="mt-3 space-y-3">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {item.title}
                      </p>
                      <span className="text-xs text-gray-500">{item.time}</span>
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

          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white">
              <User className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <input
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    className="text-sm font-semibold text-gray-900 rounded-md border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <p className="text-sm font-semibold text-gray-900">{name}</p>
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
              <p className="text-xs text-gray-500">{role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
