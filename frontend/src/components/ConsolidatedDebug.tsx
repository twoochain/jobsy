"use client";
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  sendAIPrompt, 
  checkBackendStatus, 
  connectGmail, 
  disconnectGmail, 
  scanEmails,
  summarizeText,
  analyzeEmail,
  BackendResponse,
  ApiResponse 
} from '../utils/api';

export default function ConsolidatedDebug() {
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState('');
  const [textToAnalyze, setTextToAnalyze] = useState('');
  const [response, setResponse] = useState<BackendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<BackendResponse | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [emailCount, setEmailCount] = useState(0);

  const addDebugInfo = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testBackendStatus = async () => {
    setLoading(true);
    addDebugInfo("Backend bağlantısı test ediliyor...");
    
    try {
      const result = await checkBackendStatus();
      setStatus(result);
      if (result.success) {
        addDebugInfo(`✅ Backend bağlı: ${result.data?.message}`);
      } else {
        addDebugInfo(`❌ Backend hatası: ${result.error}`);
      }
    } catch (error) {
      setStatus({ success: false, error: 'Backend bağlantısı başarısız' });
      addDebugInfo(`❌ Backend bağlantı hatası: ${error}`);
    }
    setLoading(false);
  };

  const sendPrompt = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    addDebugInfo(`AI prompt gönderiliyor: ${prompt}`);
    
    try {
      const result = await sendAIPrompt(prompt);
      setResponse(result);
      if (result.success) {
        addDebugInfo(`✅ AI yanıtı alındı`);
      } else {
        addDebugInfo(`❌ AI yanıt hatası: ${result.error}`);
      }
    } catch (error) {
      setResponse({ success: false, error: 'Prompt gönderilemedi' });
      addDebugInfo(`❌ Prompt gönderme hatası: ${error}`);
    }
    setLoading(false);
  };

  const handleTextAnalysis = async (type: 'summarize' | 'analyze') => {
    if (!textToAnalyze.trim()) return;
    
    setLoading(true);
    addDebugInfo(`${type === 'summarize' ? 'Metin özetleme' : 'E-posta analizi'} başlatılıyor...`);
    
    try {
      let result: BackendResponse;
      if (type === 'summarize') {
        result = await summarizeText(textToAnalyze);
      } else {
        result = await analyzeEmail(textToAnalyze);
      }
      
      setResponse(result);
      if (result.success) {
        addDebugInfo(`✅ ${type === 'summarize' ? 'Özetleme' : 'Analiz'} tamamlandı`);
      } else {
        addDebugInfo(`❌ ${type === 'summarize' ? 'Özetleme' : 'Analiz'} hatası: ${result.error}`);
      }
    } catch (error) {
      setResponse({ success: false, error: `${type === 'summarize' ? 'Özetleme' : 'Analiz'} başarısız` });
      addDebugInfo(`❌ ${type === 'summarize' ? 'Özetleme' : 'Analiz'} hatası: ${error}`);
    }
    setLoading(false);
  };

  const connectGmailAccount = async () => {
    if (!session?.user?.email) {
      addDebugInfo("❌ Kullanıcı girişi yapılmamış");
      return;
    }

    setLoading(true);
    addDebugInfo("Gmail bağlantısı başlatılıyor...");
    
    try {
      const result = await connectGmail(session.user.email);
      if (result.success && result.data?.authUrl) {
        addDebugInfo(`✅ Gmail bağlantı URL'i alındı`);
        window.open(result.data.authUrl, '_blank');
        setIsConnected(true);
      } else {
        addDebugInfo(`❌ Gmail bağlantı hatası: ${result.error}`);
      }
    } catch (error) {
      addDebugInfo(`❌ Gmail bağlantı hatası: ${error}`);
    }
    setLoading(false);
  };

  const disconnectGmailAccount = async () => {
    if (!session?.user?.email) return;

    try {
      await disconnectGmail(session.user.email);
      setIsConnected(false);
      setEmailCount(0);
      addDebugInfo("✅ Gmail bağlantısı kesildi");
    } catch (error) {
      addDebugInfo(`❌ Gmail bağlantısı kesme hatası: ${error}`);
    }
  };

  const scanEmailMessages = async () => {
    if (!session?.user?.email) return;

    try {
      const result = await scanEmails(session.user.email);
      if (result.success) {
        setEmailCount(result.data?.emailCount || 0);
        addDebugInfo(`✅ ${result.data?.emailCount || 0} adet e-posta tarandı`);
      } else {
        addDebugInfo(`❌ E-posta tarama hatası: ${result.error}`);
      }
    } catch (error) {
      addDebugInfo(`❌ E-posta tarama hatası: ${error}`);
    }
  };

  const checkEnvironmentVariables = () => {
    addDebugInfo("Environment variables kontrol ediliyor...");
    
    const frontendVars = {
      'NEXTAUTH_URL': process.env.NEXTAUTH_URL,
      'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET ? 'Set' : 'Not Set',
      'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not Set',
      'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not Set',
      'BACKEND_URL': process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
    };

    Object.entries(frontendVars).forEach(([key, value]) => {
      addDebugInfo(`${key}: ${value}`);
    });
  };

  const clearDebug = () => {
    setDebugInfo([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-[#465DDD] mb-6">Jobsy Debug & Test Paneli</h2>
      
      {/* Backend Status Test */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-[#465DDD] mb-3">Backend Durumu</h3>
        <button
          onClick={testBackendStatus}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Test Ediliyor...' : 'Backend Durumunu Test Et'}
        </button>
        
        {status && (
          <div className={`mt-3 p-3 rounded ${status.success ? 'bg-green-100' : 'bg-red-100'}`}>
            <p className="font-semibold">
              {status.success ? '✅ Backend Bağlı' : '❌ Backend Bağlantısı Yok'}
            </p>
            {status.data && (
              <pre className="text-sm mt-2">{JSON.stringify(status.data, null, 2)}</pre>
            )}
            {status.error && (
              <p className="text-red-600 mt-2">{status.error}</p>
            )}
          </div>
        )}
      </div>

      {/* AI Testing Section */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-[#465DDD] mb-3">AI Testleri</h3>
        
        {/* AI Prompt Test */}
        <div className="mb-4">
          <h4 className="font-medium mb-2">AI Prompt Testi</h4>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="AI'ya soru sorun..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#465DDD]"
            />
            <button
              onClick={sendPrompt}
              disabled={loading || !prompt.trim()}
              className="bg-[#465DDD] hover:bg-[#3a4fc7] text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Gönderiliyor...' : 'Gönder'}
            </button>
          </div>
        </div>

        {/* Text Analysis */}
        <div className="mb-4">
          <h4 className="font-medium mb-2">Metin Analizi</h4>
          <textarea
            value={textToAnalyze}
            onChange={(e) => setTextToAnalyze(e.target.value)}
            placeholder="Analiz edilecek metni buraya yazın..."
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#465DDD] h-24"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => handleTextAnalysis('summarize')}
              disabled={loading || !textToAnalyze.trim()}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Özetle
            </button>
            <button
              onClick={() => handleTextAnalysis('analyze')}
              disabled={loading || !textToAnalyze.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              E-posta Analizi
            </button>
          </div>
        </div>
        
        {response && (
          <div className={`p-3 rounded ${response.success ? 'bg-green-100' : 'bg-red-100'}`}>
            <p className="font-semibold">
              {response.success ? '✅ Yanıt Alındı' : '❌ Hata'}
            </p>
            {response.data && (
              <pre className="text-sm mt-2 overflow-auto">{JSON.stringify(response.data, null, 2)}</pre>
            )}
            {response.error && (
              <p className="text-red-600 mt-2">{response.error}</p>
            )}
          </div>
        )}
      </div>

      {/* Gmail Integration */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-[#465DDD] mb-3">Gmail Entegrasyonu</h3>
        
        {!isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">Gmail hesabı bağlı değil</span>
            </div>
            
            <button
              onClick={connectGmailAccount}
              disabled={loading || !session?.user?.email}
              className="bg-[#465DDD] hover:bg-[#3a4fc7] text-white font-bold px-6 py-3 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Bağlanıyor...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  Gmail Hesabını Bağla
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Gmail hesabı bağlı</span>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={scanEmailMessages}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg transition"
              >
                E-postaları Tara
              </button>
              
              <button
                onClick={disconnectGmailAccount}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg transition"
              >
                Bağlantıyı Kes
              </button>
            </div>
            
            {emailCount > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 font-medium">
                  {emailCount} adet iş başvuru e-postası bulundu
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Debug Tools */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-[#465DDD] mb-3">Debug Araçları</h3>
        <div className="flex gap-2 mb-4">
          <button
            onClick={checkEnvironmentVariables}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
          >
            Environment Variables Kontrol Et
          </button>
          
          <button
            onClick={clearDebug}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Debug Temizle
          </button>
        </div>

        <div className="bg-gray-100 p-4 rounded max-h-64 overflow-y-auto">
          <h4 className="font-semibold mb-2">Debug Log:</h4>
          {debugInfo.length === 0 ? (
            <p className="text-gray-500">Henüz debug bilgisi yok</p>
          ) : (
            <div className="space-y-1">
              {debugInfo.map((info, index) => (
                <div key={index} className="text-sm font-mono">
                  {info}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* API Endpoints Info */}
      <div className="bg-gray-50 p-4 rounded">
        <h3 className="text-lg font-semibold text-[#465DDD] mb-2">Mevcut API Endpoints</h3>
        <ul className="text-sm space-y-1">
          <li>• <code>GET /</code> - Backend durumu</li>
          <li>• <code>POST /ai/prompt</code> - AI prompt gönderimi</li>
          <li>• <code>POST /summarize</code> - Metin özetleme</li>
          <li>• <code>POST /gemini-analyze</code> - E-posta analizi</li>
          <li>• <code>GET /search-models</code> - Model arama</li>
          <li>• <code>GET /model-details/{'{model_id}'}</code> - Model detayları</li>
          <li>• <code>POST /hf-inference</code> - Hugging Face inference</li>
          <li>• <code>POST /gemini-inference</code> - Gemini inference</li>
        </ul>
      </div>
    </div>
  );
} 