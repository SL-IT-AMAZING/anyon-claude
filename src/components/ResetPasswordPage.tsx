import React, { useState, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from "@/lib/icons";
import { CustomTitlebar } from '@/components/CustomTitlebar';
import anyonTextLogo from '@/assets/ANYON.png';

export const ResetPasswordPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const resetPassword = useAuthStore((state) => state.resetPassword);

  const email = location.state?.email || '';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handleCodeChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const codeString = code.join('');

    if (codeString.length !== 6) {
      setError('6자리 인증 코드를 입력해주세요');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('비밀번호를 입력해주세요');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    if (passwordStrength < 4) {
      setError('비밀번호는 8자 이상, 대문자, 소문자, 숫자를 포함해야 합니다');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await resetPassword(email, codeString, newPassword);
      console.log('✅ Password reset successfully');
      // Navigate to login page
      navigate('/login');
    } catch (error: any) {
      console.error('❌ Password reset failed:', error);
      setError(error.message || '비밀번호 재설정에 실패했습니다');
      setIsLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="h-full flex flex-col">
        <CustomTitlebar />
        <div className="flex-1 flex items-center justify-center p-8 bg-background">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">이메일 주소가 없습니다</p>
            <Button onClick={() => navigate('/forgot-password')}>비밀번호 찾기</Button>
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
            <h2 className="text-2xl font-semibold text-foreground">비밀번호 재설정</h2>
            <p className="text-muted-foreground">
              {email}로 전송된 인증 코드를 입력하고<br />새 비밀번호를 설정해주세요
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 6자리 코드 입력 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">인증 코드</label>
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
            </div>

            {/* 새 비밀번호 */}
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="새 비밀번호"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                className="h-12 bg-card border-border"
                required
              />
              {newPassword && (
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
            </div>

            {/* 비밀번호 확인 */}
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
              className="w-full h-12"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  재설정 중...
                </>
              ) : (
                '비밀번호 재설정'
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
