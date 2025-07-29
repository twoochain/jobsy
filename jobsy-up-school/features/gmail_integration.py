from fastapi import APIRouter, Body, HTTPException
import os
import requests
from typing import Dict, List, Optional
import json
from datetime import datetime, timedelta

router = APIRouter()

# Gmail API endpoints
GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me"

# In-memory storage for tokens (production'da database kullanın)
gmail_tokens = {}

@router.post("/connect-gmail")
async def connect_gmail(user_data: Dict = Body(...)):
    """Gmail OAuth2 bağlantısı başlat"""
    try:
        user_id = user_data.get("userId")
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID gerekli")
        
        # Google OAuth2 URL oluştur
        google_client_id = os.getenv("GOOGLE_CLIENT_ID")
        redirect_uri = "http://localhost:3000/api/auth/gmail/callback"
        
        auth_url = (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={google_client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"scope=https://www.googleapis.com/auth/gmail.readonly&"
            f"response_type=code&"
            f"access_type=offline&"
            f"state={user_id}"
        )
        
        return {"authUrl": auth_url, "message": "Gmail bağlantısı başlatıldı"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gmail bağlantı hatası: {str(e)}")

@router.post("/gmail/callback")
async def gmail_callback(data: Dict = Body(...)):
    code = data.get("code")
    state = data.get("state")
    """Gmail OAuth2 callback - token al"""
    try:
        google_client_id = os.getenv("GOOGLE_CLIENT_ID")
        google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        redirect_uri = "http://localhost:3000/api/auth/gmail/callback"
        
        # Access token al
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "client_id": google_client_id,
            "client_secret": google_client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri
        }
        
        response = requests.post(token_url, data=token_data)
        response.raise_for_status()
        
        token_info = response.json()
        user_id = state
        
        # Token'ı sakla
        gmail_tokens[user_id] = {
            "access_token": token_info.get("access_token"),
            "refresh_token": token_info.get("refresh_token"),
            "expires_at": datetime.now() + timedelta(seconds=token_info.get("expires_in", 3600))
        }
        
        return {"message": "Gmail bağlantısı başarılı", "userId": user_id}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Token alma hatası: {str(e)}")

@router.post("/disconnect-gmail")
async def disconnect_gmail(user_data: Dict = Body(...)):
    """Gmail bağlantısını kes"""
    try:
        user_id = user_data.get("userId")
        if user_id in gmail_tokens:
            del gmail_tokens[user_id]
        
        return {"message": "Gmail bağlantısı kesildi"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bağlantı kesme hatası: {str(e)}")

@router.post("/scan-emails")
async def scan_emails(user_data: Dict = Body(...)):
    """Gmail'den iş başvuru e-postalarını tara"""
    try:
        user_id = user_data.get("userId")
        
        if user_id not in gmail_tokens:
            raise HTTPException(status_code=400, detail="Gmail hesabı bağlı değil")
        
        token_info = gmail_tokens[user_id]
        
        # Token'ı yenile (gerekirse)
        if datetime.now() > token_info["expires_at"]:
            await refresh_gmail_token(user_id)
            token_info = gmail_tokens[user_id]
        
        headers = {
            "Authorization": f"Bearer {token_info['access_token']}",
            "Content-Type": "application/json"
        }
        
        # İş başvuru e-postalarını ara
        query = "subject:(application OR apply OR job OR position OR vacancy OR hiring OR recruitment) OR body:(application OR apply OR job OR position OR vacancy OR hiring OR recruitment)"
        
        search_url = f"{GMAIL_API_BASE}/messages"
        params = {
            "q": query,
            "maxResults": 50
        }
        
        response = requests.get(search_url, headers=headers, params=params)
        response.raise_for_status()
        
        messages_data = response.json()
        messages = messages_data.get("messages", [])
        
        # E-posta detaylarını al
        job_emails = []
        for message in messages[:10]:  # İlk 10 e-postayı işle
            email_detail = await get_email_detail(message["id"], headers)
            if email_detail:
                job_emails.append(email_detail)
        
        return {
            "emailCount": len(job_emails),
            "emails": job_emails,
            "message": f"{len(job_emails)} adet iş başvuru e-postası bulundu"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"E-posta tarama hatası: {str(e)}")

async def get_email_detail(message_id: str, headers: Dict) -> Optional[Dict]:
    """E-posta detaylarını al"""
    try:
        url = f"{GMAIL_API_BASE}/messages/{message_id}"
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        message_data = response.json()
        payload = message_data.get("payload", {})
        
        # E-posta başlıklarını al
        headers_data = payload.get("headers", [])
        subject = next((h["value"] for h in headers_data if h["name"] == "Subject"), "")
        sender = next((h["value"] for h in headers_data if h["name"] == "From"), "")
        date = next((h["value"] for h in headers_data if h["name"] == "Date"), "")
        
        # E-posta içeriğini al
        body = ""
        if "parts" in payload:
            for part in payload["parts"]:
                if part.get("mimeType") == "text/plain":
                    body_data = part.get("body", {}).get("data", "")
                    if body_data:
                        import base64
                        body = base64.urlsafe_b64decode(body_data).decode("utf-8")
                        break
        
        return {
            "id": message_id,
            "subject": subject,
            "sender": sender,
            "date": date,
            "body": body[:500] + "..." if len(body) > 500 else body,  # İlk 500 karakter
            "snippet": message_data.get("snippet", "")
        }
    
    except Exception as e:
        print(f"E-posta detay alma hatası: {str(e)}")
        return None

async def refresh_gmail_token(user_id: str):
    """Gmail access token'ını yenile"""
    try:
        token_info = gmail_tokens[user_id]
        refresh_token = token_info.get("refresh_token")
        
        if not refresh_token:
            raise Exception("Refresh token bulunamadı")
        
        google_client_id = os.getenv("GOOGLE_CLIENT_ID")
        google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "client_id": google_client_id,
            "client_secret": google_client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }
        
        response = requests.post(token_url, data=token_data)
        response.raise_for_status()
        
        new_token_info = response.json()
        
        gmail_tokens[user_id] = {
            "access_token": new_token_info.get("access_token"),
            "refresh_token": refresh_token,
            "expires_at": datetime.now() + timedelta(seconds=new_token_info.get("expires_in", 3600))
        }
    
    except Exception as e:
        print(f"Token yenileme hatası: {str(e)}")
        raise 