"use client";
import React, { useState, useEffect } from 'react';
import { XMarkIcon, SparklesIcon, BuildingOfficeIcon, BriefcaseIcon, ClockIcon, TagIcon, UserIcon, CurrencyDollarIcon, MapPinIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface ApplicationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: any;
  onCategorize?: () => void;
}

interface CategorizedData {
  company_name?: string;
  program_name?: string;
  position_type?: string;
  categories?: {
    sirket_bilgisi?: string;
    program_detayi?: string;
    teknoloji_alanlari?: string[];
    oduller_ve_basarilar?: string;
    aranan_nitelikler?: string;
    saglanan_ayricaliklar?: string;
  };
}

const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  isOpen,
  onClose,
  application,
  onCategorize
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [categorizedData, setCategorizedData] = useState<CategorizedData | null>(null);
  const [showCategories, setShowCategories] = useState(false);

  useEffect(() => {
    if (application?.categorized_data) {
      setCategorizedData(application.categorized_data);
      setShowCategories(true);
    }
  }, [application]);

  const handleCategorizeJobPosting = async () => {
    if (!application?.email_content && !application?.description) {
      alert('Kategorizasyon için yeterli içerik bulunamadı');
      return;
    }

    setIsAnalyzing(true);
    try {
      const jobText = application.email_content || application.description || '';
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/ai/categorize-job-posting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_text: jobText
        }),
      });

      if (!response.ok) {
        throw new Error('Kategorizasyon başarısız');
      }

      const result = await response.json();
      
      // AI yanıtından kategorize edilmiş veriyi çıkar
      if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
        const aiText = result.candidates[0].content.parts[0].text;
        try {
          const parsedData = JSON.parse(aiText);
          setCategorizedData(parsedData);
          setShowCategories(true);
          
          // Başvuruyu güncellemek için callback çağır
          if (onCategorize) {
            onCategorize();
          }
        } catch (parseError) {
          console.error('AI yanıtı parse edilemedi:', parseError);
          alert('AI yanıtı işlenirken hata oluştu');
        }
      }
    } catch (error) {
      console.error('Kategorizasyon hatası:', error);
      alert('Kategorizasyon sırasında hata oluştu');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sirket_bilgisi':
        return <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />;
      case 'program_detayi':
        return <BriefcaseIcon className="h-5 w-5 text-green-600" />;
      case 'teknoloji_alanlari':
        return <TagIcon className="h-5 w-5 text-purple-600" />;
      case 'oduller_ve_basarilar':
        return <CheckCircleIcon className="h-5 w-5 text-yellow-600" />;
      case 'aranan_nitelikler':
        return <UserIcon className="h-5 w-5 text-red-600" />;
      case 'saglanan_ayricaliklar':
        return <CurrencyDollarIcon className="h-5 w-5 text-indigo-600" />;
      default:
        return <TagIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'sirket_bilgisi':
        return 'Şirket Bilgisi';
      case 'program_detayi':
        return 'Program Detayı';
      case 'teknoloji_alanlari':
        return 'Teknoloji Alanları';
      case 'oduller_ve_basarilar':
        return 'Ödüller ve Başarılar';
      case 'aranan_nitelikler':
        return 'Aranan Nitelikler';
      case 'saglanan_ayricaliklar':
        return 'Sağlanan Ayrıcalıklar';
      default:
        return category;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Belirtilmemiş';
    try {
      return new Date(dateString).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (!isOpen || !application) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block w-full max-w-4xl transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:align-middle">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BriefcaseIcon className="h-6 w-6 text-gray-600" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {categorizedData?.program_name || application.position || 'Başvuru Detayı'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {categorizedData?.company_name || application.company_name || 'Şirket Adı'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!showCategories && (
                  <button
                    onClick={handleCategorizeJobPosting}
                    disabled={isAnalyzing}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200 disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-700" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analiz Ediliyor...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4 mr-2" />
                        AI ile Kategorize Et
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-4 max-h-96 overflow-y-auto">
            {/* Ana Bilgiler */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Genel Bilgiler</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Şirket</p>
                    <p className="text-sm text-gray-900">{categorizedData?.company_name || application.company_name || 'Belirtilmemiş'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <BriefcaseIcon className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pozisyon</p>
                    <p className="text-sm text-gray-900">{categorizedData?.program_name || application.position || 'Belirtilmemiş'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <TagIcon className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tür</p>
                    <p className="text-sm text-gray-900">{categorizedData?.position_type || application.application_type || 'Belirtilmemiş'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tarih</p>
                    <p className="text-sm text-gray-900">{formatDate(application.email_date || application.date)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Kategorize Edilmiş Veriler */}
            {showCategories && categorizedData?.categories && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <SparklesIcon className="h-5 w-5 text-purple-600" />
                  <h4 className="text-lg font-medium text-gray-900">AI ile Kategorize Edilmiş Bilgiler</h4>
                </div>

                {Object.entries(categorizedData.categories).map(([category, content]) => {
                  if (!content || content === 'Belirtilmemiş') return null;
                  
                  return (
                    <div key={category} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        {getCategoryIcon(category)}
                        <h5 className="font-medium text-gray-900">{getCategoryTitle(category)}</h5>
                      </div>
                      
                      {category === 'teknoloji_alanlari' && Array.isArray(content) ? (
                        <div className="flex flex-wrap gap-2">
                          {content.map((tech, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Orijinal E-posta İçeriği */}
            {application.email_content && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">E-posta İçeriği</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{application.email_content}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailModal;

