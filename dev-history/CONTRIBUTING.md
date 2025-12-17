---
title: dev-history 문서화 가이드
description: 팀원들을 위한 개발 히스토리 문서 작성 가이드라인
last_updated: 2024-12-17
---

# dev-history 문서화 가이드

이 문서는 `dev-history` 폴더에 개발 과정을 문서화하는 방법을 설명합니다.

---

## 목차

1. [문서화의 목적](#1-문서화의-목적)
2. [폴더 구조 규칙](#2-폴더-구조-규칙)
3. [문서 작성 규칙](#3-문서-작성-규칙)
4. [YAML Frontmatter 작성법](#4-yaml-frontmatter-작성법)
5. [문서 내용 작성 가이드](#5-문서-내용-작성-가이드)
6. [예시 템플릿](#6-예시-템플릿)
7. [자주 하는 실수](#7-자주-하는-실수)

---

## 1. 문서화의 목적

### 왜 문서화하나요?

1. **AI 컨텍스트 제공**: AI가 이 문서만 읽고도 시스템을 이해하고 판단할 수 있도록
2. **온보딩 가속화**: 새 팀원이 빠르게 시스템을 파악할 수 있도록
3. **의사결정 기록**: "왜 이렇게 만들었는지" 나중에 추적 가능하도록
4. **유지보수 용이성**: 코드만 보면 알 수 없는 맥락 보존

### 핵심 원칙

```
📌 이 문서만 읽고 AI가 해당 기능을 수정/확장할 수 있어야 한다
```

---

## 2. 폴더 구조 규칙

### 기본 원칙: UI 구조 = 폴더 구조

```
dev-history/
├── README.md                    # 전체 인덱스
├── CONTRIBUTING.md              # 이 파일 (문서화 가이드)
│
└── template/                    # 템플릿 유형별 분류
    ├── basic/                   # Basic 템플릿
    │   └── mvp-workspace/       # MVP Workspace 기능
    │       ├── 00-overview.md   # 기능 전체 개요
    │       ├── 01-xxx.md        # 세부 기능 1
    │       ├── planning/        # 하위 탭/기능
    │       │   ├── 01-prd.md
    │       │   └── 02-ux.md
    │       └── development/
    │           └── 00-dev.md
    │
    ├── ai-agent/                # AI Agent 템플릿 (예정)
    ├── api-server/              # API Server 템플릿 (예정)
    └── ...
```

### 폴더/파일 네이밍 규칙

| 규칙 | 예시 | 설명 |
|------|------|------|
| 소문자 + 하이픈 | `mvp-workspace/` | 폴더명 |
| 숫자 접두사 | `01-prd-workflow.md` | 순서가 있는 문서 |
| 00은 개요용 | `00-overview.md` | 해당 폴더의 전체 설명 |
| 기능명 그대로 | `planning/`, `development/` | UI 탭/메뉴명과 일치 |

### 새 기능 추가 시 폴더 위치 결정

```
질문 1: 어떤 템플릿의 기능인가?
  → template/{템플릿명}/

질문 2: UI에서 어느 메뉴에 속하나?
  → template/{템플릿명}/{메뉴명}/

질문 3: 하위 탭이 있나?
  → template/{템플릿명}/{메뉴명}/{탭명}/
```

---

## 3. 문서 작성 규칙

### 모든 .md 파일의 필수 구조

```markdown
---
# YAML Frontmatter (필수)
title: 문서 제목
description: 한 줄 설명
related_code:
  - src/xxx.ts
  - src/yyy.ts
last_updated: 2024-12-17
---

# 문서 제목

## 개요
[이 기능이 무엇인지 2-3문장으로]

## 상세 내용
[본문]

## AI를 위한 요약
[AI가 참조해야 할 핵심 정보]
```

### 문서 유형별 추가 필드

#### 워크플로우 문서
```yaml
workflow_order: 1              # 실행 순서
dependencies:
  - prd.md                     # 선행 조건
output_files:
  - anyon-docs/planning/xxx.md # 출력 파일
```

#### UI 컴포넌트 문서
```yaml
ui_location: Basic > MVP > Planning
component_path: src/components/xxx.tsx
```

#### API/백엔드 문서
```yaml
api_endpoints:
  - POST /api/xxx
  - GET /api/yyy
```

---

## 4. YAML Frontmatter 작성법

### 필수 필드

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `title` | string | 문서 제목 | `"PRD 워크플로우"` |
| `description` | string | 한 줄 설명 | `"사용자 아이디어를 PRD로 변환"` |
| `last_updated` | date | 최종 수정일 | `2024-12-17` |

### 권장 필드

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `related_code` | list | 관련 소스 코드 경로 | `["src/constants/xxx.ts"]` |
| `ui_location` | string | UI에서의 위치 | `"Basic > MVP > Planning"` |
| `workflow_order` | number | 워크플로우 순서 | `1` |
| `dependencies` | list | 선행 조건/파일 | `["prd.md"]` |
| `output_files` | list | 출력 파일 | `["anyon-docs/xxx.md"]` |

### Frontmatter 예시

```yaml
---
title: PRD (Product Requirements Document) 워크플로우
description: 사용자의 아이디어를 체계적인 제품 요구사항 문서로 변환하는 첫 번째 단계
related_code:
  - src/constants/workflows/planning/startup-prd.ts
  - src/constants/planning.ts
ui_location: Basic > MVP Workspace > 기획문서 탭 > PRD
workflow_order: 1
dependencies: []
output_files:
  - anyon-docs/planning/prd.md
required_tools:
  - WebSearch
last_updated: 2024-12-17
---
```

---

## 5. 문서 내용 작성 가이드

### 5.1 개요 섹션

**목표**: 3문장 안에 "이게 뭔지" 파악 가능하게

```markdown
## 개요

PRD 워크플로우는 **비개발자 창업자**의 아이디어를 체계적인 제품 요구사항 문서로 변환하는 **첫 번째** 단계입니다.

### 이 워크플로우가 하는 일

1. 창업자와 대화하며 아이디어를 구체화
2. WebSearch로 경쟁사 자동 분석
3. 정형화된 PRD 문서 생성
```

### 5.2 상세 단계 작성

**목표**: AI가 로직을 그대로 따라할 수 있을 정도로 구체적으로

```markdown
### Step 1: 서비스 유형 파악

AI가 처음 묻는 핵심 질문:

\```
어떤 서비스를 만들려고 하시나요? 다음 중 선택해주세요:

1. SaaS (구독형 웹 서비스) - 예: Notion, Figma (추천)
2. 이커머스/마켓플레이스 - 예: 쿠팡, 당근마켓
3. 기타 (직접 입력)
\```

**AI 판단 로직**:
- SaaS 선택 → 구독 모델 관련 질문 추가
- 이커머스 선택 → 결제/물류 관련 질문 추가
```

### 5.3 분기 로직 작성

**목표**: 조건에 따른 다른 동작을 명확히

```markdown
### 중요 분기 로직

| 조건 | 동작 |
|------|------|
| TRD.orm === "Prisma" | schema.prisma 형식 출력 |
| TRD.orm === "Mongoose" | MongoDB 스키마 형식 출력 |
| TRD.orm === "TypeORM" | TypeORM 엔티티 형식 출력 |
```

또는 코드 형태로:

```typescript
if (trd.orm === "Prisma") {
  // Prisma 스키마 생성
} else if (trd.orm === "Mongoose") {
  // MongoDB 스키마 생성
}
```

### 5.4 출력물 구조 작성

**목표**: 생성되는 파일의 정확한 형식 명시

```markdown
## 출력 파일 구조

### 파일 경로
`{프로젝트폴더}/anyon-docs/planning/prd.md`

### 문서 구조

\```markdown
---
project_name: "프로젝트명"
service_type: "SaaS"
core_features:
  - 기능1
  - 기능2
---

# [프로젝트명] PRD

## 1. 제품 개요
[내용]

## 2. 핵심 기능
[내용]
\```
```

### 5.5 비개발자용 설명 추가

**목표**: 기술 용어를 누구나 이해할 수 있게

```markdown
## 핵심 개념 설명 (비개발자용)

### ORM (Object-Relational Mapping)
데이터베이스와 코드를 연결해주는 도구입니다.
- 비유: 통역사 (코드와 DB가 다른 언어를 쓰는데, 중간에서 번역해줌)

### API 엔드포인트
서버와 통신하는 "문"입니다.
- GET: 데이터 가져오기 (읽기)
- POST: 새 데이터 만들기 (쓰기)
```

### 5.6 AI를 위한 요약

**목표**: AI가 빠르게 참조할 핵심 정보 정리

```markdown
## AI를 위한 요약

**핵심 정보**:
1. 프롬프트 위치: `src/constants/workflows/planning/startup-prd.ts`
2. 출력 파일: `anyon-docs/planning/prd.md`
3. 필수 도구: WebSearch
4. AI 페르소나: 투자자 관점의 날카로운 질문

**분기 로직**:
- 서비스 유형에 따라 후속 질문 분기
- MVP 기능 3개 제한

**YAML Frontmatter 중요 필드**:
- `service_type`: 다음 단계에서 UI 패턴 결정에 사용
- `core_features`: 화면 구성에 사용
```

---

## 6. 예시 템플릿

### 6.1 워크플로우 문서 템플릿

```markdown
---
title: [워크플로우명] 워크플로우
description: [한 줄 설명]
related_code:
  - src/constants/workflows/xxx.ts
ui_location: [UI 경로]
workflow_order: [순서]
dependencies:
  - [선행 파일들]
output_files:
  - [출력 파일들]
last_updated: YYYY-MM-DD
---

# [워크플로우명] 워크플로우

## 개요

[이 워크플로우가 무엇인지 2-3문장]

### 이 워크플로우가 하는 일

1. [동작 1]
2. [동작 2]
3. [동작 3]

---

## 실행 조건

### 시작 조건
- [조건 1]
- [조건 2]

### 종료 조건
- [조건 1]
- [조건 2]

---

## 워크플로우 상세 단계

### Step 1: [단계명]

[설명]

\```
[AI가 보여주는 메시지나 질문]
\```

**AI 판단 로직**:
- [조건] → [동작]

### Step 2: [단계명]

[반복...]

---

## AI 페르소나

### 역할
**[역할명]**

### 대화 원칙

1. **[원칙1]**
   - [세부 내용]

2. **[원칙2]**
   - [세부 내용]

---

## 출력 파일 구조

### 파일 경로
`[경로]`

### 문서 구조

\```markdown
---
# YAML Frontmatter
[필드들]
---

# [제목]

## 1. [섹션]
[내용]
\```

---

## 핵심 개념 설명 (비개발자용)

### [용어1]
[쉬운 설명]
- 비유: [실생활 비유]

### [용어2]
[쉬운 설명]

---

## 다음 단계 연결

### 자동 전환 조건
- [조건]

### 다음 단계가 참조하는 정보
- [정보 1]
- [정보 2]

---

## AI를 위한 요약

**핵심 정보**:
1. 프롬프트 위치: `[경로]`
2. 출력 파일: `[경로]`
3. 필수 도구: [도구명]
4. AI 페르소나: [역할]

**분기 로직**:
- [조건] → [동작]

**YAML Frontmatter 중요 필드**:
- `[필드]`: [용도]
```

### 6.2 기능 개요 문서 템플릿

```markdown
---
title: [기능명] 개요
description: [한 줄 설명]
related_code:
  - src/xxx.ts
ui_location: [UI 경로]
last_updated: YYYY-MM-DD
---

# [기능명] 개요

## 이 기능은 무엇인가요?

[2-3문장으로 설명]

---

## 구성 요소

### [구성요소 1]
[설명]

### [구성요소 2]
[설명]

---

## 데이터 흐름

\```
[사용자 액션] → [처리 1] → [처리 2] → [결과]
\```

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `src/xxx.ts` | [역할] |
| `src/yyy.ts` | [역할] |

---

## AI를 위한 요약

[핵심 정보 정리]
```

---

## 7. 자주 하는 실수

### ❌ 하지 말아야 할 것

| 실수 | 문제점 | 올바른 방법 |
|------|--------|-------------|
| Frontmatter 누락 | AI가 문서 메타정보 파악 불가 | 모든 .md에 YAML frontmatter 필수 |
| "나중에 추가" 표시 | 불완전한 문서 방치 | 작성 가능한 범위까지만 우선 작성 |
| 코드만 복붙 | 맥락 없이 코드만 있으면 이해 불가 | 코드 전후로 설명 추가 |
| 추상적 설명 | "좋은 UX를 제공한다" 같은 모호함 | 구체적 동작/조건 명시 |
| 오래된 정보 방치 | 코드와 문서 불일치 | 코드 수정 시 문서도 함께 수정 |

### ✅ 체크리스트

문서 작성 완료 전 확인:

- [ ] YAML frontmatter가 있는가?
- [ ] `title`, `description`, `last_updated`가 있는가?
- [ ] `related_code`로 관련 소스 코드를 연결했는가?
- [ ] "AI를 위한 요약" 섹션이 있는가?
- [ ] 분기 로직이 명확히 기술되어 있는가?
- [ ] 출력물 구조가 정의되어 있는가?
- [ ] 비개발자도 이해할 수 있는 설명이 있는가?

---

## 문서 업데이트 시

1. 코드 수정 시 → 관련 문서도 함께 수정
2. `last_updated` 날짜 갱신
3. 변경 사항이 크면 "변경 이력" 섹션 추가 고려

```markdown
## 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2024-12-17 | 초기 작성 |
| 2024-12-20 | Step 3 분기 로직 추가 |
```

---

## 질문이 있다면

문서화 관련 질문은 팀 채널에서 논의하거나, 이 가이드 문서에 대한 개선 제안을 PR로 제출해주세요.
