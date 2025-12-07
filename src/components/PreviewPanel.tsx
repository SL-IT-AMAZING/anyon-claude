import React, { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-shell';
import { ELEMENT_SELECTOR_SCRIPT } from '@/lib/previewSelector';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
// api import removed - now using convertFileSrc directly
import { cn } from '@/lib/utils';

interface PortInfo {
  port: number;
  url: string;
  alive: boolean;
}

interface DeviceSize {
  name: string;
  width: number;
  height: number;
  icon: React.ReactNode;
  frameType: 'mobile' | 'tablet' | 'laptop' | 'desktop';
}

export interface SelectedElement {
  tag: string;
  id: string | null;
  classes: string | null;
  selector: string;
  text: string | null;
  html?: string;
}

export type ElementAction = 'edit' | 'remove' | 'add';

interface PreviewPanelProps {
  /** HTML file path for file preview mode */
  htmlFilePath?: string;
  /** Project root path for resolving relative paths in HTML */
  projectPath?: string;
  /** Callback when element is selected in selector mode */
  onElementSelected?: (element: SelectedElement | null) => void;
  /** Callback when element action is triggered */
  onElementAction?: (action: ElementAction, element: SelectedElement) => void;
}

const DEVICE_SIZES: DeviceSize[] = [
  { name: 'iPhone SE', width: 375, height: 667, icon: <Smartphone className="w-4 h-4" />, frameType: 'mobile' },
  { name: 'iPhone 12/13', width: 390, height: 844, icon: <Smartphone className="w-4 h-4" />, frameType: 'mobile' },
  { name: 'iPhone Pro Max', width: 428, height: 926, icon: <Smartphone className="w-4 h-4" />, frameType: 'mobile' },
  { name: 'iPad Mini', width: 768, height: 1024, icon: <Tablet className="w-4 h-4" />, frameType: 'tablet' },
  { name: 'iPad Air', width: 820, height: 1180, icon: <Tablet className="w-4 h-4" />, frameType: 'tablet' },
  { name: 'iPad Pro 11"', width: 834, height: 1194, icon: <Tablet className="w-4 h-4" />, frameType: 'tablet' },
  { name: 'Laptop', width: 1366, height: 768, icon: <Laptop className="w-4 h-4" />, frameType: 'laptop' },
  { name: 'Desktop', width: 1920, height: 1080, icon: <Monitor className="w-4 h-4" />, frameType: 'desktop' },
];

// Using the enhanced selector script from previewSelector.ts
// ELEMENT_SELECTOR_SCRIPT is imported at the top

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  htmlFilePath,
  projectPath: _projectPath,
  onElementSelected,
  onElementAction,
}) => {
  // Preview mode: 'port' for dev server, 'file' for HTML file
  const [previewMode, setPreviewMode] = useState<'port' | 'file'>(htmlFilePath ? 'file' : 'port');

  // Port mode state
  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState<number | null>(null);
  const [urlPath, setUrlPath] = useState('/');

  // File mode state
  const [currentFilePath, setCurrentFilePath] = useState<string>(htmlFilePath || '');

  // Common state
  const [currentUrl, setCurrentUrl] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Device mode state
  const [isDeviceMode, setIsDeviceMode] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceSize>(DEVICE_SIZES[0]);
  const [isLandscape, setIsLandscape] = useState(false);
  const [scale, setScale] = useState(1);

  // Element selector state
  const [isSelectorMode, setIsSelectorMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);

  // Load HTML file content
  useEffect(() => {
    if (htmlFilePath && htmlFilePath !== currentFilePath) {
      setCurrentFilePath(htmlFilePath);
      setPreviewMode('file');
      loadHtmlFile(htmlFilePath);
    }
  }, [htmlFilePath]);

  const loadHtmlFile = async (filePath: string) => {
    try {
      // Get project path from the file path (use parent directory for simple HTML files)
      // For proper project structure, the projectPath prop should be used
      const projectPath = _projectPath || filePath.substring(0, filePath.lastIndexOf('/')) || filePath.substring(0, filePath.lastIndexOf('\\'));

      console.log('[PreviewPanel] Starting file preview server for:', projectPath);

      // Start the preview server for this project
      await invoke('start_file_preview_server', { projectPath });

      // Get the preview URL for this file
      const previewUrl = await invoke<string>('get_file_preview_url', {
        filePath,
        projectPath,
      });

      console.log('[PreviewPanel] Preview URL:', previewUrl);
      setCurrentUrl(previewUrl);
    } catch (err) {
      console.error('Failed to load HTML file:', err);
      // Fallback: try direct file URL (might not work for relative resources)
      setCurrentUrl(`file://${filePath}`);
    }
  };

  // Port scanning
  useEffect(() => {
    if (previewMode === 'port') {
      scanPorts();
      const interval = setInterval(scanPorts, 10000);
      return () => clearInterval(interval);
    }
  }, [previewMode]);

  const scanPorts = async () => {
    try {
      const result = await invoke<PortInfo[]>('scan_ports');
      setPorts(result);

      if (!selectedPort && result.length > 0) {
        const alive = result.find((p: PortInfo) => p.alive);
        if (alive) {
          setSelectedPort(alive.port);
          const url = alive.url;
          setCurrentUrl(url);
          // Inject selector script for port mode too
          injectScriptIntoIframe();
        }
      }
    } catch (err) {
      console.error('Port scan failed:', err);
    }
  };

  // Inject selector script when iframe loads
  const injectScriptIntoIframe = useCallback(() => {
    if (iframeRef.current) {
      try {
        const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
        if (iframeDoc) {
          // Remove any existing selector script
          const existingScript = iframeDoc.getElementById('__anyon_selector_script');
          if (existingScript) existingScript.remove();

          const script = iframeDoc.createElement('script');
          script.id = '__anyon_selector_script';
          script.textContent = ELEMENT_SELECTOR_SCRIPT;
          iframeDoc.body?.appendChild(script);
          console.log('[PreviewPanel] Selector script injected');
        }
      } catch (err) {
        // Cross-origin restriction - can't inject script
        console.log('[PreviewPanel] Cannot inject script due to cross-origin restriction');
      }
    }
  }, []);

  // Listen for messages from iframe (using new anyon-* message types)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, element } = event.data || {};

      switch (type) {
        case 'anyon-selector-ready':
          console.log('[PreviewPanel] Selector script ready');
          break;
        case 'anyon-element-hover':
          // Optional: could show hover info
          break;
        case 'anyon-element-selected':
          if (element) {
            setSelectedElement(element as SelectedElement);
            onElementSelected?.(element as SelectedElement);
          }
          break;
        case 'anyon-selector-activated':
          console.log('[PreviewPanel] Selector activated');
          break;
        case 'anyon-selector-deactivated':
          console.log('[PreviewPanel] Selector deactivated');
          break;
        // Legacy support for old message types
        case 'elementSelected':
          setSelectedElement(element as SelectedElement);
          onElementSelected?.(element as SelectedElement);
          break;
        case 'elementAction':
          onElementAction?.(event.data.action as ElementAction, element as SelectedElement);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onElementSelected, onElementAction]);

  const handlePortChange = (port: number) => {
    setSelectedPort(port);
    const portInfo = ports.find((p: PortInfo) => p.port === port);
    if (portInfo) {
      setCurrentUrl(portInfo.url + urlPath);
    }
  };

  const handleNavigate = () => {
    if (selectedPort) {
      setCurrentUrl(`http://localhost:${selectedPort}${urlPath}`);
    }
  };

  const handleRefresh = () => {
    if (previewMode === 'file' && currentFilePath) {
      loadHtmlFile(currentFilePath);
    } else if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleFullscreen = () => {
    iframeRef.current?.requestFullscreen();
  };

  const handleOpenExternal = async () => {
    if (previewMode === 'file' && currentFilePath) {
      try {
        await open(currentFilePath);
      } catch (err) {
        console.error('Failed to open file:', err);
      }
    } else if (currentUrl && !currentUrl.startsWith('data:')) {
      try {
        await open(currentUrl);
      } catch (err) {
        console.error('Failed to open external browser:', err);
      }
    }
  };

  const toggleSelectorMode = () => {
    const newMode = !isSelectorMode;
    setIsSelectorMode(newMode);
    if (!newMode) {
      setSelectedElement(null);
      onElementSelected?.(null);
    }
    // Send message to iframe using new anyon-* message types
    iframeRef.current?.contentWindow?.postMessage(
      { type: newMode ? 'anyon-activate-selector' : 'anyon-deactivate-selector' },
      '*'
    );
  };

  const toggleOrientation = () => {
    setIsLandscape(!isLandscape);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.25));
  };

  const handleResetZoom = () => {
    setScale(1);
  };

  const getDeviceDimensions = () => {
    const width = isLandscape ? selectedDevice.height : selectedDevice.width;
    const height = isLandscape ? selectedDevice.width : selectedDevice.height;
    return { width, height };
  };

  const getFramePadding = () => {
    const isMobile = selectedDevice.frameType === 'mobile';
    if (isLandscape) {
      return isMobile ? '40px 60px' : '30px 50px';
    }
    return isMobile ? '40px 20px' : '50px 30px';
  };

  const getFrameColor = () => {
    const isDark = document.documentElement.classList.contains('dark');
    return isDark ? '#555' : '#111';
  };

  const getNotchStyles = () => {
    if (isLandscape) {
      return {
        top: '50%',
        left: '30px',
        transform: 'translateY(-50%)',
        width: '8px',
        height: selectedDevice.frameType === 'mobile' ? '60px' : '80px',
      };
    }
    return {
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: selectedDevice.frameType === 'mobile' ? '60px' : '80px',
      height: '8px',
    };
  };

  const getHomeButtonStyles = () => {
    if (isLandscape) {
      return {
        bottom: '50%',
        right: '30px',
        transform: 'translateY(50%)',
        width: '4px',
        height: '40px',
      };
    }
    return {
      bottom: '15px',
      right: '50%',
      transform: 'translateX(50%)',
      width: '40px',
      height: '4px',
    };
  };

  const { width, height } = getDeviceDimensions();
  const hasContent = currentUrl || (previewMode === 'port' && ports.some(p => p.alive));

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b flex-wrap">
        {/* Preview Mode Toggle */}
        <div className="flex items-center border rounded-md">
          <Button
            variant={previewMode === 'port' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-r-none"
            onClick={() => setPreviewMode('port')}
          >
            <Server className="w-4 h-4 mr-1" />
            서버
          </Button>
          <Button
            variant={previewMode === 'file' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-l-none"
            onClick={() => setPreviewMode('file')}
          >
            <FileCode className="w-4 h-4 mr-1" />
            파일
          </Button>
        </div>

        {previewMode === 'port' ? (
          <>
            {/* Port Selection */}
            <select
              value={selectedPort || ''}
              onChange={(e) => handlePortChange(Number(e.target.value))}
              className="px-3 py-1.5 rounded-md border bg-background text-sm"
              disabled={ports.length === 0}
            >
              <option value="" disabled>Select Port</option>
              {ports.map(p => (
                <option key={p.port} value={p.port}>
                  {p.alive ? '🟢' : '🔴'} Port {p.port}
                </option>
              ))}
            </select>

            {/* URL Input */}
            <div className="flex-1 flex items-center gap-1 border rounded-md px-2 bg-background min-w-[120px]">
              <span className="text-xs text-muted-foreground">
                localhost:{selectedPort || '----'}
              </span>
              <input
                type="text"
                value={urlPath}
                onChange={(e) => setUrlPath(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNavigate()}
                placeholder="/path"
                className="flex-1 px-2 py-1 text-sm bg-transparent outline-none"
                disabled={!selectedPort}
              />
            </div>
          </>
        ) : (
          /* File Path Display */
          <div className="flex-1 flex items-center gap-1 border rounded-md px-2 bg-background min-w-[120px]">
            <FileCode className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm truncate">
              {currentFilePath ? currentFilePath.split(/[/\\]/).pop() : 'No file selected'}
            </span>
          </div>
        )}

        {/* Element Selector Toggle */}
        <Button
          variant={isSelectorMode ? 'default' : 'ghost'}
          size="icon"
          onClick={toggleSelectorMode}
          disabled={!hasContent}
          title={isSelectorMode ? '선택 모드 끄기' : '요소 선택 모드'}
          className={cn(isSelectorMode && 'bg-blue-500 hover:bg-blue-600')}
        >
          <MousePointer2 className="w-4 h-4" />
        </Button>

        {/* Device Selection */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={isDeviceMode ? 'default' : 'ghost'}
              size="icon"
              disabled={!hasContent}
            >
              {selectedDevice.icon}
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
                    className={selectedDevice.name === device.name ? 'bg-accent' : ''}
                  >
                    <span className="mr-2">{device.icon}</span>
                    <span className="flex-1">{device.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {device.width}×{device.height}
                    </span>
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Rotation Button */}
        {isDeviceMode && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleOrientation}
            title={isLandscape ? 'Portrait' : 'Landscape'}
          >
            <RotateCw className="w-4 h-4" />
          </Button>
        )}

        {/* Zoom Controls */}
        {isDeviceMode && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              disabled={scale <= 0.25}
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetZoom}
              className="px-2 min-w-[60px]"
              title="Reset Zoom"
            >
              <span className="text-xs">{Math.round(scale * 100)}%</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              disabled={scale >= 2}
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </>
        )}

        {/* Refresh */}
        <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={!hasContent}>
          <RefreshCw className="w-4 h-4" />
        </Button>

        {/* Fullscreen */}
        <Button variant="ghost" size="icon" onClick={handleFullscreen} disabled={!hasContent}>
          <Maximize className="w-4 h-4" />
        </Button>

        {/* Open External */}
        <Button variant="ghost" size="icon" onClick={handleOpenExternal} disabled={!hasContent || (previewMode === 'file' && currentUrl.startsWith('data:'))}>
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>

      {/* Selected Element Info */}
      {isSelectorMode && selectedElement && (
        <div className="px-3 py-2 border-b bg-blue-50 dark:bg-blue-900/20 text-sm">
          <span className="font-medium text-blue-600 dark:text-blue-400">선택됨: </span>
          <code className="bg-background px-1.5 py-0.5 rounded text-xs">
            {selectedElement.selector}
          </code>
        </div>
      )}

      {/* Preview Content */}
      <div ref={containerRef} className="flex-1 relative overflow-auto">
        {currentUrl ? (
          isDeviceMode ? (
            /* Device Frame Mode */
            <div
              className="flex items-center justify-center h-full p-8"
              style={{ background: 'var(--muted)' }}
            >
              <div
                className="relative"
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'center',
                  transition: 'transform 0.2s ease-out',
                }}
              >
                {/* Device Name */}
                <div className="absolute -top-8 left-0 right-0 text-center text-sm text-muted-foreground">
                  {selectedDevice.name} {isLandscape ? '(Landscape)' : '(Portrait)'}
                  <span className="ml-2 text-xs">
                    {width}×{height}
                  </span>
                </div>

                {/* Device Frame */}
                <div
                  className="relative shadow-2xl"
                  style={{
                    borderRadius: selectedDevice.frameType === 'mobile' ? '36px' : '20px',
                    background: getFrameColor(),
                    padding: getFramePadding(),
                  }}
                >
                  {/* Notch */}
                  <div
                    className="absolute bg-gray-900 rounded"
                    style={getNotchStyles()}
                  />

                  {/* Home Button */}
                  <div
                    className="absolute bg-gray-900 rounded-full"
                    style={getHomeButtonStyles()}
                  />

                  {/* iframe */}
                  <iframe
                    ref={iframeRef}
                    src={currentUrl}
                    className="border-0 bg-white"
                    style={{
                      width: `${width}px`,
                      height: `${height}px`,
                      display: 'block',
                    }}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    onLoad={injectScriptIntoIframe}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Normal Mode */
            <iframe
              ref={iframeRef}
              src={currentUrl}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              onLoad={injectScriptIntoIframe}
            />
          )
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center space-y-2">
              <Monitor className="w-12 h-12 mx-auto opacity-50" />
              <p className="text-sm">
                {previewMode === 'port'
                  ? (ports.length === 0 ? 'No dev server detected' : 'Select a port to preview')
                  : 'Select an HTML file to preview'}
              </p>
              {previewMode === 'port' && (
                <Button onClick={scanPorts} variant="outline" size="sm">
                  Scan Ports
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
