import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Salaojat research preset initializes layers while camera-only views preserve overrides', async () => {
  const pageUrl = new URL('../../src/pages/private-model/index.astro', import.meta.url);
  const source = await readFile(pageUrl, 'utf8');

  expect(source).toContain('id="drainage-preset-button"');
  expect(source).toContain("applyResearchPreset('drainage')");
  expect(source).toContain("const nextVisible = preset === 'drainage';");
  expect(source).toContain('const applyResearchPreset = (preset: ViewerResearchPreset) =>');
  expect(source).toContain('setDrainageLayerForResearchPreset(preset);');
  expect(source).toContain('canvas.dataset.layerStateSource = `preset:${preset}`;');
  expect(source).toContain('const applyStandardViewPreset = (preset: StandardViewPreset) =>');
  expect(source).toContain('else if (preset === \'drainage\') fitModel();');
  expect(source).not.toContain(
    'setDrainageLayerForResearchPreset(researchPreset);\n          applyViewerLayerState',
  );
});
