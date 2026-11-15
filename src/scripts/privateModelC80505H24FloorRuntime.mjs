import {C80_437_SCENES} from './privateModelC80437SourceProfile.mjs';
import {
  C80_505_GLB_SHA256,
  C80_505_VIEWER_ROLES,
  C80_505_H24_NEW_ROOT,
  resolveC80505H24Scenes,
  resolveC80505H24SceneIndex,
  isC80505H24SourceScene,
} from './privateModelC80505H24SourceProfile.mjs';

// Source-only C80 505 H24 WORK_TEST/PHYSICAL_HOST_HOLD runtime.
// This is a private opt-in adapter, NOT an index/Worker/catalog/publisher hookup.
export function createC80505H24FloorRuntime({ gltf, sha, mount, mounted }) {
  if (typeof mount !== 'function' || typeof mounted !== 'function')
    throw new Error('C80_505_MOUNT_CONTRACT');
  const scenes = resolveC80505H24Scenes(gltf, sha);
  if (!scenes) throw new Error('C80_505_SOURCE_SCENE_MISMATCH');
  let floor = 'BOTH', glazing = 'CLOSED', cutaway = false, sceneIndex = 501;
  let active = false, disposed = false;
  const mountedHere = () => Object.values(scenes).includes(mounted());
  const switchTo = (newFloor, newGlazing, newCutaway) => {
    if (disposed || !mountedHere() || !['1F', '2F', 'BOTH'].includes(newFloor) ||
        !['CLOSED', 'ONE_OPEN', 'STACKED'].includes(newGlazing) ||
        typeof newCutaway !== 'boolean' ||
        (newFloor === '1F' && (newGlazing !== 'CLOSED' || newCutaway)) ||
        (newCutaway && (newFloor !== 'BOTH' || newGlazing !== 'CLOSED')))
      return null;
    const nextIndex = resolveC80505H24SceneIndex(newFloor, newGlazing, newCutaway);
    if (nextIndex === null || !scenes[nextIndex]) return null;
    const beforeActive = active;
    active = false;
    try { mount(scenes[nextIndex]); } finally { active = beforeActive; }
    if (mounted() !== scenes[nextIndex])
      throw new Error('C80_505_SCENE_MOUNT_MISMATCH');
    floor = newFloor; glazing = newGlazing; cutaway = newCutaway; sceneIndex = nextIndex;
    let included = 0;
    scenes[nextIndex].traverse?.(object => { if (object?.isMesh) included++; });
    return { included, exceptions: [] };
  };
  return {
    available: true, isC80R2Chain: true, isC80505H24: true,
    chainLabel: 'C80 505: H24 4mm display clearance (WORK_TEST_HOST_HOLD)',
    floorSceneSource: 'C80_505_H24_SOURCE',
    sourceModel: 'D_C80', sourceSha256: sha,
    floorSceneNames: {
      '1F': scenes[500].name, '2F': scenes[488].name, BOTH: scenes[501].name,
    },
    supportsFirstFloor: true, defaultScene: scenes[501],
    get selectedScene() { return scenes[sceneIndex]; },
    get sceneIndex() { return sceneIndex; },
    get active() { return active; },
    get floor() { return floor; },
    get glazing() { return glazing; },
    get cutaway() { return cutaway; },
    get stairStatus() { return 'HOST_HOLD'; },
    get publicationStatus() { return 'NOT_AUTHORIZED'; },
    get physicalClearanceStatus() { return 'NOT_VERIFIED'; },
    apply(next, nextGlazing = glazing) {
      const r = switchTo(next, next === '1F' ? 'CLOSED' : nextGlazing,
        next === 'BOTH' ? cutaway : false);
      if (r) active = true;
      return r;
    },
    setGlazing(next) { return switchTo(floor, next, cutaway); },
    setCutaway(value) {
      return typeof value === 'boolean' ? switchTo(floor, glazing, value) : null;
    },
    restore() {
      if (disposed) return;
      if (mountedHere()) mount(scenes[501]);
      floor = 'BOTH'; glazing = 'CLOSED'; cutaway = false;
      sceneIndex = 501; active = false;
    },
    enforce() {},
    referenceCandidates() { return []; },
    dispose() { disposed = true; active = false; },
  };
}

// Technical review deliberately excludes H24 presentation frame 12238.
// The frame's assumed 4 mm offset does not verify WC maintenance clearance.
const HISTORICAL_MEP_ROOTS = new Set(Object.values(C80_437_SCENES).flatMap(scene => scene.review ?? []));
const MEP_REVIEW_ROOTS = new Set([...HISTORICAL_MEP_ROOTS, 12193, 12194, 12224, 12228, 12230, 12237]);
export function c80505H24ReviewProfile(json, sha, sceneIndex) {
  if (!Number.isInteger(sceneIndex) ||
      !isC80505H24SourceScene(json, sha, sceneIndex)) return null;
  const roots = json.scenes[sceneIndex].nodes.filter(node =>
    node !== C80_505_H24_NEW_ROOT && MEP_REVIEW_ROOTS.has(node));
  if (!roots.length) return null;
  return {
    count: 505, floors: { '1F': 350, '2F': 351, BOTH: 352 },
    scenes: { [sceneIndex]: { name: json.scenes[sceneIndex].name } },
    roots: { [sceneIndex]: roots.map(node => ({ node, name: json.nodes[node].name })) },
    physicalClaim: false, publicationAllowed: false,
  };
}
