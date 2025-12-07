use axum::Router;
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
