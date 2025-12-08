import type { ProblemReport, PreviewError, ComponentSelection } from '@/types/preview';

/**
 * TypeScript 에러를 AI가 수정할 수 있는 프롬프트로 변환
 */
export function createProblemFixPrompt(problemReport: ProblemReport): string {
  const { problems } = problemReport;

  if (problems.length === 0) {
    return 'No TypeScript problems detected.';
  }

  const totalProblems = problems.length;
  let prompt = `Fix these ${totalProblems} TypeScript compile-time error${totalProblems === 1 ? '' : 's'}:\n\n`;

  problems.forEach((problem, index) => {
    prompt += `${index + 1}. ${problem.file}:${problem.line}:${problem.column} - ${problem.message} (TS${problem.code})\n`;
    if (problem.snippet) {
      prompt += `\`\`\`\n${problem.snippet}\n\`\`\`\n`;
    }
    prompt += '\n';
  });

  prompt += '\nPlease fix all errors in a concise way.';

  return prompt;
}

/**
 * 런타임 에러를 AI가 수정할 수 있는 프롬프트로 변환
 */
export function createRuntimeErrorFixPrompt(error: PreviewError): string {
  let prompt = `Fix this runtime error in the preview:\n\n`;
  prompt += `**Error Message:**\n${error.message}\n\n`;

  if (error.stack) {
    prompt += `**Stack Trace:**\n\`\`\`\n${error.stack}\n\`\`\`\n\n`;
  }

  prompt += `Please analyze the error and provide a fix.`;

  return prompt;
}

/**
 * 선택된 컴포넌트들을 컨텍스트로 변환
 */
export function createComponentContext(components: ComponentSelection[]): string {
  if (components.length === 0) {
    return '';
  }

  let context = `\n\n**Selected Components:**\n`;
  components.forEach((component) => {
    context += `- ${component.name} (${component.relativePath}:${component.lineNumber})\n`;
  });

  return context;
}

/**
 * 컴포넌트 수정 프롬프트 생성
 */
export function createComponentEditPrompt(
  component: ComponentSelection,
  instruction: string
): string {
  return `Edit the component "${component.name}" in ${component.relativePath} at line ${component.lineNumber}:\n\n${instruction}`;
}

/**
 * 빌드 에러 수정 프롬프트 생성 (Vite 등)
 */
export function createBuildErrorFixPrompt(error: {
  message: string;
  file?: string;
  frame?: string;
}): string {
  let prompt = `Fix this build error:\n\n`;
  prompt += `**Error:** ${error.message}\n`;

  if (error.file) {
    prompt += `**File:** ${error.file}\n`;
  }

  if (error.frame) {
    prompt += `**Code Frame:**\n\`\`\`\n${error.frame}\n\`\`\`\n`;
  }

  prompt += `\nPlease fix this build error.`;

  return prompt;
}
