/**
 * Track-based Planning Workflow Configurations
 * 트랙별 기획 워크플로우 설정
 */

import type { TrackId, TrackPlanningConfig, PostWorkflowHook } from '@/types/track';
import type { WorkflowStep, WorkflowIconType } from '@/constants/planning';
import { WORKFLOW_SEQUENCE as MVP_PLANNING_SEQUENCE } from '@/constants/planning';

// ============================================================================
// MVP Track: 기존 startup-* 워크플로우 그대로 사용
// ============================================================================
export const MVP_PLANNING_CONFIG: TrackPlanningConfig = {
  trackId: 'mvp',
  workflows: MVP_PLANNING_SEQUENCE,
  postWorkflowHooks: [],
};

// ============================================================================
// ownuun Track: MVP와 동일 + playwright 캡쳐 훅
// ============================================================================
const OWNUUN_POST_HOOKS: PostWorkflowHook[] = [
  {
    type: 'playwright-capture',
    executeAfter: 'ux-design', // UX 디자인 단계 후 캡쳐
    config: {
      captureElements: true,
      captureAllPages: true,
      outputDir: 'anyon-docs/planning/captures',
    },
  },
];

export const OWNUUN_PLANNING_CONFIG: TrackPlanningConfig = {
  trackId: 'ownuun',
  workflows: MVP_PLANNING_SEQUENCE, // 기존 워크플로우 그대로 사용
  postWorkflowHooks: OWNUUN_POST_HOOKS,
};

// ============================================================================
// BMAD Track: bmad:bmm:workflows 스킬 사용
// 4단계: Analysis → Plan → Solutioning → Implementation
// ============================================================================
export const BMAD_PLANNING_WORKFLOWS: WorkflowStep[] = [
  // Phase 1: Analysis (분석)
  {
    id: 'product-brief',
    title: 'Product Brief',
    filename: 'product-brief.md',
    workflow: '/bmad:bmm:workflows:create-product-brief',
    displayText: 'Product Brief 작성',
    icon: 'book-open' as WorkflowIconType,
    nextId: 'research',
    phase: 'analysis',
  },
  {
    id: 'research',
    title: 'Research',
    filename: 'research.md',
    workflow: '/bmad:bmm:workflows:research',
    displayText: '리서치 수행',
    icon: 'search' as WorkflowIconType,
    nextId: 'prd',
    phase: 'analysis',
  },
  // Phase 2: Plan (계획)
  {
    id: 'prd',
    title: 'PRD',
    filename: 'prd.md',
    workflow: '/bmad:bmm:workflows:create-prd',
    displayText: 'PRD 작성 (BMAD)',
    icon: 'file-text' as WorkflowIconType,
    nextId: 'ux-design',
    phase: 'plan',
  },
  {
    id: 'ux-design',
    title: 'UX Design',
    filename: 'ux-design.md',
    workflow: '/bmad:bmm:workflows:create-ux-design',
    displayText: 'UX 디자인 작성',
    icon: 'palette' as WorkflowIconType,
    nextId: 'architecture',
    phase: 'plan',
  },
  // Phase 3: Solutioning (설계)
  {
    id: 'architecture',
    title: 'Architecture',
    filename: 'architecture.md',
    workflow: '/bmad:bmm:workflows:create-architecture',
    displayText: '아키텍처 설계',
    icon: 'boxes' as WorkflowIconType,
    nextId: 'epics-stories',
    phase: 'solutioning',
  },
  {
    id: 'epics-stories',
    title: 'Epics & Stories',
    filename: 'epics-and-stories.md',
    workflow: '/bmad:bmm:workflows:create-epics-and-stories',
    displayText: 'Epics & Stories 생성',
    icon: 'list-checks' as WorkflowIconType,
    nextId: 'readiness-check',
    phase: 'solutioning',
  },
  {
    id: 'readiness-check',
    title: 'Readiness Check',
    filename: 'readiness-check.md',
    workflow: '/bmad:bmm:workflows:check-implementation-readiness',
    displayText: '구현 준비 상태 확인',
    icon: 'check-circle' as WorkflowIconType,
    nextId: null,
    phase: 'solutioning',
  },
];

export const BMAD_PLANNING_CONFIG: TrackPlanningConfig = {
  trackId: 'bmad',
  workflows: BMAD_PLANNING_WORKFLOWS,
  postWorkflowHooks: [],
};

// ============================================================================
// ownuun2 Track: ownuun과 동일 (티켓별 플랜→실행 전략은 개발 단계에서 적용)
// ============================================================================
export const OWNUUN2_PLANNING_CONFIG: TrackPlanningConfig = {
  trackId: 'ownuun2',
  workflows: MVP_PLANNING_SEQUENCE, // 기획 워크플로우는 ownuun과 동일
  postWorkflowHooks: OWNUUN_POST_HOOKS,
};

// ============================================================================
// Registry: 트랙별 설정 조회
// ============================================================================
export const TRACK_PLANNING_CONFIGS: Record<TrackId, TrackPlanningConfig> = {
  mvp: MVP_PLANNING_CONFIG,
  ownuun: OWNUUN_PLANNING_CONFIG,
  ownuun2: OWNUUN2_PLANNING_CONFIG,
  bmad: BMAD_PLANNING_CONFIG,
};

/**
 * Get planning config by track ID
 */
export const getPlanningConfig = (trackId: TrackId): TrackPlanningConfig => {
  return TRACK_PLANNING_CONFIGS[trackId];
};

/**
 * Get planning workflows by track ID
 */
export const getPlanningWorkflows = (trackId: TrackId): WorkflowStep[] => {
  return TRACK_PLANNING_CONFIGS[trackId].workflows;
};
