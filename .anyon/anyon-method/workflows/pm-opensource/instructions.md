# PM Opensource Workflow Instructions

<critical>The workflow execution engine is governed by: {project-root}/.anyon/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/.anyon/anyon-method/workflows/pm-opensource/workflow.yaml</critical>
<critical>Communicate in {communication_language} throughout the workflow process</critical>

<workflow>

<step n="1" goal="Open Source 문서 로드 및 파싱">
<action>Read the open source document from: {opensource_doc}</action>

<check if="file not found">
  <action>Inform user: "open-source.md 문서를 찾을 수 없습니다. {opensource_doc} 경로를 확인해주세요."</action>
  <action>Halt workflow execution</action>
</check>

<action>Parse the document to categorize open source items:

**Clone 대상 (GitHub URL이 있는 항목):**
- Look for GitHub URLs in format: https://github.com/owner/repo.git or https://github.com/owner/repo
- For each URL, note the associated description/purpose
- Store as list: {{repositories}} with fields: url, repo_name, purpose

**패키지 설치 대상 (GitHub URL 없이 이름만 있는 항목):**
- Look for package names without GitHub URLs (e.g., "three.js", "react", "tailwind")
- Store as list: {{packages}} with fields: name, purpose
- These will NOT be cloned - they are meant for npm/yarn install
</action>

<action>Display categorized results to user:

"## 📦 Open Source 분류 결과

### Clone 대상 (GitHub 레포지토리)
{{for each repo in repositories}}
- {{repo.repo_name}}: {{repo.purpose}}
{{end for}}
{{if repositories is empty}}
- (없음)
{{end if}}

### 패키지 설치 대상 (npm/yarn)
{{for each pkg in packages}}
- {{pkg.name}}: {{pkg.purpose}}
{{end for}}
{{if packages is empty}}
- (없음)
{{end if}}

> GitHub URL이 있는 항목만 clone합니다. 나머지는 패키지 매니저로 설치하세요."
</action>

<check if="no repositories found (empty list)">
  <action>Inform user: "Clone할 GitHub 레포지토리가 없습니다. 패키지 설치 대상만 발견되었습니다."</action>
  <action>Update open-source.md with package list only and complete workflow</action>
</check>
</step>

<step n="2" goal="현재 작업 디렉토리 확인">
<action>Identify the current working directory where Claude Code is running</action>
<action>Store as {{clone_base_path}}</action>
<action>Inform user: "레포지토리들을 {{clone_base_path}} 경로에 clone합니다."</action>
</step>

<step n="3" goal="레포지토리 Clone 실행">
<action>For each repository in {{repositories}}:

1. Check if folder already exists at {{clone_base_path}}/{{repo.repo_name}}

2. If folder EXISTS:
   - Log: "⏭️ {{repo.repo_name}} - 이미 존재하여 skip합니다."
   - Store clone_path as: {{clone_base_path}}/{{repo.repo_name}}
   - Mark as: skipped

3. If folder DOES NOT EXIST:
   - Execute: git clone {{repo.url}} {{clone_base_path}}/{{repo.repo_name}}
   - If clone succeeds:
     - Log: "✅ {{repo.repo_name}} - clone 완료"
     - Store clone_path as: {{clone_base_path}}/{{repo.repo_name}}
     - Mark as: cloned
   - If clone fails:
     - Log: "❌ {{repo.repo_name}} - clone 실패: {{error_message}}"
     - Mark as: failed

Store all results in {{clone_results}}
</action>
</step>

<step n="4" goal="Open Source 문서 업데이트">
<action>Update the {opensource_doc} file to include clone paths:

For each repository entry in the document:
- Add or update a "Clone 경로" field with the actual path
- Format example:

  Before:
  ```
  https://github.com/BloopAI/vibe-kanban.git
  이 레포의 칸반 보드 기능을 활용할 예정
  ```

  After:
  ```
  https://github.com/BloopAI/vibe-kanban.git
  이 레포의 칸반 보드 기능을 활용할 예정
  - **Clone 경로**: `/path/to/project/vibe-kanban`
  - **상태**: ✅ Clone 완료 (또는 ⏭️ 기존 존재 또는 ❌ 실패)
  ```
</action>

<action>Save the updated document</action>
</step>

<step n="5" goal="결과 요약 및 완료">
<action>Display summary to user:

"## 📦 Open Source Clone 완료

**Clone 위치**: {{clone_base_path}}

### Clone 결과:
{{for each result in clone_results}}
- {{result.status_emoji}} **{{result.repo_name}}**: {{result.status_text}}
  - 경로: {{result.clone_path}}
{{end for}}
{{if clone_results is empty}}
- (Clone 대상 없음)
{{end if}}

### 패키지 설치 대상 (수동 설치 필요):
{{for each pkg in packages}}
- 📦 {{pkg.name}}: {{pkg.purpose}}
{{end for}}
{{if packages is empty}}
- (없음)
{{end if}}

### 통계:
- ✅ Clone 완료: {{count_cloned}}개
- ⏭️ Skip (기존 존재): {{count_skipped}}개
- ❌ 실패: {{count_failed}}개
- 📦 패키지 (설치 필요): {{count_packages}}개

**open-source.md 문서가 업데이트되었습니다.**

다음 단계로 `pm-orchestrator` 워크플로우를 실행할 수 있습니다."
</action>
</step>

</workflow>
