import { expect, test } from '@playwright/test';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const workflow = readFileSync('.github/workflows/publish-work-test.yml', 'utf8');
const prefix = `python3 - ".github/work-test-candidates.json" "$REQUESTED_CANDIDATE" "$GITHUB_ENV" <<'PY'\n`;
const marker = '\n          PY';
const python = workflow.split(prefix)[1]?.split(marker)[0]
  ?.split('\n').map(line => line.replace(/^          /, '')).join('\n');

const executeResolver = (id: string, payloadPath: string, outputPath: string) => {
  expect(python, 'resolve candidate Python block must exist').toBeTruthy();
  return spawnSync('python3', ['-c', python!, payloadPath, id, outputPath],
    { cwd: process.cwd(), encoding: 'utf8' });
};

test('focused P137E is registered in BOTH manifest and Worker runtime before publish', () => {
  const temp = mkdtempSync(join(tmpdir(), 'ylis-work-test-parity-'));
  try {
    const envPath = join(temp, 'github-env');
    const result = executeResolver('p137e-d1f-three-wall-mounted-themos',
      '.github/work-test-candidates.json', envPath);
    expect(result.status, result.stderr).toBe(0);
    const env = readFileSync(envPath, 'utf8');
    expect(env).toContain('CANDIDATE_ID=p137e-d1f-three-wall-mounted-themos');
    expect(env).toContain('DRIVE_FILE_ID=17FqR79AIjJhScxdydK0HG1RX0P53e0wf');
  } finally { rmSync(temp, { recursive: true, force: true }); }
});

test('manifest-only candidate is denied BEFORE any machine PUT request', () => {
  const temp = mkdtempSync(join(tmpdir(), 'ylis-work-test-parity-'));
  try {
    const data = JSON.parse(readFileSync('.github/work-test-candidates.json', 'utf8'));
    data.candidates['parity-fixture-manifest-only'] = { driveFileId: '17FqR79AIjJhScxdydK0HG1RX0P53e0wf' };
    const registry = join(temp, 'candidate-registry.json');
    const envPath = join(temp, 'github-env');
    writeFileSync(registry, JSON.stringify(data));
    const result = executeResolver('parity-fixture-manifest-only', registry, envPath);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('missing from Worker runtime allowlist');
  } finally { rmSync(temp, { recursive: true, force: true }); }
});

test('runtime guard is evaluated before exposing publisher outputs or machine auth', () => {
  const resolve = workflow.split('      - name: Resolve allowlisted candidate')[1]
    ?.split('      - name: Require machine-auth configuration')[0];
  expect(resolve).toContain('WORK_TEST candidate missing from Worker runtime allowlist');
  expect(resolve!.indexOf('WORK_TEST candidate missing from Worker runtime allowlist'))
    .toBeLessThan(resolve!.indexOf('          values = {'));
});
