import Link from "next/link";

const tabs = [
  {
    key: "team",
    label: "Team Timesheets",
    href: "/dashboard/manager/team",
    count: 3,
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
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
    key: "employees",
    label: "Employees",
    href: "/dashboard/manager/employees",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
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
    key: "reports",
    label: "Team Reports",
    href: "/dashboard/manager/reports",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
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

export default function DashboardFrame({ activeTab, children, pendingCount = null }) {
  const mappedTabs = tabs.map((tab) =>
    tab.key === "team" && pendingCount !== null ? { ...tab, count: pendingCount } : tab
  );

  return (
    <section className="mx-auto w-full max-w-[1320px] rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-1 border-b border-gray-200 px-4 pt-2 md:px-6">
        {mappedTabs.map((tab) => {
          const isActive = tab.key === activeTab;

          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`relative inline-flex items-center gap-2 rounded-t-lg px-3 py-3 text-sm font-medium transition ${
                isActive
                  ? "text-blue-600 after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:bg-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count ? (
                <span className="ml-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-100 px-2 text-xs font-medium text-blue-600">
                  {tab.count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}

