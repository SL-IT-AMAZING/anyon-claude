//! Development server management
//!
//! This module handles:
//! - Starting/stopping dev servers (npm run dev, yarn dev, etc.)
//! - Port detection from stdout
//! - Proxy server for dev server with script injection

use axum::{
    body::Body,
    extract::State,
    http::{header, HeaderValue, Request, Response, StatusCode, Uri},
    Router,
};
use http_body_util::BodyExt;
use hyper_util::{client::legacy::Client, rt::TokioExecutor};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::net::SocketAddr;
use std::path::PathBuf;
use std::process::Stdio;
use std::sync::Arc;
use tauri::Emitter;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::net::TcpListener;
use tokio::process::{Child, Command};
use tokio::sync::{broadcast, RwLock};

/// Injected scripts for error capture and component selection
const ANYON_SHIM_SCRIPT: &str = include_str!("../scripts/anyon-shim.js");
const ANYON_COMPONENT_SELECTOR_SCRIPT: &str = include_str!("../scripts/anyon-component-selector.js");

/// Dev server output event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DevServerOutput {
    pub project_path: String,
    pub output_type: String, // "stdout", "stderr", "info", "port-detected", "error"
    pub message: String,
    pub port: Option<u16>,
    pub proxy_url: Option<String>,
}

/// Information about a running dev server
#[derive(Debug)]
pub struct DevServerInfo {
    /// Child process handle
    pub child: Child,
    /// Process ID
    pub pid: u32,
    /// Detected port (from stdout)
    pub detected_port: Option<u16>,
    /// Original dev server URL
    pub original_url: Option<String>,
    /// Proxy server port
    pub proxy_port: Option<u16>,
    /// Proxy shutdown sender
    pub proxy_shutdown_tx: Option<tokio::sync::oneshot::Sender<()>>,
    /// Output broadcast channel
    pub output_tx: broadcast::Sender<DevServerOutput>,
}

/// Dev server manager state
pub struct DevServerManager {
    /// Running dev servers by project path
    servers: HashMap<String, DevServerInfo>,
    /// Next proxy port to try
    next_proxy_port: u16,
}

impl DevServerManager {
    pub fn new() -> Self {
        Self {
            servers: HashMap::new(),
            next_proxy_port: 50000,
        }
    }

    /// Find an available port for proxy server
    async fn find_available_port(&mut self) -> anyhow::Result<u16> {
        for _ in 0..100 {
            let port = self.next_proxy_port;
            self.next_proxy_port = if self.next_proxy_port >= 60000 {
                50000
            } else {
                self.next_proxy_port + 1
            };

            // Try to bind to check if port is available
            match TcpListener::bind(SocketAddr::from(([127, 0, 0, 1], port))).await {
                Ok(listener) => {
                    drop(listener);
                    return Ok(port);
                }
                Err(_) => continue,
            }
        }
        Err(anyhow::anyhow!("Could not find available port"))
    }
}

impl Default for DevServerManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Global dev server manager state
pub type DevServerManagerHandle = Arc<RwLock<DevServerManager>>;

/// Create a new dev server manager handle
pub fn create_dev_server_manager() -> DevServerManagerHandle {
    Arc::new(RwLock::new(DevServerManager::new()))
}

/// Detect package manager from project directory
pub fn detect_package_manager(project_path: &PathBuf) -> String {
    // Check for lock files in order of preference
    if project_path.join("bun.lockb").exists() {
        return "bun".to_string();
    }
    if project_path.join("pnpm-lock.yaml").exists() {
        return "pnpm".to_string();
    }
    if project_path.join("yarn.lock").exists() {
        return "yarn".to_string();
    }
    // Default to npm
    "npm".to_string()
}

/// Get the dev command for a package manager
fn get_dev_command(package_manager: &str) -> (&str, Vec<&str>) {
    match package_manager {
        "bun" => ("bun", vec!["run", "dev"]),
        "pnpm" => ("pnpm", vec!["run", "dev"]),
        "yarn" => ("yarn", vec!["dev"]),
        _ => ("npm", vec!["run", "dev"]),
    }
}

/// Parse port from stdout message
fn parse_port_from_output(message: &str) -> Option<u16> {
    // Common patterns:
    // - "Local:   http://localhost:5173/"
    // - "started server on localhost:3000"
    // - "ready started at http://localhost:3000"
    // - "Listening on port 3000"
    // - "Server running at http://127.0.0.1:8080"

    let patterns = [
        r"https?://(?:localhost|127\.0\.0\.1):(\d+)",
        r"(?:port|Port)\s*:?\s*(\d+)",
        r"(?:localhost|127\.0\.0\.1):(\d+)",
    ];

    for pattern in patterns {
        if let Ok(re) = regex::Regex::new(pattern) {
            if let Some(caps) = re.captures(message) {
                if let Some(port_match) = caps.get(1) {
                    if let Ok(port) = port_match.as_str().parse::<u16>() {
                        // Validate port range
                        if port >= 1024 && port <= 65535 {
                            return Some(port);
                        }
                    }
                }
            }
        }
    }
    None
}

/// Start a dev server for the given project
pub async fn start_dev_server(
    state: DevServerManagerHandle,
    project_path: PathBuf,
    app_handle: tauri::AppHandle,
) -> anyhow::Result<broadcast::Receiver<DevServerOutput>> {
    let path_str = project_path.to_string_lossy().to_string();

    // Stop existing server if running
    stop_dev_server(state.clone(), project_path.clone()).await?;

    // Detect package manager
    let package_manager = detect_package_manager(&project_path);
    log::info!(
        "Starting dev server for {:?} with {}",
        project_path,
        package_manager
    );

    let (cmd, args) = get_dev_command(&package_manager);

    // Create output broadcast channel
    let (output_tx, output_rx) = broadcast::channel::<DevServerOutput>(100);

    // Start the process
    let mut child = Command::new(cmd)
        .args(&args)
        .current_dir(&project_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .stdin(Stdio::piped())
        .kill_on_drop(true)
        .spawn()?;

    let pid = child.id().unwrap_or(0);

    // Send initial output
    let _ = output_tx.send(DevServerOutput {
        project_path: path_str.clone(),
        output_type: "info".to_string(),
        message: format!("[anyon] Starting dev server with {} run dev", package_manager),
        port: None,
        proxy_url: None,
    });

    // Take stdout/stderr handles
    let stdout = child.stdout.take();
    let stderr = child.stderr.take();

    // Store server info
    {
        let mut manager = state.write().await;
        manager.servers.insert(
            path_str.clone(),
            DevServerInfo {
                child,
                pid,
                detected_port: None,
                original_url: None,
                proxy_port: None,
                proxy_shutdown_tx: None,
                output_tx: output_tx.clone(),
            },
        );
    }

    // Spawn stdout reader
    if let Some(stdout) = stdout {
        let output_tx_clone = output_tx.clone();
        let path_clone = path_str.clone();
        let state_clone = state.clone();
        let app_handle_clone = app_handle.clone();

        tokio::spawn(async move {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();

            while let Ok(Some(line)) = lines.next_line().await {
                // Send output event
                let _ = output_tx_clone.send(DevServerOutput {
                    project_path: path_clone.clone(),
                    output_type: "stdout".to_string(),
                    message: line.clone(),
                    port: None,
                    proxy_url: None,
                });

                // Emit to frontend
                let _ = app_handle_clone.emit("dev-server-output", DevServerOutput {
                    project_path: path_clone.clone(),
                    output_type: "stdout".to_string(),
                    message: line.clone(),
                    port: None,
                    proxy_url: None,
                });

                // Try to detect port
                if let Some(port) = parse_port_from_output(&line) {
                    log::info!("Detected dev server port: {}", port);

                    // Start proxy server
                    let proxy_result = start_proxy_for_dev_server(
                        state_clone.clone(),
                        path_clone.clone(),
                        port,
                    )
                    .await;

                    match proxy_result {
                        Ok(proxy_port) => {
                            let proxy_url = format!("http://localhost:{}", proxy_port);

                            // Send port detected event
                            let _ = output_tx_clone.send(DevServerOutput {
                                project_path: path_clone.clone(),
                                output_type: "port-detected".to_string(),
                                message: format!("Dev server running on port {}, proxy at {}", port, proxy_url),
                                port: Some(port),
                                proxy_url: Some(proxy_url.clone()),
                            });

                            // Emit to frontend
                            let _ = app_handle_clone.emit("dev-server-output", DevServerOutput {
                                project_path: path_clone.clone(),
                                output_type: "port-detected".to_string(),
                                message: format!("Dev server running on port {}, proxy at {}", port, proxy_url),
                                port: Some(port),
                                proxy_url: Some(proxy_url),
                            });
                        }
                        Err(e) => {
                            log::error!("Failed to start proxy: {}", e);
                        }
                    }
                }
            }
        });
    }

    // Spawn stderr reader
    if let Some(stderr) = stderr {
        let output_tx_clone = output_tx.clone();
        let path_clone = path_str.clone();
        let app_handle_clone = app_handle;

        tokio::spawn(async move {
            let reader = BufReader::new(stderr);
            let mut lines = reader.lines();

            while let Ok(Some(line)) = lines.next_line().await {
                let _ = output_tx_clone.send(DevServerOutput {
                    project_path: path_clone.clone(),
                    output_type: "stderr".to_string(),
                    message: line.clone(),
                    port: None,
                    proxy_url: None,
                });

                // Emit to frontend
                let _ = app_handle_clone.emit("dev-server-output", DevServerOutput {
                    project_path: path_clone.clone(),
                    output_type: "stderr".to_string(),
                    message: line,
                    port: None,
                    proxy_url: None,
                });
            }
        });
    }

    Ok(output_rx)
}

/// Start a proxy server for a dev server
async fn start_proxy_for_dev_server(
    state: DevServerManagerHandle,
    project_path: String,
    target_port: u16,
) -> anyhow::Result<u16> {
    let proxy_port = {
        let mut manager = state.write().await;
        manager.find_available_port().await?
    };

    let (shutdown_tx, shutdown_rx) = tokio::sync::oneshot::channel::<()>();

    // Update server info
    {
        let mut manager = state.write().await;
        if let Some(server) = manager.servers.get_mut(&project_path) {
            server.detected_port = Some(target_port);
            server.original_url = Some(format!("http://localhost:{}", target_port));
            server.proxy_port = Some(proxy_port);
            server.proxy_shutdown_tx = Some(shutdown_tx);
        }
    }

    let target_url = format!("http://localhost:{}", target_port);

    // Start proxy server
    let state_clone = Arc::new(ProxyState {
        target_url: target_url.clone(),
    });

    let app = Router::new()
        .fallback(proxy_handler)
        .with_state(state_clone);

    let addr = SocketAddr::from(([127, 0, 0, 1], proxy_port));
    let listener = TcpListener::bind(addr).await?;

    log::info!(
        "Starting proxy server on http://localhost:{} -> {}",
        proxy_port,
        target_url
    );

    tokio::spawn(async move {
        let server = axum::serve(listener, app).with_graceful_shutdown(async {
            let _ = shutdown_rx.await;
            log::info!("Proxy server shutting down");
        });

        if let Err(e) = server.await {
            log::error!("Proxy server error: {}", e);
        }
    });

    Ok(proxy_port)
}

/// Proxy state
#[derive(Clone)]
struct ProxyState {
    target_url: String,
}

/// Proxy request handler
async fn proxy_handler(
    State(state): State<Arc<ProxyState>>,
    req: Request<Body>,
) -> Response<Body> {
    let path = req.uri().path().to_string();
    let path_query = req
        .uri()
        .path_and_query()
        .map(|pq| pq.as_str().to_string())
        .unwrap_or_else(|| path.clone());

    let target_uri = format!("{}{}", state.target_url, path_query);

    // Build client request
    let client: Client<hyper_util::client::legacy::connect::HttpConnector, Body> =
        Client::builder(TokioExecutor::new()).build_http();

    let mut builder = Request::builder()
        .method(req.method())
        .uri(&target_uri);

    // Copy headers
    for (key, value) in req.headers() {
        if key != header::HOST {
            builder = builder.header(key, value);
        }
    }

    // Set host header to target
    if let Ok(uri) = target_uri.parse::<Uri>() {
        if let Some(host) = uri.host() {
            let host_value = if let Some(port) = uri.port() {
                format!("{}:{}", host, port)
            } else {
                host.to_string()
            };
            builder = builder.header(header::HOST, host_value);
        }
    }

    let proxy_req = match builder.body(req.into_body()) {
        Ok(req) => req,
        Err(e) => {
            log::error!("Failed to build proxy request: {}", e);
            return Response::builder()
                .status(StatusCode::INTERNAL_SERVER_ERROR)
                .body(Body::from("Failed to build proxy request"))
                .unwrap();
        }
    };

    // Send request to target
    match client.request(proxy_req).await {
        Ok(response) => {
            let (parts, body) = response.into_parts();

            // Check if HTML response
            let content_type = parts
                .headers
                .get(header::CONTENT_TYPE)
                .and_then(|v| v.to_str().ok())
                .unwrap_or("");
            let is_html = content_type.contains("text/html");
            let should_inject = should_inject_scripts(&path);

            if is_html && should_inject {
                // Read body and inject scripts using http_body_util
                match body.collect().await {
                    Ok(collected) => {
                        let bytes = collected.to_bytes();
                        if let Ok(html) = String::from_utf8(bytes.to_vec()) {
                            let injected = inject_scripts_into_html(&html);
                            let mut response = Response::from_parts(parts, Body::from(injected.clone()));
                            response.headers_mut().insert(
                                header::CONTENT_LENGTH,
                                HeaderValue::from(injected.len()),
                            );
                            response.headers_mut().remove(header::CONTENT_ENCODING);
                            response.headers_mut().remove(header::ETAG);
                            return response;
                        }
                        Response::from_parts(parts, Body::from(bytes))
                    }
                    Err(_) => Response::builder()
                        .status(StatusCode::INTERNAL_SERVER_ERROR)
                        .body(Body::from("Failed to read response body"))
                        .unwrap(),
                }
            } else {
                // Convert Incoming body to axum Body
                let body_bytes = match body.collect().await {
                    Ok(collected) => collected.to_bytes(),
                    Err(_) => {
                        return Response::builder()
                            .status(StatusCode::INTERNAL_SERVER_ERROR)
                            .body(Body::from("Failed to read response body"))
                            .unwrap();
                    }
                };
                Response::from_parts(parts, Body::from(body_bytes))
            }
        }
        Err(e) => {
            log::error!("Proxy request failed: {}", e);
            Response::builder()
                .status(StatusCode::BAD_GATEWAY)
                .body(Body::from(format!("Proxy error: {}", e)))
                .unwrap()
        }
    }
}

/// Check if scripts should be injected
fn should_inject_scripts(path: &str) -> bool {
    let path_lower = path.to_lowercase();
    if path_lower.ends_with(".html") || path_lower.ends_with(".htm") {
        return true;
    }
    let last_segment = path.rsplit('/').next().unwrap_or("");
    if !last_segment.contains('.') {
        return true;
    }
    false
}

/// Inject scripts into HTML
fn inject_scripts_into_html(html: &str) -> String {
    let scripts = format!(
        r#"<script>{}</script>
<script>{}</script>"#,
        ANYON_SHIM_SCRIPT, ANYON_COMPONENT_SELECTOR_SCRIPT
    );

    if let Some(head_pos) = html.to_lowercase().find("<head") {
        if let Some(head_end) = html[head_pos..].find('>') {
            let insert_pos = head_pos + head_end + 1;
            let mut result = String::with_capacity(html.len() + scripts.len() + 1);
            result.push_str(&html[..insert_pos]);
            result.push('\n');
            result.push_str(&scripts);
            result.push_str(&html[insert_pos..]);
            return result;
        }
    }
    format!("{}\n{}", scripts, html)
}

/// Stop a dev server for the given project
pub async fn stop_dev_server(
    state: DevServerManagerHandle,
    project_path: PathBuf,
) -> anyhow::Result<()> {
    let path_str = project_path.to_string_lossy().to_string();

    let mut manager = state.write().await;

    if let Some(mut server) = manager.servers.remove(&path_str) {
        log::info!("Stopping dev server for {:?}", project_path);

        // Stop proxy server first
        if let Some(tx) = server.proxy_shutdown_tx.take() {
            let _ = tx.send(());
        }

        // Kill the process
        let _ = server.child.kill().await;

        // Send termination event
        let _ = server.output_tx.send(DevServerOutput {
            project_path: path_str,
            output_type: "info".to_string(),
            message: "[anyon] Dev server stopped".to_string(),
            port: None,
            proxy_url: None,
        });
    }

    Ok(())
}

/// Get dev server info
pub async fn get_dev_server_info(
    state: DevServerManagerHandle,
    project_path: PathBuf,
) -> Option<DevServerInfoResponse> {
    let path_str = project_path.to_string_lossy().to_string();
    let manager = state.read().await;

    manager.servers.get(&path_str).map(|server| DevServerInfoResponse {
        project_path: path_str,
        pid: server.pid,
        detected_port: server.detected_port,
        original_url: server.original_url.clone(),
        proxy_port: server.proxy_port,
        proxy_url: server.proxy_port.map(|p| format!("http://localhost:{}", p)),
    })
}

/// Dev server info response (serializable)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DevServerInfoResponse {
    pub project_path: String,
    pub pid: u32,
    pub detected_port: Option<u16>,
    pub original_url: Option<String>,
    pub proxy_port: Option<u16>,
    pub proxy_url: Option<String>,
}

/// Check if a dev server is running for the given project
pub async fn is_dev_server_running(
    state: DevServerManagerHandle,
    project_path: PathBuf,
) -> bool {
    let path_str = project_path.to_string_lossy().to_string();
    let manager = state.read().await;
    manager.servers.contains_key(&path_str)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_port_from_output() {
        assert_eq!(
            parse_port_from_output("  Local:   http://localhost:5173/"),
            Some(5173)
        );
        assert_eq!(
            parse_port_from_output("Server running at http://127.0.0.1:3000"),
            Some(3000)
        );
        assert_eq!(
            parse_port_from_output("Listening on port 8080"),
            Some(8080)
        );
        assert_eq!(
            parse_port_from_output("ready started at http://localhost:3000"),
            Some(3000)
        );
        assert_eq!(parse_port_from_output("Just some random text"), None);
    }

    #[test]
    fn test_detect_package_manager() {
        // This would need actual file system setup for proper testing
    }
}
