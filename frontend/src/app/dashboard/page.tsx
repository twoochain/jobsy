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
  SparklesIcon
} from '@heroicons/react/24/outline';
import {
  connectGmail,
  disconnectGmail,
  scanEmails,
  ApiResponse
} from '../../utils/api';

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
  const [activeTab, setActiveTab] = useState('applications'); // Default olarak başvurular sekmesi
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [emailCount, setEmailCount] = useState(0);
  const [scanningEmails, setScanningEmails] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [assistantLoading, setAssistantLoading] = useState(false);
  
  useEffect(() => {
    if (session?.user?.email) {
      loadApplications();
      checkGmailConnection();
    }
  }, [session]);

  const loadApplications = async () => {
    try {
      const response = await fetch(`/api/applications/${session?.user?.email}`);
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Başvurular yüklenemedi:', error);
    }
  };

  const checkGmailConnection = async () => {
    setIsGmailConnected(false);
  };

  const handleConnectGmail = async () => {
    if (!session?.user?.email) return;
    
    setIsConnecting(true);
    try {
      const result: ApiResponse = await connectGmail(session.user.email);
      if (result.success && result.data?.authUrl) {
        window.open(result.data.authUrl, '_blank');
        setIsGmailConnected(true);
      }
    } catch (error) {
      console.error('Gmail bağlantı hatası:', error);
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
      console.error('Gmail bağlantısı kesme hatası:', error);
    }
  };

  const handleScanEmails = async () => {
    if (!session?.user?.email) return;
    
    setScanningEmails(true);
    try {
      const result: ApiResponse = await scanEmails(session.user.email);
      if (result.success) {
        setEmailCount(result.data?.emailCount || 0);
        loadApplications();
      }
    } catch (error) {
      console.error('E-posta tarama hatası:', error);
    } finally {
      setScanningEmails(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStageColor = (stage: string) => {
    if (stage.includes('Mülakat')) return 'text-blue-600';
    if (stage.includes('Başvuruldu')) return 'text-yellow-600';
    if (stage.includes('Teklif')) return 'text-green-600';
    if (stage.includes('Test')) return 'text-purple-600';
    return 'text-gray-600';
  };

  const getStageIcon = (stage: string) => {
    if (stage.includes('Başvuruldu')) return <ClockIcon className="h-4 w-4" />;
    if (stage.includes('Mülakat')) return <CheckIcon className="h-4 w-4" />;
    if (stage.includes('Test')) return <ChartBarIcon className="h-4 w-4" />;
    if (stage.includes('Teklif')) return <CheckIcon className="h-4 w-4" />;
    if (stage.includes('Red')) return <XMarkIcon className="h-4 w-4" />;
    return <BriefcaseIcon className="h-4 w-4" />;
  };

  const getFilteredApplications = (): Application[] => {
    let apps: Application[] = [...mockActiveApplications, ...mockFinishedApplications];
    
    if (filterStatus === 'active') {
      apps = mockActiveApplications;
    } else if (filterStatus === 'finished') {
      apps = mockFinishedApplications;
    }
    
    return apps.sort((a, b) => {
      const aOrder = stageOrder[a.stage] || 0;
      const bOrder = stageOrder[b.stage] || 0;
      return aOrder - bOrder;
    });
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
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
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
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
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
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
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
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
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
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
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
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
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
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-center space-x-3 flex-1 lg:justify-end">
              <div className="relative max-w-sm w-full">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Başvuru ara..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                <PlusIcon className="h-4 w-4 mr-2" />
                Yeni Başvuru
              </button>
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
                      Bu hafta <span className="font-semibold text-blue-600">{mockActiveApplications.length}</span> aktif başvurun var. 
                      <span className="font-semibold text-green-600"> {mockActiveApplications.filter(app => app.stage.includes('Mülakat')).length}</span> tanesi mülakat aşamasında.
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                      <BriefcaseIcon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Gmail Integration Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">📧 E-posta Entegrasyonu</h3>
                  {isGmailConnected && (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full">
                      <CheckCircleIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">Bağlı</span>
                    </div>
                  )}
                </div>
                
                {!isGmailConnected ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                      <span className="text-gray-700 font-medium">Gmail hesabı bağlı değil</span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Gmail hesabınızı bağlayarak e-postalarınızdan otomatik olarak iş başvurularını tespit edebiliriz.
                    </p>
                    <button
                      onClick={handleConnectGmail}
                      disabled={isConnecting}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isConnecting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Bağlanıyor...
                        </>
                      ) : (
                        <>
                          <EnvelopeIcon className="h-4 w-4 mr-2" />
                          Gmail Hesabını Bağla
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700 font-medium">Gmail hesabı bağlı</span>
                      </div>
                      <button
                        onClick={handleDisconnectGmail}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Bağlantıyı Kes
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleScanEmails}
                        disabled={scanningEmails}
                        className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
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
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Tespit edilen başvuru:</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                            {emailCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <BriefcaseIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Aktif Başvuru</p>
                      <p className="text-xl font-bold text-gray-900">{mockActiveApplications.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <CalendarIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Bu Hafta</p>
                      <p className="text-xl font-bold text-gray-900">3</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-amber-500 rounded-lg">
                      <BellIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Bekleyen</p>
                      <p className="text-xl font-bold text-gray-900">2</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <ChartBarIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Başarı Oranı</p>
                      <p className="text-xl font-bold text-gray-900">%25</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Applications */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">📋 Son Başvurular</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {mockActiveApplications.map((app) => (
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
                <h3 className="text-lg font-bold text-gray-900 mb-4">🤖 AI Analiz & Tavsiyeler</h3>
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
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">📁 Başvurularım</h2>
                <div className="flex items-center space-x-3">
                  <FunnelIcon className="h-4 w-4 text-gray-400" />
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Tüm Başvurular</option>
                    <option value="active">Aktif</option>
                    <option value="finished">Sonuçlanan</option>
                  </select>
                </div>
              </div>

              {/* Applications Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredApplications().map((app) => (
                  <div key={app.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    {/* Company Logo/Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                        <BriefcaseIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStageIcon(app.stage)}
                        <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getStatusColor(app.status)}`}>
                          {app.stage}
                        </span>
                      </div>
                    </div>

                    {/* Company Name - Bold */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{app.company}</h3>
                    
                    {/* Position */}
                    <p className="text-gray-600 mb-3">{app.position}</p>

                    {/* Date */}
                    <p className="text-sm text-gray-500 mb-4">Başvuru: {app.date}</p>



                    {/* Tasks if available */}
                    {isActiveApplication(app) && app.tasks.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">📝 Yapılacaklar:</p>
                        <ul className="space-y-1">
                          {app.tasks.slice(0, 2).map((task: string, index: number) => (
                            <li key={index} className="text-xs text-gray-600 flex items-center space-x-2">
                              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                              <span className="truncate">{task}</span>
                            </li>
                          ))}
                          {app.tasks.length > 2 && (
                            <li className="text-xs text-gray-500">+{app.tasks.length - 2} daha...</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <button className="flex-1 px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                        ✏️ Düzenle
                      </button>
                      <button className="flex-1 px-3 py-2 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">
                        🗑️ Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty State */}
              {getFilteredApplications().length === 0 && (
                <div className="text-center py-12">
                  <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Başvuru bulunamadı</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {filterStatus === 'all' ? 'Henüz başvuru yapmadınız.' : 
                     filterStatus === 'active' ? 'Aktif başvurunuz bulunmuyor.' : 
                     'Sonuçlanmış başvurunuz bulunmuyor.'}
                  </p>
                  <div className="mt-6">
                    <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Yeni Başvuru Ekle
                    </button>
                  </div>
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
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">🤖 Başvuru Asistanı</h2>
                <div className="flex items-center space-x-2">
                  <SparklesIcon className="h-5 w-5 text-purple-500" />
                  <span className="text-sm text-gray-600">AI Destekli Analiz</span>
                </div>
              </div>

              {!selectedApplication ? (
                /* Başvuru Seçimi */
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="text-center">
                    <SparklesIcon className="mx-auto h-12 w-12 text-purple-400 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Başvuru Seçin</h3>
                    <p className="text-gray-600 mb-6">
                      Analiz etmek istediğiniz başvuruyu seçin. AI asistanı şirket özeti, 
                      ilan gereksinimleri ve size özel tavsiyeler sunacak.
                    </p>
                    
                    {/* Başvuru Listesi */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mockActiveApplications.map((app) => (
                        <div 
                          key={app.id}
                          onClick={() => setSelectedApplication(app)}
                          className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                              <BriefcaseIcon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{app.company}</h4>
                              <p className="text-sm text-gray-600">{app.position}</p>
                              <p className="text-xs text-gray-500">{app.stage}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Başvuru Analizi */
                <div className="space-y-4">
                  {/* Seçilen Başvuru Özeti */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <BriefcaseIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{selectedApplication.company}</h3>
                          <p className="text-gray-600">{selectedApplication.position}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedApplication(null)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Başka Başvuru Seç
                      </button>
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
                      
                      {assistantLoading ? (
                        <div className="space-y-3">
                          <div className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-700">
                            <strong>{selectedApplication.company}</strong> teknoloji sektöründe faaliyet gösteren, 
                            yenilikçi çözümler üreten bir şirkettir. Şirket, modern teknolojiler kullanarak 
                            müşterilerine değer katmayı hedeflemektedir.
                          </p>
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-xs text-blue-800">
                              <strong>💡 Önemli:</strong> Şirket, remote çalışma kültürüne sahip ve 
                              sürekli öğrenmeye değer veren bir yapıya sahiptir.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* İlan Gereksinimleri */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                          <ChartBarIcon className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900">📋 İlan Gereksinimleri</h4>
                      </div>
                      
                      {assistantLoading ? (
                        <div className="space-y-3">
                          <div className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-4/5 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          </div>
                        </div>
                      ) : (
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
                      )}
                    </div>
                  </div>

                  {/* AI Tavsiyeleri */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <SparklesIcon className="h-6 w-6 text-purple-600" />
                      <h4 className="text-lg font-bold text-gray-900">🤖 AI Tavsiyeleri</h4>
                    </div>
                    
                    {assistantLoading ? (
                      <div className="space-y-4">
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-4/5 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 mb-1">📝 CV Güncellemesi</p>
                              <p className="text-sm text-gray-700">
                                React projelerinizi daha detaylı gösterin. Özellikle state management 
                                deneyiminizi vurgulayın.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 mb-1">💼 Mülakat Hazırlığı</p>
                              <p className="text-sm text-gray-700">
                                Sistem tasarımı ve algoritma sorularına odaklanın. 
                                Şirketin kullandığı teknolojiler hakkında araştırma yapın.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 mb-1">🎯 Başarı Stratejisi</p>
                              <p className="text-sm text-gray-700">
                                Remote çalışma deneyiminizi öne çıkarın. 
                                Sürekli öğrenme yaklaşımınızı vurgulayın.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Aksiyon Butonları */}
                  <div className="flex items-center justify-center space-x-4">
                    <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      📝 CV Güncelle
                    </button>
                    <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      💼 Mülakat Hazırla
                    </button>
                    <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                      📊 Detaylı Analiz
                    </button>
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
    </div>
  );
} 