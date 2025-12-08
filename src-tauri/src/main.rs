// Prevents additional console window on Windows in release, DO NOT REMOVE!!
// Temporarily hide console in dev mode too
#![cfg_attr(target_os = "windows", windows_subsystem = "windows")]

mod auth_server;
mod checkpoint;
mod claude_binary;
mod commands;
mod portable_deps;
mod process;

use checkpoint::state::CheckpointState;
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
    cancel_claude_execution, check_anyon_installed, check_auto_checkpoint, check_claude_version,
    cleanup_old_checkpoints, clear_checkpoint_manager, continue_claude_code, create_checkpoint,
    create_project, execute_claude_code, find_claude_md_files, fork_from_checkpoint,
    get_checkpoint_diff, get_checkpoint_settings, get_checkpoint_state_stats,
    get_claude_session_output, get_claude_settings, get_home_directory, get_hooks_config,
    get_project_sessions, get_recently_modified_files, get_session_timeline, get_system_prompt,
    list_checkpoints, list_directory_contents, list_projects, list_running_claude_sessions,
    load_session_history, open_new_session, read_claude_md_file, read_file_content,
    check_file_exists, list_anyon_docs, restore_checkpoint, resume_claude_code,
    run_npx_anyon_agents, check_is_git_repo, init_git_repo, save_claude_md_file, save_claude_settings, save_system_prompt,
    search_files, track_checkpoint_message, track_session_messages, update_checkpoint_settings,
    update_hooks_config, validate_hook_command, ClaudeProcessState,
};
use commands::mcp::{
    mcp_add, mcp_add_from_claude_desktop, mcp_add_json, mcp_get, mcp_get_server_status, mcp_list,
    mcp_read_project_config, mcp_remove, mcp_reset_project_choices, mcp_save_project_config,
    mcp_serve, mcp_test_connection,
};

use commands::preview::scan_ports;
use commands::proxy::{apply_proxy_settings, get_proxy_settings, save_proxy_settings};
use commands::storage::{
    storage_delete_row, storage_execute_sql, storage_insert_row, storage_list_tables,
    storage_read_table, storage_reset_database, storage_update_row,
};
use commands::usage::{
    get_session_stats, get_usage_by_date_range, get_usage_details, get_usage_stats,
};
use process::ProcessRegistryState;
use std::sync::Mutex;
use tauri::{Manager, Emitter};

#[cfg(target_os = "macos")]
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

fn main() {
    // Initialize logger
    env_logger::init();

    // Set IME environment variables for Linux
    // This must be done before any GTK initialization
    #[cfg(target_os = "linux")]
    {
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
        log::info!("IME environment variables set for Linux with {}", ime_module);
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            eprintln!("🔄 [SINGLE-INSTANCE] Triggered with args: {:?}", args);
            log::info!("🔄 Single instance triggered with args: {:?}", args);

            // Forward Deep Link URLs to existing instance
            for arg in args {
                if arg.starts_with("anyon://") {
                    eprintln!("📥 [SINGLE-INSTANCE] Received deep link: {}", arg);
                    log::info!("📥 Received deep link via single-instance: {}", arg);

                    // Emit the deep link event to the frontend
                    let urls = vec![arg.clone()];
                    if let Err(e) = app.emit("plugin:deep-link://urls", urls) {
                        eprintln!("❌ [SINGLE-INSTANCE] Failed to emit deep link event: {}", e);
                        log::error!("Failed to emit deep link event: {}", e);
                    } else {
                        eprintln!("✅ [SINGLE-INSTANCE] Emitted deep link event successfully");
                        log::info!("✅ Emitted deep link event successfully");
                    }

                    // Focus the main window
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.set_focus();
                        let _ = window.unminimize();
                    }
                }
            }
        }))
        .setup(|app| {
            use tauri_plugin_deep_link::DeepLinkExt;

            // Deep Link runtime registration - ALWAYS attempt for debugging
            eprintln!("🔧 [SETUP] Starting Deep Link registration...");
            log::info!("🔧 [SETUP] Starting Deep Link registration...");

            match app.deep_link().register_all() {
                Ok(_) => {
                    eprintln!("✅ [SETUP] Deep link protocols registered successfully");
                    log::info!("✅ Deep link protocols registered successfully");
                },
                Err(e) => {
                    eprintln!("⚠️ [SETUP] Failed to register deep link protocols: {}", e);
                    log::warn!("⚠️ Failed to register deep link protocols: {}", e);
                }
            }

            // Initialize agents database
            let conn = init_database(&app.handle()).expect("Failed to initialize agents database");

            // Load and apply proxy settings from the database
            {
                let db = AgentDb(Mutex::new(conn));
                let proxy_settings = match db.0.lock() {
                    Ok(conn) => {
                        // Directly query proxy settings from the database
                        let mut settings = commands::proxy::ProxySettings::default();

                        let keys = vec![
                            ("proxy_enabled", "enabled"),
                            ("proxy_http", "http_proxy"),
                            ("proxy_https", "https_proxy"),
                            ("proxy_no", "no_proxy"),
                            ("proxy_all", "all_proxy"),
                        ];

                        for (db_key, field) in keys {
                            if let Ok(value) = conn.query_row(
                                "SELECT value FROM app_settings WHERE key = ?1",
                                rusqlite::params![db_key],
                                |row| row.get::<_, String>(0),
                            ) {
                                match field {
                                    "enabled" => settings.enabled = value == "true",
                                    "http_proxy" => {
                                        settings.http_proxy = Some(value).filter(|s| !s.is_empty())
                                    }
                                    "https_proxy" => {
                                        settings.https_proxy = Some(value).filter(|s| !s.is_empty())
                                    }
                                    "no_proxy" => {
                                        settings.no_proxy = Some(value).filter(|s| !s.is_empty())
                                    }
                                    "all_proxy" => {
                                        settings.all_proxy = Some(value).filter(|s| !s.is_empty())
                                    }
                                    _ => {}
                                }
                            }
                        }

                        log::info!("Loaded proxy settings: enabled={}", settings.enabled);
                        settings
                    }
                    Err(e) => {
                        log::warn!("Failed to lock database for proxy settings: {}", e);
                        commands::proxy::ProxySettings::default()
                    }
                };

                // Apply the proxy settings
                apply_proxy_settings(&proxy_settings);
            }

            // Re-open the connection for the app to manage
            let conn = init_database(&app.handle()).expect("Failed to initialize agents database");

            // Initialize dev_workflow table
            commands::dev_workflow::init_dev_workflow_db(&conn)
                .expect("Failed to initialize dev_workflow database");

            app.manage(AgentDb(Mutex::new(conn)));

            // Initialize checkpoint state
            let checkpoint_state = CheckpointState::new();

            // Set the Claude directory path
            if let Ok(claude_dir) = dirs::home_dir()
                .ok_or_else(|| "Could not find home directory")
                .and_then(|home| {
                    let claude_path = home.join(".claude");
                    claude_path
                        .canonicalize()
                        .map_err(|_| "Could not find ~/.claude directory")
                })
            {
                let state_clone = checkpoint_state.clone();
                tauri::async_runtime::spawn(async move {
                    state_clone.set_claude_dir(claude_dir).await;
                });
            }

            app.manage(checkpoint_state);

            // Initialize process registry
            app.manage(ProcessRegistryState::default());

            // Initialize Claude process state
            app.manage(ClaudeProcessState::default());

            // Start auth server in background
            let jwt_secret = std::env::var("JWT_SECRET")
                .unwrap_or_else(|_| "dev-secret-key-change-in-production".to_string());
            let node_env = std::env::var("NODE_ENV")
                .unwrap_or_else(|_| "development".to_string());

            tauri::async_runtime::spawn(async move {
                if let Err(e) = auth_server::start_auth_server(4000, jwt_secret, node_env).await {
                    log::error!("Failed to start auth server: {}", e);
                }
            });

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

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Claude & Project Management
            list_projects,
            create_project,
            get_project_sessions,
            get_home_directory,
            get_claude_settings,
            open_new_session,
            get_system_prompt,
            check_claude_version,
            save_system_prompt,
            save_claude_settings,
            find_claude_md_files,
            read_claude_md_file,
            save_claude_md_file,
            load_session_history,
            execute_claude_code,
            continue_claude_code,
            resume_claude_code,
            cancel_claude_execution,
            list_running_claude_sessions,
            get_claude_session_output,
            list_directory_contents,
            search_files,
            read_file_content,
            check_file_exists,
            list_anyon_docs,
            get_recently_modified_files,
            get_hooks_config,
            update_hooks_config,
            validate_hook_command,
            // Anyon Agents
            check_anyon_installed,
            run_npx_anyon_agents,
            // Git Integration
            check_is_git_repo,
            init_git_repo,
            // Checkpoint Management
            create_checkpoint,
            restore_checkpoint,
            list_checkpoints,
            fork_from_checkpoint,
            get_session_timeline,
            update_checkpoint_settings,
            get_checkpoint_diff,
            track_checkpoint_message,
            track_session_messages,
            check_auto_checkpoint,
            cleanup_old_checkpoints,
            get_checkpoint_settings,
            clear_checkpoint_manager,
            get_checkpoint_state_stats,
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
            // Proxy Settings
            get_proxy_settings,
            save_proxy_settings,
            // Dev Workflow
            commands::dev_workflow::start_dev_workflow,
            commands::dev_workflow::stop_dev_workflow,
            commands::dev_workflow::get_dev_workflow_status,
            // Preview (Port Scanning)
            scan_ports,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
