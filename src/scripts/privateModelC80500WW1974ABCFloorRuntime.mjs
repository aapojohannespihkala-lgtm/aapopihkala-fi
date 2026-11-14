import { C80_437_SCENES } from './privateModelC80437SourceProfile.mjs';
import {
  C80_500_GLB_SHA256, C80_500_VIEWER_ROLES, C80_500_ABC_ROOT,
  resolveC80500ABCScenes, resolveC80500ABCSceneIndex, isC80500ABCSourceScene,
} from './privateModelC80500WW1974ABCSourceProfile.mjs';

// Source-exact opt-in floor/technical review for C80 500.
// Never substitutes 1974 drawing anchors for surveyed routes or sourceLinks.
export function createC80500ABCFloorRuntime({ gltf, sha, mount, mounted }) {
  if (typeof mount !== 'function' || typeof mounted !== 'function')
    throw new Error('C80_500_MOUNT_CONTRACT');
  const scenes = resolveC80500ABCScenes(gltf, sha);
  if (!scenes) throw new Error('C80_500_SOURCE_SCENE_MISMATCH');
  let floor = 'BOTH', glazing = 'CLOSED', cutaway = false, sceneIndex = 496;
  let active = false, disposed = false;
  const mountedHere = () => Object.values(scenes).includes(mounted());
  const switchTo = (nextFloor, nextGlazing, nextCutaway) => {
    if (disposed || !mountedHere() || !['1F', '2F', 'BOTH'].includes(nextFloor) ||
        !['CLOSED', 'ONE_OPEN', 'STACKED'].includes(nextGlazing) ||
        typeof nextCutaway !== 'boolean' ||
        (nextFloor === '1F' && (nextGlazing !== 'CLOSED' || nextCutaway)) ||
        (nextCutaway && (nextFloor !== 'BOTH' || nextGlazing !== 'CLOSED'))) return null;
    const nextIndex = resolveC80500ABCSceneIndex(nextFloor, nextGlazing, nextCutaway);
    if (nextIndex === null || !scenes[nextIndex]) return null;
    const wasActive = active;
    active = false;
    try { mount(scenes[nextIndex]); } finally { active = wasActive; }
    if (mounted() !== scenes[nextIndex]) throw new Error('C80_500_SCENE_MOUNT_MISMATCH');
    floor = nextFloor; glazing = nextGlazing; cutaway = nextCutaway; sceneIndex = nextIndex;
    let included = 0;
    scenes[nextIndex].traverse?.(obj => { if (obj?.isMesh) included++; });
    return { included, exceptions: [] };
  };
  return {
    available: true, isC80R2Chain: true, isC80500WWABC: true,
    chainLabel: 'C80 500: A-C L100, L150 + Savo (WORK_TEST_HOST_HOLD)',
    floorSceneSource: 'C80_500_ABC_WW_SOURCE',
    sourceModel: 'D_C80', sourceSha256: sha,
    floorSceneNames: {
      '1F': scenes[495].name, '2F': scenes[488].name, BOTH: scenes[496].name,
    },
    supportsFirstFloor: true, defaultScene: scenes[496],
    get selectedScene() { return scenes[sceneIndex]; },
    get sceneIndex() { return sceneIndex; },
    get active() { return active; },
    get floor() { return floor; },
    get glazing() { return glazing; },
    get cutaway() { return cutaway; },
    get stairStatus() { return 'HOST_HOLD'; },
    get publicationStatus() { return 'NOT_AUTHORIZED'; },
    apply(next, nextGlazing = glazing) {
      const result = switchTo(next, next === '1F' ? 'CLOSED' : nextGlazing,
        next === 'BOTH' ? cutaway : false);
      if (result) active = true;
      return result;
    },
    setGlazing(next) { return switchTo(floor, next, cutaway); },
    setCutaway(enabled) {
      return typeof enabled === 'boolean' ? switchTo(floor, glazing, enabled) : null;
    },
    restore() {
      if (disposed) return;
      if (mountedHere()) mount(scenes[496]);
      floor = 'BOTH'; glazing = 'CLOSED'; cutaway = false; sceneIndex = 496; active = false;
    },
    enforce() {},
    referenceCandidates() { return []; },
    dispose() { disposed = true; active = false; },
  };
}
const HISTORICAL_TECHNICAL_ROOTS = new Set(Object.values(C80_437_SCENES)
  .flatMap(scene => scene.review ?? []));
const NEW_TECHNICAL_ROOTS = new Set([12193, 12194, 12224, 12228, 12230, C80_500_ABC_ROOT]);

/** 500 review only: A-C and L150 remain sewer, not an approved physical water route. */
export function c80500ABCReviewProfile(json, sha, sceneIndex) {
  if (!Number.isInteger(sceneIndex) ||
      !isC80500ABCSourceScene(json, sha, sceneIndex)) return null;
  const roots = json.scenes[sceneIndex].nodes
    .filter(node => HISTORICAL_TECHNICAL_ROOTS.has(node) || NEW_TECHNICAL_ROOTS.has(node));
  if (!roots.length) return null;
  return {
    count: 500, floors: { '1F': 350, '2F': 351, BOTH: 352 },
    scenes: { [sceneIndex]: { name: json.scenes[sceneIndex].name } },
    roots: { [sceneIndex]: roots.map(node => ({ node, name: json.nodes[node].name })) },
  };
}
