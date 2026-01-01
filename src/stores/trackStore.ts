/**
 * Track Store - 트랙 선택 상태 관리
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TrackId } from '@/types/track';
import { bmadApi } from '@/lib/api';

interface TrackState {
  /**
   * 프로젝트별 선택된 트랙
   * key: projectPath, value: trackId
   */
  projectTracks: Record<string, TrackId>;

  /**
   * 프로젝트의 트랙 설정
   * BMAD 트랙 선택 시 _bmad 폴더 자동 복사
   */
  setProjectTrack: (projectPath: string, trackId: TrackId) => Promise<void>;

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

      setProjectTrack: async (projectPath, trackId) => {
        // BMAD 트랙 선택 시 _bmad 폴더 자동 복사
        if (trackId === 'bmad') {
          try {
            const exists = await bmadApi.checkBmadFolder(projectPath);
            if (!exists) {
              await bmadApi.copyBmadFolder(projectPath);
              console.log('[TrackStore] _bmad folder copied to:', projectPath);
            }
          } catch (error) {
            console.error('[TrackStore] Failed to copy _bmad folder:', error);
          }
        }

        set((state) => ({
          projectTracks: {
            ...state.projectTracks,
            [projectPath]: trackId,
          },
        }));
      },

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
