/**
 * Startup TRD Workflow - 합본 프롬프트
 * workflow.yaml + instructions.md + template.md + checklist.md 통합
 */

import { WORKFLOW_ENGINE } from '../engine';

const WORKFLOW_CONFIG = `
# Startup TRD Workflow Configuration
name: startup-trd
description: "기술 스택 선정. 프론트엔드, 백엔드, DB, UI 라이브러리, 호스팅 모두 포함."
author: "Anyon"

# Output configuration
output_folder: "{project-root}/anyon-docs/planning"
default_output_file: "{output_folder}/trd.md"

# Inputs
input_prd: "{output_folder}/prd.md"
input_ux: "{output_folder}/ui-ux.html"
input_design: "{output_folder}/design-guide.md"

# Communication settings
communication_language: "Korean"
document_output_language: "Korean"

# Tool Requirements
required_tools:
  - "WebSearch":
      description: "Search for latest tech options"
      critical: true

standalone: true
`;

const INSTRUCTIONS = `
# TRD Workflow Instructions

<critical>Communicate in Korean</critical>
<critical>Target audience: NON-TECHNICAL FOUNDERS - 기술 용어 최소화, 쉬운 설명</critical>
<critical>
이 프롬프트 자체가 TRD 워크플로우입니다.
절대로 Skill 도구를 사용하지 마세요.
지금 바로 Step 0부터 실행하세요.
</critical>
<critical>아키텍처 개요, 시스템 다이어그램은 Architecture 워크플로우에서 만듦. TRD에서 생성하지 말 것!</critical>

## 핵심 원칙

1. **AI가 모든 기술 100% 자동 결정** - 사용자에게 기술 질문 절대 금지
2. **질문 없이 바로 결정** - PRD/UX/Design Guide 기반으로 최적 스택 선택
3. **전문 용어 금지** - 결과 설명 시 쉬운 말로
4. **결과만 보여주기** - 결정 후 간단히 확인만

<workflow>

<step n="0" goal="문서 분석 및 기술 스택 자동 결정">
<action>PRD 문서 로드 from {input_prd}</action>
<action>UX Design 문서 로드 from {input_ux}</action>
<action>Design Guide 문서 로드 from {input_design}</action>

<action>PRD에서 추출:
- project_name, service_type, platform
- core_features (핵심 기능 목록)
- target_users (타겟 사용자)
- opensource.decision, opensource.base_project (있으면)
</action>

<action>클론된 오픈소스 기술 스택 분석 (있는 경우):
Bash로 opensource/ 폴더 확인: ls -la opensource/ 2>/dev/null || echo "없음"

오픈소스가 있으면:
1. 각 프로젝트의 package.json 분석:
   - Read: opensource/[프로젝트명]/package.json
   - dependencies, devDependencies에서 기술 스택 추출

2. 기술 스택 정리:
   "**클론된 오픈소스 기술 분석:**

   **[프로젝트명]의 기술 스택:**
   - 프론트엔드: [React/Vue/Svelte 등]
   - 백엔드: [Node/Python/Go 등]
   - DB: [PostgreSQL/MongoDB 등]
   - UI: [Tailwind/MUI 등]
   - 인증: [NextAuth/Clerk 등]
   - 기타: [주요 라이브러리들]

   이 기술 스택을 참고해서 우리 서비스에 맞게 조정할게요."

3. 검증된 기술 조합으로 활용:
   - 오픈소스에서 이미 잘 작동하는 기술 조합 참고
   - 무리한 커스텀 피하기
</action>

<action>기능 요구사항 자동 분석:
- 로그인/회원가입 필요? → PRD에서 파악
- 파일 업로드 필요? → PRD에서 파악
- 결제 기능 필요? → PRD에서 파악
- 실시간 기능 필요? → PRD에서 파악
- 복잡한 데이터 관계? → PRD에서 파악
</action>

<action>플랫폼 확인 (PRD에서):
- 웹만? 모바일 웹? 앱? 데스크톱?
</action>

<action>WebSearch로 최신 기술 스택 트렌드 조사:
- 2025 프론트엔드 프레임워크 비교 (Next.js, Remix, SvelteKit 등)
- BaaS 서비스 비교 (Supabase, Firebase, Appwrite, Nhost, Convex 등)
- UI 라이브러리 트렌드 (shadcn/ui, Radix, MUI 등)
- 호스팅 플랫폼 비교 (Vercel, Railway, Render, Fly.io 등)
- 결제 서비스 (한국: Toss Payments, 포트원 / 글로벌: Stripe, Paddle 등)
</action>

<action>**AI가 기술 스택 자동 결정 (WebSearch 결과 + PRD 분석 기반):**

결정 가이드라인 (예시, 실제는 WebSearch로 최신 정보 확인):

1. **Frontend:** PRD의 platform, 기능 복잡도 기반 결정
   - 예: SEO 필요한 웹 → Next.js, 대시보드 → React+Vite, 데스크톱 → Tauri

2. **Backend:** PRD의 기능 복잡도 기반 결정
   - 예: 단순 CRUD → BaaS, 복잡한 로직 → 커스텀 서버

3. **Database:** 데이터 특성 기반 결정
   - 예: 관계형 데이터 → PostgreSQL, 실시간 → Firebase

4. **UI Library:** Design Guide 스타일 기반 결정

5. **Hosting:** 프레임워크와 scale_tier 기반 결정

6. **추가 서비스:** PRD 기능 요구사항 기반 결정
   - 인증, 파일 저장, 결제, 이메일 등
</action>
</step>

<step n="1" goal="필수 비즈니스 질문">
<ask>
{{project_name}}의 기술을 정하기 전에 몇 가지만 여쭤볼게요.

**1. 서비스 규모는 어느 정도로 시작하나요?**

1. **테스트/MVP** - 일단 만들어보고 반응 보기 (무료로 시작)
2. **소규모 런칭** - 실제 사용자 받을 준비 (월 5만원 이하)
3. **본격 서비스** - 바로 많은 사용자 받을 예정 (월 5만원 이상)

번호로 선택해주세요:
</ask>

<action>{{scale_tier}}에 저장</action>

<action>WebSearch로 BaaS(Backend-as-a-Service) 옵션들의 최신 정보 조사:
- Supabase, Firebase, Appwrite, Nhost 등 주요 BaaS 비교
- 각 서비스의 무료 티어 한도, 유료 플랜 가격
- 2025 기준 최신 pricing 확인
- 장단점, 적합한 use case
</action>

<action>WebSearch로 셀프호스팅 옵션 비용 조사:
- Vercel, Railway, Render, Fly.io 등 PaaS 가격
- VPS (AWS Lightsail, DigitalOcean 등) 가격
- 소규모 서비스 기준 월 예상 비용
</action>

<ask>
**2. 서버/데이터 관리는 어떻게 할까요?**

1. **간편하게** - 서버 관리 없이 빠르게
   → 장점: 빠른 개발, 관리 편함, 무료로 시작 가능
   → 단점: 복잡한 기능에 제한, 사용량 많아지면 비용 급증 가능
   → 비용: (WebSearch 결과 기반으로 최신 가격 안내)

2. **직접 만들기** - 서버 코드를 직접 작성
   → 장점: 자유로운 커스텀, 복잡한 로직 가능, 비용 예측 쉬움
   → 단점: 개발 시간 오래 걸림, 서버 관리 필요
   → 비용: (WebSearch 결과 기반으로 최신 가격 안내)

3. **AI한테 맡기기** - PRD 보고 알아서 결정해주세요

번호로 선택:
</ask>

<action>{{backend_style}}에 저장</action>

<ask if="PRD에서 결제 기능 필요 여부가 불명확한 경우">
**3. 결제 기능이 필요한가요?**

1. **네** - 유료 서비스 / 상품 판매
2. **아니오** - 무료 서비스 / 나중에 추가
3. **구독 모델** - 월정액 결제

번호로 선택:
</ask>

<ask if="PRD에서 타겟 시장이 불명확한 경우">
**4. 주 사용자가 어디에 있나요?**

1. **한국** - 한국 사용자 위주
2. **글로벌** - 해외 사용자도 포함
3. **둘 다**

번호로 선택:
</ask>
</step>

<step n="2" goal="결과 보여주기">
<action>결정된 기술 스택을 쉬운 말로 설명:

"
{{project_name}}에 맞는 기술을 선택했어요!

---

**만드는 도구:** {{frontend_framework}}
→ {{frontend_reason}}

**디자인:** {{ui_library}}
→ 예쁘고 깔끔한 디자인을 빠르게 만들 수 있어요.

**데이터 저장:** {{backend_framework}}
→ 회원 정보, 서비스 데이터를 저장해요.

**배포:** {{hosting_platform}}
→ 만든 서비스를 인터넷에 올려요.

{{#if needs_auth}}
**로그인:** {{auth_service}}
{{/if}}

{{#if needs_payment}}
**결제:** {{payment_service}}
{{/if}}

---

**예상 비용:**
- 처음: **월 0원** (무료로 시작 가능)
- 사용자 늘어나면: **월 {{estimated_cost}}원 예상**

---

TRD 문서를 저장할게요!
"
</action>
</step>

<step n="2" goal="TRD 문서 생성">
<action>TRD 문서를 {default_output_file}에 저장</action>

<action>완료 메시지:
"
기술 스택이 정해졌어요!

**저장 위치:** {default_output_file}

다음은 **시스템 구조 설계** (Architecture)예요!
"
</action>
</step>

</workflow>
`;

const TEMPLATE = `
# {{project_name}} - TRD (기술 요구사항)

## 예산

| 항목 | 내용 |
|-----|------|
| 월 예산 | {{monthly_budget}} |
| 예상 MVP 비용 | {{mvp_cost}} |
| 예상 성장기 비용 | {{growth_cost}} |

---

## 기술 스택

| 분류 | 기술 | 선택 이유 | 대안 |
|-----|-----|----------|-----|
| Frontend | {{frontend_framework}} | {{frontend_reason}} | {{frontend_alternatives}} |
| UI Library | {{ui_library}} | {{ui_reason}} | {{ui_alternatives}} |
| Backend | {{backend_framework}} | {{backend_reason}} | {{backend_alternatives}} |
| Database | {{database}} | {{database_reason}} | {{database_alternatives}} |
| Hosting | {{hosting_platform}} | {{hosting_reason}} | {{hosting_alternatives}} |

---

## 추가 서비스

| 서비스 | 선택 | 무료 tier | 비용 |
|-------|-----|----------|-----|
| 인증 | {{auth_service}} | {{auth_free_tier}} | {{auth_cost}} |
| 파일 저장 | {{file_storage}} | {{storage_free_tier}} | {{storage_cost}} |
| 결제 | {{payment_service}} | - | {{payment_fee}} |
| 이메일 | {{email_service}} | {{email_free_tier}} | {{email_cost}} |

---

## 비용 예측

### MVP (0-100 사용자)
{{mvp_cost_breakdown}}

### 성장기 (100-1,000 사용자)
{{growth_cost_breakdown}}

### 확장기 (1,000+ 사용자)
{{scale_cost_breakdown}}
`;

const CHECKLIST = `
# TRD Validation Checklist

## 문서 구조

- [ ] YAML frontmatter가 완전함
- [ ] 선택된 모든 기술이 메타데이터에 정리됨
- [ ] Frontend, Backend, Database, Hosting이 명시됨
- [ ] 모든 섹션이 존재하고 placeholder가 없음

## 이전 문서 일관성

- [ ] PRD의 모든 core_features가 TRD에 구현 방법 정의됨
- [ ] UX Design의 모든 특수 요구사항이 기술로 해결됨
- [ ] UI Design Guide의 선택된 라이브러리가 통합됨
- [ ] Platform 요구사항이 충족됨

## 기술 선정 원칙

- [ ] 3-5개의 명확한 기술 선정 원칙이 정의됨
- [ ] 원칙이 프로젝트 특성에 맞음
- [ ] 비용, 확장성, 개발속도 등 고려사항이 반영됨

## Web Search 실행 확인 (매우 중요!)

### Frontend Framework
- [ ] Web Search 수행됨
- [ ] 5-7개 옵션 제시됨
- [ ] 각 옵션에 npm downloads, GitHub stars 포함
- [ ] 최신 정보 (2024년 기준)
- [ ] 장단점 비교 포함
- [ ] 프로젝트에 맞는 추천 제시

### Backend Framework
- [ ] Web Search 수행됨
- [ ] 5-7개 옵션 제시됨
- [ ] 복잡도 분석 기반 추천
- [ ] 성능 벤치마크 포함
- [ ] 확장성 평가 포함

### Database
- [ ] Web Search 수행됨
- [ ] 6-8개 옵션 제시됨
- [ ] SQL vs NoSQL 비교
- [ ] 데이터 특성 분석 기반
- [ ] FREE tier 한계 명시
- [ ] 비용 비교 포함

### Hosting/Deployment
- [ ] Web Search 수행됨
- [ ] 5-7개 플랫폼 옵션 제시됨
- [ ] FREE tier 상세 비교
- [ ] 가격 단계별 비교
- [ ] 선택된 스택과의 호환성 확인

## 기술 스택 완전성

### Frontend Stack
- [ ] Framework가 명확히 선택됨
- [ ] UI Library (from UI Design Guide) 통합 방법 명시
- [ ] State Management 선택됨
- [ ] Build tool 명시됨
- [ ] TypeScript 사용 여부 명시
- [ ] 모든 링크 (GitHub, docs) 포함
- [ ] 버전 명시

### Backend Stack
- [ ] Framework/Platform 선택됨
- [ ] API 아키텍처 정의됨 (REST/GraphQL/tRPC)
- [ ] Authentication 방식 선택됨
- [ ] 모든 링크 포함
- [ ] 버전 명시

### Database
- [ ] Database 시스템 선택됨 (PostgreSQL, MongoDB 등)
- [ ] Schema 접근 방식 정의됨
- [ ] Migration 전략 정의됨
- [ ] Backup 전략 언급됨
- [ ] Caching 전략 정의됨 (필요시)

### Infrastructure
- [ ] Hosting platform 선택됨
- [ ] Deployment 방식 정의됨
- [ ] CDN 전략 정의됨
- [ ] Environment variables 관리 방법
- [ ] CI/CD 파이프라인 정의됨

## 비용 예측

- [ ] MVP (초기) 비용 산정
- [ ] Growth (1년) 비용 산정
- [ ] Scale (목표) 비용 산정
- [ ] 각 서비스별 비용 breakdown
- [ ] FREE tier 활용 계획
- [ ] 예상 무료 사용 기간
- [ ] Cost optimization 팁

## 다음 단계 준비

- [ ] Architecture에 필요한 모든 기술 정보 포함
- [ ] 선택된 기술들 간의 관계가 명확함
- [ ] 데이터 흐름 힌트가 포함됨
- [ ] ERD에 필요한 데이터베이스 정보 충분함
- [ ] 문서가 {default_output_file}에 저장됨

---

## 최종 품질 검증

### 비개발자 이해도 테스트
- [ ] 비개발자가 "어떤 기술을 쓰는지" 이해 가능한가?
- [ ] 각 기술이 "왜" 선택되었는지 명확한가?
- [ ] 대략적인 비용을 파악할 수 있는가?

### 개발자 구현 가능성 테스트
- [ ] 개발자가 바로 프로젝트 시작할 수 있는가?
- [ ] 모든 설치 명령어와 설정이 명확한가?
- [ ] 각 기술의 통합 방법이 설명되었는가?

### 검색 품질 테스트
- [ ] 제시된 옵션들이 실제로 최신이고 인기 있는가?
- [ ] 각 기술의 장단점이 정확한가?
- [ ] 선택된 기술들이 서로 호환되는가?
- [ ] 비용 예측이 현실적인가?

---

## 검증 완료 후

모든 체크박스가 완료되면:
1. TRD가 완성됨
2. 실제 구현 가능한 기술 스택 선정 완료
3. 비용 예측 완료
4. Architecture 워크플로우로 넘어갈 준비 완료
`;

/**
 * 완성된 TRD 워크플로우 프롬프트
 */
export const STARTUP_TRD_PROMPT = `
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
- 출력 파일은 {project-root}/anyon-docs/planning/trd.md에 저장하세요.
- PRD, UX Design, Design Guide 문서를 먼저 읽어서 프로젝트 정보를 파악하세요.

<session_awareness>
이 워크플로우가 처음 시작되면 Step 0부터 진행하세요.
이미 대화가 진행 중이라면 (이전 assistant 응답이 있다면) 현재 진행 중인 Step을 이어서 계속하세요.
절대로 처음부터 다시 시작하지 마세요.
</session_awareness>
`;

/**
 * TRD 워크플로우 메타데이터
 */
export const STARTUP_TRD_METADATA = {
  id: 'startup-trd',
  title: 'TRD',
  description: '기술 요구사항 정의서 (기술 스택 선정)',
  outputPath: 'anyon-docs/planning/trd.md',
  filename: 'trd.md',
};
