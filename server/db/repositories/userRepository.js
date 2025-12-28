import { getDatabase } from '../index.js';

/**
 * User Repository - handles all user CRUD operations
 */
class UserRepository {
  constructor() {
    this.db = getDatabase();

    // Prepare statements for better performance
    this.statements = {
      create: this.db.prepare(`
        INSERT INTO users (id, email, name, profile_picture, google_id, password_hash, email_verified, plan_type, subscription_status, current_period_end)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),

      findById: this.db.prepare(`
        SELECT * FROM users WHERE id = ?
      `),

      findByEmail: this.db.prepare(`
        SELECT * FROM users WHERE email = ?
      `),

      findByGoogleId: this.db.prepare(`
        SELECT * FROM users WHERE google_id = ?
      `),

      update: this.db.prepare(`
        UPDATE users
        SET email = ?, name = ?, profile_picture = ?, google_id = ?, plan_type = ?, subscription_status = ?, current_period_end = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `),

      updateSubscription: this.db.prepare(`
        UPDATE users
        SET plan_type = ?, subscription_status = ?, current_period_end = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `),

      verifyEmail: this.db.prepare(`
        UPDATE users
        SET email_verified = 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `),

      updatePassword: this.db.prepare(`
        UPDATE users
        SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `),

      delete: this.db.prepare(`
        DELETE FROM users WHERE id = ?
      `),

      list: this.db.prepare(`
        SELECT * FROM users ORDER BY created_at DESC
      `),
    };
  }

  /**
   * Create a new user
   * @param {Object} user - User object
   * @returns {Object} Created user
   */
  create(user) {
    const { id, email, name, profilePicture, googleId, passwordHash, emailVerified, subscription } = user;

    this.statements.create.run(
      id,
      email,
      name,
      profilePicture || null,
      googleId || null,
      passwordHash || null,
      emailVerified ? 1 : 0,
      subscription.planType,
      subscription.status,
      subscription.currentPeriodEnd || null
    );

    return this.findById(id);
  }

  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Object|null} User object or null
   */
  findById(id) {
    const row = this.statements.findById.get(id);
    return row ? this._mapRowToUser(row) : null;
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Object|null} User object or null
   */
  findByEmail(email) {
    const row = this.statements.findByEmail.get(email);
    return row ? this._mapRowToUser(row) : null;
  }

  /**
   * Find user by Google ID
   * @param {string} googleId - Google OAuth ID
   * @returns {Object|null} User object or null
   */
  findByGoogleId(googleId) {
    const row = this.statements.findByGoogleId.get(googleId);
    return row ? this._mapRowToUser(row) : null;
  }

  /**
   * Update user
   * @param {string} id - User ID
   * @param {Object} user - Updated user data
   * @returns {Object|null} Updated user or null
   */
  update(id, user) {
    const { email, name, profilePicture, googleId, subscription } = user;

    this.statements.update.run(
      email,
      name,
      profilePicture || null,
      googleId || null,
      subscription.planType,
      subscription.status,
      subscription.currentPeriodEnd || null,
      id
    );

    return this.findById(id);
  }

  /**
   * Update user subscription
   * @param {string} id - User ID
   * @param {Object} subscription - Subscription data
   * @returns {Object|null} Updated user or null
   */
  updateSubscription(id, subscription) {
    const { planType, status, currentPeriodEnd } = subscription;

    this.statements.updateSubscription.run(
      planType,
      status,
      currentPeriodEnd || null,
      id
    );

    return this.findById(id);
  }

  /**
   * Verify user email
   * @param {string} id - User ID
   * @returns {Object|null} Updated user or null
   */
  verifyEmail(id) {
    this.statements.verifyEmail.run(id);
    return this.findById(id);
  }

  /**
   * Update user password
   * @param {string} id - User ID
   * @param {string} passwordHash - Bcrypt password hash
   * @returns {Object|null} Updated user or null
   */
  updatePassword(id, passwordHash) {
    this.statements.updatePassword.run(passwordHash, id);
    return this.findById(id);
  }

  /**
   * Delete user
   * @param {string} id - User ID
   * @returns {boolean} True if deleted, false otherwise
   */
  delete(id) {
    const result = this.statements.delete.run(id);
    return result.changes > 0;
  }

  /**
   * List all users
   * @returns {Array} Array of user objects
   */
  list() {
    const rows = this.statements.list.all();
    return rows.map(row => this._mapRowToUser(row));
  }

  /**
   * Map database row to user object
   * @private
   * @param {Object} row - Database row
   * @returns {Object} User object
   */
  _mapRowToUser(row) {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      profilePicture: row.profile_picture,
      googleId: row.google_id,
      passwordHash: row.password_hash,
      emailVerified: row.email_verified === 1,
      subscription: {
        planType: row.plan_type,
        status: row.subscription_status,
        currentPeriodEnd: row.current_period_end,
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default new UserRepository();
