// Protected WORK_TEST viewer bridge for the exact unmodified TATE4 + MJ62 + MJ63R2 GLB.
// This mounts glTF scenes, never duplicates geometry or bypasses source/auth gates.
import {
  TATE4_MJ6263_SOURCE_SHA256,
  TATE4_MJ6263_SCENES,
} from './privateModelTate4Mj62Mj63SourceProfile.mjs';
import {
  TATE4_MJ6263_GLAZING_STATES,
  resolveTate4Mj6263ViewerScene,
} from './privateModelTate4Mj6263SceneSelection.mjs';

const FLOORS = Object.freeze(['1F', '2F', 'BOTH']);
const reject = reason => { throw Error('M6263_VIEWER_FAIL_CLOSED: ' + reason); };

export function createM6263ExactFloorRuntime({ gltf, mount, mounted, loadedGlbSha256 }) {
  if (typeof mount !== 'function' || typeof mounted !== 'function' ||
      loadedGlbSha256 !== TATE4_MJ6263_SOURCE_SHA256 ||
      !Array.isArray(gltf?.scenes) || !gltf?.parser?.json)
    reject('source or viewer contract missing');
  const json = gltf.parser.json;
  const scenes = new Map();
  for (const [key, meta] of Object.entries(TATE4_MJ6263_SCENES)) {
    const index = Number(key);
    const checked = resolveTate4Mj6263ViewerScene({
      sourceJson: json, loadedGlbSha256, floor: meta.floor,
      glazingState: meta.glazing,
    });
    const scene = gltf.scenes[index], roots = json.scenes?.[index]?.nodes;
    if (!checked.ok || checked.sceneIndex !== index || !scene ||
        !Array.isArray(roots) || scene.children.length < roots.length)
      reject('scene ' + index + ' not source-exact and renderable');
    scenes.set(index, scene);
  }
  if (scenes.size !== 7 || gltf.scenes[355] !== scenes.get(355))
    reject('expected seven glTF opt-in scenes');
  let active = false, disposed = false, floor = 'BOTH', glazingState = 'CLOSED';
  const selected = (f = floor) => {
    const state = f === '1F' ? 'CLOSED' : glazingState;
    const result = resolveTate4Mj6263ViewerScene({
      sourceJson: json, loadedGlbSha256, floor: f, glazingState: state,
    });
    return result.ok ? result.sceneIndex : null;
  };
  const isMountedScene = () => [...scenes.values()].includes(mounted());
  const runtime = {
    available: true,
    isC80R2Chain: true, // Reuse existing source-scene camera/preset handling.
    isM6263Exact: true,
    chainLabel: 'TATE4 + MJ62 + MJ63R2',
    floorSceneSource: 'exact-glTF-SHA',
    sourceModel: 'D_C80',
    sourceSha256: TATE4_MJ6263_SOURCE_SHA256,
    defaultScene: scenes.get(355),
    get floorSceneNames() {
      return Object.fromEntries(FLOORS.map(f => [f, json.scenes[selected(f)]?.name ?? '']));
    },
    get selectedScene() { return scenes.get(selected()); },
    get sceneIndex() { return selected(); },
    get active() { return active; },
    get floor() { return floor; },
    get glazingState() { return glazingState; },
    get effectiveGlazingState() { return floor === '1F' ? 'CLOSED' : glazingState; },
    get stairStatus() { return 'HOST_HOLD'; },
    get t04Status() { return 'SOURCE_SCENE_UNMODIFIED'; },
    setGlazingState(next) {
      if (disposed || !TATE4_MJ6263_GLAZING_STATES.includes(next)) return false;
      glazingState = next;
      return true;
    },
    apply(next) {
      if (disposed || !FLOORS.includes(next) || !isMountedScene()) return null;
      const index = selected(next), scene = scenes.get(index);
      if (!scene) return null;
      mount(scene);
      if (mounted() !== scene) reject('scene mount mismatch');
      floor = next;
      active = true;
      let included = 0;
      scene.traverse(node => { if (node?.isMesh) included++; });
      return { included, exceptions: [] };
    },
    restore() {
      if (disposed) return;
      if (isMountedScene()) mount(scenes.get(355));
      active = false;
      floor = 'BOTH';
    },
    enforce() { /* Source roots and default292 remain unchanged. */ },
    referenceCandidates() { return []; },
    dispose() { disposed = true; active = false; },
  };
  return runtime;
}
