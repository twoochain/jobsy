import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID gerekli' },
        { status: 400 }
      );
    }

    // Backend'e Gmail bağlantısını kesme isteği gönder
    const backendResponse = await fetch('http://localhost:8000/disconnect-gmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!backendResponse.ok) {
      throw new Error('Backend bağlantı hatası');
    }

    const data = await backendResponse.json();
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('Gmail bağlantısı kesme hatası:', error);
    return NextResponse.json(
      { error: 'Gmail bağlantısı kesilemedi' },
      { status: 500 }
    );
  }
} 