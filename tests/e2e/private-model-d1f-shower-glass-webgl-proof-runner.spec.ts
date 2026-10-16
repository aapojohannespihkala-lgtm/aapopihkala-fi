import { test, expect } from '@playwright/test';
import { Group, HemisphereLight, DirectionalLight } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// @ts-ignore - browser-neutral native ESM runner uses the same source gate as the viewer.
import { runD1FShowerGlassSourceVerifiedWebGL, mountD1FShowerViewerPresentationLights } from '../../src/scripts/privateModelD1FShowerGlassWebGLProofRunner.mjs';
// @ts-ignore - immutable test reference, not a substitute for actual raw bytes.
import { D1F_SHOWER_PHOTO_SOURCE } from '../../src/scripts/privateModelD1FShowerPhotoSourceContract.mjs';

const reader = () => {
  let parseCount = 0, gpuCount = 0;
  const api = {
    loader: { async parseAsync(_bytes: ArrayBuffer) { parseCount++; throw new Error('should not parse'); } },
    renderer: { isWebGLRenderer: true, render() { gpuCount++; } },
    camera: { isCamera: true, updateMatrixWorld() {} },
    target: {},
    width: 64,
    height: 64,
  };
  return { api, calls: () => ({ parseCount, gpuCount }) };
};

test('rejects an absent source file before source parsing or any GPU readback', async () => {
  const { api, calls } = reader();
  for (const bad of [undefined, new Uint8Array(0), new Uint8Array(200)]) {
    await expect(runD1FShowerGlassSourceVerifiedWebGL({ ...api, rawGlb: bad }))
      .rejects.toThrow('D1F_SHOWER_WEBGL_RUNNER_REJECTED');
  }
  expect(calls()).toEqual({ parseCount: 0, gpuCount: 0 });
});

test('full-size but forged GLB cannot borrow the original SHA label', async () => {
  const { api, calls } = reader();
  // Valid-enough binary structure to reach the independent full-blob SHA gate,
  // but contents do not match the immutable source and MUST NOT be loaded.
  const rawGlb = new Uint8Array(D1F_SHOWER_PHOTO_SOURCE.bytes);
  const view = new DataView(rawGlb.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, rawGlb.byteLength, true);
  view.setUint32(12, 4, true);
  view.setUint32(16, 0x4e4f534a, true);
  rawGlb.set(new TextEncoder().encode('{}  '), 20);
  view.setUint32(24, rawGlb.byteLength - 32, true);
  view.setUint32(28, 0x004e4942, true);
  await expect(runD1FShowerGlassSourceVerifiedWebGL({ ...api, rawGlb }))
    .rejects.toThrow('D1F_SHOWER_PHOTO_SOURCE_OR_VARIANT_INVALID');
  expect(calls()).toEqual({ parseCount: 0, gpuCount: 0 });
});

test('never accepts a separately parsed GLTF object as authenticated source', async () => {
  const { api, calls } = reader();
  const arbitraryParsedScene = {
    scenes: Array.from({ length: 124 }, () => ({ isObject3D: true })),
    parser: { associations: new Map() },
  };
  await expect(runD1FShowerGlassSourceVerifiedWebGL({
    ...api, gltf: arbitraryParsedScene,
    rawGlb: new Uint8Array(64),
  })).rejects.toThrow('D1F_SHOWER_WEBGL_RUNNER_REJECTED');
  expect(calls()).toEqual({ parseCount: 0, gpuCount: 0 });
});

test('missing a real renderer or source camera rejects rather than minting production evidence', async () => {
  const { api } = reader();
  for (const variant of [
    { camera: {} },
    { renderer: {} },
    { width: 0 },
    { height: 0 },
    { loader: {} },
  ]) {
    await expect(runD1FShowerGlassSourceVerifiedWebGL({
      ...api, rawGlb: new Uint8Array(D1F_SHOWER_PHOTO_SOURCE.bytes), ...variant,
    })).rejects.toThrow('D1F_SHOWER_WEBGL_RUNNER_REJECTED');
  }
});

const sourceFixture = () => {
  const scenes = Array.from({ length: 124 }, () => null as any);
  const roots: Group[] = [];
  for (let i = 120; i <= 123; i++) {
    const scene = new Group();
    const root = new Group();
    root.name = 'EXACT_ORIGINAL_SOURCE_ROOT_' + i;
    scene.add(root);
    roots.push(root);
    scenes[i] = scene;
  }
  return { gltf: { scenes }, roots };
};

test('temporary lighting matches the real private viewer, leaves all four source roots unchanged', () => {
  const { gltf, roots } = sourceFixture();
  const originalChildren = gltf.scenes.slice(120, 124).map((scene: Group) => scene.children.slice());
  const undo = mountD1FShowerViewerPresentationLights(gltf);
  for (let i = 120; i <= 123; i++) {
    const scene: Group = gltf.scenes[i];
    expect(scene.children[0]).toBe(roots[i - 120]);
    expect(scene.children).toHaveLength(3);
    const ambient = scene.children[1], key = scene.children[2];
    expect(ambient).toBeInstanceOf(HemisphereLight);
    expect(key).toBeInstanceOf(DirectionalLight);
    expect((ambient as HemisphereLight).intensity).toBe(2.2);
    expect((key as DirectionalLight).intensity).toBe(2.0);
    expect(key.position.toArray()).toEqual([8, 14, 10]);
    expect((ambient as HemisphereLight).color.getHex()).toBe(0xffffff);
    expect((ambient as HemisphereLight).groundColor.getHex()).toBe(0x777777);
    expect((key as DirectionalLight).color.getHex()).toBe(0xffffff);
  }
  undo();
  undo(); // Safe even if an exception path already removed the lights.
  for (let i = 120; i <= 123; i++) {
    const scene: Group = gltf.scenes[i];
    expect(scene.children).toEqual(originalChildren[i - 120]);
    expect(scene.children[0].parent).toBe(scene);
    expect(scene.children).toHaveLength(1);
  }
});

test('lighting staging fails closed on tampered source root and rolls back earlier scenes', () => {
  const { gltf, roots } = sourceFixture();
  const scene122: Group = gltf.scenes[122];
  scene122.remove(roots[2]);
  expect(() => mountD1FShowerViewerPresentationLights(gltf))
    .toThrow('D1F_SHOWER_WEBGL_RUNNER_REJECTED');
  for (const idx of [120, 121, 123]) {
    expect(gltf.scenes[idx].children).toHaveLength(1);
    expect(gltf.scenes[idx].children[0].name).toBe('EXACT_ORIGINAL_SOURCE_ROOT_' + idx);
  }
  expect(scene122.children).toHaveLength(0);
  const short = sourceFixture().gltf;
  short.scenes.pop();
  expect(() => mountD1FShowerViewerPresentationLights(short))
    .toThrow('D1F_SHOWER_WEBGL_RUNNER_REJECTED');
});

test('presentation lighting never claims authenticated pixels or modifies materials', () => {
  const { gltf, roots } = sourceFixture();
  const before = roots.map(r => ({ name: r.name, children: r.children.length }));
  const undo = mountD1FShowerViewerPresentationLights(gltf);
  expect(roots.map(r => ({ name: r.name, children: r.children.length }))).toEqual(before);
  undo();
  expect(roots.map(r => ({ name: r.name, children: r.children.length }))).toEqual(before);
  expect(gltf).not.toHaveProperty('authenticatedPrivateViewerVerifiedByRunner');
  expect(gltf).not.toHaveProperty('humanReview');
});

test('real Three GLTFLoader 124-scene parse produces Group scenes and accepts reversible viewer lighting', async () => {
  // Actual GLTFLoader r185 scene semantics; synthetic THREE.Scene stand-ins
  // erroneously passed the original test but failed for every real source GLB.
  const gltfJson={
    asset:{version:'2.0'},
    scene:120,
    nodes:Array.from({length:124},(_,i)=>({name:'SYNTHETIC_SOURCE_NODE_'+i})),
    scenes:Array.from({length:124},(_,i)=>({nodes:[i],name:'SCENE_'+i})),
  };
  const parsed=await new GLTFLoader().parseAsync(JSON.stringify(gltfJson),'');
  expect(parsed.scenes).toHaveLength(124);
  for(let i=120;i<=123;i++){
    expect(parsed.scenes[i]).toBeInstanceOf(Group);
    expect(parsed.scenes[i].isGroup).toBe(true);
    expect((parsed.scenes[i] as any).isScene).not.toBe(true);
    expect(parsed.scenes[i].children).toHaveLength(1);
  }
  const originals=parsed.scenes.slice(120,124).map(scene=>scene.children[0]);
  const undo=mountD1FShowerViewerPresentationLights(parsed);
  for(let i=120;i<=123;i++){
    expect(parsed.scenes[i].children).toHaveLength(3);
    expect(parsed.scenes[i].children[0]).toBe(originals[i-120]);
    expect(parsed.scenes[i].children[1]).toBeInstanceOf(HemisphereLight);
    expect(parsed.scenes[i].children[2]).toBeInstanceOf(DirectionalLight);
  }
  undo();
  for(let i=120;i<=123;i++){
    expect(parsed.scenes[i].children).toEqual([originals[i-120]]);
  }
});
