# AI 코드 기술부채 분석 보고서

**프로젝트:** {{project_name}}
**분석 일시:** {{date}}
**분석 범위:** {{analysis_scope}}

---

## 요약 (Executive Summary)

{{project_overview}}

### 주요 지표

| 지표 | 수치 | 상태 |
|------|------|------|
| 총 파일 수 | {{total_files}} | - |
| 총 코드 라인 수 | {{total_lines}} | - |
| 발견된 이슈 수 | {{total_issues}} | {{issues_status}} |
| 죽은 코드 비율 | {{dead_code_percentage}}% | {{dead_code_status}} |
| 코드 중복 비율 | {{duplication_percentage}}% | {{duplication_status}} |
| 테스트 커버리지 | {{test_coverage}}% | {{coverage_status}} |

### 심각도별 이슈 분포

- **Critical (P0):** {{critical_count}}건
- **Major (P1):** {{major_count}}건
- **Minor (P2):** {{minor_count}}건
- **Info (P3):** {{info_count}}건

---

## 1. 베이스라인 측정

{{baseline_metrics}}

### 1.1 프로젝트 구조

```
{{project_structure}}
```

### 1.2 언어별 분포

{{language_distribution}}

### 1.3 AI 생성 코드 패턴

{{ai_code_patterns}}

---

## 2. 죽은 코드 분석

{{dead_code_analysis}}

### 2.1 미사용 Import

| 파일 | Import | 라인 |
|------|--------|------|
{{unused_imports_table}}

### 2.2 미사용 함수/메서드

| 파일 | 함수명 | 라인 | 영향도 |
|------|--------|------|--------|
{{unused_functions_table}}

### 2.3 미사용 변수/상수

| 파일 | 변수명 | 라인 |
|------|--------|------|
{{unused_variables_table}}

### 2.4 미사용 클래스/타입

| 파일 | 클래스/타입명 | 라인 |
|------|---------------|------|
{{unused_classes_table}}

---

## 3. 코드 품질 분석

{{code_quality_analysis}}

### 3.1 복잡도 이슈

{{complexity_issues}}

### 3.2 코드 중복

{{duplication_issues}}

### 3.3 코드 스멜

{{code_smells}}

### 3.4 명명 규칙 이슈

{{naming_issues}}

---

## 4. 테스트 커버리지 분석

{{test_coverage_analysis}}

### 4.1 테스트 현황

- 테스트 파일 수: {{test_file_count}}
- 테스트 케이스 수: {{test_case_count}}
- 라인 커버리지: {{line_coverage}}%
- 브랜치 커버리지: {{branch_coverage}}%

### 4.2 테스트 부재 영역

{{untested_areas}}

### 4.3 테스트 우선순위 권장

{{test_priorities}}

---

## 5. 아키텍처 분석

{{architecture_analysis}}

### 5.1 의존성 구조

```
{{dependency_graph}}
```

### 5.2 순환 의존성

{{circular_dependencies}}

### 5.3 결합도/응집도 평가

{{coupling_cohesion}}

### 5.4 아키텍처 이슈

{{architecture_issues}}

---

## 6. 레거시 코드 분석

{{legacy_code_analysis}}

### 6.1 Deprecated API 사용

| 파일 | 사용된 API | 대체 API | 라인 |
|------|------------|----------|------|
{{deprecated_api_table}}

### 6.2 구식 패턴

{{outdated_patterns}}

### 6.3 보안 취약점

{{security_vulnerabilities}}

### 6.4 성능 이슈

{{performance_issues}}

---

## 7. 데이터베이스 기술부채 분석

{{database_analysis}}

### 7.1 스키마 분석

{{schema_overview}}

#### 미사용 테이블/컬럼

| 테이블 | 컬럼 | 마지막 사용 | 영향도 |
|--------|------|-------------|--------|
{{unused_tables_columns}}

#### 인덱스 최적화

| 테이블 | 현재 인덱스 | 문제점 | 권장 조치 |
|--------|-------------|--------|-----------|
{{index_optimization}}

#### 정규화 이슈

{{normalization_issues}}

#### FK 제약조건 및 무결성

{{fk_constraints_issues}}

### 7.2 쿼리 분석

{{query_overview}}

#### N+1 쿼리 패턴

| 위치 | 쿼리 패턴 | 발생 횟수 | 영향도 | 해결 방안 |
|------|-----------|-----------|--------|-----------|
{{n_plus_one_queries}}

#### 비효율적 쿼리

| 파일 | 라인 | 쿼리 유형 | 문제점 | 권장 조치 |
|------|------|-----------|--------|-----------|
{{inefficient_queries}}

#### Raw SQL vs ORM 혼용

{{raw_sql_orm_mixing}}

### 7.3 마이그레이션 분석

{{migration_overview}}

#### 미적용 마이그레이션

| 마이그레이션 파일 | 생성일 | 상태 | 우선순위 |
|-------------------|--------|------|----------|
{{pending_migrations}}

#### 스키마 불일치

{{schema_mismatch}}

#### 롤백 가능성 평가

{{rollback_assessment}}

### 7.4 ORM/모델 분석

{{orm_model_overview}}

#### 미사용 모델

| 모델명 | 파일 | 관련 테이블 | 참조 여부 |
|--------|------|-------------|-----------|
{{unused_models}}

#### 관계 정의 이슈

{{relationship_issues}}

#### 유효성 검증 이슈

{{validation_issues}}

#### Loading 전략 문제

| 모델 | 관계 | 현재 전략 | 문제점 | 권장 전략 |
|------|------|-----------|--------|-----------|
{{loading_strategy_issues}}

### 7.5 데이터 무결성 분석

{{data_integrity_overview}}

#### 고아 레코드

| 테이블 | 참조 테이블 | 고아 레코드 수 | 영향도 |
|--------|-------------|----------------|--------|
{{orphan_records}}

#### 중복 데이터

{{duplicate_data}}

#### NULL 처리 일관성

{{null_handling_issues}}

---

## 8. 수정 계획

{{remediation_plan}}

### 8.1 우선순위 매트릭스

| 이슈 | 영향도 | 긴급도 | 노력 | 우선순위 |
|------|--------|--------|------|----------|
{{priority_matrix}}

### 8.2 단계별 수정 계획

#### Phase 1: 빠른 승리 (Quick Wins)
{{phase1_tasks}}

#### Phase 2: 죽은 코드 제거
{{phase2_tasks}}

#### Phase 3: 코드 품질 개선
{{phase3_tasks}}

#### Phase 4: 테스트 보강
{{phase4_tasks}}

#### Phase 5: 아키텍처 개선
{{phase5_tasks}}

#### Phase 6: 현대화
{{phase6_tasks}}

---

## 9. 실행 결과

{{execution_summary}}

### 9.1 수정 전/후 비교

| 지표 | 수정 전 | 수정 후 | 개선율 |
|------|---------|---------|--------|
{{before_after_comparison}}

### 9.2 해결된 이슈

{{resolved_issues}}

### 9.3 남은 이슈

{{remaining_issues}}

---

## 10. 권장 후속 조치

### 즉시 조치 필요
{{immediate_actions}}

### 단기 권장 사항 (1-2주)
{{short_term_recommendations}}

### 중장기 권장 사항
{{long_term_recommendations}}

### 지속적 관리 방안
- [ ] 정기 코드 리뷰 일정 수립
- [ ] CI/CD에 린트 검사 통합
- [ ] 코드 품질 메트릭 대시보드 구축
- [ ] 기술부채 백로그 관리 프로세스 도입

---

## 부록

### A. 분석 도구 및 방법론

{{analysis_methodology}}

### B. 참고 자료

- [Technical Debt and AI](https://www.qodo.ai/blog/technical-debt/)
- [AI Code Refactoring Best Practices](https://www.augmentcode.com/guides/ai-code-refactoring-tools-tactics-and-best-practices)
- [Technical Debt Management Tools 2025](https://www.zenhub.com/blog-posts/the-top-technical-debt-management-tools-2025)

---

*이 보고서는 ANYON resolve-ai-tech-debt 워크플로우로 생성되었습니다.*
