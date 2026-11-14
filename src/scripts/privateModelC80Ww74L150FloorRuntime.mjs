import { C80_SUCC455_SAVO483_SCENES, c80Succ455Savo483Fnv32 } from './privateModelC80Succ455Room3Mj83SourceProfile.mjs';
import { nameMatches, sameSourceName } from './privateModelSourceNodeAssociations.mjs';

/**
 * 488-scene append-only successor of the exact 483-scene SUCC455+ROOM3+MJ83
 * WORK_TEST: the D 1F wastewater low point is connected with one assumed
 * DN110 drop to an assumed 1974 L150 common main under the building and to
 * the source-exact WW74 SITE150 site sewer. Original G2b ZIP (Drive) and
 * build script carry the provenance. WORK_TEST_HOST_HOLD, not CURRENT,
 * not as-built, sourceLinks NOT bound, publication only via WORK_TEST path.
 */
export const C80_WW74_L150_GLB_SHA256 = '51c8644ce704f42354c8dd39e663bcf87f70a6b51209dd123344650a5f24df5b';
export const C80_WW74_L150_GLB_BYTES = 55090484;
export const C80_WW74_L150_BASE_GLB_SHA256 = '9f24462311166d3c9e75bea5ff0aed8ada21d20094cd92e1b90f2de8895dd487';
export const C80_WW74_L150_ROOT = 12228;
export const C80_WW74_L150_NEW_NODES = Object.freeze([12225, 12226, 12227]);

// New scene -> [inherited source scene, floor, glazing, cutaway]
const NEW_SCENES = Object.freeze({
  483: Object.freeze([467, '1F', 'CLOSED', false]),
  484: Object.freeze([477, 'BOTH', 'CLOSED', false]),
  485: Object.freeze([479, 'BOTH', 'ONE_OPEN', false]),
  486: Object.freeze([481, 'BOTH', 'STACKED', false]),
  487: Object.freeze([482, 'BOTH', 'CLOSED', true]),
});
// Unchanged inherited 2F scenes (no drain below the 2F floor is shown there).
const INHERITED_2F = Object.freeze({
  476: Object.freeze(['2F', 'CLOSED', false]),
  478: Object.freeze(['2F', 'ONE_OPEN', false]),
  480: Object.freeze(['2F', 'STACKED', false]),
});
export const C80_WW74_L150_VIEWER_ROLES = Object.freeze({
  ...Object.fromEntries(Object.entries(NEW_SCENES).map(([i, [, floor, glazing, cutaway]]) =>
    [i, Object.freeze({ floor, glazing, cutaway })])),
  ...Object.fromEntries(Object.entries(INHERITED_2F).map(([i, [floor, glazing, cutaway]]) =>
    [i, Object.freeze({ floor, glazing, cutaway })])),
});

const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Source-JSON identity for one viewer scene of THIS exact SHA only. */
export function isC80Ww74L150SourceScene(json, sha, sceneIndex) {
  if (sha !== C80_WW74_L150_GLB_SHA256 || json?.scene !== 292 ||
      json?.scenes?.length !== 488 || json?.nodes?.length !== 12229 || json?.meshes?.length !== 4604) return false;
  const root = json.nodes[C80_WW74_L150_ROOT];
  if (root?.name !== 'M5_INTEGRATION_CLAUDE_WW_D1F_TO_SITE_SEWER_L150_WORK_TEST_HOST_HOLD' ||
      !equal(root.children, C80_WW74_L150_NEW_NODES) ||
      root.extras?.current !== false || root.extras?.asBuilt !== false ||
      root.extras?.sourceLinksBound !== false) return false;
  if (!C80_WW74_L150_NEW_NODES.every(n => Number.isInteger(json.nodes[n]?.mesh) &&
      /DRAIN/.test(json.nodes[n]?.name ?? ''))) return false;
  const scene = json.scenes[sceneIndex];
  if (Object.hasOwn(NEW_SCENES, sceneIndex)) {
    const [source, floor] = NEW_SCENES[sceneIndex];
    const e = scene?.extras?.ww74MainCofit;
    return e?.sourceScene === source && e.floor === floor && e.newRoot === C80_WW74_L150_ROOT &&
      e.sourceGlbSha256 === C80_WW74_L150_BASE_GLB_SHA256 && e.current === false && e.asBuilt === false &&
      e.stage === 'WORK_TEST_HOST_HOLD' &&
      equal(scene.nodes, [...json.scenes[source].nodes, C80_WW74_L150_ROOT]);
  }
  if (Object.hasOwn(INHERITED_2F, sceneIndex)) {
    const spec = C80_SUCC455_SAVO483_SCENES[sceneIndex];
    return !!spec && scene?.name === spec.name && Array.isArray(scene.nodes) &&
      c80Succ455Savo483Fnv32(scene.nodes) === spec.rootFnv && !scene.nodes.includes(C80_WW74_L150_ROOT);
  }
  return false;
}

export function resolveC80Ww74L150Scenes(gltf, sha) {
  const json = gltf?.parser?.json;
  if (sha !== C80_WW74_L150_GLB_SHA256 || gltf?.scenes?.length !== 488 || !json) return null;
  const result = {};
  for (const id of Object.keys(C80_WW74_L150_VIEWER_ROLES).map(Number)) {
    const source = json.scenes[id], rendered = gltf.scenes[id];
    if (!isC80Ww74L150SourceScene(json, sha, id) || !rendered || !sameSourceName(rendered.name, source.name) ||
        !Array.isArray(rendered.children) || rendered.children.length < source.nodes.length ||
        !source.nodes.every((node, i) => nameMatches(rendered.children[i], json.nodes[node]))) return null;
    result[id] = rendered;
  }
  return result;
}

export function resolveC80Ww74L150SceneIndex(floor, glazing = 'CLOSED', cutaway = false) {
  const ids = Object.entries(C80_WW74_L150_VIEWER_ROLES)
    .filter(([, r]) => r.floor === floor && (floor === '1F' || (r.glazing === glazing && r.cutaway === cutaway)));
  return ids.length === 1 ? Number(ids[0][0]) : null;
}

export function createC80Ww74L150FloorRuntime({ gltf, sha, mount, mounted }) {
  if (typeof mount !== 'function' || typeof mounted !== 'function') throw new Error('WW74_L150_MOUNT_CONTRACT');
  const scenes = resolveC80Ww74L150Scenes(gltf, sha);
  if (!scenes) throw new Error('WW74_L150_SOURCE_SCENE_MISMATCH');
  let floor = 'BOTH', glazing = 'CLOSED', cutaway = false, sceneIndex = 484, active = false, disposed = false;
  const mountedHere = () => Object.values(scenes).includes(mounted());
  const switchTo = (nextFloor, nextGlazing, nextCutaway) => {
    if (disposed || !mountedHere() || !['1F', '2F', 'BOTH'].includes(nextFloor) ||
        !['CLOSED', 'ONE_OPEN', 'STACKED'].includes(nextGlazing) || typeof nextCutaway !== 'boolean') return null;
    if (nextFloor === '1F' && (nextGlazing !== 'CLOSED' || nextCutaway)) return null;
    if (nextCutaway && (nextFloor !== 'BOTH' || nextGlazing !== 'CLOSED')) return null;
    const nextIndex = resolveC80Ww74L150SceneIndex(nextFloor, nextGlazing, nextCutaway);
    if (nextIndex === null || !scenes[nextIndex]) return null;
    const previousActive = active;
    active = false;
    try { mount(scenes[nextIndex]); } finally { active = previousActive; }
    if (mounted() !== scenes[nextIndex]) throw new Error('WW74_L150_SCENE_MOUNT_MISMATCH');
    floor = nextFloor; glazing = nextGlazing; cutaway = nextCutaway; sceneIndex = nextIndex;
    let included = 0;
    scenes[nextIndex].traverse?.(object => { if (object?.isMesh) included++; });
    return { included, exceptions: [] };
  };
  return {
    available: true, isC80R2Chain: true, isC80Ww74L150: true,
    chainLabel: 'C80 483 + viemärin L150-runko ja tonttiviemäri (488 WORK_TEST)',
    floorSceneSource: 'WW74_L150_EXACT_SOURCE',
    sourceModel: 'D_C80', sourceSha256: sha,
    floorSceneNames: { '1F': scenes[483].name, '2F': scenes[476].name, BOTH: scenes[484].name },
    supportsFirstFloor: true,
    defaultScene: scenes[484],
    get selectedScene() { return scenes[sceneIndex]; },
    get sceneIndex() { return sceneIndex; },
    get active() { return active; },
    get floor() { return floor; },
    get glazing() { return glazing; },
    get cutaway() { return cutaway; },
    get stairStatus() { return 'HOST_HOLD'; },
    get publicationStatus() { return 'NOT_AUTHORIZED'; },
    apply(next, nextGlazing = glazing) {
      const result = switchTo(next, next === '1F' ? 'CLOSED' : nextGlazing, next === 'BOTH' ? cutaway : false);
      if (result) active = true;
      return result;
    },
    setGlazing(next) { return switchTo(floor, next, cutaway); },
    setCutaway(enabled) { if (typeof enabled !== 'boolean') return null; return switchTo(floor, glazing, enabled); },
    restore() {
      if (disposed) return;
      if (mountedHere()) mount(scenes[484]);
      floor = 'BOTH'; glazing = 'CLOSED'; cutaway = false; sceneIndex = 484; active = false;
    },
    enforce() {}, referenceCandidates() { return []; },
    dispose() { disposed = true; active = false; },
  };
}
