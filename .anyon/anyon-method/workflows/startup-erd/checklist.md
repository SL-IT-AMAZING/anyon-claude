# ERD Validation Checklist

## 📋 문서 구조

- [ ] YAML frontmatter가 완전함
- [ ] database_type이 명시됨 (TRD와 일치)
- [ ] tables_list가 메타데이터에 있음
- [ ] relationships_list가 메타데이터에 있음
- [ ] indexes_list가 메타데이터에 있음
- [ ] table_count가 정확함
- [ ] 모든 섹션이 존재하고 placeholder가 없음

## 🔗 이전 문서 일관성

- [ ] PRD의 모든 core_features가 테이블로 구현됨
- [ ] UX Design의 모든 데이터 요구사항이 테이블에 반영됨
- [ ] UI Design Guide의 데이터 관련 컴포넌트가 지원됨
- [ ] TRD의 database 선택이 정확히 사용됨
- [ ] Architecture의 테이블 프리뷰가 완전한 스키마로 확장됨

## 🔍 Web Search 실행 확인 (매우 중요!)

### Similar Services ERD
- [ ] **Web Search 수행됨**
- [ ] **4-8개 유사 서비스 ERD 검색됨**
- [ ] 각 서비스의 주요 테이블과 관계 분석됨
- [ ] 실제 링크 (블로그, GitHub schema.sql) 포함
- [ ] 우리 프로젝트에 적용 가능한 패턴 명시
- [ ] 차이점과 이유 설명됨

### ERD Best Practices Research
- [ ] Database design patterns 검색됨
- [ ] Indexing strategies 검색됨
- [ ] Normalization best practices 확인됨 (SQL의 경우)

## 🎯 데이터베이스 설계 원칙

- [ ] 3-5개의 명확한 설계 원칙 정의됨
- [ ] 원칙이 database type에 맞음 (SQL vs NoSQL)
- [ ] 원칙이 프로젝트 규모와 특성에 맞음
- [ ] Normalization 전략 명시 (SQL의 경우)
- [ ] Performance vs Flexibility 균형 설명
- [ ] 비개발자를 위한 쉬운 설명 포함

## 📋 테이블 완전성

### Core Tables (필수)
- [ ] `users` 테이블 존재
- [ ] Authentication 테이블 존재 (sessions/tokens)
- [ ] 모든 core tables에 id, created_at, updated_at 포함

### Feature Tables
- [ ] **PRD의 모든 핵심 기능이 테이블로 구현됨**
- [ ] UX flows에서 생성/조회/수정/삭제되는 모든 데이터가 테이블 보유
- [ ] Social features (댓글, 좋아요, 팔로우 등) 테이블 포함 (필요시)
- [ ] Notifications 테이블 포함 (필요시)
- [ ] Files/Media metadata 테이블 포함 (필요시)
- [ ] Transactions/Orders 테이블 포함 (필요시)

### Junction Tables
- [ ] 모든 Many-to-Many 관계에 대한 junction table 존재
- [ ] Junction tables에 적절한 composite unique index 포함

## 🔧 각 테이블 상세 스키마

### 모든 테이블마다 다음이 정의됨:

- [ ] **Table Name** (명확하고 복수형 권장)
- [ ] **Purpose** (1문장 설명)
- [ ] **비개발자 설명** (한국어 비유/스토리텔링)
- [ ] **Columns** (완전한 리스트):
  - [ ] Column name
  - [ ] Data type (크기 포함 - VARCHAR(255))
  - [ ] Constraints (NOT NULL, NULLABLE, DEFAULT)
  - [ ] Description
- [ ] **Indexes** (모든 인덱스 명시):
  - [ ] PRIMARY KEY
  - [ ] UNIQUE indexes
  - [ ] Foreign key indexes
  - [ ] Query performance indexes
- [ ] **Constraints** (모든 제약조건):
  - [ ] PRIMARY KEY
  - [ ] FOREIGN KEYs with ON DELETE action
  - [ ] UNIQUE constraints
  - [ ] CHECK constraints
  - [ ] DEFAULT values
- [ ] **Sample Data** (최소 2-3 rows)

### `users` Table (특별 체크)
- [ ] id (PRIMARY KEY)
- [ ] email (UNIQUE, NOT NULL)
- [ ] password_hash 또는 oauth_id (auth 방식에 따라)
- [ ] name/username (NOT NULL)
- [ ] Profile fields (PRD에서 필요한 것들)
- [ ] role (권한 필요시)
- [ ] email_verified (이메일 인증 필요시)
- [ ] created_at, updated_at
- [ ] 적절한 indexes (email, username, role)
- [ ] CHECK constraints (email format, role enum)

### Authentication Table (특별 체크)
- [ ] TRD의 auth 솔루션에 맞는 테이블 설계
- [ ] JWT → refresh_tokens table
- [ ] Session → sessions table
- [ ] user_id FOREIGN KEY
- [ ] expires_at 필드
- [ ] Index on user_id

## 🔗 테이블 관계 (Relationships)

### 모든 관계가 문서화됨:
- [ ] **관계 타입 명시** (One-to-Many, Many-to-Many, One-to-One)
- [ ] **설명** (무슨 관계인지)
- [ ] **구현 방법** (FOREIGN KEY 또는 junction table)
- [ ] **ON DELETE 동작** (CASCADE, SET NULL, RESTRICT)
- [ ] **비개발자 설명** (비유 포함)
- [ ] **쿼리 예시** (실제 SQL 예시)

### 일반적인 관계 체크:
- [ ] User → [Feature entities] (One-to-Many)
- [ ] User → Comments/Reactions (One-to-Many)
- [ ] User ↔ User relationships (Many-to-Many - follows, friends, blocks)
- [ ] Posts/Content → Comments (One-to-Many)
- [ ] Posts ↔ Tags (Many-to-Many - if tagging)
- [ ] User → Sessions/Tokens (One-to-Many)

### Foreign Key 완전성:
- [ ] 모든 FOREIGN KEY에 ON DELETE 동작 명시됨
- [ ] ON DELETE 선택이 합리적임:
  - User 삭제 → Posts CASCADE (사용자 삭제하면 게시물도 삭제)
  - Post 삭제 → Comments CASCADE (게시물 삭제하면 댓글도 삭제)
  - User 삭제 → Comments SET NULL or CASCADE (케이스 바이 케이스)

## 🔑 인덱싱 전략

### Primary Keys
- [ ] 모든 테이블에 PRIMARY KEY 존재
- [ ] ID type 일관성 (UUID vs SERIAL)

### Foreign Keys
- [ ] 모든 FOREIGN KEY 필드에 INDEX 존재
- [ ] 이유: JOIN 성능

### Unique Fields
- [ ] email, username 등에 UNIQUE INDEX
- [ ] Composite unique indexes (junction tables)

### Performance Indexes
- [ ] UX flows에서 자주 조회하는 필드에 INDEX
- [ ] ORDER BY에 사용되는 필드 (created_at DESC)
- [ ] WHERE 절에 자주 사용되는 필드
- [ ] Composite indexes (여러 필드 함께 검색)

### Full-text Indexes (필요시)
- [ ] Search 기능이 있으면 full-text index
- [ ] Title, content 필드 등

### Index Trade-offs 설명
- [ ] 왜 이 필드들에 인덱스를 만들었는지 설명
- [ ] Read 성능 vs Write 성능 trade-off 언급
- [ ] 비개발자 설명 (책 색인 비유)

## 🔒 제약조건 (Constraints)

### 모든 제약조건 문서화:
- [ ] PRIMARY KEY constraints
- [ ] FOREIGN KEY constraints (with ON DELETE)
- [ ] UNIQUE constraints
- [ ] NOT NULL constraints
- [ ] CHECK constraints (enum values, ranges, formats)
- [ ] DEFAULT values

### CHECK Constraints 품질:
- [ ] Enum fields (status, role)에 CHECK IN (...)
- [ ] Numeric ranges (age >= 18, price > 0)
- [ ] Format validation (email LIKE '%@%')
- [ ] Self-reference prevention (follower_id != following_id)

### 비개발자 설명:
- [ ] 제약조건이 무엇인지 쉽게 설명
- [ ] 왜 필요한지 (데이터 정확성)
- [ ] 실생활 비유 포함

## 📊 데이터 타입

### 모든 필드의 데이터 타입 적절함:
- [ ] ID: UUID or SERIAL (일관성)
- [ ] Email: VARCHAR(255)
- [ ] Password: VARCHAR(255) or TEXT (해시 저장)
- [ ] Short text: VARCHAR(n) with appropriate size
- [ ] Long text: TEXT
- [ ] Numbers: INTEGER, BIGINT, DECIMAL 적절히 선택
- [ ] Money: DECIMAL(10,2) or INTEGER (cents)
- [ ] Booleans: BOOLEAN
- [ ] Timestamps: TIMESTAMP (WITH TIME ZONE if PostgreSQL)
- [ ] Files: TEXT (URL 저장)
- [ ] File sizes: BIGINT (bytes)
- [ ] JSON data: JSON or JSONB (if needed)

### Data Type 설명 섹션:
- [ ] 주요 데이터 타입 선택 이유 설명
- [ ] Size 결정 근거
- [ ] 비개발자를 위한 엑셀 비유 설명

## 🔄 Migration 전략

### Migration 문서화:
- [ ] TRD의 migration tool 사용됨
- [ ] Migration files 구조 설명
- [ ] 샘플 migration 코드 포함 (최소 1개 테이블)
- [ ] SQL 또는 ORM DSL 형식 (TRD tool에 따라)
- [ ] Execution 명령어 제공
- [ ] Best practices 명시:
  - [ ] Never edit existing migrations
  - [ ] Test on staging first
  - [ ] Backup before production migrations
  - [ ] Keep migrations small

### Seeding 전략:
- [ ] Seed data 접근 방식 설명
- [ ] Development vs Production seeding
- [ ] 샘플 seed 스크립트 (선택적)

### 비개발자 설명:
- [ ] Migration을 건물 공사 단계에 비유
- [ ] 왜 필요한지 설명

## 💾 샘플 데이터

### 모든 주요 테이블에 샘플 데이터:
- [ ] users (최소 2-3 users)
- [ ] 각 feature table (최소 2-3 rows)
- [ ] Junction tables (관계 예시)
- [ ] 현실적인 데이터 (테스트용이지만 realistic)

### 샘플 데이터 품질:
- [ ] 관계가 실제로 연결됨 (valid foreign keys)
- [ ] 다양한 케이스 포함 (published/draft, verified/unverified 등)
- [ ] 쿼리 예시와 매칭됨

### 쿼리 예시:
- [ ] 샘플 데이터를 사용한 쿼리 예시 제공
- [ ] 일반적인 조회 패턴 (user's posts, post's comments, followers, etc.)

## 📊 데이터 볼륨 예측

### PRD success_metrics 기반:
- [ ] Target users (Year 1, Year 3) 기반 예측
- [ ] 각 테이블의 row 예상 개수
- [ ] 각 테이블의 평균 row size
- [ ] 총 database size 예측 (Year 1, Year 3)

### 계산 완전성:
- [ ] users 테이블 볼륨
- [ ] 모든 주요 feature tables 볼륨
- [ ] Comments/reactions 볼륨
- [ ] Files metadata 볼륨 (파일 자체는 S3)
- [ ] 총합 계산 정확함

### File Storage 분리:
- [ ] 파일 자체는 S3/CDN (별도 계산)
- [ ] Metadata만 DB에 저장
- [ ] S3 비용 예측 (TRD 참조)

### Free Tier 확인:
- [ ] TRD database plan의 한계와 비교
- [ ] 예측이 FREE tier 내인지 또는 언제 유료 전환 필요한지

### 비개발자 설명:
- [ ] 볼륨을 영화 파일 크기에 비유
- [ ] 단계별 비용 설명

## 🚀 확장성 고려사항

### 3단계 확장 전략:
- [ ] **Phase 1 (MVP)**: 기본 설정, 예상 성능, 비용
- [ ] **Phase 2 (Growth)**: 최적화 전략 (indexes, caching, read replicas)
- [ ] **Phase 3 (Scale)**: Advanced 전략 (sharding, clustering, partitioning)

### 각 단계마다:
- [ ] 사용자 수 목표 (PRD 기반)
- [ ] 예상 성능
- [ ] 필요한 최적화
- [ ] 예상 비용 (TRD 참조)

### Indexing for Scale:
- [ ] 현재 indexes
- [ ] 미래에 추가할 indexes
- [ ] Index monitoring 전략

### 비개발자 설명:
- [ ] 식당 확장 비유 재사용
- [ ] 단계별로 쉽게 설명

## 🔐 데이터 보안

### Sensitive Data Handling:
- [ ] Password storage (bcrypt/argon2 hash)
- [ ] PII 처리 (email, name, phone)
- [ ] Payment info (토큰만 저장, 카드번호 절대 저장 안함)
- [ ] Encryption at rest (TRD/hosting에서 지원 여부)
- [ ] Encryption in transit (HTTPS/TLS)

### Access Control:
- [ ] Database users/roles 정의
- [ ] Application user (limited permissions)
- [ ] Admin user (full permissions)
- [ ] Read-only user (analytics)

### SQL Injection Prevention:
- [ ] Parameterized queries 사용 강조
- [ ] ORM 사용 권장
- [ ] 나쁜 예시 vs 좋은 예시 포함

### Data Retention:
- [ ] Soft delete vs Hard delete 전략
- [ ] deleted_at 필드 (soft delete)
- [ ] GDPR compliance (완전 삭제 가능)
- [ ] Audit logs (선택적)

### Backup & Recovery:
- [ ] Backup 빈도 (TRD/hosting 기반)
- [ ] Retention 기간
- [ ] Recovery plan (RTO, RPO)

### Environment Separation:
- [ ] Development DB (fake data)
- [ ] Staging DB (test data)
- [ ] Production DB (real data, strict access)

### 비개발자 설명:
- [ ] 보안을 은행 금고에 비유
- [ ] 각 보안 조치가 왜 중요한지 설명

## 🧪 테스트 데이터 시나리오

### 테스트 시나리오 포함:
- [ ] **Scenario 1**: 신규 사용자 onboarding
- [ ] **Scenario 2**: Social interactions (follow, comment, like)
- [ ] **Scenario 3**: Edge cases (duplicate email, self-follow, constraints)
- [ ] **Scenario 4**: Performance testing (bulk data)
- [ ] **Scenario 5**: Data migration testing (선택적)

### 각 시나리오마다:
- [ ] Purpose 명시
- [ ] Test data 정의 (SQL 또는 설명)
- [ ] Expected state 명시
- [ ] 검증 방법

### 비개발자 설명:
- [ ] 테스트를 오픈 전 리허설에 비유
- [ ] 왜 각 시나리오가 중요한지 설명

## 📐 ERD 다이어그램

### 다이어그램 포함:
- [ ] 전체 ERD 다이어그램 존재
- [ ] 형식: Mermaid 또는 ASCII art
- [ ] 모든 테이블 포함
- [ ] 모든 관계 표시 (cardinality: ||--o{, ||--||, }o--o{)
- [ ] Primary keys 표시 (PK)
- [ ] Foreign keys 표시 (FK)
- [ ] Unique keys 표시 (UK - 선택적)

### 다이어그램 품질:
- [ ] 읽기 쉬움
- [ ] 테이블명과 실제 스키마 일치
- [ ] 관계 방향 명확

### 비개발자 설명:
- [ ] ERD를 지도에 비유
- [ ] 테이블 = 건물, 관계 = 도로
- [ ] 다이어그램 읽는 법 간단 설명

## 🔄 문서 일관성

### PRD 일관성:
- [ ] PRD의 모든 core_features가 ERD에 반영됨
- [ ] PRD의 success_metrics가 data volume 예측에 사용됨

### UX 일관성:
- [ ] UX의 모든 screens에 필요한 데이터가 테이블로 존재
- [ ] UX의 모든 user flows가 지원됨
- [ ] 생성/조회/수정/삭제 데이터가 모두 스키마에 있음

### UI 일관성:
- [ ] UI의 form fields가 테이블 columns와 매핑됨
- [ ] UI의 데이터 표시 요구사항이 지원됨

### TRD 일관성:
- [ ] Database system이 TRD와 100% 일치
- [ ] Migration tool이 TRD와 일치
- [ ] ORM/schema tool이 TRD와 일치
- [ ] Auth 솔루션이 반영됨 (auth tables)

### Architecture 일관성:
- [ ] Architecture의 테이블 프리뷰가 완전한 스키마로 확장됨
- [ ] Architecture의 데이터 흐름이 ERD로 구현 가능
- [ ] 모든 API endpoints가 필요한 데이터를 가짐

## ✅ 검색 품질 (매우 중요!)

### Web Search 실행 확인:
- [ ] **유사 서비스 ERD 검색이 실제로 수행됨**
- [ ] **4-8개 실제 ERD 예시가 분석됨**
- [ ] **각 ERD의 실제 링크 포함됨**
- [ ] **최신 정보 (2024년 기준)**

### 정보의 정확성:
- [ ] 모든 테이블명이 일관되고 명확함
- [ ] 모든 data types가 database system에 맞음
- [ ] 모든 constraints가 유효함
- [ ] SQL syntax가 정확함 (샘플 migration)

## 💡 비개발자 이해도

### 스토리텔링 품질:
- [ ] 모든 주요 섹션에 비개발자 설명 포함
- [ ] 실생활 비유 사용:
  - [ ] 테이블 = 엑셀 시트, 서가, 파일 캐비넷
  - [ ] 관계 = 참조, 링크
  - [ ] 인덱스 = 책 색인
  - [ ] 제약조건 = 규칙
  - [ ] Migration = 건물 공사 단계
  - [ ] 보안 = 은행 금고
- [ ] "철수" 또는 실제 예시 사용
- [ ] 기술 용어마다 쉬운 설명

### 이해 가능성 테스트:
- [ ] 비개발자가 "무슨 데이터를 저장하는지" 이해 가능
- [ ] 비개발자가 "테이블 간 관계"를 개념적으로 이해 가능
- [ ] 비개발자가 데이터 볼륨 예측을 이해 가능
- [ ] 비개발자가 보안 조치를 이해 가능

## 💻 개발자 구현 가능성

### Implementation-Ready:
- [ ] 개발자가 이 문서만으로 DB 생성 가능
- [ ] 모든 CREATE TABLE statements 작성 가능
- [ ] 모든 indexes 생성 가능
- [ ] 모든 constraints 적용 가능
- [ ] Migration files 작성 가능
- [ ] ORM models 작성 가능 (Prisma/TypeORM/Sequelize 등)

### Completeness:
- [ ] 모든 필수 필드 포함
- [ ] 모든 관계 정의됨
- [ ] 모든 indexes 명시됨
- [ ] Edge cases 고려됨 (self-reference, orphans, etc.)

### Code Examples:
- [ ] 최소 1개 migration 샘플 코드
- [ ] 쿼리 예시 포함 (SELECT, JOIN)
- [ ] Seed data 스크립트 (선택적)

## 🚦 다음 단계 (개발 시작)

### 문서 완전성:
- [ ] 6개 문서가 모두 완성됨 (PRD, UX, UI, TRD, Architecture, ERD)
- [ ] 모든 문서가 {output_folder}에 저장됨
- [ ] ERD가 {default_output_file}에 저장됨

### 개발 준비:
- [ ] Database migration 파일 생성 가능
- [ ] ORM models 작성 가능
- [ ] API endpoints 구현 가능 (ERD + Architecture)
- [ ] Frontend 구현 가능 (UX + UI + ERD)

---

## 🔥 최종 품질 검증

### 비개발자 이해도 테스트:
- [ ] 비개발자가 "어떤 데이터를 저장하는지" 이해할 수 있는가?
- [ ] 각 테이블의 목적이 명확한가?
- [ ] 데이터 볼륨과 비용 예측이 이해 가능한가?
- [ ] 보안 조치가 왜 필요한지 이해 가능한가?

### 개발자 구현 가능성 테스트:
- [ ] 개발자가 이 문서만으로 DB를 구축할 수 있는가?
- [ ] 모든 테이블 스키마가 완전한가?
- [ ] 모든 관계가 명확하게 정의되었는가?
- [ ] Migration 전략이 실행 가능한가?
- [ ] 샘플 데이터와 테스트 시나리오가 충분한가?

### 검색 품질 테스트:
- [ ] 유사 서비스 ERD가 실제로 관련성 있는가?
- [ ] 배운 패턴이 우리 프로젝트에 적용되었는가?
- [ ] 모든 링크가 유효한가?

### 일관성 테스트:
- [ ] PRD의 모든 기능이 ERD에 구현되었는가?
- [ ] UX의 모든 데이터 요구사항이 충족되었는가?
- [ ] TRD의 database 선택이 준수되었는가?
- [ ] Architecture의 테이블 프리뷰가 완전히 확장되었는가?

---

## 📝 검증 완료 후

모든 체크박스가 완료되면:

1. ✅ ERD 문서가 완성됨
2. ✅ 실제 구현 가능한 데이터베이스 스키마 완성
3. ✅ 비개발자와 개발자 모두 이해 가능
4. ✅ **전체 6개 문서 완성** (PRD → UX → UI → TRD → Architecture → ERD)
5. ✅ **개발 시작 준비 완료!**

---

## 🎉 Startup Launchpad 완료!

**축하합니다!** 모든 필요한 문서가 완성되었습니다:

✅ PRD - 무엇을 만들 것인가
✅ UX Design - 어떻게 동작할 것인가
✅ UI Design Guide - 어떻게 보일 것인가
✅ TRD - 무슨 기술을 쓸 것인가
✅ Architecture - 어떻게 구성할 것인가
✅ ERD - 어떤 데이터를 저장할 것인가

**이제 개발을 시작하세요!** 🚀
