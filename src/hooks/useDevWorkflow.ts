import { useState, useEffect, useCallback } from 'react';
import { api, type DevSession } from '@/lib/api';
import { getCurrentStepFromPrompt, type DevWorkflowStep } from '@/constants/development';

export type WorkflowStatus = 'idle' | 'running' | 'completed' | 'error';

interface UseDevWorkflowReturn {
  status: WorkflowStatus;
  currentStep: DevWorkflowStep | null;
  cycleCount: number;
  error: string | null;
  isLoading: boolean;
  start: (model?: string) => Promise<void>;
  stop: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing development workflow state
 * Polls backend for status every 2 seconds
 */
export function useDevWorkflow(projectPath: string | undefined): UseDevWorkflowReturn {
  const [session, setSession] = useState<DevSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status: WorkflowStatus = (session?.status as WorkflowStatus) || 'idle';
  const currentStep: DevWorkflowStep | null = session?.last_prompt
    ? getCurrentStepFromPrompt(session.last_prompt)
    : null;
  const cycleCount = session?.cycle_count ?? 0;

  // Fetch status
  const refresh = useCallback(async () => {
    if (!projectPath) return;
    try {
      const data = await api.getDevWorkflowStatus(projectPath);
      setSession(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [projectPath]);

  // Poll status every 2 seconds
  useEffect(() => {
    if (!projectPath) return;

    refresh();
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, [projectPath, refresh]);

  // Start workflow
  const start = useCallback(
    async (model: string = 'sonnet') => {
      if (!projectPath || isLoading) return;
      setIsLoading(true);
      setError(null);
      try {
        await api.startDevWorkflow(projectPath, model);
        await refresh();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setIsLoading(false);
      }
    },
    [projectPath, isLoading, refresh]
  );

  // Stop workflow
  const stop = useCallback(async () => {
    if (!projectPath) return;
    try {
      await api.stopDevWorkflow(projectPath);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }, [projectPath, refresh]);

  return {
    status,
    currentStep,
    cycleCount,
    error,
    isLoading,
    start,
    stop,
    refresh,
  };
}
