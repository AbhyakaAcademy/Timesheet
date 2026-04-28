"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { reportDashboardActivity, summarizeDashboardPath } from "@/lib/dashboardActivity";

export default function DashboardActivityMonitor() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname?.startsWith("/dashboard")) return;

    reportDashboardActivity({
      event_type: "page_view",
      severity: "info",
      summary: `${summarizeDashboardPath(pathname)} dashboard opened`,
      details: `User opened ${pathname}.`,
    });
  }, [pathname]);

  useEffect(() => {
    if (!pathname?.startsWith("/dashboard")) return;

    const handleError = (event) => {
      reportDashboardActivity({
        event_type: "client_error",
        severity: "critical",
        summary: `${summarizeDashboardPath(pathname)} dashboard client error`,
        details: event?.message || "Unhandled browser error.",
        metadata: {
          file: event?.filename || "",
          line: event?.lineno || null,
          column: event?.colno || null,
        },
      });
    };

    const handleRejection = (event) => {
      const reason = event?.reason;
      reportDashboardActivity({
        event_type: "client_error",
        severity: "high",
        summary: `${summarizeDashboardPath(pathname)} dashboard promise rejection`,
        details: typeof reason === "string" ? reason : reason?.message || "Unhandled promise rejection.",
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, [pathname]);

  return null;
}
