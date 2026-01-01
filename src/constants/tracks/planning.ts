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
// ============================================================================
export const BMAD_PLANNING_WORKFLOWS: WorkflowStep[] = [
  {
    id: 'product-brief',
    title: 'Product Brief',
    filename: 'product-brief.md',
    workflow: '/bmad:bmm:workflows:create-product-brief',
    displayText: 'Product Brief 작성',
    icon: 'file-text' as WorkflowIconType,
    nextId: 'prd',
  },
  {
    id: 'prd',
    title: 'PRD',
    filename: 'prd.md',
    workflow: '/bmad:bmm:workflows:create-prd',
    displayText: 'PRD 작성 (BMAD)',
    icon: 'file-text' as WorkflowIconType,
    nextId: 'ux-design',
  },
  {
    id: 'ux-design',
    title: 'UX Design',
    filename: 'ux-design.md',
    workflow: '/bmad:bmm:workflows:create-ux-design',
    displayText: 'UX 디자인 작성',
    icon: 'palette' as WorkflowIconType,
    nextId: 'architecture',
  },
  {
    id: 'architecture',
    title: 'Architecture',
    filename: 'architecture.md',
    workflow: '/bmad:bmm:workflows:create-architecture',
    displayText: '아키텍처 설계',
    icon: 'boxes' as WorkflowIconType,
    nextId: 'epics-stories',
  },
  {
    id: 'epics-stories',
    title: 'Epics & Stories',
    filename: 'epics-and-stories.md',
    workflow: '/bmad:bmm:workflows:create-epics-and-stories',
    displayText: 'Epics & Stories 생성',
    icon: 'file-text' as WorkflowIconType,
    nextId: null,
  },
];

export const BMAD_PLANNING_CONFIG: TrackPlanningConfig = {
  trackId: 'bmad',
  workflows: BMAD_PLANNING_WORKFLOWS,
  postWorkflowHooks: [],
};

// ============================================================================
// Registry: 트랙별 설정 조회
// ============================================================================
export const TRACK_PLANNING_CONFIGS: Record<TrackId, TrackPlanningConfig> = {
  mvp: MVP_PLANNING_CONFIG,
  ownuun: OWNUUN_PLANNING_CONFIG,
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
