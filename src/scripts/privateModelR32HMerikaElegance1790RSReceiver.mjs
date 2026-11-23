/**
 * R32H T12 NW Merika Elegance 1790RS: isolated WORK_TEST preview receiver.
 *
 * The GLB and original BufferGeometry stay intact. This receiver substitutes
 * a cloned geometry on the one verified Three.js mesh only while explicitly
 * enabled, then restores that exact geometry on exit/dispose. It never adds a
 * second visible downpipe or asserts a physical/as-built connection.
 *
 * The caller must supply the SHA calculated from BOTH authenticated GLB files.
 * No routing, default activation, publication, donor mesh import or viewer ownership here.
 */
import { R32H_T12_NW_COW_SOURCE as SOURCE } from './privateModelR32HT12NorthwestCOW.mjs';
import {
  R32H_ELEGANCE_1790RS_NW_FIT_SOURCE as DONOR,
  planR32HMerikaElegance1790RSNWWorkTest,
} from './privateModelR32HMerikaElegance1790RSFitGuard.mjs';
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
    // GLTFLoader can strip parser associations when cloning a node shared by
    // multiple source scenes. An absent mesh binding is not a contradiction:
    // use the exact source node name + parent, then the SHA/scene/node/mesh JSON,
    // one-mesh, identity matrix and 360-vertex bounds guards below.
    const hasMeshBinding = entry?.meshes !== undefined;
    const namedLoaderClone = !hasMeshBinding &&
      object.name === SOURCE.nodeName &&
      object.parent?.name === 'T12_GUTTERS_AND_DOWNSPOUTS';
    if (hasMeshBinding ? entry.meshes !== SOURCE.meshIndex : !namedLoaderClone) return;
    let current = object;
    let correctNode = false;
    while (current && current !== scene.parent) {
      const association = associations.get(current);
      if (association?.nodes === SOURCE.nodeIndex ||
          (namedLoaderClone && current === object)) correctNode = true;
      if (current === scene) break;
      current = current.parent;
    }
    if (correctNode) matches.push(object);
  });
  return matches.length === 1 ? matches[0] : null;
}

/**
 * Validate the EXACT donor GLTFLoader source structure as well as the
 * authenticated GLB SHA supplied by the caller who loaded those bytes.
 * A filename or hardcoded known digest is NOT a substitute for a loader
 * computing the SHA from the actual donor file.
 *
 * The site GLB has local grate Y=0.250 m, node transform Y=-0.087 m:
 * world grate Y=+0.163 m. The old R32H COW lip is +0.129 m.
 */
function matchesAuthenticatedNWDonor(siteGltf, siteSourceSha256) {
  const json = siteGltf?.parser?.json;
  const scene = siteGltf?.scenes?.[DONOR.siteSceneIndex];
  const names = json?.nodes ?? [];
  if (siteSourceSha256 !== DONOR.siteGlbSha256 ||
      json?.scenes?.length !== 1 || json?.meshes?.length !== 27 ||
      names.length !== 28 || !scene?.traverse ||
      JSON.stringify(json.scenes[0]?.nodes) !== '[0]' ||
      !Array.isArray(names[0]?.children) ||
      !names[0].children.includes(7) ||
      !names[0].children.includes(9)) return false;
  const grate = names[7], basket = names[9];
  if (grate?.mesh !== 6 || basket?.mesh !== 8 ||
      grate.name !== 'RK_NW_ELEGANCE_1790RS_WORK_TEST__02_perforated_grate_TRUE_80_HOLES_WORK_TEST' ||
      basket.name !== 'RK_NW_ELEGANCE_1790RS_WORK_TEST__01_sloped_upper_splash_basket_OPEN') return false;
  const m = grate.matrix, bm = basket.matrix;
  if (!Array.isArray(m) || m.length !== 16 ||
      !Array.isArray(bm) || bm.length !== 16 ||
      !m.every((v, i) => Number.isFinite(v) && Math.abs(v - bm[i]) < 1e-6) ||
      Math.abs(m[12] - DONOR.wellXY.x) > 1e-6 ||
      Math.abs(m[14] - DONOR.wellXY.z) > 1e-6 ||
      Math.abs(m[13] + 0.087) > 1e-6 ||
      Math.abs(m[5] - 1) > 1e-6 || Math.abs(m[4]) > 1e-6 ||
      Math.abs(m[6]) > 1e-6) return false;
  const ai = json.meshes[6]?.primitives?.[0]?.attributes?.POSITION;
  const accessor = Number.isInteger(ai) ? json.accessors?.[ai] : null;
  return accessor?.count === 2944 &&
    Array.isArray(accessor?.min) && Array.isArray(accessor?.max) &&
    Math.abs(accessor.min[1] - 0.25) < 1e-6 &&
    Math.abs(accessor.max[1] - 0.25) < 1e-6 &&
    Math.abs(m[13] + accessor.min[1] - DONOR.eleganceCandidateGrateY) < 1e-6;
}

/**
 * Prepare a reversible mesh-geometry swap on the authenticated R32H source scene's bound node.
 * Returns an inert receiver on any identity, scene, bounds or ownership error.
 * The caller must explicitly opt in. This is not a complete donor overlay.
 */
export function createR32HMerikaElegance1790RSNWReceiver({
  gltf, sourceSha256, sceneIndex,
  siteGltf, siteSourceSha256, siteZipSha256, explicitPreviewOptIn = false,
} = {}) {
  if (explicitPreviewOptIn !== true) return blocked('EXPLICIT_OPT_IN_REQUIRED');
  if (siteZipSha256 !== DONOR.siteZipSha256 ||
      !matchesAuthenticatedNWDonor(siteGltf, siteSourceSha256)) {
    return blocked('DONOR_SOURCE_OR_WORLD_HOST_MISMATCH');
  }
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
  const plan = planR32HMerikaElegance1790RSNWWorkTest({
    glbSha256: sourceSha256, sceneIndex,
    nodeIndex: SOURCE.nodeIndex, meshIndex: SOURCE.meshIndex,
    nodeName: sourceNode.name, worldMatrixIsIdentity: true,
    positions: sourcePosition.array,
    siteGlbSha256: siteSourceSha256,
    siteZipSha256, siteSceneIndex: DONOR.siteSceneIndex,
    wellId: DONOR.wellId, explicitPreviewOptIn: true,
  });
  if (plan.status !== 'WORK_TEST_EL1790RS_NW_COW_CANDIDATE') return blocked(plan.status);

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
    r32hNorthwestZAssumption: 'Elegance 1790RS NW: 20 mm ehdotettu vapaa korko, EI mittaus.',
    r32hEleganceDonorGlbSha256: DONOR.siteGlbSha256,
    r32hEleganceGrateWorldY: DONOR.eleganceCandidateGrateY,
    // Ordinary selected-object card fields. This does not overlay a drain mesh.
    roofwaterRoute: 'Luoteissyöksy + Elegance 1790RS kaivon vaihtoehtoinen WORK_TEST-liittymä',
    roofwaterCertainty: 'Varmaa: lähde-GLB ja donor-GLB SHA:n perusteella uusi sihti on 54 mm vanhaa oletusta ylempänä.',
    roofwaterUncertainty: 'Oletus: Elegance-sihdin maailman Y=+0,163 m ja putken alareunan Y=+0,183 m. Ei as-built.',
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
    status: 'WORK_TEST_ELEGANCE_PREVIEW_READY',
    available: true, stage: plan.stage,
    sourceVerified: true, physicalHostVerified: false, asBuiltClaim: false,
    sourceSha256: SOURCE.glbSha256, sceneIndex,
    sourceNodeIndex: SOURCE.nodeIndex, sourceMeshIndex: SOURCE.meshIndex,
    shiftedVertices: plan.shiftedVertices, riseY: plan.additionalRiseY,
    candidateGapM: plan.candidateGapM,
    donorSourceGlbSha256: DONOR.siteGlbSha256,
    setApplied,
    dispose: () => {
      if (disposed) return;
      if (applied && !setApplied(false)) return; // Never dispose geometry owned by another renderer.
      replacement.dispose();
      disposed = true;
    },
  };
}
