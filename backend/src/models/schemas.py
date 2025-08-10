from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class UserData(BaseModel):
    """Kullanıcı verisi şeması"""
    userId: str = Field(..., description="Kullanıcı ID'si")

class EmailData(BaseModel):
    """E-posta verisi şeması"""
    id: str = Field(..., description="E-posta ID'si")
    subject: str = Field(..., description="E-posta konusu")
    sender: str = Field(..., description="Gönderen")
    date: str = Field(..., description="Tarih")
    body: str = Field(..., description="E-posta içeriği")
    snippet: Optional[str] = Field(None, description="E-posta özeti")

class EmailsData(BaseModel):
    """E-postalar verisi şeması"""
    emails: List[EmailData] = Field(..., description="E-posta listesi")

class ApplicationData(BaseModel):
    """Başvuru verisi şeması"""
    is_job_application: bool = Field(..., description="İş başvurusu mu?")
    application_type: Optional[str] = Field(None, description="Başvuru tipi")
    company_name: Optional[str] = Field(None, description="Şirket adı")
    position: Optional[str] = Field(None, description="Pozisyon")
    application_status: Optional[str] = Field(None, description="Başvuru durumu")
    next_action: Optional[str] = Field(None, description="Sonraki adım")
    deadline: Optional[str] = Field(None, description="Son tarih")
    contact_person: Optional[str] = Field(None, description="İletişim kişisi")
    salary_info: Optional[str] = Field(None, description="Maaş bilgisi")
    location: Optional[str] = Field(None, description="Konum")
    requirements: Optional[str] = Field(None, description="Gereksinimler")
    email_id: Optional[str] = Field(None, description="E-posta ID'si")
    email_subject: Optional[str] = Field(None, description="E-posta konusu")
    email_sender: Optional[str] = Field(None, description="E-posta gönderen")
    email_date: Optional[str] = Field(None, description="E-posta tarihi")
    analyzed_at: Optional[str] = Field(None, description="Analiz tarihi")
    analysis_method: Optional[str] = Field(None, description="Analiz yöntemi")

class ApplicationsData(BaseModel):
    """Başvurular verisi şeması"""
    applications: List[ApplicationData] = Field(..., description="Başvuru listesi")
    userId: str = Field(..., description="Kullanıcı ID'si")

class GmailCallbackData(BaseModel):
    """Gmail callback verisi şeması"""
    code: str = Field(..., description="OAuth kodu")
    state: str = Field(..., description="OAuth state")

class AIPromptData(BaseModel):
    """AI prompt verisi şeması"""
    prompt: str = Field(..., description="AI prompt'u")

class TextData(BaseModel):
    """Metin verisi şeması"""
    text: str = Field(..., description="İşlenecek metin")

class ModelSearchData(BaseModel):
    """Model arama verisi şeması"""
    query: str = Field(..., description="Arama sorgusu")
    limit: int = Field(10, description="Sonuç limiti")

class InferenceData(BaseModel):
    """Inference verisi şeması"""
    model_id: str = Field(..., description="Model ID'si")
    inputs: Dict[str, Any] = Field(..., description="Model girdileri")

class ApplicationUpdateData(BaseModel):
    """Başvuru güncelleme verisi şeması"""
    company_name: Optional[str] = Field(None, description="Şirket adı")
    position: Optional[str] = Field(None, description="Pozisyon")
    application_status: Optional[str] = Field(None, description="Başvuru durumu")
    next_action: Optional[str] = Field(None, description="Sonraki adım")
    deadline: Optional[str] = Field(None, description="Son tarih")
    contact_person: Optional[str] = Field(None, description="İletişim kişisi")
    salary_info: Optional[str] = Field(None, description="Maaş bilgisi")
    location: Optional[str] = Field(None, description="Konum")
    requirements: Optional[str] = Field(None, description="Gereksinimler")

class GmailConnectRequest(BaseModel):
    userId: str

class GmailDisconnectRequest(BaseModel):
    userId: str

class EmailAnalysisRequest(BaseModel):
    emails: List[Dict]

class ApplicationSaveRequest(BaseModel):
    userId: str
    applications: List[Dict]

class AIPromptRequest(BaseModel):
    prompt: str
