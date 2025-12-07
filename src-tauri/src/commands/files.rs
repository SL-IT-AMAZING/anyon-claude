use std::fs;
use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use tauri::command;

/// File entry for file tree
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileEntry>>,
}

/// Result of a file write operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WriteFileResult {
    pub success: bool,
    pub message: Option<String>,
    pub warning: Option<String>,
}

/// Read a file from the project directory
#[command]
pub async fn read_project_file(
    project_path: String,
    file_path: String,
) -> Result<String, String> {
    let project_dir = PathBuf::from(&project_path);
    let full_path = project_dir.join(&file_path);

    // Security check: ensure the file is within the project directory
    let canonical_project = project_dir.canonicalize()
        .map_err(|e| format!("Failed to resolve project path: {}", e))?;
    let canonical_file = full_path.canonicalize()
        .map_err(|e| format!("Failed to resolve file path: {}", e))?;

    if !canonical_file.starts_with(&canonical_project) {
        return Err("Access denied: file path is outside project directory".to_string());
    }

    // Read the file
    fs::read_to_string(&canonical_file)
        .map_err(|e| format!("Failed to read file: {}", e))
}

/// Write a file to the project directory
#[command]
pub async fn write_project_file(
    project_path: String,
    file_path: String,
    content: String,
    create_dirs: Option<bool>,
) -> Result<WriteFileResult, String> {
    let project_dir = PathBuf::from(&project_path);
    let full_path = project_dir.join(&file_path);

    // Security check: ensure the file will be within the project directory
    // For new files, we can't canonicalize yet, so we check parent directory
    let canonical_project = project_dir.canonicalize()
        .map_err(|e| format!("Failed to resolve project path: {}", e))?;

    // Normalize the path to prevent directory traversal
    let normalized_path = normalize_path(&full_path);
    if !normalized_path.starts_with(&canonical_project) {
        return Err("Access denied: file path is outside project directory".to_string());
    }

    // Create parent directories if requested
    if create_dirs.unwrap_or(true) {
        if let Some(parent) = full_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directories: {}", e))?;
        }
    }

    // Write the file
    fs::write(&full_path, &content)
        .map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(WriteFileResult {
        success: true,
        message: Some(format!("File saved: {}", file_path)),
        warning: None,
    })
}

/// Delete a file from the project directory
#[command]
pub async fn delete_project_file(
    project_path: String,
    file_path: String,
) -> Result<bool, String> {
    let project_dir = PathBuf::from(&project_path);
    let full_path = project_dir.join(&file_path);

    // Security check
    let canonical_project = project_dir.canonicalize()
        .map_err(|e| format!("Failed to resolve project path: {}", e))?;
    let canonical_file = full_path.canonicalize()
        .map_err(|e| format!("Failed to resolve file path: {}", e))?;

    if !canonical_file.starts_with(&canonical_project) {
        return Err("Access denied: file path is outside project directory".to_string());
    }

    // Delete the file
    if canonical_file.is_dir() {
        fs::remove_dir_all(&canonical_file)
            .map_err(|e| format!("Failed to delete directory: {}", e))?;
    } else {
        fs::remove_file(&canonical_file)
            .map_err(|e| format!("Failed to delete file: {}", e))?;
    }

    Ok(true)
}

/// List files in the project directory
#[command]
pub async fn list_project_files(
    project_path: String,
    relative_path: Option<String>,
    depth: Option<u32>,
) -> Result<Vec<FileEntry>, String> {
    let project_dir = PathBuf::from(&project_path);
    let target_dir = if let Some(ref rel_path) = relative_path {
        project_dir.join(rel_path)
    } else {
        project_dir.clone()
    };

    // Security check
    let canonical_project = project_dir.canonicalize()
        .map_err(|e| format!("Failed to resolve project path: {}", e))?;
    let canonical_target = target_dir.canonicalize()
        .map_err(|e| format!("Failed to resolve target path: {}", e))?;

    if !canonical_target.starts_with(&canonical_project) {
        return Err("Access denied: path is outside project directory".to_string());
    }

    let max_depth = depth.unwrap_or(1);
    list_directory(&canonical_target, &canonical_project, 0, max_depth)
}

/// Check if a file exists in the project directory
#[command]
pub async fn project_file_exists(
    project_path: String,
    file_path: String,
) -> Result<bool, String> {
    let project_dir = PathBuf::from(&project_path);
    let full_path = project_dir.join(&file_path);

    // For existence check, we just check if the path exists
    // No need for strict security check since we're just checking existence
    Ok(full_path.exists())
}

/// Create a directory in the project
#[command]
pub async fn create_project_directory(
    project_path: String,
    dir_path: String,
) -> Result<bool, String> {
    let project_dir = PathBuf::from(&project_path);
    let full_path = project_dir.join(&dir_path);

    // Security check using normalized path
    let canonical_project = project_dir.canonicalize()
        .map_err(|e| format!("Failed to resolve project path: {}", e))?;
    let normalized_path = normalize_path(&full_path);

    if !normalized_path.starts_with(&canonical_project) {
        return Err("Access denied: path is outside project directory".to_string());
    }

    fs::create_dir_all(&full_path)
        .map_err(|e| format!("Failed to create directory: {}", e))?;

    Ok(true)
}

/// Rename/move a file or directory within the project
#[command]
pub async fn rename_project_file(
    project_path: String,
    old_path: String,
    new_path: String,
) -> Result<bool, String> {
    let project_dir = PathBuf::from(&project_path);
    let old_full_path = project_dir.join(&old_path);
    let new_full_path = project_dir.join(&new_path);

    // Security check
    let canonical_project = project_dir.canonicalize()
        .map_err(|e| format!("Failed to resolve project path: {}", e))?;
    let canonical_old = old_full_path.canonicalize()
        .map_err(|e| format!("Failed to resolve old path: {}", e))?;
    let normalized_new = normalize_path(&new_full_path);

    if !canonical_old.starts_with(&canonical_project) {
        return Err("Access denied: old path is outside project directory".to_string());
    }
    if !normalized_new.starts_with(&canonical_project) {
        return Err("Access denied: new path is outside project directory".to_string());
    }

    // Create parent directory for new path if needed
    if let Some(parent) = new_full_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directories: {}", e))?;
    }

    fs::rename(&canonical_old, &new_full_path)
        .map_err(|e| format!("Failed to rename file: {}", e))?;

    Ok(true)
}

// Helper function to normalize path (resolve .. and . without requiring file to exist)
fn normalize_path(path: &Path) -> PathBuf {
    let mut normalized = PathBuf::new();
    for component in path.components() {
        match component {
            std::path::Component::ParentDir => {
                normalized.pop();
            }
            std::path::Component::CurDir => {}
            _ => normalized.push(component),
        }
    }
    normalized
}

// Helper function to list directory contents
fn list_directory(
    dir: &Path,
    project_root: &Path,
    current_depth: u32,
    max_depth: u32,
) -> Result<Vec<FileEntry>, String> {
    let mut entries = Vec::new();

    let read_dir = fs::read_dir(dir)
        .map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in read_dir {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();

        // Skip hidden files and common ignore patterns
        if name.starts_with('.') || name == "node_modules" || name == "target" || name == "dist" || name == "build" {
            continue;
        }

        let is_dir = path.is_dir();
        let relative_path = path.strip_prefix(project_root)
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|_| name.clone());

        let children = if is_dir && current_depth < max_depth {
            Some(list_directory(&path, project_root, current_depth + 1, max_depth)?)
        } else {
            None
        };

        entries.push(FileEntry {
            name,
            path: relative_path,
            is_dir,
            children,
        });
    }

    // Sort: directories first, then by name
    entries.sort_by(|a, b| {
        match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });

    Ok(entries)
}
