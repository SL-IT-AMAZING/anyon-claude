# 개발문서 탭 구현 계획서

## 📌 개요

MVP Workspace의 **개발문서 탭**에 anyon-mvp의 MVP 개발 탭과 동일한 워크플로우 자동 실행 기능을 구현합니다.

### 참조 프로젝트
- **anyon-mvp**: `/Users/cosmos/Documents/ani/anyon-mvp`
- **핵심 파일**:
  - `crates/local-deployment/src/container.rs` (백엔드 자동 라우팅)
  - `crates/services/src/services/task_workflow.rs` (워크플로우 상수)
  - `frontend/src/pages/ProjectMvp.tsx` (프론트엔드)

---

## 🎯 목표

1. 기획문서 6개 완료 후 **개발 워크플로우 자동 시작**
2. **이전 워크플로우 완료 감지 → 다음 워크플로우 자동 실행** (새 세션)
3. 좌측: AI 대화 렌더링 / 우측: 생성되는 문서/코드 실시간 표시
4. 워크플로우 시퀀스: `pm-orchestrator → pm-executor ↔ pm-reviewer`

---

## 🔄 자동 라우팅 핵심 로직 (anyon-mvp 방식)

```rust
// 프로세스 완료 시점에서 호출
let last_prompt = get_last_prompt_from_db();

if last_prompt.contains("pm-orchestrator") {
    // orchestrator 완료 → executor 시작 (새 세션)
    start_new_session("pm-executor");
}
else if last_prompt.contains("pm-executor") {
    // executor 완료 → reviewer 시작 (새 세션)
    start_new_session("pm-reviewer");
}
else if last_prompt.contains("pm-reviewer") {
    if is_all_epics_complete() {
        // 완료!
    } else {
        // 다음 Wave → executor 다시 시작 (새 세션)
        start_new_session("pm-executor");
    }
}
```

---

## 📁 파일 구조

### Rust 백엔드 (src-tauri/src/)

```
src-tauri/src/
├── commands/
│   ├── mod.rs                    # 수정: dev_workflow 모듈 추가
│   ├── claude.rs                 # 수정: 자동 라우팅 훅 추가
│   └── dev_workflow.rs           # 신규: 워크플로우 상수 + DB + 자동 라우팅
└── main.rs                       # 수정: 명령어 등록
```

### Frontend (src/)

```
src/
├── constants/
│   └── development.ts            # 신규: 프론트용 워크플로우 상수
├── hooks/
│   └── useDevWorkflow.ts         # 신규: 워크플로우 상태 관리
├── components/
│   └── development/              # 신규 폴더
│       ├── DevDocsPanel.tsx      # 메인 패널
│       ├── DevDocsViewer.tsx     # 문서 뷰어
│       └── index.ts              # exports
└── components/
    └── MvpWorkspace.tsx          # 수정: 개발문서 탭 연결
```

---

## 🔧 구현 상세

### Phase 1: Rust 백엔드

#### 1-1. `src-tauri/src/commands/dev_workflow.rs` (신규)

```rust
//! Development workflow auto-routing
//! Based on anyon-mvp's PM workflow logic

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::Path;
use tauri::{AppHandle, Manager};

// ============================================================================
// Constants
// ============================================================================

pub const PM_ORCHESTRATOR_PROMPT: &str = "/anyon:anyon-method:workflows:pm-orchestrator";
pub const PM_EXECUTOR_PROMPT: &str = "/anyon:anyon-method:workflows:pm-executor";
pub const PM_REVIEWER_PROMPT: &str = "/anyon:anyon-method:workflows:pm-reviewer";

pub const EXECUTION_PROGRESS_FILE: &str = "anyon-docs/execution-progress.md";

pub const COMPLETION_MARKERS: &[&str] = &[
    "프로젝트 구현 완료",
    "모든 Epic 완료",
    "All Epics Completed",
    "Project Implementation Complete",
];

const MAX_DEV_CYCLES: i32 = 100;

// ============================================================================
// DB Schema
// ============================================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DevSession {
    pub id: i64,
    pub project_path: String,
    pub last_prompt: String,
    pub cycle_count: i32,
    pub status: String,  // "running", "completed", "error"
    pub created_at: String,
    pub updated_at: String,
}

/// Initialize dev_sessions table
pub fn init_dev_workflow_db(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS dev_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_path TEXT NOT NULL UNIQUE,
            last_prompt TEXT NOT NULL DEFAULT '',
            cycle_count INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'idle',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )",
        [],
    )?;
    Ok(())
}

// ============================================================================
// DB Operations
// ============================================================================

pub fn get_or_create_dev_session(conn: &Connection, project_path: &str) -> rusqlite::Result<DevSession> {
    // Try to get existing session
    let result = conn.query_row(
        "SELECT id, project_path, last_prompt, cycle_count, status, created_at, updated_at
         FROM dev_sessions WHERE project_path = ?1",
        params![project_path],
        |row| {
            Ok(DevSession {
                id: row.get(0)?,
                project_path: row.get(1)?,
                last_prompt: row.get(2)?,
                cycle_count: row.get(3)?,
                status: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        },
    );

    match result {
        Ok(session) => Ok(session),
        Err(rusqlite::Error::QueryReturnedNoRows) => {
            // Create new session
            conn.execute(
                "INSERT INTO dev_sessions (project_path, status) VALUES (?1, 'idle')",
                params![project_path],
            )?;
            let id = conn.last_insert_rowid();
            Ok(DevSession {
                id,
                project_path: project_path.to_string(),
                last_prompt: String::new(),
                cycle_count: 0,
                status: "idle".to_string(),
                created_at: chrono::Utc::now().to_rfc3339(),
                updated_at: chrono::Utc::now().to_rfc3339(),
            })
        }
        Err(e) => Err(e),
    }
}

pub fn update_dev_session(
    conn: &Connection,
    project_path: &str,
    last_prompt: &str,
    cycle_count: i32,
    status: &str,
) -> rusqlite::Result<()> {
    conn.execute(
        "UPDATE dev_sessions
         SET last_prompt = ?1, cycle_count = ?2, status = ?3, updated_at = datetime('now')
         WHERE project_path = ?4",
        params![last_prompt, cycle_count, status, project_path],
    )?;
    Ok(())
}

pub fn reset_dev_session(conn: &Connection, project_path: &str) -> rusqlite::Result<()> {
    conn.execute(
        "UPDATE dev_sessions
         SET last_prompt = '', cycle_count = 0, status = 'idle', updated_at = datetime('now')
         WHERE project_path = ?1",
        params![project_path],
    )?;
    Ok(())
}

// ============================================================================
// Auto-routing Logic
// ============================================================================

/// Check if all epics are completed by reading execution-progress.md
pub fn is_dev_complete(project_path: &str) -> bool {
    let progress_file = Path::new(project_path).join(EXECUTION_PROGRESS_FILE);

    match std::fs::read_to_string(&progress_file) {
        Ok(content) => {
            COMPLETION_MARKERS.iter().any(|marker| content.contains(marker))
        }
        Err(_) => false,
    }
}

/// Determine next workflow based on last prompt
/// Returns: Some(next_prompt) or None if complete
pub fn get_next_workflow(last_prompt: &str, is_complete: bool) -> Option<&'static str> {
    if last_prompt.contains("pm-orchestrator") {
        return Some(PM_EXECUTOR_PROMPT);
    }

    if last_prompt.contains("pm-executor") {
        return Some(PM_REVIEWER_PROMPT);
    }

    if last_prompt.contains("pm-reviewer") {
        if is_complete {
            return None;  // All done!
        }
        return Some(PM_EXECUTOR_PROMPT);  // Next wave
    }

    None
}

/// Check if prompt is a dev workflow prompt
pub fn is_dev_workflow_prompt(prompt: &str) -> bool {
    prompt.contains("pm-orchestrator")
        || prompt.contains("pm-executor")
        || prompt.contains("pm-reviewer")
}

// ============================================================================
// Tauri Commands
// ============================================================================

#[tauri::command]
pub async fn start_dev_workflow(
    app: AppHandle,
    project_path: String,
    model: String,
) -> Result<(), String> {
    log::info!("Starting dev workflow for: {}", project_path);

    let db = app.state::<super::agents::AgentDb>();
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    // Get or create session
    let mut session = get_or_create_dev_session(&conn, &project_path)
        .map_err(|e| e.to_string())?;

    // Reset if needed
    if session.status == "completed" || session.status == "error" {
        reset_dev_session(&conn, &project_path).map_err(|e| e.to_string())?;
        session.cycle_count = 0;
    }

    // Update status
    update_dev_session(&conn, &project_path, PM_ORCHESTRATOR_PROMPT, 0, "running")
        .map_err(|e| e.to_string())?;

    drop(conn);

    // Start first workflow (pm-orchestrator)
    super::claude::execute_claude_code(app, project_path, PM_ORCHESTRATOR_PROMPT.to_string(), model).await
}

#[tauri::command]
pub async fn stop_dev_workflow(
    app: AppHandle,
    project_path: String,
) -> Result<(), String> {
    log::info!("Stopping dev workflow for: {}", project_path);

    let db = app.state::<super::agents::AgentDb>();
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    update_dev_session(&conn, &project_path, "", 0, "idle")
        .map_err(|e| e.to_string())?;

    // Cancel any running claude execution
    drop(conn);
    super::claude::cancel_claude_execution(app, None).await
}

#[tauri::command]
pub async fn get_dev_workflow_status(
    app: AppHandle,
    project_path: String,
) -> Result<DevSession, String> {
    let db = app.state::<super::agents::AgentDb>();
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    get_or_create_dev_session(&conn, &project_path)
        .map_err(|e| e.to_string())
}

/// Called by claude.rs when a Claude process completes
/// This is the auto-routing hook
pub async fn on_claude_complete(
    app: &AppHandle,
    project_path: &str,
    prompt: &str,
    success: bool,
    model: &str,
) -> Result<bool, String> {
    // Only handle dev workflow prompts
    if !is_dev_workflow_prompt(prompt) {
        return Ok(false);
    }

    log::info!("Dev workflow: Claude completed for prompt: {}", prompt);

    let db = app.state::<super::agents::AgentDb>();
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let session = get_or_create_dev_session(&conn, project_path)
        .map_err(|e| e.to_string())?;

    // Check if we're in running state
    if session.status != "running" {
        log::debug!("Dev workflow: Not in running state, skipping auto-route");
        return Ok(false);
    }

    // Check cycle count
    if session.cycle_count >= MAX_DEV_CYCLES {
        log::warn!("Dev workflow: Max cycles reached ({})", MAX_DEV_CYCLES);
        update_dev_session(&conn, project_path, prompt, session.cycle_count, "error")
            .map_err(|e| e.to_string())?;
        return Ok(false);
    }

    // Check if process failed
    if !success {
        log::warn!("Dev workflow: Process failed, stopping auto-route");
        update_dev_session(&conn, project_path, prompt, session.cycle_count, "error")
            .map_err(|e| e.to_string())?;
        return Ok(false);
    }

    // Check completion
    let is_complete = is_dev_complete(project_path);

    // Get next workflow
    let next_prompt = get_next_workflow(prompt, is_complete);

    match next_prompt {
        Some(next) => {
            log::info!("Dev workflow: Auto-routing to {}", next);

            // Update session
            let new_cycle = session.cycle_count + 1;
            update_dev_session(&conn, project_path, next, new_cycle, "running")
                .map_err(|e| e.to_string())?;

            drop(conn);

            // Start next workflow (NEW SESSION)
            super::claude::execute_claude_code(
                app.clone(),
                project_path.to_string(),
                next.to_string(),
                model.to_string(),
            ).await?;

            Ok(true)
        }
        None => {
            log::info!("Dev workflow: All complete!");
            update_dev_session(&conn, project_path, prompt, session.cycle_count, "completed")
                .map_err(|e| e.to_string())?;
            Ok(false)
        }
    }
}
```

#### 1-2. `src-tauri/src/commands/mod.rs` (수정)

```rust
pub mod agents;
pub mod claude;
pub mod dev_workflow;  // 추가
pub mod mcp;
pub mod proxy;
pub mod slash_commands;
pub mod storage;
pub mod usage;
```

#### 1-3. `src-tauri/src/commands/claude.rs` (수정)

`spawn_claude_process` 함수에서 프로세스 완료 시 자동 라우팅 호출 추가:

```rust
// 기존 코드 (약 1305번째 줄 근처)
Ok(status) => {
    log::info!("Claude process exited with status: {}", status);

    // === 추가: Dev workflow auto-routing ===
    let app_for_routing = app_handle_wait.clone();
    let project_path_for_routing = project_path.clone();
    let prompt_for_routing = prompt_clone.clone();
    let model_for_routing = model_clone.clone();
    let success = status.success();

    tokio::spawn(async move {
        if let Err(e) = super::dev_workflow::on_claude_complete(
            &app_for_routing,
            &project_path_for_routing,
            &prompt_for_routing,
            success,
            &model_for_routing,
        ).await {
            log::error!("Dev workflow auto-routing failed: {}", e);
        }
    });
    // === 끝 ===

    // 기존 코드 계속...
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    // ...
}
```

#### 1-4. `src-tauri/src/main.rs` (수정)

- DB 초기화에 dev_sessions 테이블 추가
- Tauri 명령어 등록

```rust
// DB 초기화 부분에 추가
use commands::dev_workflow::init_dev_workflow_db;
init_dev_workflow_db(&conn).expect("Failed to init dev_workflow DB");

// invoke_handler에 추가
.invoke_handler(tauri::generate_handler![
    // ... 기존 명령어들 ...
    commands::dev_workflow::start_dev_workflow,
    commands::dev_workflow::stop_dev_workflow,
    commands::dev_workflow::get_dev_workflow_status,
])
```

---

### Phase 2: Frontend

#### 2-1. `src/constants/development.ts` (신규)

```typescript
export interface DevWorkflowStep {
  id: string;
  title: string;
  prompt: string;
}

export const DEV_WORKFLOW_SEQUENCE: DevWorkflowStep[] = [
  {
    id: 'pm-orchestrator',
    title: 'PM Orchestrator',
    prompt: '/anyon:anyon-method:workflows:pm-orchestrator',
  },
  {
    id: 'pm-executor',
    title: 'PM Executor',
    prompt: '/anyon:anyon-method:workflows:pm-executor',
  },
  {
    id: 'pm-reviewer',
    title: 'PM Reviewer',
    prompt: '/anyon:anyon-method:workflows:pm-reviewer',
  },
];

export const isDevWorkflowPrompt = (prompt: string): boolean => {
  return DEV_WORKFLOW_SEQUENCE.some((step) => prompt.includes(step.id));
};

export const getCurrentStepFromPrompt = (prompt: string): DevWorkflowStep | null => {
  return DEV_WORKFLOW_SEQUENCE.find((step) => prompt.includes(step.id)) ?? null;
};
```

#### 2-2. `src/lib/api.ts` (추가)

```typescript
// Development workflow API
async startDevWorkflow(projectPath: string, model: string): Promise<void> {
  return apiCall("start_dev_workflow", { projectPath, model });
},

async stopDevWorkflow(projectPath: string): Promise<void> {
  return apiCall("stop_dev_workflow", { projectPath });
},

async getDevWorkflowStatus(projectPath: string): Promise<{
  id: number;
  project_path: string;
  last_prompt: string;
  cycle_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}> {
  return apiCall("get_dev_workflow_status", { projectPath });
},
```

#### 2-3. `src/hooks/useDevWorkflow.ts` (신규)

```typescript
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { getCurrentStepFromPrompt, type DevWorkflowStep } from '@/constants/development';

export type WorkflowStatus = 'idle' | 'running' | 'completed' | 'error';

interface DevSession {
  id: number;
  project_path: string;
  last_prompt: string;
  cycle_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useDevWorkflow(projectPath: string | undefined) {
  const [session, setSession] = useState<DevSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status: WorkflowStatus = (session?.status as WorkflowStatus) || 'idle';
  const currentStep: DevWorkflowStep | null = session?.last_prompt
    ? getCurrentStepFromPrompt(session.last_prompt)
    : null;
  const cycleCount = session?.cycle_count ?? 0;

  // Fetch status
  const refresh = useCallback(async () => {
    if (!projectPath) return;
    try {
      const data = await api.getDevWorkflowStatus(projectPath);
      setSession(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [projectPath]);

  // Poll status while running
  useEffect(() => {
    if (!projectPath) return;

    refresh();
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, [projectPath, refresh]);

  // Start workflow
  const start = useCallback(async (model: string = 'sonnet') => {
    if (!projectPath || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      await api.startDevWorkflow(projectPath, model);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [projectPath, isLoading, refresh]);

  // Stop workflow
  const stop = useCallback(async () => {
    if (!projectPath) return;
    try {
      await api.stopDevWorkflow(projectPath);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }, [projectPath, refresh]);

  return {
    status,
    currentStep,
    cycleCount,
    error,
    isLoading,
    start,
    stop,
    refresh,
  };
}
```

#### 2-4. `src/components/development/DevDocsPanel.tsx` (신규)

```typescript
import React from 'react';
import { PlayCircle, Square, CheckCircle2, Circle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDevWorkflow } from '@/hooks/useDevWorkflow';
import { DEV_WORKFLOW_SEQUENCE } from '@/constants/development';

interface DevDocsPanelProps {
  projectPath: string | undefined;
  isPlanningComplete: boolean;
}

export const DevDocsPanel: React.FC<DevDocsPanelProps> = ({
  projectPath,
  isPlanningComplete,
}) => {
  const {
    status,
    currentStep,
    cycleCount,
    error,
    isLoading,
    start,
    stop,
  } = useDevWorkflow(projectPath);

  if (!projectPath) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>프로젝트를 선택해주세요</p>
      </div>
    );
  }

  if (!isPlanningComplete) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">기획문서를 먼저 완료해주세요</p>
          <p className="text-sm text-muted-foreground">
            PRD, UX Design, Design Guide, TRD, Architecture, ERD 문서가 모두 완료되어야 개발을 시작할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">개발 워크플로우</h3>
          {status === 'running' && (
            <span className="text-xs text-muted-foreground">Cycle {cycleCount}</span>
          )}
        </div>

        {status === 'idle' && (
          <Button onClick={() => start()} disabled={isLoading} size="sm" className="gap-2">
            <PlayCircle className="h-4 w-4" />
            {isLoading ? '시작 중...' : '개발 시작'}
          </Button>
        )}

        {status === 'running' && (
          <Button onClick={stop} variant="outline" size="sm" className="gap-2">
            <Square className="h-4 w-4" />
            중지
          </Button>
        )}

        {status === 'completed' && (
          <span className="text-sm text-primary font-medium flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            완료!
          </span>
        )}

        {status === 'error' && (
          <Button onClick={() => start()} size="sm" variant="destructive" className="gap-2">
            다시 시작
          </Button>
        )}
      </div>

      {/* Workflow Steps */}
      <div className="flex items-center gap-2 justify-center mb-4">
        {DEV_WORKFLOW_SEQUENCE.map((step, index) => {
          const isCurrent = currentStep?.id === step.id;
          const currentIndex = currentStep
            ? DEV_WORKFLOW_SEQUENCE.findIndex(s => s.id === currentStep.id)
            : -1;
          const isPast = currentIndex > index;

          return (
            <React.Fragment key={step.id}>
              <div className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all",
                isCurrent && "bg-primary/10"
              )}>
                {isPast || status === 'completed' ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : isCurrent ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/40" />
                )}
                <span className={cn(
                  "text-xs font-medium",
                  (isPast || isCurrent) && "text-primary",
                  !isPast && !isCurrent && "text-muted-foreground/60"
                )}>
                  {step.title}
                </span>
              </div>
              {index < DEV_WORKFLOW_SEQUENCE.length - 1 && (
                <div className={cn(
                  "w-8 h-px",
                  isPast ? "bg-primary" : "bg-muted-foreground/20"
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded mb-4">
          {error}
        </div>
      )}

      {/* Status Message */}
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        {status === 'idle' && (
          <p>개발 시작 버튼을 눌러 워크플로우를 시작하세요</p>
        )}
        {status === 'running' && currentStep && (
          <p>{currentStep.title} 실행 중...</p>
        )}
        {status === 'completed' && (
          <p>모든 개발 워크플로우가 완료되었습니다! 🎉</p>
        )}
      </div>
    </div>
  );
};

export default DevDocsPanel;
```

#### 2-5. `src/components/development/index.ts` (신규)

```typescript
export { DevDocsPanel } from './DevDocsPanel';
```

#### 2-6. `src/components/MvpWorkspace.tsx` (수정)

개발문서 탭에 DevDocsPanel 연결

---

## 📋 구현 순서

| 순서 | 작업 | 파일 |
|------|------|------|
| 1 | Rust: dev_workflow.rs 생성 | `src-tauri/src/commands/dev_workflow.rs` |
| 2 | Rust: mod.rs 수정 | `src-tauri/src/commands/mod.rs` |
| 3 | Rust: claude.rs 자동 라우팅 훅 추가 | `src-tauri/src/commands/claude.rs` |
| 4 | Rust: main.rs 수정 | `src-tauri/src/main.rs` |
| 5 | Frontend: constants 생성 | `src/constants/development.ts` |
| 6 | Frontend: API 추가 | `src/lib/api.ts` |
| 7 | Frontend: hook 생성 | `src/hooks/useDevWorkflow.ts` |
| 8 | Frontend: components 생성 | `src/components/development/*` |
| 9 | Frontend: MvpWorkspace 수정 | `src/components/MvpWorkspace.tsx` |

---

## ⚠️ 핵심 포인트

1. **새 세션 시작**: `execute_claude_code()` 호출 (continue 아님)
2. **자동 라우팅 트리거**: `spawn_claude_process()` 완료 시점
3. **무한 루프 방지**: `MAX_DEV_CYCLES = 100`
4. **완료 감지**: `execution-progress.md` 파일의 마커 확인
