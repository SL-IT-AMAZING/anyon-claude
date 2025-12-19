# MVP 탭 전체 구조 설명

## 개요

MVP 탭은 비개발자 창업자가 아이디어를 실제 소프트웨어로 만들기까지의 전체 과정을 안내하는 워크스페이스입니다.

## 탭 구성

MVP 탭은 3개의 하위 탭으로 구성되어 있습니다:

### 1. 기획문서 (Planning) 탭
- **목적**: 아이디어를 구체적인 기획 문서로 정리
- **워크플로우**: 6단계 순차 진행
- **결과물**: `anyon-docs/planning/` 폴더에 6개의 문서 생성

### 2. 개발문서 (Development) 탭
- **목적**: 기획 문서를 바탕으로 실제 개발 진행
- **워크플로우**: 4단계 자동 순환
- **결과물**: 실제 코드와 개발 관련 문서들

### 3. 프리뷰 (Preview) 탭
- **목적**: 개발된 결과물을 미리보기
- **기능**: 웹 프리뷰 제공

---

## 기획문서 워크플로우 (6단계)

```
PRD → UX Design → Design Guide → TRD → Architecture → ERD
```

| 단계 | 이름 | 설명 | 출력 파일 |
|------|------|------|-----------|
| 1 | PRD | 제품 요구사항 정의 | prd.md |
| 2 | UX Design | 사용자 경험 설계 | ux-design.md |
| 3 | Design Guide | UI 디자인 가이드 | design-guide.md |
| 4 | TRD | 기술 요구사항 정의 | trd.md |
| 5 | Architecture | 시스템 아키텍처 설계 | architecture.md |
| 6 | ERD | 데이터베이스 설계 | erd.md |

### 진행 방식
1. 사용자가 "시작하기" 버튼 클릭
2. AI가 질문을 던지고 사용자가 답변
3. AI가 답변을 바탕으로 문서 작성
4. 문서 완성 후 다음 단계로 자동 이동
5. 6단계 완료 시 전체 기획 완료

### 이전 문서 참조
각 단계는 이전 단계에서 작성된 문서를 참조합니다:
- UX Design → PRD 참조
- Design Guide → PRD, UX Design 참조
- TRD → PRD, UX Design, Design Guide 참조
- Architecture → 모든 이전 문서 참조
- ERD → 모든 이전 문서 참조

---

## 개발문서 워크플로우 (4단계)

```
pm-opensource → pm-orchestrator → pm-executor ↔ pm-reviewer
                                      ↑__________________|
                                      (반복)
```

| 단계 | 이름 | 설명 |
|------|------|------|
| 1 | PM Opensource | 필요한 오픈소스 라이브러리 클론 |
| 2 | PM Orchestrator | 티켓과 실행 계획 생성 |
| 3 | PM Executor | 실제 코드 구현 |
| 4 | PM Reviewer | 코드 리뷰 및 검증 |

### 자동 순환 로직
- PM Executor와 PM Reviewer는 자동으로 반복됩니다
- `DEVELOPMENT_COMPLETE.md` 파일이 생성되면 개발 완료
- 완료될 때까지 구현 → 리뷰 → 수정 → 리뷰 사이클 반복

---

## 기술 구현 요약

### 핵심 파일 위치
- 메인 컴포넌트: `src/components/MvpWorkspace.tsx`
- 기획 워크플로우 정의: `src/constants/planning.ts`
- 개발 워크플로우 정의: `src/constants/development.ts`
- 각 워크플로우 프롬프트: `src/constants/workflows/` 폴더

### 워크플로우 실행 원리
1. 사용자가 워크플로우 시작
2. 해당 단계의 프롬프트가 Claude에게 전달됨
3. Claude가 프롬프트에 따라 대화 진행
4. 결과물을 파일로 저장
5. 다음 단계로 이동

---

## 관련 문서

- [01-prd-workflow.md](./01-prd-workflow.md) - PRD 워크플로우 상세
- [02-ux-design-workflow.md](./02-ux-design-workflow.md) - UX Design 워크플로우 상세
- [03-design-guide-workflow.md](./03-design-guide-workflow.md) - Design Guide 워크플로우 상세
- [04-trd-workflow.md](./04-trd-workflow.md) - TRD 워크플로우 상세
- [05-architecture-workflow.md](./05-architecture-workflow.md) - Architecture 워크플로우 상세
- [06-erd-workflow.md](./06-erd-workflow.md) - ERD 워크플로우 상세
- [07-development-workflow.md](./07-development-workflow.md) - 개발 워크플로우 상세
