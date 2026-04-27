import React from 'react';

export default function SuspendedOverlay({ message = 'Betting Suspended' }) {
  return (
    <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-10">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-red-600 font-semibold text-sm">{message}</p>
        <p className="text-gray-500 text-xs mt-1">Wait for the ball to be dead</p>
      </div>
    </div>
  );
}