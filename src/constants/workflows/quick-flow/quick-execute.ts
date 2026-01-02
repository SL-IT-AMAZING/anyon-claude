import { WORKFLOW_ENGINE } from '../engine';

// ===== Quick Execute =====
// 빠른 구현 실행 (BMAD quick-dev Step 3 기반 + 자동 테스트)

const WORKFLOW_CONFIG = `# Quick Execute - 빠른 구현 실행
name: "quick-execute"
description: "티켓을 순서대로 구현하고 자동 테스트 실행. 웨이브 단위로 진행."
author: "Quick Flow Track"

config_source: "{project-root}/.anyon/anyon-method/config.yaml"
communication_language: "Korean"

paths:
  dev_plan_root: "{project-root}/anyon-docs/dev-plan"
  dev_execution_plan: "{project-root}/anyon-docs/dev-plan/execution-plan.md"
  progress_file: "{project-root}/anyon-docs/dev-plan/execution-progress.md"
  project_context: "**/project-context.md"
`;

const MAIN_PROMPT = `# Quick Execute - 즉시 구현

## 🎯 목표
Execution Plan의 티켓을 순서대로 구현하고, 웨이브 완료 시 자동 테스트를 실행합니다.

---

## 📋 워크플로우

### 1. 상태 로드

**필수 파일:**
- \`{dev_execution_plan}\` - 티켓 목록 및 상세 정보
- \`{progress_file}\` - 현재 진행 상황
- \`{project_context}\` - 프로젝트 패턴 (있는 경우)

**현재 상태 확인:**
- 어떤 웨이브를 실행 중인가?
- 어떤 티켓이 남았나?
- Baseline commit은?

---

### 2. 티켓 실행 루프

현재 웨이브의 **미완료 티켓**을 순서대로 처리합니다:

#### 2.1 티켓 시작
\`\`\`
🚀 [TICKET-001] Button 컴포넌트 생성 (E01-Wave1)
\`\`\`

**Progress 업데이트:**
\`\`\`yaml
workflow_state: executing
current_ticket: TICKET-001
TICKET-001: running
\`\`\`

---

#### 2.2 컨텍스트 로드
- 티켓에 명시된 파일 읽기
- 관련 코드 파악
- 의존성 확인

---

#### 2.3 구현
**원칙:**
- ✅ 기존 패턴 따르기 (project-context 준수)
- ✅ 에러 처리 적절히
- ✅ 주석은 필요한 곳만
- ✅ 티켓 AC(Acceptance Criteria) 준수

**구현 단계:**
1. 파일 생성/수정
2. 코드 작성
3. Import 정리
4. 타입 체크

---

#### 2.4 티켓 완료
**Progress 업데이트:**
\`\`\`yaml
TICKET-001: completed
completed_tickets: +1
overall_progress: 계산
\`\`\`

\`\`\`
✅ [TICKET-001] 완료 (15분 소요)
\`\`\`

다음 티켓으로 **즉시** 진행 (승인 대기 없음)

---

### 3. 웨이브 완료 처리

모든 티켓 완료 시:

#### 3.1 자동 테스트 실행 ⚡

**Quick Flow 트랙은 자동 테스트가 활성화되어 있습니다!**

\`\`\`bash
# 테스트 실행
npm test  # 또는 bun test, yarn test 등
\`\`\`

**테스트 결과 확인:**
- ✅ **모든 테스트 통과**: 웨이브 완료 → 다음 웨이브
- ❌ **테스트 실패**: 즉시 수정 → 다시 테스트

---

#### 3.2 빠른 검증
- [ ] 개발 서버 정상 실행 (필요 시)
- [ ] 콘솔 에러 없음
- [ ] 기본 동작 확인

---

#### 3.3 Progress 업데이트
\`\`\`yaml
workflow_state: awaiting_review
E01-Wave1:
  status: completed
  completed_at: \${timestamp}
completed_waves: +1
\`\`\`

---

### 4. 다음 웨이브 또는 완료

**남은 웨이브가 있는 경우:**
\`\`\`
✅ Wave 1 완료! (3/3 티켓, 테스트 통과)

🚀 Wave 2 시작: 핵심 기능 구현
\`\`\`

다음 웨이브의 첫 티켓으로 진행

---

**모든 웨이브 완료:**
\`\`\`yaml
workflow_state: completed
overall_progress: 100%
\`\`\`

\`\`\`
🎉 모든 구현 완료!

📊 통계:
- Total Waves: 2
- Total Tickets: 5
- All Tests: ✅ Passed

🔍 다음 단계: Quick Review 실행
\`\`\`

---

## 🛑 중단 조건

다음 경우에만 중단하고 사용자 가이드 요청:

1. **3번 연속 실패** (같은 티켓)
2. **테스트 실패 원인 불명**
3. **Blocking 의존성 발견**
4. **모호한 요구사항**

**중단하지 않는 경우:**
- 경고 (Warnings)
- 스타일 이슈
- 사소한 문제

---

## 💡 주요 규칙

1. **연속 실행**: 티켓 간 승인 대기 없음
2. **패턴 준수**: project-context 규칙 따르기
3. **자동 테스트**: 웨이브 완료 시 반드시 실행
4. **에러 즉시 수정**: 테스트 실패 시 바로 해결
5. **진행 상황 추적**: Progress 파일 실시간 업데이트

---

## ✅ 완료 조건

- [ ] 모든 티켓 구현 완료
- [ ] 각 웨이브마다 테스트 실행 및 통과
- [ ] Progress 파일 최신 상태
- [ ] 개발 서버 정상 실행
- [ ] 콘솔 에러 없음

---

## 🚀 다음 단계

**Quick Review** 워크플로우를 실행하여 코드를 검증합니다.

\`\`\`
Quick Review 시작
\`\`\`
`;

export const QUICK_EXECUTE_PROMPT = `${WORKFLOW_CONFIG}

---

${WORKFLOW_ENGINE}

---

${MAIN_PROMPT}
`;
