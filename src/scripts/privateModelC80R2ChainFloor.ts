import type { Object3D } from 'three';
import { loadedModelSha256 } from './privateModelSourceCards';
import { nameMatches, sameSourceName } from './privateModelSourceNodeAssociations.mjs';
import { resolveC80R2ChainFloorScenes } from './privateModelC80R2ChainScenes.mjs';
import type { MainViewFloor } from './privateModelMainViewScope';

// Original 1F/2F/BOTH scenes of the newest C80R2 successor GLB, resolved from
// the file itself (see privateModelC80R2ChainScenes.mjs). Only mounts existing
// scenes: no generated geometry, no CURRENT/as-built/host claim.

type Loaded = { scene: Object3D; scenes: Object3D[]; parser?: { json?: any } };
const fail = (reason: string): never => { throw new Error('C80R2_CHAIN_FAIL_CLOSED: ' + reason); };

export function resolveC80R2ChainScenes(gltf: Loaded) {
  const json = gltf.parser?.json;
  const indices = resolveC80R2ChainFloorScenes(json);
  if (!indices || !Array.isArray(gltf.scenes) || gltf.scenes.length !== json.scenes.length) return null;
  const scenes = {} as Record<MainViewFloor, Object3D>;
  for (const floor of ['1F', '2F', 'BOTH'] as const) {
    const index = indices[floor], source = json.scenes[index], scene = gltf.scenes[index];
    const roots: number[] = source.nodes;
    if (!scene || !sameSourceName(scene.name, source.name) ||
        scene.children.length < roots.length ||
        !roots.every((id, i) => nameMatches(scene.children[i], json.nodes?.[id])))
      return null;
    scenes[floor] = scene;
  }
  return { indices, scenes };
}

export function createC80R2ChainFloorRuntime(args: {
  gltf: Loaded;
  mount: (scene: Object3D) => void;
  mounted: () => Object3D | null;
}) {
  const resolved = resolveC80R2ChainScenes(args.gltf) ?? fail('floor scenes not resolved');
  const { indices, scenes } = resolved;
  const sha = loadedModelSha256(args.gltf);
  let active = false, disposed = false, floor: MainViewFloor = 'BOTH';
  const expectedMounted = () => Object.values(scenes).some(scene => args.mounted() === scene);
  return {
    available: true,
    isC80R2Chain: true,
    chainLabel: `C80R2 ${args.gltf.scenes.length}scene`,
    floorSceneSource: indices.source,
    floorSceneNames: indices.names,
    sourceModel: 'D_C80' as const,
    sourceSha256: sha,
    defaultScene: scenes.BOTH,
    get selectedScene() { return scenes[floor]; },
    get sceneIndex() { return indices[floor]; },
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
    referenceCandidates() { return []; },
    dispose() { disposed = true; active = false; },
  };
}
