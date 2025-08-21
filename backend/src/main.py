from fastapi import FastAPI
from contextlib import asynccontextmanager
from .config.settings import settings
from .api.middleware.cors import setup_cors

def setup_routes(app: FastAPI):
    """Route'ları lazy loading ile dahil et"""
    try:
        # Gmail routes
        from .api.routes import gmail_routes
        app.include_router(gmail_routes.router)
        print("✅ Gmail routes yüklendi")
    except Exception as e:
        print(f"⚠️ Gmail routes yüklenemedi: {e}")
    
    try:
        # Email analyzer routes
        from .api.routes import email_analyzer_routes
        app.include_router(email_analyzer_routes.router)
        print("✅ Email analyzer routes yüklendi")
    except Exception as e:
        print(f"⚠️ Email analyzer routes yüklenemedi: {e}")
    
    try:
        # Application routes
        from .api.routes import application_routes
        app.include_router(application_routes.router, prefix="/applications")
        print("✅ Application routes yüklendi")
    except Exception as e:
        print(f"⚠️ Application routes yüklenemedi: {e}")
    
    try:
        # AI routes
        from .api.routes import ai_routes
        app.include_router(ai_routes.router)
        print("✅ AI routes yüklendi")
    except Exception as e:
        print(f"⚠️ AI routes yüklenemedi: {e}")
    
    try:
        # Search routes
        from .api.routes import search_routes
        app.include_router(search_routes.router)
        print("✅ Search routes yüklendi")
    except Exception as e:
        print(f"⚠️ Search routes yüklenemedi: {e}")
    
    try:
        # ChromaDB routes
        from .api.routes import chroma_routes
        app.include_router(chroma_routes.router, prefix="/chroma")
        print("✅ ChromaDB routes yüklendi")
    except Exception as e:
        print(f"⚠️ ChromaDB routes yüklenemedi: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Uygulama yaşam döngüsü yönetimi"""
    # Startup
    print("🔄 Route'lar yükleniyor...")
    setup_routes(app)
    print("✅ Tüm route'lar yüklendi")
    
    yield
    
    # Shutdown
    print("🔄 Uygulama kapatılıyor...")

# FastAPI uygulamasını oluştur
app = FastAPI(
    title="Jobsy AI API", 
    description="Hugging Face ve Gemini API entegrasyonu ile iş başvuru takip sistemi - ChromaDB vektör veritabanı desteği ile",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware'ini ayarla
setup_cors(app)

# Ana endpoint
@app.get("/")
def root():
    """Ana endpoint - API bilgilerini döner"""
    return {
        "message": "Jobsy AI API çalışıyor!", 
        "version": "1.0.0",
        "status": "healthy",
        "endpoints": {
            "gmail": "/gmail/*",
            "analyze": "/analyze/*", 
            "applications": "/applications/*",
            "ai": "/ai/*",
            "search": "/search/*",
            "chroma": "/chroma/*"
        },
        "docs": "/docs",
        "redoc": "/redoc"
    }

# Health check endpoint
@app.get("/health")
def health_check():
    """Sistem sağlık kontrolü"""
    return {
        "status": "healthy",
        "timestamp": "2024-01-01T00:00:00Z",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD
    )
