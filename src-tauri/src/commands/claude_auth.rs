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
    #[serde(default)]
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

    // Claude Code를 시작하고 /login을 입력하라는 안내 메시지 표시
    // 터미널에서 claude를 실행하고 사용자가 /login을 입력하도록 유도
    let script = format!(
        r#"tell application "Terminal"
            activate
            do script "echo '\\n🔑 Claude Code 로그인\\n터미널에서 /login 을 입력하세요\\n' && \"{}\""
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
    // Claude Code를 시작하고 /login 안내 메시지 표시
    let login_cmd = format!("echo -e '\\n🔑 Claude Code 로그인\\n터미널에서 /login 을 입력하세요\\n' && '{}'; exec bash", claude_path);

    // 여러 터미널 에뮬레이터 시도
    let terminals: Vec<(&str, Vec<String>)> = vec![
        ("gnome-terminal", vec!["--".to_string(), "bash".to_string(), "-c".to_string(), login_cmd.clone()]),
        ("konsole", vec!["-e".to_string(), "bash".to_string(), "-c".to_string(), login_cmd.clone()]),
        ("xfce4-terminal", vec!["-e".to_string(), format!("bash -c \"{}\"", login_cmd)]),
        ("xterm", vec!["-e".to_string(), "bash".to_string(), "-c".to_string(), login_cmd.clone()]),
    ];

    for (terminal, args) in &terminals {
        if Command::new(terminal)
            .args(args)
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
    // Windows: cmd를 열고 Claude Code 시작 + /login 안내
    let cmd_arg = format!(
        "echo. & echo 🔑 Claude Code 로그인 & echo 터미널에서 /login 을 입력하세요 & echo. & \"{}\"",
        claude_path
    );

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

    match entry.delete_password() {
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

    fs::write(&script_path, content)
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

// ============================================================
// Claude OAuth 로그아웃
// ============================================================

/// Claude OAuth 로그아웃 (Keychain/Credential Manager에서 credentials 삭제)
#[tauri::command]
pub async fn claude_auth_logout() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        logout_macos()?;
    }

    #[cfg(target_os = "linux")]
    {
        logout_linux()?;
    }

    #[cfg(target_os = "windows")]
    {
        logout_windows()?;
    }

    log::info!("Claude OAuth 로그아웃 완료");
    Ok(())
}

/// macOS: Keychain에서 Claude credentials 삭제
#[cfg(target_os = "macos")]
fn logout_macos() -> Result<(), String> {
    let output = Command::new("security")
        .args(["delete-generic-password", "-s", CLAUDE_KEYCHAIN_SERVICE])
        .output()
        .map_err(|e| format!("Keychain 명령 실행 실패: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        // "The specified item could not be found" = 이미 없음 (에러 아님)
        if stderr.contains("could not be found") || stderr.contains("SecKeychainSearchCopyNext") {
            log::info!("Keychain에 Claude credentials 없음 (이미 로그아웃 상태)");
            return Ok(());
        }
        return Err(format!("Keychain에서 삭제 실패: {}", stderr));
    }

    log::info!("macOS Keychain에서 Claude credentials 삭제 완료");
    Ok(())
}

/// Linux: secret-tool + 파일 삭제
#[cfg(target_os = "linux")]
fn logout_linux() -> Result<(), String> {
    let home = dirs::home_dir()
        .ok_or("홈 디렉토리를 찾을 수 없습니다.")?;

    // 1. ~/.claude/.credentials.json 파일 삭제
    let creds_path = home.join(".claude").join(".credentials.json");
    if creds_path.exists() {
        fs::remove_file(&creds_path)
            .map_err(|e| format!("credentials 파일 삭제 실패: {}", e))?;
        log::info!("~/.claude/.credentials.json 삭제 완료");
    }

    // 2. secret-tool에서 삭제 시도 (GNOME 환경)
    if let Ok(output) = Command::new("secret-tool")
        .args(["clear", "service", CLAUDE_KEYCHAIN_SERVICE])
        .output()
    {
        if output.status.success() {
            log::info!("secret-tool에서 Claude credentials 삭제 완료");
        }
    }

    Ok(())
}

/// Windows: Credential Manager + 파일 삭제
#[cfg(target_os = "windows")]
fn logout_windows() -> Result<(), String> {
    let home = dirs::home_dir()
        .ok_or("홈 디렉토리를 찾을 수 없습니다.")?;

    // 1. credentials 파일 삭제
    let creds_path = home.join(".claude").join(".credentials.json");
    if creds_path.exists() {
        fs::remove_file(&creds_path)
            .map_err(|e| format!("credentials 파일 삭제 실패: {}", e))?;
        log::info!("credentials 파일 삭제 완료");
    }

    // 2. Credential Manager에서 삭제 (여러 계정 이름 시도)
    for account in WINDOWS_ACCOUNT_CANDIDATES {
        if let Ok(entry) = keyring::Entry::new(CLAUDE_KEYCHAIN_SERVICE, account) {
            match entry.delete_password() {
                Ok(()) => {
                    log::info!("Windows Credential Manager에서 삭제 완료 (account: {})", account);
                }
                Err(keyring::Error::NoEntry) => {}
                Err(e) => {
                    log::warn!("Credential Manager 삭제 실패 (account: {}): {}", account, e);
                }
            }
        }
    }

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
