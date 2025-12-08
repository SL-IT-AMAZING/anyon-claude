/**
 * Utility to convert slash commands to user-friendly display text
 */

import { WORKFLOW_SEQUENCE, type WorkflowIconType } from '@/constants/planning';
import { DEV_WORKFLOW_SEQUENCE, type DevWorkflowIconType } from '@/constants/development';

export type PromptIconType = WorkflowIconType | DevWorkflowIconType;

export interface PromptDisplayInfo {
  text: string;
  icon: PromptIconType | null;
}

/**
 * Get display info (text + icon) for any anyon slash command
 * Returns the original prompt if no mapping found
 */
export const getPromptDisplayInfo = (prompt: string): PromptDisplayInfo => {
  // Check planning workflows
  const planningStep = WORKFLOW_SEQUENCE.find((s) => s.workflow === prompt);
  if (planningStep) {
    return { text: planningStep.displayText, icon: planningStep.icon };
  }

  // Check development workflows
  const devStep = DEV_WORKFLOW_SEQUENCE.find((s) => s.prompt === prompt);
  if (devStep) {
    return { text: devStep.displayText, icon: devStep.icon };
  }

  // Return original if no mapping found
  return { text: prompt, icon: null };
};

/**
 * Get display text for any anyon slash command (legacy, text only)
 * Returns the original prompt if no mapping found
 */
export const getPromptDisplayText = (prompt: string): string => {
  return getPromptDisplayInfo(prompt).text;
};

/**
 * Check if a prompt is an anyon workflow command
 */
export const isAnyonWorkflowCommand = (prompt: string): boolean => {
  return prompt.startsWith('/anyon:');
};
