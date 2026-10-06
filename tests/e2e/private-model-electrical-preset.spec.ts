import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('D electrical research preset exposes only explicit MEP_ELECTRICAL model content', async () => {
  const pageUrl = new URL('../../src/pages/private-model/index.astro', import.meta.url);
  const source = await readFile(pageUrl, 'utf8');

  expect(source).toContain('id="electrical-preset-button"');
  expect(source).toContain('id="electrical-layer-visible"');
  expect(source).toContain("presentationLayer ?? '') === 'MEP_ELECTRICAL'");
  expect(source).toContain('const initializeElectricalLayer = () =>');
  expect(source).toContain("const preset: ViewerResearchPreset = 'electrical'");
  expect(source).toContain("setElectricalLayerForResearchPreset(preset)");
  expect(source).toContain("setDrainageLayerForResearchPreset(preset)");
  expect(source).toContain("electricalPresetButton.addEventListener('click', applyElectricalResearchPreset)");
  expect(source).toContain("electricalLayerVisibleInput.addEventListener('change'");
  expect(source).toContain("canvas.dataset.layerStateSource = 'preset:electrical'");
  expect(source).toContain('D sähköt - WORK_TEST-lähdegeometria näkyvissä');
});
