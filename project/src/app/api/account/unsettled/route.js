import { NextResponse } from 'next/server';

// Mock unsettled bets data
const mockUnsettledBets = [
  { id: 1, match: 'RCB vs KKR', sport: 'Cricket', selection: 'RCB to Win', odds: 1.75, stake: 500, status: 'Active', startTime: '2024-01-18 19:30:00' },
  { id: 2, match: 'Real Madrid vs Barcelona', sport: 'Football', selection: 'Over 2.5 Goals', odds: 1.95, stake: 1000, status: 'Active', startTime: '2024-01-18 20:00:00' },
  { id: 3, match: 'Serena vs Osaka', sport: 'Tennis', selection: 'Serena to Win', odds: 1.60, stake: 750, status: 'Active', startTime: '2024-01-18 21:00:00' },
  { id: 4, match: 'Heat vs Celtics', sport: 'Basketball', selection: 'Heat +5.5', odds: 1.88, stake: 600, status: 'Active', startTime: '2024-01-18 22:30:00' },
];

export async function GET(request) {
  return NextResponse.json({
    success: true,
    data: mockUnsettledBets,
    count: mockUnsettledBets.length,
  });
}