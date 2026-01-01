import { WORKFLOW_ENGINE } from '../engine';

// ===== Ownuun2 Executor =====
// 핵심 차이점: 티켓별 플랜→실행 워크플로우 + 서브에이전트 병렬 실행

const WORKFLOW_CONFIG = `# Ownuun2 Executor - 티켓별 플랜→실행 워크플로우
name: "ownuun2-executor"
description: "각 티켓마다 플랜 에이전트가 구현 계획을 수립하고, 실행 에이전트가 bypass 모드로 구현. 의존성 레벨별 병렬 실행."
author: "Ownuun2 Track"

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

# 실행 설정
execution:
  mode: "ticket-plan"  # 티켓별 플랜→실행
  parallel: true       # 병렬 실행 활성화
  auto_approve_plan: true  # 플랜 자동 승인
`;

// ===== 플랜 에이전트 프롬프트 =====
const TICKET_PLANNER_PROMPT = `# Ticket Planner - 티켓별 구현 계획 수립

## 🎯 역할

주어진 티켓을 분석하고 상세한 구현 계획을 수립합니다.

## 📋 출력 형식

\`\`\`markdown
# 구현 계획: {{ticket_id}}

## 1. 분석 요약
- 목적: {{티켓의 목적}}
- 복잡도: {{easy|medium|hard}}
- 예상 시간: {{분}}분

## 2. 구현 단계
1. {{단계 1}}
   - 상세: {{구체적인 작업 내용}}
   - 파일: {{대상 파일}}
2. {{단계 2}}
   ...

## 3. 파일 변경사항
| 파일 | 액션 | 설명 |
|------|------|------|
| {{path}} | create/modify | {{변경 내용}} |

## 4. 의존성 확인
- 필요한 import: {{목록}}
- 참조할 기존 코드: {{목록}}

## 5. 테스트 계획
- [ ] {{테스트 케이스 1}}
- [ ] {{테스트 케이스 2}}

## 6. 주의사항
- {{주의할 점}}
\`\`\`

## ⚠️ 중요

- 플랜은 실행 에이전트가 **컨텍스트 없이** 따라할 수 있도록 구체적으로
- 모든 파일 경로는 절대 경로 또는 프로젝트 루트 기준 상대 경로
- UI 티켓은 캡쳐 이미지 분석 결과 포함
`;

// ===== 실행 에이전트 프롬프트 =====
const TICKET_EXECUTOR_PROMPT = `# Ticket Executor - 플랜 기반 티켓 구현

## 🎯 역할

주어진 플랜에 따라 티켓을 구현합니다. Permission bypass 모드로 실행됩니다.

## 📋 실행 순서

### 1. 플랜 확인
- 구현 단계 목록 확인
- 파일 변경사항 확인
- 의존성 확인

### 2. TDD 사이클 (테스트가 있는 경우)
\`\`\`
RED: 테스트 작성 → 실패 확인
GREEN: 최소 코드로 테스트 통과
REFACTOR: 코드 정리 (테스트 유지)
\`\`\`

### 3. 구현
- 플랜의 각 단계를 순서대로 실행
- 파일 생성/수정
- Import 추가

### 4. 검증
- TypeScript 컴파일 확인 (npm run type-check)
- 테스트 실행 (npm test)
- 린트 확인 (npm run lint)

### 5. 완료 보고
\`\`\`yaml
ticket_id: "{{ticket_id}}"
status: "completed" | "failed" | "partial"
files_modified:
  - path: "{{path}}"
    lines_changed: {{n}}
errors:
  - "{{에러 메시지}}" (있는 경우)
notes: "{{추가 메모}}"
\`\`\`

## ⚠️ 중요

- **플랜만 따르기**: 플랜에 없는 작업은 하지 않음
- **완전한 구현**: 모든 버튼 동작, 모든 링크 연결
- **빈 핸들러 금지**: onClick={() => {}} 대신 실제 동작
`;

// ===== SubWave 테스터 프롬프트 (레벨 완료 시) =====
const LEVEL_TESTER_PROMPT = `# Level Tester - 레벨 완료 후 통합 테스트

## 🎯 역할

하나의 레벨(병렬 그룹)이 완료된 후 통합 테스트를 수행합니다.

## 🔄 테스트 프로세스

### Step 1: 개발서버 시작
\`\`\`bash
npm run dev &
sleep 5
\`\`\`

### Step 2: 컴파일 에러 확인
\`\`\`bash
npm run type-check 2>&1 | tee type-errors.log
\`\`\`

### Step 3: 런타임 에러 확인
- 개발서버 로그 분석
- React 에러 패턴 감지

### Step 4: 페이지 접근 테스트
\`\`\`bash
# 이번 레벨에서 생성된 페이지들 접근 테스트
curl -s http://localhost:3000/{{route}} | head -20
\`\`\`

### Step 5: 에러 수정 (최대 3회)
- 에러 발견 시 즉시 수정 시도
- 3회 실패 시 blocked로 표시

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
\`\`\`
`;

const INSTRUCTIONS = `# Ownuun2 Executor 지시사항

<critical>⭐ 언어: 한국어만 사용</critical>
<critical>🎯 티켓별 플랜→실행: 각 티켓마다 플랜 수립 후 구현</critical>
<critical>⚡ 병렬 실행: 같은 레벨의 티켓들은 서브에이전트로 병렬 처리</critical>
<critical>🔧 자동 승인: 플랜 생성 후 자동으로 실행 단계 진행</critical>

---

<step n="1" goal="실행 환경 검증 및 티켓 로딩">

<action>필수 파일 확인:
  1. ORCHESTRATOR_COMPLETE.md
  2. execution-plan.md
  3. epics/*.md
  4. captures/*.png (UI 캡쳐)
</action>

<action>execution-plan.md에서 Parallel Execution Groups 파싱:
\`\`\`yaml
levels:
  - level: 0
    groups:
      - group_id: "G1"
        tickets: ["TICKET-001-1", "TICKET-002-1"]
      - group_id: "G2"
        tickets: ["TICKET-003-1"]
  - level: 1
    groups:
      - group_id: "G3"
        tickets: ["TICKET-001-2"]
\`\`\`
</action>

<action>현재 진행 상태 확인:
  - execution-progress.md에서 current_level, completed_tickets 확인
  - 이어서 실행할 레벨/티켓 결정
</action>

</step>

<step n="2" goal="레벨별 병렬 실행 (핵심)">

<critical>⚡ 각 레벨은 순차, 레벨 내 티켓들은 병렬!</critical>

<action>현재 레벨의 모든 티켓에 대해 **병렬로** 플랜+실행 에이전트 호출:

\`\`\`xml
<!-- 예: Level 0에 3개 티켓이 있는 경우, 한 번에 3개 Task 호출 -->

<invoke name="Task">
  <parameter name="subagent_type">Plan</parameter>
  <parameter name="description">TICKET-001-1 플랜</parameter>
  <parameter name="run_in_background">true</parameter>
  <parameter name="prompt">
    ${TICKET_PLANNER_PROMPT}

    ## 티켓 정보
    \`\`\`yaml
    {{ticket_yaml}}
    \`\`\`

    ## UI 캡쳐 (있는 경우)
    {{capture_content}}
  </parameter>
</invoke>

<invoke name="Task">
  <parameter name="subagent_type">Plan</parameter>
  <parameter name="description">TICKET-002-1 플랜</parameter>
  <parameter name="run_in_background">true</parameter>
  <parameter name="prompt">
    ${TICKET_PLANNER_PROMPT}

    ## 티켓 정보
    \`\`\`yaml
    {{ticket_yaml}}
    \`\`\`
  </parameter>
</invoke>

<!-- ... 레벨 내 모든 티켓 병렬 호출 -->
\`\`\`
</action>

<action>모든 플랜 에이전트 완료 대기 후, 실행 에이전트 **병렬** 호출:

\`\`\`xml
<invoke name="Task">
  <parameter name="subagent_type">general-purpose</parameter>
  <parameter name="description">TICKET-001-1 구현</parameter>
  <parameter name="run_in_background">true</parameter>
  <parameter name="prompt">
    ${TICKET_EXECUTOR_PROMPT}

    ## 플랜 내용
    {{plan_from_planner}}

    ## 티켓 정보
    \`\`\`yaml
    {{ticket_yaml}}
    \`\`\`

    ⚠️ Permission bypass 모드로 실행됩니다.
    모든 파일 수정, 테스트 실행이 자동 승인됩니다.
  </parameter>
</invoke>

<!-- ... 레벨 내 모든 티켓 병렬 호출 -->
\`\`\`
</action>

</step>

<step n="3" goal="레벨 완료 시 통합 테스트">

<action>현재 레벨의 모든 티켓 완료 후 level-tester 호출:

\`\`\`xml
<invoke name="Task">
  <parameter name="subagent_type">general-purpose</parameter>
  <parameter name="description">Level {{level}} 통합 테스트</parameter>
  <parameter name="prompt">
    ${LEVEL_TESTER_PROMPT}

    ## 입력 데이터
    \`\`\`yaml
    current_level: {{level}}
    completed_tickets:
      {{#each completed_tickets}}
      - ticket_id: "{{ticket_id}}"
        outputs: [{{outputs}}]
        status: "{{status}}"
      {{/each}}
    \`\`\`
  </parameter>
</invoke>
\`\`\`
</action>

<action>테스트 결과 처리:
  - pass: 다음 레벨로 진행
  - pass_with_fixes: 수정 커밋 후 진행
  - blocked: 블록된 에러 리포트 후 진행
</action>

</step>

<step n="4" goal="레벨 완료 처리 및 다음 레벨 진행">

<action>Git 커밋:
\`\`\`bash
git add .
git commit -m "feat(level-{{level}}): Level {{level}} 완료

📋 완료 티켓:
{{#each completed_tickets}}
  - {{ticket_id}}: {{title}}
{{/each}}

🧪 통합 테스트: {{test_status}}
{{#if fixed_errors}}
🔧 자동 수정: {{fixed_count}}개 에러
{{/if}}

🤖 Generated by Ownuun2 Executor"
\`\`\`
</action>

<action>execution-progress.md 업데이트:
\`\`\`yaml
current_status:
  current_level: {{next_level}}
  completed_levels: [0, 1, ...]
  workflow_state: "executing" | "awaiting_review"

tickets:
  {{#each all_tickets}}
  - id: "{{ticket_id}}"
    status: "completed" | "in_progress" | "pending" | "blocked"
    plan_status: "done" | "pending"
    execution_status: "done" | "pending" | "failed"
  {{/each}}
\`\`\`
</action>

<action>다음 레벨이 있으면 Step 2로 돌아가서 반복</action>

</step>

<step n="5" goal="전체 완료 처리">

<check if="all_levels_completed">
<action>완료 메시지:
\`\`\`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ Ownuun2 Executor 완료!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 실행 결과:
  📈 총 레벨: {{total_levels}}
  ✅ 완료 티켓: {{completed_count}}개
  ❌ Blocked: {{blocked_count}}개

⚡ 병렬 실행 효율:
  - 최대 동시 실행: {{max_parallelism}}개 티켓
  - 예상 순차 시간: {{sequential_time}}분
  - 실제 실행 시간: {{actual_time}}분

🔄 다음: ownuun2-reviewer 자동 실행
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
\`\`\`
</action>
</check>

</step>
`;

export const OWNUUN2_EXECUTOR_PROMPT = `
# Workflow Execution

## 1. Workflow Engine (MUST FOLLOW)
${WORKFLOW_ENGINE}

## 2. Workflow Configuration
${WORKFLOW_CONFIG}

## 3. Workflow Instructions
${INSTRUCTIONS}
`;

export const OWNUUN2_EXECUTOR_METADATA = {
  id: 'ownuun2-executor',
  title: 'Ownuun2 Executor',
  description: '티켓별 플랜→실행 + 서브에이전트 병렬 실행',
  outputPath: '{paths:dev_execution_progress}',
  filename: 'execution-progress.md',
};
