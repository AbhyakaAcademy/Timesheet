const ADMIN_DASHBOARD_STORAGE_KEY = 'adminDashboardState';

function canUseWindow() {
  return typeof window !== 'undefined';
}

function readState() {
  if (!canUseWindow()) return {};

  try {
    const raw = window.localStorage.getItem(ADMIN_DASHBOARD_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeState(state) {
  if (!canUseWindow()) return;
  window.localStorage.setItem(ADMIN_DASHBOARD_STORAGE_KEY, JSON.stringify(state));
}

export function getAdminDashboardSlice(key, fallbackValue) {
  const state = readState();
  return key in state ? state[key] : fallbackValue;
}

export function setAdminDashboardSlice(key, value) {
  const state = readState();
  writeState({
    ...state,
    [key]: value,
  });
}
