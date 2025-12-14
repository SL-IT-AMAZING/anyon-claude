import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

interface InlineToolBadgeProps {
  icon?: React.ReactNode;
  label: string;
  detail?: string;
  status?: "running" | "success" | "error";
  children?: React.ReactNode;
  className?: string;
  input?: any;
  output?: string;
}

/**
 * Tool badge with green dot indicator - like the screenshot style
 * Shows IN/OUT sections when expanded
 */
export const InlineToolBadge: React.FC<InlineToolBadgeProps> = ({
  label,
  detail,
  status = "success",
  children,
  className,
  input,
  output,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const hasExpandableContent = input || output;
  const hasDetailPanel = !!children;

  // Format input for display
  const formatInput = (inp: any): string => {
    if (!inp) return "";
    if (typeof inp === "string") return inp;
    try {
      return JSON.stringify(inp, null, 2);
    } catch {
      return String(inp);
    }
  };

  // Truncate output for preview
  const truncateOutput = (out: string, maxLen = 50): string => {
    if (!out) return "";
    const firstLine = out.split("\n")[0];
    if (firstLine.length > maxLen) {
      return firstLine.substring(0, maxLen) + "...";
    }
    return firstLine;
  };

  const statusDot = {
    running: "bg-blue-500 animate-pulse",
    success: "bg-green-500",
    error: "bg-red-500",
  };

  return (
    <>
      <div className={cn("group", className)}>
        {/* Main row */}
        <div 
          className="flex items-start gap-3 py-1.5 cursor-pointer hover:bg-muted/30 rounded px-2 -mx-2 transition-colors"
          onClick={() => hasExpandableContent && setIsExpanded(!isExpanded)}
        >
          {/* Status dot */}
          <div className="mt-1.5 flex-shrink-0">
            <div className={cn("w-2 h-2 rounded-full", statusDot[status])} />
          </div>
          
          {/* Tool name and detail */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-foreground">{label}</span>
              {detail && (
                <span className="text-sm text-muted-foreground truncate">{detail}</span>
              )}
            </div>
          </div>

          {/* Expand/collapse indicator */}
          {hasExpandableContent && (
            <div className="flex-shrink-0 text-muted-foreground">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          )}
        </div>

        {/* Expandable IN/OUT content */}
        <AnimatePresence>
          {isExpanded && hasExpandableContent && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="ml-5 pl-3 border-l-2 border-muted space-y-2 py-2">
                {/* IN section */}
                {input && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">IN</span>
                    </div>
                    <div className="bg-muted/50 rounded p-2 text-xs font-mono overflow-x-auto max-h-32 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-foreground/80">
                        {formatInput(input)}
                      </pre>
                    </div>
                  </div>
                )}
                
                {/* OUT section */}
                {output && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">OUT</span>
                    </div>
                    <div className="bg-muted/50 rounded p-2 text-xs font-mono overflow-x-auto max-h-32 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-foreground/80">
                        {truncateOutput(output, 200)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* View full details button */}
                {hasDetailPanel && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDetailOpen(true);
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    View full details →
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Detail slide-over panel */}
      {hasDetailPanel && isDetailOpen && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setIsDetailOpen(false)}
          />
          
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-background border-l shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", statusDot[status])} />
                <span className="font-medium">{label}</span>
                {detail && (
                  <span className="text-sm text-muted-foreground truncate">{detail}</span>
                )}
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {children}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

/**
 * Group of inline tool badges - renders vertically
 */
export const ToolBadgeGroup: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div className={cn("space-y-0.5", className)}>
      {children}
    </div>
  );
};
