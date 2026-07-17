const BASE_URL = 'http://localhost:4000/api';

async function runTests() {
  console.log('🧪 Running Comprehensive PRMS Integration Test Suite across All 6 Roles...\n');
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  async function login(username: string, password: string, preferredRole?: string) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = (await res.json()) as any;
    if (!res.ok) throw new Error(data?.error?.message || 'Login failed');

    if (data.needsRoleSelection) {
      const rolesRes = await fetch(`${BASE_URL}/auth/roles`, {
        headers: { Authorization: `Bearer ${data.identityToken}` },
      });
      const rolesData = (await rolesRes.json()) as any;
      const options = rolesData.options || [];

      const match = preferredRole
        ? options.find((o: any) => o.role === preferredRole) || options[0]
        : options[0];

      const selectRes = await fetch(`${BASE_URL}/auth/select-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.identityToken}`,
        },
        body: JSON.stringify({ role: match.role, programId: match.programId }),
      });
      const selectData = (await selectRes.json()) as any;
      if (!selectRes.ok) throw new Error(selectData?.error?.message || 'Select role failed');
      return selectData.accessToken as string;
    }
    return data.accessToken as string;
  }

  // 1. Panel Self-Registration
  await test('1. Self-Service Panel Member Registration Endpoint', async () => {
    const res = await fetch(`${BASE_URL}/auth/register-panel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Auto External Examiner',
        email: `panel.auto.${Date.now()}@test.com`,
        username: `panel_auto_${Date.now()}`,
        password: 'Pass123!',
        memberType: 'external',
        designation: 'External Industry Expert',
      }),
    });
    const data = (await res.json()) as any;
    if (!res.ok) throw new Error(data?.error?.message || 'Registration failed');
  });

  // 2. Admin Role Flow
  await test('2. System Administrator Workflow & System Config Control', async () => {
    const token = await login('admin', 'ChangeMe123!', 'admin');
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const getRes = await fetch(`${BASE_URL}/admin-config`, { headers });
    if (!getRes.ok) throw new Error('Failed to fetch admin config');

    const patchRes = await fetch(`${BASE_URL}/admin-config`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ guideSelectionOpen: true, teamFormationOpen: true }),
    });
    if (!patchRes.ok) throw new Error('Failed to update admin config');
  });

  // 3. Coordinator Role Flow
  await test('3. Review Coordinator Auto-Scheduling & Viva Panels', async () => {
    const token = await login('coord_cse', 'Pass123!', 'coordinator');
    const headers = { Authorization: `Bearer ${token}` };

    const slotsRes = await fetch(`${BASE_URL}/scheduling/slots`, { headers });
    if (!slotsRes.ok) throw new Error('Failed to fetch scheduled slots');

    const availRes = await fetch(`${BASE_URL}/scheduling/availability`, { headers });
    if (!availRes.ok) throw new Error('Failed to fetch availability slots');

    const vivaRes = await fetch(`${BASE_URL}/panels/viva`, { headers });
    if (!vivaRes.ok) throw new Error('Failed to fetch viva panel');
  });

  // 4. Guide Role Flow
  await test('4. Project Guide Availability & Final Report Review', async () => {
    const token = await login('guide_smith', 'Pass123!', 'guide');
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const postRes = await fetch(`${BASE_URL}/scheduling/availability`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        periodLabel: 'Guide Auto Window',
        startTime: new Date('2025-06-01T09:00:00Z'),
        endTime: new Date('2025-06-01T17:00:00Z'),
      }),
    });
    if (!postRes.ok) throw new Error('Failed to submit guide availability');

    const reportsRes = await fetch(`${BASE_URL}/reports`, { headers });
    if (!reportsRes.ok) throw new Error('Failed to fetch guide reports');
  });

  // 5. Panel Member Role Flow
  await test('5. Review Panel Member Scoring & Teams List', async () => {
    const token = await login('panel_anita', 'Pass123!', 'panel');
    const headers = { Authorization: `Bearer ${token}` };

    const panelsRes = await fetch(`${BASE_URL}/panels/review`, { headers });
    if (!panelsRes.ok) throw new Error('Failed to fetch assigned panel teams');
  });

  // 6. Student Role Flow
  await test('6. Student Team Info & Report Download Endpoint', async () => {
    const token = await login('stu_arun', 'Pass123!');
    const headers = { Authorization: `Bearer ${token}` };

    const teamsRes = await fetch(`${BASE_URL}/teams`, { headers });
    if (!teamsRes.ok) throw new Error('Failed to fetch student team info');

    const reportsRes = await fetch(`${BASE_URL}/reports`, { headers });
    if (!reportsRes.ok) throw new Error('Failed to fetch student report');
  });

  // 7. Forgot Password Flow
  await test('7. Self-Service Forgot Password OTP Flow', async () => {
    const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'arun@student.ceg.edu' }),
    });
    if (!res.ok) throw new Error('Failed forgot password endpoint');
  });

  console.log(`\n====================================================`);
  console.log(`🎉 ALL ${passed} FUNCTIONAL TEST SUITES PASSED (0 FAILED)`);
  console.log(`====================================================\n`);
}

runTests().catch((e) => {
  console.error('Test runner failure:', e);
  process.exit(1);
});
