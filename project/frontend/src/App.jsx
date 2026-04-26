import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Match from './pages/Match';
import Login from './pages/Login';
import Register from './pages/Register';
import Wallet from './pages/Wallet';
import MyBets from './pages/MyBets';
import Admin from './pages/Admin';
import { useUserStore } from './store/userStore';
import { useEffect } from 'react';
import { supabase } from './lib/supabase';
import { socket, initSocket } from './lib/socket';

function AppContent() {
  const { userId, setUser, subscribeWallet } = useUserStore();

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', session.user.id)
          .single();
        if (user) {
          setUser(user);
          initSocket(session.access_token);
          subscribeWallet(user.id);
        }
      }
    };
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', session.user.id)
          .single();
        if (user) {
          setUser(user);
          initSocket(session.access_token);
          subscribeWallet(user.id);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <Header />
      <main className="pt-14">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/match/:matchId" element={<Match />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/my-bets" element={<MyBets />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;