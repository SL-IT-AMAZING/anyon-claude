//! Development workflow auto-routing
//! Based on anyon-mvp's PM workflow logic
//!
//! This module handles automatic workflow progression:
//! pm-orchestrator → pm-executor ↔ pm-reviewer (cycles until complete)

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
    pub status: String, // "idle", "running", "completed", "error"
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

pub fn get_or_create_dev_session(
    conn: &Connection,
    project_path: &str,
) -> rusqlite::Result<DevSession> {
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
                created_at: String::new(),
                updated_at: String::new(),
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
        Ok(content) => COMPLETION_MARKERS
            .iter()
            .any(|marker| content.contains(marker)),
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
            return None; // All done!
        }
        return Some(PM_EXECUTOR_PROMPT); // Next wave
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
    let session =
        get_or_create_dev_session(&conn, &project_path).map_err(|e| e.to_string())?;

    // Reset if needed
    if session.status == "completed" || session.status == "error" {
        reset_dev_session(&conn, &project_path).map_err(|e| e.to_string())?;
    }

    // Update status
    update_dev_session(&conn, &project_path, PM_ORCHESTRATOR_PROMPT, 0, "running")
        .map_err(|e| e.to_string())?;

    drop(conn);

    // Start first workflow in background thread to avoid Send trait issues
    let app_clone = app.clone();
    let project_clone = project_path.clone();
    let model_clone = model.clone();
    std::thread::spawn(move || {
        tauri::async_runtime::block_on(async move {
            if let Err(e) = super::claude::execute_claude_code(
                app_clone,
                project_clone,
                PM_ORCHESTRATOR_PROMPT.to_string(),
                model_clone,
            )
            .await
            {
                log::error!("Failed to start dev workflow: {}", e);
            }
        });
    });

    Ok(())
}

#[tauri::command]
pub async fn stop_dev_workflow(app: AppHandle, project_path: String) -> Result<(), String> {
    log::info!("Stopping dev workflow for: {}", project_path);

    let db = app.state::<super::agents::AgentDb>();
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    update_dev_session(&conn, &project_path, "", 0, "idle").map_err(|e| e.to_string())?;

    drop(conn);

    // Cancel in background thread to avoid Send trait issues
    std::thread::spawn(move || {
        tauri::async_runtime::block_on(async move {
            if let Err(e) = super::claude::cancel_claude_execution(app, None).await {
                log::error!("Failed to cancel Claude execution: {}", e);
            }
        });
    });

    Ok(())
}

#[tauri::command]
pub async fn get_dev_workflow_status(
    app: AppHandle,
    project_path: String,
) -> Result<DevSession, String> {
    let db = app.state::<super::agents::AgentDb>();
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    get_or_create_dev_session(&conn, &project_path).map_err(|e| e.to_string())
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
    log::info!("🔥 on_claude_complete CALLED - prompt: {}, success: {}", prompt, success);

    // Only handle dev workflow prompts
    if !is_dev_workflow_prompt(prompt) {
        log::info!("🔥 Not a dev workflow prompt, skipping auto-route");
        return Ok(false);
    }

    log::info!(
        "🔥 Dev workflow: Claude completed for prompt: {}",
        &prompt[..prompt.len().min(50)]
    );

    // Determine next action in a separate scope to ensure conn is dropped
    let next_action: Option<String> = {
        let db = app.state::<super::agents::AgentDb>();
        let conn = db.0.lock().map_err(|e| e.to_string())?;

        let session = get_or_create_dev_session(&conn, project_path).map_err(|e| e.to_string())?;

        // Check if we're in running state
        if session.status != "running" {
            log::debug!("Dev workflow: Not in running state, skipping auto-route");
            None
        } else if session.cycle_count >= MAX_DEV_CYCLES {
            // Check cycle count
            log::warn!("Dev workflow: Max cycles reached ({})", MAX_DEV_CYCLES);
            update_dev_session(&conn, project_path, prompt, session.cycle_count, "error")
                .map_err(|e| e.to_string())?;
            None
        } else if !success {
            // Check if process failed
            log::warn!("Dev workflow: Process failed, stopping auto-route");
            update_dev_session(&conn, project_path, prompt, session.cycle_count, "error")
                .map_err(|e| e.to_string())?;
            None
        } else {
            // Check completion
            let is_complete = is_dev_complete(project_path);

            // Get next workflow
            let next_prompt = get_next_workflow(prompt, is_complete);

            match next_prompt {
                Some(next) => {
                    log::info!("🚀 Dev workflow: Auto-routing to {}", next);

                    // Update session
                    let new_cycle = session.cycle_count + 1;
                    update_dev_session(&conn, project_path, next, new_cycle, "running")
                        .map_err(|e| e.to_string())?;

                    log::info!("🚀 Updated session - cycle: {}, next: {}", new_cycle, next);
                    Some(next.to_string())
                }
                None => {
                    log::info!("✅ Dev workflow: All complete!");
                    update_dev_session(
                        &conn,
                        project_path,
                        prompt,
                        session.cycle_count,
                        "completed",
                    )
                    .map_err(|e| e.to_string())?;
                    None
                }
            }
        }
    }; // conn is dropped here

    // Execute next workflow if needed (outside of conn scope)
    if let Some(next) = next_action {
        log::info!("🎯 Executing next workflow: {}", next);
        match super::claude::execute_claude_code(
            app.clone(),
            project_path.to_string(),
            next.clone(),
            model.to_string(),
        )
        .await {
            Ok(_) => {
                log::info!("✅ Successfully started next workflow: {}", next);
                Ok(true)
            }
            Err(e) => {
                log::error!("❌ Failed to start next workflow: {}", e);
                Err(format!("Failed to execute next workflow: {}", e))
            }
        }
    } else {
        log::info!("⏹️  No next workflow to execute");
        Ok(false)
    }
}
