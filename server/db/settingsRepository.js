import pool from './index.js';

export async function getSettings(userId) {
  const result = await pool.query(
    'SELECT settings FROM user_settings WHERE user_id = $1',
    [userId]
  );
  return result.rows[0]?.settings || {};
}

export async function saveSettings(userId, settings) {
  await pool.query(
    `INSERT INTO user_settings (user_id, settings)
     VALUES ($1, $2)
     ON CONFLICT (user_id)
     DO UPDATE SET settings = $2, updated_at = NOW()`,
    [userId, JSON.stringify(settings)]
  );
}

export async function updateSetting(userId, key, value) {
  // First ensure the user_settings row exists
  await pool.query(
    `INSERT INTO user_settings (user_id, settings)
     VALUES ($1, '{}')
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );

  // Then update the specific key
  await pool.query(
    `UPDATE user_settings
     SET settings = settings || $2::jsonb, updated_at = NOW()
     WHERE user_id = $1`,
    [userId, JSON.stringify({ [key]: value })]
  );
}

export async function deleteSetting(userId, key) {
  await pool.query(
    `UPDATE user_settings
     SET settings = settings - $2, updated_at = NOW()
     WHERE user_id = $1`,
    [userId, key]
  );
}
