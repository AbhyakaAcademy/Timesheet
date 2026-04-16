"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/dashboard/manager/team",
    label: "Team Timesheets",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 3v2M15 3v2M9 10h6M9 14h6" />
      </svg>
    ),
  },
  {
    href: "/dashboard/manager/employees",
    label: "Employees",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="8" r="3" />
        <path d="M4 18a5 5 0 0 1 10 0" />
        <circle cx="17" cy="9" r="2.3" />
        <path d="M15.5 17a4.5 4.5 0 0 1 4.5 1" />
      </svg>
    ),
  },
  {
    href: "/dashboard/manager/reports",
    label: "Team Reports",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3v18h18" />
        <path d="M7 15v-4M12 15V7M17 15V10" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-72 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-8 py-7">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Abhyaka
        </p>
        <h2 className="mt-2 text-lg font-semibold text-slate-900">Manager Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500">Review team time and reports</p>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6 text-sm">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                isActive
                  ? "bg-slate-100 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.icon}
              <span className="text-base font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
