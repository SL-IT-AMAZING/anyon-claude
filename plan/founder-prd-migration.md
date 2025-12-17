# PRD 워크플로우 프롬프트 교체 기획서

## 개요

**목표**: PRD 워크플로우 프롬프트를 `founder-prd` 내용으로 교체

**변경 범위**: 프롬프트 문자열만 교체 (구조/호출방식 변경 없음)

---

## 1. 수정 대상

**파일 1개:**
```
src/constants/workflows/planning/startup-prd.ts
```

---

## 2. 작업 내용

`STARTUP_PRD_PROMPT` 상수에 아래 4개 파일 내용을 순서대로 복붙:

```
.anyon/anyon-method/workflows/founder-prd/
├── workflow.yaml      → 1번째
├── instructions.md    → 2번째  
├── template.md        → 3번째
├── checklist.md       → 4번째
```

---

## 3. 검증 및 수정이 필요한 항목

### 3.1 외부 파일 참조 (제거/수정 필요)

founder-prd의 instructions.md 상단에 외부 파일 참조가 있음:

| 원본 참조 | 문제점 | 해결 방법 |
|----------|--------|----------|
| `{project-root}/.anyon/core/tasks/workflow.xml` | 슬래시 커맨드 환경 전용 | **제거** |
| `{project-root}/.anyon/anyon-method/workflows/founder-prd/workflow.yaml` | 이미 복붙할 예정 | **제거** |
| `{project-root}/.anyon/anyon-method/config.yaml` | config 파일 없을 수 있음 | **기본값 하드코딩** |

**instructions.md에서 제거할 부분:**
```xml
<critical>The workflow execution engine is governed by: {project-root}/.anyon/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/.anyon/anyon-method/workflows/founder-prd/workflow.yaml</critical>
<critical>Communicate in {communication_language} throughout the workflow process</critical>
```

**대체:**
```xml
<critical>한국어로 대화하세요</critical>
```

### 3.2 변수 치환 (하드코딩 필요)

| 변수 | 원본 | 수정 후 |
|------|------|---------|
| `{communication_language}` | config.yaml 참조 | `Korean` 하드코딩 |
| `{user_name}` | config.yaml 참조 | `사용자` 하드코딩 |
| `{project-root}` | 환경 변수 | `현재 프로젝트 폴더` 또는 제거 |
| `{date}` | system-generated | `오늘 날짜` 또는 제거 |

### 3.3 도구 의존성 (확인 완료)

| 도구 | 사용처 | 상태 |
|------|--------|------|
| **WebSearch** | Step 4 경쟁사 분석 | ✅ Claude Code에서 사용 가능 |
| **파일 쓰기** | prd.md 생성/업데이트 | ✅ Write/Edit 도구 사용 가능 |
| **폴더 생성** | anyon-docs/planning/ | ✅ Bash mkdir 가능 |

### 3.4 template-output 태그 처리

instructions.md에 `<template-output>` 태그가 있음:
```xml
<template-output>prd_header</template-output>
<template-output>product_overview</template-output>
...
```

**문제**: 슬래시 커맨드 환경에서는 workflow.xml이 이 태그를 해석하지만, 직접 프롬프트 실행 시 AI가 이해해야 함

**해결**: 프롬프트 상단에 명시적 지시 추가
```
<template-output> 태그를 만나면:
1. 해당 섹션 내용을 생성
2. prd.md 파일의 해당 섹션에 저장
3. 사용자에게 내용 확인 후 다음 단계 진행
```

---

## 4. 최종 프롬프트 구조

```typescript
export const STARTUP_PRD_PROMPT = `
# Founder PRD - 비개발자 창업자를 위한 PRD 작성 워크플로우

## 실행 환경 설정
- 언어: 한국어
- 출력 파일: anyon-docs/planning/prd.md
- 먼저 출력 폴더가 없으면 생성 (mkdir -p anyon-docs/planning)

## 실행 규칙
1. 각 Step을 순서대로 실행
2. <template-output> 태그를 만나면 해당 섹션을 prd.md에 저장
3. <ask> 태그는 사용자에게 질문하고 답변 대기
4. Step 4에서 WebSearch 도구로 경쟁사 검색 필수

---

## Workflow Configuration
\`\`\`yaml
${workflow.yaml 내용 - config_source 관련 부분 제거}
\`\`\`

---

## Instructions
${instructions.md 내용 - 외부 참조 critical 태그 제거, 변수 하드코딩}

---

## Output Template
\`\`\`markdown
${template.md 내용 - {{변수}}는 그대로 유지}
\`\`\`

---

## Validation Checklist
${checklist.md 내용}

---

지금 바로 Step 0부터 시작하세요.
`;
```

---

## 5. 변경 없는 부분

| 파일 | 상태 |
|------|------|
| `src/constants/planning.ts` | 변경 없음 |
| `src/constants/workflows/planning/index.ts` | 변경 없음 |
| `src/components/planning/PlanningDocsPanel.tsx` | 변경 없음 |
| `src/components/MvpWorkspace.tsx` | 변경 없음 |

---

## 6. 테스트 체크리스트

1. MVP 탭 → PRD "작성 시작" 클릭
2. AI가 founder-prd 방식으로 진행하는지 확인:
   - [ ] 인사말: "안녕하세요! PRD 작성을 도와드릴 비즈니스 전문가입니다..."
   - [ ] 객관식 선지 4-8개 제공
   - [ ] `(추천)` 표시 있음
   - [ ] "기타 (직접 입력)" 항상 포함
   - [ ] Step 4에서 WebSearch로 경쟁사 자동 검색
   - [ ] 각 섹션 완료 후 prd.md 실시간 업데이트
   - [ ] Step 8에서 섹션별 수정 옵션 제공
3. `anyon-docs/planning/prd.md` 파일 생성 확인

---

## 7. 요약

| 항목 | 내용 |
|------|------|
| 수정 파일 | 1개 (`startup-prd.ts`) |
| 작업 | 4개 파일 내용 복붙 + 외부 참조 제거 + 변수 하드코딩 |
| 핵심 수정 | instructions.md 상단 critical 태그 3개 제거/수정 |
| 결과 | 슬래시 커맨드 `/anyon:anyon-method:workflows:founder-prd` 실행과 동일한 플로우 |
