import { Bell, Lock, User, Globe, Shield, Mail, Database, Palette, Code } from 'lucide-react';
import { useState } from 'react';

export function Settings() {
  const [slackConnected, setSlackConnected] = useState(false);
  const [analyticsConnected, setAnalyticsConnected] = useState(false);
  const [showSlackDialog, setShowSlackDialog] = useState(false);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const handleResetPlatform = () => {
    if (confirmationText === 'RESET') {
      alert('Platform data has been reset successfully!');
      setShowResetDialog(false);
      setConfirmationText('');
    } else {
      alert('Please type RESET to confirm');
    }
  };

  const handleDisablePlatform = () => {
    if (confirmationText === 'DISABLE') {
      alert('Platform has been disabled. All services stopped.');
      setShowDisableDialog(false);
      setConfirmationText('');
    } else {
      alert('Please type DISABLE to confirm');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage platform settings and configuration</p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile Settings */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Profile Settings</h3>
              <p className="text-sm text-gray-600">Manage your account information</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input 
                type="text" 
                defaultValue="John Doe"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input 
                type="email" 
                defaultValue="john.doe@timetrack.com"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
              />
            </div>
            <button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
              Save Changes
            </button>
          </div>
        </div>

        {/* Security Settings */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-50 rounded-lg">
              <Lock className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Security</h3>
              <p className="text-sm text-gray-600">Password and authentication</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input 
                type="password" 
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input 
                type="password" 
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
              />
            </div>
            <button className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">
              Update Password
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Bell className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <p className="text-sm text-gray-600">Manage notification preferences</p>
            </div>
          </div>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
              <span className="text-sm font-medium text-gray-900">Email Notifications</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            </label>
            <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
              <span className="text-sm font-medium text-gray-900">System Alerts</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            </label>
            <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
              <span className="text-sm font-medium text-gray-900">Weekly Reports</span>
              <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            </label>
            <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
              <span className="text-sm font-medium text-gray-900">New Client Signup Alerts</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            </label>
          </div>
        </div>

        {/* Platform Branding */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-pink-50 rounded-lg">
              <Palette className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Platform Branding</h3>
              <p className="text-sm text-gray-600">Customize your platform appearance</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform Name</label>
              <input 
                type="text" 
                defaultValue="TimeTrack"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  defaultValue="#3b82f6"
                  className="h-10 w-20 rounded-lg border border-gray-200 cursor-pointer" 
                />
                <input 
                  type="text" 
                  defaultValue="#3b82f6"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                />
              </div>
            </div>
            <button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
              Update Branding
            </button>
          </div>
        </div>

        {/* API Settings */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-50 rounded-lg">
              <Database className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">API Access</h3>
              <p className="text-sm text-gray-600">Manage API keys and webhooks</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Master API Key</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value="sk_live_••••••••••••••••••••"
                  readOnly
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50" 
                />
                <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                  Copy
                </button>
              </div>
            </div>
            <button className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Generate New Key
            </button>
            <button className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Configure Webhooks
            </button>
          </div>
        </div>

        {/* Email Configuration */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-cyan-50 rounded-lg">
              <Mail className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Email Configuration</h3>
              <p className="text-sm text-gray-600">SMTP and email templates</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-900">SMTP Status</p>
                <p className="text-xs text-gray-500">smtp.timetrack.com</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-green-600">Connected</span>
              </div>
            </div>
            <button className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Configure SMTP
            </button>
            <button className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Manage Email Templates
            </button>
          </div>
        </div>

        {/* Platform Configuration */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-indigo-50 rounded-lg">
              <Globe className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Platform Configuration</h3>
              <p className="text-sm text-gray-600">General platform settings</p>
            </div>
          </div>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
              <span className="text-sm font-medium text-gray-900">Allow New Signups</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            </label>
            <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
              <span className="text-sm font-medium text-gray-900">Require Email Verification</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            </label>
            <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
              <span className="text-sm font-medium text-gray-900">Enable Trial Period</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            </label>
            <div className="p-3 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1">Trial Period (Days)</label>
              <input 
                type="number" 
                defaultValue="14"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
              />
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <Code className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Integrations</h3>
              <p className="text-sm text-gray-600">Connect third-party services</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-900">Razorpay</p>
                <p className="text-xs text-gray-500">Payment processing</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-green-600">Connected</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-900">Slack</p>
                <p className="text-xs text-gray-500">Team notifications</p>
              </div>
              {slackConnected ? (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-green-600">Connected</span>
                </div>
              ) : (
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium" onClick={() => setShowSlackDialog(true)}>Connect</button>
              )}
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-900">Google Analytics</p>
                <p className="text-xs text-gray-500">Usage tracking</p>
              </div>
              {analyticsConnected ? (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-green-600">Connected</span>
                </div>
              ) : (
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium" onClick={() => setShowAnalyticsDialog(true)}>Connect</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-red-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-50 rounded-lg">
            <Shield className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
            <p className="text-sm text-red-600">Irreversible and destructive actions</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors" onClick={() => setShowResetDialog(true)}>
            Reset Platform Data
          </button>
          <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors" onClick={() => setShowDisableDialog(true)}>
            Disable Platform
          </button>
        </div>
      </div>

      {/* Slack Connection Dialog */}
      {showSlackDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900">Connect Slack</h2>
            <p className="mt-2 text-gray-600">Enter your Slack workspace URL and token to connect.</p>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Workspace URL</label>
                <input 
                  type="text" 
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Token</label>
                <input 
                  type="text" 
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 transition-colors" onClick={() => setShowSlackDialog(false)}>
                Cancel
              </button>
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors" onClick={() => { setSlackConnected(true); setShowSlackDialog(false); }}>
                Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Analytics Connection Dialog */}
      {showAnalyticsDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900">Connect Google Analytics</h2>
            <p className="mt-2 text-gray-600">Enter your Google Analytics tracking ID to connect.</p>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tracking ID</label>
                <input 
                  type="text" 
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 transition-colors" onClick={() => setShowAnalyticsDialog(false)}>
                Cancel
              </button>
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors" onClick={() => { setAnalyticsConnected(true); setShowAnalyticsDialog(false); }}>
                Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Platform Data Dialog */}
      {showResetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900">Reset Platform Data</h2>
            <p className="mt-2 text-gray-600">Type <strong>RESET</strong> in the box below to confirm.</p>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation</label>
                <input 
                  type="text" 
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 transition-colors" onClick={() => setShowResetDialog(false)}>
                Cancel
              </button>
              <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors" onClick={handleResetPlatform}>
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disable Platform Dialog */}
      {showDisableDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900">Disable Platform</h2>
            <p className="mt-2 text-gray-600">Type <strong>DISABLE</strong> in the box below to confirm.</p>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation</label>
                <input 
                  type="text" 
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 transition-colors" onClick={() => setShowDisableDialog(false)}>
                Cancel
              </button>
              <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors" onClick={handleDisablePlatform}>
                Disable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}