from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from ...models.schemas import (
    ApplicationData, 
    ApplicationUpdateData, 
    ModelSearchData,
    TextData
)
from ...services.application_service import application_service

router = APIRouter()

@router.post("/applications")
async def create_application(
    application: ApplicationData,
    user_id: str
):
    """Yeni iş başvurusu oluştur ve ChromaDB'ye kaydet"""
    try:
        application_dict = application.dict()
        application_id = application_service.save_application_to_chroma(application_dict, user_id)
        
        return {
            "success": True,
            "message": "Başvuru başarıyla oluşturuldu",
            "application_id": application_id
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Başvuru oluşturma hatası: {str(e)}",
            "message": "Başvuru oluşturulamadı"
        }

@router.put("/applications/{application_id}")
async def update_application(
    application_id: str,
    application_update: ApplicationUpdateData,
    user_id: str
):
    """ChromaDB'deki iş başvurusunu güncelle"""
    try:
        update_dict = application_update.dict(exclude_unset=True)
        success = application_service.update_application_in_chroma(
            application_id, update_dict, user_id
        )
        
        if success:
            return {
                "success": True,
                "message": "Başvuru başarıyla güncellendi"
            }
        else:
            return {
                "success": False,
                "error": "Başvuru bulunamadı",
                "message": "Güncellenecek başvuru bulunamadı"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Başvuru güncelleme hatası: {str(e)}",
            "message": "Başvuru güncellenemedi"
        }

@router.delete("/applications/{application_id}")
async def delete_application(
    application_id: str,
    user_id: str
):
    """ChromaDB'den iş başvurusunu sil"""
    try:
        success = application_service.delete_application_from_chroma(
            application_id, user_id
        )
        
        if success:
            return {
                "success": True,
                "message": "Başvuru başarıyla silindi"
            }
        else:
            return {
                "success": False,
                "error": "Başvuru bulunamadı",
                "message": "Silinecek başvuru bulunamadı"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Başvuru silme hatası: {str(e)}",
            "message": "Başvuru silinemedi"
        }

@router.get("/applications")
async def get_applications(user_id: str):
    """ChromaDB'den kullanıcının tüm başvurularını getir"""
    try:
        applications = application_service.get_applications_from_chroma(user_id)
        
        return {
            "success": True,
            "data": applications,
            "count": len(applications)
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Başvuru getirme hatası: {str(e)}",
            "message": "Başvurular getirilemedi"
        }

@router.post("/search/applications")
async def search_applications(
    search_data: ModelSearchData,
    user_id: str
):
    """ChromaDB'de başvurularda semantik arama yap"""
    try:
        results = application_service.search_applications_in_chroma(
            search_data.query, 
            user_id, 
            search_data.limit
        )
        
        return {
            "success": True,
            "data": results,
            "query": search_data.query,
            "count": len(results)
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Başvuru arama hatası: {str(e)}",
            "message": "Arama yapılamadı"
        }

@router.post("/search/emails")
async def search_email_analysis(
    search_data: ModelSearchData,
    user_id: str
):
    """ChromaDB'de e-posta analizlerinde semantik arama yap"""
    try:
        results = application_service.search_email_analysis_in_chroma(
            search_data.query, 
            user_id, 
            search_data.limit
        )
        
        return {
            "success": True,
            "data": results,
            "query": search_data.query,
            "count": len(results)
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"E-posta arama hatası: {str(e)}",
            "message": "E-posta araması yapılamadı"
        }

@router.get("/stats")
async def get_chroma_stats():
    """ChromaDB koleksiyon istatistiklerini getir"""
    try:
        stats = application_service.get_chroma_stats()
        
        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"İstatistik getirme hatası: {str(e)}",
            "message": "ChromaDB istatistikleri getirilemedi"
        }

@router.post("/emails/analysis")
async def save_email_analysis(
    email_data: Dict[str, Any],
    analysis_result: Dict[str, Any],
    user_id: str
):
    """E-posta analiz sonucunu ChromaDB'ye kaydet"""
    try:
        analysis_id = application_service.save_email_analysis_to_chroma(
            email_data, analysis_result, user_id
        )
        
        return {
            "success": True,
            "message": "E-posta analizi başarıyla kaydedildi",
            "analysis_id": analysis_id
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"E-posta analizi kaydetme hatası: {str(e)}",
            "message": "E-posta analizi kaydedilemedi"
        }

@router.get("/health")
async def chroma_health_check():
    """ChromaDB bağlantı durumunu kontrol et"""
    try:
        stats = application_service.get_chroma_stats()
        
        return {
            "success": True,
            "status": "healthy",
            "chroma_db": "connected",
            "stats": stats
        }
    except Exception as e:
        return {
            "success": False,
            "status": "unhealthy",
            "chroma_db": "disconnected",
            "error": str(e)
        }
