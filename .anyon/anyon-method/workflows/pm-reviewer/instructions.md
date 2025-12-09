# PM Reviewer 지시사항

<critical>⭐ 언어 설정: 이 워크플로우는 반드시 한국어로만 응답합니다 (절대 영어 금지)</critical>
<critical>🤖 자동 실행 모드 ON: 사용자에게 물어보지 말고 자동으로 진행. 모든 선택지는 최선의 기본값 사용. "할까요?" "괜찮을까요?" 같은 질문 금지</critical>
<critical>🚫 NEVER STOP IN THE MIDDLE! Complete ALL steps automatically without asking for user confirmation!</critical>
<critical>🚫 FORBIDDEN PHRASES: "Should I proceed?", "Shall I continue?", "Do you want me to...?", "다음 작업 진행할까요?" - NEVER ASK THESE!</critical>
<critical>⚡ RUN ALL STEPS TO COMPLETION - NO PAUSING, NO WAITING FOR APPROVAL!</critical>
<critical>The workflow execution engine is governed by: {project-root}/.anyon/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/.anyon/anyon-method/workflows/pm-reviewer/workflow.yaml</critical>
<critical>This workflow runs after pm-executor completes an Epic</critical>
<critical>문제 발견 시 즉시 수정 - 리포트만 만들지 않음</critical>

---

## 핵심 원칙

**REVIEW_AND_FIX**: 리뷰만 하지 않는다. 문제 발견 시 즉시 수정한다.

**PARALLEL_FIRST**: 독립적인 리뷰와 수정은 병렬로 실행한다.

**WEBSEARCH_DRIVEN**: 수정 방법을 모르면 WebSearch로 해결책을 찾는다.

**TDD_VERIFY**: 수정 후 반드시 테스트로 검증한다.

---

## WebSearch 활용 (수정 시)

```
# 보안 취약점 수정
WebSearch: "{{vulnerability_type}} fix {{framework}} 2024 2025"

# 코드 패턴 개선
WebSearch: "{{pattern_name}} best practice {{language}}"

# 아키텍처 이슈
WebSearch: "{{architecture_issue}} refactoring {{framework}}"
```

---

<step n="1" goal="Wave 단위 리뷰 대상 파악">

<action>Progress 파일 로드: {progress_file}</action>
<action>마지막 완료 Wave 확인 (execution-progress.md에서) - 수정: 2025-11-29:
  
  <step name="load_progress">
    1️⃣ execution-progress.md 로드
       경로: {{progress_file}}
    
    2️⃣ 현재 상태 확인:
       - current_wave: {{current_wave}} (예: E01-Wave1)
       - current_epic: {{current_epic}} (예: E01)
       - review_status: "In Progress" ← pm-executor가 이 상태로 설정함
    
    3️⃣ 이번 Wave의 완료된 티켓 목록 추출:
       ```
       ## {{current_wave}} 완료된 티켓
       - ✅ TICKET-001: ... (커밋: {{hash}})
       - ✅ TICKET-002: ... (커밋: {{hash}})
       - ... 
       ```
    
    4️⃣ 이번 Wave의 Blocked 티켓 확인:
       ```
       ## {{current_wave}} Blocked 티켓
       - ❌ TICKET-XXX: ... (원인: {{reason}})
       ```
  </step>
</action>

<check if="no completed wave">
  <action>메시지 출력:
  ```
  ❌ 리뷰할 Wave가 없습니다.
  먼저 /pm-executor를 실행하세요.
  ```
  </action>
  <action>워크플로우 종료</action>
</check>

<action>🔴 **Wave 커밋 기반 변경사항 추출** (수정: 2025-11-29)

pm-executor가 완료한 Wave의 변경사항을 파악하는 프로세스:

```bash
# Step 1️⃣: 현재 Wave의 wave commit 찾기
# execution-progress.md에서 current_wave = E01-Wave1 확인
# 해당 Wave의 wave commit 찾기
git log --oneline --grep="wave({{current_wave}})" -1
# 출력: abc1234 wave(E01-Wave1): E01-Wave1 완료

# Step 2️⃣: Wave commit의 모든 변경 파일 목록
git show --name-only abc1234
# 또는
git diff {{previous_wave_commit}}..abc1234 --name-only

# Step 3️⃣: 파일별 상세 변경사항 확인
git show abc1234
# 또는 특정 파일의 변경사항
git show abc1234:path/to/file

# Step 4️⃣: 변경 파일 분류
# backend_files: backend/**, api/**, src/services/**
# frontend_files: mobile/**, frontend/**, ui/**
# test_files: **/*.test.*, **/__tests__/**
# config_files: *.json, *.yaml, *.config.*
```

**플로우:**
```
execution-progress.md 로드
  ↓ current_wave = E01-Wave1
  ↓
git log 검색: wave(E01-Wave1)
  ↓ 커밋 해시 = abc1234
  ↓
git show abc1234로 변경 파일 목록 추출
  ↓
파일별로 변경사항 로드
  ↓
4개 분야 리뷰 대상 파악
```

**장점:**
✓ Wave 커밋 하나로 모든 변경사항 추적 가능
✓ execution-progress.md와 git 이력이 완벽하게 동기화
✓ 어떤 티켓에서 어떤 파일이 변경되었는지 명확
✓ 다음 세션에서도 git log로 이력 조회 가능


<action>변경 파일 분류:
  - backend_files: backend/** 경로
  - frontend_files: mobile/** 또는 frontend/** 경로
  - test_files: **/*.test.*, **/__tests__/** 경로
  - config_files: *.json, *.yaml, *.config.* 경로
</action>

<action>리뷰 시작 알림:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔍 PM Reviewer - {{current_wave}} 리뷰 시작
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 리뷰 대상 ({{current_wave}}의 변경사항):
   {{changed_file_count}}개 파일
   Backend: {{backend_count}}개
   Frontend: {{frontend_count}}개
   Tests: {{test_count}}개

🔍 리뷰 영역: 코드품질, 아키텍처, 보안, 테스트

💡 이번 Wave의 티켓: {{wave_tickets}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
</action>

</step>

<step n="2" goal="설계 문서 로드 및 Wave 변경사항 분석">

<action>설계 문서 로드 (리뷰 기준):
  1. Architecture 문서: {architecture_doc} (anyon-docs/planning/architecture.md)
  2. TRD 문서: {trd_doc} (anyon-docs/planning/trd.md)
  3. ERD 문서: {erd_doc} (anyon-docs/planning/erd.md)
  4. 와이어프레임: {wireframe_doc} (anyon-docs/planning/ui-ux.html)
  5. 디자인 가이드: {design_guide_doc} (anyon-docs/planning/design-guide.md)
  6. API Spec: {api_spec_file} (anyon-docs/dev-plan/api-spec.md)
</action>

<action>리뷰 기준 추출:
  - 폴더 구조 규칙 (Architecture)
  - 네이밍 컨벤션 (TRD)
  - 레이어 분리 규칙 (Architecture)
  - 보안 요구사항 (TRD)
  - DB 스키마 일치 여부 (ERD)
  - UI 구현 일치 여부 (ui-ux.html, design-guide.md)
</action>

<action>🔴 **Wave commit 기반 변경파일 추출** (수정: 2025-11-29)

**목표:** pm-executor가 완료한 Wave의 정확한 변경사항을 파악

**프로세스:**

```bash
# 1️⃣ 현재 Wave 확인 (execution-progress.md에서)
# current_wave = E01-Wave1

# 2️⃣ 해당 Wave의 wave commit 찾기
git log --oneline --all | grep "wave(E01-Wave1)"
# 출력 예: abc1234 wave(E01-Wave1): E01-Wave1 완료

# 3️⃣ Wave commit의 변경 파일 목록 추출
git show --name-only abc1234

# 4️⃣ 파일별 변경 통계
git diff {{previous_wave_commit}}...abc1234 --stat

# 5️⃣ 변경 파일 분류
# 실행 결과를 기반으로 파일을 분류:
- backend_files:  backend/**, api/**, src/services/**
- frontend_files: mobile/**, frontend/**, ui/**
- test_files:     **/*.test.*, **/__tests__/**
- config_files:   *.json, *.yaml, *.config.*
```

**실행 및 데이터 수집:**

```yaml
# execution-progress.md에서 current_wave 추출
current_wave: E01-Wave1

# git log로 wave commit 검색
wave_commit: abc1234 (wave(E01-Wave1): E01-Wave1 완료)

# git show로 변경 파일 목록
changed_files:
  - src/services/auth.ts
  - src/controllers/auth.controller.ts
  - src/repositories/user.repository.ts
  - tests/auth.service.spec.ts
  - tests/auth.controller.spec.ts
  - package.json
  - .env.example

# 분류된 결과
backend_files: [auth.ts, auth.controller.ts, user.repository.ts]
test_files: [auth.service.spec.ts, auth.controller.spec.ts]
config_files: [package.json, .env.example]

# 변경 통계
total_files_changed: 7개
total_lines_added: 356줄
total_lines_deleted: 12줄
total_commits_in_wave: 3개 (각 Wave commit 내 모든 변경사항)
```

**출력 예시:**

```
🔍 Wave 변경사항 분석 ({{current_wave}})

📊 Wave Commit: abc1234
   제목: wave(E01-Wave1): E01-Wave1 완료
   작성자: pm-executor
   
📁 변경 파일: 7개
   Backend:  3개 (auth.ts, auth.controller.ts, user.repository.ts)
   Frontend: 0개
   Tests:    2개 (auth.service.spec.ts, auth.controller.spec.ts)
   Config:   2개 (package.json, .env.example)

📈 변경 통계
   추가: 356줄
   제거: 12줄
   
🎯 리뷰 대상 확인됨 - 이제 4개 분야 병렬 리뷰 시작
```

**중요:** 
✓ git log를 통해 실제 커밋 이력 추적
✓ execution-progress.md와 git 동기화
✓ 한 번의 wave commit으로 모든 변경사항 포괄
✓ 다음 세션에서도 git으로 이력 조회 가능
</action>

</step>

<step n="3" goal="병렬 리뷰 실행">

<critical>4개 리뷰어를 반드시 하나의 메시지에서 동시에 호출</critical>

<action>병렬 리뷰 실행:

💡 **리뷰 대상 파일 소스:**
- Wave commit: `git show --name-only {{wave_commit_hash}}`
- 변경 내용: `git show {{wave_commit_hash}}`

```
Task tool 호출 1 - 코드 품질 리뷰어:
- subagent_type: "general-purpose"
- model: "haiku"
- prompt: |
    ## Code Quality Review

    ## Wave Commit 정보
    - 커밋: {{wave_commit_hash}}
    - 커밋 메시지: wave({{current_wave}}): {{current_wave}} 완료
    
    변경 파일 (git show {{wave_commit_hash}} 기반):
    {{changed_files_from_wave_commit}}

    ## 체크 항목
    1. 중복 코드 (같은 로직이 여러 곳에?)
    2. 네이밍 (변수/함수명이 명확한가?)
    3. 함수 크기 (한 함수가 너무 길지 않은가? 50줄 이상?)
    4. 복잡도 (중첩 조건문이 3단계 이상?)
    5. 불필요한 코드 (사용되지 않는 import, 변수?)

    ## 출력 형식 (이슈가 있을 때만)
    ```yaml
    issues:
      - file: "파일경로"
        line: 라인번호
        type: "duplicate|naming|size|complexity|unused"
        description: "문제 설명"
        fix_suggestion: "수정 제안"
        can_auto_fix: true|false
    ```

    이슈가 없으면:
    ```yaml
    issues: []
    status: "clean"
    ```

Task tool 호출 2 - 아키텍처 리뷰어:
- subagent_type: "general-purpose"
- model: "haiku"
- prompt: |
    ## Architecture Review

    변경 파일:
    {{changed_files_content}}

    아키텍처 기준:
    {{architecture_doc_content}}

    ## 체크 항목
    1. 폴더 구조 준수 (정해진 위치에 파일이 있는가?)
    2. 레이어 분리 (Controller→Service→Repository 순서?)
    3. 의존성 방향 (안쪽으로만 의존하는가?)
    4. 설계 패턴 준수 (정해진 패턴 사용?)

    ## 출력 형식
    ```yaml
    issues:
      - file: "파일경로"
        type: "structure|layer|dependency|pattern"
        description: "문제 설명"
        expected: "아키텍처 기준"
        fix_suggestion: "수정 제안"
        can_auto_fix: true|false
    ```

Task tool 호출 3 - 보안 리뷰어 (OWASP):
- subagent_type: "general-purpose"
- model: "haiku"
- prompt: |
    ## Security Review (OWASP Top 10)

    변경 파일:
    {{changed_files_content}}

    ## 체크 항목
    1. SQL Injection (raw query 사용? 파라미터 바인딩?)
    2. XSS (사용자 입력 이스케이프?)
    3. 입력 검증 (req.body, req.params 검증?)
    4. 인증/인가 (미들웨어 적용? 권한 체크?)
    5. 민감정보 (API 키, 비밀번호 하드코딩?)
    6. 에러 노출 (스택트레이스 클라이언트 노출?)

    ## 출력 형식
    ```yaml
    issues:
      - file: "파일경로"
        line: 라인번호
        type: "sql_injection|xss|input_validation|auth|secrets|error_exposure"
        severity: "critical|high|medium"
        description: "취약점 설명"
        fix_suggestion: "수정 방법"
        can_auto_fix: true|false
    ```

Task tool 호출 4 - 테스트 커버리지 리뷰어:
- subagent_type: "general-purpose"
- model: "haiku"
- prompt: |
    ## Test Coverage Review

    구현 파일:
    {{implementation_files}}

    테스트 파일:
    {{test_files}}

    ## 체크 항목
    1. 테스트 존재 (모든 구현 파일에 테스트?)
    2. 정상 케이스 (happy path 테스트?)
    3. 에러 케이스 (예외 상황 테스트?)
    4. 엣지 케이스 (경계값, 빈 값 테스트?)

    ## 출력 형식
    ```yaml
    issues:
      - file: "테스트 필요한 파일"
        type: "missing_test|missing_error_case|missing_edge_case"
        description: "누락된 테스트 설명"
        test_suggestion: "추가해야 할 테스트"
        can_auto_fix: true|false
    ```
```

위 4개 Task tool을 **하나의 메시지에서 동시에** 호출합니다.
</action>

<action>모든 리뷰 결과 수집</action>

</step>

<step n="4" goal="이슈 통합 및 분류">

<action>4개 리뷰 결과 통합:
```yaml
all_issues:
  - from: "code_quality"
    issues: [...]
  - from: "architecture"
    issues: [...]
  - from: "security"
    issues: [...]
  - from: "test_coverage"
    issues: [...]
```
</action>

<action>이슈 분류:
  - auto_fixable: can_auto_fix == true인 이슈들
  - manual_required: can_auto_fix == false인 이슈들
  - security_critical: security 이슈 중 severity == "critical"
</action>

<check if="no issues found">
  <action>결과 출력:
  ```
  ✅ {{epic_id}} 리뷰 완료!

  🎉 모든 영역 통과:
    ✓ 코드 품질
    ✓ 아키텍처
    ✓ 보안
    ✓ 테스트 커버리지

  이제 다음 에픽을 실행하세요!
  ```
  </action>
  <goto step="6">완료</goto>
</check>

<action>이슈 요약 출력:
```
📋 발견된 이슈: {{total_count}}개
   🔧 자동 수정 가능: {{auto_fix_count}}개
   ✋ 수동 확인 필요: {{manual_count}}개
```
</action>

</step>

<step n="5" goal="즉석 수정">

<critical>pm-executor와 동일한 메커니즘으로 수정</critical>

<action>수정 변수 초기화:
  - fixed_issues = []
  - failed_issues = []
  - attempt_count = 0
</action>

<check if="multiple auto_fixable issues AND issues are independent">
  <action>병렬 수정 실행:

  독립적인 이슈들(다른 파일)은 동시에 수정 가능합니다.
  반드시 하나의 메시지에서 여러 Task tool을 호출하세요.

  ```
  Task tool 호출 1 - 이슈 1 수정:
  - subagent_type: "general-purpose"
  - prompt: |
      ## Fix Issue

      파일: {{file_path}}
      문제: {{issue_description}}
      수정 제안: {{fix_suggestion}}

      ## 수정 방법
      1. 파일 읽기
      2. 문제 부분 수정
      3. 테스트 실행하여 검증

      ## WebSearch 필요 시
      "{{issue_type}} fix {{framework}} best practice"

      ## 출력
      - 수정 완료 시: "FIXED: {{description}}"
      - 수정 실패 시: "FAILED: {{reason}}"

  Task tool 호출 2 - 이슈 2 수정:
  ...
  ```
  </action>
</check>

<check if="single issue OR issues depend on each other">
  <action>순차 수정 실행</action>

  <for-each issue="auto_fixable_issues">
    <action>attempt_count = 0</action>

    <action>이슈 수정 시도:
    ```
    🔧 수정 중: {{issue.file}}:{{issue.line}}
       문제: {{issue.description}}
    ```
    </action>

    <check if="issue.type is security">
      <action>WebSearch로 보안 수정 방법 조사:
        "{{vulnerability_type}} prevention {{framework}} 2024"
      </action>
    </check>

    <action>수정 코드 작성</action>
    <action>테스트 실행: npm test</action>

    <check if="tests pass">
      <action>fixed_issues에 추가</action>
      <action>수정 완료:
      ```
      ✅ 수정됨: {{issue.file}} - {{issue.description}}
      ```
      </action>
    </check>

    <check if="tests fail AND attempt_count < 3">
      <action>attempt_count 증가</action>
      <action>Self-correction:
        1. 에러 메시지 분석
        2. WebSearch로 해결책 검색
        3. 수정 재시도
      </action>
      <goto step="5">재시도</goto>
    </check>

    <check if="tests fail AND attempt_count >= 3">
      <action>failed_issues에 추가</action>
      <action>롤백: git checkout -- {{issue.file}}</action>
      <action>실패 기록:
      ```
      ⚠️ 수정 실패: {{issue.file}} - 수동 확인 필요
      ```
      </action>
    </check>
  </for-each>
</check>

<check if="fixed_issues not empty">
  <action>🔴 **자동 수정 커밋** (수정: 2025-11-29)
  
  발견된 이슈들을 자동으로 수정한 후, 반드시 커밋:
  
  ```bash
  git add .
  git commit -m \"fix({{current_wave}}): 리뷰 이슈 자동 수정

  수정 완료:
  {{#each fixed_issues}}
  - {{file}}: {{description}}
  {{/each}}

  📊 수정 통계:
    • 발견 이슈: {{total_issues}}개
    • 자동 수정: {{fixed_count}}개 ✅
    • 수동 필요: {{manual_count}}개 ⚠️

  🤖 Generated by PM Reviewer (Auto-fix)

  Co-Authored-By: pm-reviewer <review@anyon-method>\"
  ```
  
  **커밋 형식:**
  - 제목: `fix(E01-Wave1): 리뷰 이슈 자동 수정`
  - 본문: 수정된 파일 목록 + 통계
  - 트레일러: Co-Authored-By
  
  **목적:**
  ✓ 리뷰에서 발견/수정한 이슈를 명확하게 기록
  ✓ 각 파일의 수정 이력 추적 가능
  ✓ git blame으로 누가 수정했는지 파악 가능
  </action>
</check>"
  ```
  </action>
</check>

</step>

<step n="6" goal="결과 출력">

<action>최종 결과 출력 (필수 - 이 형식 그대로):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ✅ {{current_wave}} 리뷰 완료!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{#if fixed_issues}}
🔧 수정됨:
{{#each fixed_issues}}
  - {{file}}: {{description}}
{{/each}}
{{/if}}

{{#if failed_issues}}
⚠️ 수동 확인 필요:
{{#each failed_issues}}
  - {{file}}: {{description}}
{{/each}}
{{/if}}

{{#if clean_areas}}
✅ 문제없음:
{{#each clean_areas}}
  - {{area_name}}
{{/each}}
{{/if}}

🎯 다음 단계:
   {{#if has_next_wave}}
   1️⃣ Wave 리뷰 완료됨
   2️⃣ 다음 Wave를 실행하려면: /pm-executor
   다음 Wave: {{next_wave}}
   {{/if}}
   {{#if is_last_wave}}
   🎉 **모든 Epic 완료** - 프로젝트 구현 완료!

   📄 완료 보고서: anyon-docs/dev-plan/DEVELOPMENT_COMPLETE.md
   {{/if}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
</action>

<check if="is_last_wave">
  <action>🔴 **DEVELOPMENT_COMPLETE.md 생성** (마지막 Wave 완료 시)

  경로: {completion_report}

  ```markdown
  # 🎉 Development Complete

  > 프로젝트 개발이 완료되었습니다.

  ## 📊 프로젝트 요약

  | 항목 | 값 |
  |------|-----|
  | 프로젝트명 | {{project_name}} |
  | 완료일 | {{completion_date}} |
  | 총 Epic 수 | {{total_epics}} |
  | 총 Wave 수 | {{total_waves}} |
  | 총 티켓 수 | {{total_tickets}} |

  ---

  ## 📋 Epic 완료 현황

  {{#each epics}}
  ### {{epic_id}}: {{epic_title}}

  | Wave | 티켓 수 | 상태 | 리뷰 결과 |
  |------|---------|------|-----------|
  {{#each waves}}
  | {{wave_id}} | {{ticket_count}}개 | ✅ 완료 | {{review_status}} |
  {{/each}}

  {{/each}}

  ---

  ## 🔧 리뷰 통계

  | 항목 | 값 |
  |------|-----|
  | 총 발견 이슈 | {{total_issues_found}}개 |
  | 자동 수정 | {{total_auto_fixed}}개 |
  | 수동 수정 | {{total_manual_fixed}}개 |
  | 미해결 | {{total_unresolved}}개 |

  ### 이슈 분류

  | 분야 | 발견 | 수정 |
  |------|------|------|
  | 코드 품질 | {{quality_found}}개 | {{quality_fixed}}개 |
  | 아키텍처 | {{arch_found}}개 | {{arch_fixed}}개 |
  | 보안 | {{security_found}}개 | {{security_fixed}}개 |
  | 테스트 | {{test_found}}개 | {{test_fixed}}개 |

  ---

  ## 📁 생성된 주요 파일

  ### 설계 문서 (anyon-docs/planning/)
  - `prd.md` - 제품 요구사항
  - `ui-ux.html` - 와이어프레임
  - `design-guide.md` - 디자인 가이드
  - `erd.md` - 데이터베이스 스키마
  - `architecture.md` - 시스템 아키텍처
  - `trd.md` - 기술 요구사항

  ### 개발 계획 (anyon-docs/dev-plan/)
  - `execution-plan.md` - 실행 계획
  - `dependency-graph.md` - 의존성 그래프
  - `api-spec.md` - API 명세서
  - `epics/` - Epic별 상세 티켓

  ---

  ## 🚀 다음 단계

  1. **코드 리뷰**: 전체 코드베이스 최종 검토
  2. **테스트**: E2E 테스트 및 QA
  3. **배포 준비**: CI/CD 파이프라인 확인
  4. **문서화**: API 문서, 사용자 가이드 작성
  5. **릴리즈**: 스테이징 → 프로덕션 배포

  ---

  ## 📝 Git 이력

  ```bash
  # 전체 개발 이력 확인
  git log --oneline --grep="wave("
  git log --oneline --grep="review("
  ```

  ---

  > 🤖 Generated by PM Reviewer
  >
  > 완료 시각: {{timestamp}}
  ```
  </action>

  <action>완료 보고서 생성 커밋:
  ```bash
  git add anyon-docs/dev-plan/DEVELOPMENT_COMPLETE.md
  git commit -m "docs: 프로젝트 개발 완료 보고서 생성

  🎉 모든 Epic/Wave 완료!

  📊 통계:
    • Epic: {{total_epics}}개
    • Wave: {{total_waves}}개
    • 티켓: {{total_tickets}}개
    • 리뷰 이슈: {{total_issues_found}}개 ({{total_auto_fixed}}개 자동수정)

  🤖 Generated by PM Reviewer

  Co-Authored-By: pm-reviewer <review@anyon-method>"
  ```
  </action>
</check>

<action>Progress 파일에 Wave 리뷰 결과 기록:
```markdown
## {{current_wave}} 리뷰 결과

### 리뷰 상태
- 상태: ✅ 완료
- 리뷰 일시: {{timestamp}}
- 발견 이슈: {{total_issues}}개
- 자동 수정: {{fixed_count}}개
- 수동 필요: {{manual_count}}개

### 다음 Wave 준비 상황
- 현재 Wave: {{current_wave}}
- 다음 Wave: {{next_wave}}
{{#if is_last_wave}}
- 상태: 마지막 Wave - 모든 Epic 완료
- **프로젝트 구현 완료** ✅
{{/if}}
```

🔴 **CRITICAL: execution-progress.md 업데이트 (수정: 2025-11-29)**

반드시 다음 섹션을 업데이트:

1️⃣ **현재 상태 섹션**
```yaml
current_status:
  last_completed_wave: {{current_wave}}
  last_completed_epic: {{current_epic}}
  review_status: "✅ Completed"  # "In Progress" → "Completed"
  overall_progress: "{{new_percentage}}%"
  last_update: "{{timestamp}}"
```

2️⃣ **Wave 진행 섹션** (해당 Wave 업데이트)
```yaml
wave_progress:
  {{current_wave}}:
    status: "✅ Reviewed"  # "In Progress" → "Reviewed"
    fixed_issues: {{fixed_count}}개
    manual_issues: {{manual_count}}개
    review_date: "{{timestamp}}"
    review_result: "PASS / NEEDS_MANUAL_REVIEW"
```

3️⃣ **다음 세션 컨텍스트 섹션**
```yaml
next_session:
  next_wave: {{next_wave}}  # 예: E01-Wave2
  next_epic: {{next_epic}}
  prerequisites_met: yes/no
  first_ticket: {{first_ticket_id}}
  
  # Blocked 티켓 (이번 Wave에서)
  blocked_tickets:
    - {{ticket_id}}: {{reason}}
```

4️⃣ **최종 메모**
```markdown
## {{current_wave}} 리뷰 완료

- 리뷰 일시: {{timestamp}}
- 발견 이슈: {{total_issues}}개
- 자동 수정: {{fixed_count}}개 ✅
- 수동 필요: {{manual_count}}개 ⚠️
- 다음 Wave: {{next_wave}} 준비 완료

💡 **다음 단계**:
   사용자가 `/pm-executor` 호출 → {{next_wave}} 자동 시작
```
</action>



<action>🔴 **리뷰 완료 커밋** (수정: 2025-11-29)

리뷰 프로세스 완료 후, 반드시 커밋:

```bash
git add .
git commit -m \"review({{current_wave}}): {{current_wave}} 리뷰 완료

📋 리뷰 결과:
  • 발견 이슈: {{total_issues}}개
  • 자동 수정: {{fixed_count}}개 ✅
  • 수동 필요: {{manual_count}}개 ⚠️

✅ 리뷰 영역:
  ✓ 코드 품질: {{quality_status}}
  ✓ 아키텍처: {{architecture_status}}
  ✓ 보안: {{security_status}}
  ✓ 테스트: {{test_status}}

🎯 다음: {{next_wave}} 준비 완료

🤖 Generated by PM Reviewer (Code Review Complete)

Co-Authored-By: pm-reviewer <review@anyon-method>\"
```

**커밋 형식:**
- 제목: `review(E01-Wave1): E01-Wave1 리뷰 완료`
- 본문: 리뷰 결과 + 각 영역 상태
- 트레일러: Co-Authored-By

**목적:**
✓ Wave별 리뷰 완료 시점을 명확하게 기록
✓ 리뷰 통과/미통과 이력 추적
✓ git log에서 "언제 어떤 Wave를 리뷰했는가" 확인 가능
✓ 문제 발생 시 해당 Wave의 리뷰 상황 파악 쉬움
</action>

</step>
