import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { StateCreator } from 'zustand';
import type {
  PreviewMode,
  AppOutput,
  PreviewError,
  ComponentSelection,
  ProblemReport,
  SelectedElement,
  ParsedRoute,
} from '@/types/preview';

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
