import { motion } from "framer-motion";
import { AlertCircle, RefreshCw } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import type { SessionError } from "@/components/ClaudeCodeSession";

interface TokenLimitErrorBannerProps {
  error: SessionError | null;
  onContinue: () => void;
  isLoading?: boolean;
}

/**
 * 토큰 제한 초과 에러 발생 시 표시되는 배너
 * "이어서 하기" 버튼을 클릭하면 자동으로 "이어서 해줘" 프롬프트 전송
 */
export function TokenLimitErrorBanner({
  error,
  onContinue,
  isLoading = false,
}: TokenLimitErrorBannerProps) {
  if (!error?.isTokenLimitError) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="max-w-4xl mx-auto py-4 px-4"
    >
      <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-start gap-3 text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium">응답이 너무 길어 중단되었습니다</p>
            <p className="text-muted-foreground mt-1">
              출력 토큰 제한을 초과했습니다. 이어서 진행하시겠습니까?
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onContinue}
          disabled={isLoading}
          className="flex-shrink-0 border-amber-500/30 hover:bg-amber-500/10"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          이어서 하기
        </Button>
      </div>
    </motion.div>
  );
}
