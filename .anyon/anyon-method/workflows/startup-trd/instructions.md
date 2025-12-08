# Startup TRD Workflow Instructions

<critical>The workflow execution engine is governed by: {project-root}/.anyon/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/.anyon/anyon-method/workflows/startup-trd/workflow.yaml</critical>
<critical>Communicate in {communication_language} throughout the workflow process</critical>
<critical>⚠️ ABSOLUTELY NO TIME ESTIMATES - NEVER mention hours, days, weeks, months, or ANY time-based predictions.</critical>
<critical>Target audience: NON-TECHNICAL FOUNDERS - Use clear, accessible language with storytelling and real-world examples</critical>
<critical>Final document: AI-READABLE - Include all technical details, versions, configurations for implementation</critical>

<critical>🔍 WEB SEARCH IS MANDATORY
For EVERY technical decision:
- Search for latest solutions and best practices
- Present 4-8 options with benchmarks
- Compare performance, scalability, cost
- Let user make informed decisions</critical>

<workflow>

<step n="0" goal="Load All Previous Documents">
<action>Load PRD from {input_prd}</action>
<action>Load UX Design from {input_ux}</action>
<action>Load UI Design Guide from {input_ui}</action>

<action>Extract from PRD:
- service_type
- platform
- core_features (모든 기능)
- business_model
- target_users
- success_metrics
</action>

<action>Extract from UX Design:
- key_components
- user_flows (주요 플로우들)
- interaction_patterns
- state_management needs
</action>

<action>Extract from UI Design Guide:
- selected UI library
- specialized_components
- platform_specific requirements
</action>

<action>Welcome user in {communication_language}:
"안녕하세요! {{project_name}}의 TRD (기술 요구사항 문서)를 만들어볼게요.

**지금까지 정의한 내용:**
📋 PRD: {{core_features_count}}개 핵심 기능
🎨 UX: {{total_screens}}개 화면, {{total_user_flows}}개 플로우
🖌️ UI: {{ui_library}} + 특수 컴포넌트들

이제 이 모든 걸 실제로 '만들' 기술을 선택할 거예요!

**TRD에서 정할 것:**
- Frontend 프레임워크 (React? Vue? Next.js?)
- Backend 프레임워크 (Node.js? Python? Go?)
- Database (PostgreSQL? MongoDB?)
- 각 기능을 구현할 구체적인 기술/라이브러리
- 인증, 결제, 파일 저장 등 서비스
- 배포 플랫폼 (Vercel? AWS? Heroku?)

하나하나 검색해서 최신 옵션을 보여드리고 선택하시면 됩니다!"
</action>

<template-output>documents_loaded</template-output>
</step>

<step n="1" goal="Define Technical Selection Principles">
<action>Based on project characteristics, establish tech selection criteria</action>

<action>Explain:
"기술을 선택할 때 고려해야 할 원칙을 먼저 정할 거예요.

**기술 선택 기준:**

💰 **비용**
- 초기 비용 vs 운영 비용
- 무료 tier가 있는가?
- 사용자 수가 늘어나면 비용이 얼마나 증가하는가?

📈 **확장성 (Scalability)**
- 사용자가 10명 → 1,000명 → 10만명으로 늘어나도 괜찮은가?
- 쉽게 확장 가능한가?

⚡ **개발 속도**
- 빨리 만들 수 있는가?
- 레퍼런스와 튜토리얼이 많은가?
- AI 개발 도구가 잘 지원하는가?

🔧 **유지보수**
- 계속 업데이트되는 기술인가?
- 커뮤니티가 활발한가?
- 문서가 잘 되어 있는가?

👥 **개발자 구하기**
- 이 기술을 아는 개발자가 많은가?
- 배우기 쉬운가?

{{project_name}}의 경우 어떤 원칙이 가장 중요할까요?"
</action>

<action>Based on PRD context, suggest priorities:

If MVP/startup:
- 개발 속도 우선
- 무료/저렴한 비용
- 검증된 기술

If enterprise/scale-focused:
- 확장성 우선
- 안정성
- 보안

If technical product:
- 성능 우선
- 최신 기술
- 커스터마이징 가능
</action>

<ask>{{project_name}}에서 가장 중요한 기준은 무엇인가요? (여러 개 선택 가능)

1. 💰 비용 - 최대한 저렴하게
2. ⚡ 개발 속도 - 빨리 출시하는 게 중요
3. 📈 확장성 - 사용자가 많아질 걸 대비
4. 🔒 보안 - 민감한 데이터 다룸
5. 🚀 성능 - 빠른 속도가 핵심
6. 👥 개발자 구하기 쉬움 - 흔한 기술
7. 🔧 유지보수 용이성 - 장기 운영

선택해주세요:</ask>

<action>Store priorities and create principles:

Generate 3-5 technical selection principles based on choices

예시:
- "비용 효율적인 오픈소스 우선"
- "검증된 기술 스택 사용 (최신 기술보다 안정성)"
- "빠른 개발을 위한 풍부한 생태계"
- "쉬운 확장성을 위한 클라우드 네이티브"
- "강력한 커뮤니티와 문서화"
</action>

<action>Store as {{tech_selection_principles}}</action>

<template-output>tech_principles</template-output>
</step>

<step n="2" goal="🔍 Select Frontend Framework">
<critical>Search and present frontend framework options</critical>

<action>Explain frontend framework:
"먼저 Frontend (사용자가 보는 화면) 프레임워크를 선택할 거예요.

**Frontend Framework란?**
웹사이트나 앱의 화면을 만드는 '도구'예요.

**대표적인 프레임워크:**
- React: 가장 인기 많음, 페이스북이 만듦
- Next.js: React 기반, 서버 기능 포함
- Vue: 배우기 쉬움, 한국에서 인기
- Angular: 구글이 만듦, 엔터프라이즈용

{{platform}}이 {{service_type}}이니까
적합한 프레임워크를 검색해드릴게요!"
</action>

<action>Determine search queries based on {{platform}}:

If web/hybrid:
- "best frontend framework 2024"
- "React vs Next.js vs Vue 2024"
- "{{service_type}} frontend framework"

If React Native:
- "React Native vs Flutter 2024"
- "mobile app framework comparison"

If already determined from UI selection:
- Skip framework selection, use UI library's framework
</action>

<action>Perform WebSearch for framework options</action>

<action>For top 5-7 frameworks found, gather via WebFetch:
- npm downloads trend
- GitHub stars and activity
- Latest version and release date
- Community size
- Learning curve
- Performance benchmarks
- Integration with {{ui_library}}
</action>

<action>Present options in detailed format:

"━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 Frontend Framework 검색 결과

**옵션 1: [Framework Name]**

🔗 **링크**
- 웹사이트: [URL]
- GitHub: [URL] (⭐ [stars])
- 문서: [URL]

📊 **인기도**
- npm 주간 다운로드: [number]
- GitHub Stars: [number]
- StackOverflow 질문: [number]

💡 **비개발자를 위한 설명**
[쉬운 언어로 설명, 실제 예시 포함]

예: 'Next.js는 React에 서버 기능을 더한 거예요.
React로 화면을 만들고, Next.js로 빠른 로딩과 SEO(검색 최적화)를 챙기는 거죠.
Vercel에서 만들어서 배포도 엄청 쉬워요.'

✅ **장점**
- [장점 1]
- [장점 2]
- [장점 3]

⚠️ **단점 / 고려사항**
- [단점 1]
- [단점 2]

🎯 **{{project_name}}에 적합한 이유**
⭐⭐⭐⭐☆ (5점 만점)
[왜 이 점수인지]

💰 **비용**
- 프레임워크 자체: 무료
- 호스팅 비용: [예상치]

📈 **확장성**
⭐⭐⭐⭐☆
[설명]

⚡ **개발 속도**
⭐⭐⭐⭐☆
[설명]

🔧 **{{ui_library}}와의 호환성**
⭐⭐⭐⭐⭐
[설명]

📝 **개발자용 상세**
```
Package: [package-name]
Version: [version]
TypeScript: [Yes/No]
SSR Support: [Yes/No]
Build Tool: [Vite/Webpack/etc]
```

**코드 예시:**
```tsx
// 간단한 페이지 예시
[실제 코드]
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[옵션 2, 3, 4, 5... 계속]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
</action>

<ask>Frontend Framework는 어떤 걸로 할까요?

**선택 팁:**
- 빠른 개발 + SEO 필요 → Next.js
- 유연성 원함 → React
- 배우기 쉬운 거 → Vue
- 모바일 앱 → React Native
- {{ui_library}}를 선택했으니 [추천 프레임워크]가 잘 맞아요

번호를 선택하거나 궁금한 점 물어보세요:</ask>

<action>Store selection as {{frontend_framework}}</action>

<action>Gather full implementation details via WebFetch:
- Starter template/boilerplate
- Integration with {{ui_library}}
- Recommended file structure
- Configuration best practices
</action>

<action>Store details as {{frontend_stack}}</action>

<template-output>frontend_selected</template-output>
</step>

<step n="3" goal="🔍 Select Backend Framework">
<critical>Search and present backend framework options</critical>

<action>Explain backend:
"이제 Backend (서버, 데이터 처리)를 선택할 거예요.

**Backend란?**
사용자가 못 보는 '뒷단'이에요. 데이터 저장, 로그인 처리, 비즈니스 로직 등을 담당해요.

**옵션:**

1. **서버리스 (Serverless)**
   - 서버 관리 없이 함수만 작성
   - 예: Next.js API Routes, AWS Lambda, Supabase
   - 장점: 관리 쉬움, 비용 저렴 (소규모)
   - 단점: 복잡한 로직엔 제한적

2. **전통적 서버 (Traditional Server)**
   - Node.js (Express, Fastify)
   - Python (Django, FastAPI)
   - Go, Java 등
   - 장점: 완전한 제어, 복잡한 로직 가능
   - 단점: 서버 관리 필요, 초기 설정 복잡

3. **BaaS (Backend-as-a-Service)**
   - Firebase, Supabase, Amplify
   - 장점: 엄청 빠른 개발, 인증/DB/저장소 다 제공
   - 단점: 종속성, 비용 (사용자 많아지면)

{{project_name}}의 PRD 기능을 보니
[분석 결과] 정도 복잡도네요."
</action>

<action>Analyze PRD features to determine backend complexity:

Low complexity (BaaS 충분):
- 간단한 CRUD
- 기본 인증
- 파일 업로드 정도

Medium complexity (Serverless 적합):
- 비즈니스 로직 있음
- 외부 API 연동
- 복잡한 데이터 처리

High complexity (Traditional 필요):
- 실시간 처리
- 복잡한 알고리즘
- 높은 성능 요구
- Microservices
</action>

<action>Based on complexity, search for appropriate options:

If low:
- "Firebase vs Supabase 2024"
- "best BaaS platform"

If medium:
- "Next.js API routes vs serverless"
- "serverless backend framework"

If high:
- "Node.js backend framework 2024"
- "Python FastAPI vs Django"
- "Go backend framework"
</action>

<action>Perform WebSearch and gather options</action>

<action>Present 5-7 options with same detailed format as frontend:

Include:
- BaaS options (Firebase, Supabase, Appwrite)
- Serverless options (Next.js API, Vercel Functions)
- Traditional frameworks (Express, Fastify, NestJS)
- Alternative languages (FastAPI, Gin)

For each:
- Performance benchmarks
- Scalability limits
- Cost comparison (FREE tier + paid)
- Integration with {{frontend_framework}}
- Learning curve
- Community size
</action>

<ask>Backend은 어떻게 할까요?

**{{project_name}}의 경우:**
- 기능 복잡도: [Low/Medium/High]
- 추천: [추천 옵션]

번호를 선택해주세요:</ask>

<action>Store as {{backend_framework}}</action>
<action>Store details as {{backend_stack}}</action>

<template-output>backend_selected</template-output>
</step>

<step n="4" goal="🔍 Select Database">
<critical>Search and present database options</critical>

<action>Explain databases:
"이제 Database (데이터 저장소)를 선택할 거예요.

**Database란?**
사용자 정보, 게시물, 주문 내역 등 모든 데이터를 저장하는 곳이에요.

**종류:**

📊 **SQL (관계형)**
- PostgreSQL, MySQL, SQLite
- 표 형태로 저장 (엑셀처럼)
- 장점: 정확함, 데이터 관계 명확
- 단점: 복잡한 데이터엔 불편
- 적합: 사용자, 주문, 정형 데이터

🗂️ **NoSQL (비관계형)**
- MongoDB, Firestore
- JSON 형태로 저장
- 장점: 유연함, 빠른 개발
- 단점: 데이터 일관성 관리 필요
- 적합: 소셜피드, 로그, 비정형 데이터

⚡ **하이브리드**
- Supabase (PostgreSQL + 실시간)
- Firebase (NoSQL + 실시간)

{{project_name}}의 데이터를 생각해보면..."
</action>

<action>Analyze PRD features to determine data characteristics:

Structured data (SQL 추천):
- 사용자/제품/주문
- 명확한 관계
- 트랜잭션 필요

Flexible data (NoSQL 추천):
- 소셜 피드
- 로그/분석 데이터
- 스키마 변동 많음

Real-time needs:
- 채팅
- 협업 도구
- 라이브 업데이트
</action>

<action>Search for database options:

Queries:
- "PostgreSQL vs MongoDB 2024"
- "best database for {{service_type}}"
- "{{backend_framework}} database options"
- "Supabase vs Firebase database"
</action>

<action>Present 6-8 options:

SQL options:
- PostgreSQL
- MySQL
- Supabase (PostgreSQL + features)
- PlanetScale (MySQL + serverless)

NoSQL options:
- MongoDB
- Firebase Firestore
- DynamoDB

For each:
- Data model fit
- Performance characteristics
- Scalability (FREE tier limits)
- Cost breakdown
- Backup/recovery
- Real-time support
- Integration with {{backend_framework}}
</action>

<ask>어떤 데이터베이스가 좋을까요?

**{{project_name}}의 데이터 특성:**
- [분석 결과]
- 추천: [추천 DB]

번호를 선택해주세요:</ask>

<action>Store as {{database}}</action>
<action>Store details as {{database_stack}}</action>

<template-output>database_selected</template-output>
</step>

<step n="5" goal="🔍 Feature-by-Feature Implementation Search">
<critical>For EACH core feature from PRD, search for implementation technologies</critical>

<action>Explain feature implementation:
"이제 PRD의 핵심 기능들을 하나씩 보면서,
각 기능을 구현할 구체적인 기술을 찾을 거예요.

**왜 기능별로 찾나요?**
예를 들어 '실시간 채팅' 기능이 있다면:
- WebSocket 라이브러리 필요
- Socket.io? Pusher? Ably?

'결제' 기능이 있다면:
- 결제 게이트웨이 필요
- Stripe? Toss Payments? iamport?

각 기능마다 전문 라이브러리/서비스가 있어요!"
</action>

<action>Load all core features from PRD: {{core_features_from_prd}}</action>

<action>For each feature, analyze and categorize:

Feature categories that need special tech:
- **Authentication** (로그인/회원가입)
- **Real-time** (채팅, 협업, 라이브)
- **Payment** (결제)
- **File Upload** (이미지, 동영상, 문서)
- **Search** (검색 엔진)
- **Email/SMS** (이메일/문자 발송)
- **Push Notifications** (푸시 알림)
- **Maps/Location** (지도, 위치)
- **Video/Audio** (영상/음성 통화)
- **Analytics** (분석, 통계)
- **Scheduling** (예약, 일정)
- **Payments** (구독, 결제)
- **Social Auth** (소셜 로그인)
- **Image Processing** (이미지 편집, 필터)
- **PDF Generation** (PDF 생성)
- **Charting** (차트, 그래프) - UI에서 다뤘다면 skip
</action>

<action>Present feature implementation roadmap:

"PRD의 {{core_features_count}}개 기능을 보니,
특별한 기술이 필요한 기능들이 있어요:

1. [기능 1] → [카테고리] 솔루션 필요
2. [기능 2] → [카테고리] 솔루션 필요
3. ...

하나씩 검색해서 최적의 솔루션을 찾아드릴게요!"
</action>

<substep n="5a" title="Authentication Solution" if="needs authentication">
<action>Explain authentication:
"로그인/회원가입 기능을 어떻게 구현할지 정할 거예요.

**옵션:**

1. **직접 구현**
   - JWT + 비밀번호 암호화
   - 장점: 완전한 제어
   - 단점: 보안 신경 써야 함

2. **Auth 라이브러리**
   - NextAuth.js, Auth.js
   - 장점: 검증됨, 소셜 로그인 쉬움
   - 단점: 설정 필요

3. **Auth 서비스**
   - Supabase Auth, Firebase Auth, Auth0, Clerk
   - 장점: 완전 관리형, 매우 쉬움
   - 단점: 비용, 종속성"
</action>

<action>Search for auth solutions:
- "best authentication solution 2024"
- "NextAuth vs Supabase Auth"
- "{{backend_framework}} authentication"
</action>

<action>Present 5-7 auth options with:
- Setup complexity
- Social providers supported
- MFA support
- Pricing (FREE tier + paid)
- Integration with {{backend_framework}}
- Security features
</action>

<ask>로그인/회원가입은 어떻게 구현할까요?</ask>

<action>Store as {{authentication_solution}}</action>
</substep>

<substep n="5b" title="File Storage Solution" if="needs file storage">
<action>Search for file storage options:
- "best file storage service 2024"
- "AWS S3 vs Cloudinary vs Uploadcare"
- "image hosting for {{platform}}"
</action>

<action>Present options:
- AWS S3
- Cloudinary
- Uploadcare
- Supabase Storage
- Firebase Storage
- Vercel Blob

For each:
- Storage limits (FREE tier)
- Bandwidth
- Image optimization features
- CDN included
- Pricing
</action>

<ask>파일(이미지, 동영상 등) 저장은 어떻게 할까요?</ask>

<action>Store as {{file_storage_solution}}</action>
</substep>

<substep n="5c" title="Email/Notifications" if="needs email/notifications">
<action>Search for email services:
- "best email service for developers 2024"
- "Resend vs SendGrid vs AWS SES"
- "transactional email service"
</action>

<action>Present options:
- Resend
- SendGrid
- AWS SES
- Postmark
- Mailgun

Include:
- FREE tier emails/month
- Deliverability rate
- Email templates support
- Pricing
</action>

<ask>이메일 발송은 어떤 서비스로 할까요?</ask>

<action>Store as {{email_notification_solution}}</action>
</substep>

<substep n="5d" title="Payment Solution" if="needs payment">
<action>Determine payment needs from PRD {{business_model}}:

If subscription:
- Recurring billing needed
- Stripe, Paddle

If one-time:
- Simple checkout
- Stripe, Toss Payments (한국)

If marketplace:
- Split payments
- Stripe Connect
</action>

<action>Search for payment solutions:
- "Stripe vs Paddle 2024"
- "best payment gateway Korea" (if Korean service)
- "subscription billing service"
</action>

<action>Present options:
- Stripe (global)
- Toss Payments (Korea)
- Paddle (SaaS focus)
- iamport (Korea aggregator)

Include:
- Transaction fees
- Subscription support
- Supported payment methods
- Payout schedule
- Tax handling
</action>

<ask>결제는 어떤 서비스로 할까요?</ask>

<action>Store as {{payment_solution}}</action>
</substep>

<substep n="5e" title="Other Special Features" repeat="for-each-special-feature">
<action>For each remaining special feature:

1. Explain the need
2. Search for solutions (4-6 options)
3. Present detailed comparison
4. User selects
5. Store solution

Examples:
- Real-time: Pusher, Ably, Socket.io, Supabase Realtime
- Search: Algolia, Typesense, Meilisearch, ElasticSearch
- Video calls: Agora, Twilio, Daily.co
- Maps: Google Maps, Mapbox, Leaflet
- Analytics: PostHog, Mixpanel, Amplitude
- Scheduling: Cal.com API, Calendly
</action>
</substep>

<action>Compile all feature implementations:

Create comprehensive table:

| Feature (from PRD) | Implementation | Service/Library | Reason |
|-------------------|----------------|-----------------|--------|
| [Feature 1] | [Tech solution] | [Name + link] | [Why] |
| [Feature 2] | [Tech solution] | [Name + link] | [Why] |
| ... | ... | ... | ... |
</action>

<action>Store as {{feature_by_feature_implementation}}</action>
<action>Generate summary list for YAML as {{feature_implementations_list}}</action>

<template-output>feature_implementations</template-output>
</step>

<step n="6" goal="Define State Management">
<action>Based on {{frontend_framework}} and app complexity, define state management</action>

<action>Analyze UX Design's state management needs:
- How many global states?
- How complex is data flow?
- Need for optimistic updates?
- Server state vs Client state
</action>

<action if="simple state needs">
Recommend built-in solutions:
- React: useState, useContext
- Vue: Composition API
- Next.js: Server Components + Client State
</action>

<action if="complex state needs">
Search for state management solutions:
- "React state management 2024"
- "Zustand vs Redux vs Jotai"
- "TanStack Query vs SWR"

Present options:
- Redux Toolkit
- Zustand
- Jotai
- TanStack Query (for server state)
- SWR
</action>

<action>Store as {{state_management_solution}}</action>

<template-output>state_management</template-output>
</step>

<step n="7" goal="Define API Architecture">
<action>Design API approach based on selections</action>

<action>Based on {{frontend_framework}} and {{backend_framework}}, recommend:

If Next.js:
- API Routes
- Server Actions
- tRPC (type-safe)

If separate backend:
- REST API
- GraphQL (if complex data)
- tRPC (if TypeScript)

Design patterns:
- RESTful endpoints
- API versioning
- Error handling
- Authentication middleware
- Rate limiting
</action>

<action>Store as {{api_architecture}}</action>

<template-output>api_design</template-output>
</step>

<step n="8" goal="Define Data Storage Strategy">
<action>Design how data flows and is stored</action>

<action>Based on {{database}} and features:

Define:
- Database schema approach
- Caching strategy (Redis? In-memory?)
- Session storage
- File storage (from 5b)
- CDN strategy
</action>

<action>Store as {{data_storage_strategy}}</action>

<template-output>data_storage</template-output>
</step>

<step n="9" goal="🔍 Select Deployment & Hosting">
<critical>Search for deployment platform options</critical>

<action>Explain deployment:
"이제 만든 서비스를 인터넷에 올릴 곳을 정할 거예요.

**Deployment Platform이란?**
사용자들이 접속할 수 있게 서비스를 호스팅하는 곳이에요.

**옵션:**

☁️ **Vercel**
- Next.js 만든 회사
- 장점: 엄청 쉬움, 빠름, 무료 tier 좋음
- 단점: Next.js 외엔 제한적

☁️ **Netlify**
- Static sites, Serverless
- 장점: 쉬움, 좋은 무료 tier
- 단점: 복잡한 backend 제한

☁️ **AWS**
- 아마존 클라우드
- 장점: 완전한 제어, 강력함
- 단점: 복잡함, 비용 예측 어려움

☁️ **Railway**
- 간단한 배포
- 장점: Docker 지원, DB 포함, 쉬움
- 단점: 무료 tier 제한적

☁️ **Fly.io**
- Global edge deployment
- 장점: 빠름, 유연함
- 단점: 설정 필요"
</action>

<action>Search based on {{frontend_framework}} and {{backend_framework}}:
- "best hosting for Next.js 2024"
- "Vercel vs Netlify vs Railway"
- "cheapest hosting for [stack]"
</action>

<action>Present 5-7 hosting options with:
- FREE tier limits (bandwidth, builds, etc)
- Pricing tiers
- Deployment ease (Git push? CLI?)
- Performance (CDN, edge locations)
- Supported regions
- Database hosting (if applicable)
- Custom domain support
- SSL included
</action>

<ask>어디에 배포할까요?

**{{project_name}}의 경우:**
- 스택: {{frontend_framework}} + {{backend_framework}}
- 추천: [추천 플랫폼]

번호를 선택해주세요:</ask>

<action>Store as {{hosting_platform}}</action>
<action>Store details as {{deployment_hosting}}</action>

<template-output>hosting_selected</template-output>
</step>

<step n="10" goal="Define Analytics & Monitoring">
<action>Select analytics and monitoring tools</action>

<action>Search for analytics options:
- "privacy-friendly analytics 2024"
- "Google Analytics alternatives"
- "PostHog vs Mixpanel vs Amplitude"
</action>

<action>Present options:
- PostHog (open source)
- Plausible (privacy-focused)
- Google Analytics 4
- Mixpanel (product analytics)
- Vercel Analytics

Include:
- Privacy compliance
- Event tracking
- User funnels
- A/B testing
- Pricing
</action>

<action>For monitoring/error tracking:
- Sentry
- LogRocket
- Datadog
- Better Stack
</action>

<action>Store as {{analytics_monitoring}}</action>

<template-output>analytics_monitoring</template-output>
</step>

<step n="11" goal="Define Testing Strategy">
<action>Recommend testing tools based on stack</action>

<action>Based on {{frontend_framework}}:

Unit/Integration:
- Vitest (fast)
- Jest
- Testing Library

E2E:
- Playwright (recommended)
- Cypress

For {{backend_framework}}:
- Appropriate testing framework
- API testing tools
</action>

<action>Store as {{testing_strategy}}</action>

<template-output>testing</template-output>
</step>

<step n="12" goal="Define Development Tools">
<action>Recommend development tooling</action>

<action>Standard tools for {{frontend_framework}}:

Version Control:
- Git + GitHub/GitLab

Code Quality:
- ESLint
- Prettier
- TypeScript (if applicable)

CI/CD:
- GitHub Actions
- Vercel/Netlify auto-deploy

Environment Variables:
- .env files
- Platform-specific secrets

Development:
- VS Code
- Browser DevTools
- Database GUI (if applicable)
</action>

<action>Store as {{development_tools}}</action>

<template-output>dev_tools</template-output>
</step>

<step n="13" goal="Compile Complete Tech Stack">
<action>Create comprehensive technology specifications</action>

<action>For every selected technology, compile:

Technology: [Name]
Category: [Frontend/Backend/Database/etc]
Version: [Latest stable]
Links:
  - GitHub: [URL]
  - Docs: [URL]
  - npm: [URL] (if applicable)
Purpose: [Why selected]
Integration: [How it fits]
Cost: [FREE tier + paid]
Installation: [command]
Configuration: [Key settings]
</action>

<action>Store as {{detailed_tech_specs}}</action>

<action>Create master link repository:
Compile ALL links for:
- Every library/framework
- Every service
- Documentation
- Tutorials
- Community resources
</action>

<action>Store as {{all_resource_links}}</action>

<template-output>tech_stack_complete</template-output>
</step>

<step n="14" goal="Cost Estimation">
<action>Calculate projected costs</action>

<action>For each paid service, estimate:

Based on PRD {{success_metrics}}:

**Scenario 1: MVP (3 months)**
- Users: [estimate from PRD]
- Costs:
  - Hosting: $X/month
  - Database: $X/month
  - File Storage: $X/month
  - Email: $X/month
  - [Other services]: $X/month
- **Total: $X/month**

**Scenario 2: Growth (1 year)**
- Users: [estimate from PRD]
- Costs:
  - [각 서비스별 증가된 비용]
- **Total: $X/month**

**Scenario 3: Scale (future)**
- Users: [target from PRD]
- Costs:
  - [각 서비스별 스케일 비용]
- **Total: $X/month**

**FREE Tier 활용:**
- [which services have good free tier]
- 예상 무료 사용 기간: [estimate]
</action>

<action>Store as {{cost_estimation}}</action>

<template-output>cost_estimation</template-output>
</step>

<step n="15" goal="Platform-Specific Technologies" if="mobile or desktop">
<action if="{{platform}} includes mobile">
Define mobile-specific tech:
- Push notifications: FCM, APNs
- App Store deployment
- Mobile analytics
- Offline storage
- Device APIs (Camera, GPS, etc)
</action>

<action>Store as {{mobile_specific_tech}}</action>

<template-output>mobile_tech</template-output>
</step>

<step n="16" goal="Security Implementation">
<action>Define security measures based on PRD requirements</action>

<action>Based on PRD {{security_requirements}}:

Security stack:
- Authentication: {{authentication_solution}}
- HTTPS: Automatic (from hosting)
- Environment variables: Secure storage
- API security: Rate limiting, CORS
- Data encryption: At rest & in transit
- Input validation: [libraries]
- CSRF protection: [approach]
- XSS prevention: [approach]
- SQL injection: Parameterized queries (from {{database}})

If sensitive data (healthcare, finance):
- Additional compliance needs
- Audit logging
- Data anonymization
</action>

<action>Store as {{security_implementation}}</action>

<template-output>security</template-output>
</step>

<step n="17" goal="Generate Complete TRD Document">
<critical>⚠️ YOU MUST USE THE TEMPLATE - DO NOT write the document from scratch</critical>
<critical>The template contains YAML frontmatter which is REQUIRED for document parsing</critical>

<action>Load template from {template}</action>

<action>Fill ALL template variables with collected data from previous steps</action>

<critical>Verify YAML frontmatter is present at the top of the document</critical>
<critical>The document MUST start with "---" followed by YAML metadata</critical>

<action>Ensure document includes:
- Complete tech stack with versions
- Every service with pricing
- All GitHub/npm/doc links
- Installation commands
- Configuration examples
- Cost projections
- Security measures
</action>

<action>Cross-check with previous documents:
- All PRD features have implementation
- All UX flows have technical support
- All UI components have integration plan
- Platform requirements met
</action>

<action>Generate technology summary table:

| Category | Technology | Version | Cost | Link |
|----------|-----------|---------|------|------|
| Frontend | {{frontend_framework}} | [ver] | Free | [link] |
| Backend | {{backend_framework}} | [ver] | [cost] | [link] |
| Database | {{database}} | [ver] | [cost] | [link] |
| ... | ... | ... | ... | ... |
</action>

<action>Create output folder if needed</action>
<action>Save document to {default_output_file}</action>

<action>Show comprehensive summary to user:
"
🎉 TRD (기술 요구사항 문서) 작성이 완료되었습니다!

📄 **저장 위치**: {default_output_file}

⚙️ **선정된 기술 스택:**

**Frontend:**
- Framework: {{frontend_framework}}
- UI Library: {{ui_library}} (UI Design Guide에서)
- State Management: {{state_management_solution}}

**Backend:**
- Framework: {{backend_framework}}
- Database: {{database}}
- Authentication: {{authentication_solution}}

**Infrastructure:**
- Hosting: {{hosting_platform}}
- File Storage: {{file_storage_solution}}
- Email: {{email_notification_solution}}

**기능별 구현:**
{{feature_implementations_list}}

💰 **예상 비용:**
- MVP (초기): $X/month
- Growth (1년): $Y/month

📚 **모든 설치 명령어, 문서 링크, 설정 방법이 포함되어 있어요!**

개발자에게 이 문서를 전달하면:
✅ 어떤 기술을 쓸지 명확함
✅ 어떻게 설치하는지 명시됨
✅ 어떻게 통합하는지 가이드됨
✅ 비용이 얼마나 드는지 예측 가능

이제 자동으로 **Architecture 워크플로우**가 시작됩니다!"
</action>

<action>Store tech summary for next workflow:
Create concise list of all selected technologies with their purpose
This will be used by Architecture workflow
</action>

<action>Notify user:
"TRD 작성이 완료되었습니다!

다음 단계는 **Architecture 워크플로우**입니다.
준비가 되면 기획문서 패널에서 'Architecture 작성하기' 버튼을 눌러주세요!"
</action>

<template-output>trd_complete</template-output>
</step>

</workflow>
