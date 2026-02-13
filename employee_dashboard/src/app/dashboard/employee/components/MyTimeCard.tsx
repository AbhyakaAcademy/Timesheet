"use client";

import { Clock, Calendar, TrendingUp } from "lucide-react";

type MyTimeCardProps = {
  todayHours: number;
  weekHours: number;
  monthHours: number;
};

export function MyTimeCard({ todayHours, weekHours, monthHours }: MyTimeCardProps) {
  const expectedWeekHours = 40;
  const remainingWeekHours = Math.max(expectedWeekHours - weekHours, 0);

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
            {todayHours.toFixed(1)}h
          </p>
        </div>

        <div className="rounded-xl bg-emerald-50 px-3 py-2.5 border border-emerald-100">
          <div className="flex items-center gap-2 text-emerald-700 text-xs">
            <Calendar className="h-3.5 w-3.5" />
            This Week
          </div>
          <p className="mt-1.5 text-lg font-semibold text-emerald-700">
            {weekHours.toFixed(1)}h
          </p>
        </div>

        <div className="rounded-xl bg-purple-50 px-3 py-2.5 border border-purple-100">
          <div className="flex items-center gap-2 text-purple-700 text-xs">
            <TrendingUp className="h-3.5 w-3.5" />
            This Month
          </div>
          <p className="mt-1.5 text-lg font-semibold text-purple-700">
            {monthHours.toFixed(1)}h
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-gray-200 pt-3 text-xs text-gray-700 space-y-1">
        <div className="flex items-center justify-between">
          <span>Expected this week:</span>
          <span className="font-semibold">{expectedWeekHours}h</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Remaining:</span>
          <span className="font-semibold text-rose-500">
            {remainingWeekHours.toFixed(1)}h
          </span>
        </div>
      </div>
    </section>
  );
}
