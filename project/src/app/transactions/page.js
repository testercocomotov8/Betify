'use client';
import { useState } from 'react';
import { Search, Filter, Download, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

const transactions = [
  { id: 'TXN001', user: 'John Smith', type: 'deposit', amount: 500, status: 'completed', date: '2024-03-15 14:30' },
  { id: 'TXN002', user: 'Sarah Connor', type: 'withdraw', amount: 200, status: 'pending', date: '2024-03-15 13:45' },
  { id: 'TXN003', user: 'Mike Johnson', type: 'bet', amount: 50, status: 'completed', date: '2024-03-15 12:20' },
  { id: 'TXN004', user: 'Emily Davis', type: 'deposit', amount: 1000, status: 'completed', date: '2024-03-15 11:00' },
  { id: 'TXN005', user: 'Robert Wilson', type: 'win', amount: 250, status: 'completed', date: '2024-03-15 10:15' },
];

export default function TransactionsPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Transactions</h1>
          <p className="text-gray-400 mt-1">View all financial transactions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-dark-200 hover:bg-dark-300 text-white rounded-lg transition-colors">
          <Download className="w-5 h-5" />
          Export
        </button>
      </div>

      <div className="bg-dark-100 rounded-xl border border-dark-300">
        <div className="p-4 border-b border-dark-300 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input type="text" placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-dark-200 border border-dark-300 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-dark-200 hover:bg-dark-300 text-gray-400 rounded-lg transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Transaction ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-300">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-dark-200/50 transition-colors">
                  <td className="px-6 py-4 text-gray-400 text-sm font-mono">{tx.id}</td>
                  <td className="px-6 py-4 text-white">{tx.user}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 text-sm ${tx.type === 'deposit' || tx.type === 'win' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.type === 'deposit' || tx.type === 'win' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white font-semibold">${tx.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${tx.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      <Clock className="w-3 h-3" />
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}