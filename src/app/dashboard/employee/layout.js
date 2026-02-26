"use client";

import RouteGuard from "@/components/auth/RouteGuard";

export default function EmployeeDashboardLayout({ children }) {
  return <RouteGuard allowedRoles={["employee"]}>{children}</RouteGuard>;
}
