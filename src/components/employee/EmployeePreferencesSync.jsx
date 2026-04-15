"use client";

import { useEffect } from "react";

import {
  applyEmployeePreferences,
  loadEmployeePreferences,
} from "@/lib/employeePreferences";

export default function EmployeePreferencesSync() {
  useEffect(() => {
    const syncPreferences = () => {
      const storedPreferences = loadEmployeePreferences();
      if (storedPreferences) {
        applyEmployeePreferences(storedPreferences);
      }
    };

    syncPreferences();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => syncPreferences();
    const handleStorage = (event) => {
      if (event.key === "employeeDashboardSettings") {
        syncPreferences();
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return null;
}
