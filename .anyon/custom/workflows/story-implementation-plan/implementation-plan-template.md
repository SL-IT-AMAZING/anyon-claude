# Implementation Plan Template

**AI가 100% 자동으로 개발할 수 있는 완벽한 계획서**

---

## 📋 기본 정보

```markdown
# Implementation Plan: Story {{story_number}} - {{story_name}}

**Story ID**: {{story_id}}
**Epic**: {{epic_name}}
**Plan Date**: {{date}}
**Status**: Approved / In Development / Completed

## 📖 Story Summary

{{story_user_description}}

**Value**: {{story_value}}

**Scope Decided**:
- ✅ Included: {{included_features}}
- ❌ Excluded: {{excluded_features}}
- ⏳ Future: {{future_features}}
```

---

## 0️⃣ Codebase Analysis Results ⭐

### 0.1 Project Structure

```markdown
## 🏗️ 코드베이스 분석

**프로젝트 환경**:
- Framework: {{framework}} {{version}}
- UI: {{ui_library}}
- State: {{state_management}}
- Database: {{database}}
- ORM: {{orm}}

**폴더 구조**:
{{folder_structure}}
```

### 0.2 Reusable Components

```markdown
## ♻️ 재사용 코드

**재사용할 컴포넌트**:
- `{{component_path}}` - {{component_purpose}}
  - 현재 기능: {{current_features}}
  - 수정 필요: {{modifications_needed}}

**재사용할 패턴**:
- `{{pattern_file}}` - {{pattern_description}}
  - 사용 예시 첨부

**새로 만들 것**:
- `{{new_component}}` - {{reason_for_new}}
```

### 0.3 Existing Patterns

```markdown
## 📐 기존 패턴 분석

**API 패턴**:
- 위치: {{existing_api_paths}}
- 구조: {{api_structure_pattern}}
- 예시: [파일 경로]

**Component 패턴**:
- 위치: {{existing_component_paths}}
- 구조: {{component_pattern}}
- 예시: [파일 경로]

**State 패턴**:
- Store 위치: {{store_paths}}
- 패턴: {{state_pattern}}

**현재 DB Schema**:
\`\`\`sql
{{current_schema}}
\`\`\`
```

### 0.4 File Changes Summary

```markdown
## 📝 파일 변경 계획

**수정할 파일**:
- `{{file_path_1}}` - {{change_description_1}}
- `{{file_path_2}}` - {{change_description_2}}

**새로 만들 파일**:
- `{{new_file_path_1}}` - {{purpose_1}}
- `{{new_file_path_2}}` - {{purpose_2}}

**영향받는 파일** (읽기만):
- `{{related_file_1}}` - {{why_related}}
```

---

## 1️⃣ UI/UX Implementation

### 1.1 Component Tree

```markdown
## 🎨 Component Structure

### Component Hierarchy
\`\`\`
{{ParentComponent}}/
├── {{Component1}}
│   ├── {{SubComponent1A}}
│   └── {{SubComponent1B}}
├── {{Component2}}
│   ├── {{SubComponent2A}}
│   └── {{SubComponent2B}}
└── {{Component3}}
\`\`\`

### Component Responsibilities

#### {{Component1}}
- **Purpose**: {{purpose}}
- **Props**:
  \`\`\`typescript
  interface {{Component1}}Props {
    {{prop1}}: {{type}};
    {{prop2}}: {{type}};
    on{{Action}}: ({{params}}) => void;
  }
  \`\`\`
- **State**: {{local_state}}
- **Events**: {{events}}

#### {{Component2}}
- **Purpose**: {{purpose}}
- **Props**: {{props}}
- **State**: {{state}}
```

**예시**:
```markdown
## 🎨 Component Structure

### Component Hierarchy
\`\`\`
ProjectListPage/
├── CreateProjectModal
│   ├── CreateProjectForm
│   │   ├── NameInput
│   │   ├── DescriptionTextarea
│   │   ├── TemplateSelector
│   │   ├── ColorPicker
│   │   └── FavoriteCheckbox
│   └── ModalFooter
└── ProjectGrid
\`\`\`

### Component Responsibilities

#### CreateProjectModal
- **Purpose**: 프로젝트 생성 모달 컨테이너
- **Props**:
  \`\`\`typescript
  interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (projectId: string) => void;
  }
  \`\`\`
- **State**: None (Shadcn Dialog handles it)
- **Events**: onClose, onSuccess

#### CreateProjectForm
- **Purpose**: 프로젝트 생성 폼 로직 및 검증
- **Props**:
  \`\`\`typescript
  interface CreateProjectFormProps {
    onSuccess: (projectId: string) => void;
    onCancel: () => void;
  }
  \`\`\`
- **State**: Form state (React Hook Form)
- **Events**: onSubmit, onCancel
- **Validation**: Zod schema
```

---

### 1.2 UI Layout & Styling

```markdown
## 🎨 UI Layout

### {{ComponentName}} Layout

**Dimensions**:
- Width: {{width}}
- Height: {{height}}
- Padding: {{padding}}
- Margin: {{margin}}

**Grid/Flex**:
- Display: {{flex/grid}}
- Direction: {{direction}}
- Gap: {{gap}}

**Responsive**:
- Mobile: {{mobile_layout}}
- Tablet: {{tablet_layout}}
- Desktop: {{desktop_layout}}

**Colors** (Tailwind):
- Background: {{bg_color}}
- Text: {{text_color}}
- Border: {{border_color}}
- Accent: {{accent_color}}
```

**예시**:
```markdown
## 🎨 UI Layout

### CreateProjectModal Layout

**Dimensions**:
- Width: 500px (md:600px)
- Height: auto (max-height: 80vh)
- Padding: p-6
- Margin: m-auto

**Grid/Flex**:
- Display: flex flex-col
- Gap: gap-4

**Modal Structure**:
\`\`\`
┌─────────────────────────────────┐
│  Header (flex justify-between)  │  ← h-16, border-b
├─────────────────────────────────┤
│                                 │
│  Body (flex flex-col gap-4)     │  ← p-6
│  - Name Input                   │
│  - Description Textarea         │
│  - Template RadioGroup          │
│  - Color Picker (grid-cols-6)  │
│  - Favorite Checkbox            │
│                                 │
├─────────────────────────────────┤
│  Footer (flex justify-end)      │  ← h-16, border-t, gap-2
│  [Cancel] [Create]              │
└─────────────────────────────────┘
\`\`\`

**Colors** (Tailwind):
- Background: bg-white dark:bg-gray-900
- Text: text-gray-900 dark:text-gray-50
- Border: border-gray-200 dark:border-gray-800
- Primary: bg-blue-600 hover:bg-blue-700
```

---

### 1.3 Interactions & Animations

```markdown
## ✨ Interactions

### User Actions

| Action | Trigger | Response | Duration |
|--------|---------|----------|----------|
| {{action1}} | {{trigger}} | {{response}} | {{duration}} |
| {{action2}} | {{trigger}} | {{response}} | {{duration}} |

### Animations

| Element | Animation | Trigger | CSS/Framer |
|---------|-----------|---------|------------|
| {{element1}} | {{animation}} | {{trigger}} | {{code}} |
| {{element2}} | {{animation}} | {{trigger}} | {{code}} |

### Loading States

| State | UI | Duration |
|-------|----|----|
| {{state1}} | {{ui}} | {{duration}} |
| {{state2}} | {{ui}} | {{duration}} |
```

**예시**:
```markdown
## ✨ Interactions

### User Actions

| Action | Trigger | Response | Duration |
|--------|---------|----------|----------|
| Open Modal | Click "+ New Project" | Modal fade-in | 200ms |
| Close Modal | Click X or ESC | Modal fade-out | 200ms |
| Submit Form | Click "Create" | Button loading + disable | Until API response |
| Validation Error | Invalid input | Shake animation + error text | 300ms |
| Success | API success | Toast + redirect | Toast 3s |

### Animations

| Element | Animation | Trigger | CSS/Tailwind |
|---------|-----------|---------|--------------|
| Modal | fade-in + scale | Open | `animate-in fade-in-0 zoom-in-95 duration-200` |
| Modal | fade-out + scale | Close | `animate-out fade-out-0 zoom-out-95 duration-200` |
| Error message | shake | Validation fail | `animate-shake` (custom) |
| Success toast | slide-in-right | API success | Shadcn toast default |

### Loading States

| State | UI | Duration |
|-------|----|----|
| Form submit | Button spinner + "Creating..." | Until API response |
| Template loading | Skeleton (if async) | N/A (sync) |
```

---

## 2️⃣ API Design

### 2.1 Endpoints

```markdown
## 🔌 API Endpoints

### {{METHOD}} {{endpoint}}

**Purpose**: {{purpose}}

**Request**:
\`\`\`typescript
interface {{RequestType}} {
  {{field1}}: {{type}};  // {{description}}
  {{field2}}?: {{type}}; // {{description}} (optional)
}
\`\`\`

**Response Success ({{status_code}})**:
\`\`\`typescript
interface {{ResponseType}} {
  {{field1}}: {{type}};
  {{field2}}: {{type}};
}
\`\`\`

**Response Errors**:
\`\`\`typescript
// 400 Bad Request
{
  error: "Validation failed",
  details: [
    { field: "{{field}}", message: "{{message}}" }
  ]
}

// 409 Conflict
{
  error: "Duplicate project name",
  message: "{{message}}"
}

// 500 Internal Server Error
{
  error: "Internal server error",
  message: "{{message}}"
}
\`\`\`

**Headers**:
- Authorization: Bearer {{token}}
- Content-Type: application/json

**Validation Rules**:
- {{field1}}: {{rules}}
- {{field2}}: {{rules}}
```

**예시**:
```markdown
## 🔌 API Endpoints

### POST /api/projects

**Purpose**: 새 프로젝트 생성 (동기 처리)

**Request**:
\`\`\`typescript
interface CreateProjectRequest {
  name: string;          // 1-100 chars, required
  description?: string;  // 0-500 chars, optional
  templateType: 'blank' | 'kanban' | 'scrum';
  color: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'gray';
  isFavorite: boolean;
}
\`\`\`

**Response Success (201)**:
\`\`\`typescript
interface CreateProjectResponse {
  id: string;           // UUID
  name: string;
  description: string | null;
  templateType: string;
  color: string;
  isFavorite: boolean;
  createdBy: string;    // User ID
  createdAt: string;    // ISO 8601
  columns?: Column[];   // If template applied
}
\`\`\`

**Response Errors**:
\`\`\`typescript
// 400 Bad Request - Validation
{
  error: "Validation failed",
  details: [
    { field: "name", message: "Name is required" }
  ]
}

// 409 Conflict - Duplicate name
{
  error: "Duplicate project name",
  message: "Project 'My Project' already exists"
}

// 401 Unauthorized
{
  error: "Unauthorized",
  message: "Authentication required"
}
\`\`\`

**Headers**:
- Authorization: Bearer {JWT}
- Content-Type: application/json

**Validation Rules**:
- name: required, trim, lowercase for duplicate check, 1-100 chars
- description: optional, trim, 0-500 chars
- templateType: required, enum
- color: required, enum
- isFavorite: required, boolean
```

---

### 2.2 Processing Logic

```markdown
## ⚙️ Processing Logic

### Flow Diagram

\`\`\`
Request → Validation → Auth Check → Duplicate Check → Create Project → Apply Template → Response
    ↓           ↓           ↓             ↓                ↓               ↓            ↓
  400        400         401           409             500             500         201
\`\`\`

### Step-by-Step

**1. Validation**
- Validate request body against Zod schema
- Trim name and description
- Check enum values
- If fail → 400

**2. Auth Check**
- Verify JWT token
- Get user ID
- If fail → 401

**3. Duplicate Check**
- Query: `SELECT 1 FROM projects WHERE LOWER(name) = LOWER($1) AND created_by = $2`
- If exists → 409

**4. Create Project (Transaction Start)**
- INSERT INTO projects
- Get generated ID

**5. Apply Template**
- If templateType === 'kanban':
  - INSERT INTO columns (3 rows: "To Do", "In Progress", "Done")
- If templateType === 'scrum':
  - INSERT INTO columns (4 rows: "Backlog", "Sprint", "In Progress", "Done")
- If templateType === 'blank':
  - Skip

**6. Commit Transaction**

**7. Response**
- Return 201 with created project data

### Error Handling

| Step | Error | Action |
|------|-------|--------|
| Any | Database error | Rollback transaction → 500 |
| Create | Unique constraint violation | Rollback → 409 |
| Template | Insert failure | Rollback → 500 |
```

---

## 3️⃣ Database Schema

### 3.1 Schema Changes

```markdown
## 🗄️ Database Schema

### New Tables

\`\`\`sql
-- None (using existing tables)
\`\`\`

### Modified Tables

\`\`\`sql
-- projects table (modifications)
ALTER TABLE projects ADD COLUMN color VARCHAR(20) NOT NULL DEFAULT 'blue';
ALTER TABLE projects ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT false;

-- Unique constraint (name + created_by)
CREATE UNIQUE INDEX idx_projects_name_user
  ON projects(LOWER(name), created_by);
\`\`\`

### Full Schema (for reference)

\`\`\`sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  template_type VARCHAR(20) NOT NULL,
  color VARCHAR(20) NOT NULL DEFAULT 'blue',        -- 🆕
  is_favorite BOOLEAN NOT NULL DEFAULT false,       -- 🆕
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_projects_name_user
  ON projects(LOWER(name), created_by);             -- 🆕

CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
\`\`\`
```

---

### 3.2 Migrations

```markdown
## 📝 Migration Files

### Migration: add_project_color_and_favorite

**Up**:
\`\`\`sql
-- 001_add_project_color_and_favorite.up.sql

-- Add columns
ALTER TABLE projects
  ADD COLUMN color VARCHAR(20) NOT NULL DEFAULT 'blue',
  ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT false;

-- Add unique constraint
CREATE UNIQUE INDEX idx_projects_name_user
  ON projects(LOWER(name), created_by);

-- Update existing projects (set default color)
UPDATE projects SET color = 'blue' WHERE color IS NULL;
\`\`\`

**Down**:
\`\`\`sql
-- 001_add_project_color_and_favorite.down.sql

DROP INDEX IF EXISTS idx_projects_name_user;
ALTER TABLE projects
  DROP COLUMN IF EXISTS color,
  DROP COLUMN IF EXISTS is_favorite;
\`\`\`
```

---

## 4️⃣ State Management

```markdown
## 🔄 State Management

### Global State (Zustand)

\`\`\`typescript
// stores/projectStore.ts

interface ProjectStore {
  projects: Project[];
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
}

const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],

  addProject: (project) =>
    set((state) => ({
      projects: [project, ...state.projects]
    })),

  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map(p =>
        p.id === id ? { ...p, ...updates } : p
      )
    })),

  deleteProject: (id) =>
    set((state) => ({
      projects: state.projects.filter(p => p.id !== id)
    }))
}));
\`\`\`

### Local State (Component)

\`\`\`typescript
// CreateProjectForm.tsx

const [isSubmitting, setIsSubmitting] = useState(false);

const form = useForm<CreateProjectFormData>({
  resolver: zodResolver(createProjectSchema),
  defaultValues: {
    name: '',
    description: '',
    templateType: 'kanban',
    color: 'blue',
    isFavorite: false
  }
});
\`\`\`

### Server State (React Query)

\`\`\`typescript
// hooks/useCreateProject.ts

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { addProject } = useProjectStore();

  return useMutation({
    mutationFn: (data: CreateProjectRequest) =>
      api.post('/api/projects', data),

    onSuccess: (response) => {
      // Update local store (optimistic)
      addProject(response.data);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['projects'] });

      // Navigate
      router.push(`/projects/${response.data.id}`);

      // Toast
      toast.success('Project created successfully');
    },

    onError: (error) => {
      if (error.response?.status === 409) {
        form.setError('name', {
          message: 'Project name already exists'
        });
      } else {
        toast.error('Failed to create project');
      }
    }
  });
};
\`\`\`
```

---

## 5️⃣ Validation & Error Handling

```markdown
## ✅ Validation

### Client-Side (Zod)

\`\`\`typescript
// schemas/project.schema.ts

export const createProjectSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),

  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional(),

  templateType: z.enum(['blank', 'kanban', 'scrum']),

  color: z.enum(['blue', 'green', 'red', 'purple', 'orange', 'gray']),

  isFavorite: z.boolean()
});

export type CreateProjectFormData = z.infer<typeof createProjectSchema>;
\`\`\`

### Server-Side (Same Schema)

\`\`\`typescript
// app/api/projects/route.ts

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate with Zod
    const validated = createProjectSchema.parse(body);

    // Additional validation
    if (await isDuplicateName(validated.name, userId)) {
      return NextResponse.json(
        { error: 'Duplicate project name' },
        { status: 409 }
      );
    }

    // Process...
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
\`\`\`

### Error Messages (User-Friendly)

| Error Code | Technical | User Message |
|------------|-----------|--------------|
| 400 | Validation failed | "Please check your input" |
| 401 | Unauthorized | "Please sign in to continue" |
| 409 | Duplicate name | "This project name is already in use" |
| 500 | Server error | "Something went wrong. Please try again" |
| Network | Connection failed | "Connection failed. Please check your internet" |
```

---

## 6️⃣ Testing Strategy

```markdown
## 🧪 Testing

### Unit Tests

**Components**:
- [ ] CreateProjectModal renders correctly
- [ ] CreateProjectForm validation works
- [ ] ColorPicker selects colors
- [ ] FavoriteCheckbox toggles state

**Hooks**:
- [ ] useCreateProject calls API correctly
- [ ] useCreateProject handles errors
- [ ] useCreateProject updates store

**Utils**:
- [ ] Validation schema validates correctly
- [ ] Error messages display correctly

### Integration Tests

- [ ] Full flow: Open modal → Fill form → Submit → Success
- [ ] Error handling: Duplicate name → Error message shown
- [ ] Network error → Retry button works
- [ ] Form validation → Error messages show

### E2E Tests (Playwright/Cypress)

\`\`\`typescript
test('User can create a new project', async ({ page }) => {
  // 1. Go to projects page
  await page.goto('/projects');

  // 2. Click "New Project" button
  await page.click('button:has-text("New Project")');

  // 3. Fill form
  await page.fill('input[name="name"]', 'Test Project');
  await page.fill('textarea[name="description"]', 'Test Description');
  await page.click('[data-template="kanban"]');
  await page.click('[data-color="blue"]');

  // 4. Submit
  await page.click('button:has-text("Create")');

  // 5. Assert redirect
  await page.waitForURL('/projects/*');

  // 6. Assert project exists
  expect(page.url()).toContain('/projects/');

  // 7. Assert toast
  await expect(page.locator('.toast')).toHaveText('Project created');
});

test('Shows error on duplicate project name', async ({ page }) => {
  // Create first project
  await createProject('Duplicate Name');

  // Try to create duplicate
  await page.goto('/projects');
  await page.click('button:has-text("New Project")');
  await page.fill('input[name="name"]', 'Duplicate Name');
  await page.click('button:has-text("Create")');

  // Assert error
  await expect(page.locator('.error')).toHaveText('already exists');
});
\`\`\`
```

---

## 7️⃣ Performance & Security

```markdown
## ⚡ Performance

### Optimization Strategies

| Area | Strategy | Impact |
|------|----------|--------|
| API | Sync processing (simple) | ~200ms response |
| UI | No unnecessary re-renders | Instant feedback |
| Form | Debounced validation | Smooth UX |
| Store | Optimistic updates | Feels instant |

### Metrics Goals

- API response: < 500ms
- Modal open: < 200ms
- Form submit: < 1000ms total
- UI interaction: < 100ms

## 🔒 Security

### Measures

| Threat | Protection | Implementation |
|--------|------------|----------------|
| XSS | Input sanitization | Trim, escape HTML |
| SQL Injection | Parameterized queries | PostgreSQL $1, $2 |
| CSRF | Token validation | Next.js built-in |
| Auth | JWT validation | Middleware |
| Rate limiting | Per-user limits | 10 req/min |

### Validation

- **Client**: Zod schema
- **Server**: Same Zod schema (redundant validation)
- **Database**: Constraints (UNIQUE, NOT NULL, FK)
```

---

## 8️⃣ Implementation Checklist

```markdown
## ✅ Development Checklist

### Phase 1: Database
- [ ] Write migration files
- [ ] Test migrations (up/down)
- [ ] Apply to dev database
- [ ] Verify schema changes

### Phase 2: API
- [ ] Create API route
- [ ] Implement validation
- [ ] Implement duplicate check
- [ ] Implement create logic
- [ ] Implement template logic
- [ ] Add error handling
- [ ] Test with Postman/curl

### Phase 3: Frontend
- [ ] Create ColorPicker component
- [ ] Create FavoriteCheckbox component
- [ ] Update CreateProjectForm
- [ ] Add new fields to form
- [ ] Update validation schema
- [ ] Create useCreateProject hook
- [ ] Update Zustand store

### Phase 4: Integration
- [ ] Wire up API to UI
- [ ] Test full flow (happy path)
- [ ] Test error cases
- [ ] Test edge cases

### Phase 5: Testing
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Write E2E tests
- [ ] Run all tests
- [ ] Fix any failures

### Phase 6: Review & Deploy
- [ ] Code review
- [ ] Fix review comments
- [ ] Manual QA testing
- [ ] Deploy to staging
- [ ] Test on staging
- [ ] Deploy to production
```

---

## 9️⃣ Acceptance Criteria (from Story)

```markdown
## ✅ Acceptance Criteria

All criteria from original story MUST pass:

- [ ] "새 프로젝트" 버튼이 프로젝트 목록 화면 우측 상단에 표시된다
- [ ] 버튼 클릭 시 프로젝트 생성 모달이 중앙에 나타난다
- [ ] 프로젝트 이름 필드가 필수이며, 비어있으면 에러 메시지 표시
- [ ] 프로젝트 이름은 최대 100자로 제한된다
- [ ] 프로젝트 설명은 선택 사항이며 최대 500자로 제한된다
- [ ] 템플릿 선택 옵션이 3가지 이상 제공된다
- [ ] 생성 버튼 클릭 시 로딩 상태가 표시된다
- [ ] 프로젝트 생성 성공 시 해당 프로젝트의 칸반보드로 리다이렉션된다
- [ ] 성공 토스트 메시지가 3초간 표시된다
- [ ] 생성 실패 시 에러 메시지가 모달에 표시된다
- [ ] ESC 키 또는 모달 외부 클릭으로 모달을 닫을 수 있다

**Additional (from planning)**:
- [ ] 색상 선택 옵션 6가지 표시
- [ ] 즐겨찾기 체크박스 동작
- [ ] 중복 이름 체크 (대소문자 구분 안 함)
```

---

## 🔟 Notes & Decisions

```markdown
## 📝 Key Decisions Made During Planning

### 1. Project Creation Flow
- **Decision**: Option A - Immediate redirect
- **Reason**: Fast start, users prefer quick access
- **Trade-off**: Additional settings done later (acceptable)

### 2. API Processing
- **Decision**: Synchronous processing
- **Reason**: Simple, templates are fast (~200ms)
- **Trade-off**: Slightly slower than async (acceptable)

### 3. Duplicate Handling
- **Decision**: Error message (no auto-numbering)
- **Reason**: User should choose meaningful names
- **Trade-off**: Extra step (better UX)

### 4. Color Management
- **Decision**: Store presets in DB
- **Reason**: Easy to add more colors later
- **Trade-off**: Extra DB query (negligible)

### 5. Template Columns
- **Decision**: Kanban = 3 cols, Scrum = 4 cols
- **Reason**: Simple defaults, users can customize
- **Trade-off**: Less initial options (can add later)
```

---

## 📚 References

```markdown
## 🔗 Related Documents

- **Original Story**: `story-2-프로젝트-생성.md`
- **Epic**: `epic-1-프로젝트-목록/epic.md`
- **PRD Section**: "3.1 프로젝트 관리 - 프로젝트 생성"
- **UX Design**: "프로젝트 목록 화면 - 생성 플로우"
- **TRD**: "React Hook Form, Zod, TanStack Query"
- **Architecture**: "Frontend - Project Management Module"
- **ERD**: "projects 테이블"

## 🎯 Related Stories

- **Depends on**: Story 1 (사용자 인증) - for created_by field
- **Blocks**: Story 3 (프로젝트 삭제) - needs projects to exist
- **Related**: Story 5 (칸반보드) - consumes template data
```

---

**Status**: ✅ Approved - Ready for Development

**Next**: AI Auto-Development 🚀
