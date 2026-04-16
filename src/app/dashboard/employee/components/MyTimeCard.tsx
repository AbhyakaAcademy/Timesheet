"use client";

import { Clock, Calendar, TrendingUp } from "lucide-react";

type MyTimeCardProps = {
  todaySeconds: number;
  weekSeconds: number;
  monthSeconds: number;
};

const formatTrackedTime = (secondsValue: number) => {
  const totalSeconds = Math.max(Math.round(Number(secondsValue || 0)), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours === 0 && minutes === 0) return `${seconds}s`;
  if (hours === 0) return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  if (seconds === 0 && minutes === 0) return `${hours}h`;
  if (seconds === 0) return `${hours}h ${minutes}m`;
  if (minutes === 0) return `${hours}h ${seconds}s`;
  return `${hours}h ${minutes}m`;
};

export function MyTimeCard({ todaySeconds, weekSeconds, monthSeconds }: MyTimeCardProps) {
  const expectedWeekHours = 40;
  const expectedWeekSeconds = expectedWeekHours * 3600;
  const remainingWeekSeconds = Math.max(expectedWeekSeconds - weekSeconds, 0);

  return (
    <section className="bg-white border-2 border-gray-300 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-9 w-9 rounded-full bg-indigo-50 flex items-center justify-center">
          <Clock className="h-4 w-4 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">My Time</h2>
          <p className="text-xs text-gray-500">Daily & weekly totals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl bg-blue-50 px-3 py-2.5 border border-blue-100">
          <div className="flex items-center gap-2 text-blue-700 text-xs">
            <Clock className="h-3.5 w-3.5" />
            Today
          </div>
          <p className="mt-1.5 text-lg font-semibold text-blue-700">
            {formatTrackedTime(todaySeconds)}
          </p>
        </div>

        <div className="rounded-xl bg-emerald-50 px-3 py-2.5 border border-emerald-100">
          <div className="flex items-center gap-2 text-emerald-700 text-xs">
            <Calendar className="h-3.5 w-3.5" />
            This Week
          </div>
          <p className="mt-1.5 text-lg font-semibold text-emerald-700">
            {formatTrackedTime(weekSeconds)}
          </p>
        </div>

        <div className="rounded-xl bg-purple-50 px-3 py-2.5 border border-purple-100">
          <div className="flex items-center gap-2 text-purple-700 text-xs">
            <TrendingUp className="h-3.5 w-3.5" />
            This Month
          </div>
          <p className="mt-1.5 text-lg font-semibold text-purple-700">
            {formatTrackedTime(monthSeconds)}
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-gray-200 pt-3 text-xs text-gray-700 space-y-1">
        <div className="flex items-center gap-1.5">
          <span>Expected this week:</span>
          <span className="font-semibold">{formatTrackedTime(expectedWeekSeconds)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Remaining:</span>
          <span className="font-semibold text-rose-500">
            {formatTrackedTime(remainingWeekSeconds)}
          </span>
        </div>
      </div>
    </section>
  );
}
