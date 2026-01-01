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
