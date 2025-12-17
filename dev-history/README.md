---
title: Dev History - 개발 문서화
description: anyon-claude 앱의 개발 히스토리와 구현 로직을 문서화하는 폴더
author: anyon-claude team
created: 2024-12-17
updated: 2024-12-17
purpose: |
  이 폴더는 앱의 UI 구조를 기반으로 개발 과정을 문서화합니다.
  각 문서는 해당 기능의 구현 로직을 기술적이면서도 초보자가 이해할 수 있게 설명합니다.
  AI가 이 문서만 읽고도 해당 기능의 동작 원리와 수정 방법을 파악할 수 있어야 합니다.
---

# Dev History - 개발 문서화

## 이 폴더의 목적

anyon-claude 앱을 개발하면서 만든 기능들을 **UI 구조 기반**으로 문서화합니다.

> 📖 **문서 작성 방법이 궁금하다면**: [CONTRIBUTING.md](./CONTRIBUTING.md) 참고

### 왜 UI 기반인가?

1. **직관적인 탐색**: 앱에서 보이는 화면 구조 그대로 문서를 찾을 수 있음
2. **일관된 구조**: 새 기능이 추가되면 해당 UI 위치에 문서 추가
3. **AI 친화적**: AI가 "MVP 탭의 기획문서 기능" 같은 요청을 받으면 바로 해당 폴더로 이동 가능

---

## 폴더 구조

```
dev-history/
├── README.md                              # 이 파일 (전체 안내)
└── template/                              # 템플릿별 문서
    │
    ├── basic/                             # 📦 Basic 템플릿
    │   │                                  #    웹/앱 개발을 위한 기본 템플릿
    │   │
    │   ├── mvp-workspace/                 # MVP Workspace (새 프로젝트 개발)
    │   │   ├── 00-overview.md             #   MVP 전체 구조 설명
    │   │   ├── 01-prompt-architecture.md  #   프롬프트 내재화 구조
    │   │   ├── planning/                  #   기획문서 탭 (6단계)
    │   │   │   ├── 01-prd-workflow.md
    │   │   │   ├── 02-ux-design-workflow.md
    │   │   │   ├── 03-design-guide-workflow.md
    │   │   │   ├── 04-trd-workflow.md
    │   │   │   ├── 05-architecture-workflow.md
    │   │   │   └── 06-erd-workflow.md
    │   │   ├── development/               #   개발문서 탭 (4단계)
    │   │   │   └── 00-development-workflow.md
    │   │   └── preview/                   #   프리뷰 탭
    │   │
    │   └── maintenance-workspace/         # Maintenance Workspace (기존 프로젝트 유지보수)
    │
    ├── ai-agent/                          # 🤖 AI Agent 템플릿 (예정)
    ├── api-server/                        # 🔌 API Server 템플릿 (예정)
    ├── data-pipeline/                     # 📊 Data Pipeline 템플릿 (예정)
    └── mobile-app/                        # 📱 Mobile App 템플릿 (예정)
```

---

## UI와 폴더 매핑 관계

사용자가 앱에서 보는 화면과 문서 폴더가 1:1로 대응됩니다.

```
[앱 UI 흐름]                              [문서 폴더]
─────────────────────────────────────────────────────────────
프로젝트 선택
    ↓
템플릿 선택 화면 ─────────────────────→ template/
    │
    ├─ Basic 선택 ────────────────────→ template/basic/
    │      │
    │      ├─ MVP Workspace ──────────→ template/basic/mvp-workspace/
    │      │      │
    │      │      ├─ 기획문서 탭 ─────→ .../mvp-workspace/planning/
    │      │      ├─ 개발문서 탭 ─────→ .../mvp-workspace/development/
    │      │      └─ 프리뷰 탭 ───────→ .../mvp-workspace/preview/
    │      │
    │      └─ Maintenance Workspace ──→ template/basic/maintenance-workspace/
    │
    ├─ AI Agent 선택 (예정) ──────────→ template/ai-agent/
    └─ 기타 템플릿...
```

---

## 코드베이스 참조

문서와 관련된 실제 소스코드 위치입니다.

| 기능 | 소스코드 경로 |
|------|--------------|
| 템플릿 타입 정의 | `src/types/template.ts` |
| 템플릿 선택 UI | `src/components/TemplateSelector.tsx` |
| MVP Workspace | `src/components/MvpWorkspace.tsx` |
| Maintenance Workspace | `src/components/MaintenanceWorkspace.tsx` |
| Planning 컴포넌트들 | `src/components/planning/` |
| Development 컴포넌트들 | `src/components/development/` |
| Preview 컴포넌트들 | `src/components/preview/` |
| 워크플로우 프롬프트 | `src/constants/workflows/` |

---

## 문서 작성 규칙

### 1. YAML Frontmatter 필수

모든 문서 상단에 아래 형식으로 메타데이터를 작성합니다:

```yaml
---
title: 문서 제목
description: 한 줄 설명
related_code: 관련 소스코드 경로
ui_location: 앱에서 이 기능이 보이는 위치
workflow_order: (워크플로우인 경우) 실행 순서
dependencies: (있는 경우) 이전에 완료되어야 하는 단계
output_files: (있는 경우) 이 단계에서 생성되는 파일
---
```

### 2. 내용 작성 원칙

- **기술적이되 이해하기 쉽게**: 코드 로직을 자연어로 풀어서 설명
- **AI가 판단할 수 있게**: 조건문, 분기 로직, 예외 케이스를 명확히 기술
- **실제 데이터 흐름 포함**: 어떤 데이터가 어디서 어디로 흐르는지 설명
- **코드 참조 포함**: 관련 함수명, 파일 경로를 구체적으로 명시

### 3. 문서 업데이트 시점

- 새 기능 개발 완료 후
- 기존 로직 수정 후
- 버그 수정으로 동작이 변경된 후
