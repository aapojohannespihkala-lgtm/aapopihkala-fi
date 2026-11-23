/**
 * SOURCE_ONLY receipt for the R33 D2F kitchen-mixer visual connector COW.
 * The package is NOT a published viewer candidate, a sourceLinks grant, a
 * physical plumbing-port claim, or CURRENT/as-built approval.
 *
 * Caller supplies the SHA256 of the same fully loaded, authenticated GLB bytes
 * whose parsed JSON is supplied below. Never infer identity from a filename.
 */
import { C80_R33_SOURCE, C80_R33_VIEWS } from './privateModelC80R31ReviewRuntime.mjs';
import { c80R31Scene752RootsFnv32 } from './privateModelC80R31Scene752SourceReceipt.mjs';

export const R33_MIXER_2F_COW_SOURCE = Object.freeze({
  glbSha256: 'dd33b283971cb039f0fc01982f5fce3e304647be331077913239e9a806fd0135',
  glbBytes: 64701664,
  zipDriveId: '11pZ-J8DeOzrpvNfiJcUVwl8xSKRrGwQ3',
  zipSha256: 'f6baca441398aabf2ba001ec0d5248c0a11114c5be18d34d6062b00cd70b3f74',
  baseGlbSha256: C80_R33_SOURCE.glbSha256,
  sceneCount: 824,
  originalSceneCount: C80_R33_SOURCE.sceneCount,
  originalNodeCount: C80_R33_SOURCE.nodeCount,
  originalMeshCount: C80_R33_SOURCE.meshCount,
  mixerConnectorRoot: 13472,
  coldWaterNode: 13470,
  hotWaterNode: 13471,
  coldWaterMesh: 5160,
  hotWaterMesh: 5161,
  // These remain source-only visual connections. No actual SKU or port verified.
  physicalPortVerified: false,
  sourceLinksBound: false,
  humanReview: 'NOT_RUN',
});

const views = Object.freeze([
  { inherited: C80_R33_VIEWS.upperNormal, added: 822, role: '2F_NORMAL', plexi: true },
  { inherited: C80_R33_VIEWS.upperService, added: 823, role: '2F_SERVICE', plexi: false },
]);
const canonicalViews = Object.freeze(Object.values(C80_R33_VIEWS));
const unique = roots => Array.isArray(roots) && roots.every(Number.isInteger) && new Set(roots).size === roots.length;
const validOriginal = (json, view) => {
  const scene = json.scenes[view.sceneIndex];
  return scene?.name === view.name && unique(scene?.nodes) &&
    scene.nodes.length === view.rootCount &&
    c80R31Scene752RootsFnv32(scene.nodes) === view.rootFnv32 &&
    scene.nodes.includes(11625) === view.plexi &&
    [13843, 13844, 13845].every(n => scene.nodes.includes(n)) &&
    [12643, 9199, 9200].every(n => !scene.nodes.includes(n)) &&
    scene?.extras?.current !== true && scene?.extras?.asBuilt !== true;
};

/**
 * Pure strict source receipt. A valid result authorizes *only* further
 * authenticated preview integration review, not production publication.
 *
 * Rejects a guessed scene name, wrong SHA, lost original R33 roots, a
 * relocated old door, missing plexi, source connector reparenting, and all
 * inherited R32H views masquerading as scenes 822/823.
 */
export function r33Mixer2FSceneReceipt({ json, loadedGlbSha256, sceneIndex } = {}) {
  if (loadedGlbSha256 !== R33_MIXER_2F_COW_SOURCE.glbSha256) return null;
  const view = views.find(v => v.added === sceneIndex);
  if (!view || json?.scene !== 292 || json?.scenes?.length !== 824 ||
      json?.nodes?.length !== C80_R33_SOURCE.nodeCount ||
      json?.meshes?.length !== C80_R33_SOURCE.meshCount ||
      json?.materials?.length !== C80_R33_SOURCE.materialCount ||
      json?.accessors?.length !== C80_R33_SOURCE.accessorCount ||
      json?.bufferViews?.length !== C80_R33_SOURCE.bufferViewCount) return null;
  const asset = json.asset?.extras;
  if (asset?.ModelStage !== 'WORK_TEST' || asset?.current !== false ||
      asset?.asBuilt !== false || asset?.HUMAN_REVIEW !== 'NOT_RUN' ||
      !canonicalViews.every(v => validOriginal(json, v))) return null;

  // Validate BOTH the normal and service deltas even when only one is viewed.
  // A forged/mismatched sibling cannot be hidden by switching scenes.
  const bothDeltasValid = views.every(candidate => {
    const prev = json.scenes[candidate.inherited.sceneIndex];
    const next = json.scenes[candidate.added];
    return typeof next?.name === 'string' &&
      next.name.endsWith('__scene' + candidate.added) &&
      next.name.includes('WORK_TEST_HOST_HOLD') &&
      next.name.includes('2F') && unique(next?.nodes) &&
      next.nodes.length === prev.nodes.length + 1 &&
      next.nodes.at(-1) === R33_MIXER_2F_COW_SOURCE.mixerConnectorRoot &&
      prev.nodes.every((id, i) => next.nodes[i] === id) &&
      next.nodes.includes(11625) === candidate.plexi &&
      next.extras?.current !== true && next.extras?.asBuilt !== true;
  });
  if (!bothDeltasValid) return null;
  const connector = json.nodes[13472], cold = json.nodes[13470], hot = json.nodes[13471];
  if (!unique(connector?.children) || connector.children.length !== 2 ||
      connector.children[0] !== 13470 || connector.children[1] !== 13471 ||
      cold?.mesh !== 5160 || hot?.mesh !== 5161 ||
      next.nodes.some(n => n === 13470 || n === 13471)) return null;

  return Object.freeze({
    status: 'SOURCE_ONLY',
    workStage: 'WORK_TEST/HOST_HOLD',
    sourceGlbSha256: loadedGlbSha256,
    baseGlbSha256: C80_R33_SOURCE.glbSha256,
    sceneIndex,
    sceneRole: view.role,
    floor: '2F',
    addedSourceRoot: 13472,
    connectorLeaves: Object.freeze([13470, 13471]),
    physicalPortVerified: false,
    sourceLinksBound: false,
    humanReview: 'NOT_RUN',
  });
}
