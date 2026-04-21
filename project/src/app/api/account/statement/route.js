import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const type = searchParams.get('type') || 'all';
  
  // Mock data - replace with actual DB query
  const data = [
    { id: 1, date: '2026-04-21', credit: 5000, debit: 0, balance: 15000, sport: 'Cricket', remark: 'Deposit' },
    { id: 2, date: '2026-04-20', credit: 0, debit: 2000, balance: 10000, sport: 'Football', remark: 'Bet Loss' },
    { id: 3, date: '2026-04-19', credit: 3500, debit: 0, balance: 12000, sport: 'Tennis', remark: 'Bet Win' },
  ];
  
  return NextResponse.json({ data, total: data.length });
}