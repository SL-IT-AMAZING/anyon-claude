/**
 * BMAD Sprint Status Parser
 * sprint-status.yaml 파일을 파싱하여 현재 스프린트 상태를 추적
 */

import { api } from '@/lib/api';
import yaml from 'js-yaml';

// Story 상태 타입
export type StoryStatus = 'backlog' | 'ready-for-dev' | 'in-progress' | 'review' | 'done';

// Epic 상태 타입
export type EpicStatus = 'backlog' | 'in-progress' | 'done';

// Story 정보
export interface StoryInfo {
  id: string;
  title: string;
  status: StoryStatus;
  file?: string; // story file path (있으면)
}

// Epic 정보
export interface EpicInfo {
  id: string;
  title: string;
  status: EpicStatus;
  stories: StoryInfo[];
}

// Sprint Status 전체 구조
export interface SprintStatus {
  version?: string;
  lastUpdated?: string;
  epics: EpicInfo[];
  // 편의 메서드용 computed 값
  totalStories: number;
  completedStories: number;
  currentEpic?: EpicInfo;
  currentStory?: StoryInfo;
}

// sprint-status.yaml의 원시 구조 (BMAD 워크플로우가 생성하는 형식)
// Nested 형식 (기존)
interface RawNestedSprintStatus {
  version?: string;
  last_updated?: string;
  epics?: Record<string, {
    status: string;
    title?: string;
    stories?: Record<string, {
      status: string;
      title?: string;
      file?: string;
    }>;
  }>;
}

// Flat 형식 (sprint-planning 워크플로우가 생성하는 형식)
interface RawFlatSprintStatus {
  generated?: string;
  project?: string;
  project_key?: string;
  tracking_system?: string;
  story_location?: string;
  development_status?: Record<string, string>;  // key: status (epic-1: backlog, 1-1-xxx: backlog)
}

/**
 * sprint-status.yaml 파일 경로 후보들 반환
 */
export function getSprintStatusPaths(projectPath: string): string[] {
  return [
    `${projectPath}/anyon-docs/dev-plan/sprint-status.yaml`,  // 우선 검색
    `${projectPath}/anyon-docs/planning/sprint-status.yaml`,  // fallback
  ];
}

/**
 * sprint-status.yaml 파일 경로 반환 (첫 번째 존재하는 경로)
 * @deprecated parseSprintStatus 내부에서 직접 검색함
 */
export function getSprintStatusPath(projectPath: string): string {
  return `${projectPath}/anyon-docs/dev-plan/sprint-status.yaml`;
}

/**
 * sprint-status.yaml 파일 읽기 및 파싱
 */
export async function parseSprintStatus(projectPath: string): Promise<SprintStatus | null> {
  const paths = getSprintStatusPaths(projectPath);

  try {
    // 여러 경로 중 존재하는 파일 찾기
    let filePath: string | null = null;
    for (const path of paths) {
      const exists = await api.checkFileExists(path);
      if (exists) {
        filePath = path;
        break;
      }
    }

    if (!filePath) {
      return null;
    }

    const content = await api.readFileContent(filePath);
    if (!content) {
      return null;
    }

    const raw = yaml.load(content) as Record<string, unknown>;

    // Flat 형식 감지 (development_status 키가 있으면)
    if (raw.development_status) {
      return transformFlatStatus(raw as RawFlatSprintStatus);
    }

    // Nested 형식
    return transformNestedStatus(raw as RawNestedSprintStatus);
  } catch (error) {
    console.error('[SprintStatusParser] Failed to parse sprint-status.yaml:', error);
    return null;
  }
}

/**
 * Flat 형식 YAML을 SprintStatus로 변환
 * development_status: { epic-1: backlog, 1-1-xxx: backlog, ... }
 */
function transformFlatStatus(raw: RawFlatSprintStatus): SprintStatus {
  const epicsMap = new Map<string, EpicInfo>();
  let totalStories = 0;
  let completedStories = 0;
  let currentEpic: EpicInfo | undefined;
  let currentStory: StoryInfo | undefined;

  const status = raw.development_status || {};

  // 1차 패스: Epic 생성
  for (const [key, value] of Object.entries(status)) {
    // epic-X 형식 (retrospective 제외)
    const epicMatch = key.match(/^epic-(\d+)$/);
    if (epicMatch) {
      const epicNum = epicMatch[1];
      const epic: EpicInfo = {
        id: key,
        title: `Epic ${epicNum}`,
        status: normalizeEpicStatus(value),
        stories: [],
      };
      epicsMap.set(epicNum, epic);

      if (!currentEpic && epic.status === 'in-progress') {
        currentEpic = epic;
      }
    }
  }

  // 2차 패스: Story 추가
  for (const [key, value] of Object.entries(status)) {
    // X-Y-title 형식 (story)
    const storyMatch = key.match(/^(\d+)-(\d+)-(.+)$/);
    if (storyMatch) {
      const epicNum = storyMatch[1];
      // storyMatch[2] = storyNum (사용하지 않음)
      const titleSlug = storyMatch[3];

      // Epic이 없으면 생성
      if (!epicsMap.has(epicNum)) {
        const epic: EpicInfo = {
          id: `epic-${epicNum}`,
          title: `Epic ${epicNum}`,
          status: 'backlog',
          stories: [],
        };
        epicsMap.set(epicNum, epic);
      }

      const epic = epicsMap.get(epicNum)!;
      const story: StoryInfo = {
        id: key,
        title: titleSlug.replace(/-/g, ' '),
        status: normalizeStoryStatus(value),
      };
      epic.stories.push(story);
      totalStories++;

      if (story.status === 'done') {
        completedStories++;
      }

      if (!currentStory && (story.status === 'in-progress' || story.status === 'review')) {
        currentStory = story;
      }
    }
  }

  // Map을 배열로 변환 (Epic 번호순 정렬)
  const epics = Array.from(epicsMap.entries())
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .map(([, epic]) => epic);

  return {
    version: undefined,
    lastUpdated: raw.generated,
    epics,
    totalStories,
    completedStories,
    currentEpic,
    currentStory,
  };
}

/**
 * Nested 형식 YAML을 SprintStatus로 변환 (기존 형식)
 */
function transformNestedStatus(raw: RawNestedSprintStatus): SprintStatus {
  const epics: EpicInfo[] = [];
  let totalStories = 0;
  let completedStories = 0;
  let currentEpic: EpicInfo | undefined;
  let currentStory: StoryInfo | undefined;

  if (raw.epics) {
    for (const [epicId, epicData] of Object.entries(raw.epics)) {
      const stories: StoryInfo[] = [];

      if (epicData.stories) {
        for (const [storyId, storyData] of Object.entries(epicData.stories)) {
          const story: StoryInfo = {
            id: storyId,
            title: storyData.title || storyId,
            status: normalizeStoryStatus(storyData.status),
            file: storyData.file,
          };
          stories.push(story);
          totalStories++;

          if (story.status === 'done') {
            completedStories++;
          }

          // 현재 진행 중인 스토리 찾기
          if (!currentStory && (story.status === 'in-progress' || story.status === 'review')) {
            currentStory = story;
          }
        }
      }

      const epic: EpicInfo = {
        id: epicId,
        title: epicData.title || epicId,
        status: normalizeEpicStatus(epicData.status),
        stories,
      };
      epics.push(epic);

      // 현재 진행 중인 에픽 찾기
      if (!currentEpic && epic.status === 'in-progress') {
        currentEpic = epic;
      }
    }
  }

  return {
    version: raw.version,
    lastUpdated: raw.last_updated,
    epics,
    totalStories,
    completedStories,
    currentEpic,
    currentStory,
  };
}

/**
 * Story 상태 정규화
 */
function normalizeStoryStatus(status: string): StoryStatus {
  const normalized = status.toLowerCase().replace(/[_\s]/g, '-');

  switch (normalized) {
    case 'backlog':
      return 'backlog';
    case 'ready-for-dev':
    case 'ready':
      return 'ready-for-dev';
    case 'in-progress':
    case 'doing':
    case 'wip':
      return 'in-progress';
    case 'review':
    case 'in-review':
    case 'code-review':
      return 'review';
    case 'done':
    case 'complete':
    case 'completed':
      return 'done';
    default:
      return 'backlog';
  }
}

/**
 * Epic 상태 정규화
 */
function normalizeEpicStatus(status: string): EpicStatus {
  const normalized = status.toLowerCase().replace(/[_\s]/g, '-');

  switch (normalized) {
    case 'backlog':
      return 'backlog';
    case 'in-progress':
    case 'doing':
    case 'active':
      return 'in-progress';
    case 'done':
    case 'complete':
    case 'completed':
      return 'done';
    default:
      return 'backlog';
  }
}

/**
 * 다음 처리해야 할 스토리 찾기
 * 우선순위: review > in-progress > ready-for-dev > backlog
 */
export function getNextStory(status: SprintStatus): StoryInfo | null {
  // 1. review 상태 스토리
  for (const epic of status.epics) {
    const reviewStory = epic.stories.find(s => s.status === 'review');
    if (reviewStory) return reviewStory;
  }

  // 2. in-progress 상태 스토리
  for (const epic of status.epics) {
    const inProgressStory = epic.stories.find(s => s.status === 'in-progress');
    if (inProgressStory) return inProgressStory;
  }

  // 3. ready-for-dev 상태 스토리
  for (const epic of status.epics) {
    const readyStory = epic.stories.find(s => s.status === 'ready-for-dev');
    if (readyStory) return readyStory;
  }

  // 4. backlog 상태 스토리 (in-progress epic 우선)
  const inProgressEpic = status.epics.find(e => e.status === 'in-progress');
  if (inProgressEpic) {
    const backlogStory = inProgressEpic.stories.find(s => s.status === 'backlog');
    if (backlogStory) return backlogStory;
  }

  // 5. 아무 backlog 스토리
  for (const epic of status.epics) {
    const backlogStory = epic.stories.find(s => s.status === 'backlog');
    if (backlogStory) return backlogStory;
  }

  return null;
}

/**
 * 모든 스토리가 완료되었는지 확인
 */
export function isAllStoriesComplete(status: SprintStatus): boolean {
  return status.totalStories > 0 && status.completedStories === status.totalStories;
}

/**
 * 진행률 계산 (0-100)
 */
export function getProgress(status: SprintStatus): number {
  if (status.totalStories === 0) return 0;
  return Math.round((status.completedStories / status.totalStories) * 100);
}
