import { expect, test } from '@playwright/test';
import fs from 'node:fs';

test('P186F-X2 registration boundary is documented', () => {
  const doc = fs.readFileSync('docs/p186f-x2-backend-viewer-r1092.md', 'utf8');
  expect(doc).toContain('p186f-x2-d-themo-room-adjacent-work-assumption');
  expect(doc).toContain('p186f-x2-d-themo-room-adjacent-work-assumption-review');
  expect(doc).toContain('exposes the exact successor through the worker runtime allowlist');
  expect(doc).toContain('maps the one-link review id to the published WORK_TEST candidate');
  expect(doc).toContain('private-model viewer presentation activation and authenticated live render evidence as the next separate gate');
});
