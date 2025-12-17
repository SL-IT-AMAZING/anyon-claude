/**
 * Utility to convert slash commands to user-friendly display text
 */

import { WORKFLOW_SEQUENCE, type WorkflowIconType } from '@/constants/planning';
import { DEV_WORKFLOW_SEQUENCE, type DevWorkflowIconType } from '@/constants/development';
import { isInternalizedWorkflowPrompt } from '@/constants/workflows';

export type PromptIconType = WorkflowIconType | DevWorkflowIconType;

export interface PromptDisplayInfo {
  text: string;
  icon: PromptIconType | null;
}

/**
 * Get display info (text + icon) for any anyon slash command or internalized workflow
 * Returns the original prompt if no mapping found
 */
export const getPromptDisplayInfo = (prompt: string): PromptDisplayInfo => {
  // Check planning workflows (슬래시 커맨드 또는 내재화된 프롬프트)
  const planningStep = WORKFLOW_SEQUENCE.find((s) => {
    // 슬래시 커맨드 매칭
    if (s.workflow === prompt || prompt.includes(s.workflow)) {
      return true;
    }
    // 내재화된 프롬프트 매칭 - 시작 부분 비교 (첫 200자)
    if (s.prompt && prompt.startsWith(s.prompt.substring(0, 200))) {
      return true;
    }
    return false;
  });
  if (planningStep) {
    return { text: planningStep.displayText, icon: planningStep.icon };
  }

  // Check development workflows
  const devStep = DEV_WORKFLOW_SEQUENCE.find((s) => {
    if (s.prompt === prompt) return true;
    if (prompt.includes(s.prompt)) return true;
    // 내재화된 프롬프트 시작 부분 비교
    if (s.prompt && prompt.startsWith(s.prompt.substring(0, 200))) return true;
    return false;
  });
  if (devStep) {
    return { text: devStep.displayText, icon: devStep.icon };
  }

  // 내재화된 워크플로우 프롬프트인 경우 (매칭은 안됐지만 형식은 맞는 경우)
  if (isInternalizedWorkflowPrompt(prompt)) {
    return { text: '워크플로우 실행 중...', icon: 'file-text' };
  }

  // Return original if no mapping found (truncate if too long)
  const displayText = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;
  return { text: displayText, icon: null };
};

/**
 * Get display text for any anyon slash command (legacy, text only)
 * Returns the original prompt if no mapping found
 */
export const getPromptDisplayText = (prompt: string): string => {
  return getPromptDisplayInfo(prompt).text;
};

/**
 * Check if a prompt is an anyon workflow command (slash command or internalized)
 */
export const isAnyonWorkflowCommand = (prompt: string): boolean => {
  return prompt.startsWith('/anyon:') || isInternalizedWorkflowPrompt(prompt);
};
