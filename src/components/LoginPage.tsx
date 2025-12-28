import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from "@/lib/icons";
import { CustomTitlebar } from '@/components/CustomTitlebar';
import anyonLogo from '@/assets/logo-anyon.png';
import anyonTextLogo from '@/assets/ANYON.png';

export const LoginPage: React.FC = () => {
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await login(email, password);
      console.log('✅ Login successful');
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      setError(error.message || '로그인에 실패했습니다');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  return (
    <div className="h-full flex relative">
      {/* 타이틀바 - 전체 화면 위에 오버레이 */}
      <div className="absolute top-0 left-0 right-0 z-50">
        <CustomTitlebar className="!bg-transparent !border-none !backdrop-blur-none" />
      </div>

      {/* 왼쪽: 브랜드 비주얼 영역 */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0a0a0a]" style={{ clipPath: 'inset(0)' }}>
        {/* 배경 장식 요소 */}
        <div className="absolute inset-0">
          {/* 중앙에서 바깥으로 퍼지는 흑백 그라데이션 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/10 rounded-full blur-[150px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-white/15 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-white/20 rounded-full blur-[60px]" />
          
          {/* 그리드 패턴 */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          />
        </div>

        {/* 브랜드 콘텐츠 */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-center">
          <div className="space-y-8 max-w-md">
            {/* 로고 */}
            <div className="flex justify-center">
              <img 
                src={anyonLogo} 
                alt="ANYON" 
                className="h-32 invert"
              />
            </div>
            
            {/* 타이틀 */}
            <div className="space-y-6">
              <h1 className="text-5xl font-bold text-white/90 tracking-tight leading-tight">
                From idea to production.
              </h1>
              <p className="text-2xl text-white/60">
                No code required.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 오른쪽: 로그인 폼 영역 */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          {/* 로고 */}
          <div className="text-center">
            <img src={anyonTextLogo} alt="ANYON" className="h-12 mx-auto logo-invert" />
          </div>

          {/* 환영 메시지 */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              Welcome back
            </h2>
            <p className="text-muted-foreground">
              계정에 로그인하여 시작하세요
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* 로그인 폼 */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-12 bg-card border-border"
                required
              />
            </div>

            <div className="space-y-2">
              <Input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-12 bg-card border-border"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 flex items-center justify-center gap-3 text-base"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>로그인 중...</span>
                </>
              ) : (
                <span>로그인</span>
              )}
            </Button>

            {/* 비밀번호 찾기 링크 */}
            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                비밀번호를 잊으셨나요?
              </Link>
            </div>
          </form>

          {/* 구분선 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
          </div>

          {/* 회원가입 링크 */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              계정이 없으신가요?{' '}
              <Link
                to="/signup"
                className="text-primary hover:underline underline-offset-2 font-medium"
              >
                회원가입
              </Link>
            </p>
          </div>

          {/* 약관 */}
          <p className="text-center text-xs text-muted-foreground leading-relaxed">
            로그인하면{' '}
            <a href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">
              이용약관
            </a>
            과{' '}
            <a href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">
              개인정보처리방침
            </a>
            에 동의하는 것으로 간주됩니다.
          </p>

        </div>
      </div>
    </div>
  );
}
