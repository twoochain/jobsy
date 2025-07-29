// API utility functions using environment variables

// Client-side environment variables (NEXT_PUBLIC_ prefix required)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Server-side environment variables (no NEXT_PUBLIC_ prefix)
// These are only available on the server side
const API_SECRET_KEY = process.env.API_SECRET_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Client-side API calls
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

// Example function using environment variables
export function getApiConfig() {
  return {
    apiUrl: API_URL,
    // Note: API_SECRET_KEY is not available on client-side
    // It should only be used in API routes (server-side)
  };
}

// Server-side only function (for API routes)
export function getServerConfig() {
  return {
    apiSecretKey: API_SECRET_KEY,
    databaseUrl: DATABASE_URL,
    jwtSecret: JWT_SECRET,
  };
} 