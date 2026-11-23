import { test, expect, chromium } from '@playwright/test';
import { build } from 'esbuild';

// Real Three.js GLTFLoader + Chromium WebGL, synthetic signed-index fixture.
// Not authenticated original R32H GLB, production viewer or physical proof.
const bundleSource = `
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { C80_R32H_SOURCE as S, C80_R32H_VIEWS } from './src/scripts/privateModelC80R31ReviewRuntime.mjs';
import { r32hKitchenWastewaterClashSelectionEntries as warning }
  from './src/scripts/privateModelR32HKitchenWastewaterClashGuard.mjs';

const require = (test, message) => { if (!test) throw new Error(message); };
const ids = [13310, 13314, 13315, 13316, 13317];
const meshes = [3709, 4429, 4430, 4431, 4432];
const names = [
  'M5_VV2015_D2F_KITCHEN_V75_ALAS_FLOOR_APPROACH_SC312_313_OPEN_HOST_HOLD_D2F_KITCHEN_WASTE_CLASSIFY_VIEMARI_COW',
  'D2F_KITCHEN_2026_PHOTO_WHITE_HORIZONTAL_TO_TRAP_D2F_KITCHEN_WASTE_CLASSIFY_VIEMARI_COW',
  'D2F_KITCHEN_2026_PHOTO_WHITE_VERTICAL_U_BEND_D2F_KITCHEN_WASTE_CLASSIFY_VIEMARI_COW',
  'D2F_KITCHEN_2026_PHOTO_GREY_ELBOW_TO_EXISTING_V75_STUB_D2F_KITCHEN_WASTE_CLASSIFY_VIEMARI_COW',
  'D2F_KITCHEN_2026_PHOTO_APPLIANCE_GREY_BRANCH_TO_WHITE_TRAP_D2F_KITCHEN_WASTE_CLASSIFY_VIEMARI_COW',
];
const parent2015B = 'V93_IV_B_MJ01_REV2_TECH_2F_EXCLUDE_HIST2015_HIGH_WALL_P02_COW_P02_COW_R24_L12_WW_SEMANTIC_COW_ROOT_D2F_KITCHEN_WASTE_SEMANTIC_PARENT_COW_E220S_ROOF_HOST_WT';
const parent2015U = 'R31_T110_D2F_VESI_DUPLICATE_REMOVED_KEEP_VIEMARI_WT_HOLD';
const parent2026 = 'D2F_KITCHEN_2026_PHOTO_WASTE_VISIBLE_TRAP_U_ELBOW_APPLIANCE_HOSE_ROOT_WORK_TEST_D2F_KITCHEN_WASTE_SEMANTIC_PARENT_COW';
function gltfJson() {
  const positions = new Float32Array([0,0,0, 1,1,1, 0.5,0.2,0.1, 0.6,0.8,0.7]);
  let binary = '';
  for (const byte of new Uint8Array(positions.buffer)) binary += String.fromCharCode(byte);
  const json = {
    asset: { version: '2.0', generator: 'synthetic-index-contract-not-original-GLB' },
    scene: 814,
    scenes: Array.from({ length: S.sceneCount }, () => ({ name: 'unbound', nodes: [] })),
    nodes: Array.from({ length: S.nodeCount }, () => ({})),
    meshes: Array.from({ length: S.meshCount }, () => ({})),
    buffers: [{ byteLength: positions.byteLength,
      uri: 'data:application/octet-stream;base64,' + btoa(binary) }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: positions.byteLength, target: 34962 }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 4, type: 'VEC3',
      min: [0,0,0], max: [1,1,1] }],
    materials: [{ doubleSided: true, pbrMetallicRoughness: {
      baseColorFactor: [0.3,0.5,0.7,1], metallicFactor: 0, roughnessFactor: 1 } }],
  };
  json.nodes[13358] = { name: parent2015B, children: [13310] };
  json.nodes[13535] = { name: parent2015U, children: [13310] };
  json.nodes[13319] = { name: parent2026, children: [13314,13315,13316,13317] };
  for (let i=0; i<ids.length; i++) {
    json.nodes[ids[i]] = { name: names[i], mesh: meshes[i] };
    json.meshes[meshes[i]] = { primitives: [{ attributes: { POSITION: 0 }, material: 0 }] };
  }
  for (const [name, view] of Object.entries(C80_R32H_VIEWS)) {
    json.scenes[view.sceneIndex] = {
      name: view.name,
      nodes: [name.startsWith('upper') ? 13535 : 13358, 13319],
    };
  }
  return JSON.stringify(json);
}
window.verifyR32HKitchenLoader = async () => {
  const loader = new GLTFLoader(), raw = gltfJson();
  const gltf = await loader.parseAsync(raw, '');
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(128, 128, false);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 60);
  camera.position.set(3, 2, 5); camera.lookAt(0, 0, 0);
  const out = { scenes: [], nullBindings: 0, originalGlbLoaded: false,
    syntheticFixture: true, webgl: !!renderer.getContext() };
  try {
    for (const view of Object.values(C80_R32H_VIEWS)) {
      const scene = gltf.scenes[view.sceneIndex];
      const found = [];
      scene.traverse((o) => { if (o.isMesh && o.name === names[1]) found.push(o); });
      require(found.length === 1, 'SOURCE_MESH_COUNT_' + view.sceneIndex + '_' + found.length);
      const selected = found[0], originalName = selected.name;
      if (gltf.parser.associations.get(selected) == null) out.nullBindings++;
      const good = warning(gltf, S.glbSha256, view.sceneIndex, selected);
      require(good.length === 2, 'WARNING_MISSING_' + view.sceneIndex + '_' + JSON.stringify(good));
      require(warning(gltf, 'wrong-sha', view.sceneIndex, selected).length === 0,
        'BAD_SHA_ACCEPTED_' + view.sceneIndex);
      selected.name = 'UNRELATED_PIPE';
      require(warning(gltf, S.glbSha256, view.sceneIndex, selected).length === 0,
        'STALE_NAME_ACCEPTED_' + view.sceneIndex);
      selected.name = originalName;
      renderer.render(scene, camera);
      require(renderer.info.render.calls > 0, 'WEBGL_NO_DRAWCALLS_' + view.sceneIndex);
      out.scenes.push(view.sceneIndex);
    }
    // Loader source mesh associations are expected to be missing for scene clones.
    require(out.nullBindings > 0, 'GLTFLOADER_NULL_BINDING_NOT_REPRODUCED');
    const reloaded = await loader.parseAsync(raw, '');
    require(warning(reloaded, S.glbSha256, 814, gltf.scenes[814]).length === 0,
      'STALE_SOURCE_MODEL_ACCEPTED');
    out.reloadFailsClosed = true;
    out.glError = renderer.getContext().getError();
    return out;
  } finally {
    renderer.dispose();
    renderer.forceContextLoss();
  }
};
`;

test('R32H kitchen viemäri: real GLTFLoader missing binding stays source-gated in Chromium/WebGL', async () => {
  const bundle = await build({
    stdin: { contents: bundleSource, resolveDir: process.cwd(), sourcefile: 'r32h-kitchen-loader.mjs' },
    bundle: true, platform: 'browser', format: 'iife', target: 'es2022',
    write: false, logLevel: 'silent',
  });
  const browser = await chromium.launch({ headless: true, args: [
    '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  ] });
  try {
    const page = await browser.newPage();
    await page.goto('about:blank');
    await page.addScriptTag({ content: bundle.outputFiles[0]!.text });
    const result = await page.evaluate(() => (window as any).verifyR32HKitchenLoader());
    expect(result).toMatchObject({ scenes: [814,815,816,817],
      syntheticFixture: true, originalGlbLoaded: false, webgl: true,
      reloadFailsClosed: true, glError: 0 });
    expect(result.nullBindings).toBeGreaterThan(0);
  } finally { await browser.close(); }
});
