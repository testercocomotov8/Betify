import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function OddsCell({ odds, type, onClick, prevOdds }) {
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    if (prevOdds && prevOdds !== odds) {
      const direction = odds > prevOdds ? 'up' : 'down';
      setFlash(direction);
      const timer = setTimeout(() => setFlash(null), 800);
      return () => clearTimeout(timer);
    }
  }, [odds, prevOdds]);

  const isBack = type === 'back';
  const bgClass = isBack ? 'bg-blue-50 hover:bg-blue-100' : 'bg-pink-50 hover:bg-pink-100';
  const textClass = isBack ? 'text-blue-700' : 'text-pink-700';
  const flashBg = flash === 'up' ? 'bg-green-400/40' : flash === 'down' ? 'bg-red-400/40' : '';

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={`
        relative w-full py-3 px-2 rounded-xl font-bold text-lg
        transition-all duration-200 cursor-pointer
        ${bgClass} ${textClass}
        ${flashBg}
      `}
    >
      <span className="text-xl">{odds.toFixed(2)}</span>
      {flash && (
        <motion.span
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className={`absolute inset-0 rounded-xl ${flash === 'up' ? 'bg-green-400/30' : 'bg-red-400/30'}`}
        />
      )}
    </motion.button>
  );
}