import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, Plus, MessageSquare, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { SessionPersistenceService, type TabType, type SessionRestoreData } from '@/services/sessionPersistence';
import type { Session } from '@/lib/api';

interface SessionDropdownProps {
  projectPath: string;
  tabType: TabType;
  currentSessionId: string | null;
  onSessionSelect: (session: Session | null) => void;
  className?: string;
}

/**
 * Format timestamp to readable date string
 */
function formatSessionDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = new Date(now.getTime() - 86400000).toDateString() === date.toDateString();

  if (isToday) {
    return `오늘 ${date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (isYesterday) {
    return `어제 ${date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Truncate text with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * SessionDropdown - Dropdown for selecting chat sessions per tab
 */
export const SessionDropdown: React.FC<SessionDropdownProps> = ({
  projectPath,
  tabType,
  currentSessionId,
  onSessionSelect,
  className,
}) => {
  const [sessions, setSessions] = useState<SessionRestoreData[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load sessions for this tab
  useEffect(() => {
    if (projectPath) {
      const tabSessions = SessionPersistenceService.getSessionsForTab(projectPath, tabType);
      setSessions(tabSessions);
    }
  }, [projectPath, tabType, isOpen]); // Reload when dropdown opens

  // Find current session data
  const currentSession = useMemo(() => {
    if (!currentSessionId) return null;
    return sessions.find(s => s.sessionId === currentSessionId) || null;
  }, [currentSessionId, sessions]);

  // Handle new session
  const handleNewSession = () => {
    onSessionSelect(null);
    setIsOpen(false);
  };

  // Handle session select
  const handleSelectSession = (sessionData: SessionRestoreData) => {
    const session = SessionPersistenceService.createSessionFromRestoreData(sessionData);
    onSessionSelect(session);
    setIsOpen(false);
  };

  // Display text for current session
  const currentDisplayText = currentSession
    ? `${formatSessionDate(currentSession.timestamp)}${currentSession.firstMessage ? ` - ${truncateText(currentSession.firstMessage, 20)}` : ''}`
    : '새 대화';

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-2 px-3 font-normal",
            "bg-background/50 hover:bg-background/80",
            "border-border/50",
            className
          )}
        >
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm truncate max-w-[180px]">{currentDisplayText}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72">
        {/* New Session Option */}
        <DropdownMenuItem
          onClick={handleNewSession}
          className="gap-2 cursor-pointer"
        >
          <Plus className="h-4 w-4 text-primary" />
          <span className="font-medium">새 대화 시작</span>
        </DropdownMenuItem>

        {sessions.length > 0 && (
          <>
            <DropdownMenuSeparator />

            {/* Session List */}
            <div className="max-h-64 overflow-y-auto">
              {sessions.map((session) => (
                <DropdownMenuItem
                  key={session.sessionId}
                  onClick={() => handleSelectSession(session)}
                  className={cn(
                    "gap-2 cursor-pointer flex-col items-start py-2",
                    currentSessionId === session.sessionId && "bg-accent/50"
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">
                      {formatSessionDate(session.timestamp)}
                    </span>
                    {currentSessionId === session.sessionId && (
                      <Check className="h-3.5 w-3.5 text-primary ml-auto" />
                    )}
                  </div>
                  {session.firstMessage && (
                    <p className="text-sm text-foreground/80 line-clamp-2 pl-5.5 w-full">
                      {truncateText(session.firstMessage, 60)}
                    </p>
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          </>
        )}

        {sessions.length === 0 && (
          <div className="px-2 py-3 text-center">
            <p className="text-xs text-muted-foreground">
              이전 대화 기록이 없습니다
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SessionDropdown;
