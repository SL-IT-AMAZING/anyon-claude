---
title: MVP Workspace 전체 구조
description: 비개발자 창업자가 아이디어를 소프트웨어로 만드는 전체 워크스페이스 구조
related_code:
  - src/components/MvpWorkspace.tsx
  - src/constants/planning.ts
  - src/constants/development.ts
ui_location: Basic 템플릿 > MVP Workspace
last_updated: 2024-12-17
---

# MVP Workspace 전체 구조

## 개요

MVP Workspace는 **비개발자 창업자**가 아이디어만 가지고 실제 소프트웨어를 만들 수 있도록 돕는 워크스페이스입니다.

### 핵심 철학

1. **순차적 진행**: 사용자가 길을 잃지 않도록 단계별로 안내
2. **AI 주도 작성**: 사용자는 질문에 답변만 하면, AI가 문서와 코드를 작성
3. **자동 연결**: 이전 단계의 결과물이 다음 단계의 입력으로 자동 연결

---

## 화면 구성

MVP Workspace는 3개의 탭으로 구성됩니다.

```
┌─────────────────────────────────────────────────────────────────┐
│  [기획문서]      [개발문서]      [프리뷰]                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────┐  ┌─────────────────────────────────────┐ │
│   │                 │  │                                     │ │
│   │   Claude Chat   │  │         탭별 콘텐츠 영역              │ │
│   │                 │  │                                     │ │
│   │                 │  │                                     │ │
│   └─────────────────┘  └─────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| 탭 | 목적 | 결과물 |
|----|------|--------|
| 기획문서 | 아이디어 → 문서화 | 6개의 기획 문서 |
| 개발문서 | 문서 → 코드 | 실제 소프트웨어 코드 |
| 프리뷰 | 개발 결과 확인 | 웹 프리뷰 화면 |

---

## 전체 워크플로우 흐름

### Phase 1: 기획문서 (Planning)

사용자의 아이디어를 6개의 문서로 구체화합니다.

```
[사용자 아이디어]
       ↓
   ┌───────────────────────────────────────────────────────┐
   │                    기획문서 6단계                       │
   │                                                       │
   │  PRD → UX Design → Design Guide → TRD → Arch → ERD   │
   │   ↓        ↓           ↓          ↓      ↓      ↓    │
   │ prd.md  ui-ux.html  design-   trd.md arch.md erd.md  │
   │                     guide.md                          │
   └───────────────────────────────────────────────────────┘
       ↓
[기획 완료 - 6개 문서]
```

**순서가 중요한 이유**: 각 단계는 이전 문서를 참조합니다.
- UX Design은 PRD를 보고 작성
- TRD는 PRD, UX Design, Design Guide를 모두 참조
- Architecture는 모든 이전 문서를 참조

### Phase 2: 개발문서 (Development)

기획 문서를 바탕으로 실제 코드를 생성합니다.

```
[기획 문서 6개]
       ↓
   ┌───────────────────────────────────────────────────────┐
   │                   개발문서 4단계                        │
   │                                                       │
   │  PM Opensource → PM Orchestrator → PM Executor        │
   │       ↓               ↓                ↓              │
   │  오픈소스 클론     실행계획 생성      코드 구현           │
   │                                        ↑              │
   │                                        ↓              │
   │                                  PM Reviewer          │
   │                                   코드 리뷰            │
   │                                                       │
   │              (Executor ↔ Reviewer 반복)               │
   └───────────────────────────────────────────────────────┘
       ↓
[개발 완료 - DEVELOPMENT_COMPLETE.md 생성]
```

### Phase 3: 프리뷰 (Preview)

개발된 결과물을 실시간으로 확인합니다.

---

## 핵심 데이터 구조

### 기획문서 워크플로우 정의

**파일**: `src/constants/planning.ts`

```typescript
// 워크플로우 단계 정의
interface WorkflowStep {
  id: string;           // 'prd', 'ux-design', ...
  title: string;        // 'PRD', 'UX Design', ...
  filename: string;     // 'prd.md', 'ui-ux.html', ...
  prompt?: string;      // 내재화된 프롬프트 (수천 줄)
  nextId: string | null; // 다음 단계 ID
}

// 6단계 순서 배열
const WORKFLOW_SEQUENCE: WorkflowStep[] = [
  { id: 'prd', filename: 'prd.md', nextId: 'ux-design', ... },
  { id: 'ux-design', filename: 'ui-ux.html', nextId: 'design-guide', ... },
  { id: 'design-guide', filename: 'design-guide.md', nextId: 'trd', ... },
  { id: 'trd', filename: 'trd.md', nextId: 'architecture', ... },
  { id: 'architecture', filename: 'architecture.md', nextId: 'erd', ... },
  { id: 'erd', filename: 'erd.md', nextId: null, ... },
];
```

### 개발문서 워크플로우 정의

**파일**: `src/constants/development.ts`

```typescript
// 개발 워크플로우 단계 정의
interface DevWorkflowStep {
  id: string;              // 'pm-opensource', 'pm-orchestrator', ...
  title: string;           // 'Opensource Clone', ...
  internalPrompt?: string; // 내재화된 프롬프트
}

// 4단계 순서 배열
const DEV_WORKFLOW_SEQUENCE: DevWorkflowStep[] = [
  { id: 'pm-opensource', ... },
  { id: 'pm-orchestrator', ... },
  { id: 'pm-executor', ... },
  { id: 'pm-reviewer', ... },
];
```

---

## 문서 저장 위치

모든 기획 문서는 사용자 프로젝트 폴더 내에 저장됩니다:

```
[사용자 프로젝트 폴더]/
└── anyon-docs/
    └── planning/
        ├── prd.md
        ├── ui-ux.html
        ├── design-guide.md
        ├── trd.md
        ├── architecture.md
        └── erd.md
```

**상수 정의**: `ANYON_DOCS_DIR = 'anyon-docs/planning'`

---

## 탭 전환 로직

### 기획문서 탭 잠금 해제 규칙

사용자가 순서를 건너뛰지 못하도록 탭을 잠급니다.

```typescript
// PlanningDocsPanel.tsx 내 isTabEnabled 함수
const isTabEnabled = (index: number): boolean => {
  // 첫 번째 탭(PRD)은 항상 활성화
  if (index === 0) return true;

  // 이전 단계의 문서가 존재해야 현재 탭 활성화
  const prevStep = WORKFLOW_SEQUENCE[index - 1];
  return documents.some(d => d.id === prevStep.id && d.exists);
};
```

**동작 예시**:
- PRD.md가 없으면 → UX Design 탭 잠김 (클릭 불가)
- PRD.md 존재 → UX Design 탭 활성화
- UX Design까지 완료 → Design Guide 탭 활성화

### 개발문서 탭 자동 순환

개발문서 탭은 완료될 때까지 자동으로 다음 단계로 진행합니다.

```
pm-opensource 완료 → pm-orchestrator 자동 시작
pm-orchestrator 완료 → pm-executor 자동 시작
pm-executor 완료 → pm-reviewer 자동 시작
pm-reviewer 완료 → (이슈 있으면) pm-executor 재시작
                    (이슈 없으면) 개발 완료
```

**완료 조건**: `DEVELOPMENT_COMPLETE.md` 파일이 생성되면 개발 종료

---

## 관련 컴포넌트

| 컴포넌트 | 파일 경로 | 역할 |
|---------|----------|------|
| MvpWorkspace | `src/components/MvpWorkspace.tsx` | 전체 레이아웃, 탭 관리 |
| PlanningDocsPanel | `src/components/planning/PlanningDocsPanel.tsx` | 기획문서 탭 UI |
| DevDocsPanel | `src/components/development/DevDocsPanel.tsx` | 개발문서 탭 UI |
| EnhancedPreviewPanel | `src/components/preview/EnhancedPreviewPanel.tsx` | 프리뷰 탭 UI |
| ClaudeCodeSession | `src/components/ClaudeCodeSession.tsx` | AI 채팅 세션 |

---

## 관련 문서

- [01-prompt-architecture.md](./01-prompt-architecture.md) - 프롬프트 내재화 구조
- [planning/01-prd-workflow.md](./planning/01-prd-workflow.md) - PRD 워크플로우 상세
- [planning/02-ux-design-workflow.md](./planning/02-ux-design-workflow.md) - UX Design 워크플로우 상세
- [planning/03-design-guide-workflow.md](./planning/03-design-guide-workflow.md) - Design Guide 워크플로우 상세
- [planning/04-trd-workflow.md](./planning/04-trd-workflow.md) - TRD 워크플로우 상세
- [planning/05-architecture-workflow.md](./planning/05-architecture-workflow.md) - Architecture 워크플로우 상세
- [planning/06-erd-workflow.md](./planning/06-erd-workflow.md) - ERD 워크플로우 상세
- [development/00-development-workflow.md](./development/00-development-workflow.md) - 개발 워크플로우 상세

---

## AI를 위한 요약

**MVP Workspace 동작 원리**:
1. 사용자가 "시작하기" 버튼 클릭
2. 해당 단계의 프롬프트(`prompt` 필드)가 Claude에게 전달됨
3. Claude가 프롬프트 지시에 따라 사용자와 대화하며 문서 작성
4. 문서가 `anyon-docs/planning/` 폴더에 저장됨
5. 다음 단계 탭이 자동으로 활성화됨
6. 6단계 완료 후 개발문서 탭에서 코드 생성 가능

**수정이 필요할 때 확인할 파일**:
- 워크플로우 순서 변경: `src/constants/planning.ts`, `src/constants/development.ts`
- UI 레이아웃 변경: `src/components/MvpWorkspace.tsx`
- 프롬프트 내용 변경: `src/constants/workflows/planning/*.ts`
