# Implementation Plan Validation Checklist

구현 계획서가 완전하고 AI가 100% 자동 개발할 수 있는지 검증합니다.

---

## 📚 문서 로딩

- [ ] Epic 문서가 먼저 로드되었음
- [ ] Story 문서가 완전히 로드되었음
- [ ] 6개 기획 문서가 모두 로드되었음 (PRD, UX, Design, TRD, Architecture, ERD)
- [ ] 모든 문서 경로가 올바름 (anyon-docs/)

---

## 🔍 코드베이스 분석

- [ ] 프로젝트 환경이 파악되었음 (Framework, UI, State, DB)
- [ ] 재사용 가능한 컴포넌트가 식별되었음
- [ ] 기존 API/State/UI 패턴이 분석되었음
- [ ] 현재 DB 스키마가 확인되었음
- [ ] Gap 분석이 완료되었음 (있는 것 vs 없는 것)
- [ ] 실제 파일 경로가 명시되었음

---

## 💬 비개발자 대상 질문

- [ ] 모든 질문이 쉬운 한국어로 작성되었음
- [ ] 각 질문마다 3-5개 동적 선지가 생성되었음
- [ ] 각 선지에 장단점이 명시되었음
- [ ] 기술 용어가 최소화되거나 쉽게 설명되었음
- [ ] 실생활 비유가 적절히 사용되었음
- [ ] 사용자의 모든 답변이 수집되었음

---

## 📝 구현 계획서 완성도

### 0. 코드베이스 분석 결과
- [ ] 프로젝트 구조가 기술적으로 상세히 기록됨
- [ ] 재사용할 코드 목록이 파일 경로와 함께 명시됨
- [ ] 수정할 파일 목록이 변경사항과 함께 명시됨
- [ ] 새로 만들 파일 목록이 목적과 함께 명시됨

### 1. UI/UX Implementation
- [ ] 컴포넌트 트리가 실제 파일 경로와 함께 명시됨
- [ ] Props 인터페이스가 TypeScript로 정의됨
- [ ] State 관리 방법이 구체적으로 명시됨
- [ ] Layout 상세 (크기, 위치, 스타일)가 명시됨
- [ ] Interaction과 Animation이 정의됨

### 2. API Design
- [ ] 정확한 엔드포인트가 명시됨 (예: POST /api/projects)
- [ ] Request/Response 인터페이스가 TypeScript로 정의됨
- [ ] Validation 규칙이 Zod 스키마로 명시됨
- [ ] 모든 에러 케이스가 status code와 함께 정의됨
- [ ] 처리 로직이 단계별로 명시됨

### 3. Database Schema
- [ ] 스키마 변경사항이 SQL로 명시됨 (ALTER TABLE, CREATE TABLE)
- [ ] Migration 파일 (up/down)이 작성됨
- [ ] 현재 스키마가 참조용으로 포함됨
- [ ] Index와 Constraint가 정의됨

### 4. State Management
- [ ] Global state 코드가 실제 작성됨 (Zustand/Redux)
- [ ] Local state 사용이 명시됨 (useState/useReducer)
- [ ] Server state 관리가 정의됨 (React Query)
- [ ] 실제 코드 예시가 포함됨

### 5. Validation & Error Handling
- [ ] Zod 스키마가 실제 코드로 작성됨
- [ ] Client-side validation이 정의됨
- [ ] Server-side validation이 정의됨 (동일 스키마)
- [ ] Error message mapping이 완료됨
- [ ] 모든 예외 케이스가 처리됨

### 6. Testing Strategy
- [ ] Unit test 항목이 명시됨
- [ ] Integration test 시나리오가 정의됨
- [ ] E2E test 코드 예시가 포함됨 (Playwright/Cypress)
- [ ] 테스트할 내용이 구체적임

### 7. Performance & Security
- [ ] 최적화 전략이 명시됨
- [ ] 보안 조치가 정의됨 (XSS, SQL Injection, CSRF, Auth)
- [ ] 성능 목표가 숫자로 명시됨 (예: < 500ms)

### 8. Implementation Checklist
- [ ] Phase별로 작업이 나뉘어져 있음
- [ ] 각 Phase마다 구체적인 작업 항목이 체크리스트로 작성됨
- [ ] 파일별 변경사항이 명시됨
- [ ] 테스트 및 배포 단계가 포함됨

### 9. Acceptance Criteria
- [ ] 원본 스토리의 모든 AC가 포함됨
- [ ] 계획 과정에서 추가된 AC가 포함됨
- [ ] 각 AC가 검증 가능한 형태임

### 10. Key Decisions
- [ ] Step 4에서 수집한 모든 결정사항이 기록됨
- [ ] 각 결정의 이유가 명시됨
- [ ] Trade-off가 문서화됨

---

## ✅ 전체 품질

- [ ] 모든 섹션에 플레이스홀더가 없음 ({{variable}} 모두 채워짐)
- [ ] 기술 용어가 일관되게 사용됨
- [ ] 실제 파일 경로가 프로젝트 구조와 일치함
- [ ] 코드 예시가 실제 동작 가능한 수준임
- [ ] AI가 이 문서만 보고 개발 가능한 수준임

---

## 🚫 Issues Found

이 섹션에 발견된 문제를 기록하세요:

### Critical Issues (개발 불가능)
-

### Major Issues (추가 정보 필요)
-

### Minor Issues (개선 권장)
-

---

**Validation Date**: {{date}}
**Validator**: {{user_name}}
