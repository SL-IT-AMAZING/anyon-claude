# Development (개발) 워크플로우

## 개요

개발 워크플로우는 기획 문서를 바탕으로 실제 코드를 작성하는 단계입니다. 4개의 하위 워크플로우가 순차적으로 실행되며, 일부는 자동으로 반복됩니다.

## 워크플로우 구조

```
pm-opensource → pm-orchestrator → pm-executor ↔ pm-reviewer
                                      ↑__________________|
                                      (자동 반복)
```

---

## 1. PM Opensource (오픈소스 클론)

### 파일 위치
- **프롬프트 파일**: `src/constants/workflows/development/pm-opensource.ts`

### 목적
기획 단계에서 선정한 오픈소스 라이브러리들을 프로젝트에 클론(복제)합니다.

### 진행 과정

1. **문서 읽기**
   - `anyon-docs/planning/open-source.md` 파일 확인
   - 클론할 저장소 목록 파악

2. **저장소 클론**
   - 각 저장소를 지정된 경로에 클론
   - Git 명령어 실행: `git clone [URL] [경로]`

3. **문서 업데이트**
   - 클론 완료된 경로를 문서에 기록
   - 실패한 경우 에러 기록

### 출력
- 클론된 오픈소스 코드들
- 업데이트된 `open-source.md`

---

## 2. PM Orchestrator (오케스트레이터)

### 파일 위치
- **프롬프트 파일**: `src/constants/workflows/development/pm-orchestrator.ts`

### 목적
기획 문서를 분석하여 개발 티켓(작업 단위)과 실행 계획을 생성합니다.

### 진행 과정

1. **문서 분석**
   - 6개 기획 문서 전체 읽기
   - 필요한 기능과 작업 파악

2. **티켓 생성**
   - 기능별로 개발 티켓 작성
   - 우선순위 설정
   - 의존성 관계 정리

3. **실행 계획 수립**
   - Wave(단계) 구성
   - 병렬 실행 가능한 작업 그룹화
   - 의존성 그래프 생성

4. **에이전트 할당**
   - 각 티켓에 적합한 작업자 할당
   - 작업 순서 최적화

### 출력
- 티켓 목록 (`anyon-docs/tickets/`)
- 실행 계획 문서

---

## 3. PM Executor (실행자)

### 파일 위치
- **프롬프트 파일**: `src/constants/workflows/development/pm-executor.ts`

### 목적
오케스트레이터가 생성한 티켓을 순서대로 실행하여 실제 코드를 작성합니다.

### 진행 과정

1. **티켓 읽기**
   - 다음 실행할 티켓 확인
   - 요구사항 파악

2. **코드 작성**
   - 기능 구현
   - 테스트 코드 작성 (필요시)
   - 파일 생성/수정

3. **완료 처리**
   - 티켓 상태 업데이트
   - 구현 내용 기록

4. **다음 작업으로 이동**
   - 다음 티켓 실행
   - 또는 리뷰 요청

### 자동 순환 로직
```
실행 완료 → pm-reviewer로 이동
리뷰 통과 → 다음 티켓 실행
리뷰 실패 → 수정 후 재실행
```

---

## 4. PM Reviewer (리뷰어)

### 파일 위치
- **프롬프트 파일**: `src/constants/workflows/development/pm-reviewer.ts`

### 목적
PM Executor가 작성한 코드를 검토하고, 문제가 있으면 수정합니다.

### 진행 과정

1. **코드 검토**
   - 최근 변경사항 확인
   - 코드 품질 평가
   - 버그 확인

2. **테스트 실행**
   - 유닛 테스트 실행
   - 빌드 확인
   - 린트 검사

3. **피드백 제공**
   - 수정 필요사항 기록
   - 또는 승인 처리

4. **수정 작업**
   - 문제 발견 시 직접 수정
   - 심각한 문제는 Executor에게 반환

### 완료 조건
- `DEVELOPMENT_COMPLETE.md` 파일이 생성되면 전체 개발 완료
- 모든 티켓 처리 + 테스트 통과 시 생성

---

## 자동 순환 상세 설명

### 순환 흐름
```
[pm-executor] 코드 작성 완료
      ↓
[pm-reviewer] 코드 리뷰
      ↓
   ┌─ 통과 → 다음 티켓이 있으면 [pm-executor]로
   │         없으면 DEVELOPMENT_COMPLETE.md 생성
   └─ 실패 → 수정 후 다시 [pm-reviewer]로
```

### 완료 감지 로직
```typescript
// development.ts에서 발췌
const completePath = 'anyon-docs/DEVELOPMENT_COMPLETE.md';
const exists = await checkFileExists(completePath);

if (exists) {
  // 개발 완료!
  return 'completed';
} else {
  // 다음 단계로 이동
  return getNextStep(currentStep);
}
```

---

## 출력물 요약

| 워크플로우 | 주요 출력물 |
|------------|-------------|
| pm-opensource | 클론된 오픈소스 코드 |
| pm-orchestrator | 티켓 목록, 실행 계획 |
| pm-executor | 실제 소스 코드 |
| pm-reviewer | 검토 보고서, 수정된 코드 |

---

## 핵심 개념 설명

### 티켓 (Ticket)
하나의 작업 단위입니다. "로그인 기능 구현" 같은 구체적인 작업을 말합니다.

### Wave
동시에 실행할 수 있는 티켓들의 그룹입니다. 의존성이 없는 작업들은 같은 Wave에 배치됩니다.

### 의존성 (Dependency)
작업 간의 선후 관계입니다. "DB 설정"이 완료되어야 "사용자 기능"을 만들 수 있는 것처럼요.

### CI/CD
코드 변경 시 자동으로 테스트하고 배포하는 시스템입니다.
- CI (Continuous Integration): 지속적 통합
- CD (Continuous Deployment): 지속적 배포

---

## 개발 완료 후

`DEVELOPMENT_COMPLETE.md` 파일이 생성되면:
1. 모든 기능 구현 완료
2. 테스트 통과
3. 프리뷰 탭에서 결과물 확인 가능

축하합니다! MVP가 완성되었습니다! 🎉
