use axum::{
    body::Body,
    extract::Request,
    http::{header, Response, StatusCode},
    middleware::{self, Next},
    Router,
};
use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::net::TcpListener;
use tokio::sync::RwLock;
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::ServeDir;

/// Preview server state
pub struct PreviewServerState {
    /// Current server handle (for shutdown)
    shutdown_tx: Option<tokio::sync::oneshot::Sender<()>>,
    /// Current project path being served
    current_path: Option<PathBuf>,
    /// Current port
    port: u16,
}

impl PreviewServerState {
    pub fn new() -> Self {
        Self {
            shutdown_tx: None,
            current_path: None,
            port: 4001,
        }
    }

    pub fn is_running(&self) -> bool {
        self.shutdown_tx.is_some()
    }

    pub fn get_port(&self) -> u16 {
        self.port
    }

    pub fn get_current_path(&self) -> Option<&PathBuf> {
        self.current_path.as_ref()
    }
}

impl Default for PreviewServerState {
    fn default() -> Self {
        Self::new()
    }
}

/// Global preview server state
pub type PreviewServerHandle = Arc<RwLock<PreviewServerState>>;

/// Injected scripts for error capture and component selection
const ANYON_SHIM_SCRIPT: &str = include_str!("../scripts/anyon-shim.js");
const ANYON_COMPONENT_SELECTOR_SCRIPT: &str = include_str!("../scripts/anyon-component-selector.js");

/// Check if the path should have scripts injected (HTML files or routes)
fn should_inject_scripts(path: &str) -> bool {
    let path_lower = path.to_lowercase();

    // Inject for HTML files
    if path_lower.ends_with(".html") || path_lower.ends_with(".htm") {
        return true;
    }

    // Inject for routes without file extensions (SPA routes)
    let last_segment = path.rsplit('/').next().unwrap_or("");
    if !last_segment.contains('.') {
        return true;
    }

    false
}

/// Inject scripts into HTML content
fn inject_scripts_into_html(html: &str) -> String {
    let scripts = format!(
        r#"<script>{}</script>
<script>{}</script>"#,
        ANYON_SHIM_SCRIPT,
        ANYON_COMPONENT_SELECTOR_SCRIPT
    );

    // Try to inject after <head> tag
    if let Some(head_pos) = html.to_lowercase().find("<head") {
        // Find the end of the head opening tag
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

    // Fallback: prepend to HTML
    format!("{}\n{}", scripts, html)
}

/// Middleware to inject scripts into HTML responses
async fn inject_scripts_middleware(
    request: Request,
    next: Next,
) -> Response<Body> {
    let path = request.uri().path().to_string();
    let response = next.run(request).await;

    // Only process HTML responses
    let content_type = response
        .headers()
        .get(header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    let is_html = content_type.contains("text/html");
    let should_inject = should_inject_scripts(&path);

    if !is_html || !should_inject {
        return response;
    }

    // Get the response body
    let (parts, body) = response.into_parts();

    // Read the body
    let bytes = match axum::body::to_bytes(body, usize::MAX).await {
        Ok(bytes) => bytes,
        Err(_) => {
            return Response::builder()
                .status(StatusCode::INTERNAL_SERVER_ERROR)
                .body(Body::from("Failed to read response body"))
                .unwrap();
        }
    };

    // Convert to string and inject scripts
    let html = match String::from_utf8(bytes.to_vec()) {
        Ok(html) => html,
        Err(_) => {
            // Not valid UTF-8, return original
            return Response::from_parts(parts, Body::from(bytes));
        }
    };

    let injected_html = inject_scripts_into_html(&html);

    // Build new response with updated content-length
    let mut response = Response::from_parts(parts, Body::from(injected_html.clone()));
    response.headers_mut().insert(
        header::CONTENT_LENGTH,
        injected_html.len().into(),
    );
    // Remove content-encoding since we modified the content
    response.headers_mut().remove(header::CONTENT_ENCODING);
    // Remove ETag since content has changed
    response.headers_mut().remove(header::ETAG);

    response
}

/// Start the preview server for a given project path
pub async fn start_preview_server(
    state: PreviewServerHandle,
    project_path: PathBuf,
    port: u16,
) -> anyhow::Result<()> {
    // Stop existing server if running
    {
        let mut state_guard = state.write().await;
        if let Some(tx) = state_guard.shutdown_tx.take() {
            let _ = tx.send(());
            // Give it a moment to shut down
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        }
    }

    // Verify the path exists
    if !project_path.exists() {
        return Err(anyhow::anyhow!("Project path does not exist: {:?}", project_path));
    }

    let (shutdown_tx, shutdown_rx) = tokio::sync::oneshot::channel::<()>();

    // Update state
    {
        let mut state_guard = state.write().await;
        state_guard.shutdown_tx = Some(shutdown_tx);
        state_guard.current_path = Some(project_path.clone());
        state_guard.port = port;
    }

    // Create CORS layer to allow all origins (for iframe embedding)
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Create the static file serving service
    let serve_dir = ServeDir::new(&project_path)
        .append_index_html_on_directories(true);

    let app = Router::new()
        .fallback_service(serve_dir)
        .layer(middleware::from_fn(inject_scripts_middleware))
        .layer(cors);

    let addr = SocketAddr::from(([127, 0, 0, 1], port));

    log::info!("Starting preview server on http://{} for {:?}", addr, project_path);

    let listener = TcpListener::bind(addr).await?;

    // Spawn the server with graceful shutdown
    let state_clone = state.clone();
    tokio::spawn(async move {
        let server = axum::serve(listener, app)
            .with_graceful_shutdown(async {
                let _ = shutdown_rx.await;
                log::info!("Preview server shutting down");
            });

        if let Err(e) = server.await {
            log::error!("Preview server error: {}", e);
        }

        // Clean up state on shutdown
        let mut state_guard = state_clone.write().await;
        state_guard.shutdown_tx = None;
        state_guard.current_path = None;
    });

    Ok(())
}

/// Stop the preview server
pub async fn stop_preview_server(state: PreviewServerHandle) -> anyhow::Result<()> {
    let mut state_guard = state.write().await;

    if let Some(tx) = state_guard.shutdown_tx.take() {
        let _ = tx.send(());
        state_guard.current_path = None;
        log::info!("Preview server stopped");
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_should_inject_scripts() {
        assert!(should_inject_scripts("/index.html"));
        assert!(should_inject_scripts("/page.HTML"));
        assert!(should_inject_scripts("/"));
        assert!(should_inject_scripts("/about"));
        assert!(should_inject_scripts("/users/profile"));
        assert!(!should_inject_scripts("/style.css"));
        assert!(!should_inject_scripts("/script.js"));
        assert!(!should_inject_scripts("/image.png"));
    }

    #[test]
    fn test_inject_scripts_into_html() {
        let html = r#"<!DOCTYPE html>
<html>
<head>
    <title>Test</title>
</head>
<body>
    <h1>Hello</h1>
</body>
</html>"#;

        let result = inject_scripts_into_html(html);
        assert!(result.contains("anyon-shim.js"));
        assert!(result.contains("anyon-component-selector"));
    }
}
