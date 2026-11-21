/**
 * Source-locked R300 selection -> existing protected viewer evidence panel.
 * Input is the already loaded GLTFLoader instance and its SHA from parsed bytes,
 * not a catalog label or public card payload. No owner facts are bundled here.
 */
import {
  R300_OWNER_GLB_SHA256,
  R300_OWNER_R31_772_GLB_SHA256,
  R300_OWNER_CARD_REF,
  resolveR300OwnerCardSelection,
} from './privateModelR300OwnerCardAdapter.mjs';
import { sameSourceName } from './privateModelSourceNodeAssociations.mjs';

const supported = new Map([
  [R300_OWNER_GLB_SHA256, new Set([759, 760])],
  [R300_OWNER_R31_772_GLB_SHA256, new Set([769, 770, 771, 772])],
]);
const validNode = index => Number.isInteger(index) && index >= 0;

/**
 * @param {{gltf?: any, loadedGlbSha256?: string|null, mountedScene?: any,
 *   selectedObject?: any, protectedEvidence?: any}} [args]
 * @returns {any|null} null only for an unrelated model or non-R300 source scene.
 */
export function resolveR300ViewerOwnerCardEvidence({
  gltf, loadedGlbSha256, mountedScene, selectedObject, protectedEvidence,
} = {}) {
  const enabled = supported.get(loadedGlbSha256);
  if (!enabled) return null;
  const sceneIndex = gltf?.scenes?.indexOf(mountedScene) ?? -1;
  if (!enabled.has(sceneIndex)) return null;
  const json = gltf?.parser?.json;
  const associations = gltf?.parser?.associations;
  const noProof = () => ({
    state: 'unbound',
    version: `GLB ${loadedGlbSha256} / scene ${sceneIndex} / R300 WORK_TEST`,
    reason: 'Ladatun R300-kohteen todellista solmu- tai parent-polun valintaa ei voitu todentaa.',
    cards: [],
  });
  if (!selectedObject?.isMesh || !(associations instanceof Map) ||
    !Array.isArray(json?.nodes) || !Array.isArray(json?.scenes)) return noProof();

  let current = selectedObject;
  const seen = new Set();
  const actualPath = [];
  let leafObject = null;
  let reachedScene = false;
  while (current && !seen.has(current) && seen.size < 128) {
    if (current === mountedScene) { reachedScene = true; break; }
    seen.add(current);
    const idx = associations.get(current)?.nodes;
    if (idx !== undefined) {
      if (!validNode(idx) || !sameSourceName(current.name, json.nodes[idx]?.name)) return noProof();
      if (!leafObject) leafObject = current;
      actualPath.unshift(idx);
    }
    current = current.parent;
  }
  if (!reachedScene || actualPath.length !== 3 || !leafObject) return noProof();
  const nodeIndex = actualPath[2];
  const meshIndex = json.nodes[nodeIndex]?.mesh;
  const clickAssoc = associations.get(selectedObject);
  // Never let a viewer-created helper mesh under a source node impersonate it.
  if (selectedObject !== leafObject && !validNode(clickAssoc?.meshes)) return noProof();
  if (clickAssoc?.meshes !== undefined && clickAssoc.meshes !== meshIndex) return noProof();

  const result = resolveR300OwnerCardSelection({
    json, loadedGlbSha256, sceneIndex, nodeIndex, meshIndex,
    sourcePath: actualPath,
  }, key => protectedEvidence?.state === 'matched'
    ? (protectedEvidence.cards ?? []).find(card => card?.id === key && key === R300_OWNER_CARD_REF) ?? null
    : null);
  return { ...result, version: `GLB ${loadedGlbSha256} / scene ${sceneIndex} / R300 WORK_TEST` };
}
