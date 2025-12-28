import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from "@/lib/icons";
import { CustomTitlebar } from '@/components/CustomTitlebar';
import anyonTextLogo from '@/assets/ANYON.png';

export const ForgotPasswordPage: React.FC = () => {
  const forgotPassword = useAuthStore((state) => state.forgotPassword);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('이메일을 입력해주세요');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await forgotPassword(email);
      // Navigate to reset password page
      navigate('/reset-password', { state: { email } });
    } catch (error: any) {
      console.error('❌ Forgot password failed:', error);
      setError(error.message || '비밀번호 재설정 요청에 실패했습니다');
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <CustomTitlebar className="!bg-transparent !border-none !backdrop-blur-none" />

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          {/* 로고 */}
          <div className="text-center">
            <img src={anyonTextLogo} alt="ANYON" className="h-12 mx-auto invert dark:invert-0" />
          </div>

          {/* 제목 */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">비밀번호 찾기</h2>
            <p className="text-muted-foreground">
              가입하신 이메일로 인증 코드를 전송합니다
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* 이메일 입력 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 flex items-center justify-center gap-3 text-base"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>전송 중...</span>
                </>
              ) : (
                <span>인증 코드 전송</span>
              )}
            </Button>
          </form>

          {/* 로그인 링크 */}
          <div className="text-center">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              로그인 페이지로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
