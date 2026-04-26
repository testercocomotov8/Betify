import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STAKE_CHIPS = [100, 500, 1000, 5000, 10000];

export default function BetSlip({ bet, onClose, onPlaceBet }) {
  const [stake, setStake] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stakeNum = parseFloat(stake) || 0;
  const profit = bet.betType === 'back' 
    ? (stakeNum * (bet.odds - 1)).toFixed(2)
    : stakeNum;
  const liability = bet.betType === 'back' ? stakeNum : (stakeNum * (bet.odds - 1)).toFixed(2);

  const handlePlaceBet = async () => {
    if (!stakeNum || stakeNum < 100) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    onPlaceBet(stakeNum);
    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 max-h-[85vh] overflow-auto"
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-4 pb-3 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-gray-900">Bet Slip</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
        </div>

        {/* Selection Info */}
        <div className="p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-gray-900">{bet.selectionName}</p>
              <p className="text-sm text-gray-500 capitalize">{bet.marketType.replace('_', ' ')}</p>
            </div>
            <div className={`px-3 py-1 rounded-full font-bold ${
              bet.betType === 'back' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-pink-100 text-pink-700'
            }`}>
              {bet.betType.toUpperCase()}
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">{bet.odds}</span>
            <span className="text-gray-500">odds</span>
          </div>
        </div>

        {/* Stake Input */}
        <div className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Stake Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
            <input
              type="number"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              placeholder="Enter amount"
              className="w-full pl-8 pr-4 py-3 text-xl font-semibold border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none"
              autoFocus
            />
          </div>

          {/* Quick Stake Chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {STAKE_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => setStake(chip.toString())}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                ₹{chip >= 1000 ? `${chip/1000}k` : chip}
              </button>
            ))}
          </div>
        </div>

        {/* Profit/Liability Preview */}
        <div className="px-4 pb-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Stake</span>
              <span className="font-medium">₹{stakeNum.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{bet.betType === 'back' ? 'Profit' : 'Liability'}</span>
              <span className={`font-medium ${bet.betType === 'back' ? 'text-green-600' : 'text-red-600'}`}>
                ₹{bet.betType === 'back' ? profit : liability}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between">
              <span className="text-gray-600">Total {bet.betType === 'back' ? 'Payout' : 'at Risk'}</span>
              <span className="font-bold text-lg">
                ₹{bet.betType === 'back' 
                  ? (stakeNum + parseFloat(profit)).toLocaleString()
                  : parseFloat(liability).toLocaleString()
                }
              </span>
            </div>
          </div>
        </div>

        {/* Place Bet Button */}
        <div className="p-4 bg-white border-t border-gray-200">
          <button
            onClick={handlePlaceBet}
            disabled={!stakeNum || stakeNum < 100 || isSubmitting}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              stakeNum >= 100
                ? 'bg-teal-600 hover:bg-teal-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Processing...' : `Place ${bet.betType.toUpperCase()} Bet`}
          </button>
          <p className="text-center text-xs text-gray-500 mt-2">Min: ₹100 | Max: ₹1,00,000</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}