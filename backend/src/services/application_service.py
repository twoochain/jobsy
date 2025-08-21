import json
import re
import os
from datetime import datetime
from typing import Dict, List, Optional
import requests
from bs4 import BeautifulSoup
from .chroma_service import ChromaService

class ApplicationService:
    """Başvuru yönetimi için servis sınıfı"""
    
    def __init__(self):
        # Data directory oluştur
        self.data_dir = "data"
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
        
        # ChromaDB servisini başlat
        self.chroma_service = ChromaService()
        
        # In-memory storage for applications (in production, this would be a database)
        self.applications_storage: Dict[str, List[Dict]] = {}
        
        # Cache sistemi - aynı metin için tekrar analiz yapılmasını önler
        self.analysis_cache: Dict[str, Dict] = {}
        
        # Compile edilmiş regex pattern'ları (performans için)
        self._compile_regex_patterns()
        
        # Mevcut verileri yükle
        self._load_all_applications()
    
    def _get_user_data_file(self, user_id: str) -> str:
        """Kullanıcı için veri dosyası yolunu döndür"""
        safe_user_id = user_id.replace('@', '_at_').replace('.', '_dot_')
        return os.path.join(self.data_dir, f"applications_{safe_user_id}.json")
    
    def _load_all_applications(self):
        """Tüm kullanıcıların verilerini JSON dosyalarından yükle"""
        try:
            for filename in os.listdir(self.data_dir):
                if filename.startswith("applications_") and filename.endswith(".json"):
                    file_path = os.path.join(self.data_dir, filename)
                    with open(file_path, 'r', encoding='utf-8') as f:
                        user_data = json.load(f)
                        # User ID'yi dosya adından çıkar
                        user_id = filename.replace("applications_", "").replace(".json", "").replace("_at_", "@").replace("_dot_", ".")
                        self.applications_storage[user_id] = user_data
                        print(f"Kullanıcı verileri yüklendi: {user_id} - {len(user_data)} başvuru")
        except Exception as e:
            print(f"Veri yükleme hatası: {e}")
    
    def _save_user_applications(self, user_id: str):
        """Kullanıcının başvurularını JSON dosyasına kaydet"""
        try:
            file_path = self._get_user_data_file(user_id)
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(self.applications_storage.get(user_id, []), f, ensure_ascii=False, indent=2)
            print(f"Kullanıcı verileri kaydedildi: {user_id}")
        except Exception as e:
            print(f"Veri kaydetme hatası: {e}")
            raise Exception(status_code=500, detail="Veriler kaydedilemedi")
    
    def _compile_regex_patterns(self):
        """Regex pattern'ları compile et - performans optimizasyonu"""
        # Company patterns
        self.company_patterns = [
            re.compile(r'(?:Google|Microsoft|Apple|Amazon|Meta|Netflix|Uber|Airbnb|Spotify|Slack|Zoom|Notion|Figma|Adobe|Oracle|IBM|Intel|AMD|NVIDIA|Tesla|SpaceX)', re.IGNORECASE),
            re.compile(r'(?:şirket|company|firma|kurum)\s*[:\-]?\s*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s&]+)', re.IGNORECASE),
            re.compile(r'([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s&]+)\s*(?:arayan|aranıyor|istihdam)', re.IGNORECASE)
        ]
        
        # Position patterns
        self.position_patterns = [
            re.compile(r'(?:Frontend|Backend|Full Stack|DevOps|Data|AI|ML|UI|UX|Product|Project|QA|Test|Security|Cloud|Mobile|React|Angular|Vue|Node\.js|Python|Java|C\+\+|TypeScript|JavaScript)\s*(?:Developer|Engineer|Designer|Manager|Lead|Architect)?', re.IGNORECASE),
            re.compile(r'(?:Senior|Junior|Lead|Principal|Staff)\s+([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s&]+)', re.IGNORECASE),
            re.compile(r'(?:pozisyon|position|rol|role)\s*[:\-]?\s*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s&]+)', re.IGNORECASE)
        ]
        
        # Location patterns
        self.location_patterns = [
            re.compile(r'(?:Remote|remote|Hibrit|hibrit|On-site|on-site|onsite)', re.IGNORECASE),
            re.compile(r'(?:İstanbul|Ankara|İzmir|Bursa|Antalya)', re.IGNORECASE),
            re.compile(r'(?:lokasyon|location|şehir|city)\s*[:\-]?\s*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s&,]+)', re.IGNORECASE)
        ]
        
        # Salary patterns
        self.salary_patterns = [
            re.compile(r'(\d{1,3}(?:\.\d{3})*\s*[-–]\s*\d{1,3}(?:\.\d{3})*\s*(?:TL|USD|EUR|₺|\$|€))', re.IGNORECASE),
            re.compile(r'(\d{1,3}(?:\.\d{3})*\s*(?:TL|USD|EUR|₺|\$|€))', re.IGNORECASE),
            re.compile(r'(\d{1,3}(?:\.\d{3})*\s*[-–]\s*\d{1,3}(?:\.\d{3})*\s*(?:bin|k|milyon|million))', re.IGNORECASE)
        ]
        
        # Requirements patterns
        self.requirements_patterns = [
            re.compile(r'(?:React|Angular|Vue|Node\.js|Python|Java|C\+\+|TypeScript|JavaScript|AWS|Azure|Docker|Kubernetes|MongoDB|PostgreSQL|MySQL|Redis|Elasticsearch|GraphQL|REST|API|Git|CI/CD|Agile|Scrum)', re.IGNORECASE),
            re.compile(r'(\d+\s*\+\s*yıl\s*deneyim|\d+\s*\+\s*years?\s*experience)', re.IGNORECASE),
            re.compile(r'(?:3\+|5\+|7\+)\s*(?:yıl|years?)\s*(?:deneyim|experience)', re.IGNORECASE)
        ]
    
    def save_applications(self, applications: List[Dict], user_id: str) -> Dict:
        """Analiz edilen başvuruları kaydet"""
        try:
            print(f"Kaydetme isteği alındı - User ID: {user_id}, Başvuru sayısı: {len(applications)}")
            
            if not user_id:
                raise Exception(status_code=400, detail="User ID gerekli")
            
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
            
            # Verileri kalıcı olarak kaydet
            self._save_user_applications(user_id)
            
            return {
                "message": f"{len(applications)} adet başvuru işlendi",
                "saved_count": saved_count,
                "total_applications": len(self.applications_storage[user_id])
            }
        
        except Exception as e:
            print(f"Kaydetme hatası: {str(e)}")
            raise Exception(status_code=500, detail=f"Başvuru kaydetme hatası: {str(e)}")
    
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
            raise Exception(status_code=500, detail=f"Başvuru getirme hatası: {str(e)}")
    
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
            raise Exception(status_code=500, detail=f"Debug başvuru getirme hatası: {str(e)}")
    
    def delete_application(self, user_id: str, application_id: int) -> Dict:
        """Belirli bir başvuruyu sil"""
        try:
            if user_id not in self.applications_storage:
                raise Exception(status_code=404, detail="Kullanıcı bulunamadı")
            
            user_applications = self.applications_storage[user_id]
            application = next((app for app in user_applications if app.get("id") == application_id), None)
            
            if not application:
                raise Exception(status_code=404, detail="Başvuru bulunamadı")
            
            self.applications_storage[user_id] = [app for app in user_applications if app.get("id") != application_id]
            
            return {"message": "Başvuru silindi"}
        
        except Exception as e:
            raise Exception(status_code=500, detail=f"Başvuru silme hatası: {str(e)}")
    
    def update_application(self, user_id: str, application_id: int, application_data: Dict) -> Dict:
        """Başvuru bilgilerini güncelle"""
        try:
            if user_id not in self.applications_storage:
                raise Exception(status_code=404, detail="Kullanıcı bulunamadı")
            
            user_applications = self.applications_storage[user_id]
            application_index = next((i for i, app in enumerate(user_applications) if app.get("id") == application_id), None)
            
            if application_index is None:
                raise Exception(status_code=404, detail="Başvuru bulunamadı")
            
            # Başvuru bilgilerini güncelle
            user_applications[application_index].update(application_data)
            user_applications[application_index]["updated_at"] = datetime.now().isoformat()
            
            return {"message": "Başvuru güncellendi"}
        
        except Exception as e:
            raise Exception(status_code=500, detail=f"Başvuru güncelleme hatası: {str(e)}")
    
    def get_application_email(self, user_id: str, application_id: int) -> Dict:
        """Başvuruya ait email içeriğini getir"""
        try:
            print(f"get_application_email çağrıldı - user_id: {user_id}, application_id: {application_id}")
            print(f"application_id türü: {type(application_id)}")
            print(f"Mevcut kullanıcılar: {list(self.applications_storage.keys())}")
            
            if user_id not in self.applications_storage:
                print(f"Kullanıcı bulunamadı: {user_id}")
                raise Exception(status_code=404, detail="Kullanıcı bulunamadı")
            
            user_applications = self.applications_storage[user_id]
            print(f"Kullanıcı başvuruları: {len(user_applications)} adet")
            print(f"Aranan application_id: {application_id}")
            print(f"Mevcut ID'ler: {[app.get('id') for app in user_applications]}")
            print(f"ID türleri: {[type(app.get('id')) for app in user_applications]}")
            
            # ID'yi int'e çevir
            try:
                application_id_int = int(application_id)
            except (ValueError, TypeError):
                print(f"application_id int'e çevrilemedi: {application_id}")
                raise Exception(status_code=400, detail="Geçersiz application_id")
            
            application = next((app for app in user_applications if app.get("id") == application_id_int), None)
            
            if not application:
                print(f"Başvuru bulunamadı: {application_id_int}")
                raise Exception(status_code=404, detail="Başvuru bulunamadı")
            
            print(f"Başvuru bulundu: {application}")
            
            # Email bilgisi var mı kontrol et
            has_email = any([
                application.get("email_id"),
                application.get("email_subject"),
                application.get("email_sender"),
                application.get("email_content"),
                application.get("email_body"),
                application.get("html_body")
            ])
            
            if not has_email:
                print(f"Başvuru için email bilgisi bulunamadı: {application_id_int}")
                return {
                    "error": "no_email",
                    "message": "Bu başvuru için email bilgisi bulunamadı",
                    "application_id": application_id_int,
                    "company_name": application.get("company_name"),
                    "position": application.get("position"),
                    "application_type": "Manuel Eklenen" if application.get("is_manual", False) else "Email ile Eklenen",
                    "suggestion": "Bu başvuru manuel olarak eklenmiş olabilir veya email bilgisi henüz işlenmemiş olabilir."
                }
            
            result = {
                "email_id": application.get("email_id"),
                "email_subject": application.get("email_subject"),
                "email_sender": application.get("email_sender"),
                "email_date": application.get("email_date"),
                "email_content": application.get("email_content", ""),
                "email_body": application.get("email_body", ""),
                "html_body": application.get("html_body", ""),  # HTML içerik
                "application_id": application_id_int,
                "company_name": application.get("company_name"),
                "position": application.get("position"),
                "has_email": True
            }
            
            print(f"Döndürülecek sonuç: {result}")
            return result
        
        except Exception as e:
            print(f"get_application_email hatası: {str(e)}")
            print(f"Hata türü: {type(e)}")
            import traceback
            traceback.print_exc()
            raise Exception(status_code=500, detail=f"Email getirme hatası: {str(e)}")
    
    def create_manual_application(self, user_id: str, application_data: Dict) -> Dict:
        """Manuel olarak yeni başvuru oluştur"""
        try:
            print(f"Manuel başvuru oluşturma isteği - User ID: {user_id}")
            
            if not user_id:
                raise Exception(status_code=400, detail="User ID gerekli")
            
            if user_id not in self.applications_storage:
                self.applications_storage[user_id] = []
            
            # Gerekli alanları kontrol et
            required_fields = ["company_name", "position"]
            for field in required_fields:
                if not application_data.get(field):
                    raise Exception(status_code=400, detail=f"{field} alanı gerekli")
            
            # Yeni başvuru için benzersiz ID oluştur
            new_id = len(self.applications_storage[user_id]) + 1
            
            # Başvuru verisini hazırla
            new_application = {
                "id": new_id,
                "company_name": application_data["company_name"],
                "position": application_data["position"],
                "application_status": application_data.get("application_status", "Başvuruldu"),
                "application_type": application_data.get("application_type", "job"),
                "contact_person": application_data.get("contact_person", ""),
                "location": application_data.get("location", ""),
                "salary_info": application_data.get("salary_info", ""),
                "requirements": application_data.get("requirements", ""),
                "deadline": application_data.get("deadline", ""),
                "next_action": application_data.get("next_action", "Detaylı inceleme"),
                "is_job_application": True,
                "is_manual": True,  # Manuel eklenen başvuru olduğunu belirt
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "email_date": application_data.get("email_date", datetime.now().isoformat()),
                "email_subject": application_data.get("email_subject", f"Manuel Başvuru - {application_data['company_name']}"),
                "email_sender": application_data.get("email_sender", "manuel@jobsy.com"),
                "email_id": f"manual_{new_id}_{datetime.now().timestamp()}",
                "email_content": application_data.get("email_content", ""),
                "email_body": application_data.get("email_content", ""),
                "confidence": 1.0,  # Manuel eklenen başvurular için maksimum güven
                "category": "job_application"
            }
            
            # Başvuruyu kaydet
            self.applications_storage[user_id].append(new_application)
            
            # Verileri kalıcı olarak kaydet
            self._save_user_applications(user_id)
            
            print(f"Manuel başvuru oluşturuldu: {new_application['company_name']} - {new_application['position']}")
            
            return {
                "message": "Manuel başvuru başarıyla oluşturuldu",
                "application": new_application,
                "total_applications": len(self.applications_storage[user_id])
            }
        
        except Exception as e:
            print(f"Manuel başvuru oluşturma hatası: {str(e)}")
            raise Exception(status_code=500, detail=f"Manuel başvuru oluşturma hatası: {str(e)}")
    
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

    def analyze_job_posting(self, job_data: Dict) -> Dict:
        """AI ile iş ilanını analiz et ve bilgileri çıkar - Gemini API ile"""
        try:
            job_url = job_data.get("job_posting_url", "")
            job_text = job_data.get("job_posting_text", "")
            
            if not job_url and not job_text:
                raise Exception(status_code=400, detail="İlan linki veya metni gerekli")
            
            # Cache kontrolü - aynı metin için tekrar analiz yapma
            cache_key = f"{job_url}_{hash(job_text)}"
            if cache_key in self.analysis_cache:
                return {
                    "success": True,
                    "message": "İlan cache'den alındı",
                    "data": self.analysis_cache[cache_key],
                    "cached": True
                }
            
            # Eğer URL verilmişse, web sayfasından içeriği çek
            if job_url:
                try:
                    headers = {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                    response = requests.get(job_url, headers=headers, timeout=5)
                    response.raise_for_status()
                    
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    # Sadece gerekli tag'lerden metin çıkar
                    text_elements = soup.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span'])
                    job_text = ' '.join([elem.get_text() for elem in text_elements if elem.get_text().strip()])
                    
                    # Gereksiz boşlukları temizle
                    job_text = re.sub(r'\s+', ' ', job_text).strip()
                    
                except Exception as e:
                    # URL çalışmazsa sadece mevcut metni kullan
                    pass
            
            # Gemini API ile analiz yap
            try:
                from src.services.ai_service import ai_service
                gemini_result = ai_service.analyze_job_posting_with_gemini(job_text)
                
                if gemini_result.get("success"):
                    # Gemini başarılı oldu, sonucu kullan
                    analysis_result = gemini_result["data"]
                    analysis_result["source"] = "gemini_api"
                else:
                    # Gemini başarısız oldu, fallback olarak regex kullan
                    analysis_result = self._simulate_ai_analysis(job_text)
                    analysis_result["source"] = "regex_fallback"
                    analysis_result["gemini_error"] = gemini_result.get("error", "Bilinmeyen hata")
                
            except Exception as e:
                # Gemini API hatası durumunda fallback
                analysis_result = self._simulate_ai_analysis(job_text)
                analysis_result["source"] = "regex_fallback"
                analysis_result["gemini_error"] = str(e)
            
            # Sonucu cache'e kaydet
            self.analysis_cache[cache_key] = analysis_result
            
            response_data = {
                "success": True,
                "message": "İlan başarıyla analiz edildi",
                "data": analysis_result,
                "cached": False
            }
            
            return response_data
            
        except Exception as e:
            return {
                "success": False,
                "error": f"İlan analiz edilemedi: {str(e)}",
                "message": "Analiz sırasında bir hata oluştu"
            }

    def _simulate_ai_analysis(self, job_text: str) -> Dict:
        """AI analizi simülasyonu - Ultra optimize edilmiş versiyon"""
        
        # Text'i bir kez temizle ve lowercase yap
        cleaned_text = re.sub(r'\s+', ' ', job_text.strip())
        text_lower = cleaned_text.lower()
        
        # Compile edilmiş pattern'ları kullan
        company_name = self._extract_info(cleaned_text, self.company_patterns, "Bilinmeyen Şirket")
        position = self._extract_info(cleaned_text, self.position_patterns, "Bilinmeyen Pozisyon")
        location = self._extract_info(cleaned_text, self.location_patterns, "Belirtilmemiş")
        salary_info = self._extract_info(cleaned_text, self.salary_patterns, "Belirtilmemiş")
        requirements = self._extract_info(cleaned_text, self.requirements_patterns, "Belirtilmemiş")
        
        # Pozisyon türünü hızlı belirle
        application_type = "job"  # Default
        if any(word in text_lower for word in ["staj", "intern", "internship"]):
            application_type = "internship"
        elif any(word in text_lower for word in ["freelance", "serbest", "part-time", "yarı zamanlı"]):
            application_type = "freelance"
        elif any(word in text_lower for word in ["sözleşmeli", "contract", "proje"]):
            application_type = "contract"
        
        result = {
            "company_name": company_name,
            "position": position,
            "location": location,
            "salary_info": salary_info,
            "requirements": requirements,
            "application_type": application_type,
            "confidence_score": 0.85
        }
        
        return result
    
    def _extract_info(self, text: str, patterns: List[re.Pattern], default: str) -> str:
        """Compile edilmiş regex pattern'ları kullanarak bilgi çıkar - Ultra optimize edilmiş versiyon"""
        # Text'i bir kez temizle
        cleaned_text = re.sub(r'\s+', ' ', text.strip())
        
        for pattern in patterns:
            try:
                match = pattern.search(cleaned_text)
                if match:
                    extracted = match.group(1) if len(match.groups()) > 0 else match.group(0)
                    if extracted and len(extracted.strip()) > 2:
                        # Hızlı temizleme
                        result = re.sub(r'[^\w\s\-&,\.]', '', extracted.strip())
                        result = re.sub(r'\s+', ' ', result).strip()
                        
                        if len(result) > 2:
                            return result
            except Exception:
                continue
        
        return default

    def get_applications(self, user_id: str) -> Dict:
        """Kullanıcının başvurularını getir"""
        try:
            if user_id not in self.applications_storage:
                return {
                    "success": True,
                    "data": {
                        "active_applications": [],
                        "finished_applications": []
                    }
                }
            
            applications = self.applications_storage[user_id]
            
            # Aktif ve tamamlanmış başvuruları ayır
            active_applications = []
            finished_applications = []
            
            for app in applications:
                # Basit bir mantık: "Kabul" veya "Red" durumları tamamlanmış sayılır
                if app.get("application_status") in ["Kabul", "Red"]:
                    finished_applications.append(app)
                else:
                    active_applications.append(app)
            
            return {
                "success": True,
                "data": {
                    "active_applications": active_applications,
                    "finished_applications": finished_applications
                }
            }
            
        except Exception as e:
            print(f"Başvuru getirme hatası: {str(e)}")
            return {
                "success": False,
                "error": f"Başvurular getirilemedi: {str(e)}"
            }
    
    # ChromaDB entegrasyonu için yeni metodlar
    def save_application_to_chroma(self, application_data: Dict, user_id: str) -> str:
        """Başvuruyu ChromaDB'ye kaydet"""
        try:
            application_id = self.chroma_service.add_application(application_data, user_id)
            
            # Legacy storage'a da ekle (geriye uyumluluk için)
            if user_id not in self.applications_storage:
                self.applications_storage[user_id] = []
            
            # ChromaDB'den gelen ID'yi kullan
            application_data["id"] = application_id
            self.applications_storage[user_id].append(application_data)
            
            # Legacy storage'ı güncelle
            self._save_user_applications(user_id)
            
            return application_id
            
        except Exception as e:
            print(f"ChromaDB'ye başvuru kaydetme hatası: {e}")
            raise Exception(status_code=500, detail="Başvuru kaydedilemedi")
    
    def update_application_in_chroma(self, application_id: str, application_data: Dict, user_id: str) -> bool:
        """ChromaDB'deki başvuruyu güncelle"""
        try:
            success = self.chroma_service.update_application(application_id, application_data, user_id)
            
            if success:
                # Legacy storage'ı da güncelle
                if user_id in self.applications_storage:
                    for app in self.applications_storage[user_id]:
                        if app.get("id") == application_id:
                            app.update(application_data)
                            break
                    
                    # Legacy storage'ı güncelle
                    self._save_user_applications(user_id)
            
            return success
            
        except Exception as e:
            print(f"ChromaDB'de başvuru güncelleme hatası: {e}")
            return False
    
    def delete_application_from_chroma(self, application_id: str, user_id: str) -> bool:
        """ChromaDB'den başvuruyu sil"""
        try:
            success = self.chroma_service.delete_application(application_id, user_id)
            
            if success:
                # Legacy storage'dan da sil
                if user_id in self.applications_storage:
                    self.applications_storage[user_id] = [
                        app for app in self.applications_storage[user_id] 
                        if app.get("id") != application_id
                    ]
                    
                    # Legacy storage'ı güncelle
                    self._save_user_applications(user_id)
            
            return success
            
        except Exception as e:
            print(f"ChromaDB'den başvuru silme hatası: {e}")
            return False
    
    def get_applications_from_chroma(self, user_id: str) -> List[Dict]:
        """ChromaDB'den kullanıcının başvurularını getir"""
        try:
            return self.chroma_service.get_user_applications(user_id)
        except Exception as e:
            print(f"ChromaDB'den başvuru getirme hatası: {e}")
            return []
    
    def search_applications_in_chroma(self, query: str, user_id: str, limit: int = 10) -> List[Dict]:
        """ChromaDB'de başvurularda semantik arama yap"""
        try:
            return self.chroma_service.search_applications(query, user_id, limit)
        except Exception as e:
            print(f"ChromaDB'de başvuru arama hatası: {e}")
            return []
    
    def save_email_analysis_to_chroma(self, email_data: Dict, analysis_result: Dict, user_id: str) -> str:
        """E-posta analiz sonucunu ChromaDB'ye kaydet"""
        try:
            return self.chroma_service.add_email_analysis(email_data, analysis_result, user_id)
        except Exception as e:
            print(f"ChromaDB'ye e-posta analizi kaydetme hatası: {e}")
            raise Exception(status_code=500, detail="E-posta analizi kaydedilemedi")
    
    def search_email_analysis_in_chroma(self, query: str, user_id: str, limit: int = 10) -> List[Dict]:
        """ChromaDB'de e-posta analizlerinde semantik arama yap"""
        try:
            return self.chroma_service.search_email_analysis(query, user_id, limit)
        except Exception as e:
            print(f"ChromaDB'de e-posta analizi arama hatası: {e}")
            return []
    
    def get_chroma_stats(self) -> Dict:
        """ChromaDB koleksiyon istatistiklerini getir"""
        try:
            return self.chroma_service.get_collection_stats()
        except Exception as e:
            print(f"ChromaDB istatistik getirme hatası: {e}")
            return {}

# Global servis instance'ı
application_service = ApplicationService()
