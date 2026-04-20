import { X, AlertCircle, CheckCircle, Info, DollarSign } from 'lucide-react';
import { useState } from 'react';

const initialNotifications = [
  {
    id: 1,
    type: 'success',
    title: 'New subscription',
    message: 'Acme Corporation upgraded to Enterprise plan',
    time: '5 minutes ago',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    id: 2,
    type: 'alert',
    title: 'Payment failed',
    message: 'TechStart Inc payment method declined',
    time: '1 hour ago',
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    id: 3,
    type: 'info',
    title: 'System update',
    message: 'Scheduled maintenance on Feb 20, 2026',
    time: '2 hours ago',
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 4,
    type: 'success',
    title: 'Revenue milestone',
    message: 'Monthly revenue reached $150K',
    time: '5 hours ago',
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    id: 5,
    type: 'info',
    title: 'New support ticket',
    message: 'Global Solutions Ltd submitted ticket #TKT-1892',
    time: '1 day ago',
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
];

const DISMISSED_NOTIFICATIONS_KEY = 'adminDismissedNotificationIds';

function readDismissedNotificationIds() {
  if (typeof window === 'undefined') return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(DISMISSED_NOTIFICATIONS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function writeDismissedNotificationIds(ids) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify([...new Set(ids.map(String))]));
}

function getVisibleNotifications() {
  const dismissedIds = new Set(readDismissedNotificationIds());
  return initialNotifications.filter((notification) => !dismissedIds.has(String(notification.id)));
}

export function NotificationPanel({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState(getVisibleNotifications);

  const clearAllNotifications = () => {
    writeDismissedNotificationIds(initialNotifications.map((notification) => notification.id));
    setNotifications([]);
    onClose();
  };

  const clearNotification = (notificationId) => {
    writeDismissedNotificationIds([...readDismissedNotificationIds(), notificationId]);
    setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-screen w-full max-w-md border-l border-gray-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-600">{notifications.length} unread notifications</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearAllNotifications}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Clear
              </button>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto h-[calc(100vh-80px)]">
          <div className="p-4 space-y-3">
            {notifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <div
                  key={notification.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex gap-3">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${notification.bgColor}`}>
                      <Icon className={`h-5 w-5 ${notification.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                        <button
                          type="button"
                          onClick={() => clearNotification(notification.id)}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-xs font-semibold leading-none text-gray-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Clear notification"
                        >
                          x
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
