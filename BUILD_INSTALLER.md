# Windows Installer 빌드 가이드 (Git & Node.js 번들 포함)

이 가이드는 Git과 Node.js가 번들로 포함된 ANYON Windows 인스톨러를 만드는 방법을 설명합니다.

## 준비사항

### 1. 필수 도구 설치

#### NSIS (Nullsoft Scriptable Install System)
```powershell
# Chocolatey로 설치
choco install nsis

# 또는 직접 다운로드
# https://nsis.sourceforge.io/Download
```

### 2. Portable 의존성 다운로드

#### Git Portable
1. https://github.com/git-for-windows/git/releases/latest 방문
2. `PortableGit-*-64-bit.7z.exe` 다운로드 (예: PortableGit-2.43.0-64-bit.7z.exe)
3. 자동 압축 해제 실행:
   ```powershell
   .\PortableGit-2.43.0-64-bit.7z.exe -o"src-tauri\resources\git-portable" -y
   ```

#### Node.js Portable
1. https://nodejs.org/dist/latest/ 방문
2. `node-v*-win-x64.zip` 다운로드 (예: node-v20.11.0-win-x64.zip)
3. 압축 해제:
   ```powershell
   Expand-Archive -Path node-v20.11.0-win-x64.zip -DestinationPath src-tauri\resources\
   Rename-Item src-tauri\resources\node-v20.11.0-win-x64 node-portable
   ```

### 3. 디렉토리 구조 확인

빌드 전에 다음 구조를 확인하세요:

```
anyon-claude/
├── src-tauri/
│   ├── resources/
│   │   ├── git-portable/
│   │   │   ├── cmd/
│   │   │   │   └── git.exe
│   │   │   ├── bin/
│   │   │   └── mingw64/
│   │   └── node-portable/
│   │       ├── node.exe
│   │       ├── npm
│   │       ├── npm.cmd
│   │       ├── npx
│   │       ├── npx.cmd
│   │       └── node_modules/
│   └── installer.nsi
```

확인 명령어:
```powershell
# Git 확인
Test-Path "src-tauri\resources\git-portable\cmd\git.exe"

# Node 확인
Test-Path "src-tauri\resources\node-portable\node.exe"
Test-Path "src-tauri\resources\node-portable\npx.cmd"
```

## 빌드 프로세스

### 옵션 1: Tauri 빌더 사용 (권장)

```powershell
# 1. 프론트엔드 빌드
npm run build

# 2. Tauri 빌드 (NSIS 포함)
cd src-tauri
cargo tauri build --bundles nsis

# 결과물 위치:
# src-tauri\target\release\bundle\nsis\ANYON_0.2.1_x64-setup.exe
```

### 옵션 2: 수동 NSIS 빌드

```powershell
# 1. Tauri 앱 빌드 (번들 없이)
cd src-tauri
cargo build --release

# 2. NSIS로 인스톨러 생성
cd src-tauri
makensis installer.nsi

# 결과물: src-tauri\ANYON-Setup.exe
```

## 빌드 최적화

### 파일 크기 줄이기

Git과 Node.js는 용량이 크므로, 필요한 파일만 포함하세요:

#### Git 최소화
```powershell
# 불필요한 파일 제거 (선택사항)
Remove-Item "src-tauri\resources\git-portable\usr\share\doc" -Recurse -Force
Remove-Item "src-tauri\resources\git-portable\usr\share\man" -Recurse -Force
```

#### Node.js 최소화
```powershell
# npm 캐시 정리
Remove-Item "src-tauri\resources\node-portable\npm-cache" -Recurse -Force -ErrorAction SilentlyContinue
```

### 압축 설정

NSIS 스크립트에 압축 설정 추가:
```nsis
SetCompressor /SOLID lzma
SetCompressorDictSize 64
```

## 빌드 스크립트

전체 과정을 자동화한 PowerShell 스크립트:

```powershell
# build-installer.ps1

Write-Host "=== ANYON Installer Build Script ===" -ForegroundColor Cyan

# 1. 의존성 확인
Write-Host "`nChecking dependencies..." -ForegroundColor Yellow
$gitExists = Test-Path "src-tauri\resources\git-portable\cmd\git.exe"
$nodeExists = Test-Path "src-tauri\resources\node-portable\node.exe"

if (-not $gitExists) {
    Write-Host "ERROR: Git Portable not found!" -ForegroundColor Red
    Write-Host "Download from: https://github.com/git-for-windows/git/releases/latest"
    exit 1
}

if (-not $nodeExists) {
    Write-Host "ERROR: Node.js Portable not found!" -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/dist/latest/"
    exit 1
}

Write-Host "✓ Git Portable found" -ForegroundColor Green
Write-Host "✓ Node.js Portable found" -ForegroundColor Green

# 2. 프론트엔드 빌드
Write-Host "`nBuilding frontend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend build failed!" -ForegroundColor Red
    exit 1
}

# 3. Tauri 빌드
Write-Host "`nBuilding Tauri app..." -ForegroundColor Yellow
Set-Location src-tauri
cargo tauri build --bundles nsis
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Tauri build failed!" -ForegroundColor Red
    exit 1
}

# 4. 결과 확인
Write-Host "`n=== Build Complete! ===" -ForegroundColor Green
$installerPath = "target\release\bundle\nsis\ANYON_0.2.1_x64-setup.exe"
if (Test-Path $installerPath) {
    $size = (Get-Item $installerPath).Length / 1MB
    Write-Host "Installer created: $installerPath" -ForegroundColor Green
    Write-Host "Size: $([math]::Round($size, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "WARNING: Installer not found at expected location" -ForegroundColor Yellow
}

Set-Location ..
```

스크립트 실행:
```powershell
.\build-installer.ps1
```

## 테스트

### 로컬 테스트
```powershell
# 인스톨러 실행
.\src-tauri\target\release\bundle\nsis\ANYON_0.2.1_x64-setup.exe

# 설치 후 확인
& "$env:ProgramFiles\ANYON\ANYON.exe"
```

### 번들 확인
설치 후 다음을 확인하세요:
1. Git이 정상 작동하는지 (git init 테스트)
2. NPX가 정상 작동하는지 (npx 명령 테스트)
3. 로그에서 번들 경로가 사용되는지 확인

## 문제 해결

### Git/Node가 번들에서 실행되지 않을 때
```powershell
# 로그 확인 (AppData\Roaming\com.anyon.app\logs)
Get-Content "$env:APPDATA\com.anyon.app\logs\*" -Tail 50
```

### 인스톨러 크기가 너무 클 때
- Git: 최소 100MB
- Node.js: 최소 50MB
- 총 예상 크기: 200-300MB

압축 옵션을 조정하거나 불필요한 파일을 제거하세요.

### 빌드 시간이 너무 오래 걸릴 때
- 증분 빌드 사용: `cargo build --release` (이미 빌드된 경우)
- Git/Node 리소스는 한 번만 다운로드하면 재사용 가능

## CI/CD 통합

GitHub Actions 예시:

```yaml
name: Build Windows Installer

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable

      - name: Download Git Portable
        run: |
          # Download and extract script here

      - name: Download Node Portable
        run: |
          # Download and extract script here

      - name: Build Installer
        run: |
          npm install
          npm run build
          cd src-tauri
          cargo tauri build --bundles nsis

      - name: Upload Installer
        uses: actions/upload-artifact@v3
        with:
          name: ANYON-Installer
          path: src-tauri/target/release/bundle/nsis/*.exe
```

## 참고사항

- Git Portable 버전 업데이트 시 새로 다운로드 필요
- Node.js 버전 업데이트 시 새로 다운로드 필요
- 리소스 파일은 .gitignore에 포함되어 있어 Git에 커밋되지 않음
- 빌드 머신마다 한 번씩 다운로드 설정 필요

## 다음 단계

1. **자동 업데이트**: Tauri의 업데이터 기능 통합
2. **디지털 서명**: 코드 서명 인증서로 인스톨러 서명
3. **다국어 지원**: 인스톨러 UI 한국어 추가
4. **사이즈 최적화**: 7-Zip 최고 압축률 사용
