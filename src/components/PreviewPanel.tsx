import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

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

export const PreviewPanel: React.FC = () => {
  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState<number | null>(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const [urlPath, setUrlPath] = useState('/');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 디바이스 모드 상태
  const [isDeviceMode, setIsDeviceMode] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceSize>(DEVICE_SIZES[0]);
  const [isLandscape, setIsLandscape] = useState(false);
  const [scale, setScale] = useState(1);
  const showDeviceFrame = true;

  // 포트 스캔
  useEffect(() => {
    scanPorts();
    const interval = setInterval(scanPorts, 10000);
    return () => clearInterval(interval);
  }, []);

  const scanPorts = async () => {
    try {
      const result = await invoke<PortInfo[]>('scan_ports');
      setPorts(result);

      if (!selectedPort && result.length > 0) {
        const alive = result.find((p: PortInfo) => p.alive);
        if (alive) {
          setSelectedPort(alive.port);
          setCurrentUrl(alive.url);
        }
      }
    } catch (err) {
      console.error('Port scan failed:', err);
    }
  };

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
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleFullscreen = () => {
    iframeRef.current?.requestFullscreen();
  };

  const handleOpenExternal = async () => {
    if (currentUrl) {
      try {
        await open(currentUrl);
      } catch (err) {
        console.error('Failed to open external browser:', err);
      }
    }
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

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 툴바 */}
      <div className="flex items-center gap-2 p-2 border-b">
        {/* 포트 선택 */}
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

        {/* URL 입력 */}
        <div className="flex-1 flex items-center gap-1 border rounded-md px-2 bg-background">
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

        {/* 디바이스 선택 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={isDeviceMode ? "default" : "ghost"}
              size="icon"
              disabled={!currentUrl}
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

        {/* 회전 버튼 */}
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

        {/* 줌 컨트롤 */}
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

        {/* 새로고침 */}
        <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={!currentUrl}>
          <RefreshCw className="w-4 h-4" />
        </Button>

        {/* 전체화면 */}
        <Button variant="ghost" size="icon" onClick={handleFullscreen} disabled={!currentUrl}>
          <Maximize className="w-4 h-4" />
        </Button>

        {/* 외부 열기 */}
        <Button variant="ghost" size="icon" onClick={handleOpenExternal} disabled={!currentUrl}>
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>

      {/* Preview Content */}
      <div ref={containerRef} className="flex-1 relative overflow-auto">
        {currentUrl ? (
          isDeviceMode && showDeviceFrame ? (
            /* 디바이스 프레임 모드 */
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
                {/* 디바이스 이름 */}
                <div className="absolute -top-8 left-0 right-0 text-center text-sm text-muted-foreground">
                  {selectedDevice.name} {isLandscape ? '(Landscape)' : '(Portrait)'}
                  <span className="ml-2 text-xs">
                    {width}×{height}
                  </span>
                </div>

                {/* 디바이스 프레임 */}
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
                  />
                </div>
              </div>
            </div>
          ) : (
            /* 일반 모드 */
            <iframe
              ref={iframeRef}
              src={currentUrl}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          )
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center space-y-2">
              <Monitor className="w-12 h-12 mx-auto opacity-50" />
              <p className="text-sm">
                {ports.length === 0
                  ? 'No dev server detected'
                  : 'Select a port to preview'}
              </p>
              <Button onClick={scanPorts} variant="outline" size="sm">
                Scan Ports
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
