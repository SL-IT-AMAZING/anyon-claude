use axum::{
    extract::{Json, Query, State as AxumState},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, patch, post},
    Router,
};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::TcpListener;
use tokio::sync::Mutex;
use tower_http::cors::{Any, CorsLayer};
use uuid::Uuid;

// JWT Claims structure
#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    user_id: String,
    exp: usize,
}

// User structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub email: String,
    pub name: String,
    pub profile_picture: String,
    pub subscription: Subscription,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Subscription {
    pub tier: String,
    pub status: String,
}

// Settings structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    #[serde(flatten)]
    pub data: HashMap<String, serde_json::Value>,
}

// App State
#[derive(Clone)]
pub struct AuthState {
    pub users: Arc<Mutex<HashMap<String, User>>>,
    pub sessions: Arc<Mutex<HashMap<String, String>>>, // token -> user_id
    pub settings: Arc<Mutex<HashMap<String, HashMap<String, serde_json::Value>>>>, // user_id -> settings
    pub jwt_secret: String,
    pub node_env: String,
}

impl AuthState {
    pub fn new(jwt_secret: String, node_env: String) -> Self {
        Self {
            users: Arc::new(Mutex::new(HashMap::new())),
            sessions: Arc::new(Mutex::new(HashMap::new())),
            settings: Arc::new(Mutex::new(HashMap::new())),
            jwt_secret,
            node_env,
        }
    }
}

// Request/Response structures
#[derive(Deserialize)]
struct CreateUserRequest {
    email: String,
    name: String,
}

#[derive(Deserialize)]
struct UpdateSubscriptionRequest {
    tier: String,
    status: String,
}

#[derive(Deserialize)]
struct UpdateSettingRequest {
    key: String,
    value: serde_json::Value,
}

#[derive(Serialize)]
struct AuthUrlResponse {
    user: User,
    token: String,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
}

// Helper functions
fn generate_token(user_id: &str, secret: &str) -> Result<String, jsonwebtoken::errors::Error> {
    let expiration = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::days(7))
        .expect("valid timestamp")
        .timestamp() as usize;

    let claims = Claims {
        user_id: user_id.to_string(),
        exp: expiration,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_ref()),
    )
}

fn verify_token(token: &str, secret: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
    let validation = Validation::new(Algorithm::HS256);
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_ref()),
        &validation,
    )?;
    Ok(token_data.claims)
}

// Middleware to extract user from Authorization header
async fn get_user_from_auth(
    headers: &HeaderMap,
    state: &AuthState,
) -> Result<User, StatusCode> {
    let auth_header = headers
        .get("authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    if !auth_header.starts_with("Bearer ") {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let token = &auth_header[7..];
    let claims = verify_token(token, &state.jwt_secret)
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    let users = state.users.lock().await;
    users
        .get(&claims.user_id)
        .cloned()
        .ok_or(StatusCode::UNAUTHORIZED)
}

// Route handlers
async fn get_auth_url(
    AxumState(state): AxumState<AuthState>,
) -> Result<Json<AuthUrlResponse>, Response> {
    // Development mode: Create mock user
    if state.node_env == "development" {
        log::info!("🔧 Development mode: Creating mock user");

        let user_id = Uuid::new_v4().to_string();
        let user = User {
            id: user_id.clone(),
            email: "dev@example.com".to_string(),
            name: "Dev User".to_string(),
            profile_picture: "https://via.placeholder.com/150".to_string(),
            subscription: Subscription {
                tier: "pro".to_string(),
                status: "active".to_string(),
            },
        };

        let token = generate_token(&user_id, &state.jwt_secret)
            .map_err(|e| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse {
                        error: format!("Failed to generate token: {}", e),
                    }),
                )
                    .into_response()
            })?;

        // Store user and session
        let mut users = state.users.lock().await;
        users.insert(user_id.clone(), user.clone());

        let mut sessions = state.sessions.lock().await;
        sessions.insert(token.clone(), user_id);

        return Ok(Json(AuthUrlResponse { user, token }));
    }

    // Production mode: Would implement real OAuth flow here
    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            error: "Google OAuth not implemented yet for production".to_string(),
        }),
    )
        .into_response())
}

async fn get_me(
    AxumState(state): AxumState<AuthState>,
    headers: HeaderMap,
) -> Result<Json<User>, Response> {
    let user = get_user_from_auth(&headers, &state)
        .await
        .map_err(|status| {
            (
                status,
                Json(ErrorResponse {
                    error: "Unauthorized".to_string(),
                }),
            )
                .into_response()
        })?;

    Ok(Json(user))
}

async fn verify_token_endpoint(
    AxumState(state): AxumState<AuthState>,
    headers: HeaderMap,
) -> Result<Json<serde_json::Value>, Response> {
    let user = get_user_from_auth(&headers, &state)
        .await
        .map_err(|status| {
            (
                status,
                Json(ErrorResponse {
                    error: "Invalid token".to_string(),
                }),
            )
                .into_response()
        })?;

    Ok(Json(serde_json::json!({
        "valid": true,
        "userId": user.id
    })))
}

async fn update_subscription(
    AxumState(state): AxumState<AuthState>,
    headers: HeaderMap,
    Json(payload): Json<UpdateSubscriptionRequest>,
) -> Result<Json<User>, Response> {
    let mut user = get_user_from_auth(&headers, &state)
        .await
        .map_err(|status| {
            (
                status,
                Json(ErrorResponse {
                    error: "Unauthorized".to_string(),
                }),
            )
                .into_response()
        })?;

    user.subscription.tier = payload.tier;
    user.subscription.status = payload.status;

    let mut users = state.users.lock().await;
    users.insert(user.id.clone(), user.clone());

    Ok(Json(user))
}

// Settings endpoints
async fn get_settings(
    AxumState(state): AxumState<AuthState>,
    headers: HeaderMap,
) -> Result<Json<Settings>, Response> {
    let user = get_user_from_auth(&headers, &state)
        .await
        .map_err(|status| {
            (
                status,
                Json(ErrorResponse {
                    error: "Unauthorized".to_string(),
                }),
            )
                .into_response()
        })?;

    let settings_map = state.settings.lock().await;
    let user_settings = settings_map
        .get(&user.id)
        .cloned()
        .unwrap_or_default();

    Ok(Json(Settings {
        data: user_settings,
    }))
}

async fn save_settings(
    AxumState(state): AxumState<AuthState>,
    headers: HeaderMap,
    Json(new_settings): Json<Settings>,
) -> Result<Json<Settings>, Response> {
    let user = get_user_from_auth(&headers, &state)
        .await
        .map_err(|status| {
            (
                status,
                Json(ErrorResponse {
                    error: "Unauthorized".to_string(),
                }),
            )
                .into_response()
        })?;

    let mut settings_map = state.settings.lock().await;
    settings_map.insert(user.id.clone(), new_settings.data.clone());

    Ok(Json(new_settings))
}

async fn update_setting(
    AxumState(state): AxumState<AuthState>,
    headers: HeaderMap,
    axum::extract::Path(key): axum::extract::Path<String>,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, Response> {
    let user = get_user_from_auth(&headers, &state)
        .await
        .map_err(|status| {
            (
                status,
                Json(ErrorResponse {
                    error: "Unauthorized".to_string(),
                }),
            )
                .into_response()
        })?;

    let mut settings_map = state.settings.lock().await;
    let user_settings = settings_map.entry(user.id.clone()).or_insert_with(HashMap::new);
    user_settings.insert(key.clone(), payload.clone());

    Ok(Json(serde_json::json!({
        "success": true,
        "key": key,
        "value": payload
    })))
}

async fn delete_setting(
    AxumState(state): AxumState<AuthState>,
    headers: HeaderMap,
    axum::extract::Path(key): axum::extract::Path<String>,
) -> Result<Json<serde_json::Value>, Response> {
    let user = get_user_from_auth(&headers, &state)
        .await
        .map_err(|status| {
            (
                status,
                Json(ErrorResponse {
                    error: "Unauthorized".to_string(),
                }),
            )
                .into_response()
        })?;

    let mut settings_map = state.settings.lock().await;
    if let Some(user_settings) = settings_map.get_mut(&user.id) {
        user_settings.remove(&key);
    }

    Ok(Json(serde_json::json!({
        "success": true,
        "deleted": key
    })))
}

// Development endpoints
async fn create_dev_user(
    AxumState(state): AxumState<AuthState>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<Json<User>, Response> {
    if state.node_env != "development" {
        return Err((
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "Only available in development".to_string(),
            }),
        )
            .into_response());
    }

    let user_id = Uuid::new_v4().to_string();
    let user = User {
        id: user_id.clone(),
        email: payload.email,
        name: payload.name,
        profile_picture: "https://via.placeholder.com/150".to_string(),
        subscription: Subscription {
            tier: "free".to_string(),
            status: "active".to_string(),
        },
    };

    let mut users = state.users.lock().await;
    users.insert(user_id, user.clone());

    Ok(Json(user))
}

async fn list_dev_users(
    AxumState(state): AxumState<AuthState>,
) -> Result<Json<Vec<User>>, Response> {
    if state.node_env != "development" {
        return Err((
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "Only available in development".to_string(),
            }),
        )
            .into_response());
    }

    let users = state.users.lock().await;
    let user_list: Vec<User> = users.values().cloned().collect();

    Ok(Json(user_list))
}

// Dev Login endpoint - used by LoginPage
async fn dev_login(
    AxumState(state): AxumState<AuthState>,
) -> Result<Json<serde_json::Value>, Response> {
    if state.node_env != "development" {
        return Err((
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "Only available in development".to_string(),
            }),
        )
            .into_response());
    }

    log::info!("🔧 Dev Login: Creating mock user");

    let user_id = Uuid::new_v4().to_string();
    let user = User {
        id: user_id.clone(),
        email: "dev@example.com".to_string(),
        name: "Dev User".to_string(),
        profile_picture: "".to_string(),
        subscription: Subscription {
            tier: "pro".to_string(),
            status: "active".to_string(),
        },
    };

    let token = generate_token(&user_id, &state.jwt_secret).map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("Failed to generate token: {}", e),
            }),
        )
            .into_response()
    })?;

    // Store user and session
    let mut users = state.users.lock().await;
    users.insert(user_id.clone(), user.clone());

    let mut sessions = state.sessions.lock().await;
    sessions.insert(token.clone(), user_id);

    Ok(Json(serde_json::json!({
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "profilePicture": user.profile_picture,
        },
        "subscription": user.subscription,
    })))
}

// Health check
async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "ok",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}

// Main server function
pub async fn start_auth_server(port: u16, jwt_secret: String, node_env: String) -> anyhow::Result<()> {
    let state = AuthState::new(jwt_secret, node_env.clone());

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        // Health check
        .route("/health", get(health))
        // Auth routes
        .route("/auth/google/url", get(get_auth_url))
        .route("/auth/me", get(get_me))
        .route("/auth/verify", get(verify_token_endpoint))
        .route("/auth/subscription", post(update_subscription))
        .route("/auth/dev/login", post(dev_login))
        // Settings routes
        .route("/api/settings", get(get_settings))
        .route("/api/settings", post(save_settings))
        .route("/api/settings/{key}", patch(update_setting))
        .route("/api/settings/{key}", axum::routing::delete(delete_setting))
        // Development routes
        .route("/dev/create-user", post(create_dev_user))
        .route("/dev/users", get(list_dev_users))
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    log::info!("🚀 Auth Server starting on http://{}", addr);
    log::info!("📦 Environment: {}", node_env);

    let listener = TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
