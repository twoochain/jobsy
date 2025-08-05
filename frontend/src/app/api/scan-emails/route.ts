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

    console.log('E-posta tarama başlatılıyor...', userId);

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
    console.log('E-posta tarama sonucu:', scanData);
    
    // E-postaları AI ile analiz et
    if (scanData.emails && scanData.emails.length > 0) {
      console.log('Analiz edilecek e-posta sayısı:', scanData.emails.length);
      
      const analyzeResponse = await fetch('http://localhost:8000/analyze-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails: scanData.emails }),
      });

      if (analyzeResponse.ok) {
        const analyzeData = await analyzeResponse.json();
        console.log('AI analiz sonucu:', analyzeData);
        
        // Analiz edilen başvuruları kaydet
        if (analyzeData.applications && analyzeData.applications.length > 0) {
          console.log('Kaydedilecek başvuru sayısı:', analyzeData.applications.length);
          console.log('Kaydedilecek başvurular:', analyzeData.applications);
          
          const saveResponse = await fetch('http://localhost:8000/save-applications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              applications: analyzeData.applications,
              userId: userId 
            }),
          });
          
          if (saveResponse.ok) {
            const saveData = await saveResponse.json();
            console.log('Kaydetme sonucu:', saveData);
            
            return NextResponse.json({
              success: true,
              emailCount: scanData.emailCount,
              applications: analyzeData.applications,
              savedCount: saveData.saved_count,
              totalApplications: saveData.total_applications,
              message: `${scanData.emailCount} e-posta tarandı, ${analyzeData.totalFound} başvuru bulundu, ${saveData.saved_count} yeni başvuru kaydedildi`
            });
          } else {
            console.error('Kaydetme hatası:', saveResponse.status);
            return NextResponse.json({
              success: false,
              error: 'Başvurular kaydedilemedi',
              emailCount: scanData.emailCount,
              applications: analyzeData.applications
            });
          }
        } else {
          console.log('Analiz edilen başvuru bulunamadı');
          return NextResponse.json({
            success: true,
            emailCount: scanData.emailCount,
            applications: [],
            message: `${scanData.emailCount} e-posta tarandı, başvuru bulunamadı`
          });
        }
      } else {
        console.error('AI analiz hatası:', analyzeResponse.status);
        return NextResponse.json({
          success: false,
          error: 'E-posta analizi başarısız',
          emailCount: scanData.emailCount
        });
      }
    } else {
      console.log('Taranacak e-posta bulunamadı');
      return NextResponse.json({
        success: true,
        emailCount: 0,
        applications: [],
        message: 'Taranacak e-posta bulunamadı'
      });
    }

  } catch (error) {
    console.error('E-posta tarama hatası:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'E-postalar taranamadı',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
} 