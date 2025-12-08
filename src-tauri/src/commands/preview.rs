use std::net::TcpStream;
use std::time::Duration;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct PortInfo {
    pub port: u16,
    pub url: String,
    pub alive: bool,
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
