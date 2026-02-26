import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r">
      <div className="p-5 text-xl font-bold border-b">
        Manager Panel
      </div>

      <nav className="p-4 space-y-2">
        <Link
          href="/dashboard/manager"
          className="block p-2 rounded hover:bg-gray-100"
        >
          Dashboard
        </Link>

        <Link
          href="/dashboard/manager/team"
          className="block p-2 rounded hover:bg-gray-100"
        >
          Team
        </Link>

        <Link
          href="/dashboard/manager/reports"
          className="block p-2 rounded hover:bg-gray-100"
        >
          Reports
        </Link>
      </nav>
    </aside>
  );
}

