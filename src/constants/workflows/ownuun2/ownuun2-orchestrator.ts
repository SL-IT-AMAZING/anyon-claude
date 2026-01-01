import { WORKFLOW_ENGINE } from '../engine';

// ===== Ownuun2 Orchestrator =====
// ownuun-orchestrator와 동일 - 티켓 생성 로직은 그대로 유지

const WORKFLOW_CONFIG = `# Ownuun2 Orchestrator - 세분화된 티켓 생성 워크플로우
name: "ownuun2-orchestrator"
description: "설계 문서를 분석하여 극단적으로 세분화된 티켓을 생성. 서브에이전트가 컨텍스트 없이도 완전히 구현할 수 있도록 구체적 지침 포함."
author: "Ownuun2 Track"

config_source: "{project-root}/.anyon/anyon-method/config.yaml"
communication_language: "Korean"

paths:
  planning_root: "{project-root}/anyon-docs/planning"
  dev_plan_root: "{project-root}/anyon-docs/dev-plan"
  epics_folder: "{project-root}/anyon-docs/dev-plan/epics"
  captures_folder: "{project-root}/anyon-docs/planning/captures"

  planning_prd: "{project-root}/anyon-docs/planning/prd.md"
  planning_ux: "{project-root}/anyon-docs/planning/ui-ux.html"
  planning_design: "{project-root}/anyon-docs/planning/design-guide.md"
  planning_trd: "{project-root}/anyon-docs/planning/trd.md"
  planning_architecture: "{project-root}/anyon-docs/planning/architecture.md"
  planning_erd: "{project-root}/anyon-docs/planning/erd.md"

  dev_execution_plan: "{project-root}/anyon-docs/dev-plan/execution-plan.md"
  dev_api_spec: "{project-root}/anyon-docs/dev-plan/api-spec.md"
`;

// ===== 서브에이전트 프롬프트 =====

const GRANULAR_TICKET_GENERATOR_PROMPT = `# Granular Ticket Generator - 극단적 세분화 티켓 생성

## 🎯 핵심 원칙

1. **30분 규칙**: 각 티켓은 30분 이내 완료 가능한 단위
2. **단일 파일 규칙**: 한 티켓이 여러 파일 수정 시 분할
3. **구체적 지침**: 서브에이전트가 추측 없이 구현 가능하도록

## 📋 티켓 상세도 요구사항

각 티켓에 필수 포함:

### 1. 정확한 파일 정보
\`\`\`yaml
outputs:
  - path: "src/components/LoginForm.tsx"
    type: "create"  # create | modify
    lines: ~50-80   # 예상 라인 수
\`\`\`

### 2. 완전한 Import 목록
\`\`\`typescript
// 필요한 모든 import
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// ...
\`\`\`

### 3. 구현 스켈레톤 (함수 시그니처)
\`\`\`typescript
interface LoginFormProps {
  onSuccess: (user: User) => void;
  onError: (error: string) => void;
}

export function LoginForm({ onSuccess, onError }: LoginFormProps) {
  // 구현할 상태
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');

  // 구현할 함수
  const handleSendCode = async () => {
    // TODO: API 호출
  };

  // TODO: JSX 반환
}
\`\`\`

### 4. UI 캡쳐 참조 (UI 티켓)
\`\`\`yaml
ui_reference:
  capture_file: "captures/login-screen.png"
  region: "center form area"
  elements:
    - "전화번호 입력 필드"
    - "인증 코드 요청 버튼"
    - "로그인 버튼"
\`\`\`

### 5. 연결 정보 (라우터, 네비게이션)
\`\`\`yaml
connections:
  used_in:
    - "src/pages/auth/LoginPage.tsx"
  links_to:
    - "src/pages/home/HomePage.tsx"
  router_config:
    path: "/login"
    protected: false
\`\`\`

### 6. TDD 테스트 케이스
\`\`\`yaml
tdd_tests:
  test_file: "src/components/__tests__/LoginForm.test.tsx"
  cases:
    - name: "전화번호 입력 가능"
      type: "unit"
    - name: "빈 전화번호로 제출 시 에러"
      type: "error"
    - name: "올바른 인증 코드로 로그인 성공"
      type: "integration"
\`\`\`

### 7. 예상 에러 & 해결책
\`\`\`yaml
potential_errors:
  - error: "Module not found: @/components/ui/button"
    solution: "npx shadcn@latest add button 실행"
  - error: "Type 'User' is not defined"
    solution: "types/user.ts에서 User 타입 import"
\`\`\`

## 🔪 분할 기준

### 레이어별 분할
\`\`\`
TICKET-001 (인증 시스템)
  → TICKET-001-1: Prisma 스키마 (prisma/schema.prisma)
  → TICKET-001-2: API 라우트 (src/api/auth.ts)
  → TICKET-001-3: 서비스 로직 (src/services/auth.ts)
  → TICKET-001-4: 폼 컴포넌트 (src/components/LoginForm.tsx)
  → TICKET-001-5: 페이지 컴포넌트 (src/pages/LoginPage.tsx)
\`\`\`

### 기능별 분할
\`\`\`
TICKET-002 (로그인 폼)
  → TICKET-002-1: 전화번호 입력 + 유효성 검사
  → TICKET-002-2: 인증 코드 요청 버튼 + API 연동
  → TICKET-002-3: 인증 코드 입력 + 타이머
  → TICKET-002-4: 로그인 완료 처리 + 리다이렉트
\`\`\`

## ⚠️ 중요

- **컨텍스트 독립성**: 서브에이전트는 이 티켓만 보고 구현
- **추측 금지**: 모든 정보가 티켓에 명시되어야 함
- **캡쳐 참조 필수**: UI 티켓은 반드시 captures/ 이미지 참조
`;

const INSTRUCTIONS = `# Ownuun2 Orchestrator 지시사항

<critical>⭐ 언어: 한국어만 사용</critical>
<critical>🎯 극단적 세분화: 30분 이내 완료 가능한 단위로 분할</critical>
<critical>📷 UI 캡쳐 참조: captures/ 폴더 이미지 필수 참조</critical>
<critical>⚡ 서브에이전트 독립성: 컨텍스트 없이 구현 가능하도록</critical>

---

<step n="0" goal="설계 문서 및 UI 캡쳐 로딩">

<action>필수 문서 로드:
  1. PRD: {paths:planning_prd}
  2. UX: {paths:planning_ux}
  3. UI Design: {paths:planning_design}
  4. TRD: {paths:planning_trd}
  5. Architecture: {paths:planning_architecture}
  6. ERD: {paths:planning_erd}
</action>

<action>UI 캡쳐 확인:
  1. {paths:captures_folder}/ 폴더 존재 확인
  2. 캡쳐 파일 목록 수집
  3. 각 캡쳐와 UX 화면 매핑
</action>

<check if="captures folder empty">
  <action>경고: UI 캡쳐가 없습니다. UX 단계에서 playwright-skill로 캡쳐를 생성하세요.</action>
</check>

</step>

<step n="1" goal="Epic 식별 및 세분화">

<action>PRD에서 주요 기능 영역 추출</action>

<action>각 Epic을 Sub-Epic으로 세분화:
  - Epic 하나가 너무 크면 (5개 이상 화면) Sub-Epic으로 분할
  - 예: EPIC-001 인증 → EPIC-001-a 로그인, EPIC-001-b 회원가입
</action>

</step>

<step n="2" goal="극단적 티켓 세분화 (서브에이전트 병렬)">

<action>각 Epic/Sub-Epic에 대해 granular-ticket-generator 호출:

\`\`\`xml
<invoke name="Task">
  <parameter name="subagent_type">general-purpose</parameter>
  <parameter name="description">EPIC-001 세분화 티켓 생성</parameter>
  <parameter name="prompt">
    ${GRANULAR_TICKET_GENERATOR_PROMPT}

    ## 입력 데이터

    epic_id: "EPIC-001"
    epic_title: "인증 시스템"

    # 관련 설계 문서 섹션
    prd_section: |
      {{해당 Epic PRD}}

    ux_section: |
      {{해당 Epic UX}}

    ui_captures: |
      # 참조할 UI 캡쳐 목록
      - captures/login-screen.png
      - captures/signup-screen.png

    architecture_section: |
      {{아키텍처}}

    erd_section: |
      {{ERD}}
  </parameter>
</invoke>
\`\`\`
</action>

<action>각 티켓에 ui_reference 필드 추가:
  - UI 티켓: 해당 캡쳐 파일 경로
  - 참조할 요소 (버튼, 입력 필드 등) 명시
</action>

</step>

<step n="3" goal="의존성 그래프 기반 병렬 그룹 구성">

<action>티켓 간 의존성 분석:
  - DB 스키마 → API → 서비스 → UI 순서
  - 같은 파일 수정하는 티켓은 순차 실행
</action>

<action>ParallelGroup 구성 (dependencyGraph.ts 활용):
  - blocked_by: 의존하는 티켓 ID 목록
  - outputs: 생성/수정하는 파일 목록
  - 파일 충돌 없는 티켓들만 같은 그룹
</action>

<action>각 티켓에 parallel_group 필드 추가:
\`\`\`yaml
parallel_group:
  level: 0  # 0부터 시작, 낮을수록 먼저 실행
  group_id: "G1"  # 같은 그룹은 병렬 실행 가능
\`\`\`
</action>

</step>

<step n="4" goal="실행 계획 생성">

<action>execution-plan.md 생성:

\`\`\`markdown
# Ownuun2 Track 실행 계획

## 특징
- 극단적 세분화된 티켓 (30분 단위)
- 티켓별 플랜→실행 워크플로우
- 서브에이전트 병렬 실행

## Epic 목록
...

## Parallel Execution Groups
### Level 0 (3개 티켓, 병렬 실행)
- G1: TICKET-001-1, TICKET-002-1 [파일 충돌 없음]
- G2: TICKET-003-1 [단독]

### Level 1 (2개 티켓)
- G3: TICKET-001-2, TICKET-002-2

...

## UI 캡쳐 체크리스트
- [ ] captures/login-screen.png → TICKET-003-4
- [ ] captures/home-screen.png → TICKET-005-2
...
\`\`\`
</action>

<action>완료 마커 생성: ORCHESTRATOR_COMPLETE.md</action>

</step>
`;

export const OWNUUN2_ORCHESTRATOR_PROMPT = `
# Workflow Execution

## 1. Workflow Engine (MUST FOLLOW)
${WORKFLOW_ENGINE}

## 2. Workflow Configuration
${WORKFLOW_CONFIG}

## 3. Workflow Instructions
${INSTRUCTIONS}
`;

export const OWNUUN2_ORCHESTRATOR_METADATA = {
  id: 'ownuun2-orchestrator',
  title: 'Ownuun2 Orchestrator',
  description: '극단적 세분화 티켓 생성 + 의존성 기반 병렬 그룹 구성',
  outputPath: '{paths:dev_execution_plan}',
  filename: 'execution-plan.md',
};
