import { expect, test } from '@playwright/test';

import { getPrivateWorkTestCandidateById } from '../../worker/privateWorkTest';

test('P186F-X2 backend work-test runtime allowlist is intentionally not yet promoted', () => {
  expect(getPrivateWorkTestCandidateById('p186f-x2-d-themo-room-adjacent-work-assumption')).toBeNull();
});
