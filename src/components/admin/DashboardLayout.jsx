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
];

const defaultAdminProfile = {
  name: 'Admin User',
  email: 'admin@abhyaka.com',
};

export function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState(defaultAdminProfile);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [adminProfile, setAdminProfile] = useState(defaultAdminProfile);

  useEffect(() => {
    adminApi
      .settings()
      .then((settings) =>
        setAdminProfile({
          name: settings.full_name || defaultAdminProfile.name,
          email: settings.email || defaultAdminProfile.email,
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
    setIsEditingProfile(false);
    if (!isNotificationOpen) {
      setHasUnreadNotifications(false);
    }
  };

  const openProfile = () => {
    setProfileDraft(adminProfile);
    setProfileError('');
    setIsEditingProfile(false);
    setIsProfileOpen((prev) => !prev);
    setIsNotificationOpen(false);
  };

  const startProfileEdit = () => {
    setProfileDraft(adminProfile);
    setProfileError('');
    setIsEditingProfile(true);
  };

  const cancelProfileEdit = () => {
    setProfileDraft(adminProfile);
    setProfileError('');
    setIsEditingProfile(false);
  };

  const saveProfileEdit = async () => {
    const nextProfile = {
      name: profileDraft.name.trim(),
      email: profileDraft.email.trim(),
    };

    if (!nextProfile.name || !nextProfile.email) {
      setProfileError('Name and email are required.');
      return;
    }

    setProfileSaving(true);
    setProfileError('');
    try {
      await adminApi.updateSettings({
        full_name: nextProfile.name,
        email: nextProfile.email,
      });
      setAdminProfile(nextProfile);
      setIsEditingProfile(false);
    } catch (error) {
      setProfileError(error.message || 'Unable to update profile.');
    } finally {
      setProfileSaving(false);
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

          <div className="border-t-2 border-gray-300 p-4" />
        </div>
      </aside>

      <div className="ml-64">
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
          <div className="flex h-16 items-center justify-between gap-6 px-8">
            <button
              type="button"
              onClick={openProfile}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-semibold text-white">
                {(adminProfile.name || "A").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{adminProfile.name}</p>
              </div>
            </button>

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
              <Link
                href="/dashboard/admin/settings"
                className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="p-8">{children}</main>
      </div>

      <NotificationPanel isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
      {isProfileOpen ? (
        <div className="fixed inset-0 z-40" onClick={() => { setIsProfileOpen(false); setIsEditingProfile(false); }}>
          <div className="absolute right-8 top-20 w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Admin Profile</h3>
              </div>
              <div className="flex items-center gap-2">
                {!isEditingProfile ? (
                  <button
                    type="button"
                    onClick={startProfileEdit}
                    className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
                  >
                    Edit
                  </button>
                ) : null}
                <button type="button" onClick={() => { setIsProfileOpen(false); setIsEditingProfile(false); }} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {isEditingProfile ? (
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Name</span>
                  <input
                    value={profileDraft.name}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, name: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    placeholder="Enter admin name"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Email</span>
                  <input
                    type="email"
                    value={profileDraft.email}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, email: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    placeholder="Enter admin email"
                  />
                </label>
                {profileError ? <p className="text-sm text-rose-600">{profileError}</p> : null}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={cancelProfileEdit}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveProfileEdit}
                    disabled={profileSaving}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {profileSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <ProfileItem icon={UserCircle2} label="Name" value={adminProfile.name} />
                <ProfileItem icon={Mail} label="Email" value={adminProfile.email} />
              </div>
            )}
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
