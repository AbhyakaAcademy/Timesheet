'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  DollarSign,
  FileText,
  AlertCircle,
  Receipt,
  BarChart3,
  Activity,
  HeadphonesIcon,
  Settings,
  Search,
  Bell,
  LogOut,
  Mail,
  UserCircle2,
  ShieldCheck,
  X,
} from 'lucide-react';
import { NotificationPanel } from './NotificationPanel';
import { ScrollToTop } from './ScrollToTop';
import { clearSession } from '@/lib/auth';
import { adminApi } from '@/lib/adminTenantApi';

const navigation = [
  { name: 'Overview', href: '/dashboard/admin/overview', icon: LayoutDashboard },
  { name: 'Clients', href: '/dashboard/admin/clients', icon: Building2 },
  { name: 'Total Users', href: '/dashboard/admin/users', icon: Users },
  { name: 'Revenue', href: '/dashboard/admin/revenue', icon: DollarSign },
  { name: 'Subscriptions', href: '/dashboard/admin/subscriptions', icon: FileText },
  { name: 'Issues Log', href: '/dashboard/admin/issues', icon: AlertCircle },
  { name: 'Invoices', href: '/dashboard/admin/invoices', icon: Receipt },
  { name: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
  { name: 'System Health', href: '/dashboard/admin/system-health', icon: Activity },
  { name: 'Customer Support', href: '/dashboard/admin/support', icon: HeadphonesIcon },
  { name: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
];

const defaultAdminProfile = {
  name: 'Admin User',
  email: 'admin@abhyaka.com',
  role: 'Platform Owner',
};

export function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [adminProfile, setAdminProfile] = useState(defaultAdminProfile);

  useEffect(() => {
    adminApi
      .settings()
      .then((settings) =>
        setAdminProfile({
          name: settings.full_name || defaultAdminProfile.name,
          email: settings.email || defaultAdminProfile.email,
          role: 'Platform Owner',
        })
      )
      .catch(() => setAdminProfile(defaultAdminProfile));
  }, []);

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  const toggleNotifications = () => {
    setIsNotificationOpen(!isNotificationOpen);
    setIsProfileOpen(false);
    if (!isNotificationOpen) {
      setHasUnreadNotifications(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r-2 border-gray-300 bg-white shadow-lg">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-2 border-b-2 border-gray-300 px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Abhyaka</h1>
              <p className="text-xs text-gray-500">Admin Console</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="border-t-2 border-gray-300 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="ml-64">
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
          <div className="flex h-16 items-center justify-between px-8">
            <div className="flex flex-1 items-center gap-4">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clients, invoices, users..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={toggleNotifications} className="relative rounded-lg p-2 transition-colors hover:bg-gray-100">
                <Bell className="h-5 w-5 text-gray-600" />
                {hasUnreadNotifications ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" /> : null}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen((prev) => !prev);
                  setIsNotificationOpen(false);
                }}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-semibold text-white">
                  {(adminProfile.name || "A").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{adminProfile.name}</p>
                  <p className="text-xs text-gray-500">{adminProfile.role}</p>
                </div>
              </button>
            </div>
          </div>
        </header>

        <main className="p-8">{children}</main>
      </div>

      <NotificationPanel isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
      {isProfileOpen ? (
        <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}>
          <div className="absolute right-8 top-20 w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600">Admin Profile</p>
                <h3 className="mt-1 text-xl font-semibold text-gray-900">{adminProfile.name}</h3>
              </div>
              <button type="button" onClick={() => setIsProfileOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <ProfileItem icon={UserCircle2} label="Name" value={adminProfile.name} />
              <ProfileItem icon={Mail} label="Email" value={adminProfile.email} />
              <ProfileItem icon={ShieldCheck} label="Role" value={adminProfile.role} />
            </div>
          </div>
        </div>
      ) : null}
      <ScrollToTop />
    </div>
  );
}

function ProfileItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
      <Icon className="h-5 w-5 text-indigo-600" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}
