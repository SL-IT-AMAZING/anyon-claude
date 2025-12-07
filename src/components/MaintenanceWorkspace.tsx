import React, { useEffect, useState, Suspense, lazy, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Wrench, Loader2, Code, Monitor, ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SplitPane } from '@/components/ui/split-pane';
import { FileExplorer } from '@/components/FileExplorer';
import { PreviewPanel, type SelectedElement, type ElementAction } from '@/components/PreviewPanel';
import { PlanModePanel, type PlanItem, type PlanModeState } from '@/components/PlanModePanel';
import { SessionDropdown } from '@/components/SessionDropdown';
import { useProjects, useProjectsNavigation } from '@/components/ProjectRoutes';
import type { Project, Session } from '@/lib/api';
import { api } from '@/lib/api';
import { SessionPersistenceService } from '@/services/sessionPersistence';
import type { ClaudeCodeSessionRef } from '@/components/ClaudeCodeSession';
import { listen as tauriListen } from '@tauri-apps/api/event';
import type { ClaudeStreamMessage } from '@/components/AgentExecution';

// Lazy load ClaudeCodeSession for better performance
const ClaudeCodeSession = lazy(() =>
  import('@/components/ClaudeCodeSession').then(m => ({ default: m.ClaudeCodeSession }))
);

// Plan Mode system prompt - forces Claude to use Plan Mode tools
const PLAN_MODE_SYSTEM_PROMPT = `[CRITICAL: Plan Mode Required]
You MUST follow this workflow for any code changes:
1. FIRST, use the EnterPlanMode tool to enter planning mode
2. THEN, use the TodoWrite tool to create a detailed plan with todos (each todo must have content, activeForm, and status)
3. FINALLY, use the ExitPlanMode tool and STOP - wait for user approval
4. Do NOT execute any changes until the user explicitly approves the plan

This is mandatory for all tasks in the Maintenance workspace.
`;

type MaintenanceTabType = 'code' | 'preview' | 'plan';

interface MaintenanceWorkspaceProps {
  projectId: string;
}

/**
 * MaintenanceWorkspace - Maintenance workspace with split view
 *
 * Layout:
 * ┌─────────────────────┬───────────────────────────────┐
 * │   Chat (left)       │   Code Viewer (right)         │
 * │   ClaudeCodeSession │   react-syntax-highlighter    │
 * └─────────────────────┴───────────────────────────────┘
 */
export const MaintenanceWorkspace: React.FC<MaintenanceWorkspaceProps> = ({ projectId }) => {
  const { goToProject, goToProjectList } = useProjectsNavigation();
  const { projects, loading, getProjectById } = useProjects();
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<MaintenanceTabType>('code');
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessionKey, setSessionKey] = useState(0); // Key to force re-mount ClaudeCodeSession

  // Ref to access ClaudeCodeSession for sending prompts
  const claudeSessionRef = useRef<ClaudeCodeSessionRef>(null);

  // Element selection state for preview panel
  const [_selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [selectedHtmlFile, setSelectedHtmlFile] = useState<string | undefined>(undefined);

  // Plan mode state
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [planModeState, setPlanModeState] = useState<PlanModeState>('idle');
  const [isStreaming, setIsStreaming] = useState(false);
  const [claudeSessionId, setClaudeSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (projectId && projects.length > 0) {
      const found = getProjectById(projectId);
      setProject(found);
    }
  }, [projectId, projects, getProjectById]);

  // Load last session for this tab when project is set
  useEffect(() => {
    if (project?.path) {
      const lastSessionData = SessionPersistenceService.getLastSessionDataForTab(project.path, 'maintenance');
      if (lastSessionData) {
        // Validate session data before restoring
        if (lastSessionData.sessionId && lastSessionData.projectId && lastSessionData.projectPath) {
          const session = SessionPersistenceService.createSessionFromRestoreData(lastSessionData);
          setCurrentSession(session);
        } else {
          // Invalid session data, clear it
          console.warn('[MaintenanceWorkspace] Invalid session data, clearing');
          SessionPersistenceService.clearLastSessionForTab(project.path, 'maintenance');
        }
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

  // Handle Claude message for plan mode tool detection
  const handleClaudeMessage = useCallback((event: any) => {
    try {
      const message = JSON.parse(event.payload) as ClaudeStreamMessage;

      // Debug: Log all messages
      console.log('[MaintenanceWorkspace] Received message:', message.type);

      // Check for tool uses in assistant messages
      if (message.type === 'assistant' && message.message?.content) {
        console.log('[MaintenanceWorkspace] Assistant content:', message.message.content);

        for (const content of message.message.content) {
          if (content.type === 'tool_use') {
            const toolName = content.name?.toLowerCase();
            console.log('[MaintenanceWorkspace] Tool use detected:', {
              name: toolName,
              input: content.input
            });

            // EnterPlanMode - activate plan mode
            if (toolName === 'enterplanmode') {
              console.log('[MaintenanceWorkspace] EnterPlanMode detected');
              setPlanModeState('planning');
              setActiveTab('plan');
            }

            // TodoWrite - update plan items
            if (toolName === 'todowrite' && content.input?.todos) {
              console.log('[MaintenanceWorkspace] TodoWrite detected:', content.input.todos);
              const todos = content.input.todos as Array<{
                content: string;
                activeForm: string;
                status: 'pending' | 'in_progress' | 'completed';
              }>;

              const newPlanItems: PlanItem[] = todos.map((todo, index) => ({
                id: `plan-${Date.now()}-${index}`,
                content: todo.content,
                activeForm: todo.activeForm,
                status: todo.status,
              }));

              setPlanItems(newPlanItems);

              // Move to awaiting approval when we get todos
              setPlanModeState('awaiting_approval');
              setActiveTab('plan');
            }

            // ExitPlanMode - Claude is done planning, wait for user approval
            if (toolName === 'exitplanmode') {
              console.log('[MaintenanceWorkspace] ExitPlanMode detected - waiting for user approval');
              setPlanModeState('awaiting_approval');
              setActiveTab('plan');
            }
          }
        }
      }
    } catch (err) {
      // Not all messages are JSON - this is expected for some output
    }
  }, []);

  // Listen for Claude messages on BOTH generic and session-specific channels
  useEffect(() => {
    let isMounted = true;
    let unlistenGeneric: (() => void) | null = null;
    let unlistenSpecific: (() => void) | null = null;

    const setupListeners = async () => {
      // Always listen on generic channel (catches early messages before session ID is set)
      unlistenGeneric = await tauriListen('claude-output', (event: any) => {
        if (!isMounted) return;
        handleClaudeMessage(event);
      });

      // Also listen on session-specific channel if we have a session ID
      if (claudeSessionId) {
        unlistenSpecific = await tauriListen(`claude-output:${claudeSessionId}`, (event: any) => {
          if (!isMounted) return;
          handleClaudeMessage(event);
        });
      }
    };

    setupListeners();

    return () => {
      isMounted = false;
      unlistenGeneric?.();
      unlistenSpecific?.();
    };
  }, [claudeSessionId, handleClaudeMessage]);

  // Handle streaming state change from ClaudeCodeSession
  const handleStreamingChange = useCallback((streaming: boolean, sessionId: string | null) => {
    setIsStreaming(streaming);
    if (sessionId) {
      setClaudeSessionId(sessionId);
    }

    // When streaming stops and we're in planning mode, finalize the state
    if (!streaming && planModeState === 'planning' && planItems.length > 0) {
      setPlanModeState('awaiting_approval');
    }
  }, [planModeState, planItems.length]);

  const handleBack = () => {
    if (projectId) {
      goToProject(projectId);
    } else {
      goToProjectList();
    }
  };

  // Handle session selection from dropdown
  const handleSessionSelect = useCallback((session: Session | null) => {
    setCurrentSession(session);
    setSessionKey(prev => prev + 1); // Force re-mount

    // Save as last session if selecting an existing session
    if (session && project?.path) {
      SessionPersistenceService.saveLastSessionForTab(project.path, 'maintenance', session.id);
    }
  }, [project?.path]);

  // Handle new session created
  const handleSessionCreated = useCallback((sessionId: string, _firstMessage?: string) => {
    if (project?.path) {
      SessionPersistenceService.saveLastSessionForTab(project.path, 'maintenance', sessionId);
    }
  }, [project?.path]);

  // Handle file selection from FileExplorer (for HTML preview)
  const handleFileSelect = useCallback((filePath: string) => {
    if (filePath.toLowerCase().endsWith('.html') || filePath.toLowerCase().endsWith('.htm')) {
      setSelectedHtmlFile(filePath);
      setActiveTab('preview');
    }
  }, []);

  // Handle element selection from preview panel
  const handleElementSelected = useCallback((element: SelectedElement | null) => {
    setSelectedElement(element);
  }, []);

  // Handle element action (edit/remove/add) from preview panel
  const handleElementAction = useCallback((action: ElementAction, element: SelectedElement) => {
    const actionText = action === 'edit' ? '수정' : action === 'remove' ? '삭제' : '다음에 추가';
    const prompt = `다음 요소를 ${actionText}해주세요:

선택자: ${element.selector}
태그: ${element.tag}
${element.id ? `ID: ${element.id}` : ''}
${element.classes ? `클래스: ${element.classes}` : ''}
${element.text ? `텍스트: ${element.text.substring(0, 50)}${element.text.length > 50 ? '...' : ''}` : ''}

HTML:
\`\`\`html
${element.html || '(HTML 없음)'}
\`\`\``;

    // Send prompt to Claude
    claudeSessionRef.current?.sendPrompt(prompt, 'sonnet');
  }, []);

  // Plan mode handlers
  const handlePlanApprove = useCallback((items: PlanItem[]) => {
    console.log('[MaintenanceWorkspace] Plan approved:', items);
    setPlanModeState('executing');

    // Create approval message with the approved plan items
    const approvalMessage = `[PLAN APPROVED - PROCEED WITH EXECUTION]
The user has reviewed and approved your plan. Execute these tasks now:

${items.map((item, i) => `${i + 1}. ${item.content}`).join('\n')}

Begin execution immediately. Do not use Plan Mode tools again - just execute the approved tasks.`;

    claudeSessionRef.current?.sendPrompt(approvalMessage, 'sonnet');
  }, []);

  const handlePlanReject = useCallback(() => {
    console.log('[MaintenanceWorkspace] Plan rejected');
    setPlanModeState('rejected');
    // Clear plan items
    setPlanItems([]);
    // Send rejection message to Claude
    claudeSessionRef.current?.sendPrompt('계획을 거절합니다. 다른 방법을 제안해주세요.', 'sonnet');
    // After a delay, reset to idle
    setTimeout(() => {
      setPlanModeState('idle');
    }, 2000);
  }, []);

  const handlePlanReorder = useCallback((items: PlanItem[]) => {
    setPlanItems(items);
  }, []);

  const handlePlanRemoveItem = useCallback((id: string) => {
    setPlanItems(prev => prev.filter(item => item.id !== id));
  }, []);

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
            <div className="w-7 h-7 rounded-md bg-orange-500/10 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">{projectName}</h1>
              <p className="text-xs text-muted-foreground">Maintenance</p>
            </div>
          </div>

          {/* Session Dropdown */}
          {project?.path && (
            <SessionDropdown
              projectPath={project.path}
              tabType="maintenance"
              currentSessionId={currentSession?.id || null}
              onSessionSelect={handleSessionSelect}
              className="ml-auto"
            />
          )}
        </div>
      </motion.div>

      {/* Main Content - Split View */}
      <div className="flex-1 overflow-hidden">
        <SplitPane
          initialSplit={50}
          minLeftWidth={300}
          minRightWidth={300}
          left={
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              }
            >
              <ClaudeCodeSession
                ref={claudeSessionRef}
                key={sessionKey}
                session={currentSession || undefined}
                initialProjectPath={project?.path}
                onBack={handleBack}
                onProjectPathChange={() => {}}
                onStreamingChange={handleStreamingChange}
                embedded={true}
                tabType="maintenance"
                onSessionCreated={handleSessionCreated}
                promptPrefix={PLAN_MODE_SYSTEM_PROMPT}
              />
            </Suspense>
          }
          right={
            <div className="h-full p-3">
              <div className="h-full flex flex-col rounded-lg border border-border bg-muted/30 shadow-sm overflow-hidden">
                {/* Tab Header */}
                <div className="flex-shrink-0 border-b border-border bg-muted/50 px-3 py-2">
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MaintenanceTabType)}>
                    <TabsList className="bg-background/50">
                      <TabsTrigger value="code" className="gap-1.5">
                        <Code className="w-3.5 h-3.5" />
                        코드
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="gap-1.5">
                        <Monitor className="w-3.5 h-3.5" />
                        프리뷰
                      </TabsTrigger>
                      <TabsTrigger value="plan" className="gap-1.5 relative">
                        <ListTodo className="w-3.5 h-3.5" />
                        플랜
                        {planModeState !== 'idle' && planModeState !== 'completed' && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        )}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-hidden">
                  {activeTab === 'code' && (
                    <FileExplorer rootPath={project?.path} onFileClick={handleFileSelect} />
                  )}
                  {activeTab === 'preview' && (
                    <PreviewPanel
                      htmlFilePath={selectedHtmlFile}
                      projectPath={project?.path}
                      onElementSelected={handleElementSelected}
                      onElementAction={handleElementAction}
                    />
                  )}
                  {activeTab === 'plan' && (
                    <PlanModePanel
                      planItems={planItems}
                      state={planModeState}
                      isLoading={isStreaming}
                      onApprove={handlePlanApprove}
                      onReject={handlePlanReject}
                      onReorder={handlePlanReorder}
                      onRemoveItem={handlePlanRemoveItem}
                    />
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

export default MaintenanceWorkspace;
