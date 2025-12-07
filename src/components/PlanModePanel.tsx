import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  GripVertical,
  Loader2,
  ListTodo,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Plan item structure (from Claude's TodoWrite)
 */
export interface PlanItem {
  id: string;
  content: string;
  activeForm: string;
  status: 'pending' | 'in_progress' | 'completed';
}

/**
 * Plan mode state
 */
export type PlanModeState = 'idle' | 'planning' | 'awaiting_approval' | 'executing' | 'completed' | 'rejected';

interface PlanModePanelProps {
  /** Current plan items */
  planItems: PlanItem[];
  /** Plan mode state */
  state: PlanModeState;
  /** Whether Claude is currently streaming/thinking */
  isLoading?: boolean;
  /** Callback when user approves the plan */
  onApprove: (items: PlanItem[]) => void;
  /** Callback when user rejects the plan */
  onReject: () => void;
  /** Callback when items are reordered */
  onReorder?: (items: PlanItem[]) => void;
  /** Callback when an item is removed */
  onRemoveItem?: (id: string) => void;
  /** Optional className */
  className?: string;
}

/**
 * PlanModePanel - vibe-kanban style plan mode UI
 *
 * Shows Claude's planned tasks in a card layout
 * Allows user to review, reorder, and approve/reject the plan
 */
export const PlanModePanel: React.FC<PlanModePanelProps> = ({
  planItems,
  state,
  isLoading = false,
  onApprove,
  onReject,
  onReorder,
  onRemoveItem,
  className,
}) => {
  const [items, setItems] = useState<PlanItem[]>(planItems);

  // Sync items with props
  useEffect(() => {
    setItems(planItems);
  }, [planItems]);

  const handleReorder = useCallback((newItems: PlanItem[]) => {
    setItems(newItems);
    onReorder?.(newItems);
  }, [onReorder]);

  const handleRemove = useCallback((id: string) => {
    const newItems = items.filter(item => item.id !== id);
    setItems(newItems);
    onRemoveItem?.(id);
  }, [items, onRemoveItem]);

  const handleApprove = useCallback(() => {
    onApprove(items);
  }, [items, onApprove]);

  const getStatusIcon = (status: PlanItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  const getStatusColor = (status: PlanItem['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-500/30 bg-green-500/5';
      case 'in_progress':
        return 'border-blue-500/30 bg-blue-500/5';
      default:
        return 'border-border bg-card';
    }
  };

  // Empty state
  if (state === 'idle' && items.length === 0) {
    return (
      <div className={cn('h-full flex flex-col', className)}>
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6">
          <div className="w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
            <ListTodo className="w-8 h-8" />
          </div>
          <p className="text-sm font-medium mb-1">Plan Mode</p>
          <p className="text-xs text-center max-w-[200px]">
            Claude will show planned tasks here before executing them
          </p>
        </div>
      </div>
    );
  }

  // Planning state (Claude is thinking)
  if (state === 'planning' && items.length === 0) {
    return (
      <div className={cn('h-full flex flex-col', className)}>
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p className="text-sm font-medium">Planning...</p>
          <p className="text-xs text-center max-w-[200px] mt-1">
            Claude is analyzing and creating a plan
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Plan Mode</h3>
          {state === 'planning' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
              Planning...
            </span>
          )}
          {state === 'awaiting_approval' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              Review Required
            </span>
          )}
          {state === 'executing' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
              Executing
            </span>
          )}
          {state === 'completed' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
              Completed
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {items.filter(i => i.status === 'completed').length}/{items.length} completed
        </div>
      </div>

      {/* Plan Items */}
      <div className="flex-1 overflow-y-auto p-4">
        <Reorder.Group
          axis="y"
          values={items}
          onReorder={handleReorder}
          className="space-y-2"
        >
          <AnimatePresence>
            {items.map((item, index) => (
              <Reorder.Item
                key={item.id}
                value={item}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={cn(
                  'group relative rounded-lg border p-3 cursor-grab active:cursor-grabbing',
                  'transition-colors duration-200',
                  getStatusColor(item.status),
                  state === 'executing' && item.status === 'in_progress' && 'ring-2 ring-blue-500/50'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Drag Handle */}
                  <div className="flex-shrink-0 mt-0.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(item.status)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                    </div>
                    <p className={cn(
                      'text-sm',
                      item.status === 'completed' && 'line-through text-muted-foreground'
                    )}>
                      {item.status === 'in_progress' ? item.activeForm : item.content}
                    </p>
                  </div>

                  {/* Actions */}
                  {state === 'awaiting_approval' && (
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive/70 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(item.id);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>

        {/* Loading more items */}
        {isLoading && state === 'planning' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-4"
          >
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </motion.div>
        )}
      </div>

      {/* Footer Actions */}
      {state === 'awaiting_approval' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-shrink-0 border-t p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              Review the plan and approve to continue
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={onReject}
            >
              <XCircle className="w-4 h-4" />
              Reject
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleApprove}
              disabled={items.length === 0}
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve & Execute
            </Button>
          </div>
        </motion.div>
      )}

      {/* Executing state footer */}
      {state === 'executing' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-shrink-0 border-t p-4"
        >
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium">Executing Plan</p>
              <p className="text-xs text-muted-foreground">
                {items.filter(i => i.status === 'completed').length} of {items.length} tasks completed
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Completed state footer */}
      {state === 'completed' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-shrink-0 border-t p-4 bg-green-500/5"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">Plan Completed</p>
              <p className="text-xs text-muted-foreground">
                All {items.length} tasks have been completed
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Rejected state footer */}
      {state === 'rejected' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-shrink-0 border-t p-4 bg-destructive/5"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">Plan Rejected</p>
              <p className="text-xs text-muted-foreground">
                The plan was rejected. You can request a new plan.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PlanModePanel;
