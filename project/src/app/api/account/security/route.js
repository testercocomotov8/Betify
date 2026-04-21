import { NextResponse } from 'next/server';

export async function GET() {
  const sessions = [
    { device: 'Chrome on Windows', ip: '192.168.1.1', date: new Date().toISOString() },
    { device: 'Safari on iPhone', ip: '192.168.1.2', date: new Date(Date.now() - 86400000).toISOString() },
  ];
  return NextResponse.json({ sessions });
}

export async function POST() {
  // Logout all devices logic
  return NextResponse.json({ message: 'All devices logged out' });
}