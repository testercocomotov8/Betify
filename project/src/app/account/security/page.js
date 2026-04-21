'use client';

import { useState } from 'react';

export default function SecurityPage() {
  const [sessions, setSessions] = useState([
    { id: 1, device: 'Chrome on Windows', location: 'Mumbai, India', ip: '192.168.1.1', lastActive: '2 minutes ago', current: true },
    { id: 2, device: 'Safari on iPhone', location: 'Mumbai, India', ip: '192.168.1.2', lastActive: '1 hour ago', current: false },
    { id: 3, device: 'Firefox on MacOS', location: 'Delhi, India', ip: '10.0.0.1', lastActive: '2 days ago', current: false },
  ]);

  const [loginHistory] = useState([
    { id: 1, action: 'Login', device: 'Chrome on Windows', ip: '192.168.1.1', date: '2024-01-15 14:32:00', status: 'success' },
    { id: 2, action: 'Login', device: 'Safari on iPhone', ip: '192.168.1.2', date: '2024-01-15 13:15:00', status: 'success' },
    { id: 3, action: 'Password Change', device: 'Chrome on Windows', ip: '192.168.1.1', date: '2024-01-14 10:20:00', status: 'success' },
    { id: 4, action: 'Login', device: 'Firefox on MacOS', ip: '10.0.0.1', date: '2024-01-13 18:45:00', status: 'success' },
    { id: 5, action: 'Login Failed', device: 'Unknown', ip: '203.0.113.1', date: '2024-01-12 22:10:00', status: 'failed' },
  ]);

  const [message, setMessage] = useState({ type: '', text: '' });

  const handleLogoutDevice = (sessionId) => {
    setSessions(sessions.filter(s => s.id !== sessionId));
    setMessage({ type: 'success', text: 'Device logged out successfully!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleLogoutAll = () => {
    const currentSession = sessions.find(s => s.current);
    setSessions(currentSession ? [currentSession] : []);
    setMessage({ type: 'success', text: 'All other devices logged out!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const getStatusBadge = (status) => {
    return status === 'success' 
      ? 'bg-green-100 text-green-700' 
      : 'bg-red-100 text-red-700';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Security</h1>
        <p className="text-gray-600 mt-1">Manage your account security and active sessions</p>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Active Sessions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Active Sessions</h2>
          <button
            onClick={handleLogoutAll}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout All Devices
          </button>
        </div>

        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-lg">💻</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{session.device}</span>
                    {session.current && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Current</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {session.location} • {session.ip} • {session.lastActive}
                  </div>
                </div>
              </div>
              {!session.current && (
                <button
                  onClick={() => handleLogoutDevice(session.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Logout
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Login History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Login History</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Device</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">IP Address</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loginHistory.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900">{log.action}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{log.device}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">{log.ip}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{log.date}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}