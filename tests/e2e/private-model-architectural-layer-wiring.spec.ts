import { readFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';

const routeUrl = new URL('../../src/pages/private-model/index.astro', import.meta.url);

test('private viewer installs the shared architectural Layerit runtime', async () => {
  const source = await readFile(routeUrl, 'utf8');
  const importPattern =
    /import\s*\{[^}]*\binstallArchitecturalLayerRuntime\b[^}]*\}\s*from\s*'\.\.\/\.\.\/scripts\/privateModelArchitecturalLayersRuntime';/s;
  const parentNeedle = 'scene.add(modelRoot);';
  const installNeedle =
    'installArchitecturalLayerRuntime(resolveArchitecturalSemanticDescriptor);';

  expect(source).toMatch(importPattern);
  expect(source).toContain(parentNeedle);
  expect(source).toContain(installNeedle);
  expect(source.indexOf(installNeedle)).toBeGreaterThan(source.indexOf(parentNeedle));
});
