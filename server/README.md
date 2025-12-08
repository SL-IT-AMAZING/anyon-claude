# Anyon Auth Server (Development)

개발용 인증 서버입니다. Google OAuth와 JWT 기반 인증을 제공합니다.

## 실행 방법

### 1. 프론트엔드와 함께 실행 (권장)
```bash
npm run dev
```

### 2. 백엔드만 실행
```bash
cd server
npm start
```

## API 엔드포인트

### 인증 엔드포인트

#### `GET /auth/google/url`
Google OAuth URL을 가져옵니다.
- Response: `{ url: string, devToken: string }`

#### `GET /auth/me`
현재 사용자 정보를 조회합니다.
- Headers: `Authorization: Bearer <token>`
- Response: `{ user: User, subscription: Subscription }`

#### `GET /auth/verify`
토큰을 검증합니다.
- Headers: `Authorization: Bearer <token>`
- Response: `{ valid: boolean }`

#### `POST /auth/subscription`
구독 정보를 업데이트합니다.
- Headers: `Authorization: Bearer <token>`
- Body: `{ planType: 'FREE' | 'PRO', status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' }`

### 개발용 엔드포인트

#### `POST /dev/create-user`
테스트 사용자를 생성합니다.
```bash
curl -X POST http://localhost:4000/dev/create-user \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User", "planType": "PRO"}'
```

#### `GET /dev/users`
모든 사용자 목록을 조회합니다.
```bash
curl http://localhost:4000/dev/users
```

#### `GET /health`
서버 상태를 확인합니다.
```bash
curl http://localhost:4000/health
```

## 개발 모드 로그인 테스트

1. 프론트엔드 실행: `npm run dev`
2. 로그인 페이지에서 "구글로 로그인" 버튼 클릭
3. 개발 모드에서는 자동으로 토큰이 생성되어 로그인됩니다.

## 프로덕션 배포 시 변경사항

- `JWT_SECRET` 환경변수로 변경
- Google OAuth Client ID/Secret 설정
- 실제 Google OAuth 플로우 구현
- 데이터베이스 연결 (현재는 in-memory)
- HTTPS 설정
