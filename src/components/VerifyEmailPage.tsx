import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from "@/lib/icons";
import { CustomTitlebar } from '@/components/CustomTitlebar';
import anyonTextLogo from '@/assets/ANYON.png';

export const VerifyEmailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const verifyEmail = useAuthStore((state) => state.verifyEmail);
  const resendCode = useAuthStore((state) => state.resendCode);

  const email = location.state?.email || '';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Backspace handling
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const codeString = code.join('');

    if (codeString.length !== 6) {
      setError('6자리 인증 코드를 입력해주세요');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await verifyEmail(email, codeString);
      console.log('✅ Email verified successfully');
      // Navigate to main app (auto-login handled by authStore)
      navigate('/');
    } catch (error: any) {
      console.error('❌ Verification failed:', error);
      setError(error.message || '인증에 실패했습니다');
      setIsLoading(false);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    try {
      setError(null);
      await resendCode(email);
      setResendCooldown(60);
      console.log('✅ Verification code resent');
    } catch (error: any) {
      console.error('❌ Resend failed:', error);
      setError(error.message || '코드 재전송에 실패했습니다');
    }
  };

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    const codeString = code.join('');
    if (codeString.length === 6 && !isLoading) {
      handleVerify();
    }
  }, [code]);

  if (!email) {
    return (
      <div className="h-full flex flex-col">
        <CustomTitlebar />
        <div className="flex-1 flex items-center justify-center p-8 bg-background">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">이메일 주소가 없습니다</p>
            <Button onClick={() => navigate('/signup')}>회원가입하기</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <CustomTitlebar className="!bg-transparent !border-none !backdrop-blur-none" />

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* 로고 */}
          <div className="text-center">
            <img src={anyonTextLogo} alt="ANYON" className="h-12 mx-auto invert dark:invert-0" />
          </div>

          {/* 제목 */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">이메일 인증</h2>
            <p className="text-muted-foreground">
              {email}로 전송된<br />6자리 인증 코드를 입력해주세요
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* 6자리 코드 입력 */}
          <div className="flex justify-center gap-2">
            {code.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isLoading}
                className="w-12 h-14 text-center text-2xl font-bold bg-card border-border"
              />
            ))}
          </div>

          {/* 인증 버튼 */}
          <Button
            onClick={handleVerify}
            disabled={isLoading || code.join('').length !== 6}
            className="w-full h-12"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                인증 중...
              </>
            ) : (
              '인증하기'
            )}
          </Button>

          {/* 코드 재전송 */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              코드를 받지 못하셨나요?{' '}
              {resendCooldown > 0 ? (
                <span className="text-muted-foreground">({resendCooldown}초 후 재전송 가능)</span>
              ) : (
                <button
                  onClick={handleResend}
                  className="text-primary hover:underline underline-offset-2 font-medium"
                  type="button"
                >
                  재전송
                </button>
              )}
            </p>
          </div>

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
