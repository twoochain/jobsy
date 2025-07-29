from fastapi import FastAPI, Query, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
import os
import requests
from dotenv import load_dotenv
from features.ai_example import router as ai_router
from features.gmail_integration import router as gmail_router
from features.email_analyzer import router as analyzer_router

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_ID = os.getenv("MODEL_ID")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

app = FastAPI(title="Jobsy AI API", description="Hugging Face ve Gemini API entegrasyonu")

# CORS ayarları - Frontend ile iletişim için
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HEADERS = {"Authorization": f"Bearer {HF_TOKEN}"} if HF_TOKEN else {}
BASE_URL = "https://huggingface.co/api"

@app.get("/")
def root():
    return {"message": "Jobsy AI API çalışıyor!", "endpoints": ["/search-models", "/model-details/{model_id}", "/hf-inference", "/gemini-inference", "/ai/prompt"]}

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

@app.post("/gemini-inference")
def gemini_inference(
    prompt: str = Body(..., description="Prompt for Gemini API"),
):
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

# AI router'ı dahil et
app.include_router(ai_router)
app.include_router(gmail_router)
app.include_router(analyzer_router)
