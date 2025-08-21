"use client";

import React, { useState, useEffect } from 'react';
import { 
  SparklesIcon, 
  LightBulbIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Recommendation, getRecommendations } from '../utils/searchApi';

interface AIRecommendationsProps {
  className?: string;
  refreshTrigger?: number;
  userEmail?: string;
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({
  className = "",
  refreshTrigger = 0,
  userEmail
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, [refreshTrigger]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // userEmail kontrolü
      if (!userEmail) {
        setError('Kullanıcı bilgisi bulunamadı');
        setRecommendations([]);
        return;
      }
      
      const data = await getRecommendations(userEmail);
      setRecommendations(data);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(`Öneriler yüklenirken hata oluştu: ${errorMessage}`);
      console.error('Recommendations error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (score: number) => {
    if (score >= 8) return 'border-l-red-500 bg-red-50';
    if (score >= 6) return 'border-l-orange-500 bg-orange-50';
    if (score >= 4) return 'border-l-blue-500 bg-blue-50';
    return 'border-l-gray-500 bg-gray-50';
  };

  const getPriorityIcon = (score: number) => {
    if (score >= 8) return <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />;
    if (score >= 6) return <ClockIcon className="h-4 w-4 text-orange-600" />;
    if (score >= 4) return <CheckCircleIcon className="h-4 w-4 text-blue-600" />;
    return <InformationCircleIcon className="h-4 w-4 text-gray-600" />;
  };

  const getPriorityText = (score: number) => {
    if (score >= 8) return 'Kritik';
    if (score >= 6) return 'Yüksek';
    if (score >= 4) return 'Orta';
    return 'Düşük';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'stage_optimization':
        return <ChartBarIcon className="h-5 w-5 text-blue-600" />;
      case 'company_optimization':
        return <LightBulbIcon className="h-5 w-5 text-green-600" />;
      case 'trend_optimization':
        return <SparklesIcon className="h-5 w-5 text-purple-600" />;
      case 'ai_personalized':
        return <SparklesIcon className="h-5 w-5 text-indigo-600" />;
      case 'fallback':
        return <InformationCircleIcon className="h-5 w-5 text-gray-600" />;
      default:
        return <LightBulbIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'stage_optimization':
        return 'text-blue-700 bg-blue-100';
      case 'company_optimization':
        return 'text-green-700 bg-green-100';
      case 'trend_optimization':
        return 'text-purple-700 bg-purple-100';
      case 'ai_personalized':
        return 'text-indigo-700 bg-indigo-100';
      case 'fallback':
        return 'text-gray-700 bg-gray-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'stage_optimization':
        return 'Aşama Optimizasyonu';
      case 'company_optimization':
        return 'Şirket Stratejisi';
      case 'trend_optimization':
        return 'Trend Analizi';
      case 'ai_personalized':
        return 'AI Önerisi';
      case 'fallback':
        return 'Sistem Önerisi';
      default:
        return 'Genel Öneri';
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
            <SparklesIcon className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">🤖 AI Önerileri</h3>
        </div>
        
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="text-gray-600">AI önerileri hazırlanıyor...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
            <SparklesIcon className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">🤖 AI Önerileri</h3>
        </div>
        
        <div className="text-center py-6">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadRecommendations}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
            <SparklesIcon className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">🤖 AI Önerileri</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={loadRecommendations}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title="Önerileri yenile"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          {lastUpdated && (
            <span className="text-xs text-gray-500">
              Son güncelleme: {lastUpdated.toLocaleTimeString('tr-TR')}
            </span>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length === 0 ? (
        <div className="text-center py-8">
          <LightBulbIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Henüz öneri bulunmuyor</p>
          <p className="text-sm text-gray-400">Daha fazla başvuru ekledikçe AI önerileri görünecek</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`border-l-4 rounded-lg p-4 ${getPriorityColor(rec.priority_score)}`}
            >
              <div className="flex items-start space-x-3">
                {/* Priority Indicator */}
                <div className="flex-shrink-0">
                  {getPriorityIcon(rec.priority_score)}
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{rec.icon}</span>
                      <h4 className="text-sm font-semibold text-gray-900">{rec.title}</h4>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Type Badge */}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(rec.type)}`}>
                        {getTypeText(rec.type)}
                      </span>
                      
                      {/* Priority Badge */}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        rec.priority_score >= 8 ? 'bg-red-100 text-red-800' :
                        rec.priority_score >= 6 ? 'bg-orange-100 text-orange-800' :
                        rec.priority_score >= 4 ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getPriorityText(rec.priority_score)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-sm text-gray-700 mb-3">{rec.description}</p>
                  
                  {/* Action Button */}
                  <button
                    onClick={() => handleRecommendationAction(rec)}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    <LightBulbIcon className="h-3 w-3 mr-1" />
                    Aksiyon Al
                  </button>
                  
                  {/* Additional Info */}
                  {rec.stage && (
                    <div className="mt-2 text-xs text-gray-500">
                      <span className="font-medium">Aşama:</span> {rec.stage}
                    </div>
                  )}
                  
                  {rec.company && (
                    <div className="mt-1 text-xs text-gray-500">
                      <span className="font-medium">Şirket:</span> {rec.company}
                    </div>
                  )}
                  
                  {rec.source === 'AI' && (
                    <div className="mt-2 flex items-center text-xs text-indigo-600">
                      <SparklesIcon className="h-3 w-3 mr-1" />
                      AI tarafından önerildi
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Toplam {recommendations.length} öneri</span>
          <span>AI sürekli öğreniyor ve gelişiyor</span>
        </div>
      </div>
    </div>
  );
};

const handleRecommendationAction = (recommendation: Recommendation) => {
  // Bu fonksiyon öneri türüne göre farklı aksiyonlar alabilir
  console.log('Recommendation action:', recommendation);
  
  // Örnek aksiyonlar:
  switch (recommendation.action) {
    case 'mülakat_hazirlik':
      // Mülakat hazırlık sayfasına yönlendir
      alert('Mülakat hazırlık sayfası açılıyor...');
      break;
    case 'teknik_test_hazirlik':
      // Teknik test hazırlık sayfasına yönlendir
      alert('Teknik test hazırlık sayfası açılıyor...');
      break;
    case 'sirket_stratejisi':
      // Şirket strateji sayfasına yönlendir
      alert('Şirket strateji sayfası açılıyor...');
      break;
    case 'basvuru_artir':
      // Başvuru ekleme sayfasına yönlendir
      alert('Başvuru ekleme sayfası açılıyor...');
      break;
    case 'basvuru_takip':
      // Başvuru takip sayfasına yönlendir
      alert('Başvuru takip sayfası açılıyor...');
      break;
    case 'cv_guncelle':
      // CV güncelleme sayfasına yönlendir
      alert('CV güncelleme sayfası açılıyor...');
      break;
    case 'ag_kur':
      // Ağ kurma sayfasına yönlendir
      alert('Profesyonel ağ kurma sayfası açılıyor...');
      break;
    case 'ai_oneri':
      // AI öneri detay sayfasına yönlendir
      alert('AI öneri detayları açılıyor...');
      break;
    default:
      alert('Bu öneri için aksiyon alınıyor...');
  }
};

export default AIRecommendations;
