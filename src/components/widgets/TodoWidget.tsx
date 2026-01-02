import React from "react";
import { CheckCircle2, Clock, Circle, FileEdit } from "@/lib/icons";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TodoWidgetProps, TodoItem } from "@/types/widgets";

/**
 * Widget for TodoWrite tool - displays a beautiful TODO list
 */
export const TodoWidget: React.FC<TodoWidgetProps> = ({ todos: inputTodos, result }) => {
  // Extract todos from result if not directly provided (defensive programming)
  let todos: TodoItem[] = [];

  // Ensure inputTodos is actually an array
  if (Array.isArray(inputTodos) && inputTodos.length > 0) {
    todos = inputTodos;
  } else if (result) {
    // Try to extract from result object
    if (typeof result === 'object' && Array.isArray((result as any).todos)) {
      todos = (result as any).todos;
    } else if (typeof (result as any).content === 'string') {
      try {
        const parsed = JSON.parse((result as any).content);
        if (Array.isArray(parsed)) {
          todos = parsed;
        } else if (parsed.todos && Array.isArray(parsed.todos)) {
          todos = parsed.todos;
        }
      } catch (e) {
        // Not JSON, ignore
      }
    }
  } else if (Array.isArray(inputTodos)) {
    // Empty array case - use it as is
    todos = inputTodos;
  }

  const statusIcons = {
    completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    in_progress: <Clock className="h-4 w-4 text-blue-500 animate-pulse" />,
    pending: <Circle className="h-4 w-4 text-muted-foreground" />
  };

  const priorityColors = {
    high: "bg-red-500/10 text-red-500 border-red-500/20",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    low: "bg-green-500/10 text-green-500 border-green-500/20"
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <FileEdit className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Todo List</span>
      </div>
      <div className="space-y-2">
        {todos.map((todo, idx) => (
          <div
            key={todo.id || idx}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border bg-card/50",
              todo.status === "completed" && "opacity-60"
            )}
          >
            <div className="mt-0.5">
              {statusIcons[todo.status as keyof typeof statusIcons] || statusIcons.pending}
            </div>
            <div className="flex-1 space-y-1">
              <p className={cn(
                "text-sm",
                todo.status === "completed" && "line-through"
              )}>
                {todo.content}
              </p>
              {todo.priority && (
                <Badge
                  variant="outline"
                  className={cn("text-xs", priorityColors[todo.priority as keyof typeof priorityColors])}
                >
                  {todo.priority}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
