/**
 * Preview Element Selector Script
 * This script is injected into the preview iframe to enable element selection/highlighting
 * Based on Dyad's dyad-component-selector-client.js
 *
 * Message types (matches Rust dev_server.rs):
 * - Parent -> iframe: activate-anyon-component-selector, deactivate-anyon-component-selector, clear-anyon-component-overlays
 * - iframe -> Parent: anyon-component-selector-initialized, anyon-component-selected, anyon-component-deselected
 */

export const ELEMENT_SELECTOR_SCRIPT = `
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
      ? "." + el.className.trim().split(/\\s+/).slice(0, 2).join(".")
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
        top: \`\${rect.top + window.scrollY}px\`,
        left: \`\${rect.left + window.scrollX}px\`,
        width: \`\${rect.width}px\`,
        height: \`\${rect.height}px\`,
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
      top: \`\${rect.top + window.scrollY}px\`,
      left: \`\${rect.left + window.scrollX}px\`,
      width: \`\${rect.width}px\`,
      height: \`\${rect.height}px\`,
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
        top: \`\${rect.top + window.scrollY}px\`,
        left: \`\${rect.left + window.scrollX}px\`,
        width: \`\${rect.width}px\`,
        height: \`\${rect.height}px\`,
      });
    });

    if (hoverOverlay && hoverOverlay.style.display !== "none" && state.element) {
      const rect = state.element.getBoundingClientRect();
      css(hoverOverlay, {
        top: \`\${rect.top + window.scrollY}px\`,
        left: \`\${rect.left + window.scrollX}px\`,
        width: \`\${rect.width}px\`,
        height: \`\${rect.height}px\`,
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
`;

/**
 * Inject the selector script into HTML content
 */
export function injectSelectorScript(html: string): string {
  const scriptTag = `<script>${ELEMENT_SELECTOR_SCRIPT}</script>`;

  // Try to inject after <head>
  const headMatch = html.match(/<head[^>]*>/i);
  if (headMatch) {
    const insertPos = headMatch.index! + headMatch[0].length;
    return html.slice(0, insertPos) + scriptTag + html.slice(insertPos);
  }

  // Fallback: prepend to document
  return scriptTag + html;
}

/**
 * Generate a blob URL for the selector script
 */
export function getSelectorScriptUrl(): string {
  const blob = new Blob([ELEMENT_SELECTOR_SCRIPT], { type: 'application/javascript' });
  return URL.createObjectURL(blob);
}

/**
 * Element info from the preview
 */
export interface SelectedElement {
  tag: string;
  id: string | null;
  classes: string | null;
  selector: string;
  text: string | null;
  rect?: DOMRect;
  html?: string;
}
