import { expect, test } from '@playwright/test';
import fs from 'node:fs';

type WorkTestCandidateSourceMap = {
  version: number;
  candidates: Record<string, { driveFileId: string }>;
};

test('M5A-Z2D R1090 work-test source map preserves exact Drive identity', () => {
  const sourceMap = JSON.parse(
    fs.readFileSync('.github/work-test-candidates.json', 'utf8'),
  ) as WorkTestCandidateSourceMap;

  expect(sourceMap.candidates['m5a-z2d-r1090-well-top-ground-surface']).toEqual({
    driveFileId: '1GhIyPFE2dqfrZpH257U-2Wp8c_d2wfD_',
  });
});
