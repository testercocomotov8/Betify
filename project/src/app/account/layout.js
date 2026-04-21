'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AccountLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { href: '/account/statement', label: '📊 Account Statement', icon: '📊' },
    { href: '/account/bets', label: '🎯 Bet History', icon: '🎯' },
    { href: '/account/unsettled', label: '⏳ Unsettled Bets', icon: '⏳' },
    { href: '/account/settings', label: '⚙️ Settings', icon: '⚙️' },
    { href: '/account/security', label: '🔐 Security', icon: '🔐' },
    { href: '/rules', label: '📋 Rules', icon: '📋' },
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <div className="account-layout">
      <div className="account-header">
        <div className="user-menu">
          <button className="user-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            👤 Account ▾
          </button>
          {menuOpen && (
            <div className="user-dropdown">
              {menuItems.map(item => (
                <Link key={item.href} href={item.href} className={`dropdown-item ${pathname === item.href ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </Link>
              ))}
              <button className="dropdown-item logout" onClick={handleLogout}>🚪 Logout</button>
            </div>
          )}
        </div>
      </div>
      <div className="account-content">{children}</div>
      <style jsx>{`
        .account-layout { min-height: 100vh; background: #f5f5f5; }
        .account-header { background: white; padding: 16px 24px; border-bottom: 1px solid #e0e0e0; }
        .user-menu { position: relative; display: inline-block; }
        .user-menu-btn { background: #1a1a2e; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; }
        .user-dropdown { position: absolute; top: 100%; left: 0; margin-top: 8px; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); min-width: 200px; overflow: hidden; z-index: 100; }
        .dropdown-item { display: block; padding: 12px 20px; color: #333; text-decoration: none; border: none; background: none; width: 100%; text-align: left; cursor: pointer; font-size: 14px; }
        .dropdown-item:hover { background: #f5f5f5; }
        .dropdown-item.active { background: #e8f5e9; color: #2e7d32; }
        .dropdown-item.logout { color: #c62828; border-top: 1px solid #e0e0e0; }
        .account-content { padding: 24px; max-width: 1200px; margin: 0 auto; }
      `}</style>
    </div>
  );
}