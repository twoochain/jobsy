import { NextRequest, NextResponse } from 'next/server';
import { getServerConfig } from '@/utils/api';

export async function GET(request: NextRequest) {
  try {
    // Server-side environment variables
    const config = getServerConfig();
    
    // Check if required environment variables are set
    if (!config.apiSecretKey) {
      return NextResponse.json(
        { error: 'API secret key not configured' },
        { status: 500 }
      );
    }

    // Example API call using environment variables
    const response = await fetch('https://api.external-service.com/data', {
      headers: {
        'Authorization': `Bearer ${config.apiSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data,
      message: 'API call successful using environment variables'
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const config = getServerConfig();

    // Example of using database URL from environment variables
    if (config.databaseUrl) {
      // Database operations would go here
      console.log('Database URL configured:', config.databaseUrl);
    }

    return NextResponse.json({
      success: true,
      message: 'Data processed successfully',
      receivedData: body
    });

  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    );
  }
} 