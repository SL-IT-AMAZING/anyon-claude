import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendVerificationCode } from './utils/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testSMTP() {
  console.log('🧪 Testing SMTP configuration...\n');

  console.log('SMTP Settings:');
  console.log(`  Host: ${process.env.SMTP_HOST}`);
  console.log(`  Port: ${process.env.SMTP_PORT}`);
  console.log(`  User: ${process.env.SMTP_USER}`);
  console.log(`  Pass: ${process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET'}\n`);

  try {
    console.log('📧 Sending test verification email...');
    await sendVerificationCode(
      'cosmosjeon1108@gmail.com',
      '테스트 유저',
      '123456'
    );
    console.log('✅ Email sent successfully!');
    console.log('\n✅ SMTP 설정이 올바릅니다!');
    console.log('✅ 이메일이 cosmosjeon1108@gmail.com로 발송되었습니다.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    console.error('\n❌ SMTP 설정에 문제가 있습니다.');
    console.error('다음을 확인하세요:');
    console.error('1. Gmail 2단계 인증이 활성화되어 있는지');
    console.error('2. App Password가 올바른지 (16자리, 공백 없음)');
    console.error('3. SMTP_USER가 올바른 Gmail 주소인지');
    process.exit(1);
  }
}

testSMTP();
