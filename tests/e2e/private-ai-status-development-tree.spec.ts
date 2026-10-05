import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('AI status development tree stays derived and lightweight', () => {
  const script = readFileSync('public/private-model/status.js', 'utf8');
  const page = readFileSync('src/pages/private-model/status/index.astro', 'utf8');

  expect(script).toContain('const DEVELOPMENT_STAGES = [');
  expect(script).toContain("laneCode || ''");
  expect(script).toContain('renderDevelopment(data)');
  expect(script).toContain("data.humanAction ? 'human' : 'idle'");
  expect(page).toContain('id="development-title"');
  expect(page).toContain('id="development-flow"');
  expect(page).toContain('id="development-tree"');
  expect(page).toContain('Ei valmistumisprosentti');
  expect(page).not.toContain('canvas');
  expect(page).not.toContain('svg');
});
