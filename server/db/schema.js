/**
 * Database schema definitions
 */

export const SCHEMA = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      profile_picture TEXT,
      google_id TEXT UNIQUE,
      password_hash TEXT,
      email_verified INTEGER DEFAULT 0,
      plan_type TEXT DEFAULT 'FREE' CHECK(plan_type IN ('FREE', 'PRO')),
      subscription_status TEXT DEFAULT 'ACTIVE' CHECK(subscription_status IN ('ACTIVE', 'CANCELED', 'PAST_DUE')),
      current_period_end TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `,

  userSettings: `
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, key),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `,

  authCodes: `
    CREATE TABLE IF NOT EXISTS auth_codes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      code_type TEXT NOT NULL CHECK(code_type IN ('EMAIL_VERIFY', 'PASSWORD_RESET')),
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `,

  // Indexes for better query performance
  indexes: [
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)',
    'CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_auth_codes_user_id ON auth_codes(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_auth_codes_code ON auth_codes(code)',
  ],
};

/**
 * Initialize database schema
 * @param {Database} db - SQLite database instance
 */
export function initializeSchema(db) {
  // Create tables
  db.exec(SCHEMA.users);
  db.exec(SCHEMA.userSettings);
  db.exec(SCHEMA.authCodes);

  // Migrate existing users table to add new columns if needed
  try {
    // Check if password_hash column exists
    const columns = db.prepare("PRAGMA table_info(users)").all();
    const hasPasswordHash = columns.some(col => col.name === 'password_hash');
    const hasEmailVerified = columns.some(col => col.name === 'email_verified');

    if (!hasPasswordHash) {
      db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT');
      console.log('✅ Added password_hash column to users table');
    }

    if (!hasEmailVerified) {
      db.exec('ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0');
      console.log('✅ Added email_verified column to users table');
    }
  } catch (error) {
    console.error('Migration error:', error);
  }

  // Create indexes
  SCHEMA.indexes.forEach(indexSql => {
    db.exec(indexSql);
  });
}
