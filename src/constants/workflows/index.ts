/**
 * Workflows - 모든 워크플로우 프롬프트 통합 export
 */

export * from './planning';
export * from './development';
export { WORKFLOW_ENGINE } from './engine';

/**
 * 워크플로우 ID 목록 (프롬프트 식별용)
 */
export const WORKFLOW_IDS = [
  // Planning workflows
  'startup-prd',
  'startup-ux',
  'startup-ui',
  'startup-trd',
  'startup-architecture',
  'startup-erd',
  // Development workflows
  'pm-opensource',
  'pm-orchestrator',
  'pm-executor',
  'pm-reviewer',
] as const;

export type WorkflowId = (typeof WORKFLOW_IDS)[number];

/**
 * 프롬프트가 내재화된 워크플로우인지 확인
 */
export function isInternalizedWorkflowPrompt(prompt: string): boolean {
  // Check for standard workflow engine format
  const isEngineWorkflow = prompt.includes('# Workflow Execution') && prompt.includes('## 1. Workflow Engine');
  
  // Check for startup planning workflows (PRD, UX, UI, TRD, Architecture, ERD)
  const isStartupWorkflow = prompt.includes('# Founder PRD') || 
                            prompt.includes('# Startup UX') ||
                            prompt.includes('# Startup UI') ||
                            prompt.includes('# Startup TRD') ||
                            prompt.includes('# Startup Architecture') ||
                            prompt.includes('# Startup ERD') ||
                            prompt.includes('## 실행 환경 설정') ||
                            prompt.includes('## Workflow Configuration');
  
  return isEngineWorkflow || isStartupWorkflow;
}
