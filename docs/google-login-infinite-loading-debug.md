# 구글 로그인 무한 로딩 문제 분석

## 📋 현재 상황

### 증상
- 빌드된 앱에서 구글 로그인 시도
- "ANYON 열기" 버튼 클릭 시 앱으로 돌아옴 ✅
- **하지만 무한 로딩 상태에 걸림** ❌

### 예상되는 플로우
1. LoginPage → "Google로 계속하기" 클릭
2. `setIsLoading(true)` → 60초 타이머 시작
3. 브라우저에서 구글 로그인
4. 백엔드 콜백 → `anyon://auth/callback?token=...` deep link 트리거
5. 앱으로 돌아옴 (이 부분은 작동함 ✅)
6. App.tsx가 deep link 이벤트 수신
7. `login(token)` 호출 → `/auth/me` API 요청
8. `isAuthenticated = true` → LoginPage의 `setIsLoading(false)`

**문제: 6~8번 단계 어딘가에서 실패하고 있음**

---

## 🔍 문제 후보군

### 1. Deep Link 이벤트 수신 실패 ⚠️ **가능성: 높음**

**증상**: 앱으로 돌아오지만 이벤트가 JavaScript로 전달되지 않음

#### 1-1. 이벤트 리스너 타이밍 문제
```typescript
// App.tsx:119-166
useEffect(() => {
  const setupDeepLinkListener = async () => {
    const unlisten = await listen<string[]>('plugin:deep-link://urls', async (event) => {
      // 이 핸들러가 등록되기 전에 deep link가 도착했을 수 있음
    });
  };
  // ...
}, []);
```

**가능한 원인**:
- React 컴포넌트가 mount되기 전에 deep link 이벤트가 발생
- 이벤트 리스너 등록이 완료되기 전에 이벤트 도착

**검증 방법**:
```typescript
console.log('🎧 [App] Deep link listener registered at:', new Date().toISOString());
```

#### 1-2. main.rs의 이벤트 emit 실패
```rust
// main.rs:151-152
if let Err(e) = handle.emit("plugin:deep-link://urls", urls.clone()) {
    eprintln!("❌ [STARTUP] Failed to emit deep link event: {}", e);
}
```

**가능한 원인**:
- Tauri 이벤트 시스템 초기화 전에 emit 시도
- WebView가 준비되지 않은 상태에서 이벤트 발생

---

### 2. 토큰 파싱 실패 ⚠️ **가능성: 중간**

**증상**: URL에서 토큰을 추출하지 못함

#### 2-1. URL 형식 불일치
```typescript
// App.tsx:132-133
const url = new URL(urlString);
const token = url.searchParams.get('token');
```

**가능한 원인**:
- 실제 deep link 형식: `anyon://auth/callback?token=...`
- URL 파싱 실패 → `token = null`
- 또는 deep link가 `anyon://callback?token=...`으로 와야 하는데 path가 다름

**검증 방법**:
```typescript
console.log('📥 [App] Received URL:', urlString);
console.log('🔑 [App] Parsed token:', token);
```

#### 2-2. 여러 URL이 배열로 전달됨
```typescript
// App.tsx:128
for (const urlString of urls) {
```

**가능한 원인**:
- `urls` 배열이 비어있음
- 또는 예상치 못한 형식으로 전달됨

---

### 3. login(token) API 호출 실패 ⚠️ **가능성: 매우 높음**

**증상**: `/auth/me` API 요청이 실패

#### 3-1. API_URL 불일치
```typescript
// LoginPage.tsx:11
const API_URL = import.meta.env.VITE_AUTH_API_URL || 'https://auth.any-on.com';

// authStore.ts:40
const API_URL = import.meta.env.VITE_AUTH_API_URL || 'https://auth.any-on.com';
```

**가능한 원인**:
- 빌드 시 `VITE_AUTH_API_URL`이 설정되지 않음
- 기본값 `https://auth.any-on.com`이 응답하지 않음
- 또는 로컬 서버 `http://localhost:4000`을 사용해야 하는데 production URL 사용

**검증 방법**:
```bash
# 빌드 시 환경 변수 확인
echo $VITE_AUTH_API_URL
```

#### 3-2. CORS 문제
```javascript
// server/index.js:109-116
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:1420',
  'http://localhost:4000',
  'https://auth.any-on.com',
  'tauri://localhost',
  'https://tauri.localhost'
];
```

**가능한 원인**:
- Tauri 앱의 origin이 allowedOrigins에 없음
- 빌드된 앱의 실제 origin: `tauri://localhost`, `https://tauri.localhost`, 또는 다른 값

#### 3-3. 네트워크 타임아웃
```typescript
// authStore.ts:72-77
const response = await tauriFetch(`${API_URL}/auth/me`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

**가능한 원인**:
- API 서버가 응답하지 않음
- 네트워크 연결 문제
- Tauri HTTP plugin 권한 문제

---

### 4. LoginPage 상태 동기화 실패 ⚠️ **가능성: 낮음**

**증상**: `login(token)`은 성공했지만 LoginPage가 인식하지 못함

#### 4-1. LoginPage가 unmount됨
```typescript
// LoginPage.tsx:93-98
useEffect(() => {
  if (isAuthenticated) {
    setIsLoading(false);
    clearLoginTimeout();
  }
}, [isAuthenticated]);
```

**가능한 원인**:
- Deep link로 앱이 포커스되면서 LoginPage가 unmount
- 그 후 login 성공 → `isAuthenticated = true`
- 하지만 LoginPage가 다시 mount되지 않음

#### 4-2. Zustand store 동기화 지연
```typescript
// authStore.ts:85-92
set({
  user: data.user,
  subscription: data.subscription,
  accessToken: token,
  isAuthenticated: true,
  isLoading: false,
  error: null,
});
```

**가능한 원인**:
- Zustand store 업데이트가 React 컴포넌트에 전파되지 않음
- 또는 전파 지연

---

### 5. 타이머 문제 ⚠️ **가능성: 낮음**

**증상**: 60초 타이머가 작동하지 않거나 너무 빨리 작동

#### 5-1. 타이머가 clear되지 않음
```typescript
// LoginPage.tsx:36-40
loginTimeoutRef.current = window.setTimeout(() => {
  setIsLoading(false);
  setError('로그인 시간이 초과되었습니다. 다시 시도해주세요.');
  loginTimeoutRef.current = null;
}, 60000);
```

**가능한 원인**:
- `clearLoginTimeout()`이 호출되지 않음
- 또는 타이머가 이미 만료됨

---

### 6. App.tsx의 setIsLoginInProgress 문제 ⚠️ **가능성: 중간**

**증상**: LoginPage가 렌더링되지 않음

```typescript
// App.tsx:137-144
setIsLoginInProgress(true);
setIsChecking(false);
try {
  await useAuthStore.getState().login(token);
  console.log('✅ [App] Login successful via deep link');
} finally {
  setIsLoginInProgress(false);
}
```

**가능한 원인**:
- `isLoginInProgress = true` 상태에서 App.tsx:91-94 때문에 인증 체크를 건너뜀
- 그러면 LoginPage가 계속 로딩 상태로 남음

```typescript
// App.tsx:91-94
if (isLoginInProgress) {
  setIsChecking(false);
  return;
}
```

---

## 🔧 디버깅 체크리스트

### 즉시 확인해야 할 것들:

1. **Deep link 이벤트 로그**
   - [ ] `console.log('📥 [App] Deep link received:', event.payload)` 찍히는지
   - [ ] URLs 배열에 뭐가 들어있는지
   - [ ] 토큰 파싱 결과

2. **API 호출 로그**
   - [ ] `login(token)` 함수가 실제로 호출되는지
   - [ ] API_URL이 어디로 설정되어 있는지
   - [ ] `/auth/me` 응답 상태 코드

3. **LoginPage 상태**
   - [ ] `isLoading` 값
   - [ ] `isAuthenticated` 값
   - [ ] 타이머가 clear되는지

4. **환경 변수**
   - [ ] 빌드 시 `VITE_AUTH_API_URL` 값
   - [ ] 런타임에 `import.meta.env.VITE_AUTH_API_URL` 값

---

## 🎯 가장 가능성 높은 원인 TOP 3

### 1위: API 호출 실패 (API_URL 또는 CORS)
- 빌드된 앱에서 `https://auth.any-on.com`으로 요청하는데 서버가 없음
- 또는 로컬 서버를 사용해야 하는데 production URL 사용

### 2위: Deep link 이벤트가 JavaScript로 전달되지 않음
- Tauri 이벤트 시스템 타이밍 문제
- 또는 이벤트 리스너가 제대로 등록되지 않음

### 3위: isLoginInProgress 상태 문제
- `setIsLoginInProgress(true)` 후 LoginPage가 렌더링되지 않음
- 또는 finally 블록에서 false로 설정되지 않음

---

## 🚀 즉시 시도할 해결책

### 1단계: 로그 추가하고 다시 빌드

```typescript
// App.tsx - Deep link 리스너에 로그 추가
const unlisten = await listen<string[]>('plugin:deep-link://urls', async (event) => {
  console.log('📥 [App] Deep link received:', event.payload);
  console.log('📥 [App] Current time:', new Date().toISOString());

  const urls = event.payload;
  if (urls && urls.length > 0) {
    for (const urlString of urls) {
      console.log('🔍 [App] Processing URL:', urlString);
      try {
        const url = new URL(urlString);
        console.log('🔍 [App] Parsed URL:', url);
        const token = url.searchParams.get('token');
        console.log('🔑 [App] Token:', token ? `${token.substring(0, 20)}...` : 'NULL');

        if (token) {
          console.log('🚀 [App] Starting login...');
          setIsLoginInProgress(true);
          setIsChecking(false);
          try {
            await useAuthStore.getState().login(token);
            console.log('✅ [App] Login successful via deep link');
          } catch (error) {
            console.error('❌ [App] Login failed:', error);
          } finally {
            setIsLoginInProgress(false);
          }
          break;
        }
      } catch (parseError) {
        console.error('❌ [App] Failed to parse deep link URL:', urlString, parseError);
      }
    }
  }
});
```

### 2단계: authStore login 함수에 로그 추가

```typescript
// authStore.ts
login: async (token: string) => {
  console.log('🔐 [AuthStore] Login started with token:', token.substring(0, 20));
  console.log('🌐 [AuthStore] API_URL:', API_URL);

  set({ isLoading: true, error: null });
  try {
    const response = await tauriFetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('📡 [AuthStore] API response status:', response.status);

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    const data = await response.json();
    console.log('✅ [AuthStore] User data received:', data);

    set({
      user: data.user,
      subscription: data.subscription,
      accessToken: token,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  } catch (error) {
    console.error('❌ [AuthStore] Login failed:', error);
    set({
      isLoading: false,
      error: error instanceof Error ? error.message : 'Login failed',
    });
    throw error;
  }
},
```

### 3단계: LoginPage에 로그 추가

```typescript
// LoginPage.tsx
useEffect(() => {
  console.log('🔄 [LoginPage] isAuthenticated changed:', isAuthenticated);
  if (isAuthenticated) {
    console.log('✅ [LoginPage] Authenticated! Clearing loading state');
    setIsLoading(false);
    clearLoginTimeout();
  }
}, [isAuthenticated]);
```

### 4단계: 환경 변수 확인

```bash
# .env 파일 확인
cat .env | grep VITE_AUTH_API_URL

# 또는 빌드 시 직접 지정
VITE_AUTH_API_URL=http://localhost:4000 npm run tauri build
```

---

## 📝 다음 액션

1. **로그 추가** → 다시 빌드 → 구글 로그인 시도
2. **DevTools Console 확인** (Tauri 앱에서 우클릭 → Inspect Element)
3. **로그 내용 공유** → 어느 단계에서 멈추는지 확인
4. **서버 실행 여부 확인** (`http://localhost:4000` 또는 `https://auth.any-on.com`)
