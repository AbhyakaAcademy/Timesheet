import { Bell, Globe, Lock, Palette, User } from 'lucide-react';

export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage basic platform settings</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SettingsCard icon={User} title="Profile Settings" subtitle="Manage your account information">
          <div className="space-y-4">
            <Field label="Full Name" type="text" defaultValue="John Doe" />
            <Field label="Email Address" type="email" defaultValue="john.doe@timetrack.com" />
            <button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
              Save Profile
            </button>
          </div>
        </SettingsCard>

        <SettingsCard icon={Lock} title="Security" subtitle="Password and authentication">
          <div className="space-y-4">
            <Field label="Current Password" type="password" />
            <Field label="New Password" type="password" />
            <button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
              Update Password
            </button>
          </div>
        </SettingsCard>

        <SettingsCard icon={Bell} title="Notifications" subtitle="Basic notification preferences">
          <div className="space-y-3">
            <Toggle label="System Alerts" defaultChecked />
            <Toggle label="Weekly Reports" />
            <Toggle label="New Client Signup Alerts" defaultChecked />
          </div>
        </SettingsCard>

        <SettingsCard icon={Palette} title="Platform Branding" subtitle="Customize basic appearance">
          <div className="space-y-4">
            <Field label="Platform Name" type="text" defaultValue="TimeTrack" />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Primary Color</label>
              <div className="flex gap-2">
                <input type="color" defaultValue="#3b82f6" className="h-10 w-20 cursor-pointer rounded-lg border border-gray-200" />
                <input type="text" defaultValue="#3b82f6" className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
            <button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
              Save Branding
            </button>
          </div>
        </SettingsCard>

        <SettingsCard icon={Globe} title="Platform Configuration" subtitle="General platform settings">
          <div className="space-y-3">
            <Toggle label="Allow New Signups" defaultChecked />
            <Toggle label="Require Email Verification" defaultChecked />
            <Field label="Trial Period (Days)" type="number" defaultValue="14" />
            <button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
              Save Configuration
            </button>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}

function SettingsCard({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-lg bg-blue-50 p-3">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, type, defaultValue = '' }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}

function Toggle({ label, defaultChecked = false }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50">
      <span className="text-sm font-medium text-gray-900">{label}</span>
      <input type="checkbox" defaultChecked={defaultChecked} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
    </label>
  );
}
