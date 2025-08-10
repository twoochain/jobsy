# Jobsy AI Backend

Jobsy AI Backend, iş başvuru takip sistemi için geliştirilmiş FastAPI tabanlı bir backend uygulamasıdır. Gmail entegrasyonu, AI destekli e-posta analizi ve başvuru yönetimi özelliklerini içerir.

## 🏗️ Proje Yapısı

```
backend/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── gmail_routes.py
│   │   │   ├── email_analyzer_routes.py
│   │   │   ├── application_routes.py
│   │   │   └── ai_routes.py
│   │   └── middleware/
│   │       └── cors.py
│   ├── config/
│   │   └── settings.py
│   ├── models/
│   │   └── schemas.py
│   ├── services/
│   │   ├── gmail_service.py
│   │   ├── email_analyzer_service.py
│   │   ├── application_service.py
│   │   └── ai_service.py
│   ├── utils/
│   │   └── helpers.py
│   └── main.py
├── main.py
├── requirements.txt
└── README.md
```

## 🚀 Özellikler

### 📧 Gmail Entegrasyonu
- OAuth 2.0 ile Gmail bağlantısı
- İş başvurusu e-postalarını otomatik tarama
- E-posta detaylarını çıkarma

### 🤖 AI Destekli Analiz
- Gemini API entegrasyonu
- Hugging Face model desteği
- E-posta içeriğini akıllı analiz
- İş başvurusu tespiti

### 📋 Başvuru Yönetimi
- Başvuru kaydetme ve listeleme
- Aktif/tamamlanmış başvuru ayrımı
- Başvuru durumu takibi
- CRUD işlemleri

### 🔧 API Endpoints

#### Gmail Routes
- `POST /gmail/connect` - Gmail bağlantısını başlat
- `POST /gmail/callback` - OAuth callback işle
- `POST /gmail/disconnect` - Gmail bağlantısını kes
- `GET /gmail/status/{user_id}` - Bağlantı durumunu kontrol et
- `POST /gmail/scan` - E-postaları tara

#### Email Analysis Routes
- `POST /analyze/emails` - E-postaları analiz et

#### Application Routes
- `POST /applications/save` - Başvuruları kaydet
- `GET /applications/{user_id}` - Kullanıcı başvurularını getir
- `DELETE /applications/{user_id}/{application_id}` - Başvuru sil
- `PUT /applications/{user_id}/{application_id}` - Başvuru güncelle

#### AI Routes
- `POST /ai/prompt` - AI prompt işle
- `POST /ai/gemini-inference` - Gemini inference
- `POST /ai/gemini-analyze` - Gemini ile analiz
- `POST /ai/summarize` - Metin özetleme
- `GET /ai/search-models` - Model arama
- `GET /ai/model-details/{model_id}` - Model detayları
- `POST /ai/hf-inference` - Hugging Face inference

## 🛠️ Kurulum

### Gereksinimler
- Python 3.8+
- pip

### Adımlar

1. **Bağımlılıkları yükle:**
```bash
pip install -r requirements.txt
```

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GMAIL_REDIRECT_URI=http://localhost:3000/api/google/gmail/callback
```

3. **Uygulamayı çalıştır:**
```bash
python main.py
```

## 📚 API Dokümantasyonu

Uygulama çalıştıktan sonra:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## 🔧 Geliştirme

### Yeni Route Ekleme
1. `src/api/routes/` klasöründe yeni route dosyası oluştur
2. `src/main.py` dosyasında route'u dahil et

### Yeni Servis Ekleme
1. `src/services/` klasöründe yeni servis dosyası oluştur
2. İlgili route dosyasında servisi kullan

### Yeni Model Ekleme
1. `src/models/schemas.py` dosyasında yeni Pydantic modeli tanımla

## 🧪 Test

```bash
# Uygulamayı test modunda çalıştır
python -m pytest tests/
```

## 📦 Deployment

### Docker ile
```bash
# Docker image oluştur
docker build -t jobsy-backend .

# Container çalıştır
docker run -p 8000:8000 jobsy-backend
```

### Production
```bash
# Production sunucusu ile çalıştır
uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 🤝 Katkıda Bulunma

1. Fork yap
2. Feature branch oluştur (`git checkout -b feature/amazing-feature`)
3. Commit yap (`git commit -m 'Add amazing feature'`)
4. Push yap (`git push origin feature/amazing-feature`)
5. Pull Request oluştur


