'use client';

import { useState, useEffect } from 'react';

export default function UnsettledPage() {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnsettledBets();
    // Poll for real-time updates every 30 seconds
    const interval = setInterval(fetchUnsettledBets, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnsettledBets = async () => {
    try {
      const res = await fetch('/api/account/unsettled');
      const data = await res.json();
      setBets(data.bets || []);
    } catch (error) {
      console.error('Failed to fetch unsettled bets:', error);
    }
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-blue-100 text-blue-700',
      pending: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-purple-100 text-purple-700',
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Unsettled Bets</h1>
        <p className="text-gray-600 mt-1">View your active and pending bets</p>
      </div>

      {/* Real-time indicator */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-center gap-3">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-blue-700">Real-time updates enabled - refreshing every 30 seconds</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Loading unsettled bets...</p>
          </div>
        ) : bets.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-5xl mb-4">✅</div>
            <h3 className="text-lg font-medium text-gray-900">No unsettled bets</h3>
            <p className="text-gray-500 mt-1">All your bets have been settled</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sr No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Match</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Selection</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Stake</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Current Odds</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Potential Win</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bets.map((bet) => (
                  <tr key={bet.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900">{bet.srNo}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 font-medium">{bet.match}</div>
                      <div className="text-xs text-gray-500">{bet.sport}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{bet.selection}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">₹{bet.stake.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">
                      {bet.currentOdds.toFixed(2)}
                      {bet.currentOdds !== bet.odds && (
                        <span className="ml-2 text-xs text-gray-500">(was {bet.odds.toFixed(2)})</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(bet.status)}`}>
                        {bet.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600 text-right font-semibold">
                      ₹{(bet.stake * bet.currentOdds).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}