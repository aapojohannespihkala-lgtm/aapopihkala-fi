import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const worker = readFileSync(new URL('../../worker/privateWorkTest.ts', import.meta.url), 'utf8');
const registry = JSON.parse(readFileSync(new URL('../../.github/work-test-candidates.json', import.meta.url), 'utf8'));
const candidateId = 'c80-r34-iv125-cdb38108-both-sc894-sc895-work-test';
const expectedSha = 'cdb3810894993a89243f12367cfc58623aca6a9a1c58f8dae2639f2b16ed5e69';

test('IV125 scene894/895 is source-locked in the existing private Worker registry, not public assets', () => {
  assert.match(worker, new RegExp(`id: '${candidateId}'[\\s\\S]{0,550}expectedSize: 69_980_160,\\s*expectedSha256: '${expectedSha}',\\s*viewerReady: false`));
  assert.match(worker, /\\n  C80_R34_IV125_894_895_WORK_TEST_CANDIDATE,\\n/);
  assert.equal(registry.candidates[candidateId].driveFileId, '1jdjYirHYJkQeE2Gi5DP6wZvdE5VYSSHu');
});

test('unreceived scene/sourceLinks binding cannot expose IV125 through catalog or direct viewer path', () => {
  assert.match(worker, /const isPrivateWorkTestViewerReady = [^\\n]*viewerReady !== false/);
  assert.match(worker, /getPrivateWorkTestCandidate = [\\s\\S]{0,210}candidate\\.path === pathname && isPrivateWorkTestViewerReady\\(candidate\\)/);
  assert.match(worker, /for \\(const candidate of PRIVATE_WORK_TEST_RUNTIME_CANDIDATES\\) \\{\\n    if \\(!isPrivateWorkTestViewerReady\\(candidate\\)\\) continue;/);
  // Existing auth/SHA/metadata and machine readback gates remain in place.
  assert.match(worker, /object\\.size === candidate\\.expectedSize &&/);
  assert.match(worker, /object\\.customMetadata\\?\\.sha256\\?\\.trim\\(\\)\\.toLowerCase\\(\\) === candidate\\.expectedSha256/);
  assert.match(worker, /verifyPrivateModelReadbackAccess\\(request, env\\)/);
});
