const SUPPORT_TICKETS_STORAGE_KEY = "dashboardHelpTickets";
const SUPPORT_TICKETS_EVENT = "dashboard-support-tickets-updated";
const CLIENT_NOTIFICATIONS_STORAGE_KEY = "dashboardClientNotifications";
const CLIENT_NOTIFICATIONS_EVENT = "dashboard-client-notifications-updated";

function canUseWindow() {
  return typeof window !== "undefined";
}

function readStoredTickets() {
  if (!canUseWindow()) return [];

  try {
    const raw = window.localStorage.getItem(SUPPORT_TICKETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredTickets(tickets) {
  if (!canUseWindow()) return;
  window.localStorage.setItem(SUPPORT_TICKETS_STORAGE_KEY, JSON.stringify(tickets));
  window.dispatchEvent(new CustomEvent(SUPPORT_TICKETS_EVENT));
}

function readStoredNotifications() {
  if (!canUseWindow()) return [];

  try {
    const raw = window.localStorage.getItem(CLIENT_NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredNotifications(notifications) {
  if (!canUseWindow()) return;
  window.localStorage.setItem(CLIENT_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new CustomEvent(CLIENT_NOTIFICATIONS_EVENT));
}

function createTicketId(existingTickets) {
  const highest = existingTickets.reduce((max, ticket) => {
    const match = String(ticket.id || "").match(/TKT-(\d+)/);
    const value = match ? Number.parseInt(match[1], 10) : 0;
    return Math.max(max, value);
  }, 2000);

  return `TKT-${highest + 1}`;
}

export function getSupportTickets() {
  return readStoredTickets();
}

export function createSupportTicket({
  title,
  description,
  priority = "Medium",
  dashboard = "General",
  clientName,
  requesterName,
}) {
  const existingTickets = readStoredTickets();
  const normalizedDashboard = dashboard || "General";
  const ticket = {
    id: createTicketId(existingTickets),
    title: title.trim(),
    description: description.trim(),
    priority,
    status: "Open",
    assignedTo: "Unassigned",
    createdDate: new Date().toISOString().slice(0, 10),
    clientName: clientName?.trim() || `${normalizedDashboard} Dashboard`,
    dashboard: normalizedDashboard,
    requesterName: requesterName?.trim() || "Dashboard User",
    notes: [],
  };

  writeStoredTickets([ticket, ...existingTickets]);

  return ticket;
}

export function updateSupportTicket(ticketId, updates = {}) {
  const existingTickets = readStoredTickets();
  const currentTicket = existingTickets.find((ticket) => ticket.id === ticketId);

  if (!currentTicket) {
    return null;
  }

  const nextTicket = {
    ...currentTicket,
    ...updates,
  };

  writeStoredTickets(existingTickets.map((ticket) => (ticket.id === ticketId ? nextTicket : ticket)));

  const nextNotifications = readStoredNotifications();
  const createdAt = new Date().toISOString();
  const clientNotifications = [];

  if (updates.status && updates.status !== currentTicket.status) {
    clientNotifications.push({
      id: `${ticketId}-status-${createdAt}`,
      ticketId,
      clientName: nextTicket.clientName,
      title: `Issue status updated to ${updates.status}`,
      message: `${nextTicket.title} is now marked as ${updates.status}.`,
      time: createdAt,
      read: false,
    });
  }

  if (Array.isArray(updates.notes) && updates.notes.length > (currentTicket.notes || []).length) {
    const latestNote = updates.notes[updates.notes.length - 1];
    clientNotifications.push({
      id: `${ticketId}-note-${createdAt}`,
      ticketId,
      clientName: nextTicket.clientName,
      title: "New admin note added",
      message: latestNote,
      time: createdAt,
      read: false,
    });
  }

  if (clientNotifications.length > 0) {
    writeStoredNotifications([...clientNotifications, ...nextNotifications]);
  }

  return nextTicket;
}

export function getClientNotifications(clientName) {
  return readStoredNotifications().filter((item) => !clientName || item.clientName === clientName);
}

export function markClientNotificationsRead(clientName) {
  const notifications = readStoredNotifications();
  const nextNotifications = notifications.map((item) =>
    !clientName || item.clientName === clientName ? { ...item, read: true } : item
  );
  writeStoredNotifications(nextNotifications);
}

export function subscribeToSupportTickets(listener) {
  if (!canUseWindow()) return () => {};

  const handleUpdate = () => listener(getSupportTickets());
  window.addEventListener(SUPPORT_TICKETS_EVENT, handleUpdate);
  window.addEventListener("storage", handleUpdate);

  return () => {
    window.removeEventListener(SUPPORT_TICKETS_EVENT, handleUpdate);
    window.removeEventListener("storage", handleUpdate);
  };
}

export function subscribeToClientNotifications(listener) {
  if (!canUseWindow()) return () => {};

  const handleUpdate = () => listener(readStoredNotifications());
  window.addEventListener(CLIENT_NOTIFICATIONS_EVENT, handleUpdate);
  window.addEventListener("storage", handleUpdate);

  return () => {
    window.removeEventListener(CLIENT_NOTIFICATIONS_EVENT, handleUpdate);
    window.removeEventListener("storage", handleUpdate);
  };
}
