"use client";
import { useState } from 'react';
import { XMarkIcon, PlusIcon, EnvelopeIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface EmailApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onApplicationCreated: (newApplication: any) => void;
  onApplicationUpdated?: (updatedApplication: any) => void;
  existingApplication?: any; // Eğer mevcut başvuru güncelleniyorsa
}

interface EmailFormData {
  company_name: string;
  position: string;
  application_status: string;
  email_sender: string;
  email_subject: string;
  email_content: string;
  email_date: string;
  next_action: string;
  notes: string;
  is_update: boolean; // Mevcut başvuru güncellemesi mi?
}

export default function EmailApplicationModal({
  isOpen,
  onClose,
  userId,
  onApplicationCreated,
  onApplicationUpdated,
  existingApplication
}: EmailApplicationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [formData, setFormData] = useState<EmailFormData>({
    company_name: existingApplication?.company || '',
    position: existingApplication?.position || '',
    application_status: existingApplication?.stage || 'Başvuruldu',
    email_sender: '',
    email_subject: '',
    email_content: '',
    email_date: new Date().toISOString().split('T')[0],
    next_action: '',
    notes: '',
    is_update: !!existingApplication
  });

  const [errors, setErrors] = useState<Partial<EmailFormData>>({});

  const handleInputChange = (field: keyof EmailFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleAnalyzeEmail = async () => {
    if (!formData.email_content.trim()) {
      alert('Lütfen email içeriğini girin');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Email içeriğinden şirket ve pozisyon bilgilerini çıkarmaya çalış
      const emailText = formData.email_content.toLowerCase();
      
      // Basit analiz - gerçek uygulamada AI kullanılabilir
      let detectedCompany = '';
      let detectedPosition = '';
      let detectedStatus = formData.application_status;
      
      // Email subject'ten bilgi çıkarma
      if (formData.email_subject) {
        const subject = formData.email_subject.toLowerCase();
        
        // Pozisyon tespiti
        if (subject.includes('developer') || subject.includes('engineer')) {
          detectedPosition = 'Developer/Engineer';
        } else if (subject.includes('designer')) {
          detectedPosition = 'Designer';
        } else if (subject.includes('manager')) {
          detectedPosition = 'Manager';
        }
        
        // Durum tespiti
        if (subject.includes('mülakat') || subject.includes('interview')) {
          detectedStatus = 'Mülakat Daveti';
        } else if (subject.includes('test') || subject.includes('sınav')) {
          detectedStatus = 'Teknik Test';
        } else if (subject.includes('teklif') || subject.includes('offer')) {
          detectedStatus = 'Teklif';
        } else if (subject.includes('red') || subject.includes('reject')) {
          detectedStatus = 'Red';
        }
      }
      
      // Email içeriğinden şirket tespiti
      const companyPatterns = [
        /(?:from|gönderen|şirket|company):\s*([^\n\r,]+)/i,
        /(?:@|at)\s*([a-zA-Z0-9.-]+)\.(?:com|tr|org|net)/i
      ];
      
      for (const pattern of companyPatterns) {
        const match = emailText.match(pattern);
        if (match && match[1]) {
          detectedCompany = match[1].trim();
          break;
        }
      }
      
      // Form'u güncelle
      setFormData(prev => ({
        ...prev,
        company_name: detectedCompany || prev.company_name,
        position: detectedPosition || prev.position,
        application_status: detectedStatus
      }));
      
      alert('Email analiz edildi ve form otomatik dolduruldu!');
      
    } catch (error: any) {
      console.error('Email analiz hatası:', error);
      alert(`Email analiz edilirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<EmailFormData> = {};
    
    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Şirket adı gerekli';
    }
    
    if (!formData.position.trim()) {
      newErrors.position = 'Pozisyon gerekli';
    }
    
    if (!formData.email_content.trim()) {
      newErrors.email_content = 'Email içeriği gerekli';
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
      if (formData.is_update && existingApplication) {
        // Mevcut başvuruyu güncelle
        const updatedApplication = {
          ...existingApplication,
          stage: formData.application_status,
          updated_at: new Date().toISOString(),
          email_id: existingApplication.email_id || Date.now().toString(),
          email_subject: formData.email_subject,
          email_sender: formData.email_sender,
          email_date: formData.email_date,
          tasks: formData.next_action ? [formData.next_action] : existingApplication.tasks || []
        };
        
        onApplicationUpdated?.(updatedApplication);
        onClose();
      } else {
                 // Yeni başvuru oluştur
         const newApplication = {
           id: crypto.randomUUID(),
           company: formData.company_name,
          position: formData.position,
          date: formData.email_date,
          stage: formData.application_status,
          status: 'active',
          stageOrder: formData.application_status === 'Başvuruldu' ? 1 : 
                     formData.application_status === 'Portfolio İncelemesi' || formData.application_status === 'İlk Görüşme' ? 2 :
                     formData.application_status === 'Mülakat Daveti' ? 3 :
                     formData.application_status === 'Teknik Test' ? 4 :
                     formData.application_status === 'Final Mülakat' ? 5 :
                     formData.application_status === 'Teklif' ? 6 :
                     formData.application_status === 'Red' ? 7 : 1,
                     email_id: crypto.randomUUID(),
          email_subject: formData.email_subject,
          email_sender: formData.email_sender,
          email_date: formData.email_date,
          tasks: formData.next_action ? [formData.next_action] : [],
          notes: formData.notes,
          created_at: new Date().toISOString()
        };
        
        onApplicationCreated(newApplication);
        onClose();
      }
    } catch (error: any) {
      console.error('İşlem hatası:', error);
      alert(`İşlem sırasında bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <EnvelopeIcon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">
                {formData.is_update ? 'Başvuru Güncelle' : 'Email ile Başvuru Ekle'}
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
            {/* Email Bilgileri */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <EnvelopeIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">📧 Email Bilgileri</h3>
                  <p className="text-sm text-gray-600">
                    {formData.is_update ? 'Başvuru ilerlemesi için gelen emaili girin' : 'Gelen emaili analiz ederek başvuru oluşturun'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gönderen
                  </label>
                  <input
                    type="text"
                    value={formData.email_sender}
                    onChange={(e) => handleInputChange('email_sender', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500 bg-white font-medium"
                    placeholder="Örn: hr@company.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Tarihi
                  </label>
                  <input
                    type="date"
                    value={formData.email_date}
                    onChange={(e) => handleInputChange('email_date', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500 bg-white font-medium"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Konusu
                </label>
                <input
                  type="text"
                  value={formData.email_subject}
                  onChange={(e) => handleInputChange('email_subject', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500 bg-white font-medium"
                  placeholder="Email konusu..."
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email İçeriği <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.email_content}
                  onChange={(e) => handleInputChange('email_content', e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none text-gray-900 placeholder-gray-500 font-medium ${
                    errors.email_content ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400 bg-white'
                  }`}
                  placeholder="Email içeriğini buraya yapıştırın..."
                />
                {errors.email_content && (
                  <p className="text-red-500 text-sm mt-1">{errors.email_content}</p>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  💡 Email içeriğini yapıştırın, AI otomatik olarak şirket ve pozisyon bilgilerini çıkarsın
                </div>
                <button
                  type="button"
                  onClick={handleAnalyzeEmail}
                  disabled={isAnalyzing || !formData.email_content.trim()}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analiz Ediliyor...
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="w-4 h-4 mr-2" />
                      Email'i Analiz Et
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
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500 font-medium ${
                      errors.company_name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400 bg-white'
                    }`}
                    placeholder="Örn: Google, Microsoft, Startup XYZ"
                  />
                  {errors.company_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pozisyon <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500 font-medium ${
                      errors.position ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400 bg-white'
                    }`}
                    placeholder="Örn: Senior Frontend Developer"
                  />
                  {errors.position && (
                    <p className="text-red-500 text-sm mt-1">{errors.position}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Durum */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Başvuru Durumu
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Güncel Durum
                </label>
                <select
                  value={formData.application_status}
                  onChange={(e) => handleInputChange('application_status', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent hover:border-gray-400 transition-all text-gray-900 placeholder-gray-500 bg-white font-medium"
                >
                  <option value="Başvuruldu">📝 Başvuruldu</option>
                  <option value="CV Gönderildi">📄 CV Gönderildi</option>
                  <option value="Portfolio İncelemesi">🎨 Portfolio İncelemesi</option>
                  <option value="İlk Görüşme">👥 İlk Görüşme</option>
                  <option value="Mülakat Daveti">🎯 Mülakat Daveti</option>
                  <option value="Mülakat">💼 Mülakat</option>
                  <option value="Teknik Test">🧪 Teknik Test</option>
                  <option value="Final Mülakat">🏆 Final Mülakat</option>
                  <option value="Teklif">💰 Teklif</option>
                  <option value="Kabul">✅ Kabul</option>
                  <option value="Red">❌ Red</option>
                  <option value="Beklemede">⏳ Beklemede</option>
                </select>
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent hover:border-gray-400 transition-all text-gray-900 placeholder-gray-500 bg-white font-medium"
                placeholder="Örn: CV güncelle, Portfolio hazırla, Mülakat hazırlığı"
              />
            </div>

            {/* Notlar */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notlar
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent hover:border-gray-400 transition-all resize-none text-gray-900 placeholder-gray-500 bg-white font-medium"
                placeholder="Email hakkında notlar, özel bilgiler, takip edilecek noktalar..."
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
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {formData.is_update ? 'Güncelleniyor...' : 'Oluşturuluyor...'}
                  </>
                ) : (
                  <>
                    {formData.is_update ? (
                      <>
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        Güncelle
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Başvuru Oluştur
                      </>
                    )}
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
