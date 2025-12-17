---
title: TRD (Technical Requirements Document) 워크플로우
description: 기획 문서들을 바탕으로 기술 스택과 인프라를 결정하는 네 번째 단계
related_code:
  - src/constants/workflows/planning/startup-trd.ts
  - src/constants/planning.ts
ui_location: Basic > MVP Workspace > 기획문서 탭 > TRD
workflow_order: 4
dependencies:
  - prd.md
  - ui-ux.html
  - design-guide.md
output_files:
  - anyon-docs/planning/trd.md
required_tools:
  - WebSearch (기술 스택 조사용)
last_updated: 2024-12-17
---

# TRD (Technical Requirements Document) 워크플로우

## 개요

TRD 워크플로우는 이전 기획 문서들을 바탕으로 **기술 스택과 인프라**를 결정하는 네 번째 단계입니다.

### 이 워크플로우가 하는 일

1. 모든 이전 문서 자동 분석
2. WebSearch로 최신 기술 트렌드 조사
3. 프론트엔드/백엔드/DB/인프라 기술 스택 결정
4. 비개발자도 이해할 수 있는 기술 문서 생성

---

## 실행 조건

### 시작 조건
- `prd.md`, `ui-ux.html`, `design-guide.md` 파일 존재
- 사용자가 "TRD 작성 시작" 버튼 클릭

### 종료 조건
- `anyon-docs/planning/trd.md` 파일 생성 완료
- 자동으로 Architecture 탭 활성화

---

## 워크플로우 상세 단계

### Step 0: 이전 문서 종합 분석

AI가 **자동으로** 모든 이전 문서를 읽고 기술 요구사항을 추출합니다.

```
[AI 내부 동작]
PRD에서 추출:
- 핵심 기능 목록 → 필요한 백엔드 기능 파악
- 타겟 사용자 규모 → 확장성 요구사항 파악
- 서비스 유형 → 적합한 아키텍처 패턴 파악

UX Design에서 추출:
- 화면 복잡도 → 프론트엔드 복잡도 추정
- 실시간 기능 여부 → WebSocket 필요성 파악

Design Guide에서 추출:
- UI 라이브러리 → 프론트엔드 프레임워크 제약
- CSS 프레임워크 → 빌드 설정 요구사항
```

### Step 1: 프론트엔드 기술 스택 결정 (WebSearch 사용)

**중요**: AI가 자동으로 최신 프론트엔드 기술을 웹 검색합니다.

```
프론트엔드 프레임워크를 선택해주세요:

1. Next.js + TypeScript (추천)
   - 쉬운 설명: 가장 인기 있는 React 프레임워크
   - 장점: SEO 좋음, Vercel 배포 쉬움, 풀스택 가능
   - 단점: 학습 곡선, 서버 비용

2. Vite + React + TypeScript
   - 쉬운 설명: 빠른 개발 환경의 React
   - 장점: 빌드 속도 빠름, 설정 간단
   - 단점: SSR 별도 설정 필요

3. Remix
   - 쉬운 설명: Next.js의 대안
   - 장점: 폼 처리 우수, 프로그레시브 향상
   - 단점: 생태계 작음

4. Vue + Nuxt
   - 쉬운 설명: Vue 기반 풀스택 프레임워크
   - 장점: 문법 쉬움, 한국 커뮤니티 활발
   - 단점: React 대비 채용 시장 작음
```

### Step 2: 백엔드 기술 스택 결정 (WebSearch 사용)

```
백엔드 기술을 선택해주세요:

1. Next.js API Routes (추천 - 프론트엔드와 통합)
   - 쉬운 설명: 프론트엔드와 같은 프로젝트에서 API 작성
   - 장점: 별도 서버 불필요, 배포 간단
   - 단점: 복잡한 로직에 한계

2. Node.js + Express/Fastify
   - 쉬운 설명: 가장 보편적인 JavaScript 서버
   - 장점: 생태계 풍부, 자료 많음
   - 단점: 타입 안전성 직접 관리 필요

3. Python + FastAPI
   - 쉬운 설명: 빠르고 현대적인 Python 서버
   - 장점: AI/ML 연동 쉬움, 자동 문서화
   - 단점: JavaScript와 언어 분리

4. Supabase (BaaS)
   - 쉬운 설명: 백엔드 서비스를 바로 사용
   - 장점: 인증/DB/스토리지 내장, 빠른 개발
   - 단점: 커스텀 로직 제한
```

### Step 3: 데이터베이스 결정

```
데이터베이스를 선택해주세요:

1. PostgreSQL + Prisma (추천)
   - 쉬운 설명: 가장 안정적인 관계형 DB + 현대적 ORM
   - 장점: 타입 안전, 마이그레이션 자동화
   - 적합: 대부분의 서비스

2. Supabase (PostgreSQL 관리형)
   - 쉬운 설명: PostgreSQL을 쉽게 사용
   - 장점: 설정 없이 바로 사용, 실시간 기능
   - 적합: MVP, 빠른 개발

3. MongoDB + Mongoose
   - 쉬운 설명: 유연한 문서형 DB
   - 장점: 스키마 유연, JSON 친화적
   - 적합: 빠르게 변하는 데이터 구조

4. PlanetScale (MySQL 관리형)
   - 쉬운 설명: 확장 가능한 MySQL
   - 장점: 브랜치 기능, 무중단 스키마 변경
   - 적합: 대규모 서비스
```

### Step 4: 인프라 및 배포 결정

```
배포 환경을 선택해주세요:

1. Vercel (추천 - Next.js 사용 시)
   - 쉬운 설명: Git push만 하면 자동 배포
   - 장점: 설정 없음, 무료 시작 가능
   - 비용: 무료~월 $20

2. Railway
   - 쉬운 설명: 백엔드 + DB 올인원 배포
   - 장점: Docker 지원, DB 포함
   - 비용: 월 $5~

3. AWS (EC2/ECS)
   - 쉬운 설명: 가장 유연한 클라우드
   - 장점: 모든 것 가능, 확장성 무한
   - 단점: 복잡함, 비용 관리 어려움

4. Cloudflare Pages + Workers
   - 쉬운 설명: 엣지에서 실행되는 서버리스
   - 장점: 빠른 속도, 무료 관대
   - 단점: Node.js 일부 제한
```

### Step 5: 외부 서비스 결정

```
필요한 외부 서비스를 선택해주세요 (복수 선택):

인증:
□ NextAuth.js (무료, 직접 관리)
□ Clerk (관리형, 월 $25~)
□ Supabase Auth (Supabase 사용 시)

결제:
□ 토스페이먼츠 (한국 결제)
□ Stripe (글로벌 결제)
□ 필요 없음

파일 저장:
□ Cloudflare R2 (저렴)
□ AWS S3 (표준)
□ Supabase Storage
□ 필요 없음

이메일:
□ Resend (현대적, 개발자 친화)
□ SendGrid (전통적)
□ 필요 없음
```

### Step 6: TRD 문서 생성

모든 정보를 종합하여 `trd.md` 파일 생성

---

## AI 페르소나

### 역할
**기술 컨설턴트**

### 대화 원칙

1. **비개발자 친화적 설명**
   - 모든 기술 용어에 "쉬운 설명" 추가
   - 실생활 비유 활용

2. **실용적 추천**
   - MVP에 적합한 선택 우선 추천
   - 비용 대비 효과 고려

3. **트레이드오프 명시**
   - 각 선택의 장단점 명확히 설명
   - "정답"이 없음을 인정

---

## 출력 파일 구조

### 파일 경로
`{프로젝트폴더}/anyon-docs/planning/trd.md`

### 문서 구조

```markdown
---
# YAML Frontmatter
frontend_framework: "Next.js"
frontend_language: "TypeScript"
backend_type: "API Routes"
database: "PostgreSQL"
orm: "Prisma"
hosting: "Vercel"
auth_provider: "NextAuth.js"
payment_provider: null
storage_provider: "Cloudflare R2"
---

# [프로젝트명] TRD

## 1. 기술 스택 요약

| 영역 | 기술 | 선택 이유 |
|------|------|----------|
| 프론트엔드 | Next.js + TypeScript | SEO, 풀스택, Vercel 연동 |
| 백엔드 | Next.js API Routes | 별도 서버 불필요 |
| 데이터베이스 | PostgreSQL + Prisma | 안정성, 타입 안전 |
| 호스팅 | Vercel | 자동 배포, 무료 시작 |

## 2. 프론트엔드 상세
### 프레임워크: Next.js 14
- App Router 사용
- React Server Components 활용
- TypeScript strict 모드

### 상태 관리
- Zustand (간단한 전역 상태)
- TanStack Query (서버 상태)

### UI 라이브러리
- shadcn/ui (Design Guide 참조)
- Tailwind CSS

## 3. 백엔드 상세
### API 구조
- Next.js API Routes
- REST API 스타일
- 응답 형식: JSON

### 인증
- NextAuth.js
- 지원 방식: 이메일/비밀번호, 소셜 로그인

## 4. 데이터베이스 상세
### DBMS: PostgreSQL
- 호스팅: Supabase / Neon
- ORM: Prisma

### 캐시
- 필요 시: Upstash Redis

## 5. 인프라 상세
### 호스팅: Vercel
- 자동 CI/CD
- Preview 배포
- Edge Functions

### 도메인
- Vercel 도메인 또는 커스텀 도메인

### 모니터링
- Vercel Analytics
- Sentry (에러 추적)

## 6. 외부 서비스
| 서비스 | 제공자 | 용도 |
|-------|-------|------|
| 인증 | NextAuth.js | 로그인/회원가입 |
| 파일저장 | Cloudflare R2 | 이미지/파일 업로드 |
| 이메일 | Resend | 알림 이메일 |

## 7. 개발 환경
### 필수 도구
- Node.js 20+
- pnpm (패키지 매니저)
- VS Code

### 환경 변수
```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```
```

---

## 핵심 개념 설명 (비개발자용)

### 프레임워크
앱을 쉽게 만들 수 있게 도와주는 도구 모음입니다.
- 비유: 레고 블록 세트 (기본 블록이 준비되어 있어서 조립만 하면 됨)

### ORM (Object-Relational Mapping)
데이터베이스와 코드를 연결해주는 도구입니다.
- 비유: 통역사 (코드와 DB가 다른 언어를 쓰는데, 중간에서 번역해줌)

### 서버리스
서버를 직접 관리하지 않는 방식입니다.
- 비유: 공유 오피스 (사무실을 직접 임대하지 않고, 필요할 때만 사용)

### API Routes
프론트엔드와 같은 프로젝트에서 백엔드 코드를 작성하는 방식입니다.
- 비유: 원룸 (거실과 침실이 분리되지 않고 한 공간에 있음)

---

## 다음 단계 연결

### 자동 전환 조건
- `trd.md` 파일 생성 완료
- Architecture 탭 활성화

### Architecture가 참조하는 정보
- 모든 기술 스택 결정사항
- 서비스 간 연결 방식
- 데이터 흐름

---

## AI를 위한 요약

**TRD 워크플로우 핵심**:
1. 프롬프트 위치: `src/constants/workflows/planning/startup-trd.ts`
2. 출력 파일: `anyon-docs/planning/trd.md`
3. 필수 도구: WebSearch (기술 스택 조사)
4. 참조 문서: PRD, UX Design, Design Guide (전체)
5. AI 페르소나: 기술 컨설턴트

**WebSearch 사용 시점**:
- 각 기술 스택 결정 전 최신 트렌드 조사
- 라이브러리/서비스 비교 시

**YAML Frontmatter 중요 필드**:
- `frontend_framework`: Architecture에서 시스템 구조 결정에 사용
- `database` + `orm`: ERD 워크플로우에서 참조
- `hosting`: 배포 파이프라인 구성에 사용
