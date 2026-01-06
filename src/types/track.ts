/**
 * Track types for development workflow selection
 * MVP, ownuun, BMAD 3가지 트랙 지원
 */

import type { WorkflowStep } from '@/constants/planning';
import type { DevWorkflowStep } from '@/constants/development';

export type TrackId = 'mvp' | 'ownuun' | 'ownuun2' | 'bmad' | 'quick-flow' | 'plan-only' | 'wireframe';

export interface Track {
  id: TrackId;
  name: string;
  description: string;
  icon: string;
  available: boolean;
}

export interface PostWorkflowHook {
  type: 'playwright-capture' | 'custom';
  executeAfter: string; // workflow id
  config: Record<string, unknown>;
}

export interface TrackPlanningConfig {
  trackId: TrackId;
  workflows: WorkflowStep[];
  /** Additional steps like playwright capture */
  postWorkflowHooks?: PostWorkflowHook[];
}

export interface TrackDevelopmentConfig {
  trackId: TrackId;
  workflows: DevWorkflowStep[];
  /** SubWave execution strategy */
  executionStrategy: 'subwave' | 'story' | 'ticket';
  /** Auto-test after SubWave completion */
  autoTestOnSubWaveComplete: boolean;
  /** Strict UX/UI validation with captured images */
  strictUxValidation: boolean;
}

export const TRACKS: Track[] = [
  {
    id: 'mvp',
    name: 'MVP',
    description: '기존 MVP 개발 워크플로우',
    icon: '🚀',
    available: false,
  },
  {
    id: 'ownuun',
    name: 'ownuun',
    description: '엄격한 UX/UI 검증 + 서브에이전트 극대화',
    icon: '🎯',
    available: false,
  },
  {
    id: 'ownuun2',
    name: 'ownuun2',
    description: '티켓별 플랜→실행 + 서브에이전트 병렬 실행',
    icon: '⚡',
    available: false,
  },
  {
    id: 'quick-flow',
    name: 'Quick Flow',
    description: '빠른 개발 워크플로우 (간소화된 3단계)',
    icon: '⚡',
    available: true,
  },
  {
    id: 'bmad',
    name: 'BMAD',
    description: 'BMAD 방법론 기반 개발',
    icon: '📋',
    available: true,
  },
  {
    id: 'plan-only',
    name: 'Plan Only',
    description: '기획 문서 + 티켓 생성 (개발 없음)',
    icon: '📋',
    available: true,
  },
  {
    id: 'wireframe',
    name: 'Wireframe',
    description: '빠른 목업/와이어프레임 생성 (PRD → UX)',
    icon: '🎨',
    available: true,
  },
];

/**
 * Get track by ID
 */
export const getTrackById = (id: TrackId): Track | undefined => {
  return TRACKS.find((t) => t.id === id);
};

/**
 * Get available tracks only
 */
export const getAvailableTracks = (): Track[] => {
  return TRACKS.filter((t) => t.available);
};
