# ChromaDB Entegrasyonu - Jobsy İş Başvuru Sistemi

Bu dokümantasyon, Jobsy iş başvuru takip sistemine ChromaDB vektör veritabanı entegrasyonunu açıklar.

## 🚀 Genel Bakış

ChromaDB entegrasyonu ile iş başvuruları ve e-posta analizleri artık vektör temsilleri ile saklanıyor ve semantik arama yapılabiliyor. Bu sayede:

- **Semantik Arama**: Doğal dil sorguları ile başvurularda arama
- **Vektör Temsilleri**: Metin verilerinin anlamlı vektörlere dönüştürülmesi
- **Hızlı Erişim**: Vektör indeksleme ile hızlı arama
- **Ölçeklenebilirlik**: Büyük veri setlerinde etkili performans

## 📋 Gereksinimler

### Python Paketleri
```bash
pip install -r requirements.txt
```

### ChromaDB Bağımlılıkları
- `chromadb==0.4.22`
- `chroma-hnswlib==0.7.3`

## 🏗️ Mimari

### Servis Katmanı
- **ChromaService**: Ana ChromaDB işlemleri
- **ApplicationService**: ChromaDB entegrasyonlu başvuru yönetimi

### Konfigürasyon
- **ChromaConfig**: ChromaDB ayarları ve parametreleri

### API Routes
- **chroma_routes.py**: ChromaDB operasyonları için REST API

## ⚙️ Konfigürasyon

### Environment Variables
```bash
# ChromaDB persist directory
CHROMA_PERSIST_DIRECTORY=chroma_db

# Remote ChromaDB (opsiyonel)
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_SSL=false
CHROMA_AUTH_TOKEN=your_token

# Embedding model ayarları
EMBEDDING_MODEL=all-MiniLM-L6-v2
VECTOR_DIMENSION=384

# Arama limitleri
DEFAULT_SEARCH_LIMIT=10
MAX_SEARCH_LIMIT=100
```

### Varsayılan Ayarlar
- **Persist Directory**: `chroma_db/`
- **Embedding Model**: `all-MiniLM-L6-v2`
- **Vector Dimension**: 384
- **Default Search Limit**: 10
- **Max Search Limit**: 100

## 🔧 Kullanım

### 1. ChromaService Başlatma
```python
from src.services.chroma_service import ChromaService

# Varsayılan ayarlarla
chroma_service = ChromaService()

# Özel persist directory ile
chroma_service = ChromaService(persist_directory="custom_path")
```

### 2. İş Başvurusu Ekleme
```python
application_data = {
    "company_name": "Tech Corp",
    "position": "Senior Developer",
    "application_status": "Başvuru Yapıldı",
    "location": "İstanbul",
    "requirements": "Python, FastAPI, PostgreSQL"
}

application_id = chroma_service.add_application(application_data, "user@example.com")
```

### 3. Semantik Arama
```python
# Başvurularda arama
results = chroma_service.search_applications(
    query="Python developer remote",
    user_id="user@example.com",
    limit=10
)

# E-posta analizlerinde arama
email_results = chroma_service.search_email_analysis(
    query="mülakat daveti",
    user_id="user@example.com",
    limit=5
)
```

### 4. Başvuru Güncelleme
```python
update_data = {"application_status": "Mülakat Tamamlandı"}
success = chroma_service.update_application(
    application_id, 
    update_data, 
    "user@example.com"
)
```

### 5. Başvuru Silme
```python
success = chroma_service.delete_application(
    application_id, 
    "user@example.com"
)
```

## 🌐 API Endpoints

### ChromaDB Routes (`/chroma`)

#### Başvuru Yönetimi
- `POST /chroma/applications` - Yeni başvuru oluştur
- `GET /chroma/applications` - Kullanıcının başvurularını getir
- `PUT /chroma/applications/{id}` - Başvuru güncelle
- `DELETE /chroma/applications/{id}` - Başvuru sil

#### Arama
- `POST /chroma/search/applications` - Başvurularda semantik arama
- `POST /chroma/search/emails` - E-posta analizlerinde semantik arama

#### E-posta Analizi
- `POST /chroma/emails/analysis` - E-posta analiz sonucunu kaydet

#### Sistem
- `GET /chroma/stats` - Koleksiyon istatistikleri
- `GET /chroma/health` - ChromaDB sağlık kontrolü

## 📊 Veri Yapısı

### İş Başvuru Koleksiyonu
```json
{
  "id": "uuid",
  "metadata": {
    "user_id": "user@example.com",
    "application_id": "uuid",
    "company_name": "Şirket Adı",
    "position": "Pozisyon",
    "application_status": "Durum",
    "location": "Konum",
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  },
  "document": "Şirket: Tech Corp | Pozisyon: Senior Developer | Durum: Başvuru Yapıldı"
}
```

### E-posta Analiz Koleksiyonu
```json
{
  "id": "uuid",
  "metadata": {
    "user_id": "user@example.com",
    "analysis_id": "uuid",
    "email_id": "email_123",
    "email_subject": "E-posta Konusu",
    "email_sender": "sender@company.com",
    "analysis_method": "AI Analysis",
    "created_at": "2024-01-01T00:00:00"
  },
  "document": "Konu: İş Başvurusu | Gönderen: hr@company.com | Şirket: Tech Corp"
}
```

## 🔍 Arama Özellikleri

### Semantik Arama
- **Doğal Dil Sorguları**: "Python developer remote pozisyon"
- **Eşanlamlı Arama**: "mülakat" sorgusu "interview" sonuçlarını da bulur
- **Bağlam Farkındalığı**: Sorgu bağlamına göre en uygun sonuçlar

### Arama Parametreleri
- **query**: Arama sorgusu (zorunlu)
- **user_id**: Kullanıcı ID'si (zorunlu)
- **limit**: Sonuç limiti (varsayılan: 10, maksimum: 100)

### Arama Sonuçları
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "metadata": {...},
      "document": "...",
      "distance": 0.15
    }
  ],
  "query": "Python developer",
  "count": 5
}
```

## 🧪 Test

### Test Scripti Çalıştırma
```bash
cd backend
python test_chroma.py
```

### Test Kapsamı
- ✅ Konfigürasyon testi
- ✅ ChromaDB bağlantı testi
- ✅ Başvuru operasyonları testi
- ✅ E-posta analiz operasyonları testi

## 🚨 Hata Yönetimi

### Yaygın Hatalar
1. **ChromaDB Bağlantı Hatası**: Persist directory erişim izni kontrol edin
2. **Koleksiyon Bulunamadı**: ChromaDB servisini yeniden başlatın
3. **Vektör Boyut Uyumsuzluğu**: Embedding model konfigürasyonunu kontrol edin

### Hata Kodları
- `500`: Sunucu hatası
- `404`: Kayıt bulunamadı
- `400`: Geçersiz istek

## 🔄 Migration

### Mevcut Verilerden ChromaDB'ye
```python
# Legacy storage'dan veri yükleme
from src.services.application_service import application_service

# Mevcut başvuruları ChromaDB'ye aktar
for user_id, applications in application_service.applications_storage.items():
    for app in applications:
        application_service.save_application_to_chroma(app, user_id)
```

### Geriye Uyumluluk
- Legacy JSON storage korunuyor
- ChromaDB operasyonları legacy storage'ı da güncelliyor
- Mevcut API'ler çalışmaya devam ediyor

## 📈 Performans

### Optimizasyonlar
- **Vektör İndeksleme**: HNSW algoritması ile hızlı arama
- **Batch İşlemler**: Toplu veri ekleme/güncelleme
- **Cache Sistemi**: Tekrarlanan analizler için cache
- **Async İşlemler**: Asenkron API endpoint'leri

### Ölçeklenebilirlik
- **Koleksiyon Bazlı**: Her veri türü için ayrı koleksiyon
- **Metadata Filtreleme**: Hızlı kullanıcı bazlı filtreleme
- **Vektör Sıkıştırma**: Bellek kullanımını optimize eder

## 🔒 Güvenlik

### Veri İzolasyonu
- Her kullanıcının verisi ayrı filtreleme ile izole edilir
- `user_id` bazlı erişim kontrolü
- Metadata seviyesinde güvenlik

### Kimlik Doğrulama
- API endpoint'lerinde kullanıcı doğrulama
- ChromaDB authentication token desteği
- SSL/TLS bağlantı desteği

## 🚀 Gelecek Geliştirmeler

### Planlanan Özellikler
- [ ] **Real-time Sync**: Gerçek zamanlı veri senkronizasyonu
- [ ] **Advanced Analytics**: Gelişmiş analitik ve raporlama
- [ ] **Multi-language Support**: Çoklu dil desteği
- [ ] **Custom Embeddings**: Özel embedding model desteği
- [ ] **Backup & Restore**: Otomatik yedekleme ve geri yükleme

### Entegrasyonlar
- [ ] **Elasticsearch**: Tam metin arama için
- [ ] **Redis**: Cache ve session yönetimi
- [ ] **PostgreSQL**: İlişkisel veri saklama
- [ ] **MongoDB**: Doküman bazlı veri saklama

## 📚 Kaynaklar

### Dokümantasyon
- [ChromaDB Official Docs](https://docs.trychroma.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Sentence Transformers](https://www.sbert.net/)

### Örnekler
- `test_chroma.py` - Temel kullanım örnekleri
- `chroma_routes.py` - API endpoint örnekleri
- `chroma_service.py` - Servis sınıfı örnekleri

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 Destek

Sorularınız için:
- GitHub Issues: [Proje Issues](https://github.com/your-repo/issues)
- Email: support@jobsy.com
- Discord: [Jobsy Community](https://discord.gg/jobsy)
