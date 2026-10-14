import { test, expect } from '@playwright/test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const workflowPath = '.github/workflows/build-check.yml';
const productionPath = '.github/workflows/private-model-production-review-smoke.yml';
const measuredCandidate = 'd1f-measured-wall-140-100-2350-b710-basin-20261014';
const legacyCandidate = 'd1f-combined-wall-115-100-20261013';

function actualDispatchBlock() {
  const source = readFileSync(workflowPath, 'utf8');
  const marker = '                if [[ "$d1f_probe_changed" == "true" ]]; then\n';
  expect(source.split(marker)).toHaveLength(2);
  const start = source.indexOf(marker);
  const end = source.indexOf('\n                fi', start);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end + '\n                fi'.length)
    .split('\n').map(line => line.replace(/^ {16}/, '')).join('\n');
}

test('actual ownerbot dispatch shell emits separate exact legacy and measured main requests', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'd1f-main-dispatch-'));
  const payloads = join(temporary, 'requests.jsonl');
  const fakeGh = [
    'gh() {',
    '  [[ "$1" == "api" && "$2" == "--method" && "$3" == "POST" ]] || return 71',
    '  [[ "$4" == "/repos/"$GITHUB_REPOSITORY"/actions/workflows/private-model-production-review-smoke.yml/dispatches" ]] || return 72',
    '  [[ "$5" == "--input" && -f "$6" ]] || return 73',
    '  cat "$6" >> "$DISPATCH_PAYLOADS"',
    '  printf "\\n" >> "$DISPATCH_PAYLOADS"',
    '}',
  ].join('\n');
  try {
    const result = spawnSync('bash', ['-c', fakeGh + '\n' + actualDispatchBlock()], {
      encoding: 'utf8',
      env: { ...process.env, RUNNER_TEMP: temporary, DISPATCH_PAYLOADS: payloads,
        GITHUB_REPOSITORY: 'aapojohannespihkala-lgtm/aapopihkala-fi', d1f_probe_changed: 'true' },
    });
    expect(result.status, result.stderr).toBe(0);
    const requests = readFileSync(payloads, 'utf8').trim().split('\n').map(line => JSON.parse(line));
    expect(requests).toEqual([
      { ref: 'main', inputs: { probe_mode: 'd1f-combined-pixels',
        review_id: legacyCandidate + '-review', candidate_id: legacyCandidate } },
      { ref: 'main', inputs: { probe_mode: 'd1f-measured-pixels',
        review_id: measuredCandidate + '-review', candidate_id: measuredCandidate } },
    ]);
    expect(() => readFileSync(join(temporary, 'd1f-production-review-dispatch.json'))).toThrow();
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

test('actual unchanged-domain dispatch block queues no production requests', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'd1f-no-dispatch-'));
  try {
    const result = spawnSync('bash', ['-c',
      'gh() { exit 79; }\n' + actualDispatchBlock()], {
      encoding: 'utf8',
      env: { ...process.env, RUNNER_TEMP: temporary, d1f_probe_changed: 'false' },
    });
    expect(result.status, result.stderr).toBe(0);
    expect(() => readFileSync(join(temporary, 'd1f-production-review-dispatch.json'))).toThrow();
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

test('measured caller remains behind successful owner build and main-only queued production guards', () => {
  const source = readFileSync(workflowPath, 'utf8');
  const production = readFileSync(productionPath, 'utf8');
  const merge = source.split('\n  merge:\n')[1];
  expect(merge).toContain('    needs: build');
  expect(merge).toContain("github.event.pull_request.draft == false");
  expect(merge).toContain('github.event.pull_request.head.repo.full_name == github.repository');
  expect(merge).toContain('github.event.pull_request.user.login == github.repository_owner');
  expect(merge.indexOf('if [[ "$merged" == "true" ]]; then'))
    .toBeLessThan(merge.indexOf('if [[ "$d1f_probe_changed" == "true" ]]; then'));
  const measured = production.split('\n  verify-d1f-measured-pixels:\n')[1];
  expect(measured).toContain("github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main'");
  expect(measured).toContain("inputs.probe_mode == 'd1f-measured-pixels'");
  expect(production).toContain("cancel-in-progress: ${{ github.event_name == 'pull_request' }}");
});
