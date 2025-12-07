/**
 * Preview Element Selector Script
 * This script is injected into the preview iframe to enable element selection/highlighting
 * Based on Dyad's dyad-component-selector-client.js
 */

export const ELEMENT_SELECTOR_SCRIPT = `
(() => {
  const OVERLAY_CLASS = "__anyon_overlay__";
  let hoverOverlay = null;
  let hoverLabel = null;
  let selectedOverlay = null;
  let selectedElement = null;
  let isActive = false;

  // CSS helper
  const css = (el, obj) => Object.assign(el.style, obj);

  // Create overlay element
  function createOverlay() {
    const overlay = document.createElement("div");
    overlay.className = OVERLAY_CLASS;
    css(overlay, {
      position: "absolute",
      border: "2px solid #7f22fe",
      background: "rgba(127, 34, 254, 0.1)",
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
      padding: "3px 8px",
      whiteSpace: "nowrap",
      borderRadius: "4px",
      boxShadow: "0 1px 4px rgba(0, 0, 0, 0.1)",
    });
    overlay.appendChild(label);
    document.body.appendChild(overlay);

    return { overlay, label };
  }

  // Get element info for display
  function getElementInfo(el) {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? "#" + el.id : "";
    const classes = el.className && typeof el.className === 'string'
      ? "." + el.className.trim().split(/\\s+/).join(".")
      : "";
    return tag + id + classes;
  }

  // Get CSS selector for element
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

  // Update overlay position and label
  function updateOverlay(el, overlay, label, isSelected = false) {
    if (!el) {
      css(overlay, { display: "none" });
      return;
    }

    const rect = el.getBoundingClientRect();
    css(overlay, {
      top: rect.top + window.scrollY + "px",
      left: rect.left + window.scrollX + "px",
      width: rect.width + "px",
      height: rect.height + "px",
      display: "block",
      border: isSelected ? "3px solid #7f22fe" : "2px solid #7f22fe",
      background: isSelected ? "rgba(127, 34, 254, 0.15)" : "rgba(127, 34, 254, 0.05)",
    });

    label.textContent = getElementInfo(el);
  }

  // Mouse move handler
  function onMouseMove(e) {
    if (!isActive) return;

    let el = e.target;
    // Skip our overlay elements
    if (el.classList && el.classList.contains(OVERLAY_CLASS)) return;

    // Skip body and html
    if (el === document.body || el === document.documentElement) return;

    if (!hoverOverlay) {
      const o = createOverlay();
      hoverOverlay = o.overlay;
      hoverLabel = o.label;
    }

    updateOverlay(el, hoverOverlay, hoverLabel);

    // Send hover info to parent
    window.parent.postMessage({
      type: "anyon-element-hover",
      element: {
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        classes: el.className || null,
        selector: getCssSelector(el),
        text: el.textContent?.substring(0, 100) || null,
      }
    }, "*");
  }

  // Click handler
  function onClick(e) {
    if (!isActive) return;

    e.preventDefault();
    e.stopPropagation();

    let el = e.target;
    if (el.classList && el.classList.contains(OVERLAY_CLASS)) return;
    if (el === document.body || el === document.documentElement) return;

    // Create or update selected overlay
    if (!selectedOverlay) {
      const o = createOverlay();
      selectedOverlay = o.overlay;
      // Style for selected
      css(selectedOverlay.querySelector("div"), { background: "#22c55e" });
    }

    selectedElement = el;
    updateOverlay(el, selectedOverlay, selectedOverlay.querySelector("div"), true);

    // Send selected element info to parent
    window.parent.postMessage({
      type: "anyon-element-selected",
      element: {
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        classes: el.className || null,
        selector: getCssSelector(el),
        text: el.textContent?.substring(0, 200) || null,
        rect: el.getBoundingClientRect(),
        html: el.outerHTML.substring(0, 500),
      }
    }, "*");
  }

  // Activate selector
  function activate() {
    if (isActive) return;
    isActive = true;
    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("click", onClick, true);
    document.body.style.cursor = "crosshair";

    window.parent.postMessage({
      type: "anyon-selector-activated"
    }, "*");
  }

  // Deactivate selector
  function deactivate() {
    if (!isActive) return;
    isActive = false;
    document.removeEventListener("mousemove", onMouseMove, true);
    document.removeEventListener("click", onClick, true);
    document.body.style.cursor = "";

    // Hide overlays
    if (hoverOverlay) hoverOverlay.style.display = "none";
    if (selectedOverlay) selectedOverlay.style.display = "none";

    window.parent.postMessage({
      type: "anyon-selector-deactivated"
    }, "*");
  }

  // Clear selection
  function clearSelection() {
    if (selectedOverlay) {
      selectedOverlay.remove();
      selectedOverlay = null;
    }
    selectedElement = null;
  }

  // Message listener from parent
  window.addEventListener("message", (e) => {
    if (e.source !== window.parent) return;

    switch (e.data?.type) {
      case "anyon-activate-selector":
        activate();
        break;
      case "anyon-deactivate-selector":
        deactivate();
        break;
      case "anyon-clear-selection":
        clearSelection();
        break;
    }
  });

  // Notify parent that selector is ready
  window.parent.postMessage({
    type: "anyon-selector-ready"
  }, "*");

  // Update overlay positions on scroll/resize
  window.addEventListener("scroll", () => {
    if (hoverOverlay && hoverOverlay.style.display !== "none") {
      // Will be updated on next mousemove
    }
    if (selectedOverlay && selectedElement) {
      updateOverlay(selectedElement, selectedOverlay, selectedOverlay.querySelector("div"), true);
    }
  });

  window.addEventListener("resize", () => {
    if (selectedOverlay && selectedElement) {
      updateOverlay(selectedElement, selectedOverlay, selectedOverlay.querySelector("div"), true);
    }
  });
})();
`;

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
