import { expect, test } from '@playwright/test';
import fs from 'node:fs';

test('P186F-X2 registration boundary is documented', () => {
  const doc = fs.readFileSync('docs/p186f-x2-backend-viewer-r1092.md', 'utf8');
  expect(doc).toContain('p186f-x2-d-themo-room-adjacent-work-assumption');
  expect(doc).toContain('worker runtime allowlist and private-model viewer autoload/review presentation wiring as the next separate gate');
});
