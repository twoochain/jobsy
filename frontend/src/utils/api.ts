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
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || data.error || 'Backend request failed');
    }

    return { success: true, data };
  } catch (error) {
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

// Scan Emails
export async function scanEmails(userId: string): Promise<ApiResponse> {
  return fetchApi('/scan-emails', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
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