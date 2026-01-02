use std::fs;
use std::path::{Path, PathBuf};

use super::shared::FileEntry;

#[tauri::command]
pub async fn list_directory_contents(directory_path: String) -> Result<Vec<FileEntry>, String> {
    log::info!("Listing directory contents: '{}'", directory_path);

    // Check if path is empty
    if directory_path.trim().is_empty() {
        log::error!("Directory path is empty or whitespace");
        return Err("Directory path cannot be empty".to_string());
    }

    let path = PathBuf::from(&directory_path);
    log::debug!("Resolved path: {:?}", path);

    if !path.exists() {
        log::error!("Path does not exist: {:?}", path);
        return Err(format!("Path does not exist: {}", directory_path));
    }

    if !path.is_dir() {
        log::error!("Path is not a directory: {:?}", path);
        return Err(format!("Path is not a directory: {}", directory_path));
    }

    let mut entries = Vec::new();

    let dir_entries =
        fs::read_dir(&path).map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in dir_entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let entry_path = entry.path();
        let metadata = entry
            .metadata()
            .map_err(|e| format!("Failed to read metadata: {}", e))?;

        // Skip hidden files/directories unless they are .claude directories
        if let Some(name) = entry_path.file_name().and_then(|n| n.to_str()) {
            if name.starts_with('.') && name != ".claude" {
                continue;
            }
        }

        let name = entry_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();

        let extension = if metadata.is_file() {
            entry_path
                .extension()
                .and_then(|e| e.to_str())
                .map(|e| e.to_string())
        } else {
            None
        };

        entries.push(FileEntry {
            name,
            path: entry_path.to_string_lossy().to_string(),
            is_directory: metadata.is_dir(),
            size: metadata.len(),
            extension,
        });
    }

    // Sort: directories first, then files, alphabetically within each group
    entries.sort_by(|a, b| match (a.is_directory, b.is_directory) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });

    Ok(entries)
}

#[tauri::command]
pub async fn search_files(base_path: String, query: String) -> Result<Vec<FileEntry>, String> {
    log::info!("Searching files in '{}' for: '{}'", base_path, query);

    // Check if path is empty
    if base_path.trim().is_empty() {
        log::error!("Base path is empty or whitespace");
        return Err("Base path cannot be empty".to_string());
    }

    // Check if query is empty
    if query.trim().is_empty() {
        log::warn!("Search query is empty, returning empty results");
        return Ok(Vec::new());
    }

    let path = PathBuf::from(&base_path);
    log::debug!("Resolved search base path: {:?}", path);

    if !path.exists() {
        log::error!("Base path does not exist: {:?}", path);
        return Err(format!("Path does not exist: {}", base_path));
    }

    let query_lower = query.to_lowercase();
    let mut results = Vec::new();

    search_files_recursive(&path, &path, &query_lower, &mut results, 0)?;

    // Sort by relevance: exact matches first, then by name
    results.sort_by(|a, b| {
        let a_exact = a.name.to_lowercase() == query_lower;
        let b_exact = b.name.to_lowercase() == query_lower;

        match (a_exact, b_exact) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });

    // Limit results to prevent overwhelming the UI
    results.truncate(50);

    Ok(results)
}

fn search_files_recursive(
    current_path: &PathBuf,
    base_path: &PathBuf,
    query: &str,
    results: &mut Vec<FileEntry>,
    depth: usize,
) -> Result<(), String> {
    // Limit recursion depth to prevent excessive searching
    if depth > 5 || results.len() >= 50 {
        return Ok(());
    }

    let entries = fs::read_dir(current_path)
        .map_err(|e| format!("Failed to read directory {:?}: {}", current_path, e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let entry_path = entry.path();

        // Skip hidden files/directories
        if let Some(name) = entry_path.file_name().and_then(|n| n.to_str()) {
            if name.starts_with('.') {
                continue;
            }

            // Check if name matches query
            if name.to_lowercase().contains(query) {
                let metadata = entry
                    .metadata()
                    .map_err(|e| format!("Failed to read metadata: {}", e))?;

                let extension = if metadata.is_file() {
                    entry_path
                        .extension()
                        .and_then(|e| e.to_str())
                        .map(|e| e.to_string())
                } else {
                    None
                };

                results.push(FileEntry {
                    name: name.to_string(),
                    path: entry_path.to_string_lossy().to_string(),
                    is_directory: metadata.is_dir(),
                    size: metadata.len(),
                    extension,
                });
            }
        }

        // Recurse into directories
        if entry_path.is_dir() {
            // Skip common directories that shouldn't be searched
            if let Some(dir_name) = entry_path.file_name().and_then(|n| n.to_str()) {
                if matches!(
                    dir_name,
                    "node_modules" | "target" | ".git" | "dist" | "build" | ".next" | "__pycache__"
                ) {
                    continue;
                }
            }

            search_files_recursive(&entry_path, base_path, query, results, depth + 1)?;
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn read_file_content(file_path: String) -> Result<String, String> {
    log::info!("Reading file content: '{}'", file_path);

    // Check if path is empty
    if file_path.trim().is_empty() {
        log::error!("File path is empty or whitespace");
        return Err("File path cannot be empty".to_string());
    }

    let path = PathBuf::from(&file_path);
    log::debug!("Resolved path: {:?}", path);

    if !path.exists() {
        log::error!("File does not exist: {:?}", path);
        return Err(format!("File does not exist: {}", file_path));
    }

    if !path.is_file() {
        log::error!("Path is not a file: {:?}", path);
        return Err(format!("Path is not a file: {}", file_path));
    }

    // Check file size to prevent reading very large files
    let metadata =
        fs::metadata(&path).map_err(|e| format!("Failed to read file metadata: {}", e))?;

    const MAX_FILE_SIZE: u64 = 10 * 1024 * 1024; // 10MB limit
    if metadata.len() > MAX_FILE_SIZE {
        log::warn!("File is too large: {} bytes", metadata.len());
        return Err(format!(
            "File is too large (max {}MB)",
            MAX_FILE_SIZE / 1024 / 1024
        ));
    }

    // Read the file content
    let content = fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))?;

    Ok(content)
}

#[tauri::command]
pub async fn write_file_content(file_path: String, content: String) -> Result<(), String> {
    log::info!("Writing file content: '{}'", file_path);

    // Check if path is empty
    if file_path.trim().is_empty() {
        log::error!("File path is empty or whitespace");
        return Err("File path cannot be empty".to_string());
    }

    let path = PathBuf::from(&file_path);
    log::debug!("Resolved path: {:?}", path);

    // Ensure parent directory exists
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create parent directory: {}", e))?;
        }
    }

    // Write the file content
    fs::write(&path, &content).map_err(|e| format!("Failed to write file: {}", e))?;

    log::info!("Successfully wrote {} bytes to file", content.len());
    Ok(())
}

#[tauri::command]
pub async fn check_file_exists(path: String) -> Result<bool, String> {
    let file_path = PathBuf::from(&path);
    Ok(file_path.exists() && file_path.is_file())
}

/// 파일 메타데이터 반환 (존재 여부 + 수정 시간)
#[derive(serde::Serialize)]
pub struct FileMetadata {
    pub exists: bool,
    pub modified: u64,
}

#[tauri::command]
pub async fn get_file_metadata(file_path: String) -> Result<Option<FileMetadata>, String> {
    let path = PathBuf::from(&file_path);
    if !path.exists() || !path.is_file() {
        return Ok(None);
    }

    let metadata = fs::metadata(&path).map_err(|e| format!("Failed to get metadata: {}", e))?;

    let modified = metadata
        .modified()
        .map_err(|e| format!("Failed to get modified time: {}", e))?
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| format!("Time error: {}", e))?
        .as_millis() as u64;

    Ok(Some(FileMetadata {
        exists: true,
        modified,
    }))
}

#[tauri::command]
pub async fn list_anyon_docs(project_path: String) -> Result<Vec<String>, String> {
    let base_path = PathBuf::from(&project_path).join("anyon-docs");
    let mut all_entries = Vec::new();

    // planning 폴더 검색
    let planning_path = base_path.join("planning");
    if planning_path.exists() {
        if let Ok(entries) = fs::read_dir(&planning_path) {
            for entry in entries.filter_map(|e| e.ok()) {
                let path = entry.path();
                if path.is_file() {
                    if let Some(name) = entry.file_name().to_str() {
                        all_entries.push(name.to_string());
                    }
                }
            }
        }
    }

    // dev-plan 폴더 검색 (BMAD epics.md 등)
    let dev_plan_path = base_path.join("dev-plan");
    if dev_plan_path.exists() {
        if let Ok(entries) = fs::read_dir(&dev_plan_path) {
            for entry in entries.filter_map(|e| e.ok()) {
                let path = entry.path();
                if path.is_file() {
                    if let Some(name) = entry.file_name().to_str() {
                        // dev-plan/ 접두사 추가하여 구분
                        all_entries.push(format!("dev-plan/{}", name));
                    }
                }
            }
        }
    }

    Ok(all_entries)
}
