/**
 * SDD Pattern: Real-time Status Tracking UI
 * 칸반 보드 컴포넌트 (Spec Kitty/lean-spec 스타일)
 *
 * 티켓 진행 상태를 칸반 형태로 시각화합니다.
 */

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  KanbanColumn,
  TicketProgress,
  TicketStatus,
  ProgressStats,
} from '@/types/executionProgress';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  Loader2,
  Search,
  User,
  FileCode,
} from '@/lib/icons';

// 상태별 아이콘 매핑
const STATUS_ICONS: Record<TicketStatus, React.ReactNode> = {
  planned: <Circle className="w-4 h-4 text-slate-400" />,
  doing: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
  review: <Search className="w-4 h-4 text-yellow-500" />,
  done: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  blocked: <AlertCircle className="w-4 h-4 text-red-500" />,
};

// 상태별 배경색
const STATUS_BG: Record<TicketStatus, string> = {
  planned: 'bg-slate-100 dark:bg-slate-800/50',
  doing: 'bg-blue-100 dark:bg-blue-900/30',
  review: 'bg-yellow-100 dark:bg-yellow-900/30',
  done: 'bg-green-100 dark:bg-green-900/30',
  blocked: 'bg-red-100 dark:bg-red-900/30',
};

// 상태별 헤더 색상
const STATUS_HEADER: Record<TicketStatus, string> = {
  planned: 'border-slate-400 bg-slate-200 dark:bg-slate-700',
  doing: 'border-blue-500 bg-blue-200 dark:bg-blue-800',
  review: 'border-yellow-500 bg-yellow-200 dark:bg-yellow-800',
  done: 'border-green-500 bg-green-200 dark:bg-green-800',
  blocked: 'border-red-500 bg-red-200 dark:bg-red-800',
};

interface TicketCardProps {
  ticket: TicketProgress;
  compact?: boolean;
}

/**
 * 개별 티켓 카드 컴포넌트
 */
function TicketCard({ ticket, compact = false }: TicketCardProps) {
  const statusIcon = STATUS_ICONS[ticket.status];
  const bgClass = STATUS_BG[ticket.status];

  // 경과 시간 계산
  const elapsedTime = useMemo(() => {
    if (!ticket.start_time) return null;
    const start = new Date(ticket.start_time);
    const end = ticket.end_time ? new Date(ticket.end_time) : new Date();
    const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
    return minutes;
  }, [ticket.start_time, ticket.end_time]);

  return (
    <div
      className={cn(
        'rounded-lg border border-border/50 p-3 transition-all hover:shadow-md',
        bgClass,
        compact ? 'p-2' : 'p-3'
      )}
    >
      {/* 헤더: ID + 상태 아이콘 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono font-semibold text-muted-foreground">
          {ticket.ticket_id}
        </span>
        {statusIcon}
      </div>

      {/* 제목 */}
      <h4
        className={cn(
          'font-medium text-foreground leading-tight',
          compact ? 'text-xs' : 'text-sm'
        )}
      >
        {ticket.title}
      </h4>

      {/* 메타 정보 */}
      {!compact && (
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {/* 담당 에이전트 */}
          {ticket.assigned_agent && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span className="truncate max-w-[100px]">{ticket.assigned_agent}</span>
            </div>
          )}

          {/* 경과 시간 */}
          {elapsedTime !== null && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{elapsedTime}분</span>
            </div>
          )}

          {/* 출력 파일 수 */}
          {ticket.output_files && ticket.output_files.length > 0 && (
            <div className="flex items-center gap-1">
              <FileCode className="w-3 h-3" />
              <span>{ticket.output_files.length}개 파일</span>
            </div>
          )}
        </div>
      )}

      {/* 차단 사유 (blocked 상태일 때) */}
      {ticket.status === 'blocked' && ticket.failure_reason && (
        <div className="mt-2 p-2 rounded bg-red-200/50 dark:bg-red-900/30 text-xs text-red-700 dark:text-red-300">
          {ticket.failure_reason}
        </div>
      )}

      {/* 테스트 결과 (done 상태일 때) */}
      {ticket.status === 'done' && ticket.test_count !== undefined && (
        <div
          className={cn(
            'mt-2 text-xs',
            ticket.test_passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          )}
        >
          테스트 {ticket.test_count}개 {ticket.test_passed ? '통과' : '실패'}
        </div>
      )}
    </div>
  );
}

interface KanbanColumnProps {
  column: KanbanColumn;
  compact?: boolean;
}

/**
 * 칸반 컬럼 컴포넌트
 */
function KanbanColumnComponent({ column, compact = false }: KanbanColumnProps) {
  const headerClass = STATUS_HEADER[column.id];

  return (
    <div className="flex flex-col min-w-[200px] max-w-[280px] flex-1">
      {/* 컬럼 헤더 */}
      <div
        className={cn(
          'rounded-t-lg px-3 py-2 border-b-2 flex items-center justify-between',
          headerClass
        )}
      >
        <div className="flex items-center gap-2">
          {STATUS_ICONS[column.id]}
          <span className="font-medium text-sm">{column.title}</span>
        </div>
        <span className="text-xs font-semibold bg-white/50 dark:bg-black/30 px-2 py-0.5 rounded-full">
          {column.tickets.length}
        </span>
      </div>

      {/* 티켓 목록 */}
      <div
        className={cn(
          'flex-1 p-2 space-y-2 bg-muted/30 rounded-b-lg overflow-y-auto',
          compact ? 'max-h-[300px]' : 'max-h-[500px]'
        )}
      >
        {column.tickets.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-4">
            티켓 없음
          </div>
        ) : (
          column.tickets.map((ticket) => (
            <TicketCard key={ticket.ticket_id} ticket={ticket} compact={compact} />
          ))
        )}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  stats?: ProgressStats | null;
  compact?: boolean;
  showStats?: boolean;
  className?: string;
}

/**
 * 칸반 보드 메인 컴포넌트
 */
export function KanbanBoard({
  columns,
  stats,
  compact = false,
  showStats = true,
  className,
}: KanbanBoardProps) {
  // 전체 티켓 수 계산
  const totalTickets = columns.reduce((sum, col) => sum + col.tickets.length, 0);
  const completedTickets = columns.find((c) => c.id === 'done')?.tickets.length || 0;
  const progressPercent = totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 0;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* 통계 바 */}
      {showStats && stats && (
        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border border-border/50">
          {/* 진행률 바 */}
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">진행률</span>
              <span className="font-semibold">{progressPercent}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* 통계 수치들 */}
          <div className="flex gap-4 text-xs">
            <div className="text-center">
              <div className="font-semibold text-foreground">{stats.ticketsPerHour}</div>
              <div className="text-muted-foreground">티켓/시간</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-foreground">{stats.parallelismRatio}x</div>
              <div className="text-muted-foreground">병렬성</div>
            </div>
            {stats.estimatedCompletion && (
              <div className="text-center">
                <div className="font-semibold text-foreground">{stats.estimatedCompletion}</div>
                <div className="text-muted-foreground">예상 완료</div>
              </div>
            )}
            {stats.blockedTicketCount > 0 && (
              <div className="text-center">
                <div className="font-semibold text-red-500">{stats.blockedTicketCount}</div>
                <div className="text-muted-foreground">차단됨</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 칸반 컬럼들 */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {columns.map((column) => (
          <KanbanColumnComponent key={column.id} column={column} compact={compact} />
        ))}
      </div>

      {/* 빈 상태 */}
      {totalTickets === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Circle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>진행 중인 티켓이 없습니다</p>
          <p className="text-xs mt-1">PM Executor를 실행하면 여기에 티켓이 표시됩니다</p>
        </div>
      )}
    </div>
  );
}

/**
 * 미니 칸반 (요약용)
 */
export function MiniKanban({ columns, className }: { columns: KanbanColumn[]; className?: string }) {
  return (
    <div className={cn('flex gap-1', className)}>
      {columns.map((column) => (
        <div
          key={column.id}
          className={cn(
            'flex-1 rounded px-2 py-1 text-center text-xs',
            STATUS_BG[column.id]
          )}
          title={`${column.title}: ${column.tickets.length}개`}
        >
          <div className="font-semibold">{column.tickets.length}</div>
          <div className="text-[10px] text-muted-foreground truncate">{column.title}</div>
        </div>
      ))}
    </div>
  );
}

export default KanbanBoard;
