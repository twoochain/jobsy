from fastapi import APIRouter, Body, Query
from typing import Dict, Any
from ...services.ai_service import ai_service

router = APIRouter(prefix="/ai", tags=["AI"])

@router.post("/prompt")
def ai_prompt(prompt: str = Body(..., description="AI prompt")):
    """AI prompt'u işler"""
    return ai_service.mock_ai_response(prompt)

@router.get("/prompt")
def ai_prompt_get():
    """AI prompt endpoint bilgisi"""
    return {"message": "AI prompt endpoint - POST kullanın"}

@router.post("/gemini-inference")
async def gemini_inference(prompt: str = Body(..., description="Prompt for Gemini API")):
    """Gemini API ile inference yapar"""
    return await ai_service.generate_ai_response(prompt)

@router.post("/gemini-analyze")
async def gemini_analyze(text: str = Body(..., description="Analiz edilecek e-posta içeriği")):
    """E-posta içeriğini Gemini ile analiz eder"""
    return await ai_service.analyze_text_with_gemini(text)

@router.post("/analyze-job-posting")
async def analyze_job_posting_with_gemini(job_data: Dict[str, Any] = Body(..., description="Analiz edilecek iş ilanı")):
    """İş ilanını Gemini ile detaylı analiz eder"""
    job_text = job_data.get("job_text", "")
    if not job_text:
        return {
            "success": False,
            "error": "İş ilanı metni gerekli",
            "message": "Lütfen job_text alanını doldurun"
        }
    return await ai_service.analyze_job_posting_with_gemini(job_text)

@router.post("/analyze-job-posting-mock")
def analyze_job_posting_mock(job_data: Dict[str, Any] = Body(..., description="Analiz edilecek iş ilanı (Mock)")):
    """İş ilanını mock olarak analiz eder (API key gerektirmez)"""
    job_text = job_data.get("job_text", "")
    if not job_text:
        return {
            "success": False,
            "error": "İş ilanı metni gerekli",
            "message": "Lütfen job_text alanını doldurun"
        }
    
    # Mock analiz sonucu
    return {
        "success": True,
        "data": {
            "company_name": "Mock Şirket",
            "position": "Mock Pozisyon",
            "location": "Mock Lokasyon",
            "salary_info": "Mock Maaş Bilgisi",
            "requirements": "Mock Gereksinimler",
            "benefits": "Mock Avantajlar",
            "application_type": "job",
            "contact_info": "mock@example.com",
            "deadline": "2024-12-31",
            "company_description": "Mock şirket açıklaması",
            "description": "Mock iş pozisyonu detaylı açıklaması ve sorumlulukları",
            "field": "Mock İş Alanı",
            "duration": "Mock Süre",
            "is_paid": True,
            "application_status": "active"
        },
        "message": "İlan mock olarak analiz edildi (API key gerekmez)"
    }

@router.post("/summarize")
async def summarize_text(text: str = Body(..., description="Özetlenecek metin")):
    """Metni Hugging Face ile özetler"""
    return await ai_service.summarize_text_with_hf(text)

@router.get("/search-models")
async def search_models(query: str = Query(..., description="Model arama sorgusu"), limit: int = 10):
    """Hugging Face modellerini arar"""
    return await ai_service.search_hf_models(query, limit)

@router.get("/model-details/{model_id}")
async def get_model_details(model_id: str):
    """Model detaylarını getirir"""
    return await ai_service.get_model_details(model_id)

@router.post("/hf-inference")
async def hf_inference(model_id: str = Query(..., description="Model ID"), inputs: Dict[str, Any] = Body(...)):
    """Hugging Face inference yapar"""
    return await ai_service.hf_inference(model_id, inputs)
