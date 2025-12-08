import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  XCircle,
  FileText,
  Wrench,
  RefreshCw,
  Check,
} from 'lucide-react';
import type { Problem, ProblemReport } from '@/types/preview';
import { usePreviewStore } from '@/stores/previewStore';
import { createProblemFixPrompt } from '@/lib/problemPrompt';
import { cn } from '@/lib/utils';

interface ProblemItemProps {
  problem: Problem;
  checked: boolean;
  onToggle: () => void;
}

/**
 * 개별 문제 아이템 컴포넌트
 */
const ProblemItem: React.FC<ProblemItemProps> = ({ problem, checked, onToggle }) => {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={cn(
        "cursor-pointer flex items-start gap-3 p-3 border-b border-gray-200 dark:border-gray-700",
        "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
        checked && "bg-purple-50 dark:bg-purple-900/20"
      )}
      data-testid="problem-row"
    >
      {/* 체크박스 */}
      <div
        className={cn(
          "mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
          checked
            ? "bg-purple-500 border-purple-500"
            : "border-gray-300 dark:border-gray-600"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>

      {/* 에러 아이콘 */}
      <div className="flex-shrink-0 mt-0.5">
        <XCircle className={cn(
          "w-4 h-4",
          problem.severity === 'error' ? "text-red-500" : "text-yellow-500"
        )} />
      </div>

      {/* 문제 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="text-sm font-medium truncate text-gray-700 dark:text-gray-300">
            {problem.file}
          </span>
          <span className="text-xs text-gray-500">
            {problem.line}:{problem.column}
          </span>
          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
            TS{problem.code}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {problem.message}
        </p>
        {problem.snippet && (
          <pre className="mt-2 text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
            {problem.snippet}
          </pre>
        )}
      </div>
    </div>
  );
};

interface RecheckButtonProps {
  onRecheck: () => void;
  isChecking: boolean;
  className?: string;
}

/**
 * 재검사 버튼 컴포넌트
 */
const RecheckButton: React.FC<RecheckButtonProps> = ({
  onRecheck,
  isChecking,
  className,
}) => {
  return (
    <button
      onClick={onRecheck}
      disabled={isChecking}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm",
        "border border-gray-300 dark:border-gray-600",
        "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      data-testid="recheck-button"
    >
      <RefreshCw className={cn("w-4 h-4", isChecking && "animate-spin")} />
      {isChecking ? "Checking..." : "Run checks"}
    </button>
  );
};

interface ProblemsSummaryProps {
  problemReport: ProblemReport;
  selectedCount: number;
  onClearAll: () => void;
  onFixSelected: () => void;
  onSelectAll: () => void;
  onRecheck: () => void;
  isChecking: boolean;
}

/**
 * 문제 요약 헤더 컴포넌트
 */
const ProblemsSummary: React.FC<ProblemsSummaryProps> = ({
  problemReport,
  selectedCount,
  onClearAll,
  onFixSelected,
  onSelectAll,
  onRecheck,
  isChecking,
}) => {
  const { problems } = problemReport;
  const totalErrors = problems.filter(p => p.severity === 'error').length;
  const totalWarnings = problems.filter(p => p.severity === 'warning').length;

  if (problems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center">
        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-3">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
          No problems found
        </p>
        <RecheckButton onRecheck={onRecheck} isChecking={isChecking} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-4">
        {totalErrors > 0 && (
          <div className="flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {totalErrors} {totalErrors === 1 ? 'error' : 'errors'}
            </span>
          </div>
        )}
        {totalWarnings > 0 && (
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {totalWarnings} {totalWarnings === 1 ? 'warning' : 'warnings'}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <RecheckButton onRecheck={onRecheck} isChecking={isChecking} />

        {selectedCount === 0 ? (
          <button
            onClick={onSelectAll}
            className="px-3 py-1.5 rounded-md text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Select all
          </button>
        ) : (
          <button
            onClick={onClearAll}
            className="px-3 py-1.5 rounded-md text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Clear all
          </button>
        )}

        <button
          onClick={onFixSelected}
          disabled={selectedCount === 0}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium",
            "bg-purple-500 text-white hover:bg-purple-600",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors"
          )}
          data-testid="fix-all-button"
        >
          <Wrench className="w-4 h-4" />
          Fix {selectedCount} {selectedCount === 1 ? 'problem' : 'problems'}
        </button>
      </div>
    </div>
  );
};

interface ProblemsProps {
  projectPath: string | null;
  onAIFix: (prompt: string) => void;
}

/**
 * Problems 탭 메인 컴포넌트
 */
export const Problems: React.FC<ProblemsProps> = ({ projectPath, onAIFix }) => {
  const { problemReport, isCheckingProblems, setProblemReport, setIsCheckingProblems } = usePreviewStore();
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const problemKey = (p: Problem) => `${p.file}:${p.line}:${p.column}:${p.code}`;

  // 문제 체크 (TODO: 실제 Tauri 커맨드 연결)
  const checkProblems = useCallback(async () => {
    if (!projectPath) return;

    setIsCheckingProblems(true);
    try {
      // TODO: Tauri invoke('check_typescript_problems', { projectPath })
      // 임시로 빈 리포트 설정
      console.log('Checking problems for:', projectPath);

      // 시뮬레이션 딜레이
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProblemReport({ problems: [], timestamp: Date.now() });
    } catch (error) {
      console.error('Failed to check problems:', error);
    } finally {
      setIsCheckingProblems(false);
    }
  }, [projectPath, setProblemReport, setIsCheckingProblems]);

  // 문제 목록이 변경되면 모두 선택
  useEffect(() => {
    if (problemReport?.problems?.length) {
      setSelectedKeys(new Set(problemReport.problems.map(problemKey)));
    } else {
      setSelectedKeys(new Set());
    }
  }, [problemReport]);

  // 선택된 문제 수정
  const handleFixSelected = useCallback(() => {
    if (!problemReport) return;

    const selectedProblems = problemReport.problems.filter((p) =>
      selectedKeys.has(problemKey(p))
    );

    if (selectedProblems.length === 0) return;

    const subsetReport: ProblemReport = { problems: selectedProblems };
    const prompt = createProblemFixPrompt(subsetReport);
    onAIFix(prompt);
  }, [problemReport, selectedKeys, onAIFix]);

  // 프로젝트 경로 없음
  if (!projectPath) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
          No Project Selected
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
          Select a project to view TypeScript problems and diagnostic information.
        </p>
      </div>
    );
  }

  // 문제 리포트 없음
  if (!problemReport) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
          No Problems Report
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">
          Run checks to scan your project for TypeScript errors and other problems.
        </p>
        <RecheckButton
          onRecheck={checkProblems}
          isChecking={isCheckingProblems}
        />
      </div>
    );
  }

  const validSelectedCount = [...selectedKeys].filter((key) =>
    problemReport.problems.some((p) => problemKey(p) === key)
  ).length;

  return (
    <div className="flex flex-col h-full" data-testid="problems-pane">
      <ProblemsSummary
        problemReport={problemReport}
        selectedCount={validSelectedCount}
        onClearAll={() => setSelectedKeys(new Set())}
        onSelectAll={() =>
          setSelectedKeys(new Set(problemReport.problems.map(problemKey)))
        }
        onFixSelected={handleFixSelected}
        onRecheck={checkProblems}
        isChecking={isCheckingProblems}
      />

      <div className="flex-1 overflow-y-auto">
        {problemReport.problems.map((problem) => {
          const key = problemKey(problem);
          const checked = selectedKeys.has(key);
          return (
            <ProblemItem
              key={key}
              problem={problem}
              checked={checked}
              onToggle={() => {
                setSelectedKeys((prev) => {
                  const next = new Set(prev);
                  if (next.has(key)) {
                    next.delete(key);
                  } else {
                    next.add(key);
                  }
                  return next;
                });
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Problems;
