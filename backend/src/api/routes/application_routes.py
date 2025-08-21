from fastapi import APIRouter, Body
from typing import Dict
from ...services.application_service import application_service

router = APIRouter()

@router.post("/create-manual")
async def create_manual_application(application_data: Dict = Body(...)):
    """Manuel olarak yeni başvuru oluştur"""
    user_id = application_data.get("userId")
    if not user_id:
        return {
            "success": False,
            "error": "User ID gerekli",
            "message": "Lütfen userId alanını doldurun"
        }
    return application_service.create_manual_application(user_id, application_data)

# Bu endpoint kaldırıldı - çakışmayı önlemek için
# @router.post("/analyze-job-posting")
# async def analyze_job_posting(job_data: Dict = Body(...)):
#     """AI ile iş ilanını analiz et ve bilgileri çıkar"""
#     try:
#         result = application_service.analyze_job_posting(job_data)
#         return result
#     except Exception as e:
#         raise

@router.get("/{user_id}")
async def get_applications(user_id: str):
    """Kullanıcının başvurularını getir"""
    return application_service.get_applications(user_id)

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
