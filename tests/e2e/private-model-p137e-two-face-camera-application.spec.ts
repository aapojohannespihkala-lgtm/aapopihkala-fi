import { test, expect } from '@playwright/test';
import { OrthographicCamera, PerspectiveCamera, Vector3 } from 'three';
import { applyP137ETwoFaceSourceCamera } from
  '../../src/scripts/privateModelP137ETwoFaceCameraApplication';
import type { P137ETwoFaceDescriptor } from
  '../../src/scripts/privateModelP137ETwoSidedSourceCamera';

const cameras = () => {
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  const controls = {
    target: new Vector3(2, 3, 4),
    calls: 0,
    update() { this.calls += 1; },
  };
  return { camera, controls };
};
const source = (face: 'NORTH' | 'SOUTH'): P137ETwoFaceDescriptor => ({
  face,
  sourceIds: face === 'NORTH'
    ? ['D_THEMO_CURRENT_LOBBY_01']
    : ['D_THEMO_CURRENT_BEDROOM_01', 'D_THEMO_CURRENT_BATHROOM_01'],
  eye: face === 'NORTH' ? [2, 1.5, -0.65] : [2, 1.5, 0.65],
  target: [2, 1.5, 0],
  up: [0, 1, 0],
  orthoHalfHeight: face === 'NORTH' ? 0.48 : 0.72,
  sourceOnly: true,
  productionRenderVerified: false,
});
const mutate = (record: P137ETwoFaceDescriptor, changes: object) =>
  ({ ...record, ...changes } as P137ETwoFaceDescriptor);

test('NORTH drives true source-facing orthographic lobby camera and orbit target', () => {
  const { camera, controls } = cameras();
  const result = applyP137ETwoFaceSourceCamera(camera, controls, source('NORTH'),
    { width: 1000, height: 500 });
  expect(camera.position.toArray()).toEqual([2, 1.5, -0.65]);
  expect(controls.target.toArray()).toEqual([2, 1.5, 0]);
  expect([camera.left, camera.right, camera.top, camera.bottom])
    .toEqual([-0.96, 0.96, 0.48, -0.48]);
  expect(camera.zoom).toBe(1);
  expect(controls.calls).toBe(1);
  expect(result).toMatchObject({ face: 'NORTH', sourceOnly: true,
    productionRenderVerified: false, humanReview: 'NOT_RUN' });
  expect(result.sourceIds).toEqual(['D_THEMO_CURRENT_LOBBY_01']);
  expect(Object.isFrozen(result.sourceIds)).toBe(true);
});

test('SOUTH targets both bedroom and bathroom without including lobby', () => {
  const { camera, controls } = cameras();
  const result = applyP137ETwoFaceSourceCamera(camera, controls, source('SOUTH'),
    { width: 900, height: 900 });
  expect(camera.position.z).toBeGreaterThan(controls.target.z);
  expect([camera.left, camera.right, camera.top, camera.bottom])
    .toEqual([-0.72, 0.72, 0.72, -0.72]);
  expect(result.sourceIds).toEqual([
    'D_THEMO_CURRENT_BEDROOM_01', 'D_THEMO_CURRENT_BATHROOM_01',
  ]);
  expect(controls.calls).toBe(1);
});

test('wrong north or south housing identities reject without moving camera', () => {
  for (const wrong of [
    mutate(source('NORTH'), { sourceIds: ['D_THEMO_CURRENT_BATHROOM_01'] }),
    mutate(source('SOUTH'), { sourceIds: ['D_THEMO_CURRENT_BATHROOM_01',
      'D_THEMO_CURRENT_BEDROOM_01'] }),
    mutate(source('SOUTH'), { sourceIds: ['D_THEMO_CURRENT_BEDROOM_01',
      'D_THEMO_CURRENT_BEDROOM_01'] }),
    mutate(source('NORTH'), { sourceIds: ['D_THEMO_CURRENT_LOBBY_01',
      'D_THEMO_CURRENT_BATHROOM_01'] }),
  ]) {
    const { camera, controls } = cameras();
    expect(() => applyP137ETwoFaceSourceCamera(camera, controls, wrong,
      { width: 800, height: 600 })).toThrow(/source device identities/);
    expect(camera.position.toArray()).toEqual([0, 0, 0]);
    expect(controls.target.toArray()).toEqual([2, 3, 4]);
    expect(controls.calls).toBe(0);
  }
});

test('opposite-facing cameras must actually have opposite world-side eyes', () => {
  for (const wrong of [
    mutate(source('NORTH'), { eye: [2, 1.5, 0.65] }),
    mutate(source('SOUTH'), { eye: [2, 1.5, -0.65] }),
    mutate(source('SOUTH'), { eye: [2, 1.5, 0.001] }),
    mutate(source('NORTH'), { up: [0, -1, 0] }),
    mutate(source('NORTH'), { up: [0, 0, 1] }),
  ]) {
    const { camera, controls } = cameras();
    expect(() => applyP137ETwoFaceSourceCamera(camera, controls, wrong,
      { width: 1200, height: 800 })).toThrow(/opposite wall-face orientation/);
    expect(controls.calls).toBe(0);
  }
});

test('physical or already-proven camera descriptor cannot masquerade as source-only', () => {
  for (const wrong of [
    mutate(source('NORTH'), { sourceOnly: false }),
    mutate(source('SOUTH'), { productionRenderVerified: true }),
    mutate(source('NORTH'), { face: 'WEST' }),
  ]) {
    const { camera, controls } = cameras();
    expect(() => applyP137ETwoFaceSourceCamera(camera, controls, wrong,
      { width: 1200, height: 800 })).toThrow(/WORK_TEST source descriptor/);
    expect(controls.calls).toBe(0);
  }
});

test('camera viewport and frustum values fail closed before orbit movement', () => {
  for (const [descriptor, viewport] of [
    [source('NORTH'), { width: 0, height: 800 }],
    [source('NORTH'), { width: 1600, height: 200 }],
    [mutate(source('SOUTH'), { orthoHalfHeight: 8 }), { width: 800, height: 600 }],
    [mutate(source('NORTH'), { eye: [NaN, 1.5, -0.65] }), { width: 800, height: 600 }],
  ] as const) {
    const { camera, controls } = cameras();
    expect(() => applyP137ETwoFaceSourceCamera(camera, controls, descriptor,
      viewport)).toThrow();
    expect(controls.calls).toBe(0);
    expect(camera.position.toArray()).toEqual([0, 0, 0]);
  }
});

test('camera application refuses perspective substitution and missing orbit controls', () => {
  const { camera, controls } = cameras();
  const perspective = new PerspectiveCamera(60, 1, 0.1, 100);
  expect(() => applyP137ETwoFaceSourceCamera(
    perspective as unknown as OrthographicCamera,
    controls, source('NORTH'), { width: 800, height: 600 },
  )).toThrow(/orthographic camera/);
  expect(() => applyP137ETwoFaceSourceCamera(camera,
    { target: new Vector3(), update: null as unknown as () => void },
    source('NORTH'), { width: 800, height: 600 },
  )).toThrow(/orthographic camera/);
});
