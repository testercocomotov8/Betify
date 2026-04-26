import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', icon: '🏠', label: 'Home' },
  { path: '/sports/cricket', icon: '🏏', label: 'Cricket' },
  { path: '/sports/football', icon: '⚽', label: 'Football' },
  { path: '/sports/tennis', icon: '🎾', label: 'Tennis' },
  { path: '/my-bets', icon: '📋', label: 'My Bets' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center px-3 py-1 rounded-lg transition-all ${
                isActive ? 'text-teal-600 bg-teal-50' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-0.5 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}