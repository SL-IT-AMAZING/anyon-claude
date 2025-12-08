# 프리뷰 탭 - 완전한 기능 목록 (new-anyon 분석)

## 🔍 발견된 모든 프리뷰 기능

### ✅ Phase 1: 기본 프리뷰 (필수)
1. **포트 스캔 & 선택**
   - 자동 포트 스캔 (3초 간격)
   - 포트 드롭다운 (정렬, 선택)
   - 포트 상태 표시 (🟢/🔴)

2. **URL 네비게이션**
   - URL 입력 필드
   - 경로 변경 (/, /about 등)
   - Enter로 이동

3. **기본 컨트롤**
   - 새로고침 버튼
   - 전체화면 버튼
   - 외부 브라우저 열기

4. **iframe 프리뷰**
   - localhost 표시
   - Sandbox 보안
   - Hot reload 지원

---

### 🎨 Phase 2: 디바이스 에뮬레이션 (중요!)

#### 2.1 디바이스 모드
```typescript
// Preview.tsx Line 72
const [isDeviceModeOn, setIsDeviceModeOn] = useState(false);
const [widthPercent, setWidthPercent] = useState<number>(37.5);
```

**기능**:
- 디바이스 모드 on/off 토글
- 반응형 너비 조절 (리사이저 핸들)
- 실시간 너비 표시 (px)

#### 2.2 디바이스 프리셋
```typescript
// Preview.tsx Line 29-56
const WINDOW_SIZES: WindowSize[] = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12/13', width: 390, height: 844 },
  { name: 'iPhone 12/13 Pro Max', width: 428, height: 926 },
  { name: 'iPad Mini', width: 768, height: 1024 },
  { name: 'iPad Air', width: 820, height: 1180 },
  { name: 'iPad Pro 11"', width: 834, height: 1194 },
  { name: 'iPad Pro 12.9"', width: 1024, height: 1366 },
  { name: 'Small Laptop', width: 1280, height: 800 },
  { name: 'Laptop', width: 1366, height: 768 },
  { name: 'Large Laptop', width: 1440, height: 900 },
  { name: 'Desktop', width: 1920, height: 1080 },
  { name: '4K Display', width: 3840, height: 2160 },
];
```

**기능**:
- 12가지 디바이스 프리셋
- 모바일/태블릿/노트북/데스크톱
- 가로/세로 모드 전환

#### 2.3 디바이스 프레임
```typescript
// Preview.tsx Line 91-92
const [showDeviceFrame, setShowDeviceFrame] = useState(true);
const [showDeviceFrameInPreview, setShowDeviceFrameInPreview] = useState(false);
```

**기능**:
- 디바이스 외형 프레임 (notch, home button)
- 프레임 색상 (다크모드 대응)
- 프리셋별 커스텀 프레임
- 새 창에서 열기 (프레임 포함)

#### 2.4 반응형 리사이저
```typescript
// Preview.tsx Line 167-336
const startResizing = (e: React.PointerEvent, side: ResizeSide) => { ... }
```

**기능**:
- 좌/우 핸들 드래그
- 실시간 너비 조절
- 최소/최대 너비 제한 (10%-90%)
- 마우스 커서 변경

---

### 📸 Phase 3: 스크린샷 기능

#### 3.1 ScreenshotSelector
**파일**: `app/components/workbench/ScreenshotSelector.tsx`

**기능**:
- 영역 선택 (마우스 드래그)
- 화면 캡처 (getDisplayMedia API)
- 자동으로 채팅에 첨부
- Canvas 기반 크롭

**주요 메서드**:
```typescript
handleCopySelection() // 선택 영역 캡처
initializeStream()    // 화면 공유 시작
handleSelectionStart() // 드래그 시작
handleSelectionMove()  // 드래그 중
```

**작동 방식**:
1. 사용자가 선택 모드 활성화
2. 프리뷰 위에 반투명 오버레이
3. 마우스로 영역 선택
4. 자동으로 스크린샷 → 채팅 첨부

---

### 📱 Phase 4: Expo QR 코드 (React Native)

#### 4.1 QR 코드 표시
**파일**: `app/components/workbench/ExpoQrModal.tsx`

**기능**:
- Expo Go 앱용 QR 코드
- 모바일 기기에서 스캔
- 실제 디바이스 테스트

**Store**:
```typescript
// app/lib/stores/qrCodeStore.ts
export const expoUrlAtom = atom<string | null>(null);
```

**감지 방식**:
- 터미널 output 파싱
- "exp://" URL 감지
- 자동으로 QR 버튼 표시

---

### 🔧 Phase 5: Electron 전용 기능 (BrowserView)

#### 5.1 BrowserView API
**파일**: `electron/main/services/preview.ts`

**Electron 전용 기능** (Tauri 불가):
```typescript
// BrowserView 생성
new BrowserView({ webPreferences: { ... } })

// 위치/크기 설정
view.setBounds({ x, y, width, height })

// 표시/숨김
mainWindow.addBrowserView(view)
mainWindow.removeBrowserView(view)

// 스크린샷
view.webContents.capturePage()
```

#### 5.2 메모리 관리
```typescript
// preview.ts Line 23-26
private static readonly MAX_BROWSER_VIEWS = 5;
private static readonly IDLE_CLEANUP_MS = 5 * 60 * 1000;
```

**기능**:
- 최대 5개 BrowserView 제한
- 5분 유휴시 자동 정리
- LRU 방식 eviction

#### 5.3 CSP 헤더
```typescript
// preview.ts Line 42-56
session.defaultSession.webRequest.onHeadersReceived(...)
```

**보안**:
- Content Security Policy 적용
- X-Frame-Options 제거 (BrowserView용)

---

## 📊 기능 우선순위 재평가

### 🟢 Phase 1: 필수 (5시간)
- [x] 포트 스캔 & 드롭다운
- [x] URL 네비게이션
- [x] 기본 컨트롤 (새로고침, 전체화면, 외부 열기)
- [x] iframe 프리뷰
- [x] 자동 스캔 (10초 간격)

### 🟡 Phase 2: 중요 (3시간)
- [ ] 디바이스 모드 토글
- [ ] 12가지 디바이스 프리셋
- [ ] 반응형 리사이저 (좌/우 핸들)
- [ ] 가로/세로 전환
- [ ] 디바이스 프레임 (notch, home button)

### 🟠 Phase 3: 유용 (2시간)
- [ ] 스크린샷 영역 선택
- [ ] Canvas 크롭
- [ ] 채팅에 자동 첨부

### 🔵 Phase 4: 특수 (1시간)
- [ ] Expo QR 코드 생성
- [ ] 터미널 output 파싱
- [ ] QR 모달

### ⚫ Phase 5: Electron 전용 (불가능)
- ❌ BrowserView API (Tauri 없음)
- ❌ setBounds (iframe로 대체)
- ❌ BrowserView 메모리 관리
- ❌ CSP 헤더 수정 (Tauri는 config로)

---

## 🎯 Tauri 구현 가능 여부

### ✅ 100% 가능
1. 포트 스캔 (Rust TCP)
2. iframe 프리뷰
3. URL 네비게이션
4. 디바이스 모드 (CSS)
5. 디바이스 프리셋
6. 반응형 리사이저
7. 가로/세로 전환
8. 디바이스 프레임 (CSS/HTML)

### ⚠️ 대체 방법 필요
1. **BrowserView → iframe**
   - 기능: 동일
   - 차이: 네이티브 vs 웹

2. **스크린샷 → getDisplayMedia**
   - 브라우저 API 사용
   - 권한 요청 필요

3. **setBounds → CSS**
   - Flexbox로 위치 조정
   - 동일 효과

### ❌ 불가능
1. BrowserView의 네이티브 성능
2. 멀티 BrowserView 관리
3. Electron 레벨 CSP

---

## 📁 완전한 파일 구조 (Phase 1 + 2)

```
src/
├── types/
│   └── preview.ts                    타입 정의
├── stores/
│   └── previewStore.ts               Zustand store
├── components/
│   └── preview/
│       ├── PortDropdown.tsx          포트 선택
│       ├── PreviewToolbar.tsx        툴바
│       ├── PreviewFrame.tsx          iframe
│       ├── PreviewPanel.tsx          통합
│       ├── DeviceSelector.tsx        [NEW] 디바이스 프리셋
│       ├── DeviceFrame.tsx           [NEW] 디바이스 외형
│       └── ResizeHandle.tsx          [NEW] 리사이저

src-tauri/
└── src/
    └── commands/
        └── preview.rs                포트 스캔
```

---

## 🚀 추천 구현 순서

### Week 1: 기본 프리뷰 (5시간)
1. Rust 포트 스캔
2. Store + 타입
3. PortDropdown
4. PreviewToolbar
5. PreviewFrame
6. PreviewPanel
7. MaintenanceWorkspace 통합

### Week 2: 디바이스 에뮬레이션 (3시간)
1. DeviceSelector 컴포넌트
2. 디바이스 모드 토글
3. ResizeHandle (좌/우 드래그)
4. 가로/세로 전환
5. DeviceFrame (notch, home button)

### Week 3: 고급 기능 (3시간)
1. 스크린샷 선택 (getDisplayMedia)
2. Canvas 크롭
3. 채팅 첨부
4. Expo QR (선택사항)

---

## 💡 Phase 2 구현 미리보기

### 디바이스 모드 UI
```
┌────────────────────────────────────────────┐
│ [ 📝 코드 ] [ 🌐 프리뷰 ]                  │
├────────────────────────────────────────────┤
│ ┌───┬───────────┬───┬───┬───┬───┐         │
│ │🔌 │/         │ 🔄│ ⛶ │ ↗ │📱│         │
│ │▼  │          │   │   │   │▼ │         │
│ └───┴───────────┴───┴───┴───┴───┘         │
│ ┌─────────────────────────────────────┐   │
│ │  ┏━━━━━━━━━━━━━━━━━┓               │   │
│ │  ┃     notch       ┃               │   │ iPhone
│ │  ┃                 ┃               │   │ Frame
│ │  ┃  localhost:3000 ┃               │   │
│ │  ┃                 ┃               │   │
│ │  ┃       ⚫         ┃               │   │
│ │  ┗━━━━━━━━━━━━━━━━━┛               │   │
│ │  ← 드래그 │ 375px │ 드래그 →        │   │
│ └─────────────────────────────────────┘   │
└────────────────────────────────────────────┘
```

### 디바이스 드롭다운
```
┌──────────────────────────┐
│ 📱 Mobile                │
│   iPhone SE (375×667)   │ ← 선택
│   iPhone 12 (390×844)   │
│   iPad Mini (768×1024)  │
├──────────────────────────┤
│ 💻 Desktop               │
│   Laptop (1366×768)     │
│   Desktop (1920×1080)   │
└──────────────────────────┘
```

---

## 📝 최종 요약

### new-anyon에서 발견한 기능
1. ✅ 포트 스캔 & 드롭다운
2. ✅ URL 네비게이션
3. ✅ 기본 컨트롤 (새로고침, 전체화면 등)
4. ✅ **디바이스 에뮬레이션** (12개 프리셋)
5. ✅ **반응형 리사이저** (드래그 핸들)
6. ✅ **디바이스 프레임** (notch, home button)
7. ✅ **가로/세로 전환**
8. ✅ **스크린샷 영역 선택**
9. ✅ **Expo QR 코드**
10. ❌ BrowserView (Electron 전용)

### Tauri로 구현 가능
- Phase 1: 100% 가능 ✅
- Phase 2: 100% 가능 ✅
- Phase 3: 95% 가능 (getDisplayMedia 권한 필요)
- Phase 4: 90% 가능 (터미널 파싱 필요)

### 예상 시간 (전체)
- Phase 1: 5시간
- Phase 2: 3시간
- Phase 3: 2시간
- Phase 4: 1시간
- **총 11시간**

---

**다음 단계**: Phase 1+2를 포함한 완전한 구현 계획서 작성
