# Startup Architecture Workflow Instructions

## 🎯 Workflow Goal

Create a comprehensive system architecture document that:
1. **For Non-Technical Founders**: Explains system structure using storytelling, analogies, and diagrams
2. **For AI/Developers**: Provides detailed technical architecture specs for implementation
3. **Leverages WebSearch**: Finds 4-8 similar service architectures to learn from best practices
4. **Consistency**: Aligns with all previous documents (PRD, UX, UI, TRD)
5. **Auto-chains**: Automatically invokes startup-erd workflow when complete

---

## 📚 Step 0: Load All Previous Documents

<action>Read all input documents to understand the full context:

1. **Read PRD** (`{input_prd}`):
   - Extract: service_type, platform, core_features, success_metrics, target_users
   - Understand: business goals, user pain points, competitive landscape

2. **Read UX Design** (`{input_ux}`):
   - Extract: screen inventory, user flows, interaction patterns
   - Understand: data requirements from flows, state transitions

3. **Read UI Design Guide** (`{input_ui}`):
   - Extract: selected UI library, component libraries
   - Understand: frontend technology constraints

4. **Read TRD** (`{input_trd}`):
   - Extract: frontend_framework, backend_framework, database, hosting, all selected technologies
   - Extract: feature_implementations (auth, files, email, payment, etc.)
   - Extract: cost_estimation scenarios
   - Understand: ALL technical decisions that were made

<critical>
The architecture MUST use the exact technologies selected in TRD.
Do NOT suggest different technologies.
Your job is to design HOW to structure the system using what was already chosen.
</critical>
</action>

---

## 🔍 Step 1: Search Similar Service Architectures

<action>Use WebSearch to find 4-8 similar service architectures.

**Search strategy:**
1. Identify the service category from PRD (e.g., "social media", "marketplace", "SaaS tool", "booking system")
2. Search for: "[service_type] architecture diagram", "[similar_service] system architecture", "[service_category] backend architecture 2024"
3. Look for: blog posts, case studies, architecture diagrams, tech talks

**What to search for:**
- If PRD mentions "Instagram-like photo sharing" → search "Instagram architecture", "photo sharing app architecture"
- If PRD mentions "Notion-like workspace" → search "Notion architecture", "collaborative document architecture"
- If PRD mentions "Airbnb-like booking" → search "Airbnb architecture", "booking platform architecture"

**Present findings in {communication_language}:**

For each of 4-8 similar services found:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**유사 서비스 [N]: [Service Name]**

🔗 **참고 자료 링크**
- [Link 1 title](url)
- [Link 2 title](url)

📊 **서비스 규모**
- 사용자 수: [number]
- 트래픽: [data if available]

🏗️ **아키텍처 패턴**
- 전체 구조: [예: Microservices / Monolithic / Serverless]
- 주요 특징: [핵심 아키텍처 결정들]

💡 **우리 프로젝트에 적용 가능한 점**
- [배울 수 있는 점 1]
- [배울 수 있는 점 2]

⚠️ **우리와 다른 점**
- [차이점과 그 이유]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**After presenting all options:**

"위 사례들을 참고하여 {{project_name}}에 가장 적합한 아키텍처 패턴을 선정하겠습니다."
</action>

---

## 🎨 Step 2: Choose Architecture Pattern

<action>Based on similar services research and TRD tech stack, decide on architecture pattern.

**Common patterns:**
- **Monolithic**: Single codebase, easier for MVP, suitable for small-medium scale
- **Modular Monolith**: Organized modules within monolith, good middle ground
- **Microservices**: Separate services, complex but scalable
- **Serverless**: Function-based, pay-per-use, good for variable load
- **JAMstack**: Static frontend + API backend, good for content-heavy sites

**Decision factors:**
- Team size (startup = usually 1-3 developers)
- Expected scale from PRD success_metrics
- Tech stack from TRD (some frameworks favor certain patterns)
- Budget constraints from TRD cost_estimation

**Set template variable:**
```
architecture_pattern: [chosen pattern]
```

**Explain in {communication_language} for non-technical founders:**

Use storytelling! Example:

"**비개발자를 위한 설명:**

{{project_name}}의 아키텍처는 **[pattern name]** 방식을 사용합니다.

이게 무슨 뜻이냐면, 철수네 회사를 예로 들어볼게요:

[Use real-world analogy based on pattern]
- Monolithic → 한 건물에 모든 부서가 있는 회사
- Microservices → 여러 건물에 부서들이 나뉘어 있는 회사
- Serverless → 필요할 때만 사무실을 빌려 쓰는 회사

**우리 프로젝트에 이 방식을 선택한 이유:**
1. [이유 1 - PRD의 success_metrics 기반]
2. [이유 2 - 비용 효율성]
3. [이유 3 - 개발 속도]"
```
</action>

---

## 🏗️ Step 3: Design System Components

<action>Define all major components of the system architecture.

Break down into layers:

### Frontend Layer Components
Based on TRD's frontend_framework and UI libraries:
- **Component 1**: [e.g., Web Application (React)]
  - Purpose: [what it does]
  - Technology: [from TRD]
  - Responsibilities: [specific tasks]

- **Component 2**: [e.g., Mobile App (React Native)] - if platform includes mobile
  - Purpose: [what it does]
  - Technology: [from TRD]
  - Responsibilities: [specific tasks]

### Backend Layer Components
Based on TRD's backend_framework:
- **Component 1**: [e.g., API Server (Node.js/Express)]
  - Purpose: [what it does]
  - Technology: [from TRD]
  - Responsibilities: [list all API responsibilities]

- **Component 2**: [e.g., Authentication Service]
  - Purpose: [what it does]
  - Technology: [from TRD's auth solution]
  - Responsibilities: [auth tasks]

- **Component 3**: [e.g., Background Job Processor] - if needed
  - Purpose: [what it does]
  - Technology: [from TRD]
  - Responsibilities: [async tasks]

### Database Layer Components
Based on TRD's database:
- **Primary Database**: [e.g., PostgreSQL]
  - Purpose: [transactional data]
  - Schema approach: [from TRD]

- **Cache Layer**: [e.g., Redis] - if in TRD
  - Purpose: [caching strategy]

- **File Storage**: [e.g., AWS S3] - from TRD
  - Purpose: [files, images, videos]

### Infrastructure Layer Components
Based on TRD's hosting and services:
- **Hosting**: [from TRD]
- **CDN**: [if in TRD]
- **Monitoring**: [from TRD]
- **CI/CD**: [from TRD]

**For each component, explain to non-technical founders using analogies in {communication_language}.**

Example:
"**API Server**는 식당의 웨이터라고 생각하시면 됩니다.
- 고객(프론트엔드)의 주문을 받아서
- 주방(데이터베이스)에 전달하고
- 완성된 요리를 다시 고객에게 가져다줍니다."
</action>

---

## 🔄 Step 4: Define Data Flow Patterns

<action>Map out how data flows through the system for key user actions.

**Reference UX Design document's user flows** and create technical data flow for each.

For each major user flow from UX:

### Flow Pattern Template:

**User Action**: [from UX flow - e.g., "User signs up"]

**Technical Flow**:
1. **Frontend** ({{frontend_framework}}):
   - User fills signup form
   - Client-side validation
   - Submit to API: `POST /api/auth/signup`

2. **Backend** ({{backend_framework}}):
   - Receive request
   - Validate input
   - Hash password with [from TRD auth solution]
   - Save to database
   - Generate JWT token
   - Send confirmation email via [from TRD email solution]
   - Return response with token

3. **Database** ({{database}}):
   - Insert new user record into `users` table
   - Create session record

4. **Frontend**:
   - Store JWT in [localStorage/cookie]
   - Redirect to dashboard

**Components involved**: Frontend App → API Server → Database → Email Service

**비개발자 설명 (storytelling)**:
"회원가입 과정을 택배 시스템에 비유하면:
1. 고객이 주문서 작성 (프론트엔드에서 양식 입력)
2. 택배 센터에서 주문 접수 및 검증 (백엔드 서버)
3. 창고에 고객 정보 저장 (데이터베이스)
4. 고객에게 확인 문자 발송 (이메일 서비스)
5. 고객에게 회원증 발급 (JWT 토큰)"

---

**Create data flow for at least these critical actions:**
- User authentication (signup, login, logout)
- Main feature operations (from PRD core_features)
- Data creation/update/delete operations
- File upload flow (if applicable)
- Payment flow (if applicable)
- Real-time updates (if applicable)

**Diagram format** (use mermaid or ASCII):
```
User → Frontend → API Server → Database
                ↓
            Email Service
```
</action>

---

## 🔐 Step 5: Detail Authentication & Authorization Flow

<action>Expand on authentication architecture using TRD's auth solution.

**Based on TRD's authentication choice:**
- If using Auth0/Clerk/Supabase Auth → explain OAuth flow
- If using JWT custom → explain token generation/validation flow
- If using sessions → explain session management

**Create detailed auth flow diagram and explanation:**

1. **Registration Flow**
2. **Login Flow**
3. **Token Refresh Flow** (if JWT)
4. **Password Reset Flow**
5. **Social Login Flow** (if in PRD)
6. **Authorization Checks** (role-based, permission-based)

**For non-technical founders**, use analogy:
"로그인 시스템은 아파트 출입 시스템과 같습니다:
- 회원가입 = 입주 신청 및 카드키 발급
- 로그인 = 카드키로 현관문 열기
- 토큰 = 카드키 (유효기간 있음)
- 권한 = 일반 입주민 vs 관리자 권한"
</action>

---

## 📦 Step 6: Feature-by-Feature Architecture

<action>For EACH core feature from PRD, define its architectural implementation.

**Reference:**
- PRD core_features
- TRD feature_implementations table

**For each feature:**

### Feature: [Feature Name from PRD]

**Architecture Components:**
- Frontend: [which components handle this]
- Backend: [which endpoints/services]
- Database: [which tables/collections]
- Third-party: [which external services from TRD]

**Implementation Pattern:**
[Describe the architectural pattern for this specific feature]

**Data Model:**
[What data entities are involved - preview for ERD]

**APIs:**
- `[METHOD] /api/[endpoint]` - [description]
- `[METHOD] /api/[endpoint]` - [description]

**비개발자 설명:**
[Use storytelling to explain how this feature works architecturally]

---

**Example:**

### Feature: 사진 업로드 및 공유

**Architecture Components:**
- Frontend: React upload component (react-dropzone from TRD)
- Backend: File upload API endpoint
- Storage: AWS S3 (from TRD)
- Database: PostgreSQL - photos table with metadata

**Implementation Pattern:**
1. User selects photo in browser
2. Frontend uploads to backend API with multipart/form-data
3. Backend receives file, validates (size, type)
4. Backend uploads to S3 bucket
5. Backend saves S3 URL + metadata to database
6. Backend returns photo ID and URL to frontend
7. Frontend displays uploaded photo

**Data Model:**
- `photos` table: id, user_id, s3_url, filename, size, created_at
- `photo_shares` table: id, photo_id, shared_with_user_id

**APIs:**
- `POST /api/photos/upload` - Upload new photo
- `GET /api/photos/:id` - Get photo details
- `POST /api/photos/:id/share` - Share photo with another user

**비개발자 설명:**
"사진 업로드는 이렇게 작동합니다:

철수가 사진을 올리면:
1. 사진 파일이 우리 서버로 전송됩니다 (우체국에 소포 보내기)
2. 서버가 사진을 검사합니다 (크기, 형식 확인 - 우체국 검수)
3. 서버가 사진을 S3 창고에 저장합니다 (대형 물류센터에 보관)
4. 데이터베이스에는 '철수가 2024-01-15에 사진을 S3 창고 A-123 위치에 저장했다'는 기록만 남깁니다 (장부 기록)
5. 나중에 누군가 이 사진을 보고 싶으면, 데이터베이스에서 위치를 찾아서 S3에서 가져옵니다"
</action>

---

## 🌐 Step 7: API Architecture Design

<action>Define the complete API architecture based on TRD's API choice (REST/GraphQL/tRPC).

### API Structure

**Type**: [from TRD - REST / GraphQL / tRPC]

**Base URL**: `https://api.{{project_name}}.com` or `/api`

**Authentication**:
- Method: [from TRD auth solution]
- Header: `Authorization: Bearer <token>` (if JWT)

**API Versioning**:
- Strategy: [URL versioning / Header versioning / No versioning for MVP]
- Example: `/api/v1/...` or `/api/...`

### API Endpoints Categorization

Group endpoints by domain (matching PRD features):

**Auth Domain:**
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh-token`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

**User Domain:**
- `GET /api/users/me`
- `PUT /api/users/me`
- `GET /api/users/:id`
- etc.

**[Feature Domain from PRD]:**
- `[METHOD] /api/[resource]` - [description]
- etc.

### API Standards

**Request/Response Format**: JSON
**Error Format**:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

**Status Codes**:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

### Rate Limiting
[Based on TRD security implementation]

### CORS Policy
[Based on TRD and deployment setup]

**비개발자 설명:**
"API는 프론트엔드와 백엔드가 대화하는 언어입니다.

식당에서:
- 손님(프론트엔드)이 '물 한 잔 주세요'라고 말하면 (`GET /api/water`)
- 웨이터(API)가 주방(백엔드)에 전달하고
- 물을 가져다줍니다 (response)

우리는 {{api_type}} 방식을 사용하는데, [explain why in simple terms]"
</action>

---

## 💾 Step 8: Database Architecture

<action>Define database architecture based on TRD's database choice.

### Database System
- **Type**: [from TRD - PostgreSQL / MongoDB / etc.]
- **Hosting**: [from TRD - Supabase / PlanetScale / etc.]
- **Connection**: [connection pooling details]

### Schema Approach
- **Strategy**: [from TRD - SQL migrations / ORM / Prisma Schema / etc.]
- **Migration Tool**: [from TRD]

### Database Structure Preview

**High-level Tables/Collections** (detailed ERD will be in next workflow):

Based on PRD features and UX flows:

1. **users** - User accounts
   - Core fields: id, email, password_hash, created_at, etc.

2. **[feature_table_1]** - [from PRD feature]
   - Core fields: [list key fields]

3. **[feature_table_2]** - [from PRD feature]
   - Core fields: [list key fields]

[Continue for all main features]

### Relationships Preview
- users → [related tables] (one-to-many)
- [table_1] ↔ [table_2] (many-to-many)
etc.

### Indexing Strategy
- Primary keys on all tables
- Indexes on frequently queried fields: [list based on UX flows]
- Foreign key indexes

### Caching Strategy
[If TRD includes Redis/caching]:
- What to cache: [frequently accessed data]
- Cache duration: [TTL strategy]
- Cache invalidation: [when to clear]

**비개발자 설명:**
"데이터베이스는 도서관이라고 생각하세요:

- **테이블**은 서가 (users 서가, posts 서가, comments 서가)
- **레코드**(행)는 개별 책
- **인덱스**는 도서관 카탈로그 (빨리 찾기 위한 색인)
- **관계**는 책들 간의 참조 (이 책은 저 책을 인용함)

우리는 {{database_type}}를 사용하는데, 이건 [explain SQL vs NoSQL in simple terms based on choice]"
</action>

---

## 🚀 Step 9: Deployment Architecture

<action>Define deployment architecture based on TRD's hosting choice.

### Hosting Platform
- **Platform**: [from TRD - Vercel / Netlify / Railway / AWS / etc.]
- **Tier**: [FREE / Hobby / Pro]
- **Region**: [geographic location]

### Deployment Structure

**Frontend Deployment**:
- Platform: [e.g., Vercel for Next.js]
- Build command: [from TRD's frontend framework]
- Output directory: [e.g., dist/]
- Environment variables: [list from TRD]

**Backend Deployment**:
- Platform: [e.g., Railway for Node.js]
- Start command: [from TRD's backend framework]
- Environment variables: [list from TRD]

**Database Deployment**:
- Platform: [e.g., Supabase]
- Backup strategy: [automatic daily backups]

**File Storage**:
- Service: [from TRD]
- Bucket structure: [organization]

### Environments

**Development**:
- Local development setup
- Local database

**Staging** (optional for MVP):
- Preview deployments
- Staging database

**Production**:
- Production domain
- Production database
- Monitoring enabled

### CI/CD Pipeline

**Trigger**: Git push to main branch

**Steps**:
1. Run tests (from TRD testing strategy)
2. Build frontend
3. Build backend
4. Deploy to hosting platform
5. Run migrations
6. Smoke tests
7. Notify team

**Tools**:
- CI/CD Platform: [GitHub Actions / GitLab CI / etc.]
- Automated testing: [from TRD]

### Domain & SSL
- Custom domain: [setup instructions]
- SSL certificate: [automatic via hosting platform]

**비개발자 설명:**
"배포는 우리 서비스를 인터넷에 올리는 과정입니다:

1. **개발 환경** = 철수의 컴퓨터 (개발하고 테스트)
2. **스테이징** = 비공개 시사회 (출시 전 마지막 확인)
3. **프로덕션** = 영화관 상영 (실제 사용자들이 사용)

우리는 {{hosting_platform}}을 사용하는데:
- 코드를 GitHub에 올리면 (push)
- 자동으로 빌드되고 (CI/CD)
- 자동으로 인터넷에 배포됩니다 (deployment)

마치 유튜브에 영상 업로드하면 자동으로 인코딩되고 게시되는 것처럼!"
</action>

---

## 📈 Step 10: Scalability Architecture

<action>Define how the system will scale based on PRD's success_metrics.

### Scalability Goals

From PRD success_metrics:
- Target users: [number from PRD]
- Expected traffic: [estimate based on users]
- Data volume: [estimate based on features]

### Scaling Strategy

**Phase 1: MVP (0-1,000 users)**
- Single server deployment
- Minimal caching
- Basic monitoring
- Cost: [from TRD MVP cost]

**Phase 2: Growth (1,000-10,000 users)**
- Horizontal scaling: [add more server instances]
- Database read replicas (if needed)
- CDN for static assets
- Advanced caching with [Redis/etc from TRD]
- Cost: [from TRD Growth cost]

**Phase 3: Scale (10,000+ users)**
- Load balancer
- Database sharding (if needed)
- Microservices migration (if monolithic)
- Advanced monitoring and alerting
- Cost: [from TRD Scale cost]

### Auto-scaling Rules
[Based on hosting platform capabilities from TRD]:
- CPU threshold: [e.g., scale up at 70% CPU]
- Memory threshold: [e.g., scale up at 80% memory]
- Request rate: [e.g., scale up at 1000 req/min]

### Database Scaling
- Vertical scaling: [upgrade instance size]
- Horizontal scaling: [read replicas, sharding]
- When to scale: [metrics-based triggers]

**비개발자 설명:**
"확장성은 식당 운영과 같습니다:

**Phase 1 (MVP)**: 작은 식당, 주방장 1명, 테이블 10개
- 하루 30명 손님 가능
- 비용: 월 [X]만원

**Phase 2 (Growth)**: 중형 식당, 주방장 2명, 테이블 30개
- 하루 100명 손님 가능
- 비용: 월 [Y]만원

**Phase 3 (Scale)**: 대형 레스토랑, 주방장 5명, 테이블 100개
- 하루 500명 손님 가능
- 비용: 월 [Z]만원

우리 프로젝트는 처음에 Phase 1으로 시작하고,
사용자가 늘어나면 자동으로 확장됩니다 (auto-scaling)!"
</action>

---

## 🔒 Step 11: Security Architecture

<action>Detail security implementation based on TRD's security requirements.

### Security Layers

**1. Network Security**
- HTTPS everywhere (SSL/TLS)
- CORS configuration: [from TRD]
- Rate limiting: [from TRD]
- DDoS protection: [via hosting platform]

**2. Authentication Security**
- Password hashing: [algorithm from TRD auth solution]
- Token security: [JWT best practices / session security]
- Multi-factor authentication: [if in PRD]
- Social login security: [if in PRD]

**3. Authorization Security**
- Role-Based Access Control (RBAC): [if in PRD]
- Permission checks: [at API layer]
- Resource ownership validation

**4. Data Security**
- Encryption at rest: [database encryption]
- Encryption in transit: [HTTPS, TLS]
- Sensitive data handling: [PII, passwords, payment info]
- Data retention policy: [from PRD if mentioned]

**5. API Security**
- Input validation: [on all endpoints]
- SQL injection prevention: [via ORM/parameterized queries]
- XSS prevention: [output encoding]
- CSRF protection: [tokens for state-changing operations]

**6. File Upload Security**
- File type validation
- File size limits: [from TRD]
- Virus scanning: [if needed for PRD features]
- Secure file storage: [S3 bucket policies]

**7. Environment Security**
- Environment variables: [never commit to git]
- Secrets management: [platform-specific]
- API key rotation: [strategy]

### Security Monitoring
- Logging: [what to log from TRD monitoring]
- Audit trails: [for sensitive operations]
- Alert triggers: [suspicious activities]

**비개발자 설명:**
"보안은 여러 겹의 방어막입니다:

1. **HTTPS** = 편지봉투 (통신 암호화)
2. **Authentication** = 출입증 검사 (신분 확인)
3. **Authorization** = 권한 확인 (이 사람이 이 문을 열 수 있나?)
4. **Input Validation** = 수하물 검사 (악성 데이터 차단)
5. **Encryption** = 금고 (데이터베이스 내 중요 정보 암호화)

마치 공항 보안처럼 여러 단계를 거쳐 확인합니다!"
</action>

---

## 📊 Step 12: Monitoring & Logging Architecture

<action>Define monitoring architecture based on TRD's monitoring tools.

### Monitoring Tools
[From TRD analytics_monitoring section]

**Application Monitoring**:
- Tool: [e.g., Sentry for errors]
- Metrics: Error rate, response time, uptime
- Alerts: [when to notify team]

**Infrastructure Monitoring**:
- Tool: [hosting platform built-in / DataDog / etc.]
- Metrics: CPU, memory, disk, network
- Alerts: [resource threshold alerts]

**User Analytics**:
- Tool: [from TRD - Google Analytics / PostHog / etc.]
- Metrics: User actions, page views, conversion
- Privacy: [compliance notes]

### Logging Strategy

**What to Log**:
- API requests (method, endpoint, status, duration)
- Errors (stack trace, context)
- Authentication events (login, logout, failures)
- Business events (feature usage from PRD)
- Security events (suspicious activities)

**Log Levels**:
- ERROR: Application errors
- WARN: Warnings
- INFO: Important business events
- DEBUG: Development debugging (not in production)

**Log Storage**:
- Platform: [hosting platform logs / CloudWatch / etc.]
- Retention: [30 days / 90 days]
- Search: [log aggregation tool if any]

### Alerts Configuration

**Critical Alerts** (wake up team):
- Server down
- Database connection lost
- Error rate > 5%

**Warning Alerts** (investigate during work hours):
- Response time > 2s
- Disk usage > 80%
- Memory usage > 80%

**비개발자 설명:**
"모니터링은 식당의 CCTV와 주방 온도계 같은 겁니다:

- **에러 모니터링** = CCTV (문제 발생하면 즉시 확인)
- **성능 모니터링** = 주방 온도계 (너무 뜨거우면 경고)
- **사용자 분석** = 손님 수 카운터 (몇 명이 왔는지, 무엇을 주문했는지)
- **로그** = 일일 업무 일지 (나중에 뭔가 문제되면 기록 확인)

{{monitoring_tool}}를 사용해서 24시간 모니터링합니다!"
</action>

---

## ⚡ Step 13: Performance Optimization Architecture

<action>Define performance optimization strategies.

### Frontend Performance

**1. Code Splitting**
- Route-based splitting: [load only needed pages]
- Component lazy loading: [for heavy components]
- Tool: [Webpack / Vite built-in]

**2. Asset Optimization**
- Image optimization: [next/image / lazy loading]
- Code minification: [via build tool]
- Tree shaking: [remove unused code]

**3. Caching Strategy**
- Browser caching: [cache static assets]
- Service worker: [for PWA if in PRD]
- API response caching: [for static data]

**4. CDN Usage**
[If in TRD]:
- Static assets served via CDN
- Geographic distribution

### Backend Performance

**1. Database Optimization**
- Query optimization: [indexes from Step 8]
- Connection pooling: [reuse connections]
- N+1 query prevention: [eager loading]

**2. Caching**
[If Redis/caching in TRD]:
- Cache frequently accessed data
- Cache expensive computations
- Cache external API responses

**3. API Optimization**
- Response compression: [gzip]
- Pagination: [limit result sets]
- Field selection: [return only requested fields]

**4. Background Jobs**
[If in TRD]:
- Offload heavy tasks: [email sending, image processing]
- Queue system: [Bull / BullMQ / etc.]

### Performance Targets

Based on industry standards:
- Page load time: < 3 seconds
- API response time: < 500ms
- Time to Interactive: < 5 seconds

**비개발자 설명:**
"성능 최적화는 배달 서비스 최적화와 같습니다:

**빠른 배달을 위해:**
1. **Code Splitting** = 필요한 물건만 배달 (한번에 다 안 보냄)
2. **CDN** = 가까운 물류센터에서 배송 (미국 서버가 아닌 한국 서버)
3. **Caching** = 자주 주문하는 건 미리 준비 (매번 새로 안 만듦)
4. **Image Optimization** = 적절한 크기로 압축 (4K 사진 대신 웹용 사진)

목표: 3초 안에 페이지가 뜨도록!"
</action>

---

## 💰 Step 14: Cost Optimization Architecture

<action>Explain how architecture choices optimize costs (referencing TRD cost_estimation).

### Cost-Saving Strategies

**Phase 1 (MVP) - Maximize FREE tiers:**
- Hosting: [platform free tier from TRD]
- Database: [database free tier from TRD]
- Storage: [storage free tier from TRD]
- Estimated monthly: [from TRD MVP cost]

**What to monitor to stay in FREE tier:**
- [Metric 1 limit]
- [Metric 2 limit]
- [Metric 3 limit]

**Phase 2 (Growth) - Smart scaling:**
- Auto-scaling: [only scale when needed, scale down at night]
- Database: [use read replicas instead of bigger instance]
- CDN: [cache aggressively to reduce origin requests]
- Estimated monthly: [from TRD Growth cost]

**Phase 3 (Scale) - Optimize spend:**
- Reserved instances: [if using cloud providers]
- Compression: [reduce bandwidth costs]
- Data lifecycle: [archive old data to cheaper storage]
- Estimated monthly: [from TRD Scale cost]

### Cost Monitoring

**Set up billing alerts:**
- Alert at 50% of budget
- Alert at 80% of budget
- Hard limit at 100% of budget (if platform supports)

**Cost attribution:**
- Which features cost the most?
- Which services cost the most?

**비개발자 설명:**
"비용 최적화는 알뜰한 집 운영과 같습니다:

**Phase 1 (MVP)**: 무료 체험판 최대 활용
- 집들이할 때 샘플 증정품으로 버티기
- 월 비용: 거의 0원!

**Phase 2 (Growth)**: 필요한 것만 결제
- 손님 많을 때만 에어컨 틀기 (auto-scaling)
- 월 비용: [Y]만원

**Phase 3 (Scale)**: 대량 구매 할인
- 연간 계약으로 할인받기
- 월 비용: [Z]만원

우리는 단계별로 필요한 만큼만 지출합니다!"
</action>

---

## 🔧 Step 15: Development Environment Architecture

<action>Define development environment setup for developers.

### Local Development Setup

**Prerequisites:**
- Node.js: [version from TRD]
- [Language/Runtime]: [version from TRD backend]
- Git
- IDE: [recommendation]

**Repository Structure:**
```
project-root/
├── frontend/          # [Frontend framework]
│   ├── src/
│   ├── package.json
│   └── [config files]
├── backend/           # [Backend framework]
│   ├── src/
│   ├── package.json
│   └── [config files]
├── database/
│   └── migrations/
├── .env.example
├── docker-compose.yml  # (optional for local services)
└── README.md
```

**Environment Variables:**
Create `.env` file (never commit!):
```
DATABASE_URL=postgresql://localhost:5432/myapp_dev
JWT_SECRET=your-secret-key
[OTHER_VARS_FROM_TRD]=...
```

**Installation Steps:**
```bash
# 1. Clone repository
git clone [repo-url]

# 2. Install frontend dependencies
cd frontend
npm install

# 3. Install backend dependencies
cd ../backend
npm install

# 4. Set up database
[database setup commands from TRD]

# 5. Run migrations
[migration commands from TRD]

# 6. Start dev servers
npm run dev  # (or separate commands for frontend/backend)
```

### Development Workflow

**Branch Strategy:**
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: Feature branches
- `hotfix/*`: Urgent fixes

**Code Quality:**
- Linter: [from TRD dev tools]
- Formatter: [from TRD dev tools]
- Pre-commit hooks: [run linter + formatter]
- TypeScript: [if in TRD]

**Testing:**
[From TRD testing strategy]:
- Run tests before commit
- CI runs tests on PR
- Coverage target: [if defined]

**비개발자 설명:**
"개발 환경은 요리사의 개인 주방입니다:

실제 레스토랑(프로덕션)에 내기 전에,
요리사가 자기 주방(개발 환경)에서:
1. 레시피 시험 (코드 작성)
2. 맛보기 (로컬 테스트)
3. 동료에게 평가받기 (코드 리뷰)
4. 완벽하면 실제 레스토랑으로 (배포)

개발자마다 자기 컴퓨터에서 독립적으로 작업합니다!"
</action>

---

## 📱 Step 16: Platform-Specific Architecture (if applicable)

<action>If PRD platform includes mobile or desktop, add platform-specific architecture.

### For Mobile Apps (React Native / Flutter / etc. from TRD)

**App Architecture:**
- Navigation: [navigation library]
- State management: [from TRD]
- Local storage: [AsyncStorage / etc.]
- API client: [same as web or separate]

**Platform-Specific Features:**
- Push notifications: [implementation from TRD]
- Camera access: [if needed]
- Geolocation: [if needed]
- Offline mode: [if needed]

**App Distribution:**
- iOS: TestFlight → App Store
- Android: Internal testing → Google Play

### For Desktop Apps (Electron / Tauri / etc. from TRD)

**App Architecture:**
- Main process vs Renderer process
- IPC communication
- Auto-updates: [strategy]

**Platform-Specific:**
- Native integrations: [file system, notifications]
- Installers: [for Windows / macOS / Linux]

**비개발자 설명:**
[Explain platform differences in simple terms]

Example for mobile:
"모바일 앱은 웹앱과 비슷하지만:
- 핸드폰에 설치됩니다 (웹은 브라우저에서 열기)
- 카메라, 위치 등 핸드폰 기능 사용 가능
- 앱스토어 심사 필요 (웹은 바로 배포)
- 푸시 알림 가능

우리는 {{mobile_framework}}로 iOS와 Android 앱을 동시에 만듭니다 (코드 재사용)!"
</action>

---

## 📝 Step 17: Generate Architecture Document

<critical>⚠️ YOU MUST USE THE TEMPLATE - DO NOT write the document from scratch</critical>
<critical>The template contains YAML frontmatter which is REQUIRED for document parsing</critical>

<action>Load template from {template}</action>

<action>Now compile all the above into the architecture.md document.

**Fill in ALL template variables:**

1. **Metadata** (YAML frontmatter):
   - `project_name`: [from PRD]
   - `service_type`: [from PRD]
   - `platform`: [from PRD]
   - `architecture_pattern`: [from Step 2]
   - `tech_stack`: [from TRD]
   - `key_components_list`: [from Step 3]
   - `data_flow_paths_list`: [from Step 4]

2. **Sections:**
   - `non_technical_explanation`: [Overall system explanation in {communication_language}]
   - `architecture_goals`: [3-5 goals based on PRD]
   - `system_overview_for_non_tech`: [Storytelling explanation from Step 2]
   - `architecture_pattern_explanation`: [Pattern details from Step 2]
   - `system_diagram`: [ASCII or Mermaid diagram]
   - `similar_services_analysis`: [From Step 1 searches]
   - `frontend_architecture`: [From Step 3]
   - `backend_architecture`: [From Step 3]
   - `database_architecture`: [From Step 8]
   - `infrastructure_architecture`: [From Step 3]
   - `data_flow_for_non_tech`: [Storytelling from Step 4]
   - `data_flow_patterns`: [Technical flows from Step 4]
   - `auth_flow`: [From Step 5]
   - `feature_by_feature_architecture`: [From Step 6]
   - `api_architecture`: [From Step 7]
   - `data_storage_architecture`: [From Step 8]
   - `file_storage_architecture`: [From Step 3, TRD]
   - `state_management_architecture`: [From TRD, explain in architecture context]
   - `deployment_for_non_tech`: [Storytelling from Step 9]
   - `deployment_architecture`: [Technical from Step 9]
   - `cicd_pipeline`: [From Step 9]
   - `scalability_for_non_tech`: [Storytelling from Step 10]
   - `scalability_architecture`: [Technical from Step 10]
   - `security_architecture`: [From Step 11]
   - `monitoring_architecture`: [From Step 12]
   - `performance_optimization`: [From Step 13]
   - `cost_for_non_tech`: [Storytelling from Step 14]
   - `cost_optimization`: [Technical from Step 14]
   - `dev_environment_architecture`: [From Step 15]
   - `platform_specific_architecture`: [From Step 16 if applicable]

**Language:**
- All non-technical explanations in {communication_language}
- Technical specs in English (or language of tech ecosystem)
- Use storytelling and analogies throughout

<output-to>{default_output_file}</output-to>
</action>

---

## ✅ Step 18: Validate Against Checklist

<action>Read the validation checklist and ensure the architecture document meets all criteria.

<read-file>{validation}</read-file>

Go through each section of the checklist:
- [ ] All YAML metadata complete
- [ ] All previous documents referenced and aligned
- [ ] WebSearch performed for similar services
- [ ] All components defined
- [ ] All data flows mapped
- [ ] Auth architecture detailed
- [ ] All PRD features have architecture
- [ ] API architecture complete
- [ ] Database architecture defined
- [ ] Deployment architecture clear
- [ ] Scalability strategy defined
- [ ] Security architecture comprehensive
- [ ] Monitoring and logging defined
- [ ] Performance optimization included
- [ ] Cost optimization explained
- [ ] Non-technical explanations present for all major sections
- [ ] Technical specs sufficient for implementation
- [ ] Document saved to {default_output_file}

If any checklist items are incomplete, add them now before proceeding.
</action>

---

## 🎉 Step 19: Auto-Invoke Next Workflow

<action>The architecture document is complete and saved. Now automatically invoke the ERD workflow.

<template-output>
**Architecture 문서가 완성되었습니다!** ✅

📄 **저장 위치**: `{default_output_file}`

**포함된 내용:**
- ✅ 전체 시스템 아키텍처 구조
- ✅ 유사 서비스 아키텍처 분석 (4-8개)
- ✅ 주요 컴포넌트 정의 (Frontend, Backend, Database, Infrastructure)
- ✅ 데이터 흐름 설계
- ✅ 인증/권한 아키텍처
- ✅ PRD 모든 기능의 아키텍처 구현
- ✅ API 아키텍처
- ✅ 배포 아키텍처 및 CI/CD
- ✅ 확장성 전략 (3단계: MVP/Growth/Scale)
- ✅ 보안 아키텍처
- ✅ 모니터링 및 로깅
- ✅ 성능 최적화 전략
- ✅ 비용 최적화 전략
- ✅ 개발 환경 설정
- ✅ 비개발자를 위한 쉬운 설명 (스토리텔링)

**다음 단계:**
이제 마지막 단계인 **ERD (Entity Relationship Diagram)** 문서를 생성합니다.
ERD는 데이터베이스 스키마를 상세히 설계하는 문서입니다.

준비가 되면 기획문서 패널에서 'ERD 작성하기' 버튼을 눌러주세요!
</template-output>
</action>

---

## 📚 Additional Notes

### Communication Style
- **For non-technical founders**: Use {communication_language}, storytelling, real-world analogies
- **For developers/AI**: Technical specs, code examples, precise terminology
- **Balance**: Every technical concept should have both explanations

### WebSearch Quality
- Search for REAL similar services (Instagram, Notion, Airbnb, etc.)
- Get ACTUAL architecture blog posts and case studies
- Include working links in the document
- Learn from production systems at scale

### Consistency Checks
- All technologies MUST match TRD selections
- All features MUST come from PRD
- All user flows MUST reference UX Design
- All components MUST reference UI Design Guide

### Document Purpose
This architecture document serves:
1. **Founders**: Understand how the system works at high level
2. **Developers**: Blueprint for implementation
3. **AI agents**: Context for generating code and ERD
4. **Future reference**: System documentation

---

**Workflow complete when:**
- Architecture document is saved to {default_output_file}
- All checklist items validated
- Next workflow (startup-erd) automatically invoked
