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
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  canCreateProject: () => boolean;
  refreshUserData: () => Promise<void>;

  // Settings
  getUserSettings: () => Promise<any>;
  saveUserSettings: (settings: any) => Promise<void>;
  updateUserSetting: (key: string, value: any) => Promise<void>;

  // Dev
  devLogin: () => void;
}

const API_URL = import.meta.env.VITE_AUTH_API_URL || 'https://auth.any-on.com';

// Dev user for development environment
const DEV_USER: User = {
  id: 'dev-user-001',
  email: 'dev@anyon.local',
  name: 'Dev User',
};

const DEV_SUBSCRIPTION: Subscription = {
  planType: 'PRO',
  status: 'ACTIVE',
};

// Check if we're in development mode
const isDev = import.meta.env.DEV;

// Allow disabling auto dev login with environment variable
// Set VITE_DISABLE_AUTO_DEV_LOGIN=true to test real login flow in dev mode
const shouldUseDevUser = isDev && import.meta.env.VITE_DISABLE_AUTO_DEV_LOGIN !== 'true';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state - use dev user in development mode (unless disabled)
      user: shouldUseDevUser ? DEV_USER : null,
      subscription: shouldUseDevUser ? DEV_SUBSCRIPTION : null,
      accessToken: shouldUseDevUser ? 'dev-token' : null,
      isAuthenticated: shouldUseDevUser ? true : false,
      isLoading: false,
      error: null,

      // 로그인
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await tauriFetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Login failed');
          }

          const data = await response.json();

          set({
            user: data.user,
            subscription: data.subscription,
            accessToken: data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({
            isLoading: false,
            error: message,
          });
          throw new Error(message);
        }
      },

      // 회원가입
      register: async (email: string, password: string, name: string) => {
        try {
          const response = await tauriFetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, name }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Registration failed');
          }

          const data = await response.json();
          console.log('✅ Registration successful:', data.message);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Registration failed';
          throw new Error(message);
        }
      },

      // 이메일 인증
      verifyEmail: async (email: string, code: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await tauriFetch(`${API_URL}/auth/verify-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, code }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Verification failed');
          }

          const data = await response.json();

          set({
            user: data.user,
            subscription: data.subscription,
            accessToken: data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Verification failed';
          set({
            isLoading: false,
            error: message,
          });
          throw new Error(message);
        }
      },

      // 인증 코드 재전송
      resendCode: async (email: string) => {
        try {
          const response = await tauriFetch(`${API_URL}/auth/resend-code`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Resend failed');
          }

          const data = await response.json();
          console.log('✅ Code resent:', data.message);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Resend failed';
          throw new Error(message);
        }
      },

      // 비밀번호 찾기
      forgotPassword: async (email: string) => {
        try {
          const response = await tauriFetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Forgot password request failed');
          }

          const data = await response.json();
          console.log('✅ Reset code sent:', data.message);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Forgot password failed';
          throw new Error(message);
        }
      },

      // 비밀번호 재설정
      resetPassword: async (email: string, code: string, newPassword: string) => {
        try {
          const response = await tauriFetch(`${API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, code, newPassword }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Password reset failed');
          }

          const data = await response.json();
          console.log('✅ Password reset successful:', data.message);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Password reset failed';
          throw new Error(message);
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
        const tokenAtCall = accessToken;

        try {
          const response = await tauriFetch(`${API_URL}/auth/verify`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (!response.ok) {
            const { accessToken: currentToken } = get();
            if (currentToken === tokenAtCall) {
              get().logout();
            }
            return false;
          }

          return true;
        } catch (error) {
          const { accessToken: currentToken } = get();
          if (currentToken === tokenAtCall) {
            get().logout();
          }
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

      // Dev 로그인 (개발 환경 전용)
      devLogin: () => {
        set({
          user: DEV_USER,
          subscription: DEV_SUBSCRIPTION,
          accessToken: 'dev-token',
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // In dev mode, use dev user (unless disabled)
        user: shouldUseDevUser ? DEV_USER : state.user,
        subscription: shouldUseDevUser ? DEV_SUBSCRIPTION : state.subscription,
        accessToken: shouldUseDevUser ? 'dev-token' : state.accessToken,
        isAuthenticated: shouldUseDevUser ? true : state.isAuthenticated,
      }),
      // Merge function to ensure dev user is used when enabled
      merge: (persistedState, currentState) => {
        const merged = { ...currentState, ...(persistedState as Partial<AuthState>) };
        // In dev mode, override with dev user (unless disabled)
        if (shouldUseDevUser) {
          merged.user = DEV_USER;
          merged.subscription = DEV_SUBSCRIPTION;
          merged.accessToken = 'dev-token';
          merged.isAuthenticated = true;
        }
        return merged;
      },
    }
  )
);
