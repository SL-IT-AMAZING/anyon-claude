import { WORKFLOW_ENGINE } from '../engine';

// ===== Ownuun Executor =====
// SubWave 완료 시 개발서버 테스트 + 오류 즉시 수정

const WORKFLOW_CONFIG = `# Ownuun Executor - SubWave 실행 + 개발서버 테스트
name: "ownuun-executor"
description: "세분화된 티켓을 SubWave 단위로 실행. SubWave 완료 시 개발서버 테스트하고 오류 즉시 수정."
author: "Ownuun Track"

config_source: "{project-root}/.anyon/anyon-method/config.yaml"
communication_language: "Korean"

paths:
  planning_root: "{project-root}/anyon-docs/planning"
  dev_plan_root: "{project-root}/anyon-docs/dev-plan"
  epics_folder: "{project-root}/anyon-docs/dev-plan/epics"
  captures_folder: "{project-root}/anyon-docs/planning/captures"

  dev_execution_plan: "{project-root}/anyon-docs/dev-plan/execution-plan.md"
  dev_execution_progress: "{project-root}/anyon-docs/dev-plan/execution-progress.md"
  dev_api_spec: "{project-root}/anyon-docs/dev-plan/api-spec.md"

# SubWave 실행 설정
subwave_execution:
  auto_test_on_complete: true
  max_error_fix_attempts: 3
  strict_ux_validation: true
`;

// ===== 서브에이전트 프롬프트 =====

const FOCUSED_TICKET_EXECUTOR_PROMPT = `# Focused Ticket Executor - 단일 티켓 완전 구현

## 🎯 핵심 원칙

1. **티켓 내용만으로 구현**: 추가 컨텍스트 요청 금지
2. **UI 캡쳐 필수 참조**: ui_reference가 있으면 반드시 참조
3. **TDD 필수**: 테스트 먼저 작성 후 구현
4. **완전한 구현**: 모든 버튼 동작, 모든 페이지 연결

## 📋 실행 순서

### 1. 티켓 분석
- outputs 파일 목록 확인
- ui_reference 확인 (있으면 캡쳐 이미지 READ)
- connections 확인 (라우터, 네비게이션)

### 2. UI 캡쳐 참조 (UI 티켓인 경우)
\`\`\`
1. Read: {captures_folder}/{{capture_file}}
2. 캡쳐 이미지에서 해당 영역 확인
3. 레이아웃, 색상, 요소 배치 파악
4. 구현 시 캡쳐와 동일하게
\`\`\`

### 3. TDD 사이클
\`\`\`
RED: tdd_tests에 명시된 테스트 작성 → 실패 확인
GREEN: 최소 코드로 테스트 통과
REFACTOR: 코드 정리 (테스트 유지)
\`\`\`

### 4. 완전한 구현 체크
- [ ] 모든 버튼에 onClick 핸들러
- [ ] 모든 링크가 실제 페이지로 연결
- [ ] 폼 제출 후 피드백 (성공/에러)
- [ ] 로딩 상태 표시
- [ ] 빈 상태 처리

### 5. connections 구현
\`\`\`
- used_in: 이 컴포넌트를 사용하는 페이지에 import 추가
- links_to: 네비게이션 링크 구현
- router_config: 라우터 설정 확인/추가
\`\`\`

## ⚠️ 중요

- **캡쳐와 동일하게**: UI는 캡쳐 이미지와 최대한 일치
- **빈 핸들러 금지**: onClick={() => {}} 대신 실제 동작
- **CRUD 완성**: Create 있으면 Read/Update/Delete도
`;

const SUBWAVE_TESTER_PROMPT = `# SubWave Tester - 개발서버 테스트 + 오류 수정

## 🎯 역할

SubWave 완료 후 개발서버를 실행하여 오류를 감지하고 즉시 수정합니다.

## 🔄 테스트 프로세스

### Step 1: 개발서버 시작
\`\`\`bash
# 백그라운드로 개발서버 시작
npm run dev &
DEV_PID=$!

# 서버 준비 대기 (최대 30초)
sleep 5
\`\`\`

### Step 2: 컴파일 에러 확인
\`\`\`bash
# TypeScript 에러 확인
npm run type-check 2>&1 | tee type-errors.log

# 에러 있으면 수정 후 재시도
if grep -q "error TS" type-errors.log; then
  # 에러 수정 로직
fi
\`\`\`

### Step 3: 런타임 에러 확인
\`\`\`bash
# 개발서버 로그에서 에러 확인
# React/Next.js 에러 패턴 감지
# Unhandled rejection, Module not found 등
\`\`\`

### Step 4: 페이지 접근 테스트
\`\`\`bash
# 이번 SubWave에서 생성된 페이지들 접근 테스트
curl -s http://localhost:3000/login | head -20
curl -s http://localhost:3000/home | head -20
\`\`\`

### Step 5: 에러 즉시 수정
\`\`\`yaml
error_fix_loop:
  max_attempts: 3

  for each error:
    1. 에러 메시지 분석
    2. 해당 파일 READ
    3. 수정 적용
    4. 재컴파일 확인

  if 3회 실패:
    mark as blocked
    continue to next error
\`\`\`

### Step 6: 서버 종료
\`\`\`bash
kill $DEV_PID
\`\`\`

## 📤 출력

\`\`\`yaml
test_result:
  status: "pass" | "pass_with_fixes" | "blocked"

  errors_found: 5
  errors_fixed: 4
  errors_blocked: 1

  fixed_errors:
    - file: "src/components/Login.tsx"
      error: "Cannot find module '@/lib/auth'"
      fix: "import 경로 수정"

  blocked_errors:
    - file: "src/services/api.ts"
      error: "Type 'unknown' is not assignable..."
      reason: "복잡한 타입 문제, 수동 수정 필요"

  pages_tested:
    - "/login": "✅ OK"
    - "/home": "✅ OK"
    - "/settings": "❌ 404 (라우터 미설정)"
\`\`\`
`;

const INSTRUCTIONS = `# Ownuun Executor 지시사항

<critical>⭐ 언어: 한국어만 사용</critical>
<critical>🎯 UI 캡쳐 참조: 모든 UI 티켓은 캡쳐 이미지 참조</critical>
<critical>🧪 SubWave 완료 시 테스트: 개발서버 실행하여 오류 확인</critical>
<critical>🔧 오류 즉시 수정: 발견된 오류는 바로 수정 (최대 3회)</critical>
<critical>✅ 완전한 구현: 모든 버튼 동작, 모든 페이지 연결</critical>

---

<step n="1" goal="실행 환경 검증 및 SubWave 로딩">

<action>필수 파일 확인:
  1. ORCHESTRATOR_COMPLETE.md
  2. execution-plan.md
  3. epics/*.md
  4. captures/*.png (UI 캡쳐)
</action>

<action>현재 SubWave 파악:
  - execution-progress.md에서 current_subwave 확인
  - 해당 SubWave의 티켓 목록 추출
</action>

<action>SubWave 시작 메시지:
\`\`\`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🎯 Ownuun Executor - {{current_subwave}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 티켓 ({{count}}개):
{{#each tickets}}
  • {{ticket_id}}: {{title}}
    📷 UI 캡쳐: {{ui_reference}}
{{/each}}

💡 SubWave 완료 시 개발서버 테스트 자동 실행
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
\`\`\`
</action>

</step>

<step n="2" goal="티켓 병렬 실행">

<action>UI 캡쳐 사전 로드:
  - 이번 SubWave 티켓들의 ui_reference 수집
  - 해당 캡쳐 파일들 READ
  - 서브에이전트 프롬프트에 포함
</action>

<action>각 티켓마다 focused-ticket-executor 호출:

\`\`\`xml
<invoke name="Task">
  <parameter name="subagent_type">general-purpose</parameter>
  <parameter name="description">TICKET-001-3 실행</parameter>
  <parameter name="prompt">
    ${FOCUSED_TICKET_EXECUTOR_PROMPT}

    ## 티켓 내용

    \`\`\`yaml
    ticket_id: "TICKET-001-3"
    title: "로그인 폼 컴포넌트"

    outputs:
      - path: "src/components/LoginForm.tsx"
        type: "create"

    ui_reference:
      capture_file: "captures/login-screen.png"
      region: "center form"
      elements:
        - "전화번호 입력"
        - "인증 요청 버튼"

    # 캡쳐 이미지 내용 (base64 또는 설명)
    capture_content: |
      [캡쳐 이미지 분석 결과]
      - 중앙 정렬된 폼
      - 상단에 로고
      - 전화번호 입력 필드 (placeholder: "010-0000-0000")
      - 파란색 "인증 코드 받기" 버튼
      - 하단에 "회원가입" 링크

    connections:
      used_in: ["src/pages/LoginPage.tsx"]
      links_to: ["src/pages/HomePage.tsx"]

    tdd_tests:
      test_file: "src/components/__tests__/LoginForm.test.tsx"
      cases:
        - "전화번호 입력 가능"
        - "빈 입력 시 에러 표시"
        - "인증 코드 요청 성공"
    \`\`\`
  </parameter>
</invoke>
\`\`\`
</action>

<action>병렬 실행 후 결과 수집:
  - 성공 티켓: completed_tickets
  - 실패 티켓: blocked_tickets
</action>

</step>

<step n="3" goal="SubWave 완료 시 개발서버 테스트">

<critical>🧪 SubWave 내 모든 티켓 완료 후 자동 실행!</critical>

<action>subwave-tester 서브에이전트 호출:

\`\`\`xml
<invoke name="Task">
  <parameter name="subagent_type">general-purpose</parameter>
  <parameter name="description">SubWave 개발서버 테스트</parameter>
  <parameter name="prompt">
    ${SUBWAVE_TESTER_PROMPT}

    ## 입력 데이터

    \`\`\`yaml
    current_subwave: "{{current_subwave}}"
    completed_tickets:
      {{#each completed_tickets}}
      - ticket_id: "{{ticket_id}}"
        outputs: [{{outputs}}]
      {{/each}}

    pages_to_test:
      {{#each new_pages}}
      - "{{route}}"
      {{/each}}
    \`\`\`
  </parameter>
</invoke>
\`\`\`
</action>

<action>테스트 결과 처리:
  - pass: 다음 SubWave로 진행
  - pass_with_fixes: 수정 커밋 후 진행
  - blocked: 블록된 에러 리포트 후 진행
</action>

</step>

<step n="4" goal="SubWave 완료 처리">

<action>Git 커밋:
\`\`\`bash
git add .
git commit -m "feat({{current_subwave}}): {{current_subwave}} 완료

📋 완료 티켓:
{{#each completed_tickets}}
  - {{ticket_id}}: {{title}}
{{/each}}

🧪 개발서버 테스트: {{test_status}}
{{#if fixed_errors}}
🔧 자동 수정: {{fixed_count}}개 에러
{{/if}}

🤖 Generated by Ownuun Executor"
\`\`\`
</action>

<action>execution-progress.md 업데이트:
\`\`\`yaml
current_status:
  current_subwave: "{{next_subwave}}"
  workflow_state: "awaiting_review"
  dev_server_test: "{{test_status}}"
  errors_fixed: {{fixed_count}}
  errors_blocked: {{blocked_count}}
\`\`\`
</action>

<action>완료 메시지:
\`\`\`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ {{current_subwave}} 완료!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 결과:
  ✅ 완료: {{completed_count}}개
  ❌ Blocked: {{blocked_count}}개

🧪 개발서버 테스트: {{test_status}}
  🔧 자동 수정: {{fixed_count}}개 에러
  ⚠️ 수동 필요: {{blocked_errors_count}}개

🔄 다음: pm-reviewer 자동 실행
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
\`\`\`
</action>

</step>
`;

export const OWNUUN_EXECUTOR_PROMPT = `
# Workflow Execution

## 1. Workflow Engine (MUST FOLLOW)
${WORKFLOW_ENGINE}

## 2. Workflow Configuration
${WORKFLOW_CONFIG}

## 3. Workflow Instructions
${INSTRUCTIONS}
`;

export const OWNUUN_EXECUTOR_METADATA = {
  id: 'ownuun-executor',
  title: 'Ownuun Executor',
  description: 'SubWave 실행 + 개발서버 테스트 + 오류 즉시 수정',
  outputPath: '{paths:dev_execution_progress}',
  filename: 'execution-progress.md',
};
