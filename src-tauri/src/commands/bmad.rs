use std::path::Path;
use tauri::{AppHandle, Manager};

/// Copy BMAD resources (_bmad folder and .claude/commands/bmad) to target project
#[tauri::command]
pub async fn copy_bmad_folder(
    app: AppHandle,
    target_project_path: String,
) -> Result<(), String> {
    log::info!("Copying BMAD resources to project: {}", target_project_path);

    // Get the source paths (relative to the app)
    let resource_path = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {}", e))?;

    // In development, resources are in the project root
    // In production, they should be bundled as resources
    let project_root = if cfg!(debug_assertions) {
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        Path::new(manifest_dir).parent().unwrap().to_path_buf()
    } else {
        resource_path.clone()
    };

    let target_path = Path::new(&target_project_path);

    // 1. Copy _bmad folder
    let source_bmad = project_root.join("_bmad");
    let target_bmad = target_path.join("_bmad");

    if !source_bmad.exists() {
        return Err(format!(
            "_bmad folder not found at source: {}",
            source_bmad.display()
        ));
    }

    if !target_bmad.exists() {
        copy_dir_recursive(&source_bmad, &target_bmad)
            .map_err(|e| format!("Failed to copy _bmad folder: {}", e))?;
        log::info!("Copied _bmad folder to: {}", target_bmad.display());

        // Reset user_name in config.yaml to empty string (BMAD will prompt on first run)
        let config_path = target_bmad.join("_memory").join("config.yaml");
        if config_path.exists() {
            reset_config_user_name(&config_path)
                .map_err(|e| format!("Failed to reset config user_name: {}", e))?;
            log::info!("Reset user_name in config.yaml");
        }
    } else {
        log::info!("_bmad folder already exists, skipping");
    }

    // 2. Copy .claude/commands/bmad folder (slash commands)
    let source_commands = project_root.join(".claude").join("commands").join("bmad");
    let target_commands = target_path.join(".claude").join("commands").join("bmad");

    if source_commands.exists() && !target_commands.exists() {
        // Ensure parent directories exist
        if let Some(parent) = target_commands.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create .claude/commands directory: {}", e))?;
        }
        copy_dir_recursive(&source_commands, &target_commands)
            .map_err(|e| format!("Failed to copy .claude/commands/bmad folder: {}", e))?;
        log::info!("Copied .claude/commands/bmad to: {}", target_commands.display());
    } else if !source_commands.exists() {
        log::warn!(".claude/commands/bmad not found at source, skipping");
    } else {
        log::info!(".claude/commands/bmad already exists, skipping");
    }

    log::info!("Successfully copied BMAD resources to: {}", target_project_path);
    Ok(())
}

/// Check if _bmad folder exists in the project
#[tauri::command]
pub async fn check_bmad_folder(project_path: String) -> Result<bool, String> {
    let bmad_path = Path::new(&project_path).join("_bmad");
    Ok(bmad_path.exists())
}

/// Recursively copy a directory
fn copy_dir_recursive(src: &Path, dst: &Path) -> std::io::Result<()> {
    if !dst.exists() {
        std::fs::create_dir_all(dst)?;
    }

    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let path = entry.path();
        let dest_path = dst.join(entry.file_name());

        if path.is_dir() {
            copy_dir_recursive(&path, &dest_path)?;
        } else {
            std::fs::copy(&path, &dest_path)?;
        }
    }

    Ok(())
}

/// Reset user_name in BMAD config.yaml to empty string
/// BMAD workflow will prompt user for name on first run
fn reset_config_user_name(config_path: &Path) -> std::io::Result<()> {
    let content = std::fs::read_to_string(config_path)?;

    // Replace user_name: <any value> with user_name: ""
    let updated = content
        .lines()
        .map(|line| {
            if line.trim_start().starts_with("user_name:") {
                "user_name: \"\"".to_string()
            } else {
                line.to_string()
            }
        })
        .collect::<Vec<_>>()
        .join("\n");

    std::fs::write(config_path, updated)?;
    Ok(())
}
