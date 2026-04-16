import { Bell, Globe, Mail, Palette, User, Database } from "lucide-react";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminTenantApi";

const defaultSettings = {
  fullName: "",
  email: "",
  platformName: "Abhyaka",
  primaryColor: "#2563eb",
  allowNewSignups: true,
  requireEmailVerification: true,
  autoSuspendOverdue: true,
  smtpConnected: false,
  analyticsConnected: false,
  slackConnected: false,
  trialPeriod: 14,
  apiKey: "",
};

function toViewModel(payload) {
  return {
    fullName: payload?.full_name || "",
    email: payload?.email || "",
    platformName: payload?.platform_name || "Abhyaka",
    primaryColor: payload?.primary_color || "#2563eb",
    allowNewSignups: Boolean(payload?.allow_new_signups),
    requireEmailVerification: Boolean(payload?.require_email_verification),
    autoSuspendOverdue: Boolean(payload?.auto_suspend_overdue),
    smtpConnected: Boolean(payload?.smtp_connected),
    analyticsConnected: Boolean(payload?.analytics_connected),
    slackConnected: Boolean(payload?.slack_connected),
    trialPeriod: Number(payload?.trial_period || 14),
    apiKey: payload?.api_key || "",
  };
}

function toPayload(settings) {
  return {
    full_name: settings.fullName,
    email: settings.email,
    platform_name: settings.platformName,
    primary_color: settings.primaryColor,
    allow_new_signups: settings.allowNewSignups,
    require_email_verification: settings.requireEmailVerification,
    auto_suspend_overdue: settings.autoSuspendOverdue,
    smtp_connected: settings.smtpConnected,
    analytics_connected: settings.analyticsConnected,
    slack_connected: settings.slackConnected,
    trial_period: settings.trialPeriod,
    api_key: settings.apiKey,
  };
}

export function Settings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .settings()
      .then((payload) => setSettings(toViewModel(payload)))
      .finally(() => setLoading(false));
  }, []);

  const updateSettings = (updates) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const saveSettings = async (updates) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    await adminApi.updateSettings(toPayload(next));
  };

  if (loading) {
    return <div className="text-sm text-gray-600">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage platform settings and configuration</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SettingsCard icon={User} title="Profile Settings" subtitle="Manage your account information">
          <div className="space-y-4">
            <Field label="Full Name" value={settings.fullName} onChange={(value) => updateSettings({ fullName: value })} />
            <Field label="Email Address" value={settings.email} onChange={(value) => updateSettings({ email: value })} />
            <button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white" onClick={() => saveSettings()}>Save Profile</button>
          </div>
        </SettingsCard>

        <SettingsCard icon={Palette} title="Platform Branding" subtitle="Customize your platform appearance">
          <div className="space-y-4">
            <Field label="Platform Name" value={settings.platformName} onChange={(value) => updateSettings({ platformName: value })} />
            <div><label className="mb-1 block text-sm font-medium text-gray-700">Primary Color</label><div className="flex gap-2"><input type="color" value={settings.primaryColor} onChange={(e) => updateSettings({ primaryColor: e.target.value })} className="h-10 w-20 rounded-lg border border-gray-200" /><input type="text" value={settings.primaryColor} onChange={(e) => updateSettings({ primaryColor: e.target.value })} className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div></div>
            <button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white" onClick={() => saveSettings()}>Save Branding</button>
          </div>
        </SettingsCard>

        <SettingsCard icon={Bell} title="Platform Configuration" subtitle="General platform settings">
          <div className="space-y-3">
            {[
              ["allowNewSignups", "Allow New Signups"],
              ["requireEmailVerification", "Require Email Verification"],
              ["autoSuspendOverdue", "Auto Suspend Overdue Accounts"],
            ].map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-3">
                <span className="text-sm font-medium text-gray-900">{label}</span>
                <input type="checkbox" checked={Boolean(settings[key])} onChange={(e) => updateSettings({ [key]: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              </label>
            ))}
            <Field label="Trial Period (Days)" type="number" value={String(settings.trialPeriod)} onChange={(value) => updateSettings({ trialPeriod: Number(value || 0) })} />
            <button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white" onClick={() => saveSettings()}>Save Configuration</button>
          </div>
        </SettingsCard>

        <SettingsCard icon={Database} title="API Access" subtitle="Manage API keys and services">
          <div className="space-y-4">
            <Field label="Master API Key" value={settings.apiKey} onChange={(value) => updateSettings({ apiKey: value })} />
            <button className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700" onClick={() => updateSettings({ apiKey: `sk_live_${Date.now()}` })}>Generate New Key</button>
            <button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white" onClick={() => saveSettings()}>Save API Settings</button>
          </div>
        </SettingsCard>

        <SettingsCard icon={Mail} title="Email & Integrations" subtitle="Connection status">
          <div className="space-y-3">
            <Toggle label="SMTP Connected" value={settings.smtpConnected} onChange={(value) => updateSettings({ smtpConnected: value })} />
            <Toggle label="Analytics Connected" value={settings.analyticsConnected} onChange={(value) => updateSettings({ analyticsConnected: value })} />
            <Toggle label="Slack Connected" value={settings.slackConnected} onChange={(value) => updateSettings({ slackConnected: value })} />
            <button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white" onClick={() => saveSettings()}>Save Connections</button>
          </div>
        </SettingsCard>

        <SettingsCard icon={Globe} title="Status" subtitle="Current platform state">
          <div className="space-y-3 text-sm text-gray-700">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">New signups are {settings.allowNewSignups ? "enabled" : "disabled"}.</div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">Email verification is {settings.requireEmailVerification ? "required" : "not required"}.</div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">Trial period is set to {settings.trialPeriod} days.</div>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}

function SettingsCard({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3"><div className="rounded-lg bg-blue-50 p-3"><Icon className="h-5 w-5 text-blue-600" /></div><div><h3 className="text-lg font-semibold text-gray-900">{title}</h3><p className="text-sm text-gray-600">{subtitle}</p></div></div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return <div><label className="mb-1 block text-sm font-medium text-gray-700">{label}</label><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>;
}

function Toggle({ label, value, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-3">
      <span className="text-sm font-medium text-gray-900">{label}</span>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
    </label>
  );
}
