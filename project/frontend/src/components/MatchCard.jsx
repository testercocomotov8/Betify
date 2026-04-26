import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function MatchCard({ match, onClick }) {
  const isLive = match.status === 'live' || match.status === 'innings_break';
  
  return (
    <motion.div
      whileHover={{ y: -2, shadow: '0 8px 25px rgba(0,0,0,0.15)' }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          )}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            isLive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
          }`}>
            {isLive ? 'LIVE' : match.startTime}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <span className="text-xs">📺</span>
          <span className="text-xs">f</span>
          <span className="text-xs">BM</span>
        </div>
      </div>
      
      {/* Teams & Score */}
      <div className="p-4">
        <div className="space-y-3">
          {/* Team 1 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                {match.team1Name?.[0] || 'T'}
              </div>
              <span className="font-semibold text-gray-800">{match.team1Name}</span>
            </div>
            <span className={`font-bold text-lg ${isLive ? 'text-red-600' : 'text-gray-700'}`}>
              {match.team1Score || '-'}
            </span>
          </div>
          
          {/* Team 2 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                {match.team2Name?.[0] || 'T'}
              </div>
              <span className="font-semibold text-gray-800">{match.team2Name}</span>
            </div>
            <span className={`font-bold text-lg ${isLive ? 'text-red-600' : 'text-gray-700'}`}>
              {match.team2Score || '-'}
            </span>
          </div>
        </div>
        
        {/* Market Preview */}
        {match.markets && match.markets.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex gap-2">
              {match.markets.slice(0, 3).map((market, idx) => (
                <div key={idx} className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-500 mb-1">{market.name}</div>
                  <div className="flex justify-center gap-1">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {market.back1}
                    </span>
                    <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded">
                      {market.lay1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}