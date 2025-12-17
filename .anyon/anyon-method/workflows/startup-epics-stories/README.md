# Startup Epics & Stories Generator

스타트업 런치패드 워크플로우에서 생성된 6개 문서를 분석하여 전체 프로젝트의 에픽과 스토리를 자동 생성하는 워크플로우입니다.

## 📋 개요

이 워크플로우는 완전 자동화된 방식으로 스타트업 런치패드의 출력물을 개발 가능한 에픽과 스토리로 분해합니다.

### 입력
스타트업 런치패드 워크플로우에서 생성된 6개 문서 (모두 필수):
1. **PRD** - Product Requirements Document
2. **UX Design** - UX Design Specification
3. **Design Guide** - Design Guide with UI components
4. **TRD** - Technical Requirements Document
5. **Architecture** - Architecture Document
6. **ERD** - Entity Relationship Diagram

### 출력
에픽별 서브폴더 구조:
```
docs/
  epics.md                          # 전체 개요
  epics/
    epic-1-{name}/
      epic.md                       # 에픽 상세
      story-1-{name}.md             # 스토리들
      story-2-{name}.md
      ...
    epic-2-{name}/
      epic.md
      story-1-{name}.md
      ...
```

## 🎯 분해 기준

### Epic 기준 (우선순위 순)
1. **화면/페이지 단위** - 주요 화면이나 페이지가 Epic이 됨
2. **사용자 플로우 단위** - 유저 플로우의 큰 단계
3. **도메인/기능 묶음** - 여러 화면에 걸쳐있지만 관련된 기능

**크기**: 각 Epic은 3-6개의 Story를 포함

### Story 기준
- **사용자 액션 단위**: 사용자가 수행하는 하나의 의미 있는 행동
- **테스트 가능 단위**: 기획자가 직접 테스트 가능
- **독립적 완성**: 다른 Story 없이도 기능 동작
- **완전한 기능**: UI + 백엔드 포함
- **형식**: "사용자가 ~할 수 있다"

## 🚀 사용 방법

### 슬래시 커맨드로 실행
```
/startup-epics-stories
```

### 전체 프로세스
1. **스타트업 런치패드 워크플로우 실행**
   - 6개 문서 생성 (PRD, UX Design, Design Guide, TRD, Architecture, ERD)

2. **Epics & Stories 생성 워크플로우 실행**
   ```
   /startup-epics-stories
   ```
   - 자동으로 6개 문서 로드
   - 에픽/스토리 분해 기준 적용
   - 파일 자동 생성

3. **생성된 파일 확인**
   - `docs/epics.md` - 전체 개요 확인
   - `docs/epics/epic-N-{name}/epic.md` - 각 에픽 검토
   - 개별 스토리 파일 확인

4. **AI 개발 진행**
   - 각 스토리를 Plan 모드로 넘김
   - AI가 구현 계획 수립
   - AI가 자동 개발 진행

## 🔧 워크플로우 특징

### 완전 자동화
- 사용자 대화 없이 자동 실행
- 슬래시 커맨드 한 번으로 완료
- 수백 개 파일도 자동 생성

### 지능형 분석
- UX Design 우선 분석 (화면/플로우)
- PRD 기능 매핑
- 보조 문서로 상세 정보 추가

### 품질 검증
- Epic 크기 자동 검증 (3-6 stories)
- 너무 크거나 작은 Epic 자동 조정
- Story 독립성 및 테스트 가능성 검증

### AI 개발 최적화
- 각 Story가 AI Plan+Dev 사이클에 최적화됨
- 충분한 기술 정보 포함
- 명확한 Acceptance Criteria

## 📂 파일 구조

```
.anyon/anyon-method/workflows/startup-epics-stories/
├── workflow.yaml       # 워크플로우 설정
├── instructions.md     # 실행 로직
├── template.md         # 출력 템플릿
├── checklist.md        # 검증 체크리스트
└── README.md           # 이 파일
```

## ✅ 검증

생성 후 `checklist.md`를 사용하여 품질 검증:
- Epic 구조 검증
- Story 품질 검증
- 파일 구조 검증
- 내용 완성도 검증

## 🎓 사용 예시

### 예시 1: SaaS 프로젝트 관리 도구
**입력**: 스타트업 런치패드 6개 문서
**출력**:
- Epic 1: 프로젝트 목록 화면 (5 stories)
- Epic 2: 칸반보드 화면 (6 stories)
- Epic 3: 사용자 인증 (4 stories)
- Epic 4: 설정 페이지 (3 stories)
- ...

### 예시 2: 전자상거래 플랫폼
**입력**: 스타트업 런치패드 6개 문서
**출력**:
- Epic 1: 상품 목록 및 검색 (5 stories)
- Epic 2: 장바구니 시스템 (4 stories)
- Epic 3: 결제 플로우 (6 stories)
- Epic 4: 주문 관리 (5 stories)
- ...

## 🔗 관련 워크플로우

- **스타트업 런치패드**: 6개 문서 생성 (이 워크플로우의 입력)
- **Sprint Planning**: 생성된 에픽/스토리로 스프린트 계획
- **Dev Story**: 개별 스토리 구현
- **Code Review**: 완료된 스토리 리뷰

## 📝 주의사항

- 6개 문서가 모두 있어야 실행 가능
- 스타트업 런치패드 완료 후 즉시 실행 권장
- 생성된 에픽/스토리는 수정 가능 (필요시)
- 개발 시간 추정 없음 (AI가 자동 개발)

## 🤝 기여

이 워크플로우는 ANYON Method (BMM)의 일부입니다.
개선 제안이나 이슈는 프로젝트 저장소에 제출해주세요.

---

**Version**: 1.0.0
**Author**: Anyon
**Created**: 2025-11-22
**Module**: ANYON Method (BMM)
