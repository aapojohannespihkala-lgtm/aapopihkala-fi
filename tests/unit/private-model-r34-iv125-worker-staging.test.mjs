import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const worker = readFileSync(new URL('../../worker/privateWorkTest.ts', import.meta.url), 'utf8');
const registry = JSON.parse(readFileSync(new URL('../../.github/work-test-candidates.json', import.meta.url), 'utf8'));
const candidateId = 'c80-r34-iv125-cdb38108-both-sc894-sc895-work-test';
const expectedSha = 'cdb3810894993a89243f12367cfc58623aca6a9a1c58f8dae2639f2b16ed5e69';

test('IV125 scene894/895 is pinned in the protected Worker candidate registry', () => {
  const at = worker.indexOf("id: '" + candidateId + "'");
  assert.ok(at > 0, 'missing scene894/895 runtime candidate');
  const definition = worker.slice(at, at + 550);
  assert.ok(definition.includes('expectedSize: 69_980_160,'), 'wrong GLB byte length');
  assert.ok(definition.includes("expectedSha256: '" + expectedSha + "'"), 'wrong GLB SHA');
  assert.ok(definition.includes('viewerReady: false,'), 'unsafe initial catalog visibility');
  assert.ok(worker.includes('  C80_R34_IV125_894_895_WORK_TEST_CANDIDATE,\n'));
  assert.equal(registry.candidates[candidateId].driveFileId, '1jdjYirHYJkQeE2Gi5DP6wZvdE5VYSSHu');
});

test('unreceived scene and sourceLinks cannot leak through catalog or direct viewer path', () => {
  assert.ok(worker.includes('candidate.viewerReady !== false'), 'missing fail-closed readiness gate');
  assert.ok(worker.includes('candidate.path === pathname && isPrivateWorkTestViewerReady(candidate)'), 'viewer path not gated');
  assert.ok(worker.includes('if (!isPrivateWorkTestViewerReady(candidate)) continue;'), 'catalog not gated');
  assert.ok(worker.includes('object.size === candidate.expectedSize'), 'size guard removed');
  assert.ok(worker.includes('object.customMetadata?.sha256?.trim().toLowerCase() === candidate.expectedSha256'), 'metadata SHA guard removed');
  assert.ok(worker.includes('verifyPrivateModelReadbackAccess(request, env)'), 'readback authentication removed');
});
