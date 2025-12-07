use std::net::TcpStream;
use std::path::PathBuf;
use std::time::Duration;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::preview_server::{self, PreviewServerHandle};

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
