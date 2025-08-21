// Consolidated API utility functions for both backend and frontend

// Environment variables
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Server-side environment variables (only available on server side)
const API_SECRET_KEY = process.env.API_SECRET_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  source?: string;
}

export interface BackendResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Generic API call function for backend (FastAPI)
async function callBackend<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<BackendResponse<T>> {
  try {
    const url = `${BACKEND_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    // HTTP status kontrolü ekle
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || 
        errorData.message || 
        `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    
    // Backend response'u doğrudan döndür
    return data;
  } catch (error) {
    console.error('callBackend error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Generic API call function for frontend (Next.js API routes)
export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// ===== BACKEND API FUNCTIONS =====

// AI Prompt API
export async function sendAIPrompt(prompt: string): Promise<BackendResponse> {
  return callBackend('/ai/prompt', {
    method: 'POST',
    body: JSON.stringify(prompt),
  });
}

// Hugging Face Model Search
export async function searchModels(query: string, limit: number = 10): Promise<BackendResponse> {
  return callBackend(`/search-models?query=${encodeURIComponent(query)}&limit=${limit}`);
}

// Get Model Details
export async function getModelDetails(modelId: string): Promise<BackendResponse> {
  return callBackend(`/model-details/${modelId}`);
}

// Hugging Face Inference
export async function hfInference(modelId: string, inputs: any): Promise<BackendResponse> {
  return callBackend('/hf-inference', {
    method: 'POST',
    body: JSON.stringify({
      model_id: modelId,
      inputs: inputs
    }),
  });
}

// Gemini Inference
export async function geminiInference(prompt: string): Promise<BackendResponse> {
  return callBackend('/gemini-inference', {
    method: 'POST',
    body: JSON.stringify(prompt),
  });
}

// Text Summarization
export async function summarizeText(text: string): Promise<BackendResponse> {
  return callBackend('/summarize', {
    method: 'POST',
    body: JSON.stringify(text),
  });
}

// Email Analysis
export async function analyzeEmail(text: string): Promise<BackendResponse> {
  return callBackend('/gemini-analyze', {
    method: 'POST',
    body: JSON.stringify(text),
  });
}

// Check Backend Status
export async function checkBackendStatus(): Promise<BackendResponse> {
  return callBackend('/');
}

// ===== FRONTEND API FUNCTIONS =====

// Gmail Connection
export async function connectGmail(userId: string): Promise<ApiResponse> {
  return fetchApi('/connect-gmail', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

// Disconnect Gmail
export async function disconnectGmail(userId: string): Promise<ApiResponse> {
  return fetchApi('/disconnect-gmail', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

// Check Gmail Status
export async function checkGmailStatus(userId: string): Promise<ApiResponse> {
  return fetchApi(`/gmail/status/${userId}`, {
    method: 'GET',
  });
}

// Scan Emails
export async function scanEmails(userId: string): Promise<ApiResponse> {
  return fetchApi('/scan-emails', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

// Get Applications
export async function getApplications(userId: string): Promise<ApiResponse> {
  const result = await callBackend(`/applications/${userId}`, {
    method: 'GET',
  });
  
  return {
    success: result.success || false,
    data: result.data,
    error: result.error,
    message: result.message
  };
}

// Create Manual Application
export async function createManualApplication(applicationData: {
  userId: string;
  company_name: string;
  position: string;
  application_status?: string;
  application_type?: string;
  contact_person?: string;
  location?: string;
  salary_info?: string;
  requirements?: string;
  deadline?: string;
  next_action?: string;
  email_content?: string;
}): Promise<ApiResponse> {
  try {
    const result = await callBackend('/applications/create-manual', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
    
    // Backend'den gelen response'u ApiResponse formatına çevir
    if (result && typeof result === 'object') {
      return {
        success: true, // Backend'den başarılı response geldi
        data: result, // Backend'in tüm response'unu data field'ına koy
        error: result.error,
        message: result.message
      };
    }
    
    return {
      success: false,
      error: 'Invalid response format from backend'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Create Application with ChromaDB (Turkish fields)
export async function createChromaApplication(applicationData: {
  userId: string;
  baslik: string;
  sirket: string;
  konum: string;
  aciklama?: string;
  gereksinimler?: string;
  avantajlar?: string;
  alan?: string;
  sure?: string;
  ucretli?: boolean;
  durum?: string;
  application_type?: string;
  contact_person?: string;
  salary_info?: string;
  deadline?: string;
  next_action?: string;
  email_content?: string;
}): Promise<ApiResponse> {
  try {
    // Extract userId and convert Turkish fields to English
    const { userId, ...turkishData } = applicationData;
    
    // Map Turkish field names to English for backend schema
    const englishData = {
      is_job_application: true,
      application_type: turkishData.application_type || 'job',
      company_name: turkishData.sirket,
      position: turkishData.baslik,
      location: turkishData.konum,
      application_status: turkishData.durum || 'Başvuruldu',
      next_action: turkishData.next_action || 'Detaylı inceleme',
      deadline: turkishData.deadline,
      contact_person: turkishData.contact_person,
      salary_info: turkishData.salary_info,
      requirements: turkishData.gereksinimler
    };

    const result = await callBackend(`/chroma/applications?user_id=${encodeURIComponent(userId)}`, {
      method: 'POST',
      body: JSON.stringify(englishData),
    });
    
    if (result && typeof result === 'object') {
      return {
        success: true,
        data: result,
        error: result.error,
        message: result.message
      };
    }
    
    return {
      success: false,
      error: 'Invalid response format from backend'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Delete Application
export async function deleteApplication(userId: string, applicationId: number): Promise<ApiResponse> {
  try {
    const result = await callBackend(`/applications/${userId}/${applicationId}`, {
      method: 'DELETE',
    });
    
    if (result && typeof result === 'object') {
      return {
        success: true,
        data: result,
        error: result.error,
        message: result.message
      };
    }
    
    return {
      success: false,
      error: 'Invalid response format from backend'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Analyze Job Posting with AI
export async function analyzeJobPosting(jobData: {
  job_posting_url?: string;
  job_posting_text?: string;
}): Promise<ApiResponse> {
  try {
    // Gemini API ile analiz yap
    const geminiResult = await callBackend('/ai/analyze-job-posting', {
      method: 'POST',
      body: JSON.stringify({
        job_text: jobData.job_posting_text || jobData.job_posting_url || ''
      }),
    });
    
    // Gemini sonucunu ApiResponse formatına çevir
    if (geminiResult && typeof geminiResult === 'object') {
      return {
        success: geminiResult.success || false,
        data: geminiResult.data,
        error: geminiResult.error,
        message: geminiResult.message || 'İlan Gemini ile analiz edildi',
        source: 'gemini_api'
      };
    }
    
    return {
      success: false,
      error: 'Invalid response format from backend'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ===== CONFIGURATION FUNCTIONS =====

// Client-side configuration
export function getApiConfig() {
  return {
    backendUrl: BACKEND_URL,
    apiUrl: API_URL,
  };
}

// Server-side configuration (for API routes)
export function getServerConfig() {
  return {
    apiSecretKey: API_SECRET_KEY,
    databaseUrl: DATABASE_URL,
    jwtSecret: JWT_SECRET,
  };
} 