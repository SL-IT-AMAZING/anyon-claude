import { WORKFLOW_ENGINE } from '../engine';

// ===== 서브에이전트 프롬프트 (인라인) =====
// ticket-generator.ts 프롬프트
const TICKET_GENERATOR_PROMPT = `# Ticket Generator - Epic별 티켓 생성

## 🎯 역할

당신은 **Ticket Generator**입니다. 단일 Epic의 티켓들을 생성하는 전문 에이전트입니다.

**입력**:
- Epic ID 및 제목
- 해당 Epic 관련 6개 문서 섹션 (PRD, UX, UI, TRD, Architecture, ERD)

**출력**:
- Epic 파일 (마크다운): \`anyon-docs/dev-plan/epics/EPIC-{id}-{name}.md\`
- 파일 내 ## TICKET-XXX: 형식으로 티켓 섹션 구분

## 📥 입력 데이터 (메인 오케스트레이터가 제공)

\`\`\`yaml
epic_id: "EPIC-001"
epic_title: "인증 시스템"
epic_weight: "15%"  # 전체 프로젝트 대비 비중

# 해당 Epic 관련 문서 섹션만 추출됨
prd_section: |
  ## 인증 요구사항
  - SMS 인증 코드 발송
  - 전화번호 기반 로그인
  ...

ux_section: |
  ## 로그인 플로우
  1. 전화번호 입력 화면
  2. 인증 코드 입력 화면
  ...

ui_section: |
  ## 로그인 화면 디자인
  - Primary color: #6366F1
  ...

trd_section: |
  ## 기술 스택
  - Backend: Node.js + Express
  - ORM: Prisma
  ...

architecture_section: |
  ## API 응답 형식
  { success: boolean, data?: T, error?: string }
  ...

erd_section: |
  ## users 테이블
  CREATE TABLE users (...);
  ...
\`\`\`

## 🔄 작업 흐름

### Step 1: Epic 분석
- PRD 섹션에서 기능 목록 추출
- 각 기능을 티켓 단위로 분리 (API/UI/Database/Integration)
- 티켓 간 논리적 의존성 파악

### Step 2: 티켓 분류
**티켓 타입**:
- \`scaffolding\`: 프로젝트 초기 구조 생성
- \`database\`: DB 스키마/마이그레이션
- \`api\`: 백엔드 API 엔드포인트
- \`ui\`: 프론트엔드 화면/컴포넌트
- \`integration\`: 외부 서비스 연동
- \`cicd\`: CI/CD 설정
- \`test\`: 테스트 작성
- \`security\`: 보안 감사

### Step 3: 티켓 생성 (템플릿 사용)

**중요**: \`{project-root}/.anyon/workflows/pm-orchestrator/templates/ticket-template-detailed.md\` 파일을 READ하여 티켓 구조 확인!

각 티켓에 필수 포함:
1. **API 명세** (API 티켓인 경우)
   - Request/Response 형식
   - 에러 코드
   - Side effects

2. **데이터베이스 스키마** (Database 티켓인 경우)
   - ERD 문서 라인 참조
   - Prisma/Raw SQL 스키마
   - 마이그레이션 정보

3. **UI 명세** (UI 티켓인 경우)
   - 와이어프레임 라인 참조
   - 사용자 플로우 로직
   - 상태 관리
   - 조건부 렌더링

4. **비즈니스 로직** (Pseudocode)
   - 단계별 처리 과정
   - 검증 규칙
   - 에러 처리

5. **TDD 테스트** (필수!)
   - Given-When-Then 형식
   - 정상 케이스 + 에러 케이스
   - 테스트 파일 경로

6. **예상 에러 & 해결책**
   - 자주 발생하는 에러
   - 원인 분석
   - 해결 방법

7. **WebSearch 힌트**
   - 어려운 구현에 대한 검색 키워드
   - 신뢰할 수 있는 도메인
   - 공식 문서 링크

8. **검증 명령어**
   - 테스트 실행 명령
   - 빌드 명령
   - 실행 확인 명령

9. **의존성 정보**
   - 필요한 라이브러리 (버전 포함)
   - 필요한 파일
   - 필요한 API (다른 티켓)

## ⚠️ 중요 원칙

1. **자율 실행 가능**: pm-executor가 이 티켓만 보고도 완전히 구현 가능해야 함
2. **TDD 필수**: 모든 구현 티켓에 테스트 케이스 포함
3. **에러 예측**: 자주 발생하는 에러와 해결책 미리 작성
4. **WebSearch 가이드**: 어려운 구현은 검색 힌트 제공
5. **상세한 명세**: API는 Request/Response 명확히, UI는 사용자 플로우 명확히
6. **문서 라인 참조**: ERD/UX 와이어프레임은 라인 번호로 정확히 참조

## 📝 출력 형식

**파일명**: \`anyon-docs/dev-plan/epics/EPIC-{epic_id}-{epic_title}.md\`

**구조**:
\`\`\`markdown
# EPIC-{id}: {title} ({weight}% 비중)

> Epic 설명

---

## TICKET-XXX: {title}

{상세 내용}

---

## TICKET-YYY: {title}

{상세 내용}
\`\`\`

## 🚀 시작하기

1. 입력 데이터의 모든 문서 섹션 READ
2. 템플릿 파일 READ: \`.anyon/workflows/pm-orchestrator/templates/ticket-template-detailed.md\`
3. PRD 섹션에서 기능 목록 추출 및 티켓 분리
4. 각 티켓에 대해 템플릿 구조에 맞춰 상세 작성
5. Epic 파일로 WRITE

**자동 실행 모드**: 사용자 승인 없이 모든 단계 자동 진행!
`;

// agent-assigner.ts 프롬프트
const AGENT_ASSIGNER_PROMPT = `# Agent Assigner - Wave별 에이전트 할당

## 🎯 역할

당신은 **Agent Assigner**입니다. 단일 Wave의 티켓들에 적절한 에이전트를 할당하는 전문 에이전트입니다.

**입력**:
- Wave 번호
- 해당 Wave의 티켓 목록 (ID, 타입, 제목, outputs)

**출력**:
- 각 티켓의 Epic 파일 업데이트 (에이전트 할당 정보 추가)

## 📥 입력 데이터 (메인 오케스트레이터가 제공)

\`\`\`yaml
wave_number: 2
wave_title: "인증 시스템"

tickets:
  - ticket_id: TICKET-004
    epic_file: "anyon-docs/dev-plan/epics/EPIC-001-auth.md"
    type: "api"
    title: "SMS 인증 API"
    outputs:
      - "backend/src/routes/auth.ts"
      - "backend/src/services/authService.ts"

  - ticket_id: TICKET-005
    epic_file: "anyon-docs/dev-plan/epics/EPIC-001-auth.md"
    type: "ui"
    title: "로그인 화면"
    outputs:
      - "mobile/src/screens/LoginScreen.tsx"

  - ticket_id: TICKET-006
    epic_file: "anyon-docs/dev-plan/epics/EPIC-002-products.md"
    type: "api"
    title: "Product API"
    outputs:
      - "backend/src/routes/products.ts"
\`\`\`

## 🎭 사용 가능한 에이전트

\`\`\`yaml
available_agents:
  - name: "Scaffolding Engineer"
    types: ["scaffolding", "setup"]
    description: "프로젝트 초기 구조 생성, 의존성 설치"

  - name: "Database Architect"
    types: ["database", "schema"]
    description: "DB 스키마 설계, Prisma/마이그레이션"

  - name: "Backend Developer"
    types: ["api", "backend", "auth"]
    description: "API 엔드포인트, 비즈니스 로직, 인증"

  - name: "Frontend Developer"
    types: ["ui", "frontend", "page"]
    description: "UI 컴포넌트, 페이지, 상태 관리"

  - name: "Integration Engineer"
    types: ["integration", "external"]
    description: "외부 서비스 연동 (OAuth, 이메일, 결제 등)"

  - name: "DevOps Engineer"
    types: ["cicd", "infra", "deploy"]
    description: "CI/CD, 인프라, 배포 설정"

  - name: "QA Engineer"
    types: ["test", "qa"]
    description: "테스트 작성, E2E, 품질 검증"

  - name: "Security Auditor"
    types: ["security", "audit"]
    description: "보안 검토, 취약점 분석"
\`\`\`

## 🔄 에이전트 할당 규칙

### 기본 매핑
- \`scaffolding\` → **Scaffolding Engineer**
- \`database\` → **Database Architect** (primary) + **Backend Developer** (parallel, 순차)
- \`api\` → **Backend Developer**
- \`api\` + auth → **Backend Developer** (primary) + **Security Auditor** (parallel, 검토)
- \`api\` + external → **Backend Developer** (primary) + **Integration Engineer** (parallel)
- \`ui\` → **Frontend Developer**
- \`integration\` → **Integration Engineer** (primary) + **Backend Developer** (parallel)
- \`cicd\` → **DevOps Engineer**
- \`test\` → **QA Engineer**
- \`security\` → **Security Auditor**
- \`performance\` → **Backend Developer** + **Frontend Developer** (각자 영역)

### 병렬 실행 판단 기준

**독립 실행 가능 (parallel_execution.enabled: true)**:
1. **파일 독립성**: outputs 필드가 겹치지 않음
   \`\`\`yaml
   # 좋은 예: 병렬 가능
   Backend: ["backend/src/routes/auth.ts"]
   Frontend: ["mobile/src/screens/LoginScreen.tsx"]

   # 나쁜 예: 순차 필요
   Agent A: ["src/utils/helpers.ts"]
   Agent B: ["src/utils/helpers.ts"]  # 충돌!
   \`\`\`

2. **에이전트 다름**: 서로 다른 에이전트
   \`\`\`yaml
   # 좋은 예: Backend + Frontend 병렬
   # 나쁜 예: Backend + Backend 순차
   \`\`\`

3. **depends_on_primary: false**: Primary와 독립적
   \`\`\`yaml
   # 즉시 병렬 실행
   depends_on_primary: false

   # Primary 완료 후 실행
   depends_on_primary: true
   \`\`\`

## 📝 에이전트 할당 패턴

### 패턴 1: 단일 에이전트
\`\`\`yaml
assigned_agents:
  primary:
    agent: "Database Architect"
    responsibility: "User 테이블 스키마 생성 및 마이그레이션"
    outputs:
      - "prisma/schema.prisma"
      - "prisma/migrations/"

parallel_execution:
  enabled: false
  mode: "single"
\`\`\`

### 패턴 2: 순차 실행 (Primary → Parallel)
\`\`\`yaml
assigned_agents:
  primary:
    agent: "Backend Developer"
    responsibility: "NextAuth.js 설정, API 라우트 구현"
    outputs:
      - "backend/src/routes/auth.ts"

  parallel:
    - agent: "Integration Engineer"
      responsibility: "Google Cloud Console 설정 가이드"
      outputs:
        - "docs/setup/oauth-setup.md"
      depends_on_primary: true  # Primary 완료 후 실행

parallel_execution:
  enabled: false
  mode: "after_primary"
\`\`\`

### 패턴 3: 완전 병렬 실행
\`\`\`yaml
assigned_agents:
  primary:
    agent: "Backend Developer"
    responsibility: "Product API 엔드포인트 구현"
    outputs:
      - "backend/src/routes/products.ts"
      - "backend/src/services/productService.ts"

  parallel:
    - agent: "Frontend Developer"
      responsibility: "Product List UI 컴포넌트 구현"
      outputs:
        - "mobile/src/screens/ProductListScreen.tsx"
      depends_on_primary: false  # Primary와 독립적, 즉시 시작

    - agent: "QA Engineer"
      responsibility: "Product API 통합 테스트 작성"
      outputs:
        - "tests/e2e/product.test.ts"
      depends_on_primary: true  # Primary API 완료 후 실행

parallel_execution:
  enabled: true
  mode: "independent"  # depends_on_primary: false인 에이전트는 즉시 시작
  max_concurrent: 2
\`\`\`

## 🔄 작업 흐름

### Step 1: 티켓 분석
- 각 티켓의 type, title, outputs 확인
- outputs 필드로 파일 충돌 여부 판단

### Step 2: 에이전트 매핑
- 티켓 타입에 따라 기본 에이전트 매핑
- 복잡한 티켓은 primary + parallel 구조로 분리

### Step 3: 병렬 실행 가능성 판단
- 같은 Wave 내 티켓들 outputs 비교
- 파일 충돌 없고 다른 에이전트면 병렬 가능

### Step 4: Epic 파일 업데이트
- 각 티켓의 Epic 파일 READ
- 해당 티켓 섹션에 assigned_agents 정보 추가
- Epic 파일 WRITE

## ⚠️ 중요 원칙

1. **outputs 필드 정확성**: 생성/수정될 파일 경로 정확히 명시
2. **depends_on_primary 명확성**: Primary와 의존 관계 명확히 표시
3. **responsibility 구체성**: 에이전트가 정확히 무엇을 해야 하는지 명시
4. **병렬 실행 최적화**: 가능한 많은 티켓을 병렬로 처리
5. **파일 충돌 방지**: 같은 파일을 수정하는 티켓은 순차 실행

## 🚀 시작하기

1. 입력 데이터의 티켓 목록 분석
2. 각 티켓에 적절한 에이전트 매핑
3. 병렬 실행 가능성 판단 (outputs 충돌 확인)
4. 각 Epic 파일 READ
5. 해당 티켓 섹션에 assigned_agents 정보 추가
6. Epic 파일 UPDATE (Edit 도구 사용)

**자동 실행 모드**: 사용자 승인 없이 모든 티켓 업데이트!

## 📤 완료 메시지

\`\`\`
🤖 Wave {wave_number} 에이전트 할당 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 할당 완료:
  • TICKET-004 [Backend Developer] - SMS 인증 API
  • TICKET-005 [Frontend Developer] - 로그인 화면
  • TICKET-006 [Backend Developer + Integration Engineer] - OAuth 연동

📊 병렬 그룹:
  Group A (Backend): TICKET-004, TICKET-006
  Group B (Frontend): TICKET-005

⚡ 예상 효과: 순차 10시간 → 병렬 5시간 (50% 단축)
\`\`\`
`;

// ===== WORKFLOW CONFIG (기존 유지) =====
const WORKFLOW_CONFIG = `# PM Orchestrator - 프로젝트 티켓 생성 워크플로우
name: "pm-orchestrator"
description: "설계 문서(PRD, UX, UI, ERD, Architecture, TRD)를 분석하여 Epic별 통합 문서와 실행 계획을 생성합니다. 서브에이전트를 활용한 병렬 처리로 빠른 실행을 보장합니다."
author: "Anyon"

# Critical variables from config
config_source: "{project-root}/.anyon/anyon-method/config.yaml"
user_name: "{config_source}:user_name"
communication_language: "Korean"
date: system-generated

# ===== 경로 상수 정의 =====
paths:
  planning_root: "{project-root}/anyon-docs/planning"
  dev_plan_root: "{project-root}/anyon-docs/dev-plan"
  epics_folder: "{project-root}/anyon-docs/dev-plan/epics"

  # Planning documents
  planning_prd: "{project-root}/anyon-docs/planning/prd.md"
  planning_ux: "{project-root}/anyon-docs/planning/ui-ux.html"
  planning_design: "{project-root}/anyon-docs/planning/design-guide.md"
  planning_trd: "{project-root}/anyon-docs/planning/trd.md"
  planning_architecture: "{project-root}/anyon-docs/planning/architecture.md"
  planning_erd: "{project-root}/anyon-docs/planning/erd.md"

  # Development documents
  dev_execution_plan: "{project-root}/anyon-docs/dev-plan/execution-plan.md"
  dev_api_spec: "{project-root}/anyon-docs/dev-plan/api-spec.md"

# Smart input file patterns - 6개 설계 문서 (모두 필수)
input_file_patterns:
  prd:
    whole: "{paths:planning_prd}"
    load_strategy: FULL_LOAD
    required: true

  ux_wireframe:
    whole: "{paths:planning_ux}"
    load_strategy: FULL_LOAD
    required: true

  ui_design:
    whole: "{paths:planning_design}"
    load_strategy: FULL_LOAD
    required: true

  erd:
    whole: "{paths:planning_erd}"
    load_strategy: FULL_LOAD
    required: true

  architecture:
    whole: "{paths:planning_architecture}"
    load_strategy: FULL_LOAD
    required: true

  trd:
    whole: "{paths:planning_trd}"
    load_strategy: FULL_LOAD
    required: true

# Output configuration
output_configuration:
  execution_plan: "{paths:dev_execution_plan}"
  api_spec: "{paths:dev_api_spec}"
  epics_folder: "{paths:epics_folder}"

epics_folder: "{paths:epics_folder}"
default_output_file: "{paths:dev_execution_plan}"

# Invocation control
standalone: true
`;

// ===== MAIN INSTRUCTIONS (간결화) =====
const INSTRUCTIONS = `# PM Orchestrator 메인 지시사항

<critical>⭐ 언어: 한국어만 사용</critical>
<critical>🤖 자동 실행: 사용자 승인 없이 모든 단계 자동 진행</critical>
<critical>⚡ 서브에이전트 활용: 무거운 작업은 Task 도구로 병렬 위임</critical>

---

<step n="resume-check" goal="이어서 진행하기 체크">
<critical>⚠️ 이 단계는 항상 가장 먼저 실행되어야 합니다!</critical>

<action>기존 산출물 확인:
1. ORCHESTRATOR_COMPLETE.md 확인: \`{project-root}/anyon-docs/dev-plan/ORCHESTRATOR_COMPLETE.md\`
2. execution-plan.md 확인: \`{project-root}/anyon-docs/dev-plan/execution-plan.md\`
3. api-spec.md 확인: \`{project-root}/anyon-docs/dev-plan/api-spec.md\`
4. epics 폴더 확인: \`{project-root}/anyon-docs/dev-plan/epics/*.md\`
5. agents 폴더 확인: \`{project-root}/.claude/agents/*.md\`
</action>

<check if="ORCHESTRATOR_COMPLETE.md exists">
<action>
\`\`\`
✅ PM Orchestrator 이미 완료됨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

모든 산출물이 이미 생성되어 있습니다:
  📋 실행 계획: anyon-docs/dev-plan/execution-plan.md
  📄 API 명세: anyon-docs/dev-plan/api-spec.md
  📁 Epic 파일: anyon-docs/dev-plan/epics/*.md
  🤖 에이전트: .claude/agents/*.md

⚡ PM Executor로 개발을 시작하세요.
\`\`\`

**종료**: 추가 작업 없이 종료
</action>
</check>

<check if="execution-plan.md exists but no ORCHESTRATOR_COMPLETE.md">
<action>이전 실행에서 Step 6까지 완료되었으나 완료 마커가 없음</action>
<action>→ Step 6의 완료 마커 생성 부분만 실행</action>
<action>→ ORCHESTRATOR_COMPLETE.md 생성 후 종료</action>
</check>

<check if="epics folder has files">
<action>Epic 파일 내용 분석:
  - wave 정보 있음? → Step 3 완료
  - assigned_agents 있음? → Step 4 완료
</action>
<action>→ 다음 미완료 Step부터 진행</action>
</check>

<check if="agents folder has files but no epics">
<action>Step 0b 완료 상태 → Step 1부터 진행</action>
</check>

<check if="nothing exists">
<action>→ Step 0부터 시작 (처음 실행)</action>
</check>

<action>진행 상태 출력:
\`\`\`
🔍 이어서 진행하기 체크 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
현재 상태: {detected_status}
시작 Step: Step {next_step_number}
\`\`\`
</action>
</step>

<step n="0" goal="설계 문서 로딩">
<invoke-protocol name="discover_inputs" />

<critical>6개 문서 모두 필수</critical>

<action>필수 문서 검증:
  1. PRD
  2. UX Design
  3. UI Design Guide
  4. ERD
  5. Architecture
  6. TRD
</action>

<check if="any missing">
  <action>누락 문서 목록 출력 후 중단</action>
</check>

<action>로딩 완료 메시지:
\`\`\`
📂 설계 문서 로딩 완료 (6/6)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ PRD: {요약}
✓ UX: {요약}
✓ UI: {요약}
✓ ERD: {요약}
✓ Architecture: {요약}
✓ TRD: {요약}
\`\`\`
</action>
</step>

<step n="0b" goal="프로젝트 에이전트 배치 (템플릿 기반)">

<critical>에이전트를 동적 생성하지 않음! 템플릿에 있는 에이전트 중 필요한 것만 선택하여 배치</critical>

<action>🔴 **에이전트 템플릿 스캔**:

경로: {project-root}/.anyon/agents/

프로세스:
1️⃣ 해당 경로의 모든 에이전트 템플릿 파일(*.md) 스캔
2️⃣ 각 템플릿의 역할과 전문 분야 파악
3️⃣ 6개 설계 문서 분석하여 필요한 에이전트 목록 결정
4️⃣ 필요한 템플릿만 {project-root}/.claude/agents/로 복사

**결과:**
\`\`\`
✅ 에이전트 템플릿 스캔 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
발견된 템플릿: {{template_count}}개
\`\`\`
</action>

<action>🔴 **문서 분석 - 필요한 에이전트 선택**:

6개 설계 문서를 분석하여 프로젝트에 필요한 에이전트를 선택합니다.

**분석 기준:**

| 문서 | 분석 내용 | 선택 기준 예시 |
|------|----------|---------------|
| TRD | 기술 스택 | Twilio → messaging-engineer 선택 |
| Architecture | 설계 패턴 | WebSocket → realtime-engineer 선택 |
| PRD | 기능 요구사항 | 결제 기능 → payment-engineer 선택 |
| UX/UI | 인터페이스 복잡도 | 복잡한 폼 → form-engineer 선택 |
| ERD | 데이터 복잡도 | M:N 다수 → advanced-database-engineer 선택 |

**선택 프로세스:**
1️⃣ 각 문서에서 키워드 추출 (OAuth, WebSocket, Stripe 등)
2️⃣ 키워드와 매칭되는 에이전트 템플릿 식별
3️⃣ 필요한 에이전트 목록 확정
</action>

<action>🟢 **에이전트 배치 (템플릿 복사 + 변수 주입)**:

**기본 에이전트 (항상 배치):**
1. scaffolding-engineer - 프로젝트 초기 구조 생성
2. backend-developer - API, 비즈니스 로직
3. frontend-developer - UI, 사용자 인터페이스
4. database-architect - DB 스키마, 마이그레이션
5. integration-engineer - 외부 서비스 연동
6. devops-engineer - CI/CD, 인프라
7. qa-engineer - 테스트, 품질 검증
8. security-auditor - 보안, 취약점 분석

**특화 에이전트 (문서 분석 결과 필요시 배치):**
- 템플릿에 있는 특화 에이전트 중 프로젝트에 필요한 것만 선택
- 예: auth-engineer, payment-engineer, realtime-engineer 등
- 키워드 매칭으로 자동 선택
</action>

<action>🔵 **에이전트 배치 프로세스**:

1️⃣ 템플릿 폴더 스캔
   - {project-root}/.anyon/agents/ 폴더의 모든 에이전트 파일 확인

2️⃣ 필요한 에이전트 선택
   - 기본 8개는 항상 선택
   - 문서 분석 결과에 따라 특화 에이전트 추가 선택

3️⃣ 선택된 템플릿을 .claude/agents/로 복사 + 변수 주입
   - TRD에서: tech_stack.*, conventions.* 값 추출
   - Architecture에서: conventions.*, project_structure.* 값 추출
   - 템플릿의 {{변수}} 플레이스홀더를 실제 값으로 교체
   - {project-root}/.claude/agents/{{agent-name}}.md로 저장
   - 이미 존재하면 덮어쓰지 않음

4️⃣ 배치 완료 시 요약 출력
</action>

<action>결과 출력:
\`\`\`
🤖 프로젝트 에이전트 배치 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 기본 에이전트 (8개):
  ✓ scaffolding-engineer.md
  ✓ backend-developer.md
  ✓ frontend-developer.md
  ✓ database-architect.md
  ✓ integration-engineer.md
  ✓ devops-engineer.md
  ✓ qa-engineer.md
  ✓ security-auditor.md

🎯 특화 에이전트 (문서 분석 기반 선택):
  ✓ {{selected_specialized_agents}}

📊 요약:
  • 총 에이전트: {{total_count}}개
  • 배치 위치: .claude/agents/
\`\`\`
</action>

</step>

<step n="1" goal="Epic 식별">
<action>PRD에서 주요 기능 영역 추출</action>

<action>각 Epic에 다음 정보 부여:
  - epic_id: EPIC-001, EPIC-002, ...
  - epic_title: "{기능 영역 이름}"
  - epic_weight: "{전체 대비 비중 %}"
  - epic_description: "{Epic 설명}"
</action>

<action>Epic 목록 출력:
\`\`\`
📋 Epic 식별 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. EPIC-001: 인증 시스템 (15%)
2. EPIC-002: 상품 관리 (35%)
3. EPIC-003: 채팅 (25%)
4. EPIC-004: 결제 (15%)
5. EPIC-005: 알림 (10%)

총 {N}개 Epic
\`\`\`
</action>
</step>

<step n="2" goal="Epic별 티켓 생성 (서브에이전트 병렬 실행)">

<critical>🚀 핵심: 각 Epic마다 독립적인 Task 도구 호출 → 병렬 실행!</critical>

<action>각 Epic에 대해:
  1. 해당 Epic 관련 문서 섹션 추출
     - PRD에서 해당 Epic 섹션
     - UX에서 해당 화면/플로우
     - UI에서 해당 스타일
     - ERD에서 해당 테이블
     - Architecture에서 관련 설계
     - TRD에서 기술 스택

  2. ticket-generator 서브에이전트 프롬프트 준비
</action>

<action>병렬 실행:

**단일 메시지에서 모든 Epic에 대해 Task 도구 동시 호출!**

\`\`\`xml
<!-- Epic 개수만큼 Task 도구 호출 -->
<invoke name="Task">
  <parameter name="subagent_type">general-purpose</parameter>
  <parameter name="description">EPIC-001 티켓 생성</parameter>
  <parameter name="prompt">
    ${TICKET_GENERATOR_PROMPT}

    ## 입력 데이터

    \`\`\`yaml
    epic_id: "EPIC-001"
    epic_title: "인증 시스템"
    epic_weight: "15%"

    prd_section: |
      {해당 Epic PRD 섹션 내용}

    ux_section: |
      {해당 Epic UX 섹션 내용}

    ui_section: |
      {해당 Epic UI 섹션 내용}

    trd_section: |
      {TRD 전체 - 모든 Epic이 공통으로 사용}

    architecture_section: |
      {Architecture 전체}

    erd_section: |
      {해당 Epic 관련 ERD 섹션}
    \`\`\`
  </parameter>
</invoke>

<!-- 다음 Epic도 동일하게... -->
<invoke name="Task">
  <parameter name="subagent_type">general-purpose</parameter>
  <parameter name="description">EPIC-002 티켓 생성</parameter>
  <parameter name="prompt">
    ${TICKET_GENERATOR_PROMPT}

    ## 입력 데이터
    ...
  </parameter>
</invoke>

<!-- 모든 Epic에 대해 반복 -->
\`\`\`
</action>

<action>완료 대기:
  - 모든 Task가 완료될 때까지 대기
  - 각 Epic 파일 생성 확인
</action>

<action>완료 메시지:
\`\`\`
📋 Epic별 티켓 생성 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ EPIC-001-인증시스템.md (3개 티켓)
✓ EPIC-002-상품관리.md (5개 티켓)
✓ EPIC-003-채팅.md (4개 티켓)

총 {N}개 티켓, {M}개 Epic 파일
📁 위치: {paths:epics_folder}/

⚡ 병렬 실행으로 {N}개 Epic 동시 처리!
\`\`\`
</action>
</step>

<step n="3" goal="Wave 구성">
<action>모든 Epic 파일 READ</action>

<action>의존성 분석:
  - UI 티켓 → 해당 API 티켓 의존
  - API 티켓 → DB 스키마 티켓 의존
  - 인증 필요 기능 → 인증 티켓 의존
</action>

<action>Wave 할당 알고리즘:
  1. blocked_by 없는 티켓 → Wave 1
  2. Wave 1에만 의존 → Wave 2
  3. Wave 1-2에만 의존 → Wave 3
  4. 반복...
</action>

<action>각 티켓에 wave_number 추가:
  - Epic 파일 UPDATE (Edit 도구)
  - 각 티켓 섹션에 \`wave: {N}\` 추가
</action>

<action>Wave별 요약 출력:
\`\`\`
🌊 Wave 구성 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Wave 1 (3개 티켓): 기반 작업
  - TICKET-001: Scaffolding
  - TICKET-002: DB Schema
  - TICKET-003: CI/CD

Wave 2 (5개 티켓): 인증
  - TICKET-004: Auth API
  - TICKET-005: Login UI
  ...

Wave 3 (4개 티켓): 상품
  ...

총 {M}개 Wave, {N}개 티켓
\`\`\`
</action>
</step>

<step n="4" goal="Wave별 에이전트 할당 (서브에이전트 병렬 실행)">

<critical>🚀 핵심: 각 Wave마다 독립적인 Task 도구 호출 → 병렬 실행!</critical>

<action>각 Wave에 대해:
  1. 해당 Wave의 티켓 목록 추출
  2. 각 티켓의 type, outputs 정보 수집
  3. agent-assigner 서브에이전트 프롬프트 준비
</action>

<action>병렬 실행:

**단일 메시지에서 모든 Wave에 대해 Task 도구 동시 호출!**

\`\`\`xml
<invoke name="Task">
  <parameter name="subagent_type">general-purpose</parameter>
  <parameter name="description">Wave 1 에이전트 할당</parameter>
  <parameter name="prompt">
    ${AGENT_ASSIGNER_PROMPT}

    ## 입력 데이터

    \`\`\`yaml
    wave_number: 1
    wave_title: "기반 작업"

    tickets:
      - ticket_id: TICKET-001
        epic_file: "anyon-docs/dev-plan/epics/EPIC-001-auth.md"
        type: "scaffolding"
        title: "프로젝트 스캐폴딩"
        outputs: ["package.json", "tsconfig.json"]

      - ticket_id: TICKET-002
        epic_file: "anyon-docs/dev-plan/epics/EPIC-001-auth.md"
        type: "database"
        title: "DB 스키마"
        outputs: ["prisma/schema.prisma"]
    \`\`\`
  </parameter>
</invoke>

<invoke name="Task">
  <parameter name="subagent_type">general-purpose</parameter>
  <parameter name="description">Wave 2 에이전트 할당</parameter>
  <parameter name="prompt">
    ${AGENT_ASSIGNER_PROMPT}

    ## 입력 데이터
    ...
  </parameter>
</invoke>

<!-- 모든 Wave에 대해 반복 -->
\`\`\`
</action>

<action>완료 대기 및 확인</action>

<action>완료 메시지:
\`\`\`
🤖 에이전트 할당 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Wave 1: 3개 티켓 할당 완료
✓ Wave 2: 5개 티켓 할당 완료
✓ Wave 3: 4개 티켓 할당 완료

📊 에이전트별 작업량:
  • Backend Developer: 6개 티켓
  • Frontend Developer: 5개 티켓
  • Database Architect: 1개 티켓
  • DevOps Engineer: 1개 티켓

⚡ 병렬 실행으로 {M}개 Wave 동시 처리!
\`\`\`
</action>
</step>

<step n="5" goal="API 명세서 생성">
<action>모든 Epic 파일에서 API 티켓 추출</action>

<action>API 명세서 파일 생성: {output_configuration:api_spec}

\`\`\`markdown
# API 명세서

## 기본 정보
- Base URL: \`http://localhost:3000/api\`
- 인증: Bearer Token (JWT)
- 응답 형식: \`{ success: boolean, data?: T, error?: string }\`

## 인증 API

### POST /api/auth/send-code
...

### POST /api/auth/verify
...

## 상품 API

### GET /api/products
...
\`\`\`
</action>

<action>각 Epic 파일 UPDATE:
  - API 티켓에 api_spec_reference 추가
  - Frontend 티켓에 uses_api 추가
</action>
</step>

<step n="6" goal="실행 계획 문서 생성">
<action>모든 Epic 파일 READ</action>

<action>execution-plan.md 생성: {default_output_file}

\`\`\`markdown
# 프로젝트 실행 계획

## 1️⃣ 프로젝트 개요
- 프로젝트명, 목표, 규모
- 주요 기능 수, API 수, DB 테이블 수
- 기술 스택 요약

## 2️⃣ 기술 스택
{TRD 요약}

## 3️⃣ 프로젝트 커스텀 에이전트
- Backend Developer
- Frontend Developer
- Database Architect
...
**위치**: .claude/agents/*.md

## 4️⃣ Epic 분류
| Epic | 비중 | 티켓 수 | 포함 기능 |
|------|------|--------|---------|
| EPIC-001 | 15% | 3개 | 인증 |
| EPIC-002 | 35% | 5개 | 상품 |
...

## 5️⃣ 전체 티켓
**위치**: {paths:epics_folder}/
- EPIC-001-인증시스템.md
- EPIC-002-상품관리.md
...

## 6️⃣ Wave별 실행 계획

### Wave 1 (3개 티켓)
- TICKET-001: Scaffolding [Scaffolding Engineer]
- TICKET-002: DB Schema [Database Architect]
- TICKET-003: CI/CD [DevOps Engineer]

**병렬 그룹**:
- Group A: TICKET-001, TICKET-003 (독립 실행)
- TICKET-002 (단독)

### Wave 2 (5개 티켓)
...

## 7️⃣ API 명세
**위치**: {paths:dev_api_spec}

## 8️⃣ 에이전트 할당
| 에이전트 | 담당 | Wave별 |
|---------|------|--------|
| Backend | 6개 | W1(1), W2(2), W3(3) |
| Frontend | 5개 | W2(2), W3(3) |
...

## 9️⃣ pm-executor 실행 순서
1. execution-plan.md 로드
2. Wave 1 시작 (병렬 가능 티켓 동시 실행)
3. Wave 1 완료 대기
4. Wave 2 시작
5. ... 반복
6. 최종 통합 테스트
\`\`\`
</action>

<action>✅ 완료 메시지:
\`\`\`
[ANYON-PMO-COMPLETE] Ready to execute! 🚀

✅ 완료된 산출물:
   📋 실행 계획: anyon-docs/dev-plan/execution-plan.md
   📄 API 명세: anyon-docs/dev-plan/api-spec.md
   📁 Epic 파일: anyon-docs/dev-plan/epics/*.md
   🤖 커스텀 에이전트: .claude/agents/*.md

📊 생성 통계:
   • Epic: {M}개
   • 티켓: {N}개
   • Wave: {W}개
   • API 엔드포인트: {A}개

⚡ 성능:
   • Epic 병렬 처리: {M}개 동시
   • Wave 병렬 처리: {W}개 동시
   • 예상 시간 절감: ~70%

⚡ pm-executor 실행 준비 완료
\`\`\`
</action>

<action>완료 마커 파일 생성:

WRITE: {paths:dev_plan}/ORCHESTRATOR_COMPLETE.md

\`\`\`markdown
# PM Orchestrator 완료

✅ **완료 시각**: {{timestamp}}

## 생성된 산출물

### 📋 실행 계획
- 경로: \`anyon-docs/dev-plan/execution-plan.md\`
- Wave 구성, 티켓 순서, 실행 전략

### 📄 API 명세서
- 경로: \`anyon-docs/dev-plan/api-spec.md\`
- 전체 API 엔드포인트 명세

### 📁 Epic 파일
- 경로: \`anyon-docs/dev-plan/epics/*.md\`
- Epic별 티켓 상세 내용

### 🤖 커스텀 에이전트
- 경로: \`.claude/agents/*.md\`
- 프로젝트별 커스터마이징된 에이전트

---

## 다음 단계

1. **PM Executor 실행**: 실행 계획에 따라 티켓 구현
2. **PM Reviewer 검토**: 각 Wave 완료 후 코드 리뷰
3. **최종 완료**: 모든 Wave 완료 시 \`DEVELOPMENT_COMPLETE.md\` 생성

---

*이 파일은 PM Orchestrator가 정상 완료되었음을 나타냅니다.*
*개발 실행은 PM Executor로 진행하세요.*
\`\`\`
</action>
</step>
`;

export const PM_ORCHESTRATOR_PROMPT = `
# Workflow Execution

## 1. Workflow Engine (MUST FOLLOW)
${WORKFLOW_ENGINE}

## 2. Workflow Configuration
${WORKFLOW_CONFIG}

## 3. Workflow Instructions
${INSTRUCTIONS}

<session_awareness>
**이어서 진행하기 체크리스트**:

워크플로우 시작 시 먼저 다음 파일들의 존재 여부를 확인하세요:

1. **ORCHESTRATOR_COMPLETE.md** 존재 여부 확인: \`{paths:dev_plan_root}/ORCHESTRATOR_COMPLETE.md\`
   - 존재하면: PM Orchestrator가 이미 완료됨. 사용자에게 알리고 종료.

2. **execution-plan.md** 존재 여부 확인: \`{paths:dev_execution_plan}\`
   - 존재하면: Step 6 완료 상태 → Step 6 마무리만 진행 (ORCHESTRATOR_COMPLETE.md 생성)

3. **epics 폴더** 내 파일 확인: \`{paths:epics_folder}/*.md\`
   - Epic 파일들이 존재하면: Step 2 완료 상태
   - wave 정보가 있으면: Step 3 완료 상태
   - assigned_agents 정보가 있으면: Step 4 완료 상태
   - api-spec.md가 존재하면: Step 5 완료 상태

4. **.claude/agents/** 폴더 내 에이전트 파일 확인
   - 에이전트 파일들이 존재하면: Step 0b 완료 상태

**진행 로직**:
- 위 체크리스트를 기반으로 마지막 완료된 Step 다음부터 이어서 진행
- 이미 생성된 파일은 다시 생성하지 않음
- 부분적으로 완료된 Step은 해당 Step부터 다시 진행

**예시**:
- Epic 파일만 있고 wave 정보 없음 → Step 3부터 시작
- Epic + wave + agents 완료 → Step 5부터 시작
- 모든 산출물 완료 → ORCHESTRATOR_COMPLETE.md 생성 후 종료
</session_awareness>
`;

export const PM_ORCHESTRATOR_METADATA = {
  id: 'pm-orchestrator',
  title: 'PM Orchestrator',
  description: '설계 문서를 분석하여 Epic별 통합 문서와 실행 계획 생성 (서브에이전트 병렬 실행)',
  outputPath: '{paths:dev_execution_plan}',
  filename: 'execution-plan.md',
};
