use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use tauri::AppHandle;
use tauri::Manager;

use super::helpers::{
    decode_project_path, extract_first_user_message, get_claude_dir, get_project_path_from_sessions,
};
use super::shared::{Project, Session};

/// Recursively copy a directory
fn copy_dir_recursive(src: &Path, dst: &Path) -> std::io::Result<()> {
    if !dst.exists() {
        fs::create_dir_all(dst)?;
    }

    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if ty.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)?;
        }
    }

    Ok(())
}

/// Copy .anyon templates and .claude/agents to user project
fn copy_anyon_templates_to_project(project_path: &str, app_handle: &AppHandle) -> Result<(), String> {
    let project_dir = PathBuf::from(project_path);

    // Skip if .anyon already exists (don't overwrite user's customizations)
    let anyon_dest = project_dir.join(".anyon");
    if anyon_dest.exists() {
        log::info!("[copy_anyon_templates] .anyon already exists, skipping copy");
        return Ok(());
    }

    // Get the template source directory
    #[cfg(debug_assertions)]
    let template_source = {
        // Development mode: use local .anyon directory
        let current_exe = std::env::current_exe()
            .map_err(|e| format!("Failed to get current exe path: {}", e))?;

        // Navigate up from target/debug/anyon-claude to find project root
        let mut project_root = current_exe.parent()
            .and_then(|p| p.parent()) // target/debug -> target
            .and_then(|p| p.parent()) // target -> project root (src-tauri)
            .and_then(|p| p.parent()) // src-tauri -> anyon-claude root
            .ok_or("Failed to find project root")?;

        project_root.join(".anyon")
    };

    #[cfg(not(debug_assertions))]
    let template_source = {
        // Production mode: use bundled resources
        app_handle.path().resource_dir()
            .map_err(|e| format!("Failed to get resource dir: {}", e))?
            .join(".anyon")
    };

    log::info!("[copy_anyon_templates] Template source: {:?}", template_source);

    if !template_source.exists() {
        log::warn!("[copy_anyon_templates] Template source not found: {:?}", template_source);
        return Ok(()); // Don't fail project creation if templates are missing
    }

    // Copy .anyon directory
    log::info!("[copy_anyon_templates] Copying .anyon to {:?}", anyon_dest);
    copy_dir_recursive(&template_source, &anyon_dest)
        .map_err(|e| format!("Failed to copy .anyon directory: {}", e))?;

    // Create .claude/agents directory
    let claude_agents_dir = project_dir.join(".claude").join("agents");
    if !claude_agents_dir.exists() {
        log::info!("[copy_anyon_templates] Creating .claude/agents directory");
        fs::create_dir_all(&claude_agents_dir)
            .map_err(|e| format!("Failed to create .claude/agents directory: {}", e))?;
    }

    log::info!("[copy_anyon_templates] Successfully copied templates to {}", project_path);
    Ok(())
}

/// Normalizes a path by resolving symlinks and removing Windows extended path prefix
fn normalize_path(path: &str) -> String {
    // Try to canonicalize to resolve symlinks and OneDrive redirections
    let canonical = fs::canonicalize(path)
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|_| path.to_string());

    // Remove Windows extended path prefix (\\?\) if present
    canonical
        .strip_prefix(r"\\?\")
        .unwrap_or(&canonical)
        .to_string()
}

#[tauri::command]
pub async fn get_home_directory() -> Result<String, String> {
    dirs::home_dir()
        .and_then(|path| path.to_str().map(|s| s.to_string()))
        .ok_or_else(|| "Could not determine home directory".to_string())
}

/// Lists all projects in the ~/.claude/projects directory
#[tauri::command]
pub async fn list_projects() -> Result<Vec<Project>, String> {
    log::info!("Listing projects from ~/.claude/projects");

    let claude_dir = get_claude_dir().map_err(|e| e.to_string())?;
    let projects_dir = claude_dir.join("projects");

    if !projects_dir.exists() {
        log::warn!("Projects directory does not exist: {:?}", projects_dir);
        return Ok(Vec::new());
    }

    let mut projects = Vec::new();

    // Read all directories in the projects folder
    let entries = fs::read_dir(&projects_dir)
        .map_err(|e| format!("Failed to read projects directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        if path.is_dir() {
            let dir_name = path
                .file_name()
                .and_then(|n| n.to_str())
                .ok_or_else(|| "Invalid directory name".to_string())?;

            // Get directory creation time
            let metadata = fs::metadata(&path)
                .map_err(|e| format!("Failed to read directory metadata: {}", e))?;

            let created_at = metadata
                .created()
                .or_else(|_| metadata.modified())
                .unwrap_or(SystemTime::UNIX_EPOCH)
                .duration_since(SystemTime::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();

            // Try to get project path from metadata file first (for new projects without sessions)
            let meta_file = path.join(".project_meta.json");
            let project_path = if meta_file.exists() {
                // Read from metadata file
                match fs::read_to_string(&meta_file) {
                    Ok(content) => match serde_json::from_str::<serde_json::Value>(&content) {
                        Ok(meta) => meta
                            .get("path")
                            .and_then(|p| p.as_str())
                            .map(|s| s.to_string())
                            .unwrap_or_else(|| {
                                log::warn!(
                                    "Invalid metadata file format, falling back to sessions"
                                );
                                match get_project_path_from_sessions(&path) {
                                    Ok(path) => path,
                                    Err(_) => decode_project_path(dir_name),
                                }
                            }),
                        Err(_) => {
                            log::warn!("Failed to parse metadata file, falling back to sessions");
                            match get_project_path_from_sessions(&path) {
                                Ok(path) => path,
                                Err(_) => decode_project_path(dir_name),
                            }
                        }
                    },
                    Err(_) => {
                        log::warn!("Failed to read metadata file, falling back to sessions");
                        match get_project_path_from_sessions(&path) {
                            Ok(path) => path,
                            Err(_) => decode_project_path(dir_name),
                        }
                    }
                }
            } else {
                // No metadata file, try to get from JSONL sessions
                match get_project_path_from_sessions(&path) {
                    Ok(path) => path,
                    Err(e) => {
                        log::warn!("Failed to get project path from sessions for {}: {}, falling back to decode", dir_name, e);
                        decode_project_path(dir_name)
                    }
                }
            };

            // Check if the actual project folder still exists
            if !PathBuf::from(&project_path).exists() {
                log::warn!(
                    "Project folder no longer exists: {}, skipping",
                    project_path
                );
                continue;
            }

            // List all JSONL files (sessions) in this project directory
            let mut sessions = Vec::new();
            let mut most_recent_session: Option<u64> = None;

            if let Ok(session_entries) = fs::read_dir(&path) {
                for session_entry in session_entries.flatten() {
                    let session_path = session_entry.path();
                    if session_path.is_file()
                        && session_path.extension().and_then(|s| s.to_str()) == Some("jsonl")
                    {
                        if let Some(session_id) = session_path.file_stem().and_then(|s| s.to_str())
                        {
                            sessions.push(session_id.to_string());

                            // Track the most recent session timestamp
                            if let Ok(metadata) = fs::metadata(&session_path) {
                                let modified = metadata
                                    .modified()
                                    .unwrap_or(SystemTime::UNIX_EPOCH)
                                    .duration_since(UNIX_EPOCH)
                                    .unwrap_or_default()
                                    .as_secs();

                                most_recent_session = Some(match most_recent_session {
                                    Some(current) => current.max(modified),
                                    None => modified,
                                });
                            }
                        }
                    }
                }
            }

            // Normalize the project path to handle OneDrive/symlink duplicates
            let normalized_project_path = normalize_path(&project_path);

            projects.push(Project {
                id: dir_name.to_lowercase(),
                path: normalized_project_path,
                sessions,
                created_at,
                most_recent_session,
            });
        }
    }

    // Deduplicate projects by normalized path (keep the one with most recent activity)
    let mut path_to_project: HashMap<String, Project> = HashMap::new();
    for project in projects {
        let path_key = project.path.to_lowercase();
        match path_to_project.get(&path_key) {
            Some(existing) => {
                // Keep the project with more recent activity
                let existing_time = existing.most_recent_session.unwrap_or(existing.created_at);
                let new_time = project.most_recent_session.unwrap_or(project.created_at);
                if new_time > existing_time {
                    path_to_project.insert(path_key, project);
                }
            }
            None => {
                path_to_project.insert(path_key, project);
            }
        }
    }

    let mut projects: Vec<Project> = path_to_project.into_values().collect();

    // Sort projects by most recent session activity, then by creation time
    projects.sort_by(|a, b| {
        // First compare by most recent session
        match (a.most_recent_session, b.most_recent_session) {
            (Some(a_time), Some(b_time)) => b_time.cmp(&a_time),
            (Some(_), None) => std::cmp::Ordering::Less,
            (None, Some(_)) => std::cmp::Ordering::Greater,
            (None, None) => b.created_at.cmp(&a.created_at),
        }
    });

    log::info!("Found {} projects", projects.len());
    Ok(projects)
}

/// Creates a new project for the given directory path
#[tauri::command]
pub async fn create_project(path: String, app_handle: AppHandle) -> Result<Project, String> {
    log::info!("Creating project for path: {}", path);

    // Normalize the path to resolve symlinks and OneDrive redirections
    // This prevents duplicate projects when the same folder is accessed via different paths
    let normalized_path = normalize_path(&path);

    log::info!(
        "Normalized path: {} -> {}",
        path,
        normalized_path
    );

    // Encode the path to create a project ID
    // Replace both forward and backward slashes, and colons (for Windows drive letters)
    // Use lowercase for Windows case-insensitivity
    let project_id = normalized_path
        .to_lowercase()
        .replace('/', "-")
        .replace('\\', "-")
        .replace(':', "-");

    // Get claude directory
    let claude_dir = get_claude_dir().map_err(|e| e.to_string())?;
    let projects_dir = claude_dir.join("projects");

    // Create projects directory if it doesn't exist
    if !projects_dir.exists() {
        fs::create_dir_all(&projects_dir)
            .map_err(|e| format!("Failed to create projects directory: {}", e))?;
    }

    // Create project directory if it doesn't exist
    let project_dir = projects_dir.join(&project_id);
    if !project_dir.exists() {
        fs::create_dir_all(&project_dir)
            .map_err(|e| format!("Failed to create project directory: {}", e))?;
    }

    // Save project metadata file with the normalized path
    // This allows us to retrieve the correct path even when there are no sessions yet
    let meta_file = project_dir.join(".project_meta.json");
    let meta_data = serde_json::json!({
        "path": normalized_path,
        "project_id": project_id,
    });
    fs::write(
        &meta_file,
        serde_json::to_string_pretty(&meta_data).unwrap(),
    )
    .map_err(|e| format!("Failed to write project metadata: {}", e))?;

    // Get creation time
    let metadata = fs::metadata(&project_dir)
        .map_err(|e| format!("Failed to read directory metadata: {}", e))?;

    let created_at = metadata
        .created()
        .or_else(|_| metadata.modified())
        .unwrap_or(SystemTime::UNIX_EPOCH)
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    // Copy .anyon templates to user project (async, don't block project creation)
    if let Err(e) = copy_anyon_templates_to_project(&normalized_path, &app_handle) {
        log::warn!("Failed to copy anyon templates: {}", e);
        // Don't fail project creation, templates are optional
    }

    // Return the created project with normalized path
    Ok(Project {
        id: project_id,
        path: normalized_path,
        sessions: Vec::new(),
        created_at,
        most_recent_session: None,
    })
}

/// Gets sessions for a specific project
#[tauri::command]
pub async fn get_project_sessions(project_id: String) -> Result<Vec<Session>, String> {
    log::info!("Getting sessions for project: {}", project_id);

    let claude_dir = get_claude_dir().map_err(|e| e.to_string())?;
    let project_dir = claude_dir.join("projects").join(&project_id);
    let todos_dir = claude_dir.join("todos");

    if !project_dir.exists() {
        return Err(format!("Project directory not found: {}", project_id));
    }

    // Get the actual project path from JSONL files
    let project_path = match get_project_path_from_sessions(&project_dir) {
        Ok(path) => path,
        Err(e) => {
            log::warn!(
                "Failed to get project path from sessions for {}: {}, falling back to decode",
                project_id,
                e
            );
            decode_project_path(&project_id)
        }
    };

    let mut sessions = Vec::new();

    // Read all JSONL files in the project directory
    let entries = fs::read_dir(&project_dir)
        .map_err(|e| format!("Failed to read project directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("jsonl") {
            if let Some(session_id) = path.file_stem().and_then(|s| s.to_str()) {
                // Get file creation time
                let metadata = fs::metadata(&path)
                    .map_err(|e| format!("Failed to read file metadata: {}", e))?;

                let created_at = metadata
                    .created()
                    .or_else(|_| metadata.modified())
                    .unwrap_or(SystemTime::UNIX_EPOCH)
                    .duration_since(SystemTime::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs();

                // Extract first user message and timestamp
                let (first_message, message_timestamp) = extract_first_user_message(&path);

                // Try to load associated todo data
                let todo_path = todos_dir.join(format!("{}.json", session_id));
                let todo_data = if todo_path.exists() {
                    fs::read_to_string(&todo_path)
                        .ok()
                        .and_then(|content| serde_json::from_str(&content).ok())
                } else {
                    None
                };

                sessions.push(Session {
                    id: session_id.to_string(),
                    project_id: project_id.clone(),
                    project_path: project_path.clone(),
                    todo_data,
                    created_at,
                    first_message,
                    message_timestamp,
                });
            }
        }
    }

    // Sort sessions by creation time (newest first)
    sessions.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    log::info!(
        "Found {} sessions for project {}",
        sessions.len(),
        project_id
    );
    Ok(sessions)
}
