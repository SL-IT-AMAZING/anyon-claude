/**
 * Extracted handlers and utilities for ClaudeCodeSession handleSendPrompt
 * Addresses frontend-bloat-002 (P1 priority) - 505-line function refactoring
 */

import type { ClaudeStreamMessage } from "../AgentExecution";
import { SessionPersistenceService, type TabType } from "@/services/sessionPersistence";
import type { Session } from "@/lib/api";
import type { SelectedElement } from "@/types/preview";
import { listen as tauriListen } from "@tauri-apps/api/event";
import { usePreviewStore } from "@/stores/previewStore";
import { detectPortFromMessage } from "@/lib/portDetection";
import { flushSync } from "react-dom";

type UnlistenFn = () => void;

// ============================================================================
// 1. VALIDATION
// ============================================================================

export interface PromptValidationResult {
  valid: boolean;
  error?: string;
}

export function validatePromptInput(
  prompt: string,
  projectPath: string
): PromptValidationResult {
  if (!projectPath?.trim()) {
    return {
      valid: false,
      error: "Please select a project directory first"
    };
  }

  if (!prompt?.trim()) {
    console.warn('[ClaudeCodeSession] Empty prompt received, ignoring');
    return {
      valid: false
    };
  }

  return { valid: true };
}

// ============================================================================
// 2. QUEUE MANAGEMENT
// ============================================================================

export interface QueuedPrompt {
  id: string;
  prompt: string;
  model: "haiku" | "sonnet" | "opus";
}

export function createQueuedPrompt(
  prompt: string,
  model: "haiku" | "sonnet" | "opus"
): QueuedPrompt {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    prompt,
    model
  };
}

// ============================================================================
// 3. SESSION SETUP
// ============================================================================

export interface SessionSetupOptions {
  effectiveSession: Session | null;
  claudeSessionId: string | null;
  setClaudeSessionId: (id: string) => void;
}

export function setupSessionIfNeeded(options: SessionSetupOptions): void {
  const { effectiveSession, claudeSessionId, setClaudeSessionId } = options;

  // For resuming sessions, ensure we have the session ID
  if (effectiveSession && !claudeSessionId) {
    setClaudeSessionId(effectiveSession.id);
  }
}

// ============================================================================
// 4. STREAM MESSAGE HANDLING
// ============================================================================

export interface StreamMessageHandlerOptions {
  isMountedRef: React.MutableRefObject<boolean>;
  accumulatedTextRef: React.MutableRefObject<string>;
  setStreamingText: (text: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<ClaudeStreamMessage[]>>;
  sessionMetrics: React.MutableRefObject<{
    toolsExecuted: number;
    lastActivityTime: number;
    filesCreated: number;
    filesModified: number;
    filesDeleted: number;
    toolsFailed: number;
    errorsEncountered: number;
    codeBlocksGenerated: number;
  }>;
  workflowTracking: {
    trackStep: (step: string) => void;
  };
  trackEvent: {
    enhancedError: (params: any) => void;
  };
}

export function createStreamMessageHandler(
  options: StreamMessageHandlerOptions
) {
  return function handleStreamMessage(payload: string | ClaudeStreamMessage) {
    try {
      // Don't process if component unmounted
      if (!options.isMountedRef.current) return;

      let message: ClaudeStreamMessage;

      if (typeof payload === 'string') {
        // Tauri mode: payload is a JSON string
        message = JSON.parse(payload) as ClaudeStreamMessage;
      } else {
        // Web mode: payload is already parsed object
        message = payload;
      }

      console.log('[ClaudeCodeSession] handleStreamMessage - message type:', message.type);

      // Track enhanced tool execution
      if (message.type === 'assistant' && message.message?.content) {
        const toolUses = message.message.content.filter((c: any) => c.type === 'tool_use');
        toolUses.forEach((toolUse: any) => {
          // Increment tools executed counter
          options.sessionMetrics.current.toolsExecuted += 1;
          options.sessionMetrics.current.lastActivityTime = Date.now();

          // Track file operations
          const toolName = toolUse.name?.toLowerCase() || '';
          if (toolName.includes('create') || toolName.includes('write')) {
            options.sessionMetrics.current.filesCreated += 1;
          } else if (toolName.includes('edit') || toolName.includes('multiedit') || toolName.includes('search_replace')) {
            options.sessionMetrics.current.filesModified += 1;
          } else if (toolName.includes('delete')) {
            options.sessionMetrics.current.filesDeleted += 1;
          }

          // Track tool start - we'll track completion when we get the result
          options.workflowTracking.trackStep(toolUse.name);
        });
      }

      // Track tool results
      if (message.type === 'user' && message.message?.content) {
        const toolResults = message.message.content.filter((c: any) => c.type === 'tool_result');
        toolResults.forEach((result: any) => {
          const isError = result.is_error || false;
          // Note: We don't have execution time here, but we can track success/failure
          if (isError) {
            options.sessionMetrics.current.toolsFailed += 1;
            options.sessionMetrics.current.errorsEncountered += 1;

            options.trackEvent.enhancedError({
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

          // Detect ports from tool result content (e.g., dev server output)
          const resultContent = typeof result.content === 'string'
            ? result.content
            : (result.content?.text || JSON.stringify(result.content || ''));
          const detectedPort = detectPortFromMessage(resultContent);
          if (detectedPort) {
            console.log('[PortDetection] Detected port from tool result:', detectedPort);
            usePreviewStore.getState().addDetectedPort(detectedPort, 'claude-tool-result');
          }
        });
      }

      // Track code blocks generated and detect ports in assistant text
      if (message.type === 'assistant' && message.message?.content) {
        const codeBlocks = message.message.content.filter((c: any) =>
          c.type === 'text' && c.text?.includes('```')
        );
        if (codeBlocks.length > 0) {
          // Count code blocks in text content
          codeBlocks.forEach((block: any) => {
            const matches = (block.text.match(/```/g) || []).length;
            options.sessionMetrics.current.codeBlocksGenerated += Math.floor(matches / 2);
          });
        }

        // Also detect ports from assistant text (e.g., "Server running at http://localhost:3000")
        message.message.content.forEach((c: any) => {
          if (c.type === 'text' && c.text) {
            const detectedPort = detectPortFromMessage(c.text);
            if (detectedPort) {
              console.log('[PortDetection] Detected port from assistant text:', detectedPort);
              usePreviewStore.getState().addDetectedPort(detectedPort, 'claude-assistant-text');
            }
          }
        });
      }

      // Track errors in system messages
      if (message.type === 'system' && (message.subtype === 'error' || message.error)) {
        options.sessionMetrics.current.errorsEncountered += 1;
      }

      // Handle streaming text for real-time typing effect
      if ((message as any).type === 'content_block_delta') {
        const delta = (message as any).delta;
        if (delta?.type === 'text_delta' && delta?.text) {
          options.accumulatedTextRef.current += delta.text;
          options.setStreamingText(options.accumulatedTextRef.current);
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
            options.accumulatedTextRef.current += delta.text;
            options.setStreamingText(options.accumulatedTextRef.current);
          }
          return; // Don't add to message list
        }

        // Check for raw text in various possible locations
        const textContent = streamEvent.text || streamEvent.content ||
                            streamEvent.event?.text || streamEvent.event?.content ||
                            streamEvent.delta?.text;
        if (typeof textContent === 'string' && textContent) {
          options.accumulatedTextRef.current += textContent;
          options.setStreamingText(options.accumulatedTextRef.current);
          return;
        }

        // For message_start, clear accumulated text
        if (streamEvent.event?.type === 'message_start') {
          options.accumulatedTextRef.current = '';
          options.setStreamingText('');
        }

        // For message_stop, keep streaming text visible until completion
        // Don't clear here to avoid showing thinking indicator between message_stop and claude-complete
        if (streamEvent.event?.type === 'message_stop') {
          // Stream has stopped, but keep text visible
          // It will be cleared in completion handler
        }

        return; // Don't add stream_event to message list
      } else if ((message as any).type === 'partial') {
        const partialContent = (message as any).content;
        if (typeof partialContent === 'string') {
          options.accumulatedTextRef.current += partialContent;
          options.setStreamingText(options.accumulatedTextRef.current);
        }
      } else if (message.type === 'assistant' && message.message?.content) {
        // Full assistant message arrived - clear streaming text
        if (options.accumulatedTextRef.current) {
          options.accumulatedTextRef.current = '';
          options.setStreamingText('');
        }
      }

      options.setMessages((prev) => [...prev, message]);
    } catch (err) {
      console.error('Failed to parse message:', err, payload);
    }
  };
}

// ============================================================================
// 5. SESSION INITIALIZATION HANDLING
// ============================================================================

export interface SessionInitHandlerOptions {
  currentSessionId: string | null;
  setClaudeSessionId: (id: string) => void;
  extractedSessionInfo: { sessionId: string; projectId: string } | null;
  setExtractedSessionInfo: (info: { sessionId: string; projectId: string }) => void;
  projectPath: string;
  tabType?: TabType;
  messages: ClaudeStreamMessage[];
  onSessionCreated?: (sessionId: string) => void;
  attachSessionSpecificListeners: (sessionId: string) => Promise<void>;
  pendingDisplayTextRef?: React.MutableRefObject<{ prompt: string; displayText: string } | null>;
}

export async function handleSessionInit(
  message: ClaudeStreamMessage,
  options: SessionInitHandlerOptions
): Promise<string | null> {
  if (message.type === 'system' && message.subtype === 'init' && message.session_id) {
    if (!options.currentSessionId || options.currentSessionId !== message.session_id) {
      console.log('[ClaudeCodeSession] Detected new session_id from generic listener:', message.session_id);
      options.setClaudeSessionId(message.session_id);

      // If we haven't extracted session info before, do it now
      if (!options.extractedSessionInfo) {
        const projectId = options.projectPath.replace(/[^a-zA-Z0-9]/g, '-');
        options.setExtractedSessionInfo({ sessionId: message.session_id, projectId });

        // Save session data for restoration (tab-specific if tabType provided)
        if (options.tabType) {
          SessionPersistenceService.saveSessionForTab(
            message.session_id,
            projectId,
            options.projectPath,
            options.tabType,
            undefined, // firstMessage will be updated later
            options.messages.length
          );
          SessionPersistenceService.saveLastSessionForTab(options.projectPath, options.tabType, message.session_id, projectId);
        } else {
          SessionPersistenceService.saveSession(
            message.session_id,
            projectId,
            options.projectPath,
            options.messages.length
          );
        }

        // 세션 생성 시 기존 메시지들의 displayText를 localStorage에 저장
        options.messages.forEach(msg => {
          if (msg.type === 'user' && msg.displayText && msg.message?.content) {
            const textContent = msg.message.content.find((c: any) => c.type === 'text');
            if (textContent?.text) {
              SessionPersistenceService.saveDisplayText(
                message.session_id,
                textContent.text,
                msg.displayText
              );
            }
          }
        });

        // 워크플로우 프롬프트의 displayText 매핑 저장 (백엔드 프롬프트 → 짧은 표시 텍스트)
        // startNewSession에서 설정된 pendingDisplayText가 있으면 저장
        if (options.pendingDisplayTextRef?.current) {
          const { prompt, displayText } = options.pendingDisplayTextRef.current;
          SessionPersistenceService.saveDisplayText(
            message.session_id,
            prompt,  // 백엔드로 전송된 전체 프롬프트
            displayText  // 짧은 표시 텍스트 (예: "PRD 문서 작성 시작")
          );
          // 저장 후 초기화
          options.pendingDisplayTextRef.current = null;
        }

        // Notify parent about new session
        options.onSessionCreated?.(message.session_id);
      }

      // Switch to session-specific listeners
      await options.attachSessionSpecificListeners(message.session_id);

      return message.session_id;
    }
  }
  return null;
}

// ============================================================================
// 6. COMPLETION HANDLING
// ============================================================================

export interface CompletionHandlerOptions {
  setIsLoading: (loading: boolean) => void;
  hasActiveSessionRef: React.MutableRefObject<boolean>;
  isListeningRef: React.MutableRefObject<boolean>;
  accumulatedTextRef: React.MutableRefObject<string>;
  setStreamingText: (text: string) => void;
  unlistenRefs: React.MutableRefObject<UnlistenFn[]>;
  effectiveSession: Session | null;
  claudeSessionId: string | null;
  messages: ClaudeStreamMessage[];
  sessionMetrics: React.MutableRefObject<{
    firstMessageTime: number | null;
    toolsExecuted: number;
    toolsFailed: number;
    filesCreated: number;
    filesModified: number;
    filesDeleted: number;
    codeBlocksGenerated: number;
    errorsEncountered: number;
    lastActivityTime: number;
    toolExecutionTimes: number[];
    wasResumed: boolean;
    modelChanges: Array<{ from: string; to: string; timestamp: number }>;
    promptsSent: number;
  }>;
  sessionStartTime: React.MutableRefObject<number>;
  totalTokens: number;
  queuedPrompts: QueuedPrompt[];
  queuedPromptsRef: React.MutableRefObject<QueuedPrompt[]>;  // ref를 사용하여 stale closure 문제 해결
  trackEvent: {
    enhancedSessionStopped: (params: any) => void;
  };
  setQueuedPrompts: React.Dispatch<React.SetStateAction<QueuedPrompt[]>>;
  handleSendPrompt: (prompt: string, model: "haiku" | "sonnet" | "opus") => Promise<void>;
}

export function createCompletionHandler(options: CompletionHandlerOptions) {
  return async function processComplete(success: boolean) {
    // Clean up event listeners FIRST to prevent buffered messages from being processed
    options.unlistenRefs.current.forEach((unlisten) => unlisten());
    options.unlistenRefs.current = [];

    // Use flushSync to atomically update all states and prevent race condition
    // that shows thinking indicator after streaming completes
    flushSync(() => {
      options.setIsLoading(false);
      options.setStreamingText('');
      options.accumulatedTextRef.current = '';
    });

    options.hasActiveSessionRef.current = false;
    options.isListeningRef.current = false; // Reset listening state

    // Track enhanced session stopped metrics when session completes
    if (options.effectiveSession && options.claudeSessionId) {
      const sessionStartTimeValue = options.messages.length > 0 ? options.messages[0].timestamp || Date.now() : Date.now();
      const duration = Date.now() - sessionStartTimeValue;
      const metrics = options.sessionMetrics.current;
      const timeToFirstMessage = metrics.firstMessageTime
        ? metrics.firstMessageTime - options.sessionStartTime.current
        : undefined;
      const idleTime = Date.now() - metrics.lastActivityTime;
      const avgResponseTime = metrics.toolExecutionTimes.length > 0
        ? metrics.toolExecutionTimes.reduce((a, b) => a + b, 0) / metrics.toolExecutionTimes.length
        : undefined;

      options.trackEvent.enhancedSessionStopped({
        // Basic metrics
        duration_ms: duration,
        messages_count: options.messages.length,
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
        total_tokens_used: options.totalTokens,
        code_blocks_generated: metrics.codeBlocksGenerated,
        errors_encountered: metrics.errorsEncountered,

        // Session context
        model: metrics.modelChanges.length > 0
          ? metrics.modelChanges[metrics.modelChanges.length - 1].to
          : 'sonnet',
        was_resumed: metrics.wasResumed,

        // Agent context (if applicable)
        agent_type: undefined, // TODO: Pass from agent execution
        agent_name: undefined, // TODO: Pass from agent execution
        agent_success: success,

        // Stop context
        stop_source: 'completed',
        final_state: success ? 'success' : 'failed',
        has_pending_prompts: options.queuedPromptsRef.current.length > 0,
        pending_prompts_count: options.queuedPromptsRef.current.length,
      });
    }

    // Process queued prompts after completion
    // ref를 사용하여 최신 큐 상태를 확인 (stale closure 문제 해결)
    if (options.queuedPromptsRef.current.length > 0) {
      const [nextPrompt, ...remainingPrompts] = options.queuedPromptsRef.current;
      options.setQueuedPrompts(remainingPrompts);

      // Small delay to ensure UI updates
      setTimeout(() => {
        options.handleSendPrompt(nextPrompt.prompt, nextPrompt.model);
      }, 100);
    }
  };
}

// ============================================================================
// 7. EVENT LISTENERS SETUP
// ============================================================================

export interface EventListenersSetupOptions {
  claudeSessionId: string | null;
  effectiveSession: Session | null;
  handleStreamMessage: (payload: string | ClaudeStreamMessage) => void;
  setError: (error: string | null) => void;
  processComplete: (success: boolean) => Promise<void>;
  unlistenRefs: React.MutableRefObject<UnlistenFn[]>;
  currentSessionIdRef: React.MutableRefObject<string | null>;
  setClaudeSessionId: (id: string) => void;
  extractedSessionInfo: { sessionId: string; projectId: string } | null;
  setExtractedSessionInfo: (info: { sessionId: string; projectId: string }) => void;
  projectPath: string;
  tabType?: TabType;
  messages: ClaudeStreamMessage[];
  onSessionCreated?: (sessionId: string) => void;
  pendingDisplayTextRef?: React.MutableRefObject<{ prompt: string; displayText: string } | null>;
}

export async function setupEventListeners(
  options: EventListenersSetupOptions
): Promise<void> {
  console.log('[ClaudeCodeSession] Setting up generic event listeners first');

  let currentSessionId: string | null = options.claudeSessionId || options.effectiveSession?.id || null;
  options.currentSessionIdRef.current = currentSessionId;

  // Helper to attach session-specific listeners **once we are sure**
  const attachSessionSpecificListeners = async (sid: string) => {
    console.log('[ClaudeCodeSession] Attaching session-specific listeners for', sid);

    const specificOutputUnlisten = await tauriListen(`claude-output:${sid}`, (evt: any) => {
      options.handleStreamMessage(evt.payload);
    });

    const specificErrorUnlisten = await tauriListen(`claude-error:${sid}`, (evt: any) => {
      console.error('Claude error (scoped):', evt.payload);
      options.setError(evt.payload);
    });

    const specificCompleteUnlisten = await tauriListen(`claude-complete:${sid}`, (evt: any) => {
      console.log('[ClaudeCodeSession] Received claude-complete (scoped):', evt.payload);
      options.processComplete(evt.payload);
    });

    // Replace existing unlisten refs with these new ones (after cleaning up)
    options.unlistenRefs.current.forEach((u) => u());
    options.unlistenRefs.current = [specificOutputUnlisten, specificErrorUnlisten, specificCompleteUnlisten];
  };

  // Generic listeners (catch-all)
  const genericOutputUnlisten = await tauriListen('claude-output', async (event: any) => {
    // Session ID filtering: drop messages from different sessions (safety net)
    try {
      const msg = JSON.parse(event.payload) as ClaudeStreamMessage;

      // If message has session_id and it doesn't match current session, drop it
      // "있으면 비교, 없으면 통과" - some events may not have session_id
      if (msg.session_id && options.currentSessionIdRef.current &&
          msg.session_id !== options.currentSessionIdRef.current) {
        console.log('[ClaudeCodeSession] Dropping message from different session:', msg.session_id);
        return;
      }

      // Process the message
      options.handleStreamMessage(event.payload);

      // Attempt to extract session_id on the fly (for the very first init)
      const newSessionId = await handleSessionInit(msg, {
        currentSessionId: options.currentSessionIdRef.current,
        setClaudeSessionId: options.setClaudeSessionId,
        extractedSessionInfo: options.extractedSessionInfo,
        setExtractedSessionInfo: options.setExtractedSessionInfo,
        projectPath: options.projectPath,
        tabType: options.tabType,
        messages: options.messages,
        onSessionCreated: options.onSessionCreated,
        attachSessionSpecificListeners,
        pendingDisplayTextRef: options.pendingDisplayTextRef,
      });

      if (newSessionId) {
        currentSessionId = newSessionId;
        options.currentSessionIdRef.current = newSessionId;
      }
    } catch {
      // Parse failed - still forward the message (backward compatibility)
      options.handleStreamMessage(event.payload);
    }
  });

  const genericErrorUnlisten = await tauriListen('claude-error', (evt: any) => {
    console.error('Claude error:', evt.payload);
    options.setError(evt.payload);
  });

  const genericCompleteUnlisten = await tauriListen('claude-complete', (evt: any) => {
    console.log('[ClaudeCodeSession] Received claude-complete (generic):', evt.payload);
    options.processComplete(evt.payload);
  });

  // Store the generic unlisteners for now; they may be replaced later.
  options.unlistenRefs.current = [genericOutputUnlisten, genericErrorUnlisten, genericCompleteUnlisten];
}

// ============================================================================
// 8. METRICS TRACKING
// ============================================================================

export interface MetricsTrackingOptions {
  sessionMetrics: React.MutableRefObject<{
    promptsSent: number;
    lastActivityTime: number;
    firstMessageTime: number | null;
    modelChanges: Array<{ from: string; to: string; timestamp: number }>;
    wasResumed: boolean;
  }>;
  sessionStartTime: React.MutableRefObject<number>;
  messages: ClaudeStreamMessage[];
  model: "haiku" | "sonnet" | "opus";
  prompt: string;
  trackEvent: {
    enhancedPromptSubmitted: (params: any) => void;
  };
}

export function trackPromptMetrics(options: MetricsTrackingOptions): void {
  // Update session metrics
  options.sessionMetrics.current.promptsSent += 1;
  options.sessionMetrics.current.lastActivityTime = Date.now();
  if (!options.sessionMetrics.current.firstMessageTime) {
    options.sessionMetrics.current.firstMessageTime = Date.now();
  }

  // Track model changes
  const lastModel = options.sessionMetrics.current.modelChanges.length > 0
    ? options.sessionMetrics.current.modelChanges[options.sessionMetrics.current.modelChanges.length - 1].to
    : (options.sessionMetrics.current.wasResumed ? 'sonnet' : options.model); // Default to sonnet if resumed

  if (lastModel !== options.model) {
    options.sessionMetrics.current.modelChanges.push({
      from: lastModel,
      to: options.model,
      timestamp: Date.now()
    });
  }

  // Track enhanced prompt submission
  const codeBlockMatches = options.prompt.match(/```[\s\S]*?```/g) || [];
  const hasCode = codeBlockMatches.length > 0;
  const conversationDepth = options.messages.filter(m => m.user_message).length;
  const sessionAge = options.sessionStartTime.current ? Date.now() - options.sessionStartTime.current : 0;
  const wordCount = options.prompt.split(/\s+/).filter(word => word.length > 0).length;

  options.trackEvent.enhancedPromptSubmitted({
    prompt_length: options.prompt.length,
    model: options.model,
    has_attachments: false, // TODO: Add attachment support when implemented
    source: 'keyboard', // TODO: Track actual source (keyboard vs button)
    word_count: wordCount,
    conversation_depth: conversationDepth,
    prompt_complexity: wordCount < 20 ? 'simple' : wordCount < 100 ? 'moderate' : 'complex',
    contains_code: hasCode,
    language_detected: hasCode ? codeBlockMatches?.[0]?.match(/```(\w+)/)?.[1] : undefined,
    session_age_ms: sessionAge
  });
}

// ============================================================================
// 9. COMMAND EXECUTION
// ============================================================================

export interface CommandExecutionOptions {
  effectiveSession: Session | null;
  isFirstPrompt: boolean;
  projectPath: string;
  prompt: string;
  model: "haiku" | "sonnet" | "opus";
  executionMode?: string;
  setIsFirstPrompt: (value: boolean) => void;
  trackEvent: {
    sessionResumed: (sessionId: string) => void;
    sessionCreated: (model: string, source: string) => void;
    modelSelected: (model: string) => void;
  };
  api: {
    resumeClaudeCode: (projectPath: string, sessionId: string, prompt: string, model: string, executionMode?: string) => Promise<void>;
    executeClaudeCode: (projectPath: string, prompt: string, model: string, executionMode?: string) => Promise<void>;
  };
}

export async function executePromptCommand(options: CommandExecutionOptions): Promise<void> {
  // Log decision-making values for debugging session management
  console.log('[ClaudeCodeSession] executePromptCommand decision:', {
    hasEffectiveSession: !!options.effectiveSession,
    effectiveSessionId: options.effectiveSession?.id,
    isFirstPrompt: options.isFirstPrompt,
    executionMode: options.executionMode,
    decision: (options.effectiveSession && !options.isFirstPrompt) ? 'RESUME' : 'NEW_SESSION'
  });

  // Execute the appropriate command
  // Pass executionMode to use --permission-mode plan when plan mode is selected
  if (options.effectiveSession && !options.isFirstPrompt) {
    console.log('[ClaudeCodeSession] Resuming session:', options.effectiveSession.id, 'executionMode:', options.executionMode);
    try {
      options.trackEvent.sessionResumed(options.effectiveSession.id);
      options.trackEvent.modelSelected(options.model);
      await options.api.resumeClaudeCode(options.projectPath, options.effectiveSession.id, options.prompt, options.model, options.executionMode);
    } catch (err) {
      // If resume fails (e.g., session not found), fall back to new session
      console.warn('[ClaudeCodeSession] Resume failed, starting new session:', err);
      options.setIsFirstPrompt(false);
      options.trackEvent.sessionCreated(options.model, 'prompt_input');
      options.trackEvent.modelSelected(options.model);
      await options.api.executeClaudeCode(options.projectPath, options.prompt, options.model, options.executionMode);
    }
  } else {
    console.log('[ClaudeCodeSession] Starting new session, executionMode:', options.executionMode);
    options.setIsFirstPrompt(false);
    options.trackEvent.sessionCreated(options.model, 'prompt_input');
    options.trackEvent.modelSelected(options.model);
    await options.api.executeClaudeCode(options.projectPath, options.prompt, options.model, options.executionMode);
  }
}

// ============================================================================
// 10. USER MESSAGE UI
// ============================================================================

export interface UserMessageOptions {
  prompt: string;
  /** 워크플로우 짧은 표시 텍스트 (예: "PRD 문서 작성 시작") */
  displayText?: string;
  setMessages: React.Dispatch<React.SetStateAction<ClaudeStreamMessage[]>>;
  selectedElement?: SelectedElement;
}

export function addUserMessageToUI(options: UserMessageOptions): void {
  const userMessage: ClaudeStreamMessage = {
    type: "user",
    displayText: options.displayText,
    message: {
      content: [
        {
          type: "text",
          text: options.prompt
        }
      ]
    },
    // Include selectedElement metadata for badge display in UI
    selectedElement: options.selectedElement
  };
  options.setMessages(prev => [...prev, userMessage]);
}

// ============================================================================
// 11. SESSION FIRST MESSAGE UPDATE
// ============================================================================

export interface FirstMessageUpdateOptions {
  isFirstPrompt: boolean;
  tabType?: TabType;
  claudeSessionId: string | null;
  prompt: string;
  onSessionCreated?: (sessionId: string, firstMessage?: string) => void;
}

export function updateSessionFirstMessage(options: FirstMessageUpdateOptions): void {
  if (options.isFirstPrompt && options.tabType && options.claudeSessionId) {
    const truncatedPrompt = options.prompt.length > 100 ? options.prompt.substring(0, 100) + '...' : options.prompt;
    SessionPersistenceService.updateSessionFirstMessage(options.claudeSessionId, truncatedPrompt);
    options.onSessionCreated?.(options.claudeSessionId, truncatedPrompt);
  }
}
