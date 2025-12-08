/**
 * anyon-component-selector.js - 컴포넌트 선택기 스크립트
 * dyad-component-selector-client.js를 기반으로 anyon에 맞게 수정
 *
 * 기능:
 * 1. 모든 요소 하이라이트 (data-anyon-id 없어도 작동)
 * 2. 클릭 시 컴포넌트 선택/해제
 * 3. 다중 선택 지원
 * 4. 단축키 지원 (Cmd/Ctrl + Shift + C)
 */
(() => {
  const OVERLAY_CLASS = '__anyon_overlay__';
  let overlays = [];
  let hoverOverlay = null;
  let hoverLabel = null;
  let currentHoveredElement = null;

  // Detect if the user is using Mac
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  // Possible states:
  // { type: 'inactive' }
  // { type: 'inspecting', element: ?HTMLElement }
  let state = { type: 'inactive' };

  // 고유 ID 생성
  let idCounter = 0;
  function generateId(el) {
    if (!el.__anyonId) {
      el.__anyonId = `element-${++idCounter}`;
    }
    return el.__anyonId;
  }

  // 요소 이름 가져오기
  function getElementName(el) {
    if (el.dataset.anyonName) return el.dataset.anyonName;

    // 태그명 + id 또는 class
    let name = el.tagName.toLowerCase();
    if (el.id) {
      name += `#${el.id}`;
    } else if (el.className && typeof el.className === 'string') {
      const firstClass = el.className.split(' ')[0];
      if (firstClass) {
        name += `.${firstClass}`;
      }
    }
    return name;
  }

  // 선택 가능한 요소인지 확인
  function isSelectableElement(el) {
    if (!el || el === document.body || el === document.documentElement) return false;

    // 오버레이 요소 제외
    if (el.className && el.className.includes && el.className.includes(OVERLAY_CLASS)) return false;

    // 너무 작은 요소 제외
    const rect = el.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return false;

    return true;
  }

  /* ---------- helpers --------------------------------------------------- */
  const css = (el, obj) => Object.assign(el.style, obj);

  function makeOverlay() {
    const overlay = document.createElement('div');
    overlay.className = OVERLAY_CLASS;
    css(overlay, {
      position: 'absolute',
      border: '2px solid #7c3aed', // Purple color for anyon
      background: 'rgba(124, 58, 237, 0.05)',
      pointerEvents: 'none',
      zIndex: '2147483647',
      borderRadius: '4px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    });

    const label = document.createElement('div');
    css(label, {
      position: 'absolute',
      left: '0',
      top: '100%',
      transform: 'translateY(4px)',
      background: '#7c3aed',
      color: '#fff',
      fontFamily: 'monospace',
      fontSize: '12px',
      lineHeight: '1.2',
      padding: '3px 5px',
      whiteSpace: 'nowrap',
      borderRadius: '4px',
      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
    });
    overlay.appendChild(label);
    document.body.appendChild(overlay);

    return { overlay, label };
  }

  function updateOverlay(el, isSelected = false) {
    if (!el) {
      if (hoverOverlay) hoverOverlay.style.display = 'none';
      return;
    }

    if (isSelected) {
      if (overlays.some((item) => item.el === el)) {
        return;
      }

      const { overlay, label } = makeOverlay();
      overlays.push({ overlay, label, el });

      const rect = el.getBoundingClientRect();
      css(overlay, {
        top: `${rect.top + window.scrollY}px`,
        left: `${rect.left + window.scrollX}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        display: 'block',
        border: '3px solid #7c3aed',
        background: 'rgba(124, 58, 237, 0.05)',
      });

      css(label, { display: 'none' });
      return;
    }

    // Hover overlay
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
      display: 'block',
      border: '2px solid #7c3aed',
      background: 'rgba(124, 58, 237, 0.05)',
    });
    css(hoverLabel, { background: '#7c3aed' });

    while (hoverLabel.firstChild) hoverLabel.removeChild(hoverLabel.firstChild);

    const name = getElementName(el);
    const nameEl = document.createElement('div');
    nameEl.textContent = name;
    hoverLabel.appendChild(nameEl);

    // 파일 정보가 있으면 표시
    if (el.dataset.anyonId) {
      const file = el.dataset.anyonId.split(':')[0];
      if (file) {
        const fileEl = document.createElement('span');
        css(fileEl, { fontSize: '10px', opacity: '.8' });
        fileEl.textContent = file.replace(/\\/g, '/');
        hoverLabel.appendChild(fileEl);
      }
    }

    requestAnimationFrame(updateAllOverlayPositions);
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

    if (
      hoverOverlay &&
      hoverOverlay.style.display !== 'none' &&
      state.element
    ) {
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

  function removeOverlayById(componentId) {
    const index = overlays.findIndex(
      ({ el }) => generateId(el) === componentId || el.dataset.anyonId === componentId
    );
    if (index !== -1) {
      const { overlay } = overlays[index];
      overlay.remove();
      overlays.splice(index, 1);
    }
  }

  function updateSelectedOverlayLabel(item, show) {
    const { label, el } = item;

    if (!show) {
      css(label, { display: 'none' });
      requestAnimationFrame(updateAllOverlayPositions);
      return;
    }

    css(label, { display: 'block', background: '#7c3aed' });
    while (label.firstChild) label.removeChild(label.firstChild);

    // Add "Edit with AI" line
    const editLine = document.createElement('div');
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '12');
    svg.setAttribute('height', '12');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('fill', 'none');
    Object.assign(svg.style, {
      display: 'inline-block',
      verticalAlign: '-2px',
      marginRight: '4px',
    });
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute(
      'd',
      'M8 0L9.48528 6.51472L16 8L9.48528 9.48528L8 16L6.51472 9.48528L0 8L6.51472 6.51472L8 0Z'
    );
    path.setAttribute('fill', 'white');
    svg.appendChild(path);
    editLine.appendChild(svg);
    editLine.appendChild(document.createTextNode('Edit with AI'));
    label.appendChild(editLine);

    const name = getElementName(el);
    const nameEl = document.createElement('div');
    nameEl.textContent = name;
    label.appendChild(nameEl);

    if (el.dataset.anyonId) {
      const file = el.dataset.anyonId.split(':')[0];
      if (file) {
        const fileEl = document.createElement('span');
        css(fileEl, { fontSize: '10px', opacity: '.8' });
        fileEl.textContent = file.replace(/\\/g, '/');
        label.appendChild(fileEl);
      }
    }

    requestAnimationFrame(updateAllOverlayPositions);
  }

  /* ---------- event handlers -------------------------------------------- */
  function onMouseMove(e) {
    let el = e.target;

    // data-anyon-id가 있는 요소 우선 찾기
    let anyonEl = el;
    while (anyonEl && !anyonEl.dataset.anyonId) anyonEl = anyonEl.parentElement;

    // anyonId가 있으면 그 요소 사용, 없으면 현재 요소 사용
    if (anyonEl) {
      el = anyonEl;
    } else {
      // 선택 가능한 요소 찾기
      while (el && !isSelectableElement(el)) {
        el = el.parentElement;
      }
    }

    const hoveredItem = overlays.find((item) => item.el === el);

    if (currentHoveredElement && currentHoveredElement !== el) {
      const previousItem = overlays.find(
        (item) => item.el === currentHoveredElement
      );
      if (previousItem) {
        updateSelectedOverlayLabel(previousItem, false);
      }
    }

    currentHoveredElement = el;

    if (hoveredItem) {
      updateSelectedOverlayLabel(hoveredItem, true);
      if (hoverOverlay) hoverOverlay.style.display = 'none';
    }

    if (state.type === 'inspecting') {
      if (state.element === el) return;
      state.element = el;

      if (!hoveredItem && el) {
        updateOverlay(el, false);
      } else if (!el) {
        if (hoverOverlay) hoverOverlay.style.display = 'none';
      }
    }
  }

  function onMouseLeave(e) {
    if (!e.relatedTarget) {
      if (hoverOverlay) {
        hoverOverlay.style.display = 'none';
        requestAnimationFrame(updateAllOverlayPositions);
      }
      currentHoveredElement = null;
      if (state.type === 'inspecting') {
        state.element = null;
      }
    }
  }

  function onClick(e) {
    if (state.type !== 'inspecting' || !state.element) return;
    e.preventDefault();
    e.stopPropagation();

    const selectedItem = overlays.find((item) => item.el === state.element);
    if (selectedItem) {
      const componentId = state.element.dataset.anyonId || generateId(state.element);
      removeOverlayById(componentId);
      window.parent.postMessage(
        {
          type: 'anyon-component-deselected',
          componentId: componentId,
        },
        '*'
      );
      return;
    }

    updateOverlay(state.element, true);
    requestAnimationFrame(updateAllOverlayPositions);

    // ID 및 위치 정보 생성
    const anyonId = state.element.dataset.anyonId || '';
    let relativePath = '';
    let lineNumber = 0;
    let columnNumber = 0;

    if (anyonId) {
      const parts = anyonId.split(':');
      relativePath = parts.slice(0, -2).join(':') || anyonId;
      lineNumber = parseInt(parts[parts.length - 2], 10) || 0;
      columnNumber = parseInt(parts[parts.length - 1], 10) || 0;
    }

    window.parent.postMessage(
      {
        type: 'anyon-component-selected',
        component: {
          id: anyonId || generateId(state.element),
          name: getElementName(state.element),
          tagName: state.element.tagName.toLowerCase(),
          className: state.element.className || '',
          relativePath,
          lineNumber,
          columnNumber,
          outerHTML: state.element.outerHTML.slice(0, 500), // 처음 500자만
          rect: state.element.getBoundingClientRect(),
        },
      },
      '*'
    );
  }

  function onKeyDown(e) {
    // Ignore keystrokes if user is typing in an input field
    if (
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TEXTAREA' ||
      e.target.isContentEditable
    ) {
      return;
    }

    // Forward shortcuts to parent window
    const key = e.key.toLowerCase();
    const hasShift = e.shiftKey;
    const hasCtrlOrMeta = isMac ? e.metaKey : e.ctrlKey;
    if (key === 'c' && hasShift && hasCtrlOrMeta) {
      e.preventDefault();
      window.parent.postMessage(
        {
          type: 'anyon-select-component-shortcut',
        },
        '*'
      );
    }
  }

  /* ---------- activation / deactivation --------------------------------- */
  function activate() {
    if (state.type === 'inactive') {
      window.addEventListener('click', onClick, true);
    }
    state = { type: 'inspecting', element: null };
    console.debug('[anyon-component-selector] Activated');
  }

  function deactivate() {
    if (state.type === 'inactive') return;

    window.removeEventListener('click', onClick, true);
    if (hoverOverlay) {
      hoverOverlay.style.display = 'none';
    }

    overlays.forEach((item) => updateSelectedOverlayLabel(item, false));
    currentHoveredElement = null;

    state = { type: 'inactive' };
    console.debug('[anyon-component-selector] Deactivated');
  }

  /* ---------- message bridge -------------------------------------------- */
  window.addEventListener('message', (e) => {
    if (e.source !== window.parent) return;
    if (e.data.type === 'activate-anyon-component-selector') activate();
    if (e.data.type === 'deactivate-anyon-component-selector') deactivate();
    if (e.data.type === 'clear-anyon-component-overlays') clearOverlays();
    if (e.data.type === 'remove-anyon-component-overlay') {
      if (e.data.componentId) {
        removeOverlayById(e.data.componentId);
      }
    }
  });

  // Always listen for keyboard shortcuts
  window.addEventListener('keydown', onKeyDown, true);

  // Always listen for mouse move
  window.addEventListener('mousemove', onMouseMove, true);
  document.addEventListener('mouseleave', onMouseLeave, true);

  // Update overlay positions on window resize
  window.addEventListener('resize', updateAllOverlayPositions);

  function initializeComponentSelector() {
    if (!document.body) {
      console.error('[anyon-component-selector] document.body not found.');
      return;
    }
    setTimeout(() => {
      const hasTaggedElements = !!document.body.querySelector('[data-anyon-id]');
      window.parent.postMessage(
        {
          type: 'anyon-component-selector-initialized',
          hasTaggedElements: hasTaggedElements,
        },
        '*'
      );
      console.debug('[anyon-component-selector] Initialized, hasTaggedElements:', hasTaggedElements);
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeComponentSelector);
  } else {
    initializeComponentSelector();
  }
})();
