import os
from typing import Dict, Optional
from datetime import datetime, timedelta
import base64
import httpx
from fastapi import HTTPException
from ..config.settings import settings
import re
import json
import base64
import httpx
from datetime import datetime, timedelta
from typing import Dict, Optional
from fastapi import HTTPException
from urllib.parse import urlencode
from ..config.settings import settings
from bs4 import BeautifulSoup

class GmailService:
    """Gmail entegrasyonu için servis sınıfı"""
    
    def __init__(self):
        self.gmail_api_base = "https://gmail.googleapis.com/gmail/v1/users/me"
        self.gmail_tokens: Dict[str, Dict] = {}
        self.gmail_redirect_uri = os.getenv("GMAIL_REDIRECT_URI", "http://localhost:3000/api/google/gmail/callback")
        
        if not all([settings.GOOGLE_CLIENT_ID, settings.GOOGLE_CLIENT_SECRET]):
            raise Exception("Gmail OAuth config missing in environment variables")
    
    def get_auth_url(self, user_id: str) -> str:
        """Gmail OAuth URL'sini oluşturur"""
        return (
            "https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={settings.GOOGLE_CLIENT_ID}&"
            f"redirect_uri={self.gmail_redirect_uri}&"
            "scope=https://www.googleapis.com/auth/gmail.readonly%20openid%20email&"
            "response_type=code&"
            "access_type=offline&"
            f"state={user_id}&"
            "prompt=consent"
        )
    
    async def handle_callback(self, code: str, state: str) -> Dict:
        """OAuth callback'i işler"""
        if not code or not state:
            raise HTTPException(status_code=400, detail="Eksik code veya state")

        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": self.gmail_redirect_uri,
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
        self.gmail_tokens[user_id] = {
            "access_token": token_info.get("access_token"),
            "refresh_token": token_info.get("refresh_token"),
            "expires_at": datetime.utcnow() + timedelta(seconds=expires_in),
        }

        return {"message": "Gmail bağlantısı başarılı", "userId": user_id}
    
    def disconnect_user(self, user_id: str) -> Dict:
        """Kullanıcının Gmail bağlantısını keser"""
        if user_id in self.gmail_tokens:
            del self.gmail_tokens[user_id]
        return {"message": "Gmail bağlantısı kesildi"}
    
    def is_connected(self, user_id: str) -> bool:
        """Kullanıcının Gmail bağlantısının durumunu kontrol eder"""
        return user_id in self.gmail_tokens
    
    async def refresh_token(self, user_id: str) -> None:
        """Access token'ı yeniler"""
        token_info = self.gmail_tokens.get(user_id)
        if not token_info:
            raise Exception("User token not found")
        
        refresh_token = token_info.get("refresh_token")
        if not refresh_token:
            raise Exception("Refresh token bulunamadı")

        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }

        async with httpx.AsyncClient() as client:
            resp = await client.post(token_url, data=token_data)
            resp.raise_for_status()
            new_token_info = resp.json()
        
        expires_in = new_token_info.get("expires_in", 3600)
        self.gmail_tokens[user_id].update({
            "access_token": new_token_info.get("access_token"),
            "expires_at": datetime.utcnow() + timedelta(seconds=expires_in)
        })
    
    async def get_email_detail(self, message_id: str, headers: Dict) -> Optional[Dict]:
        """E-posta detaylarını alır - HTML desteği ile"""
        url = f"{self.gmail_api_base}/messages/{message_id}"
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

        # HTML ve plain text içeriği al
        body = self._extract_email_body(payload)
        
        # HTML'i düz metne çevir
        plain_text_body = self._html_to_text(body)

        return {
            "id": message_id,
            "subject": subject,
            "sender": sender,
            "date": date,
            "body": plain_text_body,
            "html_body": body,  # Orijinal HTML içerik
            "snippet": message_data.get("snippet", "")
        }

    def _extract_email_body(self, payload: Dict) -> str:
        """E-posta gövdesini çıkarır - HTML ve plain text desteği ile"""
        body = ""
        
        # Tek parça e-posta
        if "body" in payload and payload.get("body", {}).get("data"):
            mime_type = payload.get("mimeType", "")
            if mime_type in ["text/plain", "text/html"]:
                body_data = payload["body"]["data"]
                body = base64.urlsafe_b64decode(body_data).decode("utf-8", errors="ignore")
        
        # Çok parçalı e-posta
        elif "parts" in payload:
            # Önce plain text ara
            for part in payload["parts"]:
                if part.get("mimeType") == "text/plain":
                    if part.get("body", {}).get("data"):
                        body_data = part["body"]["data"]
                        body = base64.urlsafe_b64decode(body_data).decode("utf-8", errors="ignore")
                        break
            
            # Plain text bulunamazsa HTML ara
            if not body:
                for part in payload["parts"]:
                    if part.get("mimeType") == "text/html":
                        if part.get("body", {}).get("data"):
                            body_data = part["body"]["data"]
                            body = base64.urlsafe_b64decode(body_data).decode("utf-8", errors="ignore")
                            break
            
            # Alt parçalarda ara
            if not body:
                for part in payload["parts"]:
                    if "parts" in part:
                        body = self._extract_email_body(part)
                        if body:
                            break
        
        return body

    def _html_to_text(self, html_content: str) -> str:
        """HTML içeriğini düz metne çevirir"""
        if not html_content:
            return ""
        
        try:
            # BeautifulSoup ile HTML'i parse et
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Script ve style etiketlerini kaldır
            for script in soup(["script", "style"]):
                script.decompose()
            
            # Metni al
            text = soup.get_text()
            
            # Satır sonlarını temizle
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = ' '.join(chunk for chunk in chunks if chunk)
            
            # HTML entities'leri decode et
            text = text.replace('&nbsp;', ' ')
            text = text.replace('&amp;', '&')
            text = text.replace('&lt;', '<')
            text = text.replace('&gt;', '>')
            text = text.replace('&quot;', '"')
            text = text.replace('&#39;', "'")
            
            return text
            
        except Exception as e:
            print(f"HTML to text dönüştürme hatası: {e}")
            # Hata durumunda basit regex ile temizle
            import re
            text = re.sub(r'<[^>]+>', '', html_content)
            text = re.sub(r'\s+', ' ', text)
            return text.strip()
    
    async def scan_emails(self, user_id: str) -> Dict:
        """İş başvurusu e-postalarını tarar - Basit filtreleme sistemi"""
        if user_id not in self.gmail_tokens:
            raise HTTPException(status_code=400, detail="Gmail hesabı bağlı değil")

        token_info = self.gmail_tokens[user_id]

        if datetime.utcnow() > token_info["expires_at"]:
            await self.refresh_token(user_id)
            token_info = self.gmail_tokens[user_id]

        headers = {
            "Authorization": f"Bearer {token_info['access_token']}",
            "Content-Type": "application/json"
        }

        # Basit filtreleme stratejisi
        all_messages = []
        
        # Ana sorgular - iş başvurusu ile ilgili e-postalar (daha spesifik)
        search_queries = [
            # Başvuru yanıtları - çok spesifik
            "subject:(application received OR başvurunuz alındı OR başvurunuz iletildi OR application submitted OR başvurdunuz OR applied OR başvurunuz ulaştı)",
            
            # Mülakat davetleri - spesifik
            "subject:(interview invitation OR mülakat daveti OR görüşme daveti OR interview scheduled OR mülakat planlandı OR meeting invitation OR görüşme planlandı)",
            
            # Teknik test davetleri - spesifik
            "subject:(technical test OR teknik test OR coding challenge OR kodlama testi OR assessment invitation OR değerlendirme daveti OR test daveti)",
            
            # İş teklifi ve sonuçlar - spesifik
            "subject:(job offer OR iş teklifi OR offer letter OR teklif mektubu OR congratulations OR tebrikler OR unfortunately OR maalesef OR red OR kabul)",
            
            # Etkinlik davetleri - spesifik
            "subject:(hackathon OR ideathon OR workshop OR webinar OR etkinlik daveti OR event invitation OR davet)"
        ]
        
        print(f"E-posta tarama başlatılıyor...")
        
        # Sorguları çalıştır
        for i, query in enumerate(search_queries, 1):
            print(f"Sorgu {i}: {query[:50]}...")
            
            search_url = f"{self.gmail_api_base}/messages"
            params = {
                "q": query,
                "maxResults": 25
            }

            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.get(search_url, headers=headers, params=params)
                    resp.raise_for_status()
                    messages_data = resp.json()

                messages = messages_data.get("messages", [])
                if messages:
                    print(f"  Sorgu {i} sonucu: {len(messages)} e-posta bulundu")
                    all_messages.extend(messages)
                else:
                    print(f"  Sorgu {i} sonucu: E-posta bulunamadı")
                    
            except Exception as e:
                print(f"  Sorgu {i} hatası: {str(e)}")
                continue

        # Tekrarlanan mesajları kaldır
        unique_messages = []
        seen_ids = set()
        for message in all_messages:
            if message.get("id") not in seen_ids:
                unique_messages.append(message)
                seen_ids.add(message.get("id"))

        print(f"Toplam benzersiz e-posta sayısı: {len(unique_messages)}")
        
        # E-posta detaylarını al
        job_emails = []
        for i, message in enumerate(unique_messages[:50]):  # En fazla 50 e-posta işle
            print(f"E-posta {i+1}/{len(unique_messages)} detayları alınıyor...")
            email_detail = await self.get_email_detail(message["id"], headers)
            if email_detail:
                job_emails.append(email_detail)

        return {
            "emails": job_emails,
            "totalFound": len(job_emails),
            "message": f"{len(job_emails)} adet potansiyel iş başvurusu e-postası bulundu"
        }

# Global servis instance'ı
gmail_service = GmailService()
