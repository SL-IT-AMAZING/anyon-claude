# dyad-clone 프리뷰 모드 마이그레이션 계획서

> anyon-claude 유지보수탭에 dyad-clone의 프리뷰 기능을 이식하기 위한 상세 계획

## 목차
1. [현재 상태 비교](#1-현재-상태-비교)
2. [가져올 기능 목록](#2-가져올-기능-목록)
3. [마이그레이션 단계](#3-마이그레이션-단계)
4. [파일별 상세 분석](#4-파일별-상세-분석)
5. [의존성 및 주의사항](#5-의존성-및-주의사항)

---

## 1. 현재 상태 비교

### anyon-claude (현재)
```
src/
├── components/
│   ├── PreviewPanel.tsx          # 기본 프리뷰 (포트/파일 모드)
│   └── MaintenanceWorkspace.tsx  # 유지보수 워크스페이스
├── lib/
│   └── previewSelector.ts        # 요소 선택기 스크립트
src-tauri/src/
├── commands/preview.rs           # 포트 스캔, 파일 서버
└── preview_server.rs             # Axum 기반 정적 파일 서버
```

### dyad-clone (목표)
```
src/
├── components/preview_panel/
│   ├── PreviewPanel.tsx          # 메인 컨테이너
│   ├── PreviewIframe.tsx         # iframe + 에러 배너 + 네비게이션
│   ├── ActionHeader.tsx          # 탭 전환 UI
│   ├── Problems.tsx              # TypeScript 에러 목록
│   ├── Console.tsx               # 앱 로그
│   ├── CodeView.tsx              # 파일 탐색기 + 에디터
│   ├── FileTree.tsx              # 파일 트리
│   └── FileEditor.tsx            # 코드 에디터
├── atoms/
│   ├── appAtoms.ts               # 앱 상태 (previewMode, appOutput 등)
│   └── previewAtoms.ts           # 프리뷰 상태 (선택된 컴포넌트)
├── hooks/
│   ├── useRunApp.ts              # 앱 시작/중지/재시작
│   ├── useCheckProblems.ts       # TypeScript 에러 체크
│   ├── useParseRouter.ts         # 라우트 파싱
│   └── useShortcut.ts            # 단축키
├── shared/
│   └── problem_prompt.ts         # AI 에러 수정 프롬프트 생성
worker/
├── proxy_server.js               # 프록시 서버 (스크립트 자동 주입)
├── dyad-shim.js                  # 에러 캡처 + 네비게이션 훅
└── dyad-component-selector-client.js  # 컴포넌트 선택기
```

---

## 2. 가져올 기능 목록

### 필수 (Must Have)
| 우선순위 | 기능 | dyad 파일 | 설명 |
|---------|------|----------|------|
| 1 | 에러 배너 | `PreviewIframe.tsx` (ErrorBanner) | iframe 에러 자동 감지 + "AI로 고치기" 버튼 |
| 2 | 에러 캡처 스크립트 | `dyad-shim.js` | window.error, unhandledrejection 캡처 |
| 3 | Problems 탭 | `Problems.tsx` | TypeScript 에러 목록 + 선택적 AI 수정 |
| 4 | Console 탭 | `Console.tsx` | 앱 출력 로그 표시 |
| 5 | 앱 관리 | `useRunApp.ts` | 시작/중지/재시작/클린 재시작 |

### 권장 (Should Have)
| 우선순위 | 기능 | dyad 파일 | 설명 |
|---------|------|----------|------|
| 6 | 컴포넌트 선택기 개선 | `dyad-component-selector-client.js` | 파일:줄:컬럼 위치 추적 |
| 7 | 프록시 서버 | `proxy_server.js` | 스크립트 자동 주입 (cross-origin 해결) |
| 8 | 라우트 네비게이션 | `useParseRouter.ts` | React Router/Next.js 라우트 파싱 |
| 9 | 단축키 | `useShortcut.ts` | Cmd+Shift+C 컴포넌트 선택 |
| 10 | 선택 컴포넌트 표시 | `SelectedComponentDisplay.tsx` | 채팅 입력창에 선택된 컴포넌트 표시 |

### 선택 (Nice to Have)
| 우선순위 | 기능 | dyad 파일 | 설명 |
|---------|------|----------|------|
| 11 | 코드 뷰어 | `CodeView.tsx`, `FileTree.tsx`, `FileEditor.tsx` | 파일 탐색 + 에디터 |
| 12 | 액션 헤더 | `ActionHeader.tsx` | 탭 전환 애니메이션 UI |

---

## 3. 마이그레이션 단계

### Phase 1: 기반 작업 (1-2일)

#### 1.1 Jotai 상태 관리 도입
```bash
# 이미 설치되어 있다면 스킵
npm install jotai
```

새 파일 생성:
```typescript
// src/atoms/previewAtoms.ts
import { atom } from 'jotai';

export type PreviewMode = 'preview' | 'code' | 'problems' | 'console';

export const previewModeAtom = atom<PreviewMode>('preview');
export const appOutputAtom = atom<AppOutput[]>([]);
export const previewErrorMessageAtom = atom<{
  message: string;
  source: 'preview-app' | 'anyon-app';
} | undefined>(undefined);
export const selectedComponentsAtom = atom<ComponentSelection[]>([]);
export const previewIframeRefAtom = atom<HTMLIFrameElement | null>(null);
```

#### 1.2 타입 정의 추가
```typescript
// src/types/preview.ts
export interface AppOutput {
  type: 'stdout' | 'stderr' | 'info' | 'client-error';
  message: string;
  timestamp: number;
  projectPath: string;
}

export interface ComponentSelection {
  id: string;           // "파일경로:줄:컬럼"
  name: string;         // 컴포넌트 이름
  relativePath: string;
  lineNumber: number;
  columnNumber: number;
}

export interface Problem {
  file: string;
  line: number;
  column: number;
  message: string;
  code: string;
  snippet?: string;
}

export interface ProblemReport {
  problems: Problem[];
}
```

---

### Phase 2: 프록시 서버 구현 (2-3일)

#### 2.1 Rust 프록시 서버 (Tauri)

현재 `preview_server.rs`를 확장하여 HTML 응답에 스크립트 자동 주입:

```rust
// src-tauri/src/preview_server.rs 수정

// HTML 응답에 스크립트 주입하는 미들웨어 추가
async fn inject_scripts_middleware(
    req: Request<Body>,
    next: Next,
) -> Response<Body> {
    let response = next.run(req).await;

    // Content-Type이 text/html인 경우에만 주입
    if is_html_response(&response) {
        inject_shim_scripts(response)
    } else {
        response
    }
}
```

#### 2.2 주입할 스크립트 준비

dyad의 스크립트를 anyon 형식으로 변환:

```
src-tauri/scripts/
├── anyon-shim.js              # dyad-shim.js 기반 (에러 캡처)
└── anyon-component-selector.js # 컴포넌트 선택기
```

**anyon-shim.js 주요 기능:**
- `window.addEventListener('error', ...)` - 런타임 에러 캡처
- `window.addEventListener('unhandledrejection', ...)` - Promise 에러 캡처
- `history.pushState/replaceState` 오버라이드 - 네비게이션 추적
- Vite 에러 오버레이 감지

---

### Phase 3: 에러 배너 구현 (1일)

#### 3.1 ErrorBanner 컴포넌트 생성

```typescript
// src/components/preview/ErrorBanner.tsx

interface ErrorBannerProps {
  error: { message: string; source: 'preview-app' | 'anyon-app' } | undefined;
  onDismiss: () => void;
  onAIFix: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  onDismiss,
  onAIFix,
}) => {
  if (!error) return null;

  return (
    <div className="absolute top-2 left-2 right-2 z-10 bg-red-50 dark:bg-red-950 border border-red-200 rounded-md p-2">
      {/* 닫기 버튼 */}
      {/* 에러 메시지 (접기/펼치기) */}
      {/* 팁 메시지 */}
      {/* AI로 고치기 버튼 */}
    </div>
  );
};
```

#### 3.2 PreviewPanel에 통합

```typescript
// PreviewPanel.tsx 수정
const [errorMessage, setErrorMessage] = useAtom(previewErrorMessageAtom);

// iframe 메시지 리스너 추가
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'window-error' ||
        event.data?.type === 'unhandled-rejection') {
      setErrorMessage({
        message: event.data.payload.message,
        source: 'preview-app'
      });
    }
  };
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);
```

---

### Phase 4: Problems 탭 구현 (2일)

#### 4.1 TypeScript 에러 체크 백엔드

```rust
// src-tauri/src/commands/problems.rs

#[tauri::command]
pub async fn check_typescript_problems(
    project_path: String,
) -> Result<ProblemReport, String> {
    // tsc --noEmit 실행하여 에러 수집
    // 또는 @typescript/vfs 사용
}
```

#### 4.2 useCheckProblems 훅

```typescript
// src/hooks/useCheckProblems.ts
export function useCheckProblems(projectPath: string | null) {
  const { data, refetch } = useQuery({
    queryKey: ['problems', projectPath],
    queryFn: () => invoke('check_typescript_problems', { projectPath }),
    enabled: !!projectPath,
  });

  return {
    problemReport: data,
    checkProblems: refetch,
  };
}
```

#### 4.3 Problems 컴포넌트

```typescript
// src/components/preview/Problems.tsx
// dyad의 Problems.tsx 참고하여 구현
// - 에러 목록 표시
// - 체크박스로 선택
// - "AI로 수정" 버튼 → createProblemFixPrompt() 사용
```

---

### Phase 5: Console 탭 구현 (0.5일)

```typescript
// src/components/preview/Console.tsx
import { useAtomValue } from 'jotai';
import { appOutputAtom } from '@/atoms/previewAtoms';

export const Console: React.FC = () => {
  const appOutput = useAtomValue(appOutputAtom);

  return (
    <div className="font-mono text-xs px-4 h-full overflow-auto">
      {appOutput.map((output, index) => (
        <div
          key={index}
          className={cn(
            output.type === 'stderr' && 'text-red-500',
            output.type === 'client-error' && 'text-red-500',
          )}
        >
          {output.message}
        </div>
      ))}
    </div>
  );
};
```

---

### Phase 6: 컴포넌트 선택기 개선 (2-3일)

#### 6.1 빌드 플러그인 (Vite)

컴포넌트에 `data-anyon-id` 속성 자동 추가:

```typescript
// vite-plugin-anyon-component-id.ts
export function anyonComponentIdPlugin(): Plugin {
  return {
    name: 'anyon-component-id',
    transform(code, id) {
      if (!id.endsWith('.tsx') && !id.endsWith('.jsx')) return;

      // JSX 요소에 data-anyon-id="파일:줄:컬럼" 추가
      // data-anyon-name="ComponentName" 추가
    }
  };
}
```

#### 6.2 선택기 스크립트 업데이트

```javascript
// anyon-component-selector.js
// data-anyon-id 속성을 가진 요소만 선택 가능
// 선택 시 파일:줄:컬럼 정보를 parent에게 전달
```

#### 6.3 SelectedComponentDisplay 컴포넌트

```typescript
// src/components/preview/SelectedComponentDisplay.tsx
// 채팅 입력창 위에 선택된 컴포넌트 목록 표시
// X 버튼으로 개별 제거
// "모두 지우기" 버튼
```

---

### Phase 7: 탭 UI 개선 (1일)

#### 7.1 ActionHeader 컴포넌트

```typescript
// src/components/preview/ActionHeader.tsx
// Preview | Problems | Code | Console 탭
// 문제 수 뱃지 표시
// 애니메이션 인디케이터 (framer-motion)
```

#### 7.2 MaintenanceWorkspace 업데이트

```typescript
// 기존 Tabs를 ActionHeader로 교체
// 각 탭에 맞는 컴포넌트 렌더링
```

---

## 4. 파일별 상세 분석

### 복사해올 파일 (수정 필요)

| dyad 파일 | anyon 대상 | 수정 사항 |
|----------|-----------|----------|
| `worker/dyad-shim.js` | `src-tauri/scripts/anyon-shim.js` | 메시지 타입 이름 변경 |
| `worker/dyad-component-selector-client.js` | `src-tauri/scripts/anyon-component-selector.js` | `dyad` → `anyon` 네이밍 |
| `src/components/preview_panel/Problems.tsx` | `src/components/preview/Problems.tsx` | Jotai atom 이름, IPC 호출 방식 변경 |
| `src/components/preview_panel/Console.tsx` | `src/components/preview/Console.tsx` | atom 이름 변경 |
| `src/components/chat/SelectedComponentDisplay.tsx` | `src/components/preview/SelectedComponentDisplay.tsx` | atom 이름 변경 |
| `src/hooks/useCheckProblems.ts` | `src/hooks/useCheckProblems.ts` | Tauri invoke로 변경 |
| `src/hooks/useShortcut.ts` | `src/hooks/useShortcut.ts` | 거의 그대로 사용 가능 |
| `src/shared/problem_prompt.ts` | `src/lib/problemPrompt.ts` | 그대로 사용 가능 |

### 새로 만들 파일

| 파일 | 설명 |
|------|------|
| `src/atoms/previewAtoms.ts` | 프리뷰 관련 Jotai atoms |
| `src/types/preview.ts` | 타입 정의 |
| `src/components/preview/ErrorBanner.tsx` | 에러 배너 |
| `src/components/preview/ActionHeader.tsx` | 탭 헤더 |
| `src-tauri/src/commands/problems.rs` | TypeScript 에러 체크 |

### 수정할 파일

| 파일 | 수정 내용 |
|------|----------|
| `src/components/PreviewPanel.tsx` | ErrorBanner 추가, 메시지 리스너 추가 |
| `src/components/MaintenanceWorkspace.tsx` | 탭 구조 변경, 상태 관리 개선 |
| `src-tauri/src/preview_server.rs` | 스크립트 주입 미들웨어 추가 |
| `src-tauri/src/main.rs` | 새 커맨드 등록 |

---

## 5. 의존성 및 주의사항

### 새로 필요한 패키지
```bash
npm install jotai @tanstack/react-query
# 이미 있다면 스킵
```

### 주의사항

1. **Cross-Origin 제한**
   - 현재 anyon은 iframe에 직접 스크립트 주입 시도 → 실패 가능
   - dyad처럼 프록시 서버에서 HTML 응답에 주입하는 방식으로 변경 필요

2. **Tauri vs Electron 차이**
   - dyad: Electron IPC (`ipcRenderer.invoke`)
   - anyon: Tauri invoke (`@tauri-apps/api/core`)
   - 모든 IPC 호출 부분 변환 필요

3. **컴포넌트 ID 빌드 플러그인**
   - dyad는 이미 빌드 시 `data-dyad-id` 추가하는 플러그인 있음
   - anyon 프로젝트들에도 동일한 Vite 플러그인 적용 필요
   - 또는 런타임에 React DevTools처럼 파이버 트리에서 추출

4. **TypeScript 에러 체크**
   - 프로젝트에 TypeScript가 설치되어 있어야 함
   - `tsc --noEmit` 실행 또는 TypeScript API 직접 사용

5. **상태 관리 전환**
   - 현재 useState 기반 → Jotai atoms로 점진적 전환
   - 기존 로직 깨지지 않도록 주의

---

## 예상 일정

| Phase | 작업 | 예상 시간 |
|-------|------|----------|
| 1 | 기반 작업 (Jotai, 타입) | 1-2일 |
| 2 | 프록시 서버 + 스크립트 주입 | 2-3일 |
| 3 | 에러 배너 | 1일 |
| 4 | Problems 탭 | 2일 |
| 5 | Console 탭 | 0.5일 |
| 6 | 컴포넌트 선택기 개선 | 2-3일 |
| 7 | 탭 UI 개선 | 1일 |
| **총계** | | **9.5-12.5일** |

---

## 참고 파일 위치

**dyad-clone:**
```
/Users/cosmos/Documents/develop/dyad-clone/dyad/
├── worker/
│   ├── proxy_server.js
│   ├── dyad-shim.js
│   └── dyad-component-selector-client.js
├── src/
│   ├── atoms/
│   │   ├── appAtoms.ts
│   │   └── previewAtoms.ts
│   ├── components/preview_panel/
│   │   ├── PreviewPanel.tsx
│   │   ├── PreviewIframe.tsx
│   │   ├── Problems.tsx
│   │   └── Console.tsx
│   ├── hooks/
│   │   ├── useRunApp.ts
│   │   ├── useCheckProblems.ts
│   │   └── useShortcut.ts
│   └── shared/
│       └── problem_prompt.ts
```

**anyon-claude:**
```
/Users/cosmos/Documents/develop/anyon-maintain/anyon-claude/
├── src/
│   ├── components/
│   │   ├── PreviewPanel.tsx
│   │   └── MaintenanceWorkspace.tsx
│   └── lib/
│       └── previewSelector.ts
└── src-tauri/src/
    ├── commands/preview.rs
    └── preview_server.rs
```
