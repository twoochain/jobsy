import re
import json
import email
from email.header import decode_header
from typing import List, Dict, Optional
from langdetect import detect
import unicodedata
from datetime import datetime
from fastapi import HTTPException
import httpx
from ..config.settings import settings
from bs4 import BeautifulSoup

class EmailAnalyzerService:
    """Gelişmiş e-posta analizi için servis sınıfı"""
    
    def __init__(self):
        self.gemini_api_url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"gemini-pro:generateContent?key={settings.GEMINI_API_KEY}"
        )
        self.client = httpx.AsyncClient(timeout=15)
        
        # Anahtar kelime listeleri
        self.positive_keywords = [
            # İş başvurusu yanıtları (spesifik)
            "başvurunuz alındı", "application received", "your application",
            "başvurunuz iletildi", "application submitted", "başvurun başarılı",
            "başvurunuz başarılı", "application successful", "başvuru formu",
            "application under review", "başvuru değerlendirme",
            
            # Program başvuru yanıtları (spesifik)
            "program başvurusu alındı", "program application received",
            "yetenek programı başvurusu", "talent program application",
            "kariyer programı başvurusu", "career program application",
            "staj programı başvurusu", "internship program application",
            "eğitim programı başvurusu", "training program application",
            
            # Mülakat davetleri (spesifik)
            "mülakat daveti", "interview invitation", "görüşme daveti",
            "mülakat planlandı", "interview scheduled", "meeting invitation",
            "teknik mülakat", "technical interview", "final interview",
            
            # Test davetleri (spesifik)
            "teknik test", "technical test", "coding challenge",
            "kodlama testi", "assessment invitation", "değerlendirme daveti",
            "test link", "test invitation",
            
            # İş teklifi ve sonuçlar (spesifik)
            "iş teklifi", "job offer", "offer letter", "teklif mektubu",
            "congratulations", "tebrikler", "unfortunately", "maalesef"
        ]

        self.negative_keywords = [
            # Spam ve reklam
            "newsletter", "bülten", "duyuru", "promosyon", "kampanya",
            "indirim", "satış", "fatura", "ödeme", "payment",
            "abone", "unsubscribe", "follow us", "like & share",
            "etkinlik daveti", "webinar", "conference invitation",
            
            # Eğitim platformları (sadece kurs reklamları)
            "coursera", "udemy", "edx", "skillshare", "pluralsight", "lynda", "linkedin learning",
            "coursera.org", "udemy.com", "edx.org", "skillshare.com", "pluralsight.com",
            "m.learn.coursera.org", "learn.coursera.org",
            
            # Spam ve reklam (genişletilmiş)
            "victim", "kurban", "scam", "dolandırıcılık", "fraud", "sahtecilik", "fake", "sahte",
            "think", "düşün", "almost", "neredeyse", "got", "aldım", "text", "mesaj", "message",
            "competitive", "rekabetçi", "job market", "iş pazarı", "skill", "beceri", "learn", "öğren",
            
            # İş ilanları ve genel fırsatlar
            "new job opportunity", "we're hiring", "apply now", "career opportunity",
            "yeni pozisyon", "açık pozisyon", "iş ilanı", "job posting",
            "başvuru dönemi", "application period", "recruitment", "işe alım",
            
            # Sosyal medya ve topluluk
            "glassdoor community", "linkedin", "facebook", "twitter", "instagram",
            "social media", "sosyal medya", "community", "topluluk",
            
            # Genel spam terimleri
            "click here", "tıklayın", "register now", "şimdi kayıt ol",
            "limited time", "sınırlı süre", "act now", "şimdi harekete geç"
        ]

    async def analyze_emails(self, emails: List[Dict]) -> Dict:
        """E-postaları analiz et ve iş başvuru bilgilerini çıkar"""
        if not emails:
            raise HTTPException(status_code=400, detail="Analiz edilecek e-posta yok")

        analyzed = []
        for email in emails:
            result = await self.analyze_single_email(email)
            if result:
                analyzed.append(result)

        return {
            "applications": analyzed,
            "totalFound": len(analyzed),
            "message": f"{len(analyzed)} adet başvuru e-postası bulundu"
        }

    async def analyze_single_email(self, email: Dict) -> Optional[Dict]:
        """Tek bir e-postayı analiz et"""
        subject = email.get("subject", "")
        body = email.get("body", "")
        sender = email.get("sender", "")

        # 1. Regex tabanlı analiz
        regex_result = self._regex_analysis(subject, body)
        if regex_result.get("is_application"):
            return self._finalize(email, regex_result)

        # 2. AI analizi (opsiyonel)
        if settings.GEMINI_API_KEY:
            ai_result = await self._ai_analysis(email)
            if ai_result and ai_result.get("is_job_application"):
                return self._finalize(email, ai_result)

        # 3. Manuel fallback
        manual_result = self._manual_fallback(subject, body)
        if manual_result:
            return self._finalize(email, manual_result)

        return None

    def _regex_analysis(self, subject: str, body: str) -> Dict:
        subject_norm = self._normalize_text(subject)
        body_norm = self._normalize_text(body)
        full_text = subject_norm + " " + body_norm

        # Pozitif anahtar kelime var mı?
        has_positive = self._keyword_match(full_text, self.positive_keywords)

        # Negatif anahtar kelime var mı?
        has_negative = self._keyword_match(full_text, self.negative_keywords)

        # Tanıtım/etkinlik kelimeleri
        event_words_pattern = r"\b(tanıtım|davet|etkinlik|webinar|canlı yayın|buluşma|toplantı|workshop|çekiliş|hediye)\b"
        has_event_words = bool(re.search(event_words_pattern, full_text, re.IGNORECASE))

        # Spam ve reklam kelimeleri
        spam_words_pattern = r"\b(newsletter|bülten|promosyon|kampanya|indirim|satış|abone|unsubscribe|follow us|like & share|click here|tıklayın|register now|şimdi kayıt ol|limited time|sınırlı süre|act now|şimdi harekete geç)\b"
        has_spam_words = bool(re.search(spam_words_pattern, full_text, re.IGNORECASE))

        # İş ilanı kelimeleri (genel fırsatlar)
        job_posting_pattern = r"\b(new job opportunity|we're hiring|apply now|career opportunity|yeni pozisyon|açık pozisyon|iş ilanı|job posting|başvuru dönemi|application period|recruitment|işe alım)\b"
        has_job_posting = bool(re.search(job_posting_pattern, full_text, re.IGNORECASE))

        # Eğer spam kelimesi varsa -> negatif
        if has_spam_words:
            return {"is_application": False, "reason": "Spam/reklam kelimeleri tespit edildi"}

        # Eğer iş ilanı kelimesi varsa ama pozitif kelime yoksa -> negatif
        if has_job_posting and not has_positive:
            return {"is_application": False, "reason": "Job posting without positive application keywords"}

        # Eğer etkinlik kelimesi varsa ama pozitif kelime yoksa -> negatif
        if has_event_words and not has_positive:
            return {"is_application": False, "reason": "Event-related mail without positive application keywords"}

        # Negatif kelime varsa ve pozitif yoksa
        if has_negative and not has_positive:
            return {"is_application": False, "reason": "Negative keywords matched without positive keywords"}

        # Pozitif kelime varsa başvuru olarak kabul et
        if has_positive:
            return {"is_application": True, "reason": "Positive keyword matched"}

        # Diğer regex patternlar (başvuru onayları, mülakat davetleri vb.)
        advanced_patterns = [
            r"\b(?:başvurunuz|your application|application)\s+(?:alınmıştır|received|submitted|under review)\b",
            r"\b(?:başvurun|başvurunuz)\s+(?:başarılı|successful|iletildi|submitted)\b",
            r"\b(?:program|yetenek|kariyer|staj)\s+(?:başvurusu|application)\s+(?:alındı|received)\b",
            r"\b(?:başvuru|application)\s+(?:başarılı|successful)\s+(?:şekilde|way)\s+(?:iletildi|submitted)\b",
            r"\b(?:mülakat|interview)\s+(?:daveti|invitation|scheduled|planlandı)\b",
            r"\b(?:teknik|technical)\s+(?:test|interview|assessment|değerlendirme)\b",
            r"\b(?:iş|job)\s+(?:teklifi|offer|proposal)\b",
            r"\b(?:cv|resume|özgeçmiş)\s+(?:gönderildi|received|submitted)\b"
        ]

        for pattern in advanced_patterns:
            if re.search(pattern, full_text, re.IGNORECASE):
                return {"is_application": True, "reason": f"Regex pattern matched: {pattern}"}

        return {"is_application": False, "reason": "No regex patterns matched"}

    async def _ai_analysis(self, email: Dict) -> Optional[Dict]:
        """AI ile e-posta analizi"""
        prompt = self._build_prompt(email)
        try:
            resp = await self.client.post(
                self.gemini_api_url,
                headers={"Content-Type": "application/json"},
                json={"contents": [{"parts": [{"text": prompt}]}]}
            )
            data = resp.json()
            text = (
                data.get("candidates", [{}])[0]
                    .get("content", {})
                    .get("parts", [{}])[0]
                    .get("text", "")
            )
            return json.loads(text) if text else None
        except Exception as e:
            print(f"AI analiz hatası: {e}")
            return None

    def _manual_fallback(self, subject: str, body: str) -> Optional[Dict]:
        """Manuel fallback analizi"""
        positives = [
            "başvurunuz alındı", "application received", "your application",
            "mülakat daveti", "interview invitation", "job offer",
            "teknik test", "technical test",
            "başvurun başarılı", "başvurunuz başarılı", "application successful",
            "başvuru iletildi", "application submitted", "program başvurusu",
            "yetenek programı", "kariyer programı", "staj programı"
        ]
        txt = f"{subject} {body}".lower()
        if any(p in txt for p in positives):
            return {
                "is_job_application": True,
                "status": self._guess_status(txt),
                "confidence": 50
            }
        return None

    def _finalize(self, email: Dict, analysis: Dict) -> Dict:
        """Analiz sonucunu finalize et"""
        return {
            **analysis,
            "email_id": email.get("id"),
            "email_subject": email.get("subject"),
            "email_sender": email.get("sender"),
            "email_date": email.get("date"),
            "email_content": email.get("body", ""),
            "html_body": email.get("html_body", ""),  # HTML içerik
            "analyzed_at": datetime.now().isoformat(),
            "company_name": self._extract_company_name(
                email.get("sender", ""), email.get("body", "")
            ),
            "position": analysis.get("position") or self._extract_position(email.get("subject", ""), email.get("body", "")),
            "status": analysis.get("status") or self._guess_status(email.get("subject", "") + email.get("body", ""))
        }

    def _extract_company_name(self, sender: str, body: str) -> str:
        """Footer tabanlı şirket adı çıkarma"""
        lines = [l.strip() for l in body.splitlines() if l.strip()]
        footer = lines[-6:]
        for line in footer:
            if 2 <= len(line.split()) <= 6 and not any(k in line.lower() for k in ["adres", "tel", "www", "@", "http"]):
                return line
        if "@" in sender:
            return sender.split("@")[1].split(".")[0].title()
        return sender

    def _extract_position(self, subject: str, body: str) -> str:
        """Gelişmiş pozisyon adı çıkarma - Regex tabanlı"""
        text = f"{subject} {body}".lower()

        # Gelişmiş pozisyon regex pattern'ları
        position_patterns = [
            # Senior/Junior/Lead pozisyonlar
            r"\b(?:senior|junior|lead|principal)?\s*(?:software|backend|frontend|full.?stack|data|devops|mobile|web|ui|ux|qa|test|product|project|business|sales|marketing|hr|finance|legal|admin|support|customer|technical|system|network|security|cloud|ai|ml|machine.?learning|artificial.?intelligence|blockchain|game|embedded|firmware|hardware|robotics|automation|analytics|scientist|engineer|developer|architect|consultant|specialist|analyst|manager|director|coordinator|assistant|designer|researcher|instructor|trainer|writer|editor|translator|interpreter|accountant|auditor|lawyer|attorney|paralegal|nurse|doctor|physician|dentist|pharmacist|teacher|professor|lecturer|student|intern|trainee|apprentice|volunteer|freelancer|contractor|consultant|advisor|mentor|coach|counselor|therapist|psychologist|social.?worker|case.?worker|advocate|mediator|arbitrator|judge|magistrate|prosecutor|defense|attorney|public.?defender|district.?attorney|assistant.?district.?attorney|assistant.?attorney.?general|solicitor.?general|attorney.?general|chief.?justice|associate.?justice|justice|judge|magistrate|commissioner|referee|hearing.?officer|administrative.?law.?judge|tax.?court.?judge|bankruptcy.?judge|federal.?judge|state.?judge|county.?judge|municipal.?judge|justice.?of.?the.?peace|notary.?public|commissioner.?of.?oaths|justice.?of.?the.?peace|magistrate|judge|justice|commissioner|referee|hearing.?officer|administrative.?law.?judge|tax.?court.?judge|bankruptcy.?judge|federal.?judge|state.?judge|county.?judge|municipal.?judge|justice.?of.?the.?peace|notary.?public|commissioner.?of.?oaths)\b",
            
            # Türkçe pozisyonlar
            r"\b(?:kıdemli|yeni|baş|ana|uzman|kıdemli|deneyimli|yeni|başlangıç|orta|yüksek|düşük|genel|özel|teknik|idari|yönetici|müdür|şef|koordinatör|asistan|uzman|danışman|müşavir|temsilci|görevli|sorumlu|yetkili|memur|teknisyen|operatör|tekniker|mühendis|geliştirici|programcı|analist|tasarımcı|araştırmacı|eğitmen|öğretmen|hoca|akademisyen|profesör|doçent|yardımcı|öğretim|görevlisi|öğrenci|stajyer|çırak|gönüllü|serbest|çalışan|danışman|danışman|akıl|hocası|koç|danışman|terapist|psikolog|sosyal|çalışan|vaka|çalışan|savunucu|arabulucu|hakem|yargıç|savcı|savunma|avukat|kamu|savunucusu|savcı|yardımcısı|savcı|genel|müdürü|başsavcı|genel|müdürü|yardımcısı|genel|müdürü|başyargıç|yargıç|yargıç|yargıç|komiser|hakem|dinleme|memuru|idari|hukuk|yargıcı|vergi|mahkemesi|yargıcı|iflas|yargıcı|federal|yargıç|eyalet|yargıcı|ilçe|yargıcı|belediye|yargıcı|barış|yargıcı|noter|halk|komiseri|barış|yargıcı|komiser|yargıç|yargıç|komiser|hakem|dinleme|memuru|idari|hukuk|yargıcı|vergi|mahkemesi|yargıcı|iflas|yargıcı|federal|yargıç|eyalet|yargıcı|ilçe|yargıcı|belediye|yargıcı|barış|yargıcı|noter|halk|komiseri)\b",
            
            # Pozisyon + şirket kombinasyonları
            r"\b(?:pozisyonu|position|role|job|iş|görev|duty|responsibility)\s+(?:olarak|as|for|in)\s+([a-zA-ZçğıöşüğÇĞIÖŞÜ\s]+)\b",
            
            # Staj/Intern pozisyonları
            r"\b(?:staj|intern|internship|trainee|apprentice|çırak|öğrenci|student)\s+(?:pozisyonu|position|role|program|programı)\b"
        ]

        for pattern in position_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0).strip().title()

        # Bazı tipik cümlelerden pozisyon çekme
        if "pozisyonu" in text:
            after = text.split("pozisyonu")[0].split()[-3:]
            return " ".join(after).title()

        return "Pozisyon Belirlenemedi"

    def _guess_status(self, text: str) -> str:
        """Durum tahmini"""
        t = text.lower()
        if "mülakat" in t or "interview" in t: return "Interview"
        if "offer" in t or "accepted" in t or "teklif" in t: return "Accepted"
        if "rejected" in t or "red" in t: return "Rejected"
        if "test" in t: return "Technical Test"
        if "application" in t or "başvuru" in t: return "Applied"
        return "Unknown"

    def _build_prompt(self, email: Dict) -> str:
        """AI prompt oluştur"""
        return f"""
Bu e-postanın, kullanıcının daha önce yaptığı bir iş, staj veya program başvurusuna ait olup olmadığını belirle.
Eğer başvurduğu şirket/programdan gelen 'başvurunuz alındı', 'başvurun başarılı', 'mülakat daveti', 'teknik test', 'iş teklifi', 'program kabulü', 'ret' gibi bir durum bildirimi varsa true döndür.

KABUL EDİLECEK E-postalar:
1. İş başvuru yanıtları: "Application received", "Başvurunuz alındı", "Your application"
2. Program başvuru yanıtları: "Başvurun başarılı", "Application successful", "Program başvurusu alındı"
3. Mülakat davetleri: "Interview invitation", "Mülakat daveti", "Meeting invitation"
4. Teknik test davetleri: "Technical test", "Coding challenge", "Assessment"
5. Başvuru sonuçları: "Job offer", "Congratulations", "Unfortunately"
6. Program kabul/red: "Program kabulü", "Program reddi", "Program sonucu"
7. Değerlendirme süreci: "Değerlendirmemiz sonrasında", "Evaluation process"

REDDEDİLECEK E-postalar:
1. Açık iş fırsatları: "New job opportunity", "We're hiring", "Apply now"
2. İş ilanları: "Job posting", "Position available", "Career opportunity"
3. Spam ve reklamlar: "Promotion", "Sale", "Newsletter", "Unsubscribe"
4. Sosyal medya bildirimleri: LinkedIn, Facebook bildirimleri
5. Kurs reklamları: "Coursera", "Udemy", "Online course"

E-posta Bilgileri:
Konu: {email.get("subject", "")}
Gönderen: {email.get("sender", "")}
İçerik (ilk 1000 karakter):
{email.get("body", "")[:1000]}

Cevap formatı (JSON):
{{
    "is_job_application": true/false,
    "company_name": "Şirket/Program adı (footer veya içerikten)",
    "position": "Pozisyon/Program adı",
    "status": "Applied/Interview/Technical Test/Accepted/Rejected",
    "confidence": 0-100
}}
"""

    def _normalize_text(self, text: str) -> str:
        """Metni normalize et: lowercase, unicode fix."""
        if not text:
            return ""
        text = unicodedata.normalize("NFKC", text)
        return text.lower()

    def _keyword_match(self, text: str, keywords: List[str]) -> bool:
        """Metin içinde anahtar kelime araması yap."""
        text = self._normalize_text(text)
        for kw in keywords:
            if re.search(r"\b" + re.escape(kw.lower()) + r"\b", text):
                return True
        return False

    def parse_email(raw_email_bytes):
        msg = email.message_from_bytes(raw_email_bytes)
        html = None
        images = {}

        # Multipart ise parçaları kontrol et
        if msg.is_multipart():
            for part in msg.walk():
                ctype = part.get_content_type()
                cdispo = str(part.get("Content-Disposition"))

                if ctype == "text/html" and "attachment" not in cdispo:
                    charset = part.get_content_charset() or "utf-8"
                    html = part.get_payload(decode=True).decode(charset, errors="ignore")

                elif ctype.startswith("image/"):
                    cid = part.get("Content-ID")
                    if cid:
                        cid = cid.strip("<>")
                        images[cid] = part.get_payload(decode=True)  # Görsel binarysi

        else:
            if msg.get_content_type() == "text/html":
                charset = msg.get_content_charset() or "utf-8"
                html = msg.get_payload(decode=True).decode(charset, errors="ignore")

        return html, images

    def extract_text_from_html(html):
        soup = BeautifulSoup(html, "html.parser")
        return soup.get_text(separator="\n").strip()

    # raw_email_bytes: raw mail bytes olarak alırsın
    # html_content, embedded_images = parse_email(raw_email_bytes)
    # text_content = extract_text_from_html(html_content)

# Global servis instance'ı
email_analyzer_service = EmailAnalyzerService()
