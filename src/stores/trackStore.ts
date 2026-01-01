/**
 * Track Store - 트랙 선택 상태 관리
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TrackId } from '@/types/track';

interface TrackState {
  /**
   * 프로젝트별 선택된 트랙
   * key: projectPath, value: trackId
   */
  projectTracks: Record<string, TrackId>;

  /**
   * 프로젝트의 트랙 설정
   */
  setProjectTrack: (projectPath: string, trackId: TrackId) => void;

  /**
   * 프로젝트의 트랙 조회 (기본값: 'mvp')
   */
  getProjectTrack: (projectPath: string) => TrackId;

  /**
   * 프로젝트 트랙 초기화
   */
  clearProjectTrack: (projectPath: string) => void;
}

export const useTrackStore = create<TrackState>()(
  persist(
    (set, get) => ({
      projectTracks: {},

      setProjectTrack: (projectPath, trackId) =>
        set((state) => ({
          projectTracks: {
            ...state.projectTracks,
            [projectPath]: trackId,
          },
        })),

      getProjectTrack: (projectPath) => {
        const state = get();
        return state.projectTracks[projectPath] ?? 'mvp';
      },

      clearProjectTrack: (projectPath) =>
        set((state) => {
          const { [projectPath]: _, ...rest } = state.projectTracks;
          return { projectTracks: rest };
        }),
    }),
    {
      name: 'anyon-track-storage',
      partialize: (state) => ({ projectTracks: state.projectTracks }),
    }
  )
);

/**
 * Hook: 현재 프로젝트의 트랙 가져오기
 */
export const useCurrentTrack = (projectPath: string | undefined): TrackId => {
  const getProjectTrack = useTrackStore((state) => state.getProjectTrack);
  return projectPath ? getProjectTrack(projectPath) : 'mvp';
};
