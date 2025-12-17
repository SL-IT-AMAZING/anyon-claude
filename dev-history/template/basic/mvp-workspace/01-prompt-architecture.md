---
title: 프롬프트 내재화 구조
description: 슬래시 커맨드 없이 프롬프트를 코드 내부에 저장하여 워크플로우를 실행하는 아키텍처
related_code:
  - src/constants/workflows/planning/*.ts
  - src/constants/workflows/development/*.ts
  - src/constants/planning.ts
  - src/constants/development.ts
ui_location: Basic 템플릿 > MVP Workspace > 전체
last_updated: 2024-12-17
keywords:
  - 프롬프트
  - 워크플로우
  - 내재화
  - 슬래시커맨드
---

# 프롬프트 내재화 구조

## 개요

MVP Workspace의 워크플로우는 **프롬프트를 코드 내부에 문자열로 저장**하여, 외부 슬래시 커맨드 시스템 없이도 동일한 AI 대화 흐름을 실행할 수 있도록 설계되어 있습니다.

### 이 구조가 필요한 이유

| 기존 방식 (슬래시 커맨드) | 내재화 방식 (현재) |
|-------------------------|-------------------|
| 외부 플러그인 시스템에 의존 | 앱 단독으로 실행 가능 |
| 사용자가 명령어를 알아야 함 | 버튼 클릭만으로 실행 |
| 프롬프트 수정이 어려움 | `.ts` 파일 수정으로 간편 |
| 버전 관리 불가능 | Git으로 변경 이력 추적 |

---

## 핵심 원리

### 기존 방식 vs 내재화 방식

```
[기존 방식]
사용자 → "/anyon:workflows:startup-prd" 타이핑 → Claude 실행

[내재화 방식]
사용자 → "시작하기" 버튼 클릭 → 코드에서 프롬프트 문자열 로드 → Claude 실행
```

**핵심 아이디어**: 슬래시 커맨드가 실행하는 프롬프트 내용을 `.ts` 파일에 문자열로 저장해두고, 버튼 클릭 시 그 문자열을 Claude에게 직접 전달합니다.

---

## 파일 구조

```
src/constants/
├── planning.ts                        # 기획 워크플로우 순서 정의
├── development.ts                     # 개발 워크플로우 순서 정의
└── workflows/
    ├── index.ts                       # 전체 export
    ├── engine.ts                      # 워크플로우 엔진 공통 로직
    │
    ├── planning/                      # 기획문서 프롬프트들
    │   ├── index.ts                   # planning 폴더 export
    │   ├── startup-prd.ts             # PRD 프롬프트 (~500줄)
    │   ├── startup-ux.ts              # UX Design 프롬프트
    │   ├── startup-ui.ts              # Design Guide 프롬프트
    │   ├── startup-trd.ts             # TRD 프롬프트
    │   ├── startup-architecture.ts    # Architecture 프롬프트
    │   └── startup-erd.ts             # ERD 프롬프트
    │
    └── development/                   # 개발문서 프롬프트들
        ├── index.ts                   # development 폴더 export
        ├── pm-opensource.ts           # 오픈소스 클론 프롬프트
        ├── pm-orchestrator.ts         # 오케스트레이터 프롬프트
        ├── pm-executor.ts             # 실행자 프롬프트
        └── pm-reviewer.ts             # 리뷰어 프롬프트
```

---

## 데이터 흐름 상세

### 전체 흐름도

```
┌─────────────────────────────────────────────────────────────────┐
│                        사용자 버튼 클릭                           │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│  PlanningDocsPanel.tsx                                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ handleStartWorkflow(step) {                               │  │
│  │   const prompt = getWorkflowPrompt(step);                 │  │
│  │   onStartNewWorkflow(prompt);  // 부모에게 전달            │  │
│  │ }                                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│  planning.ts - getWorkflowPrompt()                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ // step.prompt가 있으면 내재화된 프롬프트 사용               │  │
│  │ // 없으면 슬래시 커맨드(step.workflow) 사용 (폴백)          │  │
│  │ return step.prompt ?? step.workflow;                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│  MvpWorkspace.tsx                                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ handleStartNewWorkflow(prompt) {                          │  │
│  │   claudeSessionRef.current.startNewSession(prompt);       │  │
│  │ }                                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│  ClaudeCodeSession.tsx                                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ // 프롬프트를 Claude API에 전송                            │  │
│  │ // Claude가 프롬프트 내용대로 대화 시작                     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 코드 구조 상세

### 1단계: 프롬프트 문자열 정의

각 워크플로우의 프롬프트는 개별 `.ts` 파일에 문자열 상수로 저장됩니다.

**파일**: `src/constants/workflows/planning/startup-prd.ts`

```typescript
// 백틱(`)으로 감싼 템플릿 리터럴 = 여러 줄 문자열
export const STARTUP_PRD_PROMPT = `
# Founder PRD - 비개발자 창업자를 위한 PRD 작성 워크플로우

## 실행 환경 설정
- **언어**: 한국어
- **출력 파일**: anyon-docs/planning/prd.md
- **필수 도구**: WebSearch (경쟁사 분석 시 사용)

## 실행 규칙
1. 각 Step을 순서대로 실행
2. <template-output> 태그를 만나면 해당 섹션을 prd.md에 저장
...
(수백 줄의 프롬프트 내용)
...
`;
```

**왜 이렇게 하는가?**
- 마크다운 형식의 프롬프트를 그대로 저장 가능
- 줄바꿈, 들여쓰기 모두 보존됨
- IDE에서 하이라이팅 지원

### 2단계: 프롬프트 export

**파일**: `src/constants/workflows/planning/index.ts`

```typescript
// 모든 기획 프롬프트를 한 곳에서 export
export { STARTUP_PRD_PROMPT } from './startup-prd';
export { STARTUP_UX_PROMPT } from './startup-ux';
export { STARTUP_UI_PROMPT } from './startup-ui';
export { STARTUP_TRD_PROMPT } from './startup-trd';
export { STARTUP_ARCHITECTURE_PROMPT } from './startup-architecture';
export { STARTUP_ERD_PROMPT } from './startup-erd';
```

### 3단계: 워크플로우 순서에 프롬프트 연결

**파일**: `src/constants/planning.ts`

```typescript
import { STARTUP_PRD_PROMPT, STARTUP_UX_PROMPT, ... } from './workflows/planning';

export interface WorkflowStep {
  id: string;              // 고유 식별자
  title: string;           // UI에 표시될 제목
  filename: string;        // 생성될 파일명
  workflow: string;        // 슬래시 커맨드 (폴백용, deprecated)
  prompt?: string;         // ← 내재화된 프롬프트 (이것을 사용!)
  displayText: string;     // 버튼/알림에 표시될 텍스트
  icon: WorkflowIconType;  // 아이콘 타입
  nextId: string | null;   // 다음 단계 ID (null이면 마지막)
}

export const WORKFLOW_SEQUENCE: WorkflowStep[] = [
  {
    id: 'prd',
    title: 'PRD',
    filename: 'prd.md',
    workflow: '/anyon:anyon-method:workflows:startup-prd',  // 폴백
    prompt: STARTUP_PRD_PROMPT,                              // ← 실제 사용
    displayText: 'PRD 문서 작성 시작',
    icon: 'file-text',
    nextId: 'ux-design',
  },
  // ... 나머지 5개 단계
];
```

### 4단계: 프롬프트 선택 로직

**파일**: `src/constants/planning.ts`

```typescript
/**
 * 워크플로우 실행에 사용할 프롬프트 반환
 *
 * 동작 로직:
 * 1. step.prompt가 있으면 → 내재화된 프롬프트 반환
 * 2. step.prompt가 없으면 → step.workflow (슬래시 커맨드) 반환
 *
 * 이 폴백 로직 덕분에 점진적 마이그레이션이 가능합니다.
 */
export const getWorkflowPrompt = (step: WorkflowStep): string => {
  return step.prompt ?? step.workflow;
};
```

### 5단계: UI에서 프롬프트 실행

**파일**: `src/components/planning/PlanningDocsPanel.tsx`

```typescript
import { getWorkflowPrompt, WORKFLOW_SEQUENCE } from '@/constants/planning';

// "시작하기" 버튼 클릭 핸들러
const handleStartWorkflow = useCallback((step: WorkflowStep) => {
  // 1. 현재 진행 중 표시 (UI 피드백)
  setActiveWorkflows(prev => new Set(prev).add(step.id));

  // 2. 프롬프트 가져오기 (내재화 or 슬래시커맨드)
  const workflowPrompt = getWorkflowPrompt(step);

  // 3. 부모 컴포넌트(MvpWorkspace)에게 전달
  onStartNewWorkflow(workflowPrompt);

  // 4. 해당 탭으로 이동
  setActiveDocId(step.id);
}, [onStartNewWorkflow]);
```

### 6단계: Claude 세션에 전달

**파일**: `src/components/MvpWorkspace.tsx`

```typescript
// Claude 세션 참조
const claudeSessionRef = useRef<ClaudeCodeSessionRef>(null);

// 프롬프트를 받아서 Claude 세션 시작
const handleStartNewWorkflow = useCallback((workflowPrompt: string) => {
  if (claudeSessionRef.current) {
    // Claude 세션에 프롬프트 전달
    // → 새 대화가 시작되고, Claude가 프롬프트 지시대로 동작
    claudeSessionRef.current.startNewSession(workflowPrompt);
  }
}, []);

// JSX에서 콜백 연결
<PlanningDocsPanel
  projectPath={project?.path}
  onStartNewWorkflow={handleStartNewWorkflow}
/>
```

---

## 새 워크플로우 추가 방법

### Step 1: 프롬프트 파일 생성

```typescript
// src/constants/workflows/planning/new-workflow.ts
export const NEW_WORKFLOW_PROMPT = `
# 새 워크플로우 제목

## 실행 환경
- 언어: 한국어
- 출력 파일: anyon-docs/planning/new-file.md

## 실행 단계
### Step 1: 정보 수집
...
`;
```

### Step 2: index.ts에 export 추가

```typescript
// src/constants/workflows/planning/index.ts
export { NEW_WORKFLOW_PROMPT } from './new-workflow';
```

### Step 3: WORKFLOW_SEQUENCE에 단계 추가

```typescript
// src/constants/planning.ts
import { ..., NEW_WORKFLOW_PROMPT } from './workflows/planning';

export const WORKFLOW_SEQUENCE: WorkflowStep[] = [
  // 기존 단계들...
  {
    id: 'new-workflow',
    title: 'New Workflow',
    filename: 'new-file.md',
    workflow: '/fallback/slash/command',  // 폴백용
    prompt: NEW_WORKFLOW_PROMPT,           // 실제 사용
    displayText: '새 워크플로우 시작',
    icon: 'file-text',
    nextId: null,  // 마지막 단계면 null
  },
];
```

---

## 장점과 트레이드오프

### 장점

| 장점 | 설명 |
|------|------|
| **독립성** | 외부 플러그인/슬래시커맨드 시스템 없이 앱 단독 실행 |
| **버전 관리** | 프롬프트가 Git으로 관리되어 변경 이력 추적 가능 |
| **커스터마이징** | `.ts` 파일 수정만으로 프롬프트 변경 가능 |
| **폴백 지원** | `prompt` 없으면 자동으로 슬래시 커맨드 사용 |
| **타입 안전성** | TypeScript로 프롬프트 참조 오류 컴파일 타임에 발견 |

### 트레이드오프

| 트레이드오프 | 설명 |
|-------------|------|
| **번들 크기** | 프롬프트가 JS 번들에 포함되어 앱 크기 증가 |
| **핫 리로드** | 프롬프트 수정 시 앱 재빌드 필요 |
| **중복** | 동일 프롬프트를 여러 앱에서 쓰면 중복 관리 필요 |

---

## AI를 위한 요약

**프롬프트 내재화 핵심**:
1. 프롬프트는 `src/constants/workflows/` 폴더의 `.ts` 파일에 문자열로 저장
2. `WORKFLOW_SEQUENCE` 배열의 `prompt` 필드에 연결
3. `getWorkflowPrompt()` 함수가 `prompt` 있으면 반환, 없으면 `workflow`(슬래시커맨드) 반환
4. 버튼 클릭 → `getWorkflowPrompt()` → `startNewSession()` → Claude 실행

**프롬프트 수정 시**:
- 해당 `src/constants/workflows/planning/startup-*.ts` 파일 수정
- 앱 재빌드 필요

**새 워크플로우 추가 시**:
1. `workflows/planning/` 또는 `workflows/development/`에 새 파일 생성
2. `index.ts`에 export 추가
3. `planning.ts` 또는 `development.ts`의 SEQUENCE 배열에 추가
