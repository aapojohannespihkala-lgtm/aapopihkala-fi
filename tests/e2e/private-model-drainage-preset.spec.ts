import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Salaojat research preset is wired through Presetit without owning camera-only views', async () => {
  const pageUrl = new URL('../../src/pages/private-model/index.astro', import.meta.url);
  const source = await readFile(pageUrl, 'utf8');

  expect(source).toContain('id="drainage-preset-button"');
  expect(source).toContain("applyStandardViewPreset('drainage')");
  expect(source).toContain("const nextVisible = preset === 'drainage';");
  expect(source).toContain('setDrainageLayerForResearchPreset(researchPreset);');
  expect(source).toContain('setDrainageLayerForResearchPreset(activeResearchPreset);');
});
