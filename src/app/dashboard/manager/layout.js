"use client";

import Header from "@/components/dashboard/Header";
import RouteGuard from "@/components/auth/RouteGuard";

export default function DashboardLayout({ children }) {
  return (
    <RouteGuard allowedRoles={["manager"]}>
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="px-4 py-5 md:px-8 md:py-6">{children}</main>
      </div>
    </RouteGuard>
  );
}
