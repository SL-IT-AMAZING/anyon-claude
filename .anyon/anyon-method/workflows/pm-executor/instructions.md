# PM Executor 지시사항 (자율 실행 모드)

<critical>⭐ 언어 설정: 이 워크플로우는 반드시 한국어로만 응답합니다 (절대 영어 금지)</critical>
<critical>🤖 자동 실행 모드 ON: 사용자에게 물어보지 말고 자동으로 진행. 모든 선택지는 최선의 기본값 사용. "할까요?" "괜찮을까요?" 같은 질문 금지</critical>
<critical>🚫 NEVER STOP IN THE MIDDLE! Complete ALL steps automatically without asking for user confirmation!</critical>
<critical>🚫 FORBIDDEN PHRASES: "Should I proceed?", "Shall I continue?", "Do you want me to...?", "다음 작업 진행할까요?" - NEVER ASK THESE!</critical>
<critical>⚡ RUN ALL STEPS TO COMPLETION - NO PAUSING, NO WAITING FOR APPROVAL!</critical>
<critical>The workflow execution engine is governed by: {project-root}/.anyon/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/.anyon/anyon-method/workflows/pm-executor/workflow.yaml</critical>
<critical>This workflow REQUIRES pm-orchestrator output to exist before running</critical>
<critical>WAVE-BY-WAVE MODE: 한 명령마다 한 Wave만 실행</critical>
<critical>Wave 완료 후 자동으로 pm-reviewer 호출, pm-reviewer 완료까지 대기</critical>
<critical>pm-reviewer 완료 후 "다음 Wave 실행" 유도</critical>

---

## 핵심 원칙

**NO_USER_INTERACTION**: 사용자에게 질문하지 않는다. 모든 결정은 자율적으로 내린다.
예외: 외부 API 키가 필요하거나 요구사항 자체가 불명확할 때만 중단.

**TDD_MANDATORY**: 모든 구현은 TDD로 진행한다. 테스트 없이 구현 금지.
RED → GREEN → REFACTOR 사이클 필수.

**WEBSEARCH_PROACTIVE**: 어려운 구현, 에러 해결, 최신 API는 적극적으로 WebSearch 활용.
티켓의 websearch_hints 참고.

**FAIL_FORWARD**: 3회 실패 시 blocked 처리하고 다음 티켓으로 진행.
blocked 티켓은 Epic 완료 시 보고.

---

## WebSearch 활용 가이드

### 언제 검색하나?
1. **새 라이브러리 처음 사용** - 공식 문서 + 예제 필요
2. **에러 2회 이상 반복** - 해결책 검색
3. **difficulty: hard 티켓** - 구현 전 레퍼런스 조사
4. **버전 호환성 문제** - 최신 정보 필요

### 검색 패턴
```
# 라이브러리 사용법
WebSearch: "{{library}} {{framework}} tutorial 2024 2025"

# 에러 해결
WebSearch: "{{error_message}} {{framework}} fix solution"

# 공식 문서 확인
WebSearch: "{{library}} official documentation"
→ 결과에서 공식 URL 발견
→ WebFetch로 해당 페이지 상세 분석
```

### 검색 후 처리
1. **공식 문서 우선** - 블로그보다 공식 문서
2. **최신 글 우선** - 2024-2025년 글 선호
3. **WebFetch로 상세 분석** - URL 발견 시 깊게 읽기
4. **코드 예제 적용** - 프로젝트에 맞게 수정

### 티켓의 websearch_hints 활용
```yaml
# 티켓에 정의된 힌트 참고
websearch_hints:
  queries: ["검색어1", "검색어2"]
  trusted_domains: ["reactnative.dev", "docs.expo.dev"]
  official_docs:
    - url: "https://..."
      topic: "무한 스크롤"
```

---

## TDD 강제 규칙

### 절대 규칙
1. **테스트 먼저** - 구현 전에 반드시 테스트 작성
2. **실패 확인** - 테스트가 실패하는 것 확인 후 구현
3. **Mock 금지** - 존재하지 않는 기능의 mock 구현 금지

### TDD 사이클

**RED Phase:**
```
1. 티켓의 tdd_tests 섹션 확인
2. 테스트 파일 생성 (test_file_path)
3. 테스트 코드 작성
4. npm test 실행
5. 실패 확인 (필수!)
   - 성공하면? → 테스트가 잘못됨, 수정
```

**GREEN Phase:**
```
1. 테스트 통과하는 최소 코드 작성
2. npm test 실행
3. 통과 확인
   - 실패하면? → 에러 대처법 적용
```

**REFACTOR Phase:**
```
1. 코드 정리 (중복 제거, 네이밍 개선)
2. npm test 실행
3. 여전히 통과 확인
```

### 테스트 작성 가이드
```typescript
// 좋은 테스트 예시
describe('ProductService', () => {
  // 정상 케이스
  it('should return products list', async () => {
    const result = await productService.getProducts();
    expect(result).toBeArray();
    expect(result[0]).toHaveProperty('id');
  });

  // 에러 케이스
  it('should throw error when database fails', async () => {
    mockDb.mockRejectedValue(new Error('DB Error'));
    await expect(productService.getProducts()).rejects.toThrow();
  });

  // 엣지 케이스
  it('should return empty array when no products', async () => {
    mockDb.mockResolvedValue([]);
    const result = await productService.getProducts();
    expect(result).toEqual([]);
  });
});
```

---

## 에러 대처 플로우

### 에러 분류 및 대처

```
에러 발생
    ↓
에러 메시지 분석
    ↓
┌─────────────────────────────────────────────────────────────┐
│ 유형 판별                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  "Cannot find module" ─────→ IMPORT_ERROR                   │
│  "is not assignable to" ───→ TYPE_ERROR                     │
│  "TypeError:", "ReferenceError:" → RUNTIME_ERROR            │
│  "Expected:", "Received:" ──→ TEST_FAILURE                  │
│  기타 ─────────────────────→ UNKNOWN_ERROR                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
    ↓
유형별 대처
```

### IMPORT_ERROR 대처
```
1. 티켓의 potential_errors에서 해당 에러 찾기
2. package.json 확인 → 패키지 없으면 npm install
3. tsconfig.json paths 확인 → 경로 설정 수정
4. 여전히 실패 → WebSearch: "{{module}} npm install {{framework}}"
```

### TYPE_ERROR 대처
```
1. 에러 위치의 타입 정의 확인
2. 제네릭 타입 확인
3. as 캐스팅 또는 타입 수정
4. 여전히 실패 → WebSearch: "TypeScript {{error_message}}"
```

### RUNTIME_ERROR 대처
```
1. 스택트레이스에서 에러 라인 파악
2. 해당 코드 로직 분석
3. 변수 상태 확인 (null, undefined)
4. 여전히 실패 → WebSearch: "{{error_message}} {{framework}}"
```

### TEST_FAILURE 대처
```
1. Expected vs Received 비교
2. 구현이 틀렸으면 → 구현 수정
3. 테스트가 틀렸으면 → 테스트 수정 (신중하게!)
4. 여전히 실패 → 로직 재검토
```

### UNKNOWN_ERROR 대처
```
1. 에러 메시지 전체 복사
2. WebSearch: "{{full_error_message}}"
3. Stack Overflow, GitHub Issues 참고
4. 여전히 실패 → blocked 처리
```

### 재시도 정책
```
시도 1: 티켓의 potential_errors 참고하여 수정
시도 2: WebSearch로 해결책 검색 후 적용
시도 3: 다른 접근법 시도
실패 → blocked 처리, 다음 티켓으로
```

---

<step n="1" goal="실행 환경 검증 및 Wave 단위 자율 실행 준비">

<action>필수 파일 존재 확인 (수정: 2025-11-29):
  1. {execution_plan_file} - 실행 계획 (Wave별 티켓 목록 포함)
  2. {epics_folder}/ - Epic별 통합 티켓 파일 (## TICKET 마크다운 섹션 포함) ✓ 수정!
  3. {dependency_graph_file} - 의존성 그래프
  4. {api_spec_file} - API 명세서 ✓ 추가!
  5. {agents_folder}/ - 커스텀 에이전트 프롬프트
  6. {claude_context_file} - 프로젝트 컨텍스트 (없으면 Step 8에서 생성)
</action>

<check if="any required file missing">
  <action>누락 파일 목록 출력</action>
  <action>워크플로우 중단 메시지 표시:
  ```
  ❌ 필수 파일 누락으로 실행 불가

  누락된 파일:
  {{missing_files}}

  해결 방법:
  /pm-orchestrator 먼저 실행하세요.
  ```
  </action>
  <action>워크플로우 종료</action>
</check>

<action>CLAUDE.md 확인:
  - Claude Code가 자동으로 CLAUDE.md를 컨텍스트에 로드함
  - 파일 없으면 첫 Wave 완료 시 생성
</action>

<action>Progress 파일 확인: {progress_file}</action>

<check if="progress file exists">
  <action>기존 진행 상황 로드 (Wave 기준):
    - 마지막 완료 Wave (예: E01-Wave1)
    - 다음 실행 Wave (예: E01-Wave2 또는 E02-Wave1)
    - 완료된 티켓 목록 (현재 Wave까지)
    - blocked 티켓 목록 (재시도 대상)
    - 특이사항/컨텍스트
  </action>
</check>

<check if="progress file not exists">
  <action>새로운 실행 - execution-progress.md 명시적 초기화 (수정: 2025-11-29)</action>
  
  <action>Step 1: execution-plan.md에서 Wave/Epic 정보 추출
    - 첫 번째 Wave 식별
    - 첫 번째 Epic 식별
    - 전체 Wave 수 계산
    - 전체 티켓 수 계산
  </action>
  
  <action>Step 2: {{installed_path}}/execution-progress-template.md 로드</action>
  
  <action>Step 3: 템플릿 값 초기화
    ```yaml
    current_status:
      current_wave: "E01-Wave1"  # execution-plan.md에서 추출
      current_epic: "E01"
      completed_waves: 0
      completed_tickets: 0
      overall_progress: "0%"
      last_update: "{{timestamp}}"
    
    wave_progress:  # 모든 Wave에 대해 초기화
      E01-Wave1:
        status: "Pending"
        completed: 0
        total: {{ticket_count_wave1}}
        blocked: 0
    
    next_session:
      first_wave: "E01-Wave1"
      first_epic: "E01"
      first_ticket: "TICKET-001"
    ```
  </action>
  
  <action>Step 4: 초기화된 파일 저장: {progress_file}</action>
  
  <action>Step 5: 초기화 완료 메시지
  ```
  📄 execution-progress.md 생성됨
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  📍 시작점: E01-Wave1 ({{epic_name}} 내)
  📊 진행 추적:
     • 전체 Wave: {{total_waves}}개
     • 전체 티켓: {{total_tickets}}개
     • 시작 진행률: 0%
  
  🚀 자율 실행 준비 완료
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ```
  </action>
</check>

<action>실행 계획 로드: {execution_plan_file}</action>
<action>모든 티켓 파일 로드: {epics_folder}/*.md</action>
<action>API 명세서 로드: {output_folder}/api-spec.md</action>
<action>현재 Wave 정보 추출 (execution-plan.md에서):
  - Wave ID (예: E01-Wave1)
  - 해당 Wave에 속한 티켓들
  - Wave 목표 및 설명
  - Wave 내 의존성
</action>

<action>자율 실행 시작 알림:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       🤖 PM Executor - Wave-by-Wave Mode
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 프로젝트 현황:
  • 총 Epic: {{total_epics}}개
  • 총 Wave: {{total_waves}}개
  • 총 티켓: {{total_tickets}}개
  • 완료된 Wave: {{completed_waves}}개
  • 완료된 티켓: {{completed_tickets}}개

🎯 이번 세션 실행 대상: {{current_wave}} ({{current_epic}} 내)
  • 이 Wave 티켓 수: {{wave_ticket_count}}개
  • blocked 재시도: {{blocked_retry_count}}개
  • Wave 완료 후: pm-reviewer 자동 호출

⚡ Wave-by-Wave 모드 - 이 명령으로 {{current_wave}} 실행 후 중단.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
</action>

</step>

<step n="2" goal="현재 Wave 컨텍스트 준비">

<action>현재 Wave 정보 확인 (execution-progress.md 및 execution-plan.md에서):
  - 현재 Wave ID (예: {{current_wave}} = E01-Wave1)
  - 현재 Epic (예: {{current_epic}} = E01)
  - 현재 Wave에 속한 티켓 목록 (execution-plan.md의 Wave 섹션에서)
</action>

<action>이전 Wave/Epic 산출물 확인:
  - 생성된 파일 목록
  - 설정된 환경 변수
  - 실행 중인 서비스 (Docker 등)
  - 사용 가능한 API 엔드포인트
</action>

<action>현재 Wave의 모든 티켓들 로드 및 파싱 (수정: 2025-11-29)

**로딩 구조:**
1. execution-plan.md의 "Wave별 실행 계획" 섹션에서 현재 Wave 확인
2. 해당 Wave에 포함된 모든 TICKET 목록 추출 (예: TICKET-001, TICKET-002)
3. 각 TICKET이 속한 Epic 식별
4. {epics_folder}/EPIC-xxx-{{name}}.md 파일 로드
5. 파일 내에서 해당 TICKET의 ## TICKET-XXX: 마크다운 섹션 추출
6. 모든 필드 파싱: API, DB 스키마, 파일 구조, TDD 테스트 등

**예시:**
```
Step 1: execution-plan.md에서 Wave 1 확인
  → TICKET-001, TICKET-002

Step 2: 각 티켓의 Epic 확인
  → TICKET-001 ∈ EPIC-001
  → TICKET-002 ∈ EPIC-001

Step 3: EPIC-001-인증시스템.md 로드

Step 4: 파일 내 마크다운 섹션 추출
  - ## TICKET-001: 프로젝트 스캐폴딩
  - ## TICKET-002: DB 스키마

Step 5: 각 섹션의 모든 필드 파싱
  - difficulty, estimated_files
  - api_specification, database_schema
  - file_structure, tdd_tests
  - potential_errors, websearch_hints
  - 등등...
```


<action>실행 큐 생성 (Wave 티켓 기준):
  1. blocked_by가 없거나 의존성이 이미 완료된 티켓들 → ready_queue (즉시 실행 가능)
  2. 의존성이 아직 완료되지 않은 티켓들 → waiting_queue (대기)
  3. 이전 세션에서 이 Wave에서 blocked된 티켓 → retry_queue (재시도)
</action>

<action>Wave 시작 로그:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🌊 {{current_wave}}: {{wave_name}} ({{current_epic}} 내)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 이번 Wave의 티켓 ({{wave_total}} 개):
{{#each ready_tickets}}
  🟢 {{ticket_id}}: {{title}}
{{/each}}

⏳ 대기 중:
{{#each waiting_tickets}}
  ⏸️ {{ticket_id}}: {{title}} (의존: {{blocked_by}})
{{/each}}

🔄 재시도:
{{#each retry_tickets}}
  🔁 {{ticket_id}}: {{title}} (이전 실패 원인: {{failure_reason}})
{{/each}}
```
</action>

<action>변수 초기화 (Wave 기준):
  - current_wave = {{current_wave}}
  - current_ticket = null
  - attempt_count = 0
  - completed_count = 0  # 이번 Wave에서 완료된 티켓 수
  - blocked_count = 0  # 이번 Wave에서 blocked된 티켓 수
</action>

</step>

<step n="3" goal="현재 Wave에서 다음 티켓 선택 (Agentic Loop Entry)">

<critical>이 단계는 현재 Wave의 모든 티켓이 완료되거나 blocked될 때까지 반복됩니다</critical>
<critical>⚠️ 반드시 현재 Wave에 속한 티켓들만 선택하세요. 다른 Wave 티켓은 무시</critical>

<action>다음 실행 티켓 선택 (우선순위):
  1. ready_queue에서 가장 높은 우선순위 티켓 (현재 Wave만)
  2. ready_queue 비었으면 retry_queue 확인 (현재 Wave만)
  3. 둘 다 비었으면 → Step 8로 이동 (Wave 완료)</action>

<check if="ready_queue empty AND retry_queue empty">
  <goto step="8">Wave 완료 처리 및 pm-reviewer 호출</goto>
</check>

<action>current_ticket 설정</action>
<action>attempt_count = 0 초기화</action>

<check if="parallel_execution_possible AND multiple_tickets_ready">
  <action>티켓 간 병렬 실행:

  병렬 실행 가능한 티켓들을 식별했으면,
  반드시 하나의 응답에서 여러 Task tool을 동시에 호출하세요.

  예시 (3개 티켓 동시 실행):
  ```
  Task tool 호출 1: agent=backend-developer, ticket=T01-003
  Task tool 호출 2: agent=frontend-developer, ticket=T01-004
  Task tool 호출 3: agent=database-architect, ticket=T01-005
  ```

  위 3개를 순차가 아닌 **하나의 메시지에서 동시에** 호출합니다.

  ⚠️ 병렬 불가 조건:
  - 같은 파일을 수정하는 티켓들
  - 의존성이 있는 티켓들 (blocked_by)
  </action>
</check>

<action>티켓 실행 로그:
```
┌─────────────────────────────────────────────────┐
│ 🚀 {{ticket_id}}: {{title}}
├─────────────────────────────────────────────────┤
│ Type: {{type}} | Agent: {{primary_agent}}
└─────────────────────────────────────────────────┘
```
</action>

</step>

<step n="4" goal="컨텍스트 수집">

<action>티켓 실행에 필요한 컨텍스트 수집:
  1. 담당 에이전트 프롬프트: {project-root}/.claude/agents/{{agent}}.md
  2. API 명세서 관련 섹션 추출 (있는 경우)
  3. 의존 티켓 산출물 확인
  4. 기존 코드베이스에서 관련 파일 파악
  5. CLAUDE.md에서 프로젝트 컨텍스트 로드
</action>

<action>🎨 **UI 티켓인 경우: 설계 문서 참조 (라인 번호 기반)**

티켓에 `ui_specification.wireframe_source`가 있으면 해당 설계 문서의 정확한 라인 참조:

```yaml
# 티켓의 ui_specification 예시 (pm-orchestrator가 생성)
ui_specification:
  wireframe_source:
    file: "anyon-docs/planning/ui-ux.html"
    references:
      - lines: "245-320"
        section: "로그인 화면 레이아웃"
      - lines: "890-920"
        section: "화면 전환 인터랙션 JS"

  summary: |
    2단계 로그인 화면:
    - Step 1: 전화번호 입력 → 인증코드 발송
    - Step 2: 인증코드 입력 → 로그인 완료

  key_states:
    - "step: 'phone' | 'code'"
    - "isLoading: boolean"

# 스타일 참조 (design-guide.md)
style_reference:
  source_file: "anyon-docs/planning/design-guide.md"
  lines: "30-70"
  note: "카드 스타일, Primary color"
```

**참조 방법:**
1. `wireframe_source.file`에서 해당 라인 범위 읽기
2. HTML/CSS/JS 구조 분석
3. `summary`, `key_states`로 핵심 요구사항 파악
4. design-guide.md에서 색상/폰트/스타일 확인
5. 구현에 직접 반영
</action>

<action>🗄️ **DB 티켓인 경우: ERD 참조 (TRD 기술 스택 기반)**

티켓에 `database_schema.erd_reference`가 있으면 ERD 문서의 SQL 직접 참조:

```yaml
# 티켓의 database_schema 예시 (pm-orchestrator가 생성)
database_schema:
  erd_reference:
    source_file: "anyon-docs/planning/erd.md"
    references:
      - lines: "45-120"
        section: "users 테이블 정의"
      - lines: "350-420"
        section: "RLS 정책"
      - lines: "500-550"
        section: "트리거 및 함수"

  # TRD 기술 스택에 따라 아래 중 하나가 포함됨:
  prisma_schema: |
    model User { ... }

  # 또는
  raw_sql_reference: |
    -- erd.md 라인 45-180 참조

  migration:
    name: "20240115_add_auth_models"
    erd_sql_lines: "45-180"
```

**TRD 기술 스택에 따른 처리:**
- **Prisma 사용 시**: `prisma_schema` 필드 활용
- **Raw SQL/Supabase 사용 시**: `erd_reference`에서 SQL 직접 추출
- **Drizzle 사용 시**: ERD SQL을 Drizzle 스키마로 변환

**참조 방법:**
1. TRD에서 DB 기술 스택 확인
2. `erd_reference.references`의 라인 범위에서 SQL 추출
3. 기술 스택에 맞게 변환/활용
4. RLS 정책, 트리거도 함께 적용
</action>

<check if="difficulty is hard OR websearch_hints exists">
  <action>WebSearch로 레퍼런스 조사:
    - "{{technology}} {{feature}} implementation 2024 2025"
    - "{{framework}} {{pattern}} best practices"
    - "{{library}} TypeScript example"
  </action>
  <action>조사 결과를 구현 가이드로 정리</action>
</check>

</step>

<step n="5" goal="TDD RED Phase - 테스트 먼저">

<action>티켓의 tdd_tests 섹션에서 테스트 목록 추출</action>
<action>테스트 파일 생성: {{test_file_path}}</action>
<action>테스트 코드 작성</action>
<action>테스트 실행하여 실패 확인 (RED 상태)</action>

<check if="tests pass unexpectedly">
  <action>테스트가 이미 통과함 - 테스트 로직 검토 필요</action>
  <action>테스트 수정하여 실제로 실패하도록 조정</action>
</check>

<action>RED 상태 확인 로그:
```
🔴 RED: {{test_count}}개 테스트 작성 완료 (모두 실패 - 예상대로)
```
</action>

</step>

<step n="6" goal="TDD GREEN Phase - 구현 및 Self-Correction">

<action>attempt_count 증가 (attempt_count = attempt_count + 1)</action>

<action>티켓의 assigned_agents 확인하여 실행 방식 결정</action>

<check if="ticket has multiple assigned_agents AND agents can work in parallel">
  <action>티켓 내 병렬 에이전트 실행:

  한 티켓에 여러 에이전트가 할당되어 있고, 서로 독립적인 작업이면
  반드시 하나의 응답에서 여러 Task tool을 동시에 호출하세요.

  예시 (API + UI 동시 개발):
  ```
  Task tool 호출 1:
  - subagent_type: "general-purpose"
  - prompt: |
      ## Agent: Backend Developer
      Read: {project-root}/.claude/agents/backend-developer.md
      Ticket: {{ticket_id}} - API 구현 부분만
      Output: {{backend_artifacts}}

  Task tool 호출 2:
  - subagent_type: "general-purpose"
  - prompt: |
      ## Agent: Frontend Developer
      Read: {project-root}/.claude/agents/frontend-developer.md
      Ticket: {{ticket_id}} - UI 구현 부분만
      Output: {{frontend_artifacts}}
  ```

  위 2개를 **하나의 메시지에서 동시에** 호출합니다.

  ⚠️ 병렬 불가 조건:
  - 한 에이전트 결과가 다른 에이전트 입력이 되는 경우
  - 같은 파일을 수정해야 하는 경우
  - 순서가 명시된 경우 (order: 1, 2, 3...)
  </action>
</check>

<check if="ticket has single agent OR agents must work sequentially">
  <action>단일/순차 에이전트 실행:
```
Task tool:
- subagent_type: "general-purpose"
- prompt: |
    ## Agent Context
    Read and follow: {project-root}/.claude/agents/{{agent}}.md

    ## Task
    Ticket: {{ticket_id}} - {{title}}

    ## Requirements
    {{ticket_description}}

    ## API Spec (if applicable)
    {{api_spec_content}}

    ## User Flow Logic (if UI ticket)
    {{user_flow_details}}

    ## TDD: Make these tests pass
    {{tdd_tests}}

    ## Output Artifacts
    {{output_artifacts}}

    ## IMPORTANT
    - Follow TDD: Write minimal code to pass tests
    - Use existing patterns from codebase
    - No user interaction - decide autonomously
```
  </action>
</check>

<action>테스트 실행: npm test -- {{test_file}}</action>

<check if="all tests pass">
  <action>GREEN 상태 달성:
  ```
  🟢 GREEN: 모든 테스트 통과 (attempt {{attempt_count}}/3)
  ```
  </action>
  <goto step="7">REFACTOR Phase</goto>
</check>

<check if="tests fail AND attempt_count less than 3">
  <action>Self-Correction 시작 (attempt {{attempt_count}}/3)</action>

  <action>에러 분석:
    1. 에러 메시지 파싱
    2. 스택트레이스에서 실패 위치 파악
    3. 에러 유형 분류 (IMPORT_ERROR, TYPE_ERROR, RUNTIME_ERROR, TEST_FAILURE, UNKNOWN_ERROR)
  </action>

  <check if="error type is IMPORT_ERROR">
    <action>누락된 의존성 확인</action>
    <action>npm install {{missing_package}}</action>
    <action>import 문 수정</action>
  </check>

  <check if="error type is TYPE_ERROR">
    <action>타입 정의 확인</action>
    <action>타입 불일치 수정</action>
  </check>

  <check if="error type is SYNTAX_ERROR">
    <action>문법 오류 위치 파악</action>
    <action>직접 수정</action>
  </check>

  <check if="error type is RUNTIME_ERROR">
    <action>로직 오류 분석</action>
    <action>WebSearch: "{{error_message}} {{framework}} fix"</action>
    <action>수정 적용</action>
  </check>

  <check if="error type is TEST_FAILURE">
    <action>테스트 기대값 vs 실제값 비교</action>
    <action>구현이 틀렸으면 → 구현 수정</action>
    <action>테스트가 틀렸으면 → 테스트 수정 (신중하게)</action>
  </check>

  <check if="error type is UNKNOWN_ERROR">
    <action>WebSearch: "{{error_message}}"</action>
    <action>유사 사례 찾아서 적용</action>
  </check>

  <action>수정 적용 후 재시도</action>
  <goto step="6">재시도</goto>
</check>

<check if="tests fail AND attempt_count equals 3">
  <action>3회 실패 - blocked 처리</action>
  <action>실패 정보 기록:
  ```yaml
  blocked_ticket:
    id: {{ticket_id}}
    reason: "{{last_error_message}}"
    attempts: 3
    last_error_type: {{error_type}}
    affected_files: [{{files}}]
    suggested_fix: "{{ai_suggestion}}"
  ```
  </action>
  <action>CLAUDE.md에 블로커 기록</action>
  <action>blocked_count 증가</action>
  <action>현재 티켓 롤백: git checkout -- {{affected_files}}</action>
  <action>다음 티켓으로 진행 (FAIL_FORWARD)</action>
  <goto step="3">다음 티켓 선택</goto>
</check>

</step>

<step n="7" goal="TDD REFACTOR Phase 및 커밋">

<action>코드 품질 개선:
  - 중복 제거
  - 네이밍 개선
  - 불필요한 코드 제거
</action>

<action>테스트 재실행 - 여전히 통과 확인</action>

<check if="tests fail after refactor">
  <action>리팩토링 롤백</action>
  <action>리팩토링 없이 진행</action>
</check>

<action>REFACTOR 완료:
```
🔵 REFACTOR: 코드 정리 완료, 테스트 통과 유지
```
</action>

<action>Acceptance Criteria 자동 검증:
{{#each acceptance_criteria}}
  - [자동 검증] {{criterion}}
{{/each}}
</action>

<action>통합 검증:
  - npm run build (빌드 가능 여부)
  - npm run lint (린트 에러)
  - 기존 테스트 회귀 확인
</action>

<check if="integration fails">
  <action>통합 실패 분석</action>
  <check if="attempt_count less than 3">
    <action>self-correction 적용</action>
    <goto step="6">재시도</goto>
  </check>
  <check if="attempt_count equals 3">
    <action>현재 티켓만 롤백: git checkout -- {{affected_files}}</action>
    <action>blocked 처리</action>
    <action>blocked_count 증가</action>
    <goto step="3">다음 티켓 선택</goto>
  </check>
</check>

<action>⏳ 현재 티켓 완료:
```
✅ {{ticket_id}} 완료
   📁 산출물: {{output_artifacts}}
   🧪 테스트: {{test_count}}개 통과
   
   💡 주의: 티켓별 커밋은 하지 않음 (Wave 완료 시 일괄 커밋)
```
</action>

<action>completed_count 증가</action>

<action>의존성 업데이트:
  - 이 티켓에 의존하던 티켓들 → ready_queue로 이동
</action>

<action>Progress 파일 실시간 업데이트</action>

<goto step="3">다음 티켓 선택</goto>

</step>

<step n="8" goal="Wave 완료 및 코드 리뷰 대기 (auto-cycle.sh 트리거)">

<action>⚠️ CRITICAL: workflow_state 업데이트 (수정: 2025-11-30 - auto-cycle.sh 연동)

상태 파일 기반 자동화를 위해 execution-progress.md에 상태 설정:

```yaml
# execution-progress.md 최상단에 추가/업데이트:
- **workflow_state**: "awaiting_review"
- **last_state_change**: {{timestamp}}
- **state_changed_by**: "pm-executor"
```

이 상태를 감지한 auto-cycle.sh가 자동으로 pm-reviewer를 트리거합니다.
</action>

<action>Wave 실행 결과 집계:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       {{current_wave}} ({{current_epic}}) 실행 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 완료: {{completed_count}}개
❌ Blocked: {{blocked_count}}개

📊 Wave 진행률: {{wave_progress_percentage}}%
   ({{wave_completed}}/{{wave_total}})

📊 전체 진행률: {{overall_progress_percentage}}%
   ({{total_completed}}/{{total_tickets}})
```
</action>

<check if="blocked_count greater than 0">
  <action>Blocked 티켓 요약:
  ```
  ⚠️ Blocked 티켓 ({{blocked_count}}개):
  {{#each blocked_tickets}}
  ─────────────────────────────────────
  {{ticket_id}}: {{title}}
  원인: {{failure_reason}}
  시도: {{attempts}}회
  제안: {{suggested_fix}}
  {{/each}}
  ```
  </action>
</check>

<action>Progress 파일 상세 업데이트: {progress_file}

Update following sections using execution-progress-template.md as reference:

**필수 업데이트 섹션:**
1. "📊 Current Status" - 모든 메트릭 업데이트
   - {{current_wave}} - 방금 완료한 Wave
   - {{completed_waves}} / {{total_waves}}
   - {{completed_tickets}} / {{total_tickets}}
   - {{overall_progress}}%
   - {{blocked_count}}

2. "🌊 Wave-by-Wave Progress" - 완료된 Wave 섹션
   - Status: "Completed"
   - Tickets: {{wave_completed}}/{{wave_total}}
   - Blocked: {{blocked_in_wave}}
   - Review Status: "In Progress" (pm-reviewer 호출 중)
   - Completed Date: {{timestamp}}

3. "Completed Tickets" - 모든 완료된 티켓 나열
   {{#each completed_tickets}}
   - ✅ {{ticket_id}}: {{title}}
     - Commit: {{commit_hash}}
     - Files: {{files}}
   {{/each}}

4. "Blocked Tickets" - 모든 Blocked 티켓 나열
   {{#each blocked_tickets}}
   - ❌ {{ticket_id}}: {{title}}
     - Reason: {{failure_reason}}
     - Last Error: {{last_error_type}} - {{last_error_message}}
     - Attempts: {{attempts}}/3
     - Suggestion: {{fix_suggestion}}
   {{/each}}

5. "📂 Generated Artifacts" - 이번 Wave에서 생성된 파일/엔드포인트
   - Files Created
   - API Endpoints
   - Database Migrations (if any)

6. "🎯 Next Session Context" - 다음 Wave 준비 정보
   - Next Wave ID: {{next_wave}}
   - Next Wave Name: {{next_wave_name}}
   - Dependencies Ready: Yes/No
   - Prerequisites: [list]
   - First Ticket: {{next_wave_first_ticket}}

7. "🔧 Environment State" - 현재 환경 상태
   - Running Services
   - Installed Dependencies
   - Environment Variables (masked)
   - Database State

8. "📝 Commit History" - 이번 세션의 모든 커밋
   {{#each commits_this_wave}}
   {{hash}} - {{message}}
   {{/each}}

**자동화 팁:**
- template.md 참고하여 필요한 섹션 모두 채우기
- {{variable}} 형식의 모든 값 실제 값으로 치환
- 각 섹션은 다음 세션에서 참고할 중요한 정보임
</action>

<action>🔴 **CRITICAL: CLAUDE.md 업데이트 (수정: 2025-11-29)**

경로: {{claude_context_file}} = {{project-root}}/CLAUDE.md

Wave 완료 후 반드시 다음과 같이 CLAUDE.md 업데이트:

**업데이트 방식:**
```
1️⃣ 파일 열기/생성 (없으면 신규)
   경로: {project-root}/CLAUDE.md

2️⃣ 다음 섹션 추가/업데이트:

```markdown
# Project Context (자동 업데이트)

## 진행 상황
- **완료된 Wave**: {{completed_waves}}/{{total_waves}}
- **완료된 Epic**: {{completed_epics}}/{{total_epics}}
- **완료된 티켓**: {{completed_tickets}}/{{total_tickets}}
- **진행률**: {{progress_percentage}}%
- **마지막 업데이트**: {{timestamp}}

## 실행 환경
- **Node 버전**: {{node_version}} (프로젝트 requirement)
- **패키지 관리**: npm
- **개발 DB**: PostgreSQL (localhost:5432)
- **Redis**: localhost:6379 (rate limiting)
- **실행 명령**: `npm run dev`

## 발견된 패턴 & 컨벤션
{{#each discovered_patterns}}
- **{{category}}**: {{description}}
  예: {{example}}
{{/each}}

샘플 패턴들:
- **폴더 구조**: backend/src/[routes, controllers, services, repositories]
- **네이밍**: camelCase (변수/함수), PascalCase (클래스/컴포넌트)
- **API 응답**: { success: boolean, data?: T, message?: string, error?: ErrorCode }
- **DB 마이그레이션**: Prisma migrate (자동 추적)
- **테스트**: Jest + Supertest (API), React Testing Library (UI)

## 알려진 이슈 & 해결책
{{#each known_issues}}
- **{{issue_title}}**
  원인: {{cause}}
  해결책: {{solution}}
  영향 범위: {{affected_components}}
{{/each}}

샘플 이슈들:
- **PostgreSQL 연결 실패**
  → 원인: .env DATABASE_URL 미설정
  → 해결책: .env에 DATABASE_URL 추가
  
- **Jest 테스트 타임아웃**
  → 원인: 데이터베이스 쿼리 느림
  → 해결책: 모킹 사용 또는 jest.setTimeout(10000)

## 기술 스택 (TRD 기반)
- **Frontend**: React/React Native, Expo, Zustand
- **Backend**: Node.js + Express, Prisma ORM
- **Database**: PostgreSQL 15+
- **Auth**: JWT + SMS (Twilio)
- **Infra**: Docker, GitHub Actions

## 다음 Wave 준비
- **현재 진행**: Wave {{current_wave}}
- **다음 Wave**: {{next_wave}}
- **Prerequisites**: {{prerequisites_list}}

## 에이전트별 작업 이력
- **Backend Developer**: {{completed_backend_tickets}}개 완료
- **Frontend Developer**: {{completed_frontend_tickets}}개 완료
- ... (각 에이전트별)

## 블로커 & 해결 상태
- **Blocked**: {{blocked_count}}개
  - {{ticket_id}}: {{reason}} (해결책: {{suggestion}})

## Context 압축 정보
⚠️ Claude Code가 자동으로 92% 토큰 사용 시 압축합니다.
위 섹션들이 압축되어도 다음 세션에서 로드됨을 보장합니다.
```

3️⃣ 저장
   git add CLAUDE.md
   (pm-executor가 커밋하므로 git commit 불필요)
```

**참고:**
- Claude Code가 자동으로 CLAUDE.md를 컨텍스트에 로드
- 다음 세션에서 여기서부터 시작
- 프로젝트 학습 내용이 누적됨
</action>

<action>Epic 완료 커밋:
```bash
git add .
git commit -m \"wave({{current_wave}}): {{current_wave}} 완료

📊 Wave 결과:
  • 완료 티켓: {{completed_count}}개
  • Blocked 티켓: {{blocked_count}}개
  • 변경 파일: {{file_count}}개
  • 테스트: {{test_count}}개 통과

🤖 Generated by PM Executor (Autonomous)

Co-Authored-By: pm-executor <autonomous@anyon-method>\" (Autonomous)"
```
</action>

<check if="next_wave exists">
  <action>Wave 완료 메시지 출력:
  ```
  🌊 {{current_wave}} 완료했습니다!

  코드 리뷰를 실행합니다...
  /pm-reviewer 워크플로우 자동 호출 중...
  ```
  </action>
  
  <action>Wave 완료 - pm-reviewer 실행 준비됨

Wave가 완료되었습니다. 코드 리뷰를 위해 pm-reviewer를 실행하세요:
```
/pm-reviewer
```
  </action>
  
  <action>pm-reviewer 완료 후 메시지:
  ```
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ {{current_wave}} 완료 & 리뷰 완료!
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  📊 Wave 결과: {{completed_count}} 완료 / {{blocked_count}} blocked

  📁 진행 상황 저장됨: {progress_file}
  📝 프로젝트 컨텍스트 저장됨: CLAUDE.md

  🔄 다음 Wave 실행:
     /pm-executor

     자동으로 {{next_wave}}부터 시작됩니다.

  {{#if next_wave_same_epic}}
  📋 다음: {{next_wave}} - {{next_wave_name}} (같은 Epic 내)
     티켓: {{next_wave_ticket_count}}개
  {{/if}}
  {{#if next_wave_different_epic}}
  📋 다음: {{next_wave}} - {{next_epic_name}} 시작
     티켓: {{next_wave_ticket_count}}개
  {{/if}}
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ```
  </action>
</check>

<check if="all epics completed">
  <goto step="9">프로젝트 완료</goto>
</check>

</step>

<step n="9" goal="프로젝트 완료">

<action>전체 프로젝트 검증:
  1. 전체 테스트 스위트 실행
  2. 프로덕션 빌드 테스트
  3. 린트 검사
</action>

<check if="final validation fails">
  <action>실패 분석 및 자동 수정 시도</action>
  <check if="cannot fix automatically">
    <action>수동 수정 필요 항목 리스트 생성</action>
  </check>
</check>

<action>최종 리포트:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     🎉 PM Executor 완료 - 프로젝트 구현 완료!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 실행 결과:
  • 총 Epic: {{total_epics}}개 완료
  • 총 티켓: {{total_tickets}}개
  • 완료: {{completed_count}}개 ({{success_rate}}%)
  • Blocked: {{blocked_count}}개

📁 생성된 파일: {{total_files}}개
🧪 테스트: {{total_tests}}개 ({{test_pass_rate}}% 통과)
🏗️ 빌드: {{build_status}}

{{#if blocked_count > 0}}
⚠️ 수동 확인 필요:
{{#each final_blocked}}
  - {{ticket_id}}: {{reason}}
{{/each}}
{{/if}}

📝 총 커밋: {{total_commits}}개

🚀 다음 단계:
  1. Blocked 티켓 수동 해결 (있는 경우)
  2. 코드 리뷰
  3. QA 테스트
  4. 배포
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
</action>

<action>Progress 파일 최종 업데이트:
```markdown
# Execution Progress

## 최종 상태
- **상태**: ✅ 프로젝트 구현 완료
- **모든 Epic 완료**
- **완료 시각**: {{timestamp}}
- **성공률**: {{success_rate}}%

## Blocked 티켓 (수동 해결 필요)
{{#each blocked_tickets}}
- {{ticket_id}}: {{title}}
  - 원인: {{reason}}
  - 제안: {{suggestion}}
{{/each}}

## 최종 빌드 상태
- 테스트: {{test_status}}
- 빌드: {{build_status}}
- 린트: {{lint_status}}
```
</action>

</step>
