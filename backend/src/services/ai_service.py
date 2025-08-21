import requests
from typing import Dict, Any
from ..config.settings import settings
from ..utils.helpers import make_api_request

class AIService:
    """AI entegrasyonu için servis sınıfı"""
    
    def __init__(self):
        # Google AI Studio (Gemini) API endpoint - düzeltildi
        self.gemini_api_url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent"
        self.hf_base_url = "https://api-inference.huggingface.co"
    
    def generate_ai_response(self, prompt: str) -> Dict[str, Any]:
        """AI prompt'u işler ve yanıt döner"""
        try:
            if not settings.GEMINI_API_KEY:
                return {
                    "success": False,
                    "error": "Gemini API anahtarı bulunamadı",
                    "message": "Lütfen .env dosyasında GEMINI_API_KEY tanımlayın"
                }
            
            url = f"{self.gemini_api_url}?key={settings.GEMINI_API_KEY}"
            data = {
                "contents": [
                    {"parts": [{"text": prompt}]}
                ]
            }
            
            response = make_api_request(url, method="POST", json_data=data)
            return response
            
        except Exception as e:
            return {
                "success": False,
                "error": f"AI yanıt hatası: {str(e)}",
                "message": "AI servisi ile iletişim kurulurken hata oluştu"
            }
    
    def analyze_text_with_gemini(self, text: str) -> Dict[str, Any]:
        """Metni Gemini ile analiz eder"""
        try:
            if not settings.GEMINI_API_KEY:
                return {
                    "success": False,
                    "error": "Gemini API anahtarı bulunamadı",
                    "message": "Lütfen .env dosyasında GEMINI_API_KEY tanımlayın"
                }
            
            prompt = f"Aşağıdaki e-posta bir iş/staj başvurusu içeriyor mu? Yanıtın sadece 'evet' ya da 'hayır' olsun. E-posta içeriği:\n\n{text}"
            
            url = f"{self.gemini_api_url}?key={settings.GEMINI_API_KEY}"
            data = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt}
                        ]
                    }
                ]
            }
            
            response = make_api_request(url, method="POST", json_data=data)
            return response
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Gemini analiz hatası: {str(e)}",
                "message": "E-posta analizi sırasında hata oluştu"
            }
    
    def analyze_and_categorize_job_posting(self, job_text: str) -> Dict[str, Any]:
        """İş ilanını analiz eder ve kategorilere ayırır"""
        try:
            if not settings.GEMINI_API_KEY:
                return {
                    "success": False,
                    "error": "Gemini API anahtarı bulunamadı",
                    "message": "Lütfen .env dosyasında GEMINI_API_KEY tanımlayın"
                }
            
            prompt = f"""Aşağıdaki iş ilanını detaylı olarak analiz et ve aşağıdaki kategorilere ayır. 
Sadece JSON formatında yanıt ver, başka açıklama ekleme.

İş İlanı:
{job_text}

Analiz Talimatları:
1. Her kategoriyi dikkatli oku ve ilgili bilgileri çıkar
2. Teknoloji alanlarını liste halinde ver
3. Maaş bilgisi varsa belirt
4. Şirket büyüklüğü, sektör gibi bilgileri ekle
5. Eğer bilgi bulunamazsa "Belirtilmemiş" yaz

Kategoriler:
1. sirket_bilgisi: Şirket hakkında detaylı bilgiler (kuruluş yılı, sektör, büyüklük, misyon, vizyon)
2. program_detayi: Programın/pozisyonun detaylı açıklaması, süresi, amacı, sorumlulukları
3. teknoloji_alanlari: İlan içinde geçen tüm teknoloji/alan başlıkları (programlama dilleri, framework'ler, araçlar)
4. oduller_ve_basarilar: Şirketin aldığı ödüller, başarılar, sertifikalar, tanınırlık
5. aranan_nitelikler: Adaylardan beklenen detaylı koşullar (deneyim süresi, eğitim seviyesi, teknik beceriler, soft skills)
6. saglanan_ayricaliklar: Program kapsamında sunulan tüm imkanlar (maaş aralığı, yan haklar, eğitim imkanları, kariyer gelişimi)

Ana Bilgiler:
- company_name: Şirket ismi (varsa)
- program_name: Program/Pozisyon ismi (varsa)
- position_type: İş türü (staj, tam-zamanlı, yarı-zamanlı, freelance, internship)

JSON Formatı (sadece bu formatı kullan):
{{
  "company_name": "Şirket Adı veya Belirtilmemiş",
  "program_name": "Program/Pozisyon Adı veya Belirtilmemiş", 
  "position_type": "İş türü veya Belirtilmemiş",
  "categories": {{
    "sirket_bilgisi": "Detaylı şirket bilgileri veya Belirtilmemiş",
    "program_detayi": "Detaylı program açıklaması veya Belirtilmemiş",
    "teknoloji_alanlari": ["Python", "JavaScript", "React", "AI/ML"] veya ["Belirtilmemiş"],
    "oduller_ve_basarilar": "Ödüller ve başarılar veya Belirtilmemiş",
    "aranan_nitelikler": "Detaylı aranan nitelikler veya Belirtilmemiş",
    "saglanan_ayricaliklar": "Detaylı sağlanan ayrıcalıklar veya Belirtilmemiş"
  }}
}}

Önemli: Sadece JSON formatında yanıt ver, başka metin ekleme.
"""
            
            url = f"{self.gemini_api_url}?key={settings.GEMINI_API_KEY}"
            data = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt}
                        ]
                    }
                ]
            }
            
            response = make_api_request(url, method="POST", json_data=data)
            return response
            
        except Exception as e:
            return {
                "success": False,
                "error": f"İlan kategorizasyon hatası: {str(e)}",
                "message": "İlan analizi sırasında hata oluştu"
            }
    
    def analyze_job_posting_with_gemini(self, job_text: str) -> Dict[str, Any]:
        """İş ilanını Gemini ile detaylı analiz eder"""
        try:
            print(f"🔍 Gemini analizi başlatılıyor... Job text length: {len(job_text)}")
            print(f"📝 Job text preview: {job_text[:100]}...")
            
            if not settings.GEMINI_API_KEY:
                print("⚠️ GEMINI_API_KEY bulunamadı")
                # API key yoksa mock response döndür
                return {
                    "success": False,
                    "error": "Gemini API anahtarı bulunamadı",
                    "message": "Lütfen .env dosyasında GEMINI_API_KEY tanımlayın",
                    "fallback_data": {
                        "company_name": "API Key Gerekli",
                        "position": "API Key Gerekli",
                        "location": "API Key Gerekli",
                        "salary_info": "API Key Gerekli",
                        "requirements": "API Key Gerekli",
                        "benefits": "API Key Gerekli",
                        "application_type": "API Key Gerekli",
                        "contact_info": "API Key Gerekli",
                        "deadline": "API Key Gerekli",
                        "company_description": "API Key Gerekli"
                    }
                }
            
            print(f"✅ GEMINI_API_KEY bulundu: {settings.GEMINI_API_KEY[:10]}...")
            print(f"🌐 Gemini API URL: {self.gemini_api_url}")
            
            prompt = f"""Aşağıdaki iş ilanını analiz et ve aşağıdaki bilgileri JSON formatında çıkar:

İş İlanı:
{job_text}

Çıkarılacak Bilgiler:
1. company_name: Şirket ismi
2. position: Pozisyon adı
3. location: İş lokasyonu (şehir, ülke, remote/hibrit bilgisi)
4. salary_info: Maaş bilgisi (varsa)
5. requirements: Gereksinimler (teknolojiler, deneyim, eğitim)
6. benefits: Şirketin sunduğu avantajlar (varsa)
7. application_type: İş türü (tam zamanlı, yarı zamanlı, staj, freelance)
8. contact_info: İletişim bilgileri (varsa)
9. deadline: Son başvuru tarihi (varsa)
10. company_description: Şirket hakkında kısa açıklama
11. description: İş pozisyonunun detaylı açıklaması ve sorumlulukları
12. field: İş alanı/sektör (teknoloji, finans, sağlık, eğitim vb.)
13. duration: İş süresi (sürekli, proje bazlı, belirli süre vb.)
14. is_paid: Ücretli mi? (true/false)
15. application_status: Başvuru durumu (active, pending, closed vb.)

Lütfen sadece JSON formatında yanıt ver, başka açıklama ekleme. Eğer bilgi bulunamazsa "Belirtilmemiş" yaz.

Örnek format:
{{
  "company_name": "Google",
  "position": "Senior Software Engineer",
  "location": "İstanbul, Türkiye",
  "salary_info": "Belirtilmemiş",
  "requirements": "5+ yıl deneyim, Python, JavaScript",
  "benefits": "Sağlık sigortası, remote çalışma",
  "application_type": "job",
  "contact_info": "hr@google.com",
  "deadline": "2024-06-30",
  "company_description": "Teknoloji devi, arama motoru ve bulut hizmetleri",
  "description": "Google'da yazılım geliştirme ekibinde çalışacak, web uygulamaları geliştirecek",
  "field": "Teknoloji",
  "duration": "Sürekli",
  "is_paid": true,
  "application_status": "active"
}}"""
            
            print(f"📝 Prompt hazırlandı, length: {len(prompt)}")
            
            url = f"{self.gemini_api_url}?key={settings.GEMINI_API_KEY}"
            data = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt}
                        ]
                    }
                ]
            }
            
            print(f"📤 Gemini API'ye istek gönderiliyor...")
            print(f"📝 Request data keys: {list(data.keys())}")
            print(f"🔗 Request URL: {url}")
            
            response = make_api_request(url, method="POST", json_data=data)
            print(f"📥 Gemini API response alındı: {type(response)}")
            print(f"📊 Response keys: {list(response.keys()) if isinstance(response, dict) else 'Not a dict'}")
            
            # make_api_request'ten hata response'u geldiyse
            if response and not response.get("success", True):
                print(f"❌ make_api_request'ten hata: {response}")
                return {
                    "success": False,
                    "error": response.get("error", "Bilinmeyen API hatası"),
                    "message": response.get("message", "Gemini API'ye bağlanırken hata oluştu"),
                    "details": response
                }
            
            print(f"🔍 Response validation başlıyor...")
            
            # Gemini response'unu parse et
            if response and 'candidates' in response:
                print(f"✅ Gemini response'unda 'candidates' bulundu")
                
                # Response structure validation
                try:
                    candidates = response['candidates']
                    if not candidates or len(candidates) == 0:
                        raise ValueError("Candidates array boş")
                    
                    first_candidate = candidates[0]
                    if 'content' not in first_candidate:
                        raise ValueError("Candidate'da 'content' bulunamadı")
                    
                    content = first_candidate['content']
                    if 'parts' not in content or len(content['parts']) == 0:
                        raise ValueError("Content'da 'parts' bulunamadı")
                    
                    text_response = content['parts'][0]['text']
                    print(f"📝 Raw text response: {text_response[:200]}...")
                    print(f"📏 Text length: {len(text_response)}")
                    
                except (KeyError, IndexError, ValueError) as structure_error:
                    print(f"❌ Response structure hatası: {structure_error}")
                    return {
                        "success": False,
                        "error": "Gemini response yapısı beklenen formatta değil",
                        "raw_response": response,
                        "message": "Gemini'den gelen yanıt beklenen yapıda değil",
                        "structure_error": str(structure_error)
                    }
                
                # Markdown formatını temizle (```json ve ``` kaldır)
                cleaned_response = text_response.strip()
                if cleaned_response.startswith('```json'):
                    cleaned_response = cleaned_response[7:]  # ```json kaldır
                if cleaned_response.startswith('```'):
                    cleaned_response = cleaned_response[3:]  # ``` kaldır
                if cleaned_response.endswith('```'):
                    cleaned_response = cleaned_response[:-3]  # ``` kaldır
                
                cleaned_response = cleaned_response.strip()
                print(f"🧹 Temizlenmiş response: {cleaned_response[:200]}...")
                
                # JSON response'u parse et
                try:
                    import json
                    parsed_data = json.loads(cleaned_response)
                    print(f"✅ JSON parse başarılı")
                    return {
                        "success": True,
                        "data": parsed_data,
                        "message": "İlan Gemini ile başarıyla analiz edildi"
                    }
                except json.JSONDecodeError as json_error:
                    print(f"❌ JSON parse hatası: {json_error}")
                    print(f"🔍 Temizlenmiş response: {repr(cleaned_response)}")
                    # JSON parse hatası durumunda fallback
                    return {
                        "success": False,
                        "error": "Gemini response'u JSON formatında değil",
                        "raw_response": text_response,
                        "cleaned_response": cleaned_response,
                        "message": "Gemini'den gelen yanıt beklenen formatta değil"
                    }
            
            # Beklenmeyen response formatı
            print(f"⚠️ Beklenmeyen response formatı: {response}")
            return {
                "success": False,
                "error": "Beklenmeyen Gemini response formatı",
                "raw_response": response,
                "message": "Gemini'den beklenmeyen bir yanıt formatı geldi"
            }
            
        except Exception as e:
            print(f"💥 Beklenmeyen exception: {type(e).__name__}: {str(e)}")
            import traceback
            print(f"📚 Traceback: {traceback.format_exc()}")
            
            # Error message'ı güçlendir
            error_msg = str(e) if str(e) else f"{type(e).__name__} exception occurred"
            if not error_msg or error_msg.strip() == "":
                error_msg = f"Unknown {type(e).__name__} error"
            
            return {
                "success": False,
                "error": f"Gemini iş ilanı analiz hatası: {error_msg}",
                "message": "Analiz sırasında beklenmeyen bir hata oluştu",
                "exception_type": type(e).__name__,
                "exception_details": error_msg,
                "traceback": traceback.format_exc()
            }
    
    def summarize_text_with_hf(self, text: str) -> Dict[str, Any]:
        """Metni Hugging Face ile özetler"""
        try:
            if not settings.HF_TOKEN:
                return {
                    "success": False,
                    "error": "Hugging Face token bulunamadı",
                    "message": "Lütfen .env dosyasında HF_TOKEN tanımlayın"
                }
            
            if not settings.MODEL_ID:
                return {
                    "success": False,
                    "error": "Model ID bulunamadı",
                    "message": "Lütfen .env dosyasında MODEL_ID tanımlayın"
                }
            
            url = f"{self.hf_base_url}/models/{settings.MODEL_ID}"
            data = {"inputs": text}
            
            response = make_api_request(url, method="POST", headers=settings.headers, json_data=data)
            return response
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Hugging Face özetleme hatası: {str(e)}",
                "message": "Model yüklenemedi veya API hatası"
            }
    
    def search_hf_models(self, query: str, limit: int = 10) -> Dict[str, Any]:
        """Hugging Face modellerini arar"""
        try:
            url = f"{settings.BASE_URL}/models"
            params = {"search": query, "limit": limit}
            
            response = make_api_request(url, headers=settings.headers, params=params)
            return response
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Model arama hatası: {str(e)}",
                "message": "Model arama sırasında hata oluştu"
            }
    
    def get_model_details(self, model_id: str) -> Dict[str, Any]:
        """Model detaylarını getirir"""
        try:
            url = f"{settings.BASE_URL}/models/{model_id}"
            
            response = make_api_request(url, headers=settings.headers)
            return response
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Model detay hatası: {str(e)}",
                "message": "Model detayları alınırken hata oluştu"
            }
    
    def hf_inference(self, model_id: str, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Hugging Face inference yapar"""
        try:
            url = f"{self.hf_base_url}/models/{model_id}"
            
            response = make_api_request(url, method="POST", headers=settings.headers, json_data=inputs)
            return response
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Inference hatası: {str(e)}",
                "message": "Model inference sırasında hata oluştu"
            }
    
    def mock_ai_response(self, prompt: str) -> Dict[str, Any]:
        """Mock AI yanıtı (test için)"""
        return {
            "prompt": prompt,
            "ai_response": f"AI cevabı (mock): '{prompt}' ifadesini analiz ettim."
        }

# Global servis instance'ı
ai_service = AIService()
