# dyad-clone 프로젝트 - 프리뷰 및 개발 서버 아키텍처

## 1. 프로젝트 열면 자동으로 프리뷰 띄우는 로직 (자동 시작 트리거)

### 트리거 포인트: AppList 클릭
**위치**: `/Users/cosmos/Documents/develop/dyad-clone/dyad/src/components/AppList.tsx:54-56`

```typescript
const handleAppClick = (id: number) => {
  setSelectedAppId(id);  // <-- 이것이 트리거!
  setSelectedChatId(null);
  setIsSearchDialogOpen(false);
};
```

### 자동 실행 감지: PreviewPanel useEffect
**위치**: `/Users/cosmos/Documents/develop/dyad-clone/dyad/src/components/preview_panel/PreviewPanel.tsx:65-108`

PreviewPanel 컴포넌트의 useEffect에서 `selectedAppId` 변경을 감시:

```typescript
useEffect(() => {
  const previousAppId = runningAppIdRef.current;
  
  if (selectedAppId !== previousAppId) {
    // 이전 앱 중지
    if (previousAppId !== null) {
      stopApp(previousAppId);
    }
    
    // 새로운 앱 시작 <-- 자동 시작!
    if (selectedAppId !== null) {
      runApp(selectedAppId);
      runningAppIdRef.current = selectedAppId;
    }
  }
}, [selectedAppId, runApp, stopApp]);
```

---

## 2. HTML 파일 프리뷰 기능

### 정적 HTML 파일 프리뷰: 프록시 서버의 HTML 인젝션
**위치**: `/Users/cosmos/Documents/develop/dyad-clone/dyad/worker/proxy_server.js:87-139`

**핵심 로직:**

1. **HTML 감지** (87-91줄):
```javascript
function needsInjection(pathname) {
  const ext = path.extname(pathname).toLowerCase();
  return ext === "" || ext === ".html";
}
```

2. **Script 인젝션** (93-139줄):
   - 정적 HTML 요청에 자동으로 다음 스크립트 주입:
     - `stacktrace.js` - 에러 추적용
     - `dyad-shim.js` - Dyad 통합용 (window-error, unhandled-rejection 감시)
     - `dyad-component-selector-client.js` - 컴포넌트 선택기용
   
3. **레거시 앱 처리**:
   - Vite 플러그인에서 이미 shim이 포함된 앱은 중복 주입 방지

### PreviewIframe 렌더링
**위치**: `/Users/cosmos/Documents/develop/dyad-clone/dyad/src/components/preview_panel/PreviewIframe.tsx:157`

- 프록시 URL(appUrl)을 iframe의 src로 설정
- 에러, 네비게이션, 컴포넌트 선택 메시지를 postMessage로 감지

---

## 3. 개발 서버(dev server) 관리

### 포트 감지 및 프록시 시작
**위치**: `/Users/cosmos/Documents/develop/dyad-clone/dyad/src/ipc/handlers/app_handlers.ts:260-271`

```typescript
const urlMatch = message.match(/(https?:\/\/localhost:\d+\/?)/);
if (urlMatch) {
  proxyWorker = await startProxy(urlMatch[1], {
    onStarted: (proxyUrl) => {
      safeSend(event.sender, "app:output", {
        type: "stdout",
        message: `[dyad-proxy-server]started=[${proxyUrl}] original=[${urlMatch[1]}]`,
        appId,
      });
    },
  });
}
```

**프로세스:**
1. 앱 stdout 모니터링
2. `localhost:XXXX` 포트 정규식 매칭
3. 포트 감지되면 자동으로 프록시 워커 시작

### npm run dev 등 명령 실행
**위치**: `/Users/cosmos/Documents/develop/dyad-clone/dyad/src/ipc/handlers/app_handlers.ts:128-149`

```typescript
async function executeAppLocalNode({
  appPath,
  appId,
  event,
  isNeon,
  installCommand,
  startCommand,
}: {...}): Promise<void> {
  const command = getCommand({ installCommand, startCommand });
  const spawnedProcess = spawn(command, [], {
    cwd: appPath,
    shell: true,
    stdio: "pipe",
    detached: false,
  });
  
  // 프로세스 인스턴스 저장
  const currentProcessId = processCounter.increment();
  runningApps.set(appId, {
    process: spawnedProcess,
    processId: currentProcessId,
    isDocker: false,
  });
  
  // 리스너 설정
  listenToProcess({
    process: spawnedProcess,
    appId,
    isNeon,
    event,
  });
}
```

### 프로세스 출력 모니터링
**위치**: `/Users/cosmos/Documents/develop/dyad-clone/dyad/src/ipc/handlers/app_handlers.ts:211-304`

**stdout 리스너** (223-273줄):
- VT 제어 문자 제거
- 대화형 프롬프트 감지 (y/n)
- 포트 감지
- IPC로 UI에 메시지 전송

**stderr 리스너** (275-285줄):
- 에러 메시지 기록 및 전송

**프로세스 종료 처리** (288-303줄):
- close/error 이벤트 감시
- runningApps 맵에서 제거

---

## 4. 프록시 서버 구현

### 프록시 서버 시작
**위치**: `/Users/cosmos/Documents/develop/dyad-clone/dyad/src/ipc/utils/start_proxy_server.ts`

```typescript
export async function startProxy(
  targetOrigin: string,
  opts: { onStarted?: (proxyUrl: string) => void } = {},
) {
  const port = await findAvailablePort(50_000, 60_000);  // 포트 검색
  
  const worker = new Worker(
    path.resolve(__dirname, "..", "..", "worker", "proxy_server.js"),
    { workerData: { targetOrigin, port } },
  );
  
  worker.on("message", (m) => {
    if (m.startsWith("proxy-server-start url=")) {
      const url = m.substring("proxy-server-start url=".length);
      onStarted?.(url);  // 콜백으로 시작 알림
    }
  });
  
  return worker;
}
```

### 포트 선택
**위치**: `/Users/cosmos/Documents/develop/dyad-clone/dyad/src/ipc/utils/port_utils.ts`

```typescript
export function findAvailablePort(
  minPort: number,
  maxPort: number,
): Promise<number> {
  // 50000~60000 범위에서 랜덤 포트 3번 시도
  // 포트 사용 가능 여부 확인
  const server = net.createServer();
  server.listen(port, "localhost");
  // 포트 확인 후 즉시 close
}
```

### 프록시 HTTP/WS 서버
**위치**: `/Users/cosmos/Documents/develop/dyad-clone/dyad/worker/proxy_server.js`

**HTTP 요청 처리** (153-239줄):
1. 클라이언트 요청을 upstream(dev server)으로 포워딩
2. HTML 응답인 경우 needsInjection() 확인 후 스크립트 인젝션
3. 헤더 재작성 (Host, Origin, Referer)

**WebSocket 업그레이드 처리** (245-282줄):
1. HTTP Upgrade 요청 감지
2. upstream으로 WebSocket 연결 전달
3. 양방향 터널링

### HTML 인젝션 상세
- 요청 경로에 파일 확장자가 없거나 `.html`인 경우만 처리
- 이미 shim이 포함된 레거시 앱은 중복 주입 방지
- `<head>` 태그 찾아 스크립트 주입, 없으면 상단에 추가

---

## 5. IPC 통신 흐름

### 프론트엔드 → 메인 프로세스
**위치**: `/Users/cosmos/Documents/develop/dyad-clone/dyad/src/hooks/useRunApp.ts:76-119`

```typescript
const runApp = useCallback(
  async (appId: number) => {
    setLoading(true);
    const ipcClient = IpcClient.getInstance();
    const app = await ipcClient.getApp(appId);
    setApp(app);
    await ipcClient.runApp(appId, processAppOutput);  // <-- IPC 호출
  },
  [processAppOutput],
);
```

**Handlers** (`/src/ipc/handlers/app_handlers.ts`):
- `run-app` - 앱 시작
- `stop-app` - 앱 중지
- `restart-app` - 앱 재시작

### 메인 프로세스 → 프론트엔드
**위치**: `/Users/cosmos/Documents/develop/dyad-clone/dyad/src/ipc/handlers/app_handlers.ts:254-268`

```typescript
safeSend(event.sender, "app:output", {
  type: "stdout" | "stderr" | "input-requested",
  message,
  appId,
});
```

**리스너** (`/src/ipc/ipc_client.ts:160-176`):
```typescript
this.ipcRenderer.on("app:output", (data) => {
  const { type, message, appId } = data;
  const callbacks = this.appStreams.get(appId);
  if (callbacks) {
    callbacks.onOutput({ type, message, appId, timestamp: Date.now() });
  }
});
```

---

## 6. 자동 프리뷰 시작 전체 흐름

1. **사용자 동작**: AppList에서 앱 클릭
   - `setSelectedAppId(id)` 호출

2. **선택 감지**: PreviewPanel의 useEffect
   - `selectedAppId` 변경 감지
   - `runApp(selectedAppId)` 호출

3. **앱 실행**: IPC 핸들러
   - `run-app` 핸들러 → `executeAppLocalNode()` 실행
   - 자식 프로세스 생성 (npm run dev 등)
   - stdout 모니터링 시작

4. **포트 감지**: stdout 파싱
   - 정규식 `/(https?:\/\/localhost:\d+\/?)/` 매칭
   - 포트 감지 시 프록시 워커 시작

5. **프록시 시작**: Worker 스레드
   - 포트 50000~60000 범위에서 선택
   - HTTP/WS 서버 시작
   - `onStarted()` 콜백으로 프록시 URL 전달

6. **UI 업데이트**: IPC로 프록시 URL 전송
   - `[dyad-proxy-server]started=[...] original=[...]` 메시지
   - 프론트엔드에서 파싱 후 appUrlAtom 업데이트

7. **Preview 렌더링**: PreviewIframe
   - iframe src를 프록시 URL로 설정
   - 프록시가 HTML 주입 후 응답
   - 컴포넌트 선택기 활성화

---

## 주요 파일 정리

| 기능 | 파일 | 주요 함수/컴포넌트 |
|------|------|----------------|
| **자동 시작 트리거** | AppList.tsx | handleAppClick() |
| **자동 감지 및 실행** | PreviewPanel.tsx | useEffect(selectedAppId) |
| **앱 실행 관리** | app_handlers.ts | executeAppLocalNode(), listenToProcess() |
| **포트 감지** | app_handlers.ts | listenToProcess() - stdout 리스너 |
| **프록시 시작** | start_proxy_server.ts | startProxy() |
| **포트 선택** | port_utils.ts | findAvailablePort() |
| **프록시 서버** | proxy_server.js | HTTP/WS 포워딩, HTML 인젝션 |
| **IPC 통신** | ipc_client.ts | runApp(), streamMessage() |
| **IPC 핸들러** | app_handlers.ts | "run-app", "stop-app", "restart-app" |
| **화면 렌더링** | PreviewIframe.tsx | iframe 로드, 메시지 감시 |
| **원자 상태** | appAtoms.ts | selectedAppIdAtom, appUrlAtom |
