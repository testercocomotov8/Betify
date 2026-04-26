import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { supabase } from '../lib/supabase';

export default function Header() {
  const { userId, username, balance, exposure, available, role } = useUserStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a2e] text-white">
      {/* Main header bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center font-bold text-lg">
            B
          </div>
          <span className="font-bold text-lg">Betify</span>
        </Link>

        {userId ? (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-gray-400">Balance</div>
              <div className="font-semibold text-teal-400">₹{available?.toFixed(2) || '0.00'}</div>
            </div>
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center">
                  {username?.[0]?.toUpperCase() || 'U'}
                </div>
              </label>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-[#1a1a2e] rounded-xl w-52 mt-2 border border-gray-700">
                <li className="px-3 py-2 text-sm text-gray-400">
                  @{username}
                </li>
                <li><Link to="/wallet" className="text-gray-300 hover:text-teal-400">Wallet</Link></li>
                <li><Link to="/my-bets" className="text-gray-300 hover:text-teal-400">My Bets</Link></li>
                {role === 'admin' && (
                  <li><Link to="/admin" className="text-gray-300 hover:text-teal-400">Admin</Link></li>
                )}
                <li><button onClick={handleLogout} className="text-red-400">Logout</button></li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn btn-ghost btn-sm text-gray-300">Login</Link>
            <Link to="/register" className="btn btn-teal btn-sm bg-teal-500 text-white hover:bg-teal-600">Register</Link>
          </div>
        )}
      </div>

      {/* Deposit/Withdraw buttons */}
      {userId && (
        <div className="flex gap-2 px-4 pb-3">
          <Link 
            to="/wallet?action=deposit" 
            className="flex-1 btn bg-green-600 hover:bg-green-700 text-white border-none rounded-lg text-sm font-medium"
          >
            + Deposit
          </Link>
          <Link 
            to="/wallet?action=withdraw" 
            className="flex-1 btn bg-red-600 hover:bg-red-700 text-white border-none rounded-lg text-sm font-medium"
          >
            - Withdraw
          </Link>
        </div>
      )}

      {/* Marquee announcements */}
      <div className="bg-teal-900/50 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap py-1.5 px-4 text-sm text-teal-200">
          🏏 Welcome to Betify - Live Cricket Betting &nbsp;&nbsp;|&nbsp;&nbsp; 
          IPL 2024 Live Now &nbsp;&nbsp;|&nbsp;&nbsp; 
          New Users Get ₹1000 Bonus &nbsp;&nbsp;|&nbsp;&nbsp;
          24/7 Customer Support
        </div>
      </div>
    </header>
  );
}