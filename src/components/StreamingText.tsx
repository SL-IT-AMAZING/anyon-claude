import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { getClaudeSyntaxTheme } from "@/lib/claudeSyntaxTheme";
import { useTheme } from "@/hooks";

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
  className?: string;
  /** Typing speed in ms per character (0 = instant) */
  typingSpeed?: number;
}

/**
 * StreamingText component - shows text with typing animation
 * When isStreaming is true, shows a blinking cursor at the end
 */
export const StreamingText: React.FC<StreamingTextProps> = ({
  text,
  isStreaming,
  className,
  typingSpeed = 0, // 0 = show all text instantly (real streaming)
}) => {
  const { theme } = useTheme();
  const syntaxTheme = getClaudeSyntaxTheme(theme);
  const [displayedText, setDisplayedText] = useState(text);
  const animationRef = useRef<number | null>(null);
  const lastTextRef = useRef(text);

  useEffect(() => {
    // If typing speed is 0 or text is the same, show instantly
    if (typingSpeed === 0 || text === lastTextRef.current) {
      setDisplayedText(text);
      lastTextRef.current = text;
      return;
    }

    // Animate only the new characters
    const prevLength = lastTextRef.current.length;
    const newLength = text.length;
    
    if (newLength <= prevLength) {
      // Text got shorter or same, just set it
      setDisplayedText(text);
      lastTextRef.current = text;
      return;
    }

    // Animate new characters
    let currentIndex = prevLength;
    
    const animate = () => {
      if (currentIndex < newLength) {
        setDisplayedText(text.substring(0, currentIndex + 1));
        currentIndex++;
        animationRef.current = window.setTimeout(animate, typingSpeed);
      } else {
        lastTextRef.current = text;
      }
    };

    animate();

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [text, typingSpeed]);

  // When streaming ends, make sure full text is shown
  useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(text);
      lastTextRef.current = text;
    }
  }, [isStreaming, text]);

  if (!displayedText && !isStreaming) {
    return null;
  }

  return (
    <div className={cn("relative", className)}>
      <div className="prose prose-sm dark:prose-invert max-w-none">
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
          {displayedText}
        </ReactMarkdown>
      </div>
      
      {/* Blinking cursor when streaming */}
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-0.5 bg-primary animate-pulse" />
      )}
    </div>
  );
};

export default StreamingText;
