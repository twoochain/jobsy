from fastapi import APIRouter, Body, HTTPException
import os
from typing import Dict, Optional
from datetime import datetime, timedelta
import base64
import httpx
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me"
gmail_tokens: Dict[str, Dict] = {}

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GMAIL_REDIRECT_URI = os.getenv("GMAIL_REDIRECT_URI")

if not all([GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GMAIL_REDIRECT_URI]):
    raise Exception("Gmail OAuth config missing in environment variables")

@router.post("/connect-gmail")
async def connect_gmail(user_data: Dict = Body(...)):
    user_id = user_data.get("userId")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID gerekli")
    
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={GMAIL_REDIRECT_URI}&"
        "scope=https://www.googleapis.com/auth/gmail.readonly%20openid%20email&"
        "response_type=code&"
        "access_type=offline&"
        f"state={user_id}&"
        "prompt=consent"
    )
    
    return {"authUrl": auth_url, "message": "Gmail bağlantısı başlatıldı"}

@router.post("/gmail/callback")
async def gmail_callback(data: Dict = Body(...)):
    code = data.get("code")
    state = data.get("state")
    if not code or not state:
        raise HTTPException(status_code=400, detail="Eksik code veya state")

    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": GMAIL_REDIRECT_URI,
    }

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(token_url, data=token_data)
            resp.raise_for_status()
            token_info = resp.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"Token alma hatası: {str(e)}")

    user_id = state
    expires_in = token_info.get("expires_in", 3600)
    gmail_tokens[user_id] = {
        "access_token": token_info.get("access_token"),
        "refresh_token": token_info.get("refresh_token"),
        "expires_at": datetime.utcnow() + timedelta(seconds=expires_in),
    }

    return {"message": "Gmail bağlantısı başarılı", "userId": user_id}

@router.post("/disconnect-gmail")
async def disconnect_gmail(user_data: Dict = Body(...)):
    user_id = user_data.get("userId")
    if user_id in gmail_tokens:
        del gmail_tokens[user_id]
    return {"message": "Gmail bağlantısı kesildi"}

async def refresh_gmail_token(user_id: str):
    token_info = gmail_tokens.get(user_id)
    if not token_info:
        raise Exception("User token not found")
    
    refresh_token = token_info.get("refresh_token")
    if not refresh_token:
        raise Exception("Refresh token bulunamadı")

    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token"
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(token_url, data=token_data)
        resp.raise_for_status()
        new_token_info = resp.json()
    
    expires_in = new_token_info.get("expires_in", 3600)
    gmail_tokens[user_id].update({
        "access_token": new_token_info.get("access_token"),
        "expires_at": datetime.utcnow() + timedelta(seconds=expires_in)
    })

async def get_email_detail(message_id: str, headers: Dict) -> Optional[Dict]:
    url = f"{GMAIL_API_BASE}/messages/{message_id}"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            message_data = resp.json()
        except httpx.HTTPError as e:
            print(f"E-posta detay alma hatası: {e}")
            return None

    payload = message_data.get("payload", {})
    headers_data = payload.get("headers", [])

    subject = next((h["value"] for h in headers_data if h["name"] == "Subject"), "")
    sender = next((h["value"] for h in headers_data if h["name"] == "From"), "")
    date = next((h["value"] for h in headers_data if h["name"] == "Date"), "")

    body = ""
    if "parts" in payload:
        for part in payload["parts"]:
            if part.get("mimeType") == "text/plain":
                body_data = part.get("body", {}).get("data", "")
                if body_data:
                    body = base64.urlsafe_b64decode(body_data).decode("utf-8")
                    break

    return {
        "id": message_id,
        "subject": subject,
        "sender": sender,
        "date": date,
        "body": body[:500] + "..." if len(body) > 500 else body,
        "snippet": message_data.get("snippet", "")
    }

@router.post("/scan-emails")
async def scan_emails(user_data: Dict = Body(...)):
    user_id = user_data.get("userId")
    if user_id not in gmail_tokens:
        raise HTTPException(status_code=400, detail="Gmail hesabı bağlı değil")

    token_info = gmail_tokens[user_id]

    if datetime.utcnow() > token_info["expires_at"]:
        await refresh_gmail_token(user_id)
        token_info = gmail_tokens[user_id]

    headers = {
        "Authorization": f"Bearer {token_info['access_token']}",
        "Content-Type": "application/json"
    }

    query = (
        "subject:(application OR apply OR job OR position OR vacancy OR hiring OR recruitment) "
        "OR body:(application OR apply OR job OR position OR vacancy OR hiring OR recruitment)"
    )

    search_url = f"{GMAIL_API_BASE}/messages"
    params = {
        "q": query,
        "maxResults": 50
    }

    async with httpx.AsyncClient() as client:
        resp = await client.get(search_url, headers=headers, params=params)
        resp.raise_for_status()
        messages_data = resp.json()

    messages = messages_data.get("messages", [])
    job_emails = []
    for message in messages[:10]:
        email_detail = await get_email_detail(message["id"], headers)
        if email_detail:
            job_emails.append(email_detail)

    return {
        "emailCount": len(job_emails),
        "emails": job_emails,
        "message": f"{len(job_emails)} adet iş başvuru e-postası bulundu"
    }
