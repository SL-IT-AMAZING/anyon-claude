import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Database imports
import { initializeDatabase } from './db/index.js';
import * as userRepo from './db/userRepository.js';
import * as settingsRepo from './db/settingsRepository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPaths = [
  path.join(process.resourcesPath || '', '.env'),
  path.join(__dirname, '../.env'),
  path.join(__dirname, '.env')
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
const isProduction = NODE_ENV === 'production';

// Google OAuth Client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.OAUTH_REDIRECT_URI || 'http://localhost:4000/auth/google/callback'
);

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:1420',
  'http://localhost:5173',
  'tauri://localhost',
  'https://tauri.localhost',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like Tauri apps, mobile apps, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (!isProduction) {
      // In development, allow all origins
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for OAuth redirects
}));
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(cors(corsOptions));
app.use(express.json());

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
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const user = await userRepo.findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

// Routes

// Dev Login endpoint - only available in development
app.post('/auth/dev/login', async (req, res) => {
  if (isProduction) {
    return res.status(404).json({ error: 'Not found' });
  }

  console.log('Dev Login: Creating mock user');

  try {
    // Check if dev user exists
    let user = await userRepo.findUserByEmail('dev@example.com');

    if (!user) {
      user = await userRepo.createUser({
        googleId: null,
        email: 'dev@example.com',
        name: 'Dev User',
        profilePicture: null,
        planType: 'PRO',
      });
      console.log('New dev user created');
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
  } catch (error) {
    console.error('Dev login error:', error);
    return res.status(500).json({ error: 'Failed to create dev user' });
  }
});

// Get Google OAuth URL
app.get('/auth/google/url', (req, res) => {
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
    devMode: false,
  });
});

// Google OAuth callback
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Authorization code is missing');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

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
    let user = await userRepo.findUserByEmail(email);

    if (!user) {
      user = await userRepo.createUser({
        googleId: googleId,
        email: email,
        name: name,
        profilePicture: picture,
        planType: 'FREE',
      });
      console.log('New user created:', email);
    } else {
      console.log('Existing user logged in:', email);
    }

    const jwtToken = generateToken(user.id);

    // Serve HTML page to trigger deep link
    const deepLink = `anyon://auth/callback?token=${jwtToken}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Login Successful</title>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f2f5; margin: 0; }
            .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; max-width: 400px; width: 90%; }
            h1 { font-size: 1.5rem; color: #111827; margin-bottom: 1rem; }
            p { color: #6b7280; margin-bottom: 1.5rem; line-height: 1.6; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none; font-weight: 500; transition: background 0.2s; cursor: pointer; border: none; font-size: 1rem; }
            .button:hover { background: #1d4ed8; }
            .status { margin-top: 1rem; font-size: 0.875rem; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Login Successful!</h1>
            <p id="message">Redirecting to ANYON app.<br>If it doesn't open automatically, click the button below.</p>
            <button onclick="openApp()" class="button">Open ANYON App</button>
            <div class="status" id="status"></div>
          </div>
          <script>
            let attempts = 0;
            const maxAttempts = 3;

            function openApp() {
              attempts++;
              const statusEl = document.getElementById('status');
              statusEl.textContent = 'Opening app... (' + attempts + '/' + maxAttempts + ')';

              try {
                window.location.href = "${deepLink}";
              } catch (e) {
                console.error('Method 1 failed:', e);
              }

              setTimeout(() => {
                try {
                  const iframe = document.createElement('iframe');
                  iframe.style.display = 'none';
                  iframe.src = "${deepLink}";
                  document.body.appendChild(iframe);
                  setTimeout(() => document.body.removeChild(iframe), 1000);
                } catch (e) {
                  console.error('Method 2 failed:', e);
                }
              }, 200);

              setTimeout(() => {
                try {
                  const link = document.createElement('a');
                  link.href = "${deepLink}";
                  link.style.display = 'none';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                } catch (e) {
                  console.error('Method 3 failed:', e);
                }
              }, 400);

              if (attempts >= maxAttempts) {
                statusEl.textContent = 'If the app does not open, please check that ANYON is installed.';
              }
            }

            window.onload = function() {
              setTimeout(() => {
                try {
                  window.location.href = "${deepLink}";
                } catch (e) {
                  console.log('Auto-redirect blocked, user needs to click button');
                }
              }, 500);
            };
          </script>
        </body>
      </html>
    `;
    res.send(html);
  } catch (error) {
    console.error('OAuth callback error:', error);
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

// Update subscription
app.post('/auth/subscription', authenticate, async (req, res) => {
  const { planType, status } = req.body;

  if (!['FREE', 'PRO'].includes(planType)) {
    return res.status(400).json({ error: 'Invalid plan type' });
  }

  if (!['ACTIVE', 'CANCELED', 'PAST_DUE'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const subscription = await userRepo.updateSubscription(req.user.id, {
      planType,
      status,
      currentPeriodEnd,
    });

    res.json({ subscription });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// Development endpoints - only available in development
app.post('/dev/create-user', async (req, res) => {
  if (isProduction) {
    return res.status(404).json({ error: 'Not found' });
  }

  const { email, name, planType = 'FREE' } = req.body;

  try {
    const user = await userRepo.createUser({
      googleId: null,
      email: email || `test-${Date.now()}@example.com`,
      name: name || 'Test User',
      profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Test User')}&background=6366f1&color=fff&size=150`,
      planType,
    });

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
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.get('/dev/users', async (req, res) => {
  if (isProduction) {
    return res.status(404).json({ error: 'Not found' });
  }

  // Note: This would need a new function in userRepository for production use
  res.json({ message: 'Dev endpoint - list users not implemented for DB' });
});

// Get user settings
app.get('/api/settings', authenticate, async (req, res) => {
  try {
    const settings = await settingsRepo.getSettings(req.user.id);
    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Save user settings (full replace)
app.post('/api/settings', authenticate, async (req, res) => {
  const { settings } = req.body;

  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Invalid settings object' });
  }

  try {
    await settingsRepo.saveSettings(req.user.id, settings);
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Save settings error:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Update specific setting
app.patch('/api/settings/:key', authenticate, async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  try {
    await settingsRepo.updateSetting(req.user.id, key, value);
    res.json({ success: true, key, value });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Delete specific setting
app.delete('/api/settings/:key', authenticate, async (req, res) => {
  const { key } = req.params;

  try {
    await settingsRepo.deleteSetting(req.user.id, key);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({ error: 'Failed to delete setting' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
  try {
    // Initialize database
    if (process.env.DATABASE_URL) {
      await initializeDatabase();
      console.log('Database initialized');
    } else {
      console.warn('DATABASE_URL not set - running without database');
    }

    app.listen(PORT, () => {
      console.log(`\nAuth Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${NODE_ENV}`);
      console.log(`Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? 'Configured' : 'Not configured'}`);
      console.log(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);

      if (!isProduction) {
        console.log(`\nDevelopment endpoints:`);
        console.log(`   POST /auth/dev/login - Dev auto-login`);
        console.log(`   POST /dev/create-user - Create test user`);
        console.log(`   GET  /dev/users - List all users`);
      }

      console.log(`\nAuth endpoints:`);
      console.log(`   GET  /auth/google/url - Get OAuth URL`);
      console.log(`   GET  /auth/me - Get current user`);
      console.log(`   GET  /auth/verify - Verify token`);
      console.log(`   POST /auth/subscription - Update subscription`);
      console.log(`\nSettings endpoints:`);
      console.log(`   GET    /api/settings - Get user settings`);
      console.log(`   POST   /api/settings - Save user settings`);
      console.log(`   PATCH  /api/settings/:key - Update specific setting`);
      console.log(`   DELETE /api/settings/:key - Delete specific setting\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
