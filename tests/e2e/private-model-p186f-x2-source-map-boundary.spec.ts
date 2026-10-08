import { expect, test } from '@playwright/test';
import fs from 'node:fs';

test('P186F-X2 source-map registration stays scoped as a precondition', () => {
  const doc = fs.readFileSync('docs/p186f-x2-backend-viewer-r1092.md', 'utf8');
  expect(doc).toContain('first safe registration precondition');
  expect(doc).toContain('No GLB bytes, G2, datacube fact layer, production, CURRENT/canonical/as-built');
});
