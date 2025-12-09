# Design Guide Workflow Instructions

<critical>You MUST have already loaded: {project-root}/.anyon/anyon-method/workflows/startup-ui/workflow.yaml</critical>
<critical>Communicate in {communication_language}</critical>
<critical>이 워크플로우는 디자인만 다룸. React, MUI 등 기술 스택은 TRD에서 처리.</critical>

<workflow>

<step n="0" goal="Load Documents">
<action>Load PRD from {input_prd}</action>
<action>Load UX Design HTML from {input_ux}</action>
<action>Extract: project_name, service_type, platform, target_users</action>

<action>Read and analyze UX HTML mockup:
- Identify current visual style (layout, spacing, colors used)
- Note screen structure and components
- This will inform design recommendations
</action>

<action>Welcome:
"안녕하세요! {{project_name}}의 디자인 가이드를 만들어볼게요.

UX 목업을 확인했어요. 이제 디자인을 결정해봐요!

**정할 것:**
- 디자인 스타일 (느낌)
- 색상 (Primary, Secondary 등)
- 폰트"
</action>
</step>

<step n="1" goal="Design Style">
<ask>{{project_name}}은 어떤 느낌이 좋을까요?

1. **미니멀** - 깔끔, 여백, 심플 (예: 애플, 노션)
2. **화려함** - 대담한 색상, 에너지 (예: 인스타그램, 스포티파이)
3. **전문적** - 비즈니스, 신뢰감 (예: 링크드인, 세일즈포스)
4. **친근함** - 따뜻함, 부드러움 (예: 당근마켓, 슬랙)
5. **트렌디** - 그라데이션, 유리효과 (예: 피그마, 디스코드)
6. 기타 (직접 설명)

번호로 선택:</ask>

<action>Store as {{design_style}}</action>

<ask>참고하고 싶은 디자인이 있나요? (서비스명 또는 URL)
없으면 "없음":</ask>

<action>Store as {{design_references}}</action>
</step>

<step n="2" goal="Color Palette">
<action>Explain:
"색상을 정해볼게요.

**Primary Color**: 가장 많이 쓰이는 메인 색상 (버튼, 링크)
**Secondary Color**: 보조 색상
**Accent Color**: 특별 강조용"
</action>

<action>Based on {{design_style}}, suggest colors:
- 미니멀 → 차분한 블루, 그레이 계열
- 화려함 → 선명한 컬러, 그라데이션
- 전문적 → 네이비, 블루 계열
- 친근함 → 파스텔, 따뜻한 색상
- 트렌디 → 퍼플, 그라데이션
</action>

<ask>Primary Color 추천:
[디자인 스타일에 맞는 3-4개 색상 + hex code]

번호로 선택하거나 직접 hex code 입력:</ask>

<action>Store as {{primary_color}}</action>

<ask>Secondary Color는요?
[Primary와 어울리는 3-4개 추천]</ask>

<action>Store as {{secondary_color}}</action>

<ask>Accent Color는요?
[눈에 띄는 강조색 2-3개 추천]</ask>

<action>Store as {{accent_color}}</action>

<action>Auto-generate semantic colors:
- Success: #10B981
- Error: #EF4444
- Warning: #F59E0B
- Info: #3B82F6
</action>
</step>

<step n="3" goal="Typography">
<action>Explain:
"폰트를 정해볼게요.

**Heading Font**: 제목용
**Body Font**: 본문용

한글 서비스면 한글 폰트가 중요해요."
</action>

<ask>폰트 추천:

**한글:**
1. Pretendard - 깔끔, 모던 (무료)
2. Spoqa Han Sans - 가독성 좋음 (무료)
3. Noto Sans KR - 구글 (무료)

**영문:**
1. Inter - 모던
2. Poppins - 부드러움

번호로 선택하거나 직접 입력:</ask>

<action>Store as {{heading_font}} and {{body_font}}</action>
</step>

<step n="4" goal="Dark Mode">
<ask>다크모드를 지원할 건가요?

1. 네 - 다크모드 색상도 정의
2. 아니오 - 라이트 모드만
3. 나중에 - 일단 스킵

번호로 선택:</ask>

<action>If yes, generate dark mode colors:
- Background: #1A1A1A
- Text: #F3F4F6
- Primary: {{primary_color}} (약간 밝게)
</action>

<action>Store as {{dark_mode}}</action>
</step>

<step n="5" goal="Generate Design Guide">
<action>Load template from {template}</action>
<action>Fill template with collected variables</action>
<action>Save to {default_output_file}</action>

<action>Show summary:
"
디자인 가이드 완료!

**저장 위치**: {default_output_file}

**요약:**
- 스타일: {{design_style}}
- Primary: {{primary_color}}
- Secondary: {{secondary_color}}
- 폰트: {{heading_font}} / {{body_font}}
- 다크모드: {{dark_mode}}

**다음**: TRD (기술 스택) 워크플로우
"
</action>
</step>

</workflow>
