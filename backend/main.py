"""
Jobsy AI Backend - Ana çalıştırma dosyası
"""

import uvicorn
from src.main import app
from src.config.settings import settings

if __name__ == "__main__":
    print("🚀 Jobsy AI Backend başlatılıyor...")
    print(f"📍 Host: {settings.HOST}")
    print(f"🔌 Port: {settings.PORT}")
    print(f"🔄 Reload: {settings.RELOAD}")
    print("📚 API Docs: http://localhost:8000/docs")
    print("🔗 ReDoc: http://localhost:8000/redoc")
    print("-" * 50)
    
    uvicorn.run(
        "src.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
        log_level="info"
    )
