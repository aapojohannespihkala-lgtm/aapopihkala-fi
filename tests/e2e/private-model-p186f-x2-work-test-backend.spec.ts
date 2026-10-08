import { expect, test } from '@playwright/test';

import { getPrivateWorkTestCandidateById } from '../../worker/privateWorkTest';

test('P186F-X2 backend work-test runtime allowlist exposes the exact successor', () => {
  const candidate = getPrivateWorkTestCandidateById('p186f-x2-d-themo-room-adjacent-work-assumption');

  expect(candidate).toMatchObject({
    id: 'p186f-x2-d-themo-room-adjacent-work-assumption',
    label: 'P186F-X2 D Themo room-adjacent work assumption - WORK_TEST',
    path: expect.stringContaining('/work-test/p186f-x2-d-themo-room-adjacent-work-assumption.glb'),
    objectKey: 'work-test/p186f-x2-d-themo-room-adjacent-work-assumption.glb',
    expectedSize: 3_201_932,
    expectedSha256: '59fad8cfab19ad6981f53c7969b2d9bd6f33161fe33de0fc23152e6ec38c029f',
  });
});
