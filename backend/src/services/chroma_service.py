import chromadb
from chromadb.config import Settings
import os
import json
from typing import List, Dict, Optional, Any
from datetime import datetime
import uuid
from ..config.chroma_config import ChromaConfig

class ChromaService:
    """ChromaDB ile iş başvuru yönetimi için servis sınıfı"""
    
    def __init__(self, persist_directory: str = None):
        """ChromaDB servisini başlat"""
        self.persist_directory = persist_directory or ChromaConfig.PERSIST_DIRECTORY
        
        # Dizin yoksa oluştur
        os.makedirs(self.persist_directory, exist_ok=True)
        
        # ChromaDB client'ı oluştur
        self.client = self._create_chroma_client()
        
        # Koleksiyonları oluştur
        self._create_collections()
    
    def _create_chroma_client(self):
        """ChromaDB client'ını konfigürasyona göre oluştur"""
        try:
            config = ChromaConfig.get_chroma_client_config()
            
            if config.get("host"):
                # Remote ChromaDB
                return chromadb.HttpClient(
                    host=config["host"],
                    port=config["port"],
                    ssl=config.get("ssl", False),
                    auth_token=config.get("auth_token")
                )
            else:
                # Local ChromaDB
                return chromadb.PersistentClient(
                    path=self.persist_directory,
                    settings=Settings(
                        anonymized_telemetry=False,
                        allow_reset=True
                    )
                )
        except Exception as e:
            print(f"❌ ChromaDB client oluşturma hatası: {e}")
            raise
    
    def _create_collections(self):
        """Gerekli koleksiyonları oluştur"""
        try:
            # İş başvuruları koleksiyonu
            self.applications_collection = self.client.get_or_create_collection(
                name=ChromaConfig.APPLICATIONS_COLLECTION_NAME,
                metadata=ChromaConfig.APPLICATIONS_COLLECTION_METADATA
            )
            
            # E-posta analizleri koleksiyonu
            self.email_analysis_collection = self.client.get_or_create_collection(
                name=ChromaConfig.EMAIL_ANALYSIS_COLLECTION_NAME,
                metadata=ChromaConfig.EMAIL_ANALYSIS_COLLECTION_METADATA
            )
            
            print("✅ ChromaDB koleksiyonları başarıyla oluşturuldu")
            
        except Exception as e:
            print(f"❌ ChromaDB koleksiyon oluşturma hatası: {e}")
            # Hata durumunda basit koleksiyonlar oluştur
            try:
                self.applications_collection = self.client.get_or_create_collection(
                    name="applications"
                )
                self.email_analysis_collection = self.client.get_or_create_collection(
                    name="email_analysis"
                )
                print("✅ Basit koleksiyonlar oluşturuldu")
            except Exception as e2:
                print(f"❌ Kritik hata: {e2}")
                raise
    
    def add_application(self, application_data: Dict[str, Any], user_id: str) -> str:
        """Yeni iş başvurusu ekle"""
        try:
            # Benzersiz ID oluştur
            application_id = str(uuid.uuid4())
            
            # Metadata hazırla - sadece string değerler
            metadata = {
                "user_id": user_id,
                "application_id": application_id,
                "company_name": str(application_data.get("sirket") or application_data.get("company_name", "")),
                "position": str(application_data.get("baslik") or application_data.get("position", "")),
                "application_status": str(application_data.get("durum") or application_data.get("application_status", "")),
                "location": str(application_data.get("konum") or application_data.get("location", "")),
                "field": str(application_data.get("alan", "")),
                "duration": str(application_data.get("sure", "")),
                "is_paid": str(application_data.get("ucretli", False)),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            # Vektör için metin hazırla
            text_for_embedding = self._prepare_text_for_embedding(application_data)
            
            # ChromaDB'ye ekle
            self.applications_collection.add(
                documents=[text_for_embedding],
                metadatas=[metadata],
                ids=[application_id]
            )
            
            print(f"✅ Başvuru başarıyla eklendi: {application_id}")
            return application_id
            
        except Exception as e:
            print(f"❌ Başvuru ekleme hatası: {e}")
            raise
    
    def _prepare_text_for_embedding(self, application_data: Dict[str, Any]) -> str:
        """Vektör için metin hazırla"""
        try:
            # Türkçe ve İngilizce alan adlarını destekle
            text_parts = []
            
            # Temel bilgiler
            if application_data.get("baslik") or application_data.get("position"):
                text_parts.append(f"Pozisyon: {application_data.get('baslik') or application_data.get('position')}")
            
            if application_data.get("sirket") or application_data.get("company_name"):
                text_parts.append(f"Şirket: {application_data.get('sirket') or application_data.get('company_name')}")
            
            if application_data.get("konum") or application_data.get("location"):
                text_parts.append(f"Konum: {application_data.get('konum') or application_data.get('location')}")
            
            if application_data.get("aciklama") or application_data.get("description"):
                text_parts.append(f"Açıklama: {application_data.get('aciklama') or application_data.get('description')}")
            
            # Gereksinimler
            requirements = application_data.get("gereksinimler") or application_data.get("requirements", [])
            if requirements:
                if isinstance(requirements, list):
                    text_parts.append(f"Gereksinimler: {', '.join(map(str, requirements))}")
                else:
                    text_parts.append(f"Gereksinimler: {str(requirements)}")
            
            # Avantajlar
            advantages = application_data.get("avantajlar") or application_data.get("advantages", [])
            if advantages:
                if isinstance(advantages, list):
                    text_parts.append(f"Avantajlar: {', '.join(map(str, advantages))}")
                else:
                    text_parts.append(f"Avantajlar: {str(advantages)}")
            
            # Diğer alanlar
            if application_data.get("alan"):
                text_parts.append(f"Alan: {application_data.get('alan')}")
            
            if application_data.get("sure"):
                text_parts.append(f"Süre: {application_data.get('sure')}")
            
            if application_data.get("ucretli") is not None:
                text_parts.append(f"Ücretli: {'Evet' if application_data.get('ucretli') else 'Hayır'}")
            
            return " | ".join(text_parts) if text_parts else "İş başvurusu"
            
        except Exception as e:
            print(f"⚠️ Metin hazırlama hatası: {e}")
            return "İş başvurusu"
    
    def search_applications(self, query: str, user_id: str, limit: int = 10) -> Dict[str, Any]:
        """İş başvurularında arama yap"""
        try:
            # Kullanıcı bazlı filtreleme
            where_filter = {"user_id": user_id}
            
            # Arama yap
            results = self.applications_collection.query(
                query_texts=[query],
                n_results=limit,
                where=where_filter
            )
            
            return {
                "success": True,
                "query": query,
                "results": results,
                "count": len(results["ids"][0]) if results["ids"] else 0
            }
            
        except Exception as e:
            print(f"❌ Arama hatası: {e}")
            return {
                "success": False,
                "error": str(e),
                "query": query,
                "results": {"ids": [], "documents": [], "metadatas": []},
                "count": 0
            }
    
    def get_user_applications(self, user_id: str, limit: int = 50) -> Dict[str, Any]:
        """Kullanıcının tüm başvurularını getir"""
        try:
            results = self.applications_collection.get(
                where={"user_id": user_id},
                limit=limit
            )
            
            return {
                "success": True,
                "user_id": user_id,
                "applications": results,
                "count": len(results["ids"]) if results["ids"] else 0
            }
            
        except Exception as e:
            print(f"❌ Başvuru getirme hatası: {e}")
            return {
                "success": False,
                "error": str(e),
                "user_id": user_id,
                "applications": {"ids": [], "documents": [], "metadatas": []},
                "count": 0
            }
    
    def delete_application(self, application_id: str, user_id: str) -> bool:
        """Başvuruyu sil"""
        try:
            # Önce başvurunun kullanıcıya ait olduğunu kontrol et
            results = self.applications_collection.get(
                ids=[application_id],
                where={"user_id": user_id}
            )
            
            if not results["ids"]:
                return False
            
            # Başvuruyu sil
            self.applications_collection.delete(ids=[application_id])
            print(f"✅ Başvuru başarıyla silindi: {application_id}")
            return True
            
        except Exception as e:
            print(f"❌ Başvuru silme hatası: {e}")
            return False
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """Koleksiyon istatistikleri"""
        try:
            count = self.applications_collection.count()
            return {
                "success": True,
                "collection_name": "applications",
                "total_documents": count,
                "embedding_model": "all-MiniLM-L6-v2",
                "vector_space": "cosine"
            }
        except Exception as e:
            print(f"❌ İstatistik hatası: {e}")
            return {
                "success": False,
                "error": str(e),
                "collection_name": "applications",
                "total_documents": 0
            }
