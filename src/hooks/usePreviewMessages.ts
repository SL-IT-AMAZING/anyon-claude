import { useEffect, useCallback } from 'react';
import { usePreviewStore } from '@/stores/previewStore';
import type { IframeMessage, ComponentSelection, SelectedElement } from '@/types/preview';

/**
 * 프리뷰 iframe 메시지 처리 훅
 * iframe에서 보내는 에러, 네비게이션, 컴포넌트 선택 메시지 처리
 */
export function usePreviewMessages() {
  const {
    iframeRef,
    setPreviewError,
    addSelectedComponent,
    removeSelectedComponent,
    setComponentSelectorInitialized,
    setCurrentRoute,
    addAppOutput,
    setSelectedElement,
  } = usePreviewStore();

  // 메시지 핸들러
  const handleMessage = useCallback((event: MessageEvent<IframeMessage>) => {
    // iframe에서 온 메시지만 처리
    if (iframeRef && event.source !== iframeRef.contentWindow) {
      return;
    }

    const { type, payload, component, componentId } = event.data || {};

    switch (type) {
      // 컴포넌트 선택기 초기화 완료
      case 'anyon-component-selector-initialized':
        setComponentSelectorInitialized(true);
        console.debug('[Preview] Component selector initialized');
        break;

      // 컴포넌트 선택됨
      case 'anyon-component-selected':
        if (component) {
          // CSS selector 기반 선택 (소스 코드 위치 정보 없음)
          // component 객체에는 id(selector), name, tag, html, text 등이 포함됨
          const extendedComponent = component as any;

          const selection: ComponentSelection = {
            id: extendedComponent.id || extendedComponent.selector,
            name: extendedComponent.name || '<unknown>',
            // CSS selector 방식에서는 소스 위치를 알 수 없으므로 빈 값
            relativePath: extendedComponent.relativePath || '',
            lineNumber: extendedComponent.lineNumber || 0,
            columnNumber: extendedComponent.columnNumber || 0,
          };
          addSelectedComponent(selection);

          // SelectedElement로도 저장 (HTML 정보 포함)
          if (extendedComponent.selector || extendedComponent.tag) {
            const selectedElement: SelectedElement = {
              tag: extendedComponent.tag || '',
              id: extendedComponent.id || null,
              classes: null, // CSS selector에서 추출 가능하지만 일단 생략
              selector: extendedComponent.selector || extendedComponent.id,
              text: extendedComponent.text || null,
              html: extendedComponent.html,
            };
            setSelectedElement(selectedElement);
          }

          console.debug('[Preview] Component selected:', selection, extendedComponent);
        }
        break;

      // 컴포넌트 선택 해제됨
      case 'anyon-component-deselected':
        if (componentId) {
          removeSelectedComponent(componentId);
          console.debug('[Preview] Component deselected:', componentId);
        }
        break;

      // 윈도우 에러
      case 'window-error':
        if (payload?.message) {
          setPreviewError({
            message: payload.message,
            stack: payload.stack,
            source: 'preview-app',
          });
          addAppOutput({
            type: 'client-error',
            message: `Error: ${payload.message}`,
            timestamp: Date.now(),
            projectPath: '',
          });
        }
        break;

      // 처리되지 않은 Promise rejection
      case 'unhandled-rejection':
        if (payload?.message) {
          setPreviewError({
            message: payload.message,
            stack: payload.stack,
            source: 'preview-app',
          });
          addAppOutput({
            type: 'client-error',
            message: `Unhandled Rejection: ${payload.message}`,
            timestamp: Date.now(),
            projectPath: '',
          });
        }
        break;

      // 소스맵이 적용된 에러
      case 'iframe-sourcemapped-error':
        if (payload?.message) {
          setPreviewError({
            message: payload.message,
            stack: payload.stack,
            source: 'preview-app',
          });
        }
        break;

      // 빌드 에러 (Vite 등)
      case 'build-error-report':
        if (payload?.message) {
          let errorMessage = payload.message;
          if (payload.file) {
            errorMessage = `${payload.file}: ${errorMessage}`;
          }
          setPreviewError({
            message: errorMessage,
            stack: payload.frame,
            source: 'preview-app',
          });
          addAppOutput({
            type: 'stderr',
            message: `Build Error: ${errorMessage}`,
            timestamp: Date.now(),
            projectPath: '',
          });
        }
        break;

      // 네비게이션 이벤트 (pushState)
      case 'pushState':
      case 'replaceState':
        if (payload?.newUrl) {
          try {
            const url = new URL(payload.newUrl);
            setCurrentRoute(url.pathname);
          } catch {
            // URL 파싱 실패
          }
        }
        break;

      // shim 로드 완료
      case 'anyon-shim-loaded':
        console.debug('[Preview] Anyon shim loaded');
        addAppOutput({
          type: 'info',
          message: '[anyon] Preview shim loaded',
          timestamp: Date.now(),
          projectPath: '',
        });
        break;

      default:
        // 알 수 없는 메시지 타입은 무시
        break;
    }
  }, [
    iframeRef,
    setPreviewError,
    addSelectedComponent,
    removeSelectedComponent,
    setComponentSelectorInitialized,
    setCurrentRoute,
    addAppOutput,
    setSelectedElement,
  ]);

  // 메시지 리스너 등록
  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handleMessage]);

  return {
    handleMessage,
  };
}

export default usePreviewMessages;
