'use client';
import { useState, useEffect } from 'react';

export default function SecurityPage() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetch('/api/account/security').then(res => res.json()).then(json => setSessions(json.sessions || []));
  }, []);

  const logoutAll = async () => {
    if (confirm('Logout from all devices?')) {
      await fetch('/api/account/security', { method: 'POST' });
      setSessions([]);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">🔐 Security</h1>
      <div className="card">
        <h3>Login History</h3>
        {sessions.length === 0 ? <p>No recent logins</p> : (
          <table className="data-table">
            <thead><tr><th>Device</th><th>IP</th><th>Date</th></tr></thead>
            <tbody>
              {sessions.map((s, i) => <tr key={i}><td>{s.device}</td><td>{s.ip}</td><td>{new Date(s.date).toLocaleString()}</td></tr>)}
            </tbody>
          </table>
        )}
      </div>
      <button onClick={logoutAll} className="btn btn-danger" style={{marginTop: 20}}>Logout All Devices</button>
    </div>
  );
}