'use client';
import { useState } from 'react';
import { Shield, AlertTriangle, Lock, Eye, Ban, CheckCircle, Clock } from 'lucide-react';

const logs = [
  { id: 1, type: 'auth', message: 'Failed login attempt from IP 192.168.1.1', severity: 'warning', time: '2 min ago' },
  { id: 2, type: 'bet', message: 'Suspicious bet pattern detected - User #45', severity: 'info', time: '5 min ago' },
  { id: 3, type: 'auth', message: 'Admin login successful', severity: 'success', time: '10 min ago' },
  { id: 4, type: 'api', message: 'Rate limit exceeded - API key #3', severity: 'warning', time: '15 min ago' },
  { id: 5, type: 'system', message: 'Security scan completed - No threats', severity: 'success', time: '30 min ago' },
];

export default function SecurityPage() {
  const [selectedFilter, setSelectedFilter] = useState('all');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Security Center</h1>
        <p className="text-gray-400 mt-1">Monitor and manage system security</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-dark-100 rounded-xl border border-dark-300 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">Secure</p>
              <p className="text-gray-400 text-sm">System Status</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-100 rounded-xl border border-dark-300 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">3</p>
              <p className="text-gray-400 text-sm">Active Alerts</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-100 rounded-xl border border-dark-300 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <Ban className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">12</p>
              <p className="text-gray-400 text-sm">Blocked IPs</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-100 rounded-xl border border-dark-300 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">256-bit</p>
              <p className="text-gray-400 text-sm">Encryption</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-dark-100 rounded-xl border border-dark-300">
        <div className="p-4 border-b border-dark-300 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Security Logs</h2>
          <div className="flex gap-2">
            {['all', 'warning', 'success', 'info'].map((filter) => (
              <button key={filter} onClick={() => setSelectedFilter(filter)} className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${selectedFilter === filter ? 'bg-indigo-500 text-white' : 'bg-dark-200 text-gray-400 hover:text-white'}`}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-dark-300">
          {logs.map((log) => (
            <div key={log.id} className="p-4 flex items-center gap-4 hover:bg-dark-200/50 transition-colors">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${log.severity === 'warning' ? 'bg-yellow-500/20' : log.severity === 'success' ? 'bg-emerald-500/20' : 'bg-indigo-500/20'}`}>
                {log.severity === 'warning' ? <AlertTriangle className="w-5 h-5 text-yellow-400" /> : log.severity === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Eye className="w-5 h-5 text-indigo-400" />}
              </div>
              <div className="flex-1">
                <p className="text-white">{log.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-500 text-xs uppercase">{log.type}</span>
                  <span className="text-gray-600">|</span>
                  <span className="text-gray-500 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{log.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}