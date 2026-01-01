import { useState, useEffect, useCallback, useMemo } from 'react';
import { planningApi } from '@/lib/api';
import { WORKFLOW_SEQUENCE, ANYON_DOCS_DIR, type WorkflowStep } from '@/constants/planning';

/**
 * BMAD 문서 frontmatter 정보
 */
export interface BmadFrontmatter {
  stepsCompleted?: string[];
  lastStep?: string;
  date?: string;
  projectName?: string;
}

/**
 * 워크플로우 상태
 */
export type WorkflowState = 'not_started' | 'in_progress' | 'completed';

export interface PlanningDoc {
  id: string;
  title: string;
  filename: string;
  /** 실제 매칭된 파일명 (패턴 매칭 시 사용) */
  matchedFilename?: string;
  exists: boolean;
  content?: string;
  /** BMAD frontmatter 정보 */
  frontmatter?: BmadFrontmatter;
  /** 워크플로우 상태 (not_started, in_progress, completed) */
  workflowState: WorkflowState;
}

/**
 * 와일드카드 패턴 매칭 (*, ? 지원)
 * @param pattern - 와일드카드 패턴 (예: 'product-brief-*.md')
 * @param filename - 매칭할 파일명
 */
const matchesPattern = (pattern: string, filename: string): boolean => {
  // * -> .*, ? -> . 로 변환하여 정규식 생성
  const regex = new RegExp(
    '^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
  );
  return regex.test(filename);
};

/**
 * BMAD frontmatter 파싱
 * ---로 시작하고 ---로 끝나는 YAML frontmatter 추출
 *
 * 지원하는 stepsCompleted 형식:
 * 1. 인라인 배열: stepsCompleted: [1, 2, 3] 또는 stepsCompleted: ["step-01", "step-02"]
 * 2. YAML 배열:
 *    stepsCompleted:
 *      - 1
 *      - 2
 */
const parseBmadFrontmatter = (content: string): BmadFrontmatter | undefined => {
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) return undefined;

  const yaml = frontmatterMatch[1];
  const result: BmadFrontmatter = {};

  // stepsCompleted 배열 추출
  // Case 1: 인라인 배열 형식 - stepsCompleted: [1, 2, 3] 또는 stepsCompleted: []
  const inlineMatch = yaml.match(/stepsCompleted:\s*\[([^\]]*)\]/);
  if (inlineMatch) {
    const arrayContent = inlineMatch[1].trim();
    if (arrayContent) {
      result.stepsCompleted = arrayContent
        .split(',')
        .map(item => item.trim().replace(/^["']|["']$/g, ''))
        .filter(item => item.length > 0);
    } else {
      result.stepsCompleted = [];
    }
  } else {
    // Case 2: YAML 멀티라인 배열 형식
    const multilineMatch = yaml.match(/stepsCompleted:\s*\n((?:\s*-\s*.+\n?)*)/);
    if (multilineMatch) {
      result.stepsCompleted = multilineMatch[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('- '))
        .map(line => line.slice(2).trim().replace(/^["']|["']$/g, ''));
    }
  }

  // 단일 값 추출
  const lastStepMatch = yaml.match(/lastStep:\s*["']?(.+?)["']?\s*(?:\n|$)/);
  if (lastStepMatch) result.lastStep = lastStepMatch[1].trim();

  const dateMatch = yaml.match(/date:\s*["']?(.+?)["']?\s*(?:\n|$)/);
  if (dateMatch) result.date = dateMatch[1].trim();

  const projectNameMatch = yaml.match(/projectName:\s*["']?(.+?)["']?\s*(?:\n|$)/);
  if (projectNameMatch) result.projectName = projectNameMatch[1].trim();

  return Object.keys(result).length > 0 ? result : undefined;
};

/**
 * BMAD 문서의 워크플로우 상태 판단
 * @param exists - 파일 존재 여부
 * @param content - 파일 내용
 * @param frontmatter - 파싱된 frontmatter
 * @param stepId - 워크플로우 스텝 ID
 *
 * stepsCompleted 형식: [1, 2, 3] 또는 ["1", "2", "3"] 또는 ["step-01", "step-02"]
 */
const determineBmadWorkflowState = (
  exists: boolean,
  content: string | undefined,
  frontmatter: BmadFrontmatter | undefined,
  stepId: string
): WorkflowState => {
  if (!exists) return 'not_started';

  // BMAD frontmatter에 stepsCompleted가 있으면 이를 기준으로 판단
  if (frontmatter?.stepsCompleted && frontmatter.stepsCompleted.length > 0) {
    // 각 워크플로우별 최종 스텝 번호 (실제 BMAD 워크플로우 구조 기반)
    const finalStepNumbers: Record<string, number> = {
      'product-brief': 6,    // step-06-complete
      'research': 6,         // step-06-research-synthesis
      'prd': 11,             // step-11-complete
      'ux-design': 14,       // step-14-complete
      'architecture': 8,     // step-08-complete
      'epics-stories': 4,    // step-04-final-validation
      'readiness-check': 6,  // step-06-final-assessment
    };

    const finalStep = finalStepNumbers[stepId];
    if (finalStep) {
      // stepsCompleted에서 최대 스텝 번호 찾기
      // 형식: "1", "2", "step-01", "step-02" 등 다양한 형태 지원
      const completedStepNumbers = frontmatter.stepsCompleted.map(step => {
        // 숫자만 추출 (예: "step-06" → 6, "6" → 6)
        const numMatch = step.toString().match(/(\d+)/);
        return numMatch ? parseInt(numMatch[1], 10) : 0;
      });

      const maxCompletedStep = Math.max(...completedStepNumbers, 0);

      // 마지막 스텝까지 완료되었으면 completed
      if (maxCompletedStep >= finalStep) {
        return 'completed';
      }

      // 스텝이 하나라도 완료되었으면 in_progress
      if (maxCompletedStep > 0) {
        return 'in_progress';
      }
    }
  }

  // frontmatter가 없거나 stepsCompleted가 빈 배열인 경우
  // 콘텐츠 길이로 대략 판단
  if (content) {
    const contentLength = content.length;
    // 템플릿 기본 내용(~200자)보다 충분히 긴 경우 작성 중으로 간주
    if (contentLength > 3000) return 'completed';
    if (contentLength > 500) return 'in_progress';
  }

  return 'not_started';
};

/**
 * MVP 문서의 워크플로우 상태 판단 (콘텐츠 기반)
 */
const determineMvpWorkflowState = (
  exists: boolean,
  content: string | undefined
): WorkflowState => {
  if (!exists) return 'not_started';

  if (content) {
    const contentLength = content.length;
    // MVP는 단순히 콘텐츠 길이로 판단
    if (contentLength > 2000) return 'completed';
    if (contentLength > 200) return 'in_progress';
  }

  return 'not_started';
};

export interface PlanningProgress {
  completed: number;
  total: number;
  completedSteps: WorkflowStep[];
  nextStep: WorkflowStep | undefined;
  isAllComplete: boolean;
}

interface UsePlanningDocsReturn {
  documents: PlanningDoc[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  progress: PlanningProgress;
}

/**
 * Hook for managing planning documents state
 * Polls the anyon-docs directory for document existence and content
 * @param projectPath - The project path
 * @param workflows - Optional custom workflow sequence (defaults to WORKFLOW_SEQUENCE)
 * @param trackId - 트랙 ID (bmad 트랙은 frontmatter 파싱 활성화)
 */
export function usePlanningDocs(
  projectPath: string | undefined,
  workflows: WorkflowStep[] = WORKFLOW_SEQUENCE,
  trackId?: string
): UsePlanningDocsReturn {
  const isBmadTrack = trackId === 'bmad';
  const [documents, setDocuments] = useState<PlanningDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const docsDir = projectPath ? `${projectPath}/${ANYON_DOCS_DIR}` : '';

  const checkDocuments = useCallback(async () => {
    if (!projectPath) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    try {
      // First, get list of existing files in anyon-docs
      console.log('[usePlanningDocs] Checking documents for:', projectPath);
      const existingFiles = await planningApi.listAnyonDocs(projectPath);
      console.log('[usePlanningDocs] Existing files:', existingFiles);
      const existingFilesSet = new Set(existingFiles);

      // Build document list with existence check (패턴 매칭 지원)
      const docs: PlanningDoc[] = await Promise.all(
        workflows.map(async (step) => {
          // 패턴이 있으면 패턴 매칭, 없으면 정확한 파일명 매칭
          let exists = false;
          let matchedFilename: string | undefined;

          if (step.filenamePattern) {
            // 패턴 매칭: 파일 목록에서 패턴에 맞는 첫 번째 파일 찾기
            matchedFilename = existingFiles.find(f => matchesPattern(step.filenamePattern!, f));
            exists = !!matchedFilename;
          } else {
            // 정확한 파일명 매칭
            exists = existingFilesSet.has(step.filename);
            if (exists) matchedFilename = step.filename;
          }

          let content: string | undefined;
          let frontmatter: BmadFrontmatter | undefined;

          if (exists && matchedFilename) {
            try {
              const filePath = `${docsDir}/${matchedFilename}`;
              console.log('[usePlanningDocs] Reading file:', filePath);
              content = await planningApi.readFileContent(filePath);
              console.log('[usePlanningDocs] Content length:', content?.length);

              // BMAD 트랙이면 frontmatter 파싱
              if (isBmadTrack && content) {
                frontmatter = parseBmadFrontmatter(content);
                if (frontmatter) {
                  console.log('[usePlanningDocs] Parsed frontmatter:', frontmatter);
                }
              }
            } catch (e) {
              console.warn(`Failed to read ${matchedFilename}:`, e);
            }
          }

          // 워크플로우 상태 판단
          const workflowState = isBmadTrack
            ? determineBmadWorkflowState(exists, content, frontmatter, step.id)
            : determineMvpWorkflowState(exists, content);

          return {
            id: step.id,
            title: step.title,
            filename: step.filename,
            matchedFilename,
            exists,
            content,
            frontmatter,
            workflowState,
          };
        })
      );

      console.log('[usePlanningDocs] Setting documents:', docs);
      setDocuments(docs);
      setError(null);
    } catch (e) {
      console.error('Failed to check documents:', e);
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [projectPath, workflows, docsDir, isBmadTrack]);

  // Initial load and polling (every 2 seconds - same as anyon-mvp)
  useEffect(() => {
    if (!projectPath) return;

    checkDocuments();
    const interval = setInterval(checkDocuments, 2000);
    return () => clearInterval(interval);
  }, [checkDocuments, projectPath]);

  // Calculate progress based on workflowState
  const progress = useMemo((): PlanningProgress => {
    // 완료된 스텝: workflowState가 'completed'인 것만
    const completedSteps = workflows.filter(step =>
      documents.some(doc => doc.id === step.id && doc.workflowState === 'completed')
    );

    // 다음 스텝: 완료되지 않은 첫 번째 스텝
    const nextStep = workflows.find(step =>
      !documents.some(doc => doc.id === step.id && doc.workflowState === 'completed')
    );

    return {
      completed: completedSteps.length,
      total: workflows.length,
      completedSteps,
      nextStep,
      isAllComplete: completedSteps.length === workflows.length,
    };
  }, [documents, workflows]);

  return {
    documents,
    isLoading,
    error,
    refresh: checkDocuments,
    progress,
  };
}
