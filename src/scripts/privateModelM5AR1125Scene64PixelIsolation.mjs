/**
 * Genuine original GLTFLoader nodes, reversible per-target isolation for
 * exact published M5A R1125 scene64. NOT a pixel result or release approval.
 */
import {
  M5A_R1125_NUMBERED_SOURCE,
  M5A_R1125_NUMBERED_SOURCE_IDS,
} from './privateModelM5AR1125NumberedScene64Review.mjs';

const ORIGINAL_ROOT = 'M5A_R1125_DIAMETER_SOURCE_SPLIT_WORK_TEST_ROOT_BABYLON_Y_UP';
const DONOR_ROOT = 'M5A_R1125_SOURCE_INDEX_NUMBERS_1_7_PRESENTATION_ONLY_Y_UP';
const error = (reason) => { throw new Error('M5A_R1125_SCENE64_PIXEL_SOURCE_INVALID:' + reason); };
const safeInt = value => Number.isInteger(value) && value >= 0;

export const M5A_R1125_SCENE64_SOURCE_PIXEL_TARGET_COUNT = 20;

/**
 * This requires the separately SHA-256-verified, exact raw GLB already parsed
 * by loadM5AR1125NumberedScene64Review. Never call on an arbitrary glTF.
 */
export function createM5AR1125Scene64PixelIsolation(gltf) {
  const json = gltf?.parser?.json;
  const associations = gltf?.parser?.associations;
  const scene = gltf?.scene;
  const source = M5A_R1125_NUMBERED_SOURCE;
  if (!json || !(associations instanceof Map) || !scene ||
      json.scene !== source.reviewScene || json.scenes?.length !== source.sceneCount ||
      json.scenes[64]?.nodes?.length !== 20 ||
      scene.children?.length !== 20 ||
      json.nodes?.[1125]?.name !== ORIGINAL_ROOT ||
      json.nodes?.[1126]?.name !== DONOR_ROOT ||
      json.scenes[64].nodes[17] !== 1125 ||
      json.scenes[64].nodes[19] !== 1126)
    error('exact-source-scene');

  const originalNodeIds = json.nodes[1125]?.children;
  const numberedNodeIds = json.nodes[1126]?.children;
  if (!Array.isArray(originalNodeIds) || originalNodeIds.length !== 13 ||
      new Set(originalNodeIds).size !== 13 ||
      !Array.isArray(numberedNodeIds) || numberedNodeIds.length !== 95 ||
      new Set(numberedNodeIds).size !== 95 ||
      !originalNodeIds.every(safeInt) || !numberedNodeIds.every(safeInt))
    error('original13-numbered95-hierarchy');

  const relevantIds = new Set([...originalNodeIds, ...numberedNodeIds]);
  if (relevantIds.size !== 108) error('shared-original-numbered-node');
  const mapped = new Map();
  scene.traverse(object => {
    const sourceIndex = associations.get(object)?.nodes;
    if (!relevantIds.has(sourceIndex)) return;
    if (mapped.has(sourceIndex)) error('duplicate-gltfloader-node-association');
    mapped.set(sourceIndex, object);
  });
  if (mapped.size !== 108) error('missing-original-gltfloader-node-association');

  const targets = new Map();
  const originals = [];
  for (const nodeId of originalNodeIds) {
    const name = json.nodes[nodeId]?.name;
    const object = mapped.get(nodeId);
    if (typeof name !== 'string' || !name || !object || object.name !== name ||
        object.visible !== true || targets.has('original:' + name))
      error('original-source-object-' + nodeId);
    const key = 'original:' + name;
    targets.set(key, [object]);
    originals.push({ key, nodeId, sourceName: name, kind: 'original' });
  }
  const numbered = [];
  for (let i = 0; i < M5A_R1125_NUMBERED_SOURCE_IDS.length; i++) {
    const sourceId = M5A_R1125_NUMBERED_SOURCE_IDS[i];
    const prefix = 'R1125_INDEX_0' + (i + 1) + '_' + sourceId + '_';
    const ids = numberedNodeIds.filter(nodeId => json.nodes[nodeId]?.name?.startsWith(prefix));
    const objects = ids.map(id => mapped.get(id));
    if (ids.length < 8 ||
        ids.filter(id => json.nodes[id]?.name === prefix + 'PLATE').length !== 1 ||
        ids.filter(id => json.nodes[id]?.name === prefix + 'ROD').length !== 1 ||
        objects.some((object, j) => !object ||
          object.name !== json.nodes[ids[j]].name || object.visible !== true))
      error('numbered-route-' + (i + 1));
    const key = 'number:' + sourceId;
    targets.set(key, objects);
    numbered.push({ key, sourceId, nodeIds: ids.slice(), index: i + 1,
      kind: 'number', meshCount: ids.length });
  }
  if (numbered.reduce((sum, target) => sum + target.meshCount, 0) !== 95 ||
      targets.size !== M5A_R1125_SCENE64_SOURCE_PIXEL_TARGET_COUNT)
    error('numbered-target-coverage');

  let hiddenKey = null;
  const restore = () => {
    for (const objects of targets.values()) for (const object of objects) object.visible = true;
    hiddenKey = null;
    return Object.freeze({ activeHiddenCount: 0, humanReview: 'NOT_RUN',
      productionPixelsVerified: false });
  };
  const setSourceVisibility = (key, operation) => {
    if (!targets.has(key) || (operation !== 'HIDE' && operation !== 'RESTORE'))
      error('unknown-source-operation');
    if (operation === 'HIDE') {
      if (hiddenKey !== null ||
          [...targets.values()].some(objects => objects.some(object => object.visible !== true)))
        error('isolation-requires-pristine-source');
      for (const object of targets.get(key)) object.visible = false;
      hiddenKey = key;
    } else {
      if (hiddenKey !== key || targets.get(key).some(object => object.visible !== false))
        error('restore-wrong-target');
      for (const object of targets.get(key)) object.visible = true;
      hiddenKey = null;
    }
    return Object.freeze({ key, operation, activeHiddenCount: hiddenKey === null ? 0 : 1,
      sourceSceneIndex: 64, originalSourceCount: 13, numberedSourceCount: 7,
      productionPixelsVerified: false, humanReview: 'NOT_RUN' });
  };
  const projectSourceTargets = ({ THREE, camera, imageWidth, imageHeight }) => {
    if (hiddenKey !== null || !THREE?.Box3 || !THREE?.Vector3 ||
        !camera?.updateMatrixWorld ||
        !Number.isInteger(imageWidth) || !Number.isInteger(imageHeight) ||
        imageWidth < 128 || imageHeight < 128 || imageWidth * imageHeight > 16000000)
      error('camera-or-source-not-ready');
    if ([...targets.values()].some(objects => objects.some(object => object.visible !== true)))
      error('source-not-restored');
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    camera.updateProjectionMatrix?.();
    const centers = [];
    for (const [key, objects] of targets) {
      const box = new THREE.Box3().makeEmpty();
      for (const object of objects) box.expandByObject(object, true);
      if (box.isEmpty()) error('empty-original-source-bounds-' + key);
      const center = box.getCenter(new THREE.Vector3());
      const projected = center.clone().project(camera);
      if (![projected.x, projected.y, projected.z].every(Number.isFinite))
        error('invalid-camera-projection');
      const u = (projected.x + 1) / 2, v = (1 - projected.y) / 2;
      centers.push({ key, u, v, imageX: Math.round(u * (imageWidth - 1)),
        imageY: Math.round(v * (imageHeight - 1)),
        onScreen: u >= 0 && u <= 1 && v >= 0 && v <= 1 && projected.z >= -1 && projected.z <= 1,
        kind: key.startsWith('number:') ? 'number' : 'original' });
    }
    return Object.freeze({ sourceSceneIndex: 64, sourceTargetCount: 20,
      originalCount: 13, numberCount: 7, imageWidth, imageHeight, centers,
      originalGlbDigestVerifiedByLoader: true, productionPixelsVerified: false,
      humanReview: 'NOT_RUN' });
  };
  return Object.freeze({ sourceSceneIndex: 64, originalCount: 13, numberCount: 7,
    targets: Object.freeze([...originals, ...numbered]), setSourceVisibility,
    projectSourceTargets, restore });
}
