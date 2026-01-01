/**
 * Planning workflow constants
 * 6-step document workflow sequence for MVP planning
 */

import {
  STARTUP_PRD_PROMPT,
  STARTUP_UX_PROMPT,
  STARTUP_UI_PROMPT,
  STARTUP_TRD_PROMPT,
  STARTUP_ARCHITECTURE_PROMPT,
  STARTUP_ERD_PROMPT,
} from './workflows/planning';
import { ANYON_DOCS } from './paths';

export type WorkflowIconType = 'file-text' | 'palette' | 'paintbrush' | 'settings' | 'boxes' | 'database' | 'search' | 'list-checks' | 'check-circle' | 'book-open';

/** BMAD 4단계 구조 */
export type BmadPhase = 'analysis' | 'plan' | 'solutioning' | 'implementation';

export interface WorkflowStep {
  id: string;
  title: string;
  filename: string;
  /** @deprecated 슬래시 커맨드 방식 - prompt 사용 권장 */
  workflow: string;
  /** 내재화된 프롬프트 (있으면 workflow 대신 사용) */
  prompt?: string;
  displayText: string;
  icon: WorkflowIconType;
  nextId: string | null;
  /** BMAD 트랙용 단계 구분 */
  phase?: BmadPhase;
}

export const WORKFLOW_SEQUENCE: WorkflowStep[] = [
  {
    id: 'prd',
    title: 'PRD',
    filename: 'prd.md',
    workflow: '/anyon:anyon-method:workflows:startup-prd',
    prompt: STARTUP_PRD_PROMPT,
    displayText: 'PRD 문서 작성 시작',
    icon: 'file-text',
    nextId: 'ux-design',
  },
  {
    id: 'ux-design',
    title: 'UX Design',
    filename: 'ui-ux.html',
    workflow: '/anyon:anyon-method:workflows:startup-ux',
    prompt: STARTUP_UX_PROMPT,
    displayText: 'UX 디자인 문서 작성',
    icon: 'palette',
    nextId: 'design-guide',
  },
  {
    id: 'design-guide',
    title: 'Design Guide',
    filename: 'design-guide.md',
    workflow: '/anyon:anyon-method:workflows:startup-ui',
    prompt: STARTUP_UI_PROMPT,
    displayText: 'UI 디자인 가이드 작성',
    icon: 'paintbrush',
    nextId: 'trd',
  },
  {
    id: 'trd',
    title: 'TRD',
    filename: 'trd.md',
    workflow: '/anyon:anyon-method:workflows:startup-trd',
    prompt: STARTUP_TRD_PROMPT,
    displayText: '기술 요구사항 문서 작성',
    icon: 'settings',
    nextId: 'architecture',
  },
  {
    id: 'architecture',
    title: 'Architecture',
    filename: 'architecture.md',
    workflow: '/anyon:anyon-method:workflows:startup-architecture',
    prompt: STARTUP_ARCHITECTURE_PROMPT,
    displayText: '시스템 아키텍처 설계',
    icon: 'boxes',
    nextId: 'erd',
  },
  {
    id: 'erd',
    title: 'ERD',
    filename: 'erd.md',
    workflow: '/anyon:anyon-method:workflows:startup-erd',
    prompt: STARTUP_ERD_PROMPT,
    displayText: 'ERD 데이터베이스 설계',
    icon: 'database',
    nextId: null,
  },
];

export const ANYON_DOCS_DIR = ANYON_DOCS.PLANNING;

/**
 * Get the next workflow step after the given filename
 */
export const getNextWorkflowStep = (currentFilename: string): WorkflowStep | null => {
  const currentIndex = WORKFLOW_SEQUENCE.findIndex(
    (step) => step.filename === currentFilename
  );
  if (currentIndex === -1 || currentIndex === WORKFLOW_SEQUENCE.length - 1) {
    return null;
  }
  return WORKFLOW_SEQUENCE[currentIndex + 1];
};

/**
 * Get workflow step by ID
 */
export const getPlanningStepById = (id: string): WorkflowStep | undefined => {
  return WORKFLOW_SEQUENCE.find((step) => step.id === id);
};

/**
 * Get display text for a workflow command
 */
export const getWorkflowDisplayText = (workflow: string): string | null => {
  const step = WORKFLOW_SEQUENCE.find((s) => s.workflow === workflow);
  return step?.displayText ?? null;
};

/**
 * 워크플로우 실행에 사용할 프롬프트 반환
 * prompt가 있으면 내재화된 프롬프트 사용, 없으면 슬래시 커맨드 사용
 */
export const getWorkflowPrompt = (step: WorkflowStep): string => {
  return step.prompt ?? step.workflow;
};
