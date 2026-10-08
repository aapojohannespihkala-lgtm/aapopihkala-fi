import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

test('M5A-Z2D R1090 publish source map points to the exact Drive artifact', () => {
  const mapPath = path.join(process.cwd(), '.github', 'work-test-candidates.json');
  const workTestMap = JSON.parse(readFileSync(mapPath, 'utf8')) as {
    candidates?: Record<string, { driveFileId?: string }>;
  };

  expect(workTestMap.candidates?.['m5a-z2d-r1090-well-top-ground-surface']).toEqual({
    driveFileId: '1GhIyPFE2dqfrZpH257U-2Wp8c_d2wfD_',
  });
});
