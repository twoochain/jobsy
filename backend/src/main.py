from fastapi import FastAPI
from .config.settings import settings
from .api.middleware.cors import setup_cors
from .api.routes import gmail_routes, email_analyzer_routes, application_routes, ai_routes

# FastAPI uygulamasını oluştur
app = FastAPI(
    title="Jobsy AI API", 
    description="Hugging Face ve Gemini API entegrasyonu ile iş başvuru takip sistemi",
    version="1.0.0"
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
        "endpoints": {
            "gmail": "/gmail/*",
            "analyze": "/analyze/*", 
            "applications": "/applications/*",
            "ai": "/ai/*"
        },
        "docs": "/docs",
        "redoc": "/redoc"
    }

# Route'ları dahil et
app.include_router(gmail_routes.router)
app.include_router(email_analyzer_routes.router)
app.include_router(application_routes.router)
app.include_router(ai_routes.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, 
        host=settings.HOST, 
        port=settings.PORT, 
        reload=settings.RELOAD
    )
