'use client';
import { useState, useEffect } from 'react';
import { Activity, TrendingUp, Users, DollarSign, Zap, Shield } from 'lucide-react';

export default function Home() {
  const [stats, setStats] = useState({
    activeUsers: 0,
    totalBets: 0,
    volume: 0,
    uptime: 0
  });

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001/ws');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'initial' && data.data?.health) {
        setStats(prev => ({
          ...prev,
          activeUsers: data.data.health.websocket || 0
        }));
      }
    };
    return () => ws.close();
  }, []);

  const features = [
    { icon: Activity, title: 'Real-time Updates', desc: 'Live scores and odds streaming' },
    { icon: TrendingUp, title: 'Smart Odds', desc: 'AI-powered odds calculation' },
    { icon: Users, title: 'Multi-agent System', desc: '9 intelligent agents working 24/7' },
    { icon: DollarSign, title: 'Secure Transactions', desc: 'Financial-grade ledger system' },
    { icon: Zap, title: 'Ultra Fast', desc: 'Sub-second response times' },
    { icon: Shield, title: 'Enterprise Security', desc: 'Bank-level protection' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Real-time sports betting platform</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-sm text-gray-400">System Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Users', value: stats.activeUsers, icon: Users, color: 'text-blue-400' },
          { label: 'Total Bets', value: stats.totalBets.toLocaleString(), icon: Activity, color: 'text-emerald-400' },
          { label: 'Trading Volume', value: `$${stats.volume.toLocaleString()}`, icon: DollarSign, color: 'text-purple-400' },
          { label: 'System Uptime', value: `${stats.uptime}%`, icon: Zap, color: 'text-amber-400' }
        ].map((stat, i) => (
          <div key={i} className="bg-dark-100 rounded-xl border border-dark-300 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`w-10 h-10 ${stat.color} opacity-50`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-100 rounded-xl border border-dark-300 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Live Matches</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-dark-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <span className="text-emerald-400 text-sm font-bold">C</span>
                </div>
                <div>
                  <p className="text-white font-medium">India vs Australia</p>
                  <p className="text-gray-400 text-sm">T20 International</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">245/4</p>
                <p className="text-gray-400 text-sm">32.4 overs</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-dark-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <span className="text-blue-400 text-sm font-bold">T</span>
                </div>
                <div>
                  <p className="text-white font-medium">Djokovic vs Alcaraz</p>
                  <p className="text-gray-400 text-sm">ATP Tour</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">2-1</p>
                <p className="text-gray-400 text-sm">Sets</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-dark-100 rounded-xl border border-dark-300 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Live Odds</h2>
          <div className="space-y-4">
            <div className="p-4 bg-dark-200 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">India vs Australia - Match Winner</p>
              <div className="flex gap-4">
                <div className="flex-1 bg-dark-300 rounded-lg p-3 text-center">
                  <p className="text-gray-400 text-sm">India</p>
                  <p className="text-emerald-400 text-xl font-bold">1.85</p>
                </div>
                <div className="flex-1 bg-dark-300 rounded-lg p-3 text-center">
                  <p className="text-gray-400 text-sm">Australia</p>
                  <p className="text-blue-400 text-xl font-bold">2.10</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-dark-200 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">Djokovic vs Alcaraz - Match Winner</p>
              <div className="flex gap-4">
                <div className="flex-1 bg-dark-300 rounded-lg p-3 text-center">
                  <p className="text-gray-400 text-sm">Djokovic</p>
                  <p className="text-emerald-400 text-xl font-bold">1.70</p>
                </div>
                <div className="flex-1 bg-dark-300 rounded-lg p-3 text-center">
                  <p className="text-gray-400 text-sm">Alcaraz</p>
                  <p className="text-blue-400 text-xl font-bold">2.30</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-dark-100 rounded-xl border border-dark-300 p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div key={i} className="flex items-start gap-4 p-4 bg-dark-200 rounded-lg">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">{feature.title}</h3>
                <p className="text-gray-400 text-sm mt-1">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}