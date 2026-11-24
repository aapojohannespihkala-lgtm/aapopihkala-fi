import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, test } from '@playwright/test';

// WP1c: exercise the actual hidden-tab guard extracted from the viewer's
// installed animation loop. This checks CPU-path suppression and resumption,
// not production WebGL pixels or GPU timing.
test('hidden frames skip viewer work and visible frames resume the same loop', () => {
  const source = readFileSync('src/pages/private-model/index.astro', 'utf8');
  const opener = 'renderer.setAnimationLoop(() => {';
  expect(source.split(opener)).toHaveLength(2);
  const loopAt = source.indexOf(opener);
  const guardAt = source.indexOf("if (document.visibilityState === 'hidden') return;", loopAt);
  const beginAt = source.indexOf('frameProfiler?.begin(performance.now());', loopAt);
  const drawAt = source.indexOf('renderer.render(scene, activeCamera);', loopAt);
  const closeAt = source.indexOf('\n      });', loopAt);
  expect(guardAt).toBeGreaterThan(loopAt);
  expect(beginAt).toBeGreaterThan(guardAt);
  expect(drawAt).toBeGreaterThan(beginAt);
  expect(closeAt).toBeGreaterThan(drawAt);

  // Use exactly the code that precedes the first expensive frame operation,
  // then replace the work with a counter. No synthetic visibility algorithm.
  const prefix = source.slice(loopAt, beginAt);
  let hidden = false;
  let executed = 0;
  let installed: (() => void) | null = null;
  runInNewContext(prefix + '\n      continueFrame();\n    });', {
    document: { get visibilityState() { return hidden ? 'hidden' : 'visible'; } },
    renderer: { setAnimationLoop(callback: () => void) { installed = callback; } },
    continueFrame() { executed++; },
  });
  expect(typeof installed).toBe('function');
  const frame = installed as unknown as () => void;

  frame();
  expect(executed).toBe(1);
  hidden = true;
  for (let i = 0; i < 20; i++) frame();
  expect(executed).toBe(1);
  hidden = false;
  frame();
  expect(executed).toBe(2);
  hidden = true;
  frame();
  hidden = false;
  frame();
  expect(executed).toBe(3);
});
