import React, { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-shell';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chrome, Loader2, Crown, Terminal } from 'lucide-react';

const API_URL = 'http://localhost:4000';

export const LoginPage: React.FC = () => {
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Deep Link 이벤트 리스너 등록 (Tauri Deep Link 플러그인 v2)
    const setupListener = async () => {
      const unlisten = await listen<string[]>('plugin:deep-link://urls', async (event) => {
        console.log('Deep link received (plugin:deep-link://urls):', event.payload);

        try {
          // Tauri Deep Link 플러그인은 URL을 배열로 전달
          const urls = event.payload;
          if (urls && urls.length > 0) {
            const urlString = urls[0];
            const url = new URL(urlString);
            const token = url.searchParams.get('token');

            if (token) {
              setIsLoading(true);
              await login(token);
              console.log('Login successful!');
            } else {
              setError('로그인에 실패했습니다. 토큰이 없습니다.');
            }
          }
        } catch (error) {
          console.error('Login failed:', error);
          setError('로그인에 실패했습니다. 다시 시도해주세요.');
        } finally {
          setIsLoading(false);
        }
      });

      return unlisten;
    };

    const unlistenPromise = setupListener();

    return () => {
      unlistenPromise.then((fn) => fn());
    };
  }, [login]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 백엔드에서 구글 OAuth URL 가져오기 (Tauri HTTP 플러그인 사용)
      const response = await tauriFetch(`${API_URL}/auth/google/url`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to get Google auth URL');
      }

      const data = await response.json();

      // 프로덕션 모드: OAuth URL로 리다이렉트
      const { url } = data as { url: string };
      if (url) {
        await open(url);
        console.log('Opened Google login page');
      }
    } catch (error) {
      console.error('Failed to open Google login:', error);
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
      setIsLoading(false);
    }
  };

  const handleDevLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await tauriFetch(`${API_URL}/auth/dev/login`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Dev login failed');
      }

      const data = await response.json();
      if (data.token) {
        console.log('Dev Login successful!');
        await login(data.token);
      }
    } catch (error) {
      console.error('Dev login failed:', error);
      setError('Dev 로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full p-8 space-y-6">
        {/* 로고 */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">ANYON</h1>
          <p className="text-muted-foreground">
            AI 기반 개발 플랫폼
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* 로그인 버튼 */}
        <div className="space-y-4">
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-12 flex items-center justify-center gap-3 text-base"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                로그인 중...
              </>
            ) : (
              <>
                <Chrome className="w-5 h-5" />
                구글로 로그인
              </>
            )}
          </Button>

          {/* Dev Login Button (Development Only) */}
          {import.meta.env.DEV && (
            <Button
              onClick={handleDevLogin}
              disabled={isLoading}
              variant="outline"
              className="w-full h-12 flex items-center justify-center gap-3 text-base border-dashed"
              size="lg"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Terminal className="w-5 h-5 text-muted-foreground" />
              )}
              Dev Login
            </Button>
          )}

          <p className="text-center text-xs text-muted-foreground">
            로그인하면{' '}
            <a href="#" className="underline hover:text-foreground">
              이용약관
            </a>
            과{' '}
            <a href="#" className="underline hover:text-foreground">
              개인정보처리방침
            </a>
            에<br />동의하는 것으로 간주됩니다.
          </p>
        </div>

        {/* 플랜 정보 */}
        <div className="pt-4 border-t space-y-2">
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex justify-between items-center">
              <span>• Free 플랜</span>
              <span className="text-xs">프로젝트 1개</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1">
                <Crown className="w-3 h-3 text-yellow-500" />
                Pro 플랜
              </span>
              <span className="text-xs">프로젝트 무제한 (월 30,000원)</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
