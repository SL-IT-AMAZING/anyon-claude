# Story Review Workflow Instructions

<critical>The workflow execution engine is governed by: {project-root}/.anyon/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/.anyon/custom/workflows/story-review/workflow.yaml</critical>
<critical>Communicate in {communication_language} throughout the workflow process</critical>

<workflow>

<step n="0" goal="문서 로딩 및 경로 확인">
<action>사용자로부터 스토리 계획서 경로를 프롬프트로 받음</action>
<action>경로 예시: anyon-docs/epics/epic-1-사용자-인증/story-1-회원가입-plan.md</action>

<action>스토리 계획서 파일 로드 (전체 내용)</action>
<action>계획서 경로에서 Epic 폴더 경로 추출</action>
<action>같은 Epic 폴더 내의 다른 스토리 파일들 목록 로드 (범위 판단용)</action>
<action>Epic 문서 (epic.md) 로드</action>

<action>리뷰 결과 파일 경로 결정:
- 계획서: story-1-회원가입-plan.md
- 리뷰: story-1-회원가입-review.md (같은 폴더)
</action>

<check if="계획서 파일을 찾을 수 없음">
  <action>에러 메시지 출력: "스토리 계획서를 찾을 수 없습니다. 경로를 확인해주세요."</action>
  <action>워크플로우 종료</action>
</check>

<action>로드한 문서 요약 출력:
- 스토리 계획서: [파일명]
- Epic: [Epic 이름]
- 같은 Epic 내 다른 스토리: [목록]
</action>
</step>

<step n="1" goal="코드베이스 분석">
<action>스토리 계획서에서 구현해야 할 항목들 추출:
- UI/컴포넌트 목록
- API 엔드포인트 목록
- DB 스키마/마이그레이션
- State 관리
- 기타 구현 항목
</action>

<action>프로젝트 코드베이스에서 해당 구현 찾기:
- 계획서에 명시된 파일 경로 확인
- 실제 구현된 코드 존재 여부 확인
- 구현 상태 파악 (완료/부분/미구현)
</action>

<action>코드 분석 수행:
- 아키텍처 패턴 준수 여부
- 코드 퀄리티 (가독성, 중복, 컨벤션)
- 에러 핸들링 상태
- 테스트 존재 여부
</action>

<action>분석 결과 요약 출력</action>
</step>

<step n="2" goal="AI 리뷰 수행">
<action>AI 코드 리뷰 수행:

**1. 구현 완성도**
- 계획서 대비 구현된 항목 체크
- 누락된 기능 식별
- 부분 구현된 기능 식별

**2. 코드 퀄리티**
- 코딩 컨벤션 준수
- 코드 가독성
- 중복 코드 여부
- 적절한 주석/문서화

**3. 아키텍처**
- 설계 원칙 준수
- 컴포넌트 구조
- 의존성 관리

**4. 에러 가능성**
- 잠재적 버그
- 예외 처리 누락
- 엣지 케이스 미처리

**5. 보안/성능** (해당 시)
- 보안 취약점
- 성능 이슈
</action>

<action>발견된 이슈 목록 생성:
각 이슈에 대해:
- 이슈 위치 (파일:라인)
- 이슈 유형 (버그/퀄리티/보안/성능)
- 심각도 (높음/중간/낮음)
- 설명
- 수정 방법
</action>

<action>리뷰 결과 요약 출력</action>
</step>

<step n="3" goal="AI 자동 개선">
<critical>발견된 이슈들을 AI가 먼저 자동으로 수정합니다</critical>

<action>발견된 이슈들을 심각도 순으로 정렬</action>

<action>각 이슈에 대해 자동 수정 수행:

**자동 수정 대상:**
- 에러 핸들링 누락 → 추가
- 타입 오류 → 수정
- 코딩 컨벤션 위반 → 수정
- 예외 처리 누락 → 추가
- 잠재적 버그 → 수정
- 보안 취약점 → 수정

**수정 프로세스:**
1. 이슈 분석
2. 수정 코드 작성
3. 코드 적용
4. 수정 내역 기록
</action>

<action>수정 결과 출력:

"🔧 AI 자동 개선 완료

**수정된 이슈:**
| # | 파일 | 이슈 | 수정 내용 |
|---|------|------|----------|
| 1 | SignupForm.tsx:42 | 에러 핸들링 누락 | try-catch 추가 |
| 2 | useAuth.ts:28 | 타입 any 사용 | 구체적 타입 정의 |
| ... | ... | ... | ... |

**총 [N]개 이슈 중 [M]개 자동 수정 완료**

수정하지 못한 이슈가 있다면 사용자 확인이 필요합니다."
</action>

<check if="자동 수정 불가한 이슈 존재">
  <action>수정 불가 이슈 안내:
  "다음 이슈는 자동 수정이 어려워 수동 확인이 필요합니다:
  - [이슈 설명]
  - 권장 조치: [조치 방법]"
  </action>
</check>
</step>

<step n="4" goal="비개발자용 체크리스트 생성 및 제공">
<action>비개발자용 수동 점검 체크리스트 생성:

각 체크 항목은 다음 형식으로:
- [ ] **[항목명]**: [구체적인 확인 방법]
  - 예상 결과: [정상 동작 시 결과]
  - 확인 방법: [단계별 설명]

카테고리:
1. **기능 동작 확인** - 핵심 기능이 작동하는지
2. **에러 확인** - 에러가 발생하지 않는지
3. **UI 확인** - 화면이 정상적으로 보이는지
</action>

<action>리뷰 결과 문서 생성 (template.md 사용)
- AI 리뷰 결과
- 자동 수정 내역
- 비개발자용 체크리스트 포함
</action>
<template-output>review_content</template-output>
</step>

<step n="5" goal="인터랙티브 디버깅 루프" repeat="until-user-completes">
<action>사용자에게 안내:

"AI 자동 개선이 완료되었습니다. 이제 직접 테스트해주세요.

**진행 방법:**
1. 화면을 열고 각 체크리스트 항목을 직접 테스트하세요
2. 에러가 발생하면 에러 메시지를 복사해서 여기에 붙여넣으세요
3. 기능 수정/추가가 필요하면 요청해주세요
4. 모든 항목 확인이 끝나면 '완료'라고 입력하세요

**입력 가능한 것들:**
- 에러 메시지 붙여넣기 → 디버깅 진행
- 기능 수정/추가 요청 → 범위 확인 후 진행
- '완료' → 리뷰 종료"
</action>

<action>사용자 입력 대기</action>

<check if="사용자 입력이 에러 메시지">
  <action>에러 분석 수행:
  - 에러 메시지 파싱
  - 관련 코드 찾기
  - 원인 분석
  - 수정 방법 제시
  </action>
  <action>수정 코드 작성 및 적용</action>
  <action>수정 결과 설명</action>
  <action>다시 테스트 요청</action>
</check>

<check if="사용자 입력이 기능 요청">
  <action>범위 판단 수행:

  **판단 기준:**
  1. 현재 스토리 계획서에 포함된 기능인가?
  2. 같은 Epic 내 다른 스토리에 해당하는 기능인가?
  3. 완전히 새로운 기능인가?
  </action>

  <check if="현재 스토리 범위 내">
    <action>요청 수행</action>
    <action>변경 사항 설명</action>
  </check>

  <check if="다른 스토리 범위">
    <action>안내: "이 기능은 [Story-X: 스토리명]에서 구현할 기능입니다. 해당 스토리 작업 시 구현하시는 것이 좋습니다."</action>
    <ask>그래도 지금 구현할까요? (y/n)</ask>
    <check if="y">
      <action>경고: "계획서와 달라지게 됩니다."</action>
      <ask>계획서를 수정하고 진행할까요, 아니면 그냥 진행할까요?
      1. 계획서 수정 후 진행
      2. 계획서 수정 없이 진행
      3. 취소</ask>
    </check>
  </check>

  <check if="완전히 새로운 기능">
    <action>안내: "이 기능은 현재 계획된 어떤 스토리에도 포함되지 않는 새로운 기능입니다."</action>
    <ask>어떻게 진행할까요?
    1. 현재 스토리 계획서에 추가하고 구현
    2. 새로운 스토리로 만들기 (나중에 구현)
    3. 취소</ask>
  </check>
</check>

<check if="사용자 입력이 '완료'">
  <action>Step 6으로 이동</action>
</check>
</step>

<step n="6" goal="완료 및 저장">
<action>리뷰 결과 문서 최종 업데이트:
- AI 리뷰 결과
- AI 자동 수정 내역
- 사용자 테스트 중 발견된 이슈 및 수정 내역
- 체크리스트 완료 상태 반영
- 범위 외 요청 및 처리 결과 기록
</action>

<action>리뷰 결과 파일 저장: {{review_output_path}}</action>

<action>완료 요약 출력:

"✅ 스토리 리뷰 완료

**AI 자동 개선:**
- 발견된 이슈: [N]개
- 자동 수정: [M]개

**사용자 테스트:**
- 추가 발견 이슈: [X]개
- 추가 수정: [Y]개

**체크리스트 결과:**
- 총 항목: [X]개
- 완료: [Y]개
- 미완료: [Z]개

**리뷰 파일 저장 위치:**
{{review_output_path}}

**다음 단계:**
- 미완료 항목이 있다면 추가 작업 필요
- 다음 스토리로 진행"
</action>
</step>

</workflow>
