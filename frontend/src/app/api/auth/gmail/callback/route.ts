import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // user_id
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL('/dashboard?error=gmail_auth_failed', request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard?error=missing_params', request.url)
      );
    }

    // Backend'e callback bilgilerini gönder
    const backendResponse = await fetch('http://localhost:8000/gmail/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, state }),
    });

    if (!backendResponse.ok) {
      throw new Error('Backend callback hatası');
    }

    // Başarılı bağlantı sonrası dashboard'a yönlendir
    return NextResponse.redirect(
      new URL('/dashboard?success=gmail_connected', request.url)
    );

  } catch (error) {
    console.error('Gmail callback hatası:', error);
    return NextResponse.redirect(
      new URL('/dashboard?error=gmail_callback_failed', request.url)
    );
  }
} 