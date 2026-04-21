import { NextResponse } from 'next/server';

export async function GET(request) {
  // Mock user settings
  const settings = {
    username: 'john_doe',
    email: 'john@example.com',
    phone: '+91 9876543210',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    notifications: {
      email: true,
      sms: true,
      push: false,
    },
    betPreferences: {
      defaultStake: 500,
      maxStake: 10000,
      autoAcceptOdds: true,
    },
  };

  return NextResponse.json({ success: true, data: settings });
}

export async function PUT(request) {
  try {
    const body = await request.json();
    
    // Validate and update settings
    const updatedSettings = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedSettings,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to update settings' },
      { status: 400 }
    );
  }
}