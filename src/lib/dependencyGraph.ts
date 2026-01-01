/**
 * SDD Pattern: Parallel Execution Enhancement
 * 의존성 그래프 기반 병렬 실행 그룹 생성 유틸리티 (Spec Kitty 스타일)
 *
 * 티켓 간 의존성을 분석하여 최대 병렬 실행을 가능하게 합니다.
 */

// 티켓 정보 인터페이스
export interface TicketNode {
  id: string;
  title: string;
  epicId?: string;
  wave?: string;
  blockedBy: string[]; // 의존하는 티켓 ID 목록
  outputs: string[]; // 생성/수정하는 파일 목록
  type?: 'feature' | 'bugfix' | 'refactor' | 'test' | 'docs';
  difficulty?: 'easy' | 'medium' | 'hard';
  estimatedMinutes?: number;
}

// 병렬 실행 그룹
export interface ParallelGroup {
  groupId: string;
  tickets: string[];
  level: number; // DAG 레벨 (0부터 시작, 낮을수록 먼저 실행)
  canRunWith: string[]; // 동시 실행 가능한 다른 그룹 ID
  totalEstimatedMinutes?: number;
}

// 실행 계획
export interface ExecutionPlan {
  groups: ParallelGroup[];
  totalLevels: number;
  maxParallelism: number;
  criticalPath: string[]; // 가장 긴 경로의 티켓 ID들
  estimatedTotalMinutes?: number;
}

// 그래프 노드 (내부용)
interface GraphNode {
  ticket: TicketNode;
  inDegree: number; // 들어오는 엣지 수
  outDegree: number; // 나가는 엣지 수
  level: number; // 토폴로지 레벨
  visited: boolean;
}

/**
 * 출력 파일 충돌을 감지합니다.
 */
function detectOutputConflicts(tickets: TicketNode[]): Map<string, string[]> {
  const fileToTickets = new Map<string, string[]>();

  for (const ticket of tickets) {
    for (const output of ticket.outputs) {
      const existing = fileToTickets.get(output) || [];
      existing.push(ticket.id);
      fileToTickets.set(output, existing);
    }
  }

  // 충돌하는 파일만 필터링
  const conflicts = new Map<string, string[]>();
  for (const [file, ticketIds] of fileToTickets) {
    if (ticketIds.length > 1) {
      conflicts.set(file, ticketIds);
    }
  }

  return conflicts;
}

/**
 * 두 티켓이 동시 실행 가능한지 확인합니다.
 */
function canRunInParallel(ticket1: TicketNode, ticket2: TicketNode): boolean {
  // 의존성 체크
  if (ticket1.blockedBy.includes(ticket2.id) || ticket2.blockedBy.includes(ticket1.id)) {
    return false;
  }

  // 출력 파일 충돌 체크
  const outputs1 = new Set(ticket1.outputs);
  for (const output of ticket2.outputs) {
    if (outputs1.has(output)) {
      return false;
    }
  }

  return true;
}

/**
 * 토폴로지 정렬을 수행합니다 (Kahn's Algorithm).
 */
function topologicalSort(nodes: Map<string, GraphNode>): string[][] {
  const levels: string[][] = [];
  const queue: string[] = [];

  // 초기 큐: inDegree가 0인 노드들
  for (const [id, node] of nodes) {
    if (node.inDegree === 0) {
      queue.push(id);
      node.level = 0;
    }
  }

  let currentLevel = 0;
  let currentLevelNodes: string[] = [...queue];

  while (queue.length > 0) {
    const nextLevelNodes: string[] = [];

    // 현재 레벨 처리
    while (currentLevelNodes.length > 0) {
      const ticketId = currentLevelNodes.shift()!;
      queue.shift();

      const node = nodes.get(ticketId)!;
      node.visited = true;

      // 현재 레벨에 추가
      if (!levels[currentLevel]) {
        levels[currentLevel] = [];
      }
      levels[currentLevel].push(ticketId);

      // 다음 노드들의 inDegree 감소
      for (const [otherId, otherNode] of nodes) {
        if (otherNode.ticket.blockedBy.includes(ticketId)) {
          otherNode.inDegree--;
          if (otherNode.inDegree === 0 && !otherNode.visited) {
            nextLevelNodes.push(otherId);
            queue.push(otherId);
            otherNode.level = currentLevel + 1;
          }
        }
      }
    }

    currentLevel++;
    currentLevelNodes = nextLevelNodes;
  }

  return levels;
}

/**
 * 순환 의존성을 감지합니다.
 */
function detectCycles(tickets: TicketNode[]): string[][] {
  const cycles: string[][] = [];
  const ticketMap = new Map(tickets.map((t) => [t.id, t]));
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(ticketId: string, path: string[]): boolean {
    visited.add(ticketId);
    recursionStack.add(ticketId);

    const ticket = ticketMap.get(ticketId);
    if (!ticket) return false;

    for (const depId of ticket.blockedBy) {
      if (!visited.has(depId)) {
        if (dfs(depId, [...path, ticketId])) {
          return true;
        }
      } else if (recursionStack.has(depId)) {
        // 순환 발견
        const cycleStart = path.indexOf(depId);
        if (cycleStart !== -1) {
          cycles.push([...path.slice(cycleStart), ticketId]);
        } else {
          cycles.push([depId, ticketId]);
        }
        return true;
      }
    }

    recursionStack.delete(ticketId);
    return false;
  }

  for (const ticket of tickets) {
    if (!visited.has(ticket.id)) {
      dfs(ticket.id, []);
    }
  }

  return cycles;
}

/**
 * 크리티컬 패스를 계산합니다.
 */
function calculateCriticalPath(
  tickets: TicketNode[],
  levels: string[][]
): { path: string[]; totalMinutes: number } {
  // ticketMap available for future optimization
  // new Map(tickets.map((t) => [t.id, t]))
  const distances = new Map<string, number>();
  const predecessors = new Map<string, string>();

  // 모든 티켓의 거리 초기화
  for (const ticket of tickets) {
    distances.set(ticket.id, ticket.estimatedMinutes || 30);
  }

  // 각 레벨을 순회하며 최장 경로 계산
  for (const level of levels) {
    for (const ticketId of level) {
      // ticketMap.get(ticketId) available for future use
      const currentDist = distances.get(ticketId)!;

      // 이 티켓에 의존하는 티켓들 업데이트
      for (const otherTicket of tickets) {
        if (otherTicket.blockedBy.includes(ticketId)) {
          const newDist = currentDist + (otherTicket.estimatedMinutes || 30);
          if (newDist > (distances.get(otherTicket.id) || 0)) {
            distances.set(otherTicket.id, newDist);
            predecessors.set(otherTicket.id, ticketId);
          }
        }
      }
    }
  }

  // 가장 긴 거리를 가진 티켓 찾기
  let maxDist = 0;
  let endTicket = '';
  for (const [id, dist] of distances) {
    if (dist > maxDist) {
      maxDist = dist;
      endTicket = id;
    }
  }

  // 크리티컬 패스 역추적
  const path: string[] = [];
  let current = endTicket;
  while (current) {
    path.unshift(current);
    current = predecessors.get(current) || '';
  }

  return { path, totalMinutes: maxDist };
}

/**
 * 티켓 목록에서 병렬 실행 그룹을 생성합니다.
 *
 * @param tickets 티켓 목록
 * @returns 실행 계획 (병렬 그룹, 크리티컬 패스 등)
 */
export function getParallelGroups(tickets: TicketNode[]): ExecutionPlan {
  if (tickets.length === 0) {
    return {
      groups: [],
      totalLevels: 0,
      maxParallelism: 0,
      criticalPath: [],
    };
  }

  // 1. 순환 의존성 체크
  const cycles = detectCycles(tickets);
  if (cycles.length > 0) {
    console.error('순환 의존성 발견:', cycles);
    // 순환 있으면 단순 순차 실행
    return {
      groups: tickets.map((t, i) => ({
        groupId: `G${i + 1}`,
        tickets: [t.id],
        level: i,
        canRunWith: [],
      })),
      totalLevels: tickets.length,
      maxParallelism: 1,
      criticalPath: tickets.map((t) => t.id),
    };
  }

  // 2. 그래프 노드 생성
  const nodes = new Map<string, GraphNode>();
  for (const ticket of tickets) {
    nodes.set(ticket.id, {
      ticket,
      inDegree: ticket.blockedBy.length,
      outDegree: 0,
      level: -1,
      visited: false,
    });
  }

  // outDegree 계산
  for (const ticket of tickets) {
    for (const depId of ticket.blockedBy) {
      const depNode = nodes.get(depId);
      if (depNode) {
        depNode.outDegree++;
      }
    }
  }

  // 3. 토폴로지 정렬
  const levels = topologicalSort(nodes);

  // 4. 출력 충돌 감지 (향후 충돌 보고에 사용)
  detectOutputConflicts(tickets);

  // 5. 병렬 그룹 생성
  const groups: ParallelGroup[] = [];
  let groupId = 1;

  for (let level = 0; level < levels.length; level++) {
    const levelTickets = levels[level];
    // levelTicketNodes available for future reporting
    // levelTickets.map((id) => nodes.get(id)!.ticket)

    // 같은 레벨 내에서 충돌 없는 그룹 생성
    const usedTickets = new Set<string>();

    while (usedTickets.size < levelTickets.length) {
      const group: string[] = [];

      for (const ticketId of levelTickets) {
        if (usedTickets.has(ticketId)) continue;

        const ticket = nodes.get(ticketId)!.ticket;

        // 현재 그룹의 모든 티켓과 병렬 실행 가능한지 확인
        const canAdd = group.every((existingId) => {
          const existing = nodes.get(existingId)!.ticket;
          return canRunInParallel(ticket, existing);
        });

        if (canAdd) {
          group.push(ticketId);
          usedTickets.add(ticketId);
        }
      }

      if (group.length > 0) {
        groups.push({
          groupId: `G${groupId++}`,
          tickets: group,
          level,
          canRunWith: [], // 아래에서 계산
          totalEstimatedMinutes: Math.max(...group.map((id) => nodes.get(id)!.ticket.estimatedMinutes || 30)),
        });
      }
    }
  }

  // 6. canRunWith 계산 (같은 레벨의 다른 그룹)
  for (const group of groups) {
    group.canRunWith = groups
      .filter((g) => g.level === group.level && g.groupId !== group.groupId)
      .map((g) => g.groupId);
  }

  // 7. 크리티컬 패스 계산
  const { path: criticalPath, totalMinutes } = calculateCriticalPath(tickets, levels);

  // 8. 최대 병렬성 계산
  const maxParallelism = Math.max(...levels.map((l) => l.length), 1);

  return {
    groups,
    totalLevels: levels.length,
    maxParallelism,
    criticalPath,
    estimatedTotalMinutes: totalMinutes,
  };
}

/**
 * 실행 계획을 마크다운 형식으로 포맷팅합니다.
 */
export function formatExecutionPlan(plan: ExecutionPlan): string {
  let md = '## Parallel Execution Plan\n\n';

  md += `- **총 레벨**: ${plan.totalLevels}\n`;
  md += `- **최대 병렬성**: ${plan.maxParallelism}x\n`;
  if (plan.estimatedTotalMinutes) {
    md += `- **예상 총 시간**: ${plan.estimatedTotalMinutes}분\n`;
  }
  md += '\n';

  md += '### Execution Groups\n\n';
  for (const group of plan.groups) {
    md += `#### ${group.groupId} (Level ${group.level})\n`;
    md += `- 티켓: ${group.tickets.join(', ')}\n`;
    if (group.canRunWith.length > 0) {
      md += `- 동시 실행 가능: ${group.canRunWith.join(', ')}\n`;
    }
    if (group.totalEstimatedMinutes) {
      md += `- 예상 시간: ${group.totalEstimatedMinutes}분\n`;
    }
    md += '\n';
  }

  md += '### Critical Path\n\n';
  md += plan.criticalPath.join(' → ') + '\n';

  return md;
}

/**
 * 마크다운 Epic 파일에서 티켓 정보를 파싱합니다.
 */
export function parseTicketsFromMarkdown(markdown: string): TicketNode[] {
  const tickets: TicketNode[] = [];

  // ## TICKET-XXX 패턴 찾기
  const ticketRegex = /^##\s+(TICKET-\d+):\s*(.+)$/gm;
  let match;

  while ((match = ticketRegex.exec(markdown)) !== null) {
    const id = match[1];
    const title = match[2];

    // 티켓 섹션 내용 추출
    const startIdx = match.index;
    const nextTicketMatch = /^##\s+TICKET-\d+/gm;
    nextTicketMatch.lastIndex = startIdx + match[0].length;
    const nextMatch = nextTicketMatch.exec(markdown);
    const endIdx = nextMatch ? nextMatch.index : markdown.length;
    const sectionContent = markdown.slice(startIdx, endIdx);

    // blocked_by 추출
    const blockedByMatch = sectionContent.match(/blocked_by:\s*\[([^\]]*)\]/);
    const blockedBy = blockedByMatch
      ? blockedByMatch[1]
          .split(',')
          .map((s) => s.trim().replace(/['"]/g, ''))
          .filter(Boolean)
      : [];

    // outputs 추출
    const outputsMatch = sectionContent.match(/outputs:\s*\[([^\]]*)\]/);
    const outputs = outputsMatch
      ? outputsMatch[1]
          .split(',')
          .map((s) => s.trim().replace(/['"]/g, ''))
          .filter(Boolean)
      : [];

    // difficulty 추출
    const difficultyMatch = sectionContent.match(/difficulty:\s*(easy|medium|hard)/i);
    const difficulty = difficultyMatch
      ? (difficultyMatch[1].toLowerCase() as 'easy' | 'medium' | 'hard')
      : 'medium';

    // type 추출
    const typeMatch = sectionContent.match(/type:\s*(feature|bugfix|refactor|test|docs)/i);
    const type = typeMatch ? (typeMatch[1].toLowerCase() as TicketNode['type']) : 'feature';

    tickets.push({
      id,
      title,
      blockedBy,
      outputs,
      difficulty,
      type,
      estimatedMinutes: difficulty === 'hard' ? 60 : difficulty === 'medium' ? 30 : 15,
    });
  }

  return tickets;
}

export default getParallelGroups;
