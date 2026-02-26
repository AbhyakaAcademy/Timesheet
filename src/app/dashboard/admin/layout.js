"use client";

import RouteGuard from "@/components/auth/RouteGuard";

export default function AdminDashboardLayout({ children }) {
  return <RouteGuard allowedRoles={["admin"]}>{children}</RouteGuard>;
}
