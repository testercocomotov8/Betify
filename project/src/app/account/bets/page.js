'use client';
import { useState, useEffect } from 'react';

export default function BetsPage() {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ sport: 'all', date: '' });

  useEffect(() => { fetchBets(); }, [filters]);

  const fetchBets = async () => {
    setLoading(true);
    const res = await fetch(`/api/account/bets?sport=${filters.sport}&date=${filters.date}`);
    const json = await res.json();
    setBets(json.data);
    setLoading(false);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">🎯 Bet History</h1>
      <div className="filters">
        <div className="filter-group">
          <label className="filter-label">Sport</label>
          <select className="filter-select" value={filters.sport} onChange={e => setFilters({...filters, sport: e.target.value})}>
            <option value="all">All Sports</option>
            <option value="cricket">Cricket</option>
            <option value="football">Football</option>
            <option value="tennis">Tennis</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Date</label>
          <input type="date" className="filter-input" value={filters.date} onChange={e => setFilters({...filters, date: e.target.value})} />
        </div>
      </div>
      {loading ? <div className="empty-state"><p>Loading...</p></div> : bets.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">🎲</div><p className="empty-state-text">No bets found</p></div>
      ) : (
        <table className="data-table">
          <thead><tr><th>Match</th><th>Odds</th><th>Stake</th><th>Result</th><th>P/L</th></tr></thead>
          <tbody>
            {bets.map(bet => (
              <tr key={bet.id}>
                <td>{bet.match}</td>
                <td>{bet.odds}x</td>
                <td>₹{bet.stake.toLocaleString()}</td>
                <td className={bet.result.toLowerCase()}>{bet.result}</td>
                <td className={bet.profit >= 0 ? 'profit' : 'loss'}>{bet.profit >= 0 ? '+' : ''}₹{bet.profit.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}