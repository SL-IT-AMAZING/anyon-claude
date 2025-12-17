# Startup UX Design Workflow Instructions

<critical>The workflow execution engine is governed by: {project-root}/.anyon/core/tasks/workflow.xml</critical>

<critical>💡 SKILL CHECK
작업을 수행할 때마다 사용 가능한 스킬 중 현재 상황에 적합한 스킬이 있는지 검토하고, 있으면 사용하세요.
</critical>
<critical>You MUST have already loaded and processed: {project-root}/.anyon/anyon-method/workflows/startup-ux/workflow.yaml</critical>
<critical>Communicate in {communication_language} throughout the workflow process</critical>
<critical>⚠️ ABSOLUTELY NO TIME ESTIMATES - NEVER mention hours, days, weeks, months, or ANY time-based predictions.</critical>
<critical>Target audience: NON-TECHNICAL FOUNDERS - Use clear, accessible language with storytelling and real-world examples</critical>

<critical>🔥 OUTPUT FORMAT: INTERACTIVE HTML MOCKUP 🔥
This workflow outputs ui-ux.html - a CLICKABLE HTML prototype.
- Every button MUST link to something
- Every link MUST be connected
- Users can click through the entire flow
- Use simple box-style wireframe (not pixel-perfect design)
</critical>

<critical>SKILL RECOMMENDATION: frontend-design
Use the `frontend-design` skill when generating the final HTML mockup.
IMPORTANT: This is a WIREFRAME/MOCKUP - NOT a production design!

STRICT RULES FOR WIREFRAME MODE:
- NO EMOJIS: Do not use any emojis in the HTML output
- GRAYSCALE ONLY: Use ONLY black, white, and gray colors (#000, #fff, #333, #666, #999, #ccc, #eee)
- NO COLOR: Absolutely no colored elements - no blue, red, green, purple, etc.
- Simple borders and boxes with 1px solid borders
- No decorative elements, icons, or visual flourishes
- Focus on STRUCTURE and FLOW, not aesthetics
- Keep it raw and schematic - like a blueprint
- The goal is to test UX flow, not to impress with visuals

OVERRIDE frontend-design defaults:
- Ignore all color/theme recommendations from the skill
- Ignore typography styling - use system fonts only
- Ignore motion/animation recommendations
- Ignore background effects and textures</critical>

<critical>QUESTION FORMAT RULE:
모든 질문은 반드시 객관식으로 제시하세요.
- 번호로 선택지를 제공 (1, 2, 3, 4...)
- 마지막 번호는 항상 "기타 (직접 입력)" 또는 주관식 옵션
- 예시:
  1. 옵션 A
  2. 옵션 B
  3. 옵션 C
  4. 기타 (직접 설명해주세요)
</critical>

<workflow>

<step n="0" goal="Load PRD and Introduction">
<action>Load PRD document from {input_prd}</action>

<action>Extract critical information from PRD YAML frontmatter:
- project_name
- service_type
- platform
- project_license_type
- core_features (list)
- target_users_summary
- competitors_list
- opensource.decision
- opensource.base_project
- opensource.base_repo
- opensource.base_tech_stack
- opensource.base_template
- opensource.feature_map
</action>

<action>Parse PRD content to understand:
- Each core feature in detail
- Target user personas
- Problem being solved
- MVP scope
- UX/UI direction hints
- Open source decision and base project (if any)
- Feature-based library selections (if any)
</action>

<action>Check opensource.decision:
If "완성형 활용":
  → Set {{has_base_opensource}} = true, {{opensource_mode}} = "complete"
If "조합해서 개발":
  → Set {{has_base_opensource}} = true, {{opensource_mode}} = "combine"
Else:
  → Set {{has_base_opensource}} = false
</action>

<action>Welcome user in {communication_language}:

**If {{opensource_mode}} == "complete":**
"안녕하세요! {{project_name}}의 UX Design을 시작합니다.

**PRD에서 가져온 정보:**
- 프로젝트: {{project_name}}
- 서비스 유형: {{service_type}}
- 플랫폼: {{platform}}
- 타겟 사용자: {{target_users_summary}}

**기반 오픈소스:** {{opensource.base_project}}
- GitHub: {{opensource.base_repo}}

**핵심 기능:**
{{core_features_from_prd}}

**이 워크플로우의 목표:**
{{opensource.base_project}}의 기존 UX를 분석하고,
{{project_name}}에 맞게 수정/확장할 부분을 정리할 거예요.

시작해볼까요?"

**If {{opensource_mode}} == "combine":**
"안녕하세요! {{project_name}}의 UX Design을 시작합니다.

**PRD에서 가져온 정보:**
- 프로젝트: {{project_name}}
- 서비스 유형: {{service_type}}
- 플랫폼: {{platform}}
- 타겟 사용자: {{target_users_summary}}

**기능별 라이브러리:**
{{opensource.feature_map}}

**핵심 기능:**
{{core_features_from_prd}}

**이 워크플로우의 목표:**
기능별 라이브러리들이 제공하는 UI 컴포넌트를 파악하고,
이를 활용한 화면 구성을 설계할 거예요.

시작해볼까요?"

**Else:**
"안녕하세요! {{project_name}}의 UX Design을 시작합니다.

**PRD에서 가져온 정보:**
- 프로젝트: {{project_name}}
- 서비스 유형: {{service_type}}
- 플랫폼: {{platform}}
- 타겟 사용자: {{target_users_summary}}

**핵심 기능:**
{{core_features_from_prd}}

**이 워크플로우의 목표:**
클릭해서 실제로 둘러볼 수 있는 **인터랙티브 HTML 목업**을 만들 거예요.

⚠️ **참고**: 이 목업은 **구조와 흐름 확인용**이에요. 디자인 퀄리티는 최종 버전이 아니니, 예쁘지 않아도 괜찮아요! 실제 디자인은 다음 단계(UI 디자인 가이드)에서 정해져요.

시작해볼까요?"
</action>

<template-output>prd_loaded</template-output>
</step>

<step n="1" goal="Analyze Open Source UX/UI Components" if="{{has_base_opensource}} == true">

**Case 1: {{opensource_mode}} == "complete"**
<action>Fetch and analyze base open source project:

WebFetch: {{opensource.base_repo}} - README, screenshots, demo
WebSearch: "{{opensource.base_project}} demo", "{{opensource.base_project}} screenshots"
</action>

<action>Present base project UX analysis:
"{{opensource.base_project}}의 기존 UX를 분석했어요!

**기존 화면 구성:**
1. [화면 1] - [설명]
2. [화면 2] - [설명]
3. [화면 3] - [설명]
...

**기존 사용자 플로우:**
- [플로우 1]: [설명]
- [플로우 2]: [설명]

**기존 네비게이션:**
- [네비게이션 구조]
"
</action>

<ask>{{project_name}}에서 어떻게 활용할까요?

**그대로 사용할 화면:**
(번호로 선택, 예: 1, 3, 5)

**수정할 화면:**
(번호로 선택 + 수정 내용)

**새로 만들 화면:**
(추가할 화면 설명)

알려주세요:</ask>

<action>Store as:
- {{reuse_screens}} - 그대로 사용
- {{modify_screens}} - 수정 필요
- {{new_screens}} - 새로 만들기
</action>

**Case 2: {{opensource_mode}} == "combine"**
<action>Analyze UI components provided by each feature library:

For each library in {{opensource.feature_map}}:
- WebFetch: [library docs] - UI components, examples
- WebSearch: "{{library_name}} UI components", "{{library_name}} examples"
- Check: Does it provide pre-built UI? (login form, payment widget, etc.)
</action>

<action>Present library UI component analysis:
"기능별 라이브러리가 제공하는 UI 컴포넌트를 분석했어요!

**{{기능1}}: {{lib1}}**
- 제공 UI: [있음/없음]
- 컴포넌트: [로그인 폼, 소셜 버튼 등]
- 커스터마이징: [가능/제한적]
- 예시 이미지: [있으면 링크]

**{{기능2}}: {{lib2}}**
- 제공 UI: [있음/없음]
- 컴포넌트: [결제 위젯, 카드 입력 폼 등]
- 커스터마이징: [가능/제한적]

**{{기능3}}: {{lib3}}**
- 제공 UI: [있음/없음]
- 컴포넌트: [채팅 UI, 메시지 버블 등]
- 커스터마이징: [가능/제한적]

**UI 통합 전략:**
| 기능 | 라이브러리 UI 사용 | 직접 구현 |
|------|------------------|----------|
| {{기능1}} | [로그인 폼] | [프로필 화면] |
| {{기능2}} | [결제 위젯] | [결제 내역] |
| {{기능3}} | [채팅 UI] | [채팅방 목록] |
"
</action>

<ask>라이브러리 UI를 어떻게 활용할까요?

1. **최대 활용** - 라이브러리 UI 그대로 사용 (개발 빠름)
2. **부분 활용** - 핵심 기능만 라이브러리 UI, 나머지 직접 디자인
3. **참고만** - 라이브러리 UI 스타일만 참고, 직접 구현

번호로 선택:</ask>

<action>Store as {{library_ui_strategy}}
Based on selection, mark which screens use library UI vs custom UI
</action>


<template-output>opensource_ux_analyzed</template-output>
</step>

<step n="2" goal="Define Screen List from Core Features">
<action>Based on PRD's core features, systematically identify all screens</action>

<action>If {{opensource_mode}} == "combine":
Consider library UI components when defining screens:
- Screens using library UI: mark as "[라이브러리]"
- Screens requiring custom UI: mark as "[커스텀]"
</action>

<action>Explain with storytelling:
"먼저 필요한 화면 목록을 만들어볼게요.

**화면(Screen)이란?**
사용자가 볼 수 있는 하나의 '페이지' 또는 '뷰'예요.

PRD의 핵심 기능을 하나씩 보면서
각 기능에 어떤 화면이 필요한지 찾아볼게요.

{{#if library_ui_strategy}}
**참고:** 라이브러리가 제공하는 UI 컴포넌트는 [라이브러리]로 표시할게요.
직접 디자인해야 하는 화면은 [커스텀]으로 표시해요.
{{/if}}"
</action>

<action>For each core feature, identify related screens:

Example approach:
"**[기능명] 기능을 위해 필요한 화면:**

사용자 스토리로 생각해봐요:
'{{target_users_summary}} 중 한 명이 [기능]을 쓰려면...'

1. 어디서 시작하나요? → 시작 화면
2. 무엇을 입력하나요? → 입력/폼 화면
3. 결과를 어디서 보나요? → 결과 화면
4. 오류가 나면? → 에러 상태"
</action>

<action>Add common system screens:
- 스플래시/로딩 (앱의 경우)
- 로그인
- 회원가입
- 비밀번호 찾기
- 메인/홈
- 설정
- 프로필
- 404/에러
</action>

<ask>PRD 기능을 분석해서 화면 목록을 만들었어요:

**기능별 화면:**
[동적 생성된 화면 목록]

**시스템 화면:**
[공통 화면 목록]

총 [N]개 화면이에요.
빠진 화면이 있나요? 추가하고 싶은 화면이 있으면 말씀해주세요:</ask>

<action>Store as {{screen_list}}</action>
<action>Store count as {{total_screens}}</action>

<template-output>screen_list_complete</template-output>
</step>

<step n="3" goal="Define Navigation Structure">
<action>Organize screens into navigation hierarchy</action>

<action>Explain with examples:
"이제 화면들을 어떻게 연결할지 정할 거예요.

예를 들어 인스타그램은:
- 하단에 5개 탭 (홈, 검색, 작성, 릴스, 프로필)
- 각 탭 안에서 세부 화면으로 들어감
- 뒤로가기로 이전 화면으로

{{platform}}에 맞는 네비게이션 패턴을 정해볼게요."
</action>

<action>Based on {{platform}}, suggest navigation patterns:

If 모바일 앱:
- 하단 탭바 (3-5개 탭)
- 햄버거 메뉴
- 스택 네비게이션 (뒤로가기)

If 웹:
- 상단 네비게이션 바
- 사이드바
- 브레드크럼

If 하이브리드:
- 반응형 네비게이션
</action>

<ask>{{platform}}에 맞는 네비게이션 패턴:

1. [패턴 1] - [설명 + 예시 앱]
2. [패턴 2] - [설명 + 예시 앱]
3. [패턴 3] - [설명 + 예시 앱]

어떤 패턴이 {{project_name}}에 맞을까요?</ask>

<action>Create screen hierarchy:
```
[메인 네비게이션]
├─ [탭/메뉴 1]
│  ├─ [하위 화면 1-1]
│  └─ [하위 화면 1-2]
├─ [탭/메뉴 2]
│  └─ [하위 화면 2-1]
...
```
</action>

<action>Store as {{navigation_structure}}</action>

<template-output>navigation_complete</template-output>
</step>

<step n="4" goal="Define User Flows with Click Connections">
<critical>
Every user flow must specify exactly which button leads to which screen.
This is essential for creating the interactive HTML mockup.
</critical>

<action>Explain the importance:
"이제 사용자 플로우를 정의할 거예요.

**중요한 점:**
HTML 목업에서 모든 버튼이 실제로 클릭되어야 하니까,
어떤 버튼이 어떤 화면으로 가는지 정확히 정해야 해요.

예시:
'로그인 화면의 [로그인] 버튼 → 메인 화면으로 이동'
'메인 화면의 [+] 버튼 → 작성 화면으로 이동'
"
</action>

<substep n="3a" title="Define Primary Flows">
<action>For each core feature, define the main user flow:

Flow format:
```
플로우: [플로우 이름]
목표: [사용자가 달성하려는 것]

단계:
1. [화면 A]
   - 사용자가 보는 것: [UI 요소들]
   - 클릭 가능 요소:
     * [버튼 1] → [화면 B]
     * [버튼 2] → [화면 C]
     * [뒤로가기] → [이전 화면]

2. [화면 B]
   - 사용자가 보는 것: [UI 요소들]
   - 클릭 가능 요소:
     * [버튼 1] → [화면 D]
     * [취소] → [화면 A]
...
```
</action>

<action>Ensure EVERY clickable element has a destination:
- 모든 버튼
- 모든 링크
- 모든 탭
- 모든 메뉴 아이템
- 뒤로가기
- X (닫기) 버튼
</action>
</substep>

<substep n="3b" title="Define Error States">
<action>For each flow, define error handling:

- 입력 오류 → 에러 메시지 표시 (같은 화면에서)
- 네트워크 오류 → 에러 화면 또는 토스트
- 권한 오류 → 권한 요청 화면 또는 메시지
</action>

<action>Error state format:
```
에러: [에러 종류]
발생 위치: [화면]
표시 방법: [인라인/모달/토스트/전체화면]
메시지: "[에러 메시지 문구]"
사용자 액션:
  * [재시도] → [원래 액션 다시 시도]
  * [취소] → [이전 화면]
```
</action>
</substep>

<substep n="3c" title="Define Empty States">
<action>For screens with dynamic content, define empty states:

- 검색 결과 없음
- 첫 사용 (데이터 없음)
- 필터 결과 없음
</action>

<action>Empty state format:
```
빈 상태: [상태 이름]
화면: [해당 화면]
표시 내용: [메시지/이미지]
사용자 액션:
  * [CTA 버튼] → [관련 화면]
```
</action>
</substep>

<action>Store all flows as {{user_flows}}</action>

<template-output>user_flows_complete</template-output>
</step>

<step n="5" goal="Define Screen Layouts (Wireframe Level)">
<action>For each screen, define layout structure</action>

<action>Explain wireframe concept:
"이제 각 화면의 레이아웃을 정할 거예요.

**와이어프레임이란?**
화면의 구조를 박스로 표현한 거예요.
색상, 폰트, 아이콘은 나중에 - 지금은 구조만!

예시:
```
┌─────────────────────┐
│      헤더           │
├─────────────────────┤
│                     │
│    콘텐츠 영역       │
│                     │
├─────────────────────┤
│    하단 탭바         │
└─────────────────────┘
```
"
</action>

<action>For each screen in {{screen_list}}, define:

```
화면: [화면 이름]
ID: screen_[영문_아이디]

레이아웃:
┌─────────────────────┐
│ [영역 1]            │
├─────────────────────┤
│ [영역 2]            │
│   - [요소 1]        │
│   - [요소 2]        │
├─────────────────────┤
│ [영역 3]            │
└─────────────────────┘

UI 요소:
1. [요소 이름]
   - 타입: 버튼/입력/텍스트/이미지/리스트
   - 클릭 시: [목적지 화면] 또는 [액션]

2. [요소 이름]
   - 타입: ...
   - 클릭 시: ...
```
</action>

<action>Store as {{screen_layouts}}</action>

<template-output>screen_layouts_complete</template-output>
</step>

<step n="6" goal="Review Connection Map">
<critical>Before generating HTML, verify ALL connections</critical>

<action>Create a connection map:
"모든 클릭 연결이 제대로 되어있는지 확인할게요.

**연결 맵:**
```
[화면 A]
  ├─ [버튼 1] → [화면 B] ✓
  ├─ [버튼 2] → [화면 C] ✓
  └─ [뒤로] → [화면 D] ✓

[화면 B]
  ├─ [버튼 1] → [화면 E] ✓
  └─ [뒤로] → [화면 A] ✓
...
```
"
</action>

<action>Verify:
- [ ] 모든 화면에 진입 경로가 있음
- [ ] 모든 화면에서 나갈 수 있음
- [ ] 모든 버튼이 연결되어 있음
- [ ] 데드엔드(막다른 화면)가 없음
- [ ] 무한 루프가 없음
</action>

<ask>연결 맵을 확인해주세요:

[연결 맵 표시]

혹시 연결이 빠진 곳이 있나요?
모든 버튼이 어딘가로 연결되어 있어야 해요:</ask>

<action>Store as {{connection_map}}</action>

<template-output>connection_map_complete</template-output>
</step>

<step n="7" goal="Generate Interactive HTML Mockup">
<critical>USE SKILL: frontend-design (WIREFRAME MODE)
STRICT REQUIREMENTS - NO EXCEPTIONS:
- NO EMOJIS anywhere in the HTML
- GRAYSCALE ONLY: #000, #fff, #333, #666, #999, #ccc, #eee
- NO COLORS: No blue, red, green, purple, or any chromatic colors
- Simple 1px solid borders only
- No decorative elements, shadows, or gradients
- System fonts only (no custom fonts)
- No animations or transitions
- Focus on clickable areas and navigation flow
Call the skill now to generate the HTML mockup.</critical>

<action>Prepare HTML mockup specifications:

**HTML 구조:**
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <title>{{project_name}} - UX Mockup</title>
    <style>
        /* 기본 스타일 */
        /* 각 화면은 section으로 구분 */
        /* display: none/block으로 화면 전환 */
    </style>
</head>
<body>
    <!-- 각 화면 -->
    <section id="screen_[id]" class="screen">
        <!-- 화면 내용 -->
        <button onclick="showScreen('screen_[target]')">버튼</button>
    </section>

    <script>
        function showScreen(screenId) {
            // 모든 화면 숨기기
            document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
            // 선택한 화면 표시
            document.getElementById(screenId).style.display = 'block';
        }

        // 초기 화면
        showScreen('screen_splash');
    </script>
</body>
</html>
```
</action>

<action>Generate HTML mockup with these requirements:

1. **모든 화면을 section으로 생성**
   - 고유 ID 부여
   - 초기에는 display: none

2. **모든 클릭 요소 연결**
   - onclick="showScreen('target_id')"
   - 또는 onclick="alert('기능 설명')" (백엔드 필요한 경우)

3. **스타일은 심플하게**
   - 박스 기반 와이어프레임 스타일
   - 그레이 색상 위주
   - 클릭 가능 요소는 구분되게

4. **반응형 고려** (platform이 웹인 경우)
   - 모바일 뷰포트 기준
   - max-width 제한

5. **상태 표시 기능**
   - 로딩 상태
   - 에러 상태
   - 빈 상태
</action>

<action>WIREFRAME STYLE RULES (override frontend-design defaults):
- 명확한 시각적 계층 (grayscale contrast only)
- 클릭 가능 요소: border 강조 또는 배경색 차이 (#eee vs #fff)
- 일관된 스페이싱
- 가독성 높은 텍스트 (system fonts only)
- NO EMOJIS, NO COLORS, NO DECORATIONS
</action>

<action>Create output folder if needed</action>
<action>Save HTML mockup to {default_output_file}</action>

<template-output>html_mockup_generated</template-output>
</step>

<step n="8" goal="Final Review and Summary">
<action>Show summary to user:
"
🎉 UX Design HTML 목업이 완성되었습니다!

📄 **저장 위치**: {default_output_file}

📊 **작성된 내용:**
- 총 화면 수: {{total_screens}}개
- 사용자 플로우: {{total_flows}}개
- 모든 버튼 연결 완료 ✓

🔥 **HTML 목업 특징:**
- 브라우저에서 바로 열어볼 수 있어요
- 모든 버튼을 클릭하면 해당 화면으로 이동해요
- 실제 사용 흐름을 체험할 수 있어요

⚠️ **주의**: 이 목업은 **구조와 흐름 확인용**입니다!
- 디자인 퀄리티는 최종 버전이 **아니에요**
- 색상, 폰트, 간격 등은 나중에 예쁘게 다듬어져요
- 지금은 "어떤 화면이 필요하고, 어떻게 연결되는지"만 확인하세요

💡 **테스트 방법:**
1. {default_output_file} 파일을 브라우저에서 열기
2. 각 화면의 버튼들을 클릭해보기
3. 플로우가 자연스러운지 확인하기"
</action>

<template-output>ux_design_complete</template-output>
</step>

</workflow>
