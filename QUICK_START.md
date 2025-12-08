# 빠른 시작 가이드 - Windows 인스톨러 빌드

Git과 Node.js가 번들로 포함된 ANYON Windows 인스톨러를 빌드하는 빠른 가이드입니다.

## 1단계: 의존성 자동 다운로드 (추천)

PowerShell을 **관리자 권한**으로 실행하고:

```powershell
# 프로젝트 루트에서
.\download-portable-deps.ps1
```

이 스크립트는 자동으로:
- 최신 Git Portable 다운로드 및 설치
- 최신 Node.js LTS 다운로드 및 설치
- 올바른 위치에 압축 해제

**예상 시간**: 5-10분 (인터넷 속도에 따라)
**다운로드 크기**: ~150MB

## 2단계: 인스톨러 빌드

```powershell
.\build-installer.ps1
```

빌드가 완료되면 인스톨러가 생성됩니다:
```
src-tauri\target\release\bundle\nsis\ANYON_0.2.1_x64-setup.exe
```

**예상 시간**: 5-15분 (첫 빌드는 더 오래 걸릴 수 있음)

## 3단계: 테스트

```powershell
# 인스톨러 실행
.\src-tauri\target\release\bundle\nsis\ANYON_0.2.1_x64-setup.exe
```

설치 후 확인 사항:
- [ ] 애플리케이션이 정상 실행됨
- [ ] Git init이 작동함
- [ ] NPX 명령이 작동함

## 문제 해결

### "스크립트 실행이 비활성화됨" 오류

PowerShell을 관리자 권한으로 실행하고:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Git/Node 다운로드 실패

수동으로 다운로드:

**Git Portable**:
1. https://github.com/git-for-windows/git/releases/latest
2. `PortableGit-*-64-bit.7z.exe` 다운로드
3. 실행: `.\PortableGit-*.exe -o"src-tauri\resources\git-portable" -y`

**Node.js Portable**:
1. https://nodejs.org/dist/latest/
2. `node-v*-win-x64.zip` 다운로드
3. `src-tauri\resources\node-portable\` 에 압축 해제

### 빌드 실패

상세 로그 확인:
```powershell
.\build-installer.ps1 -Verbose
```

## 옵션

### 의존성 체크 건너뛰기
```powershell
.\build-installer.ps1 -SkipDependencyCheck
```

### 프론트엔드 빌드 건너뛰기
```powershell
.\build-installer.ps1 -SkipBuild
```

### Git만 다운로드
```powershell
.\download-portable-deps.ps1 -GitOnly
```

### Node.js만 다운로드
```powershell
.\download-portable-deps.ps1 -NodeOnly
```

## 상세 가이드

전체 문서는 [BUILD_INSTALLER.md](BUILD_INSTALLER.md)를 참고하세요.

## 다음 단계

1. **배포**: 생성된 인스톨러를 GitHub Releases에 업로드
2. **테스트**: 깨끗한 Windows 환경에서 테스트
3. **서명**: 코드 서명 인증서로 인스톨러 서명 (선택사항)
