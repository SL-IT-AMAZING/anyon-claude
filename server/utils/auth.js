import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Bcrypt salt rounds (higher = more secure but slower)
const SALT_ROUNDS = 12;

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Password hash
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify password against hash
 * @param {string} password - Plain text password
 * @param {string} hash - Password hash
 * @returns {Promise<boolean>} True if password matches
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate 6-digit verification code
 * @returns {string} 6-digit code (000000-999999)
 */
export function generateVerificationCode() {
  // Generate random 6-digit number
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
}

/**
 * Validate password strength
 * @param {string} password
 * @returns {object} { valid: boolean, errors: string[] }
 */
export function validatePassword(password) {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push('비밀번호는 최소 8자 이상이어야 합니다');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('비밀번호는 최소 1개의 소문자를 포함해야 합니다');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('비밀번호는 최소 1개의 대문자를 포함해야 합니다');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('비밀번호는 최소 1개의 숫자를 포함해야 합니다');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean} True if valid email format
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate expiration timestamp
 * @param {number} minutes - Minutes from now
 * @returns {string} ISO timestamp
 */
export function getExpirationTime(minutes) {
  const expiration = new Date();
  expiration.setMinutes(expiration.getMinutes() + minutes);
  return expiration.toISOString();
}

/**
 * Check if timestamp is expired
 * @param {string} expiresAt - ISO timestamp
 * @returns {boolean} True if expired
 */
export function isExpired(expiresAt) {
  return new Date(expiresAt) < new Date();
}
