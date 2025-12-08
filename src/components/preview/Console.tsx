import React, { useEffect, useRef } from 'react';
import { Trash2, ChevronDown } from 'lucide-react';
import { usePreviewStore } from '@/stores/previewStore';
import { cn } from '@/lib/utils';
import type { AppOutput } from '@/types/preview';

/**
 * 출력 타입에 따른 스타일 반환
 */
function getOutputStyle(type: AppOutput['type']): string {
  switch (type) {
    case 'stderr':
    case 'client-error':
      return 'text-red-500 dark:text-red-400';
    case 'info':
      return 'text-blue-500 dark:text-blue-400';
    case 'hmr':
      return 'text-purple-500 dark:text-purple-400';
    default:
      return 'text-gray-700 dark:text-gray-300';
  }
}

/**
 * 타임스탬프 포맷
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

interface ConsoleLineProps {
  output: AppOutput;
  showTimestamp?: boolean;
}

/**
 * 콘솔 라인 컴포넌트
 */
const ConsoleLine: React.FC<ConsoleLineProps> = ({ output, showTimestamp = true }) => {
  return (
    <div className={cn(
      "flex gap-2 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-800/50 px-2 -mx-2 rounded",
      getOutputStyle(output.type)
    )}>
      {showTimestamp && (
        <span className="text-gray-400 dark:text-gray-500 flex-shrink-0 select-none">
          [{formatTimestamp(output.timestamp)}]
        </span>
      )}
      <span className="break-all whitespace-pre-wrap">{output.message}</span>
    </div>
  );
};

interface ConsoleProps {
  className?: string;
}

/**
 * Console 탭 메인 컴포넌트
 * 앱 출력 로그를 실시간으로 표시
 */
export const Console: React.FC<ConsoleProps> = ({ className }) => {
  const { appOutputs, clearAppOutputs } = usePreviewStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = React.useState(true);

  // 자동 스크롤
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [appOutputs, autoScroll]);

  // 스크롤 이벤트 핸들러 (수동 스크롤 시 자동 스크롤 비활성화)
  const handleScroll = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  // 빈 상태
  if (appOutputs.length === 0) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
          <div className="text-center">
            <p className="text-sm">No output yet</p>
            <p className="text-xs mt-1">Console messages will appear here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {appOutputs.length} {appOutputs.length === 1 ? 'message' : 'messages'}
        </span>

        <div className="flex items-center gap-2">
          {/* 자동 스크롤 토글 */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded text-xs",
              autoScroll
                ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500"
            )}
            title={autoScroll ? "Auto-scroll enabled" : "Auto-scroll disabled"}
          >
            <ChevronDown className={cn("w-3 h-3", !autoScroll && "opacity-50")} />
            Auto-scroll
          </button>

          {/* 클리어 버튼 */}
          <button
            onClick={clearAppOutputs}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Clear console"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>

      {/* 콘솔 출력 */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto font-mono text-xs px-4 py-2"
      >
        {appOutputs.map((output, index) => (
          <ConsoleLine key={`${output.timestamp}-${index}`} output={output} />
        ))}
      </div>
    </div>
  );
};

export default Console;
