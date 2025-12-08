import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';

interface User {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
}

interface Subscription {
  planType: 'FREE' | 'PRO';
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE';
  currentPeriodEnd?: string;
}

interface AuthState {
  // State
  user: User | null;
  subscription: Subscription | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (token: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  canCreateProject: () => boolean;
  refreshUserData: () => Promise<void>;

  // Settings
  getUserSettings: () => Promise<any>;
  saveUserSettings: (settings: any) => Promise<void>;
  updateUserSetting: (key: string, value: any) => Promise<void>;
}

const API_URL = 'http://localhost:4000';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      subscription: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // 로그인
      login: async (token: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await tauriFetch(`${API_URL}/auth/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }

          const data = await response.json();

          set({
            user: data.user,
            subscription: data.subscription,
            accessToken: token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error('Login failed:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
          throw error;
        }
      },

      // 로그아웃
      logout: () => {
        set({
          user: null,
          subscription: null,
          accessToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      // 인증 확인
      checkAuth: async () => {
        const { accessToken } = get();
        if (!accessToken) return false;

        try {
          const response = await tauriFetch(`${API_URL}/auth/verify`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (!response.ok) {
            get().logout();
            return false;
          }

          return true;
        } catch (error) {
          get().logout();
          return false;
        }
      },

      // 프로젝트 생성 가능 여부
      canCreateProject: () => {
        const { subscription } = get();
        return subscription?.planType === 'PRO' && subscription?.status === 'ACTIVE';
      },

      // 사용자 데이터 새로고침
      refreshUserData: async () => {
        const { accessToken } = get();
        if (!accessToken) return;

        try {
          const response = await tauriFetch(`${API_URL}/auth/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            set({
              user: data.user,
              subscription: data.subscription,
            });
          }
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      },

      // 사용자 설정 가져오기
      getUserSettings: async () => {
        const { accessToken } = get();
        if (!accessToken) throw new Error('Not authenticated');

        try {
          const response = await tauriFetch(`${API_URL}/api/settings`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch settings');
          }

          const data = await response.json();
          return data.settings;
        } catch (error) {
          console.error('Failed to get user settings:', error);
          throw error;
        }
      },

      // 사용자 설정 저장 (전체 교체)
      saveUserSettings: async (settings: any) => {
        const { accessToken } = get();
        if (!accessToken) throw new Error('Not authenticated');

        try {
          const response = await tauriFetch(`${API_URL}/api/settings`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ settings }),
          });

          if (!response.ok) {
            throw new Error('Failed to save settings');
          }

          console.log('Settings saved successfully');
        } catch (error) {
          console.error('Failed to save user settings:', error);
          throw error;
        }
      },

      // 특정 설정 업데이트
      updateUserSetting: async (key: string, value: any) => {
        const { accessToken } = get();
        if (!accessToken) throw new Error('Not authenticated');

        try {
          const response = await tauriFetch(`${API_URL}/api/settings/${key}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ value }),
          });

          if (!response.ok) {
            throw new Error('Failed to update setting');
          }

          console.log(`Setting ${key} updated successfully`);
        } catch (error) {
          console.error(`Failed to update setting ${key}:`, error);
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        subscription: state.subscription,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
