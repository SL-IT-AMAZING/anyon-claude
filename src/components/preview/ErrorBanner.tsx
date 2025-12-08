import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Sparkles, AlertTriangle } from 'lucide-react';
import type { PreviewError } from '@/types/preview';
import { cn } from '@/lib/utils';

interface ErrorBannerProps {
  error: PreviewError | undefined;
  onDismiss: () => void;
  onAIFix: (prompt: string) => void;
}

/**
 * 프리뷰 에러 배너 컴포넌트
 * iframe에서 발생한 에러를 표시하고 AI 수정 기능 제공
 */
export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  onDismiss,
  onAIFix,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!error) return null;

  const handleAIFix = () => {
    let prompt = '';

    if (error.source === 'dev-server') {
      prompt = `Fix this dev server error:\n\n`;
      prompt += `**Error:**\n\`\`\`\n${error.message}\n\`\`\`\n\n`;
      prompt += `The dev server failed to start. Please analyze the error and fix it. Common causes:\n`;
      prompt += `- Missing dependencies (run npm install)\n`;
      prompt += `- Missing configuration files\n`;
      prompt += `- Syntax errors in config files\n\n`;
      prompt += `Please provide the fix.`;
    } else {
      prompt = `Fix this runtime error in the preview:\n\n`;
      prompt += `**Error Message:**\n${error.message}\n\n`;

      if (error.stack) {
        prompt += `**Stack Trace:**\n\`\`\`\n${error.stack}\n\`\`\`\n\n`;
      }

      prompt += `Please analyze the error and provide a fix.`;
    }

    onAIFix(prompt);
  };

  const getErrorLabel = () => {
    switch (error.source) {
      case 'dev-server':
        return 'Dev Server';
      case 'preview-app':
        return 'Preview';
      default:
        return 'App';
    }
  };

  const getErrorTitle = () => {
    switch (error.source) {
      case 'dev-server':
        return 'Dev Server Error';
      default:
        return 'Runtime Error';
    }
  };

  // 에러 메시지가 길면 줄이기
  const shortMessage = error.message.length > 100
    ? error.message.slice(0, 100) + '...'
    : error.message;

  return (
    <div className="absolute top-2 left-2 right-2 z-50 animate-in slide-in-from-top-2 duration-200">
      <div className={cn(
        "bg-red-50 dark:bg-red-950/90 border border-red-200 dark:border-red-800 rounded-lg shadow-lg",
        "backdrop-blur-sm"
      )}>
        {/* 헤더 */}
        <div className="flex items-start gap-2 p-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-red-800 dark:text-red-200">
                {getErrorTitle()}
              </span>
              <span className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-1.5 py-0.5 rounded">
                {getErrorLabel()}
              </span>
            </div>

            <p className="text-sm text-red-700 dark:text-red-300 mt-1 font-mono">
              {isExpanded ? error.message : shortMessage}
            </p>

            {/* 스택 트레이스 (확장 시) */}
            {isExpanded && error.stack && (
              <pre className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-2 rounded overflow-x-auto max-h-40 overflow-y-auto">
                {error.stack}
              </pre>
            )}
          </div>

          {/* 닫기 버튼 */}
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-red-200 dark:hover:bg-red-800 rounded transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
        </div>

        {/* 액션 바 */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-red-200 dark:border-red-800 bg-red-100/50 dark:bg-red-900/30 rounded-b-lg">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show more
              </>
            )}
          </button>

          <button
            onClick={handleAIFix}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium",
              "bg-gradient-to-r from-purple-500 to-indigo-500 text-white",
              "hover:from-purple-600 hover:to-indigo-600",
              "transition-all duration-200 shadow-sm hover:shadow"
            )}
          >
            <Sparkles className="w-4 h-4" />
            Fix with AI
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorBanner;
