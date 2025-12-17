# AI Code Technical Debt Resolution - Instructions

<critical>The workflow execution engine is governed by: {project-root}/.anyon/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/.anyon/anyon-method/workflows/resolve-ai-tech-debt/workflow.yaml</critical>
<critical>Communicate in {communication_language} throughout the workflow process</critical>

<workflow>

<step n="0" goal="워크플로우 초기화 및 범위 설정">
<action>사용자에게 인사하고 워크플로우의 목적을 설명:

이 워크플로우는 AI로 생성된 코드의 기술부채를 종합적으로 분석하고 해결합니다:
- 죽은 코드 탐지 및 제거 (미사용 함수, 변수, import)
- 코드 품질 분석 (복잡도, 중복, 코드 스멜)
- 테스트 커버리지 분석 및 개선
- 아키텍처 검토 (결합도, 응집도, 패턴)
- 레거시 코드 식별 및 현대화
</action>

<action>분석 대상 디렉토리 확인:
- 기본값: {target_directory}
- 사용자가 특정 디렉토리나 파일을 지정하면 해당 범위로 제한
- 제외할 패턴: {excluded_patterns}
</action>

<ask>분석할 코드베이스의 경로를 확인해주세요. 기본값({target_directory})을 사용하시겠습니까, 아니면 특정 디렉토리를 지정하시겠습니까?</ask>

<action>프로젝트의 주요 프로그래밍 언어 파악:
- 파일 확장자 분석
- package.json, requirements.txt, go.mod 등 확인
- 언어별 분석 전략 수립
</action>

<template-output>project_overview</template-output>
</step>

<step n="1" goal="코드베이스 스캔 및 베이스라인 측정">
<action>전체 코드베이스 구조 분석:

1. **파일 통계 수집**
   - 총 파일 수, 총 라인 수
   - 언어별 분포
   - 디렉토리 구조 맵핑

2. **현재 상태 베이스라인 설정**
   - 기존 린트 경고/에러 수
   - 테스트 파일 존재 여부
   - 문서화 수준 (주석 비율)

3. **AI 생성 코드 패턴 식별**
   - 반복적인 코드 블록
   - 일관성 없는 명명 규칙
   - 과도한 주석 또는 주석 부재
   - 불필요하게 복잡한 로직
</action>

<action>코드베이스를 스캔하며 다음 정보 수집:
- 모든 함수/메서드 목록
- 모든 클래스/모듈 목록
- import/require 문 목록
- export 문 목록
</action>

<template-output>baseline_metrics</template-output>
</step>

<step n="2" goal="죽은 코드 탐지 (Dead Code Detection)">
<action>미사용 코드 체계적 탐지:

**2a. 미사용 Import/Require 분석**
- import 되었지만 사용되지 않는 모듈
- 부분 import 중 사용되지 않는 항목
- 순환 import 탐지

**2b. 미사용 함수/메서드 탐지**
- 정의되었지만 호출되지 않는 함수
- export 되었지만 외부에서 사용되지 않는 함수
- private 메서드 중 내부에서도 사용되지 않는 것

**2c. 미사용 변수/상수 탐지**
- 선언 후 사용되지 않는 변수
- 할당 후 읽히지 않는 변수
- 미사용 매개변수

**2d. 미사용 클래스/타입 탐지**
- 정의되었지만 인스턴스화되지 않는 클래스
- 사용되지 않는 타입 정의
- 빈 인터페이스/추상 클래스
</action>

<action>각 발견 항목에 대해 기록:
- 파일 경로 및 라인 번호
- 코드 스니펫
- 제거 권장 이유
- 제거 시 영향도 (low/medium/high)
</action>

<template-output>dead_code_analysis</template-output>
</step>

<step n="3" goal="코드 품질 분석">
<action>코드 품질 지표 분석:

**3a. 코드 복잡도 분석**
- 순환 복잡도(Cyclomatic Complexity) 측정
- 함수당 라인 수 (권장: 20줄 이하)
- 중첩 깊이 (권장: 3레벨 이하)
- 매개변수 수 (권장: 4개 이하)

**3b. 코드 중복 탐지**
- 5줄 이상의 동일/유사 코드 블록
- 복사-붙여넣기 패턴
- 추상화 가능한 반복 로직

**3c. 코드 스멜 탐지**
- Long Method: 너무 긴 함수
- Large Class: 너무 많은 책임을 가진 클래스
- Feature Envy: 다른 클래스의 데이터를 과도하게 사용
- Data Clumps: 항상 함께 다니는 데이터 그룹
- Primitive Obsession: 원시 타입 과용
- Switch Statements: 복잡한 switch/if-else 체인

**3d. 명명 규칙 검토**
- 일관된 명명 규칙 사용 여부
- 의미 있는 변수/함수 이름
- 축약어 남용 여부
- 언어별 컨벤션 준수
</action>

<action>각 이슈에 대해 심각도 분류:
- Critical: 즉시 수정 필요
- Major: 가능한 빨리 수정
- Minor: 시간 있을 때 수정
- Info: 개선 권장사항
</action>

<template-output>code_quality_analysis</template-output>
</step>

<step n="4" goal="테스트 커버리지 분석">
<action>테스트 현황 분석:

**4a. 테스트 파일 존재 여부**
- 테스트 디렉토리 구조 확인
- 테스트 파일과 소스 파일 매핑
- 테스트 프레임워크 식별

**4b. 커버리지 측정** (가능한 경우)
- 라인 커버리지
- 브랜치 커버리지
- 함수 커버리지

**4c. 테스트 부재 영역 식별**
- 테스트가 없는 핵심 함수/클래스
- 복잡도 높은데 테스트 없는 코드
- 에러 핸들링 로직 테스트 여부
- 엣지 케이스 커버리지

**4d. 테스트 품질 평가**
- 의미 있는 assertion 사용
- 테스트 독립성
- 테스트 명명 규칙
- 모킹 적절성
</action>

<action>테스트 우선순위 제안:
- 비즈니스 로직 핵심 함수
- 복잡도 높은 함수
- 버그 발생 이력 있는 영역
- 자주 변경되는 코드
</action>

<template-output>test_coverage_analysis</template-output>
</step>

<step n="5" goal="아키텍처 검토">
<action>아키텍처 품질 분석:

**5a. 의존성 분석**
- 모듈 간 의존성 그래프
- 순환 의존성 탐지
- 불필요한 의존성 식별
- 의존성 방향 검증 (저수준 → 고수준 참조 탐지)

**5b. 결합도/응집도 평가**
- 클래스/모듈 간 결합도 측정
- 단일 책임 원칙 준수 여부
- 인터페이스 분리 원칙 검토

**5c. 패턴 일관성 검토**
- 사용 중인 디자인 패턴 식별
- 패턴의 일관된 적용 여부
- 안티패턴 탐지
  - God Object
  - Spaghetti Code
  - Golden Hammer
  - Copy-Paste Programming

**5d. 레이어 분리 검증**
- 프레젠테이션/비즈니스/데이터 레이어 분리
- 레이어 간 올바른 통신
- 횡단 관심사(로깅, 인증 등) 처리
</action>

<action>아키텍처 다이어그램 생성 (텍스트 기반):
- 모듈 의존성 그래프
- 레이어 구조
- 주요 컴포넌트 관계
</action>

<template-output>architecture_analysis</template-output>
</step>

<step n="6" goal="레거시 코드 식별">
<action>구버전/deprecated 코드 탐지:

**6a. Deprecated API 사용**
- 언어/프레임워크의 deprecated 기능 사용
- 구버전 라이브러리 의존성
- 곧 지원 중단 예정인 기능

**6b. 구식 패턴**
- 콜백 지옥 (Promise/async-await 미사용)
- var 대신 let/const 미사용 (JavaScript)
- 구식 문법 사용
- 레거시 API 호출 방식

**6c. 보안 취약점**
- 알려진 취약점 있는 의존성
- 안전하지 않은 함수 사용
- 하드코딩된 비밀정보
- SQL 인젝션/XSS 취약 패턴

**6d. 성능 이슈**
- N+1 쿼리 패턴
- 불필요한 동기 처리
- 메모리 누수 패턴
- 비효율적인 알고리즘
</action>

<action>각 레거시 코드에 대해:
- 현재 코드 스니펫
- 권장 현대화 방안
- 마이그레이션 복잡도
</action>

<template-output>legacy_code_analysis</template-output>
</step>

<step n="7" goal="데이터베이스 기술부채 분석">
<action>DB 관련 파일 및 설정 탐지:
- ORM 설정 파일 (prisma/schema.prisma, models.py, entities/*.ts 등)
- 마이그레이션 파일
- 데이터베이스 연결 설정
- 쿼리 파일 및 Repository 패턴
</action>

<action>스키마 기술부채 분석:

**7a. 미사용 테이블/컬럼 탐지**
- 스키마에 정의되었지만 코드에서 참조되지 않는 테이블
- 모델에 정의되었지만 사용되지 않는 컬럼
- 주석 처리된 스키마 정의

**7b. 인덱스 최적화 분석**
- 인덱스가 없는 외래키 컬럼
- 자주 쿼리되는 컬럼의 인덱스 부재
- 중복/불필요한 인덱스
- 복합 인덱스 최적화 기회

**7c. 정규화/비정규화 문제**
- 반복되는 데이터 그룹 (1NF 위반)
- 부분 함수 종속성 (2NF 위반)
- 이행적 종속성 (3NF 위반)
- 과도한 정규화로 인한 성능 이슈

**7d. 제약조건 검토**
- 누락된 외래키 제약조건
- NOT NULL 제약조건 일관성
- UNIQUE 제약조건 누락
- CHECK 제약조건 부재
- 기본값 설정 검토
</action>

<action>쿼리 기술부채 분석:

**7e. N+1 쿼리 문제 탐지**
- 루프 내 개별 쿼리 실행 패턴
- Eager loading 누락
- 관계 데이터 개별 조회

**7f. 비효율적 쿼리 탐지**
- SELECT * 사용
- 인덱스를 타지 않는 WHERE 절
- 불필요한 서브쿼리
- LIKE '%keyword%' 패턴
- 대량 데이터 ORDER BY

**7g. Raw SQL/ORM 혼용 문제**
- 일관성 없는 쿼리 작성 방식
- ORM으로 대체 가능한 Raw SQL
- SQL 인젝션 취약 Raw SQL
- 하드코딩된 SQL 문자열
</action>

<action>마이그레이션 기술부채 분석:

**7h. 마이그레이션 상태 검사**
- 적용되지 않은 마이그레이션
- 스키마와 마이그레이션 불일치
- 마이그레이션 파일 누락/손상
- 마이그레이션 히스토리 정합성

**7i. 마이그레이션 품질 검토**
- 롤백 불가능한 마이그레이션 (destructive)
- 대용량 테이블 ALTER 위험
- 트랜잭션 없는 마이그레이션
- 데이터 마이그레이션 로직 검토
</action>

<action>ORM/모델 기술부채 분석:

**7j. 미사용 모델 탐지**
- 정의되었지만 사용되지 않는 모델/엔티티
- 사용되지 않는 관계 정의
- 레거시 모델 (새 버전으로 대체됨)

**7k. 관계 정의 문제**
- 누락된 관계 정의
- 잘못된 관계 타입 (1:N을 N:M으로 등)
- 양방향 관계 불일치
- Cascade 설정 검토

**7l. 유효성 검증 누락**
- 모델 레벨 검증 부재
- 데이터 타입 불일치
- 필수 필드 검증 누락
- 비즈니스 규칙 검증 부재

**7m. Loading 전략 문제**
- Lazy loading으로 인한 N+1
- 과도한 Eager loading
- 순환 참조 로딩 문제
</action>

<action>데이터 무결성 분석:

**7n. 고아 레코드 탐지**
- FK 없이 참조 무결성 깨진 레코드
- 삭제된 부모의 자식 레코드
- 정리되지 않은 임시 데이터

**7o. 중복 데이터 탐지**
- 동일/유사 데이터 중복
- UNIQUE 제약 없는 중복 가능 컬럼
- 정규화 부재로 인한 데이터 중복

**7p. NULL 처리 일관성**
- NULL과 빈 문자열 혼용
- NULL 가능 컬럼의 일관성 없는 처리
- COALESCE/IFNULL 누락
</action>

<action>각 DB 이슈에 대해 기록:
- 파일/테이블/컬럼 위치
- 이슈 유형 및 설명
- 영향 범위 (성능/무결성/유지보수)
- 수정 권장 사항
- 수정 복잡도 (low/medium/high)
</action>

<template-output>database_analysis</template-output>
</step>

<step n="8" goal="우선순위화 및 수정 계획 수립">
<action>발견된 모든 이슈 종합 및 우선순위화:

**우선순위 매트릭스 적용**
- 영향도 (Impact): 시스템에 미치는 영향
- 긴급도 (Urgency): 수정의 시급성
- 노력 (Effort): 수정에 필요한 작업량

**우선순위 카테고리**
1. **P0 - 즉시 수정**: 보안 취약점, 크리티컬 버그
2. **P1 - 높음**: 주요 코드 스멜, 아키텍처 이슈
3. **P2 - 중간**: 테스트 부재, 중복 코드
4. **P3 - 낮음**: 명명 규칙, 스타일 이슈
</action>

<action>단계별 수정 계획 수립:

**Phase 1: 빠른 승리 (Quick Wins)**
- 미사용 import 제거
- 미사용 변수 제거
- 간단한 명명 수정

**Phase 2: 죽은 코드 제거**
- 미사용 함수 제거
- 미사용 클래스 제거
- 주석 처리된 코드 정리

**Phase 3: 코드 품질 개선**
- 복잡한 함수 분리
- 중복 코드 추상화
- 코드 스멜 수정

**Phase 4: 테스트 보강**
- 핵심 함수 단위 테스트 추가
- 통합 테스트 보강
- 엣지 케이스 커버리지

**Phase 5: 아키텍처 개선**
- 순환 의존성 해소
- 레이어 분리 강화
- 패턴 일관성 확보

**Phase 6: 현대화**
- Deprecated API 교체
- 최신 패턴 적용
- 의존성 업데이트
</action>

<template-output>remediation_plan</template-output>
</step>

<step n="9" goal="수정 실행 및 검증">
<ask>이제 수정을 시작하시겠습니까?

옵션:
1. **자동 수정**: 안전한 수정 사항을 자동으로 적용 (미사용 import, 변수 등)
2. **대화형 수정**: 각 수정 사항을 하나씩 확인하며 적용
3. **보고서만**: 수정 없이 분석 보고서만 생성
4. **특정 Phase만**: 특정 단계의 수정만 진행

어떻게 진행하시겠습니까?</ask>

<check if="사용자가 수정 진행 선택">
<action>선택된 수정 작업 실행:

각 수정에 대해:
1. 수정 전 코드 백업/기록
2. 수정 적용
3. 구문 오류 없음 확인
4. 관련 테스트 실행 (있는 경우)
5. 수정 로그 기록
</action>

<action>수정 완료 후 검증:
- 빌드 성공 여부
- 테스트 통과 여부
- 린트 경고 감소 확인
- 베이스라인 대비 개선 수치
</action>
</check>

<action>최종 보고서 생성:
- 수정 전/후 비교
- 해결된 이슈 목록
- 남은 이슈 목록
- 권장 후속 조치
</action>

<template-output>execution_summary</template-output>
</step>

<step n="10" goal="최종 보고서 저장 및 워크플로우 완료">
<action>분석 보고서를 {default_output_file}에 저장</action>

<action if="수정이 진행된 경우">수정 로그를 {remediation_log_file}에 저장</action>

<action>사용자에게 완료 요약 제공:

**워크플로우 완료 요약**
- 분석된 파일 수
- 발견된 총 이슈 수
- 해결된 이슈 수
- 남은 이슈 수
- 보고서 저장 위치

**권장 후속 조치**
- 정기적인 코드 리뷰 일정 수립
- CI/CD에 린트 검사 통합
- 코드 품질 메트릭 모니터링 설정
</action>
</step>

</workflow>
