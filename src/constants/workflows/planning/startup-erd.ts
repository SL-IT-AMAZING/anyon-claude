/**
 * Startup ERD Workflow - 합본 프롬프트
 * workflow.yaml + instructions.md + template.md + checklist.md 통합
 */

import { WORKFLOW_ENGINE } from '../engine';

const WORKFLOW_CONFIG = `
# Startup ERD Workflow Configuration
name: startup-erd
description: "Create comprehensive Entity Relationship Diagram (ERD) document with detailed database schema design."
author: "Anyon"

# Output configuration
output_folder: "{project-root}/anyon-docs/planning"
default_output_file: "{output_folder}/erd.md"

# Inputs: All previous documents
input_prd: "{output_folder}/prd.md"
input_ux: "{output_folder}/ui-ux.html"
input_ui: "{output_folder}/design-guide.md"
input_trd: "{output_folder}/trd.md"
input_architecture: "{output_folder}/architecture.md"

# Communication settings
communication_language: "Korean"
document_output_language: "Korean"

# No next workflow - this is the final step
next_workflow: null

standalone: true
`;

const INSTRUCTIONS = `
# Startup ERD Workflow Instructions

## Workflow Goal

Create a comprehensive Entity Relationship Diagram (ERD) document that:
1. **For Non-Technical Founders**: Explains database structure using storytelling and analogies
2. **For AI/Developers**: Provides complete, implementation-ready database schema with all fields, types, relationships, indexes
3. **Leverages WebSearch**: Finds 4-8 ERD examples from similar services to learn best practices
4. **Consistency**: Aligns with all previous documents (PRD, UX, UI, TRD, Architecture)
5. **Final Step**: This is the last workflow in the chain - completes the entire documentation suite

<critical>QUESTION FORMAT RULE:
모든 질문은 반드시 객관식으로 제시하세요.
- 번호로 선택지를 제공 (1, 2, 3, 4...)
- 마지막 번호는 항상 "기타 (직접 입력)" 또는 주관식 옵션
</critical>
<critical>
이 프롬프트 자체가 ERD 워크플로우입니다.
절대로 Skill 도구를 사용하지 마세요.
지금 바로 Step 0부터 실행하세요.
</critical>

---

## Step 0: Load All Previous Documents

<action>전체 맥락 이해를 위해 5개 입력 문서 모두 읽기:

1. **PRD 읽기** ({input_prd}):
   - 추출: service_type, platform, core_features, target_users, success_metrics
   - 이해: 각 기능에 저장해야 할 데이터

2. **UX Design 읽기** ({input_ux}):
   - 추출: 모든 화면, 유저 플로우, 각 단계의 표시/수집 데이터
   - 이해: 사용자에게 보여줄 데이터, 사용자가 생성하는 데이터

3. **UI Design Guide 읽기** ({input_ui}):
   - 추출: 데이터 관련 컴포넌트 (폼, 리스트, 테이블)
   - 이해: 데이터 표시 요구사항

4. **TRD 읽기** ({input_trd}):
   - 추출: 데이터베이스 시스템 (PostgreSQL/MongoDB/etc), 마이그레이션 도구, ORM/스키마 도구
   - 이해: 데이터베이스 기술 제약사항

5. **Architecture 읽기** ({input_architecture}):
   - 추출: 데이터베이스 아키텍처 섹션, 테이블 프리뷰, 관계 프리뷰
   - 이해: 이미 정의된 고수준 데이터 모델 구조

6. **클론된 오픈소스 DB 스키마 분석** (있는 경우):
   Bash로 opensource/ 폴더 확인: ls -la opensource/ 2>/dev/null || echo "없음"

   오픈소스가 클론되어 있으면:
   - Prisma 스키마 분석: Read opensource/[프로젝트]/prisma/schema.prisma
   - Drizzle 스키마 분석: Read opensource/[프로젝트]/src/db/schema.ts
   - TypeORM 엔티티 분석: Glob opensource/[프로젝트]/**/entities/*.ts
   - Sequelize 모델 분석: Glob opensource/[프로젝트]/**/models/*.ts
   - migrations 폴더 분석: Glob opensource/[프로젝트]/**/migrations/*.sql

   발견된 스키마 정리:
   "**클론된 오픈소스 DB 스키마:**

   **[프로젝트명]의 테이블 구조:**
   - users: id, email, name, created_at...
   - posts: id, user_id, title, content...
   - [기타 테이블들]

   **관계:**
   - users 1:N posts
   - posts N:M tags

   이 스키마를 참고해서 우리 서비스에 맞게 설계할게요."

<critical>
The ERD MUST use the exact database system from TRD.
The ERD MUST include tables for ALL features from PRD.
The ERD MUST support ALL user flows from UX Design.
The ERD MUST expand on the table previews from Architecture.
If opensource schema exists, use it as primary reference for table structure.
</critical>
</action>

---

## Step 1: 유사 서비스 ERD 연구

<action>WebSearch로 유사 서비스의 실제 데이터베이스 설계 조사:

검색 쿼리:
- "{{service_type}} database schema 2025"
- "{{service_type}} ERD example"
- "how to design {{service_type}} database"
- "{{service_type}} data model best practices"

수집 정보:
- 4-8개 유사 서비스의 실제 ERD/데이터베이스 스키마
- 각 서비스의 핵심 테이블 구조
- 테이블 간 관계 (1:N, N:M)
- 인덱싱 전략
- 실제 링크 (블로그 포스트, 기술 문서, GitHub)
</action>

<action>WebSearch 결과 요약 (내부 저장, 사용자에게는 간단히):
"
참고할 만한 서비스들의 데이터베이스 설계를 조사했어요:

| 서비스 | 핵심 테이블 | 특징 | 참고 링크 |
|--------|------------|------|-----------|
| [결과1] | [테이블들] | [특징] | [링크] |
| [결과2] | [테이블들] | [특징] | [링크] |
...

**주요 패턴:**
- [패턴1: 설명]
- [패턴2: 설명]

**참고 자료:**
- [링크1: 제목]
- [링크2: 제목]
"
</action>

<action>{{reference_erds}}에 저장</action>

---

## Step 2: Analyze Data Requirements

<action>UX 목업과 PRD를 기반으로 데이터 요구사항을 분석합니다.

**분석 항목:**
1. **UX 목업 (핵심)** - 화면에 표시되는 데이터 → 필요한 테이블/컬럼
   - 목록 화면 → 어떤 데이터가 나열되는지
   - 상세 화면 → 어떤 필드들이 있는지
   - 입력 폼 → 사용자가 입력하는 데이터
   - 관계 → 화면 간 연결 (예: 목록 → 상세)
2. PRD의 핵심 기능에서 필요한 데이터 식별
3. Architecture의 API 엔드포인트에서 데이터 구조 파악
4. **{{reference_erds}}의 유사 서비스 패턴 참고**

**서비스 유형별 표준 패턴 적용:**
| 서비스 유형 | 표준 테이블 패턴 |
|------------|-----------------|
| 소셜/커뮤니티 | users, posts, comments, likes, follows |
| 이커머스 | users, products, orders, order_items, reviews |
| SaaS/도구 | users, workspaces, projects, items |
| 예약/부킹 | users, resources, bookings, time_slots |
| 콘텐츠/미디어 | users, content, categories, tags, content_tags |
</action>

---

## Step 3: Define Database Design Principles

<action>Establish 3-5 database design principles for this project.

**Common principles:**
1. **Normalization**: Reduce data redundancy (for SQL databases)
2. **Performance**: Design for fast reads (indexes on frequently queried fields)
3. **Scalability**: Support growth to [target users from PRD success_metrics]
4. **Data Integrity**: Enforce relationships and constraints
5. **Flexibility**: Allow for future feature additions
6. **Security**: Separate sensitive data, support encryption
</action>

---

## Step 4: Identify All Required Tables

<action>Create a comprehensive list of all tables needed for the project.

**Sources for table identification:**

### From PRD Core Features
For each feature in PRD, identify required tables:
- User management → users table
- Authentication → sessions or tokens table
- Feature X → feature_x related tables

### From UX User Flows
Walk through each user flow and identify data:
- What data is created?
- What data is displayed?
- What data is updated/deleted?

### Standard Tables (almost every app needs)
- users - User accounts
- sessions or tokens - Authentication
- Audit/logging tables (optional for MVP)

### Feature-Specific Tables
Based on PRD features:
- Posts/Content tables
- Comments/Interactions tables
- Relationships/Connections tables (followers, friends, etc.)
- Transactions/Orders tables (if e-commerce)
- Messages/Notifications tables (if messaging)
- Files/Media tables (if file uploads)
</action>

---

## Step 5: Design Each Table in Detail

<action>For EACH table identified in Step 3, design complete schema.

**For each table, define:**

### Table Template:

\`\`\`markdown
### table_name

**Purpose**: [What this table stores in 1 sentence]

**비개발자 설명**: [Simple analogy]

**Columns:**

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | [INT/UUID] | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| [column_2] | [TYPE(size)] | [NOT NULL / NULLABLE] | [Description] |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update time |

**Indexes:**
- PRIMARY KEY on id
- INDEX on [frequently_queried_field]
- UNIQUE INDEX on [unique_field] (e.g., email)

**Constraints:**
- FOREIGN KEY [field] REFERENCES [other_table](id) ON DELETE [CASCADE/SET NULL]
- CHECK [field] > 0 (if applicable)
- UNIQUE [field] (if applicable)

**Sample Data:**
| id | [col2] | [col3] | created_at |
|----|--------|--------|------------|
| 1  | value1 | value2 | 2024-01-15 |
| 2  | value3 | value4 | 2024-01-16 |
\`\`\`

**Coverage checklist:**
- [ ] Users and authentication
- [ ] All PRD core features
- [ ] All data shown in UX flows
- [ ] Comments/reactions (if social features)
- [ ] Notifications (if in PRD)
- [ ] Relationships/connections (followers, friends, etc. if applicable)
- [ ] Files/media metadata (if file uploads)
- [ ] Transactions/payments (if e-commerce)
- [ ] Any audit/logging tables (optional)
</action>

---

## Step 6: Define All Table Relationships

<action>Map out all relationships between tables.

### Relationship Types:

**1. One-to-Many (가장 흔함)**
- One user has many posts
- One post has many comments
- Implementation: Foreign key in the "many" table

**2. Many-to-Many**
- Users follow many users (followers/following)
- Posts have many tags, tags have many posts
- Implementation: Junction table

**3. One-to-One (드물음)**
- User has one profile_settings
- Implementation: Foreign key with UNIQUE constraint

### Document Each Relationship:

**관계 타입 명시** (One-to-Many, Many-to-Many, One-to-One)
**설명** (무슨 관계인지)
**구현 방법** (FOREIGN KEY 또는 junction table)
**ON DELETE 동작** (CASCADE, SET NULL, RESTRICT)
**비개발자 설명** (비유 포함)
**쿼리 예시** (실제 SQL 예시)
</action>

---

## Step 7: Define Indexing Strategy

<action>For each table, identify which fields need indexes.

### When to Index:

**PRIMARY KEYS**: Always indexed automatically

**FOREIGN KEYS**: Almost always should be indexed
- Reason: Frequent JOINs on these fields

**UNIQUE FIELDS**: Indexed automatically with UNIQUE constraint
- email, username, etc.

**Frequently Queried Fields**:
- Fields used in WHERE clauses
- Fields used in ORDER BY
- Fields used in JOIN conditions

**From UX Flows - identify query patterns:**
- "Show posts by user" → index posts.user_id
- "Show recent posts" → index posts.created_at DESC
- "Search posts by title" → index posts.title or full-text index
- "Filter by category" → index posts.category_id
</action>

---

## Step 8: Define Constraints and Validations

<action>Document all database-level constraints.

### Constraint Types:

**1. PRIMARY KEY** - Unique identifier (all tables)

**2. FOREIGN KEY** - Enforce relationships
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

**ON DELETE options:**
- CASCADE: Delete child records when parent deleted
- SET NULL: Set foreign key to NULL
- RESTRICT: Prevent deletion if children exist
- NO ACTION: Same as RESTRICT

**3. UNIQUE** - Ensure uniqueness
UNIQUE (email)
UNIQUE (username)
UNIQUE (follower_id, following_id) -- composite unique

**4. NOT NULL** - Require value

**5. CHECK** - Custom validation
CHECK (age >= 18)
CHECK (price > 0)
CHECK (status IN ('draft', 'published', 'archived'))

**6. DEFAULT** - Default value
created_at TIMESTAMP NOT NULL DEFAULT NOW()
is_active BOOLEAN NOT NULL DEFAULT true
</action>

---

## Step 9: Define Data Types and Sizes

<action>For each field, choose appropriate data type based on TRD's database.

### Common Data Types (adjust based on TRD database):

**PostgreSQL / MySQL:**
- UUID or SERIAL/AUTO_INCREMENT for IDs
- VARCHAR(n) for short text with max length
- TEXT for long text
- INTEGER / BIGINT for numbers
- DECIMAL(p,s) for money/precise decimals
- BOOLEAN for true/false
- TIMESTAMP or DATETIME for dates/times
- JSON or JSONB for flexible data

**MongoDB / NoSQL:**
- ObjectId for IDs
- String for text
- Number for integers/floats
- Boolean
- Date
- Array for lists
- Object for nested data
</action>

---

## Step 10: Define Migration Strategy

<action>Based on TRD's migration tool, define how to create and manage schema.

### Migration Strategy:
- **Tool**: [from TRD - e.g., Prisma Migrate, TypeORM migrations, etc.]
- **Language**: [SQL / ORM DSL]

### Migration Files Structure
migrations/
  001_create_users.sql
  002_create_sessions.sql
  003_create_posts.sql
  ...

### Migration Best Practices
1. **Never edit existing migrations** - always create new ones
2. **Always test migrations on staging first**
3. **Backup database before production migrations**
4. **Make migrations reversible** (if possible)
5. **Keep migrations small and focused**
</action>

---

## Step 11: Create Sample Data

<action>For each major table, provide realistic sample data.

### Purpose:
- Help developers understand data structure
- Provide seed data for development
- Show realistic examples for non-technical stakeholders
</action>

---

## Step 12: Estimate Data Volume

<action>Based on PRD success_metrics, estimate database growth.

### Storage Estimates
- Target users (Year 1): [from PRD]
- Target users (Year 3): [from PRD]
- Row sizes and growth rates per table
- Total database size estimate
- File storage (S3/CDN) estimate
</action>

---

## Step 13: Scalability Considerations

<action>Document database scalability strategies.

### Phase 1: MVP (0-10,000 users)
- Single database instance
- Basic indexes
- Expected: Excellent performance

### Phase 2: Growth (10,000-100,000 users)
- Query optimization
- Read replicas (if needed)
- Caching (if in TRD)

### Phase 3: Scale (100,000+ users)
- Horizontal partitioning (sharding)
- Vertical partitioning
- Database clustering
</action>

---

## Step 14: Data Security Considerations

<action>Document security measures at database level.

### 1. Sensitive Data Handling
- Password hashing (bcrypt, argon2)
- PII encryption
- Payment info (tokens only, never card numbers)

### 2. Access Control
- Database users/roles
- Application user (limited permissions)
- Admin user (full permissions)

### 3. SQL Injection Prevention
- Parameterized queries
- ORM usage

### 4. Data Retention and Deletion
- Soft deletes vs hard deletes
- GDPR compliance

### 5. Backup and Recovery
- Backup frequency
- Recovery plan (RTO, RPO)
</action>

---

## Step 15: Test Data Scenarios

<action>Define test scenarios for development and QA.

### Scenario 1: New User Onboarding
### Scenario 2: Social Interactions
### Scenario 3: Edge Cases
### Scenario 4: Performance Testing
### Scenario 5: Data Migration
</action>

---

## Step 16: Generate Complete ERD Document

<action>Load template and fill in ALL sections.

**ERD Diagram Format** (use Mermaid):
\`\`\`mermaid
erDiagram
    users ||--o{ posts : "creates"
    users ||--o{ comments : "writes"
    posts ||--o{ comments : "has"
    users ||--o{ follows : "follower"
    users ||--o{ follows : "following"

    users {
        uuid id PK
        string email UK
        string password_hash
        string name
        timestamp created_at
    }

    posts {
        uuid id PK
        uuid user_id FK
        string title
        text content
        string status
        timestamp created_at
    }
\`\`\`

<output-to>{default_output_file}</output-to>
</action>

---

## Step 17: Validate Against Checklist

<action>Ensure the ERD document meets all criteria:
- [ ] All YAML metadata complete
- [ ] All 5 previous documents referenced and aligned
- [ ] All database design principles defined
- [ ] All tables from PRD features included
- [ ] All tables from UX flows included
- [ ] Every table has complete schema (columns, types, constraints)
- [ ] All relationships documented with cardinality
- [ ] All foreign keys defined with ON DELETE actions
- [ ] Indexing strategy complete for all tables
- [ ] All constraints documented
- [ ] Data types appropriate and sized correctly
- [ ] Migration strategy defined (based on TRD tool)
- [ ] Sample data provided for all major tables
- [ ] Data volume estimates based on PRD metrics
- [ ] Scalability considerations documented
- [ ] Data security measures defined
- [ ] Test scenarios comprehensive
- [ ] ERD diagram included
- [ ] Non-technical explanations present for all major sections
- [ ] Technical specs sufficient for implementation
</action>

---

## Step 18: Completion Message

<action>Since this is the FINAL workflow in the chain, display completion message.

**ERD 문서가 완성되었습니다!**

**저장 위치**: {default_output_file}

**포함된 내용:**
- 유사 서비스 ERD 분석
- 데이터베이스 설계 원칙
- 전체 ERD 다이어그램
- 모든 테이블 상세 스키마
- 모든 테이블 관계 (Foreign Keys, 카디널리티)
- 인덱싱 전략
- Migration 전략 (TRD 도구 기반)
- 샘플 데이터
- 데이터 볼륨 예측
- 확장성 고려사항
- 데이터 보안
- 테스트 시나리오
- 비개발자를 위한 쉬운 설명

---

# Startup Launchpad 6단계 완료!

모든 문서가 성공적으로 생성되었습니다:

1. **PRD** (prd.md) - Product Requirements Document
2. **UX Design** (ui-ux.html) - User Experience Design
3. **UI Design Guide** (design-guide.md) - UI Design System
4. **TRD** (trd.md) - Technical Requirements Document
5. **Architecture** (architecture.md) - System Architecture
6. **ERD** (erd.md) - Entity Relationship Diagram

**이제 개발을 시작할 수 있습니다!**
</action>
`;

const TEMPLATE = `
# {{project_name}} - Entity Relationship Diagram (ERD)

**작성일**: {{date}}
**기반 문서**: PRD, UX Design, UI Design Guide, TRD, Architecture

---

## 문서 개요

이 문서는 {{project_name}}의 데이터베이스 스키마를 상세히 정의합니다.

**참조 정보:**
- 서비스 유형: {{service_type}}
- 데이터베이스: {{database_type}}
- 테이블 수: {{table_count}}개

---

## 유사 서비스 ERD 분석

{{similar_services_erd_analysis}}

---

## 데이터베이스 설계 원칙

{{database_design_principles}}

---

## ERD 다이어그램

### 전체 ERD 개요
{{erd_diagram}}

---

## 테이블 상세 정의

{{all_tables_detailed}}

---

## 테이블 관계 (Relationships)

{{table_relationships}}

---

## 인덱스 전략

{{indexes_strategy}}

---

## 제약조건 (Constraints)

{{constraints}}

---

## 데이터 타입 및 크기

{{data_types_and_sizes}}

---

## Migration 전략

{{migration_strategy}}

---

## 샘플 데이터

{{sample_data}}

---

## 예상 데이터 볼륨

{{estimated_data_volume}}

---

## 확장성 고려사항

{{scalability_considerations}}

---

## 데이터 보안

{{data_security}}

---

## 테스트 데이터 시나리오

{{test_data_scenarios}}

---

## 다음 단계

이 ERD 문서를 기반으로 다음을 진행할 수 있습니다:

1. **Database Migration Files** - 실제 마이그레이션 파일 생성
2. **ORM Models** - 백엔드 프레임워크의 모델 코드 생성
3. **API Implementation** - ERD 기반 API 엔드포인트 구현
4. **Seed Data** - 개발용 시드 데이터 생성

---

## Startup Launchpad 완료!

모든 6개 문서가 완성되었습니다:

1. **PRD** (Product Requirements Document) - 제품 요구사항
2. **UX Design** - 사용자 경험 설계
3. **UI Design Guide** - UI 디자인 시스템
4. **TRD** (Technical Requirements Document) - 기술 스택
5. **Architecture** - 시스템 아키텍처
6. **ERD** (Entity Relationship Diagram) - 데이터베이스 설계

**이제 개발을 시작할 수 있습니다!**
`;

const CHECKLIST = `
# ERD Validation Checklist

## 문서 구조

- [ ] YAML frontmatter가 완전함
- [ ] database_type이 명시됨 (TRD와 일치)
- [ ] tables_list가 메타데이터에 있음
- [ ] relationships_list가 메타데이터에 있음
- [ ] indexes_list가 메타데이터에 있음
- [ ] table_count가 정확함
- [ ] 모든 섹션이 존재하고 placeholder가 없음

## 검색 품질 (매우 중요!)

### Web Search 실행 확인
- [ ] **유사 서비스 ERD 검색이 실제로 수행됨**
- [ ] **4-8개 실제 서비스의 데이터베이스 스키마가 분석됨**
- [ ] **각 서비스의 실제 링크 포함됨**
- [ ] **최신 정보 (2025년 기준)**

### 정보의 정확성
- [ ] 유사 서비스의 테이블 구조가 정확히 분석됨
- [ ] 모든 링크가 작동함
- [ ] 참고한 ERD 패턴이 실제 프로젝트에 적용됨
- [ ] WebSearch 결과가 테이블 설계에 반영됨

## 이전 문서 일관성

- [ ] PRD의 모든 core_features가 테이블로 구현됨
- [ ] UX Design의 모든 데이터 요구사항이 테이블에 반영됨
- [ ] UI Design Guide의 데이터 관련 컴포넌트가 지원됨
- [ ] TRD의 database 선택이 정확히 사용됨
- [ ] Architecture의 테이블 프리뷰가 완전한 스키마로 확장됨

## 테이블 완전성

### Core Tables (필수)
- [ ] users 테이블 존재
- [ ] Authentication 테이블 존재 (sessions/tokens)
- [ ] 모든 core tables에 id, created_at, updated_at 포함

### Feature Tables
- [ ] PRD의 모든 핵심 기능이 테이블로 구현됨
- [ ] UX flows에서 생성/조회/수정/삭제되는 모든 데이터가 테이블 보유
- [ ] Social features (댓글, 좋아요, 팔로우 등) 테이블 포함 (필요시)
- [ ] Notifications 테이블 포함 (필요시)
- [ ] Files/Media metadata 테이블 포함 (필요시)

### Junction Tables
- [ ] 모든 Many-to-Many 관계에 대한 junction table 존재
- [ ] Junction tables에 적절한 composite unique index 포함

## 각 테이블 상세 스키마

### 모든 테이블마다 다음이 정의됨:
- [ ] Table Name (명확하고 복수형 권장)
- [ ] Purpose (1문장 설명)
- [ ] 비개발자 설명 (한국어 비유/스토리텔링)
- [ ] Columns (완전한 리스트)
- [ ] Indexes (모든 인덱스 명시)
- [ ] Constraints (모든 제약조건)
- [ ] Sample Data (최소 2-3 rows)

## 테이블 관계 (Relationships)

### 모든 관계가 문서화됨:
- [ ] 관계 타입 명시 (One-to-Many, Many-to-Many, One-to-One)
- [ ] 설명 (무슨 관계인지)
- [ ] 구현 방법 (FOREIGN KEY 또는 junction table)
- [ ] ON DELETE 동작 (CASCADE, SET NULL, RESTRICT)
- [ ] 비개발자 설명 (비유 포함)
- [ ] 쿼리 예시 (실제 SQL 예시)

## 인덱싱 전략

### Primary Keys
- [ ] 모든 테이블에 PRIMARY KEY 존재
- [ ] ID type 일관성 (UUID vs SERIAL)

### Foreign Keys
- [ ] 모든 FOREIGN KEY 필드에 INDEX 존재

### Performance Indexes
- [ ] UX flows에서 자주 조회하는 필드에 INDEX
- [ ] ORDER BY에 사용되는 필드 (created_at DESC)
- [ ] WHERE 절에 자주 사용되는 필드

## 제약조건 (Constraints)

### 모든 제약조건 문서화:
- [ ] PRIMARY KEY constraints
- [ ] FOREIGN KEY constraints (with ON DELETE)
- [ ] UNIQUE constraints
- [ ] NOT NULL constraints
- [ ] CHECK constraints (enum values, ranges, formats)
- [ ] DEFAULT values

## Migration 전략

- [ ] TRD의 migration tool 사용됨
- [ ] Migration files 구조 설명
- [ ] 샘플 migration 코드 포함
- [ ] Best practices 명시

## 샘플 데이터

- [ ] 모든 주요 테이블에 샘플 데이터
- [ ] 현실적인 데이터 (realistic)
- [ ] 쿼리 예시와 매칭됨

## 데이터 볼륨 예측

- [ ] PRD success_metrics 기반 예측
- [ ] 각 테이블의 row 예상 개수
- [ ] 총 database size 예측 (Year 1, Year 3)
- [ ] File Storage 분리 계산

## 확장성 고려사항

- [ ] Phase 1 (MVP) 정의
- [ ] Phase 2 (Growth) 정의
- [ ] Phase 3 (Scale) 정의

## 데이터 보안

- [ ] Password storage (hash)
- [ ] PII 처리
- [ ] Access Control
- [ ] SQL Injection Prevention
- [ ] Backup & Recovery

## 테스트 시나리오

- [ ] Scenario 1: 신규 사용자 onboarding
- [ ] Scenario 2: Social interactions
- [ ] Scenario 3: Edge cases
- [ ] Scenario 4: Performance testing

## ERD 다이어그램

- [ ] 전체 ERD 다이어그램 존재
- [ ] Mermaid 또는 ASCII art 형식
- [ ] 모든 테이블 포함
- [ ] 모든 관계 표시

## 비개발자 이해도

- [ ] 모든 주요 섹션에 비개발자 설명 포함
- [ ] 실생활 비유 사용
- [ ] 기술 용어마다 쉬운 설명

## 개발자 구현 가능성

- [ ] 개발자가 이 문서만으로 DB 생성 가능
- [ ] 모든 CREATE TABLE statements 작성 가능
- [ ] Migration files 작성 가능

---

## 검증 완료 후

모든 체크박스가 완료되면:

1. ERD 문서가 완성됨
2. 실제 구현 가능한 데이터베이스 스키마 완성
3. 비개발자와 개발자 모두 이해 가능
4. **전체 6개 문서 완성** (PRD → UX → UI → TRD → Architecture → ERD)
5. **개발 시작 준비 완료!**
`;

/**
 * 완성된 ERD 워크플로우 프롬프트
 */
export const STARTUP_ERD_PROMPT = `
# Workflow Execution

## 1. Workflow Engine (MUST FOLLOW)
${WORKFLOW_ENGINE}

## 2. Workflow Configuration
${WORKFLOW_CONFIG}

## 3. Instructions (Execute step by step)
${INSTRUCTIONS}

## 4. Output Template
${TEMPLATE}

## 5. Validation Checklist
${CHECKLIST}

---

**중요**:
- {project-root}는 현재 작업 디렉토리입니다.
- 출력 파일은 {project-root}/anyon-docs/planning/erd.md에 저장하세요.
- 먼저 PRD, UX Design, UI Design Guide, TRD, Architecture 문서를 모두 읽어서 프로젝트 정보를 파악하세요.
- 이것은 Startup Launchpad의 마지막 워크플로우입니다.

<session_awareness>
이 워크플로우가 처음 시작되면 Step 0부터 진행하세요.
이미 대화가 진행 중이라면 (이전 assistant 응답이 있다면) 현재 진행 중인 Step을 이어서 계속하세요.
절대로 처음부터 다시 시작하지 마세요.
</session_awareness>
`;

/**
 * ERD 워크플로우 메타데이터
 */
export const STARTUP_ERD_METADATA = {
  id: 'startup-erd',
  title: 'ERD',
  description: 'Entity Relationship Diagram (데이터베이스 스키마 설계)',
  outputPath: 'anyon-docs/planning/erd.md',
  filename: 'erd.md',
};
