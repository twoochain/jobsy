"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  BriefcaseIcon, 
  CalendarIcon, 
  ChartBarIcon, 
  CogIcon, 
  BellIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  HomeIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon as CheckIcon,
  XMarkIcon,
  SparklesIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import {
  connectGmail,
  disconnectGmail,
  scanEmails,
  checkGmailStatus,
  getApplications,
  deleteApplication,
  ApiResponse
} from '../../utils/api';
import ManualApplicationModal from '../../components/ManualApplicationModal';
import EmailApplicationModal from '../../components/EmailApplicationModal';
import AdvancedSearch from '../../components/AdvancedSearch';
import AIRecommendations from '../../components/AIRecommendations';

// Type definitions
interface ActiveApplication {
  id: number;
  company: string;
  position: string;
  date: string;
  stage: string;
  tasks: string[];
  status: string;
  stageOrder: number;
  application_type?: string;
  contact_person?: string;
  location?: string;
  salary_info?: string;
  requirements?: string;
  deadline?: string;
  email_id?: string;
  email_subject?: string;
  email_sender?: string;
  email_content?: string;
  email_body?: string;
  html_body?: string;
  created_at?: string;
  updated_at?: string;
}

interface FinishedApplication {
  id: number;
  company: string;
  position: string;
  date: string;
  result: string;
  reason: string;
  status: string;
  stage: string;
  application_type?: string;
  contact_person?: string;
  location?: string;
  salary_info?: string;
  requirements?: string;
  deadline?: string;
  email_id?: string;
  email_subject?: string;
  email_sender?: string;
  email_content?: string;
  email_body?: string;
  html_body?: string;
  created_at?: string;
  updated_at?: string;
}

type Application = ActiveApplication | FinishedApplication;

const mockActiveApplications: ActiveApplication[] = [
  {
    id: 1,
    company: "Acme Corp",
    position: "Frontend Developer",
    date: "2024-05-01",
    stage: "Mülakat Daveti",
    tasks: ["Teknik test gönderilecek"],
    status: "active",
    stageOrder: 3
  },
  {
    id: 2,
    company: "Globex",
    position: "Data Analyst",
    date: "2024-04-20",
    stage: "Başvuruldu",
    tasks: ["CV güncellemesi"],
    status: "pending",
    stageOrder: 1
  },
  {
    id: 3,
    company: "TechStart",
    position: "Full Stack Developer",
    date: "2024-05-03",
    stage: "İlk Görüşme",
    tasks: ["Portfolio hazırla"],
    status: "active",
    stageOrder: 2
  },
  {
    id: 4,
    company: "Innovation Labs",
    position: "Backend Engineer",
    date: "2024-05-05",
    stage: "Teknik Test",
    tasks: ["Algoritma çalışması"],
    status: "active",
    stageOrder: 4
  },
  {
    id: 5,
    company: "Digital Solutions",
    position: "UI/UX Designer",
    date: "2024-04-28",
    stage: "Portfolio İncelemesi",
    tasks: ["Behance güncellemesi"],
    status: "pending",
    stageOrder: 2
  },
  {
    id: 6,
    company: "Cloud Systems",
    position: "DevOps Engineer",
    date: "2024-05-02",
    stage: "Final Mülakat",
    tasks: ["Sistem tasarımı hazırla"],
    status: "active",
    stageOrder: 5
  }
];

const mockFinishedApplications: FinishedApplication[] = [
  {
    id: 7,
    company: "Initech",
    position: "Backend Engineer",
    date: "2024-03-15",
    result: "Red",
    reason: "Teknik test başarısız",
    status: "rejected",
    stage: "Red"
  },
  {
    id: 8,
    company: "Umbrella",
    position: "QA Tester",
    date: "2024-02-10",
    result: "Teklif",
    reason: "Başarılı süreç",
    status: "accepted",
    stage: "Teklif"
  }
];

// Başvuru aşamaları ve sıralamaları
const stageOrder: Record<string, number> = {
  "Başvuruldu": 1,
  "Portfolio İncelemesi": 2,
  "İlk Görüşme": 2,
  "Mülakat Daveti": 3,
  "Teknik Test": 4,
  "Final Mülakat": 5,
  "Teklif": 6,
  "Red": 7
};

// Type guard functions
const isActiveApplication = (app: Application): app is ActiveApplication => {
  return 'tasks' in app;
};

export default function Dashboard() {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState('applications'); // Default olarak başvurular sekmesi
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [emailCount, setEmailCount] = useState(0);
  const [scanningEmails, setScanningEmails] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailData, setEmailData] = useState<any>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [manualApplicationModalOpen, setManualApplicationModalOpen] = useState(false);
  const [emailApplicationModalOpen, setEmailApplicationModalOpen] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [searchFilters, setSearchFilters] = useState<any>({});
  const [recommendationsRefreshTrigger, setRecommendationsRefreshTrigger] = useState(0);
  
  useEffect(() => {
    if (session?.user?.email) {
      // Önce localStorage'ı temizle ve yeni session için hazırla
      const savedApplications = localStorage.getItem(`applications_${session.user.email}`);
      if (savedApplications) {
        try {
          const parsed = JSON.parse(savedApplications);
          // Eski verileri filtrele (buggy verileri temizle)
          const cleanApplications = parsed.filter((app: any) => 
            app && 
            app.id && 
            app.company && 
            app.position && 
            typeof app.id === 'number' // ID number olmalı
          );
          setApplications(cleanApplications);
          setFilteredApplications(cleanApplications);
          console.log('Loaded applications from localStorage:', cleanApplications);
        } catch (error) {
          console.error('Error parsing saved applications:', error);
          // Hatalı veri varsa localStorage'ı temizle
          localStorage.removeItem(`applications_${session.user.email}`);
          setApplications([]);
          setFilteredApplications([]);
        }
      } else {
        setApplications([]);
        setFilteredApplications([]);
      }
      
      // Backend'den güncel verileri yükle
      loadApplications();
      // Gmail bağlantı durumunu kontrol et ama tarama yapma
      checkGmailConnection();
    }
  }, [session]);

  // Sync applications to localStorage whenever applications change
  useEffect(() => {
    if (session?.user?.email) {
      if (applications.length > 0) {
        localStorage.setItem(`applications_${session.user.email}`, JSON.stringify(applications));
        console.log('Saved applications to localStorage:', applications);
      } else {
        // Boş array ise localStorage'dan temizle
        localStorage.removeItem(`applications_${session.user.email}`);
        console.log('Cleared localStorage - no applications');
      }
    }
  }, [applications, session?.user?.email]);



  // URL parametrelerini kontrol et (Gmail callback sonrası)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (success === 'gmail_connected') {
      setIsGmailConnected(true);
      // URL'den parametreleri temizle
      window.history.replaceState({}, document.title, window.location.pathname);
          } else if (error) {
        setIsGmailConnected(false);
        // URL'den parametreleri temizle
        window.history.replaceState({}, document.title, window.location.pathname);
      }
  }, []);

  // Gmail OAuth popup mesajlarını dinle
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Sadece güvenli kaynaklardan gelen mesajları kabul et
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'GMAIL_AUTH_SUCCESS') {
        setIsGmailConnected(true);
        // Kullanıcıya başarı mesajı göster
        alert('Gmail hesabınız başarıyla bağlandı!');
        // Gmail durumunu kontrol et
        checkGmailConnection();
      } else if (event.data.type === 'GMAIL_AUTH_ERROR') {
        setIsGmailConnected(false);
        // Kullanıcıya hata mesajı göster
        alert('Gmail bağlantısı başarısız: ' + event.data.error);
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []); // checkGmailConnection fonksiyonu tanımlanmadan önce kullanılamaz

  const loadApplications = async () => {
    if (!session?.user?.email) return;
    
    try {
      const result: ApiResponse = await getApplications(session.user.email);
      
      if (result.success && result.data) {
        const activeApps = result.data?.active_applications || [];
        const finishedApps = result.data?.finished_applications || [];
        
        // Veri bütünlüğünü kontrol et
        const validActiveApps = activeApps.filter((app: any) => 
          app && app.id && app.company && app.position
        );
        const validFinishedApps = finishedApps.filter((app: any) => 
          app && app.id && app.company && app.position
        );
        
        const allApps = [...validActiveApps, ...validFinishedApps];
        setApplications(allApps);
        setFilteredApplications(allApps);
        
        console.log(`Loaded ${allApps.length} applications from backend`);
      } else {
        console.warn('Backend response not successful:', result);
        setApplications([]);
        setFilteredApplications([]);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      setApplications([]);
      setFilteredApplications([]);
    }
  };

  const checkGmailConnection = async () => {
    if (!session?.user?.email) return;
    
    try {
      const result: ApiResponse = await checkGmailStatus(session.user.email);
      if (result.success) {
        setIsGmailConnected(result.data?.connected || false);
      }
    } catch (error) {
      setIsGmailConnected(false);
    }
  };

  const handleConnectGmail = async () => {
    if (!session?.user?.email) return;
    
    setIsConnecting(true);
    try {
      const result: ApiResponse = await connectGmail(session.user.email);
      if (result.success && result.data?.authUrl) {
        // Popup window kullan
        const popup = window.open(
          result.data.authUrl, 
          'gmail_auth', 
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );
        
        if (!popup) {
          alert('Popup penceresi açılamadı. Lütfen popup engelleyicisini kapatın.');
        }
      }
    } catch (error) {
      alert('Gmail bağlantısı başlatılamadı: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectGmail = async () => {
    if (!session?.user?.email) return;
    
    try {
      await disconnectGmail(session.user.email);
      setIsGmailConnected(false);
      setEmailCount(0);
    } catch (error) {
      // Gmail bağlantısı kesme hatası - sessizce devam et
    }
  };

  const handleScanEmails = async () => {
    if (!session?.user?.email) return;
    
    setScanningEmails(true);
    try {
      const result: ApiResponse = await scanEmails(session.user.email);
      
      if (result.success) {
        setEmailCount(result.data?.emailCount || 0);
        
        // Yeni başvuru kaydedildiyse başvuruları yenile
        if (result.data?.savedCount && result.data.savedCount > 0) {
          await loadApplications();
          // Önerileri de yenile
          setRecommendationsRefreshTrigger(prev => prev + 1);
        }
        
        // Kullanıcıya bilgi ver
        const message = result.data?.savedCount > 0 
          ? `${result.data.savedCount} yeni başvuru eklendi! ${result.data.message || 'E-posta tarama tamamlandı'}`
          : (result.data?.message || 'E-posta tarama tamamlandı');
        alert(message);
      } else {
        console.error('E-posta tarama başarısız:', result.error);
        alert('E-posta tarama başarısız: ' + (result.error || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('E-posta tarama hatası:', error);
      alert('E-posta tarama hatası: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    } finally {
      setScanningEmails(false);
    }
  };

  const handleViewEmail = async (applicationId: number) => {
    if (!session?.user?.email) return;
    
    setEmailLoading(true);
    setEmailModalOpen(true);
    
    try {
      // Backend'e doğrudan istek gönder
      const response = await fetch(`http://localhost:8000/applications/${session.user.email}/${applicationId}/email`);
      if (!response.ok) {
        throw new Error('Email içeriği getirilemedi');
      }
      
      const data = await response.json();
      
      // Email bilgisi olmayan başvurular için kontrol
      if (data.error === "no_email") {
        setEmailData({
          ...data,
          email_content: `📧 Email Bilgisi Bulunamadı\n\n${data.message}\n\n💡 ${data.suggestion}`,
          email_subject: "Email Bilgisi Yok",
          email_sender: "Sistem",
          email_date: new Date().toLocaleDateString('tr-TR')
        });
      } else {
        setEmailData(data);
      }
    } catch (error) {
      console.error('Email getirme hatası:', error);
      alert('Email içeriği alınamadı: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
      setEmailModalOpen(false);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleManualApplicationCreated = (newApplication: any) => {
    console.log('handleManualApplicationCreated çağrıldı:', newApplication);
    
    // Yeni başvuruyu doğrudan state'e ekle
    if (newApplication && session?.user?.email) {
      console.log('Mevcut başvurular:', applications);
      
      // Duplicate kontrolü
      const isDuplicate = applications.some(app => 
        app.company === newApplication.company && 
        app.position === newApplication.position &&
        app.date === newApplication.date
      );
      
      if (isDuplicate) {
        console.warn('Duplicate application detected:', newApplication);
        alert('Bu başvuru zaten mevcut!');
        return;
      }
      
      setApplications(prev => {
        const updatedApplications = [...prev, newApplication];
        console.log('Güncellenmiş başvurular:', updatedApplications);
        return updatedApplications;
      });
      
      // Modal'ı kapat
      setManualApplicationModalOpen(false);
      
      // Başarı mesajı göster
      alert('Başvuru başarıyla eklendi! Tüm sayfalarda görüntülenebilir.');
      
      // Önerileri yenile
      setRecommendationsRefreshTrigger(prev => prev + 1);
    } else {
      console.error('newApplication veya session.user.email eksik:', { newApplication, session: session?.user?.email });
    }
  };

  const handleEmailApplicationCreated = (newApplication: any) => {
    console.log('handleEmailApplicationCreated çağrıldı:', newApplication);
    
    if (newApplication && session?.user?.email) {
      // Duplicate kontrolü
      const isDuplicate = applications.some(app => 
        app.company === newApplication.company && 
        app.position === newApplication.position &&
        app.date === newApplication.date
      );
      
      if (isDuplicate) {
        console.warn('Duplicate application detected:', newApplication);
        alert('Bu başvuru zaten mevcut!');
        return;
      }
      
      setApplications(prev => {
        const updatedApplications = [...prev, newApplication];
        return updatedApplications;
      });
      
      setEmailApplicationModalOpen(false);
      alert('Email ile başvuru başarıyla eklendi!');
      
      // Önerileri yenile
      setRecommendationsRefreshTrigger(prev => prev + 1);
    }
  };

  const handleApplicationUpdated = (updatedApplication: any) => {
    console.log('handleApplicationUpdated çağrıldı:', updatedApplication);
    
    if (updatedApplication && session?.user?.email) {
      setApplications(prev => {
        const updatedApplications = prev.map(app => 
          app.id === updatedApplication.id ? updatedApplication : app
        );
        return updatedApplications;
      });
      
      setEmailApplicationModalOpen(false);
      alert('Başvuru başarıyla güncellendi!');
    }
  };

  const handleDeleteApplication = async (applicationId: number) => {
    if (!session?.user?.email) {
      alert('Kullanıcı oturumu bulunamadı');
      return;
    }

    // Kullanıcıya onay sor
    if (!confirm('Bu başvuruyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    try {
      const response = await deleteApplication(session.user.email, applicationId);
      
      if (response.success) {
        // Başvuruyu state'den kaldır
        setApplications(prev => {
          const updatedApplications = prev.filter(app => app.id !== applicationId);
          console.log('Deleted application:', applicationId, 'Remaining:', updatedApplications);
          return updatedApplications;
        });
        
        // Filtrelenmiş başvuruları da güncelle
        setFilteredApplications(prev => {
          const updatedFiltered = prev.filter(app => app.id !== applicationId);
          return updatedFiltered;
        });
        
        // Seçili başvuru silindiyse temizle
        if (selectedApplication && selectedApplication.id === applicationId) {
          setSelectedApplication(null);
        }
        
        alert('Başvuru başarıyla silindi!');
        
        // Önerileri yenile
        setRecommendationsRefreshTrigger(prev => prev + 1);
      } else {
        alert(`Silme hatası: ${response.error || 'Bilinmeyen hata'}`);
      }
    } catch (error: any) {
      console.error('Başvuru silme hatası:', error);
      alert(`Başvuru silinirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
    }
  };

  const handleUpdateApplicationStage = async (applicationId: number, newStage: string) => {
    if (!session?.user?.email) return;
    
    setUpdatingStage(true);
    try {
      // Başvuru durumunu güncelle
      setApplications(prev => {
        const updatedApplications = prev.map(app => 
          app.id === applicationId 
            ? { ...app, stage: newStage, updated_at: new Date().toISOString() }
            : app
        );
        
        // LocalStorage'ı güncelle
        localStorage.setItem(`applications_${session.user!.email}`, JSON.stringify(updatedApplications));
        
        return updatedApplications;
      });
      
      // Seçili başvuruyu da güncelle
      if (selectedApplication && selectedApplication.id === applicationId) {
        setSelectedApplication(prev => prev ? { ...prev, stage: newStage, updated_at: new Date().toISOString() } : null);
      }
      
      alert('Başvuru durumu güncellendi!');
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      alert('Durum güncellenirken bir hata oluştu');
    } finally {
      setUpdatingStage(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-200';
    
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStageColor = (stage: string) => {
    if (!stage) return 'text-gray-600';
    
    if (stage.includes('Mülakat')) return 'text-blue-600';
    if (stage.includes('Başvuruldu')) return 'text-yellow-600';
    if (stage.includes('Teklif')) return 'text-green-600';
    if (stage.includes('Test')) return 'text-purple-600';
    return 'text-gray-600';
  };

  const getStageIcon = (stage: string) => {
    if (!stage) return <BriefcaseIcon className="h-4 w-4" />;
    
    if (stage.includes('Başvuruldu')) return <ClockIcon className="h-4 w-4" />;
    if (stage.includes('Mülakat')) return <CheckIcon className="h-4 w-4" />;
    if (stage.includes('Test')) return <ChartBarIcon className="h-4 w-4" />;
    if (stage.includes('Teklif')) return <CheckIcon className="h-4 w-4" />;
    if (stage.includes('Red')) return <XMarkIcon className="h-4 w-4" />;
    return <BriefcaseIcon className="h-4 w-4" />;
  };

  const getFilteredApplications = (): Application[] => {
    let apps: Application[] = [...filteredApplications];
    
    // Durum filtreleme
    if (filterStatus === 'active') {
      apps = filteredApplications.filter(app => app.status === 'active' || app.status === 'pending');
    } else if (filterStatus === 'finished') {
      apps = filteredApplications.filter(app => app.status === 'finished' || app.status === 'rejected' || app.status === 'accepted');
    }
    
    // Arama filtrelerini uygula
    if (searchFilters.query) {
      const query = searchFilters.query.toLowerCase();
      apps = apps.filter(app => 
        app.company.toLowerCase().includes(query) ||
        app.position.toLowerCase().includes(query) ||
        (app.requirements && app.requirements.toLowerCase().includes(query)) ||
        (app.location && app.location.toLowerCase().includes(query))
      );
    }
    
    // Şirket filtresi
    if (searchFilters.company) {
      apps = apps.filter(app => 
        app.company.toLowerCase().includes(searchFilters.company.toLowerCase())
      );
    }
    
    // Pozisyon filtresi
    if (searchFilters.position) {
      apps = apps.filter(app => 
        app.position.toLowerCase().includes(searchFilters.position.toLowerCase())
      );
    }
    
    // Tarih aralığı filtresi
    if (searchFilters.start_date || searchFilters.end_date) {
      apps = apps.filter(app => {
        const appDate = new Date(app.date);
        if (searchFilters.start_date && appDate < new Date(searchFilters.start_date)) {
          return false;
        }
        if (searchFilters.end_date && appDate > new Date(searchFilters.end_date)) {
          return false;
        }
        return true;
      });
    }
    
    return apps.sort((a, b) => {
      const aOrder = stageOrder[a.stage || ''] || 0;
      const bOrder = stageOrder[b.stage || ''] || 0;
      return aOrder - bOrder;
    });
  };

  // Arama ve filtreleme fonksiyonları
  const handleSearchResults = (results: Application[]) => {
    setFilteredApplications(results);
  };

  const handleFiltersChange = (filters: any) => {
    setSearchFilters(filters);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        {/* Logo Section */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <BriefcaseIcon className="w-5 h-5 text-blue-600" />
            </div>
            <h1 className="text-lg font-bold text-white">Jobsy</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded text-white hover:bg-white/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* User Profile */}
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{session?.user?.name || 'Kullanıcı'}</p>
              <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
            </div>
          </div>
        </div>
        
                 {/* Navigation */}
         <nav className="mt-4 px-3">
           <div className="space-y-1">
             <button
               onClick={() => setActiveTab('overview')}
               className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                 activeTab === 'overview' 
                   ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
                   : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
               }`}
             >
               <HomeIcon className="mr-3 h-4 w-4" />
               Ana Sayfa
             </button>
             <button
               onClick={() => setActiveTab('applications')}
               className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                 activeTab === 'applications' 
                   ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' 
                   : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
               }`}
             >
               <BriefcaseIcon className="mr-3 h-4 w-4" />
               Başvurularım
             </button>
             <button
               onClick={() => setActiveTab('assistant')}
               className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                 activeTab === 'assistant' 
                   ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg' 
                   : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
               }`}
             >
               <SparklesIcon className="mr-3 h-4 w-4" />
               Başvuru Asistanı
             </button>
             <button
               onClick={() => setActiveTab('calendar')}
               className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                 activeTab === 'calendar' 
                   ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg' 
                   : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
               }`}
             >
               <CalendarIcon className="mr-3 h-4 w-4" />
               Takvim
             </button>
             <button
               onClick={() => setActiveTab('notifications')}
               className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                 activeTab === 'notifications' 
                   ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg' 
                   : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
               }`}
             >
               <BellIcon className="mr-3 h-4 w-4" />
               Bildirimler
             </button>
             <button
               onClick={() => setActiveTab('settings')}
               className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                 activeTab === 'settings' 
                   ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg' 
                   : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
               }`}
             >
               <CogIcon className="mr-3 h-4 w-4" />
               Ayarlar
             </button>
           </div>
         </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
                 {/* Top Bar */}
         <div className="bg-white border-b border-gray-200 px-4 py-3">
           <div className="flex items-center justify-between">
             <div className="flex items-center space-x-4">
               <button
                 onClick={() => setSidebarOpen(true)}
                 className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                 </svg>
               </button>
               
               
             </div>
             
             <div className="flex items-center space-x-3 flex-1 lg:justify-end">
               <AdvancedSearch
                 applications={applications}
                 onSearchResults={handleSearchResults}
                 onFiltersChange={handleFiltersChange}
                 className="max-w-sm w-full"
               />
             </div>
           </div>
         </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4">
          {activeTab === 'overview' && (
            <div className="max-w-7xl mx-auto space-y-4">
              {/* Welcome Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      Hoş geldin, {session?.user?.name || 'Kullanıcı'}! 👋
                    </h2>
                    <p className="text-gray-600">
                      Bu hafta <span className="font-semibold text-blue-600">{applications.filter(app => app.status === 'active' || app.status === 'pending').length}</span> aktif başvurun var.
                      <span className="font-semibold text-green-600"> {applications.filter(app => (app.status === 'active' || app.status === 'pending') && app.stage.includes('Mülakat')).length}</span> tanesi mülakat aşamasında.
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                      <BriefcaseIcon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              </div>

                             {/* Quick Actions */}
               <div className="text-center py-8">
                 <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                   <BriefcaseIcon className="w-8 w-8 text-white" />
                 </div>
                 <h3 className="text-lg font-semibold text-gray-700 mb-2">Başvuru Yönetimi</h3>
                 <p className="text-gray-600 text-sm mb-6">3 farklı yöntemle başvuru ekleyebilirsiniz</p>
                 
                 <div className="flex flex-col lg:flex-row gap-4 justify-center max-w-4xl mx-auto mb-6">
                   {/* İlan ile Başvuru */}
                   <div className="flex-1 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                     <div className="text-center">
                       <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                         <PlusIcon className="h-6 w-6 text-white" />
                       </div>
                       <h4 className="text-lg font-semibold text-gray-900 mb-2">📋 İlan ile Başvuru</h4>
                       <p className="text-gray-600 text-sm mb-4">İlan linkini veya metnini yapıştırın, AI otomatik doldursun</p>
                       <button
                         onClick={() => setManualApplicationModalOpen(true)}
                         className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium shadow-md hover:shadow-lg"
                       >
                         <PlusIcon className="h-5 w-5 mr-2" />
                         İlan ile Başvuru Ekle
                       </button>
                     </div>
                   </div>

                   {/* Email ile Başvuru */}
                   <div className="flex-1 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                     <div className="text-center">
                       <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                         <EnvelopeIcon className="h-6 w-6 text-white" />
                       </div>
                       <h4 className="text-lg font-semibold text-gray-900 mb-2">📧 Email ile Başvuru</h4>
                       <p className="text-gray-600 text-sm mb-4">Gelen emaili analiz ederek başvuru oluşturun</p>
                       <button
                         onClick={() => setEmailApplicationModalOpen(true)}
                         className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-md hover:shadow-lg"
                       >
                         <EnvelopeIcon className="h-5 w-5 mr-2" />
                         Email ile Başvuru Ekle
                       </button>
                     </div>
                   </div>

                   {/* Gmail Tarama ile Başvuru */}
                   <div className="flex-1 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                     <div className="text-center">
                       <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                         <MagnifyingGlassIcon className="h-6 w-6 text-white" />
                       </div>
                       <h4 className="text-lg font-semibold text-gray-900 mb-2">🔍 Gmail Tarama</h4>
                       <p className="text-gray-600 text-sm mb-4">Gmail'den otomatik başvuru tespiti yapın</p>
                       
                       {!isGmailConnected ? (
                         <button
                           onClick={handleConnectGmail}
                           disabled={isConnecting}
                           className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 font-medium shadow-md hover:shadow-lg"
                         >
                           {isConnecting ? (
                             <>
                               <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                               Bağlanıyor...
                             </>
                           ) : (
                             <>
                               <EnvelopeIcon className="h-5 w-5 mr-2" />
                               Gmail Bağla
                             </>
                           )}
                         </button>
                       ) : (
                         <div className="space-y-3">
                           <div className="flex items-center justify-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                             <CheckCircleIcon className="h-4 w-4" />
                             <span>Bağlı</span>
                           </div>
                           
                           <button
                             onClick={handleScanEmails}
                             disabled={scanningEmails}
                             className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                           >
                             {scanningEmails ? (
                               <>
                                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                 Taranıyor...
                               </>
                             ) : (
                               <>
                                 <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                                 E-postaları Tara
                               </>
                             )}
                           </button>
                           
                           {emailCount > 0 && (
                             <div className="text-center">
                               <span className="text-sm text-gray-600">Tespit edilen:</span>
                               <span className="block px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded mt-1">
                                 {emailCount} başvuru
                               </span>
                             </div>
                           )}
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
                 
                 <p className="text-gray-500 text-sm mt-4">Sol menüden detaylı sayfalara erişebilirsiniz</p>
                 
                 {/* Debug Butonu - Geliştirme sırasında */}
                 {process.env.NODE_ENV === 'development' && (
                   <div className="mt-6 text-center">
                     <button
                       onClick={() => {
                         console.log('Current applications state:', applications);
                         console.log('LocalStorage data:', localStorage.getItem(`applications_${session?.user?.email}`));
                         alert(`Debug: ${applications.length} başvuru, LocalStorage: ${localStorage.getItem(`applications_${session?.user?.email}`) ? 'Var' : 'Yok'}`);
                       }}
                       className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600"
                     >
                       🐛 Debug Info
                     </button>
                   </div>
                 )}
               </div>



                             {/* Stats Cards */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium text-gray-600 mb-1">Aktif Başvuru</p>
                       <p className="text-3xl font-bold text-gray-900">{applications.filter(app => app.status === 'active' || app.status === 'pending').length}</p>
                     </div>
                     <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                       <BriefcaseIcon className="h-6 w-6 text-white" />
                     </div>
                   </div>
                   <div className="mt-4 flex items-center text-sm text-green-600">
                     <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                     Devam ediyor
                   </div>
                 </div>
                 
                 <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium text-gray-600 mb-1">Bu Hafta</p>
                       <p className="text-3xl font-bold text-gray-900">3</p>
                     </div>
                     <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                       <CalendarIcon className="h-6 w-6 text-white" />
                     </div>
                   </div>
                   <div className="mt-4 flex items-center text-sm text-green-600">
                     <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                     +2 yeni
                   </div>
                 </div>
                 
                 <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium text-gray-600 mb-1">Bekleyen</p>
                       <p className="text-3xl font-bold text-gray-900">2</p>
                     </div>
                     <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                       <BellIcon className="h-6 w-6 text-white" />
                     </div>
                   </div>
                   <div className="mt-4 flex items-center text-sm text-amber-600">
                     <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                     Yanıt bekleniyor
                   </div>
                 </div>
                 
                 <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium text-gray-600 mb-1">Başarı Oranı</p>
                       <p className="text-3xl font-bold text-gray-900">%25</p>
                     </div>
                     <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                       <ChartBarIcon className="h-6 w-6 text-white" />
                     </div>
                   </div>
                   <div className="mt-4 flex items-center text-sm text-purple-600">
                     <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                     Ortalama üstü
                   </div>
                 </div>
               </div>

              {/* AI Recommendations */}
              <AIRecommendations 
                refreshTrigger={recommendationsRefreshTrigger}
                className="mb-6"
                userEmail={session?.user?.email || ''}
              />

              {/* Recent Applications */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">📋 Son Başvurular</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {applications.filter(app => app.status === 'active' || app.status === 'pending').slice(0, 3).map((app) => (
                    <div key={app.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                                                 <div className="flex items-center space-x-3">
                           <div className="flex-shrink-0">
                             <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                               <BriefcaseIcon className="h-5 w-5 text-white" />
                             </div>
                           </div>
                           <div>
                             <p className="text-sm font-bold text-gray-900">{app.company}</p>
                             <p className="text-sm text-gray-600">{app.position}</p>
                           </div>
                         </div>
                                                   <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getStatusColor(app.status)}`}>
                              {app.stage}
                            </span>
                            <span className="text-sm text-gray-500">{app.date}</span>
                          </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

                             {/* AI Insights */}
               <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
                                   <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900">🤖 AI Analiz & Tavsiyeler</h3>
                  </div>
                 <div className="space-y-3">
                   <div className="flex items-start space-x-3 p-3 bg-white rounded-lg shadow-sm">
                     <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                     <p className="text-sm text-gray-700">
                       <strong className="text-blue-600">Yanıt Oranı:</strong> Yazılım rollerinde %20 yanıt oranı, bu alana yönelmen faydalı olabilir.
                     </p>
                   </div>
                   <div className="flex items-start space-x-3 p-3 bg-white rounded-lg shadow-sm">
                     <div className="flex-shrink-0 w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                     <p className="text-sm text-gray-700">
                       <strong className="text-amber-600">Teknik Test:</strong> Sıklıkla test aşamasında eleniyorsun; teknik test pratiği öneriyoruz.
                     </p>
                   </div>
                   <div className="flex items-start space-x-3 p-3 bg-white rounded-lg shadow-sm">
                     <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                     <p className="text-sm text-gray-700">
                       <strong className="text-green-600">Portfolio:</strong> Portfolio güncellemesi yaparak başarı şansını artırabilirsin.
                     </p>
                   </div>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="max-w-7xl mx-auto space-y-4">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <BriefcaseIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">📁 Başvurularım</h2>
                      <p className="text-gray-600 mt-1">
                        {getFilteredApplications().length} başvuru bulundu
                      </p>
                    </div>
                  </div>
                                                          <div className="flex items-center space-x-4">
                       <button
                         onClick={() => setManualApplicationModalOpen(true)}
                         className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors shadow-md hover:shadow-lg"
                       >
                         <PlusIcon className="h-4 w-4 mr-2" />
                         İlan ile Başvuru
                       </button>
                       
                       <button
                         onClick={() => setEmailApplicationModalOpen(true)}
                         className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-md hover:shadow-lg"
                       >
                         <EnvelopeIcon className="h-4 w-4 mr-2" />
                         Email ile Başvuru
                       </button>
                     <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-blue-200 shadow-sm">
                       <FunnelIcon className="h-4 w-4 text-blue-500" />
                                              <select 
                         value={filterStatus}
                         onChange={(e) => setFilterStatus(e.target.value)}
                         className="border-none bg-transparent text-sm font-medium text-gray-900 focus:outline-none focus:ring-0"
                       >
                         <option value="all">🔍 Tüm Başvurular</option>
                         <option value="active">🟢 Aktif</option>
                         <option value="finished">⚫ Sonuçlanan</option>
                       </select>
                     </div>
                   </div>
                </div>
              </div>

              {/* Applications Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredApplications().map((app) => (
                  <div key={app.id} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <BriefcaseIcon className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border-2 ${getStatusColor(app.status)}`}>
                          {getStageIcon(app.stage)}
                          <span className="ml-1.5">{app.stage}</span>
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          {app.date}
                        </span>
                      </div>
                    </div>

                    {/* Company Info */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {app.company}
                      </h3>
                      <p className="text-gray-600 font-medium text-lg">{app.position}</p>
                    </div>

                    {/* Application Type Badge */}
                    {(app as any).application_type && (
                      <div className="mb-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm ${
                          (app as any).application_type === 'internship' 
                            ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200' 
                            : (app as any).application_type === 'freelance'
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200'
                            : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200'
                        }`}>
                          {(app as any).application_type === 'internship' ? '🎓 Staj' : 
                           (app as any).application_type === 'freelance' ? '🆓 Freelance' : '💼 Tam Zamanlı'}
                        </span>
                      </div>
                    )}

                    {/* Tasks if available */}
                    {isActiveApplication(app) && app.tasks.length > 0 && (
                      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                        <p className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          📝 Yapılacaklar
                        </p>
                        <ul className="space-y-2">
                          {app.tasks.slice(0, 3).map((task: string, index: number) => (
                            <li key={index} className="text-sm text-blue-800 flex items-start space-x-2">
                              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="leading-relaxed">{task}</span>
                            </li>
                          ))}
                          {app.tasks.length > 3 && (
                            <li className="text-xs text-blue-600 font-medium pt-1">
                              +{app.tasks.length - 3} görev daha...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                                         {/* Action Buttons */}
                     <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
                       <button 
                         onClick={() => handleViewEmail(app.id)}
                         className={`flex-1 px-4 py-2.5 text-sm rounded-lg transition-all font-medium shadow-md hover:shadow-lg ${
                           app.email_id || app.email_content || app.email_subject || app.email_sender
                             ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600' 
                             : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'
                         }`}
                         title={app.email_id || app.email_content || app.email_subject || app.email_sender ? 'Email içeriğini görüntüle' : 'Email bilgisi yok - Manuel eklenen başvuru'}
                         disabled={!app.email_id && !app.email_content && !app.email_subject && !app.email_sender}
                       >
                         {app.email_id || app.email_content || app.email_subject || app.email_sender ? '📧 Maili Gör' : '⚠️ Email Yok'}
                       </button>
                       <button 
                         onClick={() => {
                           setSelectedApplication(app);
                           setActiveTab('assistant');
                         }}
                         className="flex-1 px-4 py-2.5 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium shadow-md hover:shadow-lg"
                       >
                         🤖 AI Analiz
                       </button>
                       <button 
                         onClick={() => {
                           setSelectedApplication(app);
                           setEmailApplicationModalOpen(true);
                         }}
                         className="flex-1 px-4 py-2.5 text-sm bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all font-medium shadow-md hover:shadow-lg"
                       >
                         📧 Email ile Güncelle
                       </button>
                       <button 
                         onClick={() => handleDeleteApplication(app.id)}
                         className="flex-1 px-4 py-2.5 text-sm bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all font-medium shadow-md hover:shadow-lg"
                       >
                         🗑️ Sil
                       </button>
                     </div>
                  </div>
                ))}
              </div>

                             {/* Empty State */}
               {getFilteredApplications().length === 0 && (
                 <div className="text-center py-16">
                   <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                     <BriefcaseIcon className="h-12 w-12 text-gray-400" />
                   </div>
                   <h3 className="text-xl font-semibold text-gray-900 mb-2">Başvuru bulunamadı</h3>
                   <p className="text-gray-600 mb-8 max-w-md mx-auto">
                     {filterStatus === 'all' ? 'Henüz başvuru yapmadınız. İlk başvurunuzu ekleyerek kariyer yolculuğunuza başlayın!' : 
                      filterStatus === 'active' ? 'Aktif başvurunuz bulunmuyor. Yeni fırsatlar için başvuru yapabilirsiniz.' : 
                      'Sonuçlanmış başvurunuz bulunmuyor. Geçmiş başvurularınızı burada görebilirsiniz.'}
                   </p>
                                       
                 </div>
               )}
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="max-w-7xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">📅 Takvim</h2>
                <p className="text-gray-600">Takvim özelliği yakında eklenecek...</p>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="max-w-7xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">🔔 Bildirimler</h2>
                <p className="text-gray-600">Bildirim özelliği yakında eklenecek...</p>
              </div>
            </div>
          )}

                     {activeTab === 'assistant' && (
            <div className="max-w-7xl mx-auto space-y-4">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                      <SparklesIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">🤖 Başvuru Asistanı</h2>
                      <p className="text-gray-600 mt-1">AI destekli başvuru analizi ve tavsiyeler</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <SparklesIcon className="h-5 w-5 text-purple-500" />
                    <span className="text-sm text-gray-600">AI Destekli Analiz</span>
                  </div>
                </div>
              </div>

              {!selectedApplication ? (
                /* Başvuru Seçimi */
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="text-center mb-6">
                    <SparklesIcon className="mx-auto h-12 w-12 text-purple-400 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Başvuru Seçin</h3>
                    <p className="text-gray-600">
                      Analiz etmek istediğiniz başvuruyu seçin. AI asistanı şirket özeti, 
                      ilan gereksinimleri ve size özel tavsiyeler sunacak.
                    </p>
                  </div>
                  
                  {/* Boş Durum Mesajı */}
                  {applications.filter(app => app.status === 'active' || app.status === 'pending').length === 0 && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <BriefcaseIcon className="h-8 w-8 text-blue-600" />
                        </div>
                        <h4 className="font-semibold text-blue-800 mb-2">🚀 İlk Başvurunuzu Ekleyin</h4>
                        <p className="text-sm text-blue-700 mb-3">
                          AI asistanı size yardımcı olabilmek için başvuru geçmişinizi öğrenmeli.
                        </p>
                        <div className="flex justify-center space-x-3">
                          <button
                            onClick={() => setManualApplicationModalOpen(true)}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <PlusIcon className="h-4 w-4 mr-2 inline" />
                            Manuel Başvuru Ekle
                          </button>
                          <button
                            onClick={() => setEmailApplicationModalOpen(true)}
                            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <EnvelopeIcon className="h-4 w-4 mr-2 inline" />
                            Email ile Başvuru Ekle
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                
                  {/* Başvuru Listesi */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(() => {
                      const activeApps = applications.filter(app => app.status === 'active' || app.status === 'pending');
                      return activeApps.map((app) => (
                        <div 
                          key={app.id}
                          onClick={() => setSelectedApplication(app)}
                          className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-all duration-200 border border-gray-200 hover:border-purple-300 hover:shadow-md group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                              <BriefcaseIcon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">{app.company}</h4>
                              <p className="text-sm text-gray-600">{app.position}</p>
                              <p className="text-xs text-gray-500">{app.stage}</p>
                              <p className="text-xs text-purple-600 font-medium mt-1">AI Analiz için tıklayın →</p>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              ) : (
                /* Başvuru Analizi */
                <div className="space-y-4">
                  {/* Seçilen Başvuru Özeti */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    {/* Başka Başvuru Seç Butonu - Üst Kısımda */}
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={() => setSelectedApplication(null)}
                        className="flex items-center px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Başka Başvuru Seç
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <BriefcaseIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{selectedApplication?.company}</h3>
                          <p className="text-gray-600">{selectedApplication?.position}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedApplication?.status || '')}`}>
                              {selectedApplication?.stage}
                            </span>
                            <span className="text-xs text-gray-500">{selectedApplication?.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {/* Durum Güncelleme */}
                        <div className="flex items-center space-x-2">
                          <label className="text-xs text-gray-600 font-medium">Durum:</label>
                          <select
                            value={selectedApplication?.stage || ''}
                            onChange={(e) => selectedApplication && handleUpdateApplicationStage(selectedApplication.id, e.target.value)}
                            disabled={updatingStage}
                            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="Başvuruldu">Başvuruldu</option>
                            <option value="Portfolio İncelemesi">Portfolio İncelemesi</option>
                            <option value="İlk Görüşme">İlk Görüşme</option>
                            <option value="Mülakat Daveti">Mülakat Daveti</option>
                            <option value="Teknik Test">Teknik Test</option>
                            <option value="Final Mülakat">Final Mülakat</option>
                            <option value="Teklif">Teklif</option>
                            <option value="Red">Red</option>
                          </select>
                          {updatingStage && (
                            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                          )}
                        </div>
                        
                        {/* Başvuru Navigasyonu */}
                        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => {
                              if (!selectedApplication) return;
                              const activeApps = applications.filter(app => app.status === 'active' || app.status === 'pending');
                              const currentIndex = activeApps.findIndex(app => app.id === selectedApplication.id);
                              const prevIndex = currentIndex > 0 ? currentIndex - 1 : activeApps.length - 1;
                              setSelectedApplication(activeApps[prevIndex]);
                            }}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-colors"
                            title="Önceki Başvuru"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <span className="text-xs text-gray-500 px-2">
                            {(() => {
                              if (!selectedApplication) return '0 / 0';
                              const activeApps = applications.filter(app => app.status === 'active' || app.status === 'pending');
                              const currentIndex = activeApps.findIndex(app => app.id === selectedApplication.id);
                              return `${currentIndex + 1} / ${activeApps.length}`;
                            })()}
                          </span>
                          <button
                            onClick={() => {
                              if (!selectedApplication) return;
                              const activeApps = applications.filter(app => app.status === 'active' || app.status === 'pending');
                              const currentIndex = activeApps.findIndex(app => app.id === selectedApplication.id);
                              const nextIndex = currentIndex < activeApps.length - 1 ? currentIndex + 1 : 0;
                              setSelectedApplication(activeApps[nextIndex]);
                            }}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-colors"
                            title="Sonraki Başvuru"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* AI Analiz Sonuçları */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Şirket Özeti */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <BriefcaseIcon className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900">🏢 Şirket Özeti</h4>
                      </div>
                      
                      <div className="space-y-3">
                        <p className="text-sm text-gray-700">
                          <strong>{selectedApplication?.company}</strong> teknoloji sektöründe faaliyet gösteren, 
                          yenilikçi çözümler üreten bir şirkettir. Şirket, modern teknolojiler kullanarak 
                          müşterilerine değer katmayı hedeflemektedir.
                        </p>
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs text-blue-800">
                            <strong>💡 Önemli:</strong> Şirket, remote çalışma kültürüne sahip ve 
                            sürekli öğrenmeye değer veren bir yapıya sahiptir.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-gray-50 p-2 rounded">
                            <span className="font-medium text-gray-700">Sektör:</span> Teknoloji
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <span className="font-medium text-gray-700">Çalışma Modeli:</span> Remote
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* İlan Gereksinimleri */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                          <ChartBarIcon className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900">📋 İlan Gereksinimleri</h4>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">3+ yıl deneyim</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">React/TypeScript</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">Node.js/Express</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">AWS deneyimi (tercih)</span>
                          </div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-xs text-green-800">
                            <strong>✅ Uyumluluk:</strong> Gereksinimlerin %85'i ile uyumlusunuz.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Başvuru Detayları */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <ChartBarIcon className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">📊 Başvuru Detayları</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 font-medium">Başvuru Türü</p>
                        <p className="text-sm text-gray-900 font-semibold">
                          {(selectedApplication as any)?.application_type === 'internship' ? '🎓 Staj' : 
                           (selectedApplication as any)?.application_type === 'freelance' ? '🆓 Freelance' : '💼 Tam Zamanlı'}
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 font-medium">Konum</p>
                        <p className="text-sm text-gray-900 font-semibold">
                          {(selectedApplication as any)?.location || 'Belirtilmemiş'}
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 font-medium">Maaş Bilgisi</p>
                        <p className="text-sm text-gray-900 font-semibold">
                          {(selectedApplication as any)?.salary_info || 'Belirtilmemiş'}
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 font-medium">İletişim Kişisi</p>
                        <p className="text-sm text-gray-900 font-semibold">
                          {(selectedApplication as any)?.contact_person || 'Belirtilmemiş'}
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 font-medium">Son Tarih</p>
                        <p className="text-sm text-gray-900 font-semibold">
                          {(selectedApplication as any)?.deadline || 'Belirtilmemiş'}
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 font-medium">Gereksinimler</p>
                        <p className="text-sm text-gray-900 font-semibold">
                          {(selectedApplication as any)?.requirements ? 'Mevcut' : 'Belirtilmemiş'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AI Tavsiyeleri */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <SparklesIcon className="h-6 w-6 text-purple-600" />
                      <h4 className="text-lg font-bold text-gray-900">🤖 AI Tavsiyeleri</h4>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Dinamik AI Tavsiyeleri */}
                      {(() => {
                        const stage = selectedApplication?.stage || '';
                        const company = selectedApplication?.company || '';
                        const position = selectedApplication?.position || '';
                        
                        const recommendations = [];
                        
                        // Aşama bazlı tavsiyeler
                        if (stage.includes('Başvuruldu')) {
                          recommendations.push({
                            icon: '📝',
                            title: 'CV Optimizasyonu',
                            description: `${company} için CV'nizi optimize edin. ${position} pozisyonuna uygun anahtar kelimeleri ekleyin.`,
                            priority: 'high',
                            color: 'blue'
                          });
                        }
                        
                        if (stage.includes('Mülakat')) {
                          recommendations.push({
                            icon: '💼',
                            title: 'Mülakat Hazırlığı',
                            description: 'Şirket hakkında detaylı araştırma yapın. Teknik sorulara hazırlanın.',
                            priority: 'high',
                            color: 'green'
                          });
                        }
                        
                        if (stage.includes('Test')) {
                          recommendations.push({
                            icon: '🧪',
                            title: 'Teknik Test Hazırlığı',
                            description: 'Algoritma ve sistem tasarımı konularında pratik yapın.',
                            priority: 'critical',
                            color: 'red'
                          });
                        }
                        
                        // Genel tavsiyeler
                        recommendations.push({
                          icon: '🔍',
                          title: 'Şirket Araştırması',
                          description: `${company} hakkında detaylı bilgi toplayın. Ürünleri, kültürü ve değerleri öğrenin.`,
                          priority: 'medium',
                          color: 'purple'
                        });
                        
                        recommendations.push({
                          icon: '📚',
                          title: 'Sürekli Öğrenme',
                          description: 'Sektör trendlerini takip edin. Yeni teknolojiler öğrenin.',
                          priority: 'medium',
                          color: 'indigo'
                        });
                        
                        return recommendations.map((rec, index) => (
                          <div key={index} className={`bg-white rounded-lg p-4 shadow-sm border-l-4 ${
                            rec.color === 'blue' ? 'border-l-blue-500' :
                            rec.color === 'green' ? 'border-l-green-500' :
                            rec.color === 'red' ? 'border-l-red-500' :
                            rec.color === 'purple' ? 'border-l-purple-500' :
                            'border-l-indigo-500'
                          }`}>
                            <div className="flex items-start space-x-3">
                              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                rec.priority === 'critical' ? 'bg-red-500' :
                                rec.priority === 'high' ? 'bg-orange-500' :
                                'bg-blue-500'
                              }`}></div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-lg">{rec.icon}</span>
                                  <p className="text-sm font-medium text-gray-900">{rec.title}</p>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    rec.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                    rec.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {rec.priority === 'critical' ? 'Kritik' :
                                     rec.priority === 'high' ? 'Yüksek' : 'Orta'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{rec.description}</p>
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Başarı Olasılığı ve Metrikler */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <ChartBarIcon className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">📊 Başarı Analizi</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-600 mb-1">85%</div>
                        <p className="text-sm text-green-700 font-medium">Uyumluluk Oranı</p>
                        <p className="text-xs text-green-600 mt-1">Gereksinimlerle uyum</p>
                      </div>
                      
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="text-2xl font-bold text-blue-600 mb-1">72%</div>
                        <p className="text-sm text-blue-700 font-medium">Başarı Şansı</p>
                        <p className="text-xs text-blue-600 mt-1">AI tahminine göre</p>
                      </div>
                      
                      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                        <div className="text-2xl font-bold text-purple-600 mb-1">3.2/5</div>
                        <p className="text-sm text-purple-700 font-medium">Rekabet Seviyesi</p>
                        <p className="text-xs text-purple-600 mt-1">Piyasa ortalaması</p>
                      </div>
                    </div>
                  </div>

                  {/* Aksiyon Butonları */}
                  <div className="flex items-center justify-center space-x-4">
                    <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg">
                      📝 CV Güncelle
                    </button>
                    <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg">
                      💼 Mülakat Hazırla
                    </button>
                        {(selectedApplication?.email_id || selectedApplication?.email_content || selectedApplication?.email_subject || selectedApplication?.email_sender) && (
                          <button 
                            onClick={() => selectedApplication?.id && handleViewEmail(selectedApplication.id)}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg"
                          >
                            📧 Email Görüntüle
                          </button>
                        )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-7xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">⚙️ Ayarlar</h2>
                <p className="text-gray-600">Ayarlar özelliği yakında eklenecek...</p>
              </div>
            </div>
          )}
        </main>
      </div>

             {/* Email Modal */}
       {emailModalOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
             <div className="flex items-center justify-between p-6 border-b border-gray-200">
               <h3 className="text-lg font-bold text-gray-900">
                 📧 Email İçeriği
               </h3>
               <button
                 onClick={() => setEmailModalOpen(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>
             
             <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
               {emailLoading ? (
                 <div className="flex items-center justify-center py-8">
                   <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                   <span className="ml-3 text-gray-600">Email yükleniyor...</span>
                 </div>
               ) : emailData ? (
                  <div className="space-y-4">
                    {/* Email Header */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Gönderen:</p>
                          <p className="text-sm text-gray-900">{emailData.email_sender}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Tarih:</p>
                          <p className="text-sm text-gray-900">{emailData.email_date}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm font-medium text-gray-700">Konu:</p>
                          <p className="text-sm text-gray-900 font-semibold">{emailData.email_subject}</p>
                        </div>
                      </div>
                      
                      {/* Email Bilgisi Olmayan Başvurular İçin Uyarı */}
                      {emailData.error === "no_email" && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <span className="text-amber-600">⚠️</span>
                            <div>
                              <p className="text-sm font-medium text-amber-800">{emailData.application_type}</p>
                              <p className="text-xs text-amber-700">{emailData.suggestion}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                   
                   {/* Email Content */}
                   <div>
                     <p className="text-sm font-medium text-gray-700 mb-2">İçerik:</p>
                     <div className="bg-white border border-gray-200 rounded-lg p-4">
                       {emailData.html_body ? (
                         <div className="space-y-4">
                           {/* HTML Content */}
                           <div>
                             <p className="text-xs text-gray-500 mb-2">HTML Görünümü:</p>
                             <div 
                               className="text-sm text-gray-900 prose prose-sm max-w-none"
                               dangerouslySetInnerHTML={{ __html: emailData.html_body }}
                             />
                           </div>
                           <hr className="border-gray-200" />
                           {/* Plain Text Content */}
                           <div>
                             <p className="text-xs text-gray-500 mb-2">Düz Metin:</p>
                             <pre className="text-sm text-gray-900 whitespace-pre-wrap font-sans">
                               {emailData.email_content || emailData.email_body || 'Email içeriği bulunamadı'}
                             </pre>
                           </div>
                         </div>
                       ) : (
                         <pre className="text-sm text-gray-900 whitespace-pre-wrap font-sans">
                           {emailData.email_content || emailData.email_body || 'Email içeriği bulunamadı'}
                         </pre>
                       )}
                     </div>
                   </div>
                   
                   {/* Application Info */}
                   <div className="bg-blue-50 rounded-lg p-4">
                     <p className="text-sm font-medium text-blue-700 mb-2">Başvuru Bilgileri:</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                       <div>
                         <p className="text-xs text-blue-600">Şirket:</p>
                         <p className="text-sm text-blue-900 font-medium">{emailData.company_name}</p>
                       </div>
                       <div>
                         <p className="text-xs text-blue-600">Pozisyon:</p>
                         <p className="text-sm text-blue-900 font-medium">{emailData.position}</p>
                       </div>
                     </div>
                   </div>
                 </div>
               ) : (
                 <div className="text-center py-8">
                   <p className="text-gray-600">Email içeriği bulunamadı</p>
                 </div>
               )}
             </div>
           </div>
         </div>
       )}

       {/* Manual Application Modal */}
       {manualApplicationModalOpen && session?.user?.email && (
         <ManualApplicationModal
           isOpen={manualApplicationModalOpen}
           onClose={() => setManualApplicationModalOpen(false)}
           userId={session.user.email}
           onApplicationCreated={handleManualApplicationCreated}
         />
       )}

       {/* Email Application Modal */}
       {emailApplicationModalOpen && session?.user?.email && (
         <EmailApplicationModal
           isOpen={emailApplicationModalOpen}
           onClose={() => {
             setEmailApplicationModalOpen(false);
             setSelectedApplication(null);
           }}
           userId={session.user.email}
           onApplicationCreated={handleEmailApplicationCreated}
           onApplicationUpdated={handleApplicationUpdated}
           existingApplication={selectedApplication}
         />
       )}
     </div>
   );
 } 