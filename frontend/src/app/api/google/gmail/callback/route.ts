import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // user_id
    const error = searchParams.get('error');

    if (error) {
      // Hata durumunda popup'ı kapat ve hata mesajı gönder
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Gmail Bağlantı Hatası</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            .error { color: #d32f2f; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>Gmail Bağlantı Hatası</h2>
            <p>Gmail hesabınıza bağlanırken bir hata oluştu.</p>
          </div>
          <script>
            // Parent window'a hata mesajı gönder ve popup'ı kapat
            if (window.opener) {
              window.opener.postMessage({ type: 'GMAIL_AUTH_ERROR', error: '${error}' }, '*');
            }
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
        </html>
      `;
      return new NextResponse(errorHtml, { headers: { 'Content-Type': 'text/html' } });
    }

    if (!code || !state) {
      // Eksik parametre durumunda popup'ı kapat ve hata mesajı gönder
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Gmail Bağlantı Hatası</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            .error { color: #d32f2f; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>Gmail Bağlantı Hatası</h2>
            <p>Gerekli parametreler eksik.</p>
          </div>
          <script>
            // Parent window'a hata mesajı gönder ve popup'ı kapat
            if (window.opener) {
              window.opener.postMessage({ type: 'GMAIL_AUTH_ERROR', error: 'missing_params' }, '*');
            }
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
        </html>
      `;
      return new NextResponse(errorHtml, { headers: { 'Content-Type': 'text/html' } });
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
      // Backend hatası durumunda popup'ı kapat ve hata mesajı gönder
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Gmail Bağlantı Hatası</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            .error { color: #d32f2f; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>Gmail Bağlantı Hatası</h2>
            <p>Backend bağlantı hatası oluştu.</p>
          </div>
          <script>
            // Parent window'a hata mesajı gönder ve popup'ı kapat
            if (window.opener) {
              window.opener.postMessage({ type: 'GMAIL_AUTH_ERROR', error: 'backend_error' }, '*');
            }
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
        </html>
      `;
      return new NextResponse(errorHtml, { headers: { 'Content-Type': 'text/html' } });
    }

    // Başarılı bağlantı sonrası popup'ı kapat ve başarı mesajı gönder
    const successHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Gmail Bağlantısı Başarılı</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
          .success { color: #2e7d32; }
          .spinner { 
            border: 4px solid #f3f3f3; 
            border-top: 4px solid #3498db; 
            border-radius: 50%; 
            width: 40px; 
            height: 40px; 
            animation: spin 1s linear infinite; 
            margin: 20px auto; 
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="success">
          <h2>Gmail Bağlantısı Başarılı!</h2>
          <p>Gmail hesabınız başarıyla bağlandı.</p>
          <div class="spinner"></div>
          <p>Popup kapatılıyor...</p>
        </div>
        <script>
          // Parent window'a başarı mesajı gönder ve popup'ı kapat
          if (window.opener) {
            window.opener.postMessage({ type: 'GMAIL_AUTH_SUCCESS', userId: '${state}' }, '*');
          }
          setTimeout(() => window.close(), 2000);
        </script>
      </body>
      </html>
    `;
    
    return new NextResponse(successHtml, { headers: { 'Content-Type': 'text/html' } });

  } catch (error) {
    console.error('Gmail callback hatası:', error);
    // Genel hata durumunda popup'ı kapat ve hata mesajı gönder
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Gmail Bağlantı Hatası</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
          .error { color: #d32f2f; }
        </style>
      </head>
      <body>
        <div class="error">
          <h2>Gmail Bağlantı Hatası</h2>
          <p>Beklenmeyen bir hata oluştu.</p>
        </div>
        <script>
          // Parent window'a hata mesajı gönder ve popup'ı kapat
          if (window.opener) {
            window.opener.postMessage({ type: 'GMAIL_AUTH_ERROR', error: 'unexpected_error' }, '*');
          }
          setTimeout(() => window.close(), 2000);
        </script>
      </body>
      </html>
    `;
    return new NextResponse(errorHtml, { headers: { 'Content-Type': 'text/html' } });
  }
} 