import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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
    console.log(`Loaded .env from: ${envPath}`);
    break;
  }
}

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Google OAuth Client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.OAUTH_REDIRECT_URI || 'http://localhost:4000/auth/google/callback'
);

// Middleware
app.use(cors());
app.use(express.json());

// Mock database (in-memory for development)
const users = new Map();
const sessions = new Map();
const userSettings = new Map(); // userId -> settings object

// Helper: Generate JWT token
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

// Helper: Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
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

  const user = users.get(decoded.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  req.user = user;
  next();
}

// Routes

// Dev Login endpoint
app.post('/auth/dev/login', (req, res) => {
  // Only allow in development mode
  if (NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Not allowed in production' });
  }

  console.log('🔧 Dev Login: Creating mock user');
  const userId = uuidv4();
  const user = {
    id: userId,
    email: 'dev@example.com',
    name: 'Dev User',
    profilePicture: null, // Use default icon
    subscription: {
      planType: 'FREE',
      status: 'ACTIVE',
    },
  };

  users.set(userId, user);
  const token = generateToken(userId);

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

// Get Google OAuth URL
app.get('/auth/google/url', (req, res) => {
  // Always return Google OAuth URL
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });

  res.json({
    url: authUrl,
    devMode: false, // Always false for this endpoint to force redirect
  });
});

// Google OAuth callback
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Authorization code is missing');
  }

  try {
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;

    // Check if user exists
    let user = Array.from(users.values()).find(u => u.email === email);

    if (!user) {
      // Create new user
      const userId = uuidv4();
      user = {
        id: userId,
        googleId: googleId,
        email: email,
        name: name,
        profilePicture: picture,
        subscription: {
          planType: 'FREE',
          status: 'ACTIVE',
        },
      };
      users.set(userId, user);
      console.log('✅ New user created:', email);
    } else {
      console.log('✅ Existing user logged in:', email);
    }

    // Generate JWT token
    const jwtToken = generateToken(user.id);

    // res.redirect(`anyon://auth/callback?token=${jwtToken}`);

    // Serve a simple HTML page to trigger the deep link
    const deepLink = `anyon://auth/callback?token=${jwtToken}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Login Successful</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f2f5; margin: 0; }
            .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; max-width: 400px; width: 90%; }
            h1 { font-size: 1.5rem; color: #111827; margin-bottom: 1rem; }
            p { color: #6b7280; margin-bottom: 1.5rem; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none; font-weight: 500; transition: background 0.2s; }
            .button:hover { background: #1d4ed8; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>로그인 성공!</h1>
            <p>ANYON 앱으로 이동합니다.<br>자동으로 열리지 않으면 아래 버튼을 눌러주세요.</p>
            <a href="${deepLink}" class="button">ANYON 앱 열기</a>
          </div>
          <script>
            // Try to open deep link automatically
            setTimeout(() => {
              window.location.href = "${deepLink}";
            }, 100);
          </script>
        </body>
      </html>
    `;
    res.send(html);
  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    res.status(500).send('Authentication failed');
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

// Update subscription (for testing)
app.post('/auth/subscription', authenticate, (req, res) => {
  const { planType, status } = req.body;

  if (!['FREE', 'PRO'].includes(planType)) {
    return res.status(400).json({ error: 'Invalid plan type' });
  }

  if (!['ACTIVE', 'CANCELED', 'PAST_DUE'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  req.user.subscription = {
    planType,
    status,
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  users.set(req.user.id, req.user);

  res.json({ subscription: req.user.subscription });
});

// Development: Create test user
app.post('/dev/create-user', (req, res) => {
  const { email, name, planType = 'FREE' } = req.body;

  const userId = uuidv4();
  const userName = name || 'Test User';
  const user = {
    id: userId,
    email: email || `test-${Date.now()}@example.com`,
    name: userName,
    profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6366f1&color=fff&size=150`,
    subscription: {
      planType,
      status: 'ACTIVE',
      currentPeriodEnd: planType === 'PRO'
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
    },
  };

  users.set(userId, user);
  const token = generateToken(userId);

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
  const allUsers = Array.from(users.values()).map(user => ({
    id: user.id,
    email: user.email,
    name: user.name,
    subscription: user.subscription,
  }));

  res.json({ users: allUsers });
});

// Get user settings
app.get('/api/settings', authenticate, (req, res) => {
  const settings = userSettings.get(req.user.id) || {};
  res.json({ settings });
});

// Save user settings (full replace)
app.post('/api/settings', authenticate, (req, res) => {
  const { settings } = req.body;

  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Invalid settings object' });
  }

  userSettings.set(req.user.id, settings);
  res.json({ success: true, settings });
});

// Update specific setting
app.patch('/api/settings/:key', authenticate, (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  const settings = userSettings.get(req.user.id) || {};
  settings[key] = value;
  userSettings.set(req.user.id, settings);

  res.json({ success: true, key, value });
});

// Delete specific setting
app.delete('/api/settings/:key', authenticate, (req, res) => {
  const { key } = req.params;

  const settings = userSettings.get(req.user.id) || {};
  delete settings[key];
  userSettings.set(req.user.id, settings);

  res.json({ success: true });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Auth Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${NODE_ENV}`);
  console.log(`🔐 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`\n📝 Development endpoints:`);
  console.log(`   POST /dev/create-user - Create test user`);
  console.log(`   GET  /dev/users - List all users`);
  console.log(`\n🔐 Auth endpoints:`);
  console.log(`   GET  /auth/google/url - Get OAuth URL`);
  console.log(`   GET  /auth/me - Get current user`);
  console.log(`   GET  /auth/verify - Verify token`);
  console.log(`   POST /auth/subscription - Update subscription`);
  console.log(`\n⚙️  Settings endpoints:`);
  console.log(`   GET    /api/settings - Get user settings`);
  console.log(`   POST   /api/settings - Save user settings`);
  console.log(`   PATCH  /api/settings/:key - Update specific setting`);
  console.log(`   DELETE /api/settings/:key - Delete specific setting\n`);
});
