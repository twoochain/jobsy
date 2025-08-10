from fastapi import APIRouter, Body, HTTPException
from typing import Dict
from ...services.application_service import application_service

router = APIRouter(prefix="/applications", tags=["Applications"])

@router.post("/save")
async def save_applications(applications_data: Dict = Body(...)):
    """Analiz edilen başvuruları kaydet"""
    applications = applications_data.get("applications", [])
    user_id = applications_data.get("userId")
    
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID gerekli")
    
    return application_service.save_applications(applications, user_id)

@router.get("/{user_id}")
async def get_user_applications(user_id: str):
    """Kullanıcının kayıtlı başvurularını getir"""
    return application_service.get_user_applications(user_id)

@router.get("/debug/{user_id}")
async def debug_user_applications(user_id: str):
    """Debug için kullanıcının tüm başvurularını getir"""
    return application_service.debug_user_applications(user_id)

@router.delete("/{user_id}/{application_id}")
async def delete_application(user_id: str, application_id: int):
    """Belirli bir başvuruyu sil"""
    return application_service.delete_application(user_id, application_id)

@router.put("/{user_id}/{application_id}")
async def update_application(user_id: str, application_id: int, application_data: Dict = Body(...)):
    """Başvuru bilgilerini güncelle"""
    return application_service.update_application(user_id, application_id, application_data)

@router.get("/{user_id}/{application_id}/email")
async def get_application_email(user_id: str, application_id: int):
    """Başvuruya ait email içeriğini getir"""
    return application_service.get_application_email(user_id, application_id)
