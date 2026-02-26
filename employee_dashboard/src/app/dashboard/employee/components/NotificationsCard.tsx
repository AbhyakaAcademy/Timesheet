"use client";

import { BellRing, CheckCircle2, Info, TriangleAlert } from "lucide-react";

const notifications = [
  {
    id: "n-1",
    title: "Timesheet approved",
    description: "Your timesheet for Jan 13 - Jan 19, 2026 was approved.",
    type: "success",
    time: "2h ago",
  },
  {
    id: "n-2",
    title: "Pending approval",
    description: "Timesheet for Jan 20 - Jan 26, 2026 is awaiting approval.",
    type: "warning",
    time: "1d ago",
  },
  {
    id: "n-3",
    title: "Policy reminder",
    description: "Submit weekly timesheets by Monday 12:00 PM.",
    type: "info",
    time: "3d ago",
  },
];

const iconMap = {
  success: CheckCircle2,
  warning: TriangleAlert,
  info: Info,
};

export function NotificationsCard() {
  return (
    <section className="bg-white border-2 border-gray-300 rounded-2xl p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center">
          <BellRing className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          <p className="text-sm text-gray-500">
            Manager updates and approvals
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => {
          const Icon = iconMap[notification.type as keyof typeof iconMap];
          return (
            <div
              key={notification.id}
              className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4"
            >
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Icon className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-gray-900">
                    {notification.title}
                  </p>
                  <span className="text-xs text-gray-500">
                    {notification.time}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {notification.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* TODO: API - fetch employee notifications list and read status. */}
    </section>
  );
}
