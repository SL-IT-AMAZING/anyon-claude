# Story Implementation Plan - Workflow Instructions

<critical>The workflow execution engine is governed by: {project-root}/.anyon/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/.anyon/custom/workflows/story-implementation-plan/workflow.yaml</critical>
<critical>Communicate in {communication_language} throughout the workflow</critical>
<critical>🎯 TARGET AUDIENCE: 비개발자 - 모든 질문과 설명은 비개발자가 이해할 수 있는 쉬운 용어로</critical>
<critical>📝 OUTPUT: 개발자/AI용 - 최종 계획서는 기술적 세부사항 포함</critical>

<workflow>

<step n="0" goal="Parse story path and load all documents">

  <action if="story_path is empty">
    Ask user: "구현 계획을 만들 스토리 파일의 경로를 입력해주세요.

    예시: anyon-docs/epics/epic-1-사용자-인증/story-1-회원가입.md"

    Store the input as {{story_path}}
  </action>

  <action>Verify that story_path file exists</action>
  <action if="file does not exist">
    Show error: "스토리 파일을 찾을 수 없습니다: {story_path}"
    Ask user to provide correct path
  </action>

  <action>Parse story_path to extract:
  - epic_folder = directory path of story file (e.g., "anyon-docs/epics/epic-1-사용자-인증")
  - epic_name = basename of epic_folder (e.g., "epic-1-사용자-인증")
  - story_file_name = basename of story_path (e.g., "story-1-회원가입.md")
  - story_name = story_file_name without .md extension (e.g., "story-1-회원가입")
  - output_plan_path = {epic_folder}/{story_name}-plan.md
  </action>

  <action>Load documents in this exact order:

  1. Epic document FIRST (필수):
     - Path: {epic_folder}/epic.md
     - Read completely

  2. Story document:
     - Path: {story_path}
     - Read completely

  3. Planning documents (6개 기획 문서):
     - {prd_path}
     - {ux_design_path}
     - {design_guide_path}
     - {trd_path}
     - {architecture_path}
     - {erd_path}
     - Read each completely
  </action>

  <action>Display summary to user in Korean:
  "📚 문서 로딩 완료

  ✓ Epic: {epic_name}
  ✓ Story: {story_name}
  ✓ 기획 문서: 6개 (PRD, UX Design, Design Guide, TRD, Architecture, ERD)

  계획서 저장 위치: {output_plan_path}"
  </action>

</step>

<step n="1" goal="Codebase review and analysis">

  <critical>🔍 코드베이스 분석 - 기존 코드 패턴과 재사용 가능한 코드 탐색</critical>

  <action>Analyze the entire codebase structure:

  1. **Project Environment**:
     - Identify framework and version (Next.js, React, Vue, etc.)
     - Identify UI library (Tailwind, MUI, Chakra, etc.)
     - Identify state management (Zustand, Redux, Context, etc.)
     - Identify database and ORM (PostgreSQL+Prisma, MySQL, MongoDB, etc.)
     - Folder structure pattern

  2. **Reusable Components Discovery**:
     - Search for similar UI components
     - Check /components, /app, /src directories
     - Identify which components can be reused
     - Identify which components need to be created

  3. **Existing Code Patterns**:
     - API patterns (how are endpoints structured?)
     - Component patterns (how are components organized?)
     - State management patterns (how is state handled?)
     - Form patterns (React Hook Form, Formik, etc.)
     - Validation patterns (Zod, Yup, etc.)

  4. **Current Database Schema**:
     - Read schema files (schema.prisma, migrations, etc.)
     - Understand existing tables and relationships
     - Identify what exists vs what needs to be added

  5. **Gap Analysis**:
     - List what already exists (can reuse)
     - List what needs to be modified
     - List what needs to be created from scratch
  </action>

  <action>Present codebase analysis to user in NON-TECHNICAL Korean:

  "🔍 코드베이스 분석 결과

  **현재 프로젝트 환경**:
  - 프레임워크: {{framework_in_simple_terms}}
  - 디자인 시스템: {{ui_library_in_simple_terms}}
  - 데이터 관리: {{state_and_db_in_simple_terms}}

  **재사용 가능한 코드 발견**:
  ✅ {{component_1}} - {{simple_explanation}}
  ✅ {{component_2}} - {{simple_explanation}}
  ❌ {{missing_component}} - 없음 (새로 만들어야 함)

  **비슷한 기능 발견**:
  📁 {{similar_feature_1}} - {{simple_explanation}}
     예: {{simple_example}}

  **데이터베이스 현황**:
  - 현재 있는 테이블: {{existing_tables_simple}}
  - 추가 필요: {{what_needs_to_be_added}}

  **작업 요약**:
  - ♻️ 재사용: {{reusable_count}}개
  - 🔧 수정: {{modify_count}}개
  - 🆕 신규: {{new_count}}개"

  Use simple analogies and avoid technical jargon.
  </action>

  <template-output>codebase_analysis</template-output>

</step>

<step n="2" goal="Story requirements analysis">

  <action>Analyze the Story requirements with context from Epic and planning documents:

  1. **Story Summary** (in simple Korean):
     - What is the user trying to do?
     - What value does this provide?
     - What are the main features?

  2. **Map to Existing Code**:
     - Which parts can use existing code?
     - Which parts need new code?
     - Which parts need modification?

  3. **Identify Ambiguities**:
     - What is not clearly specified?
     - What decisions need to be made?
     - What options are available?

  4. **Implementation Approaches**:
     - List possible ways to implement each feature
     - For each approach, note pros/cons
  </action>

  <action>Present story analysis to user in NON-TECHNICAL Korean:

  "📖 스토리 분석 결과

  **이 스토리의 목표**:
  {{user_goal_in_simple_terms}}

  **필요한 기능들**:
  1. {{feature_1_simple}}
  2. {{feature_2_simple}}
  3. {{feature_3_simple}}

  **기존 코드 활용 계획**:
  - ✅ 재사용 가능: {{what_can_be_reused}}
  - 🔧 수정 필요: {{what_needs_modification}}
  - 🆕 새로 만들기: {{what_needs_creation}}

  **결정이 필요한 부분**:
  - {{decision_point_1}}
  - {{decision_point_2}}
  - {{decision_point_3}}"
  </action>

  <template-output>story_analysis</template-output>

</step>

<step n="3" goal="Generate non-technical questions with dynamic options">

  <critical>🎯 비개발자 대상 질문 생성
  - 모든 질문은 쉬운 한국어로
  - 각 질문마다 동적으로 3-5개 선지 생성
  - 선지마다 장단점 명시
  - 기술 용어 사용 금지 (또는 쉬운 설명 추가)
  </critical>

  <action>For each decision point identified in Step 2, create questions following this pattern:

  **질문 구조**:
  1. 질문 제목 (쉬운 한국어, 비유 활용)
  2. 배경 설명 (왜 이 결정이 필요한지)
  3. 현재 상황 요약 (Step 1의 코드베이스 분석 기반)
  4. 3-5개 동적 선지:
     - 선지 제목 (1줄, 쉬운 용어)
     - 👍 장점 (1-2개, 비개발자가 이해 가능)
     - 👎 단점 (1-2개, 솔직하게)
     - ⭐ 추천 여부 (상황에 따라)

  **질문 카테고리**:

  Category 1: 구현 방법 선택
  - 기존 방식 재활용 vs 새로운 방식
  - 예: "팝업 창을 어떻게 만들까요?"

  Category 2: 컴포넌트/기능 재사용
  - 기존 것 재사용 vs 새로 만들기
  - 예: "색상 선택 기능을 어떻게 만들까요?"

  Category 3: 데이터 처리 방식
  - 즉시 처리 vs 백그라운드 처리
  - 예: "프로젝트 생성을 어떻게 처리할까요?"

  Category 4: 에러/예외 처리
  - 여러 처리 방법 비교
  - 예: "같은 이름의 프로젝트가 있으면 어떻게 할까요?"

  Category 5: 범위 및 우선순위
  - 지금 vs 나중에
  - 예: "이 기능을 지금 만들까요, 나중에 만들까요?"

  Category 6: 통합 및 의존성
  - 다른 기능과의 연결
  - 예: "이 기능이 다른 화면과 어떻게 연결될까요?"
  </action>

  <example>
  ❌ 나쁜 질문 (개발자 용어):
  "Dialog implementation approach?"
  1. Shadcn Dialog with DialogTrigger pattern
  2. Headless UI with custom styling
  3. React Portal with useState

  ✅ 좋은 질문 (비개발자 친화):
  "프로젝트 생성 팝업 창을 어떻게 만들까요?

  현재 프로젝트에는 '설정 화면'에서 쓰는 팝업이 이미 있어요.
  이것과 비슷한 디자인과 동작 방식입니다.

  1️⃣ 기존 설정 팝업 방식 재활용
     👍 빠르고 안정적 (이미 검증된 방식)
     👍 다른 팝업들과 디자인이 통일됨
     👎 약간의 제약 있음 (기존 디자인 패턴 따라야 함)
     ⭐ 추천: 대부분의 경우 이 방식이 좋습니다

  2️⃣ 완전히 새로운 팝업 만들기
     👍 원하는 대로 자유롭게 디자인 가능
     👍 이 화면에 최적화된 기능 추가 가능
     👎 개발 시간 더 필요 (약 2배)
     👎 버그 테스트 필요

  3️⃣ 외부 팝업 라이브러리 사용
     👍 고급 기능 많음 (애니메이션, 다양한 옵션)
     👍 유지보수 필요 없음
     👎 프로젝트 용량 약간 증가
     👎 새로운 의존성 추가 (나중에 문제 가능성)

  어떤 방식을 선호하시나요? (번호로 답변)"
  </example>

  <action>Generate 5-10 questions based on the story complexity</action>
  <action>Display all questions to user in Korean</action>
  <action>Wait for user responses</action>

  <template-output>questions_and_options</template-output>

</step>

<step n="4" goal="Collect user decisions and additional requirements">

  <action>For each question from Step 3:

  1. Collect user's choice (option number)
  2. Ask if they have additional comments:
     "추가로 요청하실 사항이나 제약사항이 있으신가요? (선택사항)"
  3. Store the decision with rationale
  </action>

  <action>After all questions answered, confirm with user:

  "✅ 모든 결정 완료!

  **선택하신 내용 요약**:
  1. {{decision_1_summary}}
  2. {{decision_2_summary}}
  3. {{decision_3_summary}}
  ...

  **추가 요구사항**:
  {{additional_requirements_if_any}}

  이제 이 내용을 바탕으로 상세한 구현 계획서를 작성하겠습니다.
  계속 진행할까요? (y/n)"
  </action>

  <template-output>user_decisions</template-output>

</step>

<step n="5" goal="Generate detailed implementation plan for developers/AI">

  <critical>🤖 개발자/AI용 상세 계획서 작성
  - 기술적 세부사항 모두 포함
  - 실제 파일 경로 명시
  - 코드 예시 포함
  - 비개발자 타겟 신경 쓰지 않음
  </critical>

  <action>Generate implementation plan using template.md structure:

  The plan MUST include:

  **0. Codebase Analysis Results**:
  - From Step 1 analysis
  - Technical details (not simplified)
  - Actual file paths
  - Code examples from existing codebase

  **1. UI/UX Implementation**:
  - Component tree with actual paths
  - Props interfaces (TypeScript)
  - State management details
  - Layout specifications (Tailwind/CSS)
  - Interaction details

  **2. API Design**:
  - Exact endpoints (POST /api/projects)
  - Request/Response TypeScript interfaces
  - Validation rules (Zod schemas)
  - Error handling (status codes, messages)
  - Processing logic step-by-step

  **3. Database Schema**:
  - Schema changes (ALTER TABLE, CREATE TABLE)
  - Migration files (up/down SQL)
  - Current schema for reference
  - Indexes and constraints

  **4. State Management**:
  - Global state (Zustand/Redux code)
  - Local state (useState/useReducer)
  - Server state (React Query)
  - Actual code examples

  **5. Validation & Error Handling**:
  - Zod schemas (actual code)
  - Client-side validation
  - Server-side validation
  - Error messages mapping

  **6. Testing Strategy**:
  - Unit tests (what to test)
  - Integration tests
  - E2E tests (Playwright/Cypress examples)

  **7. Performance & Security**:
  - Optimization strategies
  - Security measures
  - Metrics goals

  **8. Implementation Checklist**:
  - Phase-by-phase breakdown
  - File-by-file changes
  - Testing steps
  - Deployment steps

  **9. Acceptance Criteria**:
  - From original story
  - Additional from planning

  **10. Key Decisions**:
  - Record all decisions from Step 4
  - Include rationale
  - Note trade-offs
  </action>

  <action>Write the implementation plan to template variables for rendering</action>

  <template-output>implementation_plan</template-output>

</step>

<step n="6" goal="Review and final approval" repeat="until-approved">

  <action>Display the complete implementation plan to user</action>

  <action>Show review checklist in Korean:

  "📋 검토 포인트

  다음 사항들을 확인해주세요:

  ✓ 모든 요구사항이 반영되었나요?
  ✓ 기존 코드와 일관성이 있나요?
  ✓ 재사용 결정이 적절한가요?
  ✓ 빠진 예외 케이스는 없나요?
  ✓ 성능이나 보안 이슈는 없나요?

  계획서를 승인하시겠습니까?

  1️⃣ 승인 - 계획서 저장하고 완료
  2️⃣ 수정 필요 - 어떤 부분을 수정할지 알려주세요
  3️⃣ 처음부터 다시 - Step 3부터 다시 시작"
  </action>

  <ask>선택해주세요 (1/2/3):</ask>

  <check if="user chooses 1 (승인)">
    <action>Save implementation plan to file: {output_plan_path}</action>
    <action>Display success message:

    "✅ 구현 계획서 저장 완료!

    📄 저장 위치: {output_plan_path}

    이제 이 계획서를 바탕으로 AI가 100% 자동으로 개발할 수 있습니다.

    다음 단계:
    - 개발 워크플로우 실행
    - 또는 직접 구현 시작

    계획서에 모든 세부사항이 포함되어 있으니 언제든 참고하세요! 🚀"
    </action>
    <break>Exit workflow</break>
  </check>

  <check if="user chooses 2 (수정)">
    <action>Ask: "어떤 부분을 수정하시겠습니까? 구체적으로 알려주세요."</action>
    <action>Collect modification requests</action>
    <action>Update implementation plan in Step 5</action>
    <continue>Go back to review</continue>
  </check>

  <check if="user chooses 3 (처음부터)">
    <goto step="3">Restart from questions</goto>
  </check>

</step>

</workflow>
