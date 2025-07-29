"use client";
import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function EmailIntegration() {
  const { data: session } = useSession();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [emailCount, setEmailCount] = useState(0);

  const connectGmail = async () => {
    setIsConnecting(true);
    try {
      // Gmail API bağlantısı için OAuth2 flow
      const response = await fetch('/api/connect-gmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session?.user?.email,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authUrl) {
          // Gmail OAuth sayfasına yönlendir
          window.location.href = data.authUrl;
        }
      }
    } catch (error) {
      console.error('Gmail bağlantı hatası:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectGmail = async () => {
    try {
      await fetch('/api/disconnect-gmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session?.user?.email,
        }),
      });
      setIsConnected(false);
      setEmailCount(0);
    } catch (error) {
      console.error('Gmail bağlantısı kesme hatası:', error);
    }
  };

  const scanEmails = async () => {
    try {
      const response = await fetch('/api/scan-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session?.user?.email,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEmailCount(data.emailCount || 0);
        // Email tarama sonuçlarını dashboard'a yansıt
        window.location.reload();
      }
    } catch (error) {
      console.error('Email tarama hatası:', error);
    }
  };

  return (
    <div className="bg-white/90 rounded-2xl shadow-md p-6 border border-[#e6eaff]">
      <h3 className="text-xl font-bold text-[#465DDD] mb-4">E-posta Entegrasyonu</h3>
      
      {!isConnected ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">Gmail hesabı bağlı değil</span>
          </div>
          
          <button
            onClick={connectGmail}
            disabled={isConnecting}
            className="bg-[#465DDD] hover:bg-[#3a4fc7] text-white font-bold px-6 py-3 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
          >
            {isConnecting ? (
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
          
          <p className="text-sm text-gray-500">
            Gmail hesabınızı bağlayarak iş başvuru e-postalarınızı otomatik olarak takip edebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Gmail hesabı bağlı</span>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={scanEmails}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg transition"
            >
              E-postaları Tara
            </button>
            
            <button
              onClick={disconnectGmail}
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
  );
} 