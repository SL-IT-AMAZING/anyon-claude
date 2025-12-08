/**
 * Development workflow constants
 * PM workflow sequence for MVP development
 */

export type DevWorkflowIconType = 'layout-list' | 'rocket' | 'check-circle';

export interface DevWorkflowStep {
  id: string;
  title: string;
  prompt: string;
  displayText: string;
  icon: DevWorkflowIconType;
}

/**
 * PM Workflow Sequence
 * pm-orchestrator → pm-executor ↔ pm-reviewer (cycles until complete)
 */
export const DEV_WORKFLOW_SEQUENCE: DevWorkflowStep[] = [
  {
    id: 'pm-orchestrator',
    title: 'PM Orchestrator',
    prompt: '/anyon:anyon-method:workflows:pm-orchestrator',
    displayText: 'PM Orchestrator - 실행 계획 생성',
    icon: 'layout-list',
  },
  {
    id: 'pm-executor',
    title: 'PM Executor',
    prompt: '/anyon:anyon-method:workflows:pm-executor',
    displayText: 'PM Executor - 티켓 실행',
    icon: 'rocket',
  },
  {
    id: 'pm-reviewer',
    title: 'PM Reviewer',
    prompt: '/anyon:anyon-method:workflows:pm-reviewer',
    displayText: 'PM Reviewer - 코드 리뷰',
    icon: 'check-circle',
  },
];

/**
 * Check if prompt is a dev workflow prompt
 */
export const isDevWorkflowPrompt = (prompt: string): boolean => {
  return DEV_WORKFLOW_SEQUENCE.some((step) => prompt.includes(step.id));
};

/**
 * Get current workflow step from prompt
 */
export const getCurrentStepFromPrompt = (prompt: string): DevWorkflowStep | null => {
  return DEV_WORKFLOW_SEQUENCE.find((step) => prompt.includes(step.id)) ?? null;
};

/**
 * Get workflow step by ID
 */
export const getWorkflowStepById = (id: string): DevWorkflowStep | undefined => {
  return DEV_WORKFLOW_SEQUENCE.find((step) => step.id === id);
};

/**
 * Get display text for a dev workflow command
 */
export const getDevWorkflowDisplayText = (prompt: string): string | null => {
  const step = DEV_WORKFLOW_SEQUENCE.find((s) => s.prompt === prompt);
  return step?.displayText ?? null;
};
