from fastapi import APIRouter
from typing import List, Dict
from ...services.email_analyzer_service import email_analyzer_service
from ...models.schemas import EmailAnalysisRequest

router = APIRouter(prefix="/analyze", tags=["Email Analysis"])

@router.post("/emails")
async def analyze_emails(request: EmailAnalysisRequest):
    """E-postaları analiz et ve iş başvurusu bilgilerini çıkar"""
    try:
        result = await email_analyzer_service.analyze_emails(request.emails)
        return result
    except Exception as e:
        return {
            "success": False,
            "error": f"E-posta analiz hatası: {str(e)}",
            "message": "E-postalar analiz edilirken hata oluştu"
        }

@router.post("/scan-emails")
async def scan_emails(request: EmailAnalysisRequest):
    """E-postaları tara ve analiz et (Frontend uyumluluğu için)"""
    try:
        result = await email_analyzer_service.analyze_emails(request.emails)
        return result
    except Exception as e:
        return {
            "success": False,
            "error": f"E-posta tarama hatası: {str(e)}",
            "message": "E-postalar taranırken hata oluştu"
        }
