//! Dev Server with HTML injection proxy
//! Provides script injection for element selector functionality

use std::collections::HashMap;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::Path;
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

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
// Console capture - iframe 콘솔 로그를 부모로 전달
(() => {
  if (window.__anyonConsoleCapture__) return;
  window.__anyonConsoleCapture__ = true;

  const methods = ['log', 'warn', 'error', 'info', 'debug'];
  methods.forEach(method => {
    const original = console[method];
    console[method] = function(...args) {
      try {
        window.parent.postMessage({
          type: 'anyon-console',
          level: method,
          args: args.map(arg => {
            try {
              if (arg === null) return 'null';
              if (arg === undefined) return 'undefined';
              if (typeof arg === 'function') return '[Function]';
              if (typeof arg === 'object') {
                if (arg instanceof HTMLElement) return '<' + arg.tagName.toLowerCase() + '>';
                if (arg instanceof Error) return arg.stack || arg.message;
                return JSON.stringify(arg, null, 2);
              }
              return String(arg);
            } catch (e) { return '[Unserializable]'; }
          }),
          timestamp: Date.now(),
        }, '*');
      } catch (e) {}
      original.apply(console, args);
    };
  });
})();

// Element selector
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
// Proxy Server Implementation (Rewritten for chunked/compression support)
// ============================================================================

use brotli::Decompressor;
use flate2::read::{DeflateDecoder, GzDecoder};
use std::io::{BufRead, BufReader};

/// Parsed HTTP response with full support for chunked encoding and compression
struct HttpResponse {
    status_code: u16,
    headers: HashMap<String, String>,
    body: Vec<u8>,
    is_chunked: bool,
    content_encoding: Option<String>,
}

impl HttpResponse {
    fn get_header(&self, name: &str) -> Option<&String> {
        let lower_name = name.to_lowercase();
        self.headers
            .iter()
            .find(|(k, _)| k.to_lowercase() == lower_name)
            .map(|(_, v)| v)
    }
}

/// Read complete HTTP response with chunked encoding support
fn read_full_response(stream: &mut TcpStream) -> std::io::Result<HttpResponse> {
    stream.set_read_timeout(Some(Duration::from_secs(30)))?;

    let mut reader = BufReader::new(stream.try_clone()?);

    // 1. Read status line
    let mut status_line = String::new();
    reader.read_line(&mut status_line)?;

    let status_code = status_line
        .split_whitespace()
        .nth(1)
        .and_then(|s| s.parse::<u16>().ok())
        .unwrap_or(200);

    // 2. Read headers until empty line
    let mut headers = HashMap::new();
    let mut is_chunked = false;
    let mut content_length: Option<usize> = None;
    let mut content_encoding: Option<String> = None;

    loop {
        let mut line = String::new();
        reader.read_line(&mut line)?;

        let trimmed = line.trim();
        if trimmed.is_empty() {
            break;
        }

        if let Some(colon_pos) = trimmed.find(':') {
            let key = trimmed[..colon_pos].trim().to_string();
            let value = trimmed[colon_pos + 1..].trim().to_string();
            let lower_key = key.to_lowercase();

            if lower_key == "transfer-encoding" && value.to_lowercase().contains("chunked") {
                is_chunked = true;
            }
            if lower_key == "content-length" {
                content_length = value.parse().ok();
            }
            if lower_key == "content-encoding" {
                content_encoding = Some(value.to_lowercase());
            }

            headers.insert(key, value);
        }
    }

    // 3. Read body based on transfer encoding
    let body = if is_chunked {
        read_chunked_body(&mut reader)?
    } else if let Some(len) = content_length {
        let mut body = vec![0u8; len];
        reader.read_exact(&mut body)?;
        body
    } else {
        // No content-length, read until connection closes (with limit)
        let mut body = Vec::new();
        let mut chunk = [0u8; 4096];
        loop {
            match reader.read(&mut chunk) {
                Ok(0) => break,
                Ok(n) => {
                    body.extend_from_slice(&chunk[..n]);
                    if body.len() > 5_000_000 {
                        // 5MB limit
                        break;
                    }
                }
                Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => break,
                Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => break,
                Err(e) => return Err(e),
            }
        }
        body
    };

    log::debug!(
        "Proxy: Read response - status={}, chunked={}, encoding={:?}, body_len={}",
        status_code,
        is_chunked,
        content_encoding,
        body.len()
    );

    Ok(HttpResponse {
        status_code,
        headers,
        body,
        is_chunked,
        content_encoding,
    })
}

/// Read chunked transfer encoding body
fn read_chunked_body(reader: &mut BufReader<TcpStream>) -> std::io::Result<Vec<u8>> {
    let mut body = Vec::new();

    loop {
        // Read chunk size line
        let mut size_line = String::new();
        reader.read_line(&mut size_line)?;

        let chunk_size = usize::from_str_radix(size_line.trim(), 16).unwrap_or(0);

        if chunk_size == 0 {
            // Read trailing CRLF after last chunk
            let mut trailer = String::new();
            let _ = reader.read_line(&mut trailer);
            break;
        }

        // Read chunk data
        let mut chunk = vec![0u8; chunk_size];
        reader.read_exact(&mut chunk)?;
        body.extend_from_slice(&chunk);

        // Read CRLF after chunk
        let mut crlf = [0u8; 2];
        reader.read_exact(&mut crlf)?;

        // Safety limit
        if body.len() > 5_000_000 {
            break;
        }
    }

    Ok(body)
}

/// Decompress response body if compressed
fn decompress_body(body: &[u8], encoding: Option<&str>) -> Vec<u8> {
    let Some(enc) = encoding else {
        return body.to_vec();
    };

    match enc {
        "gzip" | "x-gzip" => {
            let mut decoder = GzDecoder::new(body);
            let mut decompressed = Vec::new();
            if decoder.read_to_end(&mut decompressed).is_ok() {
                log::debug!(
                    "Proxy: Decompressed gzip {} -> {} bytes",
                    body.len(),
                    decompressed.len()
                );
                decompressed
            } else {
                log::warn!("Proxy: Failed to decompress gzip, using raw body");
                body.to_vec()
            }
        }
        "deflate" => {
            let mut decoder = DeflateDecoder::new(body);
            let mut decompressed = Vec::new();
            if decoder.read_to_end(&mut decompressed).is_ok() {
                log::debug!(
                    "Proxy: Decompressed deflate {} -> {} bytes",
                    body.len(),
                    decompressed.len()
                );
                decompressed
            } else {
                log::warn!("Proxy: Failed to decompress deflate, using raw body");
                body.to_vec()
            }
        }
        "br" => {
            let mut decoder = Decompressor::new(body, 4096);
            let mut decompressed = Vec::new();
            if decoder.read_to_end(&mut decompressed).is_ok() {
                log::debug!(
                    "Proxy: Decompressed brotli {} -> {} bytes",
                    body.len(),
                    decompressed.len()
                );
                decompressed
            } else {
                log::warn!("Proxy: Failed to decompress brotli, using raw body");
                body.to_vec()
            }
        }
        _ => {
            log::debug!("Proxy: Unknown encoding '{}', using raw body", enc);
            body.to_vec()
        }
    }
}

/// Check if response should have script injected
fn should_inject_script(response: &HttpResponse, path: &str) -> bool {
    // Only inject into 200 OK responses
    if response.status_code != 200 {
        log::debug!(
            "Proxy: Skipping injection - status code {}",
            response.status_code
        );
        return false;
    }

    // Check Content-Type header (case-insensitive)
    if let Some(ct) = response.get_header("content-type") {
        let ct_lower = ct.to_lowercase();
        if ct_lower.contains("text/html") {
            log::debug!("Proxy: Injection needed - Content-Type is text/html");
            return true;
        }
        // Skip if explicitly not HTML
        if ct_lower.contains("application/json")
            || ct_lower.contains("text/css")
            || ct_lower.contains("text/javascript")
            || ct_lower.contains("application/javascript")
            || ct_lower.contains("image/")
            || ct_lower.contains("font/")
        {
            log::debug!("Proxy: Skipping injection - Content-Type is {}", ct);
            return false;
        }
    }

    // Path-based inference
    if path.ends_with('/') || path.ends_with(".html") || path.ends_with(".htm") {
        log::debug!(
            "Proxy: Injection likely needed - path suggests HTML: {}",
            path
        );
        return true;
    }

    // Skip known non-HTML paths
    let skip_extensions = [
        ".js", ".css", ".json", ".map", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".woff",
        ".woff2", ".ttf", ".eot",
    ];
    for ext in &skip_extensions {
        if path.ends_with(ext) {
            log::debug!("Proxy: Skipping injection - path extension: {}", ext);
            return false;
        }
    }

    // For paths without extension, check body content (after decompression)
    !path.contains('.') || path.ends_with('/')
}

/// Inject script into HTML, preferring </body> position
fn inject_html(html: &str) -> String {
    let script_tag = format!("<script>{}</script>", ELEMENT_SELECTOR_SCRIPT);
    let html_lower = html.to_lowercase();

    // Prefer injecting before </body> - ensures document.body exists
    if let Some(pos) = html_lower.find("</body>") {
        log::debug!("Proxy: Injecting script before </body>");
        let mut result = String::with_capacity(html.len() + script_tag.len());
        result.push_str(&html[..pos]);
        result.push_str(&script_tag);
        result.push_str(&html[pos..]);
        return result;
    }

    // Fallback: before </html>
    if let Some(pos) = html_lower.find("</html>") {
        log::debug!("Proxy: Injecting script before </html>");
        let mut result = String::with_capacity(html.len() + script_tag.len());
        result.push_str(&html[..pos]);
        result.push_str(&script_tag);
        result.push_str(&html[pos..]);
        return result;
    }

    // Fallback: after <head>
    if let Some(pos) = html_lower.find("<head") {
        if let Some(end_pos) = html[pos..].find('>') {
            let inject_pos = pos + end_pos + 1;
            log::debug!("Proxy: Injecting script after <head>");
            let mut result = String::with_capacity(html.len() + script_tag.len());
            result.push_str(&html[..inject_pos]);
            result.push_str(&script_tag);
            result.push_str(&html[inject_pos..]);
            return result;
        }
    }

    // Last resort: append to end
    log::debug!("Proxy: Injecting script at end of document");
    format!("{}{}", html, script_tag)
}

/// Build HTTP response bytes with proper headers
fn build_response(status_code: u16, headers: &HashMap<String, String>, body: &[u8]) -> Vec<u8> {
    let status_text = match status_code {
        200 => "OK",
        304 => "Not Modified",
        404 => "Not Found",
        500 => "Internal Server Error",
        _ => "OK",
    };

    let mut response = format!("HTTP/1.1 {} {}\r\n", status_code, status_text);

    // Add headers (excluding content-length and transfer-encoding, we'll set our own)
    for (key, value) in headers {
        let lower_key = key.to_lowercase();
        if lower_key != "content-length"
            && lower_key != "transfer-encoding"
            && lower_key != "content-encoding"
        // Remove compression since we decompressed
        {
            response.push_str(&format!("{}: {}\r\n", key, value));
        }
    }

    // Set new content-length
    response.push_str(&format!("Content-Length: {}\r\n", body.len()));
    response.push_str("\r\n");

    let mut bytes = response.into_bytes();
    bytes.extend_from_slice(body);
    bytes
}

fn handle_proxy_connection(
    mut client_stream: TcpStream,
    target_host: &str,
    target_port: u16,
) -> std::io::Result<()> {
    client_stream.set_read_timeout(Some(Duration::from_secs(30)))?;
    client_stream.set_write_timeout(Some(Duration::from_secs(30)))?;

    // Read client request
    let mut request_buffer = vec![0u8; 16384]; // Increased buffer for larger requests
    let bytes_read = client_stream.read(&mut request_buffer)?;
    if bytes_read == 0 {
        return Ok(());
    }
    let request = String::from_utf8_lossy(&request_buffer[..bytes_read]);

    // Parse request to get path
    let first_line = request.lines().next().unwrap_or("");
    let parts: Vec<&str> = first_line.split_whitespace().collect();
    let path = parts.get(1).unwrap_or(&"/").to_string();

    log::debug!("Proxy: Handling request for path: {}", path);

    // Connect to target server
    let target_addr = format!("{}:{}", target_host, target_port);
    let mut target_stream = match TcpStream::connect(&target_addr) {
        Ok(s) => s,
        Err(e) => {
            log::error!(
                "Proxy: Failed to connect to target {}:{} - {}",
                target_host,
                target_port,
                e
            );
            // Send 502 Bad Gateway
            let error_response = "HTTP/1.1 502 Bad Gateway\r\nContent-Length: 0\r\n\r\n";
            let _ = client_stream.write_all(error_response.as_bytes());
            return Ok(());
        }
    };
    target_stream.set_read_timeout(Some(Duration::from_secs(30)))?;
    target_stream.set_write_timeout(Some(Duration::from_secs(30)))?;

    // Forward request (modify Host header for proper routing)
    let modified_request = request.replace(
        &format!("Host: localhost:{}", target_port + 10000),
        &format!("Host: {}:{}", target_host, target_port),
    );

    // Also request no compression so we don't need to decompress (simpler approach)
    // But we still support decompression as a fallback
    let request_with_encoding = if modified_request.to_lowercase().contains("accept-encoding:") {
        // Remove accept-encoding to avoid compressed responses
        let re = regex::Regex::new(r"(?i)accept-encoding:[^\r\n]*\r\n").unwrap();
        re.replace(&modified_request, "Accept-Encoding: identity\r\n")
            .to_string()
    } else {
        modified_request.to_string()
    };

    target_stream.write_all(request_with_encoding.as_bytes())?;

    // Read complete response using new chunked-aware parser
    let response = match read_full_response(&mut target_stream) {
        Ok(r) => r,
        Err(e) => {
            log::error!("Proxy: Failed to read response for {} - {}", path, e);
            // Send 502 Bad Gateway
            let error_response = "HTTP/1.1 502 Bad Gateway\r\nContent-Length: 0\r\n\r\n";
            let _ = client_stream.write_all(error_response.as_bytes());
            return Ok(());
        }
    };

    // Check if we should inject script
    if should_inject_script(&response, &path) {
        // Decompress body if needed
        let decompressed_body =
            decompress_body(&response.body, response.content_encoding.as_deref());

        // Convert to string for HTML manipulation
        let body_str = String::from_utf8_lossy(&decompressed_body);

        // Verify it's actually HTML by checking content
        let body_lower = body_str.to_lowercase();
        if body_lower.contains("<!doctype")
            || body_lower.contains("<html")
            || body_lower.contains("<head")
        {
            log::info!(
                "Proxy: Injecting element selector script into HTML response for path: {}",
                path
            );

            // Inject script
            let modified_body = inject_html(&body_str);
            let modified_bytes = modified_body.as_bytes();

            log::debug!(
                "Proxy: Script injection complete, body size: {} -> {}",
                decompressed_body.len(),
                modified_bytes.len()
            );

            // Build and send response
            let final_response =
                build_response(response.status_code, &response.headers, modified_bytes);
            client_stream.write_all(&final_response)?;
        } else {
            // Not HTML content, forward decompressed body
            log::debug!(
                "Proxy: Path suggested HTML but content is not HTML: {}",
                path
            );
            let final_response =
                build_response(response.status_code, &response.headers, &decompressed_body);
            client_stream.write_all(&final_response)?;
        }
    } else {
        // Forward response as-is (but handle potential decompression for consistency)
        if response.content_encoding.is_some() {
            // Decompress and forward without compression
            let decompressed =
                decompress_body(&response.body, response.content_encoding.as_deref());
            let final_response =
                build_response(response.status_code, &response.headers, &decompressed);
            client_stream.write_all(&final_response)?;
        } else if response.is_chunked {
            // Was chunked, rebuild as content-length
            let final_response =
                build_response(response.status_code, &response.headers, &response.body);
            client_stream.write_all(&final_response)?;
        } else {
            // Forward original response as-is (already have Content-Length)
            let final_response =
                build_response(response.status_code, &response.headers, &response.body);
            client_stream.write_all(&final_response)?;
        }
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
    log::info!(
        "Proxy server listening on port {}, forwarding to {}:{}",
        proxy_port,
        target_host,
        target_port
    );

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
// Health Check Functions
// ============================================================================

/// Wait for a port to accept TCP connections with timeout
/// Returns Ok(()) when the port is ready, or Err if timeout is reached
pub async fn wait_for_port_open(port: u16, timeout_secs: u64) -> Result<(), String> {
    let start = std::time::Instant::now();
    let timeout = Duration::from_secs(timeout_secs);

    log::info!(
        "wait_for_port_open: Waiting for port {} to open (timeout: {}s)",
        port,
        timeout_secs
    );

    while start.elapsed() < timeout {
        match TcpStream::connect_timeout(
            &format!("127.0.0.1:{}", port).parse().unwrap(),
            Duration::from_millis(500),
        ) {
            Ok(_) => {
                log::info!(
                    "wait_for_port_open: Port {} is now open after {:?}",
                    port,
                    start.elapsed()
                );
                return Ok(());
            }
            Err(_) => {
                // Port not ready yet, wait and retry
                tokio::time::sleep(Duration::from_millis(500)).await;
            }
        }
    }

    Err(format!(
        "Port {} did not open within {} seconds",
        port, timeout_secs
    ))
}

/// Verify HTTP connection by making a GET request
/// Returns Ok(status_code) on success, Err on failure
pub async fn verify_http_connection(url: &str, timeout_secs: u64) -> Result<u16, String> {
    log::info!("verify_http_connection: Checking {}", url);

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(timeout_secs))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    match client.get(url).send().await {
        Ok(resp) => {
            let status = resp.status().as_u16();
            log::info!("verify_http_connection: {} returned status {}", url, status);
            // Accept any response (even 404) as "server is responding"
            Ok(status)
        }
        Err(e) => {
            log::warn!("verify_http_connection: {} failed - {}", url, e);
            Err(format!("Connection to {} failed: {}", url, e))
        }
    }
}

/// Full connection verification: wait for port + verify HTTP
/// Returns Ok((port, proxy_url)) when fully verified
pub async fn verify_full_connection(
    target_port: u16,
    proxy_url: Option<&str>,
    port_timeout_secs: u64,
    http_timeout_secs: u64,
) -> Result<(), String> {
    // Step 1: Wait for target port to open
    wait_for_port_open(target_port, port_timeout_secs).await?;

    // Step 2: Verify HTTP connection through proxy (if available) or directly
    let check_url = proxy_url
        .map(|u| u.to_string())
        .unwrap_or_else(|| format!("http://localhost:{}", target_port));

    // Give a small delay for proxy to be fully ready
    tokio::time::sleep(Duration::from_millis(300)).await;

    verify_http_connection(&check_url, http_timeout_secs).await?;

    Ok(())
}

// ============================================================================
// Tauri Commands
// ============================================================================

/// Verify that a server is actually responding
/// This command can be called from frontend to validate connection
#[tauri::command]
pub async fn verify_server_connection(
    url: String,
    timeout_secs: Option<u64>,
) -> Result<u16, String> {
    let timeout = timeout_secs.unwrap_or(5);
    verify_http_connection(&url, timeout).await
}

/// Wait for a port to be ready and return when it's accepting connections
#[tauri::command]
pub async fn wait_for_server_ready(port: u16, timeout_secs: Option<u64>) -> Result<(), String> {
    let timeout = timeout_secs.unwrap_or(30);
    wait_for_port_open(port, timeout).await
}

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
    project_id: Option<String>,
) -> Result<(), String> {
    log::info!("Starting dev server for: {}", project_path);

    // Calculate fixed port if project_id is provided
    let fixed_port = project_id.as_ref().map(|id| {
        let hash = id
            .chars()
            .fold(0u32, |acc, c| acc.wrapping_mul(31).wrapping_add(c as u32));
        32100 + (hash % 10000) as u16
    });

    if let Some(port) = fixed_port {
        log::info!("Using fixed port: {}", port);
    } else {
        log::info!("No project_id provided, using dynamic port detection");
    }

    // Detect package manager
    let pm = detect_package_manager(project_path.clone()).await?;
    log::info!("Using package manager: {}", pm);

    // Build command with port option
    let (cmd, base_args) = match pm.as_str() {
        "bun" => ("bun", vec!["run", "dev"]),
        "pnpm" => ("pnpm", vec!["run", "dev"]),
        "yarn" => ("yarn", vec!["dev"]),
        _ => ("npm", vec!["run", "dev"]),
    };

    // Build args list with port if available
    let port_str = fixed_port.map(|p| p.to_string());
    let mut args: Vec<&str> = base_args;

    // Add port argument if fixed port is available
    // This works for most frameworks: Vite, Next.js, Create React App, etc.
    if let Some(ref port_string) = port_str {
        args.push("--");
        args.push("--port");
        args.push(port_string.as_str());
    }

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

    // Create entry with fixed port if available
    let (initial_port, initial_proxy_port, initial_urls) = if let Some(port) = fixed_port {
        let proxy_port = find_available_port(port + 10000);
        let original_url = Some(format!("http://localhost:{}", port));
        let proxy_url = proxy_port.map(|p| format!("http://localhost:{}", p));
        (Some(port), proxy_port, (original_url, proxy_url))
    } else {
        (None, None, (None, None))
    };

    let info = DevServerInfo {
        project_path: project_path.clone(),
        pid,
        detected_port: initial_port,
        original_url: initial_urls.0,
        proxy_port: initial_proxy_port,
        proxy_url: initial_urls.1,
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

    // If we have a fixed port, start proxy immediately and notify
    if let (Some(port), Some(proxy_port)) = (initial_port, initial_proxy_port) {
        let proxy_stop = stop_flag.clone();
        thread::spawn(move || {
            run_proxy_server(proxy_port, "localhost".to_string(), port, proxy_stop);
        });

        // Notify frontend immediately
        let _ = app.emit(
            "dev-server-output",
            DevServerOutput {
                project_path: project_path.clone(),
                output_type: "port-detected".to_string(),
                message: format!("Dev server configured to use port {}", port),
                port: Some(port),
                proxy_url: Some(format!("http://localhost:{}", proxy_port)),
            },
        );
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
                                    let _ = app.emit(
                                        "dev-server-output",
                                        DevServerOutput {
                                            project_path: project.clone(),
                                            output_type: "stdout".to_string(),
                                            message: output.to_string(),
                                            port: None,
                                            proxy_url: None,
                                        },
                                    );

                                    // Try to detect port (only if not already set with fixed port)
                                    let port_already_set = {
                                        let servers = DEV_SERVERS.lock().unwrap();
                                        servers
                                            .servers
                                            .get(&project)
                                            .and_then(|e| e.info.detected_port)
                                            .is_some()
                                    };

                                    if !port_already_set {
                                        if let Some(port) = detect_dev_server_port(&output) {
                                            log::info!(
                                                "Detected dev server port from output: {}",
                                                port
                                            );

                                            // Start proxy server
                                            if let Some(proxy_port) =
                                                find_available_port(port + 10000)
                                            {
                                                let stop_flag = {
                                                    let mut servers = DEV_SERVERS.lock().unwrap();
                                                    if let Some(entry) =
                                                        servers.servers.get_mut(&project)
                                                    {
                                                        entry.info.detected_port = Some(port);
                                                        entry.info.original_url = Some(format!(
                                                            "http://localhost:{}",
                                                            port
                                                        ));
                                                        entry.info.proxy_port = Some(proxy_port);
                                                        entry.info.proxy_url = Some(format!(
                                                            "http://localhost:{}",
                                                            proxy_port
                                                        ));
                                                        entry.stop_flag.clone()
                                                    } else {
                                                        return;
                                                    }
                                                };

                                                // Start proxy in background
                                                let proxy_stop = stop_flag.clone();
                                                thread::spawn(move || {
                                                    run_proxy_server(
                                                        proxy_port,
                                                        "localhost".to_string(),
                                                        port,
                                                        proxy_stop,
                                                    );
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
                                    let _ = app.emit(
                                        "dev-server-output",
                                        DevServerOutput {
                                            project_path: project.clone(),
                                            output_type: "stderr".to_string(),
                                            message: output.to_string(),
                                            port: None,
                                            proxy_url: None,
                                        },
                                    );
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

/// Connect to an already running external dev server
/// Returns the proxy URL on success
#[tauri::command]
pub async fn connect_to_existing_server(
    app: AppHandle,
    project_path: String,
    port: u16,
) -> Result<String, String> {
    log::info!(
        "connect_to_existing_server: port={}, project_path={}",
        port,
        project_path
    );

    // Check if port is actually in use by trying to connect to it
    // If connect succeeds, a server is running on that port
    match TcpStream::connect_timeout(
        &format!("127.0.0.1:{}", port).parse().unwrap(),
        Duration::from_millis(500),
    ) {
        Ok(_) => {
            log::info!(
                "connect_to_existing_server: Port {} is in use (connect succeeded)",
                port
            );
        }
        Err(e) => {
            log::warn!(
                "connect_to_existing_server: Port {} is NOT in use (connect failed: {})",
                port,
                e
            );
            return Err(format!("No server running on port {}", port));
        }
    }

    // Find available proxy port
    let proxy_port = match find_available_port(port + 10000) {
        Some(p) => {
            log::info!("connect_to_existing_server: Found proxy port {}", p);
            p
        }
        None => {
            log::error!("connect_to_existing_server: Could not find available proxy port");
            return Err("Could not find available port for proxy".to_string());
        }
    };

    let stop_flag = Arc::new(Mutex::new(false));

    let info = DevServerInfo {
        project_path: project_path.clone(),
        pid: 0, // No process, external server
        detected_port: Some(port),
        original_url: Some(format!("http://localhost:{}", port)),
        proxy_port: Some(proxy_port),
        proxy_url: Some(format!("http://localhost:{}", proxy_port)),
    };

    let entry = DevServerEntry {
        process: None, // No process to manage
        proxy_handle: None,
        info: info.clone(),
        stop_flag: stop_flag.clone(),
    };

    // Store in global state
    {
        let mut servers = DEV_SERVERS.lock().unwrap();
        servers.servers.insert(project_path.clone(), entry);
    }

    // Start proxy server
    log::info!(
        "connect_to_existing_server: Starting proxy server on port {} -> {}",
        proxy_port,
        port
    );
    let proxy_stop = stop_flag.clone();
    thread::spawn(move || {
        run_proxy_server(proxy_port, "localhost".to_string(), port, proxy_stop);
    });

    let proxy_url = format!("http://localhost:{}", proxy_port);
    log::info!("connect_to_existing_server: Proxy URL = {}", proxy_url);

    // Notify frontend
    let _ = app.emit(
        "dev-server-output",
        DevServerOutput {
            project_path: project_path.clone(),
            output_type: "port-detected".to_string(),
            message: format!("Connected to existing server at localhost:{}", port),
            port: Some(port),
            proxy_url: Some(proxy_url.clone()),
        },
    );

    // Return proxy URL for immediate use
    log::info!("connect_to_existing_server: Success, returning proxy URL");
    Ok(proxy_url)
}
