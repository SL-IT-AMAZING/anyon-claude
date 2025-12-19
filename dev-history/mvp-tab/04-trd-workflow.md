# TRD (Technical Requirements Document) 워크플로우

## 개요

TRD 워크플로우는 기획 문서들을 바탕으로 기술 요구사항을 정의하는 네 번째 단계입니다. 어떤 기술 스택을 사용할지, 어떤 서비스를 활용할지 결정합니다.

## 파일 위치
- **프롬프트 파일**: `src/constants/workflows/planning/startup-trd.ts`
- **출력 파일**: `anyon-docs/planning/trd.md`
- **참조 파일**: PRD, UX Design, Design Guide

---

## 워크플로우 진행 순서

### Step 1: 이전 문서 종합 분석

AI가 수행하는 작업:
- PRD에서 기능 요구사항 추출
- UX Design에서 화면 복잡도 파악
- Design Guide에서 프론트엔드 요구사항 파악

### Step 2: 프론트엔드 기술 스택 결정 (WebSearch 사용)

AI가 최신 기술 트렌드를 검색하여 추천:

조사 대상:
- React vs Vue vs Svelte
- Next.js vs Remix vs Vite
- TypeScript 사용 여부
- 상태 관리 라이브러리

### Step 3: 백엔드 기술 스택 결정 (WebSearch 사용)

조사 대상:
- Node.js vs Python vs Go
- Express vs Fastify vs NestJS
- REST API vs GraphQL
- 서버리스 vs 전통적 서버

### Step 4: 데이터베이스 결정

조사 대상:
- PostgreSQL vs MySQL vs MongoDB
- ORM 선택 (Prisma, TypeORM, Drizzle 등)
- 캐시 (Redis 필요 여부)

### Step 5: 인프라 및 배포

결정하는 내용:
- 클라우드 서비스 (AWS, GCP, Vercel 등)
- 컨테이너화 (Docker 필요 여부)
- CI/CD 파이프라인

### Step 6: 외부 서비스 연동

파악하는 내용:
- 인증 서비스 (Auth0, Firebase Auth 등)
- 결제 서비스 (Stripe, 토스페이먼츠 등)
- 이메일/알림 서비스
- 파일 저장소

### Step 7: TRD 문서 생성

모든 정보를 종합하여 `trd.md` 파일 생성

---

## AI의 대화 스타일

### 페르소나
- **역할**: 기술 컨설턴트
- **접근법**: 실용적이고 현실적인 선택
- **목표**: 비개발자도 이해할 수 있는 기술 설명

### 설명 방식
```
프론트엔드 기술 스택을 결정해야 합니다.

조사 결과 추천:
1. Next.js + TypeScript (추천)
   - 쉬운 설명: 가장 인기 있는 조합, 배우기 쉬움
   - 장점: SEO 좋음, 배포 쉬움 (Vercel)
   - 단점: 약간의 학습 곡선

2. Vite + React
   - 쉬운 설명: 빠른 개발 환경
   - 장점: 빌드 속도 빠름
   - 단점: 서버 렌더링 별도 설정 필요

어떤 것을 선택하시겠어요?
```

---

## 출력 문서 구조 (trd.md)

```markdown
# [프로젝트명] TRD

## 1. 기술 스택 개요
- 전체 아키텍처 다이어그램
- 기술 선택 요약

## 2. 프론트엔드
- 프레임워크
- 상태 관리
- UI 라이브러리
- 빌드 도구

## 3. 백엔드
- 언어/프레임워크
- API 스타일
- 인증 방식

## 4. 데이터베이스
- DBMS
- ORM
- 캐시

## 5. 인프라
- 호스팅
- CI/CD
- 모니터링

## 6. 외부 서비스
- 결제
- 인증
- 알림
- 파일 저장

## 7. 개발 환경
- 로컬 설정
- 환경 변수
- 테스트 전략
```

---

## 핵심 개념 설명

### 기술 스택 (Tech Stack)
앱을 만드는 데 사용하는 기술들의 조합입니다.
- 프론트엔드: 사용자가 보는 화면
- 백엔드: 서버에서 데이터 처리
- 데이터베이스: 데이터 저장

### 프레임워크
앱을 쉽게 만들 수 있도록 도와주는 도구 모음입니다.
예: Next.js는 웹사이트를 쉽게 만들게 해주는 프레임워크

### API
앱의 여러 부분이 서로 대화하는 방식입니다.
예: 프론트엔드가 백엔드에게 "사용자 목록 줘"라고 요청하는 방식

### 서버리스
서버를 직접 관리하지 않고 필요할 때만 코드를 실행하는 방식입니다.
장점: 관리 부담 적음, 비용 효율적

---

## 다음 단계

TRD 완료 후 자동으로 **Architecture** 워크플로우로 이동합니다.
Architecture는 TRD에서 결정한 기술들을 어떻게 구성할지 설계합니다.
