from fastapi import APIRouter, HTTPException
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
        raise HTTPException(status_code=500, detail=str(e))
