// Prevents additional console window on Windows in release, DO NOT REMOVE!!
// Temporarily hide console in dev mode too
#![cfg_attr(target_os = "windows", windows_subsystem = "windows")]

mod auth_server;
mod claude_binary;
mod commands;
mod portable_deps;
mod process;
use commands::agents::{
    cleanup_finished_processes, create_agent, delete_agent, execute_agent, export_agent,
    export_agent_to_file, fetch_github_agent_content, fetch_github_agents, get_agent,
    get_agent_run, get_agent_run_with_real_time_metrics, get_claude_binary_path,
    get_live_session_output, get_session_output, get_session_status, import_agent,
    import_agent_from_file, import_agent_from_github, init_database, kill_agent_session,
    list_agent_runs, list_agent_runs_with_metrics, list_agents, list_claude_installations,
    list_running_sessions, load_agent_session_history, set_claude_binary_path,
    stream_session_output, update_agent, AgentDb,
};
use commands::claude::{
    cancel_claude_execution, check_anyon_installed, check_claude_version, check_file_exists,
    check_is_git_repo, continue_claude_code, create_project, execute_claude_code,
    find_claude_md_files, get_claude_session_output, get_claude_settings, get_file_metadata,
    get_home_directory, get_project_sessions, get_system_prompt, git_add_all, git_commit,
    git_current_branch, git_push, git_set_remote, git_status, init_git_repo, install_anyon_templates,
    list_anyon_docs, list_directory_contents, list_projects, list_running_claude_sessions,
    load_session_history, open_new_session, read_claude_md_file, read_file_content,
    resume_claude_code, save_claude_md_file, save_claude_settings, save_system_prompt,
    search_files, ClaudeProcessState,
};
use commands::claude_auth::{
    claude_auth_check, claude_auth_delete_api_key, claude_auth_disable_anyon_api,
    claude_auth_enable_anyon_api, claude_auth_get_anyon_api_status, claude_auth_logout,
    claude_auth_open_terminal, claude_auth_poll_for_login, claude_auth_save_api_key,
    claude_auth_stop_polling, claude_auth_validate_api_key, claude_oauth_start,
};
use commands::mcp::{
    mcp_add, mcp_add_from_claude_desktop, mcp_add_json, mcp_get, mcp_get_server_status, mcp_list,
    mcp_read_project_config, mcp_remove, mcp_reset_project_choices, mcp_save_project_config,
    mcp_serve, mcp_test_connection,
};

use commands::preview::{check_port_alive, scan_ports};
use commands::storage::{
    storage_delete_row, storage_execute_sql, storage_insert_row, storage_list_tables,
    storage_read_table, storage_reset_database, storage_update_row,
};
use commands::usage::{
    get_session_stats, get_usage_by_date_range, get_usage_details, get_usage_stats,
};
use process::ProcessRegistryState;
use std::sync::Mutex;
use tauri::{Emitter, Manager};

#[cfg(target_os = "macos")]
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

#[cfg(target_os = "windows")]
use window_vibrancy::apply_mica;

/// Initialize logging system
fn init_logging() {
    env_logger::init();
}

/// Setup IME (Input Method Editor) for Linux
#[cfg(target_os = "linux")]
fn setup_linux_ime() {
    // Try multiple IME backends for better compatibility
    // Priority: fcitx5 > fcitx > ibus > xim
    let ime_module = if std::process::Command::new("which")
        .arg("fcitx5")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
    {
        "fcitx5"
    } else if std::process::Command::new("which")
        .arg("fcitx")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
    {
        "fcitx"
    } else if std::process::Command::new("which")
        .arg("ibus")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
    {
        "ibus"
    } else {
        "xim" // fallback to X Input Method
    };

    log::info!("Using IME module: {}", ime_module);

    std::env::set_var("GTK_IM_MODULE", ime_module);
    std::env::set_var("QT_IM_MODULE", ime_module);
    std::env::set_var("XMODIFIERS", format!("@im={}", ime_module));

    if ime_module == "ibus" {
        std::env::set_var("IBUS_ENABLE_SYNC_MODE", "1");
        std::env::set_var("IBUS_USE_PORTAL", "0");
    }

    std::env::set_var("GDK_BACKEND", "x11");
    log::info!(
        "IME environment variables set for Linux with {}",
        ime_module
    );
}

#[cfg(not(target_os = "linux"))]
fn setup_linux_ime() {
    // No-op on non-Linux platforms
}

/// Initialize Tauri plugins
fn init_tauri_plugins() -> impl Fn(tauri::Builder<tauri::Wry>) -> tauri::Builder<tauri::Wry> {
    |builder| {
        builder
            .plugin(tauri_plugin_dialog::init())
            .plugin(tauri_plugin_shell::init())
            .plugin(tauri_plugin_http::init())
            .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
                // Focus the main window when another instance is launched
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.set_focus();
                    let _ = window.unminimize();
                }
            }))
    }
}

/// Setup database and initialize tables
fn setup_database(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let conn = init_database(&app.handle())?;

    // Initialize dev_workflow table
    commands::dev_workflow::init_dev_workflow_db(&conn)?;

    app.manage(AgentDb(Mutex::new(conn)));
    Ok(())
}

/// Setup process registries
fn setup_process_registries(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    app.manage(ProcessRegistryState::default());
    app.manage(ClaudeProcessState::default());
    Ok(())
}

/// Setup auth server
fn setup_auth_server() -> Result<(), Box<dyn std::error::Error>> {
    let node_env = std::env::var("NODE_ENV").unwrap_or_else(|_| "development".to_string());
    let enable_local_auth = node_env != "production"
        || std::env::var("ENABLE_LOCAL_AUTH_SERVER").map(|v| v == "1").unwrap_or(false);

    if !enable_local_auth {
        log::info!(
            "🛑 Local auth server disabled (NODE_ENV={}, ENABLE_LOCAL_AUTH_SERVER not set)",
            node_env
        );
        return Ok(());
    }

    let jwt_secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| {
        eprintln!("⚠️ WARNING: Using development JWT secret. Do NOT use in production!");
        "dev-secret-key-UNSAFE-DO-NOT-USE-IN-PRODUCTION".to_string()
    });

    tauri::async_runtime::spawn(async move {
        if let Err(e) = auth_server::start_auth_server(4000, jwt_secret, node_env).await {
            log::error!("Failed to start auth server: {}", e);
        }
    });

    Ok(())
}

/// Setup window effects (vibrancy, mica)
fn setup_window_effects(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // Apply window vibrancy with rounded corners on macOS
    #[cfg(target_os = "macos")]
    {
        let window = app.get_webview_window("main").unwrap();

        // Try different vibrancy materials that support rounded corners
        let materials = [
            NSVisualEffectMaterial::UnderWindowBackground,
            NSVisualEffectMaterial::WindowBackground,
            NSVisualEffectMaterial::Popover,
            NSVisualEffectMaterial::Menu,
            NSVisualEffectMaterial::Sidebar,
        ];

        let mut applied = false;
        for material in materials.iter() {
            if apply_vibrancy(&window, *material, None, Some(12.0)).is_ok() {
                applied = true;
                break;
            }
        }

        if !applied {
            // Fallback without rounded corners
            apply_vibrancy(
                &window,
                NSVisualEffectMaterial::WindowBackground,
                None,
                None,
            )
            .expect("Failed to apply any window vibrancy");
        }
    }

    // Apply Mica effect on Windows 11 (fails silently on older versions)
    #[cfg(target_os = "windows")]
    {
        if let Some(window) = app.get_webview_window("main") {
            // Apply Mica effect - this only works on Windows 11
            // On Windows 10 or older, this will fail silently
            let _ = apply_mica(&window, None);
        }
    }

    Ok(())
}

/// Setup application state and services
fn setup_application(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    setup_database(app)?;
    setup_process_registries(app)?;
    setup_auth_server()?;
    setup_window_effects(app)?;
    Ok(())
}

/// Create command handlers macro expansion
macro_rules! create_handlers {
    () => {
        tauri::generate_handler![
            // Claude & Project Management - Projects
            commands::claude::projects::get_home_directory,
            commands::claude::projects::list_projects,
            commands::claude::projects::create_project,
            commands::claude::projects::get_project_sessions,
            // Claude & Project Management - Sessions
            commands::claude::sessions::open_new_session,
            commands::claude::sessions::load_session_history,
            // Claude & Project Management - Execution
            commands::claude::execution::execute_claude_code,
            commands::claude::execution::continue_claude_code,
            commands::claude::execution::resume_claude_code,
            commands::claude::execution::cancel_claude_execution,
            commands::claude::execution::list_running_claude_sessions,
            commands::claude::execution::get_claude_session_output,
            // Claude & Project Management - Filesystem
            commands::claude::filesystem::list_directory_contents,
            commands::claude::filesystem::search_files,
            commands::claude::filesystem::read_file_content,
            commands::claude::filesystem::write_file_content,
            commands::claude::filesystem::check_file_exists,
            commands::claude::filesystem::get_file_metadata,
            commands::claude::filesystem::list_anyon_docs,
            // Claude & Project Management - Settings
            commands::claude::settings::get_claude_settings,
            commands::claude::settings::save_claude_settings,
            commands::claude::settings::get_system_prompt,
            commands::claude::settings::save_system_prompt,
            commands::claude::settings::check_claude_version,
            commands::claude::settings::find_claude_md_files,
            commands::claude::settings::read_claude_md_file,
            commands::claude::settings::save_claude_md_file,
            commands::claude::settings::check_anyon_installed,
            commands::claude::settings::install_anyon_templates,
            commands::claude::settings::check_is_git_repo,
            commands::claude::settings::init_git_repo,
            commands::claude::settings::git_add_all,
            commands::claude::settings::git_commit,
            commands::claude::settings::git_set_remote,
            commands::claude::settings::git_push,
            commands::claude::settings::git_status,
            commands::claude::settings::git_current_branch,
            // Agent Management
            list_agents,
            create_agent,
            update_agent,
            delete_agent,
            get_agent,
            execute_agent,
            list_agent_runs,
            get_agent_run,
            list_agent_runs_with_metrics,
            get_agent_run_with_real_time_metrics,
            list_running_sessions,
            kill_agent_session,
            get_session_status,
            cleanup_finished_processes,
            get_session_output,
            get_live_session_output,
            stream_session_output,
            load_agent_session_history,
            get_claude_binary_path,
            set_claude_binary_path,
            list_claude_installations,
            export_agent,
            export_agent_to_file,
            import_agent,
            import_agent_from_file,
            fetch_github_agents,
            fetch_github_agent_content,
            import_agent_from_github,
            // Usage & Analytics
            get_usage_stats,
            get_usage_by_date_range,
            get_usage_details,
            get_session_stats,
            // MCP (Model Context Protocol)
            mcp_add,
            mcp_list,
            mcp_get,
            mcp_remove,
            mcp_add_json,
            mcp_add_from_claude_desktop,
            mcp_serve,
            mcp_test_connection,
            mcp_reset_project_choices,
            mcp_get_server_status,
            mcp_read_project_config,
            mcp_save_project_config,
            // Storage Management
            storage_list_tables,
            storage_read_table,
            storage_update_row,
            storage_delete_row,
            storage_insert_row,
            storage_execute_sql,
            storage_reset_database,
            // Slash Commands
            commands::slash_commands::slash_commands_list,
            commands::slash_commands::slash_command_get,
            commands::slash_commands::slash_command_save,
            commands::slash_commands::slash_command_delete,
            // Dev Workflow
            commands::dev_workflow::start_dev_workflow,
            commands::dev_workflow::stop_dev_workflow,
            commands::dev_workflow::get_dev_workflow_status,
            // Preview (Port Scanning)
            scan_ports,
            check_port_alive,
            // Dev Server with HTML injection proxy
            commands::dev_server::start_dev_server,
            commands::dev_server::stop_dev_server,
            commands::dev_server::get_dev_server_info,
            commands::dev_server::detect_package_manager,
            commands::dev_server::connect_to_existing_server,
            commands::dev_server::verify_server_connection,
            commands::dev_server::wait_for_server_ready,
            // Claude Auth
            claude_auth_check,
            claude_auth_open_terminal,
            claude_auth_save_api_key,
            claude_auth_delete_api_key,
            claude_auth_validate_api_key,
            claude_auth_logout,
            // ANYON API Mode
            claude_auth_enable_anyon_api,
            claude_auth_disable_anyon_api,
            claude_auth_get_anyon_api_status,
            // OAuth Direct Login
            claude_oauth_start,
            claude_auth_poll_for_login,
            claude_auth_stop_polling,
            // Git Operations
            commands::git::get_git_head_sha,
            commands::git::has_git_uncommitted_changes,
            commands::git::git_reset_hard,
            commands::git::get_git_diff_summary,
            commands::git::get_git_log,
            commands::git::get_git_changes_count,
        ]
    };
}

fn main() {
    init_logging();
    setup_linux_ime();

    let plugins = init_tauri_plugins();

    plugins(tauri::Builder::default())
        .setup(setup_application)
        // Note: Drag-drop events are handled automatically by Tauri 2.x
        // when dragDropEnabled: true in tauri.conf.json
        // Frontend uses window.onDragDropEvent() to receive events
        .invoke_handler(create_handlers!())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
