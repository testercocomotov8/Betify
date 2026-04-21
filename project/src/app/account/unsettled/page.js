'use client';
import { useState, useEffect } from 'react';

export default function UnsettledPage() {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBets();
    const interval = setInterval(fetchBets, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchBets = async () => {
    const res = await fetch('/api/account/unsettled');
    const json = await res.json();
    setBets(json.data);
    setLoading(false);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">⏳ Unsettled Bets</h1>
      {loading ? <div className="empty-state"><p>Loading...</p></div> : bets.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">✅</div><p className="empty-state-text">No unsettled bets</p></div>
      ) : (
        <table className="data-table">
          <thead><tr><th>Match</th><th>Selection</th><th>Stake</th><th>Odds</th><th>Status</th></tr></thead>
          <tbody>
            {bets.map(bet => (
              <tr key={bet.id}>
                <td>{bet.match}</td>
                <td>{bet.selection}</td>
                <td>₹{bet.stake.toLocaleString()}</td>
                <td>{bet.odds}x</td>
                <td className="pending">{bet.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}