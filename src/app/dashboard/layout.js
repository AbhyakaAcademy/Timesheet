"use client";

import RouteGuard from "@/components/auth/RouteGuard";
import DashboardActivityMonitor from "@/components/monitoring/DashboardActivityMonitor";

export default function DashboardRootLayout({ children }) {
  return (
    <RouteGuard allowedRoles={["employee", "manager", "admin", "finance", "tenant"]}>
      <DashboardActivityMonitor />
      {children}
    </RouteGuard>
  );
}
