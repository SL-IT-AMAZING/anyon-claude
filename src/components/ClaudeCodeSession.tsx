import { useState, useEffect, useRef, useMemo, useImperativeHandle, forwardRef } from "react";

// Extend window for debug logging
declare global {
  interface Window {
    _streamEventLogged?: number;
  }
}
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  ChevronDown,
  GitBranch,
  ChevronUp,
  X,
  Wrench,
  FileText as FileTextIcon,
  Palette,
  Paintbrush,
  Settings,
  Boxes,
  Database,
  LayoutList,
  Rocket,
  CheckCircle,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover } from "@/components/ui/popover";
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
import { TimelineNavigator } from "./TimelineNavigator";
import { CheckpointSettings } from "./CheckpointSettings";
import { SlashCommandsManager } from "./SlashCommandsManager";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { TooltipProvider, TooltipSimple } from "@/components/ui/tooltip-modern";
import { SplitPane } from "@/components/ui/split-pane";
import { WebviewPreview } from "./WebviewPreview";
import type { ClaudeStreamMessage } from "./AgentExecution";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTrackEvent, useComponentMetrics, useWorkflowTracking } from "@/hooks";
import { SessionPersistenceService, type TabType } from "@/services/sessionPersistence";
import { getPromptDisplayInfo, isAnyonWorkflowCommand, type PromptIconType } from "@/lib/promptDisplay";

// Icon mapping for workflow prompts
const WorkflowIcon: React.FC<{ icon: PromptIconType | null; className?: string }> = ({ icon, className = "h-4 w-4" }) => {
  switch (icon) {
    case 'file-text': return <FileTextIcon className={className} />;
    case 'palette': return <Palette className={className} />;
    case 'paintbrush': return <Paintbrush className={className} />;
    case 'settings': return <Settings className={className} />;
    case 'boxes': return <Boxes className={className} />;
    case 'database': return <Database className={className} />;
    case 'layout-list': return <LayoutList className={className} />;
    case 'rocket': return <Rocket className={className} />;
    case 'check-circle': return <CheckCircle className={className} />;
    default: return null;
  }
};

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
}

/**
 * Ref handle for ClaudeCodeSession
 * Allows external components to send prompts programmatically
 */
export interface ClaudeCodeSessionRef {
  sendPrompt: (prompt: string, model?: "haiku" | "sonnet" | "opus") => void;
  startNewSession: (initialPrompt: string) => void;
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
  const [rawJsonlOutput, setRawJsonlOutput] = useState<string[]>([]);
  const [copyPopoverOpen, setCopyPopoverOpen] = useState(false);
  const [isFirstPrompt, setIsFirstPrompt] = useState(!session);
  const [totalTokens, setTotalTokens] = useState(0);
  const [extractedSessionInfo, setExtractedSessionInfo] = useState<{ sessionId: string; projectId: string } | null>(null);
  const [claudeSessionId, setClaudeSessionId] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [timelineVersion, setTimelineVersion] = useState(0);
  const [timelinePanelWidth, setTimelinePanelWidth] = useState(384); // 384px = w-96
  const [showSettings, setShowSettings] = useState(false);
  const [showForkDialog, setShowForkDialog] = useState(false);
  const [showSlashCommandsSettings, setShowSlashCommandsSettings] = useState(false);
  const [forkCheckpointId, setForkCheckpointId] = useState<string | null>(null);
  const [forkSessionName, setForkSessionName] = useState("");
  
  // Queued prompts state
  const [queuedPrompts, setQueuedPrompts] = useState<Array<{ id: string; prompt: string; displayText?: string; icon?: PromptIconType | null; model: "haiku" | "sonnet" | "opus" }>>([]);
  
  // New state for preview feature
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [showPreviewPrompt, setShowPreviewPrompt] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50);
  const [isPreviewMaximized, setIsPreviewMaximized] = useState(false);
  
  // Add collapsed state for queued prompts
  const [queuedPromptsCollapsed, setQueuedPromptsCollapsed] = useState(false);

  const parentRef = useRef<HTMLDivElement>(null);
  const unlistenRefs = useRef<UnlistenFn[]>([]);
  const hasActiveSessionRef = useRef(false);
  const floatingPromptRef = useRef<FloatingPromptInputRef>(null);
  const queuedPromptsRef = useRef<Array<{ id: string; prompt: string; displayText?: string; icon?: PromptIconType | null; model: "haiku" | "sonnet" | "opus" }>>([]);
  const isMountedRef = useRef(true);
  const isListeningRef = useRef(false);
  const sessionStartTime = useRef<number>(Date.now());
  const isIMEComposingRef = useRef(false);
  
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
    checkpointCount: 0,
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
    return null;
  }, [session, extractedSessionInfo, projectPath]);

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
    console.log('[ClaudeCodeSession] State update:', {
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
  useEffect(() => {
    if (displayableMessages.length > 0) {
      // Use a more precise scrolling method to ensure content is fully visible
      setTimeout(() => {
        const scrollElement = parentRef.current;
        if (scrollElement) {
          // First, scroll using virtualizer to get close to the bottom
          rowVirtualizer.scrollToIndex(displayableMessages.length - 1, { align: 'end', behavior: 'auto' });

          // Then use direct scroll to ensure we reach the absolute bottom
          requestAnimationFrame(() => {
            scrollElement.scrollTo({
              top: scrollElement.scrollHeight,
              behavior: 'smooth'
            });
          });
        }
      }, 50);
    }
  }, [displayableMessages.length, rowVirtualizer]);

  // Throttled auto-scroll for streaming text updates (separate from message scroll)
  const lastScrollTimeRef = useRef<number>(0);
  useEffect(() => {
    if (streamingText && isLoading) {
      const now = Date.now();
      // Throttle scroll updates to max once every 100ms during streaming
      if (now - lastScrollTimeRef.current > 100) {
        lastScrollTimeRef.current = now;
        const scrollElement = parentRef.current;
        if (scrollElement) {
          scrollElement.scrollTo({
            top: scrollElement.scrollHeight,
            behavior: 'auto'
          });
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
    
    try {
      setIsLoading(true);
      setError(null);
      
      const history = await api.loadSessionHistory(session.id, session.project_id);
      
      // Save session data for restoration
      if (history && history.length > 0) {
        SessionPersistenceService.saveSession(
          session.id,
          session.project_id,
          session.project_path,
          history.length
        );
      }
      
      // Convert history to messages format
      const loadedMessages: ClaudeStreamMessage[] = history.map(entry => ({
        ...entry,
        type: entry.type || "assistant"
      }));
      
      setMessages(loadedMessages);
      setRawJsonlOutput(history.map(h => JSON.stringify(h)));
      
      // After loading history, we're continuing a conversation
      setIsFirstPrompt(false);
      
      // Scroll to bottom after loading history
      setTimeout(() => {
        if (loadedMessages.length > 0) {
          const scrollElement = parentRef.current;
          if (scrollElement) {
            // Use the same improved scrolling method
            rowVirtualizer.scrollToIndex(loadedMessages.length - 1, { align: 'end', behavior: 'auto' });
            requestAnimationFrame(() => {
              scrollElement.scrollTo({
                top: scrollElement.scrollHeight,
                behavior: 'auto'
              });
            });
          }
        }
      }, 100);
    } catch (err) {
      console.error("Failed to load session history:", err);
      setError("Failed to load session history");
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
          console.log('[ClaudeCodeSession] Found active session, reconnecting:', session.id);
          // IMPORTANT: Set claudeSessionId before reconnecting
          setClaudeSessionId(session.id);
          
          // Don't add buffered messages here - they've already been loaded by loadSessionHistory
          // Just set up listeners for new messages
          
          // Set up listeners for the active session
          reconnectToSession(session.id);
        }
      } catch (err) {
        console.error('Failed to check for active sessions:', err);
      }
    }
  };

  const reconnectToSession = async (sessionId: string) => {
    console.log('[ClaudeCodeSession] Reconnecting to session:', sessionId);
    
    // Prevent duplicate listeners
    if (isListeningRef.current) {
      console.log('[ClaudeCodeSession] Already listening to session, skipping reconnect');
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
        console.log('[ClaudeCodeSession] Received claude-output on reconnect:', event.payload);
        
        if (!isMountedRef.current) return;
        
        // Store raw JSONL
        setRawJsonlOutput(prev => [...prev, event.payload]);
        
        // Parse and display
        const message = JSON.parse(event.payload) as ClaudeStreamMessage;
        setMessages(prev => [...prev, message]);
      } catch (err) {
        console.error("Failed to parse message:", err, event.payload);
      }
    });

    const errorUnlisten = await listen(`claude-error:${sessionId}`, (event: any) => {
      console.error("Claude error:", event.payload);
      if (isMountedRef.current) {
        setError(event.payload);
      }
    });

    const completeUnlisten = await listen(`claude-complete:${sessionId}`, async (event: any) => {
      console.log('[ClaudeCodeSession] Received claude-complete on reconnect:', event.payload);
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

  // Expose sendPrompt via ref for external components (e.g., PlanningDocsPanel)
  useImperativeHandle(ref, () => ({
    sendPrompt: (prompt: string, model: "haiku" | "sonnet" | "opus" = "sonnet") => {
      handleSendPrompt(prompt, model);
    },
    startNewSession: (initialPrompt: string) => {
      // Clear current session and start a new one
      setMessages([]);
      setRawJsonlOutput([]);
      setError(null);
      setIsFirstPrompt(true);
      setTotalTokens(0);
      // Send the initial prompt (slash command will be processed by Claude Code directly)
      handleSendPrompt(initialPrompt, "sonnet");
    },
    isLoading,
  }), [isLoading]);

  const handleSendPrompt = async (prompt: string, model: "haiku" | "sonnet" | "opus", executionMode?: ExecutionMode) => {
    console.log('[ClaudeCodeSession] handleSendPrompt called with:', { prompt, model, executionMode, projectPath, claudeSessionId, effectiveSession });

    if (!projectPath) {
      setError("Please select a project directory first");
      return;
    }

    // If already loading, queue the prompt
    if (isLoading) {
      const displayInfo = isAnyonWorkflowCommand(prompt) ? getPromptDisplayInfo(prompt) : null;
      const newPrompt = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        prompt,
        displayText: displayInfo?.text,
        icon: displayInfo?.icon,
        model
      };
      setQueuedPrompts(prev => [...prev, newPrompt]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      hasActiveSessionRef.current = true;
      
      // For resuming sessions, ensure we have the session ID
      if (effectiveSession && !claudeSessionId) {
        setClaudeSessionId(effectiveSession.id);
      }
      
      // Only clean up and set up new listeners if not already listening
      if (!isListeningRef.current) {
        // Clean up previous listeners
        unlistenRefs.current.forEach(unlisten => unlisten());
        unlistenRefs.current = [];
        
        // Mark as setting up listeners
        isListeningRef.current = true;
        
        // --------------------------------------------------------------------
        // 1️⃣  Event Listener Setup Strategy
        // --------------------------------------------------------------------
        // Claude Code may emit a *new* session_id even when we pass --resume. If
        // we listen only on the old session-scoped channel we will miss the
        // stream until the user navigates away & back. To avoid this we:
        //   • Always start with GENERIC listeners (no suffix) so we catch the
        //     very first "system:init" message regardless of the session id.
        //   • Once that init message provides the *actual* session_id, we
        //     dynamically switch to session-scoped listeners and stop the
        //     generic ones to prevent duplicate handling.
        // --------------------------------------------------------------------

        console.log('[ClaudeCodeSession] Setting up generic event listeners first');

        let currentSessionId: string | null = claudeSessionId || effectiveSession?.id || null;

        // Helper to attach session-specific listeners **once we are sure**
        const attachSessionSpecificListeners = async (sid: string) => {
          console.log('[ClaudeCodeSession] Attaching session-specific listeners for', sid);

          const specificOutputUnlisten = await listen(`claude-output:${sid}`, (evt: any) => {
            handleStreamMessage(evt.payload);
          });

          const specificErrorUnlisten = await listen(`claude-error:${sid}`, (evt: any) => {
            console.error('Claude error (scoped):', evt.payload);
            setError(evt.payload);
          });

          const specificCompleteUnlisten = await listen(`claude-complete:${sid}`, (evt: any) => {
            console.log('[ClaudeCodeSession] Received claude-complete (scoped):', evt.payload);
            processComplete(evt.payload);
          });

          // Replace existing unlisten refs with these new ones (after cleaning up)
          unlistenRefs.current.forEach((u) => u());
          unlistenRefs.current = [specificOutputUnlisten, specificErrorUnlisten, specificCompleteUnlisten];
        };

        // Generic listeners (catch-all)
        const genericOutputUnlisten = await listen('claude-output', async (event: any) => {
          handleStreamMessage(event.payload);

          // Attempt to extract session_id on the fly (for the very first init)
          try {
            const msg = JSON.parse(event.payload) as ClaudeStreamMessage;
            if (msg.type === 'system' && msg.subtype === 'init' && msg.session_id) {
              if (!currentSessionId || currentSessionId !== msg.session_id) {
                console.log('[ClaudeCodeSession] Detected new session_id from generic listener:', msg.session_id);
                currentSessionId = msg.session_id;
                setClaudeSessionId(msg.session_id);

                // If we haven't extracted session info before, do it now
                if (!extractedSessionInfo) {
                  const projectId = projectPath.replace(/[^a-zA-Z0-9]/g, '-');
                  setExtractedSessionInfo({ sessionId: msg.session_id, projectId });

                  // Save session data for restoration (tab-specific if tabType provided)
                  if (tabType) {
                    SessionPersistenceService.saveSessionForTab(
                      msg.session_id,
                      projectId,
                      projectPath,
                      tabType,
                      undefined, // firstMessage will be updated later
                      messages.length
                    );
                    SessionPersistenceService.saveLastSessionForTab(projectPath, tabType, msg.session_id);
                  } else {
                    SessionPersistenceService.saveSession(
                      msg.session_id,
                      projectId,
                      projectPath,
                      messages.length
                    );
                  }

                  // Notify parent about new session
                  onSessionCreated?.(msg.session_id);
                }

                // Switch to session-specific listeners
                await attachSessionSpecificListeners(msg.session_id);
              }
            }
          } catch {
            /* ignore parse errors */
          }
        });

        // Helper to process any JSONL stream message string or object
        function handleStreamMessage(payload: string | ClaudeStreamMessage) {
          try {
            // Don't process if component unmounted
            if (!isMountedRef.current) return;
            
            let message: ClaudeStreamMessage;
            let rawPayload: string;
            
            if (typeof payload === 'string') {
              // Tauri mode: payload is a JSON string
              rawPayload = payload;
              message = JSON.parse(payload) as ClaudeStreamMessage;
            } else {
              // Web mode: payload is already parsed object
              message = payload;
              rawPayload = JSON.stringify(payload);
            }
            
            console.log('[ClaudeCodeSession] handleStreamMessage - message type:', message.type);

            // Store raw JSONL
            setRawJsonlOutput((prev) => [...prev, rawPayload]);

            // Track enhanced tool execution
            if (message.type === 'assistant' && message.message?.content) {
              const toolUses = message.message.content.filter((c: any) => c.type === 'tool_use');
              toolUses.forEach((toolUse: any) => {
                // Increment tools executed counter
                sessionMetrics.current.toolsExecuted += 1;
                sessionMetrics.current.lastActivityTime = Date.now();

                // Track file operations
                const toolName = toolUse.name?.toLowerCase() || '';
                if (toolName.includes('create') || toolName.includes('write')) {
                  sessionMetrics.current.filesCreated += 1;
                } else if (toolName.includes('edit') || toolName.includes('multiedit') || toolName.includes('search_replace')) {
                  sessionMetrics.current.filesModified += 1;
                } else if (toolName.includes('delete')) {
                  sessionMetrics.current.filesDeleted += 1;
                }

                // Track tool start - we'll track completion when we get the result
                workflowTracking.trackStep(toolUse.name);
              });
            }

            // Track tool results
            if (message.type === 'user' && message.message?.content) {
              const toolResults = message.message.content.filter((c: any) => c.type === 'tool_result');
              toolResults.forEach((result: any) => {
                const isError = result.is_error || false;
                // Note: We don't have execution time here, but we can track success/failure
                if (isError) {
                  sessionMetrics.current.toolsFailed += 1;
                  sessionMetrics.current.errorsEncountered += 1;

                  trackEvent.enhancedError({
                    error_type: 'tool_execution',
                    error_code: 'tool_failed',
                    error_message: result.content,
                    context: `Tool execution failed`,
                    user_action_before_error: 'executing_tool',
                    recovery_attempted: false,
                    recovery_successful: false,
                    error_frequency: 1,
                    stack_trace_hash: undefined
                  });
                }
              });
            }

            // Track code blocks generated
            if (message.type === 'assistant' && message.message?.content) {
              const codeBlocks = message.message.content.filter((c: any) =>
                c.type === 'text' && c.text?.includes('```')
              );
              if (codeBlocks.length > 0) {
                // Count code blocks in text content
                codeBlocks.forEach((block: any) => {
                  const matches = (block.text.match(/```/g) || []).length;
                  sessionMetrics.current.codeBlocksGenerated += Math.floor(matches / 2);
                });
              }
            }

            // Track errors in system messages
            if (message.type === 'system' && (message.subtype === 'error' || message.error)) {
              sessionMetrics.current.errorsEncountered += 1;
            }

            // Handle streaming text for real-time typing effect
            if ((message as any).type === 'content_block_delta') {
              const delta = (message as any).delta;
              if (delta?.type === 'text_delta' && delta?.text) {
                accumulatedTextRef.current += delta.text;
                setStreamingText(accumulatedTextRef.current);
              }
              return; // Don't add delta messages to the message list
            } else if ((message as any).type === 'stream_event') {
              // Handle stream_event which wraps the actual streaming data
              const streamEvent = message as any;

              // Debug: Log stream_event structure (first few only)
              if (!window._streamEventLogged) {
                window._streamEventLogged = 0;
              }
              if (window._streamEventLogged < 5) {
                console.log('[stream_event] Full structure:', JSON.stringify(streamEvent, null, 2));
                window._streamEventLogged++;
              }

              // Check for content_block_delta inside stream_event
              if (streamEvent.event?.type === 'content_block_delta') {
                const delta = streamEvent.event.delta;
                if (delta?.type === 'text_delta' && delta?.text) {
                  accumulatedTextRef.current += delta.text;
                  setStreamingText(accumulatedTextRef.current);
                }
                return; // Don't add to message list
              }

              // Check for raw text in various possible locations
              const textContent = streamEvent.text || streamEvent.content ||
                                  streamEvent.event?.text || streamEvent.event?.content ||
                                  streamEvent.delta?.text;
              if (typeof textContent === 'string' && textContent) {
                accumulatedTextRef.current += textContent;
                setStreamingText(accumulatedTextRef.current);
                return;
              }

              // For message_start, clear accumulated text
              if (streamEvent.event?.type === 'message_start') {
                accumulatedTextRef.current = '';
                setStreamingText('');
              }

              // For message_stop, also clear
              if (streamEvent.event?.type === 'message_stop') {
                accumulatedTextRef.current = '';
                setStreamingText('');
              }

              return; // Don't add stream_event to message list
            } else if ((message as any).type === 'partial') {
              const partialContent = (message as any).content;
              if (typeof partialContent === 'string') {
                accumulatedTextRef.current += partialContent;
                setStreamingText(accumulatedTextRef.current);
              }
            } else if (message.type === 'assistant' && message.message?.content) {
              // Full assistant message arrived - clear streaming text
              if (accumulatedTextRef.current) {
                accumulatedTextRef.current = '';
                setStreamingText('');
              }
            }

            setMessages((prev) => [...prev, message]);
          } catch (err) {
            console.error('Failed to parse message:', err, payload);
          }
        }

        // Helper to handle completion events (both generic and scoped)
        const processComplete = async (success: boolean) => {
          setIsLoading(false);
          hasActiveSessionRef.current = false;
          isListeningRef.current = false; // Reset listening state
          
          // Clear streaming text on completion
          accumulatedTextRef.current = '';
          setStreamingText('');
          
          // Track enhanced session stopped metrics when session completes
          if (effectiveSession && claudeSessionId) {
            const sessionStartTimeValue = messages.length > 0 ? messages[0].timestamp || Date.now() : Date.now();
            const duration = Date.now() - sessionStartTimeValue;
            const metrics = sessionMetrics.current;
            const timeToFirstMessage = metrics.firstMessageTime 
              ? metrics.firstMessageTime - sessionStartTime.current 
              : undefined;
            const idleTime = Date.now() - metrics.lastActivityTime;
            const avgResponseTime = metrics.toolExecutionTimes.length > 0
              ? metrics.toolExecutionTimes.reduce((a, b) => a + b, 0) / metrics.toolExecutionTimes.length
              : undefined;
            
            trackEvent.enhancedSessionStopped({
              // Basic metrics
              duration_ms: duration,
              messages_count: messages.length,
              reason: success ? 'completed' : 'error',
              
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
                : 'sonnet',
              has_checkpoints: metrics.checkpointCount > 0,
              checkpoint_count: metrics.checkpointCount,
              was_resumed: metrics.wasResumed,
              
              // Agent context (if applicable)
              agent_type: undefined, // TODO: Pass from agent execution
              agent_name: undefined, // TODO: Pass from agent execution
              agent_success: success,
              
              // Stop context
              stop_source: 'completed',
              final_state: success ? 'success' : 'failed',
              has_pending_prompts: queuedPrompts.length > 0,
              pending_prompts_count: queuedPrompts.length,
            });
          }

          if (effectiveSession && success) {
            try {
              const settings = await api.getCheckpointSettings(
                effectiveSession.id,
                effectiveSession.project_id,
                projectPath
              );

              if (settings.auto_checkpoint_enabled) {
                await api.checkAutoCheckpoint(
                  effectiveSession.id,
                  effectiveSession.project_id,
                  projectPath,
                  prompt
                );
                // Reload timeline to show new checkpoint
                setTimelineVersion((v) => v + 1);
              }
            } catch (err) {
              console.error('Failed to check auto checkpoint:', err);
            }
          }

          // Process queued prompts after completion
          if (queuedPromptsRef.current.length > 0) {
            const [nextPrompt, ...remainingPrompts] = queuedPromptsRef.current;
            setQueuedPrompts(remainingPrompts);
            
            // Small delay to ensure UI updates
            setTimeout(() => {
              handleSendPrompt(nextPrompt.prompt, nextPrompt.model);
            }, 100);
          }
        };

        const genericErrorUnlisten = await listen('claude-error', (evt: any) => {
          console.error('Claude error:', evt.payload);
          setError(evt.payload);
        });

        const genericCompleteUnlisten = await listen('claude-complete', (evt: any) => {
          console.log('[ClaudeCodeSession] Received claude-complete (generic):', evt.payload);
          processComplete(evt.payload);
        });

        // Store the generic unlisteners for now; they may be replaced later.
        unlistenRefs.current = [genericOutputUnlisten, genericErrorUnlisten, genericCompleteUnlisten];

        // --------------------------------------------------------------------
        // 2️⃣  Auto-checkpoint logic moved after listener setup (unchanged)
        // --------------------------------------------------------------------

        // Add the user message immediately to the UI (after setting up listeners)
        const userMessage: ClaudeStreamMessage = {
          type: "user",
          message: {
            content: [
              {
                type: "text",
                text: prompt
              }
            ]
          }
        };
        setMessages(prev => [...prev, userMessage]);

        // Update first message for session if this is the first prompt
        if (isFirstPrompt && tabType && claudeSessionId) {
          const truncatedPrompt = prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt;
          SessionPersistenceService.updateSessionFirstMessage(claudeSessionId, truncatedPrompt);
          onSessionCreated?.(claudeSessionId, truncatedPrompt);
        }

        // Update session metrics
        sessionMetrics.current.promptsSent += 1;
        sessionMetrics.current.lastActivityTime = Date.now();
        if (!sessionMetrics.current.firstMessageTime) {
          sessionMetrics.current.firstMessageTime = Date.now();
        }
        
        // Track model changes
        const lastModel = sessionMetrics.current.modelChanges.length > 0 
          ? sessionMetrics.current.modelChanges[sessionMetrics.current.modelChanges.length - 1].to
          : (sessionMetrics.current.wasResumed ? 'sonnet' : model); // Default to sonnet if resumed
        
        if (lastModel !== model) {
          sessionMetrics.current.modelChanges.push({
            from: lastModel,
            to: model,
            timestamp: Date.now()
          });
        }
        
        // Track enhanced prompt submission
        const codeBlockMatches = prompt.match(/```[\s\S]*?```/g) || [];
        const hasCode = codeBlockMatches.length > 0;
        const conversationDepth = messages.filter(m => m.user_message).length;
        const sessionAge = sessionStartTime.current ? Date.now() - sessionStartTime.current : 0;
        const wordCount = prompt.split(/\s+/).filter(word => word.length > 0).length;
        
        trackEvent.enhancedPromptSubmitted({
          prompt_length: prompt.length,
          model: model,
          has_attachments: false, // TODO: Add attachment support when implemented
          source: 'keyboard', // TODO: Track actual source (keyboard vs button)
          word_count: wordCount,
          conversation_depth: conversationDepth,
          prompt_complexity: wordCount < 20 ? 'simple' : wordCount < 100 ? 'moderate' : 'complex',
          contains_code: hasCode,
          language_detected: hasCode ? codeBlockMatches?.[0]?.match(/```(\w+)/)?.[1] : undefined,
          session_age_ms: sessionAge
        });

        // Execute the appropriate command
        // Pass executionMode to use --permission-mode plan when plan mode is selected
        if (effectiveSession && !isFirstPrompt) {
          console.log('[ClaudeCodeSession] Resuming session:', effectiveSession.id, 'executionMode:', executionMode);
          trackEvent.sessionResumed(effectiveSession.id);
          trackEvent.modelSelected(model);
          await api.resumeClaudeCode(projectPath, effectiveSession.id, prompt, model, executionMode);
        } else {
          console.log('[ClaudeCodeSession] Starting new session, executionMode:', executionMode);
          setIsFirstPrompt(false);
          trackEvent.sessionCreated(model, 'prompt_input');
          trackEvent.modelSelected(model);
          await api.executeClaudeCode(projectPath, prompt, model, executionMode);
        }
      }
    } catch (err) {
      console.error("Failed to send prompt:", err);
      setError("Failed to send prompt");
      setIsLoading(false);
      hasActiveSessionRef.current = false;
    }
  };

  const handleCopyAsJsonl = async () => {
    const jsonl = rawJsonlOutput.join('\n');
    await navigator.clipboard.writeText(jsonl);
    setCopyPopoverOpen(false);
  };

  const handleCopyAsMarkdown = async () => {
    let markdown = `# Claude Code Session\n\n`;
    markdown += `**Project:** ${projectPath}\n`;
    markdown += `**Date:** ${new Date().toISOString()}\n\n`;
    markdown += `---\n\n`;

    for (const msg of messages) {
      if (msg.type === "system" && msg.subtype === "init") {
        markdown += `## System Initialization\n\n`;
        markdown += `- Session ID: \`${msg.session_id || 'N/A'}\`\n`;
        markdown += `- Model: \`${msg.model || 'default'}\`\n`;
        if (msg.cwd) markdown += `- Working Directory: \`${msg.cwd}\`\n`;
        if (msg.tools?.length) markdown += `- Tools: ${msg.tools.join(', ')}\n`;
        markdown += `\n`;
      } else if (msg.type === "assistant" && msg.message) {
        markdown += `## Assistant\n\n`;
        for (const content of msg.message.content || []) {
          if (content.type === "text") {
            const textContent = typeof content.text === 'string' 
              ? content.text 
              : (content.text?.text || JSON.stringify(content.text || content));
            markdown += `${textContent}\n\n`;
          } else if (content.type === "tool_use") {
            markdown += `### Tool: ${content.name}\n\n`;
            markdown += `\`\`\`json\n${JSON.stringify(content.input, null, 2)}\n\`\`\`\n\n`;
          }
        }
        if (msg.message.usage) {
          markdown += `*Tokens: ${msg.message.usage.input_tokens} in, ${msg.message.usage.output_tokens} out*\n\n`;
        }
      } else if (msg.type === "user" && msg.message) {
        markdown += `## User\n\n`;
        for (const content of msg.message.content || []) {
          if (content.type === "text") {
            const textContent = typeof content.text === 'string' 
              ? content.text 
              : (content.text?.text || JSON.stringify(content.text));
            markdown += `${textContent}\n\n`;
          } else if (content.type === "tool_result") {
            markdown += `### Tool Result\n\n`;
            let contentText = '';
            if (typeof content.content === 'string') {
              contentText = content.content;
            } else if (content.content && typeof content.content === 'object') {
              if (content.content.text) {
                contentText = content.content.text;
              } else if (Array.isArray(content.content)) {
                contentText = content.content
                  .map((c: any) => (typeof c === 'string' ? c : c.text || JSON.stringify(c)))
                  .join('\n');
              } else {
                contentText = JSON.stringify(content.content, null, 2);
              }
            }
            markdown += `\`\`\`\n${contentText}\n\`\`\`\n\n`;
          }
        }
      } else if (msg.type === "result") {
        markdown += `## Execution Result\n\n`;
        if (msg.result) {
          markdown += `${msg.result}\n\n`;
        }
        if (msg.error) {
          markdown += `**Error:** ${msg.error}\n\n`;
        }
      }
    }

    await navigator.clipboard.writeText(markdown);
    setCopyPopoverOpen(false);
  };

  const handleCheckpointSelect = async () => {
    // Reload messages from the checkpoint
    await loadSessionHistory();
    // Ensure timeline reloads to highlight current checkpoint
    setTimelineVersion((v) => v + 1);
  };
  
  const handleCheckpointCreated = () => {
    // Update checkpoint count in session metrics
    sessionMetrics.current.checkpointCount += 1;
  };

  const handleCancelExecution = async () => {
    if (!claudeSessionId || !isLoading) return;
    
    try {
      const sessionStartTime = messages.length > 0 ? messages[0].timestamp || Date.now() : Date.now();
      const duration = Date.now() - sessionStartTime;
      
      await api.cancelClaudeExecution(claudeSessionId);
      
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
        has_checkpoints: metrics.checkpointCount > 0,
        checkpoint_count: metrics.checkpointCount,
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
      console.error("Failed to cancel execution:", err);
      
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

  const handleFork = (checkpointId: string) => {
    setForkCheckpointId(checkpointId);
    setForkSessionName(`Fork-${new Date().toISOString().slice(0, 10)}`);
    setShowForkDialog(true);
  };

  const handleCompositionStart = () => {
    isIMEComposingRef.current = true;
  };

  const handleCompositionEnd = () => {
    setTimeout(() => {
      isIMEComposingRef.current = false;
    }, 0);
  };

  const handleConfirmFork = async () => {
    if (!forkCheckpointId || !forkSessionName.trim() || !effectiveSession) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const newSessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await api.forkFromCheckpoint(
        forkCheckpointId,
        effectiveSession.id,
        effectiveSession.project_id,
        projectPath,
        newSessionId,
        forkSessionName
      );
      
      // Open the new forked session
      // You would need to implement navigation to the new session
      console.log("Forked to new session:", newSessionId);
      
      setShowForkDialog(false);
      setForkCheckpointId(null);
      setForkSessionName("");
    } catch (err) {
      console.error("Failed to fork checkpoint:", err);
      setError("Failed to fork checkpoint");
    } finally {
      setIsLoading(false);
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
    console.log('[ClaudeCodeSession] Preview URL changed to:', url);
    setPreviewUrl(url);
  };

  const handleTogglePreviewMaximize = () => {
    setIsPreviewMaximized(!isPreviewMaximized);
    // Reset split position when toggling maximize
    if (isPreviewMaximized) {
      setSplitPosition(50);
    }
  };

  // Cleanup event listeners and track mount state
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      console.log('[ClaudeCodeSession] Component unmounting, cleaning up listeners');
      isMountedRef.current = false;
      isListeningRef.current = false;
      
      // Track session completion with engagement metrics
      if (effectiveSession) {
        trackEvent.sessionCompleted();
        
        // Track session engagement
        const sessionDuration = sessionStartTime.current ? Date.now() - sessionStartTime.current : 0;
        const messageCount = messages.filter(m => m.user_message).length;
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
      
      // Clear checkpoint manager when session ends
      if (effectiveSession) {
        api.clearCheckpointManager(effectiveSession.id).catch(err => {
          console.error("Failed to clear checkpoint manager:", err);
        });
      }
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
        <AnimatePresence>
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const message = displayableMessages[virtualItem.index];
            return (
              <motion.div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={(el) => el && rowVirtualizer.measureElement(el)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-x-0"
                style={{
                  top: virtualItem.start,
                }}
              >
                <StreamMessage 
                  message={message} 
                  streamMessages={messages}
                  onLinkDetected={handleLinkDetected}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
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
        <div className="w-full h-full flex flex-col">

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
                        <div className="flex items-center gap-2 text-sm line-clamp-2 break-words">
                          {queuedPrompt.icon && <WorkflowIcon icon={queuedPrompt.icon} className="h-3.5 w-3.5 flex-shrink-0 text-primary" />}
                          <span>{queuedPrompt.displayText || queuedPrompt.prompt}</span>
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
                  <motion.div
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                      // Use virtualizer to scroll to the first item
                      if (displayableMessages.length > 0) {
                        // Scroll to top of the container
                        parentRef.current?.scrollTo({
                          top: 0,
                          behavior: 'smooth'
                        });
                        
                        // After smooth scroll completes, trigger a small scroll to ensure rendering
                        setTimeout(() => {
                          if (parentRef.current) {
                            // Scroll down 1px then back to 0 to trigger virtualizer update
                            parentRef.current.scrollTop = 1;
                            requestAnimationFrame(() => {
                              if (parentRef.current) {
                                parentRef.current.scrollTop = 0;
                              }
                            });
                          }
                        }, 500); // Wait for smooth scroll to complete
                      }
                    }}
                      className="px-3 py-2 hover:bg-accent rounded-none"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </TooltipSimple>
                <div className="w-px h-4 bg-border" />
                <TooltipSimple content="Scroll to bottom" side="top">
                  <motion.div
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Use the improved scrolling method for manual scroll to bottom
                        if (displayableMessages.length > 0) {
                          const scrollElement = parentRef.current;
                          if (scrollElement) {
                            // First, scroll using virtualizer to get close to the bottom
                            rowVirtualizer.scrollToIndex(displayableMessages.length - 1, { align: 'end', behavior: 'auto' });

                            // Then use direct scroll to ensure we reach the absolute bottom
                            requestAnimationFrame(() => {
                              scrollElement.scrollTo({
                                top: scrollElement.scrollHeight,
                                behavior: 'smooth'
                              });
                            });
                          }
                        }
                      }}
                      className="px-3 py-2 hover:bg-accent rounded-none"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </motion.div>
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
              projectPath={projectPath}
              embedded={embedded}
              showExecutionMode={tabType === "maintenance"}
              extraMenuItems={
                <>
                  {effectiveSession && (
                    <TooltipSimple content="Session Timeline" side="top">
                      <motion.div
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowTimeline(!showTimeline)}
                          className="h-9 w-9 text-muted-foreground hover:text-foreground"
                        >
                          <GitBranch className={cn("h-3.5 w-3.5", showTimeline && "text-primary")} />
                        </Button>
                      </motion.div>
                    </TooltipSimple>
                  )}
                  {messages.length > 0 && (
                    <Popover
                      trigger={
                        <TooltipSimple content="Copy conversation" side="top">
                          <motion.div
                            whileTap={{ scale: 0.97 }}
                            transition={{ duration: 0.15 }}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-muted-foreground hover:text-foreground"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </motion.div>
                        </TooltipSimple>
                      }
                      content={
                        <div className="w-44 p-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopyAsMarkdown}
                            className="w-full justify-start text-xs"
                          >
                            Copy as Markdown
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopyAsJsonl}
                            className="w-full justify-start text-xs"
                          >
                            Copy as JSONL
                          </Button>
                        </div>
                      }
                      open={copyPopoverOpen}
                      onOpenChange={setCopyPopoverOpen}
                      side="top"
                      align="end"
                    />
                  )}
                  <TooltipSimple content="Checkpoint Settings" side="top">
                    <motion.div
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowSettings(!showSettings)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Wrench className={cn("h-3.5 w-3.5", showSettings && "text-primary")} />
                      </Button>
                    </motion.div>
                  </TooltipSimple>
                </>
              }
            />
          </div>

        </ErrorBoundary>

        {/* Timeline Overlay */}
        <AnimatePresence>
          {showTimeline && effectiveSession && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/20 z-40"
                onClick={() => setShowTimeline(false)}
              />
              {/* Panel */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="fixed right-0 top-9 h-[calc(100%-2.25rem)] bg-background border-l border-border shadow-xl z-50 overflow-hidden"
                style={{ width: `${timelinePanelWidth}px`, minWidth: '280px', maxWidth: '800px' }}
              >
                {/* Resize Handle */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary/50 active:bg-primary/70 transition-colors z-10"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const startX = e.clientX;
                    const startWidth = timelinePanelWidth;
                    
                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      const delta = startX - moveEvent.clientX;
                      const newWidth = Math.min(800, Math.max(280, startWidth + delta));
                      setTimelinePanelWidth(newWidth);
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                />
                <div className="h-full flex flex-col">
                  {/* Timeline Header */}
                  <div className="flex items-center justify-between p-4 border-b border-border tauri-no-drag">
                    <h3 className="text-lg font-semibold">작업 히스토리</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowTimeline(false)}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Timeline Content */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <TimelineNavigator
                      sessionId={effectiveSession.id}
                      projectId={effectiveSession.project_id}
                      projectPath={projectPath}
                      currentMessageIndex={messages.length - 1}
                      onCheckpointSelect={handleCheckpointSelect}
                      onFork={handleFork}
                      onCheckpointCreated={handleCheckpointCreated}
                      refreshVersion={timelineVersion}
                    />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Fork Dialog */}
      <Dialog open={showForkDialog} onOpenChange={setShowForkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fork Session</DialogTitle>
            <DialogDescription>
              Create a new session branch from the selected checkpoint.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fork-name">New Session Name</Label>
              <Input
                id="fork-name"
                placeholder="e.g., Alternative approach"
                value={forkSessionName}
                onChange={(e) => setForkSessionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading) {
                    if (e.nativeEvent.isComposing || isIMEComposingRef.current) {
                      return;
                    }
                    handleConfirmFork();
                  }
                }}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowForkDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmFork}
              disabled={isLoading || !forkSessionName.trim()}
            >
              Create Fork
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      {showSettings && effectiveSession && (
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="max-w-2xl">
            <CheckpointSettings
              sessionId={effectiveSession.id}
              projectId={effectiveSession.project_id}
              projectPath={projectPath}
              onClose={() => setShowSettings(false)}
            />
          </DialogContent>
        </Dialog>
      )}

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
      </div>
    </TooltipProvider>
  );
});

// Display name for debugging
ClaudeCodeSession.displayName = 'ClaudeCodeSession';
