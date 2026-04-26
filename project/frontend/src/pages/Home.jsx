import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import MatchCard from '../components/MatchCard';

const SPORTS = [
  { id: 'cricket', name: 'Cricket', icon: '🏏' },
  { id: 'football', name: 'Football', icon: '⚽' },
  { id: 'tennis', name: 'Tennis', icon: '🎾' },
];

const FILTERS = ['All', 'Live', 'Upcoming'];

export default function Home() {
  const [activeSport, setActiveSport] = useState('cricket');
  const [activeFilter, setActiveFilter] = useState('All');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Demo matches for cricket
    const demoMatches = [
      {
        id: '1',
        team1Name: 'Mumbai Indians',
        team2Name: 'Chennai Super Kings',
        team1Score: '186/4 (18.2)',
        team2Score: '-',
        status: 'live',
        startTime: 'LIVE',
        markets: [
          { name: 'Match Odds', back1: '1.95', lay1: '1.98' },
          { name: 'Bookmaker', back1: '1.90', lay1: '-' },
        ],
      },
      {
        id: '2',
        team1Name: 'Royal Challengers Bangalore',
        team2Name: 'Kolkata Knight Riders',
        team1Score: '0/0 (0.0)',
        team2Score: '-',
        status: 'upcoming',
        startTime: '7:30 PM',
        markets: [
          { name: 'Match Odds', back1: '2.10', lay1: '2.14' },
        ],
      },
      {
        id: '3',
        team1Name: 'Delhi Capitals',
        team2Name: 'Punjab Kings',
        team1Score: '145/3 (15.0)',
        team2Score: '-',
        status: 'live',
        startTime: 'LIVE',
        markets: [
          { name: 'Match Odds', back1: '1.65', lay1: '1.68' },
        ],
      },
    ];
    setMatches(demoMatches);
    setLoading(false);
  }, []);

  const filteredMatches = matches.filter((m) => {
    if (activeFilter === 'Live') return m.status === 'live';
    if (activeFilter === 'Upcoming') return m.status === 'upcoming';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <Header />
      
      {/* Sport Tabs */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto scrollbar-hide px-4 py-3 gap-3">
          {SPORTS.map((sport) => (
            <button
              key={sport.id}
              onClick={() => setActiveSport(sport.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                activeSport === sport.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{sport.icon}</span>
              <span className="font-medium">{sport.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Pills */}
      <div className="bg-white px-4 py-2">
        <div className="flex gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeFilter === filter
                  ? 'bg-teal-100 text-teal-700 border border-teal-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Match List */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p className="text-lg">No matches found</p>
            <p className="text-sm mt-1">Check back later for upcoming matches</p>
          </div>
        ) : (
          filteredMatches.map((match) => (
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