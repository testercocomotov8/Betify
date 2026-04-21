'use client';
import { useState } from 'react';
import { Wallet, Plus, Minus, ArrowUpRight, ArrowDownLeft, CreditCard, Banknote, TrendingUp } from 'lucide-react';

export default function WalletPage() {
  const [action, setAction] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [userId, setUserId] = useState('');

  const stats = [
    { label: 'Total Deposits', value: '$124,500', change: '+12.5%', icon: ArrowDownLeft, color: 'emerald' },
    { label: 'Total Withdrawals', value: '$89,200', change: '-8.2%', icon: ArrowUpRight, color: 'red' },
    { label: 'Active Wallets', value: '1,247', change: '+5.3%', icon: Wallet, color: 'indigo' },
    { label: 'Avg Balance', value: '$2,450', change: '+3.1%', icon: TrendingUp, color: 'purple' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`${action === 'deposit' ? 'Deposited' : 'Withdrawn'} $${amount} ${action === 'deposit' ? 'to' : 'from'} user ${userId}`);
    setAmount('');
    setUserId('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Wallet Management</h1>
        <p className="text-gray-400 mt-1">Manage user balances and transactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-dark-100 rounded-xl border border-dark-300 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg bg-${stat.color}-500/20 flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
              </div>
              <span className={`text-xs font-medium ${stat.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-gray-400 text-sm mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-100 rounded-xl border border-dark-300 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Balance Operations</h2>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setAction('deposit')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                action === 'deposit'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-dark-200 text-gray-400 hover:text-white'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Deposit
            </button>
            <button
              onClick={() => setAction('withdraw')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                action === 'withdraw'
                  ? 'bg-red-500 text-white'
                  : 'bg-dark-200 text-gray-400 hover:text-white'
              }`}
            >
              <Minus className="w-4 h-4 inline mr-2" />
              Withdraw
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">User ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user ID"
                className="w-full bg-dark-200 border border-dark-300 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-dark-200 border border-dark-300 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                action === 'deposit'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {action === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
            </button>
          </form>
        </div>

        <div className="bg-dark-100 rounded-xl border border-dark-300 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center gap-4 p-4 bg-dark-200 hover:bg-dark-300 rounded-lg transition-colors text-left">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                <Banknote className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <p className="text-white font-medium">Add Demo Funds</p>
                <p className="text-gray-400 text-sm">Add demo balance to test account</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-4 p-4 bg-dark-200 hover:bg-dark-300 rounded-lg transition-colors text-left">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-white font-medium">Remove Demo Funds</p>
                <p className="text-gray-400 text-sm">Clear all demo balances</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}