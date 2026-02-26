"use client";

import RouteGuard from "@/components/auth/RouteGuard";

export default function DashboardRootLayout({ children }) {
  return (
    <RouteGuard allowedRoles={["employee", "manager", "admin", "finance", "tenant"]}>
      {children}
    </RouteGuard>
  );
}
