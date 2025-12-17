# Architecture Validation Checklist

## 📋 문서 구조

- [ ] YAML frontmatter가 완전함
- [ ] architecture_pattern이 명시됨
- [ ] tech_stack 정보가 포함됨
- [ ] key_components_list가 메타데이터에 있음
- [ ] data_flow_paths_list가 메타데이터에 있음
- [ ] 모든 섹션이 존재하고 placeholder가 없음

## 🔗 이전 문서 일관성

- [ ] PRD의 service_type, platform, core_features가 반영됨
- [ ] UX Design의 모든 user flows가 data flows에 매핑됨
- [ ] UI Design Guide의 선택된 라이브러리가 아키텍처에 통합됨
- [ ] TRD의 **모든** 선택된 기술이 정확히 사용됨
- [ ] TRD의 기술과 **다른** 기술을 제안하지 않음

## 🔍 Web Search 실행 확인 (매우 중요!)

### Similar Services Architecture
- [ ] **Web Search 수행됨**
- [ ] **4-8개 유사 서비스의 아키텍처 검색됨**
- [ ] 각 서비스의 아키텍처 패턴 분석됨
- [ ] 실제 링크 (블로그 포스트, 케이스 스터디) 포함
- [ ] 우리 프로젝트에 적용 가능한 점 명시
- [ ] 각 서비스의 규모 정보 포함

### Architecture Patterns Research
- [ ] 선택된 아키텍처 패턴의 장단점 검색됨
- [ ] 실제 사용 사례 포함
- [ ] 최신 정보 (2024년 기준)

## 🏗️ 아키텍처 패턴

- [ ] 명확한 아키텍처 패턴 선택됨 (Monolithic/Microservices/Serverless/etc)
- [ ] 선택 이유가 PRD success_metrics 기반으로 설명됨
- [ ] 선택 이유가 팀 규모 기반으로 설명됨
- [ ] 선택 이유가 비용 기반으로 설명됨
- [ ] 비개발자를 위한 쉬운 설명 포함 (비유/스토리텔링)

## 📦 시스템 컴포넌트 정의

### Frontend Layer
- [ ] Frontend 컴포넌트들이 명확히 정의됨
- [ ] 각 컴포넌트의 책임(responsibilities)이 명시됨
- [ ] TRD의 frontend_framework 사용됨
- [ ] TRD의 UI 라이브러리 통합 설명됨
- [ ] 비개발자 설명 포함

### Backend Layer
- [ ] Backend 컴포넌트들이 명확히 정의됨
- [ ] API Server 역할 명시
- [ ] Authentication Service 명시 (TRD 기반)
- [ ] Background Jobs (필요시) 명시
- [ ] 각 컴포넌트의 책임 명시
- [ ] TRD의 backend_framework 사용됨
- [ ] 비개발자 설명 포함

### Database Layer
- [ ] Database 컴포넌트 정의됨
- [ ] TRD의 database 선택 사용됨
- [ ] Cache layer (필요시) 정의됨
- [ ] File storage 정의됨 (TRD 기반)
- [ ] 비개발자 설명 포함

### Infrastructure Layer
- [ ] Hosting platform 명시 (TRD 기반)
- [ ] CDN 전략 명시 (필요시)
- [ ] Monitoring 도구 명시 (TRD 기반)
- [ ] CI/CD 도구 명시
- [ ] 비개발자 설명 포함

## 🔄 데이터 흐름

### 비개발자 설명
- [ ] 전체 데이터 흐름을 쉬운 언어로 설명
- [ ] 스토리텔링 또는 비유 사용
- [ ] 그림/다이어그램 포함 (Mermaid 또는 ASCII)

### 주요 User Flow 매핑
- [ ] **UX Design의 모든 주요 user flows가 technical data flows로 변환됨**
- [ ] User authentication flow (signup, login, logout)
- [ ] PRD의 모든 핵심 기능 flows
- [ ] File upload flow (필요시)
- [ ] Payment flow (필요시)
- [ ] Real-time flow (필요시)

### 각 Data Flow마다
- [ ] Frontend 단계 명시
- [ ] Backend 단계 명시
- [ ] Database 상호작용 명시
- [ ] Third-party services 상호작용 명시 (필요시)
- [ ] 관련 컴포넌트 명시
- [ ] 비개발자 스토리텔링 설명 포함

## 🔐 인증 및 권한 관리

- [ ] Authentication flow 상세 정의됨
- [ ] TRD의 auth 솔루션 정확히 사용됨
- [ ] Registration flow 정의
- [ ] Login flow 정의
- [ ] Token/Session 관리 정의
- [ ] Password reset flow 정의
- [ ] Social login flow (필요시) 정의
- [ ] Authorization (권한) 체크 방식 정의
- [ ] 비개발자 비유 설명 포함

## ⭐ 기능별 아키텍처 (가장 중요!)

### PRD 기능 커버리지
- [ ] **PRD의 모든 핵심 기능이 아키텍처로 설명됨**
- [ ] 각 기능마다 사용되는 컴포넌트 명시
- [ ] 각 기능마다 API endpoints 명시
- [ ] 각 기능마다 database tables 프리뷰 제공
- [ ] 각 기능마다 third-party services 명시 (필요시)
- [ ] 각 기능마다 implementation pattern 설명
- [ ] 각 기능마다 비개발자 스토리텔링 설명

### 특수 기능 아키텍처
- [ ] Authentication 상세 아키텍처 (필요시)
- [ ] File upload/storage 아키텍처 (필요시)
- [ ] Email/notification 아키텍처 (필요시)
- [ ] Payment 처리 아키텍처 (필요시)
- [ ] Real-time 기능 아키텍처 (필요시)
- [ ] Search 기능 아키텍처 (필요시)

## 🌐 API 아키텍처

- [ ] API 타입 명시 (REST/GraphQL/tRPC - from TRD)
- [ ] Base URL 정의
- [ ] Authentication 방식 명시 (헤더 형식)
- [ ] API versioning 전략 정의
- [ ] 모든 주요 endpoints 카테고리별 정리
  - [ ] Auth endpoints
  - [ ] User endpoints
  - [ ] Feature endpoints (PRD 기능별)
- [ ] Error handling 표준 정의
- [ ] Request/Response 형식 정의
- [ ] Rate limiting 전략 명시
- [ ] CORS policy 명시
- [ ] 비개발자 설명 포함

## 💾 데이터베이스 아키텍처

- [ ] TRD의 database 시스템 사용됨
- [ ] Database hosting 명시 (TRD 기반)
- [ ] Connection strategy 정의 (pooling)
- [ ] Schema approach 명시 (TRD 기반)
- [ ] Migration tool 명시 (TRD 기반)
- [ ] 주요 테이블/컬렉션 프리뷰 제공
  - [ ] users 테이블
  - [ ] 각 PRD 기능별 테이블
- [ ] 테이블 간 관계 프리뷰
- [ ] Indexing 전략 정의
- [ ] Caching 전략 정의 (필요시)
- [ ] 비개발자 비유 설명 포함

## 🚀 배포 아키텍처

### 비개발자 설명
- [ ] 배포 과정을 쉬운 언어로 설명
- [ ] 개발/스테이징/프로덕션 환경 설명
- [ ] 스토리텔링 포함

### 배포 구조
- [ ] TRD의 hosting platform 사용됨
- [ ] Frontend 배포 방식 정의
- [ ] Backend 배포 방식 정의
- [ ] Database 배포 정의
- [ ] File storage 설정 정의
- [ ] Environment 구분 (dev/staging/prod)
- [ ] Environment variables 관리 방법
- [ ] Domain 및 SSL 설정 언급

### CI/CD Pipeline
- [ ] CI/CD 도구 선택됨
- [ ] Trigger 조건 정의 (git push 등)
- [ ] Pipeline 단계 정의:
  - [ ] Test 실행
  - [ ] Build
  - [ ] Deploy
  - [ ] Migration 실행
  - [ ] Smoke tests
- [ ] 알림 방법 정의

## 📈 확장성 아키텍처

### 비개발자 설명
- [ ] 확장성을 쉬운 언어로 설명
- [ ] 3단계 비유 (작은 식당 → 중형 → 대형) 사용
- [ ] 각 단계의 비용 명시 (TRD 기반)

### 확장성 전략
- [ ] **Phase 1 (MVP)** 정의:
  - [ ] 사용자 수 목표 (PRD success_metrics 기반)
  - [ ] 아키텍처 구성
  - [ ] 예상 비용 (TRD 기반)
- [ ] **Phase 2 (Growth)** 정의:
  - [ ] 사용자 수 목표
  - [ ] Scaling 전략 (horizontal/vertical)
  - [ ] 추가 컴포넌트 (read replicas, CDN, etc.)
  - [ ] 예상 비용 (TRD 기반)
- [ ] **Phase 3 (Scale)** 정의:
  - [ ] 사용자 수 목표
  - [ ] Advanced scaling (load balancer, sharding, etc.)
  - [ ] 예상 비용 (TRD 기반)
- [ ] Auto-scaling 규칙 정의 (CPU, memory, request rate)

## 🔒 보안 아키텍처

- [ ] Network security (HTTPS, CORS, Rate limiting)
- [ ] Authentication security (password hashing, token security)
- [ ] Authorization security (RBAC, permission checks)
- [ ] Data security (encryption at rest, in transit)
- [ ] API security (input validation, SQL injection prevention, XSS, CSRF)
- [ ] File upload security (필요시)
- [ ] Environment security (secrets management)
- [ ] Security monitoring 및 logging
- [ ] 비개발자 비유 설명 (공항 보안 등)

## 📊 모니터링 및 로깅

### Monitoring
- [ ] TRD의 monitoring 도구 사용됨
- [ ] Application monitoring 정의
- [ ] Infrastructure monitoring 정의
- [ ] User analytics 정의
- [ ] Alert 조건 정의 (critical, warning)

### Logging
- [ ] 로깅 대상 정의 (API requests, errors, auth events, etc.)
- [ ] Log levels 정의 (ERROR, WARN, INFO, DEBUG)
- [ ] Log storage 방법 정의
- [ ] Log retention 기간 정의

### 비개발자 설명
- [ ] 모니터링을 쉽게 설명 (CCTV, 온도계 비유)

## ⚡ 성능 최적화

### Frontend Performance
- [ ] Code splitting 전략
- [ ] Asset optimization (images, minification)
- [ ] Caching 전략
- [ ] CDN 사용 (필요시)

### Backend Performance
- [ ] Database optimization (indexes, connection pooling)
- [ ] Caching (Redis 등, TRD 기반)
- [ ] API optimization (compression, pagination)
- [ ] Background jobs (필요시)

### Performance Targets
- [ ] Page load time 목표 명시
- [ ] API response time 목표 명시

### 비개발자 설명
- [ ] 성능 최적화를 배달 서비스 비유로 설명

## 💰 비용 최적화 아키텍처

### 비개발자 설명
- [ ] 비용 최적화를 쉽게 설명
- [ ] 단계별 전략 설명

### Cost-Saving Strategies
- [ ] Phase 1 (MVP): FREE tier 최대화
  - [ ] FREE tier 한계 명시
  - [ ] 예상 비용 (TRD 기반)
- [ ] Phase 2 (Growth): Smart scaling
  - [ ] Auto-scaling 활용
  - [ ] 예상 비용 (TRD 기반)
- [ ] Phase 3 (Scale): Optimize spend
  - [ ] 장기 계약 할인 등
  - [ ] 예상 비용 (TRD 기반)

### Cost Monitoring
- [ ] Billing alerts 설정 방법
- [ ] Cost attribution 전략

## 🔧 개발 환경 아키텍처

- [ ] Prerequisites 명시 (Node.js, runtime, etc.)
- [ ] Repository 구조 설명
- [ ] Environment variables 예시
- [ ] Installation steps 제공
- [ ] Development workflow 설명:
  - [ ] Branch strategy
  - [ ] Code quality tools (linter, formatter)
  - [ ] Testing workflow
- [ ] 비개발자 설명 (요리사의 개인 주방 비유)

## 📱 플랫폼별 아키텍처 (해당시)

### 모바일 (해당시)
- [ ] Mobile framework 명시 (TRD 기반)
- [ ] App architecture 정의
- [ ] Platform-specific features 정의
- [ ] App distribution 전략

### 데스크톱 (해당시)
- [ ] Desktop framework 명시 (TRD 기반)
- [ ] App architecture 정의
- [ ] Platform-specific integrations
- [ ] Installer 전략

### 비개발자 설명
- [ ] 플랫폼 차이를 쉽게 설명

## 📚 다이어그램 및 시각화

- [ ] 전체 시스템 구성도 포함 (Mermaid 또는 ASCII)
- [ ] 주요 데이터 흐름 다이어그램 포함
- [ ] 배포 아키텍처 다이어그램 포함 (선택적)
- [ ] 다이어그램이 명확하고 이해하기 쉬움

## 🔄 문서 일관성

- [ ] 컴포넌트 이름이 전체 문서에서 일관됨
- [ ] 기술 스택이 TRD와 100% 일치함
- [ ] PRD의 모든 기능이 다뤄짐
- [ ] UX의 모든 flows가 data flows로 변환됨
- [ ] UI 라이브러리가 frontend architecture에 통합됨

## ✅ 검색 품질 (매우 중요!)

### Web Search 실행 확인
- [ ] **유사 서비스 아키텍처 검색이 실제로 수행됨**
- [ ] **4-8개 실제 서비스의 아키텍처가 분석됨**
- [ ] **각 서비스의 실제 링크 포함됨**
- [ ] **최신 정보 (2024년 기준)**

### 정보의 정확성
- [ ] 모든 기술이 TRD와 정확히 일치함
- [ ] 모든 링크가 작동함
- [ ] 모든 버전 번호가 정확함
- [ ] 아키텍처 패턴이 실제 프로젝트 규모에 적합함

## 💡 비개발자 이해도

### 스토리텔링 품질
- [ ] 모든 주요 섹션에 비개발자 설명 포함
- [ ] 실생활 비유 사용 (식당, 아파트, 배달, 도서관 등)
- [ ] "철수" 또는 실제 사용자 예시 포함
- [ ] 기술 용어마다 쉬운 설명 제공

### 이해 가능성
- [ ] 비개발자가 전체 시스템 구조를 이해할 수 있음
- [ ] 비개발자가 왜 이 아키텍처를 선택했는지 이해 가능
- [ ] 비개발자가 확장 전략을 이해 가능
- [ ] 비개발자가 비용 예측을 이해 가능

## 💻 개발자 구현 가능성

- [ ] 개발자가 이 문서만으로 시스템 구조 파악 가능
- [ ] 모든 컴포넌트의 책임이 명확함
- [ ] 모든 API endpoints가 정리됨
- [ ] 데이터베이스 테이블 프리뷰가 충분함
- [ ] 배포 방법이 명확함
- [ ] 개발 환경 설정 가이드가 완전함

## 🚦 다음 단계 준비

- [ ] ERD에 필요한 모든 database 정보 포함됨
- [ ] 데이터베이스 테이블/컬렉션 프리뷰 제공됨
- [ ] 테이블 간 관계 힌트 제공됨
- [ ] 문서가 {default_output_file}에 저장됨

---

## 🔥 최종 품질 검증

### 비개발자 이해도 테스트
- [ ] 비개발자가 "시스템이 어떻게 구성되는지" 이해할 수 있는가?
- [ ] 각 컴포넌트의 역할이 명확한가?
- [ ] 확장 전략이 이해 가능한가?
- [ ] 비용 예측이 명확한가?

### 개발자 구현 가능성 테스트
- [ ] 개발자가 이 문서만으로 아키텍처를 구현할 수 있는가?
- [ ] 모든 기술적 결정이 명확한가?
- [ ] API 구조가 충분히 정의되었는가?
- [ ] 배포 및 개발 환경 설정이 가능한가?

### 검색 품질 테스트
- [ ] 유사 서비스들이 실제로 관련성이 있는가?
- [ ] 아키텍처 패턴 선택이 합리적인가?
- [ ] 모든 링크가 유효한가?

### 일관성 테스트
- [ ] TRD의 기술 선택이 100% 준수되었는가?
- [ ] PRD의 모든 기능이 아키텍처로 구현되었는가?
- [ ] UX의 모든 flows가 data flows로 변환되었는가?

---

## 📝 검증 완료 후

모든 체크박스가 완료되면:
1. ✅ Architecture 문서가 완성됨
2. ✅ 비개발자와 개발자 모두 이해 가능
3. ✅ 실제 구현 가능한 아키텍처 설계 완료
4. ✅ ERD 워크플로우로 넘어갈 준비 완료
