"""
Jobsy AI Backend - Ana çalıştırma dosyası
"""

import uvicorn
import sys
import os

# Python path'e src dizinini ekle
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def main():
    """Ana uygulama başlatma fonksiyonu"""
    try:
        from src.main import app
        from src.config.settings import settings
        
        print("🚀 Jobsy AI Backend başlatılıyor...")
        print(f"📍 Host: {settings.HOST}")
        print(f"🔌 Port: {settings.PORT}")
        print(f"🔄 Reload: {settings.RELOAD}")
        print("📚 API Docs: http://localhost:8000/docs")
        print("🔗 ReDoc: http://localhost:8000/redoc")
        print("-" * 50)
        
        # Windows'ta reload sorunları olabilir, basit konfigürasyon kullan
        uvicorn.run(
            app,
            host=settings.HOST,
            port=settings.PORT,
            reload=False,  # Windows'ta reload'u kapat
            log_level="info"
        )
        
    except ImportError as e:
        print(f"❌ Import hatası: {e}")
        print("💡 Lütfen gerekli paketlerin kurulu olduğundan emin olun")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Başlatma hatası: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
