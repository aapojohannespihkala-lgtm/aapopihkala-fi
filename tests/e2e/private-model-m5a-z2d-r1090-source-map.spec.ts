import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const mapPath = path.join(process.cwd(), '.github', 'work-test-candidates.json');
const workTestMap = JSON.parse(readFileSync(mapPath, 'utf8')) as {
  candidates?: Record<string, { driveFileId?: string }>;
};

test('M5A-Z2D R1090 publish source map points to the exact Drive artifact', () => {
  expect(workTestMap.candidates?.['m5a-z2d-r1090-well-top-ground-surface']).toEqual({
    driveFileId: '1GhIyPFE2dqfrZpH257U-2Wp8c_d2wfD_',
  });
});

test('M5A-Z2D R1090 source map keeps the earlier diameter review candidate available', () => {
  expect(workTestMap.candidates?.['m5a-z2d-d100-d300-diameter']).toEqual({
    driveFileId: '1iQ8IjuYWMpoQ7PwCDhojfn23whJjfFtU',
  });
});
