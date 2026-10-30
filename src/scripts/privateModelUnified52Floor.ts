import type { Object3D } from 'three';
import { loadedModelSha256 } from './privateModelSourceCards';
import type { MainViewFloor } from './privateModelMainViewScope';

// One original, exact 52-scene source and one protected candidate.
// No generated floor geometry, no cloned node/parent bindings and no CURRENT grant.
export const HI20_UNIFIED52_ID = 'ylisrinne-d-c80-hi20-unified52-both-sc51-work-test-20261030';
export const HI20_UNIFIED52_SHA = '15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
export const HI20_UNIFIED52_SIZE = 15338932;
export const HI20_UNIFIED52_SCENES: Readonly<Record<MainViewFloor, number>> =
  Object.freeze({ '1F': 50, '2F': 48, BOTH: 51 });
const SCENES = {
  '1F': { index: 50, roots: 50, name: 'HI20_50SCENE_K17_WP6_WP8_G3_C043_C027_C045_C049_K14_COMBINED_1F_WORK_TEST_HOST_HOLD_NONCURRENT' },
  '2F': { index: 48, roots: 39, name: 'D_C80R2_HI20_P6_C012_C029_C035_C046_C047_C048_C043_WHITE_WP6_WP8_G3_2F_WORK_TEST_HOST_HOLD_NONCURRENT_K17_1125MM_AB_UNVERIFIED_WORK_TEST' },
  BOTH: { index: 51, roots: 84, name: 'HI20_50SCENE_K17_WP6_WP8_G3_C043_C027_C045_C049_K14_COMBINED_BOTH_WORK_TEST_HOST_HOLD_NONCURRENT' },
} as const;

type Loaded = {
  scene: Object3D;
  scenes: Object3D[];
  parser?: { json?: any };
};
const fail = (reason: string): never => { throw new Error('HI20_UNIFIED52_FAIL_CLOSED: ' + reason); };

export function resolveHi20Unified52Scenes(gltf: Loaded, sha: string | null) {
  if (sha !== HI20_UNIFIED52_SHA) fail('original GLB SHA mismatch');
  const json = gltf.parser?.json;
  if (json?.asset?.version !== '2.0' || json.scene !== 0 ||
      json?.asset?.extras?.current !== false || json?.asset?.extras?.asBuilt !== false ||
      !Array.isArray(json.scenes) || json.scenes.length !== 52 ||
      !Array.isArray(gltf.scenes) || gltf.scenes.length !== 52)
    fail('source GLB structure or noncurrent status mismatch');
  const resolved = {} as Record<MainViewFloor, Object3D>;
  for (const floor of ['1F', '2F', 'BOTH'] as const) {
    const contract = SCENES[floor], source = json.scenes[contract.index];
    const scene = gltf.scenes[contract.index];
    if (!scene || source?.name !== contract.name || scene.name !== contract.name ||
        !Array.isArray(source.nodes) || source.nodes.length !== contract.roots ||
        new Set(source.nodes).size !== contract.roots ||
        scene.children.length !== contract.roots ||
        source.extras?.current !== false || source.extras?.asBuilt !== false ||
        source.extras?.stage !== 'WORK_TEST')
      fail(floor + ' original scene/roots/status mismatch');
    resolved[floor] = scene;
  }
  return resolved;
}

export function createHi20Unified52FloorRuntime(args: {
  gltf: Loaded;
  mount: (scene: Object3D) => void;
  mounted: () => Object3D | null;
}) {
  const sha = loadedModelSha256(args.gltf);
  const scenes = resolveHi20Unified52Scenes(args.gltf, sha);
  let active = false, disposed = false, floor: MainViewFloor = 'BOTH';
  const expectedMounted = () =>
    Object.values(scenes).some(scene => args.mounted() === scene);
  return {
    available: true,
    isUnified52: true,
    sourceModel: 'D_C80' as const,
    sourceSha256: sha,
    defaultScene: scenes.BOTH,
    get selectedScene() { return scenes[floor]; },
    get sceneIndex() { return HI20_UNIFIED52_SCENES[floor]; },
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
    enforce() { /* Original scene roots remain unfiltered. */ },
    referenceCandidates() { return []; }, // no inferred cross-floor silhouettes
    dispose() { disposed = true; active = false; },
  };
}
