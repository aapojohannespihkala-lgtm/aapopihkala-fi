import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const candidateId = 'm5a-z2d-r1090-well-top-ground-surface';
const expectedDriveFileId = '1GhIyPFE2dqfrZpH257U-2Wp8c_d2wfD_';

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

test('M5A-Z2D R1090 publish handoff names the exact WORK_TEST candidate id', () => {
  expect(docsContent).toContain('## V5 publish gate');
  expect(docsContent).toContain('Publish WORK_TEST');
  expect(docsContent).toContain(candidateId);
});

test('M5A-Z2D R1090 publish handoff stays aligned with the source-map Drive entry', () => {
  expect(workTestMap.candidates?.[candidateId]).toEqual({
    driveFileId: expectedDriveFileId,
  });

  expect(docsContent).toContain(expectedDriveFileId);
});

test('M5A-Z2D R1090 publish handoff no longer describes runtime implementation as the next code patch', () => {
  expect(docsContent).not.toContain('Required next code patch');
  expect(docsContent).not.toContain('continue with the actual runtime allowlist patch');
});
