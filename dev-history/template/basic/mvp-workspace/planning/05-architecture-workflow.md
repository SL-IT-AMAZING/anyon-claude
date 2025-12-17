---
title: Architecture (시스템 아키텍처) 워크플로우
description: TRD에서 결정한 기술들을 어떻게 구성하고 연결할지 설계하는 다섯 번째 단계
related_code:
  - src/constants/workflows/planning/startup-architecture.ts
  - src/constants/planning.ts
ui_location: Basic > MVP Workspace > 기획문서 탭 > Architecture
workflow_order: 5
dependencies:
  - prd.md
  - ui-ux.html
  - design-guide.md
  - trd.md
output_files:
  - anyon-docs/planning/architecture.md
last_updated: 2024-12-17
---

# Architecture (시스템 아키텍처) 워크플로우

## 개요

Architecture 워크플로우는 TRD에서 결정한 기술들을 **어떻게 구성하고 연결할지** 설계하는 다섯 번째 단계입니다.

### 이 워크플로우가 하는 일

1. 모든 이전 문서 종합 분석
2. 시스템 구성 요소 정의
3. 데이터 흐름 및 API 설계
4. 프로젝트 폴더 구조 설계
5. 개발 가이드 역할을 하는 문서 생성

---

## 실행 조건

### 시작 조건
- `prd.md`, `ui-ux.html`, `design-guide.md`, `trd.md` 파일 존재
- 사용자가 "Architecture 작성 시작" 버튼 클릭

### 종료 조건
- `anyon-docs/planning/architecture.md` 파일 생성 완료
- 자동으로 ERD 탭 활성화

---

## 워크플로우 상세 단계

### Step 0: 모든 이전 문서 분석

AI가 **자동으로** 모든 이전 문서를 읽고 아키텍처 요구사항을 추출합니다.

```
[AI 내부 동작]
PRD에서 추출:
- 핵심 기능 목록 → 필요한 서비스/모듈 파악
- 비기능 요구사항 → 성능/보안 요구사항

UX Design에서 추출:
- 화면 구성 → 라우팅 구조
- 사용자 플로우 → API 엔드포인트 도출

TRD에서 추출:
- 기술 스택 → 아키텍처 패턴 결정
- 외부 서비스 → 연동 포인트 파악
```

### Step 1: 아키텍처 패턴 결정

```
이 프로젝트에 적합한 아키텍처 패턴을 제안합니다:

TRD 분석 결과:
- 프론트엔드: Next.js
- 백엔드: API Routes
- DB: PostgreSQL

→ 추천 패턴: 모놀리식 풀스택

이유:
1. MVP 단계에서 빠른 개발 가능
2. 배포가 단순함
3. 나중에 필요하면 분리 가능

이 패턴으로 진행할까요?
```

### Step 2: 시스템 구성 요소 정의

AI가 시스템을 구성하는 주요 요소를 정의합니다.

```
시스템 구성 요소:

┌─────────────────────────────────────────────┐
│                  클라이언트                   │
│    (브라우저 / 모바일 웹)                      │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│              Next.js 서버                    │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │  Pages  │  │   API   │  │Middleware│     │
│  │  (SSR)  │  │ Routes  │  │  (Auth) │     │
│  └─────────┘  └─────────┘  └─────────┘     │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│              데이터베이스                     │
│         PostgreSQL + Prisma                 │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│              외부 서비스                      │
│  ┌────────┐  ┌────────┐  ┌────────┐       │
│  │Storage │  │ Email  │  │ Auth   │       │
│  │  (R2)  │  │(Resend)│  │(NextAuth)│      │
│  └────────┘  └────────┘  └────────┘       │
└─────────────────────────────────────────────┘
```

### Step 3: 데이터 흐름 설계

```
주요 데이터 흐름을 정의합니다:

1. 인증 흐름
   사용자 → 로그인 폼 → NextAuth → DB 검증 → 세션 생성 → 홈 이동

2. 데이터 조회 흐름
   사용자 → 페이지 요청 → API Route → Prisma → DB → JSON 응답 → 화면 렌더링

3. 파일 업로드 흐름
   사용자 → 파일 선택 → API Route → R2 업로드 → URL 반환 → DB 저장

각 흐름에 대해 더 자세한 설명이 필요하신가요?
```

### Step 4: API 엔드포인트 설계

PRD의 기능 목록을 바탕으로 API를 설계합니다.

```
API 엔드포인트 목록:

인증 관련:
POST   /api/auth/signin      - 로그인
POST   /api/auth/signup      - 회원가입
POST   /api/auth/signout     - 로그아웃
GET    /api/auth/session     - 세션 확인

사용자 관련:
GET    /api/users/me         - 내 정보 조회
PATCH  /api/users/me         - 내 정보 수정

[핵심기능] 관련:
GET    /api/[리소스]         - 목록 조회
POST   /api/[리소스]         - 생성
GET    /api/[리소스]/[id]    - 상세 조회
PATCH  /api/[리소스]/[id]    - 수정
DELETE /api/[리소스]/[id]    - 삭제

이 API 구조가 적합한가요? 추가할 엔드포인트가 있나요?
```

### Step 5: 폴더 구조 설계

```
프로젝트 폴더 구조를 제안합니다:

my-project/
├── app/                      # Next.js App Router
│   ├── (auth)/               # 인증 관련 페이지
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/          # 로그인 후 페이지
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/                  # API Routes
│   │   ├── auth/
│   │   └── [리소스]/
│   ├── layout.tsx
│   └── page.tsx
├── components/               # UI 컴포넌트
│   ├── ui/                   # 기본 컴포넌트 (shadcn)
│   └── features/             # 기능별 컴포넌트
├── lib/                      # 유틸리티
│   ├── prisma.ts             # Prisma 클라이언트
│   ├── auth.ts               # NextAuth 설정
│   └── utils.ts              # 공통 유틸
├── prisma/                   # Prisma 스키마
│   └── schema.prisma
├── public/                   # 정적 파일
└── types/                    # TypeScript 타입

이 구조로 진행할까요?
```

### Step 6: Architecture 문서 생성

모든 정보를 종합하여 `architecture.md` 파일 생성

---

## AI 페르소나

### 역할
**시스템 아키텍트**

### 대화 원칙

1. **시각적 설명**
   - 다이어그램과 ASCII 아트 활용
   - 복잡한 개념을 그림으로 표현

2. **계층적 설명**
   - 전체 → 부분 순서로 설명
   - 먼저 큰 그림, 그 다음 상세

3. **비개발자 친화적**
   - 기술 용어에 항상 설명 추가
   - 실생활 비유 활용

---

## 출력 파일 구조

### 파일 경로
`{프로젝트폴더}/anyon-docs/planning/architecture.md`

### 문서 구조

```markdown
---
# YAML Frontmatter
architecture_pattern: "Monolithic Fullstack"
frontend_pattern: "App Router + RSC"
api_style: "REST"
auth_strategy: "Session-based"
---

# [프로젝트명] Architecture

## 1. 시스템 개요

### 1.1 아키텍처 패턴
- 패턴: 모놀리식 풀스택
- 이유: MVP 빠른 개발, 단순한 배포

### 1.2 전체 구조도
[ASCII 다이어그램]

## 2. 프론트엔드 아키텍처

### 2.1 라우팅 구조
- / : 랜딩 페이지
- /login : 로그인
- /dashboard : 메인 대시보드
- ...

### 2.2 컴포넌트 구조
- UI 컴포넌트: shadcn/ui 기반
- 기능 컴포넌트: features/ 폴더에 도메인별 구성

### 2.3 상태 관리
- 서버 상태: TanStack Query
- 클라이언트 상태: Zustand

## 3. 백엔드 아키텍처

### 3.1 API 구조
- 위치: app/api/
- 스타일: REST
- 인증: NextAuth.js 미들웨어

### 3.2 미들웨어
- 인증 체크
- 에러 핸들링
- 로깅

## 4. 데이터 흐름

### 4.1 인증 흐름
[시퀀스 다이어그램]

### 4.2 데이터 CRUD 흐름
[시퀀스 다이어그램]

## 5. API 설계

### 5.1 엔드포인트 목록
| Method | Path | 설명 |
|--------|------|------|
| POST | /api/auth/signin | 로그인 |
| ... | ... | ... |

### 5.2 응답 형식
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

## 6. 폴더 구조
[프로젝트 트리 구조]

## 7. 배포 아키텍처

### 7.1 환경 구성
- Development: localhost:3000
- Staging: staging.example.com
- Production: example.com

### 7.2 CI/CD
- Git push → Vercel 자동 배포
- Preview 배포 (PR마다)
```

---

## 핵심 개념 설명 (비개발자용)

### 아키텍처
시스템의 전체적인 설계도입니다.
- 비유: 건물의 구조 설계도

### 모놀리식 (Monolithic)
하나의 큰 앱으로 모든 기능을 구현하는 방식입니다.
- 장점: 단순함, 빠른 개발
- 단점: 커지면 복잡해짐
- 비유: 하나의 큰 건물

### 마이크로서비스
여러 작은 서비스로 분리하는 방식입니다.
- 장점: 확장성, 독립 배포
- 단점: 복잡함
- 비유: 여러 건물로 이루어진 단지

### API 엔드포인트
서버와 통신하는 "문"입니다.
- GET: 데이터 가져오기 (읽기)
- POST: 새 데이터 만들기 (쓰기)
- PATCH: 데이터 수정하기
- DELETE: 데이터 삭제하기

### 미들웨어
요청이 처리되기 전에 거치는 "검문소"입니다.
- 예: 로그인 여부 확인, 권한 체크

---

## 다음 단계 연결

### 자동 전환 조건
- `architecture.md` 파일 생성 완료
- ERD 탭 활성화

### ERD가 참조하는 정보
- API 엔드포인트 목록 → 필요한 데이터 구조 파악
- 데이터 흐름 → 테이블 관계 파악
- 기술 스택 (DB, ORM) → 스키마 작성 방식

---

## AI를 위한 요약

**Architecture 워크플로우 핵심**:
1. 프롬프트 위치: `src/constants/workflows/planning/startup-architecture.ts`
2. 출력 파일: `anyon-docs/planning/architecture.md`
3. 참조 문서: PRD, UX Design, Design Guide, TRD (전체)
4. AI 페르소나: 시스템 아키텍트

**출력물의 특징**:
- 다이어그램 (ASCII) 포함
- 폴더 구조 명시
- API 엔드포인트 목록

**YAML Frontmatter 중요 필드**:
- `architecture_pattern`: 개발 시 참조
- `api_style`: API 구현 가이드
- `auth_strategy`: 인증 구현 가이드
