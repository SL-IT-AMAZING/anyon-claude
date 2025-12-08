use std::net::TcpStream;
use std::path::PathBuf;
use std::time::Duration;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};

use super::super::dev_server::{self, DevServerManagerHandle, DevServerInfoResponse};
use super::super::preview_server::{self, PreviewServerHandle};

#[derive(Debug, Serialize, Deserialize)]
pub struct PortInfo {
    pub port: u16,
    pub url: String,
    pub alive: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PreviewServerInfo {
    pub running: bool,
    pub port: u16,
    pub project_path: Option<String>,
    pub base_url: Option<String>,
}

#[tauri::command]
pub async fn scan_ports() -> Result<Vec<PortInfo>, String> {
    let common_ports = vec![3000, 3001, 3002, 5173, 5174, 5175, 8080, 8000, 4200, 4321];

    let mut results = Vec::new();

    for port in common_ports {
        let alive = check_port(port);
        results.push(PortInfo {
            port,
            url: format!("http://localhost:{}", port),
            alive,
        });
    }

    Ok(results)
}

fn check_port(port: u16) -> bool {
    TcpStream::connect_timeout(
        &format!("127.0.0.1:{}", port).parse().unwrap(),
        Duration::from_millis(300)
    ).is_ok()
}

/// Start the preview server for a project directory
#[tauri::command]
pub async fn start_file_preview_server(
    state: State<'_, PreviewServerHandle>,
    project_path: String,
) -> Result<PreviewServerInfo, String> {
    let path = PathBuf::from(&project_path);

    if !path.exists() {
        return Err(format!("Project path does not exist: {}", project_path));
    }

    let port = 4001u16;

    // Check if server is already running for the same project
    {
        let state_guard = state.read().await;
        if state_guard.is_running() {
            if let Some(current_path) = state_guard.get_current_path() {
                if current_path == &path {
                    // Already running for this project, just return the info
                    return Ok(PreviewServerInfo {
                        running: true,
                        port: state_guard.get_port(),
                        project_path: Some(project_path),
                        base_url: Some(format!("http://localhost:{}", state_guard.get_port())),
                    });
                }
            }
        }
    }

    preview_server::start_preview_server(state.inner().clone(), path, port)
        .await
        .map_err(|e| format!("Failed to start preview server: {}", e))?;

    Ok(PreviewServerInfo {
        running: true,
        port,
        project_path: Some(project_path),
        base_url: Some(format!("http://localhost:{}", port)),
    })
}

/// Stop the preview server
#[tauri::command]
pub async fn stop_file_preview_server(
    state: State<'_, PreviewServerHandle>,
) -> Result<(), String> {
    preview_server::stop_preview_server(state.inner().clone())
        .await
        .map_err(|e| format!("Failed to stop preview server: {}", e))
}

/// Get the current preview server status
#[tauri::command]
pub async fn get_file_preview_server_status(
    state: State<'_, PreviewServerHandle>,
) -> Result<PreviewServerInfo, String> {
    let state_guard = state.read().await;

    Ok(PreviewServerInfo {
        running: state_guard.is_running(),
        port: state_guard.get_port(),
        project_path: state_guard.get_current_path().map(|p| p.to_string_lossy().to_string()),
        base_url: if state_guard.is_running() {
            Some(format!("http://localhost:{}", state_guard.get_port()))
        } else {
            None
        },
    })
}

/// Get the preview URL for a specific file
#[tauri::command]
pub async fn get_file_preview_url(
    state: State<'_, PreviewServerHandle>,
    file_path: String,
    project_path: String,
) -> Result<String, String> {
    let state_guard = state.read().await;

    if !state_guard.is_running() {
        return Err("Preview server is not running".to_string());
    }

    // Calculate relative path from project root
    let file_path = PathBuf::from(&file_path);
    let project_path = PathBuf::from(&project_path);

    let relative_path = file_path
        .strip_prefix(&project_path)
        .map_err(|_| format!("File is not within the project directory"))?;

    // Convert to URL path (forward slashes)
    let url_path = relative_path
        .to_string_lossy()
        .replace('\\', "/");

    let port = state_guard.get_port();
    Ok(format!("http://localhost:{}/{}", port, url_path))
}

// ============================================================================
// Dev Server Commands
// ============================================================================

/// Start a dev server for a project (npm run dev, yarn dev, etc.)
#[tauri::command]
pub async fn start_dev_server(
    app_handle: AppHandle,
    state: State<'_, DevServerManagerHandle>,
    project_path: String,
) -> Result<(), String> {
    let path = PathBuf::from(&project_path);

    if !path.exists() {
        return Err(format!("Project path does not exist: {}", project_path));
    }

    // Check if package.json exists
    if !path.join("package.json").exists() {
        return Err("No package.json found in project directory".to_string());
    }

    dev_server::start_dev_server(state.inner().clone(), path, app_handle)
        .await
        .map_err(|e| format!("Failed to start dev server: {}", e))?;

    Ok(())
}

/// Stop a dev server for a project
#[tauri::command]
pub async fn stop_dev_server(
    state: State<'_, DevServerManagerHandle>,
    project_path: String,
) -> Result<(), String> {
    let path = PathBuf::from(&project_path);

    dev_server::stop_dev_server(state.inner().clone(), path)
        .await
        .map_err(|e| format!("Failed to stop dev server: {}", e))
}

/// Get dev server info for a project
#[tauri::command]
pub async fn get_dev_server_info(
    state: State<'_, DevServerManagerHandle>,
    project_path: String,
) -> Result<Option<DevServerInfoResponse>, String> {
    let path = PathBuf::from(&project_path);
    Ok(dev_server::get_dev_server_info(state.inner().clone(), path).await)
}

/// Check if a dev server is running for a project
#[tauri::command]
pub async fn is_dev_server_running(
    state: State<'_, DevServerManagerHandle>,
    project_path: String,
) -> Result<bool, String> {
    let path = PathBuf::from(&project_path);
    Ok(dev_server::is_dev_server_running(state.inner().clone(), path).await)
}

/// Detect package manager for a project
#[tauri::command]
pub fn detect_package_manager(project_path: String) -> Result<String, String> {
    let path = PathBuf::from(&project_path);

    if !path.exists() {
        return Err(format!("Project path does not exist: {}", project_path));
    }

    Ok(dev_server::detect_package_manager(&path))
}
