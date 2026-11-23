/**
 * Opt-in, source-exact P7 NW downspout COW receiver.
 *
 * BOTH authenticated GLBs must be independently hashed from their raw bytes:
 * R32H (c26d99c1) and P7 wall-lip photo-spout preview (157639b1).
 * Replaces ONLY the existing NW T12 mesh geometry, never mounts the P7
 * standalone scene (which already contains a preview pipe) into R32H.
 * Owner photo shape is a WORK_TEST interpretation, NOT surveyed dimensions.
 *
 * Source: P7 ZIP Drive1L8sY0AalrSnQ7xsCwcbF91RRpfry_85l,
 * SHA256 69ade893d4332692c0ebfa8a56c2eda74baf7d1a5fdce286e393e5665650299c,
 * preview GLB SHA256 157639b10fe5b6bd7d0eec1a8f9a7c579dc0abd752248f8b661b3a7390f0150e.
 * Wall-side high-lip donor GLB SHA256 437ecc3798edf48b9eb5cbe384f93fc69a5461d92daa1a7bf181bcc7737ca61b.
 *
 * This module is not wired into the viewer. No production approval.
 */
import {
  R32H_T12_NW_COW_SOURCE as SOURCE,
  planR32HT12NorthwestWorkTestCOW,
} from './privateModelR32HT12NorthwestCOW.mjs';
import { C80_R32H_SOURCE, C80_R32H_VIEWS } from './privateModelC80R31ReviewRuntime.mjs';

export const R32H_NW_PHOTO_SPOUT_SOURCE = Object.freeze({
  originalSha256: SOURCE.glbSha256,
  donorPreviewSha256: '157639b10fe5b6bd7d0eec1a8f9a7c579dc0abd752248f8b661b3a7390f0150e',
  donorZipSha256: '69ade893d4332692c0ebfa8a56c2eda74baf7d1a5fdce286e393e5665650299c',
  wallLipSourceSha256: '437ecc3798edf48b9eb5cbe384f93fc69a5461d92daa1a7bf181bcc7737ca61b',
  donorDriveId: '1L8sY0AalrSnQ7xsCwcbF91RRpfry_85l',
  donorScene: 0, donorPipeNode: 28, donorPipeMesh: 27,
  grateNode: 7, grateMesh: 6, hoodNode: 9, hoodMesh: 8,
  sourceNode: SOURCE.nodeIndex, sourceMesh: SOURCE.meshIndex,
  sourceScenes: Object.freeze([814, 815]),
  pipeLowerY: 0.183, grateY: 0.163,
  bendShiftX: -0.055, bendFullBelowY: 0.45, bendZeroAboveY: 1.0,
});
const expectedViews = new Map([
  C80_R32H_VIEWS.dNormal, C80_R32H_VIEWS.dService,
].map((v) => [v.sceneIndex, v.name]));
const close = (x, y, tol = 1e-5) => Number.isFinite(x) && Math.abs(x - y) <= tol;
const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const isIdentity = (m) => m?.elements?.length === 16 &&
  identity.every((v, i) => close(m.elements[i], v, 1e-6));
const fail = (status) => Object.freeze({
  status, available: false, stage: 'WORK_TEST_HOST_HOLD',
  sourceVerified: false, physicalHostVerified: false, asBuiltClaim: false,
  approvedForViewer: false, approvedForPublication: false,
  setApplied: () => false, dispose: () => {},
});

function isActiveNode(json, sceneIndex, nodeIndex) {
  const roots = json?.scenes?.[sceneIndex]?.nodes;
  if (!Array.isArray(roots)) return false;
  const todo = roots.slice(), seen = new Set();
  while (todo.length && seen.size <= C80_R32H_SOURCE.nodeCount) {
    const i = todo.pop();
    if (!Number.isInteger(i) || i < 0 || i >= json.nodes.length ||
        seen.has(i)) continue;
    seen.add(i);
    if (i === nodeIndex) return true;
    todo.push(...(json.nodes[i]?.children ?? []));
  }
  return false;
}
function originalSourceMesh(scene, associations) {
  const matches = [];
  scene.traverse((object) => {
    if (!object?.isMesh || !object.geometry || !object.parent) return;
    const a = associations.get(object);
    const hasBinding = a?.meshes !== undefined;
    const fallback = !hasBinding && object.name === SOURCE.nodeName &&
      object.parent.name === 'T12_GUTTERS_AND_DOWNSPOUTS';
    if (hasBinding ? a.meshes !== SOURCE.meshIndex : !fallback) return;
    let curr = object, found = false;
    while (curr) {
      if (associations.get(curr)?.nodes === SOURCE.nodeIndex ||
          (fallback && curr === object)) found = true;
      if (curr === scene) break;
      curr = curr.parent;
    }
    if (found) matches.push(object);
  });
  return matches.length === 1 ? matches[0] : null;
}
const isWallLipMatrix = (m) => Array.isArray(m) && m.length === 16 &&
  m.every(Number.isFinite) &&
  close(m[0], 0, 1e-6) && close(m[2], -1, 1e-6) &&
  close(m[5], 1, 1e-6) && close(m[8], 1, 1e-6) &&
  close(m[10], 0, 1e-6) && close(m[12], -0.35) &&
  close(m[13], -0.087) && close(m[14], -10.685) &&
  close(m[15], 1);
const isGrateMatrix = (m) => Array.isArray(m) && m.length === 16 &&
  m.every(Number.isFinite) && close(m[0], -1) &&
  close(m[5], 1) && close(m[10], -1) &&
  close(m[12], -0.35) && close(m[13], -0.087) &&
  close(m[14], -10.685) && close(m[15], 1);

function previewSourceMesh(gltf) {
  const json = gltf?.parser?.json, sc = gltf?.scenes?.[0];
  if (!sc?.traverse || !json || json.scenes?.length !== 1 ||
      json.nodes?.length !== 29 || json.meshes?.length !== 28 ||
      !Array.isArray(json.scenes[0]?.nodes) ||
      json.scenes[0].nodes.join(',') !== '0,28' ||
      json.nodes[0]?.children?.join(',') !==
        Array.from({ length: 27 }, (_, i) => i + 1).join(',') ||
      json.nodes[7]?.mesh !== 6 || json.nodes[9]?.mesh !== 8 ||
      !isGrateMatrix(json.nodes[7]?.matrix) ||
      !isWallLipMatrix(json.nodes[9]?.matrix) ||
      json.nodes[28]?.mesh !== 27 ||
      json.nodes[28]?.name !== 'R32H_T12_NW_PHOTO_CONSTRAINED_SPOUT_WORK_TEST' ||
      json.nodes[28]?.extras?.lowerElbowBendAwayFromWallM !== -0.055 ||
      json.nodes[28]?.extras?.bendFadeEndsAtWorldY !== 1 ||
      json.nodes[28]?.extras?.wallDirection !== '+X' ||
      json.nodes[28]?.extras?.asBuilt !== false ||
      json.meshes[27]?.extras?.sourceR32HGlbSha256 !== SOURCE.glbSha256 ||
      json.meshes[27]?.extras?.sourceNode !== SOURCE.nodeIndex ||
      json.meshes[27]?.extras?.sourceMesh !== SOURCE.meshIndex ||
      json.meshes[27]?.extras?.originalUnchanged !== true) return null;
  const prim = json.meshes[27]?.primitives?.[0];
  const accIndex = prim?.attributes?.POSITION;
  const a = json.accessors?.[accIndex];
  if (json.meshes[27].primitives.length !== 1 ||
      prim.mode !== 4 || prim.indices !== undefined ||
      !Number.isInteger(accIndex) || a?.count !== SOURCE.vertexCount ||
      a?.componentType !== 5126 || a?.type !== 'VEC3' ||
      !close(a.min?.[0], -0.3962628245353699) ||
      !close(a.min?.[1], R32H_NW_PHOTO_SPOUT_SOURCE.pipeLowerY) ||
      !close(a.max?.[1], SOURCE.sourceMaxY)) return null;

  const matches = [];
  const associations = gltf.parser?.associations;
  sc.traverse((obj) => {
    if (!obj?.isMesh || obj.name !== json.nodes[28].name || !obj.geometry) return;
    const a = associations?.get?.(obj);
    if (a?.meshes !== undefined && a.meshes !== 27) return;
    // Node28 is a DIRECT scene root in the source glTF; no duplicate.
    if (obj.parent !== sc) return;
    matches.push(obj);
  });
  if (matches.length !== 1) return null;
  sc.updateWorldMatrix(true, true);
  if (!isIdentity(matches[0].matrixWorld)) return null;
  const p = matches[0].geometry.getAttribute?.('position');
  if (p?.count !== SOURCE.vertexCount ||
      p?.itemSize !== 3 || !(p.array instanceof Float32Array) ||
      p.isInterleavedBufferAttribute) return null;
  return p.array;
}

/**
 * Validate exact original source geometry and independent P7 donor positions.
 * The caller must calculate originalSha256 and previewSha256 from raw GLB bytes.
 * A matching name, URL, or claimed digest alone does NOT authenticate bytes.
 */
export function createR32HMerikaNWPhotoSpoutReceiver({
  gltf, originalSha256, sceneIndex,
  previewGltf, previewSha256, previewZipSha256,
  explicitPreviewOptIn = false,
} = {}) {
  const ref = R32H_NW_PHOTO_SPOUT_SOURCE;
  if (explicitPreviewOptIn !== true) return fail('EXPLICIT_OPT_IN_REQUIRED');
  if (previewSha256 !== ref.donorPreviewSha256 ||
      previewZipSha256 !== ref.donorZipSha256) {
    return fail('DONOR_SHA_MISMATCH');
  }
  const previewPositions = previewSourceMesh(previewGltf);
  if (!previewPositions) return fail('DONOR_STRUCTURE_OR_WALL_LIP_MISMATCH');
  const j = gltf?.parser?.json, scene = gltf?.scenes?.[sceneIndex];
  const assocs = gltf?.parser?.associations;
  if (originalSha256 !== ref.originalSha256 ||
      originalSha256 !== C80_R32H_SOURCE.glbSha256 ||
      !expectedViews.has(sceneIndex) ||
      j?.scenes?.[sceneIndex]?.name !== expectedViews.get(sceneIndex) ||
      j.nodes?.length !== C80_R32H_SOURCE.nodeCount ||
      j.meshes?.length !== C80_R32H_SOURCE.meshCount ||
      !scene?.traverse || typeof assocs?.get !== 'function') {
    return fail('ORIGINAL_SHA_SCENE_OR_COUNTS_MISMATCH');
  }
  const n = j.nodes[SOURCE.nodeIndex];
  if (n?.mesh !== SOURCE.meshIndex || n?.name !== SOURCE.nodeName ||
      !isActiveNode(j, sceneIndex, SOURCE.nodeIndex)) {
    return fail('ORIGINAL_NODE_OR_SCENE_MISMATCH');
  }
  scene.updateWorldMatrix(true, true);
  const mesh = originalSourceMesh(scene, assocs);
  if (!mesh || !isIdentity(mesh.matrixWorld)) {
    return fail('ORIGINAL_MESH_BINDING_OR_WORLD_MISMATCH');
  }
  const original = mesh.geometry;
  const p = original.getAttribute?.('position');
  if (p?.count !== SOURCE.vertexCount || p.itemSize !== 3 ||
      !(p.array instanceof Float32Array) || p.isInterleavedBufferAttribute) {
    return fail('ORIGINAL_POSITION_MISMATCH');
  }
  const base = planR32HT12NorthwestWorkTestCOW({
    glbSha256: originalSha256, sceneIndex, nodeIndex: SOURCE.nodeIndex,
    meshIndex: SOURCE.meshIndex, nodeName: n.name,
    worldMatrixIsIdentity: true, positions: p.array,
  });
  if (base.status !== 'WORK_TEST_COW') return fail('ORIGINAL_GEOMETRY_GUARD_FAILED');

  // Independently reconstruct P7's original-source-preserving COW, rather
  // than accepting 360 arbitrary donor positions just because SHA was claimed.
  const expected = new Float32Array(base.positions);
  let minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < expected.length; i += 3) {
    const sourceY = p.array[i + 1];
    const verticalFactor = sourceY <= SOURCE.lowerBandY ? 1
      : sourceY >= SOURCE.upperBandY ? 0
      : (SOURCE.upperBandY - sourceY) /
        (SOURCE.upperBandY - SOURCE.lowerBandY);
    expected[i + 1] += 0.054 * verticalFactor;
    const worldY = expected[i + 1];
    const lateral = worldY <= ref.bendFullBelowY ? 1
      : worldY >= ref.bendZeroAboveY ? 0
      : (ref.bendZeroAboveY - worldY) /
        (ref.bendZeroAboveY - ref.bendFullBelowY);
    expected[i] += ref.bendShiftX * lateral;
    minY = Math.min(minY, expected[i + 1]);
    maxY = Math.max(maxY, expected[i + 1]);
    for (const k of [0, 1, 2]) {
      if (!close(expected[i + k], previewPositions[i + k], 0.00004)) {
        return fail('SOURCE_TO_PREVIEW_VERTEX_MISMATCH');
      }
    }
  }
  if (!close(minY, ref.pipeLowerY, 0.0005) ||
      !close(maxY, SOURCE.sourceMaxY, 0.0005) ||
      !close(minY - ref.grateY, 0.020, 0.0005)) {
    return fail('PHOTO_SPOUT_CLEARANCE_MISMATCH');
  }
  const replacement = original.clone();
  const target = replacement.getAttribute('position');
  if (!(target?.array instanceof Float32Array) ||
      target.array === p.array || target.array.length !== previewPositions.length) {
    replacement.dispose();
    return fail('NON_ISOLATED_REPLACEMENT');
  }
  target.array.set(previewPositions);
  target.needsUpdate = true;
  replacement.computeBoundingBox?.();
  replacement.computeBoundingSphere?.();
  replacement.computeVertexNormals?.();

  const metadata = Object.freeze({
    ModelStage: 'WORK_TEST_VIEW',
    r32hNorthwestHostStatus: 'PHOTO_SOURCE_HOST_HOLD',
    r32hPhotoPreviewSha256: ref.donorPreviewSha256,
    r32hPhotoWallLipSha256: ref.wallLipSourceSha256,
    r32hPhotoGrateY: ref.grateY,
    r32hPhotoSpoutY: ref.pipeLowerY,
    roofwaterRoute: 'Luoteissyöksy ja seinään päin käännetty Elegance 1790RS -työmalli',
    roofwaterCertainty: 'Varmistettu: 2024-2026 valokuvissa syöksysuu on avoin, kaivon sisällä eikä geometrian läpi.',
    roofwaterUncertainty: 'Oletus: 55 mm vaakasiirto, 20 mm sihtivälys ja tuotemalli. Todellinen XYZ/SKU ei mitattu.',
    physicalZClaim: false, currentClaim: false, asBuiltClaim: false,
  });
  const originals = new Map();
  let applied = false, disposed = false;
  const setApplied = (enabled) => {
    if (disposed) return false;
    if (Boolean(enabled) === applied) return true;
    if (enabled) {
      if (!mesh.parent || mesh.geometry !== original) return false;
      for (const [k, v] of Object.entries(metadata)) {
        originals.set(k, { exists: Object.hasOwn(mesh.userData, k), value: mesh.userData[k] });
        mesh.userData[k] = v;
      }
      mesh.geometry = replacement; applied = true;
      return true;
    }
    if (mesh.geometry !== replacement) return false;
    mesh.geometry = original;
    for (const [k, rec] of originals) {
      if (rec.exists) mesh.userData[k] = rec.value;
      else delete mesh.userData[k];
    }
    originals.clear(); applied = false;
    return true;
  };
  return {
    status: 'WORK_TEST_NW_PHOTO_SPOUT_READY',
    stage: 'WORK_TEST_HOST_HOLD',
    available: true, sourceVerified: true,
    physicalHostVerified: false, asBuiltClaim: false,
    approvedForViewer: false, approvedForPublication: false,
    previewScene: ref.donorScene, sceneIndex,
    sourceNodeIndex: SOURCE.nodeIndex, sourceMeshIndex: SOURCE.meshIndex,
    candidateLipY: minY, candidateGapM: minY - ref.grateY,
    lowerElbowShiftX: ref.bendShiftX,
    setApplied,
    dispose: () => {
      if (disposed) return;
      if (applied && !setApplied(false)) return;
      replacement.dispose(); disposed = true;
    },
  };
}
