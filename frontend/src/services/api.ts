
import { ApiResponse } from '../types';

// API base URL - configurable by environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// HTTP client with authentication and error handling
class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    


    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {


        throw new ApiError(
          data.error || data.message || 'Request failed',
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Network or other errors
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Create API client instance
const apiClient = new ApiClient();



// Messages API
export const messagesApi = {
  // Get messages with filters
  getMessages: (params: any) => 
    apiClient.get<ApiResponse<any>>(`/messages?${new URLSearchParams(params)}`),
  
  // Get message details with threaded replies
  getMessageDetails: (messageId: string) =>
    apiClient.get<ApiResponse<any>>(`/messages/${encodeURIComponent(messageId)}/details`),
};

// AI API
export const aiApi = {
  // Analyze single message
  analyzeMessage: (messageId: string) =>
    apiClient.post<ApiResponse<any>>(`/ai/analyze/message/${messageId}`),
  
  // Batch analyze messages
  analyzeMessages: (data: any) =>
    apiClient.post<ApiResponse<any>>('/ai/analyze/messages', data),
  
  // Generate daily summary
  generateDailySummary: (date: string, forceRegenerate = false) =>
    apiClient.post<ApiResponse<any>>(`/ai/summary/generate/${date}?forceRegenerate=${forceRegenerate}`),
  
  // Get daily summary
  getDailySummary: (date: string) =>
    apiClient.get<ApiResponse<any>>(`/ai/summary/${date}`),
  
  // Get recent summaries
  getRecentSummaries: (limit = 7) =>
    apiClient.get<ApiResponse<any>>(`/ai/summaries/recent?limit=${limit}`),
  
  // Test AI connection
  testConnection: () =>
    apiClient.get<ApiResponse<any>>('/ai/test'),
  
  // Get AI stats
  getStats: () =>
    apiClient.get<ApiResponse<any>>('/ai/stats'),
};

// Learning API
export const learningApi = {
  // Record tag correction
  recordTagCorrection: (data: {
    messageId: string;
    originalTags: string[];
    correctedTags: string[];
    userId?: string;
  }) =>
    apiClient.post<ApiResponse<any>>('/learning/corrections', data),
  
  // Record tag feedback
  recordTagFeedback: (data: {
    messageId: string;
    tags: string[];
    feedback: 'positive' | 'negative';
    userId?: string;
  }) =>
    apiClient.post<ApiResponse<any>>('/learning/feedback', data),
  
  // Get improved tag suggestions
  getImprovedTagSuggestions: (data: {
    messageText: string;
    channelName: string;
    originalSuggestions: string[];
  }) =>
    apiClient.post<ApiResponse<{ suggestions: string[] }>>('/learning/suggestions/improve', data),
  
  // Get learning metrics
  getLearningMetrics: () =>
    apiClient.get<ApiResponse<any>>('/learning/metrics'),
  
  // Get recent corrections
  getRecentCorrections: (limit = 50) =>
    apiClient.get<ApiResponse<any>>(`/learning/corrections/recent?limit=${limit}`),
};


