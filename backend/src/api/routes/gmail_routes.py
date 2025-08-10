from fastapi import APIRouter, Body, HTTPException
from typing import Dict
from ...services.gmail_service import gmail_service

router = APIRouter(prefix="/gmail", tags=["Gmail"])

@router.post("/connect")
async def connect_gmail(user_data: Dict = Body(...)):
    """Gmail bağlantısını başlat"""
    user_id = user_data.get("userId")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID gerekli")
    
    auth_url = gmail_service.get_auth_url(user_id)
    return {"authUrl": auth_url, "message": "Gmail bağlantısı başlatıldı"}

@router.post("/callback")
async def gmail_callback(data: Dict = Body(...)):
    """Gmail OAuth callback'i işler"""
    code = data.get("code")
    state = data.get("state")
    
    if not code or not state:
        raise HTTPException(status_code=400, detail="Eksik code veya state")
    
    return await gmail_service.handle_callback(code, state)

@router.post("/disconnect")
async def disconnect_gmail(user_data: Dict = Body(...)):
    """Gmail bağlantısını kes"""
    user_id = user_data.get("userId")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID gerekli")
    
    return gmail_service.disconnect_user(user_id)

@router.get("/status/{user_id}")
async def check_gmail_status(user_id: str):
    """Gmail bağlantı durumunu kontrol et"""
    is_connected = gmail_service.is_connected(user_id)
    return {"connected": is_connected, "userId": user_id}

@router.post("/scan")
async def scan_emails(user_data: Dict = Body(...)):
    """İş başvurusu e-postalarını tara"""
    user_id = user_data.get("userId")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID gerekli")
    
    return await gmail_service.scan_emails(user_id)
