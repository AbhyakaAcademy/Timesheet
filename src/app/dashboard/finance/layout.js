"use client";

import RouteGuard from "@/components/auth/RouteGuard";

export default function FinanceDashboardLayout({ children }) {
  return (
    <RouteGuard allowedRoles={["finance"]}>
      {children}
    </RouteGuard>
  );
}
