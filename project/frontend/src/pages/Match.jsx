import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import BetSlip from '../components/BetSlip';
import MarketSection from '../components/MarketSection';
import LiveScorePanel from '../components/LiveScorePanel';
import socketService from '../lib/socket';

export default function Match() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [odds, setOdds] = useState(null);
  const [marketStatus, setMarketStatus] = useState({ bookmaker: 'open', session: 'open' });
  const [activeTab, setActiveTab] = useState('odds');
  const [showBetSlip, setShowBetSlip] = useState(false);
  const [selectedBet, setSelectedBet] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch initial match data
  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/match/${id}`);
        if (!res.ok) throw new Error('Match not found');
        const data = await res.json();
        setMatch(data);
        if (data.odds) setOdds(data.odds);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch match:', err);
        navigate('/');
      }
    };
    fetchMatch();
  }, [id, navigate]);

  // WebSocket subscriptions
  useEffect(() => {
    if (!id) return;

    // Connect and subscribe to match
    socketService.connect();
    socketService.subscribeMatch(id);

    // Handle score updates
    const unsubScore = socketService.on('score:update', (data) => {
      if (data.matchId === id) {
        setMatch(prev => prev ? { ...prev, ...data } : prev);
      }
    });

    // Handle ball events
    const unsubBall = socketService.on('ball:event', (data) => {
      if (data.matchId === id) {
        setMatch(prev => prev ? { ...prev, lastBall: data.runs_scored, ballState: data.ball_state } : prev);
      }
    });

    // Handle odds updates
    const unsubOdds = socketService.on('odds:update', (data) => {
      if (data.matchId === id) {
        setOdds(data.oddsData);
      }
    });

    // Handle market status changes
    const unsubMarket = socketService.on('market:status', (data) => {
      if (data.matchId === id) {
        setMarketStatus(prev => ({ ...prev, [data.marketType]: data.status }));
      }
    });

    return () => {
      unsubScore();
      unsubBall();
      unsubOdds();
      unsubMarket();
      socketService.unsubscribeMatch(id);
    };
  }, [id]);

  const handleOddsClick = useCallback((selection, marketType, betType, oddsValue) => {
    setSelectedBet({
      selectionId: selection.id || selection.name,
      selectionName: selection.name,
      marketType,
      betType,
      odds: oddsValue,
    });
    setShowBetSlip(true);
  }, []);

  const handlePlaceBet = useCallback((stake) => {
    setShowBetSlip(false);
    setSelectedBet(null);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-teal-600 font-medium">Loading match...</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Match not found</div>
      </div>
    );
  }

  // Build markets from odds data
  const markets = [];

  if (odds) {
    // Match Odds Market
    markets.push({
      id: 'match_odds',
      name: 'Match Odds',
      type: 'match_odds',
      status: 'open', // Never suspends
      selections: [
        { id: 'team1', name: match.team1 || 'Team 1', back: odds.matchOdds?.team1 || 0, lay: odds.matchOdds?.team1 ? odds.matchOdds.team1 + 0.02 : null },
        { id: 'team2', name: match.team2 || 'Team 2', back: odds.matchOdds?.team2 || 0, lay: odds.matchOdds?.team2 ? odds.matchOdds.team2 + 0.02 : null },
        { id: 'draw', name: 'The Draw', back: odds.matchOdds?.draw || 0, lay: odds.matchOdds?.draw ? odds.matchOdds.draw + 0.05 : null },
      ],
    });

    // Bookmaker Market
    if (odds.bookmakerOdds) {
      markets.push({
        id: 'bookmaker',
        name: 'Bookmaker',
        type: 'bookmaker',
        status: marketStatus.bookmaker,
        selections: [
          { id: 'back1', name: match.team1 || 'Team 1', back: odds.bookmakerOdds.back1 || 0, lay: null },
          { id: 'back2', name: match.team2 || 'Team 2', back: odds.bookmakerOdds.back2 || 0, lay: null },
        ],
      });
    }

    // Session Market
    if (odds.sessionOdds) {
      markets.push({
        id: 'session',
        name: 'Session',
        type: 'session',
        status: marketStatus.session,
        selections: [
          { id: 'over', name: `Over ${odds.sessionOdds.runLine || 50.5}`, back: odds.sessionOdds.over || 0, lay: null },
          { id: 'under', name: `Under ${odds.sessionOdds.runLine || 50.5}`, back: odds.sessionOdds.under || 0, lay: null },
        ],
      });
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-32">
      <Header />

      {/* Back Button */}
      <div className="bg-white px-4 py-2 border-b border-gray-200">
        <Link to="/" className="flex items-center gap-2 text-teal-600 font-medium">
          <span>←</span> Back to Matches
        </Link>
      </div>

      {/* Live Score Panel */}
      <LiveScorePanel match={match} />

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          {['odds', 'score', 'markets'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-center font-medium ${
                activeTab === tab
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Markets */}
      <div className="p-4 space-y-4">
        {markets.map((market) => (
          <MarketSection
            key={market.id}
            market={market}
            onOddsClick={handleOddsClick}
          />
        ))}
      </div>

      {/* Bet Slip */}
      {showBetSlip && selectedBet && (
        <BetSlip
          bet={selectedBet}
          matchId={id}
          onClose={() => setShowBetSlip(false)}
          onPlaceBet={handlePlaceBet}
        />
      )}

      <BottomNav />
    </div>
  );
}