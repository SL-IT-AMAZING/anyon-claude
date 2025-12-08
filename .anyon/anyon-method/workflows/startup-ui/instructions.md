# Startup UI Design Guide Workflow Instructions

<critical>The workflow execution engine is governed by: {project-root}/.anyon/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/.anyon/anyon-method/workflows/startup-ui/workflow.yaml</critical>
<critical>Communicate in {communication_language} throughout the workflow process</critical>
<critical>⚠️ ABSOLUTELY NO TIME ESTIMATES - NEVER mention hours, days, weeks, months, or ANY time-based predictions.</critical>
<critical>Target audience: NON-TECHNICAL FOUNDERS - Use clear, accessible language with storytelling and real-world examples</critical>
<critical>Final document: AI-READABLE - Include all technical details, links, versions for implementation</critical>

<critical>🔍 WEB SEARCH IS MANDATORY
For EVERY technical decision (UI library, component, tool):
- Use WebSearch to find latest options
- Use WebFetch to get detailed information
- Present 4-8 options with pros/cons
- Let user choose based on informed decision</critical>

<workflow>

<step n="0" goal="Load Previous Documents and Introduction">
<action>Load PRD from {input_prd}</action>
<action>Load UX Design from {input_ux}</action>

<action>Extract from PRD YAML:
- service_type
- platform
- project_name
- core_features
</action>

<action>Extract from UX Design YAML:
- key_components (주요 컴포넌트들)
- interaction_patterns
- total_screens
</action>

<action>Parse UX Design content for:
- Screen structure
- User flows
- Specific component needs
</action>

<action>Welcome user in {communication_language}:
"안녕하세요! {{project_name}}의 UI Design Guide를 만들어볼게요.

**이전 문서에서 가져온 정보:**
📋 프로젝트: {{project_name}}
🔧 서비스 유형: {{service_type}}
📱 플랫폼: {{platform}}
🎨 UX에서 정의한 화면 수: {{total_screens}}개
🧩 UX에서 정의한 주요 컴포넌트: {{key_components_from_ux}}

지금부터 실제로 사용할 UI 컴포넌트 라이브러리를 찾아드릴게요.
인터넷에서 실시간으로 검색해서 여러 옵션을 보여드리고,
각 옵션의 장단점을 설명해드린 다음 선택하시면 됩니다.

그리고 디자인 시스템(색상, 폰트 등)도 함께 정의할 거예요!"
</action>

<template-output>documents_loaded</template-output>
</step>

<step n="1" goal="Define Design Style and Direction">
<action>Understand user's design preferences</action>

<action>Explain with examples:
"먼저 {{project_name}}이 어떤 '느낌'의 디자인을 가질지 정해야 해요.

**디자인 스타일 예시:**

🧊 **미니멀 & 클린**
- 예: 에어비앤비, 애플, 노션
- 특징: 깔끔한 여백, 심플한 색상, 명확한 계층
- 느낌: 전문적, 세련됨, 집중

🎨 **화려 & 역동적**
- 예: 인스타그램, 스포티파이, 넷플릭스
- 특징: 대담한 색상, 큰 이미지, 많은 애니메이션
- 느낌: 재미있음, 에너지 넘침, 젊음

💼 **전문적 & 신뢰감**
- 예: 링크드인, 세일즈포스, 구글 워크스페이스
- 특징: 차분한 색상, 명확한 구조, 데이터 중심
- 느낌: 비즈니스적, 안정적, 믿음직함

🎈 **친근 & 편안**
- 예: 슬랙, 트렐로, 당근마켓
- 특징: 부드러운 색상, 친근한 아이콘, 대화하는 듯한 텍스트
- 느낌: 접근하기 쉬움, 스트레스 없음, 따뜻함

🎮 **트렌디 & 모던**
- 예: 틱톡, 디스코드, 피그마
- 특징: 그라데이션, 유리 효과(glassmorphism), 대담한 타이포
- 느낌: 최신, 쿨함, 혁신적"
</action>

<action>Generate project-appropriate style suggestions based on:
- {{service_type}}
- {{platform}}
- PRD의 타겟 사용자
- PRD의 문제 해결 특성

예시:
- B2B 생산성 도구 → 전문적 & 신뢰감
- 소셜/엔터테인먼트 → 화려 & 역동적
- 교육/학습 → 친근 & 편안 또는 미니멀
- 금융/헬스케어 → 전문적 & 신뢰감 + 미니멀
</action>

<ask>{{project_name}}은 어떤 느낌의 디자인을 원하시나요?

1. 🧊 미니멀 & 클린 - 깔끔하고 세련됨
2. 🎨 화려 & 역동적 - 재미있고 에너지 넘침
3. 💼 전문적 & 신뢰감 - 비즈니스적이고 안정적
4. 🎈 친근 & 편안 - 접근하기 쉽고 따뜻함
5. 🎮 트렌디 & 모던 - 최신 트렌드, 쿨함
6. [프로젝트 맞춤 추천 스타일 1-2개]
7. 기타 (직접 설명해주세요)

선택해주세요:</ask>

<action>Store selection as {{design_style}}</action>

<ask>참고하고 싶은 서비스나 웹사이트가 있나요?
(예: "인스타그램처럼", "노션처럼", "없음" 등)

URL이나 서비스 이름을 알려주세요:</ask>

<action>Store as {{design_references}}</action>

<action>Based on style and references, create design principles:

Generate 3-5 design principles specific to {{project_name}}

예시:
- 미니멀 스타일 → "여백으로 호흡하기", "한 화면에 하나의 초점", "불필요한 요소 제거"
- 화려 스타일 → "시각적 임팩트", "색상으로 감정 전달", "생동감 있는 애니메이션"
- 전문적 스타일 → "정보 위계 명확히", "일관된 패턴", "신뢰를 주는 안정감"
</action>

<action>Store as {{design_principles}}</action>

<template-output>design_direction</template-output>
</step>

<step n="2" goal="Define Color Palette">
<action>Create color palette based on design style</action>

<action>Explain color system:
"색상은 사용자가 서비스를 경험하는 데 큰 영향을 줘요.

**색상 시스템 구성:**

1. **Primary Color (주색상)**
   - 가장 많이 보이는 색
   - 버튼, 링크, 강조 요소
   - 브랜드 아이덴티티

2. **Secondary Color (보조 색상)**
   - Primary를 보조
   - 일부 버튼, 배지, 아이콘

3. **Accent Color (강조 색상)**
   - 특별한 액션, 알림
   - 눈길을 끌어야 할 때

4. **Semantic Colors (의미 색상)**
   - Success: 초록 계열 (성공, 완료)
   - Error: 빨강 계열 (에러, 경고)
   - Warning: 노랑/주황 계열 (주의)
   - Info: 파랑 계열 (정보)

5. **Neutral Colors (중립 색상)**
   - 배경, 텍스트, 테두리
   - Gray 스케일"
</action>

<action>Based on {{design_style}}, suggest color palettes:

미니멀 스타일:
- Primary: 차분한 블루 (#3B82F6) 또는 그레이스케일
- Accent: 포인트 컬러 최소 사용
- Neutral: 풍부한 그레이 스케일

화려 스타일:
- Primary: 선명한 브랜드 컬러
- Secondary: 대비되는 보색
- Accent: 눈에 띄는 강렬한 색

전문적 스타일:
- Primary: 신뢰감 주는 블루 (#2563EB)
- Secondary: 네이비 또는 차분한 그린
- Neutral: 밝은 배경 + 진한 텍스트

친근한 스타일:
- Primary: 부드러운 파스텔 또는 따뜻한 컬러
- Secondary: 조화로운 보조색
- Accent: 귀여운 포인트 컬러
</action>

<ask>Primary Color(주색상)는 어떤 색이 좋을까요?

{{design_style}}에 어울리는 추천:
[동적 생성 추천 3-4개 - hex code와 함께]

직접 원하는 색이 있다면 hex code로 알려주세요 (예: #3B82F6)</ask>

<action>Store as {{primary_color}}</action>

<ask>Secondary Color(보조 색상)는요?
Primary와 조화로운 색을 추천해드려요:

[Primary를 기반으로 조화로운 색 3-4개 추천]

또는 직접 입력해주세요:</ask>

<action>Store as {{secondary_color}}</action>

<ask>Accent Color(강조 색상)는요?
눈에 띄면서도 전체와 어울리는 색:

[추천 2-3개]

또는 직접 입력해주세요:</ask>

<action>Store as {{accent_color}}</action>

<action>Auto-generate semantic and neutral colors:

Semantic Colors (자동 생성):
- Success: #10B981 (초록)
- Error: #EF4444 (빨강)
- Warning: #F59E0B (주황)
- Info: #3B82F6 (파랑)

Neutral Colors (자동 생성, style에 따라):
- White: #FFFFFF
- Gray 50-900: 9단계 그레이 스케일
- Black: #000000

Store all colors
</action>

<action>Generate color usage guidelines:
- Primary: 버튼(primary), 링크, 주요 아이콘, 선택된 상태
- Secondary: 버튼(secondary), 보조 정보, 배지
- Accent: CTA 버튼, 중요 알림, 특별 프로모션
- Success: 완료 메시지, 성공 아이콘
- Error: 에러 메시지, 필드 에러 강조
- Warning: 경고 배너, 주의 필요 상태
- Neutral: 배경, 텍스트, 테두리, 구분선
</action>

<action>Store complete color system as:
- {{primary_colors}}
- {{secondary_colors}}
- {{semantic_colors}}
- {{neutral_colors}}
- {{color_usage_guidelines}}
</action>

<template-output>color_palette</template-output>
</step>

<step n="3" goal="Define Typography">
<action>Select fonts and create type system</action>

<action>Explain typography:
"폰트도 디자인 느낌을 결정하는 중요한 요소예요.

**폰트 선택 팁:**

1. **Heading Font (제목 폰트)**
   - 임팩트 있고 읽기 쉬운 폰트
   - 브랜드 개성 표현

2. **Body Font (본문 폰트)**
   - 장시간 읽어도 편한 폰트
   - 가독성 최우선

한글 서비스면 한글 폰트가 중요해요!

**한글 폰트 예시:**
- Pretendard: 깔끔하고 모던, 무료
- Spoqa Han Sans: 가독성 좋음, 무료
- Noto Sans KR: 구글 폰트, 무료
- 넥슨/배달의민족체: 개성 있음, 무료 (비상업 제한 확인)

**영문 폰트 예시:**
- Inter: 모던하고 깔끔
- Roboto: 구글, 친숙함
- Poppins: 부드러운 느낌
- Work Sans: 전문적"
</action>

<action>Based on {{design_style}} and {{platform}}, recommend fonts:

미니멀/전문적:
- Heading: Inter, Pretendard
- Body: Inter, Pretendard

화려/트렌디:
- Heading: Poppins, Montserrat
- Body: Inter, Open Sans

친근:
- Heading: Nunito, Spoqa Han Sans
- Body: Noto Sans KR, Pretendard
</action>

<ask>Heading Font (제목용 폰트)는 무엇으로 할까요?

{{design_style}}에 어울리는 추천:
[추천 4-5개 - 한글/영문 포함, 라이선스 명시]

또는 직접 원하는 폰트 이름을 알려주세요:</ask>

<action>Store as {{heading_font}}</action>

<ask>Body Font (본문용 폰트)는요?

추천:
[추천 4-5개 - 가독성 중심]

또는 직접 입력해주세요:</ask>

<action>Store as {{body_font}}</action>

<action>Create type scale (자동 생성):

Font sizes:
- Display: 48px / 3rem (큰 제목, 히어로)
- H1: 36px / 2.25rem
- H2: 30px / 1.875rem
- H3: 24px / 1.5rem
- H4: 20px / 1.25rem
- Body Large: 18px / 1.125rem
- Body: 16px / 1rem (기본)
- Body Small: 14px / 0.875rem
- Caption: 12px / 0.75rem

Line heights:
- Tight: 1.25 (제목)
- Normal: 1.5 (본문)
- Relaxed: 1.75 (긴 글)

Font weights:
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700
</action>

<action>Store typography system as:
- {{font_selection}}
- {{type_scale}}
- {{text_styles}}
- {{typography_guidelines}}
</action>

<template-output>typography</template-output>
</step>

<step n="4" goal="🔍 Search and Select UI Framework/Library">
<critical>This step requires extensive web search.
For EACH library option, provide detailed information including:
- GitHub stars, npm downloads
- Latest version and update frequency
- Documentation quality
- Community size
- Pros and cons
- Integration complexity</critical>

<action>Explain UI library concept:
"이제 실제로 사용할 UI 컴포넌트 라이브러리를 찾아볼게요!

**UI 라이브러리란?**
버튼, 입력창, 모달 같은 기본 UI 요소들이 이미 만들어진 '세트'예요.
처음부터 하나하나 만드는 대신, 이미 잘 만들어진 걸 가져다 쓰는 거죠.

**왜 라이브러리를 쓰나요?**
✅ 개발 속도가 훨씬 빨라요
✅ 이미 검증된 컴포넌트라 버그가 적어요
✅ 접근성, 반응형이 이미 적용되어 있어요
✅ 일관된 디자인을 유지하기 쉬워요

지금부터 인터넷에서 {{platform}}에 맞는
최신 UI 라이브러리를 검색해드릴게요!"
</action>

<action>Determine search queries based on {{platform}} and {{service_type}}:

If platform includes React/웹:
- "React UI component library 2024"
- "React design system"
- "headless UI components React"
- "best React component library {{design_style}}"

If platform includes React Native/모바일:
- "React Native UI library 2024"
- "React Native component library"

If platform includes Vue:
- "Vue UI component library 2024"

If platform includes Next.js:
- "Next.js UI component library 2024"
- "Tailwind CSS component library"
</action>

<action>Perform WebSearch with queries:

Execute multiple searches to gather comprehensive options
</action>

<action>For top 6-8 libraries found, use WebFetch to gather:
- GitHub repository (stars, forks, last update, issues)
- npm package (weekly downloads, version, dependencies)
- Official documentation
- Community discussions/Reddit/Twitter mentions
</action>

<action>Analyze and categorize libraries:

Categories:
1. **Complete Design Systems** (모든 것 포함)
   - 예: MUI, Ant Design, Chakra UI
   - 장점: 빠른 시작, 일관성
   - 단점: 커스터마이징 제한적, 용량 큼

2. **Headless/Unstyled** (기능만, 스타일은 직접)
   - 예: Radix UI, Headless UI, React Aria
   - 장점: 완전한 커스터마이징
   - 단점: 스타일링 작업 필요

3. **Utility-First + Components** (Tailwind 기반)
   - 예: shadcn/ui, Flowbite, daisyUI
   - 장점: 커스터마이징 쉬움, 복사 가능
   - 단점: Tailwind 의존성

4. **Mobile-Focused** (React Native)
   - 예: NativeBase, React Native Paper, Tamagui
</action>

<action>Present options in detailed format in {communication_language}:

"자, 인터넷에서 검색한 결과예요!
{{platform}}에 적합한 UI 라이브러리 [N]개를 찾았어요:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**옵션 1: [Library Name]**

🔗 **링크**
- 웹사이트: [URL]
- GitHub: [URL]
- 문서: [URL]

📊 **인기도**
- ⭐ GitHub Stars: [number]
- 📥 주간 다운로드: [number]
- 📅 최근 업데이트: [date]

💡 **비개발자를 위한 설명**
[쉬운 언어로 이 라이브러리가 뭔지 설명]

예를 들어:
'shadcn/ui는 복사해서 붙여넣는 방식이에요. 라이브러리를 설치하는 게 아니라,
필요한 컴포넌트 코드를 프로젝트에 직접 복사해서 쓰는 거예요.
그래서 원하는 대로 마음껏 수정할 수 있어요.'

✅ **장점**
- [장점 1] - 구체적으로
- [장점 2] - 구체적으로
- [장점 3] - 구체적으로

⚠️ **단점 / 고려사항**
- [단점 1] - 구체적으로
- [단점 2] - 구체적으로

🎨 **{{design_style}} 스타일과의 궁합**
⭐⭐⭐⭐☆ (5점 만점)
[왜 이 점수인지 설명]

🎯 **이런 경우에 추천**
- [사용 케이스 1]
- [사용 케이스 2]

📝 **개발자용 상세 정보**
```
Package: [npm package name]
Version: [current version]
Installation: npm install [package]
Dependencies: [React, TypeScript 등]
Bundle Size: [KB]
TypeScript Support: [Yes/No]
Documentation: [URL]
Examples: [URL]
```

**코드 예시:**
```tsx
// 간단한 버튼 사용 예시
import { Button } from '[package-name]'

export default function App() {
  return <Button>Click me</Button>
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**옵션 2: [Library Name]**
[위와 동일한 포맷으로 6-8개 제시]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
</action>

<ask>어떤 UI 라이브러리를 사용할까요?

위에서 설명드린 옵션 중 번호를 선택하거나,
궁금한 점을 물어보세요.

**선택 팁:**
- 빠르게 시작하고 싶다면: Complete Design System (MUI, Ant Design)
- 디자인 완전 커스터마이징 원한다면: Headless (Radix UI, shadcn/ui)
- Tailwind 쓸 예정이라면: shadcn/ui, Flowbite
- 모바일 앱이라면: NativeBase, React Native Paper

어떤 걸 선택하시겠어요?</ask>

<action>Store user selection</action>

<action>If user wants more info or comparison:
- Provide detailed comparison table
- Answer specific questions
- Search for additional info if needed
</action>

<action>Once selected, gather complete implementation details:

Use WebFetch to get from documentation:
- Installation steps
- Setup/configuration
- Theming/customization method
- Integration with chosen colors/fonts
- Best practices
- Common pitfalls
</action>

<action>Store as {{component_library}} and {{component_library_details}}</action>

<template-output>component_library_selected</template-output>
</step>

<step n="5" goal="🔍 Search Specialized Components for UX Features">
<critical>Based on UX Design document, identify special component needs
and search for specialized libraries for each.</critical>

<action>Analyze UX Design for special component requirements:

From {{key_components_from_ux}} and user flows, identify needs:

Common specialized components:
- Rich Text Editor (게시글 작성, 문서 편집)
- Drag & Drop (칸반, 파일 업로드, 리스트 정렬)
- Charts/Graphs (통계, 대시보드)
- Calendar/Date Picker (예약, 일정)
- Image Upload/Crop (프로필, 사진)
- Video Player (강의, 영상)
- Map (위치 기반)
- Chat UI (채팅, 메시징)
- Data Table (복잡한 데이터)
- Form Builder (복잡한 폼)
- File Preview (PDF, 이미지 등)
- Notification/Toast (알림)
- Carousel/Slider (이미지 갤러리)
</action>

<action>For EACH identified special need, explain to user:

"UX Design에서 [기능명] 기능을 위해 [컴포넌트 타입]이 필요해 보여요.

예를 들어:
- 게시물 작성 → Rich Text Editor (노션처럼 글 쓰는 에디터)
- 작업 관리 → Drag & Drop (트렐로처럼 카드 드래그)
- 통계 보기 → Charts (그래프, 차트)

각 특수 기능마다 전문 라이브러리를 검색해드릴게요!"
</action>

<action>For each special component need, perform search:

Search queries like:
- "React rich text editor 2024"
- "React drag and drop library"
- "React chart library"
- "[platform] [component-type] library"
</action>

<action>For each component type, present 4-6 options with same detailed format as step 4:

"━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**[기능명]을 위한 라이브러리 검색 결과:**

예: **Rich Text Editor를 위한 라이브러리**

**옵션 1: [Library Name]**
🔗 Links...
📊 Stats...
💡 설명...
✅ 장점...
⚠️ 단점...
🎯 추천 케이스...
📝 Technical details...

[옵션 2, 3, 4... 계속]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
</action>

<ask>각 특수 컴포넌트마다 선택해주세요:

1. [컴포넌트 타입 1]: 어떤 라이브러리를 쓸까요?
2. [컴포넌트 타입 2]: 어떤 라이브러리를 쓸까요?
...

하나씩 선택해주시거나, 궁금한 점 물어보세요!</ask>

<action>For each selection, gather full details via WebFetch</action>

<action>Store all specialized component selections as {{specialized_components_details}}</action>
<action>Generate summary list for YAML as {{specialized_components_list}}</action>

<template-output>specialized_components_selected</template-output>
</step>

<step n="6" goal="Define Component Design Specifications">
<action>For each major component type, create design specifications</action>

<action>Based on selected libraries, {{color_palette}}, {{typography}}, define specs for:

### Buttons
- Variants: Primary, Secondary, Tertiary, Ghost, Link
- Sizes: Small, Medium, Large
- States: Default, Hover, Active, Disabled, Loading
- Colors: Use primary, secondary colors
- Border radius: Based on style (rounded for friendly, sharp for professional)
- Padding: From spacing system
- Typography: Body font, medium weight

### Input Fields
- Variants: Text, Email, Password, Number, Textarea
- States: Default, Focus, Error, Disabled, Success
- Label position: Top (recommended) or Floating
- Helper text: Below field
- Error message: Red, with icon
- Border: Based on style
- Padding: Comfortable touch targets (especially mobile)

### Cards
- Background: White or subtle gray
- Border: Subtle or shadow
- Padding: Consistent spacing
- Hover state: Lift or highlight
- Corner radius: Match button style

### Navigation
Based on {{platform}}:
- Mobile: Bottom tab bar or hamburger menu
- Web: Top navigation bar or sidebar
- Active state: Primary color
- Hover: Subtle highlight

[Continue for all component types from UX Design]
</action>

<action>Store all component specs as variables:
- {{button_specs}}
- {{input_specs}}
- {{card_specs}}
- {{navigation_specs}}
- {{modal_specs}}
- {{list_table_specs}}
- {{form_component_specs}}
- {{feedback_specs}}
</action>

<template-output>component_specs</template-output>
</step>

<step n="7" goal="Define Layout System">
<action>Create layout and spacing system</action>

<action>Based on {{platform}}, define:

### Grid System (웹)
If web/responsive:
- 12-column grid
- Container max-width: 1280px
- Gutter: 24px
- Margins: 16px mobile, 24px tablet, 32px desktop

### Spacing System
8px base unit:
- xs: 4px (0.25rem)
- sm: 8px (0.5rem)
- md: 16px (1rem)
- lg: 24px (1.5rem)
- xl: 32px (2rem)
- 2xl: 48px (3rem)
- 3xl: 64px (4rem)

Usage:
- xs: Icon spacing, tight padding
- sm: Button padding, small gaps
- md: Card padding, section gaps (default)
- lg: Section margins, comfortable padding
- xl: Large sections
- 2xl, 3xl: Hero sections, major breaks

### Breakpoints (반응형)
If responsive:
- sm: 640px (모바일 가로)
- md: 768px (태블릿)
- lg: 1024px (작은 노트북)
- xl: 1280px (데스크톱)
- 2xl: 1536px (큰 화면)
</action>

<action>Store as:
- {{grid_system}}
- {{spacing_system}}
- {{breakpoints}}
</action>

<template-output>layout_system</template-output>
</step>

<step n="8" goal="Define Interaction States and Animations">
<action>Define how components behave during interactions</action>

<action>Create interaction state definitions:

### Hover States
- Buttons: Darken 10% or lift with shadow
- Links: Underline or color change
- Cards: Lift with shadow or subtle highlight
- Icons: Scale 1.1x or rotate

### Active/Pressed States
- Buttons: Darken 15%, scale 0.98x
- Touch targets: Brief highlight

### Focus States
- All interactive elements: Visible focus ring
- Color: Primary color with opacity
- Width: 2-3px
- Offset: 2px from element

### Disabled States
- Opacity: 0.5
- Cursor: not-allowed
- No hover effects

### Loading States
- Buttons: Show spinner, disable interaction
- Content: Skeleton screens or spinner
- Forms: Disable inputs, show progress
</action>

<action>Define animation guidelines:

**Animation Principles:**
- Fast: 150ms - small interactions (hover)
- Normal: 250ms - default transitions
- Slow: 350ms - larger movements

**Easing:**
- Ease-out: Elements entering (feels responsive)
- Ease-in: Elements leaving (feels natural)
- Ease-in-out: Moving between states (smooth)

**What to animate:**
- ✅ Opacity (fade in/out)
- ✅ Transform (move, scale)
- ✅ Color (background, text)
- ❌ Height (can cause layout shift)
- ❌ Width (can cause layout shift)

**When to animate:**
- Page transitions
- Modal open/close
- Toast notifications
- Button feedback
- Loading states
- Accordion expand/collapse

**When NOT to animate:**
- User has "prefers-reduced-motion"
- Critical errors
- Performance-sensitive areas
</action>

<action>Store as:
- {{interaction_states}}
- {{animation_guidelines}}
- {{transitions}}
</action>

<template-output>interactions_animations</template-output>
</step>

<step n="9" goal="Define Dark Mode (if applicable)">
<action if="user wants dark mode or it's common for the service type">

<ask>다크모드를 지원할 계획인가요?

요즘은 많은 앱/웹이 다크모드를 지원해요.
- 눈의 피로를 줄여줌
- 배터리 절약 (OLED 화면)
- 개인 선호도

{{project_name}}도 다크모드를 제공할까요? [Yes/No]</ask>

<action if="yes">
Create dark mode color palette:

**다크모드 색상 전략:**

배경:
- Light mode: #FFFFFF
- Dark mode: #1A1A1A or #0F172A

텍스트:
- Light mode: #1F2937 (거의 검정)
- Dark mode: #F3F4F6 (거의 흰색)

Primary/Secondary colors:
- 기본 색상 유지하되, 약간 밝게 조정
- Light mode Primary: {{primary_color}}
- Dark mode Primary: [Lighten 10-15%]

Neutral colors:
- Gray scale 반전
- Light mode: Gray 100-900
- Dark mode: Gray 900-100

Cards/Surfaces:
- Light mode: White with subtle shadow
- Dark mode: #262626 with subtle border

**Implementation:**
- CSS variables for theming
- System preference detection
- User toggle option
- Persistent storage (localStorage)
</action>

<action>Store as {{dark_mode_specs}}</action>
</action>

<template-output>dark_mode</template-output>
</step>

<step n="10" goal="Define Accessibility Guidelines">
<action>Create accessibility requirements</action>

<action>Based on {{platform}}, define:

### Color Contrast
- Text on background: WCAG AA (4.5:1 minimum)
- Large text (18px+): WCAG AA (3:1 minimum)
- Tool: Use WebAIM Contrast Checker
- Verify all color combinations meet standards

### Keyboard Navigation
- All interactive elements focusable
- Tab order logical
- Focus indicators visible
- Escape key closes modals
- Enter/Space activates buttons

### Screen Reader Support
- Semantic HTML elements
- ARIA labels where needed
- Image alt text
- Form field labels
- Error messages announced
- Loading states announced

### Touch Targets (Mobile)
- Minimum 44x44px (Apple)
- Minimum 48x48px (Google)
- Adequate spacing between targets

### Motion & Animation
- Respect prefers-reduced-motion
- Provide option to disable animations
- No auto-playing videos with sound

### Form Accessibility
- Labels for all fields
- Error messages clearly associated
- Required fields indicated
- Help text available
</action>

<action>Store as {{accessibility_guidelines}}</action>

<template-output>accessibility</template-output>
</step>

<step n="11" goal="Define Platform-Specific Guidelines">
<action>Create platform-specific design considerations</action>

<action if="{{platform}} includes mobile/app">
**모바일 앱 가이드라인:**

- Safe Areas: 노치/홈 인디케이터 고려
- Orientation: Portrait/Landscape 지원 여부
- Gestures: Swipe, pinch, long-press
- Status Bar: 투명/불투명, 라이트/다크
- Bottom Tab Bar: iOS 스타일
- Floating Action Button: Android 스타일
- Pull-to-Refresh: 표준 패턴
- Haptic Feedback: 언제 사용할지
</action>

<action if="{{platform}} includes web">
**웹 가이드라인:**

- Responsive Breakpoints: sm, md, lg, xl
- Mobile First: 작은 화면부터 설계
- Desktop Enhancements: 큰 화면에서의 이점 활용
- Hover States: 마우스 상호작용
- Keyboard Shortcuts: 파워유저 지원
- Browser Support: 지원 범위
</action>

<action if="{{platform}} includes desktop app">
**데스크톱 앱 가이드라인:**

- Window Controls: 네이티브 스타일
- Menu Bar: 표준 메뉴 구조
- Keyboard Shortcuts: OS 표준 따르기
- Drag & Drop: 파일 시스템 연동
- Context Menus: 우클릭 메뉴
</action>

<action>Store as {{platform_specific_guidelines}}</action>

<template-output>platform_guidelines</template-output>
</step>

<step n="12" goal="Create Implementation Guide">
<action>Compile implementation instructions for selected libraries</action>

<action>For {{component_library}} and each {{specialized_components}}, create:

### 설치 가이드
```bash
# 기본 UI 라이브러리
npm install {{component_library}}

# 특수 컴포넌트들
npm install {{specialized_component_1}}
npm install {{specialized_component_2}}
...

# 폰트 설치 (필요시)
npm install @fontsource/{{heading_font}}
npm install @fontsource/{{body_font}}
```

### 초기 설정
- Theme configuration
- Color tokens setup
- Font import
- Global styles

### 통합 방법
- How to wrap app with providers
- How to use theme
- How to customize components

### 커스터마이징 방법
- Override default colors
- Add custom components
- Extend theme
- Use design tokens
</action>

<action>Store as:
- {{installation_guide}}
- {{setup_guide}}
- {{integration_guide}}
- {{customization_guide}}
</action>

<template-output>implementation_guide</template-output>
</step>

<step n="13" goal="Compile Resources and Summary">
<action>Create comprehensive resource list</action>

<action>Generate library summary table:

| 항목 | 선택 | 버전 | 링크 |
|------|------|------|------|
| UI Framework | {{component_library}} | [version] | [GitHub], [Docs] |
| [Special Component 1] | [Library] | [version] | [links] |
| [Special Component 2] | [Library] | [version] | [links] |
| ... | ... | ... | ... |
</action>

<action>Compile all documentation links:
- Official docs for each library
- GitHub repositories
- npm packages
- Community resources
- Tutorials and examples
</action>

<action>List design assets needed:
- Logo (if applicable)
- Icons (recommend icon library based on style)
- Images/Illustrations (stock photo suggestions)
- Fonts (download links)
</action>

<action>Store as:
- {{library_summary}}
- {{reference_docs}}
- {{design_assets}}
</action>

<template-output>resources</template-output>
</step>

<step n="14" goal="Generate UI Design Guide Document">
<critical>⚠️ YOU MUST USE THE TEMPLATE - DO NOT write the document from scratch</critical>
<critical>The template contains YAML frontmatter which is REQUIRED for document parsing</critical>

<action>Load template from {template}</action>

<action>Fill ALL template variables with collected data from previous steps</action>

<critical>Verify YAML frontmatter is present at the top of the document</critical>
<critical>The document MUST start with "---" followed by YAML metadata</critical>

<action>Ensure document includes:
- Complete color system with hex codes
- Typography with font names and sizes
- All selected libraries with versions and links
- Component specifications
- Layout and spacing system
- Interaction and animation guidelines
- Implementation guides with code examples
- All external links working
</action>

<action>Cross-check with UX Design:
- All components from UX are covered
- Interaction patterns align
- Platform requirements met
</action>

<action>Cross-check with PRD:
- Design style fits target users
- Platform is correct
</action>

<action>Create output folder if needed</action>
<action>Save document to {default_output_file}</action>

<action>Show summary to user:
"
🎉 UI Design Guide 작성이 완료되었습니다!

📄 **저장 위치**: {default_output_file}

🎨 **작성된 내용:**

**색상 시스템:**
- Primary: {{primary_color}}
- Secondary: {{secondary_color}}
- Accent: {{accent_color}}

**타이포그래피:**
- Heading: {{heading_font}}
- Body: {{body_font}}

**선택된 라이브러리:**
- 기본 UI: {{component_library}}
- 특수 컴포넌트: {{specialized_components_list}}

**모든 링크와 코드 예시가 포함되어 있어요!**

개발자에게 이 문서를 전달하면
바로 설치하고 구현할 수 있어요.

다음 단계는 **TRD (기술 요구사항) 워크플로우**입니다.
준비가 되면 기획문서 패널에서 'TRD 작성하기' 버튼을 눌러주세요!"
</action>

<template-output>ui_design_guide_complete</template-output>
</step>

</workflow>
