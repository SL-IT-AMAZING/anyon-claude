import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle2, ArrowRight, PlayCircle, ChevronLeft, ChevronRight, FileText , Loader2, AlertCircle, RefreshCw, BookOpen, Search } from '@/lib/icons';
import prdIcon from '@/assets/prd-icon.png';
import uiuxIcon from '@/assets/uiux-icon.png';
import trdIcon from '@/assets/trd-icon.png';
import architectureIcon from '@/assets/architecture-icon.png';
import erdIcon from '@/assets/erd-icon.png';
import designIcon from '@/assets/design-icon.png';
import { PanelHeader, StatusBadge } from '@/components/ui/panel-header';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePlanningDocs } from '@/hooks/usePlanningDocs';
import { WORKFLOW_SEQUENCE, type WorkflowStep, getWorkflowPrompt, type BmadPhase } from '@/constants/planning';
import { PlanningDocViewer } from './PlanningDocViewer';
import type { TrackId } from '@/types/track';
import { UXPreviewPanel } from './UXPreviewPanel';
import type { SessionError } from '@/components/ClaudeCodeSession';

/** BMAD 4단계 구조 정의 */
const BMAD_PHASES: { id: BmadPhase; label: string; color: string }[] = [
  { id: 'analysis', label: 'Analysis', color: 'text-blue-500' },
  { id: 'plan', label: 'Plan', color: 'text-purple-500' },
  { id: 'solutioning', label: 'Solutioning', color: 'text-amber-500' },
];

interface PlanningDocsPanelProps {
  projectPath: string | undefined;
  onStartWorkflow: (workflowPrompt: string, displayText?: string) => void;
  isSessionLoading?: boolean;
  onPlanningComplete?: () => void;
  /** Session error (e.g., token limit exceeded) */
  sessionError?: SessionError | null;
  /** Callback to resume workflow after error */
  onResumeWorkflow?: (workflowPrompt: string, displayText?: string) => void;
  /** Track-specific workflows (optional, defaults to MVP workflow) */
  workflows?: WorkflowStep[];
  /** Track ID for UI customization */
  trackId?: TrackId;
}

/**
 * Planning Documents Panel
 * Displays the 6-step workflow progress and document viewer
 */
export const PlanningDocsPanel: React.FC<PlanningDocsPanelProps> = ({
  projectPath,
  onStartWorkflow,
  isSessionLoading = false,
  onPlanningComplete,
  sessionError,
  onResumeWorkflow,
  workflows = WORKFLOW_SEQUENCE,
  trackId = 'mvp',
}) => {
  // Use provided workflows or default to MVP workflow
  const workflowSequence = workflows;
  const isBmadTrack = trackId === 'bmad';
  const { documents, isLoading, progress } = usePlanningDocs(projectPath, workflowSequence);
  const [activeDocId, setActiveDocId] = useState<string>('prd');
  const [activeWorkflows, setActiveWorkflows] = useState<Set<string>>(new Set());
  const hasTriggeredComplete = useRef(false);

  // Trigger completion modal once when all planning is complete
  useEffect(() => {
    if (progress.isAllComplete && onPlanningComplete && !hasTriggeredComplete.current) {
      hasTriggeredComplete.current = true;
      onPlanningComplete();
    }
  }, [progress.isAllComplete, onPlanningComplete]);

  // Reset trigger when project changes
  useEffect(() => {
    hasTriggeredComplete.current = false;
  }, [projectPath]);

  // 이전 문서 상태 추적용 ref (자동 탭 전환용)
  const prevDocsRef = React.useRef<typeof documents>([]);

  // Clear active workflows when documents are created (only when file actually exists)
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

  // 새 문서 생성 시 자동 탭 전환
  React.useEffect(() => {
    // 초기 로드 시 스킵
    if (prevDocsRef.current.length === 0) {
      prevDocsRef.current = documents;
      return;
    }

    // 이전에 없었는데 새로 생긴 문서 찾기
    const newlyCreatedDoc = documents.find(doc => {
      const prevDoc = prevDocsRef.current.find(p => p.id === doc.id);
      return doc.exists && (!prevDoc || !prevDoc.exists);
    });

    if (newlyCreatedDoc) {
      console.log('[PlanningDocsPanel] Auto-switching to newly created doc:', newlyCreatedDoc.id);
      setActiveDocId(newlyCreatedDoc.id);
    }

    prevDocsRef.current = documents;
  }, [documents]);

  const activeDoc = documents.find(d => d.id === activeDocId);
  const activeStep = workflowSequence.find(s => s.id === activeDocId);
  const activeStepIndex = workflowSequence.findIndex(s => s.id === activeDocId);

  // Check if a tab is enabled (previous doc must exist)
  const isTabEnabled = useCallback((index: number): boolean => {
    if (index === 0) return true;
    const prevStep = workflowSequence[index - 1];
    return documents.some(d => d.id === prevStep.id && d.exists);
  }, [documents, workflowSequence]);

  // Handle tab click with lock check
  const handleTabClick = useCallback((stepId: string) => {
    const stepIndex = workflowSequence.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return;

    if (!isTabEnabled(stepIndex)) {
      return;
    }

    setActiveDocId(stepId);
  }, [isTabEnabled, workflowSequence]);

  // Start workflow for a step
  const handleStartWorkflow = useCallback((step: WorkflowStep) => {
    if (!step?.id) {
      console.warn('[PlanningDocsPanel] handleStartWorkflow called with invalid step');
      return;
    }

    // 프롬프트 체크를 먼저 수행 - 없으면 조기 종료
    const workflowPrompt = getWorkflowPrompt(step);
    if (!workflowPrompt) {
      console.warn('[PlanningDocsPanel] No workflow prompt for step:', step.id);
      return;
    }

    // 프롬프트가 있을 때만 상태 업데이트
    setActiveWorkflows(prev => new Set(prev).add(step.id));
    onStartWorkflow(workflowPrompt, step.displayText);
    setActiveDocId(step.id);
  }, [onStartWorkflow]);

  // Navigate to next/prev document
  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    const currentIndex = workflowSequence.findIndex(s => s.id === activeDocId);
    if (direction === 'prev' && currentIndex > 0) {
      const prevStep = workflowSequence[currentIndex - 1];
      if (isTabEnabled(currentIndex - 1)) {
        setActiveDocId(prevStep.id);
      }
    } else if (direction === 'next' && currentIndex < workflowSequence.length - 1) {
      const nextStep = workflowSequence[currentIndex + 1];
      if (isTabEnabled(currentIndex + 1)) {
        setActiveDocId(nextStep.id);
      }
    }
  }, [activeDocId, isTabEnabled, workflowSequence]);

  // Handle resume workflow after token limit error
  const handleResumeCurrentWorkflow = useCallback(() => {
    if (!activeStep || !onResumeWorkflow) return;

    const workflowPrompt = getWorkflowPrompt(activeStep);
    if (!workflowPrompt) return;

    // Create a continuation prompt
    const continuePrompt = `이전 작업이 토큰 한도로 인해 중단되었습니다. 중단된 지점부터 ${activeStep.title} 문서 작성을 이어서 진행해주세요.

지침:
1. 기존에 작성된 내용을 확인하고 이어서 작성
2. 문서가 완성되지 않았다면 남은 부분 완성
3. 이미 완성되었다면 검토 후 저장`;

    setActiveWorkflows(prev => new Set(prev).add(activeStep.id));
    onResumeWorkflow(continuePrompt, `${activeStep.title} 이어서 작성`);
  }, [activeStep, onResumeWorkflow]);

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
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const canGoPrev = activeStepIndex > 0 && isTabEnabled(activeStepIndex - 1);
  const canGoNext = activeStepIndex < workflowSequence.length - 1 && isTabEnabled(activeStepIndex + 1);

  return (
    <div className="h-full flex flex-col">
      {/* 상단 통일 헤더 */}
      <PanelHeader
        icon={<FileText className="w-4 h-4" />}
        title={activeStep?.title || 'Document'}
        subtitle={`${activeStepIndex + 1}/${workflowSequence.length}`}
        badge={
          activeDoc?.exists ? (
            <StatusBadge variant="success">완료</StatusBadge>
          ) : progress.isAllComplete ? (
            <StatusBadge variant="success">{progress.completed}/{progress.total}</StatusBadge>
          ) : (
            <StatusBadge variant="muted">{progress.completed}/{progress.total}</StatusBadge>
          )
        }
        actions={
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleNavigate('prev')}
              disabled={!canGoPrev}
              className={cn(
                "p-1.5 rounded-md hover:bg-muted transition-colors",
                !canGoPrev && "opacity-30 cursor-not-allowed"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleNavigate('next')}
              disabled={!canGoNext}
              className={cn(
                "p-1.5 rounded-md hover:bg-muted transition-colors",
                !canGoNext && "opacity-30 cursor-not-allowed"
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        }
      />

      {/* 프로그레스 바 영역 */}
      <div className="flex-shrink-0 border-b px-4 py-3 bg-background">
        {/* BMAD 트랙: 4단계 그룹 헤더 */}
        {isBmadTrack && (
          <div className="flex items-center justify-center gap-1 mb-3 pb-2 border-b border-border/50">
            {BMAD_PHASES.map((phase, idx) => {
              const phaseSteps = workflowSequence.filter(s => s.phase === phase.id);
              const phaseCompleted = phaseSteps.every(s =>
                documents.find(d => d.id === s.id)?.exists
              );
              const phaseInProgress = phaseSteps.some(s =>
                documents.find(d => d.id === s.id)?.exists
              ) && !phaseCompleted;

              return (
                <div key={phase.id} className="flex items-center">
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all",
                    phaseCompleted && "bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400",
                    phaseInProgress && `bg-opacity-10 ${phase.color.replace('text-', 'bg-')} ${phase.color}`,
                    !phaseCompleted && !phaseInProgress && "text-muted-foreground"
                  )}>
                    {phaseCompleted && <CheckCircle2 className="w-3 h-3" />}
                    <span>{phase.label}</span>
                  </div>
                  {idx < BMAD_PHASES.length - 1 && (
                    <ChevronRight className="w-3 h-3 text-muted-foreground/50 mx-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 단계 인디케이터 + 레이블 통합 */}
        <div className={cn(
          "flex",
          isBmadTrack ? "flex-wrap gap-2 justify-center" : "justify-between"
        )}>
          {workflowSequence.map((step, index) => {
            const doc = documents.find(d => d.id === step.id);
            const isCompleted = doc?.exists;
            const isActive = activeDocId === step.id;
            const isEnabled = isTabEnabled(index);

            // 짧은 약어 매핑 (MVP + BMAD)
            const shortLabel: Record<string, string> = {
              // MVP
              'prd': 'PRD',
              'ux-design': 'UX',
              'design-guide': 'UI',
              'trd': 'TRD',
              'architecture': 'Arch',
              'erd': 'ERD',
              // BMAD
              'product-brief': 'Brief',
              'research': 'Research',
              'epics-stories': 'Stories',
              'readiness-check': 'Ready',
            };

            // BMAD 트랙: 단계별 색상 적용
            const getPhaseColor = () => {
              if (!isBmadTrack || !step.phase) return '';
              const phase = BMAD_PHASES.find(p => p.id === step.phase);
              return phase?.color || '';
            };

            return (
              <button
                key={step.id}
                onClick={() => handleTabClick(step.id)}
                disabled={!isEnabled}
                className={cn(
                  "flex flex-col items-center gap-1.5 group",
                  isEnabled && "cursor-pointer",
                  !isEnabled && "cursor-not-allowed",
                  isBmadTrack && "min-w-[50px]"
                )}
                title={step.title}
              >
                {/* 인디케이터 점 */}
                <div
                  className={cn(
                    "w-3 h-3 rounded-full border-2 transition-all",
                    isCompleted && "bg-primary border-primary",
                    !isCompleted && isEnabled && "bg-background border-muted-foreground/40",
                    !isCompleted && !isEnabled && "bg-muted border-muted-foreground/20",
                    isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                    isEnabled && "group-hover:scale-110"
                  )}
                />
                {/* 레이블 */}
                <span
                  className={cn(
                    "text-[10px] transition-colors",
                    isActive && "text-foreground font-medium",
                    !isActive && isEnabled && "text-muted-foreground group-hover:text-foreground",
                    !isEnabled && "text-muted-foreground/50",
                    isBmadTrack && isActive && getPhaseColor()
                  )}
                >
                  {shortLabel[step.id] || step.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* 프로그레스 바 */}
        <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{
              width: progress.completed === 0
                ? '0%'
                : `${((progress.completed - 1) / (progress.total - 1)) * 100}%`
            }}
          />
        </div>
      </div>

      {/* 문서 콘텐츠 영역 */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {activeDoc?.exists && activeDoc.content ? (
          // UX Design step uses UXPreviewPanel with element selection
          activeDocId === 'ux-design' && activeDoc.filename.endsWith('.html') ? (
            <UXPreviewPanel
              content={activeDoc.content}
              projectPath={projectPath}
            />
          ) : (
            // Other documents use simple PlanningDocViewer
            <PlanningDocViewer content={activeDoc.content} filename={activeDoc.filename} />
          )
        ) : (
          // 작성 시작 프롬프트
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-64 h-64 rounded-xl flex items-center justify-center mb-4 mx-auto">
                {/* BMAD 전용 아이콘 */}
                {isBmadTrack && (activeDocId === 'product-brief' || activeDocId === 'research' || activeDocId === 'epics-stories' || activeDocId === 'readiness-check') ? (
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    {activeDocId === 'product-brief' && <BookOpen className="w-16 h-16 text-blue-500" />}
                    {activeDocId === 'research' && <Search className="w-16 h-16 text-blue-500" />}
                    {activeDocId === 'epics-stories' && <FileText className="w-16 h-16 text-amber-500" />}
                    {activeDocId === 'readiness-check' && <CheckCircle2 className="w-16 h-16 text-amber-500" />}
                  </div>
                ) : (
                  <img
                    src={
                      activeDocId === 'ux-design' ? uiuxIcon :
                      activeDocId === 'design-guide' ? designIcon :
                      activeDocId === 'trd' ? trdIcon :
                      activeDocId === 'architecture' ? architectureIcon :
                      activeDocId === 'erd' ? erdIcon :
                      prdIcon
                    }
                    alt={
                      activeDocId === 'ux-design' ? 'UX Design' :
                      activeDocId === 'design-guide' ? 'Design Guide' :
                      activeDocId === 'trd' ? 'TRD' :
                      activeDocId === 'architecture' ? 'Architecture' :
                      activeDocId === 'erd' ? 'ERD' :
                      'PRD'
                    }
                    className="w-64 h-64 object-contain logo-invert"
                  />
                )}
              </div>

              {activeStep && (
                isTabEnabled(activeStepIndex) ? (
                  <>
                    <p className="text-lg font-medium mb-2">
                      {activeStep.title}
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                      {progress.nextStep?.id === activeDocId
                        ? '버튼을 클릭하면 AI가 자동으로 문서 작성을 시작합니다'
                        : '이 문서를 다시 작성하려면 아래 버튼을 클릭하세요'}
                    </p>
                    <Button
                      onClick={() => handleStartWorkflow(activeStep)}
                      disabled={isSessionLoading || activeWorkflows.has(activeStep.id)}
                      size="lg"
                      className="gap-2 w-full max-w-xs"
                    >
                      {/* 워크플로우 실행 중이거나, 문서가 아직 없는 상태에서 세션 로딩 중일 때 "작성중..." 표시 */}
                      {activeWorkflows.has(activeStep.id) || (isSessionLoading && !documents.find(d => d.id === activeStep.id)?.content) ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {activeStep.title} 작성중...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-5 w-5" />
                          {activeStep.title} 작성 시작
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium mb-1 text-muted-foreground">
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
      </div>

      {/* 토큰 한도 에러 발생 시 이어서 작성하기 배너 */}
      {sessionError?.isTokenLimitError && sessionError.canResume && !isSessionLoading && (
        <div className="flex-shrink-0 border-t p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50">
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                작성이 중단되었습니다
              </p>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                응답 토큰 한도에 도달했습니다. 아래 버튼을 클릭하여 이어서 작성할 수 있습니다.
              </p>
            </div>
          </div>
          <Button
            onClick={handleResumeCurrentWorkflow}
            size="lg"
            className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <RefreshCw className="h-4 w-4" />
            {activeStep?.title} 이어서 작성하기
          </Button>
        </div>
      )}

      {/* 하단 CTA 영역 */}
      {activeDoc?.exists && progress?.nextStep?.id && !sessionError?.isTokenLimitError && (
        <div className="flex-shrink-0 border-t p-4 bg-gradient-to-r from-primary/5 to-primary/10">
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={() => {
              const nextStep = progress.nextStep;
              if (nextStep?.id) {
                setActiveDocId(nextStep.id);
                handleStartWorkflow(nextStep);
              }
            }}
            disabled={isSessionLoading || !progress.nextStep || activeWorkflows.has(progress.nextStep.id)}
          >
            {/* 워크플로우 실행 중이거나, 문서가 아직 없는 상태에서 세션 로딩 중일 때 "작성중..." 표시 */}
            {(progress.nextStep && activeWorkflows.has(progress.nextStep.id)) ||
             (isSessionLoading && progress.nextStep && !documents.find(d => d.id === progress.nextStep?.id)?.content) ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {progress.nextStep?.title} 작성중...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4" />
                다음: {progress.nextStep?.title || '다음 단계'} 작성하기
              </>
            )}
          </Button>
        </div>
      )}

      {/* 모든 문서 완료 메시지 */}
      {progress.isAllComplete && (
        <div className="flex-shrink-0 border-t p-4 bg-primary/5">
          <div className="flex items-center justify-center gap-2 text-primary">
            <CheckCircle2 className="h-5 w-5" />
            <p className="text-sm font-medium">
              모든 기획 문서가 완료되었습니다
            </p>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-1">
            개발문서 탭에서 개발을 시작할 수 있습니다
          </p>
        </div>
      )}

    </div>
  );
};

export default PlanningDocsPanel;
