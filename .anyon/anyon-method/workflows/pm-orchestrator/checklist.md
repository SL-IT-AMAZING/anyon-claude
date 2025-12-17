# PM Orchestrator 검증 체크리스트

## 1. 입력 문서 검증

### 6개 필수 문서 로딩
- [ ] PRD 문서가 로딩됨
- [ ] UX Design 문서가 로딩됨
- [ ] UI Design Guide 문서가 로딩됨
- [ ] ERD 문서가 로딩됨
- [ ] Architecture 문서가 로딩됨
- [ ] TRD 문서가 로딩됨

### 문서 내용 검증
- [ ] PRD에 기능 요구사항이 명시되어 있음
- [ ] UX Design에 페이지/플로우가 정의되어 있음
- [ ] UI Design Guide에 컴포넌트가 정의되어 있음
- [ ] ERD에 엔티티/테이블이 정의되어 있음
- [ ] Architecture에 시스템/백엔드/프론트엔드 아키텍처가 명시되어 있음
- [ ] TRD에 기술 스택, 성능/보안 요구사항이 명시되어 있음

---

## 1b. 프로젝트 에이전트 생성 검증

### 에이전트 파일 생성
- [ ] backend-developer.md 생성됨
- [ ] frontend-developer.md 생성됨
- [ ] database-architect.md 생성됨
- [ ] integration-engineer.md 생성됨
- [ ] devops-engineer.md 생성됨
- [ ] qa-engineer.md 생성됨
- [ ] security-auditor.md 생성됨
- [ ] scaffolding-engineer.md 생성됨

### 커스터마이징 검증
- [ ] 각 에이전트에 TRD 기술 스택이 주입됨
- [ ] 각 에이전트에 Architecture 컨벤션이 주입됨
- [ ] Frontend에 UI Design Guide 디자인 시스템 주입됨
- [ ] Database Architect에 ERD 엔티티 목록 주입됨
- [ ] Integration Engineer에 외부 서비스 목록 주입됨

---

## 2. 프로젝트 분석 검증

### 규모 산정
- [ ] 프로젝트 규모가 Small/Medium/Large 중 하나로 결정됨
- [ ] 페이지 수, API 수, 테이블 수가 집계됨
- [ ] 외부 연동 서비스 목록이 식별됨

### 기술 스택 식별
- [ ] Frontend 기술이 식별됨
- [ ] Backend 기술이 식별됨
- [ ] Database가 식별됨
- [ ] 배포 환경이 식별됨

---

## 3. Epic 검증

### Epic 구성
- [ ] 최소 2개 이상의 Epic이 식별됨
- [ ] 각 Epic에 명확한 이름이 있음
- [ ] 각 Epic에 비중(%)이 할당됨
- [ ] 비중 합계가 100%임

### Epic 내용
- [ ] 각 Epic에 포함 기능이 명시됨
- [ ] PRD의 모든 주요 기능이 Epic에 포함됨

---

## 4. 티켓 검증

### 티켓 수량
- [ ] Small 프로젝트: 5-10개 티켓
- [ ] Medium 프로젝트: 10-20개 티켓
- [ ] Large 프로젝트: 20-30개 티켓

### 필수 티켓 존재
- [ ] 프로젝트 스캐폴딩 티켓 존재 (Wave 1)
- [ ] DB 스키마 티켓 존재 (Wave 1)
- [ ] CI/CD 설정 티켓 존재

### 티켓 구성 요소
- [ ] 모든 티켓에 고유 ID가 있음 (TICKET-XXX)
- [ ] 모든 티켓에 Epic이 할당됨
- [ ] 모든 티켓에 Type이 지정됨
- [ ] 모든 티켓에 Priority가 지정됨
- [ ] 모든 티켓에 Wave가 할당됨

### 티켓 내용 품질
- [ ] 각 티켓에 명확한 설명이 있음
- [ ] 각 티켓에 최소 1개 이상의 수용 기준이 있음
- [ ] 각 티켓에 산출물이 명시됨
- [ ] 각 티켓에 참조 문서가 연결됨

---

## 4b. TDD 검증

### TDD 플로우 포함
- [ ] 모든 구현 티켓에 TDD 개발 플로우 섹션이 있음
- [ ] RED 단계: 작성할 테스트 목록이 정의됨
- [ ] GREEN 단계: 최소 구현 체크리스트가 있음
- [ ] REFACTOR 단계: 리팩토링 체크리스트가 있음

### 테스트 정의 검증
- [ ] 모든 티켓에 test_file_path가 지정됨
- [ ] 각 티켓에 최소 1개 이상의 tdd_tests가 정의됨
- [ ] 정상 케이스 테스트가 포함됨
- [ ] 엣지 케이스 테스트가 포함됨
- [ ] 에러 케이스 테스트가 포함됨

### 티켓 타입별 TDD 검증
- [ ] Database 티켓: 스키마/CRUD/제약조건 테스트 포함
- [ ] API 티켓: 응답/검증/인증 테스트 포함
- [ ] UI 티켓: 렌더링/인터랙션/상태 테스트 포함
- [ ] Integration 티켓: 모킹/에러/재시도 테스트 포함

### 수용 기준 내 TDD 요구사항
- [ ] 모든 구현 티켓에 "단위 테스트 작성 완료" 기준 포함
- [ ] 모든 구현 티켓에 "테스트 커버리지 80% 이상" 기준 포함
- [ ] 모든 구현 티켓에 "모든 테스트 통과" 기준 포함

---

## 5. 에이전트 할당 검증

### 할당 완료
- [ ] 모든 티켓에 최소 1명의 에이전트가 할당됨
- [ ] 각 에이전트에 역할(responsibility)이 명시됨

### 할당 적절성
- [ ] database 타입 → Database Architect 포함
- [ ] api 타입 → Backend Developer 포함
- [ ] ui 타입 → Frontend Developer 포함
- [ ] integration 타입 → Integration Engineer 포함
- [ ] cicd 타입 → DevOps Engineer 포함
- [ ] test 타입 → QA Engineer 포함
- [ ] security 타입 → Security Auditor 포함

---

## 6. 의존성 검증

### 의존성 정의
- [ ] 모든 티켓에 blocked_by가 정의됨 (비어있어도 됨)
- [ ] 모든 티켓에 blocks가 정의됨 (비어있어도 됨)
- [ ] 병렬 실행 가능 티켓에 parallel_with가 정의됨

### 의존성 논리
- [ ] Wave 1 티켓들은 blocked_by가 비어있음
- [ ] UI 티켓 → 해당 API 티켓에 의존
- [ ] API 티켓 → 해당 DB 스키마 티켓에 의존
- [ ] 순환 의존성이 없음

### Wave 구성
- [ ] 최소 2개 이상의 Wave가 있음
- [ ] Wave 번호가 순차적임 (1, 2, 3...)
- [ ] Wave 1에 기반 작업 티켓들이 배치됨
- [ ] 마지막 Wave에 테스트/보안/성능 티켓이 배치됨

---

## 7. 출력물 검증

### 파일 생성
- [ ] execution-plan.md가 생성됨 (모든 Wave와 Ticket 정보 포함)

### 파일 형식
- [ ] 모든 MD 파일이 유효한 Markdown 형식
- [ ] Mermaid 그래프가 올바른 구문
- [ ] YAML 블록이 올바른 구문

---

## 8. 최종 검증

### 완성도
- [ ] PRD의 모든 기능이 티켓으로 커버됨
- [ ] ERD의 모든 엔티티가 DB 티켓에 포함됨
- [ ] Architecture의 모든 외부 연동이 티켓에 포함됨

### 실행 가능성
- [ ] Wave 순서대로 실행하면 모든 의존성이 충족됨
- [ ] 각 티켓의 산출물이 다음 티켓에서 필요한 입력과 일치

---

## 이슈 목록

### Critical Issues
_없음_

### Warnings
_없음_

### Suggestions
_없음_

---

_Validated by PM Orchestrator Checklist_
