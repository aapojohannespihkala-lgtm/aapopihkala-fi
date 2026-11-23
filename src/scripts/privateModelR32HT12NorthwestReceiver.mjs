/**
 * R32H T12 NW Merika downpipe: isolated source-exact WORK_TEST preview receiver.
 *
 * The GLB and original BufferGeometry stay intact. This receiver substitutes
 * a cloned geometry on the one verified Three.js mesh only while explicitly
 * enabled, then restores that exact geometry on exit/dispose. It never adds a
 * second visible downpipe or asserts a physical/as-built connection.
 *
 * The caller must supply the SHA calculated from the authenticated GLB bytes.
 * No routing, default activation, publication, or viewer ownership here.
 */
import { R32H_T12_NW_COW_SOURCE as SOURCE, planR32HT12NorthwestWorkTestCOW } from './privateModelR32HT12NorthwestCOW.mjs';
import { C80_R32H_SOURCE, C80_R32H_VIEWS } from './privateModelC80R31ReviewRuntime.mjs';

const expectedViews = new Map([
  C80_R32H_VIEWS.dNormal, C80_R32H_VIEWS.dService,
].map((v) => [v.sceneIndex, v.name]));
const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const isIdentity = (matrix) =>
  Array.isArray(matrix?.elements) || ArrayBuffer.isView(matrix?.elements)
    ? matrix.elements.length === 16 &&
      identity.every((value, i) => Math.abs(matrix.elements[i] - value) < 1e-6)
    : false;
const blocked = (status) => Object.freeze({
  status, available: false, stage: 'WORK_TEST_HOST_HOLD',
  sourceVerified: false, physicalHostVerified: false, asBuiltClaim: false,
  setApplied: () => false, dispose: () => {},
});

/** Confirm the source node is in this glTF scene, not merely somewhere in the file. */
const activeSourceNode = (json, sceneIndex) => {
  const roots = json?.scenes?.[sceneIndex]?.nodes;
  if (!Array.isArray(roots)) return false;
  const stack = roots.slice();
  const seen = new Set();
  while (stack.length && seen.size <= C80_R32H_SOURCE.nodeCount) {
    const id = stack.pop();
    if (!Number.isInteger(id) || id < 0 || id >= json.nodes.length || seen.has(id)) continue;
    seen.add(id);
    if (id === SOURCE.nodeIndex) return true;
    const children = json.nodes[id]?.children;
    if (Array.isArray(children)) stack.push(...children);
  }
  return false;
};

/** Find one actual GLTFLoader mesh, with a source node binding in its parent chain. */
function findSourceMesh(scene, associations) {
  const matches = [];
  scene.traverse((object) => {
    if (!object?.isMesh || !object.geometry || !object.parent) return;
    const entry = associations.get(object);
    if (entry?.meshes !== SOURCE.meshIndex) return;
    let current = object;
    let correctNode = false;
    while (current && current !== scene.parent) {
      const association = associations.get(current);
      if (association?.nodes === SOURCE.nodeIndex) correctNode = true;
      if (current === scene) break;
      current = current.parent;
    }
    if (correctNode) matches.push(object);
  });
  return matches.length === 1 ? matches[0] : null;
}

/**
 * Prepare a reversible mesh-geometry swap on the source scene's bound node.
 * Returns an inert receiver on any identity, scene, bounds or ownership error.
 * The caller must choose when to enable the preview after scene validation.
 */
export function createR32HT12NorthwestWorkTestReceiver({
  gltf, sourceSha256, sceneIndex,
} = {}) {
  const json = gltf?.parser?.json;
  const scene = gltf?.scenes?.[sceneIndex];
  const associations = gltf?.parser?.associations;
  if (sourceSha256 !== SOURCE.glbSha256 ||
      sourceSha256 !== C80_R32H_SOURCE.glbSha256 ||
      !expectedViews.has(sceneIndex) ||
      json?.scenes?.[sceneIndex]?.name !== expectedViews.get(sceneIndex) ||
      json?.nodes?.length !== C80_R32H_SOURCE.nodeCount ||
      json?.meshes?.length !== C80_R32H_SOURCE.meshCount ||
      !scene?.traverse || typeof associations?.get !== 'function') {
    return blocked('OUT_OF_EXACT_SOURCE_SCOPE');
  }
  const sourceNode = json.nodes[SOURCE.nodeIndex];
  if (sourceNode?.name !== SOURCE.nodeName ||
      sourceNode.mesh !== SOURCE.meshIndex ||
      !activeSourceNode(json, sceneIndex)) {
    return blocked('SOURCE_NODE_OR_SCENE_MISMATCH');
  }

  scene.updateWorldMatrix(true, true);
  const mesh = findSourceMesh(scene, associations);
  if (!mesh || !isIdentity(mesh.matrixWorld)) return blocked('MESH_BINDING_OR_WORLD_MISMATCH');
  const original = mesh.geometry;
  const sourcePosition = original.getAttribute?.('position');
  if (!(sourcePosition?.array instanceof Float32Array) ||
      sourcePosition.itemSize !== 3 || sourcePosition.count !== SOURCE.vertexCount ||
      sourcePosition.isInterleavedBufferAttribute) {
    return blocked('SOURCE_POSITION_MISMATCH');
  }
  const plan = planR32HT12NorthwestWorkTestCOW({
    glbSha256: sourceSha256, sceneIndex,
    nodeIndex: SOURCE.nodeIndex, meshIndex: SOURCE.meshIndex,
    nodeName: sourceNode.name, worldMatrixIsIdentity: true,
    positions: sourcePosition.array,
  });
  if (plan.status !== 'WORK_TEST_COW') return blocked(plan.status);

  const replacement = original.clone();
  const receiverPosition = replacement.getAttribute('position');
  if (!(receiverPosition?.array instanceof Float32Array) ||
      receiverPosition.array === sourcePosition.array) {
    replacement.dispose();
    return blocked('GEOMETRY_CLONE_NOT_ISOLATED');
  }
  receiverPosition.array.set(plan.positions);
  receiverPosition.needsUpdate = true;
  replacement.computeVertexNormals?.();
  replacement.computeBoundingBox?.();
  replacement.computeBoundingSphere?.();

  const metadataKeys = {
    ModelStage: 'WORK_TEST_VIEW',
    r32hNorthwestHostStatus: 'SOURCE_HOST_HOLD',
    r32hNorthwestSourceGlbSha256: SOURCE.glbSha256,
    r32hNorthwestPhysicalConnection: false,
    r32hNorthwestZAssumption: plan.assumption,
    currentClaim: false, asBuiltClaim: false, physicalZClaim: false,
  };
  const originalValues = new Map();
  let applied = false;
  let disposed = false;
  const setApplied = (enabled) => {
    if (disposed) return false;
    if (Boolean(enabled) === applied) return true;
    if (enabled) {
      // Another owner has replaced the model or geometry. Do not overwrite it.
      if (mesh.geometry !== original || !mesh.parent) return false;
      for (const [key, value] of Object.entries(metadataKeys)) {
        originalValues.set(key, { exists: Object.hasOwn(mesh.userData ?? {}, key), value: mesh.userData?.[key] });
        mesh.userData[key] = value;
      }
      mesh.geometry = replacement;
      applied = true;
    } else {
      if (mesh.geometry !== replacement) return false;
      mesh.geometry = original;
      for (const [key, record] of originalValues) {
        if (record.exists) mesh.userData[key] = record.value;
        else delete mesh.userData[key];
      }
      originalValues.clear();
      applied = false;
    }
    return true;
  };
  return {
    status: 'WORK_TEST_PREVIEW_READY',
    available: true, stage: plan.stage,
    sourceVerified: true, physicalHostVerified: false, asBuiltClaim: false,
    sourceSha256: SOURCE.glbSha256, sceneIndex,
    sourceNodeIndex: SOURCE.nodeIndex, sourceMeshIndex: SOURCE.meshIndex,
    shiftedVertices: plan.shiftedVertices, riseY: plan.riseY,
    setApplied,
    dispose: () => {
      if (disposed) return;
      if (applied && !setApplied(false)) return; // Never dispose geometry owned by another renderer.
      replacement.dispose();
      disposed = true;
    },
  };
}
