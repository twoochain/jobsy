from fastapi import APIRouter, Body

router = APIRouter()

@router.post("/ai/prompt")
def ai_prompt(prompt: str = Body(..., description="AI prompt")):
    # Burada gerçek Gemini API entegrasyonu yapılabilir
    # Şimdilik örnek bir yanıt dönüyoruz
    return {
        "prompt": prompt,
        "ai_response": f"AI cevabı (mock): '{prompt}' ifadesini analiz ettim."
    }

@router.get("/ai/prompt")
def ai_prompt_get():
    return {"message": "AI prompt endpoint - POST kullanın"} 