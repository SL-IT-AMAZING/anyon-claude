import React, { useState, useCallback } from 'react';
import { CheckCircle2, Circle, ArrowRight, FileText, Loader2, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePlanningDocs } from '@/hooks/usePlanningDocs';
import { WORKFLOW_SEQUENCE, type WorkflowStep } from '@/constants/planning';
import { PlanningDocViewer } from './PlanningDocViewer';

interface PlanningDocsPanelProps {
  projectPath: string | undefined;
  onStartNewWorkflow: (workflowPrompt: string) => void;
  isSessionLoading?: boolean;
}

/**
 * Planning Documents Panel
 * Displays the 6-step workflow progress and document viewer
 */
export const PlanningDocsPanel: React.FC<PlanningDocsPanelProps> = ({
  projectPath,
  onStartNewWorkflow,
  isSessionLoading = false,
}) => {
  const { documents, isLoading, progress } = usePlanningDocs(projectPath);
  const [activeDocId, setActiveDocId] = useState<string>('prd');
  const [activeWorkflows, setActiveWorkflows] = useState<Set<string>>(new Set());

  // Clear active workflows when documents are created
  React.useEffect(() => {
    setActiveWorkflows(prev => {
      const updated = new Set(prev);
      documents.forEach(doc => {
        if (doc.exists) {
          updated.delete(doc.id);
        }
      });
      return updated;
    });
  }, [documents]);

  const activeDoc = documents.find(d => d.id === activeDocId);
  const activeStep = WORKFLOW_SEQUENCE.find(s => s.id === activeDocId);

  // Debug logging
  console.log('[PlanningDocsPanel] documents:', documents);
  console.log('[PlanningDocsPanel] activeDocId:', activeDocId);
  console.log('[PlanningDocsPanel] activeDoc:', activeDoc);
  console.log('[PlanningDocsPanel] activeDoc.exists:', activeDoc?.exists);
  console.log('[PlanningDocsPanel] activeDoc.content length:', activeDoc?.content?.length);

  // Check if a tab is enabled (previous doc must exist)
  const isTabEnabled = useCallback((index: number): boolean => {
    if (index === 0) return true;
    const prevStep = WORKFLOW_SEQUENCE[index - 1];
    return documents.some(d => d.id === prevStep.id && d.exists);
  }, [documents]);

  // Handle tab click with lock check
  const handleTabClick = useCallback((stepId: string) => {
    const stepIndex = WORKFLOW_SEQUENCE.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return;

    if (!isTabEnabled(stepIndex)) {
      // Previous document not complete
      return;
    }

    setActiveDocId(stepId);
  }, [isTabEnabled]);

  // Start workflow for a step - starts a new conversation in the same tab
  const handleStartWorkflow = useCallback((step: WorkflowStep) => {
    // Mark this workflow as active (disable button)
    setActiveWorkflows(prev => new Set(prev).add(step.id));

    // Call the parent to start a new workflow
    onStartNewWorkflow(step.workflow);

    // Keep the current document selected in the planning panel
    setActiveDocId(step.id);
  }, [onStartNewWorkflow]);

  if (!projectPath) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>프로젝트를 선택해주세요</p>
      </div>
    );
  }

  if (isLoading && documents.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Progress Header */}
      <div className="flex-shrink-0 border-b px-4 py-3 bg-muted/30">
        <div className="flex items-center gap-1 justify-center mb-2">
          {WORKFLOW_SEQUENCE.map((step, index) => {
            const doc = documents.find(d => d.id === step.id);
            const isCompleted = doc?.exists;
            const isNext = progress.nextStep?.id === step.id;
            const isActive = activeDocId === step.id;

            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => handleTabClick(step.id)}
                  disabled={!isTabEnabled(index)}
                  className={cn(
                    "flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all",
                    isActive && "bg-primary/10",
                    isTabEnabled(index) ? "cursor-pointer hover:bg-muted/50" : "cursor-not-allowed opacity-50"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className={cn(
                      "h-5 w-5",
                      isNext ? "text-amber-500" : "text-muted-foreground/40"
                    )} />
                  )}
                  <span className={cn(
                    "text-[10px] font-medium",
                    isCompleted && "text-primary",
                    isNext && "text-amber-600 dark:text-amber-400",
                    !isCompleted && !isNext && "text-muted-foreground/60"
                  )}>
                    {step.title}
                  </span>
                </button>
                {index < WORKFLOW_SEQUENCE.length - 1 && (
                  <div className={cn(
                    "w-4 h-px",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/20"
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <div className="text-center text-xs text-muted-foreground">
          {progress.completed}/{progress.total} 문서 완료
        </div>
      </div>

      {/* Sidebar Tabs + Document Content */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <div className="w-36 flex-shrink-0 border-r bg-muted/20 py-2 overflow-y-auto">
          {WORKFLOW_SEQUENCE.map((step, index) => {
            const doc = documents.find(d => d.id === step.id);
            const isEnabled = isTabEnabled(index);
            const isActive = activeDocId === step.id;

            return (
              <button
                key={step.id}
                onClick={() => handleTabClick(step.id)}
                disabled={!isEnabled}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium border-r-2 border-primary"
                    : isEnabled
                      ? "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      : "text-muted-foreground/40 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-2">
                  {doc?.exists ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 flex-shrink-0" />
                  )}
                  <span className="truncate">{step.title}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Document Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {activeDoc?.exists && activeDoc.content ? (
            // Show document content
            <PlanningDocViewer content={activeDoc.content} />
          ) : (
            // Show start workflow prompt
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center mb-4 mx-auto">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>

                {activeStep && (
                  progress.nextStep?.id === activeDocId ? (
                    // This is the next step to work on
                    <>
                      <p className="text-lg font-medium mb-2">
                        {activeStep.title} 문서 작성
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        버튼을 클릭하면 AI가 자동으로 문서 작성을 시작합니다
                      </p>
                      <Button
                        onClick={() => handleStartWorkflow(activeStep)}
                        disabled={isSessionLoading || activeWorkflows.has(activeStep.id)}
                        size="lg"
                        className="gap-2"
                      >
                        {activeWorkflows.has(activeStep.id) ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            작성 중...
                          </>
                        ) : (
                          <>
                            <PlayCircle className="h-5 w-5" />
                            {activeStep.title} 작성 시작
                          </>
                        )}
                      </Button>
                    </>
                  ) : isTabEnabled(WORKFLOW_SEQUENCE.findIndex(s => s.id === activeDocId)) ? (
                    // Tab is enabled but document doesn't exist yet (can start)
                    <>
                      <p className="text-lg font-medium mb-2">
                        {activeStep.title} 문서 작성
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        이 문서를 다시 작성하려면 아래 버튼을 클릭하세요
                      </p>
                      <Button
                        onClick={() => handleStartWorkflow(activeStep)}
                        disabled={isSessionLoading || activeWorkflows.has(activeStep.id)}
                        variant="outline"
                        size="lg"
                        className="gap-2"
                      >
                        {activeWorkflows.has(activeStep.id) ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            작성 중...
                          </>
                        ) : (
                          <>
                            <PlayCircle className="h-5 w-5" />
                            {activeStep.title} 작성하기
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    // Tab is locked (previous doc not complete)
                    <>
                      <p className="text-sm font-medium mb-1">
                        {activeStep.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        이전 문서를 먼저 작성해주세요
                      </p>
                    </>
                  )
                )}
              </div>
            </div>
          )}

          {/* Next Step Button (when current doc is complete and there's a next step) */}
          {activeDoc?.exists && progress.nextStep && activeDocId !== progress.nextStep.id && (
            <div className="flex-shrink-0 border-t p-4 bg-muted/30">
              <Button
                className="w-full gap-2"
                onClick={() => handleStartWorkflow(progress.nextStep!)}
                disabled={isSessionLoading || activeWorkflows.has(progress.nextStep.id)}
              >
                {activeWorkflows.has(progress.nextStep.id) ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    작성 중...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4" />
                    다음: {progress.nextStep.title} 작성하기
                  </>
                )}
              </Button>
            </div>
          )}

          {/* All Complete Message */}
          {progress.isAllComplete && (
            <div className="flex-shrink-0 border-t p-4 bg-primary/5">
              <div className="text-center">
                <p className="text-sm font-medium text-primary mb-1">
                  모든 기획 문서가 완료되었습니다!
                </p>
                <p className="text-xs text-muted-foreground">
                  이제 개발문서 탭에서 개발을 시작할 수 있습니다
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanningDocsPanel;
