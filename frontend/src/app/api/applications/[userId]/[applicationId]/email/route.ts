import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; applicationId: string }> }
) {
  try {
    const { userId, applicationId } = await params;

    if (!userId || !applicationId) {
      return NextResponse.json(
        { error: 'User ID ve Application ID gerekli' },
        { status: 400 }
      );
    }

    // Backend'ten email içeriğini getir
    const backendResponse = await fetch(
      `http://localhost:8000/applications/${userId}/${applicationId}/email`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!backendResponse.ok) {
      throw new Error('Email içeriği getirilemedi');
    }

    const data = await backendResponse.json();
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('Email getirme hatası:', error);
    return NextResponse.json(
      { error: 'Email içeriği alınamadı' },
      { status: 500 }
    );
  }
}
