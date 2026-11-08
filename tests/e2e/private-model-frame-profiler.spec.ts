import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import {
  createViewerFrameProfiler,
  type ViewerFrameProfilerSnapshot,
} from '../../src/scripts/privateModelFrameProfiler';

const info = (drawCalls: number) => ({
  drawCalls, triangles: drawCalls * 12, geometries: 7, textures: 2,
});
const shaA = 'a'.repeat(64), shaB = 'b'.repeat(64);

test('WP1 profiler returns bounded stage, idle/moving and draw-call samples', () => {
  const results: ViewerFrameProfilerSnapshot[] = [];
  const profiler = createViewerFrameProfiler({ sampleSize: 2,
    onSample: sample => results.push(sample) });
  profiler.begin(0);
  profiler.mark('scope', 2);
  profiler.mark('layers', 5);
  profiler.mark('render', 10);
  profiler.end(12, info(10), false, '1F', shaA, 'root-a');
  expect(results).toHaveLength(0);

  profiler.begin(20);
  profiler.mark('scope', 21);
  profiler.mark('layers', 23);
  profiler.mark('render', 29);
  profiler.end(30, info(20), true, '1F', shaA, 'root-a');

  expect(results).toHaveLength(1);
  expect(results[0]).toMatchObject({
    samples: 2,
    view: '1F', sourceSha256: shaA, sceneRootUuid: 'root-a',
    frameMs: { mean: 11, p95: 12, max: 12 },
    idle: { samples: 1, meanMs: 12, p95Ms: 12 },
    moving: { samples: 1, meanMs: 10, p95Ms: 10 },
    stageMeanMs: { scope: 1.5, layers: 2.5, render: 5.5 },
    drawCallsMean: 15,
    trianglesMean: 180,
    memory: { geometries: 7, textures: 2 },
  });

  profiler.begin(40);
  profiler.mark('scope', 41);
  profiler.end(42, info(1), false, 'BOTH', shaA, 'root-a');
  expect(results).toHaveLength(1);
});

test('WP1 profiler discards mixed-view partial windows before reporting 1F/2F/BOTH', () => {
  const results: ViewerFrameProfilerSnapshot[] = [];
  const profiler = createViewerFrameProfiler({
    sampleSize: 2, onSample: sample => results.push(sample),
  });
  const frame = (startedAt: number, drawCalls: number, view: string) => {
    profiler.begin(startedAt);
    profiler.mark('scope', startedAt + 1);
    profiler.end(startedAt + 4, info(drawCalls), false, view, shaA, 'root-a');
  };

  frame(0, 100, '1F');
  frame(10, 1, '2F'); // Drops the unfinished 1F window.
  expect(results).toHaveLength(0);
  frame(20, 3, '2F');
  expect(results).toHaveLength(1);
  expect(results[0]).toMatchObject({
    samples: 2, view: '2F', drawCallsMean: 2, trianglesMean: 24,
  });

  frame(30, 100, 'BOTH');
  frame(40, 6, '1F'); // Drops the unfinished BOTH window.
  expect(results).toHaveLength(1);
  frame(50, 8, '1F');
  expect(results).toHaveLength(2);
  expect(results[1]).toMatchObject({
    samples: 2, view: '1F', drawCallsMean: 7, trianglesMean: 84,
  });
});

test('WP1 profiler resets on changed SHA or scene root and ignores unloaded frames', () => {
  const results: ViewerFrameProfilerSnapshot[] = [];
  const profiler = createViewerFrameProfiler({
    sampleSize: 2, onSample: sample => results.push(sample),
  });
  const frame = (time: number, calls: number, sha: string | null, root: string | null) => {
    profiler.begin(time);
    profiler.mark('scope', time + 1);
    profiler.end(time + 4, info(calls), false, 'work-test:D:1F:front', sha, root);
  };

  frame(0, 400, null, null);       // No verified GLB: never record.
  frame(10, 100, shaA, 'root-a');
  frame(20, 1, shaB, 'root-a');   // Same floor, different GLB: drop shaA.
  expect(results).toHaveLength(0);
  frame(30, 3, shaB, 'root-a');
  expect(results).toHaveLength(1);
  expect(results[0]).toMatchObject({
    view: 'work-test:D:1F:front', sourceSha256: shaB, sceneRootUuid: 'root-a',
    drawCallsMean: 2, trianglesMean: 24,
  });

  frame(40, 500, shaB, 'root-a');
  frame(50, 6, shaB, 'root-b');   // Same GLB and floor, different scene root.
  expect(results).toHaveLength(1);
  frame(60, 8, shaB, 'root-b');
  expect(results).toHaveLength(2);
  expect(results[1]).toMatchObject({
    sourceSha256: shaB, sceneRootUuid: 'root-b', drawCallsMean: 7,
  });

  frame(70, 999, shaB, 'root-b');
  frame(80, 888, shaB, null);     // A missing scene root voids the partial window.
  frame(90, 4, shaB, 'root-b');
  expect(results).toHaveLength(2);
  frame(100, 6, shaB, 'root-b');
  expect(results).toHaveLength(3);
  expect(results[2].drawCallsMean).toBe(5);
});

test('WP1 profiler discards nonmonotonic timing and does not emit partial windows', () => {
  const results: ViewerFrameProfilerSnapshot[] = [];
  const profiler = createViewerFrameProfiler({ sampleSize: 2,
    onSample: sample => results.push(sample) });
  profiler.begin(10);
  profiler.mark('scope', 9);
  profiler.end(12, info(1), true, 'BOTH', shaA, 'root-a');
  expect(results).toHaveLength(0);
  profiler.begin(20);
  profiler.mark('scope', 21);
  profiler.end(22, info(1), false, 'BOTH', shaA, 'root-a');
  expect(results).toHaveLength(0);
  profiler.begin(30);
  profiler.mark('scope', 31);
  profiler.end(32, info(1), false, 'BOTH', shaA, 'root-a');
  expect(results).toHaveLength(1);
  expect(results[0].idle.samples).toBe(2);
  expect(results[0].moving.samples).toBe(0);
  expect(results[0].moving.meanMs).toBeNull();
});

test('WP1 viewer instrumentation is URL opt-in and preserves the render pipeline', () => {
  const source = readFileSync('src/pages/private-model/index.astro', 'utf8');
  expect(source).toContain("get('viewerPerf') === '1'");
  expect(source).toContain('createViewerFrameProfiler');
  expect(source).toContain('renderer.setAnimationLoop(() => {');
  expect(source).toContain('refreshEdgeRendering(root)');
  expect(source).toContain('renderer.render(scene, activeCamera)');
  expect(source).toContain('layersRuntime?.enforce(modelRoot.children[0] ?? null, layersLoadedSha)');
  // The sampled source and floor must come from current viewer context,
  // not only the orbit camera preset or the last selected GLB.
  expect(source).toContain('canvas.dataset.mainViewArea');
  expect(source).toContain('canvas.dataset.mainViewFloor');
  expect(source).toContain('layersLoadedSha === layersExpectedSha');
  expect(source).toContain('modelRoot.children[0]?.uuid ?? null');
});

test('WP1 navigator skips repeated camera-bound recomputation only when source and view remain unchanged', () => {
  const source = readFileSync('src/scripts/privateModelOrientationGizmo.ts', 'utf8');
  const start = source.indexOf('const renderNavigator = (');
  const signature = source.indexOf('const navigatorInputSignature = JSON.stringify([', start);
  const guard = source.indexOf('lastNavigatorInputSignature === navigatorInputSignature', start);
  const work = source.indexOf('const look = new THREE.Vector3(0, 0, -1)', start);
  expect(start).toBeGreaterThan(0);
  expect(signature).toBeGreaterThan(start);
  expect(guard).toBeGreaterThan(signature);
  expect(guard, 'Idle fast path must precede world-pose and bounds allocation').toBeLessThan(work);
  const inputFields = source.slice(signature, guard);
  for (const field of [
    'camera.position.x', 'camera.position.y', 'camera.position.z',
    'camera.quaternion.x', 'camera.quaternion.y',
    'camera.quaternion.z', 'camera.quaternion.w',
    'controls.target.x', 'controls.target.y', 'controls.target.z',
    'camera.fov', 'camera.aspect', 'camera.zoom', 'camera.left',
    'camera.right', 'camera.top', 'camera.bottom',
    'canvas.dataset.viewPreset', 'canvas.dataset.elevationDirection',
    'canvas.dataset.modelSource', 'canvas.dataset.workTestReviewCandidate',
    'workTestSelect?.value', 'badge?.dataset.kind',
    'canvas.dataset.horizontalClip', 'canvas.dataset.horizontalClipHeightM',
    'canvas.dataset.layerRoofVisible', 'canvas.dataset.layerRoofOpacity',
    'canvas.dataset.objectVisibilityFilter', 'canvas.dataset.objectVisibilityMode',
    'canvas.dataset.reviewAnchorX', 'canvas.dataset.reviewAnchorY',
    'canvas.dataset.reviewAnchorZ',
  ]) expect(inputFields, `Missing invalidation input: ${field}`).toContain(field);
  expect(source).toContain('if (lastCompact !== compact)');
  expect(source).toContain("readout.dataset.ready === 'true'");
  expect(source).toContain("root.dataset.aiNavigatorReady === 'true'");
  expect(source).toContain("canvas.dataset.aiNavigator === 'ready'");
  expect(source).toContain('lastNavigatorInputSignature = navigatorInputSignature;');
});
