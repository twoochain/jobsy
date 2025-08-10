from fastapi import APIRouter, Body, Query, HTTPException
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
def gemini_inference(prompt: str = Body(..., description="Prompt for Gemini API")):
    """Gemini API ile inference yapar"""
    return ai_service.generate_ai_response(prompt)

@router.post("/gemini-analyze")
def gemini_analyze(text: str = Body(..., description="Analiz edilecek e-posta içeriği")):
    """E-posta içeriğini Gemini ile analiz eder"""
    return ai_service.analyze_text_with_gemini(text)

@router.post("/summarize")
def summarize_text(text: str = Body(..., description="Özetlenecek metin")):
    """Metni Hugging Face ile özetler"""
    return ai_service.summarize_text_with_hf(text)

@router.get("/search-models")
def search_models(query: str = Query(..., description="Model arama sorgusu"), limit: int = 10):
    """Hugging Face modellerini arar"""
    return ai_service.search_hf_models(query, limit)

@router.get("/model-details/{model_id}")
def get_model_details(model_id: str):
    """Model detaylarını getirir"""
    return ai_service.get_model_details(model_id)

@router.post("/hf-inference")
def hf_inference(model_id: str = Query(..., description="Model ID"), inputs: Dict[str, Any] = Body(...)):
    """Hugging Face inference yapar"""
    return ai_service.hf_inference(model_id, inputs)
