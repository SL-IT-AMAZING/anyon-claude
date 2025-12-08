# 유지보수 워크스페이스 프리뷰 탭 구현 계획서

## 📋 개요

유지보수 워크스페이스에 **코드/프리뷰** 서브탭을 추가하여 MVP 워크스페이스와 동일한 UX 제공

## 🎯 목표

```
현재 구조:
┌─────────────────────────────────────────────┐
│  Maintenance                                │
├──────────────┬──────────────────────────────┤
│   Chat       │   FileExplorer               │
│   (좌측 50%) │   (우측 50%)                 │
└──────────────┴──────────────────────────────┘

목표 구조:
┌─────────────────────────────────────────────┐
│  Maintenance                                │
├──────────────┬──────────────────────────────┤
│              │ [ 📝 코드 ] [ 🌐 프리뷰 ]      │
│   Chat       ├──────────────────────────────┤
│   (좌측 50%) │  코드: FileExplorer          │
│              │  프리뷰: localhost iframe     │
└──────────────┴──────────────────────────────┘
```

## 📚 참고 파일

### 1. MvpWorkspace (구조 참고)
- **파일**: `src/components/MvpWorkspace.tsx`
- **참고 라인**:
  - 17줄: `type MvpTabType = 'planning' | 'development' | 'preview';`
  - 35줄: `const [activeTab, setActiveTab] = useState<MvpTabType>('planning');`
  - 146-166줄: 탭 UI (Tabs, TabsList, TabsTrigger)
  - 169-199줄: 탭별 컨텐츠 렌더링

### 2. 프리뷰 UI 참고 (new-anyon)
- **포트 드롭다운**: `/Users/cosmos/anyon-checkpoint/new-anyon/app/components/workbench/PortDropdown.tsx`
- **프리뷰 툴바**: `/Users/cosmos/anyon-checkpoint/new-anyon/app/components/workbench/Preview.tsx` (105-761줄)
- **포트 스캔**: `/Users/cosmos/anyon-checkpoint/new-anyon/electron/main/services/preview.ts` (161-213줄)

## 🛠️ 구현 단계

### Step 1: MaintenanceWorkspace에 탭 추가 (30분)

#### 1.1 Import 추가
```typescript
// src/components/MaintenanceWorkspace.tsx 상단
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Monitor } from 'lucide-react';
```

#### 1.2 타입 및 State 추가
```typescript
// 17줄 근처 추가
type MaintenanceTabType = 'code' | 'preview';

// 31줄 근처 추가
const [activeTab, setActiveTab] = useState<MaintenanceTabType>('code');
```

#### 1.3 Right Panel을 탭 구조로 변경
```typescript
// 123-126줄 right={...} 부분을 아래로 교체

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
          <div className="h-full flex items-center justify-center text-muted-foreground bg-background">
            <div className="text-center">
              <div className="w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center mb-4 mx-auto">
                <Monitor className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium mb-1">프리뷰 패널</p>
              <p className="text-xs opacity-70">프리뷰 기능이 곧 추가됩니다</p>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
}
```

### Step 2: PreviewPanel 컴포넌트 생성 (2시간)

**새 파일**: `src/components/PreviewPanel.tsx`

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { RefreshCw, Maximize, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PortInfo {
  port: number;
  url: string;
  alive: boolean;
}

export const PreviewPanel: React.FC = () => {
  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState<number | null>(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const [urlPath, setUrlPath] = useState('/');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 포트 스캔
  useEffect(() => {
    scanPorts();
    const interval = setInterval(scanPorts, 10000); // 10초마다
    return () => clearInterval(interval);
  }, []);

  const scanPorts = async () => {
    try {
      const result = await invoke<PortInfo[]>('scan_ports');
      setPorts(result);

      // 자동 선택
      if (!selectedPort && result.length > 0) {
        const alive = result.find(p => p.alive);
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
    const portInfo = ports.find(p => p.port === port);
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

  const handleOpenExternal = () => {
    if (currentUrl) window.open(currentUrl, '_blank');
  };

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

        {/* 버튼들 */}
        <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={!currentUrl}>
          <RefreshCw className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleFullscreen} disabled={!currentUrl}>
          <Maximize className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleOpenExternal} disabled={!currentUrl}>
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>

      {/* iframe */}
      <div className="flex-1 relative">
        {currentUrl ? (
          <iframe
            ref={iframeRef}
            src={currentUrl}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
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
```

### Step 3: Tauri 백엔드 (포트 스캔) (1시간)

#### 3.1 새 파일 생성
**파일**: `src-tauri/src/commands/preview.rs`

```rust
use std::net::TcpStream;
use std::time::Duration;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct PortInfo {
    pub port: u16,
    pub url: String,
    pub alive: bool,
}

#[tauri::command]
pub async fn scan_ports() -> Result<Vec<PortInfo>, String> {
    let common_ports = vec![3000, 3001, 3002, 5173, 5174, 5175, 8080, 8000, 4200, 4321];

    let mut results = Vec::new();

    for port in common_ports {
        let alive = check_port(port);
        results.push(PortInfo {
            port,
            url: format!("http://localhost:{}", port),
            alive,
        });
    }

    Ok(results)
}

fn check_port(port: u16) -> bool {
    TcpStream::connect_timeout(
        &format!("127.0.0.1:{}", port).parse().unwrap(),
        Duration::from_millis(300)
    ).is_ok()
}
```

#### 3.2 모듈 등록
**파일**: `src-tauri/src/commands/mod.rs` (새로 생성 또는 수정)

```rust
pub mod preview;
```

#### 3.3 핸들러 등록
**파일**: `src-tauri/src/main.rs`

```rust
mod commands;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // ... 기존 핸들러들
            commands::preview::scan_ports,  // 추가!
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Step 4: MaintenanceWorkspace에 PreviewPanel 연결 (15분)

```typescript
// src/components/MaintenanceWorkspace.tsx 상단
import { PreviewPanel } from '@/components/PreviewPanel';

// activeTab === 'preview' 부분을 아래로 교체
{activeTab === 'preview' && (
  <PreviewPanel />
)}
```

## 📊 작업 체크리스트

### Phase 1: 기본 구조 (Step 1)
- [ ] MaintenanceWorkspace.tsx import 추가
- [ ] MaintenanceTabType 타입 정의
- [ ] activeTab state 추가
- [ ] Tabs UI 추가 (코드/프리뷰)
- [ ] FileExplorer를 코드 탭으로 이동
- [ ] 프리뷰 탭 플레이스홀더 추가
- [ ] 테스트: 탭 전환 확인

### Phase 2: PreviewPanel 컴포넌트 (Step 2)
- [ ] PreviewPanel.tsx 파일 생성
- [ ] PortInfo 인터페이스 정의
- [ ] 포트 선택 드롭다운 UI
- [ ] URL 입력 필드
- [ ] 툴바 버튼들 (새로고침, 전체화면, 외부열기)
- [ ] iframe 렌더링
- [ ] 빈 상태 UI (포트 없을 때)
- [ ] 테스트: UI만 확인 (데이터 없어도 OK)

### Phase 3: Tauri 백엔드 (Step 3)
- [ ] src-tauri/src/commands/preview.rs 생성
- [ ] PortInfo struct 정의
- [ ] scan_ports 함수 구현
- [ ] check_port 함수 구현 (TCP 소켓)
- [ ] src-tauri/src/commands/mod.rs 수정
- [ ] src-tauri/src/main.rs 핸들러 등록
- [ ] 테스트: `cargo build` 성공 확인
- [ ] 테스트: 실제 dev server 띄우고 스캔 확인

### Phase 4: 통합 (Step 4)
- [ ] MaintenanceWorkspace에 PreviewPanel import
- [ ] preview 탭에 PreviewPanel 렌더링
- [ ] 테스트: 전체 플로우 확인
  - [ ] 유지보수 워크스페이스 열기
  - [ ] 프리뷰 탭 클릭
  - [ ] 포트 자동 스캔 확인
  - [ ] 포트 선택하면 프리뷰 나타남
  - [ ] URL 입력 가능
  - [ ] 새로고침 버튼 작동
  - [ ] 전체화면 버튼 작동

## ⏱️ 예상 시간

| 단계 | 작업 | 예상 시간 |
|------|------|-----------|
| Step 1 | 탭 구조 추가 | 30분 |
| Step 2 | PreviewPanel UI | 2시간 |
| Step 3 | Rust 포트 스캔 | 1시간 |
| Step 4 | 통합 및 테스트 | 30분 |
| **총계** | | **4시간** |

## 🎨 UI 미리보기

### 코드 탭 (현재와 동일)
```
┌──────────────────────────────────────┐
│ [ 📝 코드 ] [ 🌐 프리뷰 ]              │
├──────────────────────────────────────┤
│                                      │
│   FileExplorer                       │
│   (기존 파일 뷰어)                     │
│                                      │
└──────────────────────────────────────┘
```

### 프리뷰 탭 (새로 추가)
```
┌──────────────────────────────────────┐
│ [ 📝 코드 ] [ 🌐 프리뷰 ]              │
├──────────────────────────────────────┤
│ ┌────┬────────────────┬──┬──┬──┐    │
│ │Port│ /path          │🔄│⛶│↗│    │
│ │3000│                │  │  │  │    │
│ └────┴────────────────┴──┴──┴──┘    │
│ ┌──────────────────────────────┐    │
│ │                              │    │
│ │   localhost:3000 화면         │    │
│ │   (iframe)                   │    │
│ │                              │    │
│ └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

## 🔧 개발 환경 설정

### 테스트용 Dev Server 실행
```bash
# 프로젝트 디렉토리에서
npm run dev     # 보통 3000 또는 5173
# 또는
python -m http.server 8000
```

### Tauri 개발 모드 실행
```bash
cd /Users/cosmos/siball/anyon-claude
npm run tauri dev
```

## 📝 참고사항

### 보안
- iframe `sandbox` 속성으로 제한
- localhost만 허용 (외부 URL 차단 고려)

### 성능
- 포트 스캔 간격: 10초 (조정 가능)
- TCP 타임아웃: 300ms (빠른 응답)

### 확장 가능성
- 나중에 디바이스 프레임 추가 가능 (모바일/태블릿 뷰)
- 스크린샷 캡처 기능 추가 가능
- 여러 포트 동시 보기 (그리드 뷰) 가능

## ✅ 완료 기준

- [ ] 유지보수 워크스페이스에 코드/프리뷰 탭 표시
- [ ] 탭 전환 동작
- [ ] 포트 자동 스캔 (3000, 5173 등)
- [ ] 포트 선택시 프리뷰 표시
- [ ] URL 입력 및 네비게이션 작동
- [ ] 새로고침 버튼 작동
- [ ] 전체화면 버튼 작동
- [ ] 외부 브라우저에서 열기 작동
- [ ] 포트 없을 때 안내 메시지 표시

---

**작성일**: 2025-12-05
**버전**: 1.0
**작성자**: Claude Code
