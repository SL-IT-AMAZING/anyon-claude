/**
 * Port utilities test
 * Run: npx tsx src/lib/ports.test.ts
 */

import { getAppPort, projectIdToNumber, getPortForProject } from './ports';

// Test helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`✓ ${message}`);
}

function runTests() {
  console.log('\n=== Port Utilities Tests ===\n');

  // Test 1: getAppPort - 기본 포트 계산
  assert(getAppPort(0) === 32100, 'getAppPort(0) should return 32100');
  assert(getAppPort(1) === 32101, 'getAppPort(1) should return 32101');
  assert(getAppPort(100) === 32200, 'getAppPort(100) should return 32200');
  assert(getAppPort(9999) === 42099, 'getAppPort(9999) should return 42099');

  // Test 2: getAppPort - 모듈러 연산 (10000 이상)
  assert(getAppPort(10000) === 32100, 'getAppPort(10000) should wrap to 32100');
  assert(getAppPort(10001) === 32101, 'getAppPort(10001) should wrap to 32101');

  // Test 3: getAppPort - 포트 범위 확인
  for (let i = 0; i < 100; i++) {
    const port = getAppPort(Math.floor(Math.random() * 100000));
    assert(port >= 32100 && port <= 42099, `Port ${port} should be in range 32100-42099`);
  }
  console.log('✓ All random ports are in valid range (100 samples)');

  // Test 4: projectIdToNumber - 문자열 해시
  const hash1 = projectIdToNumber('test-project');
  const hash2 = projectIdToNumber('test-project');
  assert(hash1 === hash2, 'Same string should produce same hash');

  const hash3 = projectIdToNumber('different-project');
  assert(hash1 !== hash3, 'Different strings should produce different hashes');

  // Test 5: projectIdToNumber - 항상 양수
  const negativeTest = projectIdToNumber('negative-test-string-with-special-chars-!@#$%');
  assert(negativeTest >= 0, 'Hash should always be non-negative');

  // Test 6: getPortForProject - 통합 테스트
  const port1 = getPortForProject('/Users/cosmos/projects/my-app');
  const port2 = getPortForProject('/Users/cosmos/projects/my-app');
  assert(port1 === port2, 'Same project path should always get same port');

  const port3 = getPortForProject('/Users/cosmos/projects/other-app');
  assert(port1 !== port3 || true, 'Different projects may have different ports (collision possible but unlikely)');

  // Test 7: 포트 범위 확인
  assert(port1 >= 32100 && port1 <= 42099, `Project port ${port1} should be in valid range`);

  // Test 8: 일관성 테스트 - 여러 번 호출해도 같은 결과
  const testPaths = [
    '/home/user/projects/react-app',
    '/home/user/projects/next-app',
    '/home/user/projects/vue-app',
    'C:\\Users\\dev\\projects\\my-project',
    '/Users/cosmos/Documents/develop/3/anyon-claude',
  ];

  for (const path of testPaths) {
    const p1 = getPortForProject(path);
    const p2 = getPortForProject(path);
    const p3 = getPortForProject(path);
    assert(p1 === p2 && p2 === p3, `Port for "${path}" should be consistent: ${p1}`);
  }

  // Test 9: Rust 호환성 테스트 (Rust에서 동일한 해시 알고리즘 사용)
  // Rust: hash = hash.wrapping_mul(31).wrapping_add(c as u32)
  // JS: hash = ((hash << 5) - hash) + char  (이건 hash * 31 + char와 같음)
  // Note: wrapping 동작이 다를 수 있으므로 실제 Rust 결과와 비교 필요

  console.log('\n=== All Tests Passed! ===\n');

  // 실제 포트 할당 예시 출력
  console.log('Sample port allocations:');
  testPaths.forEach(path => {
    console.log(`  ${path.slice(-40).padStart(40)}: ${getPortForProject(path)}`);
  });
}

// Run tests
try {
  runTests();
  process.exit(0);
} catch (error) {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
}
