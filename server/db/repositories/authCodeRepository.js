import { getDatabase } from '../index.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * AuthCode Repository - handles authentication code operations
 */
class AuthCodeRepository {
  constructor() {
    this.db = getDatabase();

    // Prepare statements for better performance
    this.statements = {
      create: this.db.prepare(`
        INSERT INTO auth_codes (id, user_id, code_type, code, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `),

      findByCode: this.db.prepare(`
        SELECT * FROM auth_codes
        WHERE code = ? AND code_type = ?
      `),

      findByUserId: this.db.prepare(`
        SELECT * FROM auth_codes
        WHERE user_id = ? AND code_type = ?
        ORDER BY created_at DESC
        LIMIT 1
      `),

      incrementAttempts: this.db.prepare(`
        UPDATE auth_codes
        SET attempts = attempts + 1
        WHERE id = ?
      `),

      deleteCode: this.db.prepare(`
        DELETE FROM auth_codes WHERE id = ?
      `),

      deleteUserCodes: this.db.prepare(`
        DELETE FROM auth_codes WHERE user_id = ? AND code_type = ?
      `),

      cleanupExpired: this.db.prepare(`
        DELETE FROM auth_codes WHERE expires_at < CURRENT_TIMESTAMP
      `),
    };
  }

  /**
   * Create new authentication code
   * @param {string} userId
   * @param {string} codeType - 'EMAIL_VERIFY' or 'PASSWORD_RESET'
   * @param {string} code - 6-digit code
   * @param {string} expiresAt - ISO timestamp
   * @returns {object} Created code
   */
  createCode(userId, codeType, code, expiresAt) {
    const id = uuidv4();
    this.statements.create.run(id, userId, codeType, code, expiresAt);
    return { id, userId, codeType, code, expiresAt, attempts: 0 };
  }

  /**
   * Find authentication code by code and type
   * @param {string} code - 6-digit code
   * @param {string} codeType - 'EMAIL_VERIFY' or 'PASSWORD_RESET'
   * @returns {object|null}
   */
  findByCode(code, codeType) {
    return this.statements.findByCode.get(code, codeType);
  }

  /**
   * Find latest code for user by type
   * @param {string} userId
   * @param {string} codeType
   * @returns {object|null}
   */
  findByUserId(userId, codeType) {
    return this.statements.findByUserId.get(userId, codeType);
  }

  /**
   * Increment code verification attempts
   * @param {string} codeId
   */
  incrementAttempts(codeId) {
    this.statements.incrementAttempts.run(codeId);
  }

  /**
   * Delete specific authentication code
   * @param {string} codeId
   */
  deleteCode(codeId) {
    this.statements.deleteCode.run(codeId);
  }

  /**
   * Delete all codes for user of specific type
   * @param {string} userId
   * @param {string} codeType
   */
  deleteUserCodes(userId, codeType) {
    this.statements.deleteUserCodes.run(userId, codeType);
  }

  /**
   * Clean up expired authentication codes
   * @returns {number} Number of deleted codes
   */
  cleanupExpired() {
    const result = this.statements.cleanupExpired.run();
    return result.changes;
  }
}

// Singleton instance
const authCodeRepository = new AuthCodeRepository();
export default authCodeRepository;
