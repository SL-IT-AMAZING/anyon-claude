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
// ============================================================================
export const BMAD_DEV_WORKFLOWS: DevWorkflowStep[] = [
  {
    id: 'sprint-planning',
    title: 'Sprint Planning',
    workflow: '/bmad:bmm:workflows:sprint-planning',
    displayText: 'Sprint 계획 생성',
    icon: 'layout-list' as DevWorkflowIconType,
  },
  {
    id: 'dev-story',
    title: 'Dev Story',
    workflow: '/bmad:bmm:workflows:dev-story',
    displayText: 'Story 개발',
    icon: 'rocket' as DevWorkflowIconType,
  },
  {
    id: 'code-review',
    title: 'Code Review',
    workflow: '/bmad:bmm:workflows:code-review',
    displayText: '코드 리뷰',
    icon: 'check-circle' as DevWorkflowIconType,
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
// Registry: 트랙별 설정 조회
// ============================================================================
export const TRACK_DEV_CONFIGS: Record<TrackId, TrackDevelopmentConfig> = {
  mvp: MVP_DEV_CONFIG,
  ownuun: OWNUUN_DEV_CONFIG,
  bmad: BMAD_DEV_CONFIG,
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
