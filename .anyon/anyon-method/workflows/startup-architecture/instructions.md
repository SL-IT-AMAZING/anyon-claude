# Architecture Workflow Instructions

<critical>You MUST have already loaded: {project-root}/.anyon/anyon-method/workflows/startup-architecture/workflow.yaml</critical>
<critical>Communicate in {communication_language}</critical>
<critical>기술 스택은 TRD에서 이미 정함. 여기서는 시스템 구조만.</critical>
<critical>API 상세 설계는 개발 단계에서 함. 여기서는 개요만.</critical>

<workflow>

<step n="0" goal="Load Documents">
<action>Load PRD from {input_prd}</action>
<action>Load UX Design from {input_ux}</action>
<action>Load TRD from {input_trd}</action>
<action>Extract: project_name, service_type, platform, core_features, tech_stack</action>
<action>Extract opensource info: opensource.decision, opensource.base_project, opensource.base_repo, opensource.base_template, opensource.feature_map</action>

<action>Check opensource.decision:
If "완성형 활용":
  → Set {{has_base_opensource}} = true, {{opensource_mode}} = "complete"
If "조합해서 개발":
  → Set {{has_base_opensource}} = true, {{opensource_mode}} = "combine"
If "템플릿으로 시작":
  → Set {{has_base_opensource}} = true, {{opensource_mode}} = "template"
Else:
  → Set {{has_base_opensource}} = false
</action>

<action>Welcome:

**If {{opensource_mode}} == "complete":**
"안녕하세요! {{project_name}}의 시스템 아키텍처를 설계할게요.

**기반 오픈소스:** {{opensource.base_project}}

기반 오픈소스의 기존 아키텍처를 분석하고,
{{project_name}}에 맞게 확장/수정할 부분을 정리할 거예요."

**If {{opensource_mode}} == "combine":**
"안녕하세요! {{project_name}}의 시스템 아키텍처를 설계할게요.

**기능별 라이브러리 조합:**
{{opensource.feature_map}}

여러 라이브러리를 통합하는 아키텍처를 설계할게요.
각 라이브러리가 어떻게 연결되는지 정리할 거예요."

**If {{opensource_mode}} == "template":**
"안녕하세요! {{project_name}}의 시스템 아키텍처를 설계할게요.

**기반 템플릿:** {{opensource.base_template}}
**기능별 라이브러리:**
{{opensource.feature_map}}

템플릿의 기본 구조에 기능별 라이브러리를 통합할게요."

**Else:**
"안녕하세요! {{project_name}}의 시스템 아키텍처를 설계할게요.

**여기서 다루는 것:**
- 아키텍처 패턴 (시스템 구조 방식)
- 시스템 컴포넌트 (구성 요소)
- 데이터 흐름 (정보 이동 경로)
- 배포 구조 (어떻게 서비스에 올릴지)
- 확장성 (사용자 증가 대응)
- 보안 (데이터 보호)
- 모니터링 (서비스 상태 감시)

**여기서 안 다루는 것:**
- 기술 스택 선정 → TRD에서 이미 결정
- API 상세 설계 → 개발 단계에서
- DB 스키마 상세 → ERD에서"
</action>
</step>

<step n="1" goal="Analyze Base Open Source Architecture" if="{{has_base_opensource}} == true">

**Case 1: {{opensource_mode}} == "complete"**
<action>Fetch and analyze base open source project architecture:

WebFetch: {{opensource.base_repo}} - README, docs/architecture, docker-compose
WebSearch: "{{opensource.base_project}} architecture", "{{opensource.base_project}} deployment"
</action>

<action>Present base project architecture:
"{{opensource.base_project}}의 기존 아키텍처를 분석했어요!

**아키텍처 패턴:** [분석 결과]

**시스템 구성:**
```
[기존 아키텍처 다이어그램]
```

**데이터 흐름:** [분석 결과]

**배포 방식:** [Docker/K8s/Serverless 등]
"
</action>

<ask>기존 아키텍처를 어떻게 할까요?

1. **그대로 사용** - 기존 아키텍처 유지 (추천)
2. **일부 수정** - 배포 환경 등 일부 변경
3. **새로 설계** - 완전히 새로운 아키텍처

번호로 선택:</ask>

<action>
If 1: Auto-fill architecture from base project, skip to step 5 (Scalability)
If 2: Ask which parts to change
If 3: Proceed with normal flow (step 1~4)
</action>

**Case 2: {{opensource_mode}} == "combine"**
<action>Analyze each library's architecture requirements:

For each library in {{opensource.feature_map}}:
- WebFetch: [library docs] - architecture, integration guide
- Check: how it integrates, required infrastructure
</action>

<action>Present integration architecture:
"기능별 라이브러리 통합 아키텍처를 설계했어요!

**라이브러리 통합 구조:**
```
┌─────────────────────────────────────────────────────────────┐
│                     {{project_name}}                         │
├─────────────────────────────────────────────────────────────┤
│  Frontend ({{frontend_framework}})                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ {{기능1}}    │  │ {{기능2}}    │  │ {{기능3}}    │         │
│  │ ({{lib1}})  │  │ ({{lib2}})  │  │ ({{lib3}})  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  Backend ({{backend_framework}})                            │
│  - {{lib1}} integration: [연동 방식]                        │
│  - {{lib2}} integration: [연동 방식]                        │
├─────────────────────────────────────────────────────────────┤
│  Database ({{database}})                                    │
└─────────────────────────────────────────────────────────────┘
```

**통합 시 고려사항:**
- {{lib1}}: [초기화/설정 방법]
- {{lib2}}: [데이터 연동 방법]
- {{lib3}}: [API 연동 방법]
"
</action>

<ask>이 통합 구조로 진행할까요?

1. **네, 이대로** - 위 구조로 진행 (추천)
2. **수정 필요** - 일부 통합 방식 변경
3. **새로 설계** - 처음부터 설계

번호로 선택:</ask>

**Case 3: {{opensource_mode}} == "template"**
<action>Fetch template architecture and plan library integration:

WebFetch: {{opensource.base_template}} repo - architecture docs
For each library in {{opensource.feature_map}}: check integration points
</action>

<action>Present template + libraries architecture:
"템플릿 기반 + 라이브러리 통합 아키텍처예요!

**템플릿 기본 구조:** {{opensource.base_template}}
```
[템플릿 아키텍처 다이어그램]
```

**라이브러리 통합 위치:**
| 기능 | 라이브러리 | 통합 위치 | 방법 |
|------|-----------|----------|------|
| {{기능1}} | {{lib1}} | [위치] | [방법] |
| {{기능2}} | {{lib2}} | [위치] | [방법] |

**수정 필요 부분:** [템플릿에서 수정할 부분]
"
</action>

<ask>템플릿 + 라이브러리 통합 구조로 진행할까요?

1. **네, 이대로** - 위 구조로 진행
2. **수정 필요** - 일부 변경
3. **새로 설계** - 처음부터 설계

번호로 선택:</ask>
</step>

<step n="2" goal="Architecture Pattern">
<action>Based on TRD tech stack, analyze and recommend pattern</action>

<ask>아키텍처 패턴 확인:

TRD에서 선택한 스택:
- Frontend: {{frontend_framework}}
- Backend: {{backend_framework}}
- Database: {{database}}
- Hosting: {{hosting_platform}}

**추천 패턴:**

1. **모놀리식 (Monolithic)**
   - 하나의 코드베이스에 모든 기능
   - 장점: 단순함, 빠른 개발, 디버깅 쉬움
   - 단점: 확장성 제한, 배포 전체 필요
   - 적합: MVP, 소규모 팀, 단순한 서비스

2. **JAMstack / BFF 패턴**
   - Frontend + API Backend 분리
   - 장점: 프론트/백 독립 배포, CDN 활용
   - 단점: 복잡도 증가
   - 적합: Next.js + 별도 API, 콘텐츠 중심

3. **서버리스 (Serverless)**
   - 함수 단위로 실행, 사용한 만큼 과금
   - 장점: 자동 확장, 비용 효율
   - 단점: 콜드 스타트, 복잡한 로직 제한
   - 적합: Supabase/Firebase 사용 시, 이벤트 기반

**{{project_name}}에 추천**: [TRD 기반 분석]

번호 선택:</ask>

<action>Store as {{architecture_pattern}}</action>
</step>

<step n="3" goal="System Components">
<action>Define main components based on TRD selections</action>

<action>Generate component diagram:
```
┌─────────────────────────────────────────────────────────────┐
│                        사용자                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  {{frontend}}   │  │  {{ui_library}} │                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend Layer                            │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  {{backend}}    │  │  {{auth}}       │                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                               │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  {{database}}   │  │  {{storage}}    │                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```
</action>

<action>For each component, explain:
- 역할 (무엇을 하는지)
- 기술 (TRD에서 선택한 것)
- 다른 컴포넌트와의 연결
</action>
</step>

<step n="4" goal="Data Flow">
<action>Based on UX user flows, define data flow patterns</action>

<action>For each major user flow from UX:

**예시: 회원가입 플로우**
```
1. 사용자 → Frontend: 가입 폼 작성
2. Frontend → Backend: POST /api/auth/signup
3. Backend → Database: INSERT user
4. Backend → Email Service: 인증 이메일 발송
5. Backend → Frontend: 성공 응답
6. Frontend → 사용자: 성공 화면
```

**예시: 데이터 조회 플로우**
```
1. 사용자 → Frontend: 페이지 요청
2. Frontend → Backend: GET /api/data
3. Backend → Database: SELECT query
4. Database → Backend: 데이터 반환
5. Backend → Frontend: JSON 응답
6. Frontend → 사용자: 화면 렌더링
```
</action>

<action>Create data flow for:
- 인증 (로그인/로그아웃)
- 핵심 기능 1 (PRD에서)
- 핵심 기능 2 (PRD에서)
- 파일 업로드 (해당 시)
</action>
</step>

<step n="5" goal="Deployment Structure">
<action>Based on TRD hosting, define deployment structure</action>

<action>Generate deployment diagram:
```
┌─────────────────────────────────────────────────────────────┐
│                     Production                               │
│                                                              │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │   Vercel    │     │  Supabase   │     │     CDN     │   │
│  │  Frontend   │────▶│   Backend   │     │   Assets    │   │
│  │  + API      │     │   + DB      │     │             │   │
│  └─────────────┘     └─────────────┘     └─────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```
</action>

<action>Define environments:

**Development (로컬)**
- Frontend: localhost:3000
- Backend: localhost:3000/api (또는 로컬 Supabase)
- Database: 로컬 또는 개발용 Supabase

**Staging (선택적)**
- Preview 배포 (Vercel Preview)
- 테스트용 DB

**Production**
- 실제 서비스 URL
- 프로덕션 DB
- 모니터링 활성화
</action>

<action>Define CI/CD:
```
GitHub Push → Vercel Build → Deploy
                  │
                  ├── Lint/Type Check
                  ├── Unit Tests
                  └── Preview Deploy (PR) / Production Deploy (main)
```
</action>
</step>

<step n="6" goal="Scalability">
<ask>확장성 계획:

예상 사용자 규모는?

1. **소규모 (100명 이하)**
   - 기본 설정으로 충분
   - 단일 인스턴스
   - 비용: 무료 tier

2. **중규모 (1,000명)**
   - CDN 활용
   - DB 인덱스 최적화
   - 캐싱 고려
   - 비용: $20-50/월

3. **대규모 (10,000명+)**
   - 로드밸런싱
   - DB 읽기 복제본
   - Redis 캐시
   - 비용: $100+/월

번호 선택:</ask>

<action>Store as {{scale_plan}}</action>

<action>Generate scaling strategy:

**Phase 1 (MVP):**
- 단일 인스턴스
- 무료 tier 활용
- 기본 인덱스

**Phase 2 (Growth):**
- CDN으로 정적 자산 배포
- DB 쿼리 최적화
- 이미지 최적화 (Cloudinary 등)

**Phase 3 (Scale):**
- 서버리스 함수 확장
- DB 연결 풀링
- 백그라운드 작업 큐
</action>
</step>

<step n="7" goal="Security">
<action>Define security measures:

**인증/인가:**
- 인증 서비스: {{auth_service}} (TRD에서)
- JWT/Session 관리
- Role-based access (필요 시)

**네트워크 보안:**
- HTTPS 필수 (자동 - 호스팅)
- CORS 설정
- Rate limiting

**데이터 보안:**
- 비밀번호 해싱 (bcrypt/argon2)
- 환경변수로 민감 정보 관리
- SQL Injection 방지 (ORM/파라미터화)
- XSS 방지 (React 기본 제공)

**인프라 보안:**
- 환경변수 암호화
- 최소 권한 원칙
- 정기적 의존성 업데이트
</action>
</step>

<step n="8" goal="Monitoring">
<action>Define monitoring strategy:

**에러 모니터링:**
- Sentry (무료 tier: 5K 이벤트/월)
- 또는 Vercel 기본 에러 로그

**성능 모니터링:**
- Vercel Analytics (무료 tier 있음)
- 또는 Web Vitals 직접 수집

**로깅:**
- 개발: console.log
- 프로덕션: 구조화된 로그 (Vercel Logs)

**알림:**
- 에러 발생 시 Slack/Email 알림 (Sentry)
- 다운타임 알림 (Better Stack 무료)

**권장 설정:**
```
MVP: Vercel 기본 로그 + Sentry 무료
Growth: + Vercel Analytics + Better Stack
Scale: + DataDog/New Relic (유료)
```
</action>
</step>

<step n="9" goal="Generate Architecture">
<action>Load template from {template}</action>
<action>Fill template with collected variables</action>
<action>Save to {default_output_file}</action>

<action>Show summary:
"
Architecture 완료!

**저장 위치**: {default_output_file}

**요약:**
- 패턴: {{architecture_pattern}}
- 컴포넌트: Frontend + Backend + Database + [추가 서비스]
- 배포: {{hosting_platform}} (자동 CI/CD)
- 확장성: {{scale_plan}}
- 보안: HTTPS, 인증, 데이터 암호화
- 모니터링: Sentry + Vercel 기본

**다음**: ERD 워크플로우
"
</action>
</step>

</workflow>
