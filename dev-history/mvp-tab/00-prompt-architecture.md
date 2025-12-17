# MVP 탭 프롬프트 내재화 구조

## 개요

MVP 탭의 워크플로우는 **프롬프트를 코드 내부에 문자열로 저장**하여, 슬래시 커맨드 없이도 동일한 AI 대화 흐름을 실행할 수 있도록 설계되어 있습니다.

---

## 핵심 원리: 프롬프트 = 문자열 상수

### 기존 방식 (슬래시 커맨드)
```
사용자 → "/anyon:workflows:startup-prd" 입력 → Claude가 해당 워크플로우 실행
```

### 내재화 방식 (현재)
```
사용자 → "시작하기" 버튼 클릭 → 코드가 저장된 프롬프트 문자열을 Claude에게 전달 → 동일한 워크플로우 실행
```

**핵심**: 슬래시 커맨드의 내용(프롬프트)을 `.ts` 파일에 문자열로 저장해두고, 버튼 클릭 시 그 문자열을 Claude에게 직접 전달합니다.

---

## 파일 구조

```
src/constants/
├── planning.ts                    # 워크플로우 순서 정의 + 프롬프트 연결
├── development.ts                 # 개발 워크플로우 순서 정의
└── workflows/
    ├── planning/
    │   ├── index.ts               # 기획 프롬프트 모아서 export
    │   ├── startup-prd.ts         # PRD 프롬프트 문자열
    │   ├── startup-ux.ts          # UX 프롬프트 문자열
    │   ├── startup-ui.ts          # Design Guide 프롬프트 문자열
    │   ├── startup-trd.ts         # TRD 프롬프트 문자열
    │   ├── startup-architecture.ts # Architecture 프롬프트 문자열
    │   └── startup-erd.ts         # ERD 프롬프트 문자열
    └── development/
        ├── index.ts               # 개발 프롬프트 모아서 export
        ├── pm-opensource.ts       # 오픈소스 클론 프롬프트
        ├── pm-orchestrator.ts     # 오케스트레이터 프롬프트
        ├── pm-executor.ts         # 실행자 프롬프트
        └── pm-reviewer.ts         # 리뷰어 프롬프트
```

---

## 코드 구조 상세

### 1단계: 프롬프트 문자열 정의

**파일**: `src/constants/workflows/planning/startup-prd.ts`

```typescript
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

**원리**: 마크다운 형식의 프롬프트를 **백틱 템플릿 리터럴**로 감싸서 문자열 상수로 저장합니다.

---

### 2단계: 워크플로우 순서에 프롬프트 연결

**파일**: `src/constants/planning.ts`

```typescript
import { STARTUP_PRD_PROMPT, STARTUP_UX_PROMPT, ... } from './workflows/planning';

export interface WorkflowStep {
  id: string;
  title: string;
  filename: string;
  workflow: string;      // 슬래시 커맨드 (deprecated, 백업용)
  prompt?: string;       // 내재화된 프롬프트 (이걸 사용!)
  displayText: string;
  icon: WorkflowIconType;
  nextId: string | null;
}

export const WORKFLOW_SEQUENCE: WorkflowStep[] = [
  {
    id: 'prd',
    title: 'PRD',
    filename: 'prd.md',
    workflow: '/anyon:anyon-method:workflows:startup-prd',  // 백업
    prompt: STARTUP_PRD_PROMPT,                              // 실제 사용
    displayText: 'PRD 문서 작성 시작',
    icon: 'file-text',
    nextId: 'ux-design',
  },
  // ... 나머지 5개 단계
];
```

**원리**: 각 워크플로우 단계에 `prompt` 필드로 프롬프트 문자열을 직접 연결합니다.

---

### 3단계: 프롬프트 선택 함수

**파일**: `src/constants/planning.ts`

```typescript
/**
 * 워크플로우 실행에 사용할 프롬프트 반환
 * prompt가 있으면 내재화된 프롬프트 사용, 없으면 슬래시 커맨드 사용
 */
export const getWorkflowPrompt = (step: WorkflowStep): string => {
  return step.prompt ?? step.workflow;
};
```

**원리**: 
- `prompt`가 있으면 → 내재화된 프롬프트 문자열 반환
- `prompt`가 없으면 → 슬래시 커맨드 문자열 반환 (폴백)

---

### 4단계: UI에서 프롬프트 실행

**파일**: `src/components/planning/PlanningDocsPanel.tsx`

```typescript
import { getWorkflowPrompt } from '@/constants/planning';

const handleStartWorkflow = useCallback((step: WorkflowStep) => {
  // 내재화된 prompt가 있으면 사용, 없으면 슬래시 커맨드 사용
  const workflowPrompt = getWorkflowPrompt(step);
  onStartNewWorkflow(workflowPrompt);  // 부모 컴포넌트로 전달
}, [onStartNewWorkflow]);
```

**원리**: "시작하기" 버튼 클릭 시 `getWorkflowPrompt()`로 프롬프트를 가져와 상위 컴포넌트에 전달합니다.

---

### 5단계: Claude 세션에 프롬프트 전달

**파일**: `src/components/MvpWorkspace.tsx`

```typescript
const handleStartNewWorkflow = useCallback((workflowPrompt: string) => {
  if (claudeSessionRef.current) {
    // Claude 세션에 프롬프트 전달하여 새 대화 시작
    claudeSessionRef.current.startNewSession(workflowPrompt);
  }
}, []);

// JSX에서 연결
<PlanningDocsPanel
  projectPath={project?.path}
  onStartNewWorkflow={handleStartNewWorkflow}  // 콜백 전달
/>
```

**원리**: `PlanningDocsPanel`에서 받은 프롬프트를 `ClaudeCodeSession` 컴포넌트의 `startNewSession()` 메서드로 전달합니다.

---

## 데이터 흐름 요약

```
[버튼 클릭]
     ↓
[PlanningDocsPanel]
     │
     │  getWorkflowPrompt(step)
     │  → STARTUP_PRD_PROMPT 문자열 반환
     ↓
[onStartNewWorkflow(promptString)]
     ↓
[MvpWorkspace]
     │
     │  handleStartNewWorkflow(promptString)
     ↓
[ClaudeCodeSession.startNewSession(promptString)]
     ↓
[Claude API에 프롬프트 전송]
     ↓
[Claude가 프롬프트 내용대로 대화 진행]
```

---

## 장점

### 1. 독립성
- 외부 슬래시 커맨드 시스템에 의존하지 않음
- 앱 단독으로 완전한 워크플로우 실행 가능

### 2. 버전 관리
- 프롬프트가 코드에 포함되어 Git으로 버전 관리 가능
- 프롬프트 변경 이력 추적 가능

### 3. 커스터마이징
- 프롬프트 수정이 `.ts` 파일 편집으로 간단함
- 환경별로 다른 프롬프트 사용 가능

### 4. 폴백 지원
- `prompt`가 없으면 자동으로 슬래시 커맨드 사용
- 점진적 마이그레이션 가능

---

## 새 워크플로우 추가 방법

1. **프롬프트 파일 생성**
   ```typescript
   // src/constants/workflows/planning/new-workflow.ts
   export const NEW_WORKFLOW_PROMPT = `
   # 새 워크플로우
   ...프롬프트 내용...
   `;
   ```

2. **index.ts에 export 추가**
   ```typescript
   // src/constants/workflows/planning/index.ts
   export { NEW_WORKFLOW_PROMPT } from './new-workflow';
   ```

3. **WORKFLOW_SEQUENCE에 단계 추가**
   ```typescript
   // src/constants/planning.ts
   {
     id: 'new-step',
     title: 'New Step',
     filename: 'new-step.md',
     workflow: '/some/slash/command',  // 백업
     prompt: NEW_WORKFLOW_PROMPT,       // 실제 사용
     displayText: '새 단계 시작',
     icon: 'file-text',
     nextId: null,
   }
   ```

---

## 관련 파일 목록

| 파일 | 역할 |
|------|------|
| `src/constants/workflows/planning/*.ts` | 프롬프트 문자열 저장 |
| `src/constants/planning.ts` | 워크플로우 순서 + 프롬프트 연결 |
| `src/components/planning/PlanningDocsPanel.tsx` | UI + 프롬프트 실행 트리거 |
| `src/components/MvpWorkspace.tsx` | Claude 세션과 연결 |
| `src/components/ClaudeCodeSession.tsx` | Claude API 통신 |
