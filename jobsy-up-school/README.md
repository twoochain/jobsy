# Jobsy UpSchool Backend (FastAPI)

Yapay zeka destekli iş/staj başvuru takip uygulamasının FastAPI backend'i.

## 🚀 Kurulum

1. Python 3.10+ kurulu olmalı.
2. Gerekli paketleri yükle:

```bash
pip install fastapi uvicorn
```

3. (AI entegrasyonu için ileride) Gemini API anahtarınızı `.env` dosyasına ekleyin.

## 🏃‍♂️ Çalıştırma

```bash
uvicorn main:app --reload
```

- API, varsayılan olarak [http://localhost:8000](http://localhost:8000) adresinde çalışır.

## 🧩 Örnek AI Özelliği (features/ai_example.py)

Kullanıcıdan prompt alıp, AI yanıtı dönen örnek endpoint:

- **POST** `/ai/prompt`
- Body: `{ "prompt": "örnek bir metin" }`
- Yanıt: `{ "prompt": "...", "ai_response": "..." }`

Test için örnek cURL:
```bash
curl -X POST http://localhost:8000/ai/prompt -H "Content-Type: application/json" -d '{"prompt": "Bir iş başvurusu örneği yaz."}'
```

> Şu an AI yanıtı mock (örnek) olarak dönüyor. Gerçek Gemini API entegrasyonu için kodda ilgili yere anahtarınızı ekleyin.

## 📁 Dosya Yapısı

- `main.py` — FastAPI ana uygulama
- `features/ai_example.py` — Örnek AI özelliği (prompt → yanıt)
- `requirements.txt` — Gereken Python paketleri (isteğe bağlı)

## 👨‍💻 Mentor için Not
- Tüm kod ve örnekler localde çalışır.
- features/ klasöründe örnek AI özelliği hazır.
- Kurulum ve test adımları yukarıda açıklanmıştır.
