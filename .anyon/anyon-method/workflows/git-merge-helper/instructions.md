# Git Merge Helper - 워크플로우 실행 가이드

<critical>The workflow execution engine is governed by: {project-root}/.anyon/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/.anyon/anyon-method/workflows/git-merge-helper/workflow.yaml</critical>
<critical>Communicate in {communication_language} throughout the workflow process</critical>
<critical>모든 설명은 개발 초보자도 이해할 수 있게 쉽고 친근하게 작성하세요. 전문 용어는 반드시 괄호 안에 쉬운 설명을 덧붙이세요.</critical>

<workflow>

<step n="1" goal="브랜치 정보 수집">
<action>먼저 현재 프로젝트가 Git 저장소인지 확인합니다:</action>

```bash
git status
```

<check if="git 저장소가 아님">
  <action>사용자에게 알립니다: "이 폴더는 Git 저장소가 아니에요. Git 저장소가 있는 프로젝트 폴더에서 다시 실행해주세요!"</action>
  <action>워크플로우를 종료합니다.</action>
</check>

<action>사용자에게 친근하게 브랜치 정보를 물어봅니다:</action>

<ask>
안녕하세요! Git 머지를 도와드릴게요.

브랜치(branch)가 뭐냐고요?
코드의 "복사본"이라고 생각하면 돼요.
여러 사람이 각자 복사본에서 작업하고, 나중에 합치는 거예요!

자, 두 가지만 알려주세요:

1️⃣ 어디서 가져올 건가요? (소스 브랜치)
   예: feature/payment, develop, fix/login-bug

2️⃣ 어디에 합칠 건가요? (타겟 브랜치)
   예: main, master, develop

형식: [소스] → [타겟]
예시: feature/payment → main
</ask>

<action>사용자 입력에서 소스 브랜치와 타겟 브랜치를 파싱하여 저장합니다.</action>
</step>

<step n="2" goal="사전 검증">
<action>브랜치들이 실제로 존재하는지 확인합니다:</action>

```bash
git branch -a
```

<check if="소스 브랜치가 없음">
  <action>사용자에게 알립니다: "'{source_branch}'라는 브랜치를 찾을 수 없어요. 브랜치 이름을 다시 확인해주세요!"</action>
  <action>존재하는 브랜치 목록을 보여줍니다.</action>
  <goto step="1">다시 입력받기</goto>
</check>

<check if="타겟 브랜치가 없음">
  <action>사용자에게 알립니다: "'{target_branch}'라는 브랜치를 찾을 수 없어요. 브랜치 이름을 다시 확인해주세요!"</action>
  <action>존재하는 브랜치 목록을 보여줍니다.</action>
  <goto step="1">다시 입력받기</goto>
</check>

<action>타겟 브랜치로 이동합니다:</action>

```bash
git checkout {target_branch}
```

<action>변경사항 미리보기를 보여줍니다:</action>

```bash
git log {target_branch}..{source_branch} --oneline
```

<action>사용자에게 미리보기 결과를 쉽게 설명합니다:</action>

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 머지 미리보기
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{source_branch} 에서 {target_branch} 로 합치면:

📝 가져올 변경사항 X개:
   - (커밋 목록을 쉬운 말로 설명)

예: "결제 기능 추가", "로그인 버그 수정" 등

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

<ask>이대로 진행할까요? [y] 네, 합쳐주세요 / [n] 취소할게요</ask>

<check if="사용자가 취소">
  <action>워크플로우를 종료합니다: "알겠어요! 나중에 다시 불러주세요."</action>
</check>
</step>

<step n="3" goal="머지 실행">
<action>머지를 실행합니다:</action>

```bash
git merge {source_branch} --no-commit
```

<action>머지 결과를 확인합니다:</action>

```bash
git status
```

<check if="충돌 없음 (clean merge)">
  <action>사용자에게 알립니다:</action>

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 충돌 없이 깔끔하게 합쳐졌어요!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

다행히 두 브랜치가 서로 다른 부분을 수정해서
자동으로 합칠 수 있었어요.

이제 Step 6으로 이동해서 합친 결과를 검증할게요!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

  <goto step="6">머지 후 검증으로 이동</goto>
</check>

<check if="충돌 발생">
  <action>충돌 파일 목록을 가져옵니다:</action>

```bash
git diff --name-only --diff-filter=U
```

  <action>사용자에게 충돌 상황을 설명합니다:</action>

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 충돌이 발생했어요! (하지만 걱정 마세요)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤔 충돌이 뭐냐고요?
   두 사람이 같은 파일의 같은 부분을 각자 다르게 수정했어요.
   컴퓨터가 어떤 걸 써야 할지 몰라서 여러분께 물어보는 거예요!

   걱정 마세요, 하나씩 쉽게 해결할 수 있어요!

📁 충돌난 파일 X개:
   1. (파일 목록)

지금부터 하나씩 같이 해결해볼게요!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

  <goto step="4">충돌 분석으로 이동</goto>
</check>
</step>

<step n="4" goal="충돌 분석">
<action>각 충돌 파일에 대해 상세 분석을 수행합니다.</action>

<action>충돌 파일을 하나씩 읽고, 충돌 마커(<<<<<<, =======, >>>>>>>)를 파싱합니다.</action>

<action>각 충돌에 대해 다음 정보를 파악합니다:</action>
- 어떤 파일의 어느 부분인지
- 타겟 브랜치(현재) 버전의 내용과 의미
- 소스 브랜치(병합 대상) 버전의 내용과 의미
- 이 코드가 무슨 역할을 하는지 (초보자도 이해할 수 있게)

<action>충돌 정보를 저장하고 Step 5로 이동합니다.</action>
</step>

<step n="5" goal="충돌 해결" repeat="for-each-conflict">
<action>각 충돌에 대해 사용자에게 선택지를 제시합니다:</action>

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 충돌 {current}/{total}: {file_path}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤔 무슨 상황인가요?
   {conflict_explanation_in_simple_terms}

   (예: "두 사람이 '서버 주소'를 서로 다르게 바꿨어요")

📍 어디가 문제인가요?
   {what_this_code_does_in_simple_terms}

   (예: "이 설정은 앱이 데이터를 어디서 가져올지 정하는 거예요")

┌─ 버전 A: {target_branch} (지금 있는 것) ────────────┐
│                                                     │
│   {target_branch_code}                             │
│                                                     │
│   💬 쉽게 말하면:                                   │
│      {target_explanation_for_beginners}            │
│                                                     │
└─────────────────────────────────────────────────────┘

┌─ 버전 B: {source_branch} (가져오려는 것) ───────────┐
│                                                     │
│   {source_branch_code}                             │
│                                                     │
│   💬 쉽게 말하면:                                   │
│      {source_explanation_for_beginners}            │
│                                                     │
└─────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 어떻게 할까요?

[1] 버전 A 쓰기 ({target_branch} 유지)

    👉 이렇게 되면: {consequence_of_choosing_A}
    👍 좋은 점: {pros_of_A}
    👎 주의할 점: {cons_of_A}

[2] 버전 B 쓰기 ({source_branch} 선택)

    👉 이렇게 되면: {consequence_of_choosing_B}
    👍 좋은 점: {pros_of_B}
    👎 주의할 점: {cons_of_B}

[3] 둘 다 살리기 ⭐

    👉 이렇게 되면: 두 기능이 모두 유지되도록 합쳐드려요

    🔄 이렇게 바꿔드릴게요:
    ┌─────────────────────────────────────────────────┐
    │ {proposed_merged_code_preview}                 │
    └─────────────────────────────────────────────────┘

    💬 쉽게 말하면: {merged_explanation_for_beginners}

[4] 제가 직접 쓸게요

    👉 원하는 내용을 직접 입력할 수 있어요

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
번호를 선택해주세요 [1/2/3/4]:
```

<ask>번호를 선택해주세요 [1/2/3/4]:</ask>

<check if="선택 == 1">
  <action>타겟 브랜치 버전을 유지하고 충돌 마커를 제거합니다.</action>
</check>

<check if="선택 == 2">
  <action>소스 브랜치 버전을 적용하고 충돌 마커를 제거합니다.</action>
</check>

<check if="선택 == 3">
  <action>두 버전을 지능적으로 통합한 코드를 생성하고 적용합니다.</action>
  <action>통합 시 두 기능이 모두 정상 작동하도록 코드를 다듬습니다.</action>
</check>

<check if="선택 == 4">
  <ask>원하는 코드를 입력해주세요:</ask>
  <action>사용자가 입력한 내용으로 해당 부분을 교체합니다.</action>
</check>

<action>파일을 저장합니다.</action>

<action>다음 충돌로 이동하거나, 모든 충돌이 해결되면 Step 6으로 이동합니다.</action>
</step>

<step n="6" goal="머지 후 검증 및 다듬기">
<action>모든 충돌 마커가 제거되었는지 확인합니다:</action>

```bash
grep -r "<<<<<<" . --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" --include="*.py" --include="*.java" 2>/dev/null || echo "충돌 마커 없음"
```

<action>합쳐진 코드를 분석하여 잠재적 문제를 찾습니다:</action>
- 존재하지 않는 함수/변수 호출
- 누락된 import 문
- 타입 불일치 (TypeScript인 경우)
- 중복 코드
- 설정값 불일치

<action>검증 결과를 사용자에게 보여줍니다:</action>

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 합친 결과 확인 중...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 충돌 마커: 모두 제거됨
✅ 코드 문법: 이상 없어요!
✅ import 문: 다 있어요!
{추가 검증 결과}

{만약 문제가 있다면}
⚠️ 손봐야 할 곳: X군데 발견

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

<check if="수정이 필요한 부분 발견">
  <action>각 문제에 대해 사용자에게 설명하고 수정 제안합니다:</action>

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 손봐야 할 곳 {current}/{total}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 어디가 문제인가요?
   {file_path}의 {line_number}번 줄 근처

🤔 무슨 문제인가요?
   {problem_explanation_for_beginners}

   (예: "payment.js 파일에서 'validateUser'라는 기능을
    쓰려고 하는데, main 브랜치에는 이 기능이 없어요.
    마치 '김과장님 이거 처리해주세요' 했는데
    김과장님이 퇴사한 상황이에요 😅")

💡 이렇게 고치면 돼요:

   ❌ 지금 (문제 있음):
   {problematic_code}

   ⬇️

   ✅ 수정 후 (문제 해결):
   {fixed_code}

📝 쉽게 말하면:
   {fix_explanation_for_beginners}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

  <ask>이대로 고칠까요? [y] 네 / [n] 아니오 / [보기] 코드 전체 보기</ask>

  <check if="사용자가 승인">
    <action>수정사항을 적용합니다.</action>
  </check>

  <check if="사용자가 거부">
    <ask>어떻게 수정할지 알려주세요:</ask>
    <action>사용자 입력에 따라 수정합니다.</action>
  </check>
</check>

<action>모든 수정이 완료되면 Step 7로 이동합니다.</action>
</step>

<step n="7" goal="완료 및 커밋">
<action>최종 변경사항을 요약해서 보여줍니다:</action>

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ 머지 완료 준비!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 요약:
   • {source_branch} → {target_branch} 머지
   • 충돌 해결: {conflict_count}개 파일
   • 추가 수정: {fix_count}개 항목

📁 변경된 파일들:
   {changed_files_list}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

<ask>
이대로 저장(커밋)할까요?

[y] 네, 커밋해주세요!
[n] 취소할게요 (변경사항 되돌림)
[m] 커밋 메시지 직접 작성할게요
</ask>

<check if="사용자가 커밋 승인">
  <action>자동 커밋 메시지를 생성합니다:</action>

```bash
git add .
git commit -m "Merge {source_branch} into {target_branch}

- 충돌 해결: {conflict_summary}
- 추가 수정: {fix_summary}

Merged with git-merge-helper workflow"
```
</check>

<check if="사용자가 직접 메시지 작성">
  <ask>커밋 메시지를 입력해주세요:</ask>

```bash
git add .
git commit -m "{user_commit_message}"
```
</check>

<check if="사용자가 취소">
  <action>변경사항을 되돌립니다:</action>

```bash
git merge --abort
```

  <action>사용자에게 알립니다: "변경사항을 모두 되돌렸어요. 다음에 다시 시도해주세요!"</action>
</check>

<action>완료 메시지를 표시합니다:</action>

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 머지 완료!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{source_branch}가 {target_branch}에 성공적으로 합쳐졌어요!

💡 다음에 할 수 있는 것들:
   • git push - 원격 저장소에 올리기
   • git log - 커밋 기록 확인하기

수고하셨어요! 👏
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
</step>

</workflow>
