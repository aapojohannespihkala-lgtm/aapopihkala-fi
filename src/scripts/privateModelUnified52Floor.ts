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
  parser?: { json?: any; associations?: Map<Object3D, { nodes?: number }> };
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


const BALCONY_GLASS_DISPLAY_OPACITY = 0.58; // Viewer-only WORK_TEST contrast, not a source material claim.
const BALCONY_GLASS_MESH = 205;
const BALCONY_GLASS_MATERIAL = 18;
const BALCONY_GLASS_NODES = Object.freeze({
  '2F': [...Array.from({ length: 8 }, (_, i) => 2221 + i), ...Array.from({ length: 5 }, (_, i) => 5943 + i)],
  BOTH: [...Array.from({ length: 8 }, (_, i) => i), ...Array.from({ length: 5 }, (_, i) => 5943 + i)],
});

// C80-020: the exact 52scene source already contains 8 upper and 5 lower panes.
// Do not construct a replacement mesh or mutate shared source materials. All
// panes must bind in BOTH scene48 and scene51 before any viewer-only styling.
export function applyHi20BalconyGlassVisibility(
  gltf: Loaded,
  scenes: Record<MainViewFloor, Object3D>,
  sha: string | null,
) {
  if (sha !== HI20_UNIFIED52_SHA) fail('balcony presentation source SHA mismatch');
  const source = gltf.parser?.json;
  const sourceMaterial = source?.materials?.[BALCONY_GLASS_MATERIAL];
  const sourceMesh = source?.meshes?.[BALCONY_GLASS_MESH];
  const rgba = sourceMaterial?.pbrMetallicRoughness?.baseColorFactor;
  if (sourceMaterial?.alphaMode !== 'BLEND' || sourceMaterial?.doubleSided !== true ||
      !Array.isArray(rgba) || rgba.length !== 4 ||
      Math.abs(rgba[3] - 0.24) > 0.0001 ||
      !Array.isArray(sourceMesh?.primitives) || sourceMesh.primitives.length !== 1 ||
      sourceMesh.primitives[0]?.material !== BALCONY_GLASS_MATERIAL)
    fail('balcony source material/mesh changed');
  const associations = gltf.parser?.associations;
  const staged = new Set<any>();
  const counts: Record<'2F' | 'BOTH', number> = { '2F': 0, BOTH: 0 };
  for (const floor of ['2F', 'BOTH'] as const) {
    const expected = new Map<number, string>();
    for (const id of BALCONY_GLASS_NODES[floor]) {
      const node = source?.nodes?.[id];
      const name = node?.name;
      if (node?.mesh !== BALCONY_GLASS_MESH || typeof name !== 'string' ||
          !(name.startsWith('G2_D_2F_BALCONY_GLASS_FIELD_20261024_PANEL_') ||
            name.startsWith('C80_020_D2F_WP3_LOWER_INNER_GLAZING_PANEL_')))
        fail(floor + ' source balcony node contract mismatch at ' + id);
      expected.set(id, name);
    }
    const seen = new Set<number>();
    scenes[floor].traverse((object: any) => {
      if (!object?.isMesh) return;
      let ancestor: any = object;
      let index: number | undefined;
      while (ancestor && index === undefined) {
        const candidate = associations?.get(ancestor)?.nodes;
        if (Number.isInteger(candidate)) index = candidate;
        ancestor = ancestor.parent;
      }
      // Loader clones may not retain parser associations. Name fallback is
      // allowed ONLY inside the exact-SHA and exact-scene/node roster.
      if (index === undefined) {
        const matches = [...expected].filter(([, name]) =>
          object.name === name || object.name.startsWith(name + '_'));
        if (matches.length === 1) index = matches[0][0];
      }
      if (index === undefined || !expected.has(index)) return;
      const name = expected.get(index)!;
      if (!(object.name === name || object.name.startsWith(name + '_')))
        return;
      if (seen.has(index)) fail(floor + ' duplicated balcony pane ' + index);
      seen.add(index);
      staged.add(object);
    });
    counts[floor] = seen.size;
  }
  // Incomplete mapping is not grounds to hide an existing pane or block the
  // original model: fall back to untouched source, leave visual review open.
  if (counts['2F'] !== 13 || counts.BOTH !== 13)
    return { applied: false, counts, opacity: null };
  for (const mesh of staged) {
    const material = mesh.material;
    if (Array.isArray(material) || !material ||
        typeof material.clone !== 'function' ||
        typeof material.opacity !== 'number' ||
        Math.abs(material.opacity - 0.24) > 0.0001 ||
        !material.transparent)
      return { applied: false, counts, opacity: null };
  }
  for (const mesh of staged) {
    const material = mesh.material.clone();
    material.opacity = BALCONY_GLASS_DISPLAY_OPACITY;
    material.transparent = true;
    material.depthWrite = false;
    material.needsUpdate = true;
    mesh.material = material; // Copy-on-write, geometry/sourceLinks untouched.
  }
  return { applied: true, counts, opacity: BALCONY_GLASS_DISPLAY_OPACITY };
}

export function createHi20Unified52FloorRuntime(args: {
  gltf: Loaded;
  mount: (scene: Object3D) => void;
  mounted: () => Object3D | null;
}) {
  const sha = loadedModelSha256(args.gltf);
  const scenes = resolveHi20Unified52Scenes(args.gltf, sha);
  const balconyGlassPresentation = applyHi20BalconyGlassVisibility(args.gltf, scenes, sha);
  let active = false, disposed = false, floor: MainViewFloor = 'BOTH';
  const expectedMounted = () =>
    Object.values(scenes).some(scene => args.mounted() === scene);
  return {
    available: true,
    isUnified52: true,
    sourceModel: 'D_C80' as const,
    sourceSha256: sha,
    balconyGlassPresentation,
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
