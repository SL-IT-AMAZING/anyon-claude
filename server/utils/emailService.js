import nodemailer from 'nodemailer';

/**
 * Email Service - handles sending verification and password reset emails
 */

// Create reusable transporter
let transporter = null;

/**
 * Initialize email transporter with SMTP config
 */
function getTransporter() {
  if (transporter) {
    return transporter;
  }

  // Check if SMTP is configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP not configured. Email sending will fail.');
    console.warn('Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env file');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

/**
 * Send email verification code
 * @param {string} email - Recipient email
 * @param {string} name - User name
 * @param {string} code - 6-digit verification code
 */
export async function sendVerificationCode(email, name, code) {
  // DEV: Print code to console if SMTP not configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n========================================');
    console.log('📧 [DEV] 이메일 인증 코드');
    console.log(`받는 사람: ${email}`);
    console.log(`코드: ${code}`);
    console.log('========================================\n');
    return;
  }

  const transport = getTransporter();
  if (!transport) {
    throw new Error('SMTP not configured');
  }

  const mailOptions = {
    from: `"ANYON" <${process.env.SMTP_USER}>`,
    to: email,
    subject: '[ANYON] 이메일 인증 코드',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 30px 0; }
            .code-box { background: #f5f5f5; padding: 20px; margin: 30px 0; text-align: center; border-radius: 8px; }
            .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #d97757; font-family: 'Courier New', monospace; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ANYON 이메일 인증</h1>
            </div>

            <p>안녕하세요, ${name}님!</p>
            <p>ANYON 회원가입을 완료하려면 아래 인증 코드를 입력해주세요.</p>

            <div class="code-box">
              <div class="code">${code}</div>
            </div>

            <p><strong>인증 코드는 15분간 유효합니다.</strong></p>
            <p>본인이 요청하지 않은 경우, 이 이메일을 무시하셔도 됩니다.</p>

            <div class="footer">
              <p>© 2025 ANYON. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
안녕하세요, ${name}님!

ANYON 회원가입을 완료하려면 아래 인증 코드를 입력해주세요.

인증 코드: ${code}

이 코드는 15분간 유효합니다.
본인이 요청하지 않은 경우, 이 이메일을 무시하셔도 됩니다.

© 2025 ANYON. All rights reserved.
    `.trim(),
  };

  await transport.sendMail(mailOptions);
  console.log(`✅ Verification email sent to ${email}`);
}

/**
 * Send password reset code
 * @param {string} email - Recipient email
 * @param {string} name - User name
 * @param {string} code - 6-digit verification code
 */
export async function sendPasswordResetCode(email, name, code) {
  // DEV: Print code to console if SMTP not configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n========================================');
    console.log('🔐 [DEV] 비밀번호 재설정 코드');
    console.log(`받는 사람: ${email}`);
    console.log(`코드: ${code}`);
    console.log('========================================\n');
    return;
  }

  const transport = getTransporter();
  if (!transport) {
    throw new Error('SMTP not configured');
  }

  const mailOptions = {
    from: `"ANYON" <${process.env.SMTP_USER}>`,
    to: email,
    subject: '[ANYON] 비밀번호 재설정 코드',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 30px 0; }
            .code-box { background: #f5f5f5; padding: 20px; margin: 30px 0; text-align: center; border-radius: 8px; }
            .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #d97757; font-family: 'Courier New', monospace; }
            .warning { background: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #ffc107; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ANYON 비밀번호 재설정</h1>
            </div>

            <p>안녕하세요, ${name}님!</p>
            <p>비밀번호 재설정을 요청하셨습니다. 아래 인증 코드를 입력해주세요.</p>

            <div class="code-box">
              <div class="code">${code}</div>
            </div>

            <div class="warning">
              <strong>⚠️ 보안 주의</strong><br>
              본인이 요청하지 않은 경우, 누군가 귀하의 계정에 접근을 시도하고 있을 수 있습니다.<br>
              비밀번호를 변경하고 계정 보안을 강화하는 것을 권장합니다.
            </div>

            <p><strong>인증 코드는 1시간 동안 유효합니다.</strong></p>

            <div class="footer">
              <p>© 2025 ANYON. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
안녕하세요, ${name}님!

비밀번호 재설정을 요청하셨습니다. 아래 인증 코드를 입력해주세요.

인증 코드: ${code}

⚠️ 보안 주의
본인이 요청하지 않은 경우, 누군가 귀하의 계정에 접근을 시도하고 있을 수 있습니다.
비밀번호를 변경하고 계정 보안을 강화하는 것을 권장합니다.

이 코드는 1시간 동안 유효합니다.

© 2025 ANYON. All rights reserved.
    `.trim(),
  };

  await transport.sendMail(mailOptions);
  console.log(`✅ Password reset email sent to ${email}`);
}

/**
 * Verify email service is configured and working
 * @returns {Promise<boolean>} True if email service is working
 */
export async function verifyEmailService() {
  const transport = getTransporter();
  if (!transport) {
    return false;
  }

  try {
    await transport.verify();
    console.log('✅ Email service is ready');
    return true;
  } catch (error) {
    console.error('❌ Email service verification failed:', error.message);
    return false;
  }
}
