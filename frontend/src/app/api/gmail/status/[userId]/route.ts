import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID gerekli' },
        { status: 400 }
      );
    }

    // Backend'den Gmail bağlantı durumunu kontrol et
    const backendResponse = await fetch(`http://localhost:8000/gmail/status/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      return NextResponse.json({ connected: false });
    }

    const data = await backendResponse.json();
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('Gmail durum kontrolü hatası:', error);
    return NextResponse.json(
      { connected: false },
      { status: 500 }
    );
  }
} 