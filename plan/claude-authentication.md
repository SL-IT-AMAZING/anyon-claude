# Claude 인증 기능 기획서 v6

## 개요

### 배경
현재 anyon-claude 앱은 Claude Code CLI를 래핑한 GUI 애플리케이션입니다. 사용자가 Claude를 사용하려면 터미널에서 `claude login` 명령어로 인증을 해야 하는데, 이는 비개발자에게 큰 진입장벽입니다.

### 목표
비개발자가 **터미널 없이** 앱 내에서 Claude 인증 상태를 확인하고 관리할 수 있게 하기.

### 지원 플랫폼
- **macOS**: 완전 지원 (Keychain 사용)
- **Linux**: 완전 지원 (~/.claude/.credentials.json 또는 secret-tool)
- **Windows**: 시도 (Credential Manager + 파일 fallback)

---

## 핵심 발견 사항 (실제 조사 기반)

### 1. Claude Code 인증 토큰 저장 위치

**macOS:**
```bash
# Keychain에 저장됨 (파일이 아님!)
security find-generic-password -s "Claude Code-credentials" -w
```

**Linux:**
```bash
# 파일에 저장됨
~/.claude/.credentials.json
```

**Windows:**
```powershell
# 1순위: 파일 확인
%USERPROFILE%\.claude\.credentials.json

# 2순위: Credential Manager
# Target="Claude Code-credentials", Account 후보: "default", "claude", "Claude Code", "claude-code"
```

### 2. Credentials 구조

```json
{
  "claudeAiOauth": {
    "accessToken": "sk-ant-oat01-...",
    "refreshToken": "sk-ant-ort01-...",
    "expiresAt": 1765922183507,
    "scopes": ["user:inference", "user:profile", "user:sessions:claude_code"],
    "subscriptionType": "max",
    "rateLimitTier": "default_claude_max_20x"
  }
}
```

### 3. 토큰 특성
- **accessToken**: 8-12시간 유효 (prefix: `sk-ant-oat01-`)
- **refreshToken**: 장기 유효 (prefix: `sk-ant-ort01-`)
- **subscriptionType**: `"free"`, `"pro"`, `"max"` 중 하나

### 4. 토큰 갱신 API (참고용 - 1차에서는 수동 새로고침)

```bash
POST https://console.anthropic.com/v1/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
refresh_token=sk-ant-ort01-...
client_id=9d1c250a-e61b-44d9-88ed-5944d1962f5e
```

> **Note**: 1차 구현에서는 자동 갱신 없이 "새로고침" 버튼으로 수동 확인만 지원. 자동 갱신은 2차에서 검토.

---

## 현실적인 접근 방식

### 문제점: OAuth를 앱에서 직접 구현하기 어려움

1. **client_id 문제**: Claude Code의 공식 client_id는 CLI 전용
2. **OAuth 엔드포인트**: `claude.ai/oauth/authorize`는 공개 API가 아님

### 해결책: 세 가지 방식 제공

| 방식 | 대상 사용자 | 구현 복잡도 |
|-----|-----------|-----------|
| **A. 기존 인증 감지** | 이미 터미널에서 로그인한 사용자 | 낮음 |
| **B. 터미널 로그인 유도** | 처음 사용하는 사용자 | 중간 |
| **C. API 키 입력** | 개발자 | 낮음 |

---

## 설계 결정 사항

### Q1: 기존 앱 로그인(LoginPage/useAuthStore)과의 관계?
**결정: 완전히 별도로 유지**
- 기존 `useAuthStore`: anyon 서비스 계정 (Google OAuth)
- 새 인증: Claude Code CLI 인증 (별도)
- 둘은 독립적으로 동작

### Q2: 자동 토큰 갱신 구현 여부?
**결정: 1차에서는 수동 새로고침만**
- "새로고침" 버튼으로 수동 확인
- 자동 갱신은 2차 구현에서 검토

### Q3: 기존 "API Key Helper" 필드와의 관계?
**결정: 기존 필드 활용**
- Settings.tsx의 `ai-advanced` 섹션에 이미 `apiKeyHelper` 필드 존재
- 새 인증 UI에서 API 키 저장 시 이 필드를 자동 설정
- 별도 필드 추가하지 않음

---

## 구현 후 유저 플로우

### 시나리오 1: 이미 Claude Code를 터미널에서 사용하던 사용자
1. **앱 실행**
2. **자동으로 기존 인증 감지** (Keychain/Credential Manager/파일에서 토큰 확인)
3. **"✓ 로그인됨 (Max 플랜)" 표시**
4. **바로 사용 가능**

### 시나리오 2: 처음 사용하는 사용자 (Claude 계정 있음)
1. **앱 실행 → 설정 → 인증**
2. **"로그인이 필요합니다" 표시**
3. **"터미널에서 로그인" 버튼 클릭**
4. **터미널 창이 열리고 `claude login` 자동 실행**
5. **브라우저가 열리고 Claude 로그인 페이지로 이동**
6. **Google/이메일로 로그인**
7. **터미널에 "Login successful" 표시**
8. **앱에서 "새로고침" 클릭 → 인증 상태 업데이트**

### 시나리오 3: API 키 사용 (개발자)
1. **설정 → 인증 → "API 키" 탭**
2. **API 키 입력**
3. **"연결하기" 클릭**
4. **검증 후 Keychain 저장 + apiKeyHelper 자동 설정**

---

## 기술 구현 명세

### 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
├─────────────────────────────────────────────────────────────┤
│  Settings.tsx > "ai-auth" 섹션 (신규)                        │
│    └── ClaudeAuthSettings 컴포넌트                           │
│          ├── 현재 인증 상태 표시                              │
│          ├── "터미널에서 로그인" 버튼 (OAuth 유도)             │
│          ├── "새로고침" 버튼                                  │
│          └── "API 키" 탭 (대안)                               │
├─────────────────────────────────────────────────────────────┤
│                     Tauri IPC Commands                       │
├─────────────────────────────────────────────────────────────┤
│  # 인증 상태 확인                                            │
│  claude_auth_check() → Keychain/Credential Manager/파일 확인  │
│                                                              │
│  # 터미널 로그인 유도                                         │
│  claude_auth_open_terminal() → 터미널에서 claude login 실행   │
│                                                              │
│  # API 키 (대안)                                             │
│  claude_auth_save_api_key(key) → Keychain 저장 + Helper 설정 │
│  claude_auth_validate_api_key(key) → Anthropic API 검증      │
│  claude_auth_delete_api_key() → 삭제                         │
├─────────────────────────────────────────────────────────────┤
│                      Backend (Rust)                          │
├─────────────────────────────────────────────────────────────┤
│  src-tauri/src/commands/claude_auth.rs (신규)                │
│    ├── Keychain 읽기 (macOS: security 명령어)                │
│    ├── Credential Manager 읽기 (Windows: keyring crate)      │
│    ├── 파일 읽기 (~/.claude/.credentials.json)               │
│    ├── 토큰 파싱 및 상태 반환                                 │
│    ├── 터미널 열기 (기존 claude binary path 활용)             │
│    └── API 키 저장 (keyring crate)                           │
├─────────────────────────────────────────────────────────────┤
│                    Web Server (Rust - Axum)                  │
├─────────────────────────────────────────────────────────────┤
│  src-tauri/src/web_server.rs                                 │
│    ├── GET /api/claude-auth/status → 토큰 상태 조회           │
│    ├── POST /api/claude-auth/terminal-login → 웹 미지원 안내  │
│    ├── POST /api/claude-auth/api-key → API 키 저장           │
│    ├── DELETE /api/claude-auth/api-key → API 키 삭제         │
│    └── POST /api/claude-auth/validate → API 키 검증          │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. 백엔드 구현 (Rust)

### 1.1 Cargo.toml 의존성 추가

```toml
[dependencies]
keyring = "2"           # 시스템 Keychain/Credential Manager 접근
```

### 1.2 src-tauri/src/commands/mod.rs 수정

```rust
pub mod agents;
pub mod claude;
pub mod claude_auth;  // 신규 추가
pub mod dev_server;
pub mod dev_workflow;
pub mod mcp;
pub mod preview;
pub mod proxy;
pub mod slash_commands;
pub mod storage;
pub mod usage;
```

### 1.3 새 파일: `src-tauri/src/commands/claude_auth.rs`

```rust
use serde::{Deserialize, Serialize};
use std::fs;
use std::process::Command;
use crate::claude_binary::find_claude_binary;

const CLAUDE_KEYCHAIN_SERVICE: &str = "Claude Code-credentials";
const ANYON_SERVICE_NAME: &str = "anyon-claude";
const API_KEY_ACCOUNT: &str = "anthropic_api_key";

// Windows에서 시도할 Credential Manager 계정 이름들
#[cfg(target_os = "windows")]
const WINDOWS_ACCOUNT_CANDIDATES: &[&str] = &["default", "claude", "Claude Code", "claude-code"];

// ============================================================
// 데이터 구조
// ============================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaudeAuthStatus {
    /// 인증 여부
    pub is_authenticated: bool,
    /// 인증 방식: "oauth" | "api_key" | "none"
    pub auth_method: String,
    /// 구독 타입: "free" | "pro" | "max" | null
    pub subscription_type: Option<String>,
    /// 토큰 만료 시간 (Unix timestamp ms)
    pub expires_at: Option<i64>,
    /// 토큰 만료 여부
    pub is_expired: bool,
    /// 표시용 정보
    pub display_info: Option<String>,
    /// 에러 메시지 (있으면)
    pub error: Option<String>,
    /// 플랫폼별 추가 정보
    pub platform_note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ClaudeCredentials {
    #[serde(rename = "claudeAiOauth")]
    claude_ai_oauth: Option<OAuthCredentials>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct OAuthCredentials {
    #[serde(rename = "accessToken")]
    access_token: String,
    #[serde(rename = "refreshToken")]
    refresh_token: String,
    #[serde(rename = "expiresAt")]
    expires_at: i64,
    scopes: Option<Vec<String>>,
    #[serde(rename = "subscriptionType")]
    subscription_type: Option<String>,
    #[serde(rename = "rateLimitTier")]
    rate_limit_tier: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiKeyValidationResult {
    pub valid: bool,
    pub error: Option<String>,
}

// ============================================================
// 핵심: Claude Code 인증 상태 확인
// ============================================================

/// Claude Code의 기존 인증 상태를 확인
/// Note: _app_handle은 현재 사용하지 않지만 향후 확장을 위해 유지
#[tauri::command]
pub async fn claude_auth_check(_app_handle: tauri::AppHandle) -> Result<ClaudeAuthStatus, String> {
    // 1. 먼저 우리가 저장한 API 키가 있는지 확인
    match get_stored_api_key() {
        Ok(Some(_)) => {
            return Ok(ClaudeAuthStatus {
                is_authenticated: true,
                auth_method: "api_key".to_string(),
                subscription_type: None,
                expires_at: None,
                is_expired: false,
                display_info: Some("API 키로 연결됨".to_string()),
                error: None,
                platform_note: None,
            });
        }
        Ok(None) => {}
        Err(e) => {
            log::warn!("API 키 확인 실패: {}", e);
        }
    }

    // 2. Claude Code OAuth 토큰 확인
    match read_claude_credentials() {
        Ok((credentials, platform_note)) => {
            match credentials.claude_ai_oauth {
                Some(oauth) => {
                    let now = std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .map(|d| d.as_millis() as i64)
                        .unwrap_or(0);

                    let is_expired = oauth.expires_at < now;

                    let display_info = oauth.subscription_type.as_ref().map(|t| {
                        match t.as_str() {
                            "max" => "Claude Max".to_string(),
                            "pro" => "Claude Pro".to_string(),
                            "free" => "무료 플랜".to_string(),
                            other => other.to_string(),
                        }
                    });

                    Ok(ClaudeAuthStatus {
                        is_authenticated: !is_expired,
                        auth_method: "oauth".to_string(),
                        subscription_type: oauth.subscription_type,
                        expires_at: Some(oauth.expires_at),
                        is_expired,
                        display_info,
                        error: None,
                        platform_note,
                    })
                }
                None => Ok(ClaudeAuthStatus {
                    is_authenticated: false,
                    auth_method: "none".to_string(),
                    subscription_type: None,
                    expires_at: None,
                    is_expired: false,
                    display_info: None,
                    error: None,
                    platform_note,
                }),
            }
        }
        Err(e) => {
            // Keychain/Credential Manager 접근 실패 등은 "인증 안됨"으로 처리
            log::warn!("Credentials 읽기 실패: {}", e);
            Ok(ClaudeAuthStatus {
                is_authenticated: false,
                auth_method: "none".to_string(),
                subscription_type: None,
                expires_at: None,
                is_expired: false,
                display_info: None,
                error: Some(e),
                platform_note: None,
            })
        }
    }
}

/// 플랫폼별 Claude credentials 읽기
/// Returns: (credentials, optional_platform_note)
fn read_claude_credentials() -> Result<(ClaudeCredentials, Option<String>), String> {
    #[cfg(target_os = "macos")]
    {
        read_credentials_macos()
    }

    #[cfg(target_os = "linux")]
    {
        read_credentials_linux()
    }

    #[cfg(target_os = "windows")]
    {
        read_credentials_windows()
    }
}

// ============================================================
// macOS: Keychain에서 credentials 읽기
// ============================================================

#[cfg(target_os = "macos")]
fn read_credentials_macos() -> Result<(ClaudeCredentials, Option<String>), String> {
    let output = Command::new("security")
        .args(["find-generic-password", "-s", CLAUDE_KEYCHAIN_SERVICE, "-w"])
        .output()
        .map_err(|e| format!("Keychain 명령 실행 실패: {}", e))?;

    if !output.status.success() {
        // Keychain에 없음 = 로그인 안 됨 (에러가 아님)
        return Ok((ClaudeCredentials { claude_ai_oauth: None }, None));
    }

    let json_str = String::from_utf8_lossy(&output.stdout);
    let credentials = serde_json::from_str(json_str.trim())
        .map_err(|e| format!("Credentials JSON 파싱 실패: {}", e))?;

    Ok((credentials, None))
}

// ============================================================
// Linux: 파일에서 credentials 읽기 (secret-tool fallback)
// ============================================================

#[cfg(target_os = "linux")]
fn read_credentials_linux() -> Result<(ClaudeCredentials, Option<String>), String> {
    let home = dirs::home_dir()
        .ok_or("홈 디렉토리를 찾을 수 없습니다.")?;

    let creds_path = home.join(".claude").join(".credentials.json");

    // 1. 먼저 파일에서 읽기 시도
    if creds_path.exists() {
        let content = fs::read_to_string(&creds_path)
            .map_err(|e| format!("Credentials 파일 읽기 실패: {}", e))?;

        let credentials = serde_json::from_str(&content)
            .map_err(|e| format!("Credentials JSON 파싱 실패: {}", e))?;

        return Ok((credentials, None));
    }

    // 2. 파일이 없으면 secret-tool 시도 (GNOME 환경)
    if let Ok(output) = Command::new("secret-tool")
        .args(["lookup", "service", CLAUDE_KEYCHAIN_SERVICE])
        .output()
    {
        if output.status.success() {
            let json_str = String::from_utf8_lossy(&output.stdout);
            if !json_str.trim().is_empty() {
                let credentials = serde_json::from_str(json_str.trim())
                    .map_err(|e| format!("secret-tool JSON 파싱 실패: {}", e))?;
                return Ok((credentials, Some("secret-tool에서 읽음".to_string())));
            }
        }
    }

    // 3. 둘 다 없음 - secret-tool 미설치 안내
    let has_secret_tool = Command::new("which")
        .arg("secret-tool")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false);

    let note = if !has_secret_tool {
        Some("secret-tool이 설치되어 있지 않습니다. GNOME 환경이 아닌 경우 ~/.claude/.credentials.json 파일이 필요합니다.".to_string())
    } else {
        None
    };

    Ok((ClaudeCredentials { claude_ai_oauth: None }, note))
}

// ============================================================
// Windows: Credential Manager + 파일 fallback
// ============================================================

#[cfg(target_os = "windows")]
fn read_credentials_windows() -> Result<(ClaudeCredentials, Option<String>), String> {
    let home = dirs::home_dir()
        .ok_or("홈 디렉토리를 찾을 수 없습니다.")?;

    // 1순위: 파일에서 읽기 (%USERPROFILE%\.claude\.credentials.json)
    let creds_path = home.join(".claude").join(".credentials.json");
    if creds_path.exists() {
        let content = fs::read_to_string(&creds_path)
            .map_err(|e| format!("Credentials 파일 읽기 실패: {}", e))?;

        let credentials = serde_json::from_str(&content)
            .map_err(|e| format!("Credentials JSON 파싱 실패: {}", e))?;

        return Ok((credentials, Some("파일에서 읽음".to_string())));
    }

    // 2순위: Credential Manager에서 읽기 (여러 계정 이름 시도)
    for account in WINDOWS_ACCOUNT_CANDIDATES {
        if let Ok(entry) = keyring::Entry::new(CLAUDE_KEYCHAIN_SERVICE, account) {
            if let Ok(password) = entry.get_password() {
                match serde_json::from_str::<ClaudeCredentials>(&password) {
                    Ok(credentials) => {
                        let note = format!("Credential Manager에서 읽음 (account: {})", account);
                        return Ok((credentials, Some(note)));
                    }
                    Err(e) => {
                        log::warn!("Credential Manager JSON 파싱 실패 (account: {}): {}", account, e);
                    }
                }
            }
        }
    }

    // 3순위: 둘 다 없음
    Ok((
        ClaudeCredentials { claude_ai_oauth: None },
        Some("Windows Credential Manager에서 'Claude Code-credentials'를 찾지 못했습니다. 터미널에서 claude login을 실행하거나 API 키를 사용해주세요.".to_string())
    ))
}

// ============================================================
// 터미널에서 로그인 유도
// ============================================================

/// 터미널을 열고 `claude login` 실행
/// 기존 claude_binary 모듈의 find_claude_binary 활용
#[tauri::command]
pub async fn claude_auth_open_terminal(app_handle: tauri::AppHandle) -> Result<(), String> {
    // 1. Claude binary 경로 확인
    let claude_path = find_claude_binary(&app_handle)
        .map_err(|e| format!("Claude Code CLI를 찾을 수 없습니다: {}. Claude Code가 설치되어 있는지 확인해주세요.", e))?;

    log::info!("Found Claude binary at: {}", claude_path);

    // 2. 터미널에서 로그인 명령 실행
    open_terminal_with_login(&claude_path)
}

#[cfg(target_os = "macos")]
fn open_terminal_with_login(claude_path: &str) -> Result<(), String> {
    // 경로에 공백/특수문자가 있을 수 있으므로 따옴표로 감싸고 이스케이프
    let escaped_path = claude_path
        .replace("\\", "\\\\")
        .replace("\"", "\\\"");

    let script = format!(
        r#"tell application "Terminal"
            activate
            do script "\"{}\" login"
        end tell"#,
        escaped_path
    );

    Command::new("osascript")
        .args(["-e", &script])
        .spawn()
        .map_err(|e| format!("터미널 열기 실패: {}", e))?;

    Ok(())
}

#[cfg(target_os = "linux")]
fn open_terminal_with_login(claude_path: &str) -> Result<(), String> {
    // 경로를 따옴표로 감싸서 공백/특수문자 처리
    let login_cmd = format!("'{}' login; exec bash", claude_path);

    // 여러 터미널 에뮬레이터 시도
    let terminals: Vec<(&str, Vec<&str>)> = vec![
        ("gnome-terminal", vec!["--", "bash", "-c", &login_cmd]),
        ("konsole", vec!["-e", "bash", "-c", &login_cmd]),
        ("xfce4-terminal", vec!["-e", &format!("bash -c \"{}\"", login_cmd)]),
        ("xterm", vec!["-e", "bash", "-c", &login_cmd]),
    ];

    for (terminal, args) in &terminals {
        if Command::new(terminal)
            .args(args.clone())
            .spawn()
            .is_ok()
        {
            log::info!("터미널 열림: {}", terminal);
            return Ok(());
        }
    }

    Err("터미널을 찾을 수 없습니다. gnome-terminal, konsole, xfce4-terminal 또는 xterm을 설치해주세요.".to_string())
}

#[cfg(target_os = "windows")]
fn open_terminal_with_login(claude_path: &str) -> Result<(), String> {
    // Windows: cmd /c start cmd /k "\"<path>\" login"
    // 경로를 따옴표로 감싸서 공백/특수문자 처리
    let cmd_arg = format!("\"\\\"{}\\\" login\"", claude_path);

    Command::new("cmd")
        .args(["/c", "start", "cmd", "/k", &cmd_arg])
        .spawn()
        .map_err(|e| format!("터미널 열기 실패: {}", e))?;

    Ok(())
}

// ============================================================
// API 키 관련 (대안)
// ============================================================

/// Keychain/Credential Manager에서 저장된 API 키 확인
fn get_stored_api_key() -> Result<Option<String>, String> {
    let entry = keyring::Entry::new(ANYON_SERVICE_NAME, API_KEY_ACCOUNT)
        .map_err(|e| format!("Keyring Entry 생성 실패: {}", e))?;

    match entry.get_password() {
        Ok(key) => Ok(Some(key)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(format!("Keyring 읽기 실패: {}", e)),
    }
}

/// API 키 저장 및 apiKeyHelper 스크립트 설정
#[tauri::command]
pub async fn claude_auth_save_api_key(api_key: String) -> Result<(), String> {
    // 1. 형식 검증
    if !api_key.starts_with("sk-ant-") {
        return Err("API 키는 'sk-ant-'로 시작해야 합니다.".to_string());
    }

    // 2. Keychain/Credential Manager에 저장
    let entry = keyring::Entry::new(ANYON_SERVICE_NAME, API_KEY_ACCOUNT)
        .map_err(|e| format!("Keyring Entry 생성 실패: {}", e))?;

    entry.set_password(&api_key)
        .map_err(|e| format!("API 키 저장 실패: {}", e))?;

    // 3. apiKeyHelper 스크립트 생성 (Windows는 스킵하고 안내 메시지만)
    #[cfg(not(target_os = "windows"))]
    {
        create_api_key_helper_script()?;
        update_claude_settings_api_key_helper()?;
    }

    #[cfg(target_os = "windows")]
    {
        log::info!("Windows에서는 API Key Helper 스크립트가 지원되지 않습니다. Keychain에만 저장됩니다.");
    }

    log::info!("API 키가 저장되었습니다.");
    Ok(())
}

/// API 키 삭제
#[tauri::command]
pub async fn claude_auth_delete_api_key() -> Result<(), String> {
    // 1. Keychain/Credential Manager에서 삭제
    let entry = keyring::Entry::new(ANYON_SERVICE_NAME, API_KEY_ACCOUNT)
        .map_err(|e| format!("Keyring Entry 생성 실패: {}", e))?;

    match entry.delete_credential() {
        Ok(()) => {}
        Err(keyring::Error::NoEntry) => {} // 이미 없음
        Err(e) => return Err(format!("API 키 삭제 실패: {}", e)),
    }

    // 2. Helper 스크립트 삭제 (Unix only)
    #[cfg(not(target_os = "windows"))]
    {
        delete_api_key_helper()?;
    }

    log::info!("API 키가 삭제되었습니다.");
    Ok(())
}

/// API 키 유효성 검증 (Anthropic API 호출)
#[tauri::command]
pub async fn claude_auth_validate_api_key(api_key: String) -> Result<ApiKeyValidationResult, String> {
    if !api_key.starts_with("sk-ant-") {
        return Ok(ApiKeyValidationResult {
            valid: false,
            error: Some("API 키 형식이 올바르지 않습니다. 'sk-ant-'로 시작해야 합니다.".to_string()),
        });
    }

    let client = reqwest::Client::new();
    let response = client
        .get("https://api.anthropic.com/v1/models")
        .header("x-api-key", &api_key)
        .header("anthropic-version", "2023-06-01")
        .send()
        .await
        .map_err(|e| format!("API 호출 실패: {}", e))?;

    match response.status().as_u16() {
        200 => Ok(ApiKeyValidationResult { valid: true, error: None }),
        401 => Ok(ApiKeyValidationResult {
            valid: false,
            error: Some("API 키가 유효하지 않습니다.".to_string()),
        }),
        403 => Ok(ApiKeyValidationResult {
            valid: false,
            error: Some("API 키가 비활성화되었거나 권한이 없습니다.".to_string()),
        }),
        429 => Ok(ApiKeyValidationResult {
            valid: false,
            error: Some("요청 한도 초과 또는 크레딧이 부족합니다.".to_string()),
        }),
        status => Ok(ApiKeyValidationResult {
            valid: false,
            error: Some(format!("알 수 없는 오류 (HTTP {})", status)),
        }),
    }
}

// ============================================================
// Helper Functions (Unix only)
// ============================================================

/// apiKeyHelper 스크립트 생성 (macOS/Linux only)
#[cfg(not(target_os = "windows"))]
fn create_api_key_helper_script() -> Result<(), String> {
    let home = dirs::home_dir()
        .ok_or("홈 디렉토리를 찾을 수 없습니다.")?;

    let claude_dir = home.join(".claude");
    fs::create_dir_all(&claude_dir)
        .map_err(|e| format!("~/.claude 디렉토리 생성 실패: {}", e))?;

    let script_path = claude_dir.join("anyon_api_key_helper.sh");

    #[cfg(target_os = "macos")]
    let content = format!(
        "#!/bin/bash\nsecurity find-generic-password -s \"{}\" -a \"{}\" -w 2>/dev/null\n",
        ANYON_SERVICE_NAME, API_KEY_ACCOUNT
    );

    #[cfg(target_os = "linux")]
    let content = format!(
        "#!/bin/bash\nsecret-tool lookup service \"{}\" account \"{}\" 2>/dev/null || keyring get \"{}\" \"{}\"\n",
        ANYON_SERVICE_NAME, API_KEY_ACCOUNT, ANYON_SERVICE_NAME, API_KEY_ACCOUNT
    );

    fs::write(&script_path, &content)
        .map_err(|e| format!("스크립트 파일 생성 실패: {}", e))?;

    // 실행 권한 설정
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = fs::metadata(&script_path)
            .map_err(|e| format!("파일 메타데이터 조회 실패: {}", e))?
            .permissions();
        perms.set_mode(0o755);
        fs::set_permissions(&script_path, perms)
            .map_err(|e| format!("실행 권한 설정 실패: {}", e))?;
    }

    log::info!("API Key Helper 스크립트 생성: {:?}", script_path);
    Ok(())
}

/// Claude settings.local.json에 apiKeyHelper 설정 추가 (기존 설정 유지하며 병합)
#[cfg(not(target_os = "windows"))]
fn update_claude_settings_api_key_helper() -> Result<(), String> {
    let home = dirs::home_dir()
        .ok_or("홈 디렉토리를 찾을 수 없습니다.")?;

    let settings_path = home.join(".claude").join("settings.local.json");
    let script_path = home.join(".claude").join("anyon_api_key_helper.sh");

    // 기존 설정 읽기 (없으면 빈 객체)
    let mut settings: serde_json::Value = if settings_path.exists() {
        let content = fs::read_to_string(&settings_path)
            .map_err(|e| format!("settings.local.json 읽기 실패: {}", e))?;
        serde_json::from_str(&content).unwrap_or(serde_json::json!({}))
    } else {
        serde_json::json!({})
    };

    // apiKeyHelper만 추가/업데이트 (다른 설정은 유지)
    if let Some(obj) = settings.as_object_mut() {
        obj.insert(
            "apiKeyHelper".to_string(),
            serde_json::Value::String(script_path.to_string_lossy().to_string())
        );
    }

    // 저장
    let content = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("JSON 직렬화 실패: {}", e))?;

    fs::write(&settings_path, content)
        .map_err(|e| format!("settings.local.json 저장 실패: {}", e))?;

    log::info!("settings.local.json에 apiKeyHelper 설정 추가");
    Ok(())
}

/// Helper 스크립트 및 설정 제거 (macOS/Linux only)
#[cfg(not(target_os = "windows"))]
fn delete_api_key_helper() -> Result<(), String> {
    let home = dirs::home_dir()
        .ok_or("홈 디렉토리를 찾을 수 없습니다.")?;

    // 스크립트 삭제
    let script_path = home.join(".claude").join("anyon_api_key_helper.sh");
    if script_path.exists() {
        fs::remove_file(&script_path)
            .map_err(|e| format!("스크립트 삭제 실패: {}", e))?;
    }

    // settings.local.json에서 apiKeyHelper만 제거 (다른 설정 유지)
    let settings_path = home.join(".claude").join("settings.local.json");
    if settings_path.exists() {
        let content = fs::read_to_string(&settings_path)
            .map_err(|e| format!("설정 파일 읽기 실패: {}", e))?;

        if let Ok(mut settings) = serde_json::from_str::<serde_json::Value>(&content) {
            if let Some(obj) = settings.as_object_mut() {
                // anyon_api_key_helper.sh를 가리키는 경우에만 제거
                if let Some(helper_path) = obj.get("apiKeyHelper").and_then(|v| v.as_str()) {
                    if helper_path.contains("anyon_api_key_helper") {
                        obj.remove("apiKeyHelper");

                        let content = serde_json::to_string_pretty(&settings)
                            .map_err(|e| format!("JSON 직렬화 실패: {}", e))?;

                        fs::write(&settings_path, content)
                            .map_err(|e| format!("설정 파일 저장 실패: {}", e))?;
                    }
                }
            }
        }
    }

    Ok(())
}
```

### 1.4 main.rs 수정

**파일**: `src-tauri/src/main.rs`

**상단 import 추가**:
```rust
use commands::claude_auth::{
    claude_auth_check, claude_auth_open_terminal,
    claude_auth_save_api_key, claude_auth_delete_api_key,
    claude_auth_validate_api_key,
};
```

**generate_handler! 매크로 내 추가** (기존 커맨드 목록 끝에):
```rust
.invoke_handler(tauri::generate_handler![
    // ... 기존 커맨드들 ...

    // Claude Auth (신규)
    claude_auth_check,
    claude_auth_open_terminal,
    claude_auth_save_api_key,
    claude_auth_delete_api_key,
    claude_auth_validate_api_key,
])
```

---

## 2. 웹 서버 구현 (web_server.rs)

### 2.1 web_server.rs에 라우트 및 핸들러 추가

**파일**: `src-tauri/src/web_server.rs`

**Import 추가** (상단):
```rust
use axum::routing::post;
use axum::routing::delete;
```

**핸들러 함수 추가** (기존 핸들러들 아래):
```rust
// ============================================================
// Claude Auth 웹 API 핸들러
// ============================================================

/// Claude 인증 상태 조회 (웹 모드)
async fn get_claude_auth_status() -> Json<ApiResponse<serde_json::Value>> {
    // 웹 모드에서도 파일 기반 credentials는 확인 가능
    let home = match dirs::home_dir() {
        Some(h) => h,
        None => return Json(ApiResponse::error("홈 디렉토리를 찾을 수 없습니다.".to_string())),
    };

    let creds_path = home.join(".claude").join(".credentials.json");

    if creds_path.exists() {
        match std::fs::read_to_string(&creds_path) {
            Ok(content) => {
                match serde_json::from_str::<serde_json::Value>(&content) {
                    Ok(creds) => {
                        if let Some(oauth) = creds.get("claudeAiOauth") {
                            let expires_at = oauth.get("expiresAt").and_then(|v| v.as_i64()).unwrap_or(0);
                            let now = std::time::SystemTime::now()
                                .duration_since(std::time::UNIX_EPOCH)
                                .map(|d| d.as_millis() as i64)
                                .unwrap_or(0);
                            let is_expired = expires_at < now;

                            let subscription_type = oauth.get("subscriptionType")
                                .and_then(|v| v.as_str())
                                .map(|s| s.to_string());

                            let display_info = subscription_type.as_ref().map(|t| {
                                match t.as_str() {
                                    "max" => "Claude Max".to_string(),
                                    "pro" => "Claude Pro".to_string(),
                                    "free" => "무료 플랜".to_string(),
                                    other => other.to_string(),
                                }
                            });

                            return Json(ApiResponse::success(serde_json::json!({
                                "is_authenticated": !is_expired,
                                "auth_method": "oauth",
                                "subscription_type": subscription_type,
                                "expires_at": expires_at,
                                "is_expired": is_expired,
                                "display_info": display_info,
                                "error": null,
                                "platform_note": "웹 모드 (파일 기반)"
                            })));
                        }
                    }
                    Err(_) => {}
                }
            }
            Err(_) => {}
        }
    }

    // credentials 파일이 없거나 읽기 실패
    Json(ApiResponse::success(serde_json::json!({
        "is_authenticated": false,
        "auth_method": "none",
        "subscription_type": null,
        "expires_at": null,
        "is_expired": false,
        "display_info": null,
        "error": null,
        "platform_note": "웹 모드에서는 ~/.claude/.credentials.json 파일만 확인 가능합니다."
    })))
}

/// 터미널 로그인 - 웹 모드에서는 미지원 안내
async fn claude_auth_terminal_login_web() -> Json<ApiResponse<serde_json::Value>> {
    Json(ApiResponse::error(
        "웹 모드에서는 터미널 로그인을 사용할 수 없습니다. 데스크톱 앱을 사용하거나, 서버 터미널에서 직접 'claude login'을 실행해주세요.".to_string()
    ))
}

#[derive(Deserialize)]
struct SaveApiKeyRequest {
    api_key: String,
}

/// API 키 저장 (웹 모드)
async fn claude_auth_save_api_key_web(
    Json(payload): Json<SaveApiKeyRequest>
) -> Json<ApiResponse<()>> {
    if !payload.api_key.starts_with("sk-ant-") {
        return Json(ApiResponse::error("API 키는 'sk-ant-'로 시작해야 합니다.".to_string()));
    }

    // 웹 모드에서는 keyring 대신 파일에 저장 (보안 주의 필요)
    let home = match dirs::home_dir() {
        Some(h) => h,
        None => return Json(ApiResponse::error("홈 디렉토리를 찾을 수 없습니다.".to_string())),
    };

    let api_key_path = home.join(".claude").join(".anyon_api_key");

    // 디렉토리 생성
    if let Err(e) = std::fs::create_dir_all(home.join(".claude")) {
        return Json(ApiResponse::error(format!("디렉토리 생성 실패: {}", e)));
    }

    // 파일에 저장 (권한 600)
    if let Err(e) = std::fs::write(&api_key_path, &payload.api_key) {
        return Json(ApiResponse::error(format!("API 키 저장 실패: {}", e)));
    }

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        if let Ok(metadata) = std::fs::metadata(&api_key_path) {
            let mut perms = metadata.permissions();
            perms.set_mode(0o600);
            let _ = std::fs::set_permissions(&api_key_path, perms);
        }
    }

    Json(ApiResponse::success(()))
}

/// API 키 삭제 (웹 모드)
async fn claude_auth_delete_api_key_web() -> Json<ApiResponse<()>> {
    let home = match dirs::home_dir() {
        Some(h) => h,
        None => return Json(ApiResponse::error("홈 디렉토리를 찾을 수 없습니다.".to_string())),
    };

    let api_key_path = home.join(".claude").join(".anyon_api_key");

    if api_key_path.exists() {
        if let Err(e) = std::fs::remove_file(&api_key_path) {
            return Json(ApiResponse::error(format!("API 키 삭제 실패: {}", e)));
        }
    }

    Json(ApiResponse::success(()))
}

/// API 키 검증 (웹 모드)
async fn claude_auth_validate_api_key_web(
    Json(payload): Json<SaveApiKeyRequest>
) -> Json<ApiResponse<serde_json::Value>> {
    if !payload.api_key.starts_with("sk-ant-") {
        return Json(ApiResponse::success(serde_json::json!({
            "valid": false,
            "error": "API 키 형식이 올바르지 않습니다. 'sk-ant-'로 시작해야 합니다."
        })));
    }

    let client = reqwest::Client::new();
    match client
        .get("https://api.anthropic.com/v1/models")
        .header("x-api-key", &payload.api_key)
        .header("anthropic-version", "2023-06-01")
        .send()
        .await
    {
        Ok(response) => {
            match response.status().as_u16() {
                200 => Json(ApiResponse::success(serde_json::json!({
                    "valid": true,
                    "error": null
                }))),
                401 => Json(ApiResponse::success(serde_json::json!({
                    "valid": false,
                    "error": "API 키가 유효하지 않습니다."
                }))),
                403 => Json(ApiResponse::success(serde_json::json!({
                    "valid": false,
                    "error": "API 키가 비활성화되었거나 권한이 없습니다."
                }))),
                429 => Json(ApiResponse::success(serde_json::json!({
                    "valid": false,
                    "error": "요청 한도 초과 또는 크레딧이 부족합니다."
                }))),
                status => Json(ApiResponse::success(serde_json::json!({
                    "valid": false,
                    "error": format!("알 수 없는 오류 (HTTP {})", status)
                }))),
            }
        }
        Err(e) => Json(ApiResponse::error(format!("API 호출 실패: {}", e))),
    }
}
```

**라우터에 라우트 추가** (`create_web_server` 함수 내 `Router::new()` 체인에):
```rust
// Claude Auth endpoints
.route("/api/claude-auth/status", get(get_claude_auth_status))
.route("/api/claude-auth/terminal-login", post(claude_auth_terminal_login_web))
.route("/api/claude-auth/api-key", post(claude_auth_save_api_key_web))
.route("/api/claude-auth/api-key", delete(claude_auth_delete_api_key_web))
.route("/api/claude-auth/validate", post(claude_auth_validate_api_key_web))
```

---

## 3. 프론트엔드 구현

### 3.1 API 함수 추가

**파일**: `src/lib/api.ts`

```typescript
// Claude Auth
async claudeAuthCheck(): Promise<{
  is_authenticated: boolean;
  auth_method: string;
  subscription_type?: string;
  expires_at?: number;
  is_expired: boolean;
  display_info?: string;
  error?: string;
  platform_note?: string;
}> {
  return apiCall('claude_auth_check');
},

async claudeAuthOpenTerminal(): Promise<void> {
  return apiCall('claude_auth_open_terminal');
},

async claudeAuthSaveApiKey(apiKey: string): Promise<void> {
  return apiCall('claude_auth_save_api_key', { apiKey });
},

async claudeAuthDeleteApiKey(): Promise<void> {
  return apiCall('claude_auth_delete_api_key');
},

async claudeAuthValidateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  return apiCall('claude_auth_validate_api_key', { apiKey });
},
```

### 3.2 apiAdapter.ts 매핑 추가 (웹 모드 지원)

**파일**: `src/lib/apiAdapter.ts`

`mapCommandToEndpoint` 함수 내 추가:

```typescript
// Claude Auth
'claude_auth_check': { endpoint: '/api/claude-auth/status', method: 'GET' },
'claude_auth_open_terminal': { endpoint: '/api/claude-auth/terminal-login', method: 'POST' },
'claude_auth_save_api_key': { endpoint: '/api/claude-auth/api-key', method: 'POST' },
'claude_auth_delete_api_key': { endpoint: '/api/claude-auth/api-key', method: 'DELETE' },
'claude_auth_validate_api_key': { endpoint: '/api/claude-auth/validate', method: 'POST' },
```

### 3.3 i18n 번역 추가

**파일**: `src/lib/i18n/ko.ts`

```typescript
// Claude Auth 섹션
'settings.claudeAuth.title': 'Claude 인증',
'settings.claudeAuth.desc': 'Claude Code CLI 인증 상태를 확인하고 관리합니다',
'settings.claudeAuth.authenticated': '인증됨',
'settings.claudeAuth.authenticatedDesc': 'Claude를 사용할 준비가 되었습니다',
'settings.claudeAuth.notAuthenticated': '인증 필요',
'settings.claudeAuth.notAuthenticatedDesc': 'Claude를 사용하려면 로그인이 필요합니다',
'settings.claudeAuth.expired': '인증 만료',
'settings.claudeAuth.expiredDesc': '다시 로그인이 필요합니다',
'settings.claudeAuth.claudeAccount': 'Claude 계정',
'settings.claudeAuth.apiKey': 'API 키',
'settings.claudeAuth.terminalLogin': '터미널에서 로그인',
'settings.claudeAuth.terminalLoginDesc': '버튼을 클릭하면 터미널이 열리고 자동으로 로그인 명령이 실행됩니다',
'settings.claudeAuth.refresh': '새로고침',
'settings.claudeAuth.loginSteps': '로그인 과정',
'settings.claudeAuth.step1': '"터미널에서 로그인" 버튼 클릭',
'settings.claudeAuth.step2': '터미널 창이 열리고 claude login 실행',
'settings.claudeAuth.step3': '브라우저에서 Claude 계정으로 로그인',
'settings.claudeAuth.step4': '터미널에 "Login successful" 확인',
'settings.claudeAuth.step5': '"새로고침" 버튼 클릭',
'settings.claudeAuth.recommended': '권장: Claude Pro/Max 구독이 있으면 추가 비용 없이 사용할 수 있습니다.',
'settings.claudeAuth.apiKeyPlaceholder': 'sk-ant-api03-...',
'settings.claudeAuth.connect': '연결하기',
'settings.claudeAuth.getApiKey': 'API 키가 없으신가요?',
'settings.claudeAuth.getApiKeyLink': 'Anthropic Console에서 발급받기',
'settings.claudeAuth.securityInfo': '보안 정보',
'settings.claudeAuth.securityNote1': 'API 키는 시스템 Keychain에 암호화 저장',
'settings.claudeAuth.securityNote2': '사용량에 따른 종량제 요금 발생',
'settings.claudeAuth.oauthBilling': 'Claude 구독 요금제가 적용됩니다.',
'settings.claudeAuth.apiKeyBilling': 'API 사용량에 따른 종량제 요금이 발생합니다.',
'settings.claudeAuth.delete': '삭제',
'settings.claudeAuth.connectionSuccess': '연결 성공!',
'settings.claudeAuth.cliNotFound': 'Claude Code CLI를 찾을 수 없습니다',
'settings.claudeAuth.webModeNote': '웹 모드에서는 일부 기능이 제한됩니다',
'settings.claudeAuth.windowsNote': 'Windows: API Key Helper는 지원되지 않습니다',
```

**파일**: `src/lib/i18n/en.ts`

```typescript
// Claude Auth section
'settings.claudeAuth.title': 'Claude Authentication',
'settings.claudeAuth.desc': 'Check and manage Claude Code CLI authentication status',
'settings.claudeAuth.authenticated': 'Authenticated',
'settings.claudeAuth.authenticatedDesc': 'Ready to use Claude',
'settings.claudeAuth.notAuthenticated': 'Authentication Required',
'settings.claudeAuth.notAuthenticatedDesc': 'Login required to use Claude',
'settings.claudeAuth.expired': 'Authentication Expired',
'settings.claudeAuth.expiredDesc': 'Please login again',
'settings.claudeAuth.claudeAccount': 'Claude Account',
'settings.claudeAuth.apiKey': 'API Key',
'settings.claudeAuth.terminalLogin': 'Login via Terminal',
'settings.claudeAuth.terminalLoginDesc': 'Click to open terminal and run login command automatically',
'settings.claudeAuth.refresh': 'Refresh',
'settings.claudeAuth.loginSteps': 'Login Steps',
'settings.claudeAuth.step1': 'Click "Login via Terminal" button',
'settings.claudeAuth.step2': 'Terminal opens and runs claude login',
'settings.claudeAuth.step3': 'Login with your Claude account in browser',
'settings.claudeAuth.step4': 'Confirm "Login successful" in terminal',
'settings.claudeAuth.step5': 'Click "Refresh" button',
'settings.claudeAuth.recommended': 'Recommended: No additional cost with Claude Pro/Max subscription.',
'settings.claudeAuth.apiKeyPlaceholder': 'sk-ant-api03-...',
'settings.claudeAuth.connect': 'Connect',
'settings.claudeAuth.getApiKey': 'Don\'t have an API key?',
'settings.claudeAuth.getApiKeyLink': 'Get one from Anthropic Console',
'settings.claudeAuth.securityInfo': 'Security Info',
'settings.claudeAuth.securityNote1': 'API key is securely stored in system Keychain',
'settings.claudeAuth.securityNote2': 'Pay-as-you-go pricing applies',
'settings.claudeAuth.oauthBilling': 'Claude subscription pricing applies.',
'settings.claudeAuth.apiKeyBilling': 'Pay-as-you-go API pricing applies.',
'settings.claudeAuth.delete': 'Delete',
'settings.claudeAuth.connectionSuccess': 'Connected successfully!',
'settings.claudeAuth.cliNotFound': 'Claude Code CLI not found',
'settings.claudeAuth.webModeNote': 'Some features are limited in web mode',
'settings.claudeAuth.windowsNote': 'Windows: API Key Helper is not supported',
```

### 3.4 새 컴포넌트 생성

**파일**: `src/components/ClaudeAuthSettings.tsx`

(코드는 기존 계획서와 동일하나 i18n 키 사용 + platform_note 표시 추가)

### 3.5 Settings.tsx 수정

**파일**: `src/components/Settings.tsx`

1. **import 추가**:
```typescript
import { ClaudeAuthSettings } from './ClaudeAuthSettings';
```

2. **SettingsSection 타입 수정**:
```typescript
type SettingsSection =
  | "appearance"
  | "privacy"
  | "ai-auth"      // 신규 추가
  | "ai-version"
  | "ai-behavior"
  // ... 기존 항목들
```

3. **navItems 배열에 추가** (ai 카테고리의 첫 번째로):
```typescript
{ id: "ai-auth", label: t('settings.claudeAuth.title'), icon: Key, category: "ai" },
```

4. **renderSectionContent() switch 문에 case 추가**:
```typescript
case "ai-auth":
  return <ClaudeAuthSettings />;
```

---

## 보안 고려사항

| 항목 | 구현 |
|-----|------|
| Claude OAuth 토큰 | Keychain/Credential Manager에서 **읽기만** 함 (수정 안 함) |
| API 키 저장 | 별도 Keyring 항목 (`anyon-claude`) 사용 |
| 토큰 노출 방지 | 마스킹된 정보만 UI에 표시 |
| settings.local.json | 기존 설정 유지하며 병합 (덮어쓰기 아님) |
| 웹 모드 API 키 | 파일 저장 시 권한 600 설정 |

---

## 구현 순서

| 단계 | 작업 |
|-----|------|
| 1 | Cargo.toml에 `keyring = "2"` 추가 |
| 2 | commands/mod.rs에 `pub mod claude_auth;` 추가 |
| 3 | commands/claude_auth.rs 생성 |
| 4 | main.rs에 import 및 generate_handler! 등록 |
| 5 | web_server.rs에 라우트 및 핸들러 추가 |
| 6 | api.ts에 API 함수 추가 |
| 7 | apiAdapter.ts에 엔드포인트 매핑 추가 |
| 8 | i18n/ko.ts, en.ts에 번역 추가 |
| 9 | ClaudeAuthSettings.tsx 생성 |
| 10 | Settings.tsx 수정 |
| 11 | 테스트 (macOS + Linux + Windows) |

---

## 테스트 체크리스트

### 기존 인증 감지 (macOS)
- [ ] 이미 로그인된 사용자의 Keychain 토큰 감지
- [ ] 구독 타입 (Pro/Max) 올바르게 표시
- [ ] 토큰 만료 시 만료 상태 표시
- [ ] Keychain 접근 실패 시 graceful 에러 처리

### 기존 인증 감지 (Linux)
- [ ] ~/.claude/.credentials.json 파일에서 토큰 읽기
- [ ] secret-tool 사용 가능 시 fallback 동작
- [ ] secret-tool 미설치 시 안내 메시지 표시
- [ ] 파일 없음/접근 불가 시 graceful 처리

### 기존 인증 감지 (Windows)
- [ ] %USERPROFILE%\.claude\.credentials.json 파일에서 토큰 읽기
- [ ] Credential Manager에서 여러 계정 이름 시도 (default, claude, etc.)
- [ ] 파일/Credential Manager 둘 다 없을 때 안내 메시지
- [ ] Credential Manager 접근 실패 시 graceful 처리

### 터미널 로그인
- [ ] Claude CLI 경로를 `find_claude_binary()` 로 정확히 찾음
- [ ] CLI 없을 때 명확한 에러 메시지
- [ ] macOS Terminal.app 열기 + 명령 실행 (경로에 공백 있어도 동작)
- [ ] Linux gnome-terminal/konsole 등 열기
- [ ] Windows cmd.exe 열기 + 명령 실행

### API 키
- [ ] 유효한 키 검증 성공
- [ ] Keychain/Credential Manager에 저장
- [ ] apiKeyHelper 스크립트 생성 (macOS/Linux)
- [ ] Windows에서 API Key Helper 미지원 안내 표시
- [ ] settings.local.json에 apiKeyHelper 추가 (기존 설정 유지)
- [ ] 삭제 시 스크립트 + 설정 정리
- [ ] **Claude CLI가 apiKeyHelper로 키를 읽는지 확인**

### 웹 모드
- [ ] /api/claude-auth/status 에서 파일 기반 credentials 읽기
- [ ] /api/claude-auth/terminal-login 에서 미지원 안내 반환
- [ ] /api/claude-auth/api-key POST로 파일 저장 (권한 600)
- [ ] /api/claude-auth/api-key DELETE로 파일 삭제
- [ ] /api/claude-auth/validate POST로 API 키 검증

### UI
- [ ] 탭 전환 정상 동작
- [ ] 로딩 상태 표시
- [ ] 에러 메시지 i18n 적용
- [ ] 새로고침 버튼 동작
- [ ] platform_note 표시 (Windows/웹 모드 등)

---

## 향후 개선 사항 (2차 구현)

1. **자동 토큰 갱신**: refreshToken을 이용한 자동 갱신
2. **Windows API Key Helper**: PowerShell 스크립트 또는 소형 바이너리로 구현

---

## 참고 자료

- [Claude Code IAM Docs](https://code.claude.com/docs/en/iam)
- [Setup Container Authentication](https://claude-did-this.com/claude-hub/getting-started/setup-container-guide)
- [Claude Token Refresh](https://github.com/RavenStorm-bit/claude-token-refresh)
- [keyring crate](https://crates.io/crates/keyring)
