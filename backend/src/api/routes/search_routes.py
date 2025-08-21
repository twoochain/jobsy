from fastapi import APIRouter, Query
from typing import List, Dict, Any, Optional
from ...services.search_service import SearchService
from ...services.application_service import ApplicationService
from ...models.schemas import ApplicationData as Application

router = APIRouter(prefix="/search", tags=["search"])

@router.get("/applications")
async def search_applications(
    user_email: str = Query(..., description="Kullanıcı email adresi"),
    query: str = Query("", description="Arama sorgusu"),
    status: Optional[str] = Query(None, description="Durum filtresi"),
    stage: Optional[str] = Query(None, description="Aşama filtresi"),
    company: Optional[str] = Query(None, description="Şirket filtresi"),
    position: Optional[str] = Query(None, description="Pozisyon filtresi"),
    start_date: Optional[str] = Query(None, description="Başlangıç tarihi (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Bitiş tarihi (YYYY-MM-DD)")
):
    """Başvuruları arama ve filtreleme"""
    
    try:
        # Servisleri başlat
        search_service = SearchService()
        app_service = ApplicationService()
        
        # Kullanıcının başvurularını al
        user_applications = await app_service.get_user_applications(user_email)
        
        # Filtreleri hazırla
        filters = {}
        if status:
            filters['status'] = [status]
        if stage:
            filters['stage'] = [stage]
        if company:
            filters['company'] = company
        if position:
            filters['position'] = position
        if start_date or end_date:
            filters['date_range'] = {}
            if start_date:
                filters['date_range']['start'] = start_date
            if end_date:
                filters['date_range']['end'] = end_date
        
        # Arama yap
        search_results = await search_service.search_applications(
            user_applications, 
            query, 
            filters
        )
        
        return {
            "success": True,
            "data": search_results,
            "message": f"{search_results['total']} sonuç bulundu"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Arama hatası: {str(e)}",
            "message": "Arama yapılırken hata oluştu"
        }

@router.get("/recommendations")
async def get_recommendations(
    user_email: str = Query(..., description="Kullanıcı email adresi")
):
    """AI tabanlı kişiselleştirilmiş öneriler"""
    
    try:
        # Servisleri başlat
        search_service = SearchService()
        app_service = ApplicationService()
        
        # Kullanıcının başvurularını al
        user_applications = await app_service.get_user_applications(user_email)
        
        # Kullanıcı profili (gerçek uygulamada veritabanından alınır)
        user_profile = {
            "skills": ["JavaScript", "React", "Node.js", "Python"],
            "experience": 3,
            "preferred_companies": ["Google", "Microsoft", "Apple"]
        }
        
        # Önerileri oluştur
        recommendations = await search_service.generate_ai_recommendations(
            user_applications, 
            user_profile
        )
        
        return {
            "success": True,
            "data": {
                "recommendations": recommendations,
                "total": len(recommendations),
                "generated_at": search_service._get_current_timestamp()
            },
            "message": f"{len(recommendations)} öneri oluşturuldu"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Öneri hatası: {str(e)}",
            "message": "Öneriler oluşturulurken hata oluştu"
        }

@router.get("/analytics")
async def get_search_analytics(
    user_email: str = Query(..., description="Kullanıcı email adresi")
):
    """Arama ve öneri analitikleri"""
    
    try:
        # Servisleri başlat
        search_service = SearchService()
        app_service = ApplicationService()
        
        # Kullanıcının başvurularını al
        user_applications = await app_service.get_user_applications(user_email)
        
        # Analitik verileri hesapla
        total_applications = len(user_applications)
        active_applications = len([app for app in user_applications if app.status in ['active', 'pending']])
        finished_applications = len([app for app in user_applications if app.status in ['finished', 'rejected', 'accepted']])
        
        # Başarı oranı
        success_rate = 0
        if finished_applications > 0:
            accepted = len([app for app in user_applications if app.status == 'accepted'])
            success_rate = (accepted / finished_applications) * 100
        
        # Aşama dağılımı
        stage_distribution = {}
        for app in user_applications:
            stage = app.stage
            stage_distribution[stage] = stage_distribution.get(stage, 0) + 1
        
        # Şirket dağılımı
        company_distribution = {}
        for app in user_applications:
            company = app.company
            company_distribution[company] = company_distribution.get(company, 0) + 1
        
        return {
            "success": True,
            "data": {
                "total_applications": total_applications,
                "active_applications": active_applications,
                "finished_applications": finished_applications,
                "success_rate": round(success_rate, 2),
                "stage_distribution": stage_distribution,
                "company_distribution": company_distribution,
                "last_updated": search_service._get_current_timestamp()
            },
            "message": "Analitik veriler başarıyla oluşturuldu"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Analitik hatası: {str(e)}",
            "message": "Analitik veriler oluşturulurken hata oluştu"
        }

@router.post("/smart-filter")
async def smart_filter_applications(
    user_email: str = Query(..., description="Kullanıcı email adresi"),
    filter_criteria: Dict[str, Any] = {}
):
    """Akıllı filtreleme ile başvuru arama"""
    
    try:
        # Servisleri başlat
        search_service = SearchService()
        app_service = ApplicationService()
        
        # Kullanıcının başvurularını al
        user_applications = await app_service.get_user_applications(user_email)
        
        # Akıllı filtreleme
        search_results = await search_service.search_applications(
            user_applications, 
            "", 
            filter_criteria
        )
        
        return {
            "success": True,
            "data": search_results,
            "message": f"{search_results['total']} sonuç bulundu"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Filtreleme hatası: {str(e)}",
            "message": "Filtreleme yapılırken hata oluştu"
        }
