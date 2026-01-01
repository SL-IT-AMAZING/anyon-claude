/**
 * Development Workflows - 공통 모듈
 *
 * 3개 워크플로우(orchestrator, executor, reviewer)에서 공통으로 사용하는 가이드
 */

// ===== UX 라우팅 가이드 (공통) =====
export const UX_ROUTING_GUIDE = `## 🧭 UX 라우팅 가이드

**핵심 규칙**: ui-ux.html의 showScreen() → React Router 매핑

\`\`\`
ui-ux.html: onclick="showScreen('target')"
    ↓
React: navigate('/target') 또는 <Link to="/target">
\`\`\`

**필수 체크**:
- 모든 버튼/링크에 navigate() 또는 Link 구현
- 탭바/사이드바 네비게이션 구조 반영
- CRUD 흐름 완성 (목록↔상세↔수정)
- 빈 핸들러 금지 (최소 toast 표시)
`;

// ===== 네비게이션 명세 템플릿 (티켓용) =====
export const NAVIGATION_SPEC_TEMPLATE = `### 🧭 네비게이션 명세

**ui-ux.html 참조**: {화면 section id}

**진입 경로**: {소스 화면} → {버튼} → 이 화면

**이동 경로**:
| 버튼 | 대상 | 구현 |
|------|------|------|
| {버튼명} | {대상 화면} | navigate('{경로}') |

**CRUD 흐름**: 목록→상세→수정→목록
`;

// ===== 라우팅 검증 패턴 (리뷰용) =====
export const ROUTING_VALIDATION_PATTERNS = `**올바른 패턴**:
- onClick={() => navigate('/path')}
- <Link to="/path">

**잘못된 패턴 (이슈)**:
- onClick={() => {}} → empty_handler
- onClick={console.log} → missing_navigation
- <Link to=""> → broken_link
`;
