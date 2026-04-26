import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import BetSlip from '../components/BetSlip';
import OddsCell from '../components/OddsCell';
import MarketSection from '../components/MarketSection';
import LiveScorePanel from '../components/LiveScorePanel';

export default function Match() {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [activeTab, setActiveTab] = useState('odds');
  const [showBetSlip, setShowBetSlip] = useState(false);
  const [selectedBet, setSelectedBet] = useState(null);

  useEffect(() => {
    // Demo match data
    const demoMatch = {
      id: id || '1',
      team1Name: 'Mumbai Indians',
      team2Name: 'Chennai Super Kings',
      team1Score: '186/4',
      team2Score: '-',
      status: 'live',
      over: '18.2',
      runRate: '10.18',
      requiredRate: '8.50',
      target: '210',
      batsmen: [
        { name: 'Rohit Sharma', runs: 45, balls: 32, fours: 5, sixes: 2, sr: 140.6, onStrike: true },
        { name: 'Suryakumar', runs: 23, balls: 18, fours: 2, sixes: 1, sr: 127.8, onStrike: false },
      ],
      bowler: { name: 'Ravindra Jadeja', overs: '3.2', runs: 28, wickets: 1, economy: 8.4 },
      lastBall: '4',
      overBalls: ['.', '.', '4', '.', '6', '.'],
      lastCommentary: 'FOUR! Superb drive through covers!',
    };

    const demoMarkets = [
      {
        id: 'm1',
        name: 'Match Odds',
        type: 'match_odds',
        status: 'open',
        selections: [
          { id: 's1', name: 'Mumbai Indians', back: 1.95, lay: 1.98 },
          { id: 's2', name: 'Chennai Super Kings', back: 2.10, lay: 2.14 },
          { id: 's3', name: 'The Draw', back: 15.0, lay: 20.0 },
        ],
      },
      {
        id: 'm2',
        name: 'Bookmaker',
        type: 'bookmaker',
        status: 'open',
        selections: [
          { id: 's4', name: 'Mumbai Indians', back: 1.90, lay: null },
          { id: 's5', name: 'Chennai Super Kings', back: 2.05, lay: null },
        ],
      },
      {
        id: 'm3',
        name: 'First 6 Over Runs',
        type: 'fancy',
        status: 'open',
        selections: [
          { id: 's6', name: 'Over 52.5', back: 1.85, lay: 1.90 },
          { id: 's7', name: 'Under 52.5', back: 2.00, lay: 2.05 },
        ],
      },
    ];

    setMatch(demoMatch);
    setMarkets(demoMarkets);
  }, [id]);

  const handleOddsClick = (selection, marketType, betType) => {
    setSelectedBet({
      selectionId: selection.id,
      selectionName: selection.name,
      marketType,
      betType,
      odds: betType === 'back' ? selection.back : selection.lay,
    });
    setShowBetSlip(true);
  };

  const handlePlaceBet = (stake) => {
    console.log('Placing bet:', { ...selectedBet, stake });
    setShowBetSlip(false);
    setSelectedBet(null);
  };

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
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
              className={`flex-1 py-3 text-center font-medium capitalize transition-all ${
                activeTab === tab
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-500 hover:text-gray-700'
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
          onClose={() => setShowBetSlip(false)}
          onPlaceBet={handlePlaceBet}
        />
      )}

      <BottomNav />
    </div>
  );
}