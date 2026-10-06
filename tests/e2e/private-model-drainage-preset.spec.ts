import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Salaojat research preset initializes its technical layers without changing legacy view semantics', async () => {
  const pageUrl = new URL('../../src/pages/private-model/index.astro', import.meta.url);
  const source = await readFile(pageUrl, 'utf8');

  expect(source).toContain('id="drainage-preset-button"');
  expect(source).toContain("const applyDrainageResearchPreset = () =>");
  expect(source).toContain("const preset: ViewerResearchPreset = 'drainage';");
  expect(source).toContain("setActiveResearchPreset(preset);");
  expect(source).toContain("setDrainageLayerForResearchPreset(preset);");
  expect(source).toContain("canvas.dataset.layerStateSource = 'preset:drainage';");
  expect(source).toContain('canvas.dataset.layerStateSource = `reset:${activeResearchPreset}`;');
  expect(source).toContain("drainagePresetButton.addEventListener('click', applyDrainageResearchPreset)");
  expect(source).toContain("wholeBuildingPresetButton.addEventListener('click', () => applyStandardViewPreset('whole-building'))");
  expect(source).toContain("sitePresetButton.addEventListener('click', () => applyStandardViewPreset('site'))");
  expect(source).toContain("infraPresetButton.addEventListener('click', () => applyStandardViewPreset('infra'))");
  expect(source).toContain("else if (preset === 'drainage' || preset === 'electrical') fitModel();");
});
