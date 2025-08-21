import { getAuthHeaders, isTokenExpired, useAuthStore } from '../store/authStore';
import { ApiResponse, PaginatedResponse } from '../types';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://newsroom-dashboard-api.vercel.app/api';

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
    
    // Get auth headers
    const authHeaders = getAuthHeaders();
    
    // Check if token is expired and refresh if needed
    const { accessToken } = useAuthStore.getState();
    if (accessToken && isTokenExpired(accessToken)) {
      await useAuthStore.getState().refreshToken();
    }

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          useAuthStore.getState().logout();
          throw new ApiError('Authentication required', 401);
        }

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

// Auth API
export const authApi = {
  // Login with Slack OAuth code
  login: (code: string) => 
    apiClient.post<ApiResponse<{
      user: any;
      accessToken: string;
      refreshToken: string;
      channels: any[];
    }>>('/auth/slack-login', { code }),

  // Refresh access token
  refresh: (refreshToken: string) =>
    apiClient.post<ApiResponse<{
      accessToken: string;
      refreshToken: string;
    }>>('/auth/refresh', { refreshToken }),

  // Get current user
  me: () => apiClient.get<ApiResponse<any>>('/auth/me'),

  // Logout
  logout: () => apiClient.post<ApiResponse<null>>('/auth/logout'),

  // Get channels
  getChannels: () => apiClient.get<ApiResponse<any[]>>('/auth/channels'),

  // Test Slack connection
  testConnection: () => apiClient.get<ApiResponse<{ connected: boolean }>>('/auth/test-connection'),

  // Get auth status
  status: () => apiClient.get<ApiResponse<{ authenticated: boolean; user?: any }>>('/auth/status'),
};

// Messages API
export const messagesApi = {
  // Get messages with filters
  getMessages: (params: any) => 
    apiClient.get<PaginatedResponse<any>>(`/messages?${new URLSearchParams(params)}`),

  // Get message by ID
  getMessage: (id: string) => apiClient.get<ApiResponse<any>>(`/messages/${id}`),

  // Search messages
  searchMessages: (request: any) => 
    apiClient.post<PaginatedResponse<any>>('/messages/search', request),

  // Get message summary
  getSummary: (params: any) => 
    apiClient.get<ApiResponse<any>>(`/messages/summary?${new URLSearchParams(params)}`),

  // Get yesterday's messages
  getYesterdayMessages: () => apiClient.get<ApiResponse<any[]>>('/messages/yesterday'),
};

// Channels API
export const channelsApi = {
  // Get all channels
  getChannels: () => apiClient.get<ApiResponse<any[]>>('/channels'),

  // Connect to channel
  connectChannel: (channelId: string) => 
    apiClient.post<ApiResponse<any>>('/channels/connect', { channelId }),

  // Disconnect from channel
  disconnectChannel: (channelId: string) => 
    apiClient.post<ApiResponse<any>>('/channels/disconnect', { channelId }),

  // Get channel messages
  getChannelMessages: (channelId: string, params: any) => 
    apiClient.get<PaginatedResponse<any>>(`/channels/${channelId}/messages?${new URLSearchParams(params)}`),
};

// Users API
export const usersApi = {
  // Get all users
  getUsers: () => apiClient.get<ApiResponse<any[]>>('/users'),

  // Get user by ID
  getUser: (id: string) => apiClient.get<ApiResponse<any>>(`/users/${id}`),

  // Get user messages
  getUserMessages: (id: string, params: any) => 
    apiClient.get<PaginatedResponse<any>>(`/users/${id}/messages?${new URLSearchParams(params)}`),

  // Get user associations
  getUserAssociations: (id: string) => 
    apiClient.get<ApiResponse<any>>(`/users/${id}/associations`),
};

// Tags API
export const tagsApi = {
  // Get all tags
  getTags: () => apiClient.get<ApiResponse<any[]>>('/tags'),

  // Create tag
  createTag: (tag: any) => apiClient.post<ApiResponse<any>>('/tags', tag),

  // Update tag
  updateTag: (id: string, tag: any) => apiClient.put<ApiResponse<any>>(`/tags/${id}`, tag),

  // Delete tag
  deleteTag: (id: string) => apiClient.delete<ApiResponse<null>>(`/tags/${id}`),

  // Learn from user interactions
  learn: (data: any) => apiClient.post<ApiResponse<any>>('/tags/learn', data),
};

// Summaries API
export const summariesApi = {
  // Get all summaries
  getSummaries: (params: any) => 
    apiClient.get<ApiResponse<any[]>>(`/summaries?${new URLSearchParams(params)}`),

  // Generate summary
  generateSummary: (request: any) => 
    apiClient.post<ApiResponse<any>>('/summaries/generate', request),

  // Get daily summary
  getDailySummary: (date: string) => 
    apiClient.get<ApiResponse<any>>(`/summaries/daily?date=${date}`),

  // Get summary by ID
  getSummary: (id: string) => apiClient.get<ApiResponse<any>>(`/summaries/${id}`),
};

// Analytics API
export const analyticsApi = {
  // Get usage analytics
  getUsage: () => apiClient.get<ApiResponse<any>>('/analytics/usage'),

  // Get trends
  getTrends: (params: any) => 
    apiClient.get<ApiResponse<any>>(`/analytics/trends?${new URLSearchParams(params)}`),

  // Get cache stats
  getCacheStats: () => apiClient.get<ApiResponse<any>>('/analytics/cache-stats'),
};

// Squad API
export const squadApi = {
  // Initialize squad data
  initialize: () => apiClient.post<ApiResponse<null>>('/squads/initialize'),

  // Get all squads
  getAllSquads: () => apiClient.get<ApiResponse<any[]>>('/squads'),

  // Get main squads
  getMainSquads: () => apiClient.get<ApiResponse<any[]>>('/squads/main'),

  // Get squad hierarchy
  getHierarchy: () => apiClient.get<ApiResponse<any[]>>('/squads/hierarchy'),

  // Get squad statistics
  getStats: () => apiClient.get<ApiResponse<any>>('/squads/stats'),

  // Get squad by ID
  getSquad: (id: string) => apiClient.get<ApiResponse<any>>(`/squads/${id}`),

  // Get subsquads
  getSubsquads: (parentSquadId: string) => 
    apiClient.get<ApiResponse<any[]>>(`/squads/${parentSquadId}/subsquads`),

  // Add new squad
  addSquad: (squad: any) => apiClient.post<ApiResponse<any>>('/squads', squad),

  // Update squad
  updateSquad: (id: string, updates: any) => apiClient.put<ApiResponse<null>>(`/squads/${id}`, updates),

  // Remove squad
  removeSquad: (id: string) => apiClient.delete<ApiResponse<null>>(`/squads/${id}`),

  // Add channel to squad
  addChannelToSquad: (squadId: string, channel: any) => 
    apiClient.post<ApiResponse<any>>(`/squads/${squadId}/channels`, channel),

  // Remove channel from squad
  removeChannelFromSquad: (squadId: string, channelId: string) => 
    apiClient.delete<ApiResponse<null>>(`/squads/${squadId}/channels/${channelId}`),

  // Add person to squad
  addPersonToSquad: (squadId: string, person: any) => 
    apiClient.post<ApiResponse<any>>(`/squads/${squadId}/people`, person),

  // Remove person from squad
  removePersonFromSquad: (squadId: string, personId: string) => 
    apiClient.delete<ApiResponse<null>>(`/squads/${squadId}/people/${personId}`),

  // Add tag to squad
  addTagToSquad: (squadId: string, tag: any) => 
    apiClient.post<ApiResponse<any>>(`/squads/${squadId}/tags`, tag),

  // Remove tag from squad
  removeTagFromSquad: (squadId: string, tagId: string) => 
    apiClient.delete<ApiResponse<null>>(`/squads/${squadId}/tags/${tagId}`),

  // Export configuration
  exportConfig: () => apiClient.get<ApiResponse<string>>('/squads/export/config'),

  // Import configuration
  importConfig: (config: string) => apiClient.post<ApiResponse<null>>('/squads/import/config', { config }),
};

// Health check
export const healthApi = {
  check: () => apiClient.get<{ status: string; timestamp: string; uptime: number }>('/health'),
};

// Export the API client for direct use if needed
export { apiClient };

// Helper function to handle API responses
export const handleApiResponse = <T>(response: ApiResponse<T>): T => {
  if (!response.success) {
    throw new ApiError(response.error || 'Request failed', 400, response);
  }
  return response.data as T;
};

// Helper function to handle paginated responses
export const handlePaginatedResponse = <T>(response: PaginatedResponse<T>): {
  data: T[];
  pagination: PaginatedResponse<T>['pagination'];
} => {
  if (!response.success) {
    throw new ApiError(response.error || 'Request failed', 400, response);
  }
  return {
    data: response.data || [],
    pagination: response.pagination,
  };
};
