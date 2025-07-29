from fastapi import APIRouter, Body, HTTPException
import os
import requests
from typing import Dict, List, Optional
import json
from datetime import datetime

router = APIRouter()

# Gemini API endpoint
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

@router.post("/analyze-emails")
async def analyze_emails(emails_data: Dict = Body(...)):
    """E-postaları AI ile analiz et ve iş başvuru bilgilerini çıkar"""
    try:
        emails = emails_data.get("emails", [])
        if not emails:
            raise HTTPException(status_code=400, detail="Analiz edilecek e-posta bulunamadı")
        
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            raise HTTPException(status_code=500, detail="Gemini API anahtarı bulunamadı")
        
        analyzed_applications = []
        
        for email in emails:
            # E-posta içeriğini AI'ya gönder
            analysis_result = await analyze_single_email(email, gemini_api_key)
            if analysis_result:
                analyzed_applications.append(analysis_result)
        
        return {
            "applications": analyzed_applications,
            "totalFound": len(analyzed_applications),
            "message": f"{len(analyzed_applications)} adet iş başvurusu analiz edildi"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"E-posta analiz hatası: {str(e)}")

async def analyze_single_email(email: Dict, api_key: str) -> Optional[Dict]:
    """Tek bir e-postayı AI ile analiz et"""
    try:
        # AI prompt'u hazırla
        prompt = f"""
        Bu e-posta bir iş başvurusu ile ilgili mi? Eğer evet ise, aşağıdaki bilgileri JSON formatında çıkar:

        E-posta Konusu: {email.get('subject', '')}
        Gönderen: {email.get('sender', '')}
        Tarih: {email.get('date', '')}
        İçerik: {email.get('body', '')}

        Çıkarılacak bilgiler:
        - is_job_application: true/false (bu e-posta iş başvurusu mu?)
        - company_name: Şirket adı
        - position: Pozisyon adı
        - application_status: Başvuru durumu (başvuruldu, mülakat, red, kabul, vb.)
        - next_action: Sonraki adım (CV gönder, mülakat hazırlığı, vb.)
        - deadline: Varsa son tarih
        - contact_person: İletişim kişisi
        - salary_info: Maaş bilgisi (varsa)
        - location: Lokasyon (varsa)
        - requirements: Gereksinimler (varsa)

        Sadece JSON formatında yanıt ver, başka açıklama ekleme.
        """

        # Gemini API'ye gönder
        headers = {
            "Content-Type": "application/json"
        }
        
        data = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ]
        }
        
        url = f"{GEMINI_API_URL}?key={api_key}"
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        
        result = response.json()
        
        # AI yanıtını parse et
        if "candidates" in result and len(result["candidates"]) > 0:
            ai_response = result["candidates"][0]["content"]["parts"][0]["text"]
            
            try:
                # JSON'ı parse et
                analysis = json.loads(ai_response)
                
                # E-posta bilgilerini ekle
                analysis["email_id"] = email.get("id")
                analysis["email_subject"] = email.get("subject")
                analysis["email_sender"] = email.get("sender")
                analysis["email_date"] = email.get("date")
                analysis["analyzed_at"] = datetime.now().isoformat()
                
                return analysis
            
            except json.JSONDecodeError:
                # AI JSON döndürmediyse manuel analiz yap
                return manual_analysis(email)
        
        return manual_analysis(email)
    
    except Exception as e:
        print(f"E-posta analiz hatası: {str(e)}")
        return manual_analysis(email)

def manual_analysis(email: Dict) -> Dict:
    """Manuel e-posta analizi (AI başarısız olursa)"""
    subject = email.get("subject", "").lower()
    body = email.get("body", "").lower()
    sender = email.get("sender", "")
    
    # Basit keyword analizi
    is_job_app = any(keyword in subject or keyword in body for keyword in [
        "application", "apply", "job", "position", "vacancy", "hiring", "recruitment"
    ])
    
    if not is_job_app:
        return None
    
    # Şirket adını çıkar
    company_name = extract_company_name(sender, subject)
    
    # Pozisyon adını çıkar
    position = extract_position(subject, body)
    
    # Durumu belirle
    status = determine_status(subject, body)
    
    return {
        "is_job_application": True,
        "company_name": company_name,
        "position": position,
        "application_status": status,
        "next_action": "Detaylı inceleme gerekli",
        "email_id": email.get("id"),
        "email_subject": email.get("subject"),
        "email_sender": email.get("sender"),
        "email_date": email.get("date"),
        "analyzed_at": datetime.now().isoformat()
    }

def extract_company_name(sender: str, subject: str) -> str:
    """E-posta göndereninden şirket adını çıkar"""
    # Gmail formatından şirket adını çıkar
    if "<" in sender and ">" in sender:
        # "Company Name <email@company.com>" formatı
        return sender.split("<")[0].strip()
    elif "@" in sender:
        # "email@company.com" formatı
        domain = sender.split("@")[1]
        return domain.split(".")[0].title()
    else:
        return sender

def extract_position(subject: str, body: str) -> str:
    """Konu ve içerikten pozisyon adını çıkar"""
    # Pozisyon için yaygın keyword'ler
    position_keywords = [
        "developer", "engineer", "analyst", "manager", "designer", 
        "specialist", "coordinator", "assistant", "consultant"
    ]
    
    for keyword in position_keywords:
        if keyword in subject.lower():
            # Konudan pozisyon adını çıkar
            words = subject.split()
            for i, word in enumerate(words):
                if keyword in word.lower():
                    # Önceki ve sonraki kelimeleri de al
                    start = max(0, i-2)
                    end = min(len(words), i+3)
                    return " ".join(words[start:end])
    
    return "Pozisyon belirlenemedi"

def determine_status(subject: str, body: str) -> str:
    """E-posta içeriğinden başvuru durumunu belirle"""
    subject_lower = subject.lower()
    body_lower = body.lower()
    
    if any(word in subject_lower or word in body_lower for word in ["interview", "mülakat"]):
        return "Mülakat Daveti"
    elif any(word in subject_lower or word in body_lower for word in ["rejected", "red", "başarısız"]):
        return "Red"
    elif any(word in subject_lower or word in body_lower for word in ["accepted", "kabul", "offer", "teklif"]):
        return "Kabul"
    elif any(word in subject_lower or word in body_lower for word in ["application", "başvuru", "apply"]):
        return "Başvuruldu"
    else:
        return "Bilinmiyor"

@router.post("/save-applications")
async def save_applications(applications_data: Dict = Body(...)):
    """Analiz edilen başvuruları kaydet"""
    try:
        applications = applications_data.get("applications", [])
        
        # Burada veritabanına kaydetme işlemi yapılacak
        # Şimdilik sadece başarı mesajı döndürüyoruz
        
        return {
            "message": f"{len(applications)} adet başvuru kaydedildi",
            "saved_count": len(applications)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Başvuru kaydetme hatası: {str(e)}")

@router.get("/applications/{user_id}")
async def get_user_applications(user_id: str):
    """Kullanıcının kayıtlı başvurularını getir"""
    try:
        # Burada veritabanından kullanıcının başvurularını çekme işlemi yapılacak
        # Şimdilik boş liste döndürüyoruz
        
        return {
            "applications": [],
            "message": "Başvurular getirildi"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Başvuru getirme hatası: {str(e)}") 