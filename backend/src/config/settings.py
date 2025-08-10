import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    """Uygulama ayarları"""
    
    # API Keys
    HF_TOKEN = os.getenv("HF_TOKEN")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    MODEL_ID = os.getenv("MODEL_ID")
    
    # Google OAuth
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    
    # Hugging Face
    BASE_URL = "https://huggingface.co/api"
    HEADERS = {"Authorization": f"Bearer {HF_TOKEN}"} if HF_TOKEN else {}
    
    # CORS Settings
    ALLOWED_ORIGINS = [
        "http://localhost:3000", 
        "http://127.0.0.1:3000"
    ]
    
    # Server Settings
    HOST = "0.0.0.0"
    PORT = 8000
    RELOAD = True

settings = Settings()
