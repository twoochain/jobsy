from fastapi import APIRouter, Body, HTTPException
from typing import Dict, List, Optional
from datetime import datetime
import json

router = APIRouter()

# In-memory storage for applications (in production, this would be a database)
applications_storage: Dict[str, List[Dict]] = {}

@router.post("/save-applications")
async def save_applications(applications_data: Dict = Body(...)):
    """Analiz edilen başvuruları kaydet"""
    try:
        applications = applications_data.get("applications", [])
        user_id = applications_data.get("userId")
        
        print(f"Kaydetme isteği alındı - User ID: {user_id}, Başvuru sayısı: {len(applications)}")
        
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID gerekli")
        
        if user_id not in applications_storage:
            applications_storage[user_id] = []
        
        saved_count = 0
        # Her başvuru için benzersiz ID oluştur
        for app in applications:
            print(f"İşlenen başvuru: {app}")
            if app.get("is_job_application", False):
                # Mevcut başvurularla karşılaştır (email_id ile)
                existing_app = next(
                    (existing for existing in applications_storage[user_id] 
                     if existing.get("email_id") == app.get("email_id")), 
                    None
                )
                
                if not existing_app:
                    # Yeni başvuru ekle
                    app["id"] = len(applications_storage[user_id]) + 1
                    app["created_at"] = datetime.now().isoformat()
                    app["updated_at"] = datetime.now().isoformat()
                    
                    # Application type belirle
                    if "internship" in app.get("position", "").lower() or "staj" in app.get("position", "").lower():
                        app["application_type"] = "internship"
                    else:
                        app["application_type"] = "job"
                    
                    applications_storage[user_id].append(app)
                    saved_count += 1
                    print(f"Yeni başvuru kaydedildi: {app.get('company_name')} - {app.get('position')}")
                else:
                    print(f"Başvuru zaten mevcut: {app.get('email_id')}")
        
        print(f"Toplam kaydedilen: {saved_count}, Toplam başvuru sayısı: {len(applications_storage[user_id])}")
        print(f"Kaydedilen başvurular: {applications_storage[user_id]}")
        
        return {
            "message": f"{len(applications)} adet başvuru işlendi",
            "saved_count": saved_count,
            "total_applications": len(applications_storage[user_id])
        }
    
    except Exception as e:
        print(f"Kaydetme hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Başvuru kaydetme hatası: {str(e)}")

@router.get("/applications/{user_id}")
async def get_user_applications(user_id: str):
    """Kullanıcının kayıtlı başvurularını getir"""
    try:
        print(f"Başvuru getirme isteği - User ID: {user_id}")
        user_applications = applications_storage.get(user_id, [])
        print(f"Kullanıcının toplam başvuru sayısı: {len(user_applications)}")
        
        # Aktif ve tamamlanmış başvuruları ayır
        active_applications = []
        finished_applications = []
        
        for app in user_applications:
            print(f"İşlenen başvuru: {app.get('company_name')} - {app.get('position')} - {app.get('application_status')}")
            status = app.get("application_status", "").lower()
            
            # Tamamlanmış başvurular
            if any(keyword in status for keyword in ["red", "kabul", "accepted", "rejected"]):
                finished_app = {
                    "id": app.get("id"),
                    "company": app.get("company_name", "Bilinmeyen Şirket"),
                    "position": app.get("position", "Bilinmeyen Pozisyon"),
                    "date": app.get("email_date", app.get("created_at", "")),
                    "result": "Kabul" if "kabul" in status or "accepted" in status else "Red",
                    "reason": app.get("next_action", ""),
                    "status": "finished",
                    "stage": app.get("application_status", "Tamamlandı"),
                    "application_type": app.get("application_type", "job"),
                    "contact_person": app.get("contact_person", ""),
                    "location": app.get("location", ""),
                    "salary_info": app.get("salary_info", ""),
                    "requirements": app.get("requirements", ""),
                    "deadline": app.get("deadline", ""),
                    "email_id": app.get("email_id"),
                    "email_subject": app.get("email_subject"),
                    "email_sender": app.get("email_sender"),
                    "created_at": app.get("created_at"),
                    "updated_at": app.get("updated_at")
                }
                finished_applications.append(finished_app)
                print(f"Tamamlanmış başvuru eklendi: {finished_app['company']}")
            else:
                # Aktif başvurular
                active_app = {
                    "id": app.get("id"),
                    "company": app.get("company_name", "Bilinmeyen Şirket"),
                    "position": app.get("position", "Bilinmeyen Pozisyon"),
                    "date": app.get("email_date", app.get("created_at", "")),
                    "stage": app.get("application_status", "Başvuruldu"),
                    "tasks": [app.get("next_action", "Detaylı inceleme")] if app.get("next_action") else [],
                    "status": "active" if "mülakat" in status or "interview" in status else "pending",
                    "stageOrder": get_stage_order(app.get("application_status", "")),
                    "application_type": app.get("application_type", "job"),
                    "contact_person": app.get("contact_person", ""),
                    "location": app.get("location", ""),
                    "salary_info": app.get("salary_info", ""),
                    "requirements": app.get("requirements", ""),
                    "deadline": app.get("deadline", ""),
                    "email_id": app.get("email_id"),
                    "email_subject": app.get("email_subject"),
                    "email_sender": app.get("email_sender"),
                    "created_at": app.get("created_at"),
                    "updated_at": app.get("updated_at")
                }
                active_applications.append(active_app)
                print(f"Aktif başvuru eklendi: {active_app['company']}")
        
        print(f"Toplam aktif: {len(active_applications)}, Toplam tamamlanmış: {len(finished_applications)}")
        print(f"Döndürülen aktif başvurular: {active_applications}")
        print(f"Döndürülen tamamlanmış başvurular: {finished_applications}")
        
        return {
            "active_applications": active_applications,
            "finished_applications": finished_applications,
            "total_active": len(active_applications),
            "total_finished": len(finished_applications),
            "message": "Başvurular getirildi"
        }
    
    except Exception as e:
        print(f"Başvuru getirme hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Başvuru getirme hatası: {str(e)}")

@router.get("/debug/applications/{user_id}")
async def debug_user_applications(user_id: str):
    """Debug için kullanıcının tüm başvurularını getir"""
    try:
        print(f"Debug başvuru getirme isteği - User ID: {user_id}")
        user_applications = applications_storage.get(user_id, [])
        print(f"Kullanıcının ham başvuru verisi: {user_applications}")
        
        return {
            "raw_applications": user_applications,
            "total_count": len(user_applications),
            "user_id": user_id
        }
    
    except Exception as e:
        print(f"Debug başvuru getirme hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Debug başvuru getirme hatası: {str(e)}")

def get_stage_order(stage: str) -> int:
    """Başvuru aşamasına göre sıralama değeri döndür"""
    stage_lower = stage.lower()
    
    if "başvuruldu" in stage_lower or "application" in stage_lower:
        return 1
    elif "ilk görüşme" in stage_lower or "first" in stage_lower:
        return 2
    elif "mülakat" in stage_lower or "interview" in stage_lower:
        return 3
    elif "test" in stage_lower:
        return 4
    elif "teklif" in stage_lower or "offer" in stage_lower:
        return 5
    else:
        return 0

@router.delete("/applications/{user_id}/{application_id}")
async def delete_application(user_id: str, application_id: int):
    """Belirli bir başvuruyu sil"""
    try:
        if user_id not in applications_storage:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
        
        user_applications = applications_storage[user_id]
        application = next((app for app in user_applications if app.get("id") == application_id), None)
        
        if not application:
            raise HTTPException(status_code=404, detail="Başvuru bulunamadı")
        
        applications_storage[user_id] = [app for app in user_applications if app.get("id") != application_id]
        
        return {"message": "Başvuru silindi"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Başvuru silme hatası: {str(e)}")

@router.put("/applications/{user_id}/{application_id}")
async def update_application(user_id: str, application_id: int, application_data: Dict = Body(...)):
    """Başvuru bilgilerini güncelle"""
    try:
        if user_id not in applications_storage:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
        
        user_applications = applications_storage[user_id]
        application_index = next((i for i, app in enumerate(user_applications) if app.get("id") == application_id), None)
        
        if application_index is None:
            raise HTTPException(status_code=404, detail="Başvuru bulunamadı")
        
        # Başvuru bilgilerini güncelle
        user_applications[application_index].update(application_data)
        user_applications[application_index]["updated_at"] = datetime.now().isoformat()
        
        return {"message": "Başvuru güncellendi"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Başvuru güncelleme hatası: {str(e)}") 