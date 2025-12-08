import React, { useEffect, useState, Suspense, lazy, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lightbulb, Loader2, FileText, Code, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SplitPane } from '@/components/ui/split-pane';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjects, useProjectsNavigation } from '@/components/ProjectRoutes';
import { PlanningDocsPanel } from '@/components/planning';
import { DevDocsPanel } from '@/components/development';
import { PreviewPanel } from '@/components/PreviewPanel';
import { SessionDropdown } from '@/components/SessionDropdown';
import { usePlanningDocs } from '@/hooks/usePlanningDocs';
import type { Project, Session } from '@/lib/api';
import { api } from '@/lib/api';
import type { ClaudeCodeSessionRef } from '@/components/ClaudeCodeSession';
import { SessionPersistenceService } from '@/services/sessionPersistence';

// Lazy load ClaudeCodeSession for better performance
const ClaudeCodeSession = lazy(() =>
  import('@/components/ClaudeCodeSession').then(m => ({ default: m.ClaudeCodeSession }))
);

type MvpTabType = 'planning' | 'development' | 'preview';

interface MvpWorkspaceProps {
  projectId: string;
}

/**
 * MvpWorkspace - MVP Development workspace
 *
 * Features:
 * - Left panel: ClaudeCodeSession (AI chat)
 * - Right panel: Planning docs, Development docs, Preview tabs
 * - Planning docs panel with workflow automation
 */
export const MvpWorkspace: React.FC<MvpWorkspaceProps> = ({ projectId }) => {
  const { goToProject, goToProjectList } = useProjectsNavigation();
  const { projects, loading, getProjectById } = useProjects();
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<MvpTabType>('planning');
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessionKey, setSessionKey] = useState(0); // Key to force re-mount ClaudeCodeSession

  // Ref for ClaudeCodeSession to send prompts programmatically
  const claudeSessionRef = useRef<ClaudeCodeSessionRef>(null);

  // Check planning docs completion
  const { progress } = usePlanningDocs(project?.path);
  const isPlanningComplete = progress.isAllComplete;

  useEffect(() => {
    if (projectId && projects.length > 0) {
      const found = getProjectById(projectId);
      setProject(found);
    }
  }, [projectId, projects, getProjectById]);

  // Load last session for this tab when project is set
  useEffect(() => {
    if (project?.path) {
      const lastSessionData = SessionPersistenceService.getLastSessionDataForTab(project.path, 'mvp');
      if (lastSessionData) {
        const session = SessionPersistenceService.createSessionFromRestoreData(lastSessionData);
        setCurrentSession(session);
      }
    }
  }, [project?.path]);

  // Check and initialize git repo if needed
  useEffect(() => {
    const checkGitRepo = async () => {
      if (project?.path) {
        try {
          const isGitRepo = await api.checkIsGitRepo(project.path);

          if (!isGitRepo) {
            console.log('Initializing git repository for project:', project.path);
            const gitResult = await api.initGitRepo(project.path);

            if (gitResult.success) {
              console.log('Git repository initialized successfully');
            } else {
              console.warn('Git init failed:', gitResult.stderr);
            }
          }
        } catch (gitErr) {
          console.error('Failed to check/init git repo:', gitErr);
        }
      }
    };
    checkGitRepo();
  }, [project?.path]);

  const handleBack = () => {
    if (projectId) {
      goToProject(projectId);
    } else {
      goToProjectList();
    }
  };

  // Handle streaming state changes from ClaudeCodeSession
  const handleStreamingChange = useCallback((isStreaming: boolean) => {
    setIsSessionLoading(isStreaming);
  }, []);

  // Start a new workflow (new conversation) from PlanningDocsPanel
  const handleStartNewWorkflow = useCallback((workflowPrompt: string) => {
    if (claudeSessionRef.current) {
      // Start a new session with the workflow prompt
      claudeSessionRef.current.startNewSession(workflowPrompt);
    }
  }, []);

  // Send prompt to existing session (for development workflow)
  const handleSendPlanningPrompt = useCallback((prompt: string) => {
    if (claudeSessionRef.current) {
      // Send prompt to current session
      claudeSessionRef.current.sendPrompt(prompt);
    }
  }, []);

  // Handle session selection from dropdown
  const handleSessionSelect = useCallback((session: Session | null) => {
    setCurrentSession(session);
    setSessionKey(prev => prev + 1); // Force re-mount

    // Save as last session if selecting an existing session
    if (session && project?.path) {
      SessionPersistenceService.saveLastSessionForTab(project.path, 'mvp', session.id);
    }
  }, [project?.path]);

  // Handle new session created
  const handleSessionCreated = useCallback((sessionId: string) => {
    if (project?.path) {
      SessionPersistenceService.saveLastSessionForTab(project.path, 'mvp', sessionId);
    }
  }, [project?.path]);

  const projectName = project?.path.split('/').pop() || 'Project';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project && !loading) {
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

  return (
    <div className="h-full flex flex-col">
      {/* Workspace Header */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">{projectName}</h1>
              <p className="text-xs text-muted-foreground">MVP Development</p>
            </div>
          </div>

          {/* Session Dropdown */}
          {project?.path && (
            <SessionDropdown
              projectPath={project.path}
              tabType="mvp"
              currentSessionId={currentSession?.id || null}
              onSessionSelect={handleSessionSelect}
              className="ml-auto"
            />
          )}
        </div>
      </motion.div>

      {/* Main Content - SplitPane with Chat and Tabs */}
      <div className="flex-1 overflow-hidden">
        <SplitPane
          initialSplit={50}
          minLeftWidth={350}
          minRightWidth={400}
          left={
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              }
            >
              <ClaudeCodeSession
                key={sessionKey}
                ref={claudeSessionRef}
                session={currentSession || undefined}
                initialProjectPath={project?.path}
                onBack={handleBack}
                onProjectPathChange={() => { }}
                onStreamingChange={handleStreamingChange}
                embedded={true}
                tabType="mvp"
                onSessionCreated={handleSessionCreated}
              />
            </Suspense>
          }
          right={
            <div className="h-full p-3">
              <div className="h-full flex flex-col rounded-lg border border-border bg-muted/30 shadow-sm overflow-hidden">
                {/* Tab Header */}
                <div className="flex-shrink-0 border-b border-border bg-muted/50 px-3 py-2">
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MvpTabType)}>
                    <TabsList className="bg-background/50">
                      <TabsTrigger value="planning" className="gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        기획문서
                      </TabsTrigger>
                      <TabsTrigger value="development" className="gap-1.5">
                        <Code className="w-3.5 h-3.5" />
                        개발문서
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="gap-1.5">
                        <Monitor className="w-3.5 h-3.5" />
                        프리뷰
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-hidden">
                  {activeTab === 'planning' && (
                    <PlanningDocsPanel
                      projectPath={project?.path}
                      onStartNewWorkflow={handleStartNewWorkflow}
                      isSessionLoading={isSessionLoading}
                    />
                  )}
                  {activeTab === 'development' && (
                    <DevDocsPanel
                      projectPath={project?.path}
                      isPlanningComplete={isPlanningComplete}
                      onSendPrompt={handleSendPlanningPrompt}
                      onStartNewSession={handleStartNewWorkflow}
                      isSessionLoading={isSessionLoading}
                    />
                  )}
                  {activeTab === 'preview' && (
                    <PreviewPanel />
                  )}
                </div>
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default MvpWorkspace;
