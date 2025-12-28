import { useState, useEffect, useRef, useMemo, useImperativeHandle, forwardRef } from "react";
import { flushSync } from "react-dom";

// Extend window for debug logging
declare global {
  interface Window {
    _streamEventLogged?: number;
  }
}
import { motion, AnimatePresence } from "framer-motion";
import { createLogger } from "@/lib/logger";

const logger = createLogger('ClaudeCodeSession');
import {
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  AlertCircle,
  Plus,
} from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { api, type Session } from "@/lib/api";
import { cn } from "@/lib/utils";

// Tauri event API import
import { listen as tauriListen } from "@tauri-apps/api/event";

type UnlistenFn = () => void;

// Use Tauri's listen directly - it will be available in Tauri environment
const listen = tauriListen;
import { StreamMessage } from "./StreamMessage";
import { StreamingText } from "./StreamingText";
import { FloatingPromptInput, type FloatingPromptInputRef, type ExecutionMode } from "./FloatingPromptInput";
import { ErrorBoundary } from "./ErrorBoundary";
import { SlashCommandsManager } from "./SlashCommandsManager";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TooltipProvider, TooltipSimple } from "@/components/ui/tooltip-modern";
import { SplitPane } from "@/components/ui/split-pane";
import { WebviewPreview } from "./WebviewPreview";
import { PreviewPromptDialog } from "./PreviewPromptDialog";
import type { ClaudeStreamMessage } from "./AgentExecution";
import type { SelectedElement } from "@/types/preview";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTrackEvent, useComponentMetrics, useWorkflowTracking } from "@/hooks";
import { SessionPersistenceService, type TabType } from "@/services/sessionPersistence";
import {
  validatePromptInput,
  createQueuedPrompt,
  setupSessionIfNeeded,
  createStreamMessageHandler,
  createCompletionHandler,
  setupEventListeners,
  trackPromptMetrics,
  executePromptCommand,
  addUserMessageToUI,
  updateSessionFirstMessage,
  type QueuedPrompt,
} from "./claude-session/promptHandlers";

interface ClaudeCodeSessionProps {
  /**
   * Optional session to resume (when clicking from SessionList)
   */
  session?: Session;
  /**
   * Initial project path (for new sessions)
   */
  initialProjectPath?: string;
  /**
   * Callback to go back
   */
  onBack: () => void;
  /**
   * Callback to open hooks configuration
   */
  onProjectSettings?: (projectPath: string) => void;
  /**
   * Optional className for styling
   */
  className?: string;
  /**
   * Callback when streaming state changes
   */
  onStreamingChange?: (isStreaming: boolean, sessionId: string | null) => void;
  /**
   * Callback when project path changes
   */
  onProjectPathChange?: (path: string) => void;
  /**
   * Whether to use embedded mode for input (not fixed position)
   * When true, the input will be positioned within its container instead of fixed at bottom
   */
  embedded?: boolean;
  /**
   * Tab type for session persistence (mvp or maintenance)
   */
  tabType?: TabType;
  /**
   * Callback when a new session is created
   */
  onSessionCreated?: (sessionId: string, firstMessage?: string) => void;
  /**
   * Default execution mode (for maintenance tab)
   */
  defaultExecutionMode?: ExecutionMode;
  /**
   * Callback when execution mode changes (for syncing with tab)
   */
  onExecutionModeChange?: (mode: ExecutionMode) => void;
  /**
   * Callback when user stops workflow execution (e.g., pressing stop button)
   */
  onStopWorkflow?: () => void;
}

/**
 * Ref handle for ClaudeCodeSession
 * Allows external components to send prompts programmatically
 */
export interface ClaudeCodeSessionRef {
  sendPrompt: (prompt: string, model?: "haiku" | "sonnet" | "opus") => void;
  startNewSession: (backendPrompt: string, userMessage?: string) => Promise<void>;
  isLoading: boolean;
}

/**
 * ClaudeCodeSession component for interactive Claude Code sessions
 *
 * @example
 * const sessionRef = useRef<ClaudeCodeSessionRef>(null);
 * <ClaudeCodeSession ref={sessionRef} onBack={() => setView('projects')} />
 * sessionRef.current?.sendPrompt('/anyon:anyon-method:workflows:startup-prd');
 */
export const ClaudeCodeSession = forwardRef<ClaudeCodeSessionRef, ClaudeCodeSessionProps>(({
  session,
  initialProjectPath = "",
  className,
  onStreamingChange,
  onProjectPathChange,
  embedded = false,
  tabType,
  onSessionCreated,
  defaultExecutionMode,
  onExecutionModeChange,
  onStopWorkflow,
}, ref) => {
  const [projectPath, setProjectPath] = useState(initialProjectPath || session?.project_path || "");

  // Update projectPath when initialProjectPath changes (e.g., when switching projects)
  useEffect(() => {
    const newPath = initialProjectPath || session?.project_path || "";
    if (newPath && newPath !== projectPath) {
      setProjectPath(newPath);
    }
  }, [initialProjectPath, session?.project_path]);
  const [messages, setMessages] = useState<ClaudeStreamMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Streaming text state for real-time typing effect
  const [streamingText, setStreamingText] = useState<string>('');
  const accumulatedTextRef = useRef<string>('');
  const [isFirstPrompt, setIsFirstPrompt] = useState(!session);
  const isFirstPromptRef = useRef(!session);  // Ref to avoid stale closure in startNewSession
  const [totalTokens, setTotalTokens] = useState(0);
  const [extractedSessionInfo, setExtractedSessionInfo] = useState<{ sessionId: string; projectId: string } | null>(null);
  const [claudeSessionId, setClaudeSessionId] = useState<string | null>(null);
  const [showSlashCommandsSettings, setShowSlashCommandsSettings] = useState(false);
  
  // Queued prompts state
  const [queuedPrompts, setQueuedPrompts] = useState<QueuedPrompt[]>([]);
  
  // New state for preview feature
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [showPreviewPrompt, setShowPreviewPrompt] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50);
  const [isPreviewMaximized, setIsPreviewMaximized] = useState(false);
  
  // Add collapsed state for queued prompts
  const [queuedPromptsCollapsed, setQueuedPromptsCollapsed] = useState(false);

  // Model selection state
  const [selectedModel, setSelectedModel] = useState<"haiku" | "sonnet" | "opus">("sonnet");

  const parentRef = useRef<HTMLDivElement>(null);
  const unlistenRefs = useRef<UnlistenFn[]>([]);
  const hasActiveSessionRef = useRef(false);
  const floatingPromptRef = useRef<FloatingPromptInputRef>(null);
  const queuedPromptsRef = useRef<QueuedPrompt[]>([]);
  const isMountedRef = useRef(true);
  const isListeningRef = useRef(false);
  const sessionStartTime = useRef<number>(Date.now());
  const currentSessionIdRef = useRef<string | null>(null);
  // 워크플로우 프롬프트의 displayText 매핑을 위한 임시 저장소
  const pendingDisplayTextRef = useRef<{ prompt: string; displayText: string } | null>(null);
  
  // Session metrics state for enhanced analytics
  const sessionMetrics = useRef({
    firstMessageTime: null as number | null,
    promptsSent: 0,
    toolsExecuted: 0,
    toolsFailed: 0,
    filesCreated: 0,
    filesModified: 0,
    filesDeleted: 0,
    codeBlocksGenerated: 0,
    errorsEncountered: 0,
    lastActivityTime: Date.now(),
    toolExecutionTimes: [] as number[],
    wasResumed: !!session,
    modelChanges: [] as Array<{ from: string; to: string; timestamp: number }>,
  });

  // Analytics tracking
  const trackEvent = useTrackEvent();
  useComponentMetrics('ClaudeCodeSession');
  // const aiTracking = useAIInteractionTracking('sonnet'); // Default model
  const workflowTracking = useWorkflowTracking('claude_session');
  
  // Call onProjectPathChange when component mounts with initial path
  useEffect(() => {
    if (onProjectPathChange && projectPath) {
      onProjectPathChange(projectPath);
    }
  }, []); // Only run on mount
  
  // Keep ref in sync with state
  useEffect(() => {
    queuedPromptsRef.current = queuedPrompts;
  }, [queuedPrompts]);

  // Keep isFirstPromptRef in sync with state (for stale closure avoidance)
  useEffect(() => {
    isFirstPromptRef.current = isFirstPrompt;
  }, [isFirstPrompt]);

  // Get effective session info (from prop or extracted) - use useMemo to ensure it updates
  const effectiveSession = useMemo(() => {
    if (session) return session;
    if (extractedSessionInfo) {
      return {
        id: extractedSessionInfo.sessionId,
        project_id: extractedSessionInfo.projectId,
        project_path: projectPath,
        created_at: Date.now(),
      } as Session;
    }
    // Fallback: if we have claudeSessionId but no extractedSessionInfo,
    // create a minimal session for resume logic
    if (claudeSessionId) {
      return {
        id: claudeSessionId,
        project_id: projectPath.replace(/[^a-zA-Z0-9]/g, '-'),
        project_path: projectPath,
        created_at: Date.now(),
      } as Session;
    }
    return null;
  }, [session, extractedSessionInfo, projectPath, claudeSessionId]);

  // Helper: check if message is tool-only (no text content)
  const isToolOnlyMessage = (msg: ClaudeStreamMessage): boolean => {
    if (msg.type !== 'assistant' || !msg.message?.content) return false;
    const content = msg.message.content;
    if (!Array.isArray(content)) return false;
    
    const hasText = content.some((c: any) => c.type === 'text' && c.text?.trim());
    const hasTools = content.some((c: any) => c.type === 'tool_use');
    
    return hasTools && !hasText;
  };

  // Filter and merge consecutive tool-only messages
  const displayableMessages = useMemo(() => {
    // First filter out non-displayable messages
    const filtered = messages.filter((message, index) => {
      // Skip meta messages that don't have meaningful content
      if (message.isMeta && !message.leafUuid && !message.summary) {
        return false;
      }

      // Skip user messages that only contain tool results that are already displayed
      if (message.type === "user" && message.message) {
        if (message.isMeta) return false;

        const msg = message.message;
        if (!msg.content || (Array.isArray(msg.content) && msg.content.length === 0)) {
          return false;
        }

        if (Array.isArray(msg.content)) {
          let hasVisibleContent = false;
          for (const content of msg.content) {
            if (content.type === "text") {
              hasVisibleContent = true;
              break;
            }
            if (content.type === "tool_result") {
              let willBeSkipped = false;
              if (content.tool_use_id) {
                // Look for the matching tool_use in previous assistant messages
                for (let i = index - 1; i >= 0; i--) {
                  const prevMsg = messages[i];
                  if (prevMsg.type === 'assistant' && prevMsg.message?.content && Array.isArray(prevMsg.message.content)) {
                    const toolUse = prevMsg.message.content.find((c: any) => 
                      c.type === 'tool_use' && c.id === content.tool_use_id
                    );
                    if (toolUse) {
                      const toolName = toolUse.name?.toLowerCase();
                      const toolsWithWidgets = [
                        'task', 'edit', 'multiedit', 'todowrite', 'ls', 'read', 
                        'glob', 'bash', 'write', 'grep'
                      ];
                      if (toolsWithWidgets.includes(toolName) || toolUse.name?.startsWith('mcp__')) {
                        willBeSkipped = true;
                      }
                      break;
                    }
                  }
                }
              }
              if (!willBeSkipped) {
                hasVisibleContent = true;
                break;
              }
            }
          }
          if (!hasVisibleContent) {
            return false;
          }
        }
      }
      return true;
    });

    // Merge consecutive tool-only assistant messages
    const merged: ClaudeStreamMessage[] = [];
    
    for (let i = 0; i < filtered.length; i++) {
      const current = filtered[i];
      
      // If current is tool-only and previous in merged is also tool-only, merge them
      if (isToolOnlyMessage(current) && merged.length > 0) {
        const prev = merged[merged.length - 1];
        if (isToolOnlyMessage(prev)) {
          // Merge: combine content arrays
          const mergedContent = [
            ...(prev.message?.content || []),
            ...(current.message?.content || [])
          ];
          
          // Merge usage if available
          const mergedUsage = prev.message?.usage && current.message?.usage ? {
            input_tokens: (prev.message.usage.input_tokens || 0) + (current.message.usage.input_tokens || 0),
            output_tokens: (prev.message.usage.output_tokens || 0) + (current.message.usage.output_tokens || 0)
          } : prev.message?.usage || current.message?.usage;
          
          // Update the previous message with merged content
          merged[merged.length - 1] = {
            ...prev,
            message: {
              ...prev.message,
              content: mergedContent,
              usage: mergedUsage
            },
            _mergedCount: ((prev as any)._mergedCount || 1) + 1
          } as ClaudeStreamMessage;
          
          continue;
        }
      }
      
      merged.push(current);
    }
    
    return merged;
  }, [messages]);

  const rowVirtualizer = useVirtualizer({
    count: displayableMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 150, // Estimate, will be dynamically measured
    overscan: 5,
  });

  // Debug logging
  useEffect(() => {
    logger.debug('State update:', {
      projectPath,
      session,
      extractedSessionInfo,
      effectiveSession,
      messagesCount: messages.length,
      isLoading
    });
  }, [projectPath, session, extractedSessionInfo, effectiveSession, messages.length, isLoading]);

  // Load session history if resuming
  useEffect(() => {
    if (session) {
      // Set the claudeSessionId immediately when we have a session
      setClaudeSessionId(session.id);
      
      // Load session history first, then check for active session
      const initializeSession = async () => {
        await loadSessionHistory();
        // After loading history, check if the session is still active
        if (isMountedRef.current) {
          await checkForActiveSession();
        }
      };
      
      initializeSession();
    }
  }, [session]); // Remove hasLoadedSession dependency to ensure it runs on mount

  // Report streaming state changes
  useEffect(() => {
    onStreamingChange?.(isLoading, claudeSessionId);
  }, [isLoading, claudeSessionId, onStreamingChange]);

  // Auto-scroll to bottom when new messages arrive
  const lastMessageCountRef = useRef(0);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Track if user is manually scrolling
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement) return;
    
    const handleScroll = () => {
      // Check if user is near bottom (within 150px)
      const isNearBottom = scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight < 150;
      isUserScrollingRef.current = !isNearBottom;
    };
    
    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, []);
  
  useEffect(() => {
    // Only auto-scroll if:
    // 1. New messages arrived (not just re-render)
    // 2. User is not manually scrolling up
    const messageCountChanged = displayableMessages.length !== lastMessageCountRef.current;
    lastMessageCountRef.current = displayableMessages.length;
    
    if (!messageCountChanged || isUserScrollingRef.current) return;
    if (displayableMessages.length === 0) return;
    
    // Clear any pending scroll
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Use a single RAF for smooth scrolling without jitter
    scrollTimeoutRef.current = setTimeout(() => {
      const scrollElement = parentRef.current;
      if (scrollElement) {
        // Just use direct scroll - virtualizer will handle rendering
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: 'auto'  // 'auto' instead of 'smooth' to prevent jitter
        });
      }
    }, 16); // Single frame delay
    
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [displayableMessages.length]);

  // Throttled auto-scroll for streaming text updates (separate from message scroll)
  const lastScrollTimeRef = useRef<number>(0);
  useEffect(() => {
    if (streamingText && isLoading) {
      const now = Date.now();
      // Throttle scroll updates to max once every 200ms during streaming (increased from 100ms)
      if (now - lastScrollTimeRef.current > 200) {
        lastScrollTimeRef.current = now;
        // Only scroll if user is not manually scrolling
        if (!isUserScrollingRef.current) {
          const scrollElement = parentRef.current;
          if (scrollElement) {
            scrollElement.scrollTo({
              top: scrollElement.scrollHeight,
              behavior: 'auto'
            });
          }
        }
      }
    }
  }, [streamingText, isLoading]);

  // Calculate total tokens from messages
  useEffect(() => {
    const tokens = messages.reduce((total, msg) => {
      if (msg.message?.usage) {
        return total + msg.message.usage.input_tokens + msg.message.usage.output_tokens;
      }
      if (msg.usage) {
        return total + msg.usage.input_tokens + msg.usage.output_tokens;
      }
      return total;
    }, 0);
    setTotalTokens(tokens);
  }, [messages]);

  const loadSessionHistory = async () => {
    if (!session) return;

    console.log('[ClaudeCodeSession] loadSessionHistory called with session:', session.id, session.project_id);

    try {
      setIsLoading(true);
      setError(null);

      const history = await api.loadSessionHistory(session.id, session.project_id);
      console.log('[ClaudeCodeSession] Loaded history:', history?.length, 'messages');
      
      // Save session data for restoration
      if (history && history.length > 0) {
        SessionPersistenceService.saveSession(
          session.id,
          session.project_id,
          session.project_path,
          history.length
        );
      }
      
      // Convert history to messages format with displayText enrichment
      const loadedMessages: ClaudeStreamMessage[] = history.map(entry => {
        const message: ClaudeStreamMessage = {
          ...entry,
          type: entry.type || "assistant"
        };

        // user 메시지에 displayText 복원 시도
        if (message.type === "user" && message.message?.content && !message.displayText) {
          // content가 배열인 경우에만 find 사용
          if (Array.isArray(message.message.content)) {
            const textContent = message.message.content.find((c: any) => c.type === "text");
            if (textContent?.text) {
              // localStorage에서 저장된 displayText 찾기
              const storedDisplayText = SessionPersistenceService.findDisplayText(
                session.id,
                textContent.text
              );
              if (storedDisplayText) {
                message.displayText = storedDisplayText;
              }
            }
          }
        }

        return message;
      });

      console.log('[ClaudeCodeSession] Setting messages:', loadedMessages.length);
      setMessages(loadedMessages);

      // After loading history, we're continuing a conversation
      setIsFirstPrompt(false);
      
      // Scroll to bottom after loading history - use RAF to ensure DOM is ready
      requestAnimationFrame(() => {
        if (loadedMessages.length > 0) {
          const scrollElement = parentRef.current;
          if (scrollElement) {
            // Direct scroll without virtualizer to prevent jitter
            scrollElement.scrollTo({
              top: scrollElement.scrollHeight,
              behavior: 'auto'
            });
          }
        }
      });
    } catch (err) {
      logger.error("Failed to load session history:", err);
      // Don't show error - just start fresh without history
      // The session data might be corrupted or the backend session might not exist
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const checkForActiveSession = async () => {
    // If we have a session prop, check if it's still active
    if (session) {
      try {
        const activeSessions = await api.listRunningClaudeSessions();
        const activeSession = activeSessions.find((s: any) => {
          if ('process_type' in s && s.process_type && 'ClaudeSession' in s.process_type) {
            return (s.process_type as any).ClaudeSession.session_id === session.id;
          }
          return false;
        });
        
        if (activeSession) {
          // Session is still active, reconnect to its stream
          logger.log('Found active session, reconnecting:', session.id);
          // IMPORTANT: Set claudeSessionId before reconnecting
          setClaudeSessionId(session.id);

          // Don't add buffered messages here - they've already been loaded by loadSessionHistory
          // Just set up listeners for new messages

          // Set up listeners for the active session
          reconnectToSession(session.id);
        }
      } catch (err) {
        logger.error('Failed to check for active sessions:', err);
      }
    }
  };

  const reconnectToSession = async (sessionId: string) => {
    logger.log('Reconnecting to session:', sessionId);

    // Prevent duplicate listeners
    if (isListeningRef.current) {
      logger.log('Already listening to session, skipping reconnect');
      return;
    }
    
    // Clean up previous listeners
    unlistenRefs.current.forEach(unlisten => unlisten());
    unlistenRefs.current = [];
    
    // IMPORTANT: Set the session ID before setting up listeners
    setClaudeSessionId(sessionId);
    
    // Mark as listening
    isListeningRef.current = true;
    
    // Set up session-specific listeners
    const outputUnlisten = await listen(`claude-output:${sessionId}`, async (event: any) => {
      try {
        logger.log('Received claude-output on reconnect:', event.payload);

        if (!isMountedRef.current) return;

        // Parse and display
        const message = JSON.parse(event.payload) as ClaudeStreamMessage;
        setMessages(prev => [...prev, message]);
      } catch (err) {
        logger.error("Failed to parse message:", err, event.payload);
      }
    });

    const errorUnlisten = await listen(`claude-error:${sessionId}`, (event: any) => {
      logger.error("Claude error:", event.payload);
      if (isMountedRef.current) {
        setError(event.payload);
      }
    });

    const completeUnlisten = await listen(`claude-complete:${sessionId}`, async (event: any) => {
      logger.log('Received claude-complete on reconnect:', event.payload);
      if (isMountedRef.current) {
        setIsLoading(false);
        hasActiveSessionRef.current = false;
      }
    });

    unlistenRefs.current = [outputUnlisten, errorUnlisten, completeUnlisten];
    
    // Mark as loading to show the session is active
    if (isMountedRef.current) {
      setIsLoading(true);
      hasActiveSessionRef.current = true;
    }
  };

  // Project path selection handled by parent tab controls

  const handleSendPrompt = async (
    prompt: string,
    model: "haiku" | "sonnet" | "opus",
    executionMode?: ExecutionMode,
    hiddenContext?: string,
    selectedElement?: SelectedElement | null,
    skipAddUserMessage?: boolean
  ) => {
    logger.log('handleSendPrompt called with:', { prompt, model, executionMode, projectPath, claudeSessionId, effectiveSession, hasHiddenContext: !!hiddenContext });

    // 1. Validate input
    const validation = validatePromptInput(prompt, projectPath);
    if (!validation.valid) {
      if (validation.error) {
        setError(validation.error);
      }
      return;
    }

    // 2. Queue if already loading
    if (isLoading) {
      const newPrompt = createQueuedPrompt(prompt, model);
      setQueuedPrompts(prev => [...prev, newPrompt]);
      return;
    }

    try {
      // 3. Setup session state
      setIsLoading(true);
      setError(null);
      hasActiveSessionRef.current = true;

      // 4. Setup session ID if resuming
      setupSessionIfNeeded({
        effectiveSession,
        claudeSessionId,
        setClaudeSessionId
      });

      // Use isFirstPromptRef.current to avoid stale closure issues when called from startNewSession
      // If isFirstPromptRef is true, ignore effectiveSession (it may be stale from previous render)
      const shouldStartNew = isFirstPromptRef.current;

      // 5. Setup event listeners if not already listening
      if (!isListeningRef.current) {
        // Clean up previous listeners
        unlistenRefs.current.forEach(unlisten => unlisten());
        unlistenRefs.current = [];

        // Mark as setting up listeners
        isListeningRef.current = true;

        // Create handler functions using extracted utilities
        const handleStreamMessage = createStreamMessageHandler({
          isMountedRef,
          accumulatedTextRef,
          setStreamingText,
          setMessages,
          sessionMetrics,
          workflowTracking,
          trackEvent
        });

        const processComplete = createCompletionHandler({
          setIsLoading,
          hasActiveSessionRef,
          isListeningRef,
          accumulatedTextRef,
          setStreamingText,
          unlistenRefs,
          effectiveSession,
          claudeSessionId,
          messages,
          sessionMetrics,
          sessionStartTime,
          totalTokens,
          queuedPrompts,
          queuedPromptsRef,  // ref를 전달하여 stale closure 문제 해결
          trackEvent,
          setQueuedPrompts,
          handleSendPrompt
        });

        // Setup all event listeners
        // Also nullify claudeSessionId when starting new session to avoid stale closure issue
        await setupEventListeners({
          claudeSessionId: shouldStartNew ? null : claudeSessionId,
          effectiveSession: shouldStartNew ? null : effectiveSession,
          handleStreamMessage,
          setError,
          processComplete,
          unlistenRefs,
          currentSessionIdRef,
          setClaudeSessionId,
          extractedSessionInfo,
          setExtractedSessionInfo,
          projectPath,
          tabType,
          messages,
          onSessionCreated,
          pendingDisplayTextRef,  // 워크플로우 displayText 매핑 전달
        });
      }

      // 6. Add user message to UI (skip if already added by startNewSession)
      // Pass selectedElement for badge display, but don't show hiddenContext
      if (!skipAddUserMessage) {
        addUserMessageToUI({ prompt, setMessages, selectedElement: selectedElement ?? undefined });
      }

      // 8. Update first message if needed
      updateSessionFirstMessage({
        isFirstPrompt,
        tabType,
        claudeSessionId,
        prompt,
        onSessionCreated
      });

      // 8. Track metrics
      trackPromptMetrics({
        sessionMetrics,
        sessionStartTime,
        messages,
        model,
        prompt,
        trackEvent
      });

      // 9. Execute the command
      // Combine visible prompt with hidden context for AI
      const fullPrompt = hiddenContext ? `${prompt}${hiddenContext}` : prompt;
      await executePromptCommand({
        effectiveSession: shouldStartNew ? null : effectiveSession,
        isFirstPrompt: shouldStartNew,
        projectPath,
        prompt: fullPrompt,
        model,
        executionMode,
        setIsFirstPrompt,
        trackEvent,
        api
      });
    } catch (err) {
      logger.error("Failed to send prompt:", err);
      setError("Failed to send prompt");
      setIsLoading(false);
      hasActiveSessionRef.current = false;
    }
  };

  // Expose sendPrompt via ref for external components (e.g., PlanningDocsPanel)
  // NOTE: This must be defined AFTER handleSendPrompt to avoid stale closure issues
  useImperativeHandle(ref, () => ({
    sendPrompt: (prompt: string, model: "haiku" | "sonnet" | "opus" = "sonnet") => {
      handleSendPrompt(prompt, model);
    },
    startNewSession: async (backendPrompt: string, userMessage?: string) => {
      // 1. Cancel any running session first (wait for completion)
      if (claudeSessionId && isLoading) {
        try {
          await api.cancelClaudeExecution(claudeSessionId);
        } catch (e) {
          console.warn('[ClaudeCodeSession] Failed to cancel previous session:', e);
        }
      }

      // 2. Clean up any existing listeners
      unlistenRefs.current.forEach(unlisten => unlisten());
      unlistenRefs.current = [];

      // 3. Reset all session state refs (prevent stale state leaking)
      isListeningRef.current = false;
      hasActiveSessionRef.current = false;
      accumulatedTextRef.current = '';
      queuedPromptsRef.current = [];
      pendingDisplayTextRef.current = null;

      // 4. Clear React state with flushSync
      // Use flushSync to ensure state updates are applied before calling handleSendPrompt
      // This prevents race condition where handleSendPrompt sees stale isFirstPrompt value
      flushSync(() => {
        setMessages([]);
        setError(null);
        setIsFirstPrompt(true);
        setTotalTokens(0);
        // Also reset session-related state to ensure clean slate
        setExtractedSessionInfo(null);
        setClaudeSessionId(null);
        setIsLoading(false);
        setStreamingText('');
        setQueuedPrompts([]);
      });

      // 5. Reset refs synchronously (not affected by React batching)
      isFirstPromptRef.current = true;
      currentSessionIdRef.current = null;

      // 6. Add display message to UI if provided (for workflow prompts)
      // userMessage는 짧은 표시 텍스트 (예: "PRD 문서 작성 시작")
      if (userMessage) {
        // backendPrompt(전체 프롬프트)와 userMessage(짧은 텍스트) 매핑 저장
        // handleSessionInit에서 세션 ID가 확정되면 SessionPersistenceService에 저장됨
        pendingDisplayTextRef.current = { prompt: backendPrompt, displayText: userMessage };

        addUserMessageToUI({
          prompt: userMessage,
          displayText: userMessage,  // displayText로도 저장하여 세션 복원 시 사용
          setMessages
        });
      }

      // 7. Send the backend prompt (full workflow prompt) to Claude
      handleSendPrompt(backendPrompt, "sonnet", undefined, undefined, undefined, userMessage ? true : false);
    },
    isLoading,
  }), [isLoading, handleSendPrompt]);

  const handleCancelExecution = async () => {
    if (!claudeSessionId) {
      logger.warn('Cannot cancel: no active session');
      return;
    }
    if (!isLoading) {
      logger.log('Cancel called but not loading, ignoring');
      return;
    }
    
    try {
      const sessionStartTime = messages.length > 0 ? messages[0].timestamp || Date.now() : Date.now();
      const duration = Date.now() - sessionStartTime;
      
      await api.cancelClaudeExecution(claudeSessionId);
      
      // Notify parent component to stop any automated workflow progression
      onStopWorkflow?.();
      
      // Calculate metrics for enhanced analytics
      const metrics = sessionMetrics.current;
      const timeToFirstMessage = metrics.firstMessageTime 
        ? metrics.firstMessageTime - sessionStartTime.current 
        : undefined;
      const idleTime = Date.now() - metrics.lastActivityTime;
      const avgResponseTime = metrics.toolExecutionTimes.length > 0
        ? metrics.toolExecutionTimes.reduce((a, b) => a + b, 0) / metrics.toolExecutionTimes.length
        : undefined;
      
      // Track enhanced session stopped
      trackEvent.enhancedSessionStopped({
        // Basic metrics
        duration_ms: duration,
        messages_count: messages.length,
        reason: 'user_stopped',
        
        // Timing metrics
        time_to_first_message_ms: timeToFirstMessage,
        average_response_time_ms: avgResponseTime,
        idle_time_ms: idleTime,
        
        // Interaction metrics
        prompts_sent: metrics.promptsSent,
        tools_executed: metrics.toolsExecuted,
        tools_failed: metrics.toolsFailed,
        files_created: metrics.filesCreated,
        files_modified: metrics.filesModified,
        files_deleted: metrics.filesDeleted,
        
        // Content metrics
        total_tokens_used: totalTokens,
        code_blocks_generated: metrics.codeBlocksGenerated,
        errors_encountered: metrics.errorsEncountered,
        
        // Session context
        model: metrics.modelChanges.length > 0 
          ? metrics.modelChanges[metrics.modelChanges.length - 1].to
          : 'sonnet', // Default to sonnet
        was_resumed: metrics.wasResumed,
        
        // Agent context (if applicable)
        agent_type: undefined, // TODO: Pass from agent execution
        agent_name: undefined, // TODO: Pass from agent execution
        agent_success: undefined, // TODO: Pass from agent execution
        
        // Stop context
        stop_source: 'user_button',
        final_state: 'cancelled',
        has_pending_prompts: queuedPrompts.length > 0,
        pending_prompts_count: queuedPrompts.length,
      });
      
      // Clean up listeners
      unlistenRefs.current.forEach(unlisten => unlisten());
      unlistenRefs.current = [];
      
      // Reset states
      setIsLoading(false);
      hasActiveSessionRef.current = false;
      isListeningRef.current = false;
      setError(null);
      
      // Clear queued prompts
      setQueuedPrompts([]);
      
      // Add a message indicating the session was cancelled
      const cancelMessage: ClaudeStreamMessage = {
        type: "system",
        subtype: "info",
        result: "Session cancelled by user",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, cancelMessage]);
    } catch (err) {
      logger.error("Failed to cancel execution:", err);
      
      // Even if backend fails, we should update UI to reflect stopped state
      // Add error message but still stop the UI loading state
      const errorMessage: ClaudeStreamMessage = {
        type: "system",
        subtype: "error",
        result: `Failed to cancel execution: ${err instanceof Error ? err.message : 'Unknown error'}. The process may still be running in the background.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Clean up listeners anyway
      unlistenRefs.current.forEach(unlisten => unlisten());
      unlistenRefs.current = [];
      
      // Reset states to allow user to continue
      setIsLoading(false);
      hasActiveSessionRef.current = false;
      isListeningRef.current = false;
      setError(null);
    }
  };

  // Handle URL detection from terminal output
  const handleLinkDetected = (url: string) => {
    if (!showPreview && !showPreviewPrompt) {
      setPreviewUrl(url);
      setShowPreviewPrompt(true);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setIsPreviewMaximized(false);
    // Keep the previewUrl so it can be restored when reopening
  };

  const handlePreviewUrlChange = (url: string) => {
    logger.log('Preview URL changed to:', url);
    setPreviewUrl(url);
  };

  const handleTogglePreviewMaximize = () => {
    setIsPreviewMaximized(!isPreviewMaximized);
    // Reset split position when toggling maximize
    if (isPreviewMaximized) {
      setSplitPosition(50);
    }
  };

  // Handle opening preview from the prompt dialog
  const handleOpenPreviewFromPrompt = () => {
    setShowPreviewPrompt(false);
    setShowPreview(true);
  };

  // Handle dismissing the preview prompt dialog
  const handleDismissPreviewPrompt = () => {
    setShowPreviewPrompt(false);
    setPreviewUrl("");
  };

  // Cleanup event listeners and track mount state
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      logger.log('Component unmounting, cleaning up listeners');
      isMountedRef.current = false;
      isListeningRef.current = false;
      
      // Track session completion with engagement metrics
      if (effectiveSession) {
        trackEvent.sessionCompleted();
        
        // Track session engagement
        const sessionDuration = sessionStartTime.current ? Date.now() - sessionStartTime.current : 0;
        const messageCount = messages.filter(m => m.type === 'user').length;
        const toolsUsed = new Set<string>();
        messages.forEach(msg => {
          if (msg.type === 'assistant' && msg.message?.content) {
            const tools = msg.message.content.filter((c: any) => c.type === 'tool_use');
            tools.forEach((tool: any) => toolsUsed.add(tool.name));
          }
        });
        
        // Calculate engagement score (0-100)
        const engagementScore = Math.min(100, 
          (messageCount * 10) + 
          (toolsUsed.size * 5) + 
          (sessionDuration > 300000 ? 20 : sessionDuration / 15000) // 5+ min session gets 20 points
        );
        
        trackEvent.sessionEngagement({
          session_duration_ms: sessionDuration,
          messages_sent: messageCount,
          tools_used: Array.from(toolsUsed),
          files_modified: 0, // TODO: Track file modifications
          engagement_score: Math.round(engagementScore)
        });
      }
      
      // Clean up listeners
      unlistenRefs.current.forEach(unlisten => unlisten());
      unlistenRefs.current = [];
    };
  }, [effectiveSession, projectPath]);

  const messagesList = (
    <div
      ref={parentRef}
      className="flex-1 overflow-y-auto relative pb-20"
      style={{
        contain: 'strict',
      }}
    >
      {/* GPT-style message container - no card boxes, natural flow */}
      <div
        className="relative w-full max-w-4xl mx-auto"
        style={{
          height: `${Math.max(rowVirtualizer.getTotalSize(), 100)}px`,
          minHeight: '100px',
        }}
      >
        {/* Remove AnimatePresence to prevent layout jitter with virtualizer */}
        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
          const message = displayableMessages[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={(el) => el && rowVirtualizer.measureElement(el)}
              className="absolute inset-x-0"
              style={{
                top: virtualItem.start,
              }}
            >
              <StreamMessage
                message={message}
                streamMessages={messages}
                onLinkDetected={handleLinkDetected}
                messageIndex={virtualItem.index}
                sessionId={claudeSessionId || undefined}
                isSessionLoading={isLoading}
              />
            </div>
          );
        })}
      </div>

      {/* Loading indicator with streaming text */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="max-w-4xl mx-auto py-3"
        >
          {streamingText ? (
            /* Show streaming text when available */
            <div className="px-2">
              <StreamingText 
                text={streamingText} 
                isStreaming={true}
                className="text-sm text-foreground"
              />
            </div>
          ) : (
            /* Show thinking indicator when no text yet */
            <div className="flex items-center gap-3 px-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>Thinking</span>
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Error indicator */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="max-w-4xl mx-auto py-4 px-4"
        >
          <div className="flex items-start gap-3 text-destructive">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="text-sm">{error}</div>
          </div>
        </motion.div>
      )}
    </div>
  );

  const projectPathInput = null; // Removed project path display

  // If preview is maximized, render only the WebviewPreview in full screen
  if (showPreview && isPreviewMaximized) {
    return (
      <AnimatePresence>
        <motion.div 
          className="fixed inset-0 z-50 bg-background"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <WebviewPreview
            initialUrl={previewUrl}
            onClose={handleClosePreview}
            isMaximized={isPreviewMaximized}
            onToggleMaximize={handleTogglePreviewMaximize}
            onUrlChange={handlePreviewUrlChange}
            className="h-full"
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn("flex flex-col h-full bg-background", className)}>
        <div className="w-full h-full flex flex-col flex-1 min-h-0">

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {showPreview ? (
            // Split pane layout when preview is active
            <SplitPane
              left={
                <div className="h-full flex flex-col">
                  {projectPathInput}
                  {messagesList}
                </div>
              }
              right={
                <WebviewPreview
                  initialUrl={previewUrl}
                  onClose={handleClosePreview}
                  isMaximized={isPreviewMaximized}
                  onToggleMaximize={handleTogglePreviewMaximize}
                  onUrlChange={handlePreviewUrlChange}
                />
              }
              initialSplit={splitPosition}
              onSplitChange={setSplitPosition}
              minLeftWidth={400}
              minRightWidth={400}
              className="h-full"
            />
          ) : (
            // Original layout when no preview
            <div className="h-full flex flex-col max-w-6xl mx-auto px-6">
              {projectPathInput}
              {messagesList}
              
              {isLoading && messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      {session ? "Loading session history..." : "Initializing Claude Code..."}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating Prompt Input - Always visible */}
        <ErrorBoundary>
          {/* Queued Prompts Display */}
          <AnimatePresence>
            {queuedPrompts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={cn(
                  embedded
                    ? "w-full px-4 pb-2"
                    : "fixed bottom-24 left-1/2 -translate-x-1/2 z-30 w-full max-w-3xl px-4"
                )}
              >
                <div className="bg-background/95 backdrop-blur-md border rounded-lg shadow-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Queued Prompts ({queuedPrompts.length})
                    </div>
                    <TooltipSimple content={queuedPromptsCollapsed ? "Expand queue" : "Collapse queue"} side="top">
                      <motion.div
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Button variant="ghost" size="icon" onClick={() => setQueuedPromptsCollapsed(prev => !prev)}>
                          {queuedPromptsCollapsed ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                      </motion.div>
                    </TooltipSimple>
                  </div>
                  {!queuedPromptsCollapsed && queuedPrompts.map((queuedPrompt, index) => (
                    <motion.div
                      key={queuedPrompt.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15, delay: index * 0.02 }}
                      className="flex items-start gap-2 bg-muted/50 rounded-md p-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
                          <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                            {queuedPrompt.model === "opus" ? "Opus" : "Sonnet"}
                          </span>
                        </div>
                        <div className="text-sm line-clamp-2 break-words">
                          <span>{queuedPrompt.prompt.length > 100 ? queuedPrompt.prompt.slice(0, 100) + '...' : queuedPrompt.prompt}</span>
                        </div>
                      </div>
                      <motion.div
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={() => setQueuedPrompts(prev => prev.filter(p => p.id !== queuedPrompt.id))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Arrows - positioned above prompt bar with spacing */}
          {displayableMessages.length > 5 && !embedded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: 0.5 }}
              className="fixed bottom-32 right-6 z-50"
            >
              <div className="flex items-center bg-background/95 backdrop-blur-md border rounded-full shadow-lg overflow-hidden">
                <TooltipSimple content="Scroll to top" side="top">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Simple direct scroll - no complex virtualizer interaction
                      parentRef.current?.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                      });
                      // Reset user scrolling flag
                      isUserScrollingRef.current = true;
                    }}
                    className="px-3 py-2 hover:bg-accent rounded-none"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </TooltipSimple>
                <div className="w-px h-4 bg-border" />
                <TooltipSimple content="Scroll to bottom" side="top">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Simple direct scroll
                      const scrollElement = parentRef.current;
                      if (scrollElement) {
                        scrollElement.scrollTo({
                          top: scrollElement.scrollHeight,
                          behavior: 'smooth'
                        });
                        // Reset user scrolling flag to allow auto-scroll
                        isUserScrollingRef.current = false;
                      }
                    }}
                    className="px-3 py-2 hover:bg-accent rounded-none"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </TooltipSimple>
              </div>
            </motion.div>
          )}

          <div className={cn(
            embedded
              ? "w-full"
              : "fixed bottom-0 left-0 right-0 z-50"
          )}>
            <FloatingPromptInput
              ref={floatingPromptRef}
              onSend={handleSendPrompt}
              onCancel={handleCancelExecution}
              isLoading={isLoading}
              disabled={!projectPath}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              projectPath={projectPath}
              embedded={embedded}
              showExecutionMode={tabType === "maintenance"}
              defaultExecutionMode={defaultExecutionMode}
              onExecutionModeChange={onExecutionModeChange}
              extraMenuItems={
                <button
                  onClick={() => {
                    setMessages([]);
                    setError(null);
                    setIsFirstPrompt(true);
                    setTotalTokens(0);
                    currentSessionIdRef.current = null;
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/80 transition-colors w-full"
                >
                  <span className="p-1.5 rounded-lg bg-muted/80">
                    <Plus className="h-4 w-4 text-primary" />
                  </span>
                  <span className="flex-1 text-left text-sm">새 세션</span>
                </button>
              }
            />
          </div>

        </ErrorBoundary>
      </div>

      {/* Slash Commands Settings Dialog */}
      {showSlashCommandsSettings && (
        <Dialog open={showSlashCommandsSettings} onOpenChange={setShowSlashCommandsSettings}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Slash Commands</DialogTitle>
              <DialogDescription>
                Manage project-specific slash commands for {projectPath}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <SlashCommandsManager projectPath={projectPath} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Preview Prompt Dialog - verifies localhost server before opening preview */}
      <PreviewPromptDialog
        url={previewUrl}
        isOpen={showPreviewPrompt}
        onOpenPreview={handleOpenPreviewFromPrompt}
        onDismiss={handleDismissPreviewPrompt}
      />
      </div>
    </TooltipProvider>
  );
});

// Display name for debugging
ClaudeCodeSession.displayName = 'ClaudeCodeSession';
