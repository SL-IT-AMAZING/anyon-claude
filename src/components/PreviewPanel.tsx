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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { api } from '@/lib/api';
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

// Script to inject into iframe for element selection
const SELECTOR_SCRIPT = `
(function() {
  let selectorMode = false;
  let hoveredElement = null;
  let selectedElement = null;

  const overlay = document.createElement('div');
  overlay.id = '__anyon_selector_overlay';
  overlay.style.cssText = 'position:fixed;pointer-events:none;border:2px solid #3b82f6;background:rgba(59,130,246,0.1);z-index:999999;display:none;transition:all 0.1s;';
  document.body.appendChild(overlay);

  const actionBar = document.createElement('div');
  actionBar.id = '__anyon_action_bar';
  actionBar.style.cssText = 'position:fixed;z-index:999999;display:none;background:#1f2937;border-radius:8px;padding:4px;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
  actionBar.innerHTML = '<button data-action="edit" style="padding:6px 12px;margin:2px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">수정</button><button data-action="remove" style="padding:6px 12px;margin:2px;background:#ef4444;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">삭제</button><button data-action="add" style="padding:6px 12px;margin:2px;background:#22c55e;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">추가</button>';
  document.body.appendChild(actionBar);

  function getSelector(el) {
    if (el.id) return '#' + el.id;
    let path = [];
    while (el && el.nodeType === 1) {
      let selector = el.tagName.toLowerCase();
      if (el.className && typeof el.className === 'string') {
        selector += '.' + el.className.trim().split(/\\s+/).join('.');
      }
      path.unshift(selector);
      el = el.parentElement;
      if (path.length > 3) break;
    }
    return path.join(' > ');
  }

  function updateOverlay(el) {
    if (!el) { overlay.style.display = 'none'; return; }
    const rect = el.getBoundingClientRect();
    overlay.style.display = 'block';
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
  }

  function showActionBar(el) {
    const rect = el.getBoundingClientRect();
    actionBar.style.display = 'flex';
    actionBar.style.left = Math.min(rect.left, window.innerWidth - 200) + 'px';
    actionBar.style.top = Math.max(rect.top - 40, 10) + 'px';
  }

  document.addEventListener('mousemove', (e) => {
    if (!selectorMode) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el && el !== overlay && el !== actionBar && !actionBar.contains(el)) {
      hoveredElement = el;
      updateOverlay(el);
    }
  });

  document.addEventListener('click', (e) => {
    if (!selectorMode) return;
    if (actionBar.contains(e.target)) {
      const action = e.target.dataset.action;
      if (action && selectedElement) {
        parent.postMessage({
          type: 'elementAction',
          action: action,
          element: {
            tag: selectedElement.tagName,
            id: selectedElement.id || null,
            classes: selectedElement.className || null,
            selector: getSelector(selectedElement),
            text: selectedElement.textContent?.substring(0, 100) || null,
            html: selectedElement.outerHTML?.substring(0, 500) || null,
          }
        }, '*');
      }
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el && el !== overlay && el !== actionBar) {
      selectedElement = el;
      overlay.style.borderColor = '#22c55e';
      overlay.style.background = 'rgba(34,197,94,0.1)';
      showActionBar(el);
      parent.postMessage({
        type: 'elementSelected',
        element: {
          tag: el.tagName,
          id: el.id || null,
          classes: el.className || null,
          selector: getSelector(el),
          text: el.textContent?.substring(0, 100) || null,
          html: el.outerHTML?.substring(0, 500) || null,
        }
      }, '*');
    }
  }, true);

  window.addEventListener('message', (e) => {
    if (e.data.type === 'enableSelector') {
      selectorMode = true;
      document.body.style.cursor = 'crosshair';
    } else if (e.data.type === 'disableSelector') {
      selectorMode = false;
      document.body.style.cursor = '';
      overlay.style.display = 'none';
      actionBar.style.display = 'none';
      selectedElement = null;
    }
  });
})();
`;

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
  const [_fileContent, setFileContent] = useState<string>('');
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
      const content = await api.readFileContent(filePath);
      setFileContent(content);
      // Create data URL with injected selector script
      const htmlWithScript = injectSelectorScript(content);
      const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlWithScript)}`;
      setCurrentUrl(dataUrl);
    } catch (err) {
      console.error('Failed to load HTML file:', err);
    }
  };

  const injectSelectorScript = (html: string): string => {
    const scriptTag = `<script>${SELECTOR_SCRIPT}</script>`;
    // Insert before </body> or at the end
    if (html.includes('</body>')) {
      return html.replace('</body>', `${scriptTag}</body>`);
    }
    return html + scriptTag;
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

  // Inject selector script when iframe loads (for port mode)
  const injectScriptIntoIframe = useCallback(() => {
    if (iframeRef.current && previewMode === 'port') {
      try {
        const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
        if (iframeDoc) {
          const script = iframeDoc.createElement('script');
          script.textContent = SELECTOR_SCRIPT;
          iframeDoc.body?.appendChild(script);
        }
      } catch (err) {
        // Cross-origin restriction - can't inject script
        console.log('Cannot inject script due to cross-origin restriction');
      }
    }
  }, [previewMode]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'elementSelected') {
        const element = event.data.element as SelectedElement;
        setSelectedElement(element);
        onElementSelected?.(element);
      } else if (event.data.type === 'elementAction') {
        const action = event.data.action as ElementAction;
        const element = event.data.element as SelectedElement;
        onElementAction?.(action, element);
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
    // Send message to iframe
    iframeRef.current?.contentWindow?.postMessage(
      { type: newMode ? 'enableSelector' : 'disableSelector' },
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
