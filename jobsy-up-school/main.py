from fastapi import FastAPI, Query, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
import os
import requests
from dotenv import load_dotenv
from features.gmail_integration import router as gmail_router
from features.email_analyzer import router as analyzer_router

load_dotenv()

# Environment variables
HF_TOKEN = os.getenv("HF_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_ID = os.getenv("MODEL_ID")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

app = FastAPI(title="Jobsy AI API", description="Hugging Face ve Gemini API entegrasyonu")

# CORS ayarları - Frontend ile iletişim için
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HEADERS = {"Authorization": f"Bearer {HF_TOKEN}"} if HF_TOKEN else {}
BASE_URL = "https://huggingface.co/api"

@app.get("/")
def root():
    return {
        "message": "Jobsy AI API çalışıyor!", 
        "endpoints": [
            "/search-models", 
            "/model-details/{model_id}", 
            "/hf-inference", 
            "/gemini-inference", 
            "/ai/prompt",
            "/summarize",
            "/gemini-analyze"
        ]
    }

@app.get("/search-models")
def search_models(query: str = Query(..., description="Model arama sorgusu"), limit: int = 10):
    url = f"{BASE_URL}/models"
    params = {"search": query, "limit": limit}
    try:
        r = requests.get(url, params=params, headers=HEADERS)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model-details/{model_id}")
def get_model_details(model_id: str):
    url = f"{BASE_URL}/models/{model_id}"
    try:
        r = requests.get(url, headers=HEADERS)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/hf-inference")
def hf_inference(model_id: str = Query(..., description="Model ID"), inputs: dict = Body(...)):
    url = f"https://api-inference.huggingface.co/models/{model_id}"
    try:
        r = requests.post(url, headers=HEADERS, json=inputs)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize")
def summarize_text(text: str = Body(..., description="Özetlenecek metin")):
    """Express server'deki /summarize endpoint'inin FastAPI versiyonu"""
    if not MODEL_ID:
        raise HTTPException(status_code=400, detail="MODEL_ID bulunamadı.")
    
    url = f"https://api-inference.huggingface.co/models/{MODEL_ID}"
    try:
        r = requests.post(url, headers=HEADERS, json={"inputs": text})
        r.raise_for_status()
        return r.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/gemini-inference")
def gemini_inference(prompt: str = Body(..., description="Prompt for Gemini API")):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=400, detail="Gemini API anahtarı bulunamadı.")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_API_KEY}"
    data = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ]
    }
    try:
        r = requests.post(url, json=data)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/gemini-analyze")
def gemini_analyze(text: str = Body(..., description="Analiz edilecek e-posta içeriği")):
    """Express server'deki /gemini-analyze endpoint'inin FastAPI versiyonu"""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=400, detail="Gemini API anahtarı bulunamadı.")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_API_KEY}"
    prompt = f"Aşağıdaki e-posta bir iş/staj başvurusu içeriyor mu? Yanıtın sadece 'evet' ya da 'hayır' olsun. E-posta içeriği:\n\n{text}"
    
    data = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }
    try:
        r = requests.post(url, json=data)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/prompt")
def ai_prompt(prompt: str = Body(..., description="AI prompt")):
    """Basit AI prompt endpoint'i"""
    return {
        "prompt": prompt,
        "ai_response": f"AI cevabı (mock): '{prompt}' ifadesini analiz ettim."
    }

@app.get("/ai/prompt")
def ai_prompt_get():
    return {"message": "AI prompt endpoint - POST kullanın"}

# Feature router'ları dahil et
app.include_router(gmail_router)
app.include_router(analyzer_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True) 