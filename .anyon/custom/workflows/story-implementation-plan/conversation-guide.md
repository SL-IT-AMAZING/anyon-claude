# AI-Human Conversation Guide

**효과적인 계획 구체화를 위한 대화 패턴 (코드베이스 검토 포함)**

---

## 🎯 대화 목표

스토리 문서 + **기존 코드베이스**를 기반으로 **명확한 구현 계획**으로 변환

---

## 🔄 대화 구조 (6단계)

```
┌─────────────────────────────────────────────────────────────┐
│  0. AI: 코드베이스 검토 및 분석 ⭐                           │
│     - 프로젝트 구조 파악                                     │
│     - 재사용 가능 코드 탐색                                  │
│     - 기존 패턴 분석                                         │
│     - Gap 분석                                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  1. AI: 스토리 + 코드 통합 분석                              │
│     - 스토리 내용 이해                                       │
│     - 기존 코드와 매핑 ⭐                                    │
│     - 핵심 기능 요약                                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  2. AI: 코드 기반 질문 ⭐                                    │
│     - 기존 패턴 사용 vs 새 방법                              │
│     - 컴포넌트 재사용 vs 신규 작성                           │
│     - 코드 예시 첨부                                         │
│     - 기술적 세부사항                                        │
│     - 범위 및 우선순위                                       │
│     - 예외 처리                                              │
│     - 통합 및 의존성                                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  3. 사람: 답변 및 추가 요구사항                              │
│     - 명확한 선택                                            │
│     - 이유 설명 (선택)                                       │
│     - 추가 기능 요청                                         │
│     - 제약사항 제시                                          │
│     - 코드 수정 지시 ⭐                                      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  4. AI: 구현 계획서 작성                                     │
│     - 코드베이스 분석 결과 포함 ⭐                           │
│     - 실제 파일 경로 명시 ⭐                                 │
│     - 재사용 코드 목록 ⭐                                    │
│     - 모든 결정 반영                                         │
│     - 코드 구조 명시                                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  5. 사람: 검토 및 승인/수정                                  │
│     - 승인: "좋아, 시작해"                                   │
│     - 수정: "이 부분만 바꿔줘"                               │
│     - 기존 코드 일관성 확인 ⭐                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🤖 AI의 질문 패턴

### 0️⃣ 코드베이스 검토 (새로운 Step!) ⭐

**패턴**: 분석 결과를 구조화해서 보고

```markdown
## 🔍 코드베이스 검토 결과

**프로젝트 구조**:
- Framework: {{framework}} {{version}}
- UI Library: {{ui_library}}
- State Management: {{state_management}}
- Database: {{database}} + {{orm}}
- Folder Structure: {{structure_description}}

**재사용 가능한 컴포넌트**:
✅ {{Component1}} - {{location}} - {{purpose}}
✅ {{Component2}} - {{location}} - {{purpose}}
❌ {{MissingComponent}} - 없음 (새로 만들어야 함)

**유사한 기능 발견**:
📁 {{file_path}} - {{similar_functionality}}
   [코드 예시 50줄]

**기존 API 패턴**:
- {{existing_api_pattern_1}}
- {{existing_api_pattern_2}}

**현재 DB 스키마**:
\`\`\`sql
{{current_schema}}
\`\`\`

**Gap 분석**:
- 🆕 만들어야 할 것: {{list}}
- 🔧 수정해야 할 것: {{list}}
- ♻️ 재사용 가능한 것: {{list}}
```

**예시**:
```markdown
## 🔍 코드베이스 검토 결과

**프로젝트 구조**:
- Framework: Next.js 14 (App Router)
- UI Library: Shadcn/ui + Tailwind CSS
- State Management: Zustand
- Database: PostgreSQL + Prisma
- Folder Structure: /app, /components, /lib, /stores

**재사용 가능한 컴포넌트**:
✅ Dialog (Shadcn) - /components/ui/dialog.tsx - 모달용
✅ Input - /components/ui/input.tsx - 폼 입력
✅ Button - /components/ui/button.tsx - 로딩 상태 지원
❌ ColorPicker - 없음 (새로 만들어야 함)
❌ Toast - Shadcn에 있지만 설정 필요

**유사한 기능 발견**:
📁 /app/(dashboard)/settings/page.tsx - 모달 패턴
   \`\`\`tsx
   const [isOpen, setIsOpen] = useState(false);

   <Dialog open={isOpen} onOpenChange={setIsOpen}>
     <DialogContent>
       <DialogHeader>설정</DialogHeader>
       <form onSubmit={handleSubmit}>
         <Input name="name" />
         <Button type="submit">저장</Button>
       </form>
     </DialogContent>
   </Dialog>
   \`\`\`
   → 이 패턴 그대로 사용 가능!

📁 /api/users/route.ts - CRUD API 패턴
   \`\`\`typescript
   export async function POST(req: Request) {
     const body = await req.json();
     const validated = schema.parse(body);
     // ... 처리
     return NextResponse.json(result, { status: 201 });
   }
   \`\`\`
   → 같은 구조로 /api/projects 만들면 됨

**현재 DB 스키마** (Prisma):
\`\`\`prisma
model Project {
  id          String   @id @default(uuid())
  name        String
  description String?
  createdBy   String
  createdAt   DateTime @default(now())
  // color, isFavorite 컬럼은 아직 없음 → 추가 필요
}
\`\`\`

**Gap 분석**:
- 🆕 만들어야 할 것: ColorPicker, FavoriteCheckbox, OnboardingBanner
- 🔧 수정해야 할 것: Prisma schema (2개 컬럼 추가), projectStore
- ♻️ 재사용 가능한 것: Dialog, Input, Textarea, Button, Form validation
```

---

### 1️⃣ 기존 패턴 활용 질문 ⭐

**패턴**: 기존 코드 예시와 함께 선택지 제시

```markdown
## 📋 기존 패턴 활용

### {{기능명}}

**발견한 기존 패턴**:
현재 {{existing_file_path}}에서 이런 패턴을 사용하고 있습니다:

\`\`\`{{language}}
{{existing_code_example}}
\`\`\`

**옵션 A: 기존 패턴 그대로 사용**
- 장점: 일관성, 검증됨, 빠름
- 단점: {{specific_limitations}}
- 파일: {{existing_file}} 참고

**옵션 B: 새로운 방법**
- 장점: {{new_benefits}}
- 단점: 일관성 깨질 수 있음, 새로 검증 필요
- 방법: {{new_approach}}

**추천**: {{recommendation}} - {{reason}}

→ 어느 것을 선호하시나요?
```

**예시**:
```markdown
## 📋 기존 패턴 활용

### 모달 컴포넌트 구조

**발견한 기존 패턴**:
현재 `/app/(dashboard)/settings/page.tsx`에서 Shadcn Dialog를 이런 식으로 사용합니다:

\`\`\`tsx
const [isOpen, setIsOpen] = useState(false);

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>설정 열기</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>설정</DialogTitle>
    </DialogHeader>
    <form onSubmit={handleSubmit}>
      {/* 폼 내용 */}
    </form>
  </DialogContent>
</Dialog>
\`\`\`

**옵션 A: 이 패턴 그대로 사용**
- 장점: 코드베이스 일관성, 이미 검증됨
- 단점: DialogTrigger를 Button으로 감싸야 함
- 파일: 기존 파일 그대로 참고 가능

**옵션 B: 모달을 별도 컴포넌트로 분리**
- 장점: 재사용성 높음
- 단점: 코드베이스의 다른 패턴과 다름
- 방법: CreateProjectModal 컴포넌트 생성

**추천**: 옵션 A (기존 패턴 유지)
- 이유: 프로젝트 전체에서 같은 패턴 사용 중

→ 어느 것을 선호하시나요?
```

---

### 2️⃣ 컴포넌트 재사용 질문 ⭐

**패턴**: 재사용 vs 신규 작성

```markdown
## ♻️ 컴포넌트 재사용

### {{컴포넌트명}}

**발견한 유사 컴포넌트**:
{{existing_component_path}}

\`\`\`{{language}}
{{existing_component_code}}
\`\`\`

**현재 기능**: {{current_features}}
**필요한 기능**: {{required_features}}

**옵션 A: 기존 컴포넌트 재사용 (수정 필요)**
- 추가해야 할 props: {{new_props}}
- 수정 범위: {{modification_scope}}
- 영향: {{impact_on_existing_usage}}

**옵션 B: 새 컴포넌트 작성**
- 완전히 독립적
- 영향 없음
- 추가 유지보수

→ 어떻게 하시겠습니까?
```

**예시**:
```markdown
## ♻️ 컴포넌트 재사용

### ColorPicker

**발견한 유사 컴포넌트**:
없음 - 프로젝트에 ColorPicker가 없습니다.

**하지만 기본 컴포넌트 사용 가능**:
`/components/ui/button.tsx`를 활용해서 간단한 ColorPicker 만들 수 있습니다:

\`\`\`tsx
<div className="grid grid-cols-6 gap-2">
  {colors.map(color => (
    <Button
      key={color}
      className={cn("w-8 h-8 p-0", colorClasses[color])}
      onClick={() => onChange(color)}
    />
  ))}
</div>
\`\`\`

**옵션 A: 직접 구현 (위 방식)**
- 간단함, 6개 색상만 필요
- 기존 Button 컴포넌트 재사용

**옵션 B: 외부 라이브러리 (react-colorful)**
- 완전한 기능
- 의존성 추가

**추천**: 옵션 A
- 이유: 간단한 요구사항, 불필요한 의존성 회피

→ 동의하시나요?
```

---

### 3️⃣ API 구조 질문 ⭐

**패턴**: 기존 API 패턴 vs 새 구조

```markdown
## 🔌 API 구조

### {{API 엔드포인트}}

**기존 API 패턴 발견**:
- {{existing_api_1}}: {{pattern_description_1}}
- {{existing_api_2}}: {{pattern_description_2}}

**코드 예시** ({{existing_file}}):
\`\`\`typescript
{{existing_api_code}}
\`\`\`

**질문**: 새 API를 어디에 만들까요?

**옵션 A: {{option_a_path}}** (기존 패턴 따름)
- 기존: {{existing_pattern_description}}
- 일관성: ✅
- 파일 크기: {{file_size_concern}}

**옵션 B: {{option_b_path}}** (분리)
- 독립적
- 파일 작음
- 일관성: ❌

**추천**: {{recommendation}}

→ 어떻게 하시겠습니까?
```

**예시**:
```markdown
## 🔌 API 구조

### POST /api/projects

**기존 API 패턴 발견**:
- `/api/users/route.ts`: GET, POST를 같은 파일에
- `/api/projects/[id]/route.ts`: 동적 라우트 사용

**코드 예시** (`/api/users/route.ts`):
\`\`\`typescript
export async function GET(req: Request) {
  // GET 로직
}

export async function POST(req: Request) {
  const body = await req.json();
  const validated = userSchema.parse(body);

  const user = await db.user.create({
    data: validated
  });

  return NextResponse.json(user, { status: 201 });
}
\`\`\`

**질문**: 프로젝트 생성 API를 어디에?

**옵션 A: `/api/projects/route.ts`** (기존 패턴)
- GET (목록), POST (생성)을 같은 파일에
- 기존 `/api/users/route.ts` 패턴과 동일
- 일관성: ✅
- 파일 크기: 중간 (~200줄)

**옵션 B: `/api/projects/create/route.ts`** (분리)
- POST만 독립적으로
- 파일 작음 (~100줄)
- 일관성: ❌ (다른 API들과 다름)

**추천**: 옵션 A (`/api/projects/route.ts`)
- 이유: 전체 프로젝트에서 같은 패턴 사용 중

→ 동의하시나요?
```

---

### 4️⃣ ~ 6️⃣ 기존 질문 패턴 유지

(기술적 세부사항, 범위 및 우선순위, 예외 처리는 기존 conversation-guide.md와 동일)

---

## 👤 사람의 답변 패턴

### 추가: 코드 수정 지시 ⭐

**좋은 답변**:
```
기존 패턴 써.
단, {{Component}} 컴포넌트는 {{prop}} prop 추가해서 써.

파일 경로:
- /components/ColorPicker.tsx (새로 생성)
- /app/api/projects/route.ts (POST 추가)
- /stores/projectStore.ts (addProject 메서드 추가)
```

**구조화된 형식**:
```
✅ 재사용:
- Dialog 컴포넌트 (/components/ui/dialog.tsx)
- Button with loading (/components/ui/button.tsx)

🔧 수정:
- projectStore (/stores/projectStore.ts) - addProject 추가
- Prisma schema (schema.prisma) - color, isFavorite 컬럼

🆕 새로 만들기:
- ColorPicker (/components/ColorPicker.tsx)
- OnboardingBanner (/components/OnboardingBanner.tsx)
```

---

## 📝 AI 질문 체크리스트

### 필수 질문 (코드베이스 검토 후)
- [ ] 코드베이스 분석 결과 보고했는가? ⭐
- [ ] 재사용 가능한 코드 목록 제시했는가? ⭐
- [ ] 기존 패턴 vs 새 방법 비교했는가? ⭐
- [ ] 실제 파일 경로를 제시했는가? ⭐
- [ ] 구현 방법이 여러 개인가? → 선택 요청
- [ ] 기술적 세부사항이 불명확한가? → 구체화 요청
- [ ] 예외 처리가 명시되지 않았나? → 처리 방법 질문
- [ ] 다른 Story와 의존성이 있나? → 통합 방법 확인

---

## 🎯 좋은 질문의 조건 (업데이트)

### ✅ 좋은 질문
1. **구체적**: "Shadcn Dialog 패턴 vs 커스텀 모달?" (O)
2. **코드 예시 포함**: 기존 코드 50줄 첨부 ⭐
3. **파일 경로 명시**: "/app/(dashboard)/settings/page.tsx에서..." ⭐
4. **옵션 제시**: "패턴 A vs B?"
5. **영향도 설명**: "기존 코드 3곳에 영향" ⭐
6. **이유 포함**: "왜 이게 중요한지"
7. **추천 포함**: "제 추천은 A입니다. 왜냐하면..."

---

## 🔄 반복 패턴 (업데이트)

모든 스토리에 대해 동일한 패턴 적용:

```
0. AI: 코드베이스 검토 → 분석 보고 ⭐
1. AI: 스토리 + 코드 분석 → 질문 (코드 예시 포함) ⭐
2. 사람: 답변 (명확한 선택 + 코드 수정 지시) ⭐
3. AI: 계획서 작성 (실제 파일 경로 포함) ⭐
4. 사람: 승인/수정
5. AI: 개발 시작
```

**목표**: 40-80개 스토리 모두 **기존 코드와 일관된** 품질의 계획 수립 ⭐

---

**다음**: `example-full-conversation.md`에서 코드베이스 검토 포함 완전한 대화 예시 확인
