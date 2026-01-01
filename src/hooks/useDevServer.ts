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
export function useDevServer(
  projectPath: string | undefined,
  projectId?: string | undefined
) {
  const {
    setDevServerRunning,
    setDevServerPort,
    setDevServerProxyUrl,
    setPackageManager,
    setIsLoading,
    addAppOutput,
    setPreviewError,
    setConnectionState,
    setConnectionError,
    resetConnection,
  } = usePreviewStore();

  // 이미 실행 중인 서버에 연결 (검증 포함)
  const connectToExistingServer = useCallback(async (port: number) => {
    if (!projectPath || !isTauri) return false;

    try {
      setIsLoading(true);
      setConnectionState('connecting');
      setConnectionError(null);

      let proxyUrl: string | null = null;

      // 프록시 서버 시작 (Element Selector 스크립트 주입용)
      try {
        console.log('[DevServer] Attempting to start proxy for port:', port);
        proxyUrl = await invoke<string>('connect_to_existing_server', {
          projectPath,
          port,
        });
        console.log('[DevServer] Proxy server started successfully:', proxyUrl);
      } catch (proxyErr) {
        console.error('[DevServer] Proxy setup failed:', proxyErr);
        console.error('[DevServer] Error details:', JSON.stringify(proxyErr));
        // 프록시 실패 시 직접 연결 (요소 선택 기능 불가)
        proxyUrl = `http://localhost:${port}`;

        addAppOutput({
          type: 'stderr',
          message: `[anyon] Proxy setup failed: ${proxyErr}. Element selector will not work.`,
          timestamp: Date.now(),
          projectPath: projectPath || '',
        });
      }

      // 연결 검증 단계
      setConnectionState('verifying');
      addAppOutput({
        type: 'info',
        message: `[anyon] Verifying connection to ${proxyUrl}...`,
        timestamp: Date.now(),
        projectPath,
      });

      try {
        // HTTP 연결 확인
        const statusCode = await invoke<number>('verify_server_connection', {
          url: proxyUrl,
          timeoutSecs: 5,
        });
        console.log('[DevServer] Connection verified, status:', statusCode);
      } catch (verifyErr) {
        console.warn('[DevServer] Verification failed:', verifyErr);
        // 검증 실패해도 연결 시도는 계속 (일부 서버는 특수 응답 반환)
        addAppOutput({
          type: 'stderr',
          message: `[anyon] Warning: Connection verification returned error, but will try to connect anyway.`,
          timestamp: Date.now(),
          projectPath,
        });
      }

      // 연결 성공
      setConnectionState('connected');
      setDevServerRunning(true);
      setDevServerPort(port);
      setDevServerProxyUrl(proxyUrl);

      addAppOutput({
        type: 'info',
        message: proxyUrl.includes(`:${port}`)
          ? `[anyon] ✓ Connected to server at localhost:${port} (direct)`
          : `[anyon] ✓ Connected to server at localhost:${port} via proxy`,
        timestamp: Date.now(),
        projectPath,
      });
      return true;
    } catch (err) {
      console.error('Failed to connect to existing server:', err);
      setConnectionState('error');
      setConnectionError(err instanceof Error ? err.message : String(err));
      addAppOutput({
        type: 'stderr',
        message: `[anyon] ✗ Connection failed: ${err}`,
        timestamp: Date.now(),
        projectPath: projectPath || '',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [projectPath, setDevServerRunning, setDevServerPort, setDevServerProxyUrl, setIsLoading, addAppOutput, setConnectionState, setConnectionError]);

  // Dev server 시작 (먼저 채팅에서 감지된 포트 확인, 그 다음 기존 서버 확인)
  const startDevServer = useCallback(async () => {
    if (!projectPath || !isTauri) return;

    try {
      setIsLoading(true);
      setConnectionState('starting');
      setConnectionError(null);

      // 1. 채팅에서 감지된 포트가 있는지 먼저 확인
      const detectedPort = usePreviewStore.getState().getLatestDetectedPort();
      if (detectedPort) {
        console.log('[DevServer] Checking detected port from chat:', detectedPort);
        setConnectionState('port-detected');
        try {
          // 감지된 포트가 실제로 살아있는지 확인
          const ports = await invoke<Array<{ port: number; alive: boolean; url: string }>>('scan_ports');
          const isAlive = ports.some(p => p.port === detectedPort && p.alive);

          if (isAlive) {
            addAppOutput({
              type: 'info',
              message: `[anyon] Found server at localhost:${detectedPort} (detected from chat), connecting...`,
              timestamp: Date.now(),
              projectPath,
            });

            const connected = await connectToExistingServer(detectedPort);
            if (connected) {
              return;
            }
          }
        } catch (err) {
          console.warn('[DevServer] Failed to check detected port:', err);
        }
      }

      // 2. 감지된 포트가 없거나 죽었으면, 일반 포트 스캔
      setConnectionState('starting');
      const ports = await invoke<Array<{ port: number; alive: boolean; url: string }>>('scan_ports');
      const runningServer = ports.find(p => p.alive && p.port >= 3000 && p.port <= 9000);

      if (runningServer) {
        // 이미 실행 중인 서버에 연결
        setConnectionState('port-detected');
        addAppOutput({
          type: 'info',
          message: `[anyon] Found existing server at localhost:${runningServer.port}, connecting...`,
          timestamp: Date.now(),
          projectPath,
        });

        const connected = await connectToExistingServer(runningServer.port);
        if (connected) {
          return;
        }
      }

      // 기존 서버가 없으면 새로 시작
      const pm = await invoke<string>('detect_package_manager', { projectPath });
      setPackageManager(pm);

      // Dev server 시작 (projectId 전달하여 고정 포트 사용)
      setConnectionState('starting');
      await invoke('start_dev_server', {
        projectPath,
        projectId: projectId || null,
      });

      setDevServerRunning(true);
      addAppOutput({
        type: 'info',
        message: projectId
          ? `[anyon] Starting dev server with ${pm} (fixed port mode)...`
          : `[anyon] Starting dev server with ${pm}...`,
        timestamp: Date.now(),
        projectPath,
      });
      // 주의: 여기서는 아직 'connected'가 아님. 이벤트 리스너에서 포트 감지 후 검증
    } catch (err) {
      console.error('Failed to start dev server:', err);
      setConnectionState('error');
      setConnectionError(err instanceof Error ? err.message : String(err));
      addAppOutput({
        type: 'stderr',
        message: `[anyon] Failed to start dev server: ${err}`,
        timestamp: Date.now(),
        projectPath,
      });
    } finally {
      setIsLoading(false);
    }
  }, [projectPath, projectId, connectToExistingServer, setDevServerRunning, setPackageManager, setIsLoading, addAppOutput, setConnectionState, setConnectionError]);

  // Dev server 중지
  const stopDevServer = useCallback(async () => {
    if (!projectPath || !isTauri) return;

    try {
      await invoke('stop_dev_server', { projectPath });
      resetConnection();
      addAppOutput({
        type: 'info',
        message: `[anyon] Dev server stopped`,
        timestamp: Date.now(),
        projectPath,
      });
    } catch (err) {
      console.error('Failed to stop dev server:', err);
    }
  }, [projectPath, resetConnection, addAppOutput]);

  // 특정 포트 프로세스 킬 후 서버 재시작
  const killPortAndRestart = useCallback(async (port: number = 3000) => {
    if (!projectPath || !isTauri) return;

    try {
      setIsLoading(true);
      setConnectionState('starting');

      // 1. 해당 포트에서 실행 중인 프로세스 킬
      addAppOutput({
        type: 'info',
        message: `[anyon] Killing processes on port ${port}...`,
        timestamp: Date.now(),
        projectPath,
      });

      const killed = await invoke<boolean>('kill_port_process', { port });
      if (killed) {
        addAppOutput({
          type: 'info',
          message: `[anyon] Successfully killed process on port ${port}`,
          timestamp: Date.now(),
          projectPath,
        });
      }

      // 2. 잠시 대기 (포트 해제 시간)
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. Dev server 시작
      await startDevServer();
    } catch (err) {
      console.error('Failed to kill port and restart:', err);
      setConnectionState('error');
      setConnectionError(err instanceof Error ? err.message : String(err));
      addAppOutput({
        type: 'stderr',
        message: `[anyon] Failed to kill port ${port}: ${err}`,
        timestamp: Date.now(),
        projectPath,
      });
    } finally {
      setIsLoading(false);
    }
  }, [projectPath, startDevServer, setIsLoading, addAppOutput, setConnectionState, setConnectionError]);

  // Dev server 정보 가져오기
  const getDevServerInfo = useCallback(async (): Promise<DevServerInfo | null> => {
    if (!projectPath || !isTauri) return null;

    try {
      return await invoke<DevServerInfo | null>('get_dev_server_info', { projectPath });
    } catch {
      return null;
    }
  }, [projectPath]);

  // 경로 정규화 함수 (Windows 경로 호환)
  const normalizePath = (path: string) => path.replace(/\\/g, '/').toLowerCase();

  // Dev server output 이벤트 리스너
  useEffect(() => {
    if (!projectPath || !isTauri) return;

    const setupListener = async () => {
      const unlisten = await listen<DevServerOutput>('dev-server-output', (event) => {
        const data = event.payload;

        // 현재 프로젝트의 이벤트만 처리 (경로 정규화하여 비교)
        if (normalizePath(data.project_path) !== normalizePath(projectPath)) return;

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

        // 포트 감지됨 - 검증 후 연결 상태 업데이트
        if (data.output_type === 'port-detected' && data.port && data.proxy_url) {
          const proxyUrl = data.proxy_url; // 타입 narrowing을 위해 로컬 변수로 캡처
          const projectPathForLog = data.project_path;

          console.log('[DevServer] Port detected:', data.port, 'Proxy:', proxyUrl);
          setConnectionState('port-detected');
          setDevServerPort(data.port);

          // 비동기로 연결 검증
          (async () => {
            setConnectionState('verifying');
            try {
              // HTTP 연결 확인
              const statusCode = await invoke<number>('verify_server_connection', {
                url: proxyUrl,
                timeoutSecs: 5,
              });
              console.log('[DevServer] Connection verified via event, status:', statusCode);
              setConnectionState('connected');
              setDevServerProxyUrl(proxyUrl);
              addAppOutput({
                type: 'info',
                message: `[anyon] ✓ Server verified and ready at ${proxyUrl}`,
                timestamp: Date.now(),
                projectPath: projectPathForLog,
              });
            } catch (verifyErr) {
              console.warn('[DevServer] Verification failed via event:', verifyErr);
              // 검증 실패해도 URL 설정 (사용자가 직접 확인 가능)
              setDevServerProxyUrl(proxyUrl);
              setConnectionState('connected'); // 일단 연결된 것으로 처리, UI에서 다시 시도 가능
              addAppOutput({
                type: 'stderr',
                message: `[anyon] ⚠ Server started but verification returned error. Try refreshing.`,
                timestamp: Date.now(),
                projectPath: projectPathForLog,
              });
            }
          })();

          setIsLoading(false);
        }
      });

      return unlisten;
    };

    const unlistenPromise = setupListener();

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [projectPath, addAppOutput, setDevServerPort, setDevServerProxyUrl, setIsLoading, setPreviewError, setConnectionState]);

  // 프로젝트 변경 시 자동으로 dev server 상태 확인 (마운트 시 즉시 실행)
  useEffect(() => {
    if (!projectPath || !isTauri) return;

    // 마운트 시 즉시 백엔드 상태 확인 (딜레이 없이)
    const checkExistingServer = async () => {
      try {
        console.log('[DevServer] Checking for existing server on mount:', projectPath);
        const info = await invoke<DevServerInfo | null>('get_dev_server_info', { projectPath });

        if (info && info.proxy_url) {
          console.log('[DevServer] Found existing server, restoring state:', info);
          setDevServerRunning(true);
          setDevServerPort(info.detected_port || null);
          setDevServerProxyUrl(info.proxy_url);
          setConnectionState('connected');
          setConnectionError(null);
        } else {
          console.log('[DevServer] No existing server found for project');
        }
      } catch (err) {
        console.warn('[DevServer] Failed to check existing server:', err);
      }
    };

    // 즉시 실행 (RAF로 최초 렌더 후 실행 보장)
    requestAnimationFrame(() => {
      checkExistingServer();
    });
  }, [projectPath, setDevServerRunning, setDevServerPort, setDevServerProxyUrl, setConnectionState, setConnectionError]);

  return {
    startDevServer,
    stopDevServer,
    getDevServerInfo,
    connectToExistingServer,
    killPortAndRestart,
  };
}

export default useDevServer;
