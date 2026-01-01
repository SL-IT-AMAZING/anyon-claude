import { WORKFLOW_ENGINE } from '../engine';

// ===== Ownuun2 Reviewer =====
// UI 캡쳐 기반 엄격한 UX/UI 검증 + 완전성 검증 (ownuun-reviewer와 동일)

const WORKFLOW_CONFIG = `# Ownuun2 Reviewer - 엄격한 UX/UI 검증
name: "ownuun2-reviewer"
description: "UI 캡쳐와 실제 구현 비교. 모든 컴포넌트 활용, 모든 페이지 연결, 모든 버튼 동작 검증."
author: "Ownuun2 Track"

config_source: "{project-root}/.anyon/anyon-method/config.yaml"
communication_language: "Korean"

paths:
  planning_root: "{project-root}/anyon-docs/planning"
  captures_folder: "{project-root}/anyon-docs/planning/captures"
  dev_plan_root: "{project-root}/anyon-docs/dev-plan"

  planning_ux: "{project-root}/anyon-docs/planning/ui-ux.html"
  planning_design: "{project-root}/anyon-docs/planning/design-guide.md"

  dev_execution_progress: "{project-root}/anyon-docs/dev-plan/execution-progress.md"

# 검증 설정
validation:
  strict_ux: true
  require_all_buttons_work: true
  require_all_pages_connected: true
  require_all_components_used: true
  require_crud_complete: true
`;

// ===== 서브에이전트 프롬프트 =====

const UI_CAPTURE_VALIDATOR_PROMPT = `# UI Capture Validator - 캡쳐 vs 실제 구현 비교

## 🎯 역할

UI 캡쳐 이미지와 실제 구현된 화면을 비교하여 불일치를 찾습니다.

## 📋 검증 항목

### 1. 레이아웃 비교
- 요소 배치 (상단/중앙/하단)
- 정렬 (좌측/중앙/우측)
- 간격 (margin, padding)

### 2. 컴포넌트 존재 여부
- 캡쳐에 있는 모든 요소가 구현에도 있는가?
- 누락된 버튼, 입력 필드, 텍스트?

### 3. 스타일 일치
- 색상 (primary, secondary, background)
- 폰트 크기
- 버튼 스타일

### 4. 반응형 (해당 시)
- 모바일 레이아웃
- 데스크톱 레이아웃

## 📤 출력

\`\`\`yaml
issues:
  - capture_file: "captures/login-screen.png"
    page_file: "src/pages/LoginPage.tsx"
    type: "missing_element"
    description: "캡쳐에 있는 '비밀번호 찾기' 링크가 구현에 없음"
    fix_suggestion: "LoginPage.tsx 하단에 '비밀번호 찾기' 링크 추가"
    can_auto_fix: true

  - capture_file: "captures/home-screen.png"
    page_file: "src/pages/HomePage.tsx"
    type: "layout_mismatch"
    description: "캡쳐에서는 3열 그리드인데 구현은 2열"
    fix_suggestion: "grid-cols-2 → grid-cols-3 변경"
    can_auto_fix: true
\`\`\`
`;

const COMPLETENESS_VALIDATOR_PROMPT = `# Completeness Validator - 완전성 검증

## 🎯 역할

모든 컴포넌트가 활용되고, 모든 페이지가 연결되고, 모든 버튼이 동작하는지 검증합니다.

## 📋 검증 항목

### 1. 컴포넌트 활용도
\`\`\`
1. src/components/ 폴더의 모든 컴포넌트 목록 추출
2. 각 컴포넌트가 어디서 사용되는지 grep
3. 미사용 컴포넌트 발견 시 이슈 생성
\`\`\`

### 2. 페이지 연결성
\`\`\`
1. 라우터 설정에서 모든 경로 추출
2. 각 경로로 이동하는 링크/버튼 존재 여부 확인
3. 고립된 페이지 (어디서도 링크 없음) 발견 시 이슈
\`\`\`

### 3. 버튼/링크 동작
\`\`\`
1. 모든 onClick, onSubmit 핸들러 추출
2. 빈 핸들러 () => {} 찾기
3. 실제 동작 없는 버튼 발견 시 이슈
\`\`\`

### 4. CRUD 완성도
\`\`\`
1. Create 기능 발견 시 → Read 존재 확인
2. Read (목록) 발견 시 → 상세 페이지 존재 확인
3. 상세 페이지 발견 시 → Update/Delete 존재 확인
4. 폼 제출 후 → 결과 페이지/리다이렉트 확인
\`\`\`

### 5. 상태 처리
\`\`\`
1. 목록 컴포넌트 → 빈 상태(empty state) 있는가?
2. API 호출 → 로딩 상태 있는가?
3. 에러 가능성 → 에러 상태 있는가?
\`\`\`

## 📤 출력

\`\`\`yaml
issues:
  - type: "unused_component"
    component: "src/components/Avatar.tsx"
    fix_suggestion: "UserProfile.tsx에서 Avatar 사용"
    can_auto_fix: true

  - type: "orphan_page"
    page: "src/pages/SettingsPage.tsx"
    route: "/settings"
    fix_suggestion: "Header.tsx에 설정 링크 추가"
    can_auto_fix: true

  - type: "empty_handler"
    file: "src/components/ProductCard.tsx"
    line: 45
    code: "onClick={() => {}}"
    fix_suggestion: "navigate('/products/' + product.id) 추가"
    can_auto_fix: true

  - type: "incomplete_crud"
    entity: "Product"
    has: ["create", "read_list"]
    missing: ["read_detail", "update", "delete"]
    fix_suggestion: "ProductDetailPage, EditProductPage 생성 필요"
    can_auto_fix: false
\`\`\`
`;

const INSTRUCTIONS = `# Ownuun2 Reviewer 지시사항

<critical>⭐ 언어: 한국어만 사용</critical>
<critical>📷 UI 캡쳐 검증: 캡쳐와 실제 구현 비교</critical>
<critical>✅ 완전성 검증: 모든 컴포넌트, 페이지, 버튼</critical>
<critical>🔧 즉시 수정: 이슈 발견 시 자동 수정</critical>

---

<step n="1" goal="리뷰 대상 파악">

<action>execution-progress.md에서 현재 레벨 확인</action>

<action>리뷰 대상 파일 수집:
  - 이번 레벨에서 생성/수정된 파일 목록
  - 해당 파일들의 ui_reference (캡쳐 파일)
</action>

<action>시작 메시지:
\`\`\`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔍 Ownuun2 Reviewer - Level {{current_level}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 리뷰 대상: {{file_count}}개 파일
📷 비교할 캡쳐: {{capture_count}}개

🔍 검증 영역:
  • UI 캡쳐 vs 실제 구현
  • 컴포넌트 활용도
  • 페이지 연결성
  • 버튼/링크 동작
  • CRUD 완성도
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
\`\`\`
</action>

</step>

<step n="2" goal="UI 캡쳐 검증 (병렬)">

<action>각 캡쳐 파일에 대해 ui-capture-validator 호출:

\`\`\`xml
<invoke name="Task">
  <parameter name="subagent_type">general-purpose</parameter>
  <parameter name="model">haiku</parameter>
  <parameter name="description">캡쳐 검증: login-screen.png</parameter>
  <parameter name="prompt">
    ${UI_CAPTURE_VALIDATOR_PROMPT}

    ## 입력 데이터

    \`\`\`yaml
    capture_file: "captures/login-screen.png"
    capture_content: |
      [캡쳐 이미지 분석]
      - 화면 중앙에 로그인 폼
      - 상단: 로고
      - 중앙: 전화번호 입력, 인증 버튼
      - 하단: 회원가입 링크, 비밀번호 찾기

    corresponding_files:
      - "src/pages/LoginPage.tsx"
      - "src/components/LoginForm.tsx"
    \`\`\`
  </parameter>
</invoke>
\`\`\`
</action>

</step>

<step n="3" goal="완전성 검증">

<action>completeness-validator 호출:

\`\`\`xml
<invoke name="Task">
  <parameter name="subagent_type">general-purpose</parameter>
  <parameter name="description">완전성 검증</parameter>
  <parameter name="prompt">
    ${COMPLETENESS_VALIDATOR_PROMPT}

    ## 입력 데이터

    \`\`\`yaml
    components_folder: "src/components/"
    pages_folder: "src/pages/"
    router_file: "src/App.tsx"  # or src/routes.tsx

    changed_files:
      {{#each changed_files}}
      - "{{this}}"
      {{/each}}
    \`\`\`
  </parameter>
</invoke>
\`\`\`
</action>

</step>

<step n="4" goal="이슈 수정">

<action>모든 이슈 통합 및 분류:
  - auto_fixable: can_auto_fix == true
  - manual_required: can_auto_fix == false
</action>

<action>자동 수정 가능한 이슈 처리:

**UI 불일치 수정:**
- missing_element → 해당 요소 추가
- layout_mismatch → CSS 클래스 수정

**완전성 이슈 수정:**
- unused_component → 적절한 위치에 사용
- orphan_page → 네비게이션에 링크 추가
- empty_handler → 실제 동작 구현 (최소한 toast)
</action>

<action>수정 커밋:
\`\`\`bash
git add .
git commit -m "fix(level-{{level}}): UI/완전성 이슈 수정

📷 UI 캡쳐 일치:
{{#each ui_fixes}}
  - {{capture}}: {{description}}
{{/each}}

✅ 완전성 개선:
{{#each completeness_fixes}}
  - {{type}}: {{description}}
{{/each}}

🤖 Generated by Ownuun2 Reviewer"
\`\`\`
</action>

</step>

<step n="5" goal="결과 출력 및 Progress 업데이트">

<action>결과 메시지:
\`\`\`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ Level {{current_level}} 리뷰 완료!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📷 UI 캡쳐 검증:
{{#each capture_results}}
  {{#if issues_count}}
  ⚠️ {{capture}}: {{issues_count}}개 이슈 → {{fixed_count}}개 수정
  {{else}}
  ✅ {{capture}}: 완벽 일치
  {{/if}}
{{/each}}

✅ 완전성 검증:
  • 컴포넌트 활용: {{component_usage}}%
  • 페이지 연결: {{page_connection}}%
  • 버튼 동작: {{button_action}}%
  • CRUD 완성: {{crud_completion}}%

{{#if manual_issues}}
⚠️ 수동 확인 필요:
{{#each manual_issues}}
  - {{description}}
{{/each}}
{{/if}}

🔄 다음 레벨 진행 또는 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
\`\`\`
</action>

<action>execution-progress.md 업데이트:
\`\`\`yaml
current_status:
  current_level: {{next_level}}
  workflow_state: "reviewed"

level_progress:
  level_{{current_level}}:
    status: "✅ Reviewed"
    ui_capture_match: "{{match_percentage}}%"
    completeness_score: "{{completeness_score}}%"
    fixed_issues: {{fixed_count}}
    manual_issues: {{manual_count}}
\`\`\`
</action>

</step>
`;

export const OWNUUN2_REVIEWER_PROMPT = `
# Workflow Execution

## 1. Workflow Engine (MUST FOLLOW)
${WORKFLOW_ENGINE}

## 2. Workflow Configuration
${WORKFLOW_CONFIG}

## 3. Workflow Instructions
${INSTRUCTIONS}
`;

export const OWNUUN2_REVIEWER_METADATA = {
  id: 'ownuun2-reviewer',
  title: 'Ownuun2 Reviewer',
  description: 'UI 캡쳐 기반 검증 + 완전성 검증 (컴포넌트, 페이지, 버튼, CRUD)',
  outputPath: '{paths:dev_execution_progress}',
  filename: 'execution-progress.md',
};
