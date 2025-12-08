import React, { useState, useRef, useEffect } from 'react';
import { PlayCircle, Square, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DEV_WORKFLOW_SEQUENCE } from '@/constants/development';
import { api } from '@/lib/api';

const DEV_COMPLETE_FILE = 'anyon-docs/dev-plan/DEVELOPMENT_COMPLETE.md';

interface DevDocsPanelProps {
  projectPath: string | undefined;
  isPlanningComplete: boolean;
  onSendPrompt: (prompt: string) => void;
  onStartNewSession?: (prompt: string) => void;
  isSessionLoading?: boolean;
}

/**
 * Get next workflow step based on current step
 * Orchestrator → Executor → Reviewer → Executor → Reviewer ... (cycle)
 */
const getNextStep = (currentStepId: string): typeof DEV_WORKFLOW_SEQUENCE[0] | null => {
  // Orchestrator → Executor
  if (currentStepId === 'pm-orchestrator') {
    return DEV_WORKFLOW_SEQUENCE[1]; // pm-executor
  }
  // Executor → Reviewer
  if (currentStepId === 'pm-executor') {
    return DEV_WORKFLOW_SEQUENCE[2]; // pm-reviewer
  }
  // Reviewer → Executor (cycle back)
  if (currentStepId === 'pm-reviewer') {
    return DEV_WORKFLOW_SEQUENCE[1]; // pm-executor
  }
  return null;
};

export const DevDocsPanel: React.FC<DevDocsPanelProps> = ({
  projectPath,
  isPlanningComplete,
  onStartNewSession,
  isSessionLoading = false,
}) => {
  // Current running step
  const [currentRunningStep, setCurrentRunningStep] = useState<string | null>(null);
  // Track previous loading state to detect completion
  const prevLoadingRef = useRef(isSessionLoading);
  // Use ref for stop flag to avoid stale closure in setTimeout
  const isStoppedRef = useRef(false);
  // For UI display
  const [isStopped, setIsStopped] = useState(false);
  // Development complete state
  const [isDevComplete, setIsDevComplete] = useState(false);

  // Handle session completion - trigger next step (unless manually stopped or dev complete)
  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    const isNowDone = wasLoading && !isSessionLoading;
    prevLoadingRef.current = isSessionLoading;

    if (isNowDone && currentRunningStep && !isStoppedRef.current) {
      // Check if development is complete before continuing
      const checkAndContinue = async () => {
        if (!projectPath) return;

        const completeFilePath = `${projectPath}/${DEV_COMPLETE_FILE}`;
        const isComplete = await api.checkFileExists(completeFilePath);

        if (isComplete) {
          setIsDevComplete(true);
          setCurrentRunningStep(null);
          return;
        }

        const nextStep = getNextStep(currentRunningStep);
        if (nextStep) {
          // Small delay before starting next step
          setTimeout(() => {
            // Check again in case stop was pressed during the delay
            if (!isStoppedRef.current) {
              setCurrentRunningStep(nextStep.id);
              onStartNewSession?.(nextStep.prompt);
            }
          }, 500);
        }
      };

      checkAndContinue();
    }
  }, [isSessionLoading, currentRunningStep, onStartNewSession, projectPath]);

  // Start a step (clicking any step starts and continues from there)
  const handleStart = (stepId: string, prompt: string) => {
    isStoppedRef.current = false;
    setIsStopped(false);
    setIsDevComplete(false);
    setCurrentRunningStep(stepId);
    onStartNewSession?.(prompt);
  };

  // Stop - prevents next step from running
  const handleStop = () => {
    isStoppedRef.current = true;
    setIsStopped(true);
    setCurrentRunningStep(null);
  };

  if (!projectPath) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>프로젝트를 선택해주세요</p>
      </div>
    );
  }

  if (!isPlanningComplete) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">기획문서를 먼저 완료해주세요</p>
          <p className="text-sm text-muted-foreground">
            PRD, UX Design, Design Guide, TRD, Architecture, ERD 문서가 모두 완료되어야 개발을 시작할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  const isRunningWorkflow = currentRunningStep !== null && isSessionLoading;

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">개발 워크플로우</h3>

        {isRunningWorkflow && (
          <Button onClick={handleStop} variant="outline" size="sm" className="gap-2">
            <Square className="h-4 w-4" />
            중지
          </Button>
        )}
      </div>

      {/* Workflow Steps */}
      <div className="flex items-center gap-3 justify-center mb-4">
        {DEV_WORKFLOW_SEQUENCE.map((step, index) => {
          const isRunning = currentRunningStep === step.id && isSessionLoading;

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => handleStart(step.id, step.prompt)}
                disabled={!onStartNewSession || isRunningWorkflow}
                className={cn(
                  'flex flex-col items-center gap-1.5 px-4 py-3 rounded-lg transition-all',
                  'hover:bg-muted/80 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
                  'border border-transparent hover:border-border',
                  isRunning && 'bg-primary/10 border-primary/20'
                )}
              >
                {isRunning ? (
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                ) : (
                  <PlayCircle className="h-6 w-6 text-muted-foreground/60" />
                )}
                <span
                  className={cn(
                    'text-xs font-medium',
                    isRunning && 'text-primary',
                    !isRunning && 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </span>
              </button>
              {index < DEV_WORKFLOW_SEQUENCE.length - 1 && (
                <div className="w-6 h-px bg-muted-foreground/20" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Status Message */}
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        {isDevComplete && (
          <div className="text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-green-600 font-medium">개발이 완료되었습니다!</p>
          </div>
        )}
        {!isDevComplete && !currentRunningStep && !isStopped && (
          <p>워크플로우 단계를 클릭하여 시작하세요</p>
        )}
        {!isDevComplete && !currentRunningStep && isStopped && (
          <p>중지됨 - 다시 시작하려면 단계를 클릭하세요</p>
        )}
        {!isDevComplete && currentRunningStep && isSessionLoading && (
          <p>
            {DEV_WORKFLOW_SEQUENCE.find((s) => s.id === currentRunningStep)?.title} 실행 중...
          </p>
        )}
        {!isDevComplete && currentRunningStep && !isSessionLoading && (
          <p>다음 단계 준비 중...</p>
        )}
      </div>
    </div>
  );
};

export default DevDocsPanel;
