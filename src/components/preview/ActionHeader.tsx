import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  Code,
  AlertTriangle,
  Terminal,
  MoreVertical,
  Cog,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePreviewStore } from '@/stores/previewStore';
import type { PreviewMode } from '@/types/preview';
import { cn } from '@/lib/utils';

interface ActionHeaderProps {
  problemCount?: number;
  onCleanRestart?: () => void;
  onClearCache?: () => void;
}

/**
 * 프리뷰 패널 액션 헤더
 * Preview | Problems | Code | Console 탭 전환 UI
 */
export const ActionHeader: React.FC<ActionHeaderProps> = ({
  problemCount = 0,
  onCleanRestart,
  onClearCache,
}) => {
  const { previewMode, setPreviewMode, isPreviewOpen, setIsPreviewOpen } = usePreviewStore();

  const previewRef = useRef<HTMLButtonElement | null>(null);
  const codeRef = useRef<HTMLButtonElement | null>(null);
  const problemsRef = useRef<HTMLButtonElement | null>(null);
  const consoleRef = useRef<HTMLButtonElement | null>(null);

  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const isCompact = windowWidth < 600;

  // 윈도우 크기 추적
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 패널 선택
  const selectPanel = (panel: PreviewMode) => {
    if (previewMode === panel) {
      setIsPreviewOpen(!isPreviewOpen);
    } else {
      setPreviewMode(panel);
      setIsPreviewOpen(true);
    }
  };

  // 문제 수 포맷
  const formatProblemCount = (count: number): string => {
    if (count === 0) return '';
    if (count > 99) return '99+';
    return count.toString();
  };

  const displayCount = formatProblemCount(problemCount);

  // 인디케이터 위치 업데이트
  useEffect(() => {
    const updateIndicator = () => {
      let targetRef: React.RefObject<HTMLButtonElement | null>;

      switch (previewMode) {
        case 'preview':
          targetRef = previewRef;
          break;
        case 'code':
          targetRef = codeRef;
          break;
        case 'problems':
          targetRef = problemsRef;
          break;
        case 'console':
          targetRef = consoleRef;
          break;
        default:
          return;
      }

      if (targetRef.current) {
        const button = targetRef.current;
        const container = button.parentElement;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const buttonRect = button.getBoundingClientRect();
          const left = buttonRect.left - containerRect.left;
          const width = buttonRect.width;

          setIndicatorStyle({
            left,
            width: isPreviewOpen ? width : 0,
          });
        }
      }
    };

    const timeoutId = setTimeout(updateIndicator, 10);
    return () => clearTimeout(timeoutId);
  }, [previewMode, isPreviewOpen, isCompact]);

  // 버튼 렌더링 함수
  const renderButton = (
    mode: PreviewMode,
    ref: React.MutableRefObject<HTMLButtonElement | null>,
    icon: React.ReactNode,
    text: string,
    badge?: React.ReactNode
  ) => {
    const buttonContent = (
      <button
        ref={(el) => { ref.current = el; }}
        className={cn(
          "relative flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm font-medium z-10",
          "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
          isCompact ? "flex-col gap-0.5 px-2" : ""
        )}
        onClick={() => selectPanel(mode)}
      >
        {icon}
        <span className="flex items-center gap-1">
          {!isCompact && <span>{text}</span>}
          {badge}
        </span>
      </button>
    );

    if (isCompact) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent>
            <p>{text}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return buttonContent;
  };

  const iconSize = 16;

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        {/* 탭 버튼들 */}
        <div className="relative flex rounded-md p-0.5 gap-0.5">
          {/* 애니메이션 인디케이터 */}
          <motion.div
            className="absolute top-0.5 bottom-0.5 bg-white dark:bg-gray-700 shadow-sm rounded-md"
            animate={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
            }}
            transition={{
              type: 'spring',
              stiffness: 600,
              damping: 35,
              mass: 0.6,
            }}
          />

          {renderButton(
            'preview',
            previewRef,
            <Eye size={iconSize} />,
            'Preview'
          )}

          {renderButton(
            'problems',
            problemsRef,
            <AlertTriangle size={iconSize} />,
            'Problems',
            displayCount && (
              <span className="ml-0.5 px-1.5 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full min-w-[18px] text-center">
                {displayCount}
              </span>
            )
          )}

          {renderButton(
            'code',
            codeRef,
            <Code size={iconSize} />,
            'Code'
          )}

          {renderButton(
            'console',
            consoleRef,
            <Terminal size={iconSize} />,
            'Console'
          )}
        </div>

        {/* 더보기 메뉴 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center justify-center p-1.5 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="More options"
            >
              <MoreVertical size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {onCleanRestart && (
              <DropdownMenuItem onClick={onCleanRestart}>
                <Cog size={16} className="mr-2" />
                <div className="flex flex-col">
                  <span>Rebuild</span>
                  <span className="text-xs text-gray-500">
                    Re-installs node_modules and restarts
                  </span>
                </div>
              </DropdownMenuItem>
            )}
            {onClearCache && (
              <DropdownMenuItem onClick={onClearCache}>
                <Trash2 size={16} className="mr-2" />
                <div className="flex flex-col">
                  <span>Clear Cache</span>
                  <span className="text-xs text-gray-500">
                    Clears cookies and local storage
                  </span>
                </div>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
};

export default ActionHeader;
