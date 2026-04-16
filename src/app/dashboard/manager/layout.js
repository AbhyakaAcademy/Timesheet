"use client";

import Header from "@/components/dashboard/Header";
import Sidebar from "@/components/dashboard/Sidebar";
import RouteGuard from "@/components/auth/RouteGuard";
import HelpButton from "@/components/support/HelpButton";

export default function DashboardLayout({ children }) {
  return (
    <RouteGuard allowedRoles={["manager"]}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <Header />
          <main className="px-4 py-5 md:px-8 md:py-6">{children}</main>
        </div>
        <HelpButton dashboardName="Manager" clientName="Manager Dashboard" requesterName="Manager" />
      </div>
    </RouteGuard>
  );
}
