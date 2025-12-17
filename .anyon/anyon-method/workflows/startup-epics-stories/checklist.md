# Startup Epics & Stories Generator - Validation Checklist

이 체크리스트를 사용하여 생성된 에픽과 스토리의 품질을 검증하세요.

## 📋 입력 문서 검증

- [ ] PRD (Product Requirements Document) 로드 완료
- [ ] UX Design Specification 로드 완료
- [ ] Design Guide 로드 완료
- [ ] TRD (Technical Requirements Document) 로드 완료
- [ ] Architecture Document 로드 완료
- [ ] ERD (Entity Relationship Diagram) 로드 완료

## 📦 Epic 구조 검증

### Epic 개수 및 크기
- [ ] 생성된 Epic이 프로젝트 범위를 완전히 커버함
- [ ] 각 Epic이 3-6개의 Story를 포함함
- [ ] 너무 작은 Epic(1-2 stories)이 없음
- [ ] 너무 큰 Epic(7개 이상 stories)이 없음

### Epic 분해 기준 적용
- [ ] **1순위 (화면/페이지)**: 주요 화면이 Epic으로 식별됨
- [ ] **2순위 (사용자 플로우)**: 주요 플로우가 Epic으로 그룹화됨
- [ ] **3순위 (도메인)**: 관련 기능이 적절히 묶임
- [ ] 각 Epic이 "완결된 가치"를 제공함
- [ ] Epic 간 경계가 명확함 (기능 중복 없음)

### Epic 내용 완성도
- [ ] 각 Epic에 명확한 이름과 설명이 있음
- [ ] 각 Epic의 목표와 사용자 가치가 정의됨
- [ ] 각 Epic에 기술 정보가 포함됨 (Architecture, TRD)
- [ ] 각 Epic에 디자인 정보가 포함됨 (Design Guide)
- [ ] 각 Epic에 데이터 모델 정보가 포함됨 (ERD)

## 📝 Story 구조 검증

### Story 분해 기준 적용
- [ ] 각 Story가 "사용자가 ~할 수 있다" 형태로 표현됨
- [ ] 각 Story가 하나의 사용자 액션에 집중함
- [ ] 각 Story가 기획자가 테스트 가능한 단위임
- [ ] 각 Story가 독립적으로 개발 가능함
- [ ] 각 Story가 UI + 백엔드를 모두 포함함

### Story 품질 검증
- [ ] 각 Story에 명확한 사용자 플로우가 정의됨
- [ ] 각 Story에 측정 가능한 Acceptance Criteria가 있음
- [ ] 각 Story에 UI/UX 사양이 포함됨
- [ ] 각 Story에 기술 상세 정보가 포함됨 (TRD, Architecture)
- [ ] 각 Story에 데이터 모델 정보가 포함됨 (ERD)
- [ ] 각 Story에 구현 힌트가 제공됨
- [ ] 각 Story에 테스트 시나리오가 있음

### Story 크기 검증
- [ ] Story가 너무 크지 않음 (AI가 한 세션에 Plan+Dev 가능)
- [ ] Story가 너무 작지 않음 (의미 있는 사용자 기능)
- [ ] 필요시 Story가 적절히 합쳐짐 (항상 함께 사용되는 기능)
- [ ] 필요시 Story가 적절히 쪼개짐 (여러 플로우 분리)

### Story 독립성 검증
- [ ] 각 Story의 의존성이 최소화됨
- [ ] 의존성이 있는 경우 명확히 문서화됨
- [ ] Story 간 순환 의존성이 없음
- [ ] 각 Story가 독립적으로 테스트 가능함

## 📁 파일 구조 검증

### 파일 생성 완료
- [ ] `epics.md` (전체 개요) 생성됨
- [ ] 각 Epic마다 폴더 생성됨: `epic-N-{name}/`
- [ ] 각 Epic 폴더에 `epic.md` 생성됨
- [ ] 각 Story 파일이 올바른 Epic 폴더에 생성됨: `story-N-{name}.md`

### 파일 명명 규칙
- [ ] Epic 폴더명이 kebab-case임: `epic-1-user-auth`
- [ ] Story 파일명이 kebab-case임: `story-1-login.md`
- [ ] 파일명이 내용을 명확히 반영함
- [ ] 파일명에 특수문자가 없음

### 파일 링크 검증
- [ ] `epics.md`에서 각 Epic 파일로 링크가 올바름
- [ ] 각 `epic.md`에서 Story 파일로 링크가 올바름
- [ ] 각 `story.md`에서 부모 Epic으로 링크가 올바름
- [ ] 모든 상대 경로가 정확함

## 📊 내용 품질 검증

### 완전성 (Completeness)
- [ ] PRD의 모든 기능 요구사항이 Story에 매핑됨
- [ ] UX Design의 모든 화면이 Epic/Story로 커버됨
- [ ] 누락된 기능이나 화면이 없음
- [ ] 각 Story가 PRD 원본 문서를 참조함

### 일관성 (Consistency)
- [ ] Epic과 Story 간 용어 사용이 일관됨
- [ ] 기술 스택 표현이 TRD와 일치함
- [ ] 데이터 모델 이름이 ERD와 일치함
- [ ] UI 컴포넌트 명칭이 Design Guide와 일치함

### 명확성 (Clarity)
- [ ] 각 Epic/Story의 목적이 명확함
- [ ] 사용자 가치가 구체적으로 표현됨
- [ ] 기술 용어가 일관되고 정확함
- [ ] 애매한 표현이나 "등등"이 없음

### 실행 가능성 (Actionability)
- [ ] 각 Story가 즉시 개발 가능한 수준의 상세도를 가짐
- [ ] Acceptance Criteria가 측정 가능함
- [ ] 구현 힌트가 구체적임
- [ ] AI가 Plan 모드에서 계획 수립 가능한 정보가 충분함

## 🎯 브레인스토밍 기준 준수

### Epic 기준
- [ ] ✅ 화면/페이지 단위로 Epic 생성됨
- [ ] ✅ 사용자 플로우 단위로 Epic 그룹화됨
- [ ] ✅ 도메인/기능 묶음으로 보조 Epic 생성됨
- [ ] ✅ 각 Epic이 3-6개 Story 포함
- [ ] ✅ 각 Epic이 완결된 가치 제공

### Story 기준
- [ ] ✅ 사용자 액션 단위로 분해됨
- [ ] ✅ 테스트 가능한 단위임
- [ ] ✅ 독립적으로 완성 가능함
- [ ] ✅ UI + 백엔드 포함됨
- [ ] ✅ "사용자가 ~할 수 있다" 형태임

### 크기 및 조정
- [ ] ✅ 너무 작은 Epic이 합쳐짐 또는 Story로 강등됨
- [ ] ✅ 너무 큰 Epic이 분할됨
- [ ] ✅ 항상 함께 사용되는 기능이 하나의 Story로 합쳐짐
- [ ] ✅ 여러 플로우가 포함된 Story가 쪼개짐

## 🔍 최종 검증

### 통계 검증
- [ ] 총 Epic 수가 프로젝트 규모에 적절함 (보통 5-15개)
- [ ] 총 Story 수가 합리적임 (보통 20-60개)
- [ ] Epic당 평균 Story 수가 3-6 범위임
- [ ] Story 크기 분포가 균형적임

### AI 개발 준비도
- [ ] 각 Story를 Plan 모드로 넘길 수 있음
- [ ] AI가 Story만으로 구현 계획 수립 가능한 정보가 충분함
- [ ] 코드베이스 컨텍스트와 함께 사용 가능함
- [ ] 개발 우선순위가 명확함 (의존성 순서)

### 문서 품질
- [ ] 마크다운 문법이 올바름
- [ ] 링크가 모두 작동함
- [ ] 표, 리스트, 코드 블록이 제대로 렌더링됨
- [ ] 한글과 영문이 적절히 혼용됨

## ✅ 최종 승인

모든 항목이 체크되었다면:

- [ ] **최종 검토 완료**: 모든 체크리스트 항목 통과
- [ ] **AI 개발 준비 완료**: Story를 Plan 모드로 넘길 준비됨
- [ ] **다음 단계 진행 가능**: Sprint Planning 또는 개발 시작 가능

---

## 🚨 발견된 이슈

이슈가 발견된 경우 여기에 기록:

### Epic 관련 이슈
-

### Story 관련 이슈
-

### 파일 구조 이슈
-

### 내용 품질 이슈
-

---

_이 체크리스트를 사용하여 생성된 에픽/스토리의 품질을 보장하세요._
