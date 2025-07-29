// Backend API utility for connecting to Python FastAPI server

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export interface BackendResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Generic API call function
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

// Check Backend Status
export async function checkBackendStatus(): Promise<BackendResponse> {
  return callBackend('/');
} 