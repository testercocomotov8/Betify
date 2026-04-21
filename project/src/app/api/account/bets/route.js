import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get('sport') || 'all';
  const date = searchParams.get('date') || '';
  
  const data = [
    { id: 1, match: 'India vs Australia', odds: 1.85, stake: 1000, result: 'Win', profit: 850 },
    { id: 2, match: 'England vs Pakistan', odds: 2.10, stake: 500, result: 'Loss', profit: -500 },
    { id: 3, match: 'Spain vs Italy', odds: 1.65, stake: 2000, result: 'Win', profit: 1300 },
  ];
  
  return NextResponse.json({ data });
}