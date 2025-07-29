"use client";
import { useState } from 'react';
import { sendAIPrompt, checkBackendStatus, BackendResponse } from '../utils/backend-api';

export default function BackendTest() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<BackendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<BackendResponse | null>(null);

  const testBackendStatus = async () => {
    setLoading(true);
    try {
      const result = await checkBackendStatus();
      setStatus(result);
    } catch (error) {
      setStatus({ success: false, error: 'Backend bağlantısı başarısız' });
    }
    setLoading(false);
  };

  const sendPrompt = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    try {
      const result = await sendAIPrompt(prompt);
      setResponse(result);
    } catch (error) {
      setResponse({ success: false, error: 'Prompt gönderilemedi' });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-[#465DDD] mb-6">Backend Bağlantı Testi</h2>
      
      {/* Backend Status Test */}
      <div className="mb-6">
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

      {/* AI Prompt Test */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[#465DDD] mb-3">AI Prompt Testi</h3>
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
        
        {response && (
          <div className={`p-3 rounded ${response.success ? 'bg-green-100' : 'bg-red-100'}`}>
            <p className="font-semibold">
              {response.success ? '✅ Yanıt Alındı' : '❌ Hata'}
            </p>
            {response.data && (
              <div className="mt-2">
                <p><strong>Prompt:</strong> {response.data.prompt}</p>
                <p><strong>AI Yanıtı:</strong> {response.data.ai_response}</p>
              </div>
            )}
            {response.error && (
              <p className="text-red-600 mt-2">{response.error}</p>
            )}
          </div>
        )}
      </div>

      {/* API Endpoints Info */}
      <div className="bg-gray-50 p-4 rounded">
        <h3 className="text-lg font-semibold text-[#465DDD] mb-2">Mevcut API Endpoints</h3>
        <ul className="text-sm space-y-1">
          <li>• <code>GET /</code> - Backend durumu</li>
          <li>• <code>POST /ai/prompt</code> - AI prompt gönderimi</li>
          <li>• <code>GET /search-models</code> - Model arama</li>
          <li>• <code>GET /model-details/{'{model_id}'}</code> - Model detayları</li>
          <li>• <code>POST /hf-inference</code> - Hugging Face inference</li>
          <li>• <code>POST /gemini-inference</code> - Gemini inference</li>
        </ul>
      </div>
    </div>
  );
} 