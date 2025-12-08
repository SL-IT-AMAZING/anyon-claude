/**
 * anyon-shim.js - 에러 캡처 및 네비게이션 추적 스크립트
 * dyad-shim.js를 기반으로 anyon에 맞게 수정
 *
 * 기능:
 * 1. window.error, unhandledrejection 에러 캡처
 * 2. history.pushState/replaceState 네비게이션 추적
 * 3. Vite 에러 오버레이 감지
 */
(function () {
  console.debug('anyon-shim.js loaded via proxy v1.0.0');
  const isInsideIframe = window.parent !== window;
  if (!isInsideIframe) return;

  let previousUrl = window.location.href;
  const PARENT_TARGET_ORIGIN = '*';

  // --- History API Overrides ---
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  const handleStateChangeAndNotify = (originalMethod, state, title, url) => {
    const oldUrlForMessage = previousUrl;
    let newUrl;
    try {
      newUrl = url
        ? new URL(url, window.location.href).href
        : window.location.href;
    } catch (e) {
      console.error('Could not parse URL', e);
      newUrl = window.location.href;
    }

    const navigationType =
      originalMethod === originalPushState ? 'pushState' : 'replaceState';

    try {
      originalMethod.call(history, state, title, url);
      previousUrl = window.location.href;
      window.parent.postMessage(
        {
          type: navigationType,
          payload: { oldUrl: oldUrlForMessage, newUrl: newUrl },
        },
        PARENT_TARGET_ORIGIN
      );
    } catch (e) {
      console.error(
        `[anyon-shim] Error calling original ${navigationType}: `,
        e
      );
      window.parent.postMessage(
        {
          type: 'navigation-error',
          payload: {
            operation: navigationType,
            message: e.message,
            error: e.toString(),
            stateAttempted: state,
            urlAttempted: url,
          },
        },
        PARENT_TARGET_ORIGIN
      );
    }
  };

  history.pushState = function (state, title, url) {
    handleStateChangeAndNotify(originalPushState, state, title, url);
  };

  history.replaceState = function (state, title, url) {
    handleStateChangeAndNotify(originalReplaceState, state, title, url);
  };

  // --- Listener for Back/Forward Navigation (popstate event) ---
  window.addEventListener('popstate', () => {
    const currentUrl = window.location.href;
    previousUrl = currentUrl;
  });

  // --- Listener for Commands from Parent ---
  window.addEventListener('message', (event) => {
    if (
      event.source !== window.parent ||
      !event.data ||
      typeof event.data !== 'object'
    )
      return;
    if (event.data.type === 'navigate') {
      const direction = event.data.payload?.direction;
      if (direction === 'forward') history.forward();
      else if (direction === 'backward') history.back();
    }
  });

  // --- Sourcemapped Error Handling ---
  function sendSourcemappedErrorToParent(error, sourceType) {
    if (typeof window.StackTrace === 'undefined') {
      console.error('[anyon-shim] StackTrace object not found.');
      // Send simplified raw data if StackTrace isn't available
      window.parent.postMessage(
        {
          type: sourceType,
          payload: {
            message: error?.message || String(error),
            stack:
              error?.stack || '<no stack available - StackTrace.js missing>',
          },
        },
        PARENT_TARGET_ORIGIN
      );
      return;
    }

    window.StackTrace.fromError(error)
      .then((stackFrames) => {
        const sourcemappedStack = stackFrames
          .map((sf) => sf.toString())
          .join('\n');

        const payload = {
          message: error?.message || String(error),
          stack: sourcemappedStack,
        };

        window.parent.postMessage(
          {
            type: 'iframe-sourcemapped-error',
            payload: { ...payload, originalSourceType: sourceType },
          },
          PARENT_TARGET_ORIGIN
        );
      })
      .catch((mappingError) => {
        console.error(
          '[anyon-shim] Error during stacktrace sourcemapping:',
          mappingError
        );

        const payload = {
          message: error?.message || String(error),
          stack: error?.stack
            ? `Sourcemapping failed: ${mappingError.message}\n--- Raw Stack ---\n${error.stack}`
            : `Sourcemapping failed: ${mappingError.message}\n<no raw stack available>`,
        };

        window.parent.postMessage(
          {
            type: 'iframe-sourcemapped-error',
            payload: { ...payload, originalSourceType: sourceType },
          },
          PARENT_TARGET_ORIGIN
        );
      });
  }

  // --- Window Error Handler ---
  window.addEventListener('error', (event) => {
    let error = event.error;
    if (!(error instanceof Error)) {
      window.parent.postMessage(
        {
          type: 'window-error',
          payload: {
            message: error?.toString() || event.message || 'Unknown error',
            stack: '<no stack available - an improper error was thrown>',
          },
        },
        PARENT_TARGET_ORIGIN
      );
      return;
    }
    sendSourcemappedErrorToParent(error, 'window-error');
  });

  // --- Unhandled Promise Rejection Handler ---
  window.addEventListener('unhandledrejection', (event) => {
    let error = event.reason;
    if (!(error instanceof Error)) {
      window.parent.postMessage(
        {
          type: 'unhandled-rejection',
          payload: {
            message: event.reason?.toString() || 'Unhandled promise rejection',
            stack:
              '<no stack available - an improper error was thrown (promise)>',
          },
        },
        PARENT_TARGET_ORIGIN
      );
      return;
    }
    sendSourcemappedErrorToParent(error, 'unhandled-rejection');
  });

  // --- Watch for Vite Error Overlay ---
  (function watchForViteErrorOverlay() {
    const config = {
      childList: true,
      subtree: false,
    };

    const observerCallback = function (mutationsList) {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (
              node.nodeType === Node.ELEMENT_NODE &&
              node.tagName === 'VITE-ERROR-OVERLAY'
            ) {
              reportViteErrorOverlay(node);
            }
          }
        }
      }
    };

    function reportViteErrorOverlay(node) {
      console.log(`[anyon-shim] Detected vite error overlay`);
      try {
        window.parent.postMessage(
          {
            type: 'build-error-report',
            payload: {
              message: node.shadowRoot?.querySelector('.message')?.textContent || 'Build error',
              file: node.shadowRoot?.querySelector('.file')?.textContent || '',
              frame: node.shadowRoot?.querySelector('.frame')?.textContent || '',
            },
          },
          PARENT_TARGET_ORIGIN
        );
      } catch (error) {
        console.error('[anyon-shim] Could not report vite error overlay', error);
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        if (!document.body) {
          console.error('[anyon-shim] document.body does not exist');
          return;
        }

        const node = document.body.querySelector('vite-error-overlay');
        if (node) {
          reportViteErrorOverlay(node);
        }
        const observer = new MutationObserver(observerCallback);
        observer.observe(document.body, config);
      });
    } else {
      if (!document.body) {
        console.error('[anyon-shim] document.body does not exist');
        return;
      }
      const observer = new MutationObserver(observerCallback);
      observer.observe(document.body, config);
    }
  })();

  // --- Console Error Capture (optional) ---
  const originalConsoleError = console.error;
  console.error = function (...args) {
    // Call original
    originalConsoleError.apply(console, args);

    // Send to parent (optional - can be noisy)
    // window.parent.postMessage(
    //   {
    //     type: 'console-error',
    //     payload: {
    //       message: args.map(arg =>
    //         typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    //       ).join(' '),
    //     },
    //   },
    //   PARENT_TARGET_ORIGIN
    // );
  };

  // Notify parent that shim is loaded
  window.parent.postMessage(
    { type: 'anyon-shim-loaded' },
    PARENT_TARGET_ORIGIN
  );
})();
