import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID gerekli' },
        { status: 400 }
      );
    }

    // Backend'den kullanıcının başvurularını getir
    const backendResponse = await fetch(`http://localhost:8000/applications/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: 'Başvurular getirilemedi' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    console.log('Backend\'den gelen veri:', data);

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Başvuru getirme hatası:', error);
    return NextResponse.json(
      { error: 'Başvurular getirilemedi' },
      { status: 500 }
    );
  }
} 