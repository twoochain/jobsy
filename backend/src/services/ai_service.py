import requests
from typing import Dict, Any
from fastapi import HTTPException
from ..config.settings import settings
from ..utils.helpers import make_api_request

class AIService:
    """AI entegrasyonu için servis sınıfı"""
    
    def __init__(self):
        self.gemini_api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
        self.hf_base_url = "https://api-inference.huggingface.co"
    
    def generate_ai_response(self, prompt: str) -> Dict[str, Any]:
        """AI prompt'u işler ve yanıt döner"""
        try:
            if not settings.GEMINI_API_KEY:
                raise HTTPException(status_code=400, detail="Gemini API anahtarı bulunamadı.")
            
            url = f"{self.gemini_api_url}?key={settings.GEMINI_API_KEY}"
            data = {
                "contents": [
                    {"parts": [{"text": prompt}]}
                ]
            }
            
            response = make_api_request(url, method="POST", json_data=data)
            return response
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI yanıt hatası: {str(e)}")
    
    def analyze_text_with_gemini(self, text: str) -> Dict[str, Any]:
        """Metni Gemini ile analiz eder"""
        try:
            if not settings.GEMINI_API_KEY:
                raise HTTPException(status_code=400, detail="Gemini API anahtarı bulunamadı.")
            
            prompt = f"Aşağıdaki e-posta bir iş/staj başvurusu içeriyor mu? Yanıtın sadece 'evet' ya da 'hayır' olsun. E-posta içeriği:\n\n{text}"
            
            url = f"{self.gemini_api_url}?key={settings.GEMINI_API_KEY}"
            data = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt}
                        ]
                    }
                ]
            }
            
            response = make_api_request(url, method="POST", json_data=data)
            return response
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Gemini analiz hatası: {str(e)}")
    
    def summarize_text_with_hf(self, text: str) -> Dict[str, Any]:
        """Metni Hugging Face ile özetler"""
        try:
            if not settings.MODEL_ID:
                raise HTTPException(status_code=400, detail="MODEL_ID bulunamadı.")
            
            url = f"{self.hf_base_url}/models/{settings.MODEL_ID}"
            data = {"inputs": text}
            
            response = make_api_request(url, method="POST", headers=settings.HEADERS, json_data=data)
            return response
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Hugging Face özetleme hatası: {str(e)}")
    
    def search_hf_models(self, query: str, limit: int = 10) -> Dict[str, Any]:
        """Hugging Face modellerini arar"""
        try:
            url = f"{settings.BASE_URL}/models"
            params = {"search": query, "limit": limit}
            
            response = make_api_request(url, headers=settings.HEADERS, params=params)
            return response
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Model arama hatası: {str(e)}")
    
    def get_model_details(self, model_id: str) -> Dict[str, Any]:
        """Model detaylarını getirir"""
        try:
            url = f"{settings.BASE_URL}/models/{model_id}"
            
            response = make_api_request(url, headers=settings.HEADERS)
            return response
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Model detay hatası: {str(e)}")
    
    def hf_inference(self, model_id: str, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Hugging Face inference yapar"""
        try:
            url = f"{self.hf_base_url}/models/{model_id}"
            
            response = make_api_request(url, method="POST", headers=settings.HEADERS, json_data=inputs)
            return response
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Inference hatası: {str(e)}")
    
    def mock_ai_response(self, prompt: str) -> Dict[str, Any]:
        """Mock AI yanıtı (test için)"""
        return {
            "prompt": prompt,
            "ai_response": f"AI cevabı (mock): '{prompt}' ifadesini analiz ettim."
        }

# Global servis instance'ı
ai_service = AIService()
