import { NextResponse } from 'next/server';

export async function GET() {
  const data = [
    { id: 1, match: 'India vs Australia', selection: 'India Win', stake: 1500, odds: 1.75, status: 'Pending' },
    { id: 2, match: 'England vs Pakistan', selection: 'Over 150', stake: 800, odds: 1.90, status: 'Pending' },
  ];
  return NextResponse.json({ data });
}