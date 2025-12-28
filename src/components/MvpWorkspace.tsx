import React, { useEffect, useState, Suspense, lazy, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  FileText,
  Code,
  Monitor,
  X,
  ArrowLeft,
  Wrench,
  PanelRightClose,
  PanelRightOpen,
  Loader2,
  History,
} from "@/lib/icons";
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useProjects, useProjectsNavigation } from '@/components/ProjectRoutes';
import { PlanningDocsPanel } from '@/components/planning';
import { DevDocsPanel, DevDocsPanelRef } from '@/components/development';
import { EnhancedPreviewPanel } from '@/components/preview';
import { VersionControlPanel } from '@/components/version-control';
import { WorkspaceSidebar } from '@/components/WorkspaceSidebar';
import { FloatingHelpButton, AIChatModal, PlanningCompleteModal, PreviewWelcomeModal } from '@/components/help';
import { SUPPORT_CONFIG } from '@/constants/support';
import { Settings } from '@/components/Settings';
import { usePlanningDocs } from '@/hooks/usePlanningDocs';
import { useWorkflowPreview } from '@/hooks/useWorkflowPreview';
import type { Project, Session } from '@/lib/api';
import { api } from '@/lib/api';
import type { ClaudeCodeSessionRef } from '@/components/ClaudeCodeSession';
import { SessionPersistenceService } from '@/services/sessionPersistence';
import { cn } from '@/lib/utils';
import { usePreviewStore } from '@/stores/previewStore';

// Lazy load components
const ClaudeCodeSession = lazy(() =>
  import('@/components/ClaudeCodeSession').then(m => ({ default: m.ClaudeCodeSession }))
);
const FileTree = lazy(() => import('@/components/FileTree'));

// Preview Tab Button with live status from store
const PreviewTabButton: React.FC<{ isActive: boolean; onClick: () => void }> = ({ isActive, onClick }) => {
  const { devServerRunning, isLoading, previewError } = usePreviewStore();
  
  const getStatusBadge = () => {
    if (isLoading) {
      return (
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          시작중
        </span>
      );
    }
    if (previewError) {
      return (
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
          에러
        </span>
      );
    }
    if (devServerRunning) {
      return (
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          연결됨
        </span>
      );
    }
    return (
      <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
        오프라인
      </span>
    );
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors border-b-2",
        isActive
          ? "border-primary text-primary bg-primary/5"
          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      <Monitor className="w-4 h-4" />
      <span>프리뷰</span>
      {getStatusBadge()}
    </button>
  );
};

type MvpTabType = 'planning' | 'development' | 'preview';

interface MvpWorkspaceProps {
  projectId: string;
}

/**
 * MvpWorkspace - MVP Development workspace with Lovable/Bolt style layout
 *
 * Layout:
 * ┌────────┬─────────────────┬──────────────────────┐
 * │Sidebar │     Chat        │   Planning/Dev/      │
 * │ (56px) │  (flexible)     │   Preview Tabs       │
 * └────────┴─────────────────┴──────────────────────┘
 */
export const MvpWorkspace: React.FC<MvpWorkspaceProps> = ({ projectId }) => {
  const { goToProject, goToProjectList, goToMaintenance } = useProjectsNavigation();
  const { projects, loading, getProjectById } = useProjects();
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<MvpTabType>('planning');
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessionKey, _setSessionKey] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showPlanningCompleteModal, setShowPlanningCompleteModal] = useState(false);
  const [showPreviewWelcomeModal, setShowPreviewWelcomeModal] = useState(false);
  const [hasShownPreviewWelcome, setHasShownPreviewWelcome] = useState(false);

  // Sidebar state - collapsed by default
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [filePanelOpen, setFilePanelOpen] = useState(false);
  const filePanelWidth = 280;

  // Version control panel state
  const [versionPanelOpen, setVersionPanelOpen] = useState(false);
  const versionPanelWidth = 320;

  // Right panel state
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  const [rightPanelWidth, setRightPanelWidth] = useState(45); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ref for ClaudeCodeSession
  const claudeSessionRef = useRef<ClaudeCodeSessionRef>(null);
  
  // Ref for DevDocsPanel
  const devDocsPanelRef = useRef<DevDocsPanelRef>(null);

  // Check planning docs completion
  const { progress } = usePlanningDocs(project?.path);
  const isPlanningComplete = progress.isAllComplete;

  // Workflow preview file detection (e.g., ui-ux.html from startup-ux workflow)
  const [workflowPreviewPath, setWorkflowPreviewPath] = useState<string | null>(null);

  const handlePreviewFileDetected = useCallback((filePath: string) => {
    console.log('[MvpWorkspace] Preview file detected:', filePath);
    setWorkflowPreviewPath(filePath);
    // 자동으로 프리뷰 탭으로 전환
    setActiveTab('preview');
    // 패널이 닫혀있으면 열기
    if (!rightPanelVisible) {
      setRightPanelVisible(true);
    }
  }, [rightPanelVisible]);

  const { hasNewPreview, markPreviewSeen } = useWorkflowPreview({
    projectPath: project?.path,
    onPreviewFileDetected: handlePreviewFileDetected,
    pollingInterval: 1000,
  });

  // 프리뷰 탭으로 전환하면 새 프리뷰 표시 제거
  useEffect(() => {
    if (activeTab === 'preview' && hasNewPreview) {
      markPreviewSeen();
    }
  }, [activeTab, hasNewPreview, markPreviewSeen]);

  useEffect(() => {
    if (projectId && projects.length > 0) {
      const found = getProjectById(projectId);
      setProject(found);
    }
  }, [projectId, projects, getProjectById]);

  // Load last session
  useEffect(() => {
    if (project?.path) {
      try {
        const lastSessionData = SessionPersistenceService.getLastSessionDataForTab(project.path, 'mvp');
        console.log('[MvpWorkspace] Last session data:', lastSessionData);
        if (lastSessionData) {
          const session = SessionPersistenceService.createSessionFromRestoreData(lastSessionData);
          console.log('[MvpWorkspace] Created session:', session);
          if (session) {
            setCurrentSession(session);
          }
        } else {
          console.log('[MvpWorkspace] No last session data found for path:', project.path);
        }
      } catch (err) {
        console.error('[MvpWorkspace] Failed to load last session:', err);
      }
    }
  }, [project?.path]);

  // Git repo check
  useEffect(() => {
    const checkGitRepo = async () => {
      if (!project?.path) return;
      
      try {
        const isGitRepo = await api.checkIsGitRepo(project.path);
        if (!isGitRepo) {
          const gitResult = await api.initGitRepo(project.path);
          if (gitResult?.success) {
            console.log('[MvpWorkspace] Git repository initialized successfully');
          }
        }
      } catch (gitErr) {
        // Git init failure is not critical, just log it
        console.warn('[MvpWorkspace] Failed to check/init git repo:', gitErr);
      }
    };
    checkGitRepo();
  }, [project?.path]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (modKey) {
        switch (e.key) {
          case 'b':
          case 'B':
            e.preventDefault();
            setFilePanelOpen(prev => !prev);
            break;
          case '\\':
            e.preventDefault();
            setRightPanelVisible(prev => !prev);
            break;
          case 'h':
          case 'H':
            e.preventDefault();
            setVersionPanelOpen(prev => !prev);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Resize handling with requestAnimationFrame for smooth performance
  useEffect(() => {
    if (!isDragging) return;

    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      // Cancel any pending animation frame
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const sidebarWidth = sidebarCollapsed ? 56 : 220; // Correct sidebar widths
        const filePanelW = filePanelOpen ? filePanelWidth : 0;
        const availableWidth = rect.width - sidebarWidth - filePanelW;
        const mouseX = e.clientX - rect.left - sidebarWidth - filePanelW;
        const newRightWidth = ((availableWidth - mouseX) / availableWidth) * 100;
        setRightPanelWidth(Math.max(25, Math.min(70, newRightWidth)));
      });
    };

    const handleMouseUp = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, filePanelOpen, filePanelWidth, sidebarCollapsed]);

  const handleBack = () => {
    if (projectId) {
      goToProject(projectId);
    } else {
      goToProjectList();
    }
  };

  const handleStreamingChange = useCallback((isStreaming: boolean) => {
    setIsSessionLoading(isStreaming);
  }, []);

  // Start a new workflow (new conversation) from PlanningDocsPanel
  const handleStartNewWorkflow = useCallback((workflowPrompt: string, userMessage?: string) => {
    setCurrentSession(null);
    if (claudeSessionRef.current) {
      // Start a new session with the workflow prompt and optional user message
      claudeSessionRef.current.startNewSession(workflowPrompt, userMessage);
    }
  }, []);

  const handleSessionCreated = useCallback((sessionId: string) => {
    if (!sessionId) {
      console.warn('[MvpWorkspace] handleSessionCreated called with empty sessionId');
      return;
    }
    if (project?.path && project?.id) {
      try {
        SessionPersistenceService.saveLastSessionForTab(project.path, 'mvp', sessionId, project.id);
      } catch (err) {
        console.error('[MvpWorkspace] Failed to save session:', err);
      }
    }
  }, [project?.path, project?.id]);

  // Callback when all planning docs are complete
  const handlePlanningComplete = useCallback(() => {
    setShowPlanningCompleteModal(true);
  }, []);

  // Proceed to development after planning complete
  const handleProceedWithAI = useCallback(() => {
    setActiveTab('development');
  }, []);

  // Open KakaoTalk channel for support
  const handleContactSupport = useCallback(() => {
    window.open(SUPPORT_CONFIG.KAKAO_CHANNEL_URL, '_blank');
  }, []);

  // Handle preview tab click - show welcome modal on first visit
  const handlePreviewTabClick = useCallback(() => {
    if (!hasShownPreviewWelcome) {
      setShowPreviewWelcomeModal(true);
      setHasShownPreviewWelcome(true);
    }
    setActiveTab('preview');
  }, [hasShownPreviewWelcome]);

  // View preview action from modal
  const handleViewPreview = useCallback(() => {
    setActiveTab('preview');
  }, []);

  // Handle stop workflow signal from chat input stop button
  const handleStopWorkflow = useCallback(() => {
    // Propagate stop signal to DevDocsPanel to stop automated workflow progression
    devDocsPanelRef.current?.stop();
  }, []);

  const projectName = project?.path.split('/').pop() || 'Project';

  // Show loading if:
  // 1. projects are being fetched (loading)
  // 2. OR projects are loaded but project state hasn't been set yet (race condition fix)
  //    This prevents ClaudeCodeSession from receiving undefined projectPath on first render
  const isProjectLoading = loading || (projectId && projects.length > 0 && !project);

  if (isProjectLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // At this point: loading = false, projects loaded, and project state has been set
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="outline" onClick={() => goToProjectList()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  // Show settings view
  if (showSettings) {
    return (
      <div className="h-full flex overflow-hidden bg-background">
        <WorkspaceSidebar
          projectPath={project?.path || ''}
          tabType="mvp"
          onLogoClick={() => setShowSettings(false)}
          onSettingsClick={() => setShowSettings(false)}
          collapsed={sidebarCollapsed}
          onCollapseToggle={() => setSidebarCollapsed(prev => !prev)}
        />
        <div className="flex-1 h-full overflow-y-auto">
          <Settings onBack={() => setShowSettings(false)} />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full flex overflow-hidden bg-background">
      {/* Sidebar */}
      <WorkspaceSidebar
        projectPath={project?.path || ''}
        tabType="mvp"
        onLogoClick={goToProjectList}
        onSettingsClick={() => setShowSettings(true)}
        collapsed={sidebarCollapsed}
        onCollapseToggle={() => setSidebarCollapsed(prev => !prev)}
      />

      {/* File Panel */}
      <AnimatePresence>
        {filePanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: filePanelWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full border-r border-border bg-background flex flex-col overflow-hidden flex-shrink-0"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-sm font-medium">Files</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFilePanelOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <Suspense fallback={<div className="p-4"><Loader2 className="h-4 w-4 animate-spin" /></div>}>
                {project?.path && (
                  <FileTree
                    rootPath={project.path}
                    onFileSelect={(file) => console.log('File selected:', file)}
                  />
                )}
              </Suspense>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 h-full overflow-hidden flex flex-col">
        {/* Header with Breadcrumb */}
        <div className="flex-shrink-0 h-12 flex items-center justify-between px-4">
          <Breadcrumb
            items={[
              {
                label: projectName,
                isProjectSelector: true,
                currentProjectPath: project?.path,
                onProjectSelect: (selectedProject) => {
                  const targetProject = projects.find(p => p.path === selectedProject.path);
                  if (targetProject) {
                    goToProject(targetProject.id);
                  }
                },
              },
              {
                label: 'MVP 개발',
                icon: <Lightbulb className="w-4 h-4" />,
                dropdownOptions: [
                  {
                    label: 'MVP 개발',
                    value: 'mvp',
                    icon: <Lightbulb className="w-4 h-4" />,
                    description: '새로운 기능 개발',
                  },
                  {
                    label: '유지보수',
                    value: 'maintenance',
                    icon: <Wrench className="w-4 h-4" />,
                    description: '버그 수정 및 개선',
                  },
                ],
                dropdownValue: 'mvp',
                onDropdownSelect: (value) => {
                  if (value === 'maintenance' && projectId) {
                    goToMaintenance(projectId);
                  }
                },
              },
            ]}
          />
          {/* Header Buttons */}
          <div className="flex items-center gap-1">
            {/* Version Control Toggle Button */}
            <button
              onClick={() => setVersionPanelOpen(prev => !prev)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors',
                versionPanelOpen
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
              title={versionPanelOpen ? '버전 관리 닫기 (Cmd+H)' : '버전 관리 열기 (Cmd+H)'}
            >
              <History className="w-4 h-4" />
              <span>버전기록</span>
            </button>

            {/* Panel Toggle Button */}
            <button
              onClick={() => setRightPanelVisible(prev => !prev)}
              className={cn(
                'p-2 rounded-md transition-colors',
                rightPanelVisible
                  ? 'text-primary hover:bg-primary/10'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
              title={rightPanelVisible ? '패널 숨기기 (Cmd+\\)' : '패널 보기 (Cmd+\\)'}
            >
              {rightPanelVisible ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <ClaudeCodeSession
              key={sessionKey}
              ref={claudeSessionRef}
              session={currentSession || undefined}
              initialProjectPath={project?.path}
              onBack={handleBack}
              onProjectPathChange={() => {}}
              onStreamingChange={handleStreamingChange}
              embedded={true}
              tabType="mvp"
              onSessionCreated={handleSessionCreated}
              onStopWorkflow={handleStopWorkflow}
            />
          </Suspense>
        </div>
      </div>

      {/* Right Panel (Planning/Dev/Preview) */}
      <AnimatePresence>
        {rightPanelVisible && (
          <>
            {/* Resize Handle */}
            <div
              className={cn(
                'w-1 h-full cursor-col-resize flex-shrink-0 hover:bg-primary/50 transition-colors',
                isDragging && 'bg-primary'
              )}
              onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
            />

            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: `${rightPanelWidth}%`, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full bg-background border-l border-border overflow-hidden flex flex-col shadow-[-2px_0_8px_rgba(0,0,0,0.08)]"
            >
              {/* Tabs Header with Status Badges */}
              <div className="flex-shrink-0 border-b border-border bg-card/50">
                <div className="flex">
                  {/* 기획문서 탭 */}
                  <button
                    onClick={() => setActiveTab('planning')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors border-b-2",
                      activeTab === 'planning'
                        ? "border-primary text-primary bg-primary/5"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <FileText className="w-4 h-4" />
                    <span>기획문서</span>
                    {/* 진행률 배지 */}
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full",
                      progress.isAllComplete 
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {progress.completed}/{progress.total}
                    </span>
                  </button>

                  {/* 개발문서 탭 */}
                  <button
                    onClick={() => setActiveTab('development')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors border-b-2",
                      activeTab === 'development'
                        ? "border-primary text-primary bg-primary/5"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Code className="w-4 h-4" />
                    <span>개발문서</span>
                    {/* 상태 배지 */}
                    {!isPlanningComplete ? (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                        대기
                      </span>
                    ) : isSessionLoading && activeTab === 'development' ? (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        실행중
                      </span>
                    ) : (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        준비
                      </span>
                    )}
                  </button>

                  {/* 프리뷰 탭 */}
                  <PreviewTabButton
                    isActive={activeTab === 'preview'}
                    onClick={handlePreviewTabClick}
                  />
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                {activeTab === 'planning' && (
                  <PlanningDocsPanel
                    projectPath={project?.path}
                    onStartWorkflow={handleStartNewWorkflow}
                    isSessionLoading={isSessionLoading}
                    onPlanningComplete={handlePlanningComplete}
                  />
                )}
                {activeTab === 'development' && (
                  <DevDocsPanel
                    ref={devDocsPanelRef}
                    projectPath={project?.path}
                    isPlanningComplete={isPlanningComplete}
                    onStartWorkflow={handleStartNewWorkflow}
                    isSessionLoading={isSessionLoading}
                  />
                )}
                {activeTab === 'preview' && (
                  <EnhancedPreviewPanel
                    projectPath={project?.path}
                    projectId={project?.id}
                    htmlFilePath={workflowPreviewPath || undefined}
                  />
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Version Control Panel - 오버레이 형태 */}
      <AnimatePresence>
        {versionPanelOpen && (
          <>
            {/* 어두운 배경 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setVersionPanelOpen(false)}
            />

            {/* 패널 */}
            <motion.div
              initial={{ x: versionPanelWidth, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: versionPanelWidth, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed right-0 top-0 h-full border-l border-border bg-background flex flex-col overflow-hidden shadow-2xl z-50"
              style={{ width: versionPanelWidth }}
            >
              <VersionControlPanel
                projectPath={project?.path}
                onClose={() => setVersionPanelOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Drag overlay */}
      {isDragging && <div className="fixed inset-0 z-30 cursor-col-resize" />}

      {/* Floating Help Button */}
      <FloatingHelpButton />

      {/* AI Chat Modal */}
      <AIChatModal
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
      />

      {/* Planning Complete Modal */}
      <PlanningCompleteModal
        isOpen={showPlanningCompleteModal}
        onClose={() => setShowPlanningCompleteModal(false)}
        onProceedWithAI={handleProceedWithAI}
        onContactSupport={handleContactSupport}
      />

      {/* Preview Welcome Modal */}
      <PreviewWelcomeModal
        isOpen={showPreviewWelcomeModal}
        onClose={() => setShowPreviewWelcomeModal(false)}
        onViewPreview={handleViewPreview}
        onContactSupport={handleContactSupport}
      />
    </div>
  );
};

export default MvpWorkspace;
