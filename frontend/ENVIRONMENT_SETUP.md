# Environment Variables Setup Guide

Bu dosya, Next.js projenizde API anahtarlarını ve diğer hassas bilgileri güvenli bir şekilde yönetmek için environment variables kullanımını açıklar.

## 📁 .env.local Dosyası Oluşturma

Proje ana dizininde (frontend klasöründe) `.env.local` dosyası oluşturun:

```bash
# Jobsy/Jobsy/frontend/.env.local
```

## 🔐 Environment Variables Örnekleri

### Client-Side Variables (NEXT_PUBLIC_ prefix gerekli)
```env
# Client-side'da kullanılabilir (browser'da görünür)
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_APP_NAME=Jobsy
NEXT_PUBLIC_VERSION=1.0.0
```

### Server-Side Variables (NEXT_PUBLIC_ prefix YOK)
```env
# Sadece server-side'da kullanılabilir (güvenli)
API_SECRET_KEY=your_secret_api_key_here
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your_jwt_secret_key_here
OPENAI_API_KEY=sk-your-openai-api-key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 🚀 Kullanım Örnekleri

### Client-Side (Components, Pages)
```typescript
// ✅ Doğru - Client-side'da kullanılabilir
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// ❌ Yanlış - Client-side'da kullanılamaz
const secretKey = process.env.API_SECRET_KEY; // undefined olur
```

### Server-Side (API Routes)
```typescript
// ✅ Doğru - Server-side'da kullanılabilir
const secretKey = process.env.API_SECRET_KEY;
const dbUrl = process.env.DATABASE_URL;
```

## 📋 Önerilen .env.local İçeriği

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
API_SECRET_KEY=your_super_secret_key_here

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/jobsy_db

# Authentication
JWT_SECRET=your_jwt_secret_key_here
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# External APIs
OPENAI_API_KEY=sk-your-openai-api-key-here
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Email Service (if using)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password_here

# File Storage (if using)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 🔒 Güvenlik Notları

1. **`.env.local` dosyası `.gitignore`'da olmalı** ✅ (zaten var)
2. **API anahtarlarını asla client-side'da kullanmayın**
3. **Production'da environment variables'ları hosting platformunda ayarlayın**
4. **Düzenli olarak API anahtarlarınızı değiştirin**

## 🌐 Production Deployment

### Vercel
- Vercel Dashboard > Project Settings > Environment Variables
- Her environment variable'ı ayrı ayrı ekleyin

### Netlify
- Site Settings > Environment Variables
- Build & Deploy > Environment

### Railway
- Project Settings > Variables
- Environment variables ekleyin

## 🧪 Development

```bash
# Development server'ı başlatın
npm run dev

# Environment variables otomatik olarak yüklenecek
```

## 📝 Önemli Notlar

- `.env.local` dosyası sadece local development için
- Production'da hosting platformunun environment variables sistemini kullanın
- `NEXT_PUBLIC_` prefix'i olan variables client-side'da görünür olur
- Prefix olmayan variables sadece server-side'da kullanılabilir 