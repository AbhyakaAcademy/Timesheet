export const EMPLOYEE_SETTINGS_STORAGE_KEY = "employeeDashboardSettings";

const FONT_SIZE_MAP = {
  Small: "15px",
  Medium: "16px",
  Large: "17px",
};

function getResolvedTheme(themeMode) {
  if (themeMode === "System Default") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  return themeMode?.toLowerCase() === "dark" ? "dark" : "light";
}

export function applyEmployeePreferences(settings = {}) {
  if (typeof window === "undefined") return;

  const resolvedTheme = getResolvedTheme(settings.themeMode);
  const root = document.documentElement;

  root.dataset.employeeTheme = resolvedTheme;
  root.style.fontSize = FONT_SIZE_MAP[settings.fontSize] || FONT_SIZE_MAP.Medium;
}

export function loadEmployeePreferences() {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem(EMPLOYEE_SETTINGS_STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}
