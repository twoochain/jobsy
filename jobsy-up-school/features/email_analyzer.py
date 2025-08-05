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
        
        for i, email in enumerate(emails):
            print(f"\nE-posta {i+1} analiz ediliyor: {email.get('subject', '')}")
            # E-posta içeriğini AI'ya gönder
            analysis_result = await analyze_single_email(email, gemini_api_key)
            if analysis_result:
                analyzed_applications.append(analysis_result)
                print(f"  ✓ Başvuru olarak kabul edildi")
            else:
                print(f"  ✗ Başvuru olarak kabul edilmedi")
        
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
        # AI prompt'u hazırla - Daha esnek kriterler
        prompt = f"""
        Analyze this email to determine if it's related to a job or internship application process. 
        The email can be in English, Turkish, or any other language. Be flexible in your analysis.

        Email Subject: {email.get('subject', '')}
        Sender: {email.get('sender', '')}
        Date: {email.get('date', '')}
        Content: {email.get('body', '')}

        ACCEPT these situations (be generous):
        - Any mention of job application, interview, technical test, assessment
        - Application status updates, confirmations, rejections
        - Interview invitations, scheduling, reminders
        - Technical tests, coding challenges, assignments
        - Job offers, acceptances, rejections
        - Any email from companies about hiring process
        - Event invitations related to job applications
        - Documents or guides for application process

        REJECT only these:
        - Pure marketing emails
        - Product advertisements
        - Newsletter subscriptions
        - Unrelated spam

        If this email could be related to job application process, extract information in JSON:

        {{
            "is_job_application": true/false,
            "application_type": "job" or "internship",
            "company_name": "Company name",
            "position": "Position title",
            "application_status": "Application status",
            "next_action": "Next step",
            "deadline": "Deadline if any",
            "contact_person": "Contact person",
            "salary_info": "Salary information if any",
            "location": "Location if any",
            "requirements": "Requirements if any"
        }}

        If this email is clearly not related to job applications, return:
        {{"is_job_application": false}}

        Respond only in JSON format.
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
                
                # AI analizi başarılıysa kullan
                if analysis.get("is_job_application", False):
                    # E-posta bilgilerini ekle
                    analysis["email_id"] = email.get("id")
                    analysis["email_subject"] = email.get("subject")
                    analysis["email_sender"] = email.get("sender")
                    analysis["email_date"] = email.get("date")
                    analysis["analyzed_at"] = datetime.now().isoformat()
                    analysis["analysis_method"] = "AI"
                    
                    print(f"AI analizi başarılı: {email.get('subject', '')}")
                    return analysis
                else:
                    print(f"AI analizi reddetti: {email.get('subject', '')}")
            
            except json.JSONDecodeError:
                print(f"AI JSON parse hatası: {email.get('subject', '')}")
        
        # AI başarısız olursa veya reddederse manuel analiz yap
        print(f"Manuel analiz deneniyor: {email.get('subject', '')}")
        manual_result = manual_analysis(email)
        if manual_result:
            manual_result["analysis_method"] = "Manual"
            print(f"Manuel analiz başarılı: {email.get('subject', '')}")
        else:
            print(f"Manuel analiz de reddetti: {email.get('subject', '')}")
        
        return manual_result
    
    except Exception as e:
        print(f"E-posta analiz hatası: {str(e)}")
        return manual_analysis(email)

def manual_analysis(email: Dict) -> Dict:
    """Manuel e-posta analizi (AI başarısız olursa)"""
    subject = email.get("subject", "").lower()
    body = email.get("body", "").lower()
    sender = email.get("sender", "")
    
    # Basit keyword analizi - temel başvuru süreçleri
    positive_keywords = [
    # Başvuru süreci ve sonuçlar
    "application", "başvuru", "applied", "başvurdunuz",
    "interview", "mülakat", "technical interview", "teknik mülakat",
    "interview invitation", "mülakat daveti", "interview scheduled", "mülakat planlandı",
    "technical test", "teknik test", "coding challenge", "kodlama testi",
    "assessment", "değerlendirme", "assignment", "görev",
    "offer", "iş teklifi", "staj teklifi", "kabul", "accepted",
    "rejected", "declined", "not selected", "red", "olumsuz", "elendi",
    
    # Pozisyon / Rol
    "job", "iş", "internship", "staj", "position", "pozisyon", "role", "görev",
    
    # Etkinlikler ve katılım
    "etkinlik", "etkinliğe katılım", "katılım", "katıl", "katılımcı",
    "zoom", "çevrim içi toplantı", "online toplantı", "online görüşme",
    "toplantı kimliği", "parola", "katılım linki", "katılmak için tıkla",
    "takvim", "calendar invite", "zoom link", "background image", "arka plan",
    
    # Doküman ve ekler
    "el kitapçığı", "rehber", "bilgi dokümanı", "doküman", "ek dosya", "attachment"
    ]

    
    # Reddedilecek keyword'ler
    negative_keywords = [
    "unsubscribe", "abonelikten çık", "opt-out", 
    "promotion", "promosyon", "discount", "indirim", "kupon", "coupon", 
    "product", "purchase", "satın al", "ürün", "store", "shop",
    "marketing", "advertisement", "spam", "kampanya"
    ]
    
    # Önce reddedilecek keyword'leri kontrol et
    for keyword in negative_keywords:
        if keyword in subject or keyword in body:
            print(f"  Reddedildi (negatif keyword): {keyword}")
            return None
    
    # Sonra pozitif keyword'leri kontrol et
    found_keywords = []
    for keyword in positive_keywords:
        if keyword in subject or keyword in body:
            found_keywords.append(keyword)
    
    if not found_keywords:
        print(f"  Reddedildi (pozitif keyword bulunamadı)")
        return None
    
    print(f"  Kabul edildi (bulunan keyword'ler: {found_keywords})")
    
    # Şirket adını çıkar
    company_name = extract_company_name(sender, subject)
    
    # Pozisyon adını çıkar
    position = extract_position(subject, body)
    
    # Durumu belirle
    status = determine_status(subject, body)
    
    # Application type belirle
    application_type = "internship" if any(keyword in subject.lower() or keyword in body.lower() 
                                          for keyword in ["internship", "staj", "stajyer"]) else "job"
    
    return {
        "is_job_application": True,
        "application_type": application_type,
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
    # Basit pozisyon keyword'leri
    position_keywords = [
        "developer", "engineer", "analyst", "manager", "designer", 
        "specialist", "coordinator", "assistant", "consultant",
        "geliştirici", "mühendis", "analist", "yönetici", "tasarımcı",
        "uzman", "koordinatör", "asistan", "danışman"
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
    
    # Basit durum belirleme
    if any(word in subject_lower or word in body_lower for word in ["interview", "mülakat"]):
        return "Interview Invitation"
    elif any(word in subject_lower or word in body_lower for word in ["rejected", "red"]):
        return "Rejected"
    elif any(word in subject_lower or word in body_lower for word in ["accepted", "kabul", "offer", "teklif"]):
        return "Accepted"
    elif any(word in subject_lower or word in body_lower for word in ["technical test", "teknik test", "coding challenge", "kodlama testi"]):
        return "Technical Test"
    elif any(word in subject_lower or word in body_lower for word in ["application", "başvuru"]):
        return "Applied"
    else:
        return "Unknown"

 