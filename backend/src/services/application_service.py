from typing import Dict, List, Optional
from datetime import datetime
from fastapi import HTTPException

class ApplicationService:
    """Başvuru yönetimi için servis sınıfı"""
    
    def __init__(self):
        # In-memory storage for applications (in production, this would be a database)
        self.applications_storage: Dict[str, List[Dict]] = {}
    
    def save_applications(self, applications: List[Dict], user_id: str) -> Dict:
        """Analiz edilen başvuruları kaydet"""
        try:
            print(f"Kaydetme isteği alındı - User ID: {user_id}, Başvuru sayısı: {len(applications)}")
            
            if not user_id:
                raise HTTPException(status_code=400, detail="User ID gerekli")
            
            if user_id not in self.applications_storage:
                self.applications_storage[user_id] = []
            
            saved_count = 0
            # Her başvuru için benzersiz ID oluştur
            for app in applications:
                print(f"İşlenen başvuru: {app}")
                if app.get("is_job_application", False):
                    # Mevcut başvurularla karşılaştır (email_id ile)
                    existing_app = next(
                        (existing for existing in self.applications_storage[user_id] 
                         if existing.get("email_id") == app.get("email_id")), 
                        None
                    )
                    
                    if not existing_app:
                        # Yeni başvuru ekle
                        app["id"] = len(self.applications_storage[user_id]) + 1
                        app["created_at"] = datetime.now().isoformat()
                        app["updated_at"] = datetime.now().isoformat()
                        
                        # Application type belirle
                        if "internship" in app.get("position", "").lower() or "staj" in app.get("position", "").lower():
                            app["application_type"] = "internship"
                        else:
                            app["application_type"] = "job"
                        
                        # Email içeriğini de sakla
                        if "email_content" not in app:
                            app["email_content"] = app.get("email_body", "")
                        
                        self.applications_storage[user_id].append(app)
                        saved_count += 1
                        print(f"Yeni başvuru kaydedildi: {app.get('company_name')} - {app.get('position')}")
                    else:
                        print(f"Başvuru zaten mevcut: {app.get('email_id')}")
            
            print(f"Toplam kaydedilen: {saved_count}, Toplam başvuru sayısı: {len(self.applications_storage[user_id])}")
            print(f"Kaydedilen başvurular: {self.applications_storage[user_id]}")
            
            return {
                "message": f"{len(applications)} adet başvuru işlendi",
                "saved_count": saved_count,
                "total_applications": len(self.applications_storage[user_id])
            }
        
        except Exception as e:
            print(f"Kaydetme hatası: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Başvuru kaydetme hatası: {str(e)}")
    
    def get_user_applications(self, user_id: str) -> Dict:
        """Kullanıcının kayıtlı başvurularını getir"""
        try:
            print(f"Başvuru getirme isteği - User ID: {user_id}")
            user_applications = self.applications_storage.get(user_id, [])
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
                        "stageOrder": self._get_stage_order(app.get("application_status", "")),
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
    
    def debug_user_applications(self, user_id: str) -> Dict:
        """Debug için kullanıcının tüm başvurularını getir"""
        try:
            print(f"Debug başvuru getirme isteği - User ID: {user_id}")
            user_applications = self.applications_storage.get(user_id, [])
            print(f"Kullanıcının ham başvuru verisi: {user_applications}")
            
            return {
                "raw_applications": user_applications,
                "total_count": len(user_applications),
                "user_id": user_id
            }
        
        except Exception as e:
            print(f"Debug başvuru getirme hatası: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Debug başvuru getirme hatası: {str(e)}")
    
    def delete_application(self, user_id: str, application_id: int) -> Dict:
        """Belirli bir başvuruyu sil"""
        try:
            if user_id not in self.applications_storage:
                raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
            
            user_applications = self.applications_storage[user_id]
            application = next((app for app in user_applications if app.get("id") == application_id), None)
            
            if not application:
                raise HTTPException(status_code=404, detail="Başvuru bulunamadı")
            
            self.applications_storage[user_id] = [app for app in user_applications if app.get("id") != application_id]
            
            return {"message": "Başvuru silindi"}
        
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Başvuru silme hatası: {str(e)}")
    
    def update_application(self, user_id: str, application_id: int, application_data: Dict) -> Dict:
        """Başvuru bilgilerini güncelle"""
        try:
            if user_id not in self.applications_storage:
                raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
            
            user_applications = self.applications_storage[user_id]
            application_index = next((i for i, app in enumerate(user_applications) if app.get("id") == application_id), None)
            
            if application_index is None:
                raise HTTPException(status_code=404, detail="Başvuru bulunamadı")
            
            # Başvuru bilgilerini güncelle
            user_applications[application_index].update(application_data)
            user_applications[application_index]["updated_at"] = datetime.now().isoformat()
            
            return {"message": "Başvuru güncellendi"}
        
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Başvuru güncelleme hatası: {str(e)}")
    
    def get_application_email(self, user_id: str, application_id: int) -> Dict:
        """Başvuruya ait email içeriğini getir"""
        try:
            if user_id not in self.applications_storage:
                raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
            
            user_applications = self.applications_storage[user_id]
            application = next((app for app in user_applications if app.get("id") == application_id), None)
            
            if not application:
                raise HTTPException(status_code=404, detail="Başvuru bulunamadı")
            
            return {
                "email_id": application.get("email_id"),
                "email_subject": application.get("email_subject"),
                "email_sender": application.get("email_sender"),
                "email_date": application.get("email_date"),
                "email_content": application.get("email_content", ""),
                "email_body": application.get("email_body", ""),
                "html_body": application.get("html_body", ""),  # HTML içerik
                "application_id": application_id,
                "company_name": application.get("company_name"),
                "position": application.get("position")
            }
        
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Email getirme hatası: {str(e)}")
    
    def _get_stage_order(self, stage: str) -> int:
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

# Global servis instance'ı
application_service = ApplicationService()
