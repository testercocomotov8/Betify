import { NextResponse } from 'next/server';

// Mock bet history data
const mockBets = [
  { id: 1, match: 'India vs Australia', sport: 'Cricket', odds: 1.85, stake: 1000, result: 'Won', profit: 850, date: '2024-01-15' },
  { id: 2, match: 'Manchester United vs Liverpool', sport: 'Football', odds: 2.10, stake: 500, result: 'Won', profit: 550, date: '2024-01-15' },
  { id: 3, match: 'Djokovic vs Nadal', sport: 'Tennis', odds: 1.65, stake: 2000, result: 'Lost', profit: -2000, date: '2024-01-14' },
  { id: 4, match: 'CSK vs MI', sport: 'Cricket', odds: 1.90, stake: 1500, result: 'Won', profit: 1350, date: '2024-01-14' },
  { id: 5, match: 'Lakers vs Warriors', sport: 'Basketball', odds: 2.00, stake: 800, result: 'Lost', profit: -800, date: '2024-01-13' },
  { id: 6, match: 'Arsenal vs Chelsea', sport: 'Football', odds: 1.75, stake: 1200, result: 'Won', profit: 900, date: '2024-01-13' },
  { id: 7, match: 'Australia vs New Zealand', sport: 'Cricket', odds: 1.95, stake: 600, result: 'Won', profit: 570, date: '2024-01-12' },
  { id: 8, match: 'Federer vs Murray', sport: 'Tennis', odds: 1.80, stake: 1000, result: 'Lost', profit: -1000, date: '2024-01-12' },
];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get('sport');
  const match = searchParams.get('match');
  const date = searchParams.get('date');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  let filteredData = [...mockBets];

  // Apply filters
  if (sport && sport !== 'all') {
    filteredData = filteredData.filter(bet => bet.sport.toLowerCase() === sport.toLowerCase());
  }
  if (match) {
    filteredData = filteredData.filter(bet => bet.match.toLowerCase().includes(match.toLowerCase()));
  }
  if (date) {
    filteredData = filteredData.filter(bet => bet.date === date);
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return NextResponse.json({
    success: true,
    data: paginatedData,
    pagination: {
      page,
      limit,
      total: filteredData.length,
      totalPages: Math.ceil(filteredData.length / limit),
    },
  });
}