import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import rateLimit from 'express-rate-limit';
import { createUser } from './models/userFactory.js';
import { closeDatabase } from './db/index.js';
import userRepository from './db/repositories/userRepository.js';
import settingsRepository from './db/repositories/settingsRepository.js';
import authCodeRepository from './db/repositories/authCodeRepository.js';
import {
  hashPassword,
  verifyPassword,
  generateVerificationCode,
  validatePassword,
  validateEmail,
  getExpirationTime,
  isExpired
} from './utils/auth.js';
import {
  sendVerificationCode,
  sendPasswordResetCode
} from './utils/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
// Try multiple paths: bundled resource, development, and parent directory
const envPaths = [
  path.join(process.resourcesPath || '', '.env'),  // Bundled in Tauri app
  path.join(__dirname, '../.env'),                  // Development
  path.join(__dirname, '.env')                      // Same directory
];

for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    break;
  }
}

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Secure JWT_SECRET handling with production safety check
const JWT_SECRET = process.env.JWT_SECRET;
if (NODE_ENV === 'production' && !JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable must be set in production');
    process.exit(1);
}
const EFFECTIVE_JWT_SECRET = JWT_SECRET || (() => {
    console.warn('⚠️ WARNING: Using development JWT secret. Do NOT use in production!');
    return 'dev-secret-key-UNSAFE-DO-NOT-USE-IN-PRODUCTION';
})();

// Gemini AI Client for Support Chat
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Anthropic AI Client for Claude Proxy
const anthropic = process.env.ANYON_ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANYON_ANTHROPIC_API_KEY })
  : null;

// Token blacklist for logout (in-memory, cleared on server restart)
// In production, consider using Redis for persistence across restarts
const tokenBlacklist = new Set();
const TOKEN_BLACKLIST_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

// Cleanup expired tokens from blacklist periodically
setInterval(() => {
  const now = Math.floor(Date.now() / 1000);
  for (const entry of tokenBlacklist) {
    try {
      const decoded = jwt.decode(entry);
      if (decoded && decoded.exp && decoded.exp < now) {
        tokenBlacklist.delete(entry);
      }
    } catch {
      tokenBlacklist.delete(entry);
    }
  }
}, TOKEN_BLACKLIST_CLEANUP_INTERVAL);

const SUPPORT_SYSTEM_PROMPT = `당신은 Anyon 서비스의 AI 서포트입니다.
사용자가 AI 자동 개발 도구를 사용하다가 막히거나 궁금한 점이 있을 때 도움을 줍니다.

역할:
- 에러 메시지 분석 및 해결 방법 안내
- 워크플로우 사용법 설명
- 기획문서 작성 팁 제공
- 개발 진행 상황 관련 질문 답변

톤:
- 친근하고 격려하는 톤 유지
- 기술 용어는 쉽게 풀어서 설명
- 모르는 것은 솔직히 "잘 모르겠어요"라고 답변
- 복잡한 문제는 카카오톡 상담 권유

제약:
- 코드를 직접 작성해주지 않음 (개발 워크플로우가 처리)
- 외부 서비스 관련 질문은 답변 불가
- 민감한 정보 요청 거부`;

// CORS Configuration - only allow specific origins
const allowedOrigins = [
  'http://localhost:5173',  // Vite dev server (legacy)
  'http://localhost:1420',  // Tauri dev server
  'http://localhost:4000',  // Self (dev)
  'https://auth.any-on.com', // Production server
  'tauri://localhost',      // Tauri app
  'https://tauri.localhost' // Tauri app (alternative)
];

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Increase limit for Claude API requests

// Rate limiting - prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // stricter limit for sensitive endpoints
  message: { error: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to auth routes
app.use('/auth', authLimiter);
app.use('/dev', strictLimiter);

// Stricter rate limiting for login attempts (brute force protection)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts
  skipSuccessfulRequests: true,
  message: { error: '로그인 시도 횟수를 초과했습니다. 15분 후 다시 시도해주세요.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for code operations
const codeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 code requests
  message: { error: '인증 코드 요청 횟수를 초과했습니다. 15분 후 다시 시도해주세요.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper: Generate JWT token
function generateToken(userId) {
  return jwt.sign({ userId }, EFFECTIVE_JWT_SECRET, { expiresIn: '7d' });
}

// Helper: Verify JWT token
function verifyToken(token) {
  try {
    // Check if token is blacklisted (logged out)
    if (tokenBlacklist.has(token)) {
      return null;
    }
    return jwt.verify(token, EFFECTIVE_JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Middleware: Authenticate request
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const user = userRepository.findById(decoded.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  req.user = user;
  req.token = token; // Store token for logout
  next();
}

// Routes

// Dev Login endpoint - simplified version
app.post('/auth/dev/login', (req, res) => {
  // Check if dev user already exists
  let user = userRepository.findByEmail('dev@example.com');

  if (!user) {
    // Create new dev user
    user = createUser({
      email: 'dev@example.com',
      name: 'Dev User',
      planType: 'PRO',
    });
    userRepository.create(user);
  }

  const token = generateToken(user.id);

  return res.json({
    token: token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      profilePicture: user.profilePicture,
    },
    subscription: user.subscription,
  });
});

// ============================================
// Local Authentication Endpoints
// ============================================

// Register new user with email/password
app.post('/auth/register', async (req, res) => {
  const { email, password, name } = req.body;

  try {
    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: '이메일, 비밀번호, 이름은 필수입니다' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: '유효하지 않은 이메일 형식입니다' });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.errors[0] });
    }

    // Check if user already exists
    const existingUser = userRepository.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: '이미 등록된 이메일입니다' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create new user (email_verified = 0)
    const user = createUser({
      email,
      name,
      planType: 'FREE',
    });

    // Add password_hash and email_verified to user object for DB
    const userWithPassword = {
      ...user,
      passwordHash,
      emailVerified: false,
    };

    // Store in database
    userRepository.create(userWithPassword);

    // Generate verification code (15 minutes expiration)
    const code = generateVerificationCode();
    const expiresAt = getExpirationTime(15);

    // Delete any existing codes for this user
    authCodeRepository.deleteUserCodes(user.id, 'EMAIL_VERIFY');

    // Store verification code
    authCodeRepository.createCode(user.id, 'EMAIL_VERIFY', code, expiresAt);

    // Send verification email
    await sendVerificationCode(email, name, code);

    console.log(`✅ User registered: ${email}`);
    res.json({
      success: true,
      message: '인증 코드를 이메일로 전송했습니다',
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: '회원가입에 실패했습니다', details: error.message });
  }
});

// Verify email with code
app.post('/auth/verify-email', async (req, res) => {
  const { email, code } = req.body;

  try {
    if (!email || !code) {
      return res.status(400).json({ error: '이메일과 인증 코드는 필수입니다' });
    }

    // Find user
    const user = userRepository.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({ error: '이미 인증된 이메일입니다' });
    }

    // Find verification code
    const authCode = authCodeRepository.findByCode(code, 'EMAIL_VERIFY');
    if (!authCode || authCode.user_id !== user.id) {
      return res.status(400).json({ error: '유효하지 않은 인증 코드입니다' });
    }

    // Check expiration
    if (isExpired(authCode.expires_at)) {
      authCodeRepository.deleteCode(authCode.id);
      return res.status(400).json({ error: '인증 코드가 만료되었습니다' });
    }

    // Check attempts
    if (authCode.attempts >= 5) {
      authCodeRepository.deleteCode(authCode.id);
      return res.status(400).json({ error: '인증 시도 횟수를 초과했습니다. 코드를 재전송해주세요.' });
    }

    // Increment attempts
    authCodeRepository.incrementAttempts(authCode.id);

    // Verify email
    userRepository.verifyEmail(user.id);

    // Delete code
    authCodeRepository.deleteCode(authCode.id);

    // Generate JWT token
    const token = generateToken(user.id);

    // Get updated user
    const updatedUser = userRepository.findById(user.id);

    console.log(`✅ Email verified: ${email}`);
    res.json({
      token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        profilePicture: updatedUser.profilePicture,
      },
      subscription: updatedUser.subscription,
    });
  } catch (error) {
    console.error('❌ Email verification error:', error);
    res.status(500).json({ error: '이메일 인증에 실패했습니다', details: error.message });
  }
});

// Login with email/password
app.post('/auth/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호는 필수입니다' });
    }

    // Find user
    const user = userRepository.findByEmail(email);
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' });
    }

    // Check email verification
    if (!user.emailVerified) {
      return res.status(403).json({ error: '이메일 인증이 필요합니다' });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    console.log(`✅ User logged in: ${email}`);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
      },
      subscription: user.subscription,
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: '로그인에 실패했습니다', details: error.message });
  }
});

// Resend verification code
app.post('/auth/resend-code', codeLimiter, async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ error: '이메일은 필수입니다' });
    }

    // Find user
    const user = userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists (security)
      return res.json({ success: true, message: '인증 코드를 이메일로 전송했습니다' });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({ error: '이미 인증된 이메일입니다' });
    }

    // Delete old codes
    authCodeRepository.deleteUserCodes(user.id, 'EMAIL_VERIFY');

    // Generate new code
    const code = generateVerificationCode();
    const expiresAt = getExpirationTime(15);

    authCodeRepository.createCode(user.id, 'EMAIL_VERIFY', code, expiresAt);

    // Send email
    await sendVerificationCode(email, user.name, code);

    console.log(`✅ Verification code resent: ${email}`);
    res.json({ success: true, message: '인증 코드를 이메일로 전송했습니다' });
  } catch (error) {
    console.error('❌ Resend code error:', error);
    res.status(500).json({ error: '인증 코드 전송에 실패했습니다', details: error.message });
  }
});

// Forgot password - send reset code
app.post('/auth/forgot-password', codeLimiter, async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ error: '이메일은 필수입니다' });
    }

    // Find user
    const user = userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists (security)
      return res.json({ success: true, message: '비밀번호 재설정 코드를 이메일로 전송했습니다' });
    }

    // Delete old reset codes
    authCodeRepository.deleteUserCodes(user.id, 'PASSWORD_RESET');

    // Generate reset code (1 hour expiration)
    const code = generateVerificationCode();
    const expiresAt = getExpirationTime(60);

    authCodeRepository.createCode(user.id, 'PASSWORD_RESET', code, expiresAt);

    // Send email
    await sendPasswordResetCode(email, user.name, code);

    console.log(`✅ Password reset code sent: ${email}`);
    res.json({ success: true, message: '비밀번호 재설정 코드를 이메일로 전송했습니다' });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ error: '비밀번호 재설정 요청에 실패했습니다', details: error.message });
  }
});

// Reset password with code
app.post('/auth/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;

  try {
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: '이메일, 인증 코드, 새 비밀번호는 필수입니다' });
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.errors[0] });
    }

    // Find user
    const user = userRepository.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    // Find reset code
    const authCode = authCodeRepository.findByCode(code, 'PASSWORD_RESET');
    if (!authCode || authCode.user_id !== user.id) {
      return res.status(400).json({ error: '유효하지 않은 인증 코드입니다' });
    }

    // Check expiration
    if (isExpired(authCode.expires_at)) {
      authCodeRepository.deleteCode(authCode.id);
      return res.status(400).json({ error: '인증 코드가 만료되었습니다' });
    }

    // Check attempts
    if (authCode.attempts >= 5) {
      authCodeRepository.deleteCode(authCode.id);
      return res.status(400).json({ error: '인증 시도 횟수를 초과했습니다. 코드를 재전송해주세요.' });
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    userRepository.updatePassword(user.id, passwordHash);

    // Delete code
    authCodeRepository.deleteCode(authCode.id);

    console.log(`✅ Password reset: ${email}`);
    res.json({ success: true, message: '비밀번호가 재설정되었습니다' });
  } catch (error) {
    console.error('❌ Password reset error:', error);
    res.status(500).json({ error: '비밀번호 재설정에 실패했습니다', details: error.message });
  }
});

// Get current user info
app.get('/auth/me', authenticate, (req, res) => {
  const { id, email, name, profilePicture, subscription } = req.user;

  res.json({
    user: { id, email, name, profilePicture },
    subscription,
  });
});

// Verify token
app.get('/auth/verify', authenticate, (req, res) => {
  res.json({ valid: true });
});

// Logout - invalidate current token
app.post('/auth/logout', authenticate, (req, res) => {
  tokenBlacklist.add(req.token);
  console.log(`✅ User logged out: ${req.user.email}`);
  res.json({ success: true, message: 'Logged out successfully' });
});

// Update subscription (for testing)
app.post('/auth/subscription', authenticate, (req, res) => {
  const { planType, status } = req.body;

  if (!['FREE', 'PRO'].includes(planType)) {
    return res.status(400).json({ error: 'Invalid plan type' });
  }

  if (!['ACTIVE', 'CANCELED', 'PAST_DUE'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const subscription = {
    planType,
    status,
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const updatedUser = userRepository.updateSubscription(req.user.id, subscription);

  res.json({ subscription: updatedUser.subscription });
});

// Development: Create test user
app.post('/dev/create-user', (req, res) => {
  const { email, name, planType = 'FREE' } = req.body;

  const userName = name || 'Test User';
  const user = createUser({
    email: email || `test-${Date.now()}@example.com`,
    name: userName,
    profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6366f1&color=fff&size=150`,
    planType,
  });

  userRepository.create(user);
  const token = generateToken(user.id);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      profilePicture: user.profilePicture,
    },
    subscription: user.subscription,
    token,
  });
});

// Development: List all users
app.get('/dev/users', (req, res) => {
  const allUsers = userRepository.list().map(user => ({
    id: user.id,
    email: user.email,
    name: user.name,
    subscription: user.subscription,
  }));

  res.json({ users: allUsers });
});

// Get user settings
app.get('/api/settings', authenticate, (req, res) => {
  const settings = settingsRepository.getAll(req.user.id);
  res.json({ settings });
});

// Save user settings (full replace)
app.post('/api/settings', authenticate, (req, res) => {
  const { settings } = req.body;

  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Invalid settings object' });
  }

  settingsRepository.replaceAll(req.user.id, settings);
  res.json({ success: true, settings });
});

// Update specific setting
app.patch('/api/settings/:key', authenticate, (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  settingsRepository.set(req.user.id, key, value);

  res.json({ success: true, key, value });
});

// Delete specific setting
app.delete('/api/settings/:key', authenticate, (req, res) => {
  const { key } = req.params;

  settingsRepository.delete(req.user.id, key);

  res.json({ success: true });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// AI Support Chat Endpoint (Gemini + SSE)
// ============================================

app.post('/api/support/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  if (!genAI) {
    return res.status(503).json({ error: 'AI service not configured. Set GEMINI_API_KEY.' });
  }

  // SSE 헤더 설정
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // nginx 버퍼링 비활성화

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // 대화 히스토리 변환 (마지막 메시지 제외)
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history,
      systemInstruction: SUPPORT_SYSTEM_PROMPT,
    });

    // 마지막 메시지로 스트리밍 응답 생성
    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessageStream(lastMessage.content);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('❌ Support chat error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Failed to get AI response' })}\n\n`);
    res.end();
  }
});

// ============================================
// Claude API Proxy - Anthropic API 호환 엔드포인트
// Claude Code가 ANTHROPIC_BASE_URL로 이 서버를 사용할 수 있도록
// ============================================

// 사용자별 일일 사용량 추적 (in-memory, 프로덕션에서는 Redis/DB 사용)
const usageTracking = new Map(); // userId -> { date: 'YYYY-MM-DD', totalCost: number }
const DAILY_LIMIT_USD = 5.0;

// 모델명 별칭 매핑 (Claude Code 모델명 -> Anthropic API 모델명)
const MODEL_ALIASES = {
  // Claude Code 단축 별칭
  'sonnet': 'claude-sonnet-4-5-20250929',
  'opus': 'claude-opus-4-5-20251101',
  'haiku': 'claude-haiku-4-5-20251001',

  // API 별칭 -> 정확한 버전
  'claude-sonnet-4-5': 'claude-sonnet-4-5-20250929',
  'claude-opus-4-5': 'claude-opus-4-5-20251101',
  'claude-haiku-4-5': 'claude-haiku-4-5-20251001',

  // 레거시 모델
  'claude-sonnet-4': 'claude-sonnet-4-20250514',
  'claude-opus-4-1': 'claude-opus-4-1-20250805',
  'claude-opus-4': 'claude-opus-4-20250514',
  'claude-3-7-sonnet': 'claude-3-7-sonnet-20250219',
  'claude-3-haiku': 'claude-3-haiku-20240307',
};

// 모델별 토큰당 비용 (USD) - 2025년 12월 기준
const MODEL_PRICING = {
  // Claude 4.5 (최신)
  'claude-sonnet-4-5-20250929': { input: 3.0 / 1_000_000, output: 15.0 / 1_000_000 },
  'claude-opus-4-5-20251101': { input: 5.0 / 1_000_000, output: 25.0 / 1_000_000 },
  'claude-haiku-4-5-20251001': { input: 1.0 / 1_000_000, output: 5.0 / 1_000_000 },

  // Claude 4 레거시
  'claude-sonnet-4-20250514': { input: 3.0 / 1_000_000, output: 15.0 / 1_000_000 },
  'claude-opus-4-1-20250805': { input: 15.0 / 1_000_000, output: 75.0 / 1_000_000 },
  'claude-opus-4-20250514': { input: 15.0 / 1_000_000, output: 75.0 / 1_000_000 },
  'claude-3-7-sonnet-20250219': { input: 3.0 / 1_000_000, output: 15.0 / 1_000_000 },
  'claude-3-haiku-20240307': { input: 0.25 / 1_000_000, output: 1.25 / 1_000_000 },

  // 기본값
  'default': { input: 3.0 / 1_000_000, output: 15.0 / 1_000_000 },
};

// 모델명 정규화 (별칭 -> 실제 모델명)
function normalizeModelName(model) {
  return MODEL_ALIASES[model] || model;
}

// UTC 기준 오늘 날짜
function getTodayUTC() {
  return new Date().toISOString().split('T')[0];
}

// 사용자 일일 사용량 조회
function getUserDailyUsage(userId) {
  const today = getTodayUTC();
  const usage = usageTracking.get(userId);

  if (!usage || usage.date !== today) {
    // 새 날짜면 리셋
    usageTracking.set(userId, { date: today, totalCost: 0 });
    return 0;
  }

  return usage.totalCost;
}

// 사용량 추가
function addUsage(userId, cost) {
  const today = getTodayUTC();
  const current = usageTracking.get(userId);

  if (!current || current.date !== today) {
    usageTracking.set(userId, { date: today, totalCost: cost });
  } else {
    current.totalCost += cost;
  }
}

// 비용 계산
function calculateCost(model, inputTokens, outputTokens) {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['default'];
  return (inputTokens * pricing.input) + (outputTokens * pricing.output);
}

// JWT 토큰 기반 인증 미들웨어 (ANTHROPIC_AUTH_TOKEN 헤더용)
function authenticateAnthropicStyle(req, res, next) {
  // x-api-key 또는 Authorization 헤더에서 JWT 토큰 추출
  const apiKey = req.headers['x-api-key'];
  const authHeader = req.headers.authorization;

  console.log('[Auth Debug] Headers:', {
    'x-api-key': apiKey ? `${apiKey.substring(0, 20)}...` : 'missing',
    'authorization': authHeader ? `${authHeader.substring(0, 30)}...` : 'missing'
  });

  let token = apiKey;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token) {
    console.log('[Auth Debug] No token found');
    return res.status(401).json({
      type: 'error',
      error: {
        type: 'authentication_error',
        message: 'Missing API key or Authorization header'
      }
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    console.log('[Auth Debug] Token verification failed');
    return res.status(401).json({
      type: 'error',
      error: {
        type: 'authentication_error',
        message: 'Invalid or expired token'
      }
    });
  }

  const user = userRepository.findById(decoded.userId);
  if (!user) {
    return res.status(401).json({
      type: 'error',
      error: {
        type: 'authentication_error',
        message: 'User not found'
      }
    });
  }

  req.user = user;
  next();
}

// Anthropic API 호환 /v1/messages 엔드포인트
app.post('/v1/messages', authenticateAnthropicStyle, async (req, res) => {
  let { model, messages, max_tokens, system, temperature, stream } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      type: 'error',
      error: { type: 'invalid_request_error', message: 'messages is required' }
    });
  }

  if (!model) {
    return res.status(400).json({
      type: 'error',
      error: { type: 'invalid_request_error', message: 'model is required' }
    });
  }

  // 모델명 정규화 (sonnet -> claude-sonnet-4-20250514)
  model = normalizeModelName(model);

  if (!anthropic) {
    return res.status(503).json({
      type: 'error',
      error: { type: 'api_error', message: 'ANYON API service unavailable' }
    });
  }

  // 일일 사용량 체크
  const currentUsage = getUserDailyUsage(req.user.id);
  if (currentUsage >= DAILY_LIMIT_USD) {
    console.log(`[Claude Proxy] BLOCKED - User: ${req.user.email}, Usage: $${currentUsage.toFixed(4)} >= $${DAILY_LIMIT_USD}`);
    return res.status(429).json({
      type: 'error',
      error: {
        type: 'rate_limit_error',
        message: `Daily usage limit exceeded ($${DAILY_LIMIT_USD}/day). Resets at UTC midnight.`
      }
    });
  }

  console.log(`[Claude Proxy] ===== NEW REQUEST =====`);
  console.log(`[Claude Proxy] User: ${req.user.email} (${req.user.id})`);
  console.log(`[Claude Proxy] Model: ${model}`);
  console.log(`[Claude Proxy] Stream: ${stream ? 'YES' : 'NO'}`);
  console.log(`[Claude Proxy] Messages: ${messages.length} messages`);
  console.log(`[Claude Proxy] Current Usage: $${currentUsage.toFixed(4)} / $${DAILY_LIMIT_USD}`);

  try {
    if (stream) {
      // SSE 스트리밍 응답
      console.log(`[Claude Proxy] Starting SSE stream...`);
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      const messageStream = await anthropic.messages.stream({
        model,
        max_tokens: max_tokens || 4096,
        system: system || undefined,
        temperature: temperature ?? undefined,
        messages,
      });
      console.log(`[Claude Proxy] Stream created successfully`);

      // Anthropic의 SSE 이벤트를 그대로 전달
      for await (const event of messageStream) {
        res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
      }

      // 최종 메시지에서 사용량 추적
      const finalMessage = await messageStream.finalMessage();
      const cost = calculateCost(model, finalMessage.usage.input_tokens, finalMessage.usage.output_tokens);
      addUsage(req.user.id, cost);

      console.log(`[Claude Proxy] ✅ STREAM COMPLETE`);
      console.log(`[Claude Proxy] Input tokens: ${finalMessage.usage.input_tokens}`);
      console.log(`[Claude Proxy] Output tokens: ${finalMessage.usage.output_tokens}`);
      console.log(`[Claude Proxy] Cost: $${cost.toFixed(6)}`);
      console.log(`[Claude Proxy] Total today: $${getUserDailyUsage(req.user.id).toFixed(4)}`);

      res.write(`event: message_stop\ndata: {"type":"message_stop"}\n\n`);
      res.end();
    } else {
      // 일반 JSON 응답
      console.log(`[Claude Proxy] Starting non-stream request...`);
      const message = await anthropic.messages.create({
        model,
        max_tokens: max_tokens || 4096,
        system: system || undefined,
        temperature: temperature ?? undefined,
        messages,
      });

      // 사용량 추적
      const cost = calculateCost(model, message.usage.input_tokens, message.usage.output_tokens);
      addUsage(req.user.id, cost);

      console.log(`[Claude Proxy] ✅ REQUEST COMPLETE`);
      console.log(`[Claude Proxy] Input tokens: ${message.usage.input_tokens}`);
      console.log(`[Claude Proxy] Output tokens: ${message.usage.output_tokens}`);
      console.log(`[Claude Proxy] Cost: $${cost.toFixed(6)}`);
      console.log(`[Claude Proxy] Total today: $${getUserDailyUsage(req.user.id).toFixed(4)}`);

      res.json(message);
    }
  } catch (error) {
    console.error('❌ [Claude Proxy] ERROR:', error.message);
    console.error('❌ [Claude Proxy] Stack:', error.stack);

    res.status(error.status || 500).json({
      type: 'error',
      error: {
        type: 'api_error',
        message: error.message || 'Internal server error'
      }
    });
  }
});

// 레거시 엔드포인트 (기존 호환성 유지)
app.post('/api/claude/messages', authenticate, async (req, res) => {
  // /v1/messages로 리다이렉트하는 대신 내부 처리
  req.headers['x-api-key'] = req.token;
  return app._router.handle({ ...req, url: '/v1/messages', originalUrl: '/v1/messages' }, res, () => {});
});

// 사용량 조회 엔드포인트
app.get('/api/claude/usage', authenticate, (req, res) => {
  const usage = getUserDailyUsage(req.user.id);
  res.json({
    userId: req.user.id,
    date: getTodayUTC(),
    usedUSD: usage,
    limitUSD: DAILY_LIMIT_USD,
    remainingUSD: Math.max(0, DAILY_LIMIT_USD - usage),
    percentUsed: Math.min(100, (usage / DAILY_LIMIT_USD) * 100)
  });
});

// Claude API 상태 확인
app.get('/api/claude/status', (req, res) => {
  res.json({
    available: !!anthropic,
    message: anthropic ? 'ANYON Claude API is available' : 'Claude API not configured',
    dailyLimitUSD: DAILY_LIMIT_USD
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Auth Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${NODE_ENV}`);
  console.log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`🧠 Claude API: ${process.env.ANYON_ANTHROPIC_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`📧 SMTP: ${process.env.SMTP_HOST ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`\n📝 Development endpoints:`);
  console.log(`   POST /dev/create-user - Create test user`);
  console.log(`   GET  /dev/users - List all users`);
  console.log(`\n🔐 Auth endpoints:`);
  console.log(`   POST /auth/register - Register with email/password`);
  console.log(`   POST /auth/login - Login with email/password`);
  console.log(`   GET  /auth/me - Get current user`);
  console.log(`   GET  /auth/verify - Verify token`);
  console.log(`   POST /auth/logout - Logout (invalidate token)`);
  console.log(`   POST /auth/subscription - Update subscription`);
  console.log(`\n⚙️  Settings endpoints:`);
  console.log(`   GET    /api/settings - Get user settings`);
  console.log(`   POST   /api/settings - Save user settings`);
  console.log(`   PATCH  /api/settings/:key - Update specific setting`);
  console.log(`   DELETE /api/settings/:key - Delete specific setting`);
  console.log(`\n🤖 Support Chat endpoints:`);
  console.log(`   POST /api/support/chat - AI support chat (SSE streaming)`);
  console.log(`\n🧠 Claude API Proxy endpoints:`);
  console.log(`   GET  /api/claude/status - Check Claude API availability`);
  console.log(`   POST /api/claude/messages - Claude chat (SSE streaming, auth required)\n`);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\n${signal} received, shutting down gracefully...`);

  server.close(() => {
    console.log('✅ HTTP server closed');
    closeDatabase();
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
