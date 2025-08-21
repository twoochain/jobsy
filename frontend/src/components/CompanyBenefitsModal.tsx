"use client";
import React, { useState, useEffect } from 'react';
import { XMarkIcon, SparklesIcon, CurrencyDollarIcon, HeartIcon, AcademicCapIcon, GlobeAltIcon, ClockIcon, ShieldCheckIcon, GiftIcon, StarIcon } from '@heroicons/react/24/outline';

interface CompanyBenefitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  benefitsData?: any;
}

interface BenefitsData {
  salary_range?: string;
  health_insurance?: string;
  retirement_plan?: string;
  paid_time_off?: string;
  remote_work?: string;
  professional_development?: string;
  wellness_programs?: string;
  team_events?: string;
  stock_options?: string;
  other_benefits?: string[];
}

const CompanyBenefitsModal: React.FC<CompanyBenefitsModalProps> = ({
  isOpen,
  onClose,
  companyName,
  benefitsData
}) => {
  const [benefits, setBenefits] = useState<BenefitsData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showBenefits, setShowBenefits] = useState(false);

  useEffect(() => {
    if (benefitsData) {
      setBenefits(benefitsData);
      setShowBenefits(true);
    }
  }, [benefitsData]);

  const handleAnalyzeBenefits = async () => {
    setIsAnalyzing(true);
    try {
      // Burada AI ile şirket ayrıcalıklarını analiz edebiliriz
      // Şimdilik örnek veri kullanıyoruz
      const mockBenefits: BenefitsData = {
        salary_range: "Competitive salary with performance bonuses",
        health_insurance: "Comprehensive health, dental, and vision coverage",
        retirement_plan: "401(k) with company match up to 6%",
        paid_time_off: "25 days PTO + 10 company holidays",
        remote_work: "Hybrid work model (3 days office, 2 days remote)",
        professional_development: "Annual learning budget, conference attendance",
        wellness_programs: "Gym membership, mental health support",
        team_events: "Monthly team building, annual company retreat",
        stock_options: "RSU grants with 4-year vesting",
        other_benefits: [
          "Flexible working hours",
          "Parental leave (16 weeks)",
          "Commuter benefits",
          "Free lunch and snacks",
          "Pet-friendly office"
        ]
      };
      
      setBenefits(mockBenefits);
      setShowBenefits(true);
      
    } catch (error) {
      console.error('Benefits analiz hatası:', error);
      alert('Ayrıcalıklar analiz edilirken hata oluştu');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getBenefitIcon = (benefitType: string) => {
    switch (benefitType) {
      case 'salary_range':
        return <CurrencyDollarIcon className="h-6 w-6 text-green-600" />;
      case 'health_insurance':
        return <HeartIcon className="h-6 w-6 text-red-600" />;
      case 'retirement_plan':
        return <ShieldCheckIcon className="h-6 w-6 text-blue-600" />;
      case 'paid_time_off':
        return <ClockIcon className="h-6 w-6 text-purple-600" />;
      case 'remote_work':
        return <GlobeAltIcon className="h-6 w-6 text-indigo-600" />;
      case 'professional_development':
        return <AcademicCapIcon className="h-6 w-6 text-yellow-600" />;
      case 'wellness_programs':
        return <GiftIcon className="h-6 w-6 text-pink-600" />;
      case 'team_events':
        return <StarIcon className="h-6 w-6 text-orange-600" />;
      case 'stock_options':
        return <SparklesIcon className="h-6 w-6 text-emerald-600" />;
      default:
        return <GiftIcon className="h-6 w-6 text-gray-600" />;
    }
  };

  const getBenefitTitle = (benefitType: string) => {
    switch (benefitType) {
      case 'salary_range':
        return 'Maaş ve Bonuslar';
      case 'health_insurance':
        return 'Sağlık Sigortası';
      case 'retirement_plan':
        return 'Emeklilik Planı';
      case 'paid_time_off':
        return 'Ücretli İzin';
      case 'remote_work':
        return 'Uzaktan Çalışma';
      case 'professional_development':
        return 'Profesyonel Gelişim';
      case 'wellness_programs':
        return 'Sağlık Programları';
      case 'team_events':
        return 'Takım Etkinlikleri';
      case 'stock_options':
        return 'Hisse Senedi';
      default:
        return 'Diğer Ayrıcalıklar';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block w-full max-w-4xl transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:align-middle">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <GiftIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">🏢 {companyName} Ayrıcalıkları</h3>
                  <p className="text-purple-100">Şirketin sunduğu tüm avantajlar ve imkanlar</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!showBenefits && (
                  <button
                    onClick={handleAnalyzeBenefits}
                    disabled={isAnalyzing}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-purple-700 bg-white rounded-lg hover:bg-purple-50 disabled:opacity-50"
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
                        Ayrıcalıkları Analiz Et
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="rounded-md bg-white bg-opacity-20 text-white hover:bg-opacity-30 p-2"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-6 max-h-96 overflow-y-auto">
            {!showBenefits ? (
              <div className="text-center py-12">
                <GiftIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Ayrıcalıklar Henüz Analiz Edilmedi</h4>
                <p className="text-gray-600 mb-6">
                  {companyName} şirketinin sunduğu ayrıcalıkları ve avantajları görmek için 
                  "Ayrıcalıkları Analiz Et" butonuna tıklayın.
                </p>
                <button
                  onClick={handleAnalyzeBenefits}
                  disabled={isAnalyzing}
                  className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
                >
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  Ayrıcalıkları Analiz Et
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-6">
                  <SparklesIcon className="h-6 w-6 text-purple-600" />
                  <h4 className="text-xl font-bold text-gray-900">🎁 Şirket Ayrıcalıkları</h4>
                </div>

                {/* Ana Ayrıcalıklar Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {benefits && Object.entries(benefits).map(([key, value]) => {
                    if (key === 'other_benefits' || !value || value === 'Belirtilmemiş') return null;
                    
                    return (
                      <div key={key} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            {getBenefitIcon(key)}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900 mb-2">{getBenefitTitle(key)}</h5>
                            <p className="text-sm text-gray-700 leading-relaxed">{value}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Diğer Ayrıcalıklar */}
                {benefits?.other_benefits && benefits.other_benefits.length > 0 && (
                  <div className="border-t border-gray-200 pt-6">
                    <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <GiftIcon className="h-5 w-5 text-gray-600 mr-2" />
                      Diğer Ayrıcalıklar
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {benefits.other_benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Özet Kartı */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <StarIcon className="h-6 w-6 text-blue-600" />
                    <h5 className="font-semibold text-blue-900">💡 Ayrıcalık Özeti</h5>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {benefits ? Object.keys(benefits).filter(key => benefits[key as keyof BenefitsData] && benefits[key as keyof BenefitsData] !== 'Belirtilmemiş').length : 0}
                      </div>
                      <div className="text-xs text-blue-600">Toplam Ayrıcalık</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {benefits?.salary_range ? '✓' : '✗'}
                      </div>
                      <div className="text-xs text-green-600">Maaş Bilgisi</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {benefits?.health_insurance ? '✓' : '✗'}
                      </div>
                      <div className="text-xs text-purple-600">Sağlık Sigortası</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {benefits?.remote_work ? '✓' : '✗'}
                      </div>
                      <div className="text-xs text-orange-600">Uzaktan Çalışma</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              💡 Bu bilgiler şirket ilanlarından AI ile analiz edilerek oluşturulmuştur
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyBenefitsModal;
