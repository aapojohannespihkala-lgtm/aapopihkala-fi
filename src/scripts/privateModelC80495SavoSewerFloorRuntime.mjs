import { nameMatches, sameSourceName } from './privateModelSourceNodeAssociations.mjs';
import { C80_437_SCENES } from './privateModelC80437SourceProfile.mjs';

/** WORK_TEST_HOST_HOLD. C80 495 appends corrected Savo UV to 488 without changing its historical scenes. */
export const C80_495_GLB_SHA256 = 'cf4706c72f759965b1f363e1b8cf08700a8178ec882ed44e977355f7a58e3992';
export const C80_495_GLB_BYTES = 55157072;
export const C80_495_SEWER_ROOT = 12228;
export const C80_495_SAVO_ROOT = 12230;
export const C80_495_PARENT_SHA256 = '51c8644ce704f42354c8dd39e663bcf87f70a6b51209dd123344650a5f24df5b';
const NEW = Object.freeze({
  488: Object.freeze([476, '2F', 'CLOSED', false]),
  489: Object.freeze([484, 'BOTH', 'CLOSED', false]),
  490: Object.freeze([478, '2F', 'ONE_OPEN', false]),
  491: Object.freeze([485, 'BOTH', 'ONE_OPEN', false]),
  492: Object.freeze([480, '2F', 'STACKED', false]),
  493: Object.freeze([486, 'BOTH', 'STACKED', false]),
  494: Object.freeze([487, 'BOTH', 'CLOSED', true]),
});
export const C80_495_VIEWER_ROLES = Object.freeze({
  483: Object.freeze({ floor: '1F', glazing: 'CLOSED', cutaway: false }),
  ...Object.fromEntries(Object.entries(NEW).map(([id, [, floor, glazing, cutaway]]) =>
    [id, Object.freeze({ floor, glazing, cutaway })])),
});
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Fail closed unless every requested scene belongs to this exact SHA and provenance. */
export function isC80495SavoSewerSourceScene(json, sha, sceneIndex) {
  if (sha !== C80_495_GLB_SHA256 || json?.scene !== 292 ||
      json?.scenes?.length !== 495 || json?.nodes?.length !== 12231 ||
      json?.meshes?.length !== 4605) return false;
  const sewer = json.nodes[C80_495_SEWER_ROOT];
  const savo = json.nodes[C80_495_SAVO_ROOT];
  if (sewer?.name !== 'M5_INTEGRATION_CLAUDE_WW_D1F_TO_SITE_SEWER_L150_WORK_TEST_HOST_HOLD' ||
      !equal(sewer.children, [12225, 12226, 12227]) ||
      savo?.name !== 'SAVO_MJ83_OWNERPHOTO_CORRECTED_KEYPAD_ROOT_WORK_TEST_HOST_HOLD' ||
      !equal(savo.children, [12229]) || savo.extras?.asBuilt !== false ||
      json.nodes[12229]?.mesh !== 4604 || json.nodes[12229]?.extras?.current !== false) return false;
  const scene = json.scenes[sceneIndex];
  if (!scene) return false;
  if (sceneIndex === 483) return /D1F_TO_SITE_SEWER/.test(scene.name ?? '') &&
      scene.nodes.includes(C80_495_SEWER_ROOT) &&
      scene.nodes.includes(12224) && !scene.nodes.includes(C80_495_SAVO_ROOT);
  const spec = NEW[sceneIndex];
  if (!spec) return false;
  const [oldIndex, floor] = spec, parent = json.scenes[oldIndex], extra = scene.extras;
  if (!parent?.nodes || !parent.nodes.includes(12224) || !Array.isArray(scene.nodes) ||
      !String(scene.name).startsWith('C80_495_WW74_L150_SAVO_OWNERPHOTO_UV_COFIT_') ||
      extra?.cofitSource488Scene !== oldIndex ||
      extra?.cofitSavoPhotoUV !== true || extra?.cofitWW74L150 !== (floor === 'BOTH') ||
      extra?.sourceLinksBoundForNewSHA !== false ||
      extra?.sourceSewerGLBSHA256 !== C80_495_PARENT_SHA256 ||
      extra?.stage !== 'WORK_TEST_HOST_HOLD' || extra?.asBuilt !== false) return false;
  if (floor === 'BOTH' && !parent.nodes.includes(C80_495_SEWER_ROOT)) return false;
  if (floor === '2F' && parent.nodes.includes(C80_495_SEWER_ROOT)) return false;
  return equal(scene.nodes, parent.nodes.map(n => n === 12224 ? C80_495_SAVO_ROOT : n)) &&
    !scene.nodes.includes(12224);
}

export function resolveC80495SavoSewerScenes(gltf, sha) {
  const json = gltf?.parser?.json;
  if (sha !== C80_495_GLB_SHA256 || gltf?.scenes?.length !== 495 || !json) return null;
  const result = {};
  for (const sceneIndex of Object.keys(C80_495_VIEWER_ROLES).map(Number)) {
    const src = json.scenes[sceneIndex], rendered = gltf.scenes[sceneIndex];
    if (!isC80495SavoSewerSourceScene(json, sha, sceneIndex) ||
        !rendered || !sameSourceName(rendered.name, src.name) ||
        !Array.isArray(rendered.children) || rendered.children.length < src.nodes.length ||
        !src.nodes.every((node, i) => nameMatches(rendered.children[i], json.nodes[node]))) return null;
    result[sceneIndex] = rendered;
  }
  return result;
}
export function resolveC80495SavoSewerSceneIndex(floor, glazing = 'CLOSED', cutaway = false) {
  const eligible = Object.entries(C80_495_VIEWER_ROLES)
    .filter(([, role]) => role.floor === floor &&
      (floor === '1F' || (role.glazing === glazing && role.cutaway === cutaway)));
  return eligible.length === 1 ? Number(eligible[0][0]) : null;
}
export function createC80495SavoSewerFloorRuntime({ gltf, sha, mount, mounted }) {
  if (typeof mount !== 'function' || typeof mounted !== 'function')
    throw new Error('C80_495_MOUNT_CONTRACT');
  const scenes = resolveC80495SavoSewerScenes(gltf, sha);
  if (!scenes) throw new Error('C80_495_SOURCE_SCENE_MISMATCH');
  let floor = 'BOTH', glazing = 'CLOSED', cutaway = false, sceneIndex = 489;
  let active = false, disposed = false;
  const mountedHere = () => Object.values(scenes).includes(mounted());
  const switchTo = (nextFloor, nextGlazing, nextCutaway) => {
    if (disposed || !mountedHere() || !['1F', '2F', 'BOTH'].includes(nextFloor) ||
        !['CLOSED', 'ONE_OPEN', 'STACKED'].includes(nextGlazing) ||
        typeof nextCutaway !== 'boolean') return null;
    if (nextFloor === '1F' && (nextGlazing !== 'CLOSED' || nextCutaway)) return null;
    if (nextCutaway && (nextFloor !== 'BOTH' || nextGlazing !== 'CLOSED')) return null;
    const nextIndex = resolveC80495SavoSewerSceneIndex(nextFloor, nextGlazing, nextCutaway);
    if (nextIndex === null || !scenes[nextIndex]) return null;
    const wasActive = active;
    active = false;
    try { mount(scenes[nextIndex]); } finally { active = wasActive; }
    if (mounted() !== scenes[nextIndex]) throw new Error('C80_495_SCENE_MOUNT_MISMATCH');
    floor = nextFloor; glazing = nextGlazing; cutaway = nextCutaway; sceneIndex = nextIndex;
    let included = 0;
    scenes[nextIndex].traverse?.(obj => { if (obj?.isMesh) included++; });
    return { included, exceptions: [] };
  };
  return {
    available: true, isC80R2Chain: true, isC80495SavoSewer: true,
    chainLabel: 'C80 495: viemärin L150 + Savo UV (WORK_TEST_HOST_HOLD)',
    floorSceneSource: 'C80_495_SAVO_WW_SOURCE',
    sourceModel: 'D_C80', sourceSha256: sha,
    floorSceneNames: { '1F': scenes[483].name, '2F': scenes[488].name, BOTH: scenes[489].name },
    supportsFirstFloor: true, defaultScene: scenes[489],
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
    setCutaway(enabled) { return typeof enabled === 'boolean' ? switchTo(floor, glazing, enabled) : null; },
    restore() {
      if (disposed) return;
      if (mountedHere()) mount(scenes[489]);
      floor = 'BOTH'; glazing = 'CLOSED'; cutaway = false; sceneIndex = 489; active = false;
    },
    enforce() {}, referenceCandidates() { return []; },
    dispose() { disposed = true; active = false; },
  };
}
const C80_437_TECHNICAL_ROOTS = new Set(Object.values(C80_437_SCENES)
  .flatMap(scene => scene.review ?? []));
const LATER = new Set([12193, 12194, 12224, C80_495_SEWER_ROOT, C80_495_SAVO_ROOT]);
/** Review root 12224 only in preserved 1F scene; corrected root 12230 in all new scenes. */
export function c80495SavoSewerReviewProfile(json, sha, sceneIndex) {
  if (!Number.isInteger(sceneIndex) ||
      !isC80495SavoSewerSourceScene(json, sha, sceneIndex)) return null;
  const roots = json.scenes[sceneIndex].nodes
    .filter(n => C80_437_TECHNICAL_ROOTS.has(n) || LATER.has(n));
  if (!roots.length) return null;
  return {
    count: 495, floors: { '1F': 350, '2F': 351, BOTH: 352 },
    scenes: { [sceneIndex]: { name: json.scenes[sceneIndex].name } },
    roots: { [sceneIndex]: roots.map(node => ({ node, name: json.nodes[node].name })) },
  };
}
