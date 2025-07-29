# Environment Variables Setup Guide

## Gmail API Entegrasyonu için Gerekli Environment Variables

### 1. Google Cloud Console Ayarları

1. **Google Cloud Console'a gidin**: https://console.cloud.google.com/
2. **Yeni proje oluşturun** veya mevcut projeyi seçin
3. **Gmail API'yi etkinleştirin**:
   - "APIs & Services" > "Library"
   - "Gmail API" arayın ve etkinleştirin
4. **OAuth2 credentials oluşturun**:
   - "APIs & Services" > "Credentials"
   - "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Authorized redirect URIs: `http://localhost:3000/api/auth/gmail/callback`

### 2. .env Dosyası İçeriği

```env
# AI APIs
HF_TOKEN=your_huggingface_token_here
GEMINI_API_KEY=your_gemini_api_key_here
MODEL_ID=your_model_id_here

# Google OAuth2 (Gmail için)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth (Frontend için)
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret_here
```

### 3. Google Client ID ve Secret Nasıl Alınır

1. Google Cloud Console'da projenizi seçin
2. "APIs & Services" > "Credentials" bölümüne gidin
3. OAuth 2.0 Client ID'nizi seçin
4. "Client ID" ve "Client Secret" değerlerini kopyalayın
5. Bu değerleri .env dosyasına ekleyin

### 4. Test Etme

1. Backend'i başlatın: `python start_server.py`
2. Frontend'i başlatın: `npm run dev`
3. http://localhost:3000 adresine gidin
4. Giriş yapın
5. Dashboard'da "Gmail Hesabını Bağla" butonuna tıklayın

### 5. Hata Ayıklama

Eğer hata alırsanız:
- Browser console'u kontrol edin (F12)
- Backend terminal'ini kontrol edin
- Network tab'ında API çağrılarını kontrol edin 