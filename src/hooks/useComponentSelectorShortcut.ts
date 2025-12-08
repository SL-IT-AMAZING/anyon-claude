import { useEffect, useCallback } from 'react';
import { usePreviewStore } from '@/stores/previewStore';

/**
 * 컴포넌트 선택기 단축키 훅
 * Cmd/Ctrl + Shift + C로 컴포넌트 선택 모드 토글
 */
export function useComponentSelectorShortcut() {
  const {
    iframeRef,
    isComponentSelectorInitialized,
    isSelectorActive,
    activateSelector,
    deactivateSelector,
  } = usePreviewStore();

  // 선택기 토글
  const toggleSelector = useCallback(() => {
    // isComponentSelectorInitialized 조건 제거 - 직접 postMessage로 처리할 수 있도록
    if (isSelectorActive) {
      deactivateSelector();
    } else {
      activateSelector();
    }
  }, [isSelectorActive, activateSelector, deactivateSelector]);

  useEffect(() => {
    // Mac인지 확인
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const hasShift = event.shiftKey;
      const hasCtrlOrMeta = isMac ? event.metaKey : event.ctrlKey;

      // Cmd/Ctrl + Shift + C
      if (key === 'c' && hasShift && hasCtrlOrMeta) {
        event.preventDefault();
        toggleSelector();
      }
    };

    // iframe에서 보내는 단축키 메시지 처리
    const handleMessage = (event: MessageEvent) => {
      // 우리 iframe에서 온 메시지만 처리
      if (event.source !== iframeRef?.contentWindow) {
        return;
      }

      if (event.data?.type === 'anyon-select-component-shortcut') {
        toggleSelector();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('message', handleMessage);
    };
  }, [iframeRef, toggleSelector]);

  return {
    toggleSelector,
    isSelectorActive,
    isComponentSelectorInitialized,
  };
}

export default useComponentSelectorShortcut;
