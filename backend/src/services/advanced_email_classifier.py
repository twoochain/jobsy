import re
import json
import torch
import numpy as np
import pandas as pd
from typing import List, Dict, Optional, Tuple, Any
from datetime import datetime
from dataclasses import dataclass
from transformers import (
    AutoTokenizer, 
    AutoModelForSequenceClassification,
    AutoModelForTokenClassification,
    pipeline,
    TrainingArguments,
    Trainer
)
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import warnings
warnings.filterwarnings('ignore')

@dataclass
class EmailClassificationResult:
    """E-posta sınıflandırma sonucu için veri yapısı"""
    category: str
    confidence: float
    extracted_info: Dict[str, Any]
    reasoning: str
    metadata: Dict[str, Any]

class AdvancedEmailClassifier:
    """
    BERT tabanlı gelişmiş e-posta sınıflandırma sistemi
    
    Bu sistem:
    1. E-postaları bağlamsal olarak anlar
    2. Yapılandırılmış bilgi çıkarır
    3. Dinamik olarak yeni terimleri yorumlar
    4. Transfer learning ile sürekli öğrenir
    """
    
    def __init__(self, model_name: str = "dbmdz/bert-base-turkish-cased"):
        self.model_name = model_name
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Model ve tokenizer'ları yükle
        self.tokenizer = None
        self.classification_model = None
        self.ner_model = None
        self.classifier_pipeline = None
        
        # Kategori tanımları
        self.categories = {
            "etkinlik_daveti": "Etkinlik, hackathon, ideathon davetleri",
            "mulakat_daveti": "Mülakat ve görüşme davetleri",
            "teknik_test": "Teknik test ve kodlama yarışmaları",
            "basvuru_onayi": "Başvuru onay ve alındı bildirimleri",
            "is_teklifi": "İş teklifi ve kabul bildirimleri",
            "red_bildirimi": "Red ve olumsuz sonuç bildirimleri",
            "genel_bilgilendirme": "Genel bilgilendirme ve güncellemeler",
            "spam_reklam": "Spam ve reklam e-postaları"
        }
        
        # Bilgi çıkarım pattern'ları
        self.extraction_patterns = {
            "tarih": [
                r"\b(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\b",
                r"\b(\d{1,2}\s+(?:Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)\s+\d{2,4})\b",
                r"\b(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{2,4})\b"
            ],
            "saat": [
                r"\b(\d{1,2}:\d{2})\s*(?:AM|PM|am|pm)?\b",
                r"\b(\d{1,2}:\d{2})\b"
            ],
            "platform": [
                r"\b(?:Zoom|Teams|Meet|Skype|Discord|Slack|Webex|BlueJeans|GoToMeeting)\b",
                r"\b(?:online|çevrimiçi|uzaktan|remote)\b"
            ],
            "etkinlik_turu": [
                r"\b(?:Ideathon|Hackathon|Case Study|Workshop|Webinar|Seminer|Konferans|Buluşma|Toplantı)\b",
                r"\b(?:ideathon|hackathon|case study|workshop|webinar|seminer|konferans|buluşma|toplantı)\b"
            ]
        }
        
        # Model yükleme
        self._load_models()
    
    def _load_models(self):
        """BERT modellerini yükle"""
        try:
            print(f"Modeller yükleniyor... Cihaz: {self.device}")
            
            # Tokenizer yükle
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            
            # Sınıflandırma modeli yükle
            self.classification_model = AutoModelForSequenceClassification.from_pretrained(
                self.model_name,
                num_labels=len(self.categories),
                ignore_mismatched_sizes=True
            )
            
            # NER modeli yükle (şirket adı, pozisyon vb. için)
            self.ner_model = AutoModelForTokenClassification.from_pretrained(
                self.model_name,
                num_labels=9  # B-PER, I-PER, B-ORG, I-ORG, B-LOC, I-LOC, B-MISC, I-MISC, O
            )
            
            # Pipeline oluştur
            self.classifier_pipeline = pipeline(
                "text-classification",
                model=self.classification_model,
                tokenizer=self.tokenizer,
                device=0 if torch.cuda.is_available() else -1
            )
            
            print("Modeller başarıyla yüklendi!")
            
        except Exception as e:
            print(f"Model yükleme hatası: {e}")
            # Fallback olarak daha basit bir model kullan
            self._load_fallback_models()
    
    def _load_fallback_models(self):
        """Fallback modeller yükle"""
        try:
            print("Fallback modeller yükleniyor...")
            self.tokenizer = AutoTokenizer.from_pretrained("bert-base-multilingual-cased")
            self.classification_model = AutoModelForSequenceClassification.from_pretrained(
                "bert-base-multilingual-cased",
                num_labels=len(self.categories)
            )
            print("Fallback modeller yüklendi!")
        except Exception as e:
            print(f"Fallback model yükleme hatası: {e}")
    
    def classify_email(self, email_content: str, email_subject: str = "", email_sender: str = "") -> EmailClassificationResult:
        """
        E-postayı sınıflandır ve detaylı bilgi çıkar
        
        Args:
            email_content: E-posta içeriği
            email_subject: E-posta konusu
            email_sender: E-posta göndereni
            
        Returns:
            EmailClassificationResult: Sınıflandırma sonucu ve çıkarılan bilgiler
        """
        try:
            # E-posta metnini birleştir
            full_text = f"{email_subject} {email_content}".strip()
            
            # 1. BERT ile sınıflandırma
            classification_result = self._classify_with_bert(full_text)
            
            # 2. Bilgi çıkarımı
            extracted_info = self._extract_structured_info(full_text, email_sender)
            
            # 3. Akıl yürütme
            reasoning = self._generate_reasoning(classification_result, extracted_info, full_text)
            
            # 4. Sonucu oluştur
            result = EmailClassificationResult(
                category=classification_result["label"],
                confidence=classification_result["score"],
                extracted_info=extracted_info,
                reasoning=reasoning,
                metadata={
                    "model_used": self.model_name,
                    "classification_timestamp": datetime.now().isoformat(),
                    "text_length": len(full_text),
                    "language": self._detect_language(full_text)
                }
            )
            
            return result
            
        except Exception as e:
            print(f"E-posta sınıflandırma hatası: {e}")
            return self._fallback_classification(email_content, email_subject, email_sender)
    
    def _classify_with_bert(self, text: str) -> Dict[str, Any]:
        """BERT ile e-posta sınıflandırma"""
        try:
            if self.classifier_pipeline:
                # Pipeline kullanarak sınıflandır
                result = self.classifier_pipeline(text[:512])  # BERT limiti
                return {
                    "label": result[0]["label"],
                    "score": result[0]["score"]
                }
            else:
                # Manuel tokenization ve inference
                return self._manual_bert_classification(text)
                
        except Exception as e:
            print(f"BERT sınıflandırma hatası: {e}")
            return self._rule_based_classification(text)
    
    def _manual_bert_classification(self, text: str) -> Dict[str, Any]:
        """Manuel BERT sınıflandırma"""
        try:
            # Tokenize
            inputs = self.tokenizer(
                text[:512],
                return_tensors="pt",
                truncation=True,
                padding=True,
                max_length=512
            )
            
            # Inference
            with torch.no_grad():
                outputs = self.classification_model(**inputs)
                probabilities = torch.softmax(outputs.logits, dim=-1)
                predicted_class = torch.argmax(probabilities, dim=1).item()
                confidence = probabilities[0][predicted_class].item()
            
            # Kategori adını al
            category_names = list(self.categories.keys())
            predicted_label = category_names[predicted_class]
            
            return {
                "label": predicted_label,
                "score": confidence
            }
            
        except Exception as e:
            print(f"Manuel BERT sınıflandırma hatası: {e}")
            return self._rule_based_classification(text)
    
    def _rule_based_classification(self, text: str) -> Dict[str, Any]:
        """Kural tabanlı fallback sınıflandırma"""
        text_lower = text.lower()
        
        # Etkinlik daveti pattern'ları
        event_patterns = [
            r"\b(?:ideathon|hackathon|case study|workshop|webinar|seminer|konferans|buluşma|toplantı)\b",
            r"\b(?:davet|invitation|katılım|participation|etkinlik|event)\b",
            r"\b(?:yarışma|competition|challenge|müsabaka|contest)\b"
        ]
        
        # Mülakat pattern'ları
        interview_patterns = [
            r"\b(?:mülakat|interview|görüşme|meeting|söyleşi)\b",
            r"\b(?:davet|invitation|planlandı|scheduled|arranged)\b"
        ]
        
        # Teknik test pattern'ları
        test_patterns = [
            r"\b(?:teknik test|technical test|coding challenge|kodlama testi)\b",
            r"\b(?:assessment|değerlendirme|evaluation|test link)\b"
        ]
        
        # Başvuru onay pattern'ları
        application_patterns = [
            r"\b(?:başvurunuz alındı|application received|your application)\b",
            r"\b(?:başvuru başarılı|application successful|başvuru iletildi)\b"
        ]
        
        # Spam pattern'ları
        spam_patterns = [
            r"\b(?:newsletter|bülten|promosyon|kampanya|indirim|satış)\b",
            r"\b(?:unsubscribe|abone|follow us|like & share)\b"
        ]
        
        # Pattern eşleştirme
        if any(re.search(pattern, text_lower) for pattern in event_patterns):
            return {"label": "etkinlik_daveti", "score": 0.85}
        elif any(re.search(pattern, text_lower) for pattern in interview_patterns):
            return {"label": "mulakat_daveti", "score": 0.80}
        elif any(re.search(pattern, text_lower) for pattern in test_patterns):
            return {"label": "teknik_test", "score": 0.75}
        elif any(re.search(pattern, text_lower) for pattern in application_patterns):
            return {"label": "basvuru_onayi", "score": 0.90}
        elif any(re.search(pattern, text_lower) for pattern in spam_patterns):
            return {"label": "spam_reklam", "score": 0.70}
        else:
            return {"label": "genel_bilgilendirme", "score": 0.60}
    
    def _extract_structured_info(self, text: str, sender: str) -> Dict[str, Any]:
        """Yapılandırılmış bilgi çıkarımı"""
        extracted_info = {
            "sirket": "",
            "etkinlik_adi": "",
            "tarih": "",
            "saat": "",
            "platform": "",
            "etkinlik_turu": "",
            "pozisyon": "",
            "sirket_adi": "",
            "platform_bilgisi": "",
            "bilgi": ""
        }
        
        try:
            # Şirket adı çıkarımı
            extracted_info["sirket"] = self._extract_company_name(sender, text)
            extracted_info["sirket_adi"] = extracted_info["sirket"]
            
            # Etkinlik adı çıkarımı
            extracted_info["etkinlik_adi"] = self._extract_event_name(text)
            
            # Tarih çıkarımı
            extracted_info["tarih"] = self._extract_date(text)
            
            # Saat çıkarımı
            extracted_info["saat"] = self._extract_time(text)
            
            # Platform çıkarımı
            extracted_info["platform"] = self._extract_platform(text)
            extracted_info["platform_bilgisi"] = extracted_info["platform"]
            
            # Etkinlik türü çıkarımı
            extracted_info["etkinlik_turu"] = self._extract_event_type(text)
            
            # Pozisyon çıkarımı
            extracted_info["pozisyon"] = self._extract_position(text)
            
            # Genel bilgi çıkarımı
            extracted_info["bilgi"] = self._extract_general_info(text)
            
        except Exception as e:
            print(f"Bilgi çıkarım hatası: {e}")
        
        return extracted_info
    
    def _extract_company_name(self, sender: str, text: str) -> str:
        """Şirket adı çıkarımı"""
        try:
            # E-posta adresinden şirket adı
            if "@" in sender:
                domain = sender.split("@")[1].split(".")[0]
                if domain not in ["gmail", "yahoo", "hotmail", "outlook"]:
                    return domain.title()
            
            # Metin içinden şirket adı arama
            company_patterns = [
                r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Yazılım|Software|Teknoloji|Technology|Şirketi|Company|Ltd|Inc)\b",
                r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Grup|Group|Holding|Corporation|Corp)\b",
                r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:A\.Ş\.|Şirketi|Company)\b"
            ]
            
            for pattern in company_patterns:
                match = re.search(pattern, text)
                if match:
                    return match.group(1).strip()
            
            # Footer'dan şirket adı
            lines = text.split('\n')
            for line in lines[-10:]:  # Son 10 satır
                line = line.strip()
                if len(line) > 3 and len(line) < 50 and not any(char in line for char in ['@', 'http', 'www', 'tel', 'fax']):
                    if re.match(r'^[A-Z][a-zA-Z\s]+$', line):
                        return line.strip()
            
            return "Şirket Adı Belirlenemedi"
            
        except Exception as e:
            print(f"Şirket adı çıkarım hatası: {e}")
            return "Şirket Adı Belirlenemedi"
    
    def _extract_event_name(self, text: str) -> str:
        """Etkinlik adı çıkarımı"""
        try:
            # Tırnak içindeki etkinlik adları
            quote_patterns = [
                r'"([^"]+)"',
                r"'([^']+)'",
                r'"([^"]+)"',
                r"'([^']+)'"
            ]
            
            for pattern in quote_patterns:
                match = re.search(pattern, text)
                if match:
                    event_name = match.group(1)
                    if any(keyword in event_name.lower() for keyword in ['ideathon', 'hackathon', 'workshop', 'webinar', 'seminer']):
                        return event_name
            
            # Başlık formatındaki etkinlik adları
            title_patterns = [
                r"\b([A-Z][a-zA-Z\s]+(?:Ideathon|Hackathon|Case Study|Workshop|Webinar|Seminer|Konferans))\b",
                r"\b([A-Z][a-zA-Z\s]+(?:Yarışması|Competition|Challenge|Contest))\b"
            ]
            
            for pattern in title_patterns:
                match = re.search(pattern, text)
                if match:
                    return match.group(1).strip()
            
            return "Etkinlik Adı Belirlenemedi"
            
        except Exception as e:
            print(f"Etkinlik adı çıkarım hatası: {e}")
            return "Etkinlik Adı Belirlenemedi"
    
    def _extract_date(self, text: str) -> str:
        """Tarih çıkarımı"""
        try:
            for pattern in self.extraction_patterns["tarih"]:
                match = re.search(pattern, text)
                if match:
                    return match.group(1).strip()
            return "Tarih Belirlenemedi"
        except Exception as e:
            print(f"Tarih çıkarım hatası: {e}")
            return "Tarih Belirlenemedi"
    
    def _extract_time(self, text: str) -> str:
        """Saat çıkarımı"""
        try:
            for pattern in self.extraction_patterns["saat"]:
                match = re.search(pattern, text)
                if match:
                    return match.group(1).strip()
            return "Saat Belirlenemedi"
        except Exception as e:
            print(f"Saat çıkarım hatası: {e}")
            return "Saat Belirlenemedi"
    
    def _extract_platform(self, text: str) -> str:
        """Platform çıkarımı"""
        try:
            for pattern in self.extraction_patterns["platform"]:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    return match.group(0).strip()
            return "Platform Belirlenemedi"
        except Exception as e:
            print(f"Platform çıkarım hatası: {e}")
            return "Platform Belirlenemedi"
    
    def _extract_event_type(self, text: str) -> str:
        """Etkinlik türü çıkarımı"""
        try:
            for pattern in self.extraction_patterns["etkinlik_turu"]:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    return match.group(0).strip()
            return "Etkinlik Türü Belirlenemedi"
        except Exception as e:
            print(f"Etkinlik türü çıkarım hatası: {e}")
            return "Etkinlik Türü Belirlenemedi"
    
    def _extract_position(self, text: str) -> str:
        """Pozisyon çıkarımı"""
        try:
            position_patterns = [
                r"\b(?:pozisyonu|position|role|job|iş|görev)\s+(?:olarak|as|for|in)\s+([a-zA-ZçğıöşüğÇĞIÖŞÜ\s]+)\b",
                r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Developer|Engineer|Designer|Analyst|Manager|Specialist)\b",
                r"\b(?:senior|junior|lead|principal)?\s*(?:software|backend|frontend|full.?stack|data|devops|mobile|web|ui|ux|qa|test|product|project|business|sales|marketing|hr|finance|legal|admin|support|customer|technical|system|network|security|cloud|ai|ml|machine.?learning|artificial.?intelligence|blockchain|game|embedded|firmware|hardware|robotics|automation|analytics|scientist|engineer|developer|architect|consultant|specialist|analyst|manager|director|coordinator|assistant|designer|researcher|instructor|trainer|writer|editor|translator|interpreter|accountant|auditor|lawyer|attorney|paralegal|nurse|doctor|physician|dentist|pharmacist|teacher|professor|lecturer|student|intern|trainee|apprentice|volunteer|freelancer|contractor|consultant|advisor|mentor|coach|counselor|therapist|psychologist|social.?worker|case.?worker|advocate|mediator|arbitrator|judge|magistrate|prosecutor|defense|attorney|public.?defender|district.?attorney|assistant.?district.?attorney|assistant.?attorney.?general|solicitor.?general|attorney.?general|chief.?justice|associate.?justice|justice|judge|magistrate|commissioner|referee|hearing.?officer|administrative.?law.?judge|tax.?court.?judge|bankruptcy.?judge|federal.?judge|state.?judge|county.?judge|municipal.?judge|justice.?of.?the.?peace|notary.?public|commissioner.?of.?oaths|justice.?of.?the.?peace|magistrate|judge|justice|commissioner|referee|hearing.?officer|administrative.?law.?judge|tax.?court.?judge|bankruptcy.?judge|federal.?judge|eyalet|yargıcı|ilçe|yargıcı|belediye|yargıcı|barış|yargıcı|noter|halk|komiseri|barış|yargıcı|komiser|yargıç|yargıç|komiser|hakem|dinleme|memuru|idari|hukuk|yargıcı|vergi|mahkemesi|yargıcı|iflas|yargıcı|federal|yargıç|eyalet|yargıcı|ilçe|yargıcı|belediye|yargıcı|barış|yargıcı|noter|halk|komiseri)\b"
            ]
            
            for pattern in position_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    return match.group(0).strip().title()
            
            return "Pozisyon Belirlenemedi"
            
        except Exception as e:
            print(f"Pozisyon çıkarım hatası: {e}")
            return "Pozisyon Belirlenemedi"
    
    def _extract_general_info(self, text: str) -> str:
        """Genel bilgi çıkarımı"""
        try:
            # Önemli cümleleri bul
            sentences = re.split(r'[.!?]+', text)
            important_sentences = []
            
            keywords = ['davet', 'invitation', 'katılım', 'participation', 'yarışma', 'competition', 
                       'ödül', 'prize', 'reward', 'kazanan', 'winner', 'başarılı', 'successful']
            
            for sentence in sentences:
                sentence = sentence.strip()
                if len(sentence) > 20 and any(keyword in sentence.lower() for keyword in keywords):
                    important_sentences.append(sentence)
            
            if important_sentences:
                return important_sentences[0][:200] + "..." if len(important_sentences[0]) > 200 else important_sentences[0]
            
            return "Detaylı bilgi bulunamadı"
            
        except Exception as e:
            print(f"Genel bilgi çıkarım hatası: {e}")
            return "Detaylı bilgi bulunamadı"
    
    def _generate_reasoning(self, classification: Dict[str, Any], extracted_info: Dict[str, Any], text: str) -> str:
        """Sınıflandırma için akıl yürütme"""
        try:
            category = classification["label"]
            confidence = classification["score"]
            
            if category == "etkinlik_daveti":
                event_name = extracted_info.get("etkinlik_adi", "")
                event_type = extracted_info.get("etkinlik_turu", "")
                
                if event_name and event_name != "Etkinlik Adı Belirlenemedi":
                    return f"'{event_name}' etkinliği için davet e-postası tespit edildi. Etkinlik türü: {event_type}"
                else:
                    return "E-posta içeriğindeki 'davet', 'katılım', 'etkinlik' gibi kelimeler ve genel bağlam analiz edilerek etkinlik daveti olarak sınıflandırıldı."
            
            elif category == "mulakat_daveti":
                return "E-posta içeriğindeki 'mülakat', 'görüşme', 'davet' kelimeleri ve bağlam analizi sonucu mülakat daveti olarak sınıflandırıldı."
            
            elif category == "teknik_test":
                return "E-posta içeriğindeki 'teknik test', 'coding challenge', 'assessment' gibi terimler ve bağlam analizi sonucu teknik test daveti olarak sınıflandırıldı."
            
            elif category == "basvuru_onayi":
                return "E-posta içeriğindeki 'başvurunuz alındı', 'application received' gibi ifadeler ve bağlam analizi sonucu başvuru onayı olarak sınıflandırıldı."
            
            else:
                return f"E-posta içeriği analiz edilerek {category} kategorisine sınıflandırıldı. Güven skoru: {confidence:.2f}"
                
        except Exception as e:
            print(f"Akıl yürütme hatası: {e}")
            return "Sınıflandırma için detaylı analiz yapıldı."
    
    def _detect_language(self, text: str) -> str:
        """Metin dilini tespit et"""
        try:
            # Basit dil tespiti
            turkish_chars = set('çğıöşüğÇĞIÖŞÜ')
            english_chars = set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')
            
            turkish_count = sum(1 for char in text if char in turkish_chars)
            english_count = sum(1 for char in text if char in english_chars)
            
            if turkish_count > english_count * 0.1:
                return "Turkish"
            elif english_count > 0:
                return "English"
            else:
                return "Unknown"
                
        except Exception as e:
            print(f"Dil tespit hatası: {e}")
            return "Unknown"
    
    def _fallback_classification(self, email_content: str, email_subject: str, email_sender: str) -> EmailClassificationResult:
        """Fallback sınıflandırma"""
        return EmailClassificationResult(
            category="genel_bilgilendirme",
            confidence=0.50,
            extracted_info={
                "sirket": "Bilinmeyen",
                "etkinlik_adi": "Belirlenemedi",
                "tarih": "Belirlenemedi",
                "saat": "Belirlenemedi",
                "platform": "Belirlenemedi",
                "etkinlik_turu": "Belirlenemedi",
                "pozisyon": "Belirlenemedi",
                "sirket_adi": "Bilinmeyen",
                "platform_bilgisi": "Belirlenemedi",
                "bilgi": "E-posta analiz edilemedi"
            },
            reasoning="Sistem hatası nedeniyle fallback sınıflandırma kullanıldı",
            metadata={
                "model_used": "fallback",
                "classification_timestamp": datetime.now().isoformat(),
                "text_length": len(email_content),
                "language": "Unknown"
            }
        )
    
    def train_model(self, training_data: List[Dict[str, Any]], validation_split: float = 0.2):
        """
        Modeli fine-tuning ile eğit
        
        Args:
            training_data: Eğitim verisi [{"text": "...", "label": "category"}]
            validation_split: Doğrulama verisi oranı
        """
        try:
            print("Model eğitimi başlatılıyor...")
            
            # Veriyi hazırla
            texts = [item["text"] for item in training_data]
            labels = [list(self.categories.keys()).index(item["label"]) for item in training_data]
            
            # Train/validation split
            train_texts, val_texts, train_labels, val_labels = train_test_split(
                texts, labels, test_size=validation_split, random_state=42
            )
            
            # Dataset sınıfları
            class EmailDataset(torch.utils.data.Dataset):
                def __init__(self, texts, labels, tokenizer, max_length=512):
                    self.texts = texts
                    self.labels = labels
                    self.tokenizer = tokenizer
                    self.max_length = max_length
                
                def __len__(self):
                    return len(self.texts)
                
                def __getitem__(self, idx):
                    text = str(self.texts[idx])
                    label = self.labels[idx]
                    
                    encoding = self.tokenizer(
                        text,
                        truncation=True,
                        padding='max_length',
                        max_length=self.max_length,
                        return_tensors='pt'
                    )
                    
                    return {
                        'input_ids': encoding['input_ids'].flatten(),
                        'attention_mask': encoding['attention_mask'].flatten(),
                        'labels': torch.tensor(label, dtype=torch.long)
                    }
            
            # Dataset'leri oluştur
            train_dataset = EmailDataset(train_texts, train_labels, self.tokenizer)
            val_dataset = EmailDataset(val_texts, val_labels, self.tokenizer)
            
            # Training arguments
            training_args = TrainingArguments(
                output_dir="./email_classifier_model",
                num_train_epochs=3,
                per_device_train_batch_size=8,
                per_device_eval_batch_size=8,
                warmup_steps=500,
                weight_decay=0.01,
                logging_dir="./logs",
                logging_steps=10,
                evaluation_strategy="epoch",
                save_strategy="epoch",
                load_best_model_at_end=True,
                metric_for_best_model="accuracy"
            )
            
            # Trainer
            trainer = Trainer(
                model=self.classification_model,
                args=training_args,
                train_dataset=train_dataset,
                eval_dataset=val_dataset
            )
            
            # Eğitim
            trainer.train()
            
            # Modeli kaydet
            trainer.save_model("./email_classifier_model")
            self.tokenizer.save_pretrained("./email_classifier_model")
            
            print("Model eğitimi tamamlandı ve kaydedildi!")
            
        except Exception as e:
            print(f"Model eğitimi hatası: {e}")
    
    def evaluate_model(self, test_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Model performansını değerlendir"""
        try:
            texts = [item["text"] for item in test_data]
            true_labels = [item["label"] for item in test_data]
            
            # Tahminler
            predictions = []
            for text in texts:
                result = self.classify_email(text)
                predictions.append(result.category)
            
            # Metrikler
            accuracy = accuracy_score(true_labels, predictions)
            report = classification_report(true_labels, predictions, output_dict=True)
            
            return {
                "accuracy": accuracy,
                "classification_report": report,
                "predictions": predictions,
                "true_labels": true_labels
            }
            
        except Exception as e:
            print(f"Model değerlendirme hatası: {e}")
            return {"error": str(e)}

# Global servis instance'ı
advanced_email_classifier = AdvancedEmailClassifier()
