/**
 * Exact source receipt for the R33 2F-only kitchen mixer connector COW.
 * This is NOT a replacement for the current R34 model and does not mount a
 * viewer asset. Caller must hash the authenticated original raw GLB bytes.
 * WORK_TEST / HOST_HOLD, not a physical pipe connection or as-built proof.
 *
 * Original R33 scenes 818-821 are retained verbatim. New scenes 822/823 are
 * its 2F-only scenes 820/821 with the EXISTING n13472 connector root added
 * once. No new nodes, meshes, materials or sourceLinks are authorized.
 */
import {
  C80_R33_SOURCE, C80_R33_VIEWS,
} from './privateModelC80R31ReviewRuntime.mjs';
import { c80R31Scene752RootsFnv32 } from './privateModelC80R31Scene752SourceReceipt.mjs';

export const R33_D2F_MIXER_SOURCE = Object.freeze({
  glbSha256: 'dd33b283971cb039f0fc01982f5fce3e304647be331077913239e9a806fd0135',
  glbBytes: 64701664,
  zipDriveId: '11pZ-J8DeOzrpvNfiJcUVwl8xSKRrGwQ3',
  zipSha256: 'f6baca441398aabf2ba001ec0d5248c0a11114c5be18d34d6062b00cd70b3f74',
  originalGlbSha256: C80_R33_SOURCE.glbSha256,
  sceneCount: 824,
  nodeCount: C80_R33_SOURCE.nodeCount,
  meshCount: C80_R33_SOURCE.meshCount,
  materialCount: C80_R33_SOURCE.materialCount,
  accessorCount: C80_R33_SOURCE.accessorCount,
  bufferViewCount: C80_R33_SOURCE.bufferViewCount,
  defaultScene: C80_R33_SOURCE.defaultScene,
  mixerRoot: 13472,
  kvNode: 13470,
  lvNode: 13471,
  kvMesh: 5160,
  lvMesh: 5161,
});

export const R33_D2F_MIXER_VIEWS = Object.freeze({
  normal: Object.freeze({ sceneIndex: 822, originalSceneIndex: 820, role: 'R33_2F_MIXER_NORMAL_WORK_TEST', floor: '2F' }),
  service: Object.freeze({ sceneIndex: 823, originalSceneIndex: 821, role: 'R33_2F_MIXER_SERVICE_WORK_TEST', floor: '2F' }),
});

const sameOrdered = (a, b) =>
  Array.isArray(a) && Array.isArray(b) && a.length === b.length &&
  a.every((value, index) => value === b[index]);
const validOldView = (json, view) => {
  const scene = json.scenes?.[view.sceneIndex], roots = scene?.nodes;
  return scene?.name === view.name &&
    Array.isArray(roots) && roots.length === view.rootCount &&
    new Set(roots).size === roots.length &&
    c80R31Scene752RootsFnv32(roots) === view.rootFnv32;
};

/**
 * Fail closed for the R34 production model, mutated scenes and wrong GLB.
 * Validates two original R33 2F scenes and BOTH scenes, including the
 * connector being already present in BOTH and newly present only in 2F.
 */
export function isR33D2FMixer2FSource(json, authenticatedGlbSha256, sceneIndex) {
  const s = R33_D2F_MIXER_SOURCE;
  if (authenticatedGlbSha256 !== s.glbSha256 ||
      !Object.values(R33_D2F_MIXER_VIEWS).some(v => v.sceneIndex === sceneIndex) ||
      json?.scene !== s.defaultScene ||
      json?.scenes?.length !== s.sceneCount ||
      json?.nodes?.length !== s.nodeCount ||
      json?.meshes?.length !== s.meshCount ||
      json?.materials?.length !== s.materialCount ||
      json?.accessors?.length !== s.accessorCount ||
      json?.bufferViews?.length !== s.bufferViewCount ||
      json?.asset?.extras?.ModelStage !== 'WORK_TEST' ||
      json?.asset?.extras?.current !== false ||
      json?.asset?.extras?.asBuilt !== false ||
      json?.asset?.extras?.HUMAN_REVIEW !== 'NOT_RUN') return false;

  if (!Object.values(C80_R33_VIEWS).every(v => validOldView(json, v))) return false;
  if (!json.scenes[818].nodes.includes(s.mixerRoot) ||
      !json.scenes[819].nodes.includes(s.mixerRoot) ||
      json.scenes[820].nodes.includes(s.mixerRoot) ||
      json.scenes[821].nodes.includes(s.mixerRoot)) return false;
  if (json.nodes[s.mixerRoot]?.children?.length !== 2 ||
      !sameOrdered(json.nodes[s.mixerRoot].children, [s.kvNode, s.lvNode]) ||
      json.nodes[s.kvNode]?.mesh !== s.kvMesh ||
      json.nodes[s.lvNode]?.mesh !== s.lvMesh) return false;

  for (const view of Object.values(R33_D2F_MIXER_VIEWS)) {
    const oldRoots = json.scenes[view.originalSceneIndex].nodes;
    const next = json.scenes[view.sceneIndex];
    if (typeof next?.name !== 'string' || !next.name.endsWith(`__scene${view.sceneIndex}`) ||
        !sameOrdered(next.nodes, [...oldRoots, s.mixerRoot]) ||
        new Set(next.nodes).size !== next.nodes.length ||
        next.extras?.current === true || next.extras?.asBuilt === true) return false;
  }
  return true;
}

/** Source-only receipt; never registers, publishes or mounts an asset. */
export function r33D2FMixer2FReceipt(json, authenticatedGlbSha256, sceneIndex) {
  if (!isR33D2FMixer2FSource(json, authenticatedGlbSha256, sceneIndex)) return null;
  const view = Object.values(R33_D2F_MIXER_VIEWS).find(v => v.sceneIndex === sceneIndex);
  return Object.freeze({
    sourceSha256: R33_D2F_MIXER_SOURCE.glbSha256,
    originalSourceSha256: R33_D2F_MIXER_SOURCE.originalGlbSha256,
    sceneIndex,
    originalSceneIndex: view.originalSceneIndex,
    floor: view.floor,
    role: view.role,
    status: 'WORK_TEST_HOST_HOLD',
  });
}
