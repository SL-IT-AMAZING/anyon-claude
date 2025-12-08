# Startup UX Design Workflow Instructions

<critical>The workflow execution engine is governed by: {project-root}/.anyon/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/.anyon/anyon-method/workflows/startup-ux/workflow.yaml</critical>
<critical>Communicate in {communication_language} throughout the workflow process</critical>
<critical>⚠️ ABSOLUTELY NO TIME ESTIMATES - NEVER mention hours, days, weeks, months, or ANY time-based predictions.</critical>
<critical>Target audience: NON-TECHNICAL FOUNDERS - Use clear, accessible language with storytelling and real-world examples</critical>
<critical>Final document: AI-READABLE - Obsessively detailed for AI development agents to implement perfectly</critical>

<critical>🔥 THIS IS THE MOST IMPORTANT WORKFLOW 🔥
User flows MUST be obsessively specific, meticulous, and thorough.
Spend as much time as needed. Quality here = Quality in final product.
Leave NO gaps, NO ambiguity, NO assumptions.
Every click, every screen transition, every error case MUST be defined.</critical>

<workflow>

<step n="0" goal="Load PRD and Introduction">
<action>Load PRD document from {input_prd}</action>

<action>Extract critical information from PRD YAML frontmatter:
- service_type
- platform
- core_features (list)
- target_users_summary
- project_name
</action>

<action>Parse PRD content to understand:
- Each core feature in detail
- Target user personas
- Problem being solved
- MVP scope
</action>

<action>Welcome user in {communication_language}:
"안녕하세요! {{project_name}}의 UX Design 문서를 만들어볼게요.

**PRD에서 가져온 정보:**
📋 프로젝트: {{project_name}}
🔧 서비스 유형: {{service_type}}
📱 플랫폼: {{platform}}
👥 타겟 사용자: {{target_users_summary}}

⭐ **핵심 기능 (PRD에서):**
{{core_features_from_prd}}

지금부터 이 기능들을 실제 화면과 사용자 플로우로 만들어볼 거예요.

**🔥 이 단계가 가장 중요합니다!**
여기서 사용자 플로우를 얼마나 구체적으로 만드느냐가
나중에 나오는 결과물의 품질을 결정해요.

천천히, 꼼꼼하게 만들어갈 테니 시간 걱정 마시고
최대한 상세하게 설명해주세요!"
</action>

<template-output>prd_loaded</template-output>
</step>

<step n="1" goal="Define UX Design Principles">
<action>Based on PRD's target users and platform, establish UX principles</action>

<action>Explain with storytelling:
"먼저 UX 디자인의 기본 원칙을 정할 거예요.
이건 모든 화면과 기능을 만들 때 지켜야 할 '규칙'이에요.

예를 들어 인스타그램의 UX 원칙은:
- 시각 중심: 사진이 가장 크고 눈에 띄게
- 간단한 액션: 좋아요는 더블탭 한 번
- 빠른 피드백: 좋아요 누르면 즉시 하트 애니메이션

{{project_name}}도 타겟 사용자({{target_users_summary}})와
플랫폼({{platform}})에 맞는 원칙이 필요해요."
</action>

<action>Generate platform-specific principle suggestions:

If {{platform}} includes 모바일/앱:
- "한 손으로 쉽게 조작 가능"
- "터치 영역은 최소 44x44px"
- "스와이프 제스처 활용"
- "즉각적인 피드백"

If {{platform}} includes 웹/PC:
- "키보드 단축키 지원"
- "넓은 화면 활용"
- "마우스 호버 상태 명확히"
- "드래그앤드롭 지원"

Based on {{target_users_summary}}:
If 비기술적 사용자:
- "직관적이고 설명 없이도 이해 가능"
- "에러 메시지는 쉬운 말로"
- "온보딩/튜토리얼 제공"

If 전문가/파워유저:
- "효율성 우선 (단축키, 배치 작업)"
- "고급 기능 접근 쉽게"
- "커스터마이징 가능"
</action>

<ask>{{project_name}}의 UX 디자인 원칙을 정해볼게요.
어떤 원칙이 중요할까요? (여러 개 선택 가능)

[동적 생성된 플랫폼별 원칙 4-6개]
[동적 생성된 사용자별 원칙 2-3개]
기타 (직접 추가해주세요)

여러 개 선택하거나 직접 추가해주세요:</ask>

<action>For each selected principle, ask for specific example:
"[선택한 원칙]을 {{project_name}}에서 구체적으로 어떻게 적용할까요?
실제 화면이나 기능으로 예를 들어주세요."
</action>

<action>Store as {{ux_design_principles}}</action>

<template-output>ux_design_principles</template-output>
</step>

<step n="2" goal="Create Complete Screen Inventory">
<critical>Every single screen must be identified and documented.
This is the foundation for user flows.</critical>

<action>Explain screen inventory concept:
"이제 필요한 모든 화면을 찾아낼 거예요.

**화면(Screen)이란?**
사용자가 볼 수 있는 하나의 '페이지' 또는 '뷰'예요.
예를 들어 인스타그램은:
- 로그인 화면
- 피드 화면
- 프로필 화면
- 게시물 작성 화면
- 설정 화면
... 등등

{{project_name}}도 PRD의 핵심 기능마다 필요한 화면을 모두 찾아볼 거예요."
</action>

<action>For each core feature from PRD, systematically identify screens:

Feature-by-feature screen discovery with storytelling:

"자, PRD에서 정의한 핵심 기능들을 하나씩 볼게요.
각 기능마다 어떤 화면이 필요한지 함께 찾아봐요."

For each feature in {{core_features_from_prd}}:

1. Explain feature in user story format:
   "**[기능명]**

   사용자 스토리로 생각해볼게요:
   '{{target_users_summary}} 중 한 명인 철수가 [이 기능]을 쓰려면:
   1. 어디서 시작하나요? (시작 화면)
   2. 무엇을 입력하거나 선택하나요? (입력 화면)
   3. 결과를 어디서 보나요? (결과 화면)
   4. 오류가 나면 어떻게 되나요? (에러 화면)'

   이런 식으로 하나씩 찾아볼게요."

2. Brainstorm all related screens with user:
   - Main screens (primary interaction)
   - Input/form screens
   - Result/output screens
   - Loading/intermediate screens
   - Error screens
   - Empty states
   - Success confirmation screens

3. For EACH identified screen, capture:
   - Screen name (clear, descriptive)
   - Purpose (what user accomplishes)
   - Entry points (how user gets here)
   - Exit points (where user goes next)
   - Key elements displayed
   - Primary actions available

4. Use storytelling to validate completeness:
   "철수가 이 기능을 처음부터 끝까지 쓴다고 생각해봐요.
   - 시작: [화면]
   - 중간: [화면] → [화면]
   - 끝: [화면]

   빠진 화면이 없나요?"
</action>

<action>After all features covered, add common system screens:

Identify必須 system screens based on {{platform}}:
- Authentication screens (로그인, 회원가입, 비밀번호 찾기)
- Onboarding screens (튜토리얼, 권한 요청)
- Settings screens
- Profile/Account screens
- Help/Support screens
- Legal screens (이용약관, 개인정보처리방침)

If {{platform}} includes 앱:
- Splash screen
- Permission request screens
- App settings

If features include 검색:
- Search screen
- Search results
- Empty search state

If features include 알림:
- Notifications screen
- Notification settings
</action>

<action>Create comprehensive screen inventory:

For each screen, document:

```
화면 #[번호]: [화면명]
목적: [사용자가 이 화면에서 무엇을 하는지]
진입 방법: [어디서 이 화면으로 오는지]
주요 요소:
  - [표시되는 정보/컴포넌트 1]
  - [표시되는 정보/컴포넌트 2]
  - ...
주요 액션:
  - [사용자가 할 수 있는 행동 1]
  - [사용자가 할 수 있는 행동 2]
  - ...
다음 화면:
  - [액션] → [목적지 화면]
  - [액션] → [목적지 화면]
특이사항: [있다면]
```
</action>

<action>Review with user:
"자, 지금까지 찾은 화면이 총 [N]개예요:
[화면 목록 간단히 나열]

빠진 화면이 있을까요? 천천히 생각해보세요:
- 사용자가 처음 앱을 열었을 때?
- 에러가 났을 때?
- 인터넷이 끊겼을 때?
- 데이터가 아직 없을 때?
- 성공했을 때 확인 화면?"
</action>

<action>Store complete inventory as {{screen_inventory}}</action>
<action>Generate simple list for YAML as {{primary_screens_list}}</action>
<action>Store total count as {{total_screens}}</action>

<template-output>screen_inventory</template-output>
</step>

<step n="3" goal="Define Screen Hierarchy and Navigation">
<action>Organize screens into logical hierarchy</action>

<action>Explain with examples:
"이제 화면들을 계층 구조로 정리할 거예요.

**왜 계층 구조가 필요한가요?**
예를 들어 인스타그램은:
```
메인 화면 (탭 네비게이션)
├─ 홈 (피드)
│  └─ 게시물 상세
│     └─ 댓글
├─ 검색
│  └─ 검색 결과
│     └─ 프로필
├─ 작성
│  └─ 편집
│     └─ 필터 선택
├─ 알림
└─ 프로필
   ├─ 설정
   └─ 팔로잉/팔로워
```

이런 식으로 정리하면 네비게이션이 명확해져요."
</action>

<action>Based on {{platform}}, suggest navigation patterns:

If 모바일 앱:
- 탭 바 네비게이션 (하단 3-5개 탭)
- 햄버거 메뉴 (측면 메뉴)
- 스택 네비게이션 (뒤로가기로 이전 화면)

If 웹:
- 상단 네비게이션 바
- 사이드바 네비게이션
- 브레드크럼 (경로 표시)

If 하이브리드:
- 반응형 네비게이션 (모바일은 탭, PC는 사이드바)
</action>

<ask>화면들을 어떻게 구조화할까요?

{{platform}}에 적합한 네비게이션 패턴:
[동적 생성된 패턴 3-5개 - 예시 앱과 함께]

어떤 패턴이 {{project_name}}에 맞을까요?</ask>

<action>Based on selection, organize screens into hierarchy:

1. Identify top-level screens (main navigation)
2. Identify child screens (accessed from top-level)
3. Identify modal/overlay screens (temporary, dismissible)
4. Define back navigation flow

For each level, ensure:
- Maximum 3-5 items at top level (cognitive load)
- Clear parent-child relationships
- No orphaned screens (every screen reachable)
- Consistent navigation patterns
</action>

<action>Create visual hierarchy representation:
```
[Root]
├─ [Top Level 1]
│  ├─ [Child 1-1]
│  │  └─ [Grandchild 1-1-1]
│  └─ [Child 1-2]
├─ [Top Level 2]
│  └─ [Child 2-1]
...

Modals/Overlays:
- [Modal 1] (from [Parent Screen])
- [Modal 2] (from [Parent Screen])
```
</action>

<action>Store as {{screen_hierarchy}}</action>

<template-output>screen_hierarchy</template-output>
</step>

<step n="4" goal="🔥 CRITICAL - Define User Flows with Obsessive Detail">
<critical>
This is THE MOST IMPORTANT step of the entire workflow system.
User flows MUST be:
- Obsessively detailed (every single action)
- Include ALL edge cases and error scenarios
- Specify exact UI elements and interactions
- Define all states and transitions
- Leave ZERO ambiguity

Spend as much time as needed. Do NOT rush.
Quality here determines final product quality.
</critical>

<action>Introduce the concept with emphasis:
"🔥 **이제 가장 중요한 작업을 시작합니다!**

**사용자 플로우(User Flow)란?**
사용자가 특정 목표를 달성하기 위해 거치는 모든 단계예요.

**왜 이게 중요한가요?**
- 이 플로우가 구체적일수록 = 개발할 때 명확함
- 이 플로우가 꼼꼼할수록 = 버그가 적음
- 이 플로우가 상세할수록 = 원하는 결과물이 나옴

**예시로 이해해봐요:**

❌ 나쁜 플로우 (너무 추상적):
'사용자가 로그인한다'

✅ 좋은 플로우 (구체적):
'1. 사용자가 로그인 화면에서 이메일 입력란을 탭한다
 2. 키보드가 올라오고 이메일을 입력한다
 3. 비밀번호 입력란을 탭한다
 4. 비밀번호를 입력한다 (입력 시 •••로 표시)
 5. 로그인 버튼을 탭한다
 6. 버튼이 로딩 상태로 변경된다 (스피너 표시)
 7. 서버 응답을 기다린다

 성공 시:
 8a. 메인 화면으로 전환된다 (페이드 인 애니메이션)

 실패 시:
 8b. 에러 메시지가 입력란 아래 빨간색으로 표시된다
 9b. 사용자는 다시 입력할 수 있다'

**지금부터 이런 수준으로 상세하게 만들 거예요!**

**⚡ 효율성 개선:**
로그인, 회원가입, 설정 같은 '당연하게 있어야 하는' 표준 플로우는 제가 자동으로 만들어드릴게요.
{{project_name}}만의 독특한 핵심 기능에만 집중하면 됩니다!"
</action>

<substep n="4a" title="Auto-generate Standard Flows">
<critical>
Standard flows are common patterns that exist in almost every app/web.
Auto-generate these based on PRD analysis to save time.
User only reviews and optionally modifies.
</critical>

<action>Analyze PRD to identify required standard flows:

**Always include (Level 1 - Universal):**
- Authentication flows (if user accounts exist in PRD)
- System screens (settings, profile, legal)
- Error states (network, 404, permissions)
- Loading states
- Empty states

**Conditionally include (Level 2 - Feature-based):**

If {{platform}} includes "모바일" or "앱":
- Splash screen
- Onboarding/tutorial
- Permission requests (camera, location, notifications)
- App settings

If PRD features include "검색" or "탐색":
- Search input
- Search results
- No results state
- Recent searches
- Popular searches

If PRD features include content creation/management:
- List view
- Detail view
- Create/Edit/Delete flows
- Sort/Filter

If PRD features include "소셜" or "커뮤니티":
- Follow/Unfollow
- Like/Unlike
- Comment
- Share
- Report/Block

If PRD features include "결제" or "구매":
- Cart
- Checkout
- Payment method selection
- Payment success/failure
- Order history
- Refund request

If PRD features include "알림" or "notification":
- Notification list
- Notification settings
- Mark as read
- Permission request
</action>

<action>For each identified standard flow, generate complete specification:

For EACH standard flow, create obsessively detailed definition including:
1. All screens involved
2. Step-by-step user actions
3. System responses
4. All error cases
5. Platform-specific interactions (mobile = tap, web = click)
6. Loading states
7. Empty states
8. Success/failure paths

Use platform-appropriate patterns:
- If {{platform}} = 모바일: Touch gestures, haptic feedback, bottom sheets
- If {{platform}} = 웹: Keyboard navigation, hover states, modals
- If {{platform}} = Both: Responsive patterns for each

Example standard flows to generate:

**이메일/비밀번호 로그인:**
```
시작: 사용자가 로그인 화면에 있음

단계 1: 이메일 입력
- 사용자가 이메일 입력란 탭/클릭
- 키보드 나타남 (모바일) / 포커스 표시 (웹)
- 이메일 형식 실시간 검증
- 잘못된 형식 시 빨간색 테두리 + "올바른 이메일을 입력하세요" 메시지

단계 2: 비밀번호 입력
- 비밀번호 입력란 탭/클릭
- 입력 시 ••• 표시
- 눈 아이콘으로 보기/숨기기 토글

단계 3: 로그인 버튼 탭/클릭
- 버튼 비활성화 + 로딩 스피너 표시
- 서버 요청 진행

성공 케이스:
- 메인 화면으로 전환 (페이드 인 애니메이션)
- 환영 토스트 메시지 (선택사항)

실패 케이스:
1. 잘못된 이메일/비밀번호:
   - "이메일 또는 비밀번호가 올바르지 않습니다" 메시지
   - 입력란 빨간색 표시
   - 사용자 재입력 가능

2. 네트워크 에러:
   - "인터넷 연결을 확인해주세요" 메시지
   - 재시도 버튼 표시

3. 서버 에러:
   - "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요"
   - 고객센터 링크 제공

뒤로가기:
- 입력 내용 유지 (다시 돌아왔을 때)
```

This level of detail for ALL standard flows.
</action>

<action>Present generated standard flows to user:

"자, {{platform}}과 PRD 기능을 분석해서 필요한 **표준 플로우 [N]개**를 자동으로 만들었어요!

📋 **자동 생성된 표준 플로우:**

**인증 관련 ([N]개):**
1. 이메일/비밀번호 로그인
2. 소셜 로그인 (Google/Apple)
3. 회원가입 (이메일 인증)
4. 비밀번호 찾기/재설정
5. 로그아웃

**시스템 화면 ([N]개):**
6. 프로필 보기/편집
7. 설정 (알림, 테마, 언어)
8. 이용약관/개인정보처리방침
9. 고객지원

**[서비스 기능별 추가 플로우]:**
10. 검색 플로우
11. 콘텐츠 생성/수정/삭제
...

**에러/빈 화면 ([N]개):**
- 인터넷 연결 끊김
- 404 Not Found
- 권한 거부
- 데이터 없음 (Empty State)
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

이런 플로우들은 거의 모든 {{platform}} 서비스에서 비슷하니까
제가 {{platform}}에 맞게 자동으로 상세하게 만들었어요.

각 플로우는:
✅ 모든 단계가 정의되어 있음
✅ 모든 에러 케이스 포함
✅ {{platform}}에 맞는 인터랙션 (탭/클릭/제스처)
✅ 로딩/애니메이션 명시
✅ 병적으로 상세함!

**⏱️ 시간 절약:** 이 플로우들을 직접 만들면 [예상 시간]이 걸리는데,
자동 생성으로 바로 확인만 하면 됩니다!"
</action>

<ask>표준 플로우를 확인해주세요. 어떻게 하시겠어요?

1. **그냥 쓸게요** - 그대로 사용하고 다음 단계로
2. **몇 개만 수정할게요** - 특정 플로우만 커스터마이징
3. **다시 만들고 싶어요** - 표준 플로우도 처음부터 함께 작성

보통은 1번을 추천드려요. {{project_name}}만의 독특한 기능에 시간을 쓰는 게 더 중요하니까요!</ask>

<action if="사용자가 '그냥 쓸게요' 선택">
"좋아요! 표준 플로우 [N]개를 그대로 사용합니다.
이제 {{project_name}}만의 핵심 기능 플로우에 집중해볼게요!"

Skip to substep 4b
</action>

<action if="사용자가 '몇 개만 수정' 선택">
"어떤 플로우를 수정하고 싶으세요? 번호를 말씀해주세요.
(예: 1, 3, 7)"

For each selected flow number:
- Show the auto-generated flow in detail
- Ask what to modify
- Collaboratively refine that specific flow
- Update the flow specification

After modifications complete, proceed to substep 4b
</action>

<action if="사용자가 '다 다시 만들고 싶어요' 선택">
"알겠습니다! 표준 플로우도 함께 하나하나 만들어볼게요.
시간이 좀 걸리지만 원하시는 대로 만들 수 있어요."

Treat all flows (standard + custom) as custom flows
Proceed to define each one with user collaboration
Go to substep 4c for ALL flows
</action>

<action>Store generated standard flows as {{standard_flows}}</action>
<action>Store count as {{total_standard_flows}}</action>
<action>Generate YAML list as {{standard_flows_list}}</action>

<template-output>standard_flows_complete</template-output>
</substep>

<substep n="4b" title="Identify Custom Flows (Service-Specific)">
<critical>
Focus ONLY on flows that are unique to {{project_name}}.
Standard flows have been auto-generated in substep 4a.
This substep identifies what makes this service special.
</critical>

<action>Explain the distinction:
"이제 {{project_name}}**만의 독특한 기능**을 위한 플로우를 찾을 차례예요.

**표준 플로우 vs 커스텀 플로우 차이:**

표준 플로우 (이미 만들어짐 ✅):
- 로그인, 회원가입, 설정 등
- 거의 모든 앱/웹에 똑같이 있는 것들
- 검증된 패턴 사용

커스텀 플로우 (지금 만들 것 🔥):
- {{project_name}}의 핵심 가치를 제공하는 기능
- 다른 서비스와 차별화되는 부분
- 복잡한 비즈니스 로직
- 독특한 사용자 경험

**예를 들어:**
- 인스타그램: 사진 필터 적용 + 게시 (커스텀)
- 우버: 실시간 매칭 + 경로 추적 (커스텀)
- 넷플릭스: 개인화 추천 + 시청 이어하기 (커스텀)

{{project_name}}는 무엇으로 차별화되나요?"
</action>

<action>Analyze PRD core features to extract custom flows:

From PRD's {{core_features}}, identify which ones are:
1. NOT covered by standard flows
2. Unique to this service
3. Core value proposition
4. Complex business logic
5. Innovative user experience

For each core feature:
- Is this a standard CRUD? → Already covered
- Is this unique to {{project_name}}? → Custom flow needed
- Does this have special logic? → Custom flow needed
- Is this differentiation point? → Custom flow needed
</action>

<action>Present identified custom flows:
"PRD의 핵심 기능을 분석해서 {{project_name}}만의 **커스텀 플로우**를 찾았어요:

**🔥 {{project_name}}의 핵심 플로우 ([N]개):**

1. **[커스텀 플로우 1]**
   - PRD 기능: [해당하는 core_feature]
   - 왜 커스텀인가: [이유 - 예: 독특한 매칭 알고리즘 사용]
   - 복잡도: [간단/중간/복잡]

2. **[커스텀 플로우 2]**
   - PRD 기능: [해당하는 core_feature]
   - 왜 커스텀인가: [이유 - 예: 실시간 협업 기능]
   - 복잡도: [간단/중간/복잡]

...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**시간 배분:**
- 표준 플로우: 자동 생성 완료 ✅
- 커스텀 플로우 [N]개: 여기에 집중! 🔥

이 [N]개 플로우가 {{project_name}}의 품질을 결정합니다.
하나씩 병적으로 상세하게 만들어볼게요!"
</action>

<ask>제가 찾은 커스텀 플로우가 맞나요?
- 빠진 게 있나요?
- 추가하고 싶은 플로우가 있나요?
- 사실 표준 플로우로 충분한 것도 있나요?</ask>

<action>Refine custom flow list based on user feedback</action>

<action>Store custom flow list as {{custom_flow_list}}</action>
<action>Store count as {{total_custom_flows}}</action>
<action>Store combined count: {{total_user_flows}} = {{total_standard_flows}} + {{total_custom_flows}}</action>

<template-output>custom_flows_identified</template-output>
</substep>

<substep n="4c" title="Define Each Custom Flow with Obsessive Detail" repeat="for-each-custom-flow">
<critical>
For EACH CUSTOM flow, follow this rigorous process.
Do NOT skip any sub-step.
Do NOT accept vague answers.
Force specificity at every step.

Remember: Standard flows are already complete.
Focus 100% energy on making these custom flows PERFECT.
</critical>

<action>For current custom flow [N], introduce:
"━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**플로우 #[N]: [플로우 이름]**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

이 플로우는 [사용자가 달성하려는 목표]를 위한 거예요.

지금부터 단계별로 아주 구체적으로 정의할 거예요.
각 단계마다:
- 사용자가 무엇을 보나요?
- 사용자가 무엇을 하나요?
- 시스템은 어떻게 반응하나요?
- 오류가 나면 어떻게 되나요?

이 모든 걸 명확히 할 거예요!"
</action>

<action>Step 1 - Define entry point:
"**시작점 정의**

이 플로우는 어디서 시작하나요?

예시:
- '사용자가 앱을 처음 열었을 때 스플래시 화면'
- '사용자가 메인 화면에서 + 버튼을 탭했을 때'
- '사용자가 프로필에서 설정 아이콘을 클릭했을 때'

{{project_name}}에서는 어떻게 이 플로우가 시작되나요?"

Capture:
- Trigger (what causes flow to start)
- Starting screen
- User's mental state/intent
</action>

<action>Step 2 - Map out every single step with extreme detail:

"이제 사용자가 목표를 달성할 때까지 거치는 모든 단계를 정의해요.

**각 단계마다 다음을 명시해주세요:**

1. **화면 상태**
   - 어떤 화면인가요?
   - 화면에 무엇이 표시되나요?
   - 어떤 UI 요소들이 있나요?

2. **사용자 액션**
   - 사용자가 무엇을 하나요? (탭, 스와이프, 입력, 스크롤 등)
   - 어떤 UI 요소와 상호작용하나요?
   - 무엇을 입력하나요? (있다면)

3. **시스템 반응**
   - 즉시 무슨 일이 일어나나요?
   - UI가 어떻게 변하나요?
   - 로딩이 있나요?
   - 애니메이션은?

4. **다음 상태**
   - 어떤 화면으로 전환되나요?
   - 화면 전환 애니메이션은?
   - 데이터는 어떻게 변하나요?"

For each step, ask probing questions:
- "사용자가 [액션]을 하면 정확히 무슨 일이 일어나나요?"
- "로딩 시간이 있나요? 그 동안 사용자는 무엇을 보나요?"
- "사용자가 실수로 잘못 입력하면요?"
- "인터넷이 끊기면요?"
- "데이터가 없으면요?"

Use storytelling to capture details:
"철수가 [현재 화면]에 있어요.
철수는 [목표]를 하고 싶어서 [액션]을 해요.
그러면 화면에서 무슨 일이 일어나나요?
철수는 그 다음에 무엇을 하나요?"

Document each step in this format:
```
단계 [번호]: [단계 제목]

현재 화면: [화면명]
화면 상태:
- UI 요소 1: [설명]
- UI 요소 2: [설명]
- ...

사용자 액션:
[구체적인 액션 설명]

시스템 반응:
즉시: [즉각적인 피드백]
처리 중: [로딩 상태, 애니메이션]
완료 후: [최종 상태]

다음 화면: [화면명]
전환 방식: [애니메이션/트랜지션]

데이터 변경:
[어떤 데이터가 생성/수정/삭제되는지]
```
</action>

<action>Step 3 - Define ALL alternative paths:

"**대안 경로 정의**

같은 목표를 달성하는 다른 방법이 있나요?

예시:
- 로그인: 이메일/비밀번호 OR 소셜 로그인 OR 생체 인증
- 게시물 작성: 사진 선택 OR 카메라 촬영
- 검색: 검색어 입력 OR 필터 사용 OR 추천 항목 선택

{{project_name}}에서는?"

For each alternative:
- When is this path used?
- How does it differ from main path?
- Where does it rejoin main path?
- Document with same level of detail
</action>

<action>Step 4 - Define ALL error and edge cases:

"**🚨 에러 및 엣지 케이스 (매우 중요!)**

이제 잘못될 수 있는 모든 경우를 찾아요.
이게 진짜 중요해요. 이걸 빠뜨리면 나중에 버그가 돼요.

**체크할 것들:**

1. **입력 에러**
   - 사용자가 잘못된 형식으로 입력하면?
   - 필수 항목을 비워두면?
   - 너무 긴 텍스트를 입력하면?
   - 특수문자를 넣으면?

2. **네트워크 에러**
   - 인터넷이 끊기면?
   - 서버가 응답하지 않으면?
   - 타임아웃이 발생하면?

3. **권한 에러**
   - 카메라/위치 권한이 없으면?
   - 로그인이 필요한데 안 되어 있으면?

4. **데이터 에러**
   - 찾는 데이터가 없으면?
   - 데이터 로딩 실패하면?
   - 중복 데이터면?

5. **시스템 에러**
   - 메모리 부족?
   - 배터리 절약 모드?
   - 오래된 버전?

각 에러마다:
- 어떤 상황에서 발생하나요?
- 사용자에게 어떻게 알려주나요? (에러 메시지 정확한 문구)
- 사용자가 어떻게 복구할 수 있나요?
- UI는 어떻게 보이나요?"

For EACH error case identified, document:
```
에러 케이스: [에러 이름]

발생 조건: [언제 이 에러가 나는지]
발생 단계: [플로우의 어느 단계에서]

사용자 경험:
1. 에러 발생 전 상태: [설명]
2. 에러 발생 순간: [무슨 일이 일어나는지]
3. 에러 메시지: "[정확한 메시지 문구]"
4. 메시지 위치: [화면 어디에 표시되는지]
5. 메시지 스타일: [색상, 아이콘, 애니메이션]

복구 방법:
- 옵션 1: [사용자가 할 수 있는 액션]
- 옵션 2: [대안이 있다면]

복구 후: [어느 상태로 돌아가는지]
```

Force user to think through EVERY possibility:
"[현재 단계]에서 뭐가 잘못될 수 있을까요?
하나씩 같이 찾아봐요:
- 입력은 괜찮을까요?
- 네트워크는?
- 권한은?
- ..."
</action>

<action>Step 5 - Define end state and success criteria:

"**플로우 종료**

이 플로우는 어떻게 끝나나요?

성공 시:
- 최종 화면은?
- 사용자에게 성공을 어떻게 알려주나요?
- 사용자가 다음에 할 수 있는 것은?

실패 시:
- 어디로 돌아가나요?
- 입력한 데이터는 보존되나요?
- 재시도할 수 있나요?"

Document:
```
성공 종료:
- 최종 화면: [화면명]
- 성공 표시: [토스트, 애니메이션, 메시지 등]
- 다음 가능 액션:
  - [액션 1]
  - [액션 2]

실패 종료:
- 복귀 화면: [화면명]
- 데이터 보존: [Yes/No, 어떤 데이터]
- 재시도 옵션: [있다면 어떻게]

부분 완료:
- [중간에 나갈 수 있다면, 진행 상황은 어떻게 저장되는지]
```
</action>

<action>Step 6 - Create visual flow diagram representation:

"마지막으로 이 플로우를 다이어그램으로 표현해볼게요."

Generate text-based flow diagram:
```
[시작] 사용자가 [트리거]
   ↓
[화면 1] - [상태 설명]
   │
   ├─ [액션 A] → [화면 2a] → ...
   ├─ [액션 B] → [화면 2b] → ...
   └─ [에러] → [에러 처리] → ...
```

Or structured format:
```
플로우: [플로우 이름]
목표: [사용자가 달성하려는 것]

메인 경로 (Happy Path):
[화면 1] → [액션] → [화면 2] → [액션] → ... → [완료]

대안 경로:
[화면 X] → [다른 액션] → [화면 Y] → 메인 경로 합류

에러 경로:
[단계 N]에서 [에러] 발생
   → [에러 화면]
   → [복구 옵션]
   → [복귀]
```
</action>

<action>Step 7 - Review and validation with user:

"자, [플로우 이름]에 대한 정의가 완료되었어요!

**검토해볼게요:**

총 [N]단계로 구성되어 있고,
- 메인 경로: [N]단계
- 대안 경로: [N]개
- 에러 케이스: [N]개

**빠진 것이 없는지 확인해봐요:**
- 사용자가 중간에 취소하면?
- 뒤로가기 버튼을 누르면?
- 다른 알림이 오면?
- 백그라운드로 갔다가 돌아오면?

추가하거나 수정할 부분이 있나요?"

Allow user to add/modify until they're satisfied
</action>

<template-output>custom_flow_[n]_complete</template-output>
</substep>

<action>After all custom flows completed, combine with standard flows:

"🎉 모든 플로우 작성이 완료되었습니다!

**📊 최종 플로우 요약:**

**표준 플로우 (자동 생성):** {{total_standard_flows}}개
{{standard_flows_list}}

**커스텀 플로우 (상세 작성):** {{total_custom_flows}}개
{{custom_flow_list}}

**총 플로우:** {{total_user_flows}}개

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**⏱️ 시간 비교:**
- 모든 플로우를 수작업으로 만들었다면: 약 [예상 시간] 소요
- 표준 플로우 자동 생성으로: 약 [실제 소요 시간]만 사용
- 절약된 시간: 약 [절약된 시간] ✨

표준 플로우 자동 생성 덕분에 {{project_name}}만의 핵심 기능에
더 많은 시간과 에너지를 투자할 수 있었어요!"
</action>

<action>Combine standard and custom flows:
Merge {{standard_flows}} and {{custom_flows}} into complete user flows section

Structure:
```
## 🔄 사용자 플로우 (User Flows)

### 📋 표준 플로우
[Auto-generated standard flows - complete with all details]

### 🔥 커스텀 플로우
[User-defined custom flows - obsessively detailed]
```
</action>

<action>Store complete combined flows as {{user_flows}}</action>
<action>Generate summary list for YAML combining both:
{{key_user_flows_list}} = {{standard_flows_list}} + {{custom_flow_list}}
</action>

<template-output>all_user_flows_complete</template-output>
</step>

<step n="5" goal="Define Interaction Patterns">
<action>Based on platform and user flows, define interaction patterns</action>

<action>Explain:
"이제 사용자가 화면과 상호작용하는 구체적인 방법을 정의해요.

**인터랙션 패턴이란?**
사용자가 앱/웹과 소통하는 방식이에요.

예를 들어 모바일 앱은:
- 탭 (버튼 누르기)
- 스와이프 (좌우로 쓸기)
- 롱프레스 (길게 누르기)
- 핀치 줌 (확대/축소)
- 드래그 (끌어서 놓기)

웹은:
- 클릭
- 호버 (마우스 올렸을 때)
- 드래그앤드롭
- 키보드 단축키
- 스크롤

{{platform}}에서 사용할 인터랙션을 정할 거예요."
</action>

<substep n="5a" title="Basic Interactions">
<action>Based on {{platform}}, generate platform-appropriate interaction patterns:

If includes mobile/app:
- Primary: Tap (모든 버튼, 링크)
- Secondary: Swipe (화면 전환, 삭제)
- Gestures: Pull-to-refresh, Long-press (상황 메뉴)

If includes web:
- Primary: Click
- Secondary: Hover states (버튼, 링크)
- Keyboard: Tab navigation, Enter to submit

If includes desktop app:
- All web interactions +
- Drag-and-drop for file operations
- Right-click context menus
- Keyboard shortcuts
</action>

<ask>기본 인터랙션 패턴을 정해볼게요.

{{platform}}에 적합한 패턴들:
[동적 생성된 패턴 5-8개 - 구체적 설명 포함]

어떤 패턴들을 사용할까요? (여러 개 선택)</ask>

<action>For each selected interaction, define specifics:
"[인터랙션 이름]에 대해 구체적으로 정의해요:

- 어떤 요소에 사용되나요?
- 어떤 반응이 있나요? (시각적 피드백)
- 애니메이션은?
- 햅틱 피드백은? (모바일의 경우)
- 사운드는? (있다면)"
</action>

<action>Store as {{basic_interactions}}</action>
</substep>

<substep n="5b" title="Gestures and Input Methods">
<action>Define gesture-specific behaviors</action>

<action>Based on {{platform}} and user flows, identify needed gestures:

From user flows, find:
- Which screens need swipe gestures?
- Which need drag-and-drop?
- Which need pinch-to-zoom?
- Which need pull-to-refresh?

For EACH gesture in use, specify:
- Gesture type
- Where it's used (which screens/elements)
- What it does
- Visual feedback during gesture
- Completion feedback
- Cancellation behavior
</action>

<action>Store as {{gesture_inputs}}</action>
</substep>

<substep n="5c" title="Feedback and Animations">
<action>Define feedback mechanisms for all interactions</action>

<action>Explain importance:
"사용자가 액션을 했을 때 '반응'이 있어야 해요.
그래야 사용자가 '내가 뭔가 했구나'라고 느껴요.

**피드백 종류:**

시각적:
- 버튼이 눌린 상태로 변함 (색 변경, 그림자)
- 로딩 스피너
- 진행 바
- 체크마크 애니메이션
- 에러 shake 애니메이션

햅틱 (모바일):
- 버튼 탭 시 진동
- 성공 시 부드러운 진동
- 에러 시 강한 진동

청각:
- 성공 사운드
- 에러 사운드
- 알림 사운드"
</action>

<action>For each major interaction type, define feedback:

Button tap/click:
- Pressed state: [visual change]
- Release: [animation]
- Success: [feedback]

Form submission:
- Submit moment: [immediate feedback]
- Processing: [loading indicator]
- Success: [completion feedback]
- Error: [error feedback]

Data loading:
- Start: [skeleton screens? spinner?]
- Progress: [progress indicator?]
- Complete: [fade-in animation?]
- Error: [error state display]

Page transitions:
- Transition type: [slide? fade? zoom?]
- Duration: [milliseconds]
- Easing: [linear? ease-in-out?]
</action>

<action>Store as {{feedback_animations}}</action>
</substep>

<action>Store all interaction patterns as {{interaction_patterns_list}} for YAML</action>

<template-output>interaction_patterns</template-output>
</step>

<step n="6" goal="Define Key Components">
<action>Identify and specify reusable UI components</action>

<action>Explain:
"이제 반복적으로 사용되는 UI 컴포넌트를 정의해요.

**컴포넌트란?**
재사용 가능한 UI 조각이에요.

예를 들어 인스타그램의 컴포넌트:
- 게시물 카드 (사진, 좋아요, 댓글)
- 스토리 버블 (동그란 프로필 사진)
- 댓글 아이템 (프사, 이름, 댓글, 시간)
- 버튼 (기본, 강조, 텍스트)
- 입력란

{{project_name}}도 여러 화면에서 반복되는 요소들이 있을 거예요."
</action>

<action>From screen inventory and user flows, identify repeated UI patterns:

Scan for:
- Cards/Items in lists
- Buttons (primary, secondary, tertiary)
- Input fields
- Navigation elements
- Headers/Footers
- Modals/Dialogs
- Empty states
- Loading states
- Error states
</action>

<action>For each component, document:

```
컴포넌트: [이름]

목적: [무엇을 위한 컴포넌트]

사용 위치:
- [화면 1]
- [화면 2]
- ...

구조:
- 요소 1: [설명]
- 요소 2: [설명]
- ...

상태:
- Default: [기본 모습]
- Hover/Pressed: [상호작용 시]
- Disabled: [비활성화 시]
- Loading: [로딩 중]
- Error: [에러 상태]

인터랙션:
- [할 수 있는 액션들]

데이터:
- 필요한 데이터 필드들
```
</action>

<action>Store as {{key_components}}</action>

<template-output>key_components</template-output>
</step>

<step n="7" goal="Define State Management">
<action>Identify all app states that need to be managed</action>

<action>Explain with examples:
"앱/웹은 다양한 '상태'를 기억해야 해요.

**상태(State)란?**
현재 앱이 어떤 상황인지 기억하는 정보예요.

예시:
- 사용자가 로그인되어 있나? (인증 상태)
- 다크모드인가 라이트모드인가? (테마 상태)
- 어떤 탭이 선택되어 있나? (네비게이션 상태)
- 장바구니에 뭐가 있나? (데이터 상태)
- 인터넷이 연결되어 있나? (네트워크 상태)

각 상태마다:
- 초기값은 무엇인가?
- 언제 변경되나?
- 어디서 사용되나?
를 정의해야 해요."
</action>

<action>From user flows and screens, identify states:

Authentication states:
- logged out
- logged in
- session expired

UI states:
- theme (light/dark)
- language
- active tab/screen
- sidebar open/closed

Data states:
- For each major data entity (from PRD features):
  - loading
  - loaded
  - error
  - empty

Network states:
- online
- offline
- slow connection

Form states:
- pristine (untouched)
- dirty (modified)
- validating
- valid
- invalid
- submitting
- submitted

Modal/Overlay states:
- visible/hidden
- transitioning
</action>

<action>For each state category, document:

```
상태 카테고리: [이름]

가능한 값:
- [값 1]: [설명]
- [값 2]: [설명]

초기 상태: [기본값]

변경 시점:
- [이벤트 1] → [새 상태]
- [이벤트 2] → [새 상태]

영향받는 UI:
- [화면/컴포넌트 1]: [어떻게 영향받는지]
- [화면/컴포넌트 2]: [어떻게 영향받는지]

지속성:
- [세션에만? 영구 저장?]
```
</action>

<action>Store as {{state_management}}</action>

<template-output>state_management</template-output>
</step>

<step n="8" goal="Define Edge Cases and Error Handling">
<action>Comprehensive edge case documentation (beyond individual flow errors)</action>

<action>Explain:
"사용자 플로우에서 각 플로우의 에러를 정의했지만,
전체 시스템 수준의 엣지 케이스도 있어요."
</action>

<action>Identify system-level edge cases:

Empty states:
- First-time user (no data)
- Search with no results
- Deleted content
- Expired content

Offline scenarios:
- Lost connection during action
- Never had connection
- Intermittent connection

Permission issues:
- Camera denied
- Location denied
- Notifications denied
- Storage full

Device limitations:
- Low battery
- Low storage
- Small screen
- Old OS version

Concurrent actions:
- Multiple tabs/windows
- Push notification while in-app
- Background data sync conflicts
</action>

<action>For each edge case, document:

```
엣지 케이스: [이름]

발생 상황: [언제/왜 발생]

사용자 경험:
- 사용자가 보는 것: [설명]
- UI 표시: [구체적으로]
- 메시지: "[정확한 문구]"

해결 방법:
- 자동 해결: [시스템이 자동으로 하는 것]
- 사용자 액션 필요: [사용자가 해야 할 것]

대체 기능:
- [이 기능을 못 쓰면, 대신 할 수 있는 것]
```
</action>

<action>Store as {{edge_cases}}</action>

<template-output>edge_cases</template-output>
</step>

<step n="9" goal="Define Layout and Grid">
<action>Define layout system based on platform</action>

<action>Based on {{platform}}, specify:

If web:
- Grid system (12-column? custom?)
- Breakpoints (mobile, tablet, desktop)
- Container max-width
- Spacing system (4px, 8px, 16px...)

If mobile app:
- Screen sizes to support
- Safe area insets (notch, home indicator)
- Orientation support (portrait/landscape)
- Spacing system

If both:
- Responsive strategy
- Mobile-first or desktop-first
</action>

<action>Store as {{layout_grid}}</action>

<template-output>layout_grid</template-output>
</step>

<step n="10" goal="Define Notifications and Permissions">
<action>If applicable, define notification and permission strategies</action>

<action>Check if PRD features require:
- Push notifications
- Location access
- Camera/photo access
- Microphone
- Contacts
- Calendar
- Storage
</action>

<action if="permissions needed">
For each permission:
- When is it requested?
- Why is it needed? (explanation to user)
- What happens if denied?
- Can feature work without it?

For notifications:
- What triggers notification?
- Notification content
- Deep link destination
- Frequency limits
- User control settings
</action>

<action>Store as {{notifications_permissions}}</action>

<template-output>notifications_permissions</template-output>
</step>

<step n="11" goal="Define Accessibility">
<action>Specify accessibility requirements</action>

<action>Based on {{platform}}, include:

For web:
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus indicators
- Alt text for images
- Color contrast ratios

For mobile:
- VoiceOver/TalkBack support
- Dynamic type support
- Sufficient touch target sizes
- Voice control support

For all:
- Error messages readable by screen readers
- Form field labels
- Loading state announcements
</action>

<action>Store as {{accessibility_considerations}}</action>

<template-output>accessibility_considerations</template-output>
</step>

<step n="12" goal="Define Responsive Design">
<action if="platform includes multiple screen sizes">
Specify responsive behavior
</action>

<action>For each screen, define:
- Mobile layout
- Tablet layout (if applicable)
- Desktop layout (if applicable)
- Breakpoint behaviors
- What changes at each breakpoint
</action>

<action>Store as {{responsive_design}}</action>

<template-output>responsive_design</template-output>
</step>

<step n="13" goal="Define Screen-by-Screen Details">
<action>For each screen in inventory, create detailed specification</action>

<action>Using all previous definitions, document each screen:

```
화면: [화면명]
경로: [URL or route]
인증 필요: [Yes/No]

목적:
[이 화면의 목적]

레이아웃:
[구조 설명 - 헤더, 바디, 푸터 등]

UI 요소:
1. [요소명]
   - 타입: [버튼/입력/이미지/...]
   - 위치: [상단/중앙/...]
   - 스타일: [간략 설명]
   - 액션: [무엇을 하는지]

2. [요소명]
   ...

상태:
- Loading: [어떻게 보이는지]
- Empty: [데이터 없을 때]
- Error: [에러 시]
- Success: [정상 시]

인터랙션:
[이 화면에서 가능한 모든 인터랙션]

진입 플로우:
[어디서 이 화면으로 오는지]

이탈 플로우:
[이 화면에서 어디로 가는지]

필요한 데이터:
[이 화면이 표시하는/수집하는 데이터]
```
</action>

<action>Store as {{screen_details}}</action>

<template-output>screen_details</template-output>
</step>

<step n="14" goal="Generate UX Design Document">
<critical>⚠️ YOU MUST USE THE TEMPLATE - DO NOT write the document from scratch</critical>
<critical>The template contains YAML frontmatter which is REQUIRED for document parsing</critical>

<action>Load template from {template}</action>

<action>Fill ALL template variables with collected data:
- {{project_name}} = project name from PRD
- {{date}} = current date
- {{user_name}} = author name
- {{service_type}} = service type from PRD
- {{platform}} = platform from PRD
- {{total_screens}} = screen count
- {{total_user_flows}} = user flow count
- {{primary_screens_list}} = YAML list of primary screens
- {{key_user_flows_list}} = YAML list of key user flows
- {{interaction_patterns_list}} = YAML list of interaction patterns
- All other {{variables}} from previous steps
</action>

<critical>Verify YAML frontmatter is present at the top of the document</critical>
<critical>The document MUST start with "---" followed by YAML metadata</critical>

<action>Ensure document is:
- Obsessively detailed (no ambiguity)
- AI-readable (clear specifications)
- Complete (all screens, flows, states covered)
- Consistent (no contradictions with PRD)
- **Starts with YAML frontmatter from template**
</action>

<action>Create output folder if needed</action>
<action>Save document to {default_output_file}</action>

<action>Show summary to user:
"
🎉 UX Design 문서 작성이 완료되었습니다!

📄 **저장 위치**: {default_output_file}

📊 **작성된 내용:**
- 총 화면 수: {{total_screens}}개
- 사용자 플로우: {{total_user_flows}}개
- 인터랙션 패턴: {{interaction_patterns_list}}
- 주요 컴포넌트: [N]개

🔥 **이 문서는 매우 상세하게 작성되었습니다:**
- 모든 사용자 플로우가 단계별로 정의됨
- 모든 에러 케이스와 엣지 케이스 포함
- 모든 화면과 상태 명시
- AI가 이대로 구현할 수 있는 수준

다음 단계는 **UI Design Guide 워크플로우**입니다.
준비가 되면 기획문서 패널에서 'Design Guide 작성하기' 버튼을 눌러주세요!"
</action>

<template-output>ux_design_complete</template-output>
</step>

</workflow>
