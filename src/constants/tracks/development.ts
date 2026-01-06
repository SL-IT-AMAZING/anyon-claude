/**
 * Track-based Development Workflow Configurations
 * 트랙별 개발 워크플로우 설정
 */

import type { TrackId, TrackDevelopmentConfig } from '@/types/track';
import type { DevWorkflowStep, DevWorkflowIconType } from '@/constants/development';
import { DEV_WORKFLOW_SEQUENCE as MVP_DEV_SEQUENCE } from '@/constants/development';
import {
  OWNUUN_ORCHESTRATOR_PROMPT,
  OWNUUN_EXECUTOR_PROMPT,
  OWNUUN_REVIEWER_PROMPT,
} from '@/constants/workflows/ownuun';
import {
  OWNUUN2_ORCHESTRATOR_PROMPT,
  OWNUUN2_EXECUTOR_PROMPT,
  OWNUUN2_REVIEWER_PROMPT,
} from '@/constants/workflows/ownuun2';
import {
  QUICK_EXECUTE_PROMPT,
  QUICK_REVIEW_PROMPT,
} from '@/constants/workflows/quick-flow';

// ============================================================================
// MVP Track: 기존 pm-* 워크플로우 그대로 사용
// ============================================================================
export const MVP_DEV_CONFIG: TrackDevelopmentConfig = {
  trackId: 'mvp',
  workflows: MVP_DEV_SEQUENCE,
  executionStrategy: 'subwave',
  autoTestOnSubWaveComplete: false,
  strictUxValidation: false,
};

// ============================================================================
// ownuun Track: 개선된 개발 워크플로우
// - 서브에이전트 활용 극대화 (티켓 세분화)
// - 서브웨이브 완료 시 개발서버 테스트 + 오류 즉시 수정
// - 캡쳐 이미지 기반 엄격한 UX/UI 검증
// ============================================================================
export const OWNUUN_DEV_WORKFLOWS: DevWorkflowStep[] = [
  {
    id: 'ownuun-orchestrator',
    title: 'Ownuun Orchestrator',
    workflow: '', // prompt 사용
    prompt: OWNUUN_ORCHESTRATOR_PROMPT,
    displayText: 'Ownuun Orchestrator - 세분화된 실행 계획',
    icon: 'layout-list' as DevWorkflowIconType,
  },
  {
    id: 'ownuun-executor',
    title: 'Ownuun Executor',
    workflow: '',
    prompt: OWNUUN_EXECUTOR_PROMPT,
    displayText: 'Ownuun Executor - 티켓 실행 + 테스트',
    icon: 'rocket' as DevWorkflowIconType,
  },
  {
    id: 'ownuun-reviewer',
    title: 'Ownuun Reviewer',
    workflow: '',
    prompt: OWNUUN_REVIEWER_PROMPT,
    displayText: 'Ownuun Reviewer - 엄격한 UX/UI 검증',
    icon: 'check-circle' as DevWorkflowIconType,
  },
];

export const OWNUUN_DEV_CONFIG: TrackDevelopmentConfig = {
  trackId: 'ownuun',
  workflows: OWNUUN_DEV_WORKFLOWS,
  executionStrategy: 'subwave',
  autoTestOnSubWaveComplete: true,
  strictUxValidation: true,
};

// ============================================================================
// BMAD Track: bmad:bmm:workflows 스킬 사용
// Implementation Phase: Sprint Planning → Story Development → Review → Retrospective
// ============================================================================
export const BMAD_DEV_WORKFLOWS: DevWorkflowStep[] = [
  // Planning
  {
    id: 'sprint-planning',
    title: 'Sprint Planning',
    workflow: '/bmad:bmm:workflows:sprint-planning',
    displayText: 'Sprint 계획 생성',
    icon: 'layout-list' as DevWorkflowIconType,
    category: 'planning',
  },
  {
    id: 'sprint-status',
    title: 'Sprint Status',
    workflow: '/bmad:bmm:workflows:sprint-status',
    displayText: 'Sprint 상태 확인',
    icon: 'activity' as DevWorkflowIconType,
    category: 'planning',
  },
  // Execution
  {
    id: 'create-story',
    title: 'Create Story',
    workflow: '/bmad:bmm:workflows:create-story',
    displayText: '다음 Story 생성',
    icon: 'git-branch' as DevWorkflowIconType,
    category: 'execution',
  },
  {
    id: 'dev-story',
    title: 'Dev Story',
    workflow: '/bmad:bmm:workflows:dev-story',
    displayText: 'Story 개발',
    icon: 'rocket' as DevWorkflowIconType,
    category: 'execution',
  },
  // Review
  {
    id: 'code-review',
    title: 'Code Review',
    workflow: '/bmad:bmm:workflows:code-review',
    displayText: '코드 리뷰 (ADVERSARIAL)',
    icon: 'check-circle' as DevWorkflowIconType,
    category: 'review',
  },
  // Management
  {
    id: 'correct-course',
    title: 'Correct Course',
    workflow: '/bmad:bmm:workflows:correct-course',
    displayText: '코스 수정',
    icon: 'refresh-cw' as DevWorkflowIconType,
    category: 'management',
  },
  {
    id: 'retrospective',
    title: 'Retrospective',
    workflow: '/bmad:bmm:workflows:retrospective',
    displayText: 'Epic 회고',
    icon: 'message-square' as DevWorkflowIconType,
    category: 'management',
  },
];

export const BMAD_DEV_CONFIG: TrackDevelopmentConfig = {
  trackId: 'bmad',
  workflows: BMAD_DEV_WORKFLOWS,
  executionStrategy: 'story',
  autoTestOnSubWaveComplete: false,
  strictUxValidation: false,
};

// ============================================================================
// ownuun2 Track: 티켓별 플랜→실행 + 서브에이전트 병렬 실행
// ============================================================================
export const OWNUUN2_DEV_WORKFLOWS: DevWorkflowStep[] = [
  {
    id: 'ownuun2-orchestrator',
    title: 'Ownuun2 Orchestrator',
    workflow: '',
    prompt: OWNUUN2_ORCHESTRATOR_PROMPT,
    displayText: 'Ownuun2 Orchestrator - 의존성 기반 병렬 그룹 구성',
    icon: 'layout-list' as DevWorkflowIconType,
  },
  {
    id: 'ownuun2-executor',
    title: 'Ownuun2 Executor',
    workflow: '',
    prompt: OWNUUN2_EXECUTOR_PROMPT,
    displayText: 'Ownuun2 Executor - 티켓별 플랜→실행',
    icon: 'rocket' as DevWorkflowIconType,
  },
  {
    id: 'ownuun2-reviewer',
    title: 'Ownuun2 Reviewer',
    workflow: '',
    prompt: OWNUUN2_REVIEWER_PROMPT,
    displayText: 'Ownuun2 Reviewer - 엄격한 UX/UI 검증',
    icon: 'check-circle' as DevWorkflowIconType,
  },
];

export const OWNUUN2_DEV_CONFIG: TrackDevelopmentConfig = {
  trackId: 'ownuun2',
  workflows: OWNUUN2_DEV_WORKFLOWS,
  executionStrategy: 'ticket', // 티켓별 실행 (subwave가 아닌 ticket 단위)
  autoTestOnSubWaveComplete: true,
  strictUxValidation: true,
};

// ============================================================================
// Quick Flow Track: 빠른 개발 워크플로우 (2단계)
// Execute → Review (MVP 스타일 + 자동 테스트)
// Quick Plan은 기획 단계에 있음
// ============================================================================
export const QUICK_FLOW_DEV_WORKFLOWS: DevWorkflowStep[] = [
  {
    id: 'quick-execute',
    title: 'Quick Execute',
    workflow: '',
    prompt: QUICK_EXECUTE_PROMPT,
    displayText: 'Quick Execute - 즉시 구현',
    icon: 'rocket' as DevWorkflowIconType,
  },
  {
    id: 'quick-review',
    title: 'Quick Review',
    workflow: '',
    prompt: QUICK_REVIEW_PROMPT,
    displayText: 'Quick Review - 빠른 검증',
    icon: 'check-circle' as DevWorkflowIconType,
  },
];

export const QUICK_FLOW_DEV_CONFIG: TrackDevelopmentConfig = {
  trackId: 'quick-flow',
  workflows: QUICK_FLOW_DEV_WORKFLOWS,
  executionStrategy: 'subwave', // MVP 스타일
  autoTestOnSubWaveComplete: true, // 자동 테스트 활성화
  strictUxValidation: false, // 빠른 개발이므로 비활성화
};

// ============================================================================
// Plan-Only Track: 개발 워크플로우 없음
// 기획 문서 + 티켓 생성만 하고 개발은 하지 않음
// ============================================================================
export const PLAN_ONLY_DEV_CONFIG: TrackDevelopmentConfig = {
  trackId: 'plan-only',
  workflows: [], // 개발 워크플로우 없음
  executionStrategy: 'ticket',
  autoTestOnSubWaveComplete: false,
  strictUxValidation: false,
};

// ============================================================================
// Wireframe Track: 개발 워크플로우 없음
// 와이어프레임만 생성하고 개발은 하지 않음
// ============================================================================
export const WIREFRAME_DEV_CONFIG: TrackDevelopmentConfig = {
  trackId: 'wireframe',
  workflows: [],
  executionStrategy: 'ticket',
  autoTestOnSubWaveComplete: false,
  strictUxValidation: false,
};

// ============================================================================
// Registry: 트랙별 설정 조회
// ============================================================================
export const TRACK_DEV_CONFIGS: Record<TrackId, TrackDevelopmentConfig> = {
  mvp: MVP_DEV_CONFIG,
  ownuun: OWNUUN_DEV_CONFIG,
  ownuun2: OWNUUN2_DEV_CONFIG,
  bmad: BMAD_DEV_CONFIG,
  'quick-flow': QUICK_FLOW_DEV_CONFIG,
  'plan-only': PLAN_ONLY_DEV_CONFIG,
  wireframe: WIREFRAME_DEV_CONFIG,
};

/**
 * Get development config by track ID
 */
export const getDevConfig = (trackId: TrackId): TrackDevelopmentConfig => {
  return TRACK_DEV_CONFIGS[trackId];
};

/**
 * Get development workflows by track ID
 */
export const getDevWorkflows = (trackId: TrackId): DevWorkflowStep[] => {
  return TRACK_DEV_CONFIGS[trackId].workflows;
};

/**
 * Check if track uses strict UX validation
 */
export const isStrictUxValidation = (trackId: TrackId): boolean => {
  return TRACK_DEV_CONFIGS[trackId].strictUxValidation;
};

/**
 * Check if track auto-tests on SubWave completion
 */
export const isAutoTestOnSubWave = (trackId: TrackId): boolean => {
  return TRACK_DEV_CONFIGS[trackId].autoTestOnSubWaveComplete;
};
