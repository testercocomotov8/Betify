import React from 'react';
import SuspendedOverlay from './SuspendedOverlay';

export default function MarketSection({ 
  title, 
  marketType, 
  isSuspended, 
  children, 
  showSuspendedOverlay = true 
}) {
  // Match odds market NEVER suspends
  const shouldShowOverlay = showSuspendedOverlay && isSuspended && marketType !== 'match_odds';

  return (
    <div className="bg-white rounded-lg shadow relative">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {marketType === 'match_odds' && (
          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
            Always Open
          </span>
        )}
        {marketType !== 'match_odds' && !isSuspended && (
          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
            Open
          </span>
        )}
        {marketType !== 'match_odds' && isSuspended && (
          <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
            Suspended
          </span>
        )}
      </div>
      <div className="p-4">
        {children}
      </div>
      {shouldShowOverlay && <SuspendedOverlay />}
    </div>
  );
}