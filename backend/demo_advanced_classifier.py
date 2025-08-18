#!/usr/bin/env python3
"""
Gelişmiş E-posta Sınıflandırma Sistemi Demo

Bu script, yeni BERT tabanlı e-posta sınıflandırma sistemini test eder.
Çeşitli e-posta örnekleri ile sistemin performansını gösterir.
"""

import asyncio
import json
from datetime import datetime
from src.services.advanced_email_classifier import advanced_email_classifier
from src.services.enhanced_email_analyzer import enhanced_email_analyzer

# Test e-posta örnekleri
TEST_EMAILS = [
    {
        "id": "email_001",
        "subject": "Ideathon Daveti - Yenilikçi Fikirler Yarışması",
        "sender": "hr@abcsoftware.com",
        "body": """
        Merhaba,

        ABC Yazılım olarak sizi "Yenilikçi Fikirler Ideathon'u"na davet etmekten mutluluk duyuyoruz.

        Etkinlik Detayları:
        - Tarih: 15.11.2025
        - Saat: 14:00
        - Platform: Online (Zoom)
        - Süre: 4 saat

        En yaratıcı fikri bulan katılımcıya 10.000 TL ödül verilecektir.

        Katılım için lütfen aşağıdaki linke tıklayın:
        [Kayıt Linki]

        Sorularınız için: ideathon@abcsoftware.com

        Saygılarımızla,
        ABC Yazılım İK Ekibi
        """,
        "date": "2024-11-10T10:00:00Z"
    },
    
    {
        "id": "email_002",
        "subject": "Mülakat Daveti - Frontend Developer Pozisyonu",
        "sender": "careers@techstart.com",
        "body": """
        Sayın Aday,

        TechStart şirketi için Frontend Developer pozisyonuna yaptığınız başvuru değerlendirilmiştir.

        Mülakat detayları:
        - Tarih: 20.11.2025
        - Saat: 15:30
        - Platform: Microsoft Teams
        - Süre: 45 dakika

        Mülakat öncesi hazırlık için:
        1. Şirket hakkında araştırma yapın
        2. Portfolio'nuzu hazırlayın
        3. Teknik sorulara hazırlanın

        Mülakat linki: [Teams Linki]

        Başarılar dileriz,
        TechStart İK Ekibi
        """,
        "date": "2024-11-10T14:30:00Z"
    },
    
    {
        "id": "email_003",
        "subject": "Teknik Test Daveti - Backend Engineer",
        "sender": "recruitment@innovatecorp.com",
        "body": """
        Merhaba,

        InnovateCorp Backend Engineer pozisyonu için teknik test davetiniz bulunmaktadır.

        Test Detayları:
        - Tarih: 18.11.2025
        - Başlangıç: 10:00
        - Süre: 3 saat
        - Platform: HackerRank
        - Test Linki: [HackerRank Linki]

        Test Konuları:
        - Algoritma ve Veri Yapıları
        - Sistem Tasarımı
        - Database Sorguları
        - API Tasarımı

        Test öncesi:
        - HackerRank hesabınızı hazırlayın
        - Test ortamını test edin
        - Gerekli dokümanları hazırlayın

        Sorularınız için: tech-test@innovatecorp.com

        İyi şanslar,
        InnovateCorp Teknik Ekibi
        """,
        "date": "2024-11-10T16:00:00Z"
    },
    
    {
        "id": "email_004",
        "subject": "Başvurunuz Alındı - Data Scientist Pozisyonu",
        "sender": "noreply@datatech.com",
        "body": """
        Sayın Aday,

        DataTech şirketi için Data Scientist pozisyonuna yaptığınız başvuru başarıyla alınmıştır.

        Başvuru numaranız: DS-2024-001

        Değerlendirme süreci:
        1. CV İncelemesi (2-3 iş günü)
        2. İlk Değerlendirme (1 hafta)
        3. Teknik Test (1 hafta)
        4. Mülakat (1 hafta)

        Başvuru durumunuzu takip etmek için:
        [Takip Linki]

        Başvuru sürecinde herhangi bir değişiklik olursa size e-posta ile bilgilendirileceksiniz.

        Teşekkürler,
        DataTech İK Ekibi
        """,
        "date": "2024-11-10T09:15:00Z"
    },
    
    {
        "id": "email_005",
        "subject": "Hackathon Daveti - Blockchain Challenge",
        "sender": "events@blockchainlab.com",
        "body": """
        Merhaba Geliştirici,

        BlockchainLab olarak sizi "Blockchain Innovation Hackathon"una davet ediyoruz.

        Etkinlik Bilgileri:
        - Tarih: 25-26.11.2025
        - Saat: 09:00-18:00
        - Platform: Discord + Zoom
        - Tema: DeFi ve NFT Çözümleri

        Ödüller:
        - 1. Ödül: 25.000 TL
        - 2. Ödül: 15.000 TL
        - 3. Ödül: 10.000 TL

        Katılım koşulları:
        - 18+ yaş
        - Programlama deneyimi
        - Blockchain ilgisi

        Kayıt: [Kayıt Linki]
        Discord: [Discord Linki]

        Sorular: hackathon@blockchainlab.com

        BlockchainLab Ekibi
        """,
        "date": "2024-11-10T11:45:00Z"
    },
    
    {
        "id": "email_006",
        "subject": "Case Study Workshop - Product Management",
        "sender": "learning@productacademy.com",
        "body": """
        Merhaba,

        Product Academy olarak "Case Study Workshop" etkinliğimize davetlisiniz.

        Workshop Detayları:
        - Tarih: 22.11.2025
        - Saat: 13:00-17:00
        - Platform: Zoom
        - Konu: E-ticaret UX Optimizasyonu

        Workshop İçeriği:
        - Case study analizi
        - Grup çalışması
        - Sunum ve tartışma
        - Networking

        Katılım ücretsizdir.
        Sertifika verilecektir.

        Kayıt: [Workshop Linki]

        Product Academy
        """,
        "date": "2024-11-10T13:20:00Z"
    }
]

async def test_advanced_classifier():
    """Gelişmiş sınıflandırıcıyı test et"""
    print("🚀 Gelişmiş E-posta Sınıflandırma Sistemi Test Ediliyor...\n")
    
    for i, email in enumerate(TEST_EMAILS, 1):
        print(f"📧 Test E-postası {i}: {email['subject']}")
        print("-" * 80)
        
        try:
            # BERT tabanlı sınıflandırma
            result = advanced_email_classifier.classify_email(
                email_content=email['body'],
                email_subject=email['subject'],
                email_sender=email['sender']
            )
            
            print(f"✅ Kategori: {result.category}")
            print(f"🎯 Güven Skoru: {result.confidence:.2f}")
            print(f"🧠 Akıl Yürütme: {result.reasoning}")
            
            # Çıkarılan bilgiler
            print("\n📋 Çıkarılan Bilgiler:")
            for key, value in result.extracted_info.items():
                if value and value not in ["Belirlenemedi", "Bilinmeyen"]:
                    print(f"   {key}: {value}")
            
            # Metadata
            print(f"\n📊 Metadata:")
            print(f"   Model: {result.metadata['model_used']}")
            print(f"   Dil: {result.metadata['language']}")
            print(f"   Metin Uzunluğu: {result.metadata['text_length']}")
            
        except Exception as e:
            print(f"❌ Hata: {e}")
        
        print("\n" + "=" * 80 + "\n")

async def test_enhanced_analyzer():
    """Gelişmiş analizörü test et"""
    print("🔍 Gelişmiş E-posta Analizör Test Ediliyor...\n")
    
    try:
        # Toplu analiz
        results = await enhanced_email_analyzer.analyze_emails(TEST_EMAILS)
        
        print(f"📊 Analiz Sonuçları:")
        print(f"   Toplam Bulunan: {results['totalFound']}")
        print(f"   Öğrenme Güncellendi: {results['learning_updated']}")
        print(f"   Model Güveni: {results['model_confidence']:.2f}")
        
        print(f"\n📋 Detaylı Sonuçlar:")
        for i, app in enumerate(results['applications'], 1):
            print(f"\n   {i}. {app['company_name']} - {app['position']}")
            print(f"      Kategori: {app['category']}")
            print(f"      Durum: {app['status']}")
            print(f"      Güven: {app['confidence']:.2f}")
            
            # Aksiyon öğeleri
            if app.get('extracted_info', {}).get('action_items'):
                print(f"      📝 Aksiyon Öğeleri:")
                for action in app['extracted_info']['action_items']:
                    print(f"         • {action['title']} ({action['priority']})")
            
            # Takvim entegrasyonu
            if app.get('extracted_info', {}).get('takvim_entegrasyonu'):
                calendar = app['extracted_info']['takvim_entegrasyonu']
                if calendar.get('start_date'):
                    print(f"      📅 Takvim: {calendar['start_date']}")
        
        # Öğrenme içgörüleri
        insights = enhanced_email_analyzer.get_learning_insights()
        print(f"\n🧠 Öğrenme İçgörüleri:")
        print(f"   Toplam Şirket: {insights['total_companies']}")
        print(f"   En Yaygın E-posta Türü: {insights['most_common_email_type']}")
        print(f"   Model Güveni: {insights['model_confidence']:.2f}")
        
    except Exception as e:
        print(f"❌ Analizör Hatası: {e}")

async def test_specific_email():
    """Belirli bir e-postayı detaylı test et"""
    print("🎯 Belirli E-posta Detaylı Test Ediliyor...\n")
    
    # Ideathon e-postasını test et
    test_email = TEST_EMAILS[0]  # Ideathon daveti
    
    print(f"📧 Test E-postası: {test_email['subject']}")
    print(f"📝 İçerik: {test_email['body'][:200]}...")
    
    try:
        # Gelişmiş analiz
        result = await enhanced_email_analyzer.analyze_single_email_enhanced(test_email)
        
        if result:
            print(f"\n✅ Analiz Sonucu:")
            print(f"   Kategori: {result['category']}")
            print(f"   Şirket: {result['company_name']}")
            print(f"   Pozisyon: {result['position']}")
            print(f"   Durum: {result['status']}")
            print(f"   Güven: {result['confidence']:.2f}")
            
            # Çıkarılan bilgiler
            if result.get('extracted_info'):
                print(f"\n📋 Çıkarılan Bilgiler:")
                for key, value in result['extracted_info'].items():
                    if value and value not in ["Belirlenemedi", "Bilinmeyen"]:
                        print(f"   {key}: {value}")
        else:
            print("❌ E-posta analiz edilemedi")
            
    except Exception as e:
        print(f"❌ E-posta analiz hatası: {e}")

def main():
    """Ana test fonksiyonu"""
    print("🎉 Gelişmiş E-posta Filtreleme Sistemi Demo")
    print("=" * 80)
    
    # Test senaryoları
    test_scenarios = [
        ("BERT Sınıflandırıcı Testi", test_advanced_classifier),
        ("Gelişmiş Analizör Testi", test_enhanced_analyzer),
        ("Belirli E-posta Detaylı Testi", test_specific_email)
    ]
    
    for scenario_name, test_func in test_scenarios:
        print(f"\n{'='*20} {scenario_name} {'='*20}")
        try:
            asyncio.run(test_func())
        except Exception as e:
            print(f"❌ {scenario_name} hatası: {e}")
    
    print("\n🎯 Demo Tamamlandı!")
    print("\n💡 Sistem Özellikleri:")
    print("   ✅ BERT tabanlı bağlamsal anlama")
    print("   ✅ Yapılandırılmış bilgi çıkarımı")
    print("   ✅ Durum tabanlı öğrenme")
    print("   ✅ Otomatik takvim entegrasyonu")
    print("   ✅ Aksiyon öğeleri oluşturma")
    print("   ✅ Öncelik seviyesi hesaplama")

if __name__ == "__main__":
    main()
