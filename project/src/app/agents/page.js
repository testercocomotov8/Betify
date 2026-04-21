'use client';
import { useState } from 'react';
import { Bot, Play, Pause, RotateCcw, Activity, Cpu, Wifi, AlertCircle } from 'lucide-react';

const agents = [
  { id: 1, name: 'DataFetchAgent', status: 'running', uptime: '99.9%', tasks: 1247, memory: '128MB' },
  { id: 2, name: 'OddsAgent', status: 'running', uptime: '99.8%', tasks: 892, memory: '96MB' },
  { id: 3, name: 'NormalizationAgent', status: 'running', uptime: '100%', tasks: 2134, memory: '64MB' },
  { id: 4, name: 'BroadcastAgent', status: 'running', uptime: '99.9%', tasks: 3421, memory: '256MB' },
  { id: 5, name: 'CacheAgent', status: 'running', uptime: '99.7%', tasks: 5678, memory: '512MB' },
  { id: 6, name: 'FallbackAgent', status: 'idle', uptime: '98.5%', tasks: 23, memory: '32MB' },
  { id: 7, name: 'BetEngineAgent', status: 'running', uptime: '99.9%', tasks: 456, memory: '384MB' },
  { id: 8, name: 'AdminAgent', status: 'running', uptime: '100%', tasks: 89, memory: '48MB' },
  { id: 9, name: 'SecurityAgent', status: 'running', uptime: '99.9%', tasks: 2341, memory: '128MB' },
];

export default function AgentsPage() {
  const [agentList, setAgentList] = useState(agents);

  const toggleAgent = (id) => {
    setAgentList(agents.map(a => a.id === id ? { ...a, status: a.status === 'running' ? 'idle' : 'running' } : a));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Agent Control</h1>
        <p className="text-gray-400 mt-1">Monitor and control multi-agent system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-100 rounded-xl border border-dark-300 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">8</p>
              <p className="text-gray-400 text-sm">Active Agents</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-100 rounded-xl border border-dark-300 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <Cpu className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">15,381</p>
              <p className="text-gray-400 text-sm">Total Tasks</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-100 rounded-xl border border-dark-300 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Wifi className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">99.8%</p>
              <p className="text-gray-400 text-sm">Avg Uptime</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-dark-100 rounded-xl border border-dark-300">
        <div className="p-4 border-b border-dark-300">
          <h2 className="text-lg font-semibold text-white">Agent Status</h2>
        </div>
        <div className="divide-y divide-dark-300">
          {agentList.map((agent) => (
            <div key={agent.id} className="p-4 flex items-center justify-between hover:bg-dark-200/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                  <Bot className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{agent.name}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-gray-400 text-sm">Uptime: {agent.uptime}</span>
                    <span className="text-gray-400 text-sm">Tasks: {agent.tasks}</span>
                    <span className="text-gray-400 text-sm">Memory: {agent.memory}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${agent.status === 'running' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full ${agent.status === 'running' ? 'bg-emerald-400' : 'bg-gray-400'}`} />
                  {agent.status}
                </span>
                <button onClick={() => toggleAgent(agent.id)} className="p-2 hover:bg-dark-300 rounded-lg text-gray-400 hover:text-white transition-colors">
                  {agent.status === 'running' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button className="p-2 hover:bg-dark-300 rounded-lg text-gray-400 hover:text-white transition-colors">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}