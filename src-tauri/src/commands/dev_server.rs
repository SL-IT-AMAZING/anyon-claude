//! Dev Server with HTML injection proxy
//! Provides script injection for element selector functionality

use std::collections::HashMap;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use std::path::Path;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

// ============================================================================
// Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DevServerInfo {
    pub project_path: String,
    pub pid: u32,
    pub detected_port: Option<u16>,
    pub original_url: Option<String>,
    pub proxy_port: Option<u16>,
    pub proxy_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DevServerOutput {
    pub project_path: String,
    pub output_type: String, // "stdout", "stderr", "info", "port-detected", "error"
    pub message: String,
    pub port: Option<u16>,
    pub proxy_url: Option<String>,
}

struct DevServerState {
    servers: HashMap<String, DevServerEntry>,
}

struct DevServerEntry {
    process: Option<Child>,
    #[allow(dead_code)]
    proxy_handle: Option<thread::JoinHandle<()>>,
    info: DevServerInfo,
    stop_flag: Arc<Mutex<bool>>,
}

// Global state
lazy_static::lazy_static! {
    static ref DEV_SERVERS: Arc<Mutex<DevServerState>> = Arc::new(Mutex::new(DevServerState {
        servers: HashMap::new(),
    }));
}

// ============================================================================
// Element Selector Script (injected into HTML)
// ============================================================================

const ELEMENT_SELECTOR_SCRIPT: &str = r####"
(() => {
  const OVERLAY_CLASS = "__anyon_overlay__";
  let overlays = [];
  let hoverOverlay = null;
  let hoverLabel = null;
  let currentHoveredElement = null;
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  let state = { type: "inactive" };

  const css = (el, obj) => Object.assign(el.style, obj);

  function makeOverlay() {
    const overlay = document.createElement("div");
    overlay.className = OVERLAY_CLASS;
    css(overlay, {
      position: "absolute",
      border: "2px solid #7f22fe",
      background: "rgba(0,170,255,.05)",
      pointerEvents: "none",
      zIndex: "2147483647",
      borderRadius: "4px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
    });

    const label = document.createElement("div");
    css(label, {
      position: "absolute",
      left: "0",
      top: "100%",
      transform: "translateY(4px)",
      background: "#7f22fe",
      color: "#fff",
      fontFamily: "monospace",
      fontSize: "12px",
      lineHeight: "1.2",
      padding: "3px 5px",
      whiteSpace: "nowrap",
      borderRadius: "4px",
      boxShadow: "0 1px 4px rgba(0, 0, 0, 0.1)",
    });
    overlay.appendChild(label);
    document.body.appendChild(overlay);

    return { overlay, label };
  }

  function getElementInfo(el) {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? "#" + el.id : "";
    const classes = el.className && typeof el.className === "string"
      ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".")
      : "";
    return tag + id + classes;
  }

  function getCssSelector(el) {
    if (el.id) return "#" + el.id;
    let path = [];
    while (el && el.nodeType === Node.ELEMENT_NODE) {
      let selector = el.tagName.toLowerCase();
      if (el.id) {
        selector = "#" + el.id;
        path.unshift(selector);
        break;
      } else {
        let sibling = el;
        let nth = 1;
        while (sibling = sibling.previousElementSibling) {
          if (sibling.tagName === el.tagName) nth++;
        }
        if (nth > 1) selector += ":nth-of-type(" + nth + ")";
      }
      path.unshift(selector);
      el = el.parentElement;
    }
    return path.join(" > ");
  }

  function updateOverlay(el, isSelected = false) {
    if (!el) {
      if (hoverOverlay) hoverOverlay.style.display = "none";
      return;
    }

    if (isSelected) {
      if (overlays.some((item) => item.el === el)) return;

      const { overlay, label } = makeOverlay();
      overlays.push({ overlay, label, el });

      const rect = el.getBoundingClientRect();
      css(overlay, {
        top: `${rect.top + window.scrollY}px`,
        left: `${rect.left + window.scrollX}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        display: "block",
        border: "3px solid #7f22fe",
        background: "rgba(127, 34, 254, 0.05)",
      });
      css(label, { display: "none" });
      return;
    }

    if (!hoverOverlay || !hoverLabel) {
      const o = makeOverlay();
      hoverOverlay = o.overlay;
      hoverLabel = o.label;
    }

    const rect = el.getBoundingClientRect();
    css(hoverOverlay, {
      top: `${rect.top + window.scrollY}px`,
      left: `${rect.left + window.scrollX}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      display: "block",
      border: "2px solid #7f22fe",
      background: "rgba(0,170,255,.05)",
    });
    css(hoverLabel, { background: "#7f22fe" });
    hoverLabel.textContent = getElementInfo(el);
  }

  function updateAllOverlayPositions() {
    overlays.forEach(({ overlay, el }) => {
      const rect = el.getBoundingClientRect();
      css(overlay, {
        top: `${rect.top + window.scrollY}px`,
        left: `${rect.left + window.scrollX}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      });
    });

    if (hoverOverlay && hoverOverlay.style.display !== "none" && state.element) {
      const rect = state.element.getBoundingClientRect();
      css(hoverOverlay, {
        top: `${rect.top + window.scrollY}px`,
        left: `${rect.left + window.scrollX}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      });
    }
  }

  function clearOverlays() {
    overlays.forEach(({ overlay }) => overlay.remove());
    overlays = [];
    if (hoverOverlay) {
      hoverOverlay.remove();
      hoverOverlay = null;
      hoverLabel = null;
    }
    currentHoveredElement = null;
  }

  function removeOverlayBySelector(selector) {
    const index = overlays.findIndex(({ el }) => getCssSelector(el) === selector);
    if (index !== -1) {
      const { overlay } = overlays[index];
      overlay.remove();
      overlays.splice(index, 1);
    }
  }

  function onMouseMove(e) {
    let el = e.target;
    while (el && el.classList && el.classList.contains(OVERLAY_CLASS)) {
      el = el.parentElement;
    }
    if (!el || el === document.body || el === document.documentElement) {
      if (hoverOverlay) hoverOverlay.style.display = "none";
      return;
    }

    currentHoveredElement = el;

    if (state.type === "inspecting") {
      if (state.element === el) return;
      state.element = el;
      updateOverlay(el, false);
    }
  }

  function onMouseLeave(e) {
    if (!e.relatedTarget) {
      if (hoverOverlay) hoverOverlay.style.display = "none";
      currentHoveredElement = null;
      if (state.type === "inspecting") state.element = null;
    }
  }

  function onClick(e) {
    if (state.type !== "inspecting" || !state.element) return;
    e.preventDefault();
    e.stopPropagation();

    const el = state.element;
    const selector = getCssSelector(el);

    const existingIndex = overlays.findIndex((item) => getCssSelector(item.el) === selector);
    if (existingIndex !== -1) {
      const { overlay } = overlays[existingIndex];
      overlay.remove();
      overlays.splice(existingIndex, 1);
      window.parent.postMessage({
        type: "anyon-component-deselected",
        componentId: selector,
      }, "*");
      return;
    }

    updateOverlay(el, true);

    window.parent.postMessage({
      type: "anyon-component-selected",
      component: {
        id: selector,
        name: getElementInfo(el),
        tag: el.tagName.toLowerCase(),
        selector: selector,
        text: el.textContent?.substring(0, 200) || null,
        html: el.outerHTML.substring(0, 1000),
        rect: el.getBoundingClientRect(),
      },
    }, "*");
  }

  function onKeyDown(e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) {
      return;
    }
    const key = e.key.toLowerCase();
    const hasShift = e.shiftKey;
    const hasCtrlOrMeta = isMac ? e.metaKey : e.ctrlKey;
    if (key === "c" && hasShift && hasCtrlOrMeta) {
      e.preventDefault();
      window.parent.postMessage({ type: "anyon-select-component-shortcut" }, "*");
    }
  }

  function activate() {
    if (state.type === "inactive") {
      window.addEventListener("click", onClick, true);
    }
    state = { type: "inspecting", element: null };
    document.body.style.cursor = "crosshair";
    console.debug("[Anyon] Element selector activated");
  }

  function deactivate() {
    if (state.type === "inactive") return;
    window.removeEventListener("click", onClick, true);
    if (hoverOverlay) hoverOverlay.style.display = "none";
    overlays.forEach((item) => {
      const label = item.overlay.querySelector("div");
      if (label) label.style.display = "none";
    });
    document.body.style.cursor = "";
    currentHoveredElement = null;
    state = { type: "inactive" };
    console.debug("[Anyon] Element selector deactivated");
  }

  window.addEventListener("message", (e) => {
    if (e.source !== window.parent) return;
    if (e.data.type === "activate-anyon-component-selector") activate();
    if (e.data.type === "deactivate-anyon-component-selector") deactivate();
    if (e.data.type === "clear-anyon-component-overlays") clearOverlays();
    if (e.data.type === "remove-anyon-component-overlay" && e.data.componentId) {
      removeOverlayBySelector(e.data.componentId);
    }
  });

  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("mousemove", onMouseMove, true);
  document.addEventListener("mouseleave", onMouseLeave, true);
  window.addEventListener("resize", updateAllOverlayPositions);
  window.addEventListener("scroll", updateAllOverlayPositions);

  // Notify parent that selector is ready
  setTimeout(() => {
    window.parent.postMessage({ type: "anyon-component-selector-initialized" }, "*");
    console.debug("[Anyon] Element selector initialized");
  }, 100);
})();
"####;

// ============================================================================
// Proxy Server Implementation
// ============================================================================

fn inject_html(html: &str) -> String {
    let script_tag = format!("<script>{}</script>", ELEMENT_SELECTOR_SCRIPT);

    // Try to inject after <head>
    if let Some(pos) = html.to_lowercase().find("<head") {
        if let Some(end_pos) = html[pos..].find('>') {
            let inject_pos = pos + end_pos + 1;
            let mut result = String::with_capacity(html.len() + script_tag.len());
            result.push_str(&html[..inject_pos]);
            result.push_str(&script_tag);
            result.push_str(&html[inject_pos..]);
            return result;
        }
    }

    // Fallback: prepend to entire document
    format!("{}\n{}", script_tag, html)
}

fn is_html_response(headers: &str) -> bool {
    headers.to_lowercase().contains("content-type: text/html")
}

fn handle_proxy_connection(
    mut client_stream: TcpStream,
    target_host: &str,
    target_port: u16,
) -> std::io::Result<()> {
    client_stream.set_read_timeout(Some(Duration::from_secs(30)))?;
    client_stream.set_write_timeout(Some(Duration::from_secs(30)))?;

    // Read client request
    let mut request_buffer = vec![0u8; 8192];
    let bytes_read = client_stream.read(&mut request_buffer)?;
    if bytes_read == 0 {
        return Ok(());
    }
    let request = String::from_utf8_lossy(&request_buffer[..bytes_read]);

    // Parse request to get path
    let first_line = request.lines().next().unwrap_or("");
    let parts: Vec<&str> = first_line.split_whitespace().collect();
    let path = parts.get(1).unwrap_or(&"/");

    // Connect to target server
    let target_addr = format!("{}:{}", target_host, target_port);
    let mut target_stream = TcpStream::connect(&target_addr)?;
    target_stream.set_read_timeout(Some(Duration::from_secs(30)))?;
    target_stream.set_write_timeout(Some(Duration::from_secs(30)))?;

    // Forward request (modify Host header)
    let modified_request = request.replace(
        &format!("Host: localhost:{}", target_port + 10000),
        &format!("Host: {}:{}", target_host, target_port),
    );
    target_stream.write_all(modified_request.as_bytes())?;

    // Read response
    let mut response_buffer = Vec::new();
    let mut chunk = [0u8; 4096];
    loop {
        match target_stream.read(&mut chunk) {
            Ok(0) => break,
            Ok(n) => response_buffer.extend_from_slice(&chunk[..n]),
            Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => break,
            Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => break,
            Err(e) => return Err(e),
        }
        // Check if we have complete response
        if response_buffer.len() > 1000000 {
            break; // Limit response size
        }
    }

    // Check if this is an HTML response that needs injection
    let response_str = String::from_utf8_lossy(&response_buffer);
    let needs_injection = path.ends_with('/')
        || path.ends_with(".html")
        || !path.contains('.')
        || is_html_response(&response_str);

    if needs_injection && response_str.contains("<!DOCTYPE") || response_str.contains("<html") {
        // Parse headers and body
        if let Some(header_end) = response_str.find("\r\n\r\n") {
            let headers = &response_str[..header_end];
            let body = &response_str[header_end + 4..];

            // Inject script into body
            let modified_body = inject_html(body);

            // Rebuild response with correct content-length
            let new_length = modified_body.len();
            let modified_headers = if headers.to_lowercase().contains("content-length") {
                // Replace content-length
                let re = regex::Regex::new(r"(?i)content-length:\s*\d+").unwrap();
                re.replace(headers, format!("Content-Length: {}", new_length)).to_string()
            } else {
                format!("{}\r\nContent-Length: {}", headers, new_length)
            };

            let final_response = format!("{}\r\n\r\n{}", modified_headers, modified_body);
            client_stream.write_all(final_response.as_bytes())?;
        } else {
            client_stream.write_all(&response_buffer)?;
        }
    } else {
        // Forward response as-is
        client_stream.write_all(&response_buffer)?;
    }

    Ok(())
}

fn run_proxy_server(
    proxy_port: u16,
    target_host: String,
    target_port: u16,
    stop_flag: Arc<Mutex<bool>>,
) {
    let listener = match TcpListener::bind(format!("127.0.0.1:{}", proxy_port)) {
        Ok(l) => l,
        Err(e) => {
            log::error!("Failed to bind proxy server: {}", e);
            return;
        }
    };

    listener.set_nonblocking(true).ok();
    log::info!("Proxy server listening on port {}, forwarding to {}:{}", proxy_port, target_host, target_port);

    loop {
        // Check stop flag
        if *stop_flag.lock().unwrap() {
            log::info!("Proxy server stopping");
            break;
        }

        match listener.accept() {
            Ok((stream, _addr)) => {
                let host = target_host.clone();
                thread::spawn(move || {
                    if let Err(e) = handle_proxy_connection(stream, &host, target_port) {
                        log::debug!("Proxy connection error: {}", e);
                    }
                });
            }
            Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                thread::sleep(Duration::from_millis(100));
            }
            Err(e) => {
                log::error!("Accept error: {}", e);
            }
        }
    }
}

fn find_available_port(start: u16) -> Option<u16> {
    for port in start..start + 100 {
        if TcpListener::bind(format!("127.0.0.1:{}", port)).is_ok() {
            return Some(port);
        }
    }
    None
}

fn detect_dev_server_port(output: &str) -> Option<u16> {
    // Common patterns for dev server port detection
    let patterns = [
        r"localhost:(\d+)",
        r"127\.0\.0\.1:(\d+)",
        r"Local:\s*http://[^:]+:(\d+)",
        r"listening on.*:(\d+)",
        r"Started.*:(\d+)",
        r"ready in .* at .*:(\d+)",
        r"➜\s*Local:\s*http://localhost:(\d+)",
    ];

    for pattern in patterns {
        if let Ok(re) = regex::Regex::new(pattern) {
            if let Some(caps) = re.captures(output) {
                if let Some(port_str) = caps.get(1) {
                    if let Ok(port) = port_str.as_str().parse::<u16>() {
                        if port >= 3000 && port <= 65535 {
                            return Some(port);
                        }
                    }
                }
            }
        }
    }
    None
}

// ============================================================================
// Tauri Commands
// ============================================================================

#[tauri::command]
pub async fn detect_package_manager(project_path: String) -> Result<String, String> {
    let path = Path::new(&project_path);

    if path.join("bun.lockb").exists() {
        return Ok("bun".to_string());
    }
    if path.join("pnpm-lock.yaml").exists() {
        return Ok("pnpm".to_string());
    }
    if path.join("yarn.lock").exists() {
        return Ok("yarn".to_string());
    }
    if path.join("package-lock.json").exists() {
        return Ok("npm".to_string());
    }
    if path.join("package.json").exists() {
        return Ok("npm".to_string());
    }

    Err("No package manager detected".to_string())
}

#[tauri::command]
pub async fn start_dev_server(
    app: AppHandle,
    project_path: String,
) -> Result<(), String> {
    log::info!("Starting dev server for: {}", project_path);

    // Detect package manager
    let pm = detect_package_manager(project_path.clone()).await?;
    log::info!("Using package manager: {}", pm);

    // Build command
    let (cmd, args) = match pm.as_str() {
        "bun" => ("bun", vec!["run", "dev"]),
        "pnpm" => ("pnpm", vec!["run", "dev"]),
        "yarn" => ("yarn", vec!["dev"]),
        _ => ("npm", vec!["run", "dev"]),
    };

    // Start process
    let process = Command::new(cmd)
        .args(&args)
        .current_dir(&project_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start dev server: {}", e))?;

    let pid = process.id();
    let stop_flag = Arc::new(Mutex::new(false));

    // Create entry
    let info = DevServerInfo {
        project_path: project_path.clone(),
        pid,
        detected_port: None,
        original_url: None,
        proxy_port: None,
        proxy_url: None,
    };

    let entry = DevServerEntry {
        process: Some(process),
        proxy_handle: None,
        info: info.clone(),
        stop_flag: stop_flag.clone(),
    };

    // Store in global state
    {
        let mut servers = DEV_SERVERS.lock().unwrap();
        servers.servers.insert(project_path.clone(), entry);
    }

    // Spawn thread to read output
    let app_clone = app.clone();
    let project_clone = project_path.clone();
    thread::spawn(move || {
        // Get stdout/stderr from process
        let mut servers = DEV_SERVERS.lock().unwrap();
        if let Some(entry) = servers.servers.get_mut(&project_clone) {
            if let Some(ref mut proc) = entry.process {
                let stdout = proc.stdout.take();
                let stderr = proc.stderr.take();
                drop(servers);

                // Read output in separate threads
                if let Some(mut stdout) = stdout {
                    let app = app_clone.clone();
                    let project = project_clone.clone();
                    thread::spawn(move || {
                        let mut buffer = [0u8; 1024];
                        loop {
                            match stdout.read(&mut buffer) {
                                Ok(0) => break,
                                Ok(n) => {
                                    let output = String::from_utf8_lossy(&buffer[..n]);
                                    let _ = app.emit("dev-server-output", DevServerOutput {
                                        project_path: project.clone(),
                                        output_type: "stdout".to_string(),
                                        message: output.to_string(),
                                        port: None,
                                        proxy_url: None,
                                    });

                                    // Try to detect port
                                    if let Some(port) = detect_dev_server_port(&output) {
                                        log::info!("Detected dev server port: {}", port);

                                        // Start proxy server
                                        if let Some(proxy_port) = find_available_port(port + 10000) {
                                            let stop_flag = {
                                                let mut servers = DEV_SERVERS.lock().unwrap();
                                                if let Some(entry) = servers.servers.get_mut(&project) {
                                                    entry.info.detected_port = Some(port);
                                                    entry.info.original_url = Some(format!("http://localhost:{}", port));
                                                    entry.info.proxy_port = Some(proxy_port);
                                                    entry.info.proxy_url = Some(format!("http://localhost:{}", proxy_port));
                                                    entry.stop_flag.clone()
                                                } else {
                                                    return;
                                                }
                                            };

                                            // Start proxy in background
                                            let proxy_stop = stop_flag.clone();
                                            thread::spawn(move || {
                                                run_proxy_server(proxy_port, "localhost".to_string(), port, proxy_stop);
                                            });

                                            let _ = app.emit("dev-server-output", DevServerOutput {
                                                project_path: project.clone(),
                                                output_type: "port-detected".to_string(),
                                                message: format!("Dev server ready at http://localhost:{}", port),
                                                port: Some(port),
                                                proxy_url: Some(format!("http://localhost:{}", proxy_port)),
                                            });
                                        }
                                    }
                                }
                                Err(_) => break,
                            }
                        }
                    });
                }

                if let Some(mut stderr) = stderr {
                    let app = app_clone.clone();
                    let project = project_clone.clone();
                    thread::spawn(move || {
                        let mut buffer = [0u8; 1024];
                        loop {
                            match stderr.read(&mut buffer) {
                                Ok(0) => break,
                                Ok(n) => {
                                    let output = String::from_utf8_lossy(&buffer[..n]);
                                    let _ = app.emit("dev-server-output", DevServerOutput {
                                        project_path: project.clone(),
                                        output_type: "stderr".to_string(),
                                        message: output.to_string(),
                                        port: None,
                                        proxy_url: None,
                                    });
                                }
                                Err(_) => break,
                            }
                        }
                    });
                }
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn stop_dev_server(project_path: String) -> Result<(), String> {
    log::info!("Stopping dev server for: {}", project_path);

    let mut servers = DEV_SERVERS.lock().unwrap();
    if let Some(entry) = servers.servers.remove(&project_path) {
        // Set stop flag for proxy
        *entry.stop_flag.lock().unwrap() = true;

        // Kill process
        if let Some(mut process) = entry.process {
            let _ = process.kill();
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn get_dev_server_info(project_path: String) -> Result<Option<DevServerInfo>, String> {
    let servers = DEV_SERVERS.lock().unwrap();
    Ok(servers.servers.get(&project_path).map(|e| e.info.clone()))
}
