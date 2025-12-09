# UI Design Guide Validation Checklist

## 📋 문서 구조

- [ ] YAML frontmatter가 완전함
- [ ] service_type, platform 정보가 포함됨
- [ ] 선택된 라이브러리 목록이 메타데이터에 있음
- [ ] 색상 팔레트와 폰트 정보가 메타데이터에 있음
- [ ] 모든 섹션이 존재하고 placeholder가 없음

## 🔗 이전 문서 일관성

- [ ] PRD의 service_type, platform과 일치함
- [ ] UX Design의 모든 컴포넌트가 UI 스펙에 반영됨
- [ ] UX Design의 인터랙션 패턴이 UI에 정의됨
- [ ] PRD의 타겟 사용자에 맞는 디자인 스타일임

## 🎨 디자인 방향성

- [ ] 디자인 스타일이 명확히 정의됨
- [ ] 3-5개의 디자인 원칙이 있음
- [ ] 레퍼런스 서비스가 명시됨 (있다면)
- [ ] 스타일이 타겟 사용자와 서비스 유형에 적합함

## 🎨 색상 시스템

### Primary/Secondary/Accent Colors
- [ ] Primary color가 hex code로 명시됨
- [ ] Secondary color가 정의됨
- [ ] Accent color가 정의됨
- [ ] 색상들이 서로 조화로움
- [ ] 디자인 스타일에 부합함

### Semantic Colors
- [ ] Success color (초록 계열)
- [ ] Error color (빨강 계열)
- [ ] Warning color (주황/노랑 계열)
- [ ] Info color (파랑 계열)

### Neutral Colors
- [ ] White, Black 정의됨
- [ ] Gray scale (최소 5단계) 정의됨
- [ ] 모든 neutral color가 hex code로 명시됨

### Color Usage Guidelines
- [ ] 각 색상을 언제 사용하는지 명시됨
- [ ] 버튼, 링크, 배경 등의 색상 적용 규칙이 있음

## 📝 타이포그래피

### 폰트 선택
- [ ] Heading font가 명시됨
- [ ] Body font가 명시됨
- [ ] 폰트 라이선스가 확인됨 (무료/상업적 사용 가능)
- [ ] 한글 지원 여부가 확인됨 (한글 서비스의 경우)

### Type Scale
- [ ] 최소 6개 크기가 정의됨 (Display, H1-H4, Body, Caption)
- [ ] 각 크기가 px 또는 rem으로 명시됨
- [ ] Line height가 정의됨
- [ ] Font weight가 정의됨 (Regular, Medium, Bold 등)

### Typography Guidelines
- [ ] 제목과 본문 사용 가이드라인이 있음
- [ ] 행간과 자간 가이드라인이 있음

## 📦 선택된 UI 라이브러리

### 🔍 Web Search 수행 확인
- [ ] **Web Search가 실제로 수행됨** (필수!)
- [ ] 최소 4-8개 옵션이 검색되고 제시됨
- [ ] 각 옵션에 다음 정보가 포함됨:
  - [ ] GitHub 링크와 stars 수
  - [ ] npm 패키지명과 주간 다운로드 수
  - [ ] 최근 업데이트 날짜
  - [ ] 공식 문서 링크

### 기본 UI 라이브러리
- [ ] 명확한 라이브러리가 선택됨
- [ ] 선택 이유가 명시됨
- [ ] GitHub 링크가 포함됨
- [ ] npm 패키지명이 포함됨
- [ ] 현재 버전이 명시됨
- [ ] 공식 문서 링크가 포함됨
- [ ] 장점과 단점이 설명됨
- [ ] 플랫폼과 호환됨

### 비개발자 설명
- [ ] 각 라이브러리가 쉬운 언어로 설명됨
- [ ] 비유나 실제 예시가 포함됨
- [ ] 왜 이걸 선택했는지 이해 가능함

### 개발자용 상세 정보
- [ ] 설치 명령어가 포함됨
- [ ] 기본 사용 코드 예시가 있음
- [ ] Dependencies가 명시됨
- [ ] TypeScript 지원 여부가 명시됨

## 🧩 특수 컴포넌트 라이브러리

### 🔍 Web Search 수행 확인
- [ ] **각 특수 컴포넌트마다 Web Search 수행됨**
- [ ] UX Design의 요구사항에 맞는 컴포넌트 검색됨
- [ ] 각 컴포넌트마다 4-6개 옵션 제시됨

### UX 요구사항 커버리지
- [ ] UX Design에서 식별된 모든 특수 컴포넌트가 다뤄짐
- [ ] Rich Text Editor (필요시)
- [ ] Drag & Drop (필요시)
- [ ] Charts/Graphs (필요시)
- [ ] Calendar/Date Picker (필요시)
- [ ] Image Upload/Crop (필요시)
- [ ] Video Player (필요시)
- [ ] Map (필요시)
- [ ] Chat UI (필요시)
- [ ] Data Table (필요시)
- [ ] 기타 UX에서 필요한 컴포넌트들

### 각 특수 컴포넌트마다
- [ ] 명확한 라이브러리가 선택됨
- [ ] GitHub 링크와 stats가 포함됨
- [ ] npm 패키지명과 버전이 포함됨
- [ ] 문서 링크가 포함됨
- [ ] 사용 예시 코드가 있음
- [ ] 기본 UI 라이브러리와 호환성이 확인됨

## 🎨 컴포넌트 디자인 스펙

### 버튼
- [ ] 3가지 이상 variants 정의 (Primary, Secondary, etc.)
- [ ] 3가지 sizes 정의 (Small, Medium, Large)
- [ ] 모든 states 정의 (Default, Hover, Active, Disabled, Loading)
- [ ] 색상 정의 (정의된 color palette 사용)
- [ ] Border radius 정의
- [ ] Padding 정의
- [ ] Typography 정의 (font, size, weight)

### 입력 필드
- [ ] Input types 정의 (Text, Email, Password 등)
- [ ] States 정의 (Default, Focus, Error, Disabled)
- [ ] Label 위치 정의
- [ ] Error message 스타일 정의
- [ ] Border 스타일 정의
- [ ] 모바일 touch target 크기 적절 (최소 44px)

### 카드
- [ ] 배경색 정의
- [ ] Border 또는 shadow 정의
- [ ] Padding 정의
- [ ] Hover state 정의
- [ ] Corner radius 정의

### 네비게이션
- [ ] 플랫폼에 맞는 패턴 선택됨 (탭바, 사이드바 등)
- [ ] Active state 정의
- [ ] Hover state 정의 (해당시)
- [ ] 색상 적용 규칙 정의

### 모달/다이얼로그
- [ ] 배경 overlay 정의
- [ ] Modal 크기 정의
- [ ] 닫기 방법 정의
- [ ] 애니메이션 정의

### 추가 컴포넌트들
- [ ] UX Design의 모든 주요 컴포넌트가 스펙으로 정의됨
- [ ] 각 컴포넌트의 상태들이 모두 정의됨

## 📐 레이아웃 시스템

### 그리드 시스템 (웹)
- [ ] 그리드 구조 정의 (12-column 등)
- [ ] Container max-width 정의
- [ ] Gutter 정의
- [ ] Margin 정의

### 스페이싱 시스템
- [ ] Base unit 정의 (보통 4px 또는 8px)
- [ ] 최소 5단계 spacing 정의 (xs, sm, md, lg, xl)
- [ ] 각 spacing의 px/rem 값 명시
- [ ] 사용 가이드라인 포함

### 브레이크포인트 (반응형)
- [ ] 최소 3개 breakpoint 정의 (mobile, tablet, desktop)
- [ ] 각 breakpoint의 px 값 명시
- [ ] 각 breakpoint에서의 레이아웃 변화 설명

## 🎭 상태 및 인터랙션

### 인터랙션 상태
- [ ] Hover states 정의
- [ ] Active/Pressed states 정의
- [ ] Focus states 정의
- [ ] Disabled states 정의
- [ ] Loading states 정의

### 애니메이션 가이드라인
- [ ] 애니메이션 속도 정의 (fast, normal, slow)
- [ ] Easing 함수 정의 (ease-in, ease-out 등)
- [ ] 무엇을 animate 할지 명시
- [ ] 언제 animate 할지 명시
- [ ] prefers-reduced-motion 고려됨

### 트랜지션
- [ ] 페이지 전환 애니메이션 정의
- [ ] 모달 open/close 애니메이션 정의
- [ ] 기타 주요 트랜지션 정의

## 🌓 다크 모드 (해당시)

- [ ] 다크 모드 지원 여부 결정됨
- [ ] 다크 모드 색상 팔레트 정의됨 (지원 시)
- [ ] 배경, 텍스트, 카드 색상 정의됨
- [ ] 전환 방법 정의됨 (토글, 시스템 설정 등)
- [ ] 저장 방법 정의됨 (localStorage 등)

## ♿ 접근성

- [ ] 색상 대비율 기준 명시 (WCAG AA 이상)
- [ ] 키보드 네비게이션 가이드라인
- [ ] 스크린 리더 지원 고려사항
- [ ] 터치 영역 최소 크기 명시 (44px 이상)
- [ ] prefers-reduced-motion 고려
- [ ] 폼 접근성 가이드라인

## 📱 플랫폼별 가이드라인

### 모바일 (해당시)
- [ ] Safe area 고려
- [ ] 화면 방향 지원 명시
- [ ] Gesture 정의
- [ ] Status bar 스타일 정의
- [ ] Haptic feedback 정의

### 웹 (해당시)
- [ ] 반응형 breakpoint 전략
- [ ] Hover state 고려
- [ ] 키보드 단축키 정의
- [ ] 브라우저 지원 범위 명시

### 데스크톱 (해당시)
- [ ] Window controls 가이드라인
- [ ] 메뉴바 구조
- [ ] 키보드 단축키
- [ ] Drag & drop 가이드라인

## 🔧 구현 가이드

### 설치 가이드
- [ ] 모든 선택된 라이브러리의 설치 명령어 포함
- [ ] npm/yarn 명령어 정확함
- [ ] 의존성 설치 순서 명시 (필요시)

### 초기 설정
- [ ] Theme 설정 방법 설명
- [ ] Color token 설정 방법
- [ ] Font import 방법
- [ ] Global styles 설정

### 통합 방법
- [ ] Provider 설정 방법
- [ ] Theme 적용 방법
- [ ] 코드 예시 포함

### 커스터마이징 방법
- [ ] 색상 오버라이드 방법
- [ ] 컴포넌트 확장 방법
- [ ] Theme 확장 방법

## 📚 리소스 및 링크

### 라이브러리 요약 테이블
- [ ] 모든 선택된 라이브러리가 테이블로 정리됨
- [ ] 각 라이브러리의 버전 명시
- [ ] GitHub, npm, 문서 링크 포함
- [ ] 모든 링크가 작동함

### 참고 문서
- [ ] 각 라이브러리의 공식 문서 링크
- [ ] GitHub 레포지토리 링크
- [ ] 커뮤니티 리소스 (있다면)
- [ ] 튜토리얼/예시 링크 (있다면)

### 디자인 에셋
- [ ] 필요한 아이콘 라이브러리 추천
- [ ] 이미지/일러스트레이션 소스 제안
- [ ] 폰트 다운로드 링크

## 🔄 문서 일관성

- [ ] 색상 이름이 전체 문서에서 일관됨
- [ ] 컴포넌트 이름이 UX Design과 일치함
- [ ] 스페이싱 값이 일관되게 사용됨
- [ ] 폰트 크기가 type scale을 따름

## ✅ 검색 품질 (매우 중요!)

### Web Search 실행 확인
- [ ] **UI 라이브러리 검색이 실제로 수행됨**
- [ ] **최소 4-8개 옵션이 제시됨**
- [ ] **각 옵션에 최신 정보 포함** (2024년 기준)
- [ ] **GitHub stars, npm downloads가 실제 숫자로 제시됨**

### Web Fetch 실행 확인
- [ ] **선택된 라이브러리의 상세 정보가 fetch됨**
- [ ] **정확한 버전 번호가 포함됨**
- [ ] **실제 코드 예시가 포함됨**
- [ ] **문서 링크가 실제로 존재하고 접근 가능함**

### 정보의 정확성
- [ ] 모든 npm 패키지명이 정확함
- [ ] 모든 버전 번호가 최신임
- [ ] 모든 링크가 작동함
- [ ] 코드 예시가 해당 라이브러리의 실제 문법과 일치함

## 🚦 다음 단계 준비

- [ ] TRD에 필요한 모든 UI 라이브러리 정보 포함됨
- [ ] 기술 스택 선정에 필요한 플랫폼 정보 명확함
- [ ] 구현에 필요한 모든 리소스 링크가 제공됨
- [ ] 문서가 {default_output_file}에 저장됨

---

## 🔥 최종 품질 검증

### 비개발자 이해도 테스트
- [ ] 비개발자가 디자인 방향성을 이해할 수 있는가?
- [ ] 선택된 라이브러리가 무엇이고 왜 선택했는지 명확한가?
- [ ] 색상과 폰트 선택의 이유가 설명되었는가?

### 개발자 구현 가능성 테스트
- [ ] 개발자가 이 문서만으로 설치부터 시작할 수 있는가?
- [ ] 모든 필요한 패키지와 버전이 명시되었는가?
- [ ] 커스터마이징 방법이 충분히 설명되었는가?
- [ ] 코드 예시가 실제로 작동하는가?

### 검색 품질 테스트
- [ ] 제시된 옵션들이 실제로 인기 있고 최신인가?
- [ ] 각 라이브러리의 장단점이 정확한가?
- [ ] 선택된 라이브러리들이 서로 호환되는가?
- [ ] 모든 링크가 유효한가?

---

## 📝 검증 완료 후

모든 체크박스가 완료되면:
1. ✅ UI Design Guide가 완성됨
2. ✅ 실제 구현 가능한 오픈소스 선정 완료
3. ✅ TRD 워크플로우로 넘어갈 준비 완료
