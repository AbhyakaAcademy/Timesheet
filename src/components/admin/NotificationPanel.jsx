import { X, AlertCircle, CheckCircle, Info, DollarSign } from 'lucide-react';

const notifications = [
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

export function NotificationPanel({ isOpen, onClose }) {
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
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
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
                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
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
