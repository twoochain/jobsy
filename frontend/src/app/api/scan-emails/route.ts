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

    // Backend'e e-posta tarama isteği gönder
    const scanResponse = await fetch('http://localhost:8000/scan-emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!scanResponse.ok) {
      throw new Error('E-posta tarama hatası');
    }

    const scanData = await scanResponse.json();
    
    // E-postaları AI ile analiz et
    if (scanData.emails && scanData.emails.length > 0) {
      const analyzeResponse = await fetch('http://localhost:8000/analyze-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails: scanData.emails }),
      });

      if (analyzeResponse.ok) {
        const analyzeData = await analyzeResponse.json();
        
        // Analiz edilen başvuruları kaydet
        if (analyzeData.applications && analyzeData.applications.length > 0) {
          await fetch('http://localhost:8000/save-applications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              applications: analyzeData.applications,
              userId: userId 
            }),
          });
        }

        return NextResponse.json({
          emailCount: scanData.emailCount,
          applications: analyzeData.applications,
          message: `${scanData.emailCount} e-posta tarandı, ${analyzeData.totalFound} başvuru bulundu`
        });
      }
    }

    return NextResponse.json(scanData);

  } catch (error) {
    console.error('E-posta tarama hatası:', error);
    return NextResponse.json(
      { error: 'E-postalar taranamadı' },
      { status: 500 }
    );
  }
} 