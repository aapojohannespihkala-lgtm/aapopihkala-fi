import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Exercise the exact focus handler shipped in the existing viewer without
// authenticating a private GLB or creating a second, simulated viewer.
const viewerSource = readFileSync('src/pages/private-model/index.astro', 'utf8');
const focusHandler = viewerSource.match(
  /const setLayersPanelOpen = \\(open: boolean, restoreFocus = false\\) => \\{([\\s\\S]*?)\\n      \\};/,
);
const eventHandlers = viewerSource.match(
  /layersButton\\.addEventListener\\('click', \\(\\) => setLayersPanelOpen\\(layersPanel\\.hidden\\)\\);[\\s\\S]*?(?=\\n      edgeModeSelect\\.addEventListener)/,
);

test('Layers keyboard entry, close and Escape preserve a predictable focus path', async ({ page }) => {
  expect(focusHandler?.[1], 'Viewer Layers focus implementation must exist').toBeTruthy();
  expect(eventHandlers?.[0], 'Viewer Layers keyboard handlers must exist').toBeTruthy();

  await page.setContent(`
    <button id="layers-button" type="button" aria-controls="layers-panel" aria-expanded="false">Layerit</button>
    <button id="unrelated" type="button">Other toolbar control</button>
    <aside id="layers-panel" hidden>
      <button id="close-layers-button" type="button">Sulje</button>
      <input id="layer-search" aria-label="Layer search" />
    </aside>
  `);

  // Run the real viewer's implementation, not a separately reimplemented one.
  await page.addScriptTag({ content: `
    const layersButton = document.getElementById('layers-button');
    const layersPanel = document.getElementById('layers-panel');
    const closeLayersButton = document.getElementById('close-layers-button');
    const setLayersPanelOpen = (open, restoreFocus = false) => {${focusHandler![1]}
    };
    ${eventHandlers![0]}
  ` });

  const opener = page.locator('#layers-button');
  const close = page.locator('#close-layers-button');
  await opener.focus();
  await opener.press('Enter');
  await expect(page.locator('#layers-panel')).toBeVisible();
  await expect(opener).toHaveAttribute('aria-expanded', 'true');
  await expect(close).toBeFocused();

  await close.press('Enter');
  await expect(page.locator('#layers-panel')).toBeHidden();
  await expect(opener).toHaveAttribute('aria-expanded', 'false');
  await expect(opener).toBeFocused();

  await opener.press('Enter');
  await expect(close).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#layers-panel')).toBeHidden();
  await expect(opener).toBeFocused();

  // No modal focus trap: unrelated toolbar controls remain operable after close.
  await page.locator('#unrelated').focus();
  await expect(page.locator('#unrelated')).toBeFocused();
});
