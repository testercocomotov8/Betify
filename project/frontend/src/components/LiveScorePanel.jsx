import React, { useEffect, useState } from 'react';
import { useSocket } from '../lib/socket';

export default function LiveScorePanel({ matchId }) {
  const socket = useSocket();
  const [score, setScore] = useState(null);
  const [ballEvents, setBallEvents] = useState([]);

  useEffect(() => {
    if (!socket || !matchId) return;

    const handleScoreUpdate = (data) => {
      if (data.match_id === matchId) {
        setScore(data);
      }
    };

    const handleBallEvent = (data) => {
      if (data.match_id === matchId) {
        setBallEvents(prev => [...prev.slice(-19), data]);
      }
    };

    socket.on('score:update', handleScoreUpdate);
    socket.on('ball:event', handleBallEvent);

    return () => {
      socket.off('score:update', handleScoreUpdate);
      socket.off('ball:event', handleBallEvent);
    };
  }, [socket, matchId]);

  if (!score) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="font-bold text-lg">{score.runs}/{score.wickets}</h3>
          <p className="text-sm text-gray-600">Overs: {score.overs}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Innings {score.innings}</p>
        </div>
      </div>
      
      {score.current_batsmen && score.current_batsmen.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Batsmen</p>
          <div className="flex gap-2">
            {score.current_batsmen.map((batsman, i) => (
              <span key={i} className="text-xs bg-blue-50 px-2 py-1 rounded">
                {batsman.name}: {batsman.runs}
              </span>
            ))}
          </div>
        </div>
      )}

      {score.current_bowler && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Bowler</p>
          <span className="text-xs bg-green-50 px-2 py-1 rounded">
            {score.current_bowler.name}: {score.current_bowler.overs}-{score.current_bowler.runs}-{score.current_bowler.wickets}
          </span>
        </div>
      )}

      {ballEvents.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-gray-500 mb-2">Recent Balls</p>
          <div className="flex flex-wrap gap-1">
            {ballEvents.slice(-10).map((ball, i) => (
              <span 
                key={i} 
                className={`text-xs px-2 py-1 rounded ${
                  ball.is_wicket ? 'bg-red-100 text-red-700' : 
                  ball.runs_scored > 4 ? 'bg-green-100 text-green-700' : 
                  'bg-gray-100 text-gray-700'
                }`}
              >
                {ball.runs_scored}{ball.is_wide || ball.is_no_ball ? 'wd' : ''}{ball.is_wicket ? 'W' : ''}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}