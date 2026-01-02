/**
 * BMAD Workflow Router
 * sprint-status.yaml 상태에 따라 다음 실행할 워크플로우 결정
 */

import type { DevWorkflowStep } from '@/constants/development';
import { BMAD_DEV_WORKFLOWS } from '@/constants/tracks/development';
import type { SprintStatus, StoryInfo, StoryStatus } from './sprintStatusParser';
import { getNextStory, isAllStoriesComplete } from './sprintStatusParser';

// 워크플로우 ID 타입
export type BmadWorkflowId =
  | 'sprint-planning'
  | 'sprint-status'
  | 'create-story'
  | 'dev-story'
  | 'code-review'
  | 'correct-course'
  | 'retrospective';

// 라우팅 결과
export interface WorkflowRoutingResult {
  workflow: DevWorkflowStep;
  reason: string;
  targetStory?: StoryInfo;
  isComplete?: boolean;
}

/**
 * BMAD 워크플로우 ID로 워크플로우 Step 찾기
 */
export function getBmadWorkflow(id: BmadWorkflowId): DevWorkflowStep | undefined {
  return BMAD_DEV_WORKFLOWS.find(w => w.id === id);
}

/**
 * 현재 상태에 따라 다음 실행할 워크플로우 결정
 * @param status - 현재 sprint-status (null이면 sprint-planning 필요)
 * @param isFirstRun - 첫 실행 여부 (sprint-planning 아직 안 함)
 */
export function getNextBmadWorkflow(
  status: SprintStatus | null,
  isFirstRun: boolean = false
): WorkflowRoutingResult | null {
  // 1. sprint-status.yaml이 없으면 sprint-planning 실행
  if (!status || isFirstRun) {
    const workflow = getBmadWorkflow('sprint-planning');
    if (workflow) {
      return {
        workflow,
        reason: 'Sprint 계획이 필요합니다. epics.md에서 스토리를 추출합니다.',
      };
    }
    return null;
  }

  // 2. 모든 스토리 완료 → retrospective
  if (isAllStoriesComplete(status)) {
    const workflow = getBmadWorkflow('retrospective');
    if (workflow) {
      return {
        workflow,
        reason: '모든 스토리가 완료되었습니다. Epic 회고를 진행합니다.',
        isComplete: true,
      };
    }
    return null;
  }

  // 3. 다음 스토리 찾기
  const nextStory = getNextStory(status);
  if (!nextStory) {
    // 스토리가 없지만 완료도 아닌 경우 (이상 상태)
    const workflow = getBmadWorkflow('sprint-status');
    if (workflow) {
      return {
        workflow,
        reason: '스프린트 상태를 확인합니다.',
      };
    }
    return null;
  }

  // 4. 스토리 상태에 따라 워크플로우 결정
  return routeByStoryStatus(nextStory);
}

/**
 * 스토리 상태에 따라 워크플로우 라우팅
 */
function routeByStoryStatus(story: StoryInfo): WorkflowRoutingResult | null {
  switch (story.status) {
    case 'review': {
      // 리뷰 대기 → code-review 실행
      const workflow = getBmadWorkflow('code-review');
      if (workflow) {
        return {
          workflow,
          reason: `Story "${story.title}"의 코드 리뷰를 진행합니다.`,
          targetStory: story,
        };
      }
      break;
    }

    case 'in-progress': {
      // 진행 중 → dev-story 계속 실행
      const workflow = getBmadWorkflow('dev-story');
      if (workflow) {
        return {
          workflow,
          reason: `Story "${story.title}" 개발을 이어서 진행합니다.`,
          targetStory: story,
        };
      }
      break;
    }

    case 'ready-for-dev': {
      // 개발 준비 완료 → dev-story 실행
      const workflow = getBmadWorkflow('dev-story');
      if (workflow) {
        return {
          workflow,
          reason: `Story "${story.title}" 개발을 시작합니다.`,
          targetStory: story,
        };
      }
      break;
    }

    case 'backlog': {
      // backlog → create-story로 상세 스토리 생성
      const workflow = getBmadWorkflow('create-story');
      if (workflow) {
        return {
          workflow,
          reason: `Story "${story.title}"의 상세 스토리 파일을 생성합니다.`,
          targetStory: story,
        };
      }
      break;
    }

    case 'done':
      // 완료된 스토리는 스킵 (여기 오면 안 됨)
      break;
  }

  return null;
}

/**
 * 워크플로우 완료 후 다음 상태 예측
 */
export function predictNextStatus(
  currentStatus: StoryStatus,
  workflowId: BmadWorkflowId
): StoryStatus {
  switch (workflowId) {
    case 'create-story':
      // backlog → ready-for-dev
      return 'ready-for-dev';
    case 'dev-story':
      // ready-for-dev/in-progress → review
      return 'review';
    case 'code-review':
      // review → done (또는 다시 in-progress if issues found)
      return 'done';
    default:
      return currentStatus;
  }
}

/**
 * 전체 자동화 실행 시 워크플로우 시퀀스 생성
 * (참고용 - 실제로는 상태 기반으로 동적 결정)
 */
export function getBmadWorkflowSequence(): BmadWorkflowId[] {
  return [
    'sprint-planning',  // 1. 스프린트 계획
    'create-story',     // 2. 스토리 생성 (반복)
    'dev-story',        // 3. 스토리 개발 (반복)
    'code-review',      // 4. 코드 리뷰 (반복)
    'retrospective',    // 5. 회고 (에픽 완료 시)
  ];
}

/**
 * 워크플로우 카테고리별 분류
 */
export function getWorkflowCategory(workflowId: BmadWorkflowId): string {
  switch (workflowId) {
    case 'sprint-planning':
    case 'sprint-status':
      return 'planning';
    case 'create-story':
    case 'dev-story':
      return 'execution';
    case 'code-review':
      return 'review';
    case 'correct-course':
    case 'retrospective':
      return 'management';
    default:
      return 'unknown';
  }
}
