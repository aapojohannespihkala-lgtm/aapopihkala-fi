import { expect, test } from '@playwright/test';
import workTestCandidates from '../../.github/work-test-candidates.json';

test('P186F-X2 exact Themo candidate is registered in the machine publish source map', () => {
  expect(workTestCandidates.candidates['p186f-x2-d-themo-room-adjacent-work-assumption']).toEqual({
    driveFileId: '1fGoU6I_hiFy9A9i4y-lr4YuJ9n0-6ach',
  });
});
