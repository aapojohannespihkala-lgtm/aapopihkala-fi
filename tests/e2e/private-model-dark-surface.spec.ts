import { readFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';

test('private viewer keeps the VUX-C dark surface foundation', async () => {
  const source = await readFile('src/pages/private-model/index.astro', 'utf8');

  expect(source).toContain('color-scheme: dark;');
  expect(source).toContain('--viewer-page: #202a34;');
  expect(source).toContain('--viewer-bar: #1b242d;');
  expect(source).toContain('--viewer-ink: #f1f4f5;');
  expect(source).toContain('--viewer-line-soft: #46535d;');
  expect(source).toContain('font-family: Georgia, "Times New Roman", serif;');
  expect(source).toContain('font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;');
  expect(source).toContain('renderer.setClearColor(0x202a34, 1);');
  expect(source).not.toContain('renderer.setClearColor(0xecece8, 1);');
});
