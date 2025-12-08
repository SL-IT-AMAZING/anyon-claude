import pool from './index.js';

export async function findUserByEmail(email) {
  const result = await pool.query(
    `SELECT u.*, s.plan_type, s.status, s.current_period_end
     FROM users u
     LEFT JOIN subscriptions s ON u.id = s.user_id
     WHERE u.email = $1`,
    [email]
  );
  return formatUser(result.rows[0]);
}

export async function findUserById(id) {
  const result = await pool.query(
    `SELECT u.*, s.plan_type, s.status, s.current_period_end
     FROM users u
     LEFT JOIN subscriptions s ON u.id = s.user_id
     WHERE u.id = $1`,
    [id]
  );
  return formatUser(result.rows[0]);
}

export async function createUser({ googleId, email, name, profilePicture, planType = 'FREE' }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      `INSERT INTO users (google_id, email, name, profile_picture)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [googleId, email, name, profilePicture]
    );
    const user = userResult.rows[0];

    await client.query(
      `INSERT INTO subscriptions (user_id, plan_type, status)
       VALUES ($1, $2, 'ACTIVE')`,
      [user.id, planType]
    );

    await client.query('COMMIT');

    return {
      id: user.id,
      googleId: user.google_id,
      email: user.email,
      name: user.name,
      profilePicture: user.profile_picture,
      subscription: {
        planType: planType,
        status: 'ACTIVE',
      },
    };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function updateSubscription(userId, { planType, status, currentPeriodEnd }) {
  const result = await pool.query(
    `UPDATE subscriptions
     SET plan_type = $2, status = $3, current_period_end = $4, updated_at = NOW()
     WHERE user_id = $1
     RETURNING *`,
    [userId, planType, status, currentPeriodEnd]
  );

  if (result.rows[0]) {
    return {
      planType: result.rows[0].plan_type,
      status: result.rows[0].status,
      currentPeriodEnd: result.rows[0].current_period_end?.toISOString(),
    };
  }
  return null;
}

// Helper function to format user object
function formatUser(row) {
  if (!row) return null;

  return {
    id: row.id,
    googleId: row.google_id,
    email: row.email,
    name: row.name,
    profilePicture: row.profile_picture,
    subscription: {
      planType: row.plan_type || 'FREE',
      status: row.status || 'ACTIVE',
      currentPeriodEnd: row.current_period_end?.toISOString(),
    },
  };
}
