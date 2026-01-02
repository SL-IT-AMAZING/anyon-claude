import { WORKFLOW_ENGINE } from '../engine';

// ===== Quick Plan =====
// 빠른 실행 계획 수립 (BMAD quick-dev Step 1-2 기반)

const WORKFLOW_CONFIG = `# Quick Plan - 빠른 실행 계획
name: "quick-plan"
description: "요구사항을 분석하고 간단한 실행 계획을 수립. 티켓 세분화 + 웨이브 구성."
author: "Quick Flow Track"

config_source: "{project-root}/.anyon/anyon-method/config.yaml"
communication_language: "Korean"

paths:
  planning_root: "{project-root}/anyon-docs/planning"
  dev_plan_root: "{project-root}/anyon-docs/dev-plan"
  epics_folder: "{project-root}/anyon-docs/dev-plan/epics"
  dev_execution_plan: "{project-root}/anyon-docs/dev-plan/execution-plan.md"
  progress_file: "{project-root}/anyon-docs/dev-plan/execution-progress.md"
`;

const MAIN_PROMPT = `# Quick Plan - 빠른 개발 계획 수립

## 🎯 목표
사용자 요구사항을 분석하여 **즉시 실행 가능한 티켓**을 생성하고 웨이브로 구성합니다.

---

## 📋 워크플로우

### 1. 요구사항 이해

사용자의 요구사항을 분석합니다:
- **기능 목표**: 무엇을 만들어야 하나?
- **기술 스택**: 어떤 기술을 사용하나?
- **제약사항**: 지켜야 할 규칙이 있나?
- **우선순위**: 무엇부터 시작할까?

**질문 최소화**: 명확한 경우 바로 진행, 모호한 경우에만 질문

---

### 2. 컨텍스트 수집

프로젝트 상태를 파악합니다:

**필수 확인:**
- \`**/project-context.md\` - 프로젝트 패턴 및 규칙
- 기존 코드 구조 (관련 파일 탐색)
- Git 상태 확인 (baseline commit 저장)

**분석:**
- 기존 패턴 파악
- 의존성 확인
- 변경 범위 추정

---

### 3. 티켓 생성

**티켓 세분화 원칙:**
- ✅ **30분 규칙**: 각 티켓은 30분 이내 완료 가능
- ✅ **단일 목적**: 한 티켓 = 한 가지 명확한 작업
- ✅ **구체적 지침**: "무엇을", "어디에", "어떻게" 명시

**티켓 포맷:**
\`\`\`markdown
### TICKET-001: [간단한 제목]

**Epic**: E01
**Wave**: E01-Wave1
**Estimate**: 15-30분

**Description:**
구체적인 작업 설명

**Files:**
- \`src/components/Button.tsx\` (수정)
- \`src/types/ui.ts\` (생성)

**Implementation:**
1. Step 1
2. Step 2
3. Step 3

**Acceptance Criteria:**
- [ ] 조건 1
- [ ] 조건 2
\`\`\`

---

### 4. 웨이브 구성

**웨이브 원칙:**
- 의존성 기반 그룹화
- Wave 1: 기초 작업 (타입, 유틸리티)
- Wave 2: 핵심 기능
- Wave 3: 통합 및 테스트

**웨이브당 티켓 수**: 3-7개 (관리 가능한 범위)

---

### 5. Execution Plan 생성

\`{dev_execution_plan}\` 파일을 생성합니다:

\`\`\`markdown
# Execution Plan - [기능명]

## Overview
- **Goal**: 목표 요약
- **Baseline**: \${baseline_commit}
- **Created**: \${date}

## Epic E01: [Epic 제목]

### E01-Wave1: [Wave 제목]
- TICKET-001: [제목]
- TICKET-002: [제목]
- TICKET-003: [제목]

### E01-Wave2: [Wave 제목]
- TICKET-004: [제목]
- TICKET-005: [제목]

---

## Ticket Details

[각 티켓의 상세 내용]
\`\`\`

---

### 6. Progress 초기화

\`{progress_file}\` 생성:

\`\`\`yaml
# Execution Progress

workflow_state: idle
current_epic: E01
current_wave: E01-Wave1
baseline_commit: \${baseline_commit}

# Wave Progress
E01-Wave1:
  status: pending
  tickets:
    - TICKET-001: pending
    - TICKET-002: pending
    - TICKET-003: pending

# Statistics
completed_waves: 0
total_waves: 2
completed_tickets: 0
total_tickets: 5
overall_progress: 0%
\`\`\`

---

## ✅ 완료 조건

- [ ] 요구사항 명확히 이해
- [ ] 프로젝트 컨텍스트 로드
- [ ] Git baseline 저장
- [ ] 티켓 세분화 완료 (30분 규칙 준수)
- [ ] 웨이브로 그룹화 완료
- [ ] execution-plan.md 생성
- [ ] execution-progress.md 초기화

---

## 🚀 다음 단계

**Quick Execute** 워크플로우를 실행하여 티켓을 구현합니다.

\`\`\`
Quick Execute 시작
\`\`\`
`;

export const QUICK_PLAN_PROMPT = `${WORKFLOW_CONFIG}

---

${WORKFLOW_ENGINE}

---

${MAIN_PROMPT}
`;
