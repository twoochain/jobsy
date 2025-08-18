# 🚀 Gelişmiş E-posta Sınıflandırma Sistemi

Bu dokümantasyon, Jobsy projesi için geliştirilen **BERT tabanlı gelişmiş e-posta sınıflandırma sistemi**ni açıklar.

## 🎯 Sistem Özellikleri

### **1. Bağlamsal Anlama**
- **BERT (Bidirectional Encoder Representations from Transformers)** kullanarak e-postaların tam bağlamını anlar
- Kelimelerin birbirleriyle olan ilişkilerini analiz eder
- "Ideathon" gibi yeni terimleri bile bağlamdan yola çıkarak yorumlar

### **2. Yapılandırılmış Bilgi Çıkarımı**
- Şirket adı, pozisyon, tarih, saat, platform bilgilerini otomatik çıkarır
- JSON formatında yapılandırılmış çıktı üretir
- Takvim entegrasyonu için hazır veri sağlar

### **3. Durum Tabanlı Öğrenme**
- Önceki e-postalardan öğrenir
- Şirket bazlı pattern'ları tespit eder
- Sürekli iyileşen performans

### **4. Akıllı Sınıflandırma**
- 8 farklı kategori: etkinlik daveti, mülakat, teknik test, başvuru onayı vb.
- Güven skoru ile tahmin kalitesi
- Akıl yürütme açıklamaları

## 🏗️ Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────┐
│                    E-posta Girişi                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Gelişmiş E-posta Analizör                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   BERT Model    │  │  Bilgi Çıkarımı │  │  Bağlam     │ │
│  │  Sınıflandırma  │  │  & Zenginleştirme│  │  Analizi    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Yapılandırılmış Çıktı                         │
│  • Kategori & Güven Skoru                                 │
│  • Çıkarılan Bilgiler (şirket, tarih, platform)          │
│  • Aksiyon Öğeleri                                        │
│  • Takvim Entegrasyonu                                    │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Kurulum

### **1. Gerekli Kütüphaneler**
```bash
pip install -r requirements.txt
```

### **2. Model İndirme**
Sistem ilk çalıştırıldığında BERT modelleri otomatik olarak indirilir:
- `dbmdz/bert-base-turkish-cased` (Türkçe için)
- `bert-base-multilingual-cased` (fallback için)

### **3. Sistem Başlatma**
```python
from src.services.enhanced_email_analyzer import enhanced_email_analyzer

# E-posta analizi
result = await enhanced_email_analyzer.analyze_emails(emails)
```

## 🔧 Kullanım Örnekleri

### **1. Basit E-posta Sınıflandırma**
```python
from src.services.advanced_email_classifier import advanced_email_classifier

# Tek e-posta sınıflandırma
result = advanced_email_classifier.classify_email(
    email_content="Mülakat davetiniz bulunmaktadır...",
    email_subject="Mülakat Daveti",
    email_sender="hr@company.com"
)

print(f"Kategori: {result.category}")
print(f"Güven: {result.confidence:.2f}")
print(f"Şirket: {result.extracted_info['sirket']}")
```

### **2. Toplu E-posta Analizi**
```python
emails = [
    {
        "subject": "Ideathon Daveti",
        "body": "Yenilikçi fikirler yarışmasına davetlisiniz...",
        "sender": "events@company.com"
    }
]

results = await enhanced_email_analyzer.analyze_emails(emails)
print(f"Bulunan başvuru: {results['totalFound']}")
```

### **3. Model Eğitimi**
```python
# Eğitim verisi hazırla
training_data = [
    {"text": "Mülakat daveti...", "label": "mulakat_daveti"},
    {"text": "Teknik test...", "label": "teknik_test"}
]

# Modeli fine-tuning ile eğit
advanced_email_classifier.train_model(training_data)
```

## 📊 Çıktı Formatı

### **Sınıflandırma Sonucu**
```json
{
  "category": "etkinlik_daveti",
  "confidence": 0.95,
  "extracted_info": {
    "sirket": "ABC Yazılım",
    "etkinlik_adi": "Yenilikçi Fikirler Ideathon'u",
    "tarih": "15.11.2025",
    "saat": "14:00",
    "platform": "Online (Zoom)",
    "etkinlik_turu": "Ideathon",
    "pozisyon": "Katılımcı",
    "bilgi": "En yaratıcı fikri bulan katılımcıya 10.000 TL ödül verilecektir"
  },
  "reasoning": "'Yenilikçi Fikirler Ideathon'u' etkinliği için davet e-postası tespit edildi. Etkinlik türü: Ideathon",
  "metadata": {
    "model_used": "dbmdz/bert-base-turkish-cased",
    "classification_timestamp": "2024-11-10T10:00:00",
    "text_length": 450,
    "language": "Turkish"
  }
}
```

### **Gelişmiş Analiz Sonucu**
```json
{
  "is_application": true,
  "category": "etkinlik_daveti",
  "confidence": 0.95,
  "company_name": "ABC Yazılım",
  "position": "Katılımcı",
  "status": "Etkinlik Daveti",
  "extracted_info": {
    "action_items": [
      {
        "type": "platform_setup",
        "title": "Zoom Kurulumu",
        "description": "Zoom platformunda hesap oluştur ve test et",
        "priority": "high",
        "estimated_time": "15-30 dakika"
      }
    ],
    "priority_level": "high",
    "takvim_entegrasyonu": {
      "title": "Yenilikçi Fikirler Ideathon'u",
      "start_date": "2025-11-15",
      "description": "Şirket: ABC Yazılım\nPlatform: Online (Zoom)\nDetay: En yaratıcı fikri bulan katılımcıya 10.000 TL ödül verilecektir"
    }
  },
  "context_analysis": {
    "company_familiarity": "new",
    "urgency_level": "normal",
    "action_required": true,
    "platform_details": {
      "name": "Online (Zoom)",
      "type": "video_conference",
      "setup_required": true
    }
  }
}
```

## 🧠 Model Detayları

### **BERT Modeli**
- **Model**: `dbmdz/bert-base-turkish-cased`
- **Token Limit**: 512 token
- **Dil Desteği**: Türkçe + İngilizce
- **Fine-tuning**: Evriyesel öğrenme ile

### **Kategoriler**
1. **etkinlik_daveti**: Hackathon, Ideathon, Workshop davetleri
2. **mulakat_daveti**: Mülakat ve görüşme davetleri
3. **teknik_test**: Teknik test ve kodlama yarışmaları
4. **basvuru_onayi**: Başvuru onay ve alındı bildirimleri
5. **is_teklifi**: İş teklifi ve kabul bildirimleri
6. **red_bildirimi**: Red ve olumsuz sonuç bildirimleri
7. **genel_bilgilendirme**: Genel bilgilendirme ve güncellemeler
8. **spam_reklam**: Spam ve reklam e-postaları

## 🚀 Performans Optimizasyonu

### **1. GPU Kullanımı**
```python
# CUDA varsa otomatik kullanılır
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
```

### **2. Batch Processing**
```python
# Toplu e-posta işleme
results = await enhanced_email_analyzer.analyze_emails(emails_batch)
```

### **3. Model Caching**
- Modeller ilk yüklemede cache'lenir
- Fallback modeller hazır tutulur

## 🔍 Test ve Demo

### **Demo Script Çalıştırma**
```bash
cd backend
python demo_advanced_classifier.py
```

### **Test Senaryoları**
1. **Ideathon Daveti**: Yeni terim tanıma
2. **Mülakat Daveti**: Standart sınıflandırma
3. **Teknik Test**: Platform tespiti
4. **Başvuru Onayı**: Durum analizi

## 📈 Öğrenme ve İyileştirme

### **1. Sürekli Öğrenme**
```python
# Öğrenme içgörüleri
insights = enhanced_email_analyzer.get_learning_insights()
print(f"Model güveni: {insights['model_confidence']:.2f}")
```

### **2. Fine-tuning**
```python
# Yeni verilerle model güncelleme
if len(learning_data) >= 10:
    advanced_email_classifier.train_model(learning_data)
```

### **3. Performans Metrikleri**
- Accuracy, Precision, Recall
- Kategori bazlı performans
- Güven skoru dağılımı

## 🛠️ Sorun Giderme

### **Yaygın Hatalar**

#### **1. Model Yükleme Hatası**
```
Model yükleme hatası: Connection timeout
```
**Çözüm**: İnternet bağlantısını kontrol edin, fallback modeller kullanılacak

#### **2. CUDA Hatası**
```
CUDA out of memory
```
**Çözüm**: Batch size'ı azaltın veya CPU kullanın

#### **3. Import Hatası**
```
ModuleNotFoundError: No module named 'transformers'
```
**Çözüm**: `pip install -r requirements.txt` çalıştırın

### **Fallback Sistemi**
- BERT yüklenemezse eski TF-IDF sistemi kullanılır
- Her iki sistem de aynı API'yi sağlar
- Otomatik geçiş yapılır

## 🔮 Gelecek Geliştirmeler

### **1. Çok Dilli Destek**
- Daha fazla dil için BERT modelleri
- Otomatik dil tespiti

### **2. Gelişmiş NER**
- Named Entity Recognition ile daha iyi bilgi çıkarımı
- Şirket, kişi, lokasyon tespiti

### **3. Sentiment Analysis**
- E-posta tonu analizi
- Aciliyet seviyesi tespiti

### **4. Otomatik Takvim Entegrasyonu**
- Google Calendar API entegrasyonu
- Outlook entegrasyonu

## 📚 Referanslar

- [BERT Paper](https://arxiv.org/abs/1810.04805)
- [Transformers Library](https://huggingface.co/transformers/)
- [Turkish BERT Models](https://huggingface.co/dbmdz)
- [PyTorch Documentation](https://pytorch.org/docs/)

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

- **Proje**: Jobsy E-posta Filtreleme Sistemi
- **Geliştirici**: AI Assistant
- **GitHub**: [Proje Linki]

---

**Not**: Bu sistem, mevcut TF-IDF tabanlı yaklaşımı tamamen değiştirir ve BERT tabanlı gelişmiş anlama yeteneği sağlar. Geriye dönük uyumluluk korunmuştur.
