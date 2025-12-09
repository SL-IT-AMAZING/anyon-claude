# TRD Workflow Instructions

<critical>You MUST have already loaded: {project-root}/.anyon/anyon-method/workflows/startup-trd/workflow.yaml</critical>
<critical>Communicate in {communication_language}</critical>
<critical>모든 기술 스택은 이 문서에서 정함 (프론트엔드, 백엔드, DB, UI 라이브러리, 호스팅)</critical>
<critical>아키텍처 개요, 시스템 다이어그램은 Architecture 워크플로우에서 만듦. TRD에서 생성하지 말 것!
절대 금지 항목:
- ❌ "**아키텍처:**" 섹션
- ❌ ASCII 다이어그램 (Client → Server → DB 등)
- ❌ 시스템 구성도
- ❌ 데이터 흐름도
TRD는 "어떤 기술을 쓸지"만 정함. "어떻게 연결되는지"는 Architecture에서!</critical>

<workflow>

<step n="0" goal="Load Documents">
<action>Load PRD from {input_prd}</action>
<action>Load UX Design from {input_ux}</action>
<action>Load Design Guide from {input_design}</action>
<action>Extract: project_name, service_type, platform, core_features, project_license_type</action>
<action>Extract opensource info: opensource.decision, opensource.base_project, opensource.base_repo, opensource.base_tech_stack, opensource.base_template, opensource.feature_map</action>

<action>Check service_type for desktop app:
If service_type contains "데스크톱":
  → Set {{is_desktop_app}} = true
Else:
  → Set {{is_desktop_app}} = false
</action>

<action>Check opensource.decision:
If "완성형 활용":
  → Set {{has_base_opensource}} = true, {{opensource_mode}} = "complete"
If "조합해서 개발":
  → Set {{has_base_opensource}} = true, {{opensource_mode}} = "combine"
Else:
  → Set {{has_base_opensource}} = false
</action>

<action>Welcome:

**If {{opensource_mode}} == "complete":**
"안녕하세요! {{project_name}}의 기술 스택을 정할게요.

**기반 오픈소스:** {{opensource.base_project}}
- 기술 스택: {{opensource.base_tech_stack}}

기반 오픈소스의 기술 스택을 그대로 사용하거나,
필요에 따라 일부를 변경할 수 있어요."

**If {{opensource_mode}} == "combine":**
"안녕하세요! {{project_name}}의 기술 스택을 정할게요.

**PRD에서 선택한 기능별 라이브러리:**
{{opensource.feature_map}}

기능별로 선택한 라이브러리들을 통합할 수 있는
프레임워크와 호스팅을 정해야 해요!"

**Else:**
"안녕하세요! {{project_name}}의 기술 스택을 정할게요.

**여기서 정할 것:**
- 프론트엔드 (React, Vue 등)
- UI 라이브러리 (MUI, Tailwind 등)
- 백엔드 (Next.js API, Supabase 등)
- 데이터베이스 (PostgreSQL, MongoDB 등)
- 호스팅 (Vercel, AWS 등)
- 기타 서비스 (인증, 파일저장 등)"
</action>
</step>

<step n="1" goal="Review Base Open Source Tech Stack" if="{{has_base_opensource}} == true">

**Case 1: {{opensource_mode}} == "complete"**
<action>Fetch and analyze base open source project tech stack:

WebFetch: {{opensource.base_repo}} - README, package.json, tech stack
WebSearch: "{{opensource.base_project}} tech stack", "{{opensource.base_project}} requirements"
</action>

<action>Present base project tech stack:
"{{opensource.base_project}}의 기술 스택을 분석했어요!

**Frontend:** [분석 결과]
**Backend:** [분석 결과]
**Database:** [분석 결과]
**기타:** [분석 결과]
"
</action>

<ask>기존 기술 스택을 어떻게 할까요?

1. **전체 유지** - 기존 스택 그대로 사용 (추천)
2. **일부 변경** - 일부만 다른 기술로 교체
3. **전체 변경** - 새로운 스택으로 재구성

번호로 선택:</ask>

<action>
If 1: Auto-fill all tech stack from base project, skip to step 8
If 2: Ask which parts to change, keep rest from base project
If 3: Proceed with normal flow (step 1~7)
</action>

**Case 2: {{opensource_mode}} == "combine"**
<action>Analyze compatibility of selected feature libraries:

For each library in {{opensource.feature_map}}:
- WebFetch: [library repo] - README, package.json
- Check: required framework (React/Vue/etc), Node version, dependencies
</action>

<action>Present compatibility analysis:
"선택한 라이브러리들의 호환성을 분석했어요!

**기능별 라이브러리:**
| 기능 | 라이브러리 | 프레임워크 | 비고 |
|------|-----------|-----------|------|
| {{기능1}} | {{lib1}} | React/Vue | [호환 여부] |
| {{기능2}} | {{lib2}} | React/Vue | [호환 여부] |
| {{기능3}} | {{lib3}} | Framework-agnostic | [호환 여부] |

**호환성 분석:**
- 공통 프레임워크: [React/Vue/둘 다 가능]
- 충돌 가능성: [있음/없음]
- 권장 조합: [분석 결과]
"
</action>

<action>Based on analysis, recommend tech stack:
- If all libraries are React-based → recommend Next.js
- If all libraries are Vue-based → recommend Nuxt
- If mixed or agnostic → ask user preference
</action>

<ask>기능별 라이브러리 기반으로 추천드려요:

**추천 스택:**
- Frontend: {{recommended_frontend}} (라이브러리들과 호환)
- Backend: {{recommended_backend}}
- Database: {{recommended_database}}

이대로 진행할까요?

1. **네, 추천대로** - 위 스택으로 진행
2. **일부 변경** - 일부만 다른 기술로 교체
3. **전체 새로** - 처음부터 선택

번호로 선택:</ask>

</step>

<step n="2" goal="Budget">
<ask>월 인프라 예산은 얼마인가요?

1. **무료** - 무료 tier만 (Vercel Free, Supabase Free)
   - 적합: MVP 테스트, 사용자 100명 이하
   - 제한: 대역폭, DB 용량, 7일 비활성 시 정지(Supabase)

2. **소규모 (1-5만원)** - Pro 플랜 일부
   - 적합: 소규모 실서비스, 사용자 1,000명 이하
   - 가능: 제한 해제, 이메일 지원

3. **중규모 (5-20만원)** - 안정적 운영
   - 적합: 성장 단계, 사용자 10,000명 이하
   - 가능: 자동 백업, 전용 지원

4. **대규모 (20만원+)** - 본격 서비스
   - 적합: 사용자 10,000명 이상
   - 가능: 엔터프라이즈급, SLA 보장

번호 선택:</ask>

<action>Store as {{monthly_budget}}</action>
</step>

<step n="3" goal="Frontend Framework">
<action>WebSearch: "best frontend framework 2024 {{platform}}"</action>

<action>Present 4-5 options with comparison:
각 옵션별로:
- 장점/단점
- 적합한 프로젝트 유형
- 학습 곡선
- 커뮤니티 크기
- {{project_name}}에 추천 이유
</action>

<ask>Frontend Framework 선택:

**추천 옵션:**
1. **Next.js** - React + SSR
   - 장점: SEO 좋음, Vercel 배포 쉬움, 풀스택 가능
   - 단점: 학습 곡선, 복잡할 수 있음
   - 적합: 대부분의 웹 서비스

2. **React + Vite** - SPA
   - 장점: 가볍고 빠름, 유연함
   - 단점: SEO 추가 작업 필요, 서버 별도
   - 적합: 대시보드, 어드민

3. **Vue 3** - Progressive Framework
   - 장점: 배우기 쉬움, 한국 인기
   - 단점: React 대비 생태계 작음
   - 적합: 중소규모 프로젝트

4. **Nuxt 3** - Vue + SSR
   - 장점: Vue 기반 SSR, SEO
   - 단점: Vue 생태계 제한
   - 적합: Vue 선호 시 SSR 필요

5. 기타

**{{project_name}}에 추천**: [PRD 기반 추천]

번호 선택:</ask>

<action>Store as {{frontend_framework}}</action>
</step>

<step n="4" goal="Desktop App Framework" if="{{is_desktop_app}} == true">
<action>WebSearch: "electron vs tauri vs neutralino 2024 comparison"</action>

<ask>데스크톱 앱을 만들려면 웹 기술을 PC 프로그램으로 바꿔주는 도구가 필요해요.

**데스크톱 앱 프레임워크 선택:**

1. **Electron** - 검증된 대표 선택
   - 💬 한마디: VSCode, Slack, Discord가 이걸로 만들어졌어요
   - 장점: 안정적, 자료 많음, 대부분의 기능 지원
   - 단점: 용량 큼 (100MB+), 메모리 많이 씀
   - 적합: 복잡한 앱, 안정성 중요할 때

2. **Tauri** - 가볍고 빠른 신흥 강자
   - 💬 한마디: Electron의 가벼운 대안이에요 (Rust 기반)
   - 장점: 용량 작음 (10MB~), 빠름, 보안 좋음
   - 단점: Rust 필요, 자료 상대적으로 적음
   - 적합: 가벼운 앱, 성능 중요할 때

3. **Neutralino** - 초경량 선택
   - 💬 한마디: 가장 가벼운 데스크톱 앱 도구예요
   - 장점: 용량 매우 작음 (5MB~), 설정 간단
   - 단점: 기능 제한적, 커뮤니티 작음
   - 적합: 단순한 앱, 빠른 프로토타입

4. **Wails** - Go 기반
   - 💬 한마디: Go 언어로 백엔드를 짜고 싶을 때
   - 장점: Go의 성능, 용량 작음
   - 단점: Go 필요, 자료 적음
   - 적합: Go 개발자, 서버 연동 많을 때

5. **나중에 결정**
   - 웹으로 먼저 만들고, 나중에 데스크톱 래퍼 선택
   - 적합: 아직 확실하지 않을 때

**비교표:**
| | Electron | Tauri | Neutralino | Wails |
|---|---------|-------|-----------|-------|
| 앱 용량 | 100MB+ | 10MB~ | 5MB~ | 15MB~ |
| 메모리 | 많음 | 적음 | 매우 적음 | 적음 |
| 자료/커뮤니티 | 풍부 | 성장중 | 적음 | 적음 |
| 백엔드 언어 | Node.js | Rust | JS/TS | Go |

**{{project_name}}에 추천**: [PRD/플랫폼 기반 분석 후 추천]

번호 선택:</ask>

<action>Store as {{desktop_framework}}</action>
</step>

<step n="5" goal="UI Library">
<action>WebSearch: "{{frontend_framework}} UI library 2024"</action>

<action>Present options based on selected framework</action>

<ask>UI 라이브러리 선택:

**{{frontend_framework}} 기준 추천:**

[React/Next.js인 경우]
1. **shadcn/ui** - Radix + Tailwind
   - 장점: 커스터마이징 최고, 복사해서 수정 가능
   - 단점: 초기 설정 필요
   - 적합: 디자인 자유도 필요 시

2. **MUI (Material UI)** - Material Design
   - 장점: 풍부한 컴포넌트, 완성도 높음
   - 단점: 번들 크기, 커스텀 어려움
   - 적합: 빠른 개발, Material 스타일

3. **Ant Design** - 엔터프라이즈급
   - 장점: 테이블, 폼 컴포넌트 강력
   - 단점: 중국 스타일, 번들 크기
   - 적합: 어드민, 대시보드

4. **Chakra UI** - 접근성 중심
   - 장점: 접근성, 테마 시스템
   - 단점: 컴포넌트 종류 적음
   - 적합: 접근성 중요 시

5. **Tailwind만** - 유틸리티
   - 장점: 완전한 자유도
   - 단점: 컴포넌트 직접 구현
   - 적합: 커스텀 디자인

[Vue인 경우]
1. Vuetify - Material Design
2. Element Plus - 풍부한 컴포넌트
3. Naive UI - TypeScript 지원

번호 선택:</ask>

<action>Store as {{ui_library}}</action>
</step>

<step n="6" goal="Backend">
<action>Analyze PRD features to determine complexity</action>

<action>WebSearch: "best backend for {{service_type}} 2024"</action>

<ask>Backend 선택:

**PRD 복잡도 분석:** [간단/중간/복잡]

**추천 옵션:**
1. **Next.js API Routes** - 프론트와 통합
   - 장점: 별도 서버 불필요, 타입 공유
   - 단점: 복잡한 로직 한계
   - 적합: 간단한 CRUD, BFF 패턴

2. **Supabase** - BaaS (올인원)
   - 장점: DB + 인증 + 저장소 + 실시간
   - 단점: 종속성, 복잡한 로직 제한
   - 적합: MVP, 빠른 개발

3. **Firebase** - Google BaaS
   - 장점: NoSQL, 실시간 데이터
   - 단점: 종속성, 비용 예측 어려움
   - 적합: 실시간 앱, 모바일

4. **Node.js (Express/Fastify)** - 전통적 서버
   - 장점: 완전한 제어, 복잡한 로직
   - 단점: 직접 구현 많음
   - 적합: 복잡한 비즈니스 로직

5. **Python (FastAPI)** - ML/데이터
   - 장점: 빠름, 타입 힌트, OpenAPI
   - 단점: JS 생태계와 분리
   - 적합: ML, 데이터 처리

6. 기타

**{{project_name}}에 추천**: [PRD 기반 추천]

번호 선택:</ask>

<action>Store as {{backend_framework}}</action>
</step>

<step n="7" goal="Database">
<action>WebSearch: "{{backend_framework}} database recommendation 2024"</action>

<ask>Database 선택:

**추천 옵션:**
1. **PostgreSQL (Supabase)** - 관계형 + 실시간
   - 장점: 무료 tier 좋음, 실시간 구독
   - 단점: 7일 비활성 시 정지 (Free)
   - 적합: 대부분의 서비스

2. **PostgreSQL (Neon)** - 서버리스
   - 장점: 서버리스, 브랜칭
   - 단점: 무료 tier 제한적
   - 적합: 서버리스 아키텍처

3. **MongoDB Atlas** - NoSQL
   - 장점: 유연한 스키마, 확장성
   - 단점: 관계 데이터 복잡
   - 적합: 비정형 데이터, 빠른 개발

4. **Firebase Firestore** - 실시간 NoSQL
   - 장점: 실시간 동기화, 오프라인
   - 단점: 복잡한 쿼리 제한
   - 적합: 실시간 앱, 모바일

5. **PlanetScale (MySQL)** - 서버리스
   - 장점: 브랜칭, 무중단 스키마 변경
   - 단점: Foreign key 제한
   - 적합: 대규모 확장 예정

번호 선택:</ask>

<action>Store as {{database}}</action>
</step>

<step n="8" goal="Hosting">
<action>WebSearch: "best hosting for {{frontend_framework}} {{backend_framework}} 2024"</action>

<ask>호스팅 선택:

**추천 옵션:**
1. **Vercel** - Next.js 최적화
   - 장점: 배포 쉬움, Edge Functions, 무료 tier 좋음
   - 단점: 서버 기능 제한
   - 적합: Next.js 프로젝트

2. **Netlify** - 정적 + Serverless
   - 장점: 쉬움, 폼 처리, Identity
   - 단점: 서버 기능 제한
   - 적합: 정적 사이트, JAMstack

3. **Railway** - 풀스택
   - 장점: Docker 지원, DB 포함, 쉬움
   - 단점: 무료 tier 제한적
   - 적합: 전통적 서버 앱

4. **AWS Amplify** - AWS 생태계
   - 장점: AWS 서비스 통합
   - 단점: 복잡함, AWS 종속
   - 적합: AWS 사용 시

5. **Cloudflare Pages** - Edge
   - 장점: 무료 tier 좋음, 빠름
   - 단점: 서버 기능 제한
   - 적합: 정적 사이트, Edge

번호 선택:</ask>

<action>Store as {{hosting_platform}}</action>
</step>

<step n="9" goal="Additional Services" if="PRD requires">
<action>PRD 기능 분석 후 필요한 서비스만 질문</action>

<substep if="needs authentication">
<action>WebSearch: "best auth solution {{backend_framework}} 2024"</action>
<ask>인증 서비스:

1. **Supabase Auth** - Supabase 내장
   - 장점: DB와 통합, 소셜 로그인
   - 단점: Supabase 종속

2. **NextAuth.js (Auth.js)** - 오픈소스
   - 장점: 유연함, 다양한 provider
   - 단점: 직접 설정 필요

3. **Firebase Auth** - Google
   - 장점: 쉬움, 다양한 provider
   - 단점: Firebase 종속

4. **Clerk** - 관리형
   - 장점: UI 제공, 관리 대시보드
   - 단점: 유료 (무료 tier 있음)

번호 선택:</ask>
<action>Store as {{auth_service}}</action>
</substep>

<substep if="needs file storage">
<action>WebSearch: "best file storage for web apps 2024"</action>
<ask>파일 저장:

1. **Supabase Storage** - Supabase 내장
   - 무료: 1GB, 대역폭 2GB/월

2. **AWS S3** - 업계 표준
   - 무료: 5GB (12개월), 이후 저렴

3. **Cloudinary** - 이미지 최적화
   - 무료: 25GB 대역폭/월, 이미지 변환

4. **Vercel Blob** - Vercel 통합
   - 무료: 제한적, Vercel과 통합

번호 선택:</ask>
<action>Store as {{file_storage}}</action>
</substep>

<substep if="needs payment">
<ask>결제 서비스:

1. **Stripe** - 글로벌 표준
   - 수수료: 2.9% + 30¢
   - 장점: 문서 좋음, 다양한 기능

2. **Toss Payments** - 한국 최적화
   - 수수료: 3.3%~
   - 장점: 한국 결제수단, 간편결제

3. **Paddle** - SaaS 특화
   - 수수료: 5% + 50¢
   - 장점: 세금 처리, 구독 관리

번호 선택:</ask>
<action>Store as {{payment_service}}</action>
</substep>

<substep if="needs email">
<ask>이메일 서비스:

1. **Resend** - 개발자 친화적
   - 무료: 100 이메일/일
   - 장점: React Email, 깔끔한 API

2. **SendGrid** - 대규모
   - 무료: 100 이메일/일
   - 장점: 대량 발송, 분석

3. **AWS SES** - 저렴
   - 무료: 62,000/월 (EC2에서)
   - 장점: 매우 저렴

번호 선택:</ask>
<action>Store as {{email_service}}</action>
</substep>
</step>

<step n="10" goal="Generate TRD">
<action>Load template from {template}</action>
<action>Fill template with collected variables</action>
<action>Include for each selection:
- 선택 이유
- 장단점
- 비용 예상
- 대안
</action>
<action>Save to {default_output_file}</action>

<action>Show summary:
"
TRD 완료!

**저장 위치**: {default_output_file}

**기술 스택:**
| 분류 | 선택 | 이유 |
|-----|-----|------|
| Frontend | {{frontend_framework}} | [이유] |
| UI | {{ui_library}} | [이유] |
| Backend | {{backend_framework}} | [이유] |
| Database | {{database}} | [이유] |
| Hosting | {{hosting_platform}} | [이유] |
| 추가 서비스 | [선택한 서비스들] | |

**예상 비용:**
- MVP (무료 tier): $0/월
- 성장기: $XX/월

**다음**: Architecture 워크플로우
"
</action>
</step>

</workflow>
