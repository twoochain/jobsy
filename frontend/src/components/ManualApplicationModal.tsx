"use client";
import { useState } from 'react';
import { XMarkIcon, PlusIcon, SparklesIcon, LinkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { createManualApplication, analyzeJobPosting, createChromaApplication } from '../utils/api';

interface ManualApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onApplicationCreated: (newApplication: any) => void;
}

interface ApplicationFormData {
  // Türkçe alan adları - ChromaDB entegrasyonu için
  baslik: string;                    // position
  sirket: string;                    // company_name
  konum: string;                     // location
  aciklama: string;                  // description
  gereksinimler: string;             // requirements
  benefits: string;                  // benefits (backend'den gelen alan)
  alan: string;                      // field
  sure: string;                      // duration
  ucretli: boolean;                  // is_paid
  durum: string;                     // application_status
  
  // Mevcut alanlar (geriye uyumluluk için)
  application_type: string;
  contact_person: string;
  salary_info: string;
  deadline: string;
  next_action: string;
  email_content: string;
  job_posting_url?: string;
  job_posting_text?: string;
}

export default function ManualApplicationModal({
  isOpen,
  onClose,
  userId,
  onApplicationCreated
}: ManualApplicationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [formData, setFormData] = useState<ApplicationFormData>({
    baslik: '',
    sirket: '',
    konum: '',
    aciklama: '',
    gereksinimler: '',
    benefits: '',
    alan: '',
    sure: '',
    ucretli: false,
    durum: 'Başvuruldu',
    application_type: 'job',
    contact_person: '',
    salary_info: '',
    deadline: '',
    next_action: 'Detaylı inceleme',
    email_content: '',
    job_posting_url: '',
    job_posting_text: ''
  });

  const [errors, setErrors] = useState<Partial<ApplicationFormData>>({});

  const handleInputChange = (field: keyof ApplicationFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleAnalyzeJobPosting = async () => {
    if (!formData.job_posting_url && !formData.job_posting_text) {
      alert('Lütfen önce ilan linkini veya metnini girin');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const requestData = {
        job_posting_url: formData.job_posting_url,
        job_posting_text: formData.job_posting_text
      };
      
      const response = await analyzeJobPosting(requestData);
      
      if (response.success && response.data) {
        // Form'u otomatik doldur
        const updatedFormData = {
          ...formData,
          sirket: response.data.company_name || formData.sirket,
          baslik: response.data.position || formData.baslik,
          konum: response.data.location || formData.konum,
          aciklama: response.data.description || formData.aciklama,
          gereksinimler: response.data.requirements || formData.gereksinimler,
          benefits: response.data.benefits || formData.benefits,
          alan: response.data.field || formData.alan,
          sure: response.data.duration || formData.sure,
          ucretli: typeof response.data.is_paid === 'boolean' ? response.data.is_paid : 
                   (response.data.is_paid === 'true' || response.data.is_paid === true) || formData.ucretli,
          durum: response.data.application_status || formData.durum,
          contact_person: response.data.contact_info || formData.contact_person,
          deadline: response.data.deadline || formData.deadline
        };
        
        setFormData(updatedFormData);
        
        // Başarı mesajı göster
        const sourceText = response.source === 'gemini_api' ? 'Gemini AI' : 'AI';
        alert(`✅ İlan ${sourceText} ile başarıyla analiz edildi ve form otomatik dolduruldu!`);
        
        // Ek bilgileri göster
        if (response.data.benefits || response.data.company_description) {
          let extraInfo = '';
          if (response.data.benefits && response.data.benefits !== 'Belirtilmemiş') {
            extraInfo += `\n\n💼 Benefits: ${response.data.benefits}`;
          }
          if (response.data.company_description && response.data.company_description !== 'Belirtilmemiş') {
            extraInfo += `\n\n🏢 Şirket: ${response.data.company_description}`;
          }
          if (extraInfo) {
            alert(`📊 Analiz Sonuçları:${extraInfo}`);
          }
        }
      } else {
        // Hata mesajını daha detaylı göster
        const errorMessage = response.error || response.message || 'Bilinmeyen hata';
        alert(`❌ Analiz hatası: ${errorMessage}`);
        
        // API key hatası varsa kullanıcıya bilgi ver
        if (errorMessage.includes('API anahtarı') || errorMessage.includes('API key')) {
          alert('💡 Çözüm: Backend\'de .env dosyasında GEMINI_API_KEY tanımlayın');
        }
      }
    } catch (error: any) {
      console.error('İlan analiz hatası:', error);
      const errorMessage = error.message || 'Bilinmeyen hata';
      alert(`❌ İlan analiz edilirken bir hata oluştu: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ApplicationFormData> = {};
    
    if (!formData.sirket.trim()) {
      newErrors.sirket = 'Şirket adı gerekli';
    }
    
    if (!formData.baslik.trim()) {
      newErrors.baslik = 'Pozisyon gerekli';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Form verisi gönderiliyor:', { userId, ...formData });
      
      const response = await createChromaApplication({
        userId,
        ...formData
      });

      console.log('Backend response:', response);

      if (response && response.success) {
        // Reset form
        setFormData({
          baslik: '',
          sirket: '',
          konum: '',
          aciklama: '',
          gereksinimler: '',
          benefits: '',
          alan: '',
          sure: '',
          ucretli: false,
          durum: 'Başvuruldu',
          application_type: 'job',
          contact_person: '',
          salary_info: '',
          deadline: '',
          next_action: 'Detaylı inceleme',
          email_content: '',
          job_posting_url: '',
          job_posting_text: ''
        });
        
        // Backend'den gelen response'u kullan veya yeni başvuru verisini oluştur
        let newApplication;
        
        if (response.data && response.data.application) {
          // Backend'den gelen veriyi kullan
          const backendApp = response.data.application;
          newApplication = {
            id: backendApp.id || Date.now(),
            company: backendApp.company_name || formData.sirket,
            position: backendApp.position || formData.baslik,
            date: new Date().toISOString().split('T')[0],
            stage: backendApp.application_status || formData.durum,
            status: 'active',
            stageOrder: (backendApp.application_status || formData.durum) === 'Başvuruldu' ? 1 : 
                       (backendApp.application_status || formData.durum) === 'Portfolio İncelemesi' || (backendApp.application_status || formData.durum) === 'İlk Görüşme' ? 2 :
                       (backendApp.application_status || formData.durum) === 'Mülakat Daveti' ? 3 :
                       (backendApp.application_status || formData.durum) === 'Teknik Test' ? 4 :
                       (backendApp.application_status || formData.durum) === 'Final Mülakat' ? 5 :
                       (backendApp.application_status || formData.durum) === 'Teklif' ? 6 :
                       (backendApp.application_status || formData.durum) === 'Red' ? 7 : 1,
            application_type: backendApp.application_type || formData.application_type,
            contact_person: backendApp.contact_person || formData.contact_person,
            location: backendApp.location || formData.konum,
            salary_info: backendApp.salary_info || formData.salary_info,
            requirements: backendApp.requirements || formData.gereksinimler,
            deadline: backendApp.deadline || formData.deadline,
            tasks: [backendApp.next_action || formData.next_action],
            created_at: backendApp.created_at || new Date().toISOString()
          };
        } else {
                   // Fallback: Yeni başvuru verisini oluştur
         newApplication = {
           id: crypto.randomUUID(),
           company: formData.sirket,
            position: formData.baslik,
            date: new Date().toISOString().split('T')[0],
            stage: formData.durum,
            status: 'active',
            stageOrder: formData.durum === 'Başvuruldu' ? 1 : 
                       formData.durum === 'Portfolio İncelemesi' || formData.durum === 'İlk Görüşme' ? 2 :
                       formData.durum === 'Mülakat Daveti' ? 3 :
                       formData.durum === 'Teknik Test' ? 4 :
                       formData.durum === 'Final Mülakat' ? 5 :
                       formData.durum === 'Teklif' ? 6 :
                       formData.durum === 'Red' ? 7 : 1,
            application_type: formData.application_type,
            contact_person: formData.contact_person,
            location: formData.konum,
            salary_info: formData.salary_info,
            requirements: formData.gereksinimler,
            deadline: formData.deadline,
            tasks: [formData.next_action],
            created_at: new Date().toISOString()
          };
        }
        
        onApplicationCreated(newApplication);
        onClose();
      } else {
        alert(`Hata: ${response.error || 'Bilinmeyen hata'}`);
      }
    } catch (error: any) {
      console.error('Başvuru oluşturma hatası:', error);
      alert(`Başvuru oluşturulurken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <PlusIcon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">
                Yeni Başvuru Ekle
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/20"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* AI İlan Analizi */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <SparklesIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">🤖 AI İlan Analizi</h3>
                  <p className="text-sm text-gray-600">İlan linkini veya metnini yapıştırın, AI otomatik doldursun</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <LinkIcon className="w-4 h-4 inline mr-2" />
                    İlan Linki
                  </label>
                  <input
                    type="url"
                    value={formData.job_posting_url}
                    onChange={(e) => handleInputChange('job_posting_url', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500 bg-white font-medium"
                    placeholder="https://example.com/job-posting"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DocumentTextIcon className="w-4 h-4 inline mr-2" />
                    İlan Metni
                  </label>
                  <textarea
                    value={formData.job_posting_text}
                    onChange={(e) => handleInputChange('job_posting_text', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none text-gray-900 placeholder-gray-500 bg-white font-medium"
                    placeholder="İlan metnini buraya yapıştırın..."
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  💡 Link veya metin girin, AI şirket, pozisyon, gereksinimler gibi bilgileri otomatik çıkarsın
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleAnalyzeJobPosting();
                  }}
                  disabled={isAnalyzing || (!formData.job_posting_url && !formData.job_posting_text)}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analiz Ediliyor...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-4 h-4 mr-2" />
                      AI ile Analiz Et
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Temel Bilgiler */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                Temel Bilgiler
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Şirket Adı <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.sirket}
                    onChange={(e) => handleInputChange('sirket', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500 font-medium ${
                      errors.sirket ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400 bg-white'
                    }`}
                    placeholder="Örn: Google, Microsoft, Startup XYZ"
                  />
                  {errors.sirket && (
                    <p className="text-red-500 text-sm mt-1">{errors.sirket}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pozisyon <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.baslik}
                    onChange={(e) => handleInputChange('baslik', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500 font-medium ${
                      errors.baslik ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400 bg-white'
                    }`}
                    placeholder="Örn: Senior Frontend Developer"
                  />
                  {errors.baslik && (
                    <p className="text-red-500 text-sm mt-1">{errors.baslik}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Durum ve Tür */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Başvuru Detayları
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başvuru Durumu
                  </label>
                  <select
                    value={formData.durum}
                    onChange={(e) => handleInputChange('durum', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all text-gray-900 placeholder-gray-500 bg-white font-medium"
                  >
                    <option value="Başvuruldu">📝 Başvuruldu</option>
                    <option value="CV Gönderildi">📄 CV Gönderildi</option>
                    <option value="İlk Görüşme">👥 İlk Görüşme</option>
                    <option value="Mülakat">🎯 Mülakat</option>
                    <option value="Teknik Test">🧪 Teknik Test</option>
                    <option value="Final Mülakat">🏆 Final Mülakat</option>
                    <option value="Teklif">💰 Teklif</option>
                    <option value="Kabul">✅ Kabul</option>
                    <option value="Red">❌ Red</option>
                    <option value="Beklemede">⏳ Beklemede</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başvuru Türü
                  </label>
                  <select
                    value={formData.application_type}
                    onChange={(e) => handleInputChange('application_type', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all text-gray-900 placeholder-gray-500 bg-white font-medium"
                  >
                    <option value="job">💼 Tam Zamanlı İş</option>
                    <option value="part_time">⏰ Yarı Zamanlı İş</option>
                    <option value="internship">🎓 Staj</option>
                    <option value="freelance">🆓 Freelance</option>
                    <option value="contract">📋 Sözleşmeli</option>
                  </select>
                </div>
              </div>
            </div>

            {/* İletişim Bilgileri */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                İletişim Bilgileri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İletişim Kişisi
                  </label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => handleInputChange('contact_person', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all text-gray-900 placeholder-gray-500 bg-white font-medium"
                    placeholder="Örn: Ahmet Yılmaz (HR Manager)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lokasyon
                  </label>
                  <input
                    type="text"
                    value={formData.konum}
                    onChange={(e) => handleInputChange('konum', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all text-gray-900 placeholder-gray-500 bg-white font-medium"
                    placeholder="Örn: İstanbul, Remote, Hibrit"
                  />
                </div>
              </div>
            </div>

            {/* Maaş ve Gereksinimler */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                Ek Bilgiler
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maaş Bilgisi
                  </label>
                  <input
                    type="text"
                    value={formData.salary_info}
                    onChange={(e) => handleInputChange('salary_info', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all text-gray-900 placeholder-gray-500 bg-white font-medium"
                    placeholder="Örn: 25.000-35.000 TL, Müzakere edilebilir"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Son Tarih
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all text-gray-900 placeholder-gray-500 bg-white font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Gereksinimler */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gereksinimler
              </label>
              <textarea
                value={formData.gereksinimler}
                onChange={(e) => handleInputChange('gereksinimler', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all resize-none text-gray-900 placeholder-gray-500 bg-white font-medium"
                placeholder="Pozisyon gereksinimleri, teknolojiler, deneyim seviyesi..."
              />
            </div>

            {/* İş Açıklaması */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                İş Açıklaması
              </label>
              <textarea
                value={formData.aciklama}
                onChange={(e) => handleInputChange('aciklama', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all resize-none text-gray-900 placeholder-gray-500 bg-white font-medium"
                placeholder="İş pozisyonu hakkında detaylı açıklama, sorumluluklar, beklentiler..."
              />
            </div>

            {/* Benefits */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Benefits
              </label>
              <textarea
                value={formData.benefits}
                onChange={(e) => handleInputChange('benefits', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all resize-none text-gray-900 placeholder-gray-500 bg-white font-medium"
                placeholder="İşin avantajları, faydalar, özel koşullar..."
              />
            </div>

            {/* İş Alanı ve Süre */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                İş Detayları
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İş Alanı
                  </label>
                  <input
                    type="text"
                    value={formData.alan}
                    onChange={(e) => handleInputChange('alan', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all text-gray-900 placeholder-gray-500 bg-white font-medium"
                    placeholder="Örn: Backend, Frontend, DevOps, Data Science"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Süre
                  </label>
                  <input
                    type="text"
                    value={formData.sure}
                    onChange={(e) => handleInputChange('sure', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all text-gray-900 placeholder-gray-500 bg-white font-medium"
                    placeholder="Örn: Süresiz, 6 ay, 1 yıl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ücretli mi?
                  </label>
                  <select
                    value={formData.ucretli ? 'true' : 'false'}
                    onChange={(e) => handleInputChange('ucretli', e.target.value === 'true' ? true : false)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all text-gray-900 placeholder-gray-500 bg-white font-medium"
                  >
                    <option value="true">✅ Ücretli</option>
                    <option value="false">❌ Ücretsiz</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sonraki Aksiyon */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sonraki Aksiyon
              </label>
              <input
                type="text"
                value={formData.next_action}
                onChange={(e) => handleInputChange('next_action', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all text-gray-900 placeholder-gray-500 bg-white font-medium"
                placeholder="Örn: CV güncelle, Portfolio hazırla, Mülakat hazırlığı"
              />
            </div>

            {/* Notlar */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notlar
              </label>
              <textarea
                value={formData.email_content}
                onChange={(e) => handleInputChange('email_content', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all resize-none text-gray-900 placeholder-gray-500 bg-white font-medium"
                placeholder="Başvuru hakkında notlar, özel bilgiler, takip edilecek noktalar..."
              />
            </div>

            {/* Butonlar */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all font-medium"
                disabled={isLoading}
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Başvuru Oluştur
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
