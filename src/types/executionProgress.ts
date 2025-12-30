/**
 * SDD Pattern: Real-time Status Tracking
 * YAML 기반 execution-progress 타입 정의
 */

export type TicketStatus = 'planned' | 'doing' | 'review' | 'done' | 'blocked';
export type WorkflowState = 'idle' | 'executing' | 'awaiting_review' | 'reviewed' | 'completed';

export interface TicketProgress {
  ticket_id: string;
  title: string;
  status: TicketStatus;
  epic_id?: string;
  wave?: string;
  assigned_agent?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  output_files?: string[];
  test_count?: number;
  test_passed?: boolean;
  failure_reason?: string;
  blocked_by?: string[];
  parallel_group_id?: string;
}

export interface WaveProgress {
  wave_id: string;
  status: 'pending' | 'executing' | 'awaiting_review' | 'reviewed' | 'completed';
  completed_count: number;
  total_count: number;
  blocked_count: number;
  fixed_issues?: number;
  manual_issues?: number;
  review_date?: string;
  review_result?: 'PASS' | 'FAIL' | 'PARTIAL';
}

export interface CurrentStatus {
  current_wave: string;
  current_epic: string;
  last_completed_wave?: string;
  completed_waves: string[];
  completed_tickets: number;
  total_tickets: number;
  workflow_state: WorkflowState;
  overall_progress: string; // e.g., "45%"
  last_update: string;
  parallelism_factor?: number; // 현재 병렬 실행 수
}

export interface ExecutionProgress {
  version: string; // 스키마 버전
  current_status: CurrentStatus;
  wave_progress: Record<string, WaveProgress>;
  tickets: TicketProgress[];
  artifacts?: string[];
  next_session?: {
    next_wave: string;
    next_epic: string;
    first_ticket: string;
    prerequisites_met: boolean;
  };
}

// 칸반 보드용 그룹화된 티켓
export interface KanbanColumn {
  id: TicketStatus;
  title: string;
  tickets: TicketProgress[];
  color: string;
}

// 통계 데이터
export interface ProgressStats {
  ticketsPerHour: number;
  averageTicketTime: number; // minutes
  parallelismRatio: number;
  estimatedCompletion?: string;
  blockedTicketCount: number;
}

// 기본값 생성 헬퍼
export function createEmptyProgress(): ExecutionProgress {
  return {
    version: '1.0.0',
    current_status: {
      current_wave: '',
      current_epic: '',
      completed_waves: [],
      completed_tickets: 0,
      total_tickets: 0,
      workflow_state: 'idle',
      overall_progress: '0%',
      last_update: new Date().toISOString(),
    },
    wave_progress: {},
    tickets: [],
  };
}

// 칸반 컬럼 설정
export const KANBAN_COLUMNS: Omit<KanbanColumn, 'tickets'>[] = [
  { id: 'planned', title: '대기 중', color: 'bg-slate-500' },
  { id: 'doing', title: '진행 중', color: 'bg-blue-500' },
  { id: 'review', title: '리뷰 중', color: 'bg-yellow-500' },
  { id: 'done', title: '완료', color: 'bg-green-500' },
  { id: 'blocked', title: '차단됨', color: 'bg-red-500' },
];

// 티켓을 칸반 컬럼으로 그룹화
export function groupTicketsByStatus(tickets: TicketProgress[]): KanbanColumn[] {
  return KANBAN_COLUMNS.map((column) => ({
    ...column,
    tickets: tickets.filter((t) => t.status === column.id),
  }));
}

// 진행률 통계 계산
export function calculateStats(progress: ExecutionProgress): ProgressStats {
  const { tickets, current_status } = progress;
  const completedTickets = tickets.filter((t) => t.status === 'done');
  const blockedTickets = tickets.filter((t) => t.status === 'blocked');
  const inProgressTickets = tickets.filter((t) => t.status === 'doing');

  // 평균 티켓 완료 시간 계산
  const ticketsWithDuration = completedTickets.filter((t) => t.duration_minutes);
  const averageTicketTime =
    ticketsWithDuration.length > 0
      ? ticketsWithDuration.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) /
        ticketsWithDuration.length
      : 0;

  // 시간당 티켓 수 계산
  const ticketsPerHour = averageTicketTime > 0 ? 60 / averageTicketTime : 0;

  // 병렬성 비율 (현재 동시 실행 중인 티켓 수)
  const parallelismRatio = current_status.parallelism_factor || inProgressTickets.length;

  // 예상 완료 시간 계산
  const remainingTickets = tickets.length - completedTickets.length - blockedTickets.length;
  const estimatedMinutes =
    parallelismRatio > 0 && averageTicketTime > 0
      ? (remainingTickets * averageTicketTime) / parallelismRatio
      : undefined;

  return {
    ticketsPerHour: Math.round(ticketsPerHour * 10) / 10,
    averageTicketTime: Math.round(averageTicketTime),
    parallelismRatio,
    estimatedCompletion: estimatedMinutes
      ? `${Math.round(estimatedMinutes)}분 후`
      : undefined,
    blockedTicketCount: blockedTickets.length,
  };
}
