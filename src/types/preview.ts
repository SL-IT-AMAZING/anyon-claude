/**
 * Preview Mode Types
 * dyad-clone의 프리뷰 기능을 anyon에 이식하기 위한 타입 정의
 */

// 프리뷰 패널 모드
export type PreviewMode = 'preview' | 'code' | 'problems' | 'console';

// 앱 출력 타입
export interface AppOutput {
  type: 'stdout' | 'stderr' | 'info' | 'client-error' | 'hmr';
  message: string;
  timestamp: number;
  projectPath: string;
}

// 프리뷰 에러 메시지
export interface PreviewError {
  message: string;
  source: 'preview-app' | 'anyon-app' | 'dev-server';
  stack?: string;
}

// 컴포넌트 선택 정보 (소스 코드 위치 포함)
export interface ComponentSelection {
  id: string;           // "파일경로:줄:컬럼" 형식
  name: string;         // 컴포넌트 이름
  relativePath: string; // 상대 파일 경로
  lineNumber: number;   // 줄 번호
  columnNumber: number; // 컬럼 번호
}

// TypeScript 문제 (에러/경고)
export interface Problem {
  file: string;
  line: number;
  column: number;
  message: string;
  code: string;
  severity: 'error' | 'warning';
  snippet?: string;
}

// 문제 리포트
export interface ProblemReport {
  problems: Problem[];
  timestamp?: number;
}

// 선택된 요소 정보 (기존 PreviewPanel에서 사용)
export interface SelectedElement {
  tag: string;
  id: string | null;
  classes: string | null;
  selector: string;
  text: string | null;
  rect?: DOMRect;
  html?: string;
}

// 요소 액션 타입
export type ElementAction = 'edit' | 'remove' | 'add';

// 디바이스 프레임 타입
export type DeviceFrameType = 'mobile' | 'tablet' | 'laptop' | 'desktop';

// 디바이스 크기 정보
export interface DeviceSize {
  name: string;
  width: number;
  height: number;
  frameType: DeviceFrameType;
}

// 포트 정보
export interface PortInfo {
  port: number;
  url: string;
  alive: boolean;
}

// 파싱된 라우트 정보
export interface ParsedRoute {
  path: string;
  label: string;
}

// iframe 메시지 타입
export type IframeMessageType =
  | 'anyon-selector-ready'
  | 'anyon-element-hover'
  | 'anyon-element-selected'
  | 'anyon-selector-activated'
  | 'anyon-selector-deactivated'
  | 'anyon-component-selected'
  | 'anyon-component-deselected'
  | 'anyon-component-selector-initialized'
  | 'anyon-select-component-shortcut'
  | 'anyon-shim-loaded'
  | 'window-error'
  | 'unhandled-rejection'
  | 'iframe-sourcemapped-error'
  | 'build-error-report'
  | 'pushState'
  | 'replaceState';

// iframe에서 보내는 메시지 구조
export interface IframeMessage {
  type: IframeMessageType;
  payload?: {
    message?: string;
    stack?: string;
    reason?: string;
    newUrl?: string;
    oldUrl?: string;
    file?: string;
    frame?: string;
  };
  element?: SelectedElement;
  component?: {
    id: string;
    name: string;
  };
  componentId?: string;
}
