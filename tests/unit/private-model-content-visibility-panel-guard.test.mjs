import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Owner requirement 15.11.2026: the "Sisältö" panel with per-group
// Näkyvä / Himmeä / Piilossa visibility must stay in the viewer.
test('Sisältö panel keeps its Näkyvä / Himmeä / Piilossa visibility controls', async () => {
  const controls = await readFile(new URL('../../src/scripts/privateModelLayersPresetControls.ts', import.meta.url), 'utf8');
  for (const label of ['Näkyvä', 'Himmeä', 'Piilossa']) assert.match(controls, new RegExp(`label: '${label}'`));
  assert.match(controls, /Oletusnäkyvyys/);
  const page = await readFile(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  assert.match(page, /layersButton\.textContent = modernContent \? 'Sisältö' : 'Layerit'/);
  assert.match(page, /modernContent \? 'Mallin sisältö' : 'Layerit'/);
});
