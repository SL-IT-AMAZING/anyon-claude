import { useState, useEffect, useCallback, useMemo } from 'react';
import { planningApi } from '@/lib/api';
import { WORKFLOW_SEQUENCE, ANYON_DOCS_DIR, type WorkflowStep } from '@/constants/planning';

export interface PlanningDoc {
  id: string;
  title: string;
  filename: string;
  exists: boolean;
  content?: string;
}

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
 */
export function usePlanningDocs(
  projectPath: string | undefined,
  workflows: WorkflowStep[] = WORKFLOW_SEQUENCE
): UsePlanningDocsReturn {
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

      // Build document list with existence check
      const docs: PlanningDoc[] = await Promise.all(
        workflows.map(async (step) => {
          const exists = existingFilesSet.has(step.filename);
          let content: string | undefined;

          if (exists) {
            try {
              const filePath = `${docsDir}/${step.filename}`;
              console.log('[usePlanningDocs] Reading file:', filePath);
              content = await planningApi.readFileContent(filePath);
              console.log('[usePlanningDocs] Content length:', content?.length);
            } catch (e) {
              console.warn(`Failed to read ${step.filename}:`, e);
            }
          }

          return {
            id: step.id,
            title: step.title,
            filename: step.filename,
            exists,
            content,
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
  }, [projectPath, workflows, docsDir]);

  // Initial load and polling (every 2 seconds - same as anyon-mvp)
  useEffect(() => {
    if (!projectPath) return;

    checkDocuments();
    const interval = setInterval(checkDocuments, 2000);
    return () => clearInterval(interval);
  }, [checkDocuments, projectPath]);

  // Calculate progress
  const progress = useMemo((): PlanningProgress => {
    const completedSteps = workflows.filter(step =>
      documents.some(doc => doc.id === step.id && doc.exists)
    );

    const nextStep = workflows.find(step =>
      !documents.some(doc => doc.id === step.id && doc.exists)
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
