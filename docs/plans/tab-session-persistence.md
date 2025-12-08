# 탭별 세션 기록 보존 구현 계획

## 목표
MVP 개발탭과 유지보수탭에서 각각의 채팅 기록을 독립적으로 보존하고, 드롭다운으로 이전 대화 선택 및 새 대화 시작 가능

## UI 디자인

```
┌─────────────────────────────────────────────────────┐
│  [← Back]  프로젝트명                               │
│            MVP Development                          │
│  ┌─────────────────────────────────────┐           │
│  │ 📝 현재 대화: 12/6 오후 3:42        │ ▼         │
│  └─────────────────────────────────────┘           │
│    ┌───────────────────────────────────┐           │
│    │ ➕ 새 대화 시작                    │           │
│    │ ─────────────────────────────────  │           │
│    │ 📝 12/6 오후 3:42 - PRD 작성...   │           │
│    │ 📝 12/5 오전 10:15 - 기능 추가... │           │
│    │ 📝 12/4 오후 5:30 - 버그 수정...  │           │
│    └───────────────────────────────────┘           │
└─────────────────────────────────────────────────────┘
```

## 구현 범위

### 1. SessionPersistenceService 확장
**파일:** `src/services/sessionPersistence.ts`

- `SessionRestoreData` 인터페이스에 `tabType` 필드 추가
- 탭별 세션 목록 조회 메서드:
  - `getSessionsForTab(projectPath, tabType): SessionRestoreData[]`
- 탭별 마지막 세션 저장/조회:
  - `saveLastSessionForTab(projectPath, tabType, sessionId)`
  - `getLastSessionForTab(projectPath, tabType)`
- localStorage 키 형식:
  - `anyon_tab_sessions_{projectPath}_{tabType}` (세션 목록)
  - `anyon_last_session_{projectPath}_{tabType}` (마지막 세션)

### 2. SessionDropdown 컴포넌트 생성 (신규)
**파일:** `src/components/SessionDropdown.tsx`

- Props:
  - `projectPath: string`
  - `tabType: 'mvp' | 'maintenance'`
  - `currentSessionId: string | null`
  - `onSessionSelect: (session: Session | null) => void` (null = 새 대화)
- 기능:
  - 드롭다운 트리거: 현재 세션 날짜/첫 메시지 미리보기
  - "새 대화 시작" 옵션
  - 이전 세션 목록 (날짜순 정렬)
  - 각 세션: 날짜 + 첫 메시지 truncate

### 3. ClaudeCodeSession 컴포넌트 수정
**파일:** `src/components/ClaudeCodeSession.tsx`

- props에 `tabType?: 'mvp' | 'maintenance'` 추가
- props에 `onSessionCreated?: (sessionId: string) => void` 콜백 추가
- 새 세션 생성 시 tabType과 함께 저장
- 세션 생성 완료 시 `onSessionCreated` 호출

### 4. MvpWorkspace 수정
**파일:** `src/components/MvpWorkspace.tsx`

- 헤더에 `SessionDropdown` 추가
- 현재 선택된 세션 상태 관리
- 세션 변경 시 `ClaudeCodeSession`에 새 session prop 전달
- 새 대화 선택 시 session prop을 undefined로

### 5. MaintenanceWorkspace 수정
**파일:** `src/components/MaintenanceWorkspace.tsx`

- 헤더에 `SessionDropdown` 추가
- MvpWorkspace와 동일한 로직

## 구현 순서

1. `SessionPersistenceService` 확장 (tabType + 세션 목록 관리)
2. `SessionDropdown` 컴포넌트 생성
3. `ClaudeCodeSession`에 tabType, onSessionCreated prop 추가
4. `MvpWorkspace`에 드롭다운 통합
5. `MaintenanceWorkspace`에 드롭다운 통합

## 데이터 흐름

```
[Workspace 마운트]
    ↓
getLastSessionForTab(projectPath, tabType)
    ↓
[마지막 세션으로 초기화]
    ↓
[사용자가 드롭다운에서 선택]
    ├─→ "새 대화" → setCurrentSession(null) → ClaudeCodeSession 리셋
    └─→ 기존 세션 → setCurrentSession(session) → ClaudeCodeSession에 session 전달
    ↓
[새 세션 생성 시 (onSessionCreated)]
    ↓
saveSessionForTab(projectPath, tabType, sessionData)
saveLastSessionForTab(projectPath, tabType, sessionId)
```

## 예상 변경/생성 파일
- `src/services/sessionPersistence.ts` (수정)
- `src/components/SessionDropdown.tsx` (신규)
- `src/components/ClaudeCodeSession.tsx` (수정)
- `src/components/MvpWorkspace.tsx` (수정)
- `src/components/MaintenanceWorkspace.tsx` (수정)
