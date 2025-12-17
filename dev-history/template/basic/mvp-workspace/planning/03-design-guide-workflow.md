---
title: Design Guide (UI 디자인 가이드) 워크플로우
description: PRD와 UX Design을 바탕으로 시각적 디자인 가이드라인과 UI 라이브러리를 결정하는 세 번째 단계
related_code:
  - src/constants/workflows/planning/startup-ui.ts
  - src/constants/planning.ts
ui_location: Basic > MVP Workspace > 기획문서 탭 > Design Guide
workflow_order: 3
dependencies:
  - prd.md
  - ui-ux.html
output_files:
  - anyon-docs/planning/design-guide.md
required_tools:
  - WebSearch (UI 라이브러리 조사용)
last_updated: 2024-12-17
---

# Design Guide (UI 디자인 가이드) 워크플로우

## 개요

Design Guide 워크플로우는 이전 문서들을 바탕으로 **시각적 디자인 가이드라인**을 만드는 세 번째 단계입니다.

### 이 워크플로우가 하는 일

1. PRD와 UX Design 문서 자동 분석
2. WebSearch로 최신 UI 라이브러리 조사
3. 색상, 폰트, 컴포넌트 스타일 결정
4. 개발 시 바로 사용 가능한 가이드 문서 생성

---

## 실행 조건

### 시작 조건
- `prd.md` 파일 존재
- `ui-ux.html` 파일 존재
- 사용자가 "Design Guide 작성 시작" 버튼 클릭

### 종료 조건
- `anyon-docs/planning/design-guide.md` 파일 생성 완료
- 자동으로 TRD 탭 활성화

---

## 워크플로우 상세 단계

### Step 0: 이전 문서 분석

AI가 **자동으로** 이전 문서들을 읽고 분석합니다.

```
[AI 내부 동작]
PRD에서 추출:
- 브랜드 톤/분위기
- 타겟 사용자 특성
- 서비스 유형

UX Design (ui-ux.html)에서 추출:
- 화면 구조
- 필요한 컴포넌트 종류
- 네비게이션 패턴
```

### Step 1: 디자인 방향 결정

```
앱의 전체적인 느낌은 어떤 스타일이 좋을까요?

1. 모던 미니멀 (추천) - 깔끔하고 여백 많음 (예: Notion, Linear)
2. 기업용 프로페셔널 - 신뢰감 주는 정돈된 스타일 (예: Salesforce)
3. 친근한 캐주얼 - 부드럽고 편안한 느낌 (예: Slack, Figma)
4. 대담하고 모던 - 강렬한 색상과 대비 (예: Vercel, Stripe)
5. 클래식/전통적 - 안정감 있는 보수적 스타일
6. 기타 (직접 설명)
```

### Step 2: UI 라이브러리 선택 (WebSearch 사용)

**중요**: AI가 자동으로 최신 UI 라이브러리를 웹 검색합니다.

```
[AI 내부 동작]
1. "2024 best React UI library" 검색
2. "shadcn ui vs radix ui vs material ui 비교" 검색
3. 각 라이브러리의 장단점 정리
4. 프로젝트 특성에 맞는 추천
```

**사용자에게 보여지는 결과**:
```
UI 라이브러리를 조사했습니다:

1. shadcn/ui (추천)
   - 장점: 커스터마이징 자유도 높음, 트렌디, Tailwind 기반
   - 단점: 컴포넌트를 직접 복사해서 사용
   - 적합: 독특한 디자인이 필요한 프로젝트

2. Radix UI + Tailwind
   - 장점: 접근성 우수, 헤드리스 컴포넌트
   - 단점: 스타일링 직접 필요
   - 적합: 커스텀 디자인 시스템

3. Material UI (MUI)
   - 장점: 풍부한 컴포넌트, 문서 좋음
   - 단점: 번들 크기 큼, 구글 느낌 강함
   - 적합: 빠른 개발, B2B 서비스

4. Ant Design
   - 장점: 엔터프라이즈급 컴포넌트
   - 단점: 중국어 문서 많음, 스타일 커스텀 어려움
   - 적합: 대시보드, 어드민 패널

어떤 것을 선택하시겠어요?
```

### Step 3: 색상 팔레트 결정

```
주요 색상(Primary Color)은 어떤 느낌이 좋을까요?

1. 블루 계열 (추천) - 신뢰, 전문성 (#3B82F6)
2. 그린 계열 - 성장, 자연, 돈 (#22C55E)
3. 퍼플 계열 - 창의성, 프리미엄 (#8B5CF6)
4. 오렌지/레드 계열 - 에너지, 열정 (#F97316)
5. 다크/뉴트럴 - 세련됨, 고급 (#1F2937)
6. 기타 (직접 입력)
```

### Step 4: 타이포그래피 결정

```
폰트 스타일을 선택해주세요:

1. Pretendard (추천) - 한글 최적화, 깔끔
2. Noto Sans KR - 구글 폰트, 무난
3. Spoqa Han Sans - 배달의민족 스타일
4. Apple SD Gothic Neo + SF Pro - 애플 스타일
5. 기타 (직접 입력)
```

### Step 5: Design Guide 문서 생성

모든 정보를 종합하여 `design-guide.md` 파일 생성

---

## AI 페르소나

### 역할
**UI/Visual 디자이너**

### 대화 원칙

1. **트렌드 반영**
   - 최신 디자인 트렌드 언급
   - 실제 인기 서비스 예시 제시

2. **실용적 선택**
   - 구현 난이도 고려
   - 유지보수 용이성 고려

3. **비개발자 친화적**
   - 색상은 헥스코드 + 이름 함께 제시
   - 라이브러리 설치 방법까지 안내

---

## 출력 파일 구조

### 파일 경로
`{프로젝트폴더}/anyon-docs/planning/design-guide.md`

### 문서 구조

```markdown
---
# YAML Frontmatter (개발 시 참조용)
ui_library: "shadcn/ui"
css_framework: "Tailwind CSS"
primary_color: "#3B82F6"
font_family: "Pretendard"
---

# [프로젝트명] Design Guide

## 1. 디자인 원칙
- 브랜드 톤: 모던 미니멀
- 핵심 가치: 깔끔함, 직관성, 일관성

## 2. UI 라이브러리
### 선택: shadcn/ui
- 이유: 커스터마이징 용이, Tailwind 기반
- 설치 방법:
  ```bash
  npx shadcn-ui@latest init
  ```

## 3. 색상 시스템
### Primary Colors
- Primary: #3B82F6 (파랑)
- Primary Hover: #2563EB

### Neutral Colors
- Background: #FFFFFF
- Text: #1F2937
- Border: #E5E7EB

### Semantic Colors
- Success: #22C55E
- Error: #EF4444
- Warning: #F59E0B

## 4. 타이포그래피
### 폰트
- 주 폰트: Pretendard
- 코드 폰트: JetBrains Mono

### 크기 체계
- H1: 2.25rem (36px)
- H2: 1.875rem (30px)
- H3: 1.5rem (24px)
- Body: 1rem (16px)
- Small: 0.875rem (14px)

## 5. 컴포넌트 가이드
### 버튼
- Primary: 배경 #3B82F6, 텍스트 흰색
- Secondary: 배경 투명, 테두리 #E5E7EB
- Ghost: 배경 투명, 호버 시 #F3F4F6

### 입력 필드
- 높이: 40px
- 테두리: 1px solid #E5E7EB
- 포커스: 테두리 #3B82F6

### 카드
- 배경: #FFFFFF
- 테두리: 1px solid #E5E7EB
- 그림자: 0 1px 3px rgba(0,0,0,0.1)
- 둥글기: 8px

## 6. 간격 시스템
- 기본 단위: 4px
- XS: 4px, SM: 8px, MD: 16px, LG: 24px, XL: 32px

## 7. 아이콘
- 라이브러리: Lucide Icons
- 기본 크기: 20px
- 색상: currentColor
```

---

## 이전 문서 참조 정보

| 참조 문서 | 가져오는 정보 |
|----------|-------------|
| PRD | 타겟 사용자 특성, 브랜드 톤 |
| UX Design | 필요한 컴포넌트 종류, 화면 복잡도 |

---

## 다음 단계 연결

### 자동 전환 조건
- `design-guide.md` 파일 생성 완료
- TRD 탭 활성화

### TRD가 참조하는 정보
- `ui_library`: 프론트엔드 기술 스택 결정에 영향
- `css_framework`: 빌드 설정에 영향
- 전체 디자인 복잡도 → 개발 난이도 추정

---

## AI를 위한 요약

**Design Guide 워크플로우 핵심**:
1. 프롬프트 위치: `src/constants/workflows/planning/startup-ui.ts`
2. 출력 파일: `anyon-docs/planning/design-guide.md`
3. 필수 도구: WebSearch (UI 라이브러리 조사)
4. 참조 문서: PRD, UX Design
5. AI 페르소나: UI/Visual 디자이너

**WebSearch 사용 시점**:
- Step 2에서 UI 라이브러리 비교 조사
- 최신 트렌드 확인 시

**YAML Frontmatter 중요 필드**:
- `ui_library`: 다음 단계(TRD)에서 기술 스택 결정에 사용
- `css_framework`: 개발 환경 설정에 사용
