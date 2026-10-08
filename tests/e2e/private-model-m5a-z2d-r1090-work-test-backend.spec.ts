import { expect, test } from '@playwright/test';

import { getPrivateWorkTestCandidateById } from '../../worker/privateWorkTest';

test('M5A-Z2D R1090 backend work-test runtime allowlist exposes the exact well-top ground-surface successor', () => {
  const candidate = getPrivateWorkTestCandidateById('m5a-z2d-r1090-well-top-ground-surface');

  expect(candidate).toMatchObject({
    id: 'm5a-z2d-r1090-well-top-ground-surface',
    label: 'M5A-Z2D R1090 well-top ground-surface correction - WORK_TEST',
    path: expect.stringContaining('/work-test/m5a-z2d-r1090-well-top-ground-surface.glb'),
    objectKey: 'work-test/m5a-z2d-r1090-well-top-ground-surface.glb',
    expectedSize: 3_089_152,
    expectedSha256: 'e8934e546f2a89a2cc070c44ef9f4d6f6df8f5dd2bb30c1c7379b7f821d85605',
  });
});
