'use client';
import { useState } from 'react';
import { Settings, User, Bell, Shield, Palette, Database, Save } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex gap-6">
        <div className="w-64 shrink-0">
          <nav className="space-y-1">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'appearance', label: 'Appearance', icon: Palette },
              { id: 'system', label: 'System', icon: Database },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === tab.id ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-400 hover:bg-dark-200 hover:text-white'}`}>
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 bg-dark-100 rounded-xl border border-dark-300 p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Profile Settings</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">First Name</label>
                  <input type="text" defaultValue="Admin" className="w-full bg-dark-200 border border-dark-300 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Last Name</label>
                  <input type="text" defaultValue="User" className="w-full bg-dark-200 border border-dark-300 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Email</label>
                <input type="email" defaultValue="admin@betify.com" className="w-full bg-dark-200 border border-dark-300 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Appearance</h2>
              <div>
                <label className="block text-sm text-gray-400 mb-3">Theme</label>
                <div className="flex gap-3">
                  {['dark', 'light', 'system'].map((theme) => (
                    <button key={theme} className="px-4 py-2 bg-dark-200 hover:bg-dark-300 text-white rounded-lg transition-colors capitalize">{theme}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Notifications</h2>
              <div className="space-y-4">
                {['Email notifications', 'Push notifications', 'SMS alerts'].map((item) => (
                  <div key={item} className="flex items-center justify-between py-3 border-b border-dark-300">
                    <span className="text-white">{item}</span>
                    <button className="w-12 h-6 bg-indigo-500 rounded-full relative"><span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Security</h2>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Current Password</label>
                <input type="password" placeholder="Enter current password" className="w-full bg-dark-200 border border-dark-300 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">New Password</label>
                <input type="password" placeholder="Enter new password" className="w-full bg-dark-200 border border-dark-300 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors">
                <Shield className="w-4 h-4" /> Update Password
              </button>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">System Configuration</h2>
              <div>
                <label className="block text-sm text-gray-400 mb-2">API Rate Limit</label>
                <input type="number" defaultValue="1000" className="w-full bg-dark-200 border border-dark-300 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Cache TTL (seconds)</label>
                <input type="number" defaultValue="300" className="w-full bg-dark-200 border border-dark-300 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors">
                <Save className="w-4 h-4" /> Save Configuration
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}