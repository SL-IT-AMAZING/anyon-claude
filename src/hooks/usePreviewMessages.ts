import { useEffect, useCallback } from 'react';
import { usePreviewStore } from '@/stores/previewStore';
import type { IframeMessage, ComponentSelection } from '@/types/preview';

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
          const selection: ComponentSelection = {
            id: component.id,
            name: component.name || '<unknown>',
            relativePath: (component as any).relativePath || '',
            lineNumber: (component as any).lineNumber || 0,
            columnNumber: (component as any).columnNumber || 0,
          };
          addSelectedComponent(selection);
          console.debug('[Preview] Component selected:', selection);
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
