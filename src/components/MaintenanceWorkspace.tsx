import React, { useEffect, useState, Suspense, lazy, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Wrench,
  X,
  Lightbulb,
  PanelRightClose,
  PanelRightOpen,
  Loader2,
  FileText,
  Code,
  Search,
  History,
} from "@/lib/icons";
import type { ExecutionMode } from './FloatingPromptInput';
import type { ClaudeCodeSessionRef } from '@/components/ClaudeCodeSession';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/Breadcrumb';
import { EnhancedPreviewPanel } from '@/components/preview';
import { WorkspaceSidebar } from '@/components/WorkspaceSidebar';
import { Settings } from '@/components/Settings';
import { useProjects, useProjectsNavigation } from '@/components/ProjectRoutes';
import type { Project, Session } from '@/lib/api';
import { api } from '@/lib/api';
import { SessionPersistenceService } from '@/services/sessionPersistence';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { VersionControlPanel } from '@/components/version-control';

// Lazy load components
const ClaudeCodeSession = lazy(() =>
  import('@/components/ClaudeCodeSession').then(m => ({ default: m.ClaudeCodeSession }))
);
const FileTree = lazy(() => import('@/components/FileTree'));



// Maintenance tab types
type MaintenanceTabType = 'planning' | 'development';

interface MaintenanceWorkspaceProps {
  projectId: string;
}

/**
 * MaintenanceWorkspace - Maintenance workspace with Lovable/Bolt style layout
 *
 * Layout:
 * ┌────────┬─────────────────┬──────────────────────┐
 * │Sidebar │     Chat        │   Preview (default)  │
 * │ (56px) │  (flexible)     │   or Code (toggle)   │
 * └────────┴─────────────────┴──────────────────────┘
 *
 * - Preview is shown by default
 * - Code view is toggled via </> button in header
 */
export const MaintenanceWorkspace: React.FC<MaintenanceWorkspaceProps> = ({ projectId }) => {
  const { goToProject, goToProjectList, goToMvp } = useProjectsNavigation();
  const { projects, loading, getProjectById } = useProjects();
  const { t } = useTranslation();
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessionKey, _setSessionKey] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  // Tab state - default to development mode
  const [activeTab, setActiveTab] = useState<MaintenanceTabType>('development');

  // Session loading state - to prevent tab switching during AI work
  const [isSessionLoading, setIsSessionLoading] = useState(false);

  // Sidebar state - collapsed by default
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [filePanelOpen, setFilePanelOpen] = useState(false);
  const filePanelWidth = 280;

  // Version control panel state
  const [versionPanelOpen, setVersionPanelOpen] = useState(false);
  const versionPanelWidth = 320;

  // ClaudeCodeSession ref for programmatic prompt sending
  const sessionRef = useRef<ClaudeCodeSessionRef>(null);

  // Right panel state
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  const [rightPanelWidth, setRightPanelWidth] = useState(45); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
        const lastSessionData = SessionPersistenceService.getLastSessionDataForTab(project.path, 'maintenance');
        if (lastSessionData) {
          const session = SessionPersistenceService.createSessionFromRestoreData(lastSessionData);
          if (session) {
            setCurrentSession(session);
          }
        }
      } catch (err) {
        console.error('[MaintenanceWorkspace] Failed to load last session:', err);
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
            console.log('[MaintenanceWorkspace] Git repository initialized successfully');
          }
        }
      } catch (gitErr) {
        // Git init failure is not critical, just log it
        console.warn('[MaintenanceWorkspace] Failed to check/init git repo:', gitErr);
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

  const handleSessionCreated = useCallback((sessionId: string) => {
    if (!sessionId) {
      console.warn('[MaintenanceWorkspace] handleSessionCreated called with empty sessionId');
      return;
    }
    if (project?.path && project?.id) {
      try {
        SessionPersistenceService.saveLastSessionForTab(project.path, 'maintenance', sessionId, project.id);
      } catch (err) {
        console.error('[MaintenanceWorkspace] Failed to save session:', err);
      }
    }
  }, [project?.path, project?.id]);

  const projectName = project?.path.split('/').pop() || 'Project';

  // Handle execution mode change from FloatingPromptInput button
  const handleExecutionModeChange = useCallback((mode: ExecutionMode) => {
    setActiveTab(mode === 'plan' ? 'planning' : 'development');
  }, []);

  // Handle streaming state change to prevent tab switching during AI work
  const handleStreamingChange = useCallback((isStreaming: boolean) => {
    setIsSessionLoading(isStreaming);
  }, []);

  // Handle AI fix requests from preview panel
  const handleAIFixFromPreview = useCallback((prompt: string) => {
    if (sessionRef.current) {
      sessionRef.current.sendPrompt(prompt, "sonnet");
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!project && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">{t('maintenance.errors.notFound')}</p>
        <Button variant="outline" onClick={() => goToProjectList()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('maintenance.errors.backButton')}
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
          tabType="maintenance"
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
        tabType="maintenance"
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
              <span className="text-sm font-medium">{t('maintenance.files.title')}</span>
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
                label: t('maintenance.breadcrumb.maintenance'),
                icon: <Wrench className="w-4 h-4" />,
                dropdownOptions: [
                  {
                    label: t('maintenance.breadcrumb.mvp'),
                    value: 'mvp',
                    icon: <Lightbulb className="w-4 h-4" />,
                    description: t('maintenance.breadcrumb.mvpDesc'),
                  },
                  {
                    label: t('maintenance.breadcrumb.maintenance'),
                    value: 'maintenance',
                    icon: <Wrench className="w-4 h-4" />,
                    description: t('maintenance.breadcrumb.maintenanceDesc'),
                  },
                ],
                dropdownValue: 'maintenance',
                onDropdownSelect: (value) => {
                  if (value === 'mvp' && projectId) {
                    goToMvp(projectId);
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
              <span>버전관리</span>
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
              title={rightPanelVisible ? t('maintenance.panelToggle.hide') : t('maintenance.panelToggle.show')}
            >
              {rightPanelVisible ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <ClaudeCodeSession
              ref={sessionRef}
              key={sessionKey}
              session={currentSession || undefined}
              initialProjectPath={project?.path}
              onBack={handleBack}
              onProjectPathChange={() => {}}
              onStreamingChange={handleStreamingChange}
              embedded={true}
              tabType="maintenance"
              onSessionCreated={handleSessionCreated}
              defaultExecutionMode={activeTab === 'development' ? 'execute' : 'plan'}
              onExecutionModeChange={handleExecutionModeChange}
            />
          </Suspense>
        </div>
      </div>

      {/* Right Panel (Planning/Development) */}
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
              {/* Tabs Header */}
              <div className="flex-shrink-0 border-b border-border bg-card/50">
                <div className="flex">
                  {/* 계획 세우기 탭 */}
                  <button
                    onClick={() => !isSessionLoading && setActiveTab('planning')}
                    disabled={isSessionLoading}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors border-b-2",
                      activeTab === 'planning'
                        ? "border-violet-500 text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      isSessionLoading && "opacity-50 cursor-not-allowed pointer-events-none"
                    )}
                  >
                    <FileText className="w-4 h-4" />
                    <span>{t('maintenance.tabs.planning')}</span>
                    {isSessionLoading && activeTab === 'planning' && (
                      <Loader2 className="w-3 h-3 animate-spin ml-1" />
                    )}
                  </button>

                  {/* 개발 탭 */}
                  <button
                    onClick={() => !isSessionLoading && setActiveTab('development')}
                    disabled={isSessionLoading}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors border-b-2",
                      activeTab === 'development'
                        ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      isSessionLoading && "opacity-50 cursor-not-allowed pointer-events-none"
                    )}
                  >
                    <Code className="w-4 h-4" />
                    <span>{t('maintenance.tabs.development')}</span>
                    {isSessionLoading && activeTab === 'development' && (
                      <Loader2 className="w-3 h-3 animate-spin ml-1" />
                    )}
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                {activeTab === 'planning' ? (
                  // 계획 세우기: 심플한 안내 화면
                  <div className="h-full flex flex-col items-center justify-center p-8">
                    <div className="text-center max-w-sm">
                      <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                      </div>
                      <p className="text-lg font-medium mb-2">{t('maintenance.planning.title')}</p>
                      <p className="text-sm text-muted-foreground mb-6">
                        {t('maintenance.planning.description')}
                      </p>

                      {/* 계획 완료 안내 */}
                      <div className="pt-6 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-3">
                          {t('maintenance.planning.complete')}
                        </p>
                        <Button
                          onClick={() => setActiveTab('development')}
                          variant="outline"
                          className="gap-2"
                          disabled={isSessionLoading}
                        >
                          <ArrowRight className="w-4 h-4" />
                          {t('maintenance.planning.nextButton')}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // 개발: EnhancedPreviewPanel
                  <EnhancedPreviewPanel
                    projectPath={project?.path}
                    projectId={project?.id}
                    onAIFix={handleAIFixFromPreview}
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
    </div>
  );
};

export default MaintenanceWorkspace;
