/**
 * Startup Architecture Workflow - 합본 프롬프트
 * workflow.yaml + instructions.md + template.md + checklist.md 통합
 */

import { WORKFLOW_ENGINE } from '../engine';

const WORKFLOW_CONFIG = `
# Startup Architecture Workflow Configuration
name: startup-architecture
description: "시스템 아키텍처. 구조, 데이터 흐름, 확장성, 보안. 기술스택/API는 제외."
author: "Anyon"

# Output configuration
output_folder: "{project-root}/anyon-docs/planning"
default_output_file: "{output_folder}/architecture.md"

# Inputs
input_prd: "{output_folder}/prd.md"
input_ux: "{output_folder}/ui-ux.html"
input_trd: "{output_folder}/trd.md"

# Communication settings
communication_language: "Korean"
document_output_language: "Korean"

standalone: true
`;

const INSTRUCTIONS = `
# Architecture Workflow Instructions

<critical>Communicate in Korean</critical>
<critical>Target audience: NON-TECHNICAL FOUNDERS - 기술 용어 최소화, 쉬운 설명</critical>
<critical>
이 프롬프트 자체가 Architecture 워크플로우입니다.
절대로 Skill 도구를 사용하지 마세요.
지금 바로 Step 0부터 실행하세요.
</critical>
<critical>기술 스택은 TRD에서 이미 정함. 여기서는 시스템 구조만.</critical>
<critical>API 상세 설계는 개발 단계에서 함. 여기서는 개요만.</critical>

## 핵심 원칙

1. **AI가 아키텍처 100% 자동 설계** - 사용자에게 기술적 질문 금지
2. **TRD 기반 자동 결정** - TRD에서 선택한 기술 스택 그대로 사용
3. **전문 용어 금지** - 결과 설명 시 쉬운 비유로 (예: "서버는 식당 주방")
4. **결과만 보여주기** - 설계 후 간단히 확인만

<workflow>

<step n="0" goal="문서 로드 및 자동 분석">
<action>PRD 문서 로드 from {input_prd}</action>
<action>UX Design 문서 로드 from {input_ux}</action>
<action>TRD 문서 로드 from {input_trd}</action>
<action>추출: project_name, service_type, platform, core_features, tech_stack, scale_tier</action>
<action>오픈소스 정보 추출: opensource.decision, opensource.base_project, opensource.base_repo, opensource.base_template, opensource.feature_map</action>

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
"{{project_name}}의 시스템 구조를 설계할게요!

유사한 서비스들의 아키텍처를 먼저 조사하고,
TRD에서 선택한 기술들을 바탕으로 최적의 구조를 설계해드릴게요.

잠시만 기다려주세요..."
</action>
</step>

<step n="1" goal="유사 서비스 아키텍처 연구">
<action>WebSearch로 유사 서비스 아키텍처 조사:

검색 쿼리:
- "{{service_type}} architecture 2025"
- "{{service_type}} tech stack case study"
- "how to build {{service_type}} backend"
- "{{service_type}} startup architecture blog"

수집 정보:
- 4-8개 유사 서비스의 실제 아키텍처
- 각 서비스의 규모 (사용자 수, 트래픽)
- 사용한 기술 스택
- 아키텍처 패턴 (모놀리식/마이크로서비스/서버리스)
- 실제 링크 (블로그 포스트, 케이스 스터디)
</action>

<action>WebSearch 결과 요약 (내부 저장, 사용자에게는 간단히):
"
참고할 만한 서비스들의 아키텍처를 조사했어요:

| 서비스 | 규모 | 아키텍처 | 주요 기술 |
|--------|------|----------|-----------|
| [결과1] | [규모] | [패턴] | [스택] |
| [결과2] | [규모] | [패턴] | [스택] |
...

**참고 자료:**
- [링크1: 제목]
- [링크2: 제목]
"
</action>

<action>{{reference_architectures}}에 저장</action>
</step>

<step n="2" goal="클론된 오픈소스 폴더 구조 분석" if="{{has_base_opensource}} == true">

<action>클론된 오픈소스 폴더 구조 분석 (로컬):
Bash로 opensource/ 폴더 확인: ls -la opensource/ 2>/dev/null || echo "없음"

오픈소스가 클론되어 있으면:
1. 폴더 구조 분석:
   Bash: tree -L 2 opensource/[프로젝트명] 또는 ls -la로 구조 파악

2. 주요 설정 파일 분석:
   - Read: opensource/[프로젝트명]/README.md
   - Read: opensource/[프로젝트명]/docs/architecture.md (있으면)
   - Read: opensource/[프로젝트명]/package.json
   - Read: opensource/[프로젝트명]/docker-compose.yml (있으면)

3. 아키텍처 패턴 파악:
   - 폴더 구조로 패턴 추론 (모놀리식/마이크로서비스)
   - src/ 하위 구조 분석 (pages, components, services, lib 등)
</action>

<action>If {{opensource_mode}} == "complete":
로컬 클론된 코드 분석 우선, 없으면 WebFetch:
→ 기존 아키텍처 자동 분석 후 {{base_architecture}}에 저장

Present:
"클론된 {{opensource.base_project}}의 아키텍처를 분석했어요!

**폴더 구조:**
\`\`\`
opensource/{{프로젝트명}}/
├── src/          - 메인 소스코드
│   ├── pages/    - 화면 컴포넌트
│   ├── components/ - UI 컴포넌트
│   └── lib/      - 유틸리티
├── server/       - 백엔드 (있으면)
└── prisma/       - DB 스키마 (있으면)
\`\`\`

**아키텍처 패턴:** [분석 결과]
**데이터 흐름:** [분석 결과]

이 구조를 기반으로 {{project_name}}에 맞게 확장할게요."
</action>

<action>If {{opensource_mode}} == "combine":
클론된 각 라이브러리 프로젝트 분석:
For each library in {{opensource.feature_map}}:
- Read: opensource/[library]/README.md
- Read: opensource/[library]/package.json
- 폴더 구조 확인
→ 통합 아키텍처 자동 설계

Present:
"기능별 라이브러리 통합 구조를 설계했어요!

| 기능 | 라이브러리 | 통합 위치 | 참고 코드 |
|------|-----------|----------|----------|
| {{기능1}} | {{lib1}} | [위치] | opensource/{{lib1}}/ |
| {{기능2}} | {{lib2}} | [위치] | opensource/{{lib2}}/ |

이 라이브러리들을 조합해서 최적의 구조를 만들게요."
</action>

<action>If {{opensource_mode}} == "template":
WebFetch: {{opensource.base_template}} repo - architecture docs
For each library in {{opensource.feature_map}}: check integration points
→ 템플릿 기반 + 라이브러리 통합 구조 자동 설계

Present:
"템플릿 기반 + 라이브러리 통합 구조예요!

**기반 템플릿:** {{opensource.base_template}}
**추가 라이브러리:** [목록]

템플릿의 기본 구조에 기능별 라이브러리를 통합할게요."
</action>

<!-- AI가 자동으로 최적 방식 선택 - 사용자 질문 없음 -->
<action>AI가 자동으로 판단:
- complete 모드: 기존 아키텍처 최대 활용
- combine 모드: 라이브러리 통합 최적화
- template 모드: 템플릿 확장
</action>
</step>

<step n="3" goal="AI 자동 아키텍처 설계">
<action>TRD의 tech_stack, scale_tier, 그리고 {{reference_architectures}} 기반으로 AI가 자동 결정:

1. **아키텍처 패턴 자동 선택:**
   - BaaS 사용 (Supabase/Firebase) → 서버리스 패턴
   - 커스텀 서버 → 모놀리식 또는 JAMstack
   - scale_tier 기반 복잡도 결정
   - {{reference_architectures}}의 유사 서비스 패턴 참고

2. **시스템 컴포넌트 자동 구성:**
   - TRD의 frontend, backend, database, hosting 그대로 사용
   - 추가 서비스 (인증, 스토리지, 결제) 자동 포함

3. **데이터 흐름 자동 설계:**
   - UX Design의 user flows 기반으로 자동 생성
   - PRD의 핵심 기능별 플로우 생성

4. **확장성/보안/모니터링 자동 설정:**
   - scale_tier 기반으로 적정 수준 자동 결정
</action>
</step>

<step n="4" goal="결과 보여주기">
<action>설계 결과를 쉬운 말로 설명:

"
{{project_name}}의 시스템 구조를 설계했어요!

---

## 🏗️ 전체 구조 (비유: 식당)

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│  👤 손님 (사용자)                                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  🖥️ 매장 (화면)                                              │
│  → {{frontend_framework}} + {{ui_library}}                   │
│  → 손님이 보는 메뉴판, 주문 화면                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  👨‍🍳 주방 (서버)                                              │
│  → {{backend_framework}}                                     │
│  → 주문 받아서 요리하는 곳                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  🗄️ 창고 (데이터베이스)                                       │
│  → {{database}}                                              │
│  → 재료(데이터) 보관하는 곳                                   │
└─────────────────────────────────────────────────────────────┘
\`\`\`

---

## 📍 어디에 올라가나요? (배포)

**{{hosting_platform}}**에 올려요.
→ 코드 올리면 자동으로 서비스가 시작돼요.

---

## 🔒 보안

- 로그인: {{auth_service}}로 안전하게
- 데이터: 암호화되어 저장
- 통신: HTTPS (자물쇠 표시)

---

## 📈 사용자 늘어나면?

TRD에서 선택한 **{{scale_tier}}** 기준으로:
{{scale_strategy}}

---

Architecture 문서를 저장할게요!
"
</action>
</step>

<step n="5" goal="문서 저장">
<action>Architecture 문서를 {default_output_file}에 저장</action>

<action>완료 메시지:
"
시스템 구조 설계가 끝났어요!

**저장 위치:** {default_output_file}

**다음**: ERD (데이터베이스 설계)
"
</action>
</step>

</workflow>
`;

const TEMPLATE = `
# {{project_name}} - System Architecture

## 아키텍처 패턴

**패턴**: {{architecture_pattern}}

**선택 이유**: {{pattern_reason}}

---

## 시스템 구성도

\`\`\`
{{system_diagram}}
\`\`\`

### 컴포넌트 설명

{{component_descriptions}}

---

## 데이터 흐름

### 인증 플로우
{{auth_flow}}

### 핵심 기능 플로우
{{main_feature_flow}}

---

## 배포 구조

### 환경 구성
| 환경 | URL | 용도 |
|-----|-----|------|
| Development | localhost:3000 | 로컬 개발 |
| Staging | preview.xxx.vercel.app | PR 테스트 |
| Production | xxx.com | 실서비스 |

### CI/CD 파이프라인
\`\`\`
{{cicd_diagram}}
\`\`\`

---

## 확장성 전략

**현재 규모**: {{scale_plan}}

### Phase 1 (MVP)
{{phase1_strategy}}

### Phase 2 (Growth)
{{phase2_strategy}}

### Phase 3 (Scale)
{{phase3_strategy}}

---

## 보안

### 인증/인가
{{auth_security}}

### 데이터 보안
{{data_security}}

### 인프라 보안
{{infra_security}}

---

## 모니터링

| 항목 | 도구 | 비용 |
|-----|-----|------|
| 에러 | {{error_monitoring}} | {{error_cost}} |
| 성능 | {{perf_monitoring}} | {{perf_cost}} |
| 로그 | {{logging}} | {{log_cost}} |
| 알림 | {{alerting}} | {{alert_cost}} |
`;

const CHECKLIST = `
# Architecture Validation Checklist

## 문서 구조

- [ ] YAML frontmatter가 완전함
- [ ] architecture_pattern이 명시됨
- [ ] tech_stack 정보가 포함됨
- [ ] key_components_list가 메타데이터에 있음
- [ ] data_flow_paths_list가 메타데이터에 있음
- [ ] 모든 섹션이 존재하고 placeholder가 없음

## 이전 문서 일관성

- [ ] PRD의 service_type, platform, core_features가 반영됨
- [ ] UX Design의 모든 user flows가 data flows에 매핑됨
- [ ] UI Design Guide의 선택된 라이브러리가 아키텍처에 통합됨
- [ ] TRD의 **모든** 선택된 기술이 정확히 사용됨
- [ ] TRD의 기술과 **다른** 기술을 제안하지 않음

## Web Search 실행 확인 (매우 중요!)

### Similar Services Architecture
- [ ] **Web Search 수행됨**
- [ ] **4-8개 유사 서비스의 아키텍처 검색됨**
- [ ] 각 서비스의 아키텍처 패턴 분석됨
- [ ] 실제 링크 (블로그 포스트, 케이스 스터디) 포함
- [ ] 우리 프로젝트에 적용 가능한 점 명시
- [ ] 각 서비스의 규모 정보 포함

### Architecture Patterns Research
- [ ] 선택된 아키텍처 패턴의 장단점 검색됨
- [ ] 실제 사용 사례 포함
- [ ] 최신 정보 (2025년 기준)

## 아키텍처 패턴

- [ ] 명확한 아키텍처 패턴 선택됨 (Monolithic/Microservices/Serverless/etc)
- [ ] 선택 이유가 PRD success_metrics 기반으로 설명됨
- [ ] 선택 이유가 팀 규모 기반으로 설명됨
- [ ] 선택 이유가 비용 기반으로 설명됨
- [ ] 비개발자를 위한 쉬운 설명 포함 (비유/스토리텔링)

## 시스템 컴포넌트 정의

### Frontend Layer
- [ ] Frontend 컴포넌트들이 명확히 정의됨
- [ ] 각 컴포넌트의 책임(responsibilities)이 명시됨
- [ ] TRD의 frontend_framework 사용됨
- [ ] TRD의 UI 라이브러리 통합 설명됨
- [ ] 비개발자 설명 포함

### Backend Layer
- [ ] Backend 컴포넌트들이 명확히 정의됨
- [ ] API Server 역할 명시
- [ ] Authentication Service 명시 (TRD 기반)
- [ ] Background Jobs (필요시) 명시
- [ ] 각 컴포넌트의 책임 명시
- [ ] TRD의 backend_framework 사용됨
- [ ] 비개발자 설명 포함

### Database Layer
- [ ] Database 컴포넌트 정의됨
- [ ] TRD의 database 선택 사용됨
- [ ] Cache layer (필요시) 정의됨
- [ ] File storage 정의됨 (TRD 기반)
- [ ] 비개발자 설명 포함

### Infrastructure Layer
- [ ] Hosting platform 명시 (TRD 기반)
- [ ] CDN 전략 명시 (필요시)
- [ ] Monitoring 도구 명시 (TRD 기반)
- [ ] CI/CD 도구 명시
- [ ] 비개발자 설명 포함

## 데이터 흐름

### 비개발자 설명
- [ ] 전체 데이터 흐름을 쉬운 언어로 설명
- [ ] 스토리텔링 또는 비유 사용
- [ ] 그림/다이어그램 포함 (Mermaid 또는 ASCII)

### 주요 User Flow 매핑
- [ ] **UX Design의 모든 주요 user flows가 technical data flows로 변환됨**
- [ ] User authentication flow (signup, login, logout)
- [ ] PRD의 모든 핵심 기능 flows
- [ ] File upload flow (필요시)
- [ ] Payment flow (필요시)
- [ ] Real-time flow (필요시)

### 각 Data Flow마다
- [ ] Frontend 단계 명시
- [ ] Backend 단계 명시
- [ ] Database 상호작용 명시
- [ ] Third-party services 상호작용 명시 (필요시)
- [ ] 관련 컴포넌트 명시
- [ ] 비개발자 스토리텔링 설명 포함

## 인증 및 권한 관리

- [ ] Authentication flow 상세 정의됨
- [ ] TRD의 auth 솔루션 정확히 사용됨
- [ ] Registration flow 정의
- [ ] Login flow 정의
- [ ] Token/Session 관리 정의
- [ ] Password reset flow 정의
- [ ] Social login flow (필요시) 정의
- [ ] Authorization (권한) 체크 방식 정의
- [ ] 비개발자 비유 설명 포함

## 기능별 아키텍처 (가장 중요!)

### PRD 기능 커버리지
- [ ] **PRD의 모든 핵심 기능이 아키텍처로 설명됨**
- [ ] 각 기능마다 사용되는 컴포넌트 명시
- [ ] 각 기능마다 API endpoints 명시
- [ ] 각 기능마다 database tables 프리뷰 제공
- [ ] 각 기능마다 third-party services 명시 (필요시)
- [ ] 각 기능마다 implementation pattern 설명
- [ ] 각 기능마다 비개발자 스토리텔링 설명

### 특수 기능 아키텍처
- [ ] Authentication 상세 아키텍처 (필요시)
- [ ] File upload/storage 아키텍처 (필요시)
- [ ] Email/notification 아키텍처 (필요시)
- [ ] Payment 처리 아키텍처 (필요시)
- [ ] Real-time 기능 아키텍처 (필요시)
- [ ] Search 기능 아키텍처 (필요시)

## API 아키텍처

- [ ] API 타입 명시 (REST/GraphQL/tRPC - from TRD)
- [ ] Base URL 정의
- [ ] Authentication 방식 명시 (헤더 형식)
- [ ] API versioning 전략 정의
- [ ] 모든 주요 endpoints 카테고리별 정리
  - [ ] Auth endpoints
  - [ ] User endpoints
  - [ ] Feature endpoints (PRD 기능별)
- [ ] Error handling 표준 정의
- [ ] Request/Response 형식 정의
- [ ] Rate limiting 전략 명시
- [ ] CORS policy 명시
- [ ] 비개발자 설명 포함

## 데이터베이스 아키텍처

- [ ] TRD의 database 시스템 사용됨
- [ ] Database hosting 명시 (TRD 기반)
- [ ] Connection strategy 정의 (pooling)
- [ ] Schema approach 명시 (TRD 기반)
- [ ] Migration tool 명시 (TRD 기반)
- [ ] 주요 테이블/컬렉션 프리뷰 제공
  - [ ] users 테이블
  - [ ] 각 PRD 기능별 테이블
- [ ] 테이블 간 관계 프리뷰
- [ ] Indexing 전략 정의
- [ ] Caching 전략 정의 (필요시)
- [ ] 비개발자 비유 설명 포함

## 배포 아키텍처

### 비개발자 설명
- [ ] 배포 과정을 쉬운 언어로 설명
- [ ] 개발/스테이징/프로덕션 환경 설명
- [ ] 스토리텔링 포함

### 배포 구조
- [ ] TRD의 hosting platform 사용됨
- [ ] Frontend 배포 방식 정의
- [ ] Backend 배포 방식 정의
- [ ] Database 배포 정의
- [ ] File storage 설정 정의
- [ ] Environment 구분 (dev/staging/prod)
- [ ] Environment variables 관리 방법
- [ ] Domain 및 SSL 설정 언급

### CI/CD Pipeline
- [ ] CI/CD 도구 선택됨
- [ ] Trigger 조건 정의 (git push 등)
- [ ] Pipeline 단계 정의:
  - [ ] Test 실행
  - [ ] Build
  - [ ] Deploy
  - [ ] Migration 실행
  - [ ] Smoke tests
- [ ] 알림 방법 정의

## 확장성 아키텍처

### 비개발자 설명
- [ ] 확장성을 쉬운 언어로 설명
- [ ] 3단계 비유 (작은 식당 → 중형 → 대형) 사용
- [ ] 각 단계의 비용 명시 (TRD 기반)

### 확장성 전략
- [ ] **Phase 1 (MVP)** 정의:
  - [ ] 사용자 수 목표 (PRD success_metrics 기반)
  - [ ] 아키텍처 구성
  - [ ] 예상 비용 (TRD 기반)
- [ ] **Phase 2 (Growth)** 정의:
  - [ ] 사용자 수 목표
  - [ ] Scaling 전략 (horizontal/vertical)
  - [ ] 추가 컴포넌트 (read replicas, CDN, etc.)
  - [ ] 예상 비용 (TRD 기반)
- [ ] **Phase 3 (Scale)** 정의:
  - [ ] 사용자 수 목표
  - [ ] Advanced scaling (load balancer, sharding, etc.)
  - [ ] 예상 비용 (TRD 기반)
- [ ] Auto-scaling 규칙 정의 (CPU, memory, request rate)

## 보안 아키텍처

- [ ] Network security (HTTPS, CORS, Rate limiting)
- [ ] Authentication security (password hashing, token security)
- [ ] Authorization security (RBAC, permission checks)
- [ ] Data security (encryption at rest, in transit)
- [ ] API security (input validation, SQL injection prevention, XSS, CSRF)
- [ ] File upload security (필요시)
- [ ] Environment security (secrets management)
- [ ] Security monitoring 및 logging
- [ ] 비개발자 비유 설명 (공항 보안 등)

## 모니터링 및 로깅

### Monitoring
- [ ] TRD의 monitoring 도구 사용됨
- [ ] Application monitoring 정의
- [ ] Infrastructure monitoring 정의
- [ ] User analytics 정의
- [ ] Alert 조건 정의 (critical, warning)

### Logging
- [ ] 로깅 대상 정의 (API requests, errors, auth events, etc.)
- [ ] Log levels 정의 (ERROR, WARN, INFO, DEBUG)
- [ ] Log storage 방법 정의
- [ ] Log retention 기간 정의

### 비개발자 설명
- [ ] 모니터링을 쉽게 설명 (CCTV, 온도계 비유)

## 성능 최적화

### Frontend Performance
- [ ] Code splitting 전략
- [ ] Asset optimization (images, minification)
- [ ] Caching 전략
- [ ] CDN 사용 (필요시)

### Backend Performance
- [ ] Database optimization (indexes, connection pooling)
- [ ] Caching (Redis 등, TRD 기반)
- [ ] API optimization (compression, pagination)
- [ ] Background jobs (필요시)

### Performance Targets
- [ ] Page load time 목표 명시
- [ ] API response time 목표 명시

### 비개발자 설명
- [ ] 성능 최적화를 배달 서비스 비유로 설명

## 비용 최적화 아키텍처

### 비개발자 설명
- [ ] 비용 최적화를 쉽게 설명
- [ ] 단계별 전략 설명

### Cost-Saving Strategies
- [ ] Phase 1 (MVP): FREE tier 최대화
  - [ ] FREE tier 한계 명시
  - [ ] 예상 비용 (TRD 기반)
- [ ] Phase 2 (Growth): Smart scaling
  - [ ] Auto-scaling 활용
  - [ ] 예상 비용 (TRD 기반)
- [ ] Phase 3 (Scale): Optimize spend
  - [ ] 장기 계약 할인 등
  - [ ] 예상 비용 (TRD 기반)

### Cost Monitoring
- [ ] Billing alerts 설정 방법
- [ ] Cost attribution 전략

## 개발 환경 아키텍처

- [ ] Prerequisites 명시 (Node.js, runtime, etc.)
- [ ] Repository 구조 설명
- [ ] Environment variables 예시
- [ ] Installation steps 제공
- [ ] Development workflow 설명:
  - [ ] Branch strategy
  - [ ] Code quality tools (linter, formatter)
  - [ ] Testing workflow
- [ ] 비개발자 설명 (요리사의 개인 주방 비유)

## 플랫폼별 아키텍처 (해당시)

### 모바일 (해당시)
- [ ] Mobile framework 명시 (TRD 기반)
- [ ] App architecture 정의
- [ ] Platform-specific features 정의
- [ ] App distribution 전략

### 데스크톱 (해당시)
- [ ] Desktop framework 명시 (TRD 기반)
- [ ] App architecture 정의
- [ ] Platform-specific integrations
- [ ] Installer 전략

### 비개발자 설명
- [ ] 플랫폼 차이를 쉽게 설명

## 다이어그램 및 시각화

- [ ] 전체 시스템 구성도 포함 (Mermaid 또는 ASCII)
- [ ] 주요 데이터 흐름 다이어그램 포함
- [ ] 배포 아키텍처 다이어그램 포함 (선택적)
- [ ] 다이어그램이 명확하고 이해하기 쉬움

## 문서 일관성

- [ ] 컴포넌트 이름이 전체 문서에서 일관됨
- [ ] 기술 스택이 TRD와 100% 일치함
- [ ] PRD의 모든 기능이 다뤄짐
- [ ] UX의 모든 flows가 data flows로 변환됨
- [ ] UI 라이브러리가 frontend architecture에 통합됨

## 검색 품질 (매우 중요!)

### Web Search 실행 확인
- [ ] **유사 서비스 아키텍처 검색이 실제로 수행됨**
- [ ] **4-8개 실제 서비스의 아키텍처가 분석됨**
- [ ] **각 서비스의 실제 링크 포함됨**
- [ ] **최신 정보 (2025년 기준)**

### 정보의 정확성
- [ ] 모든 기술이 TRD와 정확히 일치함
- [ ] 모든 링크가 작동함
- [ ] 모든 버전 번호가 정확함
- [ ] 아키텍처 패턴이 실제 프로젝트 규모에 적합함

## 비개발자 이해도

### 스토리텔링 품질
- [ ] 모든 주요 섹션에 비개발자 설명 포함
- [ ] 실생활 비유 사용 (식당, 아파트, 배달, 도서관 등)
- [ ] "철수" 또는 실제 사용자 예시 포함
- [ ] 기술 용어마다 쉬운 설명 제공

### 이해 가능성
- [ ] 비개발자가 전체 시스템 구조를 이해할 수 있음
- [ ] 비개발자가 왜 이 아키텍처를 선택했는지 이해 가능
- [ ] 비개발자가 확장 전략을 이해 가능
- [ ] 비개발자가 비용 예측을 이해 가능

## 개발자 구현 가능성

- [ ] 개발자가 이 문서만으로 시스템 구조 파악 가능
- [ ] 모든 컴포넌트의 책임이 명확함
- [ ] 모든 API endpoints가 정리됨
- [ ] 데이터베이스 테이블 프리뷰가 충분함
- [ ] 배포 방법이 명확함
- [ ] 개발 환경 설정 가이드가 완전함

## 다음 단계 준비

- [ ] ERD에 필요한 모든 database 정보 포함됨
- [ ] 데이터베이스 테이블/컬렉션 프리뷰 제공됨
- [ ] 테이블 간 관계 힌트 제공됨
- [ ] 문서가 {default_output_file}에 저장됨

---

## 최종 품질 검증

### 비개발자 이해도 테스트
- [ ] 비개발자가 "시스템이 어떻게 구성되는지" 이해할 수 있는가?
- [ ] 각 컴포넌트의 역할이 명확한가?
- [ ] 확장 전략이 이해 가능한가?
- [ ] 비용 예측이 명확한가?

### 개발자 구현 가능성 테스트
- [ ] 개발자가 이 문서만으로 아키텍처를 구현할 수 있는가?
- [ ] 모든 기술적 결정이 명확한가?
- [ ] API 구조가 충분히 정의되었는가?
- [ ] 배포 및 개발 환경 설정이 가능한가?

### 검색 품질 테스트
- [ ] 유사 서비스들이 실제로 관련성이 있는가?
- [ ] 아키텍처 패턴 선택이 합리적인가?
- [ ] 모든 링크가 유효한가?

### 일관성 테스트
- [ ] TRD의 기술 선택이 100% 준수되었는가?
- [ ] PRD의 모든 기능이 아키텍처로 구현되었는가?
- [ ] UX의 모든 flows가 data flows로 변환되었는가?

---

## 검증 완료 후

모든 체크박스가 완료되면:
1. Architecture 문서가 완성됨
2. 비개발자와 개발자 모두 이해 가능
3. 실제 구현 가능한 아키텍처 설계 완료
4. ERD 워크플로우로 넘어갈 준비 완료
`;

/**
 * 완성된 Architecture 워크플로우 프롬프트
 */
export const STARTUP_ARCHITECTURE_PROMPT = `
# Workflow Execution

## 1. Workflow Engine (MUST FOLLOW)
${WORKFLOW_ENGINE}

## 2. Workflow Configuration
${WORKFLOW_CONFIG}

## 3. Instructions (Execute step by step)
${INSTRUCTIONS}

## 4. Output Template
${TEMPLATE}

## 5. Validation Checklist
${CHECKLIST}

---

**중요**:
- {project-root}는 현재 작업 디렉토리입니다.
- 출력 파일은 {project-root}/anyon-docs/planning/architecture.md에 저장하세요.
- 먼저 PRD, UX Design, TRD 문서를 읽어서 프로젝트 정보를 파악하세요.

<session_awareness>
이 워크플로우가 처음 시작되면 Step 0부터 진행하세요.
이미 대화가 진행 중이라면 (이전 assistant 응답이 있다면) 현재 진행 중인 Step을 이어서 계속하세요.
절대로 처음부터 다시 시작하지 마세요.
</session_awareness>
`;

/**
 * Architecture 워크플로우 메타데이터
 */
export const STARTUP_ARCHITECTURE_METADATA = {
  id: 'startup-architecture',
  title: 'Architecture',
  description: '시스템 아키텍처 설계 (구조, 데이터 흐름, 확장성, 보안)',
  outputPath: 'anyon-docs/planning/architecture.md',
  filename: 'architecture.md',
};
