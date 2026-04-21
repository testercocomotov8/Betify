import { NextResponse } from 'next/server';

// Mock login history data
const mockLoginHistory = [
  { id: 1, device: 'Chrome on Windows', location: 'Mumbai, India', ip: '192.168.1.1', date: '2024-01-18 14:30:00', status: 'current' },
  { id: 2, device: 'Safari on iPhone', location: 'Delhi, India', ip: '192.168.1.2', date: '2024-01-17 09:15:00', status: 'active' },
  { id: 3, device: 'Firefox on MacOS', location: 'Bangalore, India', ip: '192.168.1.3', date: '2024-01-16 18:45:00', status: 'expired' },
  { id: 4, device: 'Chrome on Android', location: 'Chennai, India', ip: '192.168.1.4', date: '2024-01-15 11:20:00', status: 'expired' },
];

export async function GET(request) {
  return NextResponse.json({
    success: true,
    data: mockLoginHistory,
    count: mockLoginHistory.length,
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'logout_all') {
      // Logout from all devices except current
      return NextResponse.json({
        success: true,
        message: 'Logged out from all other devices successfully',
      });
    }

    if (action === 'change_password') {
      const { currentPassword, newPassword } = body;
      
      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { success: false, message: 'Current and new password are required' },
          { status: 400 }
        );
      }

      if (newPassword.length < 8) {
        return NextResponse.json(
          { success: false, message: 'Password must be at least 8 characters' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Password changed successfully',
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to process request' },
      { status: 400 }
    );
  }
}