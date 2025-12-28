import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from "@/lib/icons";
import { CustomTitlebar } from '@/components/CustomTitlebar';
import anyonTextLogo from '@/assets/ANYON.png';

export const SignupPage: React.FC = () => {
  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      setError('모든 필드를 입력해주세요');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    if (passwordStrength < 4) {
      setError('비밀번호는 8자 이상, 대문자, 소문자, 숫자를 포함해야 합니다');
      return;
    }

    try {
      setIsLoading(true);
      await register(email, password, name);
      // Navigate to verify-email page
      navigate('/verify-email', { state: { email } });
    } catch (error: any) {
      console.error('❌ Signup failed:', error);
      setError(error.message || '회원가입에 실패했습니다');
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
            <h2 className="text-2xl font-semibold text-foreground">회원가입</h2>
            <p className="text-muted-foreground">
              ANYON과 함께 시작하세요
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* 회원가입 폼 */}
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="h-12 bg-card border-border"
                required
              />
            </div>

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
              {/* 비밀번호 강도 표시 */}
              {password && (
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded ${
                        passwordStrength >= level
                          ? level === 4
                            ? 'bg-green-500'
                            : level >= 3
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
              )}
              {password && (
                <p className="text-xs text-muted-foreground">
                  8자 이상, 대문자, 소문자, 숫자 포함
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Input
                type="password"
                placeholder="비밀번호 확인"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                  <span>회원가입 중...</span>
                </>
              ) : (
                <span>회원가입</span>
              )}
            </Button>
          </form>

          {/* 로그인 링크 */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              이미 계정이 있으신가요?{' '}
              <Link
                to="/login"
                className="text-primary hover:underline underline-offset-2 font-medium"
              >
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
