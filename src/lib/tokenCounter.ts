/**
 * SDD Pattern: Token-Optimized Specs
 * 토큰 카운터 유틸리티 (lean-spec 스타일)
 *
 * AI 응답 품질 최적화를 위해 스펙 파일의 토큰 수를 제한합니다.
 * 목표: 각 티켓/스펙 파일을 2,000 토큰 이하로 유지
 */

// 토큰 제한 상수
export const TOKEN_LIMITS = {
  TICKET: 2000, // 개별 티켓
  EPIC: 5000, // Epic 파일 전체
  SPEC: 2000, // 일반 스펙 파일
  OPTIMAL: 1500, // 최적 토큰 수 (green zone)
  WARNING: 2000, // 경고 임계값 (yellow zone)
} as const;

export type TokenStatus = 'green' | 'yellow' | 'red';

export interface TokenAnalysis {
  count: number;
  status: TokenStatus;
  percentage: number; // 제한 대비 비율
  recommendation?: string;
}

/**
 * 텍스트의 토큰 수를 추정합니다.
 *
 * 추정 방식:
 * - 영어 단어: 평균 1.3 토큰
 * - 한글 글자: 평균 0.5 토큰 (BPE 토크나이저 특성)
 * - 코드/특수문자: 추가 가중치
 *
 * @param text 토큰 수를 계산할 텍스트
 * @returns 추정 토큰 수
 */
export function countTokens(text: string): number {
  if (!text || text.trim().length === 0) return 0;

  // 영어 단어 수
  const englishWords = text.match(/[a-zA-Z]+/g) || [];
  const englishTokens = englishWords.length * 1.3;

  // 한글 글자 수 (가-힣)
  const koreanChars = (text.match(/[\uAC00-\uD7AF]/g) || []).length;
  const koreanTokens = koreanChars * 0.5;

  // 숫자
  const numbers = (text.match(/\d+/g) || []).length;
  const numberTokens = numbers * 0.5;

  // 코드 블록 (마크다운 ```...```)
  const codeBlocks = text.match(/```[\s\S]*?```/g) || [];
  const codeTokens = codeBlocks.reduce((sum, block) => {
    // 코드는 더 많은 토큰을 사용하는 경향
    return sum + block.length * 0.3;
  }, 0);

  // 특수 문자 및 구두점
  const specialChars = (text.match(/[^\w\s\uAC00-\uD7AF]/g) || []).length;
  const specialTokens = specialChars * 0.2;

  // 총 토큰 수 (보수적으로 1.1배 적용)
  const totalTokens =
    (englishTokens + koreanTokens + numberTokens + codeTokens + specialTokens) * 1.1;

  return Math.ceil(totalTokens);
}

/**
 * 텍스트가 토큰 제한 내에 있는지 확인합니다.
 */
export function isWithinLimit(text: string, limit = TOKEN_LIMITS.TICKET): boolean {
  return countTokens(text) <= limit;
}

/**
 * 토큰 수에 따른 상태를 반환합니다.
 */
export function getTokenStatus(count: number, limit = TOKEN_LIMITS.TICKET): TokenStatus {
  const ratio = count / limit;
  if (ratio < 0.75) return 'green'; // 75% 미만: 최적
  if (ratio <= 1.0) return 'yellow'; // 75-100%: 주의
  return 'red'; // 100% 초과: 위험
}

/**
 * 텍스트에 대한 상세 토큰 분석을 수행합니다.
 */
export function analyzeTokens(text: string, limit = TOKEN_LIMITS.TICKET): TokenAnalysis {
  const count = countTokens(text);
  const status = getTokenStatus(count, limit);
  const percentage = Math.round((count / limit) * 100);

  let recommendation: string | undefined;

  if (status === 'red') {
    recommendation = `토큰 수가 제한(${limit})을 초과했습니다. 내용을 분할하거나 간소화하세요.`;
  } else if (status === 'yellow') {
    recommendation = '토큰 수가 제한에 근접합니다. 가능하면 내용을 간소화하세요.';
  }

  return {
    count,
    status,
    percentage,
    recommendation,
  };
}

/**
 * 여러 텍스트 섹션의 토큰 분석을 수행합니다.
 */
export function analyzeMultipleSections(
  sections: { name: string; content: string; limit?: number }[]
): {
  sections: (TokenAnalysis & { name: string })[];
  total: number;
  hasIssues: boolean;
} {
  const analyzed = sections.map((section) => ({
    name: section.name,
    ...analyzeTokens(section.content, section.limit),
  }));

  return {
    sections: analyzed,
    total: analyzed.reduce((sum, s) => sum + s.count, 0),
    hasIssues: analyzed.some((s) => s.status === 'red'),
  };
}

/**
 * 토큰 상태에 따른 색상 클래스를 반환합니다. (Tailwind)
 */
export function getTokenStatusColor(status: TokenStatus): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'green':
      return {
        bg: 'bg-green-100 dark:bg-green-900/20',
        text: 'text-green-700 dark:text-green-400',
        border: 'border-green-500',
      };
    case 'yellow':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/20',
        text: 'text-yellow-700 dark:text-yellow-400',
        border: 'border-yellow-500',
      };
    case 'red':
      return {
        bg: 'bg-red-100 dark:bg-red-900/20',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-500',
      };
  }
}

/**
 * 텍스트를 토큰 제한에 맞게 자동 분할합니다.
 * (티켓이 너무 클 때 서브태스크로 분할하는 데 사용)
 */
export function suggestSplit(
  text: string,
  limit = TOKEN_LIMITS.TICKET
): { shouldSplit: boolean; suggestedParts: number } {
  const count = countTokens(text);

  if (count <= limit) {
    return { shouldSplit: false, suggestedParts: 1 };
  }

  // 권장 분할 수 계산 (각 파트가 optimal 토큰 수가 되도록)
  const suggestedParts = Math.ceil(count / TOKEN_LIMITS.OPTIMAL);

  return {
    shouldSplit: true,
    suggestedParts,
  };
}

/**
 * 마크다운 텍스트를 섹션별로 분리하여 분석합니다.
 */
export function analyzeMarkdownSections(markdown: string): {
  name: string;
  tokens: number;
  status: TokenStatus;
}[] {
  // ## 또는 ### 헤더로 섹션 분리
  const sections = markdown.split(/^(#{2,3}\s+.+)$/gm);
  const results: { name: string; tokens: number; status: TokenStatus }[] = [];

  let currentSection = '';
  let currentContent = '';

  for (const part of sections) {
    if (part.match(/^#{2,3}\s+/)) {
      // 이전 섹션 저장
      if (currentSection) {
        const tokens = countTokens(currentContent);
        results.push({
          name: currentSection,
          tokens,
          status: getTokenStatus(tokens, TOKEN_LIMITS.TICKET / 2),
        });
      }
      currentSection = part.replace(/^#{2,3}\s+/, '').trim();
      currentContent = '';
    } else {
      currentContent += part;
    }
  }

  // 마지막 섹션 저장
  if (currentSection) {
    const tokens = countTokens(currentContent);
    results.push({
      name: currentSection,
      tokens,
      status: getTokenStatus(tokens, TOKEN_LIMITS.TICKET / 2),
    });
  }

  return results;
}
