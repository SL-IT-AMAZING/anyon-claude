/**
 * Track configurations index
 * 트랙별 설정 통합 export
 */

// Track type exports
export type { TrackId, Track, TrackPlanningConfig, TrackDevelopmentConfig, PostWorkflowHook } from '@/types/track';
export { TRACKS, getTrackById, getAvailableTracks } from '@/types/track';

// Planning config exports
export {
  MVP_PLANNING_CONFIG,
  OWNUUN_PLANNING_CONFIG,
  BMAD_PLANNING_CONFIG,
  BMAD_PLANNING_WORKFLOWS,
  TRACK_PLANNING_CONFIGS,
  getPlanningConfig,
  getPlanningWorkflows,
} from './planning';

// Development config exports
export {
  MVP_DEV_CONFIG,
  OWNUUN_DEV_CONFIG,
  BMAD_DEV_CONFIG,
  OWNUUN_DEV_WORKFLOWS,
  BMAD_DEV_WORKFLOWS,
  TRACK_DEV_CONFIGS,
  getDevConfig,
  getDevWorkflows,
  isStrictUxValidation,
  isAutoTestOnSubWave,
} from './development';

// ============================================================================
// 트랙별 UI 설정
// ============================================================================
import type { TrackId } from '@/types/track';

/** 트랙별 표시할 탭 설정 */
export const TRACK_VISIBLE_TABS: Record<TrackId, ('planning' | 'development' | 'preview')[]> = {
  mvp: ['planning', 'development', 'preview'],
  ownuun: ['planning', 'development', 'preview'],
  ownuun2: ['planning', 'development', 'preview'],
  bmad: ['planning', 'development', 'preview'],
  'quick-flow': ['planning', 'development', 'preview'],
  'plan-only': ['planning'], // 기획문서 탭만
  wireframe: ['planning'], // 기획문서 탭만 (PRD → UX)
};

/** 트랙별 표시할 탭 가져오기 */
export const getVisibleTabs = (trackId: TrackId): ('planning' | 'development' | 'preview')[] => {
  return TRACK_VISIBLE_TABS[trackId] || ['planning', 'development', 'preview'];
};
