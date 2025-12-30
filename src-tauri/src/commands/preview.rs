use serde::{Deserialize, Serialize};
use std::net::TcpStream;
use std::time::Duration;

#[derive(Debug, Serialize, Deserialize)]
pub struct PortInfo {
    pub port: u16,
    pub url: String,
    pub alive: bool,
}

#[tauri::command]
pub async fn scan_ports() -> Result<Vec<PortInfo>, String> {
    log::info!("scan_ports: Starting port scan...");
    let common_ports = vec![3000, 3001, 3002, 5173, 5174, 5175, 8080, 8000, 4200, 4321];

    let mut results = Vec::new();
    let mut alive_count = 0;

    for port in common_ports {
        let alive = check_port(port);
        if alive {
            alive_count += 1;
        }
        results.push(PortInfo {
            port,
            url: format!("http://localhost:{}", port),
            alive,
        });
    }

    log::info!("scan_ports: Completed. Found {} alive ports", alive_count);
    Ok(results)
}

fn check_port(port: u16) -> bool {
    let alive = TcpStream::connect_timeout(
        &format!("127.0.0.1:{}", port).parse().unwrap(),
        Duration::from_millis(1000), // Increased from 300ms for reliability
    )
    .is_ok();

    log::debug!("scan_ports: port {} - alive: {}", port, alive);
    alive
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PortCheckResult {
    pub port: u16,
    pub alive: bool,
    pub attempts: u32,
    pub elapsed_ms: u64,
}

/// Check if a specific port is alive with optional polling.
///
/// This command polls the specified port until it's alive or max attempts are reached.
/// Useful for waiting for a server to start up.
///
/// # Arguments
/// * `port` - The port number to check
/// * `poll_interval_ms` - Interval between attempts in ms (default: 500)
/// * `max_attempts` - Maximum number of attempts (default: 10, so ~5 seconds total)
#[tauri::command]
pub async fn check_port_alive(
    port: u16,
    poll_interval_ms: Option<u64>,
    max_attempts: Option<u32>,
) -> Result<PortCheckResult, String> {
    let interval = poll_interval_ms.unwrap_or(500);
    let max = max_attempts.unwrap_or(10);
    let start = std::time::Instant::now();

    log::info!(
        "check_port_alive: Checking port {} (max {} attempts, {}ms interval)",
        port,
        max,
        interval
    );

    for attempt in 1..=max {
        if check_port(port) {
            let elapsed = start.elapsed().as_millis() as u64;
            log::info!(
                "check_port_alive: Port {} is alive after {} attempts ({}ms)",
                port,
                attempt,
                elapsed
            );
            return Ok(PortCheckResult {
                port,
                alive: true,
                attempts: attempt,
                elapsed_ms: elapsed,
            });
        }

        if attempt < max {
            tokio::time::sleep(tokio::time::Duration::from_millis(interval)).await;
        }
    }

    let elapsed = start.elapsed().as_millis() as u64;
    log::warn!(
        "check_port_alive: Port {} not responding after {} attempts ({}ms)",
        port,
        max,
        elapsed
    );

    Ok(PortCheckResult {
        port,
        alive: false,
        attempts: max,
        elapsed_ms: elapsed,
    })
}

/// Kill processes running on a specific port
///
/// Uses platform-specific commands to find and kill processes.
/// - Windows: netstat + taskkill
/// - macOS/Linux: lsof + kill
#[tauri::command]
pub async fn kill_port_process(port: u16) -> Result<bool, String> {
    log::info!("kill_port_process: Attempting to kill process on port {}", port);

    #[cfg(target_os = "windows")]
    {
        use std::process::Command;

        // Windows: Use netstat to find PID, then taskkill
        let netstat_output = Command::new("netstat")
            .args(["-ano"])
            .output()
            .map_err(|e| format!("Failed to run netstat: {}", e))?;

        let output_str = String::from_utf8_lossy(&netstat_output.stdout);
        let port_str = format!(":{}", port);

        let mut killed_any = false;
        for line in output_str.lines() {
            if line.contains(&port_str) && line.contains("LISTENING") {
                // Extract PID (last column)
                if let Some(pid) = line.split_whitespace().last() {
                    if let Ok(pid_num) = pid.parse::<u32>() {
                        log::info!("kill_port_process: Found PID {} on port {}", pid_num, port);

                        let kill_result = Command::new("taskkill")
                            .args(["/F", "/PID", &pid_num.to_string()])
                            .output();

                        match kill_result {
                            Ok(output) => {
                                if output.status.success() {
                                    log::info!("kill_port_process: Successfully killed PID {}", pid_num);
                                    killed_any = true;
                                } else {
                                    log::warn!(
                                        "kill_port_process: Failed to kill PID {}: {}",
                                        pid_num,
                                        String::from_utf8_lossy(&output.stderr)
                                    );
                                }
                            }
                            Err(e) => {
                                log::error!("kill_port_process: Failed to run taskkill: {}", e);
                            }
                        }
                    }
                }
            }
        }

        if killed_any {
            // Wait a bit for port to be released
            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        }

        Ok(killed_any)
    }

    #[cfg(not(target_os = "windows"))]
    {
        use std::process::Command;

        // macOS/Linux: Use lsof to find PID, then kill
        let lsof_output = Command::new("lsof")
            .args(["-i", &format!(":{}", port), "-t"])
            .output()
            .map_err(|e| format!("Failed to run lsof: {}", e))?;

        let pids = String::from_utf8_lossy(&lsof_output.stdout);
        let mut killed_any = false;

        for pid_str in pids.lines() {
            if let Ok(pid) = pid_str.trim().parse::<i32>() {
                log::info!("kill_port_process: Found PID {} on port {}", pid, port);

                let kill_result = Command::new("kill")
                    .args(["-9", &pid.to_string()])
                    .output();

                match kill_result {
                    Ok(output) => {
                        if output.status.success() {
                            log::info!("kill_port_process: Successfully killed PID {}", pid);
                            killed_any = true;
                        } else {
                            log::warn!(
                                "kill_port_process: Failed to kill PID {}: {}",
                                pid,
                                String::from_utf8_lossy(&output.stderr)
                            );
                        }
                    }
                    Err(e) => {
                        log::error!("kill_port_process: Failed to run kill: {}", e);
                    }
                }
            }
        }

        if killed_any {
            // Wait a bit for port to be released
            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        }

        Ok(killed_any)
    }
}
