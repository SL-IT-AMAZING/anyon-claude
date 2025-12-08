# 구글 로그인 구현 계획서

## 📋 목차

1. [개요](#개요)
2. [전체 아키텍처](#전체-아키텍처)
3. [구글 클라우드 콘솔 설정](#구글-클라우드-콘솔-설정)
4. [백엔드 구현 (NestJS)](#백엔드-구현-nestjs)
5. [Tauri 설정 (Deep Link)](#tauri-설정-deep-link)
6. [프론트엔드 구현 (React)](#프론트엔드-구현-react)
7. [배포 설정](#배포-설정)
8. [테스트 체크리스트](#테스트-체크리스트)

---

## 개요

### 프로젝트 정보
- **앱 타입**: Tauri 데스크톱 애플리케이션
- **인증 방식**: 구글 OAuth 2.0
- **백엔드**: NestJS + PostgreSQL
- **요구사항**: 앱 최초 실행 시 로그인 필수

### 로그인 플로우
```
사용자 앱 실행
  → 로그인 화면
  → "구글 로그인" 클릭
  → 외부 브라우저에서 구글 인증
  → 백엔드로 리다이렉트
  → 백엔드가 토큰 발급
  → Deep Link로 앱에 토큰 전달
  → 앱 사용 가능
```

---

## 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                     Tauri Desktop App                            │
│                                                                   │
│  1. 앱 시작 → 토큰 확인 (없으면 로그인 화면)                    │
│  2. "구글 로그인" 버튼 클릭                                      │
│  3. 외부 브라우저로 OAuth URL 열기                               │
│                                                                   │
│         ↓ (브라우저에서 구글 로그인)                            │
│                                                                   │
│  4. 구글 → 백엔드로 리다이렉트 (code 전달)                      │
│  5. 백엔드 → 구글에서 토큰 교환                                 │
│  6. 백엔드 → Deep Link로 앱 호출 (opcode://auth?token=xxx)      │
│  7. Tauri가 Deep Link 수신 → 토큰 저장 → 앱 사용 가능          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│  Tauri App   │◄──────►│   Backend    │◄──────►│   Google     │
│  (React)     │  API   │   (NestJS)   │  OAuth │   OAuth      │
└──────────────┘        └──────────────┘        └──────────────┘
       │                       │
       │                       │
       ▼                       ▼
┌──────────────┐        ┌──────────────┐
│  Local       │        │  PostgreSQL  │
│  Storage     │        │  Database    │
└──────────────┘        └──────────────┘
```

---

## 구글 클라우드 콘솔 설정

### Step 1: 프로젝트 생성

1. https://console.cloud.google.com/ 접속
2. 상단 프로젝트 선택 드롭다운 클릭
3. "새 프로젝트" 클릭
4. 프로젝트 이름: `Opcode Desktop` 입력
5. "만들기" 클릭

### Step 2: OAuth 2.0 클라이언트 ID 생성

1. 좌측 메뉴 → **API 및 서비스** → **사용자 인증 정보**
2. 상단 **"사용자 인증 정보 만들기"** 클릭 → **"OAuth 클라이언트 ID"** 선택
3. 애플리케이션 유형 선택

> ⚠️ **중요**: 데스크톱 앱이지만 **"웹 애플리케이션"** 선택!
> (OAuth 리다이렉트를 위해 웹 애플리케이션 타입 필요)

4. 설정값 입력:

```
이름: Opcode Desktop App

승인된 자바스크립트 원본:
  - http://localhost:3000 (개발용)
  - https://yourdomain.com (프로덕션)

승인된 리디렉션 URI:
  - http://localhost:4000/auth/google/callback (개발)
  - https://api.yourdomain.com/auth/google/callback (프로덕션)
```

5. **"만들기"** 클릭
6. 생성된 **Client ID**와 **Client Secret** 안전하게 저장

```
Client ID: 123456789-abcdefg.apps.googleusercontent.com
Client Secret: GOCSPX-xxxxxxxxxxxxxxxxxxxxx
```

### Step 3: OAuth 동의 화면 구성

1. 좌측 메뉴 → **OAuth 동의 화면** 클릭
2. 사용자 유형 선택:
   - 개발/테스트: **"내부"** (조직 내 사용자만)
   - 배포: **"외부"** (모든 Google 계정)
3. **앱 정보** 입력:

```yaml
앱 이름: Opcode
사용자 지원 이메일: your@email.com
앱 로고: (선택사항 - 120x120 PNG)

앱 도메인:
  - 애플리케이션 홈페이지: https://yourdomain.com
  - 개인정보처리방침: https://yourdomain.com/privacy
  - 서비스 약관: https://yourdomain.com/terms

승인된 도메인:
  - yourdomain.com

개발자 연락처: your@email.com
```

4. **범위 설정** (다음 단계):

필수 범위 추가:
- ✓ `.../auth/userinfo.email` - 이메일 주소 조회
- ✓ `.../auth/userinfo.profile` - 기본 프로필 정보
- ✓ `openid` - OpenID 인증

5. **테스트 사용자 추가** (개발 중):

```
your@gmail.com
teammate@gmail.com
```

6. **"저장 후 계속"** 클릭

### Step 4: API 활성화

1. 좌측 메뉴 → **API 및 서비스** → **라이브러리**
2. 검색창에 **"Google+ API"** 검색
3. **사용 설정** 클릭

---

## 백엔드 구현 (NestJS)

### 프로젝트 구조

```
backend/
├── src/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── google.strategy.ts
│   │   │   └── jwt.strategy.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   └── dto/
│   │       └── google-user.dto.ts
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   └── users.controller.ts
│   │
│   ├── subscriptions/
│   │   ├── subscriptions.module.ts
│   │   ├── subscriptions.service.ts
│   │   └── subscriptions.controller.ts
│   │
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   └── main.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

### 환경 변수 (.env)

```env
# 구글 OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:4000/auth/google/callback"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# 앱 Deep Link (Tauri custom protocol)
APP_DEEP_LINK_SCHEME="opcode"
APP_DEEP_LINK_HOST="auth"

# 서버
PORT=4000
NODE_ENV=development

# 프론트엔드 URL (CORS)
FRONTEND_URL="http://localhost:3000"

# 데이터베이스
DATABASE_URL="postgresql://user:password@localhost:5432/opcode?schema=public"

# 토스페이먼츠 (결제)
TOSS_SECRET_KEY="test_sk_..."
TOSS_CLIENT_KEY="test_ck_..."
```

### Prisma 스키마

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String   @id @default(uuid())
  email          String   @unique
  name           String?
  googleId       String   @unique
  profilePicture String?

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  subscription   Subscription?
  projects       Project[]
  payments       Payment[]

  @@map("users")
}

model Subscription {
  id     String @id @default(uuid())
  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  planType  PlanType           @default(FREE)
  status    SubscriptionStatus @default(ACTIVE)

  // 토스페이먼츠 정보
  tossCustomerKey String?
  tossBillingKey  String?
  tossPaymentKey  String?

  // 구독 기간
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?

  // 결제 정보
  amount Int @default(30000)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("subscriptions")
}

model Project {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  projectPath String
  projectName String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, projectPath])
  @@map("projects")
}

model Payment {
  id     String @id @default(uuid())
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  tossPaymentKey String @unique
  orderId        String @unique
  orderName      String

  amount  Int
  status  PaymentStatus
  method  String?

  paidAt     DateTime?
  canceledAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("payments")
}

enum PlanType {
  FREE
  PRO
}

enum SubscriptionStatus {
  ACTIVE
  CANCELED
  PAST_DUE
  TRIALING
}

enum PaymentStatus {
  READY
  IN_PROGRESS
  DONE
  CANCELED
  PARTIAL_CANCELED
  ABORTED
  EXPIRED
}
```

### 핵심 구현 코드

#### auth.controller.ts

```typescript
import { Controller, Get, Req, Res, UseGuards, HttpCode } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Step 1: 구글 OAuth URL 생성
   * 클라이언트(Tauri 앱)에서 호출
   */
  @Get('google/url')
  getGoogleAuthUrl() {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(process.env.GOOGLE_CALLBACK_URL)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('openid email profile')}&` +
      `access_type=offline&` +
      `prompt=consent`;

    return { url };
  }

  /**
   * Step 2: 구글 콜백 처리
   * 구글이 이 엔드포인트로 리다이렉트
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req, @Res() res: Response) {
    try {
      // Passport가 req.user에 구글 사용자 정보 담아줌
      const { accessToken, user } = await this.authService.handleGoogleLogin(req.user);

      // Step 3: Deep Link로 앱에 토큰 전달
      const deepLinkUrl = `${process.env.APP_DEEP_LINK_SCHEME}://${process.env.APP_DEEP_LINK_HOST}?` +
        `token=${accessToken}&` +
        `email=${encodeURIComponent(user.email)}`;

      // 브라우저를 Deep Link로 리다이렉트 → 앱이 열림
      res.redirect(deepLinkUrl);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
  }

  /**
   * 현재 로그인한 사용자 정보 조회
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    return this.authService.getUserWithSubscription(user.id);
  }

  /**
   * 토큰 검증
   */
  @Get('verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async verifyToken() {
    return { valid: true };
  }
}
```

#### auth.service.ts

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  /**
   * 구글 로그인 처리
   * 기존 사용자면 로그인, 신규 사용자면 회원가입
   */
  async handleGoogleLogin(googleUser: GoogleUser) {
    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
      include: { subscription: true },
    });

    if (!user) {
      // 신규 사용자 생성 (Free 플랜으로 시작)
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          googleId: googleUser.id,
          profilePicture: googleUser.picture,
          subscription: {
            create: {
              planType: 'FREE',
              status: 'ACTIVE',
            },
          },
        },
        include: { subscription: true },
      });
    }

    // JWT 토큰 생성
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      plan: user.subscription?.planType || 'FREE',
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
      },
    };
  }

  /**
   * JWT 토큰 검증 및 사용자 정보 조회
   */
  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { subscription: true },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * 사용자 정보 + 구독 정보 조회
   */
  async getUserWithSubscription(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true, projects: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
      },
      subscription: user.subscription,
      projectCount: user.projects.length,
    };
  }
}
```

#### google.strategy.ts

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    const user = {
      id,
      email: emails[0].value,
      name: `${name.givenName} ${name.familyName}`,
      picture: photos[0]?.value || null,
      accessToken,
      refreshToken,
    };

    done(null, user);
  }
}
```

#### jwt.strategy.ts

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { subscription: true },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      email: user.email,
      plan: user.subscription?.planType || 'FREE',
    };
  }
}
```

#### auth.module.ts

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

### 백엔드 설치 및 실행

```bash
# 프로젝트 생성
npm i -g @nestjs/cli
nest new opcode-backend
cd opcode-backend

# 의존성 설치
npm install @nestjs/passport passport passport-google-oauth20
npm install @nestjs/jwt passport-jwt
npm install @prisma/client
npm install -D prisma @types/passport-google-oauth20 @types/passport-jwt

# Prisma 초기화
npx prisma init

# 마이그레이션
npx prisma migrate dev --name init

# 서버 실행
npm run start:dev
```

---

## Tauri 설정 (Deep Link)

### Step 1: tauri.conf.json 수정

```json
{
  "package": {
    "productName": "opcode",
    "version": "0.1.0"
  },
  "build": {
    "distDir": "../dist",
    "devPath": "http://localhost:3000",
    "beforeDevCommand": "",
    "beforeBuildCommand": ""
  },
  "tauri": {
    "bundle": {
      "active": true,
      "identifier": "com.opcode.app",
      "targets": "all",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ]
    },
    "allowlist": {
      "all": false,
      "shell": {
        "open": true
      },
      "window": {
        "all": false,
        "close": true,
        "hide": true,
        "show": true,
        "maximize": true,
        "minimize": true,
        "unmaximize": true,
        "unminimize": true,
        "startDragging": true
      }
    },
    "security": {
      "csp": null
    },
    "windows": [
      {
        "title": "Opcode",
        "width": 1200,
        "height": 800,
        "resizable": true,
        "fullscreen": false
      }
    ]
  }
}
```

### Step 2: Cargo.toml에 의존성 추가

```toml
[package]
name = "opcode"
version = "0.1.0"
edition = "2021"

[dependencies]
tauri = { version = "2.1", features = ["shell-open"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tauri-plugin-deep-link = "2.0"

[build-dependencies]
tauri-build = { version = "2.0", features = [] }
```

### Step 3: Rust 메인 파일 수정

**src-tauri/src/main.rs**

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, WindowEvent};
use tauri_plugin_deep_link;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            // Deep Link 리스너 등록
            #[cfg(any(target_os = "macos", target_os = "linux", target_os = "windows"))]
            {
                let handle = app.handle().clone();
                tauri_plugin_deep_link::register("opcode", move |request| {
                    let url = request.to_string();
                    println!("Received deep link: {}", url);

                    // 프론트엔드로 이벤트 전송
                    if let Err(e) = handle.emit("auth-callback", url.clone()) {
                        eprintln!("Failed to emit auth-callback event: {}", e);
                    }
                })
                .unwrap();
            }

            Ok(())
        })
        .on_window_event(|event| {
            if let WindowEvent::CloseRequested { .. } = event.event() {
                // 앱 종료 처리
                println!("Window close requested");
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Step 4: macOS Info.plist 설정

**src-tauri/Info.plist** (macOS용)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleURLTypes</key>
    <array>
        <dict>
            <key>CFBundleURLName</key>
            <string>com.opcode.auth</string>
            <key>CFBundleURLSchemes</key>
            <array>
                <string>opcode</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
```

### Step 5: Windows 레지스트리 (자동 설정됨)

Windows에서는 Tauri가 빌드 시 자동으로 레지스트리에 등록합니다.

---

## 프론트엔드 구현 (React)

### Step 1: Auth Store 생성

**src/stores/authStore.ts**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
}

interface Subscription {
  planType: 'FREE' | 'PRO';
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE';
  currentPeriodEnd?: string;
}

interface AuthState {
  // State
  user: User | null;
  subscription: Subscription | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (token: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  canCreateProject: () => boolean;
  refreshUserData: () => Promise<void>;
}

const API_URL = 'http://localhost:4000';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      subscription: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // 로그인
      login: async (token: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }

          const data = await response.json();

          set({
            user: data.user,
            subscription: data.subscription,
            accessToken: token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error('Login failed:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
          throw error;
        }
      },

      // 로그아웃
      logout: () => {
        set({
          user: null,
          subscription: null,
          accessToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      // 인증 확인
      checkAuth: async () => {
        const { accessToken } = get();
        if (!accessToken) return false;

        try {
          const response = await fetch(`${API_URL}/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (!response.ok) {
            get().logout();
            return false;
          }

          return true;
        } catch (error) {
          get().logout();
          return false;
        }
      },

      // 프로젝트 생성 가능 여부
      canCreateProject: () => {
        const { subscription } = get();
        return subscription?.planType === 'PRO' && subscription?.status === 'ACTIVE';
      },

      // 사용자 데이터 새로고침
      refreshUserData: async () => {
        const { accessToken } = get();
        if (!accessToken) return;

        try {
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            set({
              user: data.user,
              subscription: data.subscription,
            });
          }
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        subscription: state.subscription,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### Step 2: 로그인 페이지

**src/components/LoginPage.tsx**

```typescript
import React, { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-shell';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chrome, Loader2 } from 'lucide-react';

const API_URL = 'http://localhost:4000';

export const LoginPage: React.FC = () => {
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Deep Link 이벤트 리스너 등록
    const setupListener = async () => {
      const unlisten = await listen<string>('auth-callback', async (event) => {
        console.log('Auth callback received:', event.payload);

        try {
          // URL 파싱: opcode://auth?token=xxx&email=xxx
          const url = new URL(event.payload);
          const token = url.searchParams.get('token');

          if (token) {
            setIsLoading(true);
            await login(token);
            console.log('Login successful!');
          } else {
            setError('로그인에 실패했습니다. 토큰이 없습니다.');
          }
        } catch (error) {
          console.error('Login failed:', error);
          setError('로그인에 실패했습니다. 다시 시도해주세요.');
        } finally {
          setIsLoading(false);
        }
      });

      return unlisten;
    };

    const unlistenPromise = setupListener();

    return () => {
      unlistenPromise.then((fn) => fn());
    };
  }, [login]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 백엔드에서 구글 OAuth URL 가져오기
      const response = await fetch(`${API_URL}/auth/google/url`);

      if (!response.ok) {
        throw new Error('Failed to get Google auth URL');
      }

      const { url } = await response.json();

      // 외부 브라우저로 열기
      await open(url);

      console.log('Opened Google login page');
    } catch (error) {
      console.error('Failed to open Google login:', error);
      setError('로그인 페이지를 열 수 없습니다.');
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full p-8 space-y-6">
        {/* 로고 */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Opcode</h1>
          <p className="text-muted-foreground">
            AI 기반 코딩 IDE
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* 로그인 버튼 */}
        <div className="space-y-4">
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-12 flex items-center justify-center gap-3 text-base"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                로그인 중...
              </>
            ) : (
              <>
                <Chrome className="w-5 h-5" />
                구글로 로그인
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            로그인하면{' '}
            <a href="#" className="underline hover:text-foreground">
              이용약관
            </a>
            과{' '}
            <a href="#" className="underline hover:text-foreground">
              개인정보처리방침
            </a>
            에<br />동의하는 것으로 간주됩니다.
          </p>
        </div>

        {/* 플랜 정보 */}
        <div className="pt-4 border-t space-y-2">
          <div className="text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>• Free 플랜</span>
              <span>프로젝트 1개</span>
            </div>
            <div className="flex justify-between">
              <span>• Pro 플랜</span>
              <span>프로젝트 무제한 (월 30,000원)</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
```

### Step 3: App.tsx에 인증 게이트 추가

**src/App.tsx**

```typescript
import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { LoginPage } from "@/components/LoginPage";
import { Loader2 } from "lucide-react";

// 기존 앱 컨텐츠 (원래 App.tsx 내용을 AppContent로 분리)
function AppContent() {
  // ... 기존 App.tsx 내용
}

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsChecking(false);
      }
    };

    verifyAuth();
  }, [checkAuth]);

  // 인증 확인 중
  if (isChecking) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않음 → 로그인 페이지
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // 인증됨 → 메인 앱
  return <AppContent />;
}

export default App;
```

### Step 4: Titlebar에 사용자 정보 추가

**src/components/CustomTitlebar.tsx 수정**

```typescript
import { useAuthStore } from '@/stores/authStore';
import { LogOut, User, Crown } from 'lucide-react';

// 기존 CustomTitlebar 컴포넌트에 추가
export const CustomTitlebar: React.FC<CustomTitlebarProps> = ({ ... }) => {
  const { user, subscription, logout } = useAuthStore();

  return (
    <div className="...">
      {/* 기존 좌측 버튼들 */}

      {/* 우측에 사용자 정보 추가 */}
      <div className="flex items-center gap-3 pr-4">
        {/* 플랜 뱃지 */}
        {subscription && (
          <div className={`
            px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1
            ${subscription.planType === 'PRO'
              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
              : 'bg-muted text-muted-foreground'}
          `}>
            {subscription.planType === 'PRO' && <Crown className="w-3 h-3" />}
            {subscription.planType}
          </div>
        )}

        {/* 사용자 메뉴 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 hover:bg-muted rounded-md px-2 py-1">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
              )}
              <span className="text-sm">{user?.name}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {/* 프로필 설정 */}}>
              <User className="w-4 h-4 mr-2" />
              내 정보
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {/* 업그레이드 */}}>
              <Crown className="w-4 h-4 mr-2" />
              Pro로 업그레이드
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
```

---

## 배포 설정

### 프로덕션 환경 변수

```env
# Backend .env (Production)
GOOGLE_CLIENT_ID="prod-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="prod-client-secret"
GOOGLE_CALLBACK_URL="https://api.yourdomain.com/auth/google/callback"

JWT_SECRET="production-super-secret-key-change-this"
JWT_EXPIRES_IN="7d"

APP_DEEP_LINK_SCHEME="opcode"
APP_DEEP_LINK_HOST="auth"

PORT=4000
NODE_ENV=production

DATABASE_URL="postgresql://user:password@db.yourdomain.com:5432/opcode?schema=public"
```

### Tauri 빌드

```bash
# 개발 빌드
npm run tauri dev

# 프로덕션 빌드
npm run tauri build

# 빌드 결과물
# macOS: src-tauri/target/release/bundle/macos/opcode.app
# Windows: src-tauri/target/release/bundle/msi/opcode.msi
# Linux: src-tauri/target/release/bundle/appimage/opcode.AppImage
```

---

## 테스트 체크리스트

### 구글 콘솔 설정
- [ ] 구글 클라우드 프로젝트 생성 완료
- [ ] OAuth 2.0 클라이언트 ID 생성 완료
- [ ] 리다이렉션 URI 정확하게 설정
- [ ] OAuth 동의 화면 구성 완료
- [ ] 테스트 사용자 추가
- [ ] Client ID와 Secret 안전하게 저장

### 백엔드
- [ ] NestJS 서버 실행 확인 (http://localhost:4000)
- [ ] `/auth/google/url` 엔드포인트 동작 확인
- [ ] `/auth/google/callback` 콜백 처리 확인
- [ ] JWT 토큰 발급 확인
- [ ] PostgreSQL 연결 확인
- [ ] Prisma 마이그레이션 완료
- [ ] Deep Link 리다이렉트 동작 확인

### Tauri
- [ ] Deep Link 플러그인 설치 확인
- [ ] `opcode://` 프로토콜 등록 확인
- [ ] Deep Link 이벤트 수신 확인
- [ ] 외부 브라우저 열기 동작 확인

### 프론트엔드
- [ ] 로그인 페이지 UI 정상 표시
- [ ] 구글 로그인 버튼 클릭 시 브라우저 열림
- [ ] Deep Link 콜백 수신 확인
- [ ] 토큰 저장 확인 (localStorage)
- [ ] 로그인 후 메인 앱 진입 확인
- [ ] Titlebar에 사용자 정보 표시
- [ ] 로그아웃 동작 확인

### 통합 테스트
- [ ] 전체 로그인 플로우 (앱 → 브라우저 → 앱) 동작
- [ ] 토큰 만료 후 자동 로그아웃 확인
- [ ] 앱 재시작 후 자동 로그인 확인
- [ ] Free 플랜 프로젝트 1개 제한 확인
- [ ] Pro 플랜 프로젝트 무제한 확인

### 에러 처리
- [ ] 구글 로그인 취소 시 처리
- [ ] 네트워크 오류 시 에러 메시지 표시
- [ ] 잘못된 토큰 처리
- [ ] 백엔드 서버 다운 시 처리

---

## 다음 단계

1. **구글 콘솔 설정** (30분)
2. **백엔드 구현** (2-3시간)
3. **Tauri Deep Link 설정** (1시간)
4. **프론트엔드 구현** (2-3시간)
5. **통합 테스트** (1시간)
6. **프로덕션 배포** (1-2시간)

**총 예상 시간**: 7-11시간

---

## 참고 자료

- [Google OAuth 2.0 문서](https://developers.google.com/identity/protocols/oauth2)
- [NestJS Passport 문서](https://docs.nestjs.com/security/authentication)
- [Tauri Deep Link 문서](https://tauri.app/v1/guides/features/deep-link/)
- [Zustand 문서](https://docs.pmnd.rs/zustand)
