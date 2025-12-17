---
document_type: PRD
project_name: {{project_name}}
created_date: {{date}}
service_type: {{service_type}}
platform: {{platform}}
project_license_type: {{project_license_type}}
opensource:
  decision: {{opensource_decision}}
  base_project: {{base_opensource_name}}
  base_repo: {{base_opensource_repo}}
  base_tech_stack: {{base_opensource_tech}}
  base_license: {{base_opensource_license}}
  base_template: {{base_template}}
  feature_map:
{{feature_opensource_map_yaml}}
core_features:
{{core_features_list}}
---

# {{project_name}} - PRD

## 프로젝트 개요

| 항목 | 내용 |
|-----|------|
| 프로젝트명 | {{project_name}} |
| 서비스 유형 | {{service_type}} |
| 플랫폼 | {{platform}} |
| 용도 | {{project_license_type}} |
| 라이선스 정책 | {{license_policy}} |

---

## 문제 & 타겟

**해결하려는 문제:**
{{problem_statement}}

**타겟 사용자:**
{{target_users}}

---

## 핵심 기능 (MVP)

{{core_features}}

---

## 오픈소스 활용

**결정**: {{opensource_decision}}

{{#if base_opensource_name}}
### 기반 프로젝트: {{base_opensource_name}}

| 항목 | 내용 |
|-----|------|
| GitHub | {{base_opensource_repo}} |
| 기술 스택 | {{base_opensource_tech}} |
| 라이선스 | {{base_opensource_license}} |

**활용 방식**: {{opensource_usage_plan}}
{{/if}}

{{#if base_template}}
### 기반 템플릿: {{base_template}}
{{/if}}

{{#if feature_opensource_map}}
### 기능별 오픈소스 조합

| 기능 | 선택한 라이브러리 | 역할 |
|------|-----------------|------|
{{feature_opensource_map}}
{{/if}}

### 검토한 오픈소스 목록

{{opensource_registry}}

---

## 참고 서비스

{{competitor_benchmarks}}

---

## 추가 요구사항

{{additional_requirements}}
