---
title: Development (개발문서) 워크플로우 전체 개요
description: 기획문서 6개를 바탕으로 실제 코드를 생성하는 4단계 개발 파이프라인
related_code:
  - src/constants/workflows/development/pm-opensource.ts
  - src/constants/workflows/development/pm-orchestrator.ts
  - src/constants/workflows/development/pm-executor.ts
  - src/constants/workflows/development/pm-reviewer.ts
  - src/constants/development.ts
ui_location: Basic > MVP Workspace > 개발문서 탭
workflow_order: 기획문서 완료 후
dependencies:
  - prd.md
  - ui-ux.html
  - design-guide.md
  - trd.md
  - architecture.md
  - erd.md
output_files:
  - anyon-docs/DEVELOPMENT_COMPLETE.md (최종 완료 시)
  - anyon-docs/tickets/*.md (티켓들)
  - 실제 소스 코드
last_updated: 2024-12-17
---

# Development (개발문서) 워크플로우 전체 개요

## 개요

개발문서 워크플로우는 기획문서 6개를 분석하여 **실제 동작하는 코드**를 생성하는 단계입니다.

### 4단계 파이프라인 구조

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  PM Opensource  │ → │  PM Orchestrator │ → │   PM Executor   │ ↔ │   PM Reviewer   │
│   (오픈소스)    │   │   (오케스트레이터) │   │     (실행자)     │   │    (리뷰어)      │
└─────────────────┘   └─────────────────┘   └─────────────────┘   └─────────────────┘
       1회                  1회                  반복                   반복
```

### 각 단계 역할 요약

| 단계 | 역할 | 실행 횟수 |
|------|------|----------|
| PM Opensource | 오픈소스 레포지토리 클론 | 1회 |
| PM Orchestrator | 티켓 생성 + 실행 계획 수립 | 1회 |
| PM Executor | 티켓 기반 코드 작성 | 티켓 수만큼 반복 |
| PM Reviewer | 코드 리뷰 + 즉시 수정 | Executor와 함께 반복 |

---

## 워크플로우 흐름도

### 전체 흐름

```
[기획문서 6개 완성]
        ↓
┌───────────────────────────────────────────────────────────────────┐
│                        개발문서 탭                                  │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│   [PM Opensource] ────────────────────────────────────────────┐   │
│          │                                                    │   │
│          │ open-source.md 읽기                                │   │
│          │ → git clone 실행                                   │   │
│          │ → 경로 기록                                        │   │
│          ↓                                                    │   │
│   [PM Orchestrator] ─────────────────────────────────────────┤   │
│          │                                                    │   │
│          │ 6개 문서 분석                                       │   │
│          │ → 티켓 생성 (anyon-docs/tickets/)                  │   │
│          │ → Wave 구성 (의존성 그래프)                         │   │
│          │ → 에이전트 할당                                     │   │
│          ↓                                                    │   │
│   ┌─────────────────────────────────────────────────────┐    │   │
│   │              반복 구간 (자동 순환)                    │    │   │
│   │                                                      │    │   │
│   │   [PM Executor] ─────→ [PM Reviewer]                │    │   │
│   │        │                    │                       │    │   │
│   │        │ 티켓 실행          │ 코드 리뷰              │    │   │
│   │        │ 코드 작성          │ 테스트 실행            │    │   │
│   │        │                    │ 문제 시 수정           │    │   │
│   │        │                    ↓                       │    │   │
│   │        │              ┌──────────┐                  │    │   │
│   │        │              │ 통과?    │                  │    │   │
│   │        │              └──────────┘                  │    │   │
│   │        │                 │    │                     │    │   │
│   │        │            Yes ↓    ↓ No                   │    │   │
│   │        │      다음 티켓    수정 후 재리뷰             │    │   │
│   │        └────────────────┘                           │    │   │
│   │                                                      │    │   │
│   └──────────────────────────────────────────────────────┘    │   │
│                           │                                   │   │
│                           │ 모든 티켓 완료                     │   │
│                           ↓                                   │   │
│              [DEVELOPMENT_COMPLETE.md 생성]                   │   │
│                                                               │   │
└───────────────────────────────────────────────────────────────────┘
        ↓
[프리뷰 탭에서 결과물 확인]
```

---

## 1. PM Opensource (오픈소스 클론)

### 파일 위치
- 프롬프트: `src/constants/workflows/development/pm-opensource.ts`

### 목적
TRD 또는 기획 단계에서 선정한 오픈소스 라이브러리들을 로컬에 클론합니다.

### 실행 조건
- `anyon-docs/planning/open-source.md` 파일 존재
- 파일 내에 클론할 저장소 URL 목록 포함

### 워크플로우 상세

```
Step 1: open-source.md 파일 읽기
        ↓
Step 2: 저장소 URL 및 클론 경로 파싱
        ↓
Step 3: 각 저장소에 대해:
        - git clone [URL] [경로]
        - 결과(성공/실패) 기록
        ↓
Step 4: open-source.md 업데이트
        - clone_status: completed
        - clone_path: /path/to/local
```

### 출력물
- 클론된 오픈소스 코드 (지정된 경로)
- 업데이트된 `open-source.md` (클론 상태 기록)

### AI 행동 규칙
```yaml
ai_behavior:
  read_file: open-source.md
  parse: repository_list
  execute: git clone commands
  update: clone status in open-source.md
  error_handling: 클론 실패 시 에러 메시지 기록, 다음 저장소로 계속
```

---

## 2. PM Orchestrator (오케스트레이터)

### 파일 위치
- 프롬프트: `src/constants/workflows/development/pm-orchestrator.ts`

### 목적
6개 기획문서를 분석하여 **개발 티켓**과 **실행 계획**을 생성합니다.

### 워크플로우 상세

```
Step 1: 6개 기획문서 전체 읽기
        - prd.md → 기능 요구사항 추출
        - ui-ux.html → 화면별 기능 매핑
        - design-guide.md → UI 컴포넌트 목록
        - trd.md → 기술 스택 확인
        - architecture.md → API 엔드포인트, 폴더 구조
        - erd.md → 데이터 모델, Prisma 스키마
        ↓
Step 2: 티켓 생성
        - 기능별로 티켓 분리
        - 각 티켓에 포함: 제목, 설명, 관련 파일, 의존성
        - 우선순위 설정 (P0 > P1 > P2)
        ↓
Step 3: 의존성 그래프 생성
        - 티켓 간 선후 관계 분석
        - 순환 의존성 검출 및 해결
        ↓
Step 4: Wave 구성
        - 의존성 없는 티켓들을 같은 Wave에 배치
        - Wave 1 → Wave 2 → Wave 3 순서 결정
        ↓
Step 5: 에이전트 할당
        - 각 티켓에 적합한 작업 유형 태깅
        - frontend / backend / database / infra
        ↓
Step 6: 실행 계획 문서 생성
```

### 출력물

#### 티켓 파일 구조
```
anyon-docs/tickets/
├── TICKET-001-project-setup.md
├── TICKET-002-database-schema.md
├── TICKET-003-auth-api.md
├── TICKET-004-login-page.md
└── ...
```

#### 티켓 파일 형식
```markdown
---
ticket_id: TICKET-001
title: "프로젝트 초기 설정"
priority: P0
wave: 1
type: infra
depends_on: []
estimated_files:
  - package.json
  - tsconfig.json
  - next.config.js
status: pending
---

# TICKET-001: 프로젝트 초기 설정

## 설명
Next.js 프로젝트를 초기화하고 필수 패키지를 설치합니다.

## 작업 내용
1. npx create-next-app@latest 실행
2. TypeScript, Tailwind CSS 설정
3. ESLint, Prettier 설정
4. 기본 폴더 구조 생성

## 완료 조건
- [ ] package.json 생성
- [ ] 기본 파일 구조 완성
- [ ] npm run dev 정상 동작
```

#### 실행 계획 파일
```markdown
# 실행 계획

## Wave 1 (병렬 실행 가능)
- TICKET-001: 프로젝트 초기 설정
- TICKET-002: 데이터베이스 스키마 설정

## Wave 2 (Wave 1 완료 후)
- TICKET-003: 인증 API 구현
- TICKET-004: 사용자 API 구현

## Wave 3 (Wave 2 완료 후)
- TICKET-005: 로그인 페이지
- TICKET-006: 대시보드 페이지

## 의존성 그래프
TICKET-001 → TICKET-003 → TICKET-005
TICKET-002 → TICKET-003
            → TICKET-004 → TICKET-006
```

### AI 행동 규칙
```yaml
ai_behavior:
  analyze:
    - 6개 기획문서 전체 읽기
    - PRD의 MVP 기능 목록 우선
  generate:
    - 티켓은 작은 단위로 분리 (1티켓 = 1-2시간 작업량)
    - 의존성 명확히 표시
  output:
    - anyon-docs/tickets/ 폴더에 티켓 파일 생성
    - 실행 계획 문서 생성
```

---

## 3. PM Executor (실행자)

### 파일 위치
- 프롬프트: `src/constants/workflows/development/pm-executor.ts`

### 목적
Orchestrator가 생성한 티켓을 순서대로 실행하여 **실제 코드를 작성**합니다.

### 워크플로우 상세

```
Step 1: 다음 실행할 티켓 선택
        - status: pending인 티켓 중
        - depends_on이 모두 completed인 티켓
        - wave가 가장 낮은 티켓
        ↓
Step 2: 티켓 상태 업데이트
        - status: pending → in_progress
        ↓
Step 3: 코드 작성
        - 티켓의 작업 내용 수행
        - 파일 생성/수정
        - 필요시 패키지 설치
        ↓
Step 4: 완료 조건 확인
        - 티켓의 체크리스트 검증
        - 기본 동작 테스트
        ↓
Step 5: 티켓 상태 업데이트
        - status: in_progress → review_requested
        - implemented_files 기록
        ↓
Step 6: PM Reviewer로 전환
```

### 코드 작성 규칙
```yaml
code_rules:
  style:
    - TRD에서 정의한 기술 스택 사용
    - Architecture에서 정의한 폴더 구조 준수
    - Design Guide의 컴포넌트 스타일 적용

  quality:
    - TypeScript strict 모드
    - ESLint 규칙 준수
    - 적절한 에러 핸들링

  patterns:
    - Architecture 문서의 패턴 따르기
    - ERD의 Prisma 스키마 그대로 사용
    - API 응답 형식 통일
```

### AI 행동 규칙
```yaml
ai_behavior:
  select_ticket:
    - Wave 순서 우선
    - 의존성 완료된 티켓만 선택

  implement:
    - 티켓 범위만 구현 (오버엔지니어링 금지)
    - 기획문서 참조하며 구현
    - 코드 내 주석은 최소화

  complete:
    - 완료 조건 체크리스트 확인
    - 빌드/린트 에러 없음 확인
    - 다음 단계(Reviewer)로 전환
```

---

## 4. PM Reviewer (리뷰어)

### 파일 위치
- 프롬프트: `src/constants/workflows/development/pm-reviewer.ts`

### 목적
Executor가 작성한 코드를 검토하고, **문제 발견 시 즉시 수정**합니다.

### 워크플로우 상세

```
Step 1: 리뷰 대상 티켓 확인
        - status: review_requested인 티켓
        - implemented_files 목록 확인
        ↓
Step 2: 코드 리뷰 수행
        - 구현된 파일들 읽기
        - 코드 품질 평가
        - 버그/보안 취약점 확인
        - 기획문서와 일치 여부 확인
        ↓
Step 3: 테스트 실행
        - npm run build (빌드 테스트)
        - npm run lint (린트 검사)
        - npm run test (유닛 테스트, 있는 경우)
        ↓
Step 4: 결과에 따른 분기
        │
        ├─ [통과] ─────────────────────────────┐
        │   - 티켓 status: completed           │
        │   - 다음 티켓이 있으면 Executor로    │
        │   - 모든 티켓 완료 시 Step 5로       │
        │                                      │
        └─ [실패] ─────────────────────────────┤
            - 문제점 기록                      │
            - 직접 수정 시도                   │
            - 수정 후 다시 Step 3              │
            - 수정 불가 시 Executor에 반환     │
                                               ↓
Step 5: 개발 완료 처리
        - 모든 티켓 completed 확인
        - DEVELOPMENT_COMPLETE.md 생성
```

### 리뷰 체크리스트
```yaml
review_checklist:
  code_quality:
    - TypeScript 타입 오류 없음
    - ESLint 경고/에러 없음
    - 중복 코드 최소화
    - 적절한 함수/변수 네이밍

  functionality:
    - 티켓 요구사항 충족
    - 에러 케이스 처리
    - API 응답 형식 일관성

  security:
    - SQL Injection 취약점 없음
    - XSS 취약점 없음
    - 인증/인가 적절히 구현

  performance:
    - 불필요한 리렌더링 없음
    - N+1 쿼리 문제 없음
    - 적절한 캐싱 적용
```

### AI 행동 규칙
```yaml
ai_behavior:
  review:
    - 코드 전체 읽기 (변경된 파일)
    - 기획문서와 대조
    - 체크리스트 항목별 검토

  fix:
    - 간단한 수정은 직접 수행
    - 복잡한 구조 변경은 Executor에 반환
    - 수정 내용 기록

  approve:
    - 모든 체크리스트 통과 시
    - 테스트 성공 시
    - 티켓 상태 completed로 변경
```

---

## 자동 순환 로직 상세

### 상태 전이 다이어그램

```
┌─────────────────────────────────────────────────────────────────┐
│                        티켓 상태 전이                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   [pending] ──(Executor 선택)──→ [in_progress]                  │
│                                        │                        │
│                           (구현 완료)  │                        │
│                                        ↓                        │
│                              [review_requested]                 │
│                                        │                        │
│                           (Reviewer 검토)                       │
│                                        │                        │
│                            ┌───────────┴───────────┐            │
│                            │                       │            │
│                       (통과)│                 (실패)│            │
│                            ↓                       ↓            │
│                      [completed]            [in_progress]       │
│                                              (다시 Executor)     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 완료 감지 코드 로직

```typescript
// src/constants/development.ts 에서의 로직 (개념적 설명)

async function checkDevelopmentComplete(): Promise<boolean> {
  const tickets = await readAllTickets('anyon-docs/tickets/');

  // 모든 티켓이 completed 상태인지 확인
  const allCompleted = tickets.every(t => t.status === 'completed');

  if (allCompleted) {
    // DEVELOPMENT_COMPLETE.md 생성
    await createFile('anyon-docs/DEVELOPMENT_COMPLETE.md', `
# 개발 완료

## 완료일시
${new Date().toISOString()}

## 완료된 티켓
${tickets.map(t => `- ${t.ticket_id}: ${t.title}`).join('\n')}

## 다음 단계
프리뷰 탭에서 결과물을 확인하세요.
    `);
    return true;
  }

  return false;
}

function getNextStep(currentStep: string): string {
  const flow = {
    'pm-opensource': 'pm-orchestrator',
    'pm-orchestrator': 'pm-executor',
    'pm-executor': 'pm-reviewer',
    'pm-reviewer': checkDevelopmentComplete() ? 'complete' : 'pm-executor'
  };

  return flow[currentStep];
}
```

---

## 핵심 개념 설명 (비개발자용)

### 티켓 (Ticket)
하나의 작업 단위입니다.
- 비유: 할 일 목록의 한 항목
- 예: "로그인 페이지 만들기", "데이터베이스 연결하기"

### Wave (웨이브)
동시에 실행할 수 있는 티켓들의 그룹입니다.
- 비유: 공사 단계 (기초공사 → 골조공사 → 인테리어)
- Wave 1의 모든 티켓이 완료되어야 Wave 2 시작

### 의존성 (Dependency)
작업 간의 선후 관계입니다.
- 비유: "아침 먹으려면 일어나야 한다"의 관계
- TICKET-003이 TICKET-001에 의존 = TICKET-001 먼저 완료 필요

### 오케스트레이터 (Orchestrator)
전체 작업을 조율하는 역할입니다.
- 비유: 건설 현장의 현장소장
- 무엇을 언제 어떤 순서로 할지 결정

### 코드 리뷰 (Code Review)
작성된 코드를 검토하는 과정입니다.
- 비유: 글 쓴 후 맞춤법 검사 + 내용 검토
- 버그, 보안 문제, 코드 품질 확인

---

## 출력물 요약

| 워크플로우 | 주요 출력물 | 위치 |
|------------|-------------|------|
| PM Opensource | 클론된 오픈소스 코드 | 지정된 경로 |
| PM Orchestrator | 티켓 파일들 | `anyon-docs/tickets/` |
| PM Executor | 실제 소스 코드 | 프로젝트 폴더 전체 |
| PM Reviewer | 리뷰 코멘트, 수정된 코드 | 티켓 파일 + 소스 코드 |
| 최종 | DEVELOPMENT_COMPLETE.md | `anyon-docs/` |

---

## AI를 위한 요약

**Development 워크플로우 핵심**:
1. 4단계 파이프라인: Opensource → Orchestrator → Executor ↔ Reviewer
2. Executor와 Reviewer는 자동 순환 (모든 티켓 완료까지)
3. 완료 조건: `DEVELOPMENT_COMPLETE.md` 파일 생성

**프롬프트 파일 위치**:
- `src/constants/workflows/development/pm-opensource.ts`
- `src/constants/workflows/development/pm-orchestrator.ts`
- `src/constants/workflows/development/pm-executor.ts`
- `src/constants/workflows/development/pm-reviewer.ts`

**상태 관리**:
- 티켓 상태: pending → in_progress → review_requested → completed
- 각 단계 전환 시 상태 업데이트 필수

**중요 분기 로직**:
- Reviewer 완료 후: 다음 티켓 있으면 Executor로, 없으면 완료 처리
- 리뷰 실패 시: 직접 수정 또는 Executor에 반환

**참조 문서 우선순위**:
1. Architecture (폴더 구조, API 설계)
2. ERD (Prisma 스키마)
3. TRD (기술 스택)
4. PRD (기능 요구사항)
5. Design Guide (UI 스타일)
6. UX Design (화면 구성)

**티켓 선택 알고리즘**:
```
1. status === 'pending' 필터
2. depends_on 모두 completed 확인
3. wave 오름차순 정렬
4. 첫 번째 티켓 선택
```
