import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import MatchCard from '../components/MatchCard';
import socketService from '../lib/socket';

export default function Home() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, live, upcoming

  // Fetch initial matches
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/matches`);
        const data = await res.json();
        setMatches(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch matches:', err);
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  // WebSocket subscription for live updates
  useEffect(() => {
    socketService.connect();

    const unsubScore = socketService.on('score:update', (data) => {
      setMatches(prev => prev.map(match => 
        match.id === data.matchId ? { ...match, ...data } : match
      ));
    });

    const unsubBall = socketService.on('ball:event', (data) => {
      setMatches(prev => prev.map(match =>
        match.id === data.matchId ? { ...match, lastBall: data.runs_scored, ballState: data.ball_state } : match
      ));
    });

    return () => {
      unsubScore();
      unsubBall();
    };
  }, []);

  const filteredMatches = matches.filter(match => {
    if (filter === 'live') return match.status === 'live';
    if (filter === 'upcoming') return match.status === 'upcoming';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-teal-600 font-medium">Loading matches...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <Header />

      {/* Filter Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex">
          {[
            { key: 'all', label: 'All' },
            { key: 'live', label: 'Live' },
            { key: 'upcoming', label: 'Upcoming' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 py-3 text-center font-medium ${
                filter === tab.key
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Match List */}
      <div className="p-4 space-y-4">
        {filteredMatches.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No matches found
          </div>
        ) : (
          filteredMatches.map(match => (
            <Link key={match.id} to={`/match/${match.id}`}>
              <MatchCard match={match} />
            </Link>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}