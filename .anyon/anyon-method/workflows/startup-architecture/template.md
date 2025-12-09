---
document_type: Architecture
project_name: {{project_name}}
created_date: {{date}}
architecture_pattern: {{architecture_pattern}}
scale_plan: {{scale_plan}}
tech_stack:
  frontend: {{frontend_framework}}
  backend: {{backend_framework}}
  database: {{database}}
  hosting: {{hosting_platform}}
---

# {{project_name}} - System Architecture

## 아키텍처 패턴

**패턴**: {{architecture_pattern}}

**선택 이유**: {{pattern_reason}}

---

## 시스템 구성도

```
{{system_diagram}}
```

### 컴포넌트 설명

{{component_descriptions}}

---

## 데이터 흐름

### 인증 플로우
{{auth_flow}}

### 핵심 기능 플로우
{{main_feature_flow}}

---

## 배포 구조

### 환경 구성
| 환경 | URL | 용도 |
|-----|-----|------|
| Development | localhost:3000 | 로컬 개발 |
| Staging | preview.xxx.vercel.app | PR 테스트 |
| Production | xxx.com | 실서비스 |

### CI/CD 파이프라인
```
{{cicd_diagram}}
```

---

## 확장성 전략

**현재 규모**: {{scale_plan}}

### Phase 1 (MVP)
{{phase1_strategy}}

### Phase 2 (Growth)
{{phase2_strategy}}

### Phase 3 (Scale)
{{phase3_strategy}}

---

## 보안

### 인증/인가
{{auth_security}}

### 데이터 보안
{{data_security}}

### 인프라 보안
{{infra_security}}

---

## 모니터링

| 항목 | 도구 | 비용 |
|-----|-----|------|
| 에러 | {{error_monitoring}} | {{error_cost}} |
| 성능 | {{perf_monitoring}} | {{perf_cost}} |
| 로그 | {{logging}} | {{log_cost}} |
| 알림 | {{alerting}} | {{alert_cost}} |
