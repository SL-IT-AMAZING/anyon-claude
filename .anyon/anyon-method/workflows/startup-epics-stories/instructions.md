# Startup Epics & Stories Generator - Instructions

<critical>The workflow execution engine is governed by: {project-root}/.anyon/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/.anyon/anyon-method/workflows/startup-epics-stories/workflow.yaml</critical>
<critical>Communicate in {communication_language} throughout the workflow process</critical>
<critical>⚠️ ABSOLUTELY NO TIME ESTIMATES - NEVER mention hours, days, weeks, months, or ANY time-based predictions.</critical>
<critical>This is a FULLY AUTONOMOUS workflow - NO user interaction required. Execute all steps automatically.</critical>

<workflow>

<step n="0" goal="Discover and Load All Required Documents">
<action>Use discover_inputs protocol to automatically load all 6 required documents from startup launchpad</action>

<invoke-protocol name="discover_inputs" />

<action>Verify all 6 documents are loaded successfully:</action>
<action>- {prd_content} - Product Requirements Document</action>
<action>- {ux_design_content} - UX Design Specification</action>
<action>- {design_guide_content} - Design Guide</action>
<action>- {trd_content} - Technical Requirements Document</action>
<action>- {architecture_content} - Architecture Document</action>
<action>- {erd_content} - Entity Relationship Diagram</action>

<check if="any document is missing">
  <action>Report error: "스타트업 런치패드 문서가 완전하지 않습니다. 6개 문서가 모두 필요합니다: PRD, UX Design, Design Guide, TRD, Architecture, ERD"</action>
  <action>List which documents are missing</action>
  <action>STOP workflow execution</action>
</check>

<action>All documents loaded successfully. Proceeding with automatic epic/story generation.</action>

</step>

<step n="1" goal="Automatically Generate Epic Structure">

<critical>Epic 생성 기준 (우선순위 순서로 적용):</critical>

<action>**1순위: 화면/페이지 단위** - {ux_design_content}에서 주요 화면/페이지 식별</action>
<action>**2순위: 사용자 플로우 단위** - {ux_design_content}에서 유저 플로우 다이어그램의 큰 단계 식별</action>
<action>**3순위: 도메인/기능 묶음** - 여러 화면에 걸쳐있지만 관련된 기능 (보조 기준)</action>

<substep n="1a" title="UX Design 분석 - Epic 후보 추출">
<action>Analyze {ux_design_content} thoroughly:</action>

<action>**화면/페이지 식별:**</action>
<action>- 모든 주요 화면과 페이지 목록 작성</action>
<action>- 각 화면이 독립적인 Epic이 될 수 있는지 평가</action>
<action>- 예시: "프로젝트 목록 화면", "칸반보드 화면", "설정 페이지"</action>

<action>**사용자 플로우 식별:**</action>
<action>- 주요 사용자 플로우의 큰 단계 식별</action>
<action>- 여러 화면을 거치는 플로우는 하나의 Epic으로 그룹화</action>
<action>- 예시: "프로젝트 생성 플로우 (생성 → 초기 설정 → 멤버 초대)"</action>

<action>**도메인 기능 식별 (보조):**</action>
<action>- 여러 화면에 걸쳐있는 관련 기능 그룹</action>
<action>- 예시: "사용자 인증 (로그인 + 회원가입 + 비밀번호 재설정)"</action>

<action>Generate initial Epic candidates list with names and descriptions</action>
<action>Store as {{epic_candidates}}</action>
</substep>

<substep n="1b" title="PRD 분석 - Epic에 기능 매핑">
<action>Analyze {prd_content} to map functional requirements to Epic candidates:</action>

<action>For each Epic candidate from step 1a:</action>
<action>- Identify all related functional requirements from PRD</action>
<action>- Map features to the appropriate Epic</action>
<action>- Note any requirements that don't fit existing Epics (create new Epic if needed)</action>

<action>Validate Epic completeness:</action>
<action>- Each Epic should provide "완결된 가치" (complete value) to users</action>
<action>- Epics should be independently releasable units</action>

<action>Store refined Epic list with mapped features as {{epics_with_features}}</action>
</substep>

<substep n="1c" title="보조 문서 분석 - Epic 경계 확정">
<action>Use supplementary documents to refine Epic boundaries:</action>

<action>**From {architecture_content}:**</action>
<action>- Identify system component boundaries</action>
<action>- Ensure Epics align with architectural modules</action>
<action>- Note any technical constraints that affect Epic scope</action>

<action>**From {trd_content}:**</action>
<action>- Identify technology stack implications</action>
<action>- Note any technical groupings that should be separate Epics</action>

<action>**From {erd_content}:**</action>
<action>- Identify data model boundaries</action>
<action>- Ensure related data entities are in the same Epic</action>

<action>**From {design_guide_content}:**</action>
<action>- Note any UI component groupings</action>
<action>- Identify consistent design patterns per Epic</action>

<action>Finalize Epic structure with clear boundaries</action>
<action>Store as {{final_epics}}</action>
</substep>

</step>

<step n="2" goal="Automatically Generate Stories for Each Epic">

<critical>Story 생성 기준:</critical>
<action>- **사용자 액션 단위**: 사용자가 수행하는 하나의 의미 있는 행동</action>
<action>- **테스트 가능 단위**: 기획자가 직접 클릭/타이핑해서 확인 가능</action>
<action>- **독립적으로 완성 가능**: 다른 Story가 없어도 이 기능 자체는 동작</action>
<action>- **UI + 백엔드 포함**: 사용자가 실제로 경험할 수 있는 완성된 기능</action>
<action>- **"사용자가 ~할 수 있다" 형태**: 한 문장으로 표현 가능</action>

<action>For each Epic in {{final_epics}}:</action>

<substep n="2a" title="Story 분해">
<action>**사용자 액션 기반 분해:**</action>
<action>- Epic의 모든 기능을 사용자 액션 단위로 분해</action>
<action>- 각 액션이 "사용자가 [동작]할 수 있다" 형태로 표현되는지 확인</action>
<action>- 예시:</action>
<action>  - "사용자가 새 프로젝트를 만들 수 있다"</action>
<action>  - "사용자가 티켓을 드래그해서 이동할 수 있다"</action>
<action>  - "사용자가 로그인할 수 있다"</action>

<action>**테스트 가능성 검증:**</action>
<action>- 각 Story가 기획자가 직접 테스트할 수 있는 단위인지 확인</action>
<action>- 명확한 입력과 출력이 있는지 검증</action>
<action>- 테스트 시나리오를 한 문장으로 설명 가능한지 확인</action>

<action>**독립성 검증:**</action>
<action>- Story가 다른 Story 없이도 독립적으로 개발 가능한지 확인</action>
<action>- 의존성이 있어도 독립적으로 기능하는지 검증</action>
<action>- 예시: "프로젝트 삭제"는 "프로젝트 목록"에 의존하지만 독립적으로 개발 가능</action>
</substep>

<substep n="2b" title="Story 합치기/쪼개기 판단">
<action>**합치는 경우:**</action>
<action>- 두 기능이 항상 함께 사용되는 경우</action>
<action>- 예시: "티켓 생성"과 "티켓 편집" → "티켓 만들고 수정하기"</action>
<action>- 예시: "프로필 보기"와 "프로필 수정" → "프로필 관리하기"</action>

<action>**쪼개는 경우:**</action>
<action>- 한 Story에 여러 사용자 플로우가 포함된 경우</action>
<action>- 예시: "티켓 관리" → "티켓 생성", "티켓 수정", "티켓 삭제" 3개로 분할</action>

<action>⚠️ **주의**: 기획자 입장에서 너무 세분화되지 않게 주의</action>
<action>⚠️ **개발 시간은 고려하지 않음**: AI가 알아서 개발하므로 시간 신경 안 씀</action>
</substep>

<substep n="2c" title="보조 정보 추가">
<action>Enrich each Story with details from supplementary documents:</action>

<action>**From {trd_content}:**</action>
<action>- Add technical implementation hints</action>
<action>- Specify technology stack to use</action>
<action>- Note any technical constraints</action>

<action>**From {architecture_content}:**</action>
<action>- Add architectural components involved</action>
<action>- Specify API endpoints or services</action>
<action>- Note integration points</action>

<action>**From {erd_content}:**</action>
<action>- Add data models involved</action>
<action>- Specify database operations</action>
<action>- Note data relationships</action>

<action>**From {design_guide_content}:**</action>
<action>- Add UI components to use</action>
<action>- Specify design patterns</action>
<action>- Note styling guidelines</action>

<action>Each Story now contains:</action>
<action>- User-facing description ("사용자가 ~할 수 있다")</action>
<action>- Acceptance criteria (테스트 가능한 기준)</action>
<action>- Technical details (구현 힌트)</action>
<action>- UI/UX specifications</action>
<action>- Data requirements</action>
</substep>

<action>Store generated Stories for this Epic as {{epic_N_stories}}</action>
<action>Repeat for all Epics</action>

</step>

<step n="3" goal="Validate and Adjust Epic/Story Structure">

<critical>Epic 크기 검증 기준: 각 Epic은 3-6개의 Story를 포함해야 함</critical>

<action>For each Epic with its Stories:</action>

<substep n="3a" title="Epic 크기 검증">
<action>Count Stories in this Epic: {{story_count}}</action>

<check if="story_count < 3">
  <action>**너무 작은 Epic** - 조정 필요:</action>
  <action>Option 1: 다른 Epic과 합치기</action>
  <action>- 관련 있는 Epic 찾아서 병합</action>
  <action>- Epic 이름과 설명 업데이트</action>
  <action>Option 2: Story로 강등</action>
  <action>- Epic을 하나의 큰 Story로 변환</action>
  <action>- 관련 Epic에 추가</action>
  <action>Select best option based on context and apply adjustment</action>
</check>

<check if="story_count > 6">
  <action>**너무 큰 Epic** - 분할 필요:</action>
  <action>Analyze Stories to find natural split points:</action>
  <action>- 화면별로 나눌 수 있는가?</action>
  <action>- 플로우 단계별로 나눌 수 있는가?</action>
  <action>- 기능 도메인별로 나눌 수 있는가?</action>
  <action>Split into 2 or more Epics, each with 3-6 Stories</action>
  <action>Update Epic names and descriptions</action>
</check>

<check if="story_count >= 3 && story_count <= 6">
  <action>✅ **적절한 Epic** - 크기가 이상적임</action>
  <action>No adjustment needed</action>
</check>
</substep>

<substep n="3b" title="Story 품질 재검증">
<action>For each Story in this Epic:</action>

<action>**독립성 확인:**</action>
<action>- AI가 이 Story만으로 Plan → Dev 사이클을 완료할 수 있는가?</action>
<action>- 다른 Story에 대한 의존성이 너무 강하지 않은가?</action>

<action>**테스트 가능성 확인:**</action>
<action>- 기획자가 직접 테스트할 수 있는 명확한 결과물이 있는가?</action>
<action>- Acceptance criteria가 측정 가능한가?</action>

<action>**완결성 확인:**</action>
<action>- UI + 백엔드가 모두 포함되어 있는가?</action>
<action>- 사용자가 실제로 경험할 수 있는 기능인가?</action>

<action>If any Story fails validation, refine or split/merge as needed</action>
</substep>

<action>Store validated and adjusted Epics with Stories as {{validated_epics}}</action>

</step>

<step n="4" goal="Automatically Generate All Files">

<critical>파일 구조: 에픽별 서브폴더</critical>

<action>Create output directory structure:</action>
<action>- {epics_folder}/ (main epics directory)</action>
<action>- {epics_folder}/epic-N-{name}/ (one folder per epic)</action>

<substep n="4a" title="Generate epics.md (통합 개요)">
<action>Create the main overview file at {default_output_file}</action>

<action>Content structure:</action>
<action>- Project overview and context</action>
<action>- List all Epics with:</action>
<action>  - Epic number and name</action>
<action>  - Brief description</action>
<action>  - Story count</action>
<action>  - Link to Epic file</action>
<action>- Summary statistics:</action>
<action>  - Total Epics: {{total_epics}}</action>
<action>  - Total Stories: {{total_stories}}</action>
<action>  - Average Stories per Epic: {{avg_stories}}</action>

<action>Use template variables from template.md</action>
<action>Save to {default_output_file}</action>
</substep>

<substep n="4b" title="Generate Epic Files">
<action>For each Epic in {{validated_epics}}:</action>

<action>Create Epic folder: {epics_folder}/epic-{{epic_number}}-{{epic_name_kebab}}/</action>

<action>Create epic.md inside the folder with:</action>
<action>- Epic title and description</action>
<action>- Epic goal and value proposition</action>
<action>- List of all Stories in this Epic:</action>
<action>  - Story number and name</action>
<action>  - Brief description</action>
<action>  - Link to Story file</action>
<action>- Technical notes from Architecture/TRD</action>
<action>- Data model notes from ERD</action>
<action>- Design notes from Design Guide</action>

<action>Save to {epics_folder}/epic-{{epic_number}}-{{epic_name_kebab}}/epic.md</action>
</substep>

<substep n="4c" title="Generate Story Files">
<action>For each Story in this Epic:</action>

<action>Create story-{{story_number}}-{{story_name_kebab}}.md with:</action>

<action>**Story Header:**</action>
<action>- Story ID: epic-{{epic_number}}-story-{{story_number}}</action>
<action>- Story Title: "사용자가 [동작]할 수 있다"</action>
<action>- Epic Reference: Link back to parent Epic</action>

<action>**Description:**</action>
<action>- User-facing functionality description</action>
<action>- Why this Story is valuable</action>
<action>- User flow/journey for this Story</action>

<action>**Acceptance Criteria:**</action>
<action>- Specific, testable criteria</action>
<action>- Based on PRD requirements</action>
<action>- UI/UX expectations from UX Design</action>

<action>**Technical Details:**</action>
<action>- Technology stack from TRD</action>
<action>- Architecture components from Architecture doc</action>
<action>- Data models from ERD</action>
<action>- UI components from Design Guide</action>

<action>**Implementation Hints:**</action>
<action>- Key technical considerations</action>
<action>- Integration points</action>
<action>- Dependencies (if any)</action>

<action>**Test Scenarios:**</action>
<action>- How to test this Story</action>
<action>- Expected results</action>

<action>Save to {epics_folder}/epic-{{epic_number}}-{{epic_name_kebab}}/story-{{story_number}}-{{story_name_kebab}}.md</action>
</substep>

<action>All files generated successfully</action>

</step>

<step n="5" goal="Report Completion">

<action>Generate completion summary in {communication_language}:</action>

<action>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</action>
<action>✅ **스타트업 런치패드 → 에픽/스토리 생성 완료!**</action>
<action>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</action>

<action>**생성된 파일:**</action>
<action>📋 통합 개요: {default_output_file}</action>
<action>📦 총 에픽: {{total_epics}}개</action>
<action>📝 총 스토리: {{total_stories}}개</action>
<action>📊 에픽당 평균 스토리: {{avg_stories}}개</action>

<action>**파일 위치:**</action>
<action>{epics_folder}/</action>
<action>├── epic-1-{{name}}/</action>
<action>│   ├── epic.md</action>
<action>│   ├── story-1-{{name}}.md</action>
<action>│   ├── story-2-{{name}}.md</action>
<action>│   └── ...</action>
<action>├── epic-2-{{name}}/</action>
<action>│   └── ...</action>
<action>└── ...</action>

<action>**적용된 기준:**</action>
<action>✅ Epic: 화면/페이지 → 플로우 → 도메인 (우선순위)</action>
<action>✅ Epic 크기: 3-6 stories per epic</action>
<action>✅ Story: 사용자 액션, 테스트 가능, UI+백엔드 포함</action>
<action>✅ 독립적 완성 가능한 단위</action>

<action>**다음 단계:**</action>
<action>1. epics.md에서 전체 구조 확인</action>
<action>2. 각 Epic 폴더의 epic.md 검토</action>
<action>3. 개별 Story 파일로 AI 개발 진행</action>
<action>   - 각 Story를 Plan 모드로 넘겨서 구현 계획 수립</action>
<action>   - AI가 자동으로 개발 진행</action>

<action>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</action>

</step>

</workflow>
