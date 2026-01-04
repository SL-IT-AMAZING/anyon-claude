import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronRight,
  FileText,
  List,
  Loader2,
  AlertCircle,
} from '@/lib/icons';
import { cn } from '@/lib/utils';
import { readDir, readTextFile } from '@tauri-apps/plugin-fs';
import { PlanningDocViewer } from './PlanningDocViewer';

// ============================================================================
// Types
// ============================================================================

/** 티켓 메타데이터 */
interface TicketMeta {
  id: string;
  title: string;
  type: string;
  wave: string;
}

/** Epic 파일 정보 */
interface EpicFile {
  id: string;
  title: string;
  filename: string;
  path: string;
  tickets: TicketMeta[];
}

interface TicketViewerPanelProps {
  projectPath: string | undefined;
  devPlanPath: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Epic 파일 내용에서 메타데이터 파싱
 */
function parseEpicFile(content: string, filename: string, path: string): EpicFile {
  // Epic ID 추출 (예: EPIC-001-auth.md → EPIC-001)
  const idMatch = filename.match(/^(EPIC-\d+)/);
  const id = idMatch ? idMatch[1] : filename.replace('.md', '');

  // Epic 제목 추출 (첫 번째 # 헤더)
  const titleMatch = content.match(/^#\s+(.+)/m);
  const title = titleMatch ? titleMatch[1] : id;

  // 티켓 목록 추출
  const tickets: TicketMeta[] = [];
  const ticketPattern = /##\s+(TICKET-\d+(?:-\d+)?)\s*:\s*(.+)/g;
  let match;

  while ((match = ticketPattern.exec(content)) !== null) {
    const ticketId = match[1];
    const ticketTitle = match[2].trim();

    // 티켓 메타데이터 추출
    const ticketSection = extractTicketSection(content, ticketId);
    const meta = parseTicketMeta(ticketSection, ticketId, ticketTitle);
    tickets.push(meta);
  }

  return { id, title, filename, path, tickets };
}

/**
 * Epic 파일에서 특정 티켓 섹션 추출
 */
function extractTicketSection(content: string, ticketId: string): string {
  const pattern = new RegExp(
    `##\\s+${ticketId}[^#]*(?=##\\s+TICKET-|$)`,
    's'
  );
  const match = content.match(pattern);
  return match ? match[0].trim() : `# ${ticketId}\n\n티켓 내용을 찾을 수 없습니다.`;
}

/**
 * 티켓 섹션에서 메타데이터 파싱
 */
function parseTicketMeta(section: string, id: string, title: string): TicketMeta {
  // Type 추출
  const typeMatch = section.match(/\|\s*\*?\*?Type\*?\*?\s*\|\s*(\w+)\s*\|/i) ||
    section.match(/type:\s*["']?(\w+)["']?/i);
  const type = typeMatch ? typeMatch[1].toLowerCase() : 'unknown';

  // Wave 추출
  const waveMatch = section.match(/\|\s*\*?\*?Wave\*?\*?\s*\|\s*(\d+)\s*\|/i) ||
    section.match(/wave:\s*["']?(\d+)["']?/i);
  const wave = waveMatch ? waveMatch[1] : '';

  return { id, title, type, wave };
}

/**
 * 티켓 타입별 색상 클래스 반환
 */
function getTypeColorClass(type: string): string {
  switch (type) {
    case 'api':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    case 'ui':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
    case 'database':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    case 'scaffolding':
      return 'bg-green-500/10 text-green-600 dark:text-green-400';
    case 'integration':
      return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400';
    case 'test':
      return 'bg-pink-500/10 text-pink-600 dark:text-pink-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * TicketViewerPanel - dev-plan 폴더의 티켓을 리스트 + 상세보기로 표시
 * Plan-Only 트랙에서 pm-orchestrator 완료 후 사용
 */
export const TicketViewerPanel: React.FC<TicketViewerPanelProps> = ({
  projectPath,
  devPlanPath,
}) => {
  const [epics, setEpics] = useState<EpicFile[]>([]);
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
  const [selectedTicket, setSelectedTicket] = useState<{ epicId: string; ticketId: string } | null>(null);
  const [ticketContent, setTicketContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Epic 파일 목록 로드
  const loadEpics = useCallback(async () => {
    if (!projectPath) return;

    setIsLoading(true);
    setError(null);

    try {
      const epicsPath = `${devPlanPath}/epics`;

      // 디렉토리 존재 여부 확인 및 파일 목록 가져오기
      let entries: { name: string; isDirectory: boolean }[] = [];
      try {
        const dirEntries = await readDir(epicsPath);
        entries = dirEntries.map(entry => ({
          name: entry.name,
          isDirectory: entry.isDirectory,
        }));
      } catch {
        // epics 폴더가 없는 경우
        setEpics([]);
        setIsLoading(false);
        return;
      }

      const epicFiles: EpicFile[] = [];

      for (const entry of entries) {
        if (!entry.isDirectory && entry.name.endsWith('.md') && entry.name.startsWith('EPIC-')) {
          const filePath = `${epicsPath}/${entry.name}`;
          try {
            const content = await readTextFile(filePath);
            const epicMeta = parseEpicFile(content, entry.name, filePath);
            epicFiles.push(epicMeta);
          } catch (e) {
            console.error(`[TicketViewerPanel] Error parsing ${entry.name}:`, e);
          }
        }
      }

      const sortedEpics = epicFiles.sort((a, b) => a.id.localeCompare(b.id));
      setEpics(sortedEpics);

      // 첫 번째 Epic 자동 확장
      if (sortedEpics.length > 0) {
        setExpandedEpics(new Set([sortedEpics[0].id]));
      }
    } catch (err) {
      console.error('[TicketViewerPanel] Error loading epics:', err);
      setError('Epic 파일을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [projectPath, devPlanPath]);

  useEffect(() => {
    loadEpics();
  }, [loadEpics]);

  // Epic 토글 핸들러
  const toggleEpic = useCallback((epicId: string) => {
    setExpandedEpics(prev => {
      const next = new Set(prev);
      if (next.has(epicId)) {
        next.delete(epicId);
      } else {
        next.add(epicId);
      }
      return next;
    });
  }, []);

  // 티켓 선택 핸들러
  const handleTicketSelect = useCallback(async (epicId: string, ticketId: string, epicPath: string) => {
    setSelectedTicket({ epicId, ticketId });

    try {
      const content = await readTextFile(epicPath);
      const ticketSection = extractTicketSection(content, ticketId);
      setTicketContent(ticketSection);
    } catch (err) {
      console.error('[TicketViewerPanel] Error loading ticket:', err);
      setTicketContent('티켓을 불러오는데 실패했습니다.');
    }
  }, []);

  // 통계 계산
  const stats = useMemo(() => {
    const totalTickets = epics.reduce((sum, e) => sum + e.tickets.length, 0);
    return { epicCount: epics.length, ticketCount: totalTickets };
  }, [epics]);

  // ========== Render ==========

  if (!projectPath) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>프로젝트를 선택해주세요</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-500">
        <AlertCircle className="h-5 w-5 mr-2" />
        <p>{error}</p>
      </div>
    );
  }

  if (epics.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
        <FileText className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">생성된 티켓이 없습니다</p>
        <p className="text-sm text-center">
          PM Orchestrator를 실행하여 티켓을 생성해주세요
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 - 통계 */}
      <div className="flex-shrink-0 px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <List className="h-5 w-5 text-primary" />
            <span className="font-medium">생성된 티켓</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{stats.epicCount}개 Epic</span>
            <span>{stats.ticketCount}개 티켓</span>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 - 좌우 분할 */}
      <div className="flex-1 flex min-h-0">
        {/* 좌측: Epic/티켓 리스트 */}
        <div className="w-80 flex-shrink-0 border-r overflow-y-auto">
          {epics.map((epic) => (
            <div key={epic.id} className="border-b">
              {/* Epic 헤더 */}
              <button
                onClick={() => toggleEpic(epic.id)}
                className={cn(
                  "w-full px-4 py-3 flex items-center justify-between text-left hover:bg-muted/50 transition-colors",
                  expandedEpics.has(epic.id) && "bg-muted"
                )}
              >
                <div className="flex items-center gap-2">
                  <ChevronRight className={cn(
                    "h-4 w-4 transition-transform",
                    expandedEpics.has(epic.id) && "rotate-90"
                  )} />
                  <span className="font-medium text-sm">{epic.id}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {epic.tickets.length}개
                </span>
              </button>

              {/* 티켓 목록 (확장된 Epic) */}
              {expandedEpics.has(epic.id) && (
                <div className="bg-background">
                  {epic.tickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => handleTicketSelect(epic.id, ticket.id, epic.path)}
                      className={cn(
                        "w-full px-4 py-2 pl-8 text-left text-sm hover:bg-muted/30 transition-colors border-l-2",
                        selectedTicket?.ticketId === ticket.id
                          ? "border-l-primary bg-primary/5"
                          : "border-l-transparent"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-muted-foreground">
                          {ticket.id}
                        </span>
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded",
                          getTypeColorClass(ticket.type)
                        )}>
                          {ticket.type}
                        </span>
                      </div>
                      <p className="text-sm truncate mt-0.5">{ticket.title}</p>
                      {ticket.wave && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Wave {ticket.wave}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 우측: 티켓 상세 */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {selectedTicket && ticketContent ? (
            <PlanningDocViewer
              content={ticketContent}
              filename={`${selectedTicket.ticketId}.md`}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <FileText className="h-10 w-10 mb-3 opacity-50" />
              <p>티켓을 선택하면 상세 내용이 표시됩니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketViewerPanel;
