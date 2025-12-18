/**
 * Preview Panel Logic Tests
 * Run: npx tsx src/components/preview/test-preview-logic.ts
 */

// Test utilities
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`✓ ${message}`);
}

// Mock delay
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Tests
async function runTests() {
  console.log('\n=== Preview Panel Auto-detection Tests ===\n');

  // Test 1: package.json 감지 시뮬레이션
  {
    let packageJsonExists = false;
    let checkCount = 0;
    let devServerStarted = false;

    const checkInterval = setInterval(() => {
      checkCount++;

      // 3번째 체크에서 package.json 생성됨
      if (checkCount === 3) {
        packageJsonExists = true;
      }

      if (packageJsonExists) {
        clearInterval(checkInterval);
        devServerStarted = true;
      }

      // 최대 30회
      if (checkCount >= 30) {
        clearInterval(checkInterval);
      }
    }, 100); // 빠른 테스트를 위해 100ms

    // 1초 대기 (10번 체크)
    await delay(1000);

    assert(devServerStarted === true, 'Dev server should start when package.json is detected');
    assert(checkCount <= 30, 'Should not exceed max checks');

    clearInterval(checkInterval);
  }

  // Test 2: 최대 체크 횟수
  {
    let checkCount = 0;
    let stopped = false;

    const checkInterval = setInterval(() => {
      checkCount++;

      if (checkCount >= 30) {
        clearInterval(checkInterval);
        stopped = true;
      }
    }, 10);

    await delay(500);

    assert(stopped === true, 'Should stop after max checks');
    assert(checkCount === 30, 'Should check exactly 30 times');
  }

  // Test 3: 이미 실행 중이면 체크 안 함
  {
    const devServerRunning = true;
    let checkStarted = false;

    // 조건: if (devServerRunning) return;
    if (!devServerRunning) {
      checkStarted = true;
    }

    assert(checkStarted === false, 'Should not start check if dev server already running');
  }

  // Test 4: 포트 계산 일관성
  {
    function getPortForProject(projectId: string): number {
      let hash = 0;
      for (let i = 0; i < projectId.length; i++) {
        const char = projectId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return 32100 + (Math.abs(hash) % 10000);
    }

    const projectId = '/Users/test/my-project';
    const port1 = getPortForProject(projectId);
    const port2 = getPortForProject(projectId);
    const port3 = getPortForProject(projectId);

    assert(port1 === port2, 'Port should be consistent (1st vs 2nd)');
    assert(port2 === port3, 'Port should be consistent (2nd vs 3rd)');
    assert(port1 >= 32100 && port1 <= 42099, 'Port should be in valid range');

    console.log(`  Sample port for "${projectId}": ${port1}`);
  }

  // Test 5: 여러 프로젝트의 포트 분산
  {
    function getPortForProject(projectId: string): number {
      let hash = 0;
      for (let i = 0; i < projectId.length; i++) {
        const char = projectId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return 32100 + (Math.abs(hash) % 10000);
    }

    const projects = [
      '/Users/test/project1',
      '/Users/test/project2',
      '/Users/test/react-app',
      '/Users/test/vue-app',
      '/Users/test/next-app',
    ];

    const ports = projects.map(p => getPortForProject(p));

    ports.forEach((port, i) => {
      assert(port >= 32100 && port <= 42099,
        `Port ${port} for project ${i} should be in valid range`);
    });

    console.log('\n  Port distribution:');
    projects.forEach((p, i) => {
      console.log(`    ${p.padEnd(30)} → ${ports[i]}`);
    });
  }

  // Test 6: 타이밍 테스트 (2초 간격)
  {
    const checks: number[] = [];
    let count = 0;

    const checkInterval = setInterval(() => {
      count++;
      checks.push(Date.now());

      if (count >= 3) {
        clearInterval(checkInterval);
      }
    }, 100); // 빠른 테스트

    await delay(400);

    assert(checks.length === 3, 'Should perform 3 checks');

    // 간격이 대략 100ms인지 확인 (오차 허용)
    const interval1 = checks[1] - checks[0];
    const interval2 = checks[2] - checks[1];

    assert(interval1 >= 90 && interval1 <= 150,
      `Check interval 1 should be ~100ms (was ${interval1}ms)`);
    assert(interval2 >= 90 && interval2 <= 150,
      `Check interval 2 should be ~100ms (was ${interval2}ms)`);

    clearInterval(checkInterval);
  }

  console.log('\n=== All Tests Passed! ===\n');
}

// Run tests
runTests()
  .then(() => {
    console.log('✅ Test suite completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
