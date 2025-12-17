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
  MoreVertical,
  Eye,
  Loader2,
} from 'lucide-react';
import { PanelHeader, StatusBadge } from '@/components/ui/panel-header';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { FileExplorer } from '@/components/FileExplorer';
import { injectSelectorScript } from '@/lib/previewSelector';
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
  const [urlPath] = useState('/');
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



  // 소스 모드 변경 핸들러
  const handleSourceModeChange = (mode: 'port' | 'file') => {
    if (mode === sourceMode) return;
    setSourceMode(mode);
    // 모드 변경 시 적절한 URL 설정
    if (mode === 'port') {
      // 서버 모드: 서버 URL 사용
      if (devServerProxyUrl) {
        setCurrentUrl(devServerProxyUrl + urlPath);
      }
    } else {
      // 파일 모드: 현재 파일이 있으면 유지, 없으면 초기화
      setSelectedPort(null);
      if (!currentFilePath) {
        setCurrentUrl('');
      }
    }
  };

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

    if (!filePath?.trim()) {
      console.warn('[Preview] loadHtmlFile called with empty filePath');
      return;
    }

    if (!isTauri) {
      console.warn('[Preview] Not in Tauri environment, cannot load HTML file directly');
      addAppOutput({
        type: 'info',
        message: `[preview] Tauri 앱에서만 HTML 파일 미리보기가 가능합니다: ${filePath.split(/[/\\]/).pop() || 'unknown'}`,
        timestamp: Date.now(),
        projectPath: projectPath || '',
      });
      return;
    }

    try {
      // 파일 내용 직접 읽기
      const content = await invoke<string>('read_file_content', { filePath });
      
      if (!content) {
        console.warn('[Preview] Empty content received from file:', filePath);
        addAppOutput({
          type: 'stderr',
          message: `[preview] File is empty: ${filePath.split(/[/\\]/).pop() || 'unknown'}`,
          timestamp: Date.now(),
          projectPath: projectPath || '',
        });
        return;
      }
      
      console.log('[Preview] File content loaded, length:', content.length);

      // 요소 선택기 스크립트 주입
      const injectedContent = injectSelectorScript(content);
      console.log('[Preview] Selector script injected, new length:', injectedContent.length);

      // data URL로 변환하여 iframe에서 직접 렌더링
      const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(injectedContent)}`;
      setCurrentUrl(dataUrl);

      addAppOutput({
        type: 'info',
        message: `[preview] Loading ${filePath.split(/[/\\]/).pop() || 'file'}`,
        timestamp: Date.now(),
        projectPath: projectPath || '',
      });
    } catch (err) {
      console.error('[Preview] Failed to load HTML file:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      addAppOutput({
        type: 'stderr',
        message: `[preview] Failed to load HTML file: ${errorMessage}`,
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

  // 프로젝트 열면 자동으로 프리뷰 시작
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
        const hasPackageJson = await invoke<boolean>('check_file_exists', {
          filePath: `${projectPath}/package.json`
        });

        if (hasPackageJson) {
          if (!devServerRunning) {
            setSourceMode('port');
            startDevServer();
          }
          return;
        }

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

    if (!htmlFilePath && !currentUrl) {
      autoDetectAndStart();
    }
  }, [projectPath, htmlFilePath, devServerRunning, startDevServer, currentUrl]);

  // 포트 스캔
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
      
      if (!result || !Array.isArray(result)) {
        console.warn('[Preview] Invalid port scan result:', result);
        return;
      }
      
      setPorts(result);

      if (!selectedPort && result.length > 0) {
        const alive = result.find((p) => p?.alive);
        if (alive?.port && alive?.url) {
          setSelectedPort(alive.port);
          setCurrentUrl(alive.url);
        }
      }
    } catch (err) {
      // Port scan failure is not critical, suppress error in console
      console.debug('[Preview] Port scan failed:', err);
    }
  };

  const handleBack = () => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'navigate', payload: { direction: 'backward' } }, '*');
  };

  const handleForward = () => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'navigate', payload: { direction: 'forward' } }, '*');
  };

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

  const handleFullscreen = () => {
    iframeRef.current?.requestFullscreen();
  };

  const handleOpenExternal = async () => {
    if (sourceMode === 'file' && currentFilePath) {
      await open(currentFilePath);
    } else if (currentUrl && !currentUrl.startsWith('data:')) {
      await open(currentUrl);
    }
  };

  const handleToggleSelector = () => {
    console.log('[Preview] Toggle selector clicked:', {
      isSelectorActive,
      isComponentSelectorInitialized,
      hasIframeRef: !!iframeRef.current,
      currentUrl
    });

    if (!iframeRef.current) {
      console.warn('[Preview] No iframe ref available');
      return;
    }
    
    if (!iframeRef.current.contentWindow) {
      console.warn('[Preview] No iframe contentWindow available');
      return;
    }

    try {
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
    } catch (err) {
      console.error('[Preview] Failed to toggle selector:', err);
    }
  };

  const toggleOrientation = () => setIsLandscape(!isLandscape);
  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.25));
  const handleResetZoom = () => setScale(1);

  const getDeviceDimensions = () => {
    const width = isLandscape ? selectedDevice.height : selectedDevice.width;
    const height = isLandscape ? selectedDevice.width : selectedDevice.height;
    return { width, height };
  };

  const handleAIFix = useCallback((prompt: string) => {
    onAIFix?.(prompt);
    clearPreviewError();
  }, [onAIFix, clearPreviewError]);

  const { width, height } = getDeviceDimensions();
  const hasContent = currentUrl || (sourceMode === 'port' && ports.some((p) => p.alive));
  const problemCount = problemReport?.problems?.length || 0;

  // 서버 상태 텍스트
  const getServerStatusText = () => {
    if (isLoading) return '시작 중...';
    if (devServerRunning && devServerPort) return `localhost:${devServerPort}`;
    if (sourceMode === 'file' && currentFilePath) return currentFilePath.split(/[/\\]/).pop() || '';
    return '연결 안됨';
  };

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
        return (
          <FileExplorer rootPath={projectPath} />
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
        <div className="relative flex items-center justify-center h-full">
          <ErrorBanner
            error={previewError}
            onDismiss={clearPreviewError}
            onAIFix={handleAIFix}
          />

          <div className="text-center max-w-sm px-6">
            {/* 아이콘 컨테이너 */}
            <div className={cn(
              "w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center",
              isLoading 
                ? "bg-amber-100 dark:bg-amber-900/30" 
                : previewError
                  ? "bg-red-100 dark:bg-red-900/30"
                  : "bg-muted"
            )}>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : previewError ? (
                <Monitor className="w-8 h-8 text-red-500" />
              ) : (
                <Monitor className="w-8 h-8 text-muted-foreground" />
              )}
            </div>

            {/* 제목 */}
            <h3 className="text-base font-medium mb-2">
              {sourceMode === 'port'
                ? isLoading
                  ? '개발 서버 시작 중...'
                  : devServerRunning
                    ? '연결 중...'
                    : previewError
                      ? '연결 실패'
                      : '프리뷰 준비'
                : 'HTML 파일 선택'}
            </h3>

            {/* 설명 */}
            <p className="text-sm text-muted-foreground mb-5">
              {sourceMode === 'port'
                ? isLoading
                  ? packageManager 
                    ? `${packageManager}로 서버를 시작하고 있습니다...`
                    : '패키지 매니저를 감지하고 있습니다...'
                  : devServerRunning
                    ? '개발 서버에 연결하고 있습니다...'
                    : previewError
                      ? '개발 서버 시작에 실패했습니다. 다시 시도해주세요.'
                      : '개발 서버를 시작하면 앱을 미리 볼 수 있습니다.'
                : '프로젝트의 HTML 파일을 선택하여 미리보기를 시작하세요.'}
            </p>

            {/* CTA 버튼 */}
            {sourceMode === 'port' && !devServerRunning && !isLoading && (
              <Button
                onClick={startDevServer}
                disabled={!projectPath}
                size="lg"
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                {previewError ? '다시 시도' : '서버 시작'}
              </Button>
            )}

            {sourceMode === 'file' && !isLoading && (
              <Button
                onClick={async () => {
                  if (!isTauri) return;
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
                size="lg"
                className="gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                파일 선택
              </Button>
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
              <span className="ml-2 text-xs">{width}x{height}</span>
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
    <div className="h-full flex flex-col bg-background">
      {/* 통일 헤더 */}
      <PanelHeader
        icon={<Eye className="w-4 h-4" />}
        title="프리뷰"
        subtitle={getServerStatusText()}
        badge={
          isLoading ? (
            <StatusBadge variant="warning" pulse>시작중</StatusBadge>
          ) : devServerRunning ? (
            <StatusBadge variant="success">연결됨</StatusBadge>
          ) : previewError ? (
            <StatusBadge variant="error">에러</StatusBadge>
          ) : (
            <StatusBadge variant="muted">오프라인</StatusBadge>
          )
        }
        actions={
          <div className="flex items-center gap-1">
            {/* 소스 모드 토글 */}
            <div className="flex items-center gap-0.5 border rounded-md p-0.5 bg-background mr-1">
              <button
                onClick={() => handleSourceModeChange('port')}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-colors",
                  sourceMode === 'port'
                    ? "bg-muted font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Server className="w-3 h-3 inline mr-1" />
                서버
              </button>
              <button
                onClick={() => handleSourceModeChange('file')}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-colors",
                  sourceMode === 'file'
                    ? "bg-muted font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileCode className="w-3 h-3 inline mr-1" />
                파일
              </button>
            </div>

            {/* 서버 시작/중지 버튼 */}
            {sourceMode === 'port' && (
              devServerRunning ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={stopDevServer}
                  disabled={isLoading}
                  className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Square className="w-3 h-3 mr-1" />
                  중지
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startDevServer}
                  disabled={isLoading || !projectPath}
                  className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <Play className="w-3 h-3 mr-1" />
                  시작
                </Button>
              )
            )}
          </div>
        }
      />

      {/* 컨텐츠 영역 */}
      <div ref={containerRef} className="flex-1 relative overflow-auto">
        {renderContent()}
      </div>

      {/* 하단 툴바 - 단순화됨 */}
      <div className="flex-shrink-0 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between px-3 py-1.5">
          {/* 왼쪽: 탭 (Preview/Problems/Console) */}
          <ActionHeader
            problemCount={problemCount}
            onCleanRestart={() => console.log('Clean restart')}
            onClearCache={() => console.log('Clear cache')}
          />

          {/* 오른쪽: 핵심 액션만 */}
          <div className="flex items-center gap-0.5">
            {/* 새로고침 */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh} 
              disabled={!hasContent} 
              className="h-7 w-7"
              title="새로고침"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>

            {/* 요소 선택기 */}
            <Button
              variant={isSelectorActive ? 'default' : 'ghost'}
              size="icon"
              onClick={handleToggleSelector}
              disabled={!hasContent}
              title="요소 선택 (⌘+Shift+C)"
              className={cn("h-7 w-7", isSelectorActive && 'bg-purple-500 hover:bg-purple-600')}
            >
              <MousePointer2 className="w-3.5 h-3.5" />
            </Button>

            {/* 디바이스 모드 */}
            <Button
              variant={isDeviceMode ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setIsDeviceMode(!isDeviceMode)}
              disabled={!hasContent}
              className="h-7 w-7"
              title="디바이스 모드"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </Button>

            <div className="h-4 w-px bg-border mx-1" />

            {/* 더보기 드롭다운 - 고급 옵션 통합 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {/* 네비게이션 */}
                <DropdownMenuItem onClick={handleBack} disabled={!hasContent}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  뒤로 가기
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleForward} disabled={!hasContent}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  앞으로 가기
                </DropdownMenuItem>
                
                <div className="h-px bg-border my-1" />
                
                {/* 디바이스 선택 (디바이스 모드일 때만) */}
                {isDeviceMode && (
                  <>
                    {DEVICE_SIZES.slice(0, 4).map((device) => (
                      <DropdownMenuItem
                        key={device.name}
                        onClick={() => setSelectedDevice(device)}
                        className={selectedDevice.name === device.name ? 'bg-muted' : ''}
                      >
                        {DEVICE_ICONS[device.frameType]}
                        <span className="ml-2 flex-1">{device.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {device.width}×{device.height}
                        </span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem onClick={toggleOrientation}>
                      <RotateCw className="w-4 h-4 mr-2" />
                      화면 회전
                    </DropdownMenuItem>
                    <div className="h-px bg-border my-1" />
                  </>
                )}

                {/* 줌 컨트롤 (디바이스 모드일 때만) */}
                {isDeviceMode && (
                  <>
                    <DropdownMenuItem onClick={handleZoomIn} disabled={scale >= 2}>
                      <ZoomIn className="w-4 h-4 mr-2" />
                      확대 ({Math.round(scale * 100)}%)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleZoomOut} disabled={scale <= 0.25}>
                      <ZoomOut className="w-4 h-4 mr-2" />
                      축소
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleResetZoom}>
                      <Monitor className="w-4 h-4 mr-2" />
                      100%로 초기화
                    </DropdownMenuItem>
                    <div className="h-px bg-border my-1" />
                  </>
                )}

                {/* 파일 열기 (파일 모드일 때만) */}
                {sourceMode === 'file' && (
                  <DropdownMenuItem
                    onClick={async () => {
                      if (!isTauri) return;
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
                    <FolderOpen className="w-4 h-4 mr-2" />
                    HTML 파일 열기
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem onClick={handleOpenExternal} disabled={!hasContent}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  외부 브라우저에서 열기
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleFullscreen} disabled={!hasContent}>
                  <Maximize className="w-4 h-4 mr-2" />
                  전체 화면
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPreviewPanel;
