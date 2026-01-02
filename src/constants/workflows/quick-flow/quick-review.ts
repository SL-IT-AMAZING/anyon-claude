import { WORKFLOW_ENGINE } from '../engine';

// ===== Quick Review =====
// 빠른 코드 검증 (BMAD quick-dev Step 4-6 통합 + 간소화)

const WORKFLOW_CONFIG = `# Quick Review - 빠른 코드 검증
name: "quick-review"
description: "구현된 코드를 빠르게 검증하고 주요 이슈만 체크. 다음 웨이브 준비 또는 완료."
author: "Quick Flow Track"

config_source: "{project-root}/.anyon/anyon-method/config.yaml"
communication_language: "Korean"

paths:
  dev_plan_root: "{project-root}/anyon-docs/dev-plan"
  dev_execution_plan: "{project-root}/anyon-docs/dev-plan/execution-plan.md"
  progress_file: "{project-root}/anyon-docs/dev-plan/execution-progress.md"
  project_context: "**/project-context.md"
`;

const MAIN_PROMPT = `# Quick Review - 빠른 검증

## 🎯 목표
구현된 코드를 빠르게 검토하고 **주요 이슈만** 체크합니다. 완벽함보다는 **빠른 피드백**을 우선합니다.

---

## 📋 워크플로우

### 1. 변경사항 확인

**Git Diff 분석:**
\`\`\`bash
git diff \${baseline_commit}..HEAD
\`\`\`

**확인 사항:**
- 어떤 파일이 변경되었나?
- 얼마나 많은 코드가 추가/수정/삭제되었나?
- 예상 범위 내인가?

---

### 2. 빠른 코드 리뷰 (5-10분)

**주요 체크 항목만:**

#### ✅ **Critical Issues (반드시 체크)**
1. **기능 동작**: AC(Acceptance Criteria) 충족하는가?
2. **에러 처리**: try-catch, null check 적절한가?
3. **타입 안정성**: TypeScript 에러 없는가?
4. **보안 이슈**: XSS, SQL Injection, 하드코딩된 비밀 등
5. **성능 문제**: 무한 루프, 메모리 누수, N+1 쿼리 등

#### ⚠️ **Medium Issues (필요 시 체크)**
6. **패턴 준수**: project-context 규칙 따랐는가?
7. **코드 중복**: 같은 로직이 여러 곳에 반복되는가?
8. **테스트 커버리지**: 주요 로직에 테스트 있는가?

#### ℹ️ **Low Priority (간단히 확인)**
9. **네이밍**: 변수/함수명이 명확한가?
10. **주석**: 복잡한 로직에 설명 있는가?

---

### 3. 자동 검증 실행

**빌드 체크:**
\`\`\`bash
npm run build  # 또는 bun build, vite build 등
\`\`\`

**Lint 체크 (있는 경우):**
\`\`\`bash
npm run lint
\`\`\`

**테스트 재실행:**
\`\`\`bash
npm test
\`\`\`

모든 자동 검증 통과해야 합니다.

---

### 4. 이슈 리포트

**이슈 발견 시:**

\`\`\`markdown
## 🔍 Review Findings

### 🚨 Critical Issues (즉시 수정 필요)
- [ ] [파일:라인] 설명

### ⚠️ Medium Issues (권장 수정)
- [ ] [파일:라인] 설명

### ℹ️ Suggestions (선택 사항)
- 제안 사항
\`\`\`

**이슈 처리:**
- **Critical**: 즉시 수정 → Quick Execute로 돌아가서 수정
- **Medium**: 사용자에게 물어보기 (수정 vs 스킵)
- **Low**: 다음 기회에 개선

---

### 5. 최종 검증

**이슈 해결 후:**

#### 5.1 개발 서버 테스트
\`\`\`bash
npm run dev
\`\`\`

- [ ] 서버 정상 시작
- [ ] 콘솔 에러 없음
- [ ] 기본 시나리오 동작 확인

#### 5.2 변경사항 요약
\`\`\`markdown
## ✅ Review Summary

**Changes:**
- 파일 N개 변경
- +XXX -YYY 라인

**Tests:**
- ✅ All passed (NN tests)

**Build:**
- ✅ No errors

**Key Features:**
1. 기능 1 구현 완료
2. 기능 2 구현 완료

**Next Steps:**
[다음 웨이브 or 완료]
\`\`\`

---

### 6. 상태 업데이트

**Progress 파일 업데이트:**

#### Case 1: 더 많은 웨이브 남음
\`\`\`yaml
workflow_state: reviewed
current_wave: E01-Wave2
last_review_passed: true
\`\`\`

\`\`\`
✅ Review 완료! 모든 검증 통과

🚀 다음: Wave 2 시작 (Quick Execute)
\`\`\`

#### Case 2: 모든 작업 완료
\`\`\`yaml
workflow_state: completed
overall_progress: 100%
last_review_passed: true
completed_at: \${timestamp}
\`\`\`

\`\`\`
🎉 모든 작업 완료!

📊 최종 통계:
- Total Waves: 2
- Total Tickets: 5
- Review: ✅ Passed
- Build: ✅ Success
- Tests: ✅ All Passed

💡 변경사항:
- 5 files changed
- +250 -30 lines

✨ 준비 완료! 프로덕션 배포 가능
\`\`\`

---

## 🎯 리뷰 철학

Quick Flow는 **빠른 개발**이 목표입니다:

- ❌ **완벽주의**: 모든 사소한 개선 찾기
- ✅ **실용주의**: Critical 이슈만 체크하고 빠르게 진행

**언제 엄격하게:**
- 보안 이슈
- 기능 버그
- 성능 문제
- 타입 에러

**언제 관대하게:**
- 네이밍 스타일
- 주석 부족 (코드가 명확한 경우)
- 사소한 리팩토링 기회
- 완벽하지 않은 테스트 커버리지

---

## 🛑 중단 조건

다음 경우 사용자에게 보고:

1. **Critical 이슈 3개 이상** - 전체 재검토 필요
2. **빌드/테스트 실패** - 수정 불가능
3. **AC 미충족** - 요구사항 재확인 필요

---

## ✅ 완료 조건

- [ ] 변경사항 Git diff 확인
- [ ] Critical 이슈 체크 완료
- [ ] 빌드/Lint/테스트 모두 통과
- [ ] 개발 서버 정상 실행
- [ ] Progress 파일 업데이트
- [ ] 다음 단계 명확히 제시

---

## 🚀 다음 단계

### 더 많은 웨이브가 남은 경우:
\`\`\`
Quick Execute로 돌아가서 다음 웨이브 시작
\`\`\`

### 모든 작업 완료된 경우:
\`\`\`
워크플로우 완료! 🎉

선택사항:
- Git commit & push
- PR 생성
- 배포 준비
\`\`\`
`;

export const QUICK_REVIEW_PROMPT = `${WORKFLOW_CONFIG}

---

${WORKFLOW_ENGINE}

---

${MAIN_PROMPT}
`;
