import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const candidateId = 'm5a-z2d-r1090-well-top-ground-surface';
const expectedDriveFileId = '1GhIyPFE2dqfrZpH257U-2Wp8c_d2wfD_';
const expectedReviewUrl =
  'https://aapopihkala.fi/private-model/?review=m5a-z2d-r1090-well-top-ground-surface-review';

const docsPath = path.join(
  process.cwd(),
  'docs',
  'ylisrinne',
  'm5a-z2d-r1090-runtime-wiring-map.md',
);
const candidateMapPath = path.join(process.cwd(), '.github', 'work-test-candidates.json');

const docsContent = readFileSync(docsPath, 'utf8');
const workTestMap = JSON.parse(readFileSync(candidateMapPath, 'utf8')) as {
  candidates?: Record<string, { driveFileId?: string }>;
};

test('M5A-Z2D R1090 handoff stays aligned with the exact WORK_TEST source identity', () => {
  expect(workTestMap.candidates?.[candidateId]).toEqual({
    driveFileId: expectedDriveFileId,
  });

  expect(docsContent).toContain(candidateId);
  expect(docsContent).toContain(expectedDriveFileId);
  expect(docsContent).toContain(
    'e8934e546f2a89a2cc070c44ef9f4d6f6df8f5dd2bb30c1c7379b7f821d85605',
  );
});

test('M5A-Z2D R1090 handoff records the completed machine publish/readback gate', () => {
  expect(docsContent).toContain('## V5 publish/readback status');
  expect(docsContent).toContain('Publish WORK_TEST - m5a-z2d-r1090-well-top-ground-surface');
  expect(docsContent).toContain('Run `37835730136` completed successfully from `main`.');
  expect(docsContent).toContain('full production GLB byte-for-byte readback');
});

test('M5A-Z2D R1090 handoff keeps the next gate at authenticated render visibility', () => {
  expect(docsContent).toContain('## Review/autoload gate');
  expect(docsContent).toContain(expectedReviewUrl);
  expect(docsContent).toContain('authenticated one-link live behavior');
  expect(docsContent).toContain('render the relevant R1090 well-top ground-surface correction');
  expect(docsContent).toContain('VISIBILITY_PROBE_REQUIRED');
  expect(docsContent).toContain('not `READY_FOR_HUMAN_REVIEW`');
});

test('M5A-Z2D R1090 handoff no longer treats implementation or one-link wiring as the next patch', () => {
  expect(docsContent).not.toContain('Required next code patch');
  expect(docsContent).not.toContain('continue with the actual runtime allowlist patch');
  expect(docsContent).not.toContain('Build check run `37837733136` on vielä `in_progress`');
});
