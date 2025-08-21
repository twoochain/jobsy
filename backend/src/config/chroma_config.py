import os
from typing import Optional

class ChromaConfig:
    """ChromaDB konfigürasyon ayarları"""
    
    # ChromaDB persist directory - data/chroma olarak düzeltildi
    PERSIST_DIRECTORY: str = os.getenv("CHROMA_PERSIST_DIRECTORY", "data/chroma")
    
    # ChromaDB host (eğer remote kullanılıyorsa)
    CHROMA_HOST: Optional[str] = os.getenv("CHROMA_HOST", None)
    
    # ChromaDB port (eğer remote kullanılıyorsa)
    CHROMA_PORT: Optional[int] = int(os.getenv("CHROMA_PORT", "8000")) if os.getenv("CHROMA_PORT") else None
    
    # ChromaDB SSL ayarları
    CHROMA_SSL: bool = os.getenv("CHROMA_SSL", "false").lower() == "true"
    
    # ChromaDB authentication
    CHROMA_AUTH_TOKEN: Optional[str] = os.getenv("CHROMA_AUTH_TOKEN", None)
    
    # Embedding model ayarları
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    
    # Vektör boyutu
    VECTOR_DIMENSION: int = int(os.getenv("VECTOR_DIMENSION", "384"))
    
    # Arama sonuç limiti
    DEFAULT_SEARCH_LIMIT: int = int(os.getenv("DEFAULT_SEARCH_LIMIT", "10"))
    
    # Maksimum arama sonuç limiti
    MAX_SEARCH_LIMIT: int = int(os.getenv("MAX_SEARCH_LIMIT", "100"))
    
    # ChromaDB collection metadata
    APPLICATIONS_COLLECTION_NAME: str = "job_applications"
    EMAIL_ANALYSIS_COLLECTION_NAME: str = "email_analysis"
    
    # Collection metadata - ChromaDB sadece basit değerleri destekler
    APPLICATIONS_COLLECTION_METADATA = {
        "description": "İş başvuru verileri ve vektör temsilleri",
        "type": "job_applications",
        "version": "1.0.0",
        "language_support": "tr,en"
    }
    
    EMAIL_ANALYSIS_COLLECTION_METADATA = {
        "description": "E-posta analiz sonuçları ve vektör temsilleri",
        "type": "email_analysis",
        "version": "1.0.0"
    }
    
    @classmethod
    def get_chroma_client_config(cls) -> dict:
        """ChromaDB client konfigürasyonunu döndür"""
        config = {
            "path": cls.PERSIST_DIRECTORY,
            "settings": {
                "anonymized_telemetry": False,
                "allow_reset": True
            }
        }
        
        # Remote ChromaDB kullanılıyorsa
        if cls.CHROMA_HOST:
            config["host"] = cls.CHROMA_HOST
            config["port"] = cls.CHROMA_PORT
            config["ssl"] = cls.CHROMA_SSL
            
            if cls.CHROMA_AUTH_TOKEN:
                config["auth_token"] = cls.CHROMA_AUTH_TOKEN
        
        return config
    
    @classmethod
    def get_embedding_config(cls) -> dict:
        """Embedding model konfigürasyonunu döndür"""
        return {
            "model_name": cls.EMBEDDING_MODEL,
            "vector_dimension": cls.VECTOR_DIMENSION
        }
    
    @classmethod
    def get_search_config(cls) -> dict:
        """Arama konfigürasyonunu döndür"""
        return {
            "default_limit": cls.DEFAULT_SEARCH_LIMIT,
            "max_limit": cls.MAX_SEARCH_LIMIT
        }
