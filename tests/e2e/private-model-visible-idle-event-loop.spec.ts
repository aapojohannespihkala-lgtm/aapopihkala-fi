import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

/**
 * WP1d: use the exact event registration and animation-loop guards from the
 * viewer plus the shipped pure governor in real Chromium. The draw itself is
 * counted, not rendered. This does NOT certify production WebGL or genuine OS
 * tab lifecycle, and deliberately leaves the opt-in disabled by default.
 */
test('WP1d opt-in actual browser events wake the source frame guard and idle limits work', async ({ page }) => {
  const pageSource = readFileSync('src/pages/private-model/index.astro', 'utf8');
  const governorSource = readFileSync('src/scripts/privateModelVisibleIdleGovernor.mjs', 'utf8');
  const setupMarker = 'const viewerIdlePilot = new URLSearchParams(window.location.search)';
  const loopMarker = 'renderer.setAnimationLoop(() => {';
  const beginMarker = 'frameProfiler?.begin(performance.now());';
  expect(pageSource.split(setupMarker)).toHaveLength(2);
  expect(pageSource.split(loopMarker)).toHaveLength(2);
  const setupAt = pageSource.indexOf(setupMarker);
  const loopAt = pageSource.indexOf(loopMarker, setupAt);
  const beginAt = pageSource.indexOf(beginMarker, loopAt);
  expect(setupAt).toBeGreaterThan(0);
  expect(loopAt).toBeGreaterThan(setupAt);
  expect(beginAt).toBeGreaterThan(loopAt);
  const installedSource = pageSource.slice(setupAt, beginAt);
  expect(installedSource).toContain("document.visibilityState === 'hidden'");
  expect(installedSource).toContain('controls.addEventListener(\'change\', wakeIdlePilot)');
  expect(installedSource).toContain('document.addEventListener(\'visibilitychange\', wakeIdlePilot)');
  expect(installedSource).toContain('viewerIdlePilot.shouldRun(performance.now())');
  expect(governorSource).toContain('export function createVisibleIdleFrameGovernor');

  await page.goto('about:blank');
  const result = await page.evaluate(({ installedSource, governorSource }) => {
    function install(search: string) {
      let now = 0;
      let hidden = false;
      let drawn = 0;
      let callback: (() => void) | undefined;
      const controls = new EventTarget();
      const planControls = new EventTarget();
      const isoControls = new EventTarget();
      const fakeWindow = {
        location: { search },
        addEventListener: window.addEventListener.bind(window),
      };
      const fakeDocument = {
        get visibilityState() { return hidden ? 'hidden' : 'visible'; },
        addEventListener: document.addEventListener.bind(document),
      };
      const fakePerformance = { now: () => now };
      const renderer = { setAnimationLoop(fn: () => void) { callback = fn; } };
      const helper = governorSource.replace(
        'export function createVisibleIdleFrameGovernor',
        'function createVisibleIdleFrameGovernor',
      );
      const run = new Function(
        'window','document','performance','controls','planControls',
        'isoControls','renderer','record',
        helper + '\n' + installedSource + '\n record();\n });',
      );
      run(fakeWindow, fakeDocument, fakePerformance, controls,
        planControls, isoControls, renderer, () => { drawn++; });
      if (typeof callback !== 'function') throw new Error('WP1D_NO_FRAME_CALLBACK');
      return {
        frame(t: number) { now = t; callback!(); return drawn; },
        wake(t: number, event: string) {
          now = t; window.dispatchEvent(new Event(event));
        },
        switchVisibility(t: number, value: boolean) {
          now = t; hidden = value; document.dispatchEvent(new Event('visibilitychange'));
        },
        controlChange(t: number) {
          now = t; controls.dispatchEvent(new Event('change'));
        },
      };
    }
    const ordinary = install('?viewerIdlePilot=0');
    const ordinaryDraws = [0, 16, 32, 48, 64].map(t => ordinary.frame(t));

    const pilot = install('?viewerIdlePilot=1');
    const start = [0, 16, 124, 125, 130].map(t => pilot.frame(t));
    pilot.wake(200, 'pointermove');
    const active = [201, 217, 1700, 1701].map(t => pilot.frame(t));
    pilot.switchVisibility(1710, true);
    const hidden = [1711, 1750].map(t => pilot.frame(t));
    pilot.switchVisibility(1755, false);
    const restored = [1756, 1770, 3255, 3256].map(t => pilot.frame(t));
    pilot.controlChange(3260);
    const controlled = [3261, 3277].map(t => pilot.frame(t));
    return { ordinaryDraws, start, active, hidden, restored, controlled };
  }, { installedSource, governorSource });

  // Default route remains full-rate. Opt-in saves frames at 60 fps, wakes
  // immediately from pointer events, and resumes on foreground and controls.
  expect(result.ordinaryDraws).toEqual([1, 2, 3, 4, 5]);
  expect(result.start).toEqual([1, 1, 1, 2, 2]);
  expect(result.active).toEqual([3, 4, 5, 5]);
  expect(result.hidden).toEqual([5, 5]);
  expect(result.restored).toEqual([6, 7, 8, 8]);
  expect(result.controlled).toEqual([9, 10]);
});
