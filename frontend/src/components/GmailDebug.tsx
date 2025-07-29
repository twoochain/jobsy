"use client";
import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function GmailDebug() {
  const { data: session } = useSession();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addDebugInfo = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testBackendConnection = async () => {
    setLoading(true);
    addDebugInfo("Backend bağlantısı test ediliyor...");
    
    try {
      const response = await fetch('http://localhost:8000/');
      if (response.ok) {
        const data = await response.json();
        addDebugInfo(`✅ Backend bağlı: ${data.message}`);
      } else {
        addDebugInfo(`❌ Backend hatası: ${response.status}`);
      }
    } catch (error) {
      addDebugInfo(`❌ Backend bağlantı hatası: ${error}`);
    }
    setLoading(false);
  };

  const testGmailConnection = async () => {
    if (!session?.user?.email) {
      addDebugInfo("❌ Kullanıcı girişi yapılmamış");
      return;
    }

    setLoading(true);
    addDebugInfo("Gmail bağlantısı test ediliyor...");
    
    try {
      const response = await fetch('/api/connect-gmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.email,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        addDebugInfo(`✅ Gmail bağlantı URL'i alındı`);
        addDebugInfo(`URL: ${data.authUrl}`);
        
        // URL'i yeni sekmede aç
        if (data.authUrl) {
          window.open(data.authUrl, '_blank');
        }
      } else {
        const errorData = await response.json();
        addDebugInfo(`❌ Gmail bağlantı hatası: ${errorData.error}`);
      }
    } catch (error) {
      addDebugInfo(`❌ Gmail bağlantı hatası: ${error}`);
    }
    setLoading(false);
  };

  const checkEnvironmentVariables = () => {
    addDebugInfo("Environment variables kontrol ediliyor...");
    
    // Frontend environment variables
    const frontendVars = {
      'NEXTAUTH_URL': process.env.NEXTAUTH_URL,
      'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET ? 'Set' : 'Not Set',
      'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not Set',
      'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not Set',
    };

    Object.entries(frontendVars).forEach(([key, value]) => {
      addDebugInfo(`${key}: ${value}`);
    });
  };

  const clearDebug = () => {
    setDebugInfo([]);
  };

  return (
    <div className="bg-white/90 rounded-2xl shadow-md p-6 border border-[#e6eaff]">
      <h3 className="text-xl font-bold text-[#465DDD] mb-4">Gmail Debug Panel</h3>
      
      <div className="space-y-3 mb-4">
        <button
          onClick={testBackendConnection}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Backend Bağlantısını Test Et
        </button>
        
        <button
          onClick={testGmailConnection}
          disabled={loading || !session?.user?.email}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Gmail Bağlantısını Test Et
        </button>
        
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

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-semibold text-yellow-800 mb-2">Önemli Notlar:</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Backend'in çalıştığından emin olun (port 8000)</li>
          <li>• Google Cloud Console'da OAuth2 credentials ayarlayın</li>
          <li>• .env dosyasında GOOGLE_CLIENT_ID ve GOOGLE_CLIENT_SECRET olmalı</li>
          <li>• Authorized redirect URI: http://localhost:3000/api/auth/gmail/callback</li>
        </ul>
      </div>
    </div>
  );
} 