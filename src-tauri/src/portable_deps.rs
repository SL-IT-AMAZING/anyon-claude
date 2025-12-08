use std::path::PathBuf;
use tauri::Manager;

/// Get the path to the bundled Git executable
///
/// This function searches for Git in the following order:
/// 1. Bundled Git in resources/git-portable/cmd/git.exe
/// 2. System Git in PATH
pub fn get_git_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    // Try bundled Git first
    if let Ok(resource_path) = app_handle.path().resource_dir() {
        let bundled_git = resource_path
            .join("resources")
            .join("git-portable")
            .join("cmd")
            .join("git.exe");

        log::debug!("Checking for bundled Git at: {:?}", bundled_git);

        if bundled_git.exists() {
            log::info!("Using bundled Git: {:?}", bundled_git);
            return Ok(bundled_git);
        }
    }

    // Fallback to system Git
    if let Ok(output) = std::process::Command::new("where")
        .arg("git")
        .output()
    {
        if output.status.success() {
            let path_str = String::from_utf8_lossy(&output.stdout);
            let first_path = path_str.lines().next().unwrap_or("").trim();
            if !first_path.is_empty() {
                let git_path = PathBuf::from(first_path);
                log::info!("Using system Git: {:?}", git_path);
                return Ok(git_path);
            }
        }
    }

    Err("Git not found. Please ensure Git is installed or bundled with the application.".to_string())
}

/// Get the path to the bundled Node.js executable
///
/// This function searches for Node.js in the following order:
/// 1. Bundled Node.js in resources/node-portable/node.exe
/// 2. System Node.js in PATH
pub fn get_node_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    // Try bundled Node first
    if let Ok(resource_path) = app_handle.path().resource_dir() {
        let bundled_node = resource_path
            .join("resources")
            .join("node-portable")
            .join("node.exe");

        log::debug!("Checking for bundled Node at: {:?}", bundled_node);

        if bundled_node.exists() {
            log::info!("Using bundled Node: {:?}", bundled_node);
            return Ok(bundled_node);
        }
    }

    // Fallback to system Node
    if let Ok(output) = std::process::Command::new("where")
        .arg("node")
        .output()
    {
        if output.status.success() {
            let path_str = String::from_utf8_lossy(&output.stdout);
            let first_path = path_str.lines().next().unwrap_or("").trim();
            if !first_path.is_empty() {
                let node_path = PathBuf::from(first_path);
                log::info!("Using system Node: {:?}", node_path);
                return Ok(node_path);
            }
        }
    }

    Err("Node.js not found. Please ensure Node.js is installed or bundled with the application.".to_string())
}

/// Get the path to the bundled NPX executable
///
/// This function searches for NPX in the following order:
/// 1. Bundled NPX in resources/node-portable/npx.cmd
/// 2. System NPX in PATH
pub fn get_npx_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    // Try bundled NPX first
    if let Ok(resource_path) = app_handle.path().resource_dir() {
        let bundled_npx = resource_path
            .join("resources")
            .join("node-portable")
            .join("npx.cmd");

        log::debug!("Checking for bundled NPX at: {:?}", bundled_npx);

        if bundled_npx.exists() {
            log::info!("Using bundled NPX: {:?}", bundled_npx);
            return Ok(bundled_npx);
        }
    }

    // Fallback to system NPX
    if let Ok(output) = std::process::Command::new("where")
        .arg("npx")
        .output()
    {
        if output.status.success() {
            let path_str = String::from_utf8_lossy(&output.stdout);
            let first_path = path_str.lines().next().unwrap_or("").trim();
            if !first_path.is_empty() {
                let npx_path = PathBuf::from(first_path);
                log::info!("Using system NPX: {:?}", npx_path);
                return Ok(npx_path);
            }
        }
    }

    Err("NPX not found. Please ensure Node.js is installed or bundled with the application.".to_string())
}

/// Get the directory containing bundled Node.js binaries
/// This is useful for setting up the PATH environment variable
pub fn get_node_bin_dir(app_handle: &tauri::AppHandle) -> Option<PathBuf> {
    if let Ok(resource_path) = app_handle.path().resource_dir() {
        let node_dir = resource_path
            .join("resources")
            .join("node-portable");

        if node_dir.exists() {
            return Some(node_dir);
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_paths() {
        // These tests would need a mock AppHandle
        // For now, they're placeholders
        println!("Portable deps module loaded");
    }
}
