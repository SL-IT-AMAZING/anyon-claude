/**
 * SDD Pattern: Real-time Status Tracking
 * 실시간 execution-progress 파일 감시 및 상태 관리 훅
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { readTextFile, exists } from '@tauri-apps/plugin-fs';
import { watch } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import yaml from 'js-yaml';
import {
  ExecutionProgress,
  ProgressStats,
  KanbanColumn,
  createEmptyProgress,
  groupTicketsByStatus,
  calculateStats,
} from '@/types/executionProgress';

// 파일 경로 상수
const PROGRESS_FILE_NAME = 'execution-progress.yaml';
const PROGRESS_DIR = 'anyon-docs/dev-plan';

// 폴백: 기존 MD 파일 지원 (마이그레이션 기간)
const LEGACY_PROGRESS_FILE = 'execution-progress.md';

interface UseExecutionProgressReturn {
  progress: ExecutionProgress | null;
  kanbanColumns: KanbanColumn[];
  stats: ProgressStats | null;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refresh: () => Promise<void>;
}

/**
 * YAML 파일에서 ExecutionProgress 파싱
 */
async function parseYamlProgress(content: string): Promise<ExecutionProgress> {
  try {
    const parsed = yaml.load(content) as ExecutionProgress;
    return parsed;
  } catch (e) {
    console.error('YAML 파싱 실패:', e);
    throw new Error('YAML 파싱 실패');
  }
}

/**
 * 기존 MD 파일에서 ExecutionProgress 파싱 (폴백)
 * YAML 프론트매터 또는 코드블록 내 YAML 지원
 */
async function parseLegacyMdProgress(content: string): Promise<ExecutionProgress> {
  // YAML 코드블록 추출 시도
  const yamlMatch = content.match(/```ya?ml\n([\s\S]*?)\n```/);
  if (yamlMatch) {
    return parseYamlProgress(yamlMatch[1]);
  }

  // YAML 프론트매터 추출 시도
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    return parseYamlProgress(frontmatterMatch[1]);
  }

  // 기본 파싱 (정규식으로 주요 정보 추출)
  const progress = createEmptyProgress();

  // current_wave 추출
  const waveMatch = content.match(/current_wave:\s*["']?([^"'\n]+)["']?/);
  if (waveMatch) {
    progress.current_status.current_wave = waveMatch[1];
  }

  // workflow_state 추출
  const stateMatch = content.match(/workflow_state:\s*["']?([^"'\n]+)["']?/);
  if (stateMatch) {
    progress.current_status.workflow_state = stateMatch[1] as ExecutionProgress['current_status']['workflow_state'];
  }

  // overall_progress 추출
  const progressMatch = content.match(/overall_progress:\s*["']?([^"'\n]+)["']?/);
  if (progressMatch) {
    progress.current_status.overall_progress = progressMatch[1];
  }

  return progress;
}

/**
 * 실시간 execution-progress 파일 감시 및 상태 관리 훅
 *
 * @param projectPath 프로젝트 루트 경로
 * @returns 진행 상태, 칸반 컬럼, 통계, 로딩/에러 상태
 */
export function useExecutionProgress(projectPath: string | undefined): UseExecutionProgressReturn {
  const [progress, setProgress] = useState<ExecutionProgress | null>(null);
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>([]);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const unwatchRef = useRef<(() => void) | null>(null);

  /**
   * 파일 읽기 및 파싱
   */
  const loadProgress = useCallback(async () => {
    if (!projectPath) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // YAML 파일 경로
      const yamlPath = await join(projectPath, PROGRESS_DIR, PROGRESS_FILE_NAME);
      const yamlExists = await exists(yamlPath);

      let progressData: ExecutionProgress;

      if (yamlExists) {
        // 새 YAML 형식 파일 읽기
        const content = await readTextFile(yamlPath);
        progressData = await parseYamlProgress(content);
      } else {
        // 폴백: 기존 MD 파일 시도
        const mdPath = await join(projectPath, PROGRESS_DIR, LEGACY_PROGRESS_FILE);
        const mdExists = await exists(mdPath);

        if (mdExists) {
          const content = await readTextFile(mdPath);
          progressData = await parseLegacyMdProgress(content);
        } else {
          // 파일 없음 - 빈 상태 반환
          progressData = createEmptyProgress();
        }
      }

      setProgress(progressData);
      setKanbanColumns(groupTicketsByStatus(progressData.tickets));
      setStats(calculateStats(progressData));
      setLastUpdate(new Date());
    } catch (e) {
      console.error('Progress 파일 로드 실패:', e);
      setError(e instanceof Error ? e.message : '파일 로드 실패');
      setProgress(null);
    } finally {
      setIsLoading(false);
    }
  }, [projectPath]);

  /**
   * 파일 감시 설정
   */
  useEffect(() => {
    if (!projectPath) return;

    let isMounted = true;

    const setupWatcher = async () => {
      try {
        const watchPath = await join(projectPath, PROGRESS_DIR);

        // 기존 watcher 정리
        if (unwatchRef.current) {
          unwatchRef.current();
        }

        // 새 watcher 설정
        const unwatch = await watch(
          watchPath,
          (event) => {
            if (!isMounted) return;

            // 파일 변경 이벤트 필터링
            const isProgressFile =
              event.paths.some(
                (p) => p.endsWith(PROGRESS_FILE_NAME) || p.endsWith(LEGACY_PROGRESS_FILE)
              );

            if (isProgressFile) {
              // debounce: 100ms 후 리로드
              setTimeout(() => {
                if (isMounted) {
                  loadProgress();
                }
              }, 100);
            }
          },
          { recursive: false }
        );

        unwatchRef.current = unwatch;
      } catch (e) {
        console.error('파일 감시 설정 실패:', e);
      }
    };

    // 초기 로드
    loadProgress();

    // watcher 설정
    setupWatcher();

    return () => {
      isMounted = false;
      if (unwatchRef.current) {
        unwatchRef.current();
        unwatchRef.current = null;
      }
    };
  }, [projectPath, loadProgress]);

  /**
   * 수동 새로고침
   */
  const refresh = useCallback(async () => {
    await loadProgress();
  }, [loadProgress]);

  return {
    progress,
    kanbanColumns,
    stats,
    isLoading,
    error,
    lastUpdate,
    refresh,
  };
}

/**
 * 간단한 진행률 표시용 훅 (칸반 없이)
 */
export function useSimpleProgress(projectPath: string | undefined): {
  currentWave: string | null;
  overallProgress: string | null;
  workflowState: string | null;
  isLoading: boolean;
} {
  const { progress, isLoading } = useExecutionProgress(projectPath);

  return {
    currentWave: progress?.current_status.current_wave || null,
    overallProgress: progress?.current_status.overall_progress || null,
    workflowState: progress?.current_status.workflow_state || null,
    isLoading,
  };
}

export default useExecutionProgress;
