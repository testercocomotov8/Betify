'use client';
import { useState } from 'react';

export default function SettingsPage() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) return setMsg('Passwords do not match');
    const res = await fetch('/api/account/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const json = await res.json();
    setMsg(json.message);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">⚙️ Settings</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Current Password</label>
          <input type="password" className="form-input" value={form.currentPassword} onChange={e => setForm({...form, currentPassword: e.target.value})} required />
        </div>
        <div className="form-group">
          <label className="form-label">New Password</label>
          <input type="password" className="form-input" value={form.newPassword} onChange={e => setForm({...form, newPassword: e.target.value})} required />
        </div>
        <div className="form-group">
          <label className="form-label">Confirm Password</label>
          <input type="password" className="form-input" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} required />
        </div>
        <button type="submit" className="btn btn-primary">Update Password</button>
        {msg && <p style={{marginTop: 16, color: msg.includes('success') ? 'green' : 'red'}}>{msg}</p>}
      </form>
    </div>
  );
}