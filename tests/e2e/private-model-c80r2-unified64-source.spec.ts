import { test, expect } from '@playwright/test';
import {
  C80R2_UNIFIED64_SHA, C80R2_UNIFIED64_SCENES,
  resolveC80R2Unified64Scenes,
} from '../../src/scripts/privateModelUnified64Floor';

// Structural contract fixture: no geometry reconstruction or browser mocks
// are substituted for the real full source's eventual protected review.
function exactFixture() {
  const names = {
    60: 'C80R2_C045_C020_C046_C030_C050_UNIFIED_1F_WORK_TEST_HOST_HOLD_NONCURRENT',
    62: 'C80R2_C045_C020_C046_C030_C050_C018_PA1_PHOTO_R1_UNIFIED_2F_WORK_TEST_HOST_HOLD_NONCURRENT',
    63: 'C80R2_C045_C020_C046_C030_C050_C018_PA1_PHOTO_R1_UNIFIED_BOTH_WORK_TEST_HOST_HOLD_NONCURRENT',
  };
  const roots = { 60: 49, 62: 40, 63: 84 };
  const json = {
    scene: 0, asset: { version: '2.0', extras: { current: false, asBuilt: false } },
    scenes: Array.from({ length: 64 }, (_, i) => ({
      name: names[i as keyof typeof names] ?? 'HISTORICAL_WORK_TEST',
      nodes: Array.from({ length: roots[i as keyof typeof roots] ?? 1 }, (_, j) => j + i * 100),
      extras: { stage: 'WORK_TEST', current: false, asBuilt: false },
    })),
  };
  const scenes = json.scenes.map(s => ({
    name: s.name, children: s.nodes.map(n => ({ id: n })),
    traverse: (cb: (obj: { isMesh: boolean }) => void) => cb({ isMesh: true }),
  }));
  return { scene: scenes[0], scenes, parser: { json } };
}

test('exact 64-scene source routes original nodes 60/62/63 without duplicating geometry', () => {
  const gltf = exactFixture();
  const before = gltf.scenes.map(scene => scene.children);
  const actual = resolveC80R2Unified64Scenes(gltf as any, C80R2_UNIFIED64_SHA);
  expect(Object.keys(actual).sort()).toEqual(['1F', '2F', 'BOTH']);
  for (const floor of ['1F', '2F', 'BOTH'] as const) {
    const index = C80R2_UNIFIED64_SCENES[floor];
    expect(actual[floor]).toBe(gltf.scenes[index]);
  }
  gltf.scenes.forEach((scene, i) => expect(scene.children).toBe(before[i]));
});

test('incorrect source SHA or scene count rejects before any source mutation', () => {
  const gltf = exactFixture();
  expect(() => resolveC80R2Unified64Scenes(gltf as any, 'bad-sha')).toThrow(/FAIL_CLOSED/);
  gltf.parser.json.scenes.pop();
  expect(() => resolveC80R2Unified64Scenes(gltf as any, C80R2_UNIFIED64_SHA)).toThrow(/64-scene/);
});

test('wrong root count, source scene name or noncurrent status fail closed', () => {
  for (const defect of ['roots', 'name', 'current', 'host']) {
    const gltf = exactFixture();
    if (defect === 'roots') gltf.parser.json.scenes[63].nodes.pop();
    if (defect === 'name') gltf.scenes[62].name = 'unexpected';
    if (defect === 'current') gltf.parser.json.asset.extras.current = true;
    if (defect === 'host') gltf.parser.json.scenes[60].extras.stage = 'CURRENT';
    expect(() => resolveC80R2Unified64Scenes(gltf as any, C80R2_UNIFIED64_SHA)).toThrow(/FAIL_CLOSED/);
  }
});
