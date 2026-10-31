import { createUnified64C024BalconyFloorPresentation } from './privateModelUnified64C024BalconyFloorPresentation.mjs';
import { createUnified64C048WallHeadsPresentation } from './privateModelUnified64C048WallHeadsPresentation.mjs';
import { createUnified64Kiv003Presentation } from './privateModelUnified64Kiv003Presentation.mjs';
import { createUnified64C026TerrainPresentation } from './privateModelUnified64C026TerrainPresentation.mjs';
import type { Object3D } from 'three';
import { loadedModelSha256 } from './privateModelSourceCards';
import type { MainViewFloor } from './privateModelMainViewScope';

// One immutable 64-scene G2b WORK_TEST source, three original scene mounts.
// This does not create geometry, publish CURRENT or grant host/as-built approval.
export const C80R2_UNIFIED64_ID =
  'ylisrinne-d-c80r2-unified64-c018-c050-1f2fboth-work-test-20261031';
export const C80R2_UNIFIED64_SHA =
  '22ddaac08a290bcaa38d2b9985e9e851c25d92d3da111134062dae13a96685e8';
export const C80R2_UNIFIED64_SIZE = 15545612;
export const C80R2_UNIFIED64_SCENES: Readonly<Record<MainViewFloor, number>> =
  Object.freeze({ '1F': 60, '2F': 62, BOTH: 63 });
const CONTRACT = {
  '1F': { index: 60, roots: 49, name: 'C80R2_C045_C020_C046_C030_C050_UNIFIED_1F_WORK_TEST_HOST_HOLD_NONCURRENT' },
  '2F': { index: 62, roots: 40, name: 'C80R2_C045_C020_C046_C030_C050_C018_PA1_PHOTO_R1_UNIFIED_2F_WORK_TEST_HOST_HOLD_NONCURRENT' },
  BOTH: { index: 63, roots: 84, name: 'C80R2_C045_C020_C046_C030_C050_C018_PA1_PHOTO_R1_UNIFIED_BOTH_WORK_TEST_HOST_HOLD_NONCURRENT' },
} as const;

type Loaded = { scene: Object3D; scenes: Object3D[]; parser?: { json?: any } };
const fail = (reason: string): never => { throw new Error('C80R2_UNIFIED64_FAIL_CLOSED: ' + reason); };

export function resolveC80R2Unified64Scenes(gltf: Loaded, sha: string | null) {
  if (sha !== C80R2_UNIFIED64_SHA) fail('source SHA mismatch');
  const json = gltf.parser?.json;
  if (json?.asset?.version !== '2.0' || json.scene !== 0 ||
      json?.asset?.extras?.current !== false || json?.asset?.extras?.asBuilt !== false ||
      !Array.isArray(json.scenes) || json.scenes.length !== 64 ||
      !Array.isArray(gltf.scenes) || gltf.scenes.length !== 64)
    fail('64-scene/noncurrent identity mismatch');
  const resolved = {} as Record<MainViewFloor, Object3D>;
  for (const floor of ['1F', '2F', 'BOTH'] as const) {
    const target = CONTRACT[floor], source = json.scenes[target.index];
    const scene = gltf.scenes[target.index];
    if (!scene || source?.name !== target.name || scene.name !== target.name ||
        !Array.isArray(source.nodes) || source.nodes.length !== target.roots ||
        new Set(source.nodes).size !== target.roots ||
        scene.children.length !== target.roots ||
        source.extras?.stage !== 'WORK_TEST' ||
        source.extras?.current !== false || source.extras?.asBuilt !== false)
      fail(floor + ' source roots/stage mismatch');
    resolved[floor] = scene;
  }
  return resolved;
}

export function createC80R2Unified64FloorRuntime(args: {
  gltf: Loaded;
  mount: (scene: Object3D) => void;
  mounted: () => Object3D | null;
}) {
  const sha = loadedModelSha256(args.gltf);
  const scenes = resolveC80R2Unified64Scenes(args.gltf, sha);
  // C80-042: exact-source reversible presentation only, no new GLB or mesh.
  const kiv003 = createUnified64Kiv003Presentation(args.gltf, sha);
  if (kiv003.available) kiv003.setCorrected(true);
  // Reuse the two existing G2b-verified C80-026 patches in 1F60/BOTH63.
  // Source-only WORK_TEST, no changes to shared GLB or any C042 KIV root.
  const c026Terrain = createUnified64C026TerrainPresentation(args.gltf, sha);
  if (c026Terrain.available) c026Terrain.setEnabled(true);
  // C80-024: owner-photo dark finish on existing 2F/BOTH balcony floor only.
  const c024BalconyFloor = createUnified64C024BalconyFloorPresentation(args.gltf, sha);
  if (c024BalconyFloor.available) c024BalconyFloor.setEnabled(true);
  // C80-048: owner-white 1F/BOTH V11 wall-head presentation, unchanged GLB.
  const c048WhiteHeads = createUnified64C048WallHeadsPresentation(args.gltf, sha);
  if (c048WhiteHeads.available) c048WhiteHeads.setEnabled(true);
  let active = false, disposed = false, floor: MainViewFloor = 'BOTH';
  const expectedMounted = () =>
    Object.values(scenes).some(scene => args.mounted() === scene);
  return {
    available: true,
    isUnified64: true,
    sourceModel: 'D_C80' as const,
    sourceSha256: sha,
    get kiv003WindowSourceStatus() { return kiv003.corrected ? 'HIDDEN_UNHOSTED_REFERENCE' : 'SOURCE_UNCHANGED'; },
    get c026TerrainSourceStatus() { return c026Terrain.enabled ? 'G2B_C026_DONOR_PATCHES_1F_BOTH' : 'SOURCE_UNCHANGED'; },
    get c026TerrainPatchCount() { return c026Terrain.enabled ? c026Terrain.count : 0; },
    get c024BalconyFloorStatus() { return c024BalconyFloor.enabled ? 'DARK_PHOTO_FINISH_WORK_TEST' : 'SOURCE_UNCHANGED'; },
    get c048WhiteHeadsStatus() { return c048WhiteHeads.enabled ? 'OWNER_WHITE_V11_HEADS_WORK_TEST' : 'SOURCE_UNCHANGED'; },
    get c048WhiteHeadsCount() { return c048WhiteHeads.enabled ? c048WhiteHeads.count : 0; },
    defaultScene: scenes.BOTH,
    get selectedScene() { return scenes[floor]; },
    get sceneIndex() { return C80R2_UNIFIED64_SCENES[floor]; },
    get active() { return active; },
    get floor() { return floor; },
    get stairStatus() { return 'HOST_HOLD'; },
    get t04Status() { return 'SOURCE_SCENE_UNMODIFIED'; },
    apply(next: MainViewFloor) {
      if (disposed || !(next in scenes) || !expectedMounted()) return null;
      floor = next;
      args.mount(scenes[floor]);
      if (args.mounted() !== scenes[floor]) fail('scene mount mismatch');
      active = true;
      let included = 0;
      scenes[floor].traverse((node: any) => { if (node?.isMesh) included++; });
      return { included, exceptions: [] as Array<{ objectKey: string; reason: string }> };
    },
    restore() {
      if (disposed) return;
      if (expectedMounted()) args.mount(scenes.BOTH);
      active = false;
      floor = 'BOTH';
    },
    enforce() { /* Immutable source scene graph, never visibility inference. */ },
    referenceCandidates() { return []; },
    dispose() { c048WhiteHeads.dispose(); c024BalconyFloor.dispose(); c026Terrain.dispose(); kiv003.dispose(); disposed = true; active = false; },
  };
}
