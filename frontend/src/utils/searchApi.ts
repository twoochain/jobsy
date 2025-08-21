// Search API utility functions
export interface SearchFilters {
  status?: string;
  stage?: string;
  company?: string;
  position?: string;
  start_date?: string;
  end_date?: string;
}

export interface SearchResult {
  results: any[];
  total: number;
  query: string;
  filters: SearchFilters;
  search_metadata: {
    execution_time: string;
    total_applications: number;
  };
}

export interface Recommendation {
  type: string;
  title: string;
  description: string;
  priority_score: number;
  icon: string;
  action: string;
  stage?: string;
  company?: string;
  trend?: string;
  source?: string;
}

export interface SearchAnalytics {
  total_applications: number;
  active_applications: number;
  finished_applications: number;
  success_rate: number;
  stage_distribution: Record<string, number>;
  company_distribution: Record<string, number>;
  last_updated: string;
}

// Base API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Search applications
export const searchApplications = async (
  query: string = '',
  filters: SearchFilters = {}
): Promise<SearchResult> => {
  try {
    const params = new URLSearchParams();
    
    if (query) {
      params.append('query', query);
    }
    
    if (filters.status) {
      params.append('status', filters.status);
    }
    
    if (filters.stage) {
      params.append('stage', filters.stage);
    }
    
    if (filters.company) {
      params.append('company', filters.company);
    }
    
    if (filters.position) {
      params.append('position', filters.position);
    }
    
    if (filters.start_date) {
      params.append('start_date', filters.start_date);
    }
    
    if (filters.end_date) {
      params.append('end_date', filters.end_date);
    }
    
    const response = await fetch(`${API_BASE_URL}/search/applications?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication header if needed
        // 'Authorization': `Bearer ${token}`
      },
    });
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data;
    
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};

// Get AI recommendations
export const getRecommendations = async (userEmail?: string): Promise<Recommendation[]> => {
  try {
    // userEmail parametresi gerekli
    if (!userEmail) {
      console.warn('getRecommendations: userEmail parametresi gerekli');
      return [];
    }

    const params = new URLSearchParams();
    params.append('user_email', userEmail);

    const response = await fetch(`${API_BASE_URL}/search/recommendations?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication header if needed
        // 'Authorization': `Bearer ${token}`
      },
    });
    
    if (!response.ok) {
      throw new Error(`Recommendations failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Backend'den gelen mesajı kontrol et
    if (data.message && data.message.includes('Henüz başvuru yapmadığınız')) {
      // Başvuru yoksa boş array döndür
      return [];
    }
    
    return data.data?.recommendations || [];
    
  } catch (error) {
    console.error('Recommendations error:', error);
    // Hata durumunda boş array döndür
    return [];
  }
};

// Get search analytics
export const getSearchAnalytics = async (): Promise<SearchAnalytics> => {
  try {
    const response = await fetch(`${API_BASE_URL}/search/analytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication header if needed
        // 'Authorization': `Bearer ${token}`
      },
    });
    
    if (!response.ok) {
      throw new Error(`Analytics failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data;
    
  } catch (error) {
    console.error('Analytics error:', error);
    throw error;
  }
};

// Smart filter applications
export const smartFilterApplications = async (
  filterCriteria: Record<string, any>
): Promise<SearchResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/search/smart-filter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication header if needed
        // 'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(filterCriteria),
    });
    
    if (!response.ok) {
      throw new Error(`Smart filter failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data;
    
  } catch (error) {
    console.error('Smart filter error:', error);
    throw error;
  }
};

// Local search function for immediate results
export const localSearch = (
  applications: any[],
  query: string,
  filters: SearchFilters = {}
): SearchResult => {
  if (!query.trim() && Object.keys(filters).length === 0) {
    return {
      results: applications,
      total: applications.length,
      query: '',
      filters: {},
      search_metadata: {
        execution_time: new Date().toISOString(),
        total_applications: applications.length
      }
    };
  }
  
  let results = applications;
  const queryLower = query.toLowerCase().trim();
  
  // Apply text search
  if (queryLower) {
    results = results.filter(app => {
      return (
        app.company?.toLowerCase().includes(queryLower) ||
        app.position?.toLowerCase().includes(queryLower) ||
        app.description?.toLowerCase().includes(queryLower) ||
        app.requirements?.toLowerCase().includes(queryLower) ||
        app.location?.toLowerCase().includes(queryLower)
      );
    });
  }
  
  // Apply filters
  if (filters.status) {
    results = results.filter(app => app.status === filters.status);
  }
  
  if (filters.stage) {
    results = results.filter(app => app.stage === filters.stage);
  }
  
  if (filters.company) {
    results = results.filter(app => 
      app.company.toLowerCase().includes(filters.company!.toLowerCase())
    );
  }
  
  if (filters.position) {
    results = results.filter(app => 
      app.position.toLowerCase().includes(filters.position!.toLowerCase())
    );
  }
  
  if (filters.start_date || filters.end_date) {
    results = results.filter(app => {
      const appDate = new Date(app.date);
      if (filters.start_date && appDate < new Date(filters.start_date)) {
        return false;
      }
      if (filters.end_date && appDate > new Date(filters.end_date)) {
        return false;
      }
      return true;
    });
  }
  
  return {
    results,
    total: results.length,
    query,
    filters,
    search_metadata: {
      execution_time: new Date().toISOString(),
      total_applications: applications.length
    }
  };
};
