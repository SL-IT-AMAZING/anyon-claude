import React, { useState, useEffect } from "react";
import { 
  AlertCircle, 
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { getClaudeSyntaxTheme } from "@/lib/claudeSyntaxTheme";
import { useTheme } from "@/hooks";
import type { ClaudeStreamMessage } from "./AgentExecution";
import {
  TodoWidget,
  TodoReadWidget,
  LSWidget,
  ReadWidget,
  GlobWidget,
  BashWidget,
  WriteWidget,
  GrepWidget,
  EditWidget,
  MCPWidget,
  CommandWidget,
  CommandOutputWidget,
  SummaryWidget,
  MultiEditWidget,
  SystemReminderWidget,
  TaskWidget,
  ThinkingWidget,
  WebSearchWidget,
  WebFetchWidget,
} from "./ToolWidgets";
import { InlineToolBadge, ToolBadgeGroup } from "./InlineToolBadge";
import { getPromptDisplayInfo, isAnyonWorkflowCommand, type PromptIconType } from "@/lib/promptDisplay";
import { 
  FileText as FileTextIcon, 
  Palette, 
  Paintbrush, 
  Settings, 
  Boxes, 
  Database, 
  LayoutList, 
  Rocket, 
  CheckCircle 
} from "lucide-react";

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

interface StreamMessageProps {
  message: ClaudeStreamMessage;
  className?: string;
  streamMessages: ClaudeStreamMessage[];
  onLinkDetected?: (url: string) => void;
}

/**
 * GPT-style Stream Message Component
 * - No card/box wrapping
 * - Natural flowing conversation
 * - Inline tool badges with slide-over details
 */
const StreamMessageComponent: React.FC<StreamMessageProps> = ({ message, className, streamMessages, onLinkDetected }) => {
  const [toolResults, setToolResults] = useState<Map<string, any>>(new Map());
  
  const { theme } = useTheme();
  const syntaxTheme = getClaudeSyntaxTheme(theme);
  
  // Extract all tool results from stream messages
  useEffect(() => {
    const results = new Map<string, any>();
    streamMessages.forEach(msg => {
      if (msg.type === "user" && msg.message?.content && Array.isArray(msg.message.content)) {
        msg.message.content.forEach((content: any) => {
          if (content.type === "tool_result" && content.tool_use_id) {
            results.set(content.tool_use_id, content);
          }
        });
      }
    });
    setToolResults(results);
  }, [streamMessages]);
  
  const getToolResult = (toolId: string | undefined): any => {
    if (!toolId) return null;
    return toolResults.get(toolId) || null;
  };
  
  try {
    // Skip meta messages
    if (message.isMeta && !message.leafUuid && !message.summary) {
      return null;
    }

    // Summary messages
    if (message.leafUuid && message.summary && (message as any).type === "summary") {
      return <SummaryWidget summary={message.summary} leafUuid={message.leafUuid} />;
    }

    // System initialization - hide completely
    if (message.type === "system" && message.subtype === "init") {
      return null;
    }

    // Assistant message - GPT style (no card)
    if (message.type === "assistant" && message.message) {
      const msg = message.message;
      const contentParts: React.ReactNode[] = [];
      const toolBadges: React.ReactNode[] = [];
      let hasContent = false;
      
      if (msg.content && Array.isArray(msg.content)) {
        msg.content.forEach((content: any, idx: number) => {
          // Text content - render as markdown
          if (content.type === "text") {
            const textContent = typeof content.text === 'string' 
              ? content.text 
              : (content.text?.text || JSON.stringify(content.text || content));
            
            if (textContent.trim()) {
              hasContent = true;
              contentParts.push(
                <div key={`text-${idx}`} className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={syntaxTheme}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={cn("px-1.5 py-0.5 rounded bg-muted font-mono text-sm", className)} {...props}>
                            {children}
                          </code>
                        );
                      },
                      // Better link styling
                      a({ href, children, ...props }) {
                        return (
                          <a 
                            href={href} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                            {...props}
                          >
                            {children}
                          </a>
                        );
                      }
                    }}
                  >
                    {textContent}
                  </ReactMarkdown>
                </div>
              );
            }
          }
          
          // Thinking content
          if (content.type === "thinking") {
            hasContent = true;
            contentParts.push(
              <div key={`thinking-${idx}`}>
                <ThinkingWidget 
                  thinking={content.thinking || ''} 
                  signature={content.signature}
                />
              </div>
            );
          }
          
          // Tool use - render as inline badge
          if (content.type === "tool_use") {
            hasContent = true;
            const toolName = content.name?.toLowerCase();
            const input = content.input;
            const toolId = content.id;
            const toolResult = getToolResult(toolId);
            
            const badge = renderToolBadge(toolName, content.name, input, toolResult, toolId, idx);
            if (badge) {
              toolBadges.push(badge);
            }
          }
        });
      }
      
      if (!hasContent) return null;
      
      // If only tools (no text), render minimal tool list
      const hasTextContent = contentParts.length > 0;
      
      if (!hasTextContent && toolBadges.length > 0) {
        // Tool-only message - minimal style like screenshot
        return (
          <div className={cn("py-2", className)}>
            <ToolBadgeGroup>
              {toolBadges}
            </ToolBadgeGroup>
          </div>
        );
      }
      
      // Has text content - show with prose styling, no avatar
      return (
        <div className={cn("py-4", className)}>
          <div className="space-y-3">
            {/* Text content */}
            {contentParts}
            
            {/* Tool badges */}
            {toolBadges.length > 0 && (
              <ToolBadgeGroup>
                {toolBadges}
              </ToolBadgeGroup>
            )}
            
            {/* Usage info - subtle */}
            {msg.usage && (
              <div className="text-xs text-muted-foreground/60">
                {msg.usage.input_tokens + msg.usage.output_tokens} tokens
              </div>
            )}
          </div>
        </div>
      );
    }

    // User message - GPT style (right-aligned feel but left-aligned text)
    if (message.type === "user") {
      if (message.isMeta) return null;

      const msg = message.message || message;
      let hasContent = false;
      const contentParts: React.ReactNode[] = [];
      
      // Handle string content
      if (typeof msg.content === 'string' || (msg.content && !Array.isArray(msg.content))) {
        const contentStr = typeof msg.content === 'string' ? msg.content : String(msg.content);
        if (contentStr.trim()) {
          hasContent = true;
          
          // Command message
          const commandMatch = contentStr.match(/<command-name>(.+?)<\/command-name>[\s\S]*?<command-message>(.+?)<\/command-message>[\s\S]*?<command-args>(.*?)<\/command-args>/);
          if (commandMatch) {
            const [, commandName, commandMessage, commandArgs] = commandMatch;
            contentParts.push(
              <CommandWidget 
                key="cmd"
                commandName={commandName.trim()} 
                commandMessage={commandMessage.trim()}
                commandArgs={commandArgs?.trim()}
              />
            );
          } else if (contentStr.match(/<local-command-stdout>/)) {
            const stdoutMatch = contentStr.match(/<local-command-stdout>([\s\S]*?)<\/local-command-stdout>/);
            if (stdoutMatch) {
              contentParts.push(
                <CommandOutputWidget key="stdout" output={stdoutMatch[1]} onLinkDetected={onLinkDetected} />
              );
            }
          } else if (isAnyonWorkflowCommand(contentStr.trim())) {
            const { text, icon } = getPromptDisplayInfo(contentStr.trim());
            contentParts.push(
              <div key="workflow" className="flex items-center gap-2 text-sm font-medium text-primary">
                <WorkflowIcon icon={icon} className="h-4 w-4" />
                <span>{text}</span>
              </div>
            );
          } else {
            contentParts.push(
              <div key="text" className="text-sm whitespace-pre-wrap">
                {contentStr}
              </div>
            );
          }
        }
      }
      
      // Handle array content
      if (Array.isArray(msg.content)) {
        msg.content.forEach((content: any, idx: number) => {
          if (content.type === "tool_result") {
            // Skip tool results that have widgets
            let hasWidget = false;
            if (content.tool_use_id && streamMessages) {
              for (let i = streamMessages.length - 1; i >= 0; i--) {
                const prevMsg = streamMessages[i];
                if (prevMsg.type === 'assistant' && prevMsg.message?.content && Array.isArray(prevMsg.message.content)) {
                  const toolUse = prevMsg.message.content.find((c: any) => c.type === 'tool_use' && c.id === content.tool_use_id);
                  if (toolUse) {
                    const tn = toolUse.name?.toLowerCase();
                    const toolsWithWidgets = ['task','edit','multiedit','todowrite','todoread','ls','read','glob','bash','write','grep','websearch','webfetch'];
                    if (toolsWithWidgets.includes(tn) || toolUse.name?.startsWith('mcp__')) {
                      hasWidget = true;
                    }
                    break;
                  }
                }
              }
            }
            if (hasWidget) return;
            
            // Render tool result
            let contentText = '';
            if (typeof content.content === 'string') {
              contentText = content.content;
            } else if (content.content?.text) {
              contentText = content.content.text;
            } else if (Array.isArray(content.content)) {
              contentText = content.content.map((c: any) => (typeof c === 'string' ? c : c.text || JSON.stringify(c))).join('\n');
            } else if (content.content) {
              contentText = JSON.stringify(content.content, null, 2);
            }
            
            // System reminder
            const reminderMatch = contentText.match(/<system-reminder>(.*?)<\/system-reminder>/s);
            if (reminderMatch) {
              hasContent = true;
              contentParts.push(
                <div key={`reminder-${idx}`}>
                  <SystemReminderWidget message={reminderMatch[1].trim()} />
                </div>
              );
              return;
            }
            
            if (contentText.trim()) {
              hasContent = true;
              contentParts.push(
                <div key={`result-${idx}`} className="text-xs font-mono bg-muted/30 rounded p-2 overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{contentText}</pre>
                </div>
              );
            }
          }
          
          if (content.type === "text") {
            const textContent = typeof content.text === 'string' ? content.text : (content.text?.text || JSON.stringify(content.text));
            if (textContent.trim()) {
              hasContent = true;
              
              if (isAnyonWorkflowCommand(textContent.trim())) {
                const { text, icon } = getPromptDisplayInfo(textContent.trim());
                contentParts.push(
                  <div key={`wf-${idx}`} className="flex items-center gap-2 text-sm font-medium text-primary">
                    <WorkflowIcon icon={icon} className="h-4 w-4" />
                    <span>{text}</span>
                  </div>
                );
              } else {
                contentParts.push(
                  <div key={`txt-${idx}`} className="text-sm whitespace-pre-wrap">
                    {textContent}
                  </div>
                );
              }
            }
          }
        });
      }
      
      if (!hasContent) return null;
      
      return (
        <div className={cn("py-3 px-4 bg-muted/30 rounded-lg", className)}>
          <div className="space-y-2">
            {contentParts}
          </div>
        </div>
      );
    }

    // Result message - compact metadata bar
    if (message.type === "result") {
      const isError = message.is_error || message.subtype?.includes("error");
      const hasMetadata = message.cost_usd !== undefined || 
                          message.total_cost_usd !== undefined || 
                          message.duration_ms !== undefined || 
                          message.num_turns !== undefined || 
                          message.usage !== undefined ||
                          message.error;
      
      if (!hasMetadata && !isError) return null;
      
      return (
        <div className={cn(
          "flex items-center gap-4 px-4 py-2 text-xs border-t border-border/30",
          isError ? "bg-destructive/5 text-destructive" : "text-muted-foreground",
          className
        )}>
          {isError ? (
            <AlertCircle className="h-3.5 w-3.5" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          )}
          
          {message.error && <span className="text-destructive">{message.error}</span>}
          {(message.cost_usd !== undefined || message.total_cost_usd !== undefined) && (
            <span>${((message.cost_usd || message.total_cost_usd)!).toFixed(4)}</span>
          )}
          {message.duration_ms !== undefined && (
            <span>{(message.duration_ms / 1000).toFixed(1)}s</span>
          )}
          {message.num_turns !== undefined && (
            <span>{message.num_turns} turns</span>
          )}
          {message.usage && (
            <span>{message.usage.input_tokens + message.usage.output_tokens} tokens</span>
          )}
        </div>
      );
    }

    return null;
  } catch (error) {
    console.error("Error rendering stream message:", error, message);
    return (
      <div className={cn("py-4 px-4 bg-destructive/5 text-destructive text-sm", className)}>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>Error rendering message</span>
        </div>
        <p className="text-xs mt-1 text-muted-foreground">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }
  
  // Helper function to render tool badges
  function renderToolBadge(
    toolName: string | undefined, 
    originalName: string | undefined,
    input: any, 
    toolResult: any, 
    _toolId: string,
    idx: number
  ): React.ReactNode {
    if (!toolName) return null;
    
    // Format tool output
    const formatOutput = (result: any): string | undefined => {
      if (!result) return undefined;
      if (typeof result.content === 'string') return result.content;
      try {
        return JSON.stringify(result.content, null, 2);
      } catch {
        return String(result.content);
      }
    };
    
    const output = formatOutput(toolResult);
    
    // Task tool
    if (toolName === "task" && input) {
      return (
        <InlineToolBadge
          key={`tool-${idx}`}
          label="Task"
          detail={input.description}
          input={input}
          output={output}
        >
          <TaskWidget description={input.description} prompt={input.prompt} result={toolResult} />
        </InlineToolBadge>
      );
    }
    
    // Edit tool
    if (toolName === "edit" && input?.file_path) {
      const fileName = input.file_path.split('/').pop() || input.file_path;
      return (
        <InlineToolBadge
          key={`tool-${idx}`}
          label="Edit"
          detail={fileName}
          input={input}
          output={output}
        >
          <EditWidget {...input} result={toolResult} />
        </InlineToolBadge>
      );
    }
    
    // MultiEdit tool
    if (toolName === "multiedit" && input?.file_path) {
      const fileName = input.file_path.split('/').pop() || input.file_path;
      return (
        <InlineToolBadge
          key={`tool-${idx}`}
          label="MultiEdit"
          detail={`${fileName} (${input.edits?.length || 0})`}
          input={input}
          output={output}
        >
          <MultiEditWidget {...input} result={toolResult} />
        </InlineToolBadge>
      );
    }
    
    // MCP tools
    if (originalName?.startsWith("mcp__")) {
      const parts = originalName.split('__');
      const namespace = parts[1] || '';
      const method = parts[2] || '';
      return (
        <InlineToolBadge
          key={`tool-${idx}`}
          label={originalName}
          detail={`${namespace}/${method}`}
          input={input}
          output={output}
        >
          <MCPWidget toolName={originalName} input={input} result={toolResult} />
        </InlineToolBadge>
      );
    }
    
    // TodoWrite
    if (toolName === "todowrite" && input?.todos) {
      const count = input.todos?.length || 0;
      return (
        <InlineToolBadge
          key={`tool-${idx}`}
          label="TodoWrite"
          detail={`${count} items`}
          input={input}
          output={output}
        >
          <TodoWidget todos={input.todos} result={toolResult} />
        </InlineToolBadge>
      );
    }
    
    // TodoRead
    if (toolName === "todoread") {
      return (
        <InlineToolBadge
          key={`tool-${idx}`}
          label="TodoRead"
          input={input}
          output={output}
        >
          <TodoReadWidget todos={input?.todos} result={toolResult} />
        </InlineToolBadge>
      );
    }
    
    // LS
    if (toolName === "ls" && input?.path) {
      const dirName = input.path.split('/').pop() || input.path;
      return (
        <InlineToolBadge
          key={`tool-${idx}`}
          label="LS"
          detail={dirName}
          input={input}
          output={output}
        >
          <LSWidget path={input.path} result={toolResult} />
        </InlineToolBadge>
      );
    }
    
    // Read
    if (toolName === "read" && input?.file_path) {
      const fileName = input.file_path.split('/').pop() || input.file_path;
      return (
        <InlineToolBadge
          key={`tool-${idx}`}
          label="Read"
          detail={fileName}
          input={input}
          output={output}
        >
          <ReadWidget filePath={input.file_path} result={toolResult} />
        </InlineToolBadge>
      );
    }
    
    // Glob
    if (toolName === "glob" && input?.pattern) {
      return (
        <InlineToolBadge
          key={`tool-${idx}`}
          label="Glob"
          detail={input.pattern}
          input={input}
          output={output}
        >
          <GlobWidget pattern={input.pattern} result={toolResult} />
        </InlineToolBadge>
      );
    }
    
    // Bash
    if (toolName === "bash" && input?.command) {
      const cmdPreview = input.command.length > 30 ? input.command.substring(0, 30) + '...' : input.command;
      return (
        <InlineToolBadge
          key={`tool-${idx}`}
          label="Bash"
          detail={input.description || cmdPreview}
          input={input}
          output={output}
        >
          <BashWidget command={input.command} description={input.description} result={toolResult} />
        </InlineToolBadge>
      );
    }
    
    // Write
    if (toolName === "write" && input?.file_path) {
      const fileName = input.file_path.split('/').pop() || input.file_path;
      return (
        <InlineToolBadge
          key={`tool-${idx}`}
          label="Write"
          detail={fileName}
          input={input}
          output={output}
        >
          <WriteWidget filePath={input.file_path} content={input.content} result={toolResult} />
        </InlineToolBadge>
      );
    }
    
    // Grep
    if (toolName === "grep" && input?.pattern) {
      return (
        <InlineToolBadge
          key={`tool-${idx}`}
          label="Grep"
          detail={input.pattern}
          input={input}
          output={output}
        >
          <GrepWidget pattern={input.pattern} include={input.include} path={input.path} exclude={input.exclude} result={toolResult} />
        </InlineToolBadge>
      );
    }
    
    // WebSearch
    if (toolName === "websearch" && input?.query) {
      return (
        <InlineToolBadge
          key={`tool-${idx}`}
          label="WebSearch"
          detail={input.query}
          input={input}
          output={output}
        >
          <WebSearchWidget query={input.query} result={toolResult} />
        </InlineToolBadge>
      );
    }
    
    // WebFetch
    if (toolName === "webfetch" && input?.url) {
      const urlPreview = input.url.length > 40 ? input.url.substring(0, 40) + '...' : input.url;
      return (
        <InlineToolBadge
          key={`tool-${idx}`}
          label="WebFetch"
          detail={urlPreview}
          input={input}
          output={output}
        >
          <WebFetchWidget url={input.url} prompt={input.prompt} result={toolResult} />
        </InlineToolBadge>
      );
    }
    
    // Fallback - generic tool badge
    return (
      <InlineToolBadge
        key={`tool-${idx}`}
        label={originalName || toolName}
        input={input}
        output={output}
      >
        <div className="space-y-2">
          <div className="text-sm font-medium">Tool Input</div>
          <pre className="text-xs font-mono bg-muted rounded p-2 overflow-x-auto">
            {JSON.stringify(input, null, 2)}
          </pre>
          {toolResult && (
            <>
              <div className="text-sm font-medium mt-4">Result</div>
              <pre className="text-xs font-mono bg-muted rounded p-2 overflow-x-auto">
                {typeof toolResult.content === 'string' 
                  ? toolResult.content 
                  : JSON.stringify(toolResult.content, null, 2)}
              </pre>
            </>
          )}
        </div>
      </InlineToolBadge>
    );
  }
};

export const StreamMessage = React.memo(StreamMessageComponent);
