/**
 * SDD Pattern: Real-time Status Tracking UI
 * 공유 워크플로우 진행률 컴포넌트
 *
 * 개발 탭과 유지보수 탭에서 공통으로 사용합니다.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { useExecutionProgress } from '@/hooks/useExecutionProgress';
import { KanbanBoard, MiniKanban } from '@/components/development/KanbanBoard';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Clock,
  Zap,
  Target,
  TrendingUp,
} from '@/lib/icons';
import { getTokenStatus, getTokenStatusColor } from '@/lib/tokenCounter';

interface WorkflowProgressProps {
  projectPath: string | undefined;
  variant?: 'full' | 'compact' | 'mini';
  showKanban?: boolean;
  showStats?: boolean;
  className?: string;
}

/**
 * 워크플로우 진행률 표시 컴포넌트
 */
export function WorkflowProgress({
  projectPath,
  variant = 'full',
  showKanban = true,
  showStats = true,
  className,
}: WorkflowProgressProps) {
  const { progress, kanbanColumns, stats, isLoading, error, lastUpdate, refresh } =
    useExecutionProgress(projectPath);

  // 로딩 상태
  if (isLoading && !progress) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">진행 상태 로드 중...</span>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8', className)}>
        <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
        <p className="text-red-500 text-sm">{error}</p>
        <button
          onClick={refresh}
          className="mt-4 flex items-center gap-2 px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          다시 시도
        </button>
      </div>
    );
  }

  // 진행 상태 없음
  if (!progress || !progress.current_status) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
        <Target className="w-10 h-10 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">진행 중인 워크플로우가 없습니다</p>
        <p className="text-xs text-muted-foreground mt-1">
          PM Orchestrator를 실행하여 개발을 시작하세요
        </p>
      </div>
    );
  }

  const { current_status } = progress;

  // Mini 변형: 간단한 요약만
  if (variant === 'mini') {
    return (
      <div className={cn('space-y-2', className)}>
        {/* 현재 Wave 표시 */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">현재 Wave:</span>
          <span className="font-semibold">{current_status.current_wave || '-'}</span>
        </div>

        {/* 진행률 바 */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
            style={{ width: current_status.overall_progress || '0%' }}
          />
        </div>

        {/* 미니 칸반 */}
        {showKanban && kanbanColumns.length > 0 && (
          <MiniKanban columns={kanbanColumns} className="mt-2" />
        )}
      </div>
    );
  }

  // Compact 변형: 중간 크기
  if (variant === 'compact') {
    return (
      <div className={cn('space-y-3', className)}>
        {/* 상태 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WorkflowStateIndicator state={current_status.workflow_state} />
            <span className="font-medium">{current_status.current_wave || '대기 중'}</span>
          </div>
          <span className="text-sm font-semibold text-primary">
            {current_status.overall_progress}
          </span>
        </div>

        {/* 진행률 바 */}
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 transition-all duration-500"
            style={{ width: current_status.overall_progress || '0%' }}
          />
        </div>

        {/* 칸반 (compact) */}
        {showKanban && kanbanColumns.length > 0 && (
          <KanbanBoard columns={kanbanColumns} stats={stats} compact showStats={false} />
        )}

        {/* 마지막 업데이트 */}
        {lastUpdate && (
          <div className="text-xs text-muted-foreground text-right">
            마지막 업데이트: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>
    );
  }

  // Full 변형: 전체 표시
  return (
    <div className={cn('space-y-4', className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <WorkflowStateIndicator state={current_status.workflow_state} size="lg" />
          <div>
            <h3 className="font-semibold text-lg">{current_status.current_wave || '대기 중'}</h3>
            <p className="text-sm text-muted-foreground">
              Epic: {current_status.current_epic || '-'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 진행률 */}
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {current_status.overall_progress}
            </div>
            <div className="text-xs text-muted-foreground">
              {current_status.completed_tickets} / {current_status.total_tickets} 완료
            </div>
          </div>

          {/* 새로고침 버튼 */}
          <button
            onClick={refresh}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="새로고침"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* 진행률 바 */}
      <div className="h-4 bg-muted rounded-full overflow-hidden shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 transition-all duration-500 relative"
          style={{ width: current_status.overall_progress || '0%' }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>
      </div>

      {/* 통계 카드들 */}
      {showStats && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="티켓/시간"
            value={stats.ticketsPerHour.toString()}
          />
          <StatCard
            icon={<Zap className="w-4 h-4" />}
            label="병렬성"
            value={`${stats.parallelismRatio}x`}
          />
          <StatCard
            icon={<Clock className="w-4 h-4" />}
            label="평균 시간"
            value={`${stats.averageTicketTime}분`}
          />
          {stats.estimatedCompletion && (
            <StatCard
              icon={<Target className="w-4 h-4" />}
              label="예상 완료"
              value={stats.estimatedCompletion}
            />
          )}
        </div>
      )}

      {/* 칸반 보드 */}
      {showKanban && kanbanColumns.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-3">티켓 현황</h4>
          <KanbanBoard columns={kanbanColumns} stats={null} showStats={false} />
        </div>
      )}

      {/* 마지막 업데이트 */}
      {lastUpdate && (
        <div className="text-xs text-muted-foreground text-right border-t border-border/50 pt-2">
          마지막 업데이트: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

/**
 * 워크플로우 상태 인디케이터
 */
function WorkflowStateIndicator({
  state,
  size = 'md',
}: {
  state: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const stateColors: Record<string, string> = {
    idle: 'bg-slate-400',
    executing: 'bg-blue-500 animate-pulse',
    awaiting_review: 'bg-yellow-500 animate-pulse',
    reviewed: 'bg-purple-500',
    completed: 'bg-green-500',
  };

  const stateLabels: Record<string, string> = {
    idle: '대기 중',
    executing: '실행 중',
    awaiting_review: '리뷰 대기',
    reviewed: '리뷰 완료',
    completed: '완료',
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn('rounded-full', sizeClasses[size], stateColors[state] || 'bg-gray-400')}
      />
      {size === 'lg' && (
        <span className="text-sm text-muted-foreground">
          {stateLabels[state] || state}
        </span>
      )}
    </div>
  );
}

/**
 * 통계 카드 컴포넌트
 */
function StatCard({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50',
        className
      )}
    >
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <div className="text-lg font-semibold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

/**
 * 토큰 사용량 표시 컴포넌트
 */
export function TokenUsageIndicator({
  count,
  limit = 2000,
  className,
}: {
  count: number;
  limit?: number;
  className?: string;
}) {
  const status = getTokenStatus(count, limit);
  const colors = getTokenStatusColor(status);
  const percentage = Math.min(100, Math.round((count / limit) * 100));

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all', colors.border.replace('border-', 'bg-'))}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={cn('text-xs font-mono', colors.text)}>
        {count}/{limit}
      </span>
    </div>
  );
}

export default WorkflowProgress;
