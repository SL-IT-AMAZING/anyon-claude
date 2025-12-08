# 유지보수 워크스페이스 프리뷰 탭 구현 계획서 (완전판)

## 📋 개요

new-anyon 프로젝트의 프리뷰 기능을 **Tauri 환경으로 포팅**하여 유지보수 워크스페이스에 통합

### 핵심 차이점
```
new-anyon (Electron)          →  anyon-claude (Tauri)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
window.electronAPI.preview    →  invoke('preview_*')
BrowserView (네이티브)         →  iframe (웹)
Electron IPC                   →  Tauri commands
```

## 🎯 구현할 기능 (new-anyon 기준)

### ✅ Phase 1 (필수)
- [x] 포트 자동 스캔 (3000, 5173, 8080 등)
- [x] 포트 드롭다운 선택
- [x] URL 입력 및 네비게이션
- [x] 새로고침 버튼
- [x] 전체화면 버튼
- [x] 외부 브라우저에서 열기
- [x] iframe 프리뷰

### 🔄 Phase 2 (선택)
- [ ] 스크린샷 캡처 (ScreenshotSelector)
- [ ] 디바이스 프레임 (모바일/태블릿/데스크톱)
- [ ] 반응형 리사이징
- [ ] Inspector 모드

## 📂 파일 맵핑 (new-anyon → anyon-claude)

### 복사할 파일들

| new-anyon | anyon-claude | 변경 사항 |
|-----------|--------------|----------|
| `app/components/workbench/PortDropdown.tsx` | `src/components/preview/PortDropdown.tsx` | 스타일만 조정 |
| `app/components/workbench/Preview.tsx` (105-761줄) | `src/components/preview/PreviewPanel.tsx` | Electron → Tauri 변환 |
| `app/lib/stores/previews.electron.ts` | `src/stores/previewStore.ts` | Zustand로 재작성 |
| `electron/main/services/preview.ts` (161-213줄) | `src-tauri/src/commands/preview.rs` | Rust로 포팅 |

### 새로 만들 파일들

| 파일 | 역할 |
|------|------|
| `src/components/preview/PreviewToolbar.tsx` | 툴바 UI (새로고침, 전체화면 등) |
| `src/components/preview/PreviewFrame.tsx` | iframe wrapper |
| `src/types/preview.ts` | TypeScript 타입 정의 |

## 🛠️ 단계별 구현 계획

---

## Step 1: 타입 정의 및 Store 생성 (30분)

### 1.1 타입 정의
**새 파일**: `src/types/preview.ts`

```typescript
export interface PreviewPort {
  port: number;
  url: string;
  alive: boolean;
}

export interface PreviewState {
  // 포트 목록
  ports: PreviewPort[];
  // 선택된 포트
  selectedPort: number | null;
  // 현재 URL
  currentUrl: string;
  // 로딩 상태
  isScanning: boolean;
  // 에러
  error: string | null;
}
```

### 1.2 Zustand Store 생성
**새 파일**: `src/stores/previewStore.ts`

```typescript
import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';
import type { PreviewPort, PreviewState } from '@/types/preview';

interface PreviewStore extends PreviewState {
  // Actions
  scanPorts: () => Promise<void>;
  setSelectedPort: (port: number) => void;
  setCurrentUrl: (url: string) => void;
  refreshPreview: () => void;
  startAutoScan: () => void;
  stopAutoScan: () => void;
}

let scanInterval: NodeJS.Timeout | null = null;

export const usePreviewStore = create<PreviewStore>((set, get) => ({
  // Initial state
  ports: [],
  selectedPort: null,
  currentUrl: '',
  isScanning: false,
  error: null,

  // Scan ports
  scanPorts: async () => {
    set({ isScanning: true, error: null });
    try {
      const ports = await invoke<PreviewPort[]>('scan_preview_ports');
      set({ ports, isScanning: false });

      // Auto-select first alive port
      const state = get();
      if (!state.selectedPort && ports.length > 0) {
        const alivePort = ports.find(p => p.alive);
        if (alivePort) {
          state.setSelectedPort(alivePort.port);
        }
      }
    } catch (error) {
      console.error('Port scan failed:', error);
      set({ error: String(error), isScanning: false });
    }
  },

  // Set selected port
  setSelectedPort: (port: number) => {
    const { ports } = get();
    const portInfo = ports.find(p => p.port === port);
    if (portInfo) {
      set({
        selectedPort: port,
        currentUrl: portInfo.url,
      });
    }
  },

  // Set current URL
  setCurrentUrl: (url: string) => {
    set({ currentUrl: url });
  },

  // Refresh preview
  refreshPreview: () => {
    const { currentUrl } = get();
    // Trigger re-render by updating timestamp
    set({ currentUrl: currentUrl + '?t=' + Date.now() });
  },

  // Start auto-scan (every 10s)
  startAutoScan: () => {
    const { scanPorts } = get();
    if (!scanInterval) {
      scanPorts(); // Initial scan
      scanInterval = setInterval(scanPorts, 10000);
    }
  },

  // Stop auto-scan
  stopAutoScan: () => {
    if (scanInterval) {
      clearInterval(scanInterval);
      scanInterval = null;
    }
  },
}));
```

**체크포인트 1**:
- [ ] `src/types/preview.ts` 생성
- [ ] `src/stores/previewStore.ts` 생성
- [ ] TypeScript 에러 없음 확인

---

## Step 2: Rust 백엔드 구현 (1시간)

### 2.1 Preview Commands
**새 파일**: `src-tauri/src/commands/preview.rs`

```rust
use std::net::TcpStream;
use std::time::Duration;
use serde::{Deserialize, Serialize};

/// Port information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreviewPort {
    pub port: u16,
    pub url: String,
    pub alive: bool,
}

/// Scan common dev server ports
#[tauri::command]
pub async fn scan_preview_ports() -> Result<Vec<PreviewPort>, String> {
    // Common dev server ports (from new-anyon)
    let ports: Vec<u16> = vec![
        3000, 3001, 3002, // React, Next.js
        5173, 5174, 5175, // Vite
        8080, 8000, 8888, // Generic servers
        4200, 4321,       // Angular, Astro
        5000, 5001,       // Flask, etc.
    ];

    let mut results = Vec::new();

    // Check each port in parallel
    for port in ports {
        let alive = check_port_available(port).await;
        results.push(PreviewPort {
            port,
            url: format!("http://localhost:{}", port),
            alive,
        });
    }

    // Sort by port number
    results.sort_by_key(|p| p.port);

    Ok(results)
}

/// Check if a specific port is available
#[tauri::command]
pub async fn check_preview_port(port: u16) -> Result<bool, String> {
    Ok(check_port_available(port).await)
}

/// Internal helper to check port
async fn check_port_available(port: u16) -> bool {
    // Use tokio for async TCP check
    match tokio::time::timeout(
        Duration::from_millis(300),
        tokio::net::TcpStream::connect(format!("127.0.0.1:{}", port))
    ).await {
        Ok(Ok(_)) => true,   // Connected successfully
        Ok(Err(_)) => false, // Connection refused
        Err(_) => false,     // Timeout
    }
}

// Fallback sync version if tokio is not available
fn check_port_sync(port: u16) -> bool {
    TcpStream::connect_timeout(
        &format!("127.0.0.1:{}", port).parse().unwrap(),
        Duration::from_millis(300)
    ).is_ok()
}
```

### 2.2 Commands 모듈 등록
**새 파일 (필요시)**: `src-tauri/src/commands/mod.rs`

```rust
pub mod preview;
```

### 2.3 Main.rs 수정
**파일**: `src-tauri/src/main.rs`

```rust
// 상단에 추가
mod commands;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // ... 기존 핸들러들
            commands::preview::scan_preview_ports,
            commands::preview::check_preview_port,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 2.4 Cargo.toml 확인
**파일**: `src-tauri/Cargo.toml`

```toml
[dependencies]
# 필요시 추가
tokio = { version = "1", features = ["net", "time"] }
```

**체크포인트 2**:
- [ ] `src-tauri/src/commands/preview.rs` 생성
- [ ] `src-tauri/src/commands/mod.rs` 수정
- [ ] `src-tauri/src/main.rs` 수정
- [ ] `cargo build` 성공
- [ ] Tauri 앱 실행 확인

---

## Step 3: PortDropdown 컴포넌트 (30분)

**새 파일**: `src/components/preview/PortDropdown.tsx`

```typescript
import React, { useRef, useEffect } from 'react';
import { ChevronDown, Plug } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PreviewPort } from '@/types/preview';

interface PortDropdownProps {
  ports: PreviewPort[];
  selectedPort: number | null;
  onSelectPort: (port: number) => void;
}

export const PortDropdown: React.FC<PortDropdownProps> = ({
  ports,
  selectedPort,
  onSelectPort,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Sort ports by number
  const sortedPorts = [...ports].sort((a, b) => a.port - b.port);

  // Find selected port info
  const selectedPortInfo = ports.find(p => p.port === selectedPort);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md",
          "border bg-background hover:bg-muted/50",
          "transition-colors text-sm"
        )}
        disabled={ports.length === 0}
      >
        <Plug className="w-4 h-4" />
        {selectedPortInfo ? (
          <span className="font-medium">{selectedPortInfo.port}</span>
        ) : (
          <span className="text-muted-foreground">Port</span>
        )}
        <ChevronDown className={cn(
          "w-3 h-3 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={cn(
          "absolute left-0 mt-2 min-w-[140px]",
          "bg-popover border rounded-md shadow-lg",
          "animate-in fade-in-0 zoom-in-95",
          "z-50"
        )}>
          {/* Header */}
          <div className="px-3 py-2 border-b text-xs font-semibold text-muted-foreground">
            Available Ports
          </div>

          {/* Port List */}
          <div className="py-1">
            {sortedPorts.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                No ports detected
              </div>
            ) : (
              sortedPorts.map((port) => (
                <button
                  key={port.port}
                  onClick={() => {
                    onSelectPort(port.port);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm",
                    "hover:bg-muted/50 transition-colors",
                    "flex items-center gap-2",
                    selectedPort === port.port && "bg-muted"
                  )}
                >
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    port.alive ? "bg-green-500" : "bg-red-500"
                  )} />
                  <span className={cn(
                    "font-medium",
                    selectedPort === port.port && "text-primary"
                  )}>
                    {port.port}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
```

**체크포인트 3**:
- [ ] `src/components/preview/PortDropdown.tsx` 생성
- [ ] 컴포넌트 렌더링 확인
- [ ] 드롭다운 열기/닫기 동작 확인

---

## Step 4: PreviewToolbar 컴포넌트 (30분)

**새 파일**: `src/components/preview/PreviewToolbar.tsx`

```typescript
import React from 'react';
import { RefreshCw, Maximize, ExternalLink, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PortDropdown } from './PortDropdown';
import type { PreviewPort } from '@/types/preview';

interface PreviewToolbarProps {
  ports: PreviewPort[];
  selectedPort: number | null;
  urlPath: string;
  onSelectPort: (port: number) => void;
  onUrlPathChange: (path: string) => void;
  onNavigate: () => void;
  onRefresh: () => void;
  onFullscreen: () => void;
  onOpenExternal: () => void;
  disabled?: boolean;
}

export const PreviewToolbar: React.FC<PreviewToolbarProps> = ({
  ports,
  selectedPort,
  urlPath,
  onSelectPort,
  onUrlPathChange,
  onNavigate,
  onRefresh,
  onFullscreen,
  onOpenExternal,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-2 p-2 border-b bg-muted/20">
      {/* Port Selection */}
      <PortDropdown
        ports={ports}
        selectedPort={selectedPort}
        onSelectPort={onSelectPort}
      />

      {/* URL Input */}
      <div className="flex-1 flex items-center gap-1 border rounded-md px-2 bg-background">
        <span className="text-xs text-muted-foreground shrink-0">
          localhost:{selectedPort || '----'}
        </span>
        <input
          type="text"
          value={urlPath}
          onChange={(e) => onUrlPathChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onNavigate();
            }
          }}
          placeholder="/path"
          className="flex-1 px-2 py-1.5 text-sm bg-transparent outline-none"
          disabled={disabled || !selectedPort}
        />
      </div>

      {/* Action Buttons */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        disabled={disabled || !selectedPort}
        title="Refresh preview"
      >
        <RefreshCw className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onFullscreen}
        disabled={disabled || !selectedPort}
        title="Fullscreen"
      >
        <Maximize className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenExternal}
        disabled={disabled || !selectedPort}
        title="Open in browser"
      >
        <ExternalLink className="w-4 h-4" />
      </Button>
    </div>
  );
};
```

**체크포인트 4**:
- [ ] `src/components/preview/PreviewToolbar.tsx` 생성
- [ ] 버튼 렌더링 확인
- [ ] URL 입력 동작 확인

---

## Step 5: PreviewFrame 컴포넌트 (20분)

**새 파일**: `src/components/preview/PreviewFrame.tsx`

```typescript
import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { Monitor, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreviewFrameProps {
  url: string | null;
  onScan: () => void;
  emptyMessage?: string;
}

export interface PreviewFrameRef {
  reload: () => void;
  requestFullscreen: () => void;
}

export const PreviewFrame = forwardRef<PreviewFrameRef, PreviewFrameProps>(
  ({ url, onScan, emptyMessage }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      reload: () => {
        if (iframeRef.current) {
          iframeRef.current.src = iframeRef.current.src;
        }
      },
      requestFullscreen: () => {
        if (iframeRef.current) {
          iframeRef.current.requestFullscreen();
        }
      },
    }));

    if (!url) {
      return (
        <div className="flex items-center justify-center h-full bg-background text-muted-foreground">
          <div className="text-center space-y-3">
            <Monitor className="w-16 h-16 mx-auto opacity-50" />
            <div>
              <p className="text-sm font-medium mb-1">
                {emptyMessage || 'No preview available'}
              </p>
              <p className="text-xs opacity-70">
                Start your dev server and scan for ports
              </p>
            </div>
            <Button onClick={onScan} variant="outline" size="sm">
              Scan Ports
            </Button>
          </div>
        </div>
      );
    }

    return (
      <iframe
        ref={iframeRef}
        src={url}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        title="Preview"
      />
    );
  }
);

PreviewFrame.displayName = 'PreviewFrame';
```

**체크포인트 5**:
- [ ] `src/components/preview/PreviewFrame.tsx` 생성
- [ ] iframe 렌더링 확인
- [ ] 빈 상태 UI 확인

---

## Step 6: PreviewPanel 통합 (1시간)

**새 파일**: `src/components/preview/PreviewPanel.tsx`

```typescript
import React, { useEffect, useRef } from 'react';
import { usePreviewStore } from '@/stores/previewStore';
import { PreviewToolbar } from './PreviewToolbar';
import { PreviewFrame, PreviewFrameRef } from './PreviewFrame';

export const PreviewPanel: React.FC = () => {
  const frameRef = useRef<PreviewFrameRef>(null);
  const [urlPath, setUrlPath] = React.useState('/');

  const {
    ports,
    selectedPort,
    currentUrl,
    isScanning,
    scanPorts,
    setSelectedPort,
    setCurrentUrl,
    startAutoScan,
    stopAutoScan,
  } = usePreviewStore();

  // Start auto-scanning on mount
  useEffect(() => {
    startAutoScan();
    return () => {
      stopAutoScan();
    };
  }, [startAutoScan, stopAutoScan]);

  // Handle port change
  const handlePortChange = (port: number) => {
    setSelectedPort(port);
    setUrlPath('/'); // Reset path
  };

  // Handle URL navigation
  const handleNavigate = () => {
    if (selectedPort) {
      const newUrl = `http://localhost:${selectedPort}${urlPath}`;
      setCurrentUrl(newUrl);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    frameRef.current?.reload();
  };

  // Handle fullscreen
  const handleFullscreen = () => {
    frameRef.current?.requestFullscreen();
  };

  // Handle open in external browser
  const handleOpenExternal = () => {
    if (currentUrl) {
      window.open(currentUrl, '_blank');
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <PreviewToolbar
        ports={ports}
        selectedPort={selectedPort}
        urlPath={urlPath}
        onSelectPort={handlePortChange}
        onUrlPathChange={setUrlPath}
        onNavigate={handleNavigate}
        onRefresh={handleRefresh}
        onFullscreen={handleFullscreen}
        onOpenExternal={handleOpenExternal}
        disabled={isScanning}
      />

      {/* Preview Frame */}
      <div className="flex-1 relative">
        <PreviewFrame
          ref={frameRef}
          url={currentUrl || null}
          onScan={scanPorts}
          emptyMessage={
            ports.length === 0
              ? 'No dev servers detected'
              : 'Select a port to preview'
          }
        />
      </div>
    </div>
  );
};
```

**체크포인트 6**:
- [ ] `src/components/preview/PreviewPanel.tsx` 생성
- [ ] 전체 플로우 테스트
  - [ ] 컴포넌트 마운트시 자동 스캔
  - [ ] 포트 선택
  - [ ] URL 입력
  - [ ] 새로고침 버튼
  - [ ] 전체화면 버튼
  - [ ] 외부 브라우저 열기

---

## Step 7: MaintenanceWorkspace 통합 (30분)

### 7.1 Import 추가
**파일**: `src/components/MaintenanceWorkspace.tsx`

```typescript
// 상단에 추가
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Monitor } from 'lucide-react';
import { PreviewPanel } from '@/components/preview/PreviewPanel';
```

### 7.2 State 추가
```typescript
// 31줄 근처 추가
type MaintenanceTabType = 'code' | 'preview';
const [activeTab, setActiveTab] = useState<MaintenanceTabType>('code');
```

### 7.3 Right Panel 교체
**기존 코드 (123-126줄)**:
```typescript
right={
  <FileExplorer rootPath={project?.path} />
}
```

**새 코드**:
```typescript
right={
  <div className="h-full p-3">
    <div className="h-full flex flex-col rounded-lg border border-border bg-muted/30 shadow-sm overflow-hidden">
      {/* Tab Header */}
      <div className="flex-shrink-0 border-b border-border bg-muted/50 px-3 py-2">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MaintenanceTabType)}>
          <TabsList className="bg-background/50">
            <TabsTrigger value="code" className="gap-1.5">
              <Code className="w-3.5 h-3.5" />
              코드
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1.5">
              <Monitor className="w-3.5 h-3.5" />
              프리뷰
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'code' && (
          <FileExplorer rootPath={project?.path} />
        )}
        {activeTab === 'preview' && (
          <PreviewPanel />
        )}
      </div>
    </div>
  </div>
}
```

**체크포인트 7**:
- [ ] `MaintenanceWorkspace.tsx` 수정
- [ ] 탭 전환 동작 확인
- [ ] 코드 탭에서 FileExplorer 정상 표시
- [ ] 프리뷰 탭에서 PreviewPanel 정상 표시

---

## 📊 최종 파일 체크리스트

### 새로 생성한 파일
- [ ] `src/types/preview.ts`
- [ ] `src/stores/previewStore.ts`
- [ ] `src/components/preview/PortDropdown.tsx`
- [ ] `src/components/preview/PreviewToolbar.tsx`
- [ ] `src/components/preview/PreviewFrame.tsx`
- [ ] `src/components/preview/PreviewPanel.tsx`
- [ ] `src-tauri/src/commands/preview.rs`
- [ ] `src-tauri/src/commands/mod.rs` (필요시)

### 수정한 파일
- [ ] `src/components/MaintenanceWorkspace.tsx`
- [ ] `src-tauri/src/main.rs`
- [ ] `src-tauri/Cargo.toml` (필요시)

## 🧪 테스트 시나리오

### 테스트 1: 포트 스캔
```bash
# 터미널 1: Vite 서버
npm run dev  # 보통 5173

# 터미널 2: Next.js 서버
cd example-nextjs && npm run dev  # 3000

# 유지보수 워크스페이스 열기
# → 프리뷰 탭 클릭
# → 드롭다운에 3000, 5173 표시 확인
```

### 테스트 2: 프리뷰 표시
```bash
# 포트 선택
# → iframe에 해당 앱 표시 확인
# → Hot reload 동작 확인 (코드 수정시)
```

### 테스트 3: 네비게이션
```bash
# URL 입력: /about
# → Enter 키
# → 해당 페이지로 이동 확인
```

### 테스트 4: 버튼 동작
```bash
# 새로고침 버튼 → iframe 리로드 확인
# 전체화면 버튼 → 전체화면 전환 확인
# 외부 열기 버튼 → 시스템 브라우저에서 열림 확인
```

## ⏱️ 최종 예상 시간

| 단계 | 작업 | 예상 시간 | 난이도 |
|------|------|-----------|--------|
| Step 1 | 타입 & Store | 30분 | ⭐ |
| Step 2 | Rust 백엔드 | 1시간 | ⭐⭐⭐ |
| Step 3 | PortDropdown | 30분 | ⭐⭐ |
| Step 4 | PreviewToolbar | 30분 | ⭐ |
| Step 5 | PreviewFrame | 20분 | ⭐ |
| Step 6 | PreviewPanel | 1시간 | ⭐⭐ |
| Step 7 | 통합 | 30분 | ⭐⭐ |
| 테스트 | 전체 테스트 | 30분 | ⭐ |
| **총계** | | **5시간** | |

## 🎨 최종 UI 미리보기

### 코드 탭
```
┌──────────────────────────────────────────┐
│  [ 📝 코드 ] [ 🌐 프리뷰 ]                │
├──────────────────────────────────────────┤
│                                          │
│   📁 src/                                │
│   ├─ 📁 components/                      │
│   ├─ 📁 pages/                           │
│   └─ 📄 index.tsx                        │
│                                          │
└──────────────────────────────────────────┘
```

### 프리뷰 탭
```
┌──────────────────────────────────────────┐
│  [ 📝 코드 ] [ 🌐 프리뷰 ]                │
├──────────────────────────────────────────┤
│ ┌───┬────────────────┬───┬───┬───┐      │
│ │🔌 │ /about         │ 🔄│ ⛶ │ ↗ │      │
│ │▼  │                │   │   │   │      │
│ └───┴────────────────┴───┴───┴───┘      │
│ ┌────────────────────────────────────┐  │
│ │                                    │  │
│ │   localhost:3000                   │  │
│ │   (Next.js 앱 화면)                │  │
│ │                                    │  │
│ └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

## 🚀 Phase 2 확장 (선택 사항)

향후 추가할 수 있는 기능들:

### 1. 스크린샷 캡처
- `ScreenshotSelector.tsx` 포팅
- Claude 채팅에 자동 전송

### 2. 디바이스 프레임
- 모바일/태블릿 프레임
- 반응형 테스트

### 3. 개발자 도구
- Console 로그 보기
- Network 탭

## ⚠️ 주의사항

### Electron vs Tauri 차이점
```typescript
// ❌ Electron (작동 안 함)
window.electronAPI.preview.scanPorts()

// ✅ Tauri (사용해야 함)
invoke('scan_preview_ports')
```

### iframe 보안
```html
<!-- ✅ 권장 -->
<iframe
  src="http://localhost:3000"
  sandbox="allow-scripts allow-same-origin allow-forms"
/>

<!-- ❌ 위험 (외부 URL) -->
<iframe src="https://evil.com" />
```

### 포트 스캔 간격
```typescript
// ⚠️ 너무 자주 스캔하면 CPU 부하
setInterval(scanPorts, 1000); // ❌ 1초마다 (과함)
setInterval(scanPorts, 10000); // ✅ 10초마다 (적절)
```

## 📝 완료 기준

- [ ] 유지보수 워크스페이스에 코드/프리뷰 탭 표시
- [ ] 탭 전환 애니메이션 동작
- [ ] 포트 자동 스캔 (10초 간격)
- [ ] 드롭다운에 포트 목록 표시 (🟢/🔴)
- [ ] 포트 선택시 프리뷰 iframe 표시
- [ ] URL 입력 및 Enter로 네비게이션
- [ ] 새로고침 버튼 동작
- [ ] 전체화면 버튼 동작
- [ ] 외부 브라우저 열기 동작
- [ ] 포트 없을 때 안내 UI 표시
- [ ] Hot reload 동작 (dev server 기능)

---

**작성일**: 2025-12-05
**버전**: 2.0 (완전판)
**참조 프로젝트**: new-anyon (Electron → Tauri 포팅)
