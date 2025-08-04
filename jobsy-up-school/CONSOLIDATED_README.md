# Jobsy Up School - Konsolide Edilmiş Proje

Bu proje, gereksiz dosya tekrarlarını ortadan kaldırarak minimum sayıda dosyada kod yazacak şekilde yeniden düzenlenmiştir.

## 🧹 Yapılan Temizlik İşlemleri

### Kaldırılan Gereksiz Dosyalar:
- **Server Dosyaları**: `server.js`, `huggingface_server.py`, `start_server.py`
- **API Utilities**: `backend-api.ts` (api.ts ile birleştirildi)
- **Component Dosyaları**: `BackendTest.tsx`, `GmailDebug.tsx`, `EmailIntegration.tsx`
- **Package Dosyaları**: Gereksiz `package.json` ve `package-lock.json` dosyaları

### Yeni Konsolide Dosyalar:
- **`main.py`**: Tüm server fonksiyonlarını içeren tek FastAPI server
- **`frontend/src/utils/api.ts`**: Backend ve frontend API çağrılarını birleştiren utility
- **`frontend/src/components/ConsolidatedDebug.tsx`**: Tüm test ve debug fonksiyonlarını içeren component
- **`consolidated_package.json`**: Tüm gerekli bağımlılıkları içeren package.json

## 🚀 Kurulum ve Çalıştırma

### 1. Gereksiz Dosyaları Temizle
```bash
python cleanup_redundant_files.py
```

### 2. Bağımlılıkları Yükle
```bash
# Backend bağımlılıkları
pip install -r requirements.txt

# Frontend bağımlılıkları
cd frontend
npm install
```

### 3. Environment Variables Ayarla
`.env` dosyası oluşturun:
```env
# Backend
HF_TOKEN=your_huggingface_token
GEMINI_API_KEY=your_gemini_api_key
MODEL_ID=your_model_id
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Frontend
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 4. Uygulamayı Çalıştır
```bash
# Backend'i başlat (Terminal 1)
python main.py

# Frontend'i başlat (Terminal 2)
cd frontend
npm run dev
```

## 📁 Yeni Proje Yapısı

```
jobsy-up-school/
├── main.py                        # Ana FastAPI server
├── consolidated_package.json       # Konsolide package.json
├── cleanup_redundant_files.py      # Temizlik scripti
├── requirements.txt                # Python bağımlılıkları
├── features/                       # Özellik modülleri
│   ├── gmail_integration.py
│   └── email_analyzer.py
└── frontend/
    ├── package.json               # Frontend package.json
    └── src/
        ├── utils/
        │   └── api.ts             # Konsolide API utilities
        └── components/
            └── ConsolidatedDebug.tsx  # Konsolide debug component
```

## 🔧 API Endpoints

### Backend (FastAPI - Port 8000)
- `GET /` - Backend durumu
- `POST /ai/prompt` - AI prompt gönderimi
- `POST /summarize` - Metin özetleme
- `POST /gemini-analyze` - E-posta analizi
- `GET /search-models` - Model arama
- `GET /model-details/{model_id}` - Model detayları
- `POST /hf-inference` - Hugging Face inference
- `POST /gemini-inference` - Gemini inference

### Frontend (Next.js - Port 3000)
- `POST /api/connect-gmail` - Gmail bağlantısı
- `POST /api/disconnect-gmail` - Gmail bağlantısını kes
- `POST /api/scan-emails` - E-postaları tara

## 🧪 Test ve Debug

`ConsolidatedDebug.tsx` component'i tüm test ve debug fonksiyonlarını içerir:

- **Backend Durumu**: Backend bağlantısını test eder
- **AI Testleri**: AI prompt ve metin analizi testleri
- **Gmail Entegrasyonu**: Gmail bağlantı ve e-posta tarama
- **Debug Araçları**: Environment variables kontrolü ve debug log

## 📊 Faydalar

### Önceki Durum:
- 4 farklı server dosyası
- 2 ayrı API utility dosyası
- 3 benzer debug component'i
- 3 farklı package.json dosyası
- Toplam ~15 gereksiz dosya

### Yeni Durum:
- 1 ana server dosyası (`main.py`)
- 1 konsolide API utility
- 1 konsolide debug component
- 1 ana package.json + 1 frontend package.json
- %70 daha az dosya

## 🔄 Güncelleme Süreci

1. **Gereksiz dosyaları kaldır**: `cleanup_redundant_files.py` çalıştır
2. **Yeni dosyaları kullan**: Konsolide dosyaları kullanmaya başla
3. **Import'ları güncelle**: Eski import'ları yeni dosya yollarıyla değiştir
4. **Test et**: `ConsolidatedDebug.tsx` ile tüm fonksiyonları test et

## ⚠️ Önemli Notlar

- Eski dosyalar silinmeden önce yedek alın
- Import yollarını güncellemeyi unutmayın
- Environment variables'ların doğru ayarlandığından emin olun
- Frontend ve backend portlarının çakışmadığından emin olun

## 🆘 Sorun Giderme

### Backend Başlatılamıyor
```bash
# Python bağımlılıklarını kontrol et
pip list | grep fastapi

# Port kullanımını kontrol et
netstat -an | grep 8000
```

### Frontend Başlatılamıyor
```bash
# Node modules'u yeniden yükle
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### API Bağlantı Sorunları
- `.env` dosyasındaki URL'leri kontrol edin
- CORS ayarlarını kontrol edin
- Backend'in çalıştığından emin olun 