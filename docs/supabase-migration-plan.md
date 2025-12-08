# Supabase 마이그레이션 플랜

## 1. Supabase 프로젝트 생성
- https://supabase.com 가입
- 새 프로젝트 생성
- Google OAuth Provider 설정

## 2. 프론트엔드 변경사항

### 설치
```bash
npm install @supabase/supabase-js
```

### authStore.ts 변경
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export const useAuthStore = create<AuthState>()((set) => ({
  // Google 로그인
  login: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'anyon://auth' // Deep Link
      }
    })

    if (error) throw error

    // Supabase가 자동으로 세션 관리
    const session = await supabase.auth.getSession()
    set({
      user: session.data.session?.user,
      isAuthenticated: true
    })
  },

  // 로그아웃
  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, isAuthenticated: false })
  },

  // 인증 확인
  checkAuth: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return !!session
  }
}))
```

### Deep Link 처리
```typescript
// LoginPage.tsx
useEffect(() => {
  const setupListener = async () => {
    const unlisten = await listen<string[]>('deep-link://new-url', async (event) => {
      // Supabase가 Deep Link에 세션 토큰 포함
      const url = new URL(event.payload[0])

      // Supabase가 자동으로 세션 처리
      const { data, error } = await supabase.auth.getSession()

      if (data.session) {
        set({
          user: data.session.user,
          isAuthenticated: true
        })
      }
    })

    return unlisten
  }

  setupListener()
}, [])
```

## 3. 백엔드 변경사항

### 백엔드 서버 제거!
- NestJS 서버 불필요
- auth.controller.ts 삭제
- auth.service.ts 삭제
- Prisma 설정 삭제

### Edge Functions (필요시)
복잡한 로직이 필요하면 Supabase Edge Functions 사용:

```typescript
// supabase/functions/create-subscription/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 구독 생성 로직
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({ ... })

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

## 4. 데이터베이스 마이그레이션

### Supabase 테이블 생성
```sql
-- users 테이블 (auth.users는 Supabase가 자동 생성)
create table public.profiles (
  id uuid references auth.users on delete cascade,
  email text,
  name text,
  profile_picture text,
  primary key (id)
);

-- subscriptions 테이블
create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade,
  plan_type text check (plan_type in ('FREE', 'PRO')),
  status text check (status in ('ACTIVE', 'CANCELED', 'PAST_DUE')),
  current_period_end timestamp with time zone
);

-- Row Level Security (RLS) 설정
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;

-- 정책: 사용자는 자신의 데이터만 접근 가능
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);
```

## 5. 환경 변수

### .env (Tauri 앱)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 6. 마이그레이션 순서

1. ✅ Supabase 프로젝트 생성
2. ✅ Google OAuth 설정 (Supabase Dashboard)
3. ✅ 테이블 생성 및 RLS 설정
4. ✅ 프론트엔드 코드 변경 (authStore.ts, LoginPage.tsx)
5. ✅ 백엔드 서버 제거
6. ✅ 테스트

## 7. 비용

### Supabase 가격
- **Free**: 최대 50,000 월간 활성 사용자 (개발용 충분)
- **Pro**: $25/월 (100,000 MAU)
- **Team**: $599/월 (무제한)

### vs. 직접 배포
- **NestJS on Render**: $7/월~
- **PostgreSQL on Railway**: $5/월~
- **합계**: $12/월~

→ Supabase가 더 저렴하고 관리가 쉬움!

## 결론

**추천**: Supabase로 전환하는 것이 좋습니다!
- 백엔드 배포/관리 불필요
- 개발 속도 향상
- 더 저렴한 비용
- 자동 스케일링

**단, 현재 NestJS 백엔드를 계속 쓰려면**:
- Vercel/Railway/Render에 배포 필요
- 별도 PostgreSQL 데이터베이스 필요
- 서버 관리 필요
