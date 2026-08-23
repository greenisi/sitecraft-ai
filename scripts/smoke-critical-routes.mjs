const baseUrl = (process.env.SITECRAFT_SMOKE_URL || 'https://app.innovated.marketing').replace(/\/$/, '');

const checks = [
  { path: '/', statuses: [200] },
  { path: '/login', statuses: [200] },
  { path: '/signup', statuses: [200] },
  { path: '/forgot-password', statuses: [200] },
  { path: '/update-password', statuses: [200] },
  { path: '/dashboard', statuses: [301, 302, 303, 307, 308, 401] },
  { path: '/projects/new', statuses: [301, 302, 303, 307, 308, 401] },
  { path: '/cards', statuses: [301, 302, 303, 307, 308, 401] },
  { path: '/academy', statuses: [301, 302, 303, 307, 308, 401] },
  { path: '/settings', statuses: [301, 302, 303, 307, 308, 401] },
  { path: '/api/cards', statuses: [401] },
  { path: '/api/generate/status?projectId=smoke-test', statuses: [401] },
  { path: '/api/stripe/connect/status', statuses: [401] },
];

const failures = [];

for (const check of checks) {
  try {
    const response = await fetch(`${baseUrl}${check.path}`, {
      redirect: 'manual',
      signal: AbortSignal.timeout(15_000),
      headers: { 'user-agent': 'Sitecraft-Reliability-Smoke/1.0' },
    });
    const body = await response.text();
    const knownRuntimeFailure = /Internal Server Error|Application error|Preview Error|FUNCTION_INVOCATION_FAILED/i.test(body);
    const passed = check.statuses.includes(response.status) && !knownRuntimeFailure;
    console.log(`${passed ? 'PASS' : 'FAIL'} ${response.status} ${check.path}`);
    if (!passed) failures.push(`${check.path}: received ${response.status}`);
  } catch (error) {
    failures.push(`${check.path}: ${error instanceof Error ? error.message : String(error)}`);
    console.log(`FAIL network ${check.path}`);
  }
}

if (failures.length > 0) {
  console.error(`\n${failures.length} critical smoke check(s) failed:`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`\nAll ${checks.length} critical production routes passed.`);
