import { useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { usePreviewStore } from '@/stores/previewStore';

// Tauri 환경 체크 - 여러 방법으로 확인
const isTauri = typeof window !== 'undefined' && (
  '__TAURI__' in window ||
  '__TAURI_INTERNALS__' in window ||
  window.location.protocol === 'tauri:'
);

interface DevServerOutput {
  project_path: string;
  output_type: 'stdout' | 'stderr' | 'info' | 'port-detected' | 'error';
  message: string;
  port?: number;
  proxy_url?: string;
}

interface DevServerInfo {
  project_path: string;
  pid: number;
  detected_port?: number;
  original_url?: string;
  proxy_port?: number;
  proxy_url?: string;
}

/**
 * Dev server 관리 훅
 * 프로젝트 열 때 자동으로 dev server 시작하고 프록시 URL 연결
 */
export function useDevServer(projectPath: string | undefined) {
  const {
    setDevServerRunning,
    setDevServerPort,
    setDevServerProxyUrl,
    setPackageManager,
    setIsLoading,
    addAppOutput,
    setPreviewError,
  } = usePreviewStore();

  // Dev server 시작
  const startDevServer = useCallback(async () => {
    if (!projectPath || !isTauri) return;

    try {
      setIsLoading(true);

      // 패키지 매니저 감지
      const pm = await invoke<string>('detect_package_manager', { projectPath });
      setPackageManager(pm);

      // Dev server 시작
      await invoke('start_dev_server', { projectPath });

      setDevServerRunning(true);
      addAppOutput({
        type: 'info',
        message: `[anyon] Starting dev server with ${pm}...`,
        timestamp: Date.now(),
        projectPath,
      });
    } catch (err) {
      console.error('Failed to start dev server:', err);
      addAppOutput({
        type: 'stderr',
        message: `[anyon] Failed to start dev server: ${err}`,
        timestamp: Date.now(),
        projectPath,
      });
    } finally {
      setIsLoading(false);
    }
  }, [projectPath, setDevServerRunning, setPackageManager, setIsLoading, addAppOutput]);

  // Dev server 중지
  const stopDevServer = useCallback(async () => {
    if (!projectPath || !isTauri) return;

    try {
      await invoke('stop_dev_server', { projectPath });
      setDevServerRunning(false);
      setDevServerPort(null);
      setDevServerProxyUrl(null);
    } catch (err) {
      console.error('Failed to stop dev server:', err);
    }
  }, [projectPath, setDevServerRunning, setDevServerPort, setDevServerProxyUrl]);

  // Dev server 정보 가져오기
  const getDevServerInfo = useCallback(async (): Promise<DevServerInfo | null> => {
    if (!projectPath || !isTauri) return null;

    try {
      return await invoke<DevServerInfo | null>('get_dev_server_info', { projectPath });
    } catch {
      return null;
    }
  }, [projectPath]);

  // Dev server output 이벤트 리스너
  useEffect(() => {
    if (!projectPath || !isTauri) return;

    const setupListener = async () => {
      const unlisten = await listen<DevServerOutput>('dev-server-output', (event) => {
        const data = event.payload;

        // 현재 프로젝트의 이벤트만 처리
        if (data.project_path !== projectPath) return;

        // 콘솔에 출력 추가
        addAppOutput({
          type: data.output_type === 'stderr' ? 'stderr' :
                data.output_type === 'error' ? 'stderr' :
                data.output_type === 'port-detected' ? 'info' : 'stdout',
          message: data.message,
          timestamp: Date.now(),
          projectPath: data.project_path,
        });

        // 에러 감지 - stderr에서 에러 패턴 확인
        if (data.output_type === 'stderr' || data.output_type === 'error') {
          const errorPatterns = [
            /error/i,
            /ERR_MODULE_NOT_FOUND/i,
            /Cannot find/i,
            /failed to/i,
            /ENOENT/i,
            /SyntaxError/i,
            /TypeError/i,
            /ReferenceError/i,
          ];

          const isError = errorPatterns.some(pattern => pattern.test(data.message));
          if (isError) {
            console.log('[DevServer] Error detected:', data.message);
            setPreviewError({
              message: data.message,
              source: 'dev-server',
            });
          }
        }

        // 포트 감지됨
        if (data.output_type === 'port-detected' && data.port && data.proxy_url) {
          console.log('[DevServer] Port detected:', data.port, 'Proxy:', data.proxy_url);
          setDevServerPort(data.port);
          setDevServerProxyUrl(data.proxy_url);
          setIsLoading(false);
        }
      });

      return unlisten;
    };

    const unlistenPromise = setupListener();

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [projectPath, addAppOutput, setDevServerPort, setDevServerProxyUrl, setIsLoading, setPreviewError]);

  // 프로젝트 변경 시 자동으로 dev server 상태 확인
  useEffect(() => {
    if (!projectPath || !isTauri) return;

    const checkExistingServer = async () => {
      const info = await getDevServerInfo();
      if (info && info.proxy_url) {
        setDevServerRunning(true);
        setDevServerPort(info.detected_port || null);
        setDevServerProxyUrl(info.proxy_url);
      }
    };

    checkExistingServer();
  }, [projectPath, getDevServerInfo, setDevServerRunning, setDevServerPort, setDevServerProxyUrl]);

  return {
    startDevServer,
    stopDevServer,
    getDevServerInfo,
  };
}

export default useDevServer;
