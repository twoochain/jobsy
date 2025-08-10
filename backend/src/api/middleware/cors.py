from fastapi.middleware.cors import CORSMiddleware
from ...config.settings import settings

def setup_cors(app):
    """CORS middleware'ini ayarlar"""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
