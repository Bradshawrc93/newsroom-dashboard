import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser } from '../types';

interface AuthState {
  // State
  user: AuthUser | null;
  accessToken: string | null;
  refreshTokenValue: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  slackConnected: boolean;

  // Actions
  login: (code: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  setSlackConnected: (connected: boolean) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshTokenValue: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      slackConnected: false,

      // Actions
      login: async (code: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/auth/slack-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Login failed');
          }

          if (data.success && data.data) {
            set({
              user: data.data.user,
              accessToken: data.data.accessToken,
              refreshTokenValue: data.data.refreshToken,
              isAuthenticated: true,
              slackConnected: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error('Invalid response format');
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
            isAuthenticated: false,
          });
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshTokenValue: null,
          isAuthenticated: false,
          slackConnected: false,
          error: null,
        });
      },

      refreshToken: async () => {
        const { refreshTokenValue } = get();
        
        if (!refreshTokenValue) {
          get().logout();
          return;
        }

        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken: refreshTokenValue }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Token refresh failed');
          }

          if (data.success && data.data) {
            set({
              accessToken: data.data.accessToken,
              refreshTokenValue: data.data.refreshToken,
              isAuthenticated: true,
            });
          } else {
            throw new Error('Invalid response format');
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          get().logout();
        }
      },

      setUser: (user: AuthUser) => {
        set({ user, isAuthenticated: true });
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshTokenValue: refreshToken, isAuthenticated: true });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setSlackConnected: (connected: boolean) => {
        set({ slackConnected: connected });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshTokenValue,
        isAuthenticated: state.isAuthenticated,
        slackConnected: state.slackConnected,
      }),
    }
  )
);

// Helper function to get auth headers
export const getAuthHeaders = (): Record<string, string> => {
  const { accessToken } = useAuthStore.getState();
  
  if (!accessToken) {
    return {};
  }

  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
};

// Helper function to check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// Auto-refresh token when needed
export const setupTokenRefresh = () => {
  const { accessToken, refreshTokenValue } = useAuthStore.getState();
  
  if (!accessToken || !refreshTokenValue) {
    return;
  }

  // Check if token is expired or will expire soon (within 5 minutes)
  if (isTokenExpired(accessToken)) {
    useAuthStore.getState().refreshToken();
  } else {
    // Set up refresh before expiration
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const expiresAt = payload.exp * 1000;
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now - (5 * 60 * 1000); // 5 minutes before expiry

    if (timeUntilExpiry > 0) {
      setTimeout(() => {
        useAuthStore.getState().refreshToken();
      }, timeUntilExpiry);
    } else {
      useAuthStore.getState().refreshToken();
    }
  }
};
