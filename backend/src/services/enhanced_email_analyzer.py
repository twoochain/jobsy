import re
import json
import email
from email.header import decode_header
from typing import List, Dict, Optional, Any
from datetime import datetime
from fastapi import HTTPException
import httpx
from bs4 import BeautifulSoup
from .advanced_email_classifier import advanced_email_classifier, EmailClassificationResult
from ..config.settings import settings

class EnhancedEmailAnalyzer:
    """
    Gelişmiş e-posta analiz servisi
    
    Bu servis:
    1. BERT tabanlı sınıflandırma kullanır
    2. Yapılandırılmış bilgi çıkarır
    3. Durum tabanlı öğrenme yapar
    4. Otomatik takvim entegrasyonu sağlar
    """
    
    def __init__(self):
        self.gemini_api_url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"gemini-pro:generateContent?key={settings.GEMINI_API_KEY}"
        )
        self.client = httpx.AsyncClient(timeout=15)
        
        # Durum tabanlı öğrenme için veri yapıları
        self.application_stages = {
            "basvuru_gonderildi": 1,
            "basvuru_onaylandi": 2,
            "ilk_degerlendirme": 3,
            "teknik_test": 4,
            "mulakat": 5,
            "final_mulakat": 6,
            "is_teklifi": 7,
            "kabul_edildi": 8,
            "reddedildi": 9
        }
        
        # Şirket bazlı öğrenme
        self.company_learning = {}
        
        # E-posta türü bazlı öğrenme
        self.email_type_learning = {}
    
    async def analyze_emails(self, emails: List[Dict]) -> Dict:
        """E-postaları gelişmiş analiz ile işle"""
        if not emails:
            raise HTTPException(status_code=400, detail="Analiz edilecek e-posta yok")

        analyzed = []
        learning_data = []
        
        for email in emails:
            try:
                # Gelişmiş analiz
                result = await self.analyze_single_email_enhanced(email)
                
                if result and result.get("is_application"):
                    analyzed.append(result)
                    
                    # Öğrenme verisi topla
                    learning_data.append({
                        "text": f"{email.get('subject', '')} {email.get('body', '')}",
                        "label": result.get("category", "unknown"),
                        "company": result.get("company_name", ""),
                        "stage": result.get("status", ""),
                        "timestamp": datetime.now().isoformat()
                    })
                    
                    # Durum tabanlı öğrenme güncelle
                    self._update_learning_data(result)
                
            except Exception as e:
                print(f"E-posta analiz hatası: {e}")
                continue
        
        # Model öğrenmesini güncelle
        if learning_data:
            await self._update_model_learning(learning_data)
        
        return {
            "applications": analyzed,
            "totalFound": len(analyzed),
            "message": f"{len(analyzed)} adet başvuru e-postası bulundu",
            "learning_updated": len(learning_data) > 0,
            "model_confidence": self._calculate_model_confidence()
        }
    
    async def analyze_single_email_enhanced(self, email: Dict) -> Optional[Dict]:
        """Tek bir e-postayı gelişmiş analiz ile işle"""
        try:
            subject = email.get("subject", "")
            body = email.get("body", "")
            sender = email.get("sender", "")
            
            # 1. BERT tabanlı sınıflandırma
            classification_result = advanced_email_classifier.classify_email(
                email_content=body,
                email_subject=subject,
                email_sender=sender
            )
            
            # 2. Durum tabanlı analiz
            context_analysis = self._analyze_application_context(
                classification_result, 
                email, 
                sender
            )
            
            # 3. Bilgi çıkarımı ve zenginleştirme
            enriched_info = self._enrich_extracted_info(
                classification_result.extracted_info,
                context_analysis,
                email
            )
            
            # 4. Sonuç oluştur
            # BERT modeli LABEL_X formatında döndürüyor, bu yüzden tüm kategorileri kabul et
            # Güven skoru 0.1'den yüksekse geçerli kabul et
            if classification_result.confidence > 0.1:
                return self._create_application_result(
                    email, 
                    classification_result, 
                    enriched_info,
                    context_analysis
                )
            
            return None
            
        except Exception as e:
            print(f"Gelişmiş e-posta analiz hatası: {e}")
            return None
    
    def _analyze_application_context(self, classification: EmailClassificationResult, email: Dict, sender: str) -> Dict[str, Any]:
        """Başvuru bağlamını analiz et"""
        context = {
            "application_stage": "unknown",
            "company_familiarity": "new",
            "email_type_frequency": "rare",
            "urgency_level": "normal",
            "action_required": False,
            "deadline_info": None,
            "platform_details": None
        }
        
        try:
            # Şirket tanıdıklığı
            company_name = classification.extracted_info.get("sirket", "")
            if company_name in self.company_learning:
                context["company_familiarity"] = "familiar"
                context["application_stage"] = self._predict_next_stage(company_name)
            
            # E-posta türü sıklığı
            email_type = classification.category
            if email_type in self.email_type_learning:
                context["email_type_frequency"] = "common"
            
            # Aciliyet seviyesi
            urgency_keywords = ["acil", "urgent", "hemen", "immediately", "bugün", "today", "yarın", "tomorrow"]
            text = f"{email.get('subject', '')} {email.get('body', '')}".lower()
            if any(keyword in text for keyword in urgency_keywords):
                context["urgency_level"] = "high"
                context["action_required"] = True
            
            # Son tarih bilgisi
            deadline_info = self._extract_deadline_info(text)
            if deadline_info:
                context["deadline_info"] = deadline_info
                context["action_required"] = True
            
            # Platform detayları
            platform = classification.extracted_info.get("platform", "")
            if platform and platform != "Platform Belirlenemedi":
                context["platform_details"] = {
                    "name": platform,
                    "type": self._categorize_platform(platform),
                    "setup_required": self._check_platform_setup(platform)
                }
            
        except Exception as e:
            print(f"Bağlam analiz hatası: {e}")
        
        return context
    
    def _enrich_extracted_info(self, extracted_info: Dict[str, Any], context: Dict[str, Any], email: Dict) -> Dict[str, Any]:
        """Çıkarılan bilgileri zenginleştir"""
        enriched = extracted_info.copy()
        
        try:
            # Şirket bilgilerini zenginleştir
            if enriched.get("sirket") and enriched.get("sirket") != "Şirket Adı Belirlenemedi":
                company_info = self._get_company_info(enriched["sirket"])
                enriched.update(company_info)
            
            # Etkinlik bilgilerini zenginleştir
            if enriched.get("etkinlik_adi") and enriched.get("etkinlik_adi") != "Etkinlik Adı Belirlenemedi":
                event_info = self._get_event_info(enriched["etkinlik_adi"])
                enriched.update(event_info)
            
            # Tarih ve saat bilgilerini standardize et
            if enriched.get("tarih") and enriched.get("tarih") != "Tarih Belirlenemedi":
                enriched["tarih_standard"] = self._standardize_date(enriched["tarih"])
                enriched["takvim_entegrasyonu"] = self._prepare_calendar_integration(enriched)
            
            # Platform bilgilerini zenginleştir
            if enriched.get("platform") and enriched.get("platform") != "Platform Belirlenemedi":
                platform_info = self._get_platform_info(enriched["platform"])
                enriched.update(platform_info)
            
            # Aksiyon öğeleri
            if context:
                enriched["action_items"] = self._generate_action_items(enriched, context)
            else:
                enriched["action_items"] = []
            
            # Öncelik seviyesi
            if context:
                enriched["priority_level"] = self._calculate_priority_level(enriched, context)
            else:
                enriched["priority_level"] = "medium"
            
        except Exception as e:
            print(f"Bilgi zenginleştirme hatası: {e}")
        
        return enriched
    
    def _create_application_result(self, email: Dict, classification: EmailClassificationResult, enriched_info: Dict, context: Dict) -> Dict[str, Any]:
        """Başvuru sonucu oluştur"""
        return {
            "is_application": True,
            "category": classification.category,
            "confidence": classification.confidence,
            "reasoning": classification.reasoning,
            "email_id": email.get("id"),
            "email_subject": email.get("subject"),
            "email_sender": email.get("sender"),
            "email_date": email.get("date"),
            "email_content": email.get("body", ""),
            "html_body": email.get("html_body", ""),
            "analyzed_at": datetime.now().isoformat(),
            "company_name": enriched_info.get("sirket", "Bilinmeyen"),
            "position": enriched_info.get("pozisyon", "Belirlenemedi"),
            "status": self._map_category_to_status(classification.category),
            "extracted_info": enriched_info,
            "context_analysis": context,
            "metadata": classification.metadata
        }
    
    def _map_category_to_status(self, category: str) -> str:
        """Kategoriyi başvuru durumuna eşle"""
        status_mapping = {
            "etkinlik_daveti": "Etkinlik Daveti",
            "mulakat_daveti": "Mülakat Daveti",
            "teknik_test": "Teknik Test",
            "basvuru_onayi": "Başvuru Onayı",
            "is_teklifi": "İş Teklifi",
            "red_bildirimi": "Red Bildirimi"
        }
        return status_mapping.get(category, "Bilinmeyen")
    
    def _extract_deadline_info(self, text: str) -> Optional[Dict[str, Any]]:
        """Son tarih bilgisini çıkar"""
        try:
            # Son tarih pattern'ları
            deadline_patterns = [
                r"\b(?:son tarih|deadline|bitiş|end date|kapanış|closing)\s*:?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\b",
                r"\b(?:son tarih|deadline|bitiş|end date|kapanış|closing)\s*:?\s*(\d{1,2}\s+(?:Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)\s+\d{2,4})\b",
                r"\b(?:son tarih|deadline|bitiş|end date|kapanış|closing)\s*:?\s*(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{2,4})\b"
            ]
            
            for pattern in deadline_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    deadline_date = match.group(1).strip()
                    return {
                        "date": deadline_date,
                        "standardized_date": self._standardize_date(deadline_date),
                        "urgency": self._calculate_deadline_urgency(deadline_date)
                    }
            
            return None
            
        except Exception as e:
            print(f"Son tarih çıkarım hatası: {e}")
            return None
    
    def _standardize_date(self, date_str: str) -> str:
        """Tarihi standart formata çevir"""
        try:
            # Basit tarih standardizasyonu
            if re.match(r"\d{1,2}[./-]\d{1,2}[./-]\d{2,4}", date_str):
                parts = re.split(r'[./-]', date_str)
                if len(parts) == 3:
                    day, month, year = parts
                    if len(year) == 2:
                        year = "20" + year
                    return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
            
            return date_str
            
        except Exception as e:
            print(f"Tarih standardizasyon hatası: {e}")
            return date_str
    
    def _calculate_deadline_urgency(self, deadline_date: str) -> str:
        """Son tarih aciliyetini hesapla"""
        try:
            from datetime import datetime, timedelta
            
            # Tarihi parse et
            if re.match(r"\d{4}-\d{2}-\d{2}", deadline_date):
                deadline = datetime.strptime(deadline_date, "%Y-%m-%d")
            else:
                # Basit format için
                return "unknown"
            
            today = datetime.now()
            days_until_deadline = (deadline - today).days
            
            if days_until_deadline < 0:
                return "expired"
            elif days_until_deadline <= 1:
                return "critical"
            elif days_until_deadline <= 3:
                return "urgent"
            elif days_until_deadline <= 7:
                return "high"
            elif days_until_deadline <= 14:
                return "medium"
            else:
                return "low"
                
        except Exception as e:
            print(f"Aciliyet hesaplama hatası: {e}")
            return "unknown"
    
    def _prepare_calendar_integration(self, enriched_info: Dict) -> Dict[str, Any]:
        """Takvim entegrasyonu için veri hazırla"""
        try:
            calendar_data = {
                "title": "",
                "start_date": "",
                "end_date": "",
                "description": "",
                "location": "",
                "attendees": [],
                "reminders": []
            }
            
            # Başlık
            if enriched_info.get("etkinlik_adi") and enriched_info.get("etkinlik_adi") != "Etkinlik Adı Belirlenemedi":
                calendar_data["title"] = enriched_info["etkinlik_adi"]
            elif enriched_info.get("pozisyon") and enriched_info.get("pozisyon") != "Pozisyon Belirlenemedi":
                calendar_data["title"] = f"{enriched_info.get('sirket', 'Şirket')} - {enriched_info['pozisyon']}"
            
            # Tarih
            if enriched_info.get("tarih_standard"):
                calendar_data["start_date"] = enriched_info["tarih_standard"]
                # Varsayılan olarak 1 saat süre
                calendar_data["end_date"] = enriched_info["tarih_standard"]
            
            # Açıklama
            description_parts = []
            if enriched_info.get("sirket"):
                description_parts.append(f"Şirket: {enriched_info['sirket']}")
            if enriched_info.get("platform"):
                description_parts.append(f"Platform: {enriched_info['platform']}")
            if enriched_info.get("bilgi"):
                description_parts.append(f"Detay: {enriched_info['bilgi']}")
            
            calendar_data["description"] = "\n".join(description_parts)
            
            # Konum
            if enriched_info.get("platform") and enriched_info.get("platform") != "Platform Belirlenemedi":
                calendar_data["location"] = enriched_info["platform"]
            
            # Hatırlatıcılar
            calendar_data["reminders"] = [
                {"minutes": 15, "type": "popup"},
                {"minutes": 60, "type": "email"}
            ]
            
            return calendar_data
            
        except Exception as e:
            print(f"Takvim entegrasyonu hazırlama hatası: {e}")
            return {}
    
    def _generate_action_items(self, enriched_info: Dict, context: Dict) -> List[Dict[str, Any]]:
        """Aksiyon öğeleri oluştur"""
        action_items = []
        
        try:
            # Context None kontrolü
            if not context:
                return action_items
                
            # Platform kurulumu gerekli mi?
            if context.get("platform_details", {}).get("setup_required"):
                action_items.append({
                    "type": "platform_setup",
                    "title": f"{enriched_info.get('platform', 'Platform')} Kurulumu",
                    "description": f"{enriched_info.get('platform')} platformunda hesap oluştur ve test et",
                    "priority": "high",
                    "estimated_time": "15-30 dakika"
                })
            
            # CV güncellemesi gerekli mi?
            if enriched_info.get("pozisyon") and enriched_info.get("pozisyon") != "Pozisyon Belirlenemedi":
                action_items.append({
                    "type": "cv_update",
                    "title": "CV Güncellemesi",
                    "description": f"{enriched_info['pozisyon']} pozisyonu için CV'yi güncelle",
                    "priority": "medium",
                    "estimated_time": "1-2 saat"
                })
            
            # Mülakat hazırlığı
            if context.get("application_stage") in ["mulakat", "final_mulakat"]:
                action_items.append({
                    "type": "interview_prep",
                    "title": "Mülakat Hazırlığı",
                    "description": "Şirket araştırması yap ve mülakat sorularını hazırla",
                    "priority": "high",
                    "estimated_time": "2-4 saat"
                })
            
            # Teknik test hazırlığı
            if context.get("application_stage") == "teknik_test":
                action_items.append({
                    "type": "technical_prep",
                    "title": "Teknik Test Hazırlığı",
                    "description": "Algoritma ve kodlama pratiği yap",
                    "priority": "high",
                    "estimated_time": "3-5 saat"
                })
            
        except Exception as e:
            print(f"Aksiyon öğesi oluşturma hatası: {e}")
        
        return action_items
    
    def _calculate_priority_level(self, enriched_info: Dict, context: Dict) -> str:
        """Öncelik seviyesini hesapla"""
        try:
            # Context None kontrolü
            if not context:
                return "medium"
                
            priority_score = 0
            
            # Aciliyet
            if context.get("urgency_level") == "high":
                priority_score += 3
            elif context.get("urgency_level") == "medium":
                priority_score += 2
            else:
                priority_score += 1
            
            # Aksiyon gerekli mi?
            if context.get("action_required"):
                priority_score += 2
            
            # Son tarih var mı?
            if enriched_info.get("tarih_standard"):
                priority_score += 2
            
            # Platform kurulumu gerekli mi?
            if context.get("platform_details", {}).get("setup_required"):
                priority_score += 1
            
            # Öncelik seviyesini belirle
            if priority_score >= 6:
                return "critical"
            elif priority_score >= 4:
                return "high"
            elif priority_score >= 2:
                return "medium"
            else:
                return "low"
                
        except Exception as e:
            print(f"Öncelik hesaplama hatası: {e}")
            return "medium"
    
    def _get_company_info(self, company_name: str) -> Dict[str, Any]:
        """Şirket bilgilerini getir"""
        # Bu fonksiyon şirket veritabanından bilgi çekebilir
        return {
            "company_website": "",
            "company_size": "",
            "company_industry": "",
            "company_location": "",
            "previous_applications": 0
        }
    
    def _get_event_info(self, event_name: str) -> Dict[str, Any]:
        """Etkinlik bilgilerini getir"""
        # Bu fonksiyon etkinlik veritabanından bilgi çekebilir
        return {
            "event_duration": "",
            "event_format": "",
            "event_requirements": "",
            "event_prizes": "",
            "event_sponsors": []
        }
    
    def _get_platform_info(self, platform: str) -> Dict[str, Any]:
        """Platform bilgilerini getir"""
        platform_info = {
            "setup_guide": "",
            "system_requirements": "",
            "test_account": False,
            "common_issues": []
        }
        
        # Platform bazlı bilgiler
        if "zoom" in platform.lower():
            platform_info.update({
                "setup_guide": "https://support.zoom.us/hc/en-us/articles/201362193",
                "system_requirements": "Modern web browser veya Zoom uygulaması",
                "test_account": True
            })
        elif "teams" in platform.lower():
            platform_info.update({
                "setup_guide": "https://support.microsoft.com/en-us/teams",
                "system_requirements": "Microsoft Teams uygulaması veya web",
                "test_account": True
            })
        
        return platform_info
    
    def _categorize_platform(self, platform: str) -> str:
        """Platform türünü kategorize et"""
        platform_lower = platform.lower()
        
        if any(p in platform_lower for p in ["zoom", "teams", "meet", "skype", "webex"]):
            return "video_conference"
        elif any(p in platform_lower for p in ["discord", "slack"]):
            return "communication"
        elif any(p in platform_lower for p in ["online", "çevrimiçi", "uzaktan"]):
            return "online"
        else:
            return "unknown"
    
    def _check_platform_setup(self, platform: str) -> bool:
        """Platform kurulumu gerekli mi?"""
        platform_lower = platform.lower()
        
        # Kurulum gerektiren platformlar
        setup_required = ["zoom", "teams", "discord", "slack", "webex"]
        
        return any(p in platform_lower for p in setup_required)
    
    def _predict_next_stage(self, company_name: str) -> str:
        """Sonraki aşamayı tahmin et"""
        if company_name in self.company_learning:
            company_data = self.company_learning[company_name]
            # Basit tahmin algoritması
            return "mulakat"  # Varsayılan olarak mülakat aşaması
        
        return "unknown"
    
    def _update_learning_data(self, result: Dict[str, Any]):
        """Öğrenme verilerini güncelle"""
        try:
            company_name = result.get("company_name", "")
            if company_name:
                if company_name not in self.company_learning:
                    self.company_learning[company_name] = {
                        "first_application": datetime.now().isoformat(),
                        "application_count": 0,
                        "stages": [],
                        "response_time": []
                    }
                
                self.company_learning[company_name]["application_count"] += 1
                self.company_learning[company_name]["stages"].append(result.get("status", ""))
            
            # E-posta türü öğrenmesi
            email_type = result.get("category", "")
            if email_type:
                if email_type not in self.email_type_learning:
                    self.email_type_learning[email_type] = 0
                self.email_type_learning[email_type] += 1
                
        except Exception as e:
            print(f"Öğrenme verisi güncelleme hatası: {e}")
    
    async def _update_model_learning(self, learning_data: List[Dict[str, Any]]):
        """Model öğrenmesini güncelle"""
        try:
            # Basit öğrenme güncellemesi
            # Gerçek uygulamada bu veriler veritabanına kaydedilir
            print(f"{len(learning_data)} yeni öğrenme verisi eklendi")
            
            # Model fine-tuning için veri hazırla
            if len(learning_data) >= 10:  # Minimum veri miktarı
                training_data = [
                    {"text": item["text"], "label": item["label"]}
                    for item in learning_data
                ]
                
                # Model eğitimi (opsiyonel)
                # advanced_email_classifier.train_model(training_data)
                
        except Exception as e:
            print(f"Model öğrenme güncelleme hatası: {e}")
    
    def _calculate_model_confidence(self) -> float:
        """Model güven skorunu hesapla"""
        try:
            # Basit güven hesaplama
            total_emails = sum(self.email_type_learning.values())
            if total_emails == 0:
                return 0.5
            
            # Başarılı sınıflandırma oranı
            successful_categories = ["etkinlik_daveti", "mulakat_daveti", "teknik_test", "basvuru_onayi"]
            successful_count = sum(self.email_type_learning.get(cat, 0) for cat in successful_categories)
            
            return successful_count / total_emails
            
        except Exception as e:
            print(f"Model güven hesaplama hatası: {e}")
            return 0.5
    
    def get_learning_insights(self) -> Dict[str, Any]:
        """Öğrenme içgörülerini getir"""
        try:
            insights = {
                "total_companies": len(self.company_learning),
                "total_email_types": len(self.email_type_learning),
                "most_common_email_type": "",
                "most_active_company": "",
                "model_confidence": self._calculate_model_confidence(),
                "learning_trends": {}
            }
            
            # En yaygın e-posta türü
            if self.email_type_learning:
                insights["most_common_email_type"] = max(
                    self.email_type_learning, 
                    key=self.email_type_learning.get
                )
            
            # En aktif şirket
            if self.company_learning:
                insights["most_active_company"] = max(
                    self.company_learning,
                    key=lambda x: self.company_learning[x]["application_count"]
                )
            
            # Öğrenme trendleri
            insights["learning_trends"] = {
                "email_type_distribution": self.email_type_learning,
                "company_activity": {
                    company: data["application_count"] 
                    for company, data in self.company_learning.items()
                }
            }
            
            return insights
            
        except Exception as e:
            print(f"Öğrenme içgörüsü hatası: {e}")
            return {"error": str(e)}

# Global servis instance'ı
enhanced_email_analyzer = EnhancedEmailAnalyzer()
