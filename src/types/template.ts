/**
 * Template types for project workspace selection
 */

export type TemplateId = 'basic' | 'ai-agent' | 'api-server' | 'data-pipeline' | 'mobile-app';

export interface Template {
  id: TemplateId;
  name: string;
  description: string;
  icon: string;
  available: boolean;
}

export const TEMPLATES: Template[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: '웹/앱 개발을 위한 기본 템플릿 (MVP & 유지보수)',
    icon: '📦',
    available: true,
  },
  {
    id: 'ai-agent',
    name: 'AI Agent',
    description: 'AI 에이전트 개발 및 배포',
    icon: '🤖',
    available: false,
  },
  {
    id: 'api-server',
    name: 'API Server',
    description: '백엔드 API 서버 개발',
    icon: '🔌',
    available: false,
  },
  {
    id: 'data-pipeline',
    name: 'Data Pipeline',
    description: '데이터 수집 및 처리 파이프라인',
    icon: '📊',
    available: false,
  },
  {
    id: 'mobile-app',
    name: 'Mobile App',
    description: '모바일 앱 개발 (iOS/Android)',
    icon: '📱',
    available: false,
  },
];

/**
 * Get template by ID
 */
export const getTemplateById = (id: TemplateId): Template | undefined => {
  return TEMPLATES.find(t => t.id === id);
};

/**
 * Get available templates only
 */
export const getAvailableTemplates = (): Template[] => {
  return TEMPLATES.filter(t => t.available);
};
