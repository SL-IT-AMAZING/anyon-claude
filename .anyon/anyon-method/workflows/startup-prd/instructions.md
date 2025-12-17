# Startup PRD Workflow Instructions

<critical>You MUST have already loaded: {project-root}/.anyon/anyon-method/workflows/startup-prd/workflow.yaml</critical>
<critical>Communicate in {communication_language}</critical>
<critical>Target: NON-TECHNICAL FOUNDERS - 쉬운 언어 사용</critical>
<critical>PURPOSE: AI 개발에 필요한 핵심 정보만 수집. 짧고 간결하게.</critical>

<workflow>

<step n="0" goal="Welcome">
<action>Welcome:
"안녕하세요! PRD를 만들어볼게요.

**PRD란?**
뭘 만들건지 정리하는 문서예요. 간단하게 몇 가지만 물어볼게요."
</action>

<action>Create output folder: mkdir -p {output_folder}</action>

<ask>만들고 싶은 서비스 이름이 뭔가요? (예: 배달의민족, 토스)</ask>
<action>Store as {{project_name}}</action>
</step>

<step n="1" goal="License Type">
<ask>{{project_name}}은 어떤 용도인가요?

1. **상업용** - 돈 벌 서비스
2. **내부용** - 회사/팀 내부 도구
3. **오픈소스** - 코드 공개
4. **학습용** - 연습/포트폴리오

번호로 선택:</ask>

<action>Store as {{project_license_type}}
Set {{license_policy}}:
- 상업용 → "MIT, Apache 2.0 우선. GPL 주의"
- 내부용 → "대부분 OK"
- 오픈소스 → "모든 라이선스 OK"
- 학습용 → "제한 없음"
</action>
</step>

<step n="2" goal="Problem & Target">
<ask>어떤 문제를 해결하나요?

**문제 유형:**
1. **불편함 해소** - 뭔가 하기 귀찮고 불편해요 (예: 메뉴 고르기, 청소 예약)
2. **시간 절약** - 반복 작업을 자동화하고 싶어요 (예: 보고서 자동 생성, 일정 관리)
3. **정보 부족** - 필요한 정보 찾기 어려워요 (예: 맛집 찾기, 중고거래)
4. **커뮤니케이션** - 소통이 어렵거나 불편해요 (예: 팀 협업, 고객 문의)
5. **학습/성장** - 배우거나 실력 향상하고 싶어요 (예: 어학, 운동 기록)
6. **재미/엔터테인먼트** - 즐길거리가 필요해요 (예: 게임, 콘텐츠)
7. **직접 입력** - 위에 없는 다른 문제

번호로 선택:</ask>

<action>
If 1-6 (문제 유형 선택):
  Store selected category as {{problem_category}}

  <ask>조금 더 구체적으로 설명해주세요.

  **예시:**
  - 불편함: "점심시간마다 메뉴 고르느라 10분씩 써요"
  - 시간절약: "매일 같은 형식 보고서 작성에 30분 걸려요"
  - 정보부족: "우리 동네 맛집 정보가 흩어져 있어요"

  간단하게 한 문장으로:</ask>

  Store as {{problem_detail}}
  Combine as {{problem_statement}} = "{{problem_category}}: {{problem_detail}}"

If 7 (직접 입력):
  <ask>어떤 문제를 해결하나요? 자유롭게 설명해주세요:</ask>
  Store as {{problem_statement}}
</action>

<ask>누가 이 서비스를 쓰나요?

**주요 사용자:**
1. **직장인** - 20-40대 회사원
2. **학생** - 초/중/고/대학생
3. **자영업자/사장님** - 가게/회사 운영자
4. **주부/부모** - 육아/가사 담당자
5. **프리랜서/크리에이터** - 1인 사업자, 콘텐츠 제작자
6. **시니어** - 50대 이상
7. **전문가/특수 직군** - 개발자, 디자이너, 의료인 등
8. **모두** - 나이/직업 무관
9. **직접 입력**

번호로 선택 (여러 개 가능, 예: 1, 2):</ask>

<action>
Parse selected numbers
If 9 included or only 9:
  <ask>사용자를 자유롭게 설명해주세요:</ask>
  Store as {{target_users}}
Else:
  Convert selections to text
  Store as {{target_users}}

  <ask>이 사용자들의 특징이나 상황을 추가로 설명해주실 게 있나요? (선택)

  예: "점심시간이 짧은", "모바일에 익숙한", "시간이 부족한"
  없으면 "없음":</ask>

  If not "없음":
    Append to {{target_users}}
</action>
</step>

<step n="3" goal="Service Type & Platform">
<ask>어떤 형태로 만들 건가요?

**서비스 유형:**
1. **웹** - 브라우저에서 사용 (크롬, 사파리 등)
2. **모바일 앱** - 앱스토어에서 다운로드 (휴대폰 앱)
3. **데스크톱 앱** - PC에 설치해서 사용 (VSCode, Notion처럼)
4. **여러 개 조합** - 웹+앱, 웹+데스크톱 등

번호로 선택:</ask>

<action>
If 1 (웹):
  <ask>웹은 어떤 화면에 맞출까요?
  1. **PC 중심** - 큰 화면에서 주로 사용
  2. **모바일 웹 중심** - 휴대폰 브라우저에서 주로 사용
  3. **반응형** - PC, 태블릿, 휴대폰 다 지원

  번호로 선택:</ask>
  Store as {{service_type}} = "웹", {{platform}} = [선택값]

If 2 (모바일 앱):
  <ask>어떤 휴대폰을 지원할까요?
  1. **iOS만** - 아이폰만
  2. **Android만** - 안드로이드만
  3. **둘 다** - 아이폰 + 안드로이드

  번호로 선택:</ask>
  Store as {{service_type}} = "모바일 앱", {{platform}} = [선택값]

If 3 (데스크톱 앱):
  <ask>어떤 컴퓨터를 지원할까요?
  1. **Windows만**
  2. **Mac만**
  3. **둘 다** - Windows + Mac
  4. **리눅스 포함** - Windows + Mac + Linux

  번호로 선택:</ask>
  Store as {{service_type}} = "데스크톱 앱", {{platform}} = [선택값]

If 4 (조합):
  <ask>어떤 조합인가요? (예: "웹 + 데스크톱", "웹 + 모바일 앱")</ask>
  Store as {{service_type}} = [조합], {{platform}} = [상세]
</action>
</step>

<step n="4" goal="Core Features">
<action>Based on {{service_type}} and {{problem_statement}}, generate relevant feature options:

**자주 쓰는 기능 목록 (서비스 유형별):**

웹/앱 공통:
- 회원가입/로그인
- 소셜 로그인 (구글, 카카오 등)
- 마이페이지/프로필
- 알림 (푸시/이메일)
- 검색
- 즐겨찾기/북마크
- 공유하기

커뮤니티/소셜:
- 게시글 작성/수정/삭제
- 댓글/대댓글
- 좋아요/추천
- 팔로우/팔로잉
- 메시지/채팅

이커머스/결제:
- 상품 목록/상세
- 장바구니
- 결제 (카드, 간편결제)
- 주문 내역
- 리뷰/평점

콘텐츠/미디어:
- 파일 업로드
- 이미지/동영상 뷰어
- 다운로드
- 카테고리/태그 분류

생산성/도구:
- 대시보드
- 데이터 시각화 (차트/그래프)
- 내보내기 (PDF, Excel)
- 일정/캘린더
- 할일 관리
</action>

<ask>핵심 기능을 선택해주세요. (3-5개)

**자주 쓰는 기능:**
a. 회원가입/로그인
b. 소셜 로그인 (구글, 카카오)
c. 마이페이지/프로필
d. 검색
e. 즐겨찾기/북마크
f. 알림 (푸시/이메일)
g. 공유하기

**{{service_type}} 관련 기능:**
[서비스 유형에 맞는 기능 5-7개 동적 생성]

**선택 방법:**
- 알파벳으로 선택: a, c, d, h
- 직접 입력도 OK: "AI 추천", "실시간 동기화" 등

MVP에 꼭 필요한 것만 선택:</ask>

<action>Store as {{core_features}}</action>
<action>Generate {{core_features_list}} for YAML</action>
</step>

<step n="5" goal="Find Open Source Solutions">
<action>Use skill: opensource-finder</action>

<action>Based on {{project_name}}, {{problem_statement}}, and {{core_features}}, perform search.

**완성형 솔루션 검색:**
- "open source {{service_type_keyword}} 2025"
- "{{project_name}} open source alternative"
- "self hosted {{service_type_keyword}}"
- "awesome-selfhosted" 리스트 확인
</action>

<action>Present 완성형 + 기능 선택을 **한 번에** 보여주기:
"처음부터 다 만들기 전에, 오픈소스를 찾아봤어요!

---

## 1️⃣ 완성형 오픈소스 (전체 서비스)

비슷한 서비스를 통째로 제공하는 오픈소스예요!

**1. [프로젝트명]** ⭐ XX,XXXk
- 한마디: [비유로 설명]
- 핵심 기능: [기능 나열]
- 기술 스택: [React, Node.js 등]
- 라이선스: [MIT/Apache/GPL] {{license_check}}
- 링크: [GitHub URL]

**2. [프로젝트명]** ⭐ XX,XXXk
- ...

**3. [프로젝트명]** ⭐ XX,XXXk
- ...

(최대 5개)

---

## 2️⃣ 기능별로 조합하기

완성형 대신 기능별 라이브러리를 조합할 수도 있어요!

**PRD의 핵심 기능:**
a. {{기능1}} - [한 줄 설명]
b. {{기능2}} - [한 줄 설명]
c. {{기능3}} - [한 줄 설명]
d. {{기능4}} - [한 줄 설명]
e. {{기능5}} - [한 줄 설명]

**찾아볼 기능 선택** (여러 개 가능):
- 위 목록에서 선택: a, c, d
- 직접 입력도 OK: '결제', '알림', '소셜 로그인' 등

---

**선택:**
- 완성형 선택: 번호 (1, 2, 3...)
- 기능별 조합: 알파벳 (a, b, c...) 또는 직접 입력
- 더 찾기: '더 찾아줘'
- 오픈소스 없이: '처음부터'
"
</action>

<action>
**If 번호 1-5 (완성형 선택):**
Store selected as {{base_opensource_name}}, {{base_opensource_repo}}, {{base_opensource_tech}}, {{base_opensource_license}}
Set {{opensource_mode}} = "complete"
Set {{opensource_decision}} = "완성형 활용"

**If "더 찾아줘":**
Search 5 more 완성형 with different keywords, then show again
Continue until user makes other selection

**If "처음부터":**
Set {{opensource_decision}} = "직접 개발"
Set {{opensource_mode}} = false
Skip to Step 6
</action>

<action>**If 알파벳 선택 또는 직접 입력 (기능별 조합):**

알파벳 선택 (a, b, c...) 또는 직접 입력한 기능 키워드를 파싱
선택/입력한 기능들에 대해서만 라이브러리 검색:

각 선택 기능별로:
- "{{기능}} open source library 2025"
- "{{기능}} npm/pip/gem package"
- "best {{기능}} github"

검색 후 결과 제시:
"
## 기능별 라이브러리 검색 결과

### {{선택기능1}} 라이브러리
| 이름 | Stars | 설명 | 라이선스 |
|------|-------|------|---------|
| 1. [라이브러리A] | XXk | 설명 | MIT |
| 2. [라이브러리B] | XXk | 설명 | Apache |
| 3. 직접 개발 | - | - | - |

### {{선택기능2}} 라이브러리
| 이름 | Stars | 설명 | 라이선스 |
|------|-------|------|---------|
| 1. [라이브러리C] | XXk | 설명 | MIT |
| 2. [라이브러리D] | XXk | 설명 | MIT |
| 3. 직접 개발 | - | - | - |

---
각 기능별로 번호 선택해주세요 (예: 1, 2):
"
</action>

<action>Store selections as {{feature_opensource_map}}:
- {{기능1}}: [선택한 라이브러리 or "직접 개발"]
- {{기능2}}: [선택한 라이브러리 or "직접 개발"]
- ...

Generate {{feature_opensource_map_yaml}} for frontmatter

Set {{opensource_mode}} = "combine"
Set {{opensource_decision}} = "조합해서 개발"
</action>

<action>Record all found solutions to {{opensource_registry}}</action>
</step>

<step n="6" goal="Reference Service">
<action>Based on {{service_type}} and {{problem_statement}}, generate relevant service examples:

**서비스 유형별 유명 서비스:**

웹/앱 공통:
- 소셜/커뮤니티: 인스타그램, 페이스북, 트위터(X), 레딧, 디스코드
- 생산성: 노션, Slack, Trello, Asana, Monday.com
- 이커머스: 아마존, 쿠팡, 무신사, 에어비앤비
- 콘텐츠: 유튜브, 넷플릭스, 스포티파이, 미디엄
- 금융: 토스, 카카오뱅크, 페이팔, Revolut
- 음식: 배달의민족, 요기요, Uber Eats
- 교육: Duolingo, Coursera, 클래스101

생산성/도구:
- Notion, Figma, Miro, Airtable, Canva

개발자 도구:
- GitHub, GitLab, VS Code, Postman

</action>

<ask>참고하고 싶은 서비스가 있나요?

**유명 서비스 ({{service_type}} 관련):**
[서비스 유형에 맞는 서비스 10-15개 동적 생성, 알파벳으로 나열]

**디자인 스타일:**
x. **심플하고 깔끔한** (예: Apple, Notion, Airbnb)
y. **친근하고 재미있는** (예: 당근마켓, 토스, Duolingo)
z. **전문적이고 신뢰감** (예: LinkedIn, Stripe, 뱅크샐러드)

**선택 방법:**
- 알파벳으로 선택: a, c, x
- 직접 입력도 OK: "카카오톡", "넷플릭스"
- 없으면: "없음"

선택:</ask>

<action>
Parse selection
If "없음":
  Set {{competitor_benchmarks}} = "없음"
Else:
  Convert selections to service names
  Store as {{competitor_benchmarks}}

  If style (x, y, z) selected:
    Store style preference separately as {{design_style}}
</action>
</step>

<step n="7" goal="Additional Requirements (Optional)">
<ask>추가로 필요한 기능이 있나요? (선택, 여러 개 가능)

**다국어/지역:**
a. 다국어 지원 (영어, 일본어, 중국어 등)
b. 지역 기반 서비스 (GPS, 주소)
c. 시간대/통화 지원

**보안/프라이버시:**
d. 2단계 인증 (OTP, 생체인증)
e. 데이터 암호화
f. 개인정보 보호 강화 (익명, 비공개)

**접근성/편의:**
g. 접근성 (시각/청각 장애인 지원)
h. 오프라인 모드
i. 다크모드

**고급 기능:**
j. 실시간 동기화 (여러 기기)
k. 데이터 백업/복원
l. 관리자 대시보드
m. API 제공 (외부 연동)
n. 알림/푸시 설정

**기타:**
o. 직접 입력
p. 없음

선택 (예: a, d, h):</ask>

<action>
Parse selections
If "p" or "없음":
  Set {{additional_requirements}} = "없음"
Else:
  If "o" in selections:
    <ask>어떤 추가 요구사항인가요? 자유롭게 입력해주세요:</ask>
    Store custom input

  Convert all selections to feature list
  Store as {{additional_requirements}}
</action>
</step>

<step n="8" goal="Generate PRD">
<action>Load template from {template}</action>
<action>Fill template with collected variables</action>
<action>Save to {default_output_file}</action>

<action>If {{opensource_decision}} in ["완성형 활용", "조합해서 개발"]:
Save open source selection to {output_folder}/open-source.md
</action>

<action>Show summary:
"
PRD 완료!

**저장 위치**: {default_output_file}

**요약:**
- 프로젝트: {{project_name}}
- 용도: {{project_license_type}}
- 유형: {{service_type}} / {{platform}}
- 핵심 기능: {{core_features_list}}
- 오픈소스: {{opensource_decision}} {{base_opensource}}

**다음**: UX 디자인 워크플로우
"
</action>
</step>

</workflow>
