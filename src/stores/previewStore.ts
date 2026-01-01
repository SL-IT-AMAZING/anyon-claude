import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { StateCreator } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type {
  PreviewMode,
  AppOutput,
  PreviewError,
  ComponentSelection,
  ProblemReport,
  SelectedElement,
  ParsedRoute,
} from '@/types/preview';

// Tauri 환경 체크
const isTauri = typeof window !== 'undefined' && (
  '__TAURI__' in window ||
  '__TAURI_INTERNALS__' in window ||
  window.location.protocol === 'tauri:'
);

// DevServerInfo 타입 (Rust와 일치)
interface DevServerInfo {
  project_path: string;
  pid: number;
  detected_port?: number;
  original_url?: string;
  proxy_port?: number;
  proxy_url?: string;
}

// 연결 상태 타입 정의
export type ConnectionState =
  | 'disconnected'      // 연결 안됨
  | 'starting'          // 서버 시작 중
  | 'port-detected'     // 포트 감지됨
  | 'connecting'        // 프록시 연결 중
  | 'verifying'         // 연결 검증 중
  | 'connected'         // 실제 연결됨 ✓
  | 'error';            // 연결 실패

interface PreviewState {
  // 프리뷰 모드
  previewMode: PreviewMode;
  isPreviewOpen: boolean;

  // 앱 출력 (Console 탭용)
  appOutputs: AppOutput[];

  // 에러 상태 (ErrorBanner용)
  previewError: PreviewError | undefined;

  // 선택된 컴포넌트들 (dyad 스타일 소스 위치 포함)
  selectedComponents: ComponentSelection[];

  // 선택된 요소 (기존 previewSelector 스타일)
  selectedElement: SelectedElement | null;

  // iframe 참조
  iframeRef: HTMLIFrameElement | null;

  // 컴포넌트 선택기 초기화 여부
  isComponentSelectorInitialized: boolean;

  // 선택기 활성화 여부
  isSelectorActive: boolean;

  // 문제 리포트 (Problems 탭용)
  problemReport: ProblemReport | null;
  isCheckingProblems: boolean;

  // 라우트 정보
  routes: ParsedRoute[];
  currentRoute: string;

  // 앱 URL 정보
  appUrl: string | null;
  originalUrl: string | null;

  // 로딩 상태
  isLoading: boolean;

  // Dev server 상태
  devServerRunning: boolean;
  devServerPort: number | null;
  devServerProxyUrl: string | null;
  packageManager: string | null;

  // 채팅에서 감지된 포트들
  detectedPorts: Array<{ port: number; timestamp: number; source: string }>;

  // 연결 상태 (세분화)
  connectionState: ConnectionState;
  connectionError: string | null;

  // Actions
  setPreviewMode: (mode: PreviewMode) => void;
  setIsPreviewOpen: (isOpen: boolean) => void;
  togglePreviewOpen: () => void;

  // 앱 출력 관련
  addAppOutput: (output: AppOutput) => void;
  clearAppOutputs: () => void;

  // 에러 관련
  setPreviewError: (error: PreviewError | undefined) => void;
  clearPreviewError: () => void;

  // 컴포넌트 선택 관련
  addSelectedComponent: (component: ComponentSelection) => void;
  removeSelectedComponent: (componentId: string) => void;
  clearSelectedComponents: () => void;

  // 요소 선택 관련 (기존 방식)
  setSelectedElement: (element: SelectedElement | null) => void;

  // iframe 관련
  setIframeRef: (ref: HTMLIFrameElement | null) => void;
  setComponentSelectorInitialized: (initialized: boolean) => void;
  setSelectorActive: (active: boolean) => void;

  // 문제 리포트 관련
  setProblemReport: (report: ProblemReport | null) => void;
  setIsCheckingProblems: (checking: boolean) => void;

  // 라우트 관련
  setRoutes: (routes: ParsedRoute[]) => void;
  setCurrentRoute: (route: string) => void;

  // 앱 URL 관련
  setAppUrl: (url: string | null) => void;
  setOriginalUrl: (url: string | null) => void;

  // 로딩 상태
  setIsLoading: (loading: boolean) => void;

  // Dev server 관련
  setDevServerRunning: (running: boolean) => void;
  setDevServerPort: (port: number | null) => void;
  setDevServerProxyUrl: (url: string | null) => void;
  setPackageManager: (pm: string | null) => void;

  // 감지된 포트 관련
  addDetectedPort: (port: number, source: string) => void;
  getLatestDetectedPort: () => number | null;
  clearDetectedPorts: () => void;

  // 연결 상태 관련
  setConnectionState: (state: ConnectionState) => void;
  setConnectionError: (error: string | null) => void;
  resetConnection: () => void;

  // iframe 메시지 전송
  postMessageToIframe: (message: { type: string; [key: string]: unknown }) => void;

  // 선택기 제어
  activateSelector: () => void;
  deactivateSelector: () => void;
}

const previewStore: StateCreator<
  PreviewState,
  [],
  [['zustand/subscribeWithSelector', never]],
  PreviewState
> = (set, get) => ({
  // Initial state
  previewMode: 'preview',
  isPreviewOpen: true,
  appOutputs: [],
  previewError: undefined,
  selectedComponents: [],
  selectedElement: null,
  iframeRef: null,
  isComponentSelectorInitialized: false,
  isSelectorActive: false,
  problemReport: null,
  isCheckingProblems: false,
  routes: [],
  currentRoute: '/',
  appUrl: null,
  originalUrl: null,
  isLoading: false,
  devServerRunning: false,
  devServerPort: null,
  devServerProxyUrl: null,
  packageManager: null,
  detectedPorts: [],
  connectionState: 'disconnected',
  connectionError: null,

  // 프리뷰 모드 설정
  setPreviewMode: (mode) => set({ previewMode: mode }),
  setIsPreviewOpen: (isOpen) => set({ isPreviewOpen: isOpen }),
  togglePreviewOpen: () => set((state) => ({ isPreviewOpen: !state.isPreviewOpen })),

  // 앱 출력 관련
  addAppOutput: (output) =>
    set((state) => ({
      appOutputs: [...state.appOutputs, output].slice(-500), // 최대 500개 유지
    })),
  clearAppOutputs: () => set({ appOutputs: [] }),

  // 에러 관련
  setPreviewError: (error) => set({ previewError: error }),
  clearPreviewError: () => set({ previewError: undefined }),

  // 컴포넌트 선택 관련
  addSelectedComponent: (component) =>
    set((state) => {
      // 이미 선택된 컴포넌트인지 확인
      if (state.selectedComponents.some((c) => c.id === component.id)) {
        return state;
      }
      return {
        selectedComponents: [...state.selectedComponents, component],
      };
    }),

  removeSelectedComponent: (componentId) =>
    set((state) => ({
      selectedComponents: state.selectedComponents.filter((c) => c.id !== componentId),
    })),

  clearSelectedComponents: () => {
    const { iframeRef } = get();
    if (iframeRef?.contentWindow) {
      iframeRef.contentWindow.postMessage(
        { type: 'clear-anyon-component-overlays' },
        '*'
      );
    }
    set({ selectedComponents: [] });
  },

  // 요소 선택 관련 (기존 방식)
  setSelectedElement: (element) => set({ selectedElement: element }),

  // iframe 관련
  setIframeRef: (ref) => set({ iframeRef: ref }),
  setComponentSelectorInitialized: (initialized) =>
    set({ isComponentSelectorInitialized: initialized }),
  setSelectorActive: (active) => set({ isSelectorActive: active }),

  // 문제 리포트 관련
  setProblemReport: (report) => set({ problemReport: report }),
  setIsCheckingProblems: (checking) => set({ isCheckingProblems: checking }),

  // 라우트 관련
  setRoutes: (routes) => set({ routes }),
  setCurrentRoute: (route) => set({ currentRoute: route }),

  // 앱 URL 관련
  setAppUrl: (url) => set({ appUrl: url }),
  setOriginalUrl: (url) => set({ originalUrl: url }),

  // 로딩 상태
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Dev server 관련
  setDevServerRunning: (running) => set({ devServerRunning: running }),
  setDevServerPort: (port) => set({ devServerPort: port }),
  setDevServerProxyUrl: (url) => set({ devServerProxyUrl: url, appUrl: url }),
  setPackageManager: (pm) => set({ packageManager: pm }),

  // 감지된 포트 관련
  addDetectedPort: (port, source) =>
    set((state) => {
      // 이미 같은 포트가 있으면 타임스탬프만 업데이트
      const existingIndex = state.detectedPorts.findIndex((p) => p.port === port);
      if (existingIndex >= 0) {
        const updated = [...state.detectedPorts];
        updated[existingIndex] = { port, timestamp: Date.now(), source };
        return { detectedPorts: updated };
      }
      // 새 포트 추가 (최대 10개 유지)
      return {
        detectedPorts: [
          ...state.detectedPorts,
          { port, timestamp: Date.now(), source },
        ].slice(-10),
      };
    }),

  getLatestDetectedPort: () => {
    const { detectedPorts } = get();
    if (detectedPorts.length === 0) return null;
    // 가장 최근 타임스탬프의 포트 반환
    const sorted = [...detectedPorts].sort((a, b) => b.timestamp - a.timestamp);
    return sorted[0].port;
  },

  clearDetectedPorts: () => set({ detectedPorts: [] }),

  // 연결 상태 관련
  setConnectionState: (connectionState) => set({ connectionState }),
  setConnectionError: (connectionError) => set({ connectionError }),
  resetConnection: () => set({
    connectionState: 'disconnected',
    connectionError: null,
    devServerRunning: false,
    devServerPort: null,
    devServerProxyUrl: null,
  }),

  // iframe 메시지 전송
  postMessageToIframe: (message) => {
    const { iframeRef } = get();
    if (iframeRef?.contentWindow) {
      iframeRef.contentWindow.postMessage(message, '*');
    }
  },

  // 선택기 활성화
  activateSelector: () => {
    const { iframeRef } = get();
    // isComponentSelectorInitialized 조건 제거 - iframe이 있으면 시도
    if (iframeRef?.contentWindow) {
      iframeRef.contentWindow.postMessage(
        { type: 'activate-anyon-component-selector' },
        '*'
      );
      set({ isSelectorActive: true });
    }
  },

  // 선택기 비활성화
  deactivateSelector: () => {
    const { iframeRef } = get();
    if (iframeRef?.contentWindow) {
      iframeRef.contentWindow.postMessage(
        { type: 'deactivate-anyon-component-selector' },
        '*'
      );
    }
    set({ isSelectorActive: false });
  },
});

export const usePreviewStore = create<PreviewState>()(
  subscribeWithSelector(previewStore)
);

// 선택자 함수들 (성능 최적화용)
export const selectPreviewMode = (state: PreviewState) => state.previewMode;
export const selectIsPreviewOpen = (state: PreviewState) => state.isPreviewOpen;
export const selectAppOutputs = (state: PreviewState) => state.appOutputs;
export const selectPreviewError = (state: PreviewState) => state.previewError;
export const selectSelectedComponents = (state: PreviewState) => state.selectedComponents;
export const selectProblemReport = (state: PreviewState) => state.problemReport;
export const selectIsSelectorActive = (state: PreviewState) => state.isSelectorActive;
export const selectConnectionState = (state: PreviewState) => state.connectionState;
export const selectConnectionError = (state: PreviewState) => state.connectionError;

/**
 * 백엔드(Rust)에서 개발 서버 상태를 복구하는 함수
 * 컴포넌트 마운트 시 호출하여 기존 실행 중인 서버 연결 복구
 */
export const initializeFromBackend = async (projectPath: string): Promise<boolean> => {
  if (!isTauri || !projectPath) return false;

  try {
    const info = await invoke<DevServerInfo | null>('get_dev_server_info', { projectPath });

    if (info && info.proxy_url) {
      console.log('[PreviewStore] Restoring dev server state from backend:', info);

      const store = usePreviewStore.getState();
      store.setDevServerRunning(true);
      store.setDevServerPort(info.detected_port || null);
      store.setDevServerProxyUrl(info.proxy_url);
      store.setConnectionState('connected');
      store.setConnectionError(null);

      return true;
    }

    return false;
  } catch (e) {
    console.warn('[PreviewStore] Failed to initialize from backend:', e);
    return false;
  }
};
