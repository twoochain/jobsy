import os
from typing import List, Optional
from dotenv import load_dotenv

# Environment dosyasını yükle
load_dotenv()

class Settings:
    """Uygulama ayarları"""
    
    # API Keys
    HF_TOKEN: Optional[str] = os.getenv("HF_TOKEN")
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    # Model ID for Hugging Face
    MODEL_ID: Optional[str] = os.getenv("MODEL_ID", "sentence-transformers/all-MiniLM-L6-v2")
    
    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: Optional[str] = os.getenv("GOOGLE_CLIENT_SECRET")
    
    # Hugging Face
    BASE_URL: str = "https://huggingface.co/api"
    
    # CORS Settings
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ]
    
    # Server Settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    RELOAD: bool = os.getenv("RELOAD", "false").lower() == "true"  # Windows'ta false olarak ayarlandı
    
    # ChromaDB Settings
    CHROMA_PERSIST_DIRECTORY: str = os.getenv("CHROMA_PERSIST_DIRECTORY", "data/chroma")
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")
    
    @property
    def headers(self) -> dict:
        """Hugging Face API headers"""
        if self.HF_TOKEN:
            return {"Authorization": f"Bearer {self.HF_TOKEN}"}
        return {}
    
    def validate(self) -> bool:
        """Ayarları doğrula"""
        required_vars = []
        warnings = []
        
        # Kritik API key'ler için uyarılar
        if not self.GEMINI_API_KEY:
            warnings.append("GEMINI_API_KEY bulunamadı - Gemini özellikleri devre dışı")
            print("⚠️ GEMINI_API_KEY bulunamadı - Gemini özellikleri devre dışı")
        
        if not self.HF_TOKEN:
            warnings.append("HF_TOKEN bulunamadı - Hugging Face özellikleri devre dışı")
            print("⚠️ HF_TOKEN bulunamadı - Hugging Face özellikleri devre dışı")
        
        if not self.GOOGLE_CLIENT_ID or not self.GOOGLE_CLIENT_SECRET:
            warnings.append("Google OAuth bilgileri eksik - Gmail özellikleri devre dışı")
            print("⚠️ Google OAuth bilgileri eksik - Gmail özellikleri devre dışı")
        
        # Zorunlu olanlar
        if not required_vars:
            if warnings:
                print(f"⚠️ Uyarılar: {len(warnings)} adet")
                for warning in warnings:
                    print(f"   - {warning}")
            return True
        
        print(f"❌ Eksik environment variables: {', '.join(required_vars)}")
        return False
    
    def print_summary(self):
        """Ayarları özetle"""
        print("🔧 Uygulama Ayarları:")
        print(f"   Host: {self.HOST}")
        print(f"   Port: {self.PORT}")
        print(f"   Reload: {self.RELOAD}")
        print(f"   Log Level: {self.LOG_LEVEL}")
        print(f"   ChromaDB: {self.CHROMA_PERSIST_DIRECTORY}")
        print(f"   CORS Origins: {len(self.ALLOWED_ORIGINS)}")
        print(f"   HF Token: {'✅' if self.HF_TOKEN else '❌'}")
        print(f"   Gemini API: {'✅' if self.GEMINI_API_KEY else '❌'}")
        print(f"   Google OAuth: {'✅' if self.GOOGLE_CLIENT_ID else '❌'}")

# Settings instance'ı oluştur
settings = Settings()

# Ayarları doğrula
if not settings.validate():
    print("⚠️ Bazı ayarlar eksik, uygulama sınırlı özelliklerle çalışacak")

# Başlangıçta özet yazdır
if __name__ == "__main__":
    settings.print_summary()
