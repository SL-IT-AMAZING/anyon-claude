/**
 * SDD Pattern: Auto Research Phase
 * 코드베이스에서 유사 패턴을 발견하는 유틸리티 (Shotgun/kotef 스타일)
 *
 * AI 환각을 줄이기 위해 기존 코드에서 참조 구현을 찾습니다.
 */

import { invoke } from '@tauri-apps/api/core';
import { readTextFile, readDir } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';

// 패턴 타입 정의
export type PatternType =
  | 'auth' // 인증 관련
  | 'form' // 폼 처리
  | 'api' // API 호출
  | 'component' // UI 컴포넌트
  | 'utility' // 유틸리티 함수
  | 'store' // 상태 관리
  | 'hook' // React 훅
  | 'service' // 서비스 레이어
  | 'test' // 테스트 패턴
  | 'config' // 설정 파일
  | 'unknown';

// 발견된 패턴 인터페이스
export interface DiscoveredPattern {
  filePath: string;
  relativePath: string;
  patternType: PatternType;
  relevance: number; // 0-100
  snippet: string;
  lineNumber: number;
  matchedKeywords: string[];
  description?: string;
}

// 패턴 검색 결과
export interface PatternSearchResult {
  feature: string;
  patterns: DiscoveredPattern[];
  totalFound: number;
  searchTime: number; // ms
  recommendations: string[];
}

// 패턴 타입별 키워드 매핑
const PATTERN_KEYWORDS: Record<PatternType, string[]> = {
  auth: ['login', 'logout', 'auth', 'token', 'session', 'password', 'signin', 'signup', 'credential'],
  form: ['form', 'input', 'submit', 'validate', 'field', 'register', 'useForm', 'handleSubmit'],
  api: ['fetch', 'axios', 'api', 'endpoint', 'request', 'response', 'http', 'invoke'],
  component: ['component', 'render', 'props', 'children', 'useState', 'useEffect', 'jsx', 'tsx'],
  utility: ['util', 'helper', 'format', 'parse', 'convert', 'transform', 'validate'],
  store: ['store', 'zustand', 'redux', 'state', 'action', 'reducer', 'persist', 'create'],
  hook: ['use', 'hook', 'useState', 'useEffect', 'useCallback', 'useMemo', 'useRef'],
  service: ['service', 'repository', 'provider', 'manager', 'handler', 'controller'],
  test: ['test', 'spec', 'describe', 'it', 'expect', 'mock', 'jest', 'vitest'],
  config: ['config', 'setting', 'env', 'constant', 'option', 'preference'],
  unknown: [],
};

// 파일 확장자별 중요도 가중치
const FILE_WEIGHT: Record<string, number> = {
  '.ts': 1.0,
  '.tsx': 1.0,
  '.js': 0.9,
  '.jsx': 0.9,
  '.json': 0.5,
  '.md': 0.3,
};

/**
 * 텍스트에서 패턴 타입을 추론합니다.
 */
function inferPatternType(content: string, filePath: string): PatternType {
  const lowerContent = content.toLowerCase();
  const lowerPath = filePath.toLowerCase();

  // 파일 경로로 우선 판단
  if (lowerPath.includes('/hooks/') || lowerPath.includes('use')) return 'hook';
  if (lowerPath.includes('/store') || lowerPath.includes('store')) return 'store';
  if (lowerPath.includes('/service') || lowerPath.includes('service')) return 'service';
  if (lowerPath.includes('/component') || lowerPath.endsWith('.tsx')) return 'component';
  if (lowerPath.includes('.test.') || lowerPath.includes('.spec.')) return 'test';
  if (lowerPath.includes('/api/') || lowerPath.includes('api')) return 'api';
  if (lowerPath.includes('/util') || lowerPath.includes('/lib/')) return 'utility';
  if (lowerPath.includes('config') || lowerPath.includes('constant')) return 'config';

  // 내용으로 판단
  for (const [type, keywords] of Object.entries(PATTERN_KEYWORDS)) {
    const matchCount = keywords.filter((kw) => lowerContent.includes(kw)).length;
    if (matchCount >= 2) return type as PatternType;
  }

  return 'unknown';
}

/**
 * 관련성 점수를 계산합니다.
 */
function calculateRelevance(
  content: string,
  searchKeywords: string[],
  filePath: string
): { score: number; matchedKeywords: string[] } {
  const lowerContent = content.toLowerCase();
  const matchedKeywords: string[] = [];

  let score = 0;

  // 키워드 매칭
  for (const keyword of searchKeywords) {
    if (lowerContent.includes(keyword.toLowerCase())) {
      matchedKeywords.push(keyword);
      score += 20;
    }
  }

  // 파일 확장자 가중치
  const ext = filePath.substring(filePath.lastIndexOf('.'));
  score *= FILE_WEIGHT[ext] || 0.5;

  // 최대 100으로 제한
  return {
    score: Math.min(100, Math.round(score)),
    matchedKeywords,
  };
}

/**
 * 코드 스니펫을 추출합니다 (매칭된 라인 주변 컨텍스트 포함).
 */
function extractSnippet(content: string, keyword: string, contextLines = 3): { snippet: string; lineNumber: number } {
  const lines = content.split('\n');
  const lowerKeyword = keyword.toLowerCase();

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes(lowerKeyword)) {
      const start = Math.max(0, i - contextLines);
      const end = Math.min(lines.length, i + contextLines + 1);
      return {
        snippet: lines.slice(start, end).join('\n'),
        lineNumber: i + 1,
      };
    }
  }

  // 매칭 라인 없으면 첫 10줄 반환
  return {
    snippet: lines.slice(0, 10).join('\n'),
    lineNumber: 1,
  };
}

/**
 * 디렉토리를 재귀적으로 탐색하여 파일 목록을 가져옵니다.
 */
async function getFiles(
  dirPath: string,
  extensions: string[] = ['.ts', '.tsx', '.js', '.jsx']
): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await readDir(dirPath);

    for (const entry of entries) {
      const fullPath = await join(dirPath, entry.name);

      // 제외할 디렉토리
      if (entry.isDirectory) {
        if (['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
          continue;
        }
        const subFiles = await getFiles(fullPath, extensions);
        files.push(...subFiles);
      } else {
        const ext = entry.name.substring(entry.name.lastIndexOf('.'));
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (e) {
    console.error(`디렉토리 읽기 실패: ${dirPath}`, e);
  }

  return files;
}

/**
 * 기능 설명에서 검색 키워드를 추출합니다.
 */
function extractSearchKeywords(feature: string): string[] {
  // 기본 키워드: 띄어쓰기로 분리
  const words = feature.toLowerCase().split(/\s+/);

  // 불용어 제거
  const stopWords = ['the', 'a', 'an', 'is', 'are', 'for', 'to', 'of', 'and', 'or', 'in', 'on'];
  const keywords = words.filter((w) => !stopWords.includes(w) && w.length > 2);

  // 관련 키워드 추가
  const relatedKeywords: string[] = [];
  for (const keyword of keywords) {
    // 패턴 키워드에서 관련 항목 추가
    for (const [, patterns] of Object.entries(PATTERN_KEYWORDS)) {
      if (patterns.includes(keyword)) {
        relatedKeywords.push(...patterns.slice(0, 3));
      }
    }
  }

  return [...new Set([...keywords, ...relatedKeywords])];
}

/**
 * 코드베이스에서 유사 구현 패턴을 검색합니다.
 *
 * @param feature 검색할 기능 설명 (예: "user authentication", "form validation")
 * @param codebasePath 프로젝트 루트 경로
 * @param maxResults 최대 결과 수
 * @returns 발견된 패턴 목록과 추천사항
 */
export async function findSimilarImplementations(
  feature: string,
  codebasePath: string,
  maxResults = 10
): Promise<PatternSearchResult> {
  const startTime = Date.now();
  const patterns: DiscoveredPattern[] = [];
  const keywords = extractSearchKeywords(feature);

  try {
    // src 폴더 검색
    const srcPath = await join(codebasePath, 'src');
    const files = await getFiles(srcPath);

    for (const filePath of files) {
      try {
        const content = await readTextFile(filePath);
        const { score, matchedKeywords } = calculateRelevance(content, keywords, filePath);

        if (score > 30) {
          // 최소 점수 임계값
          const patternType = inferPatternType(content, filePath);
          const { snippet, lineNumber } = extractSnippet(
            content,
            matchedKeywords[0] || keywords[0]
          );

          patterns.push({
            filePath,
            relativePath: filePath.replace(codebasePath, '').replace(/^[/\\]/, ''),
            patternType,
            relevance: score,
            snippet,
            lineNumber,
            matchedKeywords,
          });
        }
      } catch (e) {
        // 파일 읽기 실패 무시
        continue;
      }
    }

    // 관련성 순으로 정렬
    patterns.sort((a, b) => b.relevance - a.relevance);

    // 상위 결과만 반환
    const topPatterns = patterns.slice(0, maxResults);

    // 추천사항 생성
    const recommendations = generateRecommendations(topPatterns, feature);

    return {
      feature,
      patterns: topPatterns,
      totalFound: patterns.length,
      searchTime: Date.now() - startTime,
      recommendations,
    };
  } catch (e) {
    console.error('패턴 검색 실패:', e);
    return {
      feature,
      patterns: [],
      totalFound: 0,
      searchTime: Date.now() - startTime,
      recommendations: ['코드베이스 검색 중 오류가 발생했습니다.'],
    };
  }
}

/**
 * 발견된 패턴을 기반으로 추천사항을 생성합니다.
 */
function generateRecommendations(patterns: DiscoveredPattern[], feature: string): string[] {
  const recommendations: string[] = [];

  if (patterns.length === 0) {
    recommendations.push(`"${feature}" 관련 기존 구현을 찾지 못했습니다. 새로운 패턴을 정의하세요.`);
    return recommendations;
  }

  // 가장 관련성 높은 패턴 추천
  const topPattern = patterns[0];
  recommendations.push(
    `📁 ${topPattern.relativePath} 파일의 패턴을 참조하세요 (관련성: ${topPattern.relevance}%)`
  );

  // 패턴 타입별 그룹화
  const typeGroups = new Map<PatternType, number>();
  for (const p of patterns) {
    typeGroups.set(p.patternType, (typeGroups.get(p.patternType) || 0) + 1);
  }

  // 주요 패턴 타입 추천
  const dominantType = [...typeGroups.entries()].sort((a, b) => b[1] - a[1])[0];
  if (dominantType) {
    recommendations.push(`🏷️ 주요 패턴 타입: ${dominantType[0]} (${dominantType[1]}개 파일)`);
  }

  // 공통 키워드 추천
  const allKeywords = patterns.flatMap((p) => p.matchedKeywords);
  const keywordCounts = new Map<string, number>();
  for (const kw of allKeywords) {
    keywordCounts.set(kw, (keywordCounts.get(kw) || 0) + 1);
  }
  const topKeywords = [...keywordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([kw]) => kw);

  if (topKeywords.length > 0) {
    recommendations.push(`🔑 관련 키워드: ${topKeywords.join(', ')}`);
  }

  return recommendations;
}

/**
 * 특정 패턴 타입의 예제 파일을 찾습니다.
 */
export async function findPatternExamples(
  patternType: PatternType,
  codebasePath: string,
  maxResults = 5
): Promise<DiscoveredPattern[]> {
  const keywords = PATTERN_KEYWORDS[patternType];
  if (!keywords || keywords.length === 0) return [];

  const result = await findSimilarImplementations(keywords.join(' '), codebasePath, maxResults);
  return result.patterns.filter((p) => p.patternType === patternType);
}

/**
 * 티켓에 대한 참조 구현 섹션을 생성합니다.
 * (PM Orchestrator의 TICKET_GENERATOR에서 사용)
 */
export function formatReferenceSection(patterns: DiscoveredPattern[]): string {
  if (patterns.length === 0) {
    return '## Reference Implementation\n\n기존 코드베이스에서 유사한 구현을 찾지 못했습니다.\n';
  }

  let section = '## Reference Implementation\n\n';
  section += '아래 파일들의 패턴을 참조하여 일관성 있게 구현하세요:\n\n';

  for (const pattern of patterns.slice(0, 3)) {
    section += `### ${pattern.relativePath} (${pattern.patternType})\n`;
    section += `- 관련성: ${pattern.relevance}%\n`;
    section += `- 라인: ${pattern.lineNumber}\n`;
    section += `- 키워드: ${pattern.matchedKeywords.join(', ')}\n`;
    section += '```\n' + pattern.snippet.slice(0, 500) + '\n```\n\n';
  }

  return section;
}

export default findSimilarImplementations;
