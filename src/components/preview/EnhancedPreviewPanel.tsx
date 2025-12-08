import React, { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-shell';
import {
  RefreshCw,
  Maximize,
  ExternalLink,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  RotateCw,
  ZoomIn,
  ZoomOut,
  MousePointer2,
  FileCode,
  Server,
  ArrowLeft,
  ArrowRight,
  FolderOpen,
  Play,
  Square,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { usePreviewStore } from '@/stores/previewStore';
import { usePreviewMessages } from '@/hooks/usePreviewMessages';
import { useComponentSelectorShortcut } from '@/hooks/useComponentSelectorShortcut';
import { useDevServer } from '@/hooks/useDevServer';
import { ActionHeader } from './ActionHeader';
import { ErrorBanner } from './ErrorBanner';
import { Problems } from './Problems';
import { Console } from './Console';
import type { PortInfo, DeviceSize, SelectedElement, ElementAction } from '@/types/preview';

// Tauri 환경 체크 - 여러 방법으로 확인
const isTauri = typeof window !== 'undefined' && (
  '__TAURI__' in window ||
  '__TAURI_INTERNALS__' in window ||
  window.location.protocol === 'tauri:'
);

const DEVICE_SIZES: DeviceSize[] = [
  { name: 'iPhone SE', width: 375, height: 667, frameType: 'mobile' },
  { name: 'iPhone 12/13', width: 390, height: 844, frameType: 'mobile' },
  { name: 'iPhone Pro Max', width: 428, height: 926, frameType: 'mobile' },
  { name: 'iPad Mini', width: 768, height: 1024, frameType: 'tablet' },
  { name: 'iPad Air', width: 820, height: 1180, frameType: 'tablet' },
  { name: 'iPad Pro 11"', width: 834, height: 1194, frameType: 'tablet' },
  { name: 'Laptop', width: 1366, height: 768, frameType: 'laptop' },
  { name: 'Desktop', width: 1920, height: 1080, frameType: 'desktop' },
];

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  mobile: <Smartphone className="w-4 h-4" />,
  tablet: <Tablet className="w-4 h-4" />,
  laptop: <Laptop className="w-4 h-4" />,
  desktop: <Monitor className="w-4 h-4" />,
};

interface EnhancedPreviewPanelProps {
  /** HTML file path for file preview mode */
  htmlFilePath?: string;
  /** Project root path for resolving relative paths in HTML */
  projectPath?: string;
  /** Callback when element is selected in selector mode */
  onElementSelected?: (element: SelectedElement | null) => void;
  /** Callback when element action is triggered */
  onElementAction?: (action: ElementAction, element: SelectedElement) => void;
  /** Callback when AI fix is requested */
  onAIFix?: (prompt: string) => void;
}

/**
 * 향상된 프리뷰 패널
 * dyad-clone의 기능들을 통합한 버전
 */
export const EnhancedPreviewPanel: React.FC<EnhancedPreviewPanelProps> = ({
  htmlFilePath,
  projectPath,
  onElementSelected,
  onElementAction: _onElementAction,
  onAIFix,
}) => {
  // Preview store 상태
  const {
    previewMode,
    isPreviewOpen: _isPreviewOpen,
    previewError,
    clearPreviewError,
    problemReport,
    setIframeRef,
    addAppOutput,
    currentRoute: _currentRoute,
    setCurrentRoute: _setCurrentRoute,
    devServerRunning,
    devServerProxyUrl,
    devServerPort,
    packageManager,
    isLoading,
    setSelectorActive,
  } = usePreviewStore();

  // 메시지 훅
  usePreviewMessages();
  const { isSelectorActive, isComponentSelectorInitialized } = useComponentSelectorShortcut();
  const { startDevServer, stopDevServer } = useDevServer(projectPath);

  // 로컬 상태
  const [sourceMode, setSourceMode] = useState<'port' | 'file'>(htmlFilePath ? 'file' : 'port');
  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState<number | null>(null);
  const [urlPath, setUrlPath] = useState('/');
  const [currentFilePath, setCurrentFilePath] = useState<string>(htmlFilePath || '');
  const [currentUrl, setCurrentUrl] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 디바이스 모드 상태
  const [isDeviceMode, setIsDeviceMode] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceSize>(DEVICE_SIZES[0]);
  const [isLandscape, setIsLandscape] = useState(false);
  const [scale, setScale] = useState(1);

  // 요소 선택 상태
  const [_selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);

  // iframe ref 등록
  useEffect(() => {
    if (iframeRef.current) {
      setIframeRef(iframeRef.current);
    }
    return () => setIframeRef(null);
  }, [setIframeRef]);

  // HTML 파일 로드
  useEffect(() => {
    if (htmlFilePath && htmlFilePath !== currentFilePath) {
      setCurrentFilePath(htmlFilePath);
      setSourceMode('file');
      loadHtmlFile(htmlFilePath);
    }
  }, [htmlFilePath]);

  const loadHtmlFile = async (filePath: string) => {
    console.log('[Preview] loadHtmlFile called:', { filePath, isTauri, projectPath });

    if (!isTauri) {
      // 브라우저 환경에서는 Tauri 명령어 사용 불가
      console.warn('[Preview] Not in Tauri environment, cannot load HTML file directly');
      addAppOutput({
        type: 'info',
        message: `[preview] Tauri 앱에서만 HTML 파일 미리보기가 가능합니다: ${filePath.split(/[/\\]/).pop()}`,
        timestamp: Date.now(),
        projectPath: projectPath || '',
      });
      return;
    }

    try {
      const resolvedProjectPath = projectPath || filePath.substring(0, filePath.lastIndexOf('/')) || filePath.substring(0, filePath.lastIndexOf('\\'));
      console.log('[Preview] Starting preview server for:', resolvedProjectPath);

      const serverInfo = await invoke('start_file_preview_server', { projectPath: resolvedProjectPath });
      console.log('[Preview] Server started:', serverInfo);

      const previewUrl = await invoke<string>('get_file_preview_url', { filePath, projectPath: resolvedProjectPath });
      console.log('[Preview] Got preview URL:', previewUrl);

      setCurrentUrl(previewUrl);
      addAppOutput({
        type: 'info',
        message: `[preview] Loading ${filePath.split(/[/\\]/).pop()} at ${previewUrl}`,
        timestamp: Date.now(),
        projectPath: resolvedProjectPath,
      });
    } catch (err) {
      console.error('[Preview] Failed to load HTML file:', err);
      addAppOutput({
        type: 'stderr',
        message: `[preview] Failed to load HTML file: ${err}`,
        timestamp: Date.now(),
        projectPath: projectPath || '',
      });
    }
  };

  // Dev server 프록시 URL 사용
  useEffect(() => {
    if (devServerProxyUrl && sourceMode === 'port') {
      setCurrentUrl(devServerProxyUrl + urlPath);
    }
  }, [devServerProxyUrl, sourceMode, urlPath]);

  // 프로젝트 열면 자동으로 프리뷰 시작 (HTML 파일 또는 dev server)
  useEffect(() => {
    console.log('[Preview] Auto-detect useEffect triggered:', {
      projectPath,
      isTauri,
      hasTauriGlobal: typeof window !== 'undefined' && '__TAURI__' in window,
      hasTauriInternals: typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window,
      protocol: typeof window !== 'undefined' ? window.location.protocol : 'unknown',
      htmlFilePath,
      currentUrl,
      sourceMode
    });

    if (!projectPath) {
      console.log('[Preview] Skipping auto-detect: no projectPath');
      return;
    }

    if (!isTauri) {
      console.log('[Preview] Skipping auto-detect: not Tauri environment');
      return;
    }

    const autoDetectAndStart = async () => {
      try {
        // 1. 먼저 package.json 확인 → dev server 시작
        const hasPackageJson = await invoke<boolean>('check_file_exists', {
          filePath: `${projectPath}/package.json`
        });

        if (hasPackageJson) {
          // npm/yarn/pnpm/bun 프로젝트 - dev server 시작
          if (!devServerRunning) {
            setSourceMode('port');
            startDevServer();
          }
          return;
        }

        // 2. package.json 없으면 HTML 파일 찾기
        const htmlFiles = ['index.html', 'main.html', 'home.html'];
        for (const htmlFile of htmlFiles) {
          const htmlPath = `${projectPath}/${htmlFile}`;
          const exists = await invoke<boolean>('check_file_exists', { filePath: htmlPath });
          if (exists) {
            console.log('[Preview] Auto-detected HTML file:', htmlPath);
            setSourceMode('file');
            setCurrentFilePath(htmlPath);
            loadHtmlFile(htmlPath);
            return;
          }
        }

        // 3. 루트에 없으면 src/ 폴더에서 찾기
        for (const htmlFile of htmlFiles) {
          const htmlPath = `${projectPath}/src/${htmlFile}`;
          const exists = await invoke<boolean>('check_file_exists', { filePath: htmlPath });
          if (exists) {
            console.log('[Preview] Auto-detected HTML file in src/:', htmlPath);
            setSourceMode('file');
            setCurrentFilePath(htmlPath);
            loadHtmlFile(htmlPath);
            return;
          }
        }

        console.log('[Preview] No package.json or HTML files found in project');
      } catch (err) {
        console.error('[Preview] Auto-detect failed:', err);
      }
    };

    // htmlFilePath가 외부에서 설정되지 않았을 때만 자동 감지
    if (!htmlFilePath && !currentUrl) {
      autoDetectAndStart();
    }
  }, [projectPath, htmlFilePath, devServerRunning, startDevServer, currentUrl]);

  // 포트 스캔 (dev server가 없을 때만)
  useEffect(() => {
    if (sourceMode === 'port' && !devServerProxyUrl) {
      scanPorts();
      const interval = setInterval(scanPorts, 10000);
      return () => clearInterval(interval);
    }
  }, [sourceMode, devServerProxyUrl]);

  const scanPorts = async () => {
    try {
      const result = await invoke<PortInfo[]>('scan_ports');
      setPorts(result);

      if (!selectedPort && result.length > 0) {
        const alive = result.find((p) => p.alive);
        if (alive) {
          setSelectedPort(alive.port);
          setCurrentUrl(alive.url);
        }
      }
    } catch (err) {
      console.error('Port scan failed:', err);
    }
  };

  // 포트 변경
  const handlePortChange = (port: number) => {
    setSelectedPort(port);
    const portInfo = ports.find((p) => p.port === port);
    if (portInfo) {
      setCurrentUrl(portInfo.url + urlPath);
    }
  };

  // 네비게이션
  const handleNavigate = () => {
    if (selectedPort) {
      setCurrentUrl(`http://localhost:${selectedPort}${urlPath}`);
    }
  };

  const handleBack = () => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'navigate', payload: { direction: 'backward' } }, '*');
  };

  const handleForward = () => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'navigate', payload: { direction: 'forward' } }, '*');
  };

  // 새로고침
  const handleRefresh = () => {
    if (sourceMode === 'file' && currentFilePath) {
      loadHtmlFile(currentFilePath);
    } else if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
    addAppOutput({
      type: 'info',
      message: '[preview] Refreshing...',
      timestamp: Date.now(),
      projectPath: '',
    });
  };

  // 풀스크린
  const handleFullscreen = () => {
    iframeRef.current?.requestFullscreen();
  };

  // 외부 열기
  const handleOpenExternal = async () => {
    if (sourceMode === 'file' && currentFilePath) {
      await open(currentFilePath);
    } else if (currentUrl && !currentUrl.startsWith('data:')) {
      await open(currentUrl);
    }
  };

  // 요소 선택기 토글
  const handleToggleSelector = () => {
    console.log('[Preview] Toggle selector clicked:', {
      isSelectorActive,
      isComponentSelectorInitialized,
      hasIframeRef: !!iframeRef.current,
      currentUrl
    });

    // isComponentSelectorInitialized가 false여도 iframe이 있으면 시도
    if (iframeRef.current?.contentWindow) {
      if (isSelectorActive) {
        iframeRef.current.contentWindow.postMessage(
          { type: 'deactivate-anyon-component-selector' },
          '*'
        );
        setSelectedElement(null);
        onElementSelected?.(null);
        setSelectorActive(false);
      } else {
        iframeRef.current.contentWindow.postMessage(
          { type: 'activate-anyon-component-selector' },
          '*'
        );
        setSelectorActive(true);
      }
    } else {
      console.warn('[Preview] No iframe contentWindow available');
    }
  };

  // 디바이스 관련
  const toggleOrientation = () => setIsLandscape(!isLandscape);
  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.25));
  const handleResetZoom = () => setScale(1);

  const getDeviceDimensions = () => {
    const width = isLandscape ? selectedDevice.height : selectedDevice.width;
    const height = isLandscape ? selectedDevice.width : selectedDevice.height;
    return { width, height };
  };

  // AI 수정 핸들러
  const handleAIFix = useCallback((prompt: string) => {
    onAIFix?.(prompt);
    clearPreviewError();
  }, [onAIFix, clearPreviewError]);

  const { width, height } = getDeviceDimensions();
  const hasContent = currentUrl || (sourceMode === 'port' && ports.some((p) => p.alive));
  const problemCount = problemReport?.problems?.length || 0;

  // 현재 활성 컨텐츠 렌더링
  const renderContent = () => {
    switch (previewMode) {
      case 'problems':
        return (
          <Problems
            projectPath={projectPath || currentFilePath}
            onAIFix={handleAIFix}
          />
        );
      case 'console':
        return <Console />;
      case 'code':
        // TODO: CodeView 컴포넌트 구현
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            Code view coming soon...
          </div>
        );
      case 'preview':
      default:
        return renderPreview();
    }
  };

  // 프리뷰 iframe 렌더링
  const renderPreview = () => {
    if (!currentUrl) {
      return (
        <div className="relative flex items-center justify-center h-full text-gray-500">
          {/* 에러 배너 - currentUrl 없어도 표시 */}
          <ErrorBanner
            error={previewError}
            onDismiss={clearPreviewError}
            onAIFix={handleAIFix}
          />

          <div className="text-center space-y-4">
            <Monitor className="w-12 h-12 mx-auto opacity-50" />
            <p className="text-sm">
              {sourceMode === 'port'
                ? isLoading
                  ? '개발 서버 시작 중...'
                  : devServerRunning
                    ? '포트 감지 중...'
                    : previewError
                      ? '개발 서버 에러 발생'
                      : '개발 서버가 실행되지 않았습니다'
                : 'HTML 파일을 선택하세요'}
            </p>
            {sourceMode === 'port' && !devServerRunning && !isLoading && !previewError && (
              <div className="flex flex-col items-center gap-2">
                <Button
                  onClick={startDevServer}
                  disabled={!projectPath}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  개발 서버 시작
                </Button>
                <span className="text-xs text-gray-400">
                  {projectPath ? '패키지 매니저 자동 감지' : '프로젝트를 선택하세요'}
                </span>
              </div>
            )}
            {isLoading && (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-green-500" />
                <span className="text-sm">{packageManager || '패키지 매니저 감지 중...'}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (isDeviceMode) {
      return (
        <div className="flex items-center justify-center h-full p-8 bg-gray-100 dark:bg-gray-900">
          <div
            className="relative"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center',
              transition: 'transform 0.2s ease-out',
            }}
          >
            <div className="absolute -top-8 left-0 right-0 text-center text-sm text-gray-500">
              {selectedDevice.name} {isLandscape ? '(Landscape)' : '(Portrait)'}
              <span className="ml-2 text-xs">{width}×{height}</span>
            </div>
            <div
              className="relative shadow-2xl"
              style={{
                borderRadius: selectedDevice.frameType === 'mobile' ? '36px' : '20px',
                background: '#111',
                padding: selectedDevice.frameType === 'mobile' ? '40px 20px' : '30px',
              }}
            >
              <iframe
                ref={iframeRef}
                src={currentUrl}
                className="border-0 bg-white rounded-lg"
                style={{ width: `${width}px`, height: `${height}px`, display: 'block' }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative h-full">
        {/* 에러 배너 */}
        <ErrorBanner
          error={previewError}
          onDismiss={clearPreviewError}
          onAIFix={handleAIFix}
        />

        <iframe
          ref={iframeRef}
          src={currentUrl}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* 액션 헤더 (탭 전환) */}
      <ActionHeader
        problemCount={problemCount}
        onCleanRestart={() => console.log('Clean restart')}
        onClearCache={() => console.log('Clear cache')}
      />

      {/* 툴바 - 프리뷰 모드일 때만 표시 */}
      {previewMode === 'preview' && (
        <div className="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-700 flex-wrap">
          {/* 소스 모드 토글 */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={sourceMode === 'port' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-r-none"
              onClick={() => setSourceMode('port')}
            >
              <Server className="w-4 h-4 mr-1" />
              서버
            </Button>
            <Button
              variant={sourceMode === 'file' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-l-none"
              onClick={() => setSourceMode('file')}
            >
              <FileCode className="w-4 h-4 mr-1" />
              파일
            </Button>
          </div>

          {sourceMode === 'port' ? (
            <>
              {/* 개발 서버 시작/중지 버튼 */}
              {devServerRunning ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={stopDevServer}
                  disabled={isLoading}
                  title="개발 서버 중지"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Square className="w-4 h-4 mr-1" />
                  )}
                  중지
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={startDevServer}
                  disabled={isLoading || !projectPath}
                  title="개발 서버 시작"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-1" />
                  )}
                  시작
                </Button>
              )}

              {/* 패키지 매니저 및 포트 정보 */}
              {devServerRunning && (
                <div className="flex items-center gap-2 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-md text-sm">
                  <span className="text-green-600 dark:text-green-400">
                    {packageManager || 'npm'} • localhost:{devServerPort || '...'}
                  </span>
                </div>
              )}

              {/* 포트 선택 (dev server가 없을 때만) */}
              {!devServerRunning && (
                <select
                  value={selectedPort || ''}
                  onChange={(e) => handlePortChange(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-md border bg-white dark:bg-gray-800 text-sm"
                  disabled={ports.length === 0}
                >
                  <option value="" disabled>포트 선택</option>
                  {ports.map((p) => (
                    <option key={p.port} value={p.port}>
                      {p.alive ? '🟢' : '🔴'} Port {p.port}
                    </option>
                  ))}
                </select>
              )}

              {/* URL 입력 */}
              <div className="flex-1 flex items-center gap-1 border rounded-md px-2 bg-white dark:bg-gray-800 min-w-[120px]">
                <span className="text-xs text-gray-500">
                  localhost:{devServerPort || selectedPort || '----'}
                </span>
                <input
                  type="text"
                  value={urlPath}
                  onChange={(e) => setUrlPath(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNavigate()}
                  placeholder="/path"
                  className="flex-1 px-2 py-1 text-sm bg-transparent outline-none"
                  disabled={!devServerPort && !selectedPort}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <div className="flex-1 flex items-center gap-1 border rounded-md px-2 bg-white dark:bg-gray-800 min-w-[120px]">
                <FileCode className="w-4 h-4 text-gray-500" />
                <span className="text-sm truncate">
                  {currentFilePath ? currentFilePath.split(/[/\\]/).pop() : 'No file selected'}
                </span>
              </div>
              {/* HTML 파일 선택 버튼 */}
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (!isTauri) {
                    console.warn('File dialog only available in Tauri');
                    return;
                  }
                  try {
                    const { open } = await import('@tauri-apps/plugin-dialog');
                    const selected = await open({
                      multiple: false,
                      filters: [{ name: 'HTML Files', extensions: ['html', 'htm'] }],
                      directory: false,
                    });
                    if (selected && typeof selected === 'string') {
                      setCurrentFilePath(selected);
                      loadHtmlFile(selected);
                    }
                  } catch (err) {
                    console.error('Failed to open file dialog:', err);
                  }
                }}
              >
                <FolderOpen className="w-4 h-4 mr-1" />
                열기
              </Button>
            </div>
          )}

          {/* 네비게이션 버튼 */}
          <div className="flex items-center border rounded-md">
            <Button variant="ghost" size="icon" onClick={handleBack} disabled={!hasContent}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleForward} disabled={!hasContent}>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* 요소 선택기 */}
          <Button
            variant={isSelectorActive ? 'default' : 'ghost'}
            size="icon"
            onClick={handleToggleSelector}
            disabled={!hasContent}
            title={`요소 선택 모드 ${isSelectorActive ? '(활성화)' : ''} - Cmd+Shift+C`}
            className={cn(isSelectorActive && 'bg-purple-500 hover:bg-purple-600')}
          >
            <MousePointer2 className="w-4 h-4" />
          </Button>

          {/* 디바이스 선택 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={isDeviceMode ? 'default' : 'ghost'} size="icon" disabled={!hasContent}>
                {DEVICE_ICONS[selectedDevice.frameType]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setIsDeviceMode(!isDeviceMode)}>
                <Monitor className="w-4 h-4 mr-2" />
                {isDeviceMode ? 'Disable' : 'Enable'} Device Mode
              </DropdownMenuItem>
              {isDeviceMode && (
                <>
                  <DropdownMenuSeparator />
                  {DEVICE_SIZES.map((device) => (
                    <DropdownMenuItem
                      key={device.name}
                      onClick={() => setSelectedDevice(device)}
                      className={selectedDevice.name === device.name ? 'bg-purple-100 dark:bg-purple-900/30' : ''}
                    >
                      <span className="mr-2">{DEVICE_ICONS[device.frameType]}</span>
                      <span className="flex-1">{device.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {device.width}×{device.height}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 회전 버튼 */}
          {isDeviceMode && (
            <Button variant="ghost" size="icon" onClick={toggleOrientation} title={isLandscape ? 'Portrait' : 'Landscape'}>
              <RotateCw className="w-4 h-4" />
            </Button>
          )}

          {/* 줌 컨트롤 */}
          {isDeviceMode && (
            <>
              <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={scale <= 0.25}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleResetZoom} className="px-2 min-w-[60px]">
                <span className="text-xs">{Math.round(scale * 100)}%</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={scale >= 2}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </>
          )}

          {/* 새로고침, 풀스크린, 외부 열기 */}
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={!hasContent}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleFullscreen} disabled={!hasContent}>
            <Maximize className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleOpenExternal} disabled={!hasContent}>
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* 컨텐츠 영역 */}
      <div ref={containerRef} className="flex-1 relative overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default EnhancedPreviewPanel;
