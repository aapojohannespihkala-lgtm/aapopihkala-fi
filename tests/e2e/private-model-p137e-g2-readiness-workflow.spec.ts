import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const workflow = readFileSync('.github/workflows/private-model-production-review-smoke.yml', 'utf8');
const job = workflow.split('  verify-g2-readiness:\n')[1];
const capture = job?.match(/          node --input-type=module <<'NODE'\n([\s\S]*?)\n          NODE/);
if (!capture) throw new Error('Exact checked-in G2 readiness Node job is missing');
const code = capture[1].split('\n').map(line => line.slice(10)).join('\n');
const ids = [
  'D1F_USER_CURRENT_DOOR_A', 'D1F_USER_CURRENT_DOOR_B',
  'D_THEMO_CURRENT_BATHROOM_01', 'D_THEMO_CURRENT_BEDROOM_01',
  'D_THEMO_CURRENT_LOBBY_01',
];
const target = (targetId: string) => ({
  targetId, apartment: 'D', floor: '1F', coordinateFrame: 'YLIS-G1-LOCAL',
  approvedWallHosts: [], exactXY: false, currentGeometry: false,
  canonical: false, asBuilt: false,
});

// Execute the exact checked-in Node body and the existing real G2 client.
// The controlled HTTP fixture is deliberately NOT production-G2 proof.
function runReadiness(scenario: string) {
  const response = {
    status: 'WORK_TEST_TARGETS_ONLY', documentRevision: 'private-fixture-revision',
    targets: ids.map(target),
  };
  if (scenario === 'missing-target') response.targets.pop();
  if (scenario === 'promotion') response.targets[0].currentGeometry = true;
  const errors: Record<string, { status: number; code: string }> = {
    'oauth-failed': { status: 503, code: 'G2_OAUTH_TOKEN_FAILED' },
    'signing-failed': { status: 503, code: 'G2_OAUTH_SIGNING_FAILED' },
    'docs-failed': { status: 503, code: 'G2_NATIVE_READ_FAILED' },
    'document-invalid': { status: 409, code: 'G2_NATIVE_DOCUMENT_INVALID' },
    'source-not-ready': { status: 409, code: 'G2_CURRENT_SOURCE_NOT_READY' },
    'unknown-private-code': { status: 503, code: 'private-fixture-secret-must-not-leak' },
    'hidden-private-code': { status: 404, code: 'G2_OAUTH_TOKEN_FAILED' },
  };
  const error = errors[scenario];
  const fixture = JSON.stringify(error ? {
    error: 'g2-unavailable', failureCode: error.code,
    privateDetail: 'private-fixture-secret-must-not-leak',
  } : response);
  let body = code.replace(
    "import { mkdirSync, writeFileSync } from 'node:fs';",
    "let saved; const mkdirSync = () => {}; const writeFileSync = (path, value) => { saved = JSON.parse(value); };",
  );
  if (scenario === 'wrong-method') {
    body = body.replace(
      "import { createP137EG2WorkerClient } from './src/scripts/privateModelP137EG2WorkerClient.mjs';",
      "const createP137EG2WorkerClient = ({fetcher}) => ({targets: () => fetcher('https://aapopihkala.fi/private-model/review-placement/g2/targets', {method: 'POST', body: '{}'})});",
    );
  }
  const script = `
    let fetchCalls = 0, requestCorrect = false;
    globalThis.fetch = async (url, options) => {
      fetchCalls++;
      requestCorrect = url === 'https://aapopihkala.fi/private-model/review-placement/g2/targets' &&
        options.method === 'GET' && options.body === undefined &&
        options.redirect === 'error' && options.signal instanceof AbortSignal &&
        options.headers['CF-Access-Client-Id'] === 'fixture-id' &&
        options.headers['CF-Access-Client-Secret'] === 'fixture-private-secret';
      return new Response(${JSON.stringify(fixture)}, {
        status: ${error?.status ?? (scenario === 'hidden-404' ? 404 : 200)},
        headers: {'content-type': 'application/json'},
      });
    };
    ${body}
    console.log(JSON.stringify({fetchCalls, requestCorrect, saved}));
  `;
  const result = spawnSync(process.execPath, ['--input-type=module', '-'], {
    cwd: process.cwd(), input: script, encoding: 'utf8', timeout: 20_000,
    env: {...process.env,
      CF_ACCESS_VIEWER_PROBE_CLIENT_ID: 'fixture-id',
      CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET: scenario === 'missing-credential' ? '' : 'fixture-private-secret',
    },
  });
  if (result.error) throw result.error;
  if (result.stderr) throw new Error(result.stderr);
  const lines = result.stdout.trim().split('\n');
  return {
    exitCode: result.status,
    evidence: JSON.parse(lines[0]),
    execution: JSON.parse(lines[1]),
    output: result.stdout,
  };
}

for (const [scenario, failureCode] of [
  ['oauth-failed', 'G2_OAUTH_TOKEN_FAILED'],
  ['signing-failed', 'G2_OAUTH_SIGNING_FAILED'],
  ['docs-failed', 'G2_NATIVE_READ_FAILED'],
  ['document-invalid', 'G2_NATIVE_DOCUMENT_INVALID'],
  ['source-not-ready', 'G2_CURRENT_SOURCE_NOT_READY'],
]) {
  test('readiness artifact preserves only the fixed failure code for ' + scenario, () => {
    const result = runReadiness(scenario);
    expect(result.exitCode).toBe(1);
    expect(result.evidence.failure).toBe('P137E_G2_UNAVAILABLE');
    expect(result.evidence.failureCode).toBe(failureCode);
    expect(result.execution.fetchCalls).toBe(1);
    expect(result.evidence.nativeG2WriteVerified).toBe(false);
    expect(result.output).not.toContain('private-fixture-secret-must-not-leak');
    expect(result.output).not.toContain('fixture-private-secret');
  });
}

for (const scenario of ['unknown-private-code', 'hidden-private-code']) {
  test('readiness never publishes untrusted or hidden failure diagnostics: ' + scenario, () => {
    const result = runReadiness(scenario);
    expect(result.exitCode).toBe(1);
    expect(result.evidence.failure).toBe('P137E_G2_UNAVAILABLE');
    expect(result.evidence.failureCode).toBeUndefined();
    expect(result.output).not.toContain('private-fixture-secret-must-not-leak');
    expect(result.output).not.toContain('G2_OAUTH_TOKEN_FAILED');
  });
}

test('main-only G2 GET job is separate from original full-render and PR secrets', () => {
  expect(workflow).toContain('default: full-render');
  expect(job).toContain("github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main' && inputs.probe_mode == 'g2-readiness'");
  const productionIf = workflow.split('  verify-production:\n')[1].split('\n')[0];
  expect(productionIf).toContain("(inputs.probe_mode == 'full-render' || inputs.probe_mode == 'r1125-render')");
  expect(productionIf).not.toContain("inputs.probe_mode == 'g2-readiness'");
  const prSection = workflow.split('  contract-regression:\n')[1].split('  verify-production:\n')[0];
  expect(prSection).not.toMatch(/CF_ACCESS_VIEWER_PROBE_CLIENT_(?:ID|SECRET):/);
  expect(job).not.toContain('batchUpdate');
  expect(job).not.toContain("client.persist(");
});

test('exact Node job and existing targets client verify all five native identities with one GET', () => {
  const result = runReadiness('ready');
  expect(result.exitCode).toBe(0);
  expect(result.execution.fetchCalls).toBe(1);
  expect(result.execution.requestCorrect).toBe(true);
  expect(result.execution.saved).toEqual(result.evidence);
  expect(result.evidence).toMatchObject({
    readyForSaveVerification: true, authenticatedTargetsReadVerified: true,
    targetCount: 5, httpStatus: 200, nativeG2WriteVerified: false,
    independentObservationGetVerified: false, humanReview: 'NOT_RUN',
    publishToCURRENT: false,
  });
  expect(result.output).not.toContain('fixture-private-secret');
  expect(result.output).not.toContain('private-fixture-revision');
  expect(result.output).not.toContain('approvedWallHosts');
});

for (const [scenario, failure] of [
  ['hidden-404', 'P137E_G2_UNAVAILABLE'],
  ['missing-target', 'NATIVE_TARGET_SET_MISMATCH'],
  ['promotion', 'P137E_G2_TARGET_EVIDENCE_INVALID'],
  ['missing-credential', 'PROBE_CREDENTIALS_MISSING'],
  ['wrong-method', 'READINESS_GET_ONLY'],
]) {
  test('exact G2 readiness job rejects ' + scenario + ' without a write or promotion', () => {
    const result = runReadiness(scenario);
    expect(result.exitCode).toBe(1);
    expect(result.evidence).toMatchObject({
      failure, readyForSaveVerification: false,
      authenticatedTargetsReadVerified: false, nativeG2WriteVerified: false,
      independentObservationGetVerified: false, humanReview: 'NOT_RUN',
      publishToCURRENT: false,
    });
    expect(result.execution.fetchCalls).toBe(
      scenario === 'missing-credential' || scenario === 'wrong-method' ? 0 : 1,
    );
    expect(result.output).not.toContain('fixture-private-secret');
    expect(result.output).not.toContain('private-fixture-revision');
  });
}
