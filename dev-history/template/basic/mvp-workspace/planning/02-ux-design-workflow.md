---
title: UX Design 워크플로우
description: PRD를 바탕으로 인터랙티브 HTML 목업(ui-ux.html)을 생성하는 두 번째 단계
related_code:
  - src/constants/workflows/planning/startup-ux.ts
  - src/constants/planning.ts
ui_location: Basic > MVP Workspace > 기획문서 탭 > UX Design
workflow_order: 2
dependencies:
  - prd.md (PRD 문서 필수)
output_files:
  - anyon-docs/planning/ui-ux.html
required_skills:
  - frontend-design (와이어프레임 생성용)
last_updated: 2024-12-17
---

# UX Design 워크플로우

## 개요

UX Design 워크플로우는 PRD를 바탕으로 **클릭 가능한 HTML 프로토타입**을 생성하는 두 번째 단계입니다.

### 이 워크플로우가 하는 일

1. PRD 문서를 자동으로 읽고 분석
2. 사용자와 대화하며 화면 구성 결정
3. **인터랙티브 HTML 목업** 생성 (클릭 가능!)
4. 그레이스케일 와이어프레임 형태로 출력

### 출력물 특징

**중요**: 이 워크플로우의 출력물은 `.md` 파일이 아니라 **`.html` 파일**입니다.

```
출력 파일: anyon-docs/planning/ui-ux.html

특징:
- 모든 버튼이 실제로 클릭 가능
- 모든 링크가 연결되어 있음
- 전체 사용자 플로우를 직접 체험 가능
- 그레이스케일 와이어프레임 스타일
```

---

## 실행 조건

### 시작 조건
- `prd.md` 파일이 존재해야 함
- 사용자가 "UX Design 작성 시작" 버튼 클릭

### 종료 조건
- `anyon-docs/planning/ui-ux.html` 파일 생성 완료
- 자동으로 Design Guide 탭 활성화

---

## 워크플로우 상세 단계

### Step 0: PRD 로드 및 분석

AI가 **자동으로** PRD 문서를 읽고 핵심 정보를 추출합니다.

```
[AI 내부 동작]
PRD의 YAML frontmatter에서 추출:
- project_name: 프로젝트명
- service_type: 서비스 유형 (SaaS, 이커머스 등)
- platform: 플랫폼 (Web, Mobile)
- core_features: 핵심 기능 목록
- target_users_summary: 타겟 사용자
- competitors_list: 경쟁사 목록
```

**사용자에게 보여지는 메시지**:
```
PRD 문서를 분석했습니다!

프로젝트: [프로젝트명]
서비스 유형: [SaaS/이커머스/...]
핵심 기능: [기능1, 기능2, 기능3]

이 정보를 바탕으로 UX를 설계하겠습니다.
```

### Step 1: 메인 사용자 플로우 정의

```
사용자가 앱에서 가장 자주 하는 행동은 무엇인가요?

1. 콘텐츠 탐색/검색 (추천)
2. 새 항목 생성/등록
3. 기존 데이터 확인/관리
4. 커뮤니케이션/메시지
5. 거래/결제
6. 기타 (직접 입력)
```

**AI 판단 로직**:
- PRD의 `service_type`에 따라 추천 옵션 결정
- 이커머스 → "상품 검색/구매" 추천
- SaaS → "대시보드 확인" 추천

### Step 2: 화면 구성 결정

```
다음 화면들이 필요해 보입니다. 맞나요?

✅ 필수 화면:
- 로그인/회원가입
- 메인 대시보드
- [핵심기능1] 화면
- [핵심기능2] 화면

➕ 추가 가능 화면:
- 설정/마이페이지
- 검색 결과
- 상세 보기

필요 없는 화면이 있거나, 추가할 화면이 있나요?
```

### Step 3: 네비게이션 구조 결정

```
네비게이션 구조를 어떻게 할까요?

1. 상단 헤더 네비게이션 (웹 표준형)
2. 하단 탭 바 (모바일 앱 스타일)
3. 사이드바 네비게이션 (대시보드 스타일) (추천)
4. 햄버거 메뉴 (미니멀)
5. 기타 (직접 설명)
```

### Step 4: 각 화면 레이아웃 결정

각 화면에 대해:

```
[대시보드] 화면의 레이아웃을 정해주세요:

1. 카드 그리드 형태 (요약 정보 카드들)
2. 리스트/테이블 형태 (데이터 나열)
3. 차트/그래프 중심 (분석 대시보드)
4. 히어로 섹션 + 요약 (랜딩 스타일)
5. 기타 (직접 설명)
```

### Step 5: HTML 목업 생성

모든 정보를 종합하여 `ui-ux.html` 파일 생성

---

## 와이어프레임 스타일 규칙

### 필수 규칙 (frontend-design 스킬 오버라이드)

```yaml
wireframe_rules:
  # 이모지 금지
  no_emojis: true

  # 그레이스케일만 사용
  colors_allowed:
    - "#000"   # 검정
    - "#333"   # 진회색
    - "#666"   # 회색
    - "#999"   # 연회색
    - "#ccc"   # 더 연한 회색
    - "#eee"   # 밝은 회색
    - "#fff"   # 흰색

  # 색상 금지
  colors_forbidden:
    - 파랑, 빨강, 초록, 보라 등 모든 유채색

  # 스타일
  borders: "1px solid"
  focus: "구조와 흐름"
  ignore: "미적 요소, 애니메이션, 텍스처"
```

### 출력 HTML 특징

```html
<!-- 모든 버튼이 클릭 가능 -->
<button onclick="showScreen('dashboard')">대시보드</button>

<!-- 모든 링크가 연결됨 -->
<a href="#screen-detail">상세보기</a>

<!-- 화면 전환이 실제로 동작 -->
<div id="screen-login" class="screen active">...</div>
<div id="screen-dashboard" class="screen hidden">...</div>
```

---

## AI 페르소나

### 역할
**UX 디자인 전문가**

### 대화 원칙

1. **사용자 중심 사고**
   - "이 화면에서 사용자가 가장 먼저 찾을 것은 무엇일까요?"
   - "3번의 클릭 안에 핵심 기능에 도달할 수 있어야 합니다"

2. **구체적인 예시 제시**
   - "넷플릭스처럼 카드 형태로 콘텐츠를 보여줄까요?"
   - "노션처럼 사이드바 네비게이션을 쓸까요?"

3. **비개발자 친화적 설명**
   - 전문 용어 사용 시 바로 설명 추가
   - 실제 앱 예시로 개념 설명

---

## 출력 파일 구조

### 파일 경로
`{프로젝트폴더}/anyon-docs/planning/ui-ux.html`

### HTML 구조

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>[프로젝트명] - UX Wireframe</title>
  <style>
    /* 그레이스케일 와이어프레임 스타일 */
    * { font-family: system-ui, sans-serif; }
    .screen { display: none; }
    .screen.active { display: block; }
    button { background: #eee; border: 1px solid #ccc; }
    /* ... */
  </style>
</head>
<body>
  <!-- 화면 1: 로그인 -->
  <div id="screen-login" class="screen active">
    <h1>로그인</h1>
    <input type="email" placeholder="이메일">
    <input type="password" placeholder="비밀번호">
    <button onclick="showScreen('dashboard')">로그인</button>
  </div>

  <!-- 화면 2: 대시보드 -->
  <div id="screen-dashboard" class="screen">
    ...
  </div>

  <!-- 화면 전환 스크립트 -->
  <script>
    function showScreen(screenId) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById('screen-' + screenId).classList.add('active');
    }
  </script>
</body>
</html>
```

---

## PRD 참조 정보

UX Design이 PRD에서 읽어오는 정보:

| PRD 필드 | UX Design에서 사용 |
|---------|-------------------|
| `service_type` | 서비스 유형에 맞는 UI 패턴 제안 |
| `platform` | 웹/모바일에 따른 레이아웃 결정 |
| `core_features` | 화면별 기능 배치 |
| `target_user` | 사용자 특성에 맞는 UX 결정 |
| `mvp_features` | MVP에 포함할 화면 결정 |

---

## 다음 단계 연결

### 자동 전환 조건
- `ui-ux.html` 파일이 생성되면
- Design Guide 탭 활성화
- "다음: Design Guide 작성하기" 버튼 표시

### Design Guide가 참조하는 정보
- 화면 구성 및 레이아웃
- 컴포넌트 종류 (버튼, 입력창, 카드 등)
- 네비게이션 구조

---

## AI를 위한 요약

**UX Design 워크플로우 핵심**:
1. 프롬프트 위치: `src/constants/workflows/planning/startup-ux.ts`
2. 출력 파일: `anyon-docs/planning/ui-ux.html` (HTML!)
3. 필수 스킬: `frontend-design` (와이어프레임 모드)
4. PRD 자동 로드: YAML frontmatter 파싱
5. 스타일: 그레이스케일만, 이모지 금지

**특이사항**:
- 다른 워크플로우는 `.md` 출력, 이것만 `.html` 출력
- 모든 버튼/링크가 실제로 클릭 가능해야 함
- frontend-design 스킬의 색상/테마 추천을 무시해야 함
