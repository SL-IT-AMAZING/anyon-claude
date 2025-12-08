# 🔥 Bun으로 빠르게 시작하기

Bun은 NPM보다 훨씬 빠른 JavaScript 런타임입니다. opcode 프로젝트에서 Bun을 사용하면 개발 서버 시작 시간을 크게 단축할 수 있습니다.

## ⚡ Bun 설치

### macOS/Linux
```bash
curl -fsSL https://bun.sh/install | bash
```

### Windows
```bash
powershell -c "irm bun.sh/install.ps1|iex"
```

설치 후 터미널을 재시작하세요.

## 🚀 Bun으로 개발 서버 시작

### 가장 간단한 방법
```bash
bun run tauri:bun
```

이 명령어 하나면 끝입니다! Tauri가 Bun을 사용해서 Vite 서버를 자동으로 시작합니다.

## 📋 Bun 전용 명령어

| 명령어 | 설명 | 속도 |
|--------|------|------|
| `bun run tauri:bun` | Tauri + Vite 서버 시작 | ⚡⚡⚡ 가장 빠름 |
| `bun run dev:bun` | Vite만 시작 | ⚡⚡⚡ 빠름 |
| `bun run dev:bun:clean` | 캐시 삭제 후 시작 | ⚡⚡ 보통 |
| `bun run kill:servers` | 서버 종료 | ⚡⚡⚡ 즉시 |
| `bun run clean:cache` | 캐시 삭제 | ⚡⚡⚡ 즉시 |
| `bun run build:bun` | 프로덕션 빌드 | ⚡⚡⚡ 빠름 |

## 🆚 NPM vs Bun 비교

### 개발 서버 시작 시간
- **NPM**: ~3-5초
- **Bun**: ~0.5-1초 ⚡

### 패키지 설치 시간
- **NPM**: ~30-60초
- **Bun**: ~5-10초 ⚡

### 핫 리로드 (코드 변경 반영)
- **NPM**: ~0.5초
- **Bun**: ~0.2초 ⚡

## 🎯 권장 워크플로우

### 1. 처음 시작할 때
```bash
# 의존성 설치 (Bun이 훨씬 빠름)
bun install

# 개발 서버 시작
bun run tauri:bun
```

### 2. 문제가 생겼을 때
```bash
# 모든 서버 종료
bun run kill:servers

# 캐시 삭제
bun run clean:cache

# 다시 시작
bun run tauri:bun
```

### 3. 깨끗하게 다시 시작
```bash
# 1. 서버 종료
bun run kill:servers

# 2. 캐시 및 node_modules 삭제
rm -rf node_modules .bun .vite dist

# 3. 재설치 (Bun이 빠름!)
bun install

# 4. 시작
bun run tauri:bun
```

## 🔧 Bun 설정 파일

Bun 전용 Tauri 설정: [`src-tauri/tauri.bun.conf.json`](src-tauri/tauri.bun.conf.json)

이 설정 파일은 `beforeDevCommand`에서 Bun을 사용하도록 설정되어 있습니다:
```json
{
  "build": {
    "beforeDevCommand": "bun run dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "bun run build"
  }
}
```

## 💡 Pro Tips

### Tip 1: Bun을 기본값으로 사용
`.bashrc` 또는 `.zshrc`에 alias 추가:
```bash
alias dev="bun run tauri:bun"
alias kill-dev="bun run kill:servers"
```

이제 `dev`만 입력하면 바로 시작!

### Tip 2: Bun의 패키지 관리 사용
```bash
# 패키지 추가
bun add react-query

# 개발 의존성 추가
bun add -d @types/node

# 패키지 제거
bun remove react-query
```

### Tip 3: Bun 스크립트 직접 실행
```bash
# npm run 없이 바로 실행 가능
bun tauri:bun
bun dev:bun:clean
bun kill:servers
```

## ❓ FAQ

### Q: NPM과 Bun을 같이 사용해도 되나요?
A: 가능하지만 권장하지 않습니다. 하나만 선택해서 사용하세요.
- `package-lock.json` 사용 → NPM
- `bun.lockb` 사용 → Bun

### Q: Bun이 더 빠른 이유는?
A: Bun은 Zig로 작성되어 네이티브 속도로 실행되며, JavaScriptCore 엔진을 사용합니다.

### Q: 모든 NPM 패키지가 Bun에서 동작하나요?
A: 대부분 동작하지만, 일부 네이티브 모듈은 호환성 문제가 있을 수 있습니다.

### Q: 프로덕션 빌드도 Bun으로 하나요?
A: 네! `bun run build:bun`으로 빌드할 수 있습니다.

## 🚨 문제 해결

### Bun이 설치되지 않았다는 에러
```bash
# Bun 재설치
curl -fsSL https://bun.sh/install | bash

# PATH 확인
echo $PATH | grep bun

# 터미널 재시작
```

### 포트가 이미 사용 중
```bash
bun run kill:servers
```

### 캐시 문제
```bash
bun run clean:cache
rm -rf node_modules/.vite
bun run tauri:bun
```

## 📚 더 알아보기

- [Bun 공식 문서](https://bun.sh/docs)
- [Bun vs NPM 벤치마크](https://bun.sh/docs/cli/install#performance)
- [DEV_SERVER_GUIDE.md](DEV_SERVER_GUIDE.md) - 전체 개발 가이드
