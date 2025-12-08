import React, { useState, useEffect } from "react";
import { 
  Terminal, 
  User, 
  Bot, 
  AlertCircle, 
  CheckCircle2,
  FileEdit,
  FileText,
  FolderOpen,
  Search,
  ListChecks,
  ListPlus,
  Globe,
  Globe2,
  Package2,
  Sparkles
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
  ReadResultWidget,
  GlobWidget,
  BashWidget,
  WriteWidget,
  GrepWidget,
  EditWidget,
  EditResultWidget,
  MCPWidget,
  CommandWidget,
  CommandOutputWidget,
  SummaryWidget,
  MultiEditWidget,
  MultiEditResultWidget,
  SystemReminderWidget,
  SystemInitializedWidget,
  TaskWidget,
  LSResultWidget,
  ThinkingWidget,
  WebSearchWidget,
  WebFetchWidget,
  CollapsibleToolWidget
} from "./ToolWidgets";
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
 * Component to render a single Claude Code stream message
 */
const StreamMessageComponent: React.FC<StreamMessageProps> = ({ message, className, streamMessages, onLinkDetected }) => {
  // State to track tool results mapped by tool call ID
  const [toolResults, setToolResults] = useState<Map<string, any>>(new Map());
  
  // Get current theme
  const { theme } = useTheme();
  const syntaxTheme = getClaudeSyntaxTheme(theme);
  
  // Extract all tool results from stream messages
  useEffect(() => {
    const results = new Map<string, any>();
    
    // Iterate through all messages to find tool results
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
  
  // Helper to get tool result for a specific tool call ID
  const getToolResult = (toolId: string | undefined): any => {
    if (!toolId) return null;
    return toolResults.get(toolId) || null;
  };
  
  try {
    // Skip rendering for meta messages that don't have meaningful content
    if (message.isMeta && !message.leafUuid && !message.summary) {
      return null;
    }

    // Handle summary messages
    if (message.leafUuid && message.summary && (message as any).type === "summary") {
      return <SummaryWidget summary={message.summary} leafUuid={message.leafUuid} />;
    }

    // System initialization message
    if (message.type === "system" && message.subtype === "init") {
      return (
        <CollapsibleToolWidget
          icon={<Bot className="h-4 w-4 text-blue-500" />}
          title="System Initialized"
          summary={message.model || ''}
        >
          <SystemInitializedWidget
            sessionId={message.session_id}
            model={message.model}
            cwd={message.cwd}
            tools={message.tools}
          />
        </CollapsibleToolWidget>
      );
    }

    // Assistant message
    if (message.type === "assistant" && message.message) {
      const msg = message.message;
      
      let renderedSomething = false;
      
      const renderedCard = (
        <Card className={cn("border-primary/20 bg-primary/5", className)}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Bot className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1 space-y-2 min-w-0">
                {msg.content && Array.isArray(msg.content) && msg.content.map((content: any, idx: number) => {
                  // Text content - render as markdown
                  if (content.type === "text") {
                    // Ensure we have a string to render
                    const textContent = typeof content.text === 'string' 
                      ? content.text 
                      : (content.text?.text || JSON.stringify(content.text || content));
                    
                    renderedSomething = true;
                    return (
                      <div key={idx} className="prose prose-sm dark:prose-invert max-w-none">
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
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {textContent}
                        </ReactMarkdown>
                      </div>
                    );
                  }
                  
                  // Thinking content - render with ThinkingWidget
                  if (content.type === "thinking") {
                    renderedSomething = true;
                    return (
                      <div key={idx}>
                        <ThinkingWidget 
                          thinking={content.thinking || ''} 
                          signature={content.signature}
                        />
                      </div>
                    );
                  }
                  
                  // Tool use - render custom widgets based on tool name
                  if (content.type === "tool_use") {
                    const toolName = content.name?.toLowerCase();
                    const input = content.input;
                    const toolId = content.id;
                    
                    // Get the tool result if available
                    const toolResult = getToolResult(toolId);
                    
                    // Function to render the appropriate tool widget
                    const renderToolWidget = () => {
                      // Task tool - for sub-agent tasks
                      if (toolName === "task" && input) {
                        renderedSomething = true;
                        return (
                          <CollapsibleToolWidget
                            icon={<><Bot className="h-4 w-4 text-purple-500" /><Sparkles className="h-2 w-2 text-purple-400 -ml-2 -mt-2" /></>}
                            title="Sub-Agent Task"
                            summary={input.description}
                          >
                            <TaskWidget description={input.description} prompt={input.prompt} result={toolResult} />
                          </CollapsibleToolWidget>
                        );
                      }
                      
                      // Edit tool
                      if (toolName === "edit" && input?.file_path) {
                        renderedSomething = true;
                        const fileName = input.file_path.split('/').pop() || input.file_path;
                        return (
                          <CollapsibleToolWidget
                            icon={<FileEdit className="h-4 w-4 text-amber-500" />}
                            title="Edit"
                            summary={fileName}
                          >
                            <EditWidget {...input} result={toolResult} />
                          </CollapsibleToolWidget>
                        );
                      }
                      
                      // MultiEdit tool
                      if (toolName === "multiedit" && input?.file_path && input?.edits) {
                        renderedSomething = true;
                        const fileName = input.file_path.split('/').pop() || input.file_path;
                        return (
                          <CollapsibleToolWidget
                            icon={<FileEdit className="h-4 w-4 text-amber-500" />}
                            title="MultiEdit"
                            summary={`${fileName} (${input.edits?.length || 0} edits)`}
                          >
                            <MultiEditWidget {...input} result={toolResult} />
                          </CollapsibleToolWidget>
                        );
                      }
                      
                      // MCP tools (starting with mcp__)
                      if (content.name?.startsWith("mcp__")) {
                        renderedSomething = true;
                        const parts = content.name.split('__');
                        const namespace = parts[1] || '';
                        const method = parts[2] || '';
                        return (
                          <CollapsibleToolWidget
                            icon={<><Package2 className="h-4 w-4 text-violet-500" /><Sparkles className="h-2 w-2 text-violet-400 -ml-2 -mt-2" /></>}
                            title="MCP"
                            summary={`${namespace} → ${method}`}
                          >
                            <MCPWidget toolName={content.name} input={input} result={toolResult} />
                          </CollapsibleToolWidget>
                        );
                      }
                      
                      // TodoWrite tool
                      if (toolName === "todowrite" && input?.todos) {
                        renderedSomething = true;
                        const todoCount = input.todos?.length || 0;
                        const inProgress = input.todos?.filter((t: any) => t.status === 'in_progress').length || 0;
                        return (
                          <CollapsibleToolWidget
                            icon={<ListPlus className="h-4 w-4 text-blue-500" />}
                            title="Todo List"
                            summary={`${todoCount} items${inProgress > 0 ? `, ${inProgress} in progress` : ''}`}
                          >
                            <TodoWidget todos={input.todos} result={toolResult} />
                          </CollapsibleToolWidget>
                        );
                      }
                      
                      // TodoRead tool
                      if (toolName === "todoread") {
                        renderedSomething = true;
                        return (
                          <CollapsibleToolWidget
                            icon={<ListChecks className="h-4 w-4 text-blue-500" />}
                            title="Read Todos"
                          >
                            <TodoReadWidget todos={input?.todos} result={toolResult} />
                          </CollapsibleToolWidget>
                        );
                      }
                      
                      // LS tool
                      if (toolName === "ls" && input?.path) {
                        renderedSomething = true;
                        const dirName = input.path.split('/').pop() || input.path;
                        return (
                          <CollapsibleToolWidget
                            icon={<FolderOpen className="h-4 w-4 text-yellow-500" />}
                            title="List Directory"
                            summary={dirName}
                          >
                            <LSWidget path={input.path} result={toolResult} />
                          </CollapsibleToolWidget>
                        );
                      }
                      
                      // Read tool
                      if (toolName === "read" && input?.file_path) {
                        renderedSomething = true;
                        const fileName = input.file_path.split('/').pop() || input.file_path;
                        return (
                          <CollapsibleToolWidget
                            icon={<FileText className="h-4 w-4 text-green-500" />}
                            title="Read"
                            summary={fileName}
                          >
                            <ReadWidget filePath={input.file_path} result={toolResult} />
                          </CollapsibleToolWidget>
                        );
                      }
                      
                      // Glob tool
                      if (toolName === "glob" && input?.pattern) {
                        renderedSomething = true;
                        return (
                          <CollapsibleToolWidget
                            icon={<Search className="h-4 w-4 text-cyan-500" />}
                            title="Glob"
                            summary={input.pattern}
                          >
                            <GlobWidget pattern={input.pattern} result={toolResult} />
                          </CollapsibleToolWidget>
                        );
                      }
                      
                      // Bash tool
                      if (toolName === "bash" && input?.command) {
                        renderedSomething = true;
                        const cmdPreview = input.command.length > 40 
                          ? input.command.substring(0, 40) + '...' 
                          : input.command;
                        return (
                          <CollapsibleToolWidget
                            icon={<Terminal className="h-4 w-4 text-green-500" />}
                            title="Bash"
                            summary={input.description || cmdPreview}
                          >
                            <BashWidget command={input.command} description={input.description} result={toolResult} />
                          </CollapsibleToolWidget>
                        );
                      }
                      
                      // Write tool
                      if (toolName === "write" && input?.file_path && input?.content) {
                        renderedSomething = true;
                        const fileName = input.file_path.split('/').pop() || input.file_path;
                        return (
                          <CollapsibleToolWidget
                            icon={<FileEdit className="h-4 w-4 text-emerald-500" />}
                            title="Write"
                            summary={fileName}
                          >
                            <WriteWidget filePath={input.file_path} content={input.content} result={toolResult} />
                          </CollapsibleToolWidget>
                        );
                      }
                      
                      // Grep tool
                      if (toolName === "grep" && input?.pattern) {
                        renderedSomething = true;
                        return (
                          <CollapsibleToolWidget
                            icon={<Search className="h-4 w-4 text-emerald-500" />}
                            title="Grep"
                            summary={input.pattern}
                          >
                            <GrepWidget pattern={input.pattern} include={input.include} path={input.path} exclude={input.exclude} result={toolResult} />
                          </CollapsibleToolWidget>
                        );
                      }
                      
                      // WebSearch tool
                      if (toolName === "websearch" && input?.query) {
                        renderedSomething = true;
                        return (
                          <CollapsibleToolWidget
                            icon={<Globe2 className="h-4 w-4 text-blue-500" />}
                            title="Web Search"
                            summary={input.query}
                          >
                            <WebSearchWidget query={input.query} result={toolResult} />
                          </CollapsibleToolWidget>
                        );
                      }
                      
                      // WebFetch tool
                      if (toolName === "webfetch" && input?.url) {
                        renderedSomething = true;
                        const urlPreview = input.url.length > 50 
                          ? input.url.substring(0, 50) + '...' 
                          : input.url;
                        return (
                          <CollapsibleToolWidget
                            icon={<Globe className="h-4 w-4 text-blue-500" />}
                            title="Web Fetch"
                            summary={urlPreview}
                          >
                            <WebFetchWidget url={input.url} prompt={input.prompt} result={toolResult} />
                          </CollapsibleToolWidget>
                        );
                      }
                      
                      // Default - return null
                      return null;
                    };
                    
                    // Render the tool widget
                    const widget = renderToolWidget();
                    if (widget) {
                      renderedSomething = true;
                      return <div key={idx}>{widget}</div>;
                    }
                    
                    // Fallback to basic tool display
                    renderedSomething = true;
                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Terminal className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            Using tool: <code className="font-mono">{content.name}</code>
                          </span>
                        </div>
                        {content.input && (
                          <div className="ml-6 p-2 bg-background rounded-md border">
                            <pre className="text-xs font-mono overflow-x-auto">
                              {JSON.stringify(content.input, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  return null;
                })}
                
                {msg.usage && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Tokens: {msg.usage.input_tokens} in, {msg.usage.output_tokens} out
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );
      
      if (!renderedSomething) return null;
      return renderedCard;
    }

    // User message - handle both nested and direct content structures
    if (message.type === "user") {
      // Don't render meta messages, which are for system use
      if (message.isMeta) return null;

      // Handle different message structures
      const msg = message.message || message;
      
      let renderedSomething = false;
      
      const renderedCard = (
        <Card className={cn("border-muted-foreground/20 bg-muted/20", className)}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-2 min-w-0">
                {/* Handle content that is a simple string (e.g. from user commands) */}
                {(typeof msg.content === 'string' || (msg.content && !Array.isArray(msg.content))) && (
                  (() => {
                    const contentStr = typeof msg.content === 'string' ? msg.content : String(msg.content);
                    if (contentStr.trim() === '') return null;
                    renderedSomething = true;
                    
                    // Check if it's a command message
                    const commandMatch = contentStr.match(/<command-name>(.+?)<\/command-name>[\s\S]*?<command-message>(.+?)<\/command-message>[\s\S]*?<command-args>(.*?)<\/command-args>/);
                    if (commandMatch) {
                      const [, commandName, commandMessage, commandArgs] = commandMatch;
                      return (
                        <CommandWidget 
                          commandName={commandName.trim()} 
                          commandMessage={commandMessage.trim()}
                          commandArgs={commandArgs?.trim()}
                        />
                      );
                    }
                    
                    // Check if it's command output
                    const stdoutMatch = contentStr.match(/<local-command-stdout>([\s\S]*?)<\/local-command-stdout>/);
                    if (stdoutMatch) {
                      const [, output] = stdoutMatch;
                      return <CommandOutputWidget output={output} onLinkDetected={onLinkDetected} />;
                    }
                    
                    // Check if it's an anyon workflow command - show friendly display text with icon
                    if (isAnyonWorkflowCommand(contentStr.trim())) {
                      const { text, icon } = getPromptDisplayInfo(contentStr.trim());
                      return (
                        <div className="flex items-center gap-2 text-sm font-medium text-primary">
                          <WorkflowIcon icon={icon} className="h-4 w-4" />
                          <span>{text}</span>
                        </div>
                      );
                    }
                    
                    // Otherwise render as plain text
                    return (
                      <div className="text-sm">
                        {contentStr}
                      </div>
                    );
                  })()
                )}

                {/* Handle content that is an array of parts */}
                {Array.isArray(msg.content) && msg.content.map((content: any, idx: number) => {
                  // Tool result
                  if (content.type === "tool_result") {
                    // Skip duplicate tool_result if a dedicated widget is present
                    let hasCorrespondingWidget = false;
                    if (content.tool_use_id && streamMessages) {
                      for (let i = streamMessages.length - 1; i >= 0; i--) {
                        const prevMsg = streamMessages[i];
                        if (prevMsg.type === 'assistant' && prevMsg.message?.content && Array.isArray(prevMsg.message.content)) {
                          const toolUse = prevMsg.message.content.find((c: any) => c.type === 'tool_use' && c.id === content.tool_use_id);
                          if (toolUse) {
                            const toolName = toolUse.name?.toLowerCase();
                            const toolsWithWidgets = ['task','edit','multiedit','todowrite','todoread','ls','read','glob','bash','write','grep','websearch','webfetch'];
                            if (toolsWithWidgets.includes(toolName) || toolUse.name?.startsWith('mcp__')) {
                              hasCorrespondingWidget = true;
                            }
                            break;
                          }
                        }
                      }
                    }

                    if (hasCorrespondingWidget) {
                      return null;
                    }
                    // Extract the actual content string
                    let contentText = '';
                    if (typeof content.content === 'string') {
                      contentText = content.content;
                    } else if (content.content && typeof content.content === 'object') {
                      // Handle object with text property
                      if (content.content.text) {
                        contentText = content.content.text;
                      } else if (Array.isArray(content.content)) {
                        // Handle array of content blocks
                        contentText = content.content
                          .map((c: any) => (typeof c === 'string' ? c : c.text || JSON.stringify(c)))
                          .join('\n');
                      } else {
                        // Fallback to JSON stringify
                        contentText = JSON.stringify(content.content, null, 2);
                      }
                    }
                    
                    // Always show system reminders regardless of widget status
                    const reminderMatch = contentText.match(/<system-reminder>(.*?)<\/system-reminder>/s);
                    if (reminderMatch) {
                      const reminderMessage = reminderMatch[1].trim();
                      const beforeReminder = contentText.substring(0, reminderMatch.index || 0).trim();
                      const afterReminder = contentText.substring((reminderMatch.index || 0) + reminderMatch[0].length).trim();
                      
                      renderedSomething = true;
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">Tool Result</span>
                          </div>
                          
                          {beforeReminder && (
                            <div className="ml-6 p-2 bg-background rounded-md border">
                              <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                                {beforeReminder}
                              </pre>
                            </div>
                          )}
                          
                          <div className="ml-6">
                            <SystemReminderWidget message={reminderMessage} />
                          </div>
                          
                          {afterReminder && (
                            <div className="ml-6 p-2 bg-background rounded-md border">
                              <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                                {afterReminder}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    }
                    
                    // Check if this is an Edit tool result
                    const isEditResult = contentText.includes("has been updated. Here's the result of running `cat -n`");
                    
                    if (isEditResult) {
                      renderedSomething = true;
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">Edit Result</span>
                          </div>
                          <EditResultWidget content={contentText} />
                        </div>
                      );
                    }
                    
                    // Check if this is a MultiEdit tool result
                    const isMultiEditResult = contentText.includes("has been updated with multiple edits") || 
                                             contentText.includes("MultiEdit completed successfully") ||
                                             contentText.includes("Applied multiple edits to");
                    
                    if (isMultiEditResult) {
                      renderedSomething = true;
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">MultiEdit Result</span>
                          </div>
                          <MultiEditResultWidget content={contentText} />
                        </div>
                      );
                    }
                    
                    // Check if this is an LS tool result (directory tree structure)
                    const isLSResult = (() => {
                      if (!content.tool_use_id || typeof contentText !== 'string') return false;
                      
                      // Check if this result came from an LS tool by looking for the tool call
                      let isFromLSTool = false;
                      
                      // Search in previous assistant messages for the matching tool_use
                      if (streamMessages) {
                        for (let i = streamMessages.length - 1; i >= 0; i--) {
                          const prevMsg = streamMessages[i];
                          // Only check assistant messages
                          if (prevMsg.type === 'assistant' && prevMsg.message?.content && Array.isArray(prevMsg.message.content)) {
                            const toolUse = prevMsg.message.content.find((c: any) => 
                              c.type === 'tool_use' && 
                              c.id === content.tool_use_id &&
                              c.name?.toLowerCase() === 'ls'
                            );
                            if (toolUse) {
                              isFromLSTool = true;
                              break;
                            }
                          }
                        }
                      }
                      
                      // Only proceed if this is from an LS tool
                      if (!isFromLSTool) return false;
                      
                      // Additional validation: check for tree structure pattern
                      const lines = contentText.split('\n');
                      const hasTreeStructure = lines.some(line => /^\s*-\s+/.test(line));
                      const hasNoteAtEnd = lines.some(line => line.trim().startsWith('NOTE: do any of the files'));
                      
                      return hasTreeStructure || hasNoteAtEnd;
                    })();
                    
                    if (isLSResult) {
                      renderedSomething = true;
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">Directory Contents</span>
                          </div>
                          <LSResultWidget content={contentText} />
                        </div>
                      );
                    }
                    
                    // Check if this is a Read tool result (contains line numbers with arrow separator)
                    const isReadResult = content.tool_use_id && typeof contentText === 'string' && 
                      /^\s*\d+→/.test(contentText);
                    
                    if (isReadResult) {
                      // Try to find the corresponding Read tool call to get the file path
                      let filePath: string | undefined;
                      
                      // Search in previous assistant messages for the matching tool_use
                      if (streamMessages) {
                        for (let i = streamMessages.length - 1; i >= 0; i--) {
                          const prevMsg = streamMessages[i];
                          // Only check assistant messages
                          if (prevMsg.type === 'assistant' && prevMsg.message?.content && Array.isArray(prevMsg.message.content)) {
                            const toolUse = prevMsg.message.content.find((c: any) => 
                              c.type === 'tool_use' && 
                              c.id === content.tool_use_id &&
                              c.name?.toLowerCase() === 'read'
                            );
                            if (toolUse?.input?.file_path) {
                              filePath = toolUse.input.file_path;
                              break;
                            }
                          }
                        }
                      }
                      
                      renderedSomething = true;
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">Read Result</span>
                          </div>
                          <ReadResultWidget content={contentText} filePath={filePath} />
                        </div>
                      );
                    }
                    
                    // Handle empty tool results
                    if (!contentText || contentText.trim() === '') {
                      renderedSomething = true;
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">Tool Result</span>
                          </div>
                          <div className="ml-6 p-3 bg-muted/50 rounded-md border text-sm text-muted-foreground italic">
                            Tool did not return any output
                          </div>
                        </div>
                      );
                    }
                    
                    renderedSomething = true;
                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center gap-2">
                          {content.is_error ? (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                          <span className="text-sm font-medium">Tool Result</span>
                        </div>
                        <div className="ml-6 p-2 bg-background rounded-md border">
                          <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                            {contentText}
                          </pre>
                        </div>
                      </div>
                    );
                  }
                  
                  // Text content
                  if (content.type === "text") {
                    // Handle both string and object formats
                    const textContent = typeof content.text === 'string'
                      ? content.text
                      : (content.text?.text || JSON.stringify(content.text));

                    // Check if it's an anyon workflow command - show friendly display text with icon
                    if (isAnyonWorkflowCommand(textContent.trim())) {
                      const { text, icon } = getPromptDisplayInfo(textContent.trim());
                      renderedSomething = true;
                      return (
                        <div key={idx} className="flex items-center gap-2 text-sm font-medium text-primary">
                          <WorkflowIcon icon={icon} className="h-4 w-4" />
                          <span>{text}</span>
                        </div>
                      );
                    }

                    renderedSomething = true;
                    return (
                      <div key={idx} className="text-sm">
                        {textContent}
                      </div>
                    );
                  }
                  
                  return null;
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      );
      if (!renderedSomething) return null;
      return renderedCard;
    }

    // Result message - show only metadata (text content already shown in assistant message)
    if (message.type === "result") {
      const isError = message.is_error || message.subtype?.includes("error");
      const hasMetadata = message.cost_usd !== undefined || 
                          message.total_cost_usd !== undefined || 
                          message.duration_ms !== undefined || 
                          message.num_turns !== undefined || 
                          message.usage !== undefined ||
                          message.error;
      
      // Skip if no metadata and no error
      if (!hasMetadata && !isError) {
        return null;
      }
      
      // Show compact metadata bar
      return (
        <div className={cn(
          "flex items-center gap-4 px-3 py-2 rounded-lg text-xs",
          isError ? "bg-destructive/10 text-destructive" : "bg-muted/50 text-muted-foreground",
          className
        )}>
          {isError ? (
            <AlertCircle className="h-3.5 w-3.5" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          )}
          
          {message.error && (
            <span className="text-destructive">{message.error}</span>
          )}
          
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

    // Skip rendering if no meaningful content
    return null;
  } catch (error) {
    // If any error occurs during rendering, show a safe error message
    console.error("Error rendering stream message:", error, message);
    return (
      <Card className={cn("border-destructive/20 bg-destructive/5", className)}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Error rendering message</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
};

export const StreamMessage = React.memo(StreamMessageComponent);
