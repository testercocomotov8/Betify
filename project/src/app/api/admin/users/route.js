import { NextResponse } from 'next/server';

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  
  if (authHeader !== 'Bearer sgyt-admin-token') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Mock users data - in production, fetch from database
  const users = [
    { id: 1, username: 'user1', email: 'user1@example.com', active: true, balance: 1000.00 },
    { id: 2, username: 'user2', email: 'user2@example.com', active: true, balance: 2500.00 },
    { id: 3, username: 'user3', email: 'user3@example.com', active: false, balance: 500.00 },
  ];

  return NextResponse.json({ users });
}