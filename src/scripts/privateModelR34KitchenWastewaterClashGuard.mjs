/**
 * R34 D2F kitchen wastewater: inherited 2015/2026 pipe-surface intersection
 * from original G2b SHA99210ea5, scenes822-825. SOURCE_WARNING only.
 * No real pipe connection, floor penetration or as-built is inferred.
 */
import { c80R31Scene752RootsFnv32 } from './privateModelC80R31Scene752SourceReceipt.mjs';
import { kitchenWastewaterClashEntriesForExactSource } from './privateModelR32HKitchenWastewaterClashGuard.mjs';
import { sameSourceName } from './privateModelSourceNodeAssociations.mjs';

export const R34_KITCHEN_WASTEWATER_SOURCE = Object.freeze({
  glbSha256: '99210ea517c18cf24fa5f9702abe12ed2a8058a0c606d38b863e19802a270725', nodeCount: 13854, sceneCount: 826, meshCount: 5242,
  modelName: 'R34',
  views: Object.freeze([
    Object.freeze({"sceneIndex":822,"rootCount":505,"rootFnv32":"673ba191","name":"Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_BOTH_NORMAL_PLEXI_ON_WORK_TEST_HOST_HOLD__scene822"}),
    Object.freeze({"sceneIndex":823,"rootCount":504,"rootFnv32":"f9009603","name":"Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_BOTH_SERVICE_PLEXI_OFF_WORK_TEST_HOST_HOLD__scene823"}),
    Object.freeze({"sceneIndex":824,"rootCount":207,"rootFnv32":"abdbe8d4","name":"Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_2F_NORMAL_PLEXI_ON_WORK_TEST_HOST_HOLD__scene824"}),
    Object.freeze({"sceneIndex":825,"rootCount":206,"rootFnv32":"241f1e49","name":"Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_2F_SERVICE_PLEXI_OFF_WORK_TEST_HOST_HOLD__scene825"}),
  ]),
});

/** Fail closed for all non-original R34 scenes, all stale roots and unverified stages. */
export function r34KitchenWastewaterClashSelectionEntries(sourceModel, sha, sceneIndex, selected) {
  const source = R34_KITCHEN_WASTEWATER_SOURCE;
  const json = sourceModel?.parser?.json;
  const view = source.views.find(v => v.sceneIndex === sceneIndex);
  const asset = json?.asset?.extras;
  const scene = json?.scenes?.[sceneIndex];
  const roots = scene?.nodes;
  if (!view || sha !== source.glbSha256 ||
      json?.scene !== 292 ||
      json?.scenes?.length !== source.sceneCount ||
      json?.nodes?.length !== source.nodeCount ||
      json?.meshes?.length !== source.meshCount ||
      asset?.ModelStage !== 'WORK_TEST' || asset?.current !== false ||
      asset?.asBuilt !== false || asset?.HUMAN_REVIEW !== 'NOT_RUN' ||
      scene?.name !== view.name || !Array.isArray(roots) ||
      roots.length !== view.rootCount || new Set(roots).size !== roots.length ||
      c80R31Scene752RootsFnv32(roots) !== view.rootFnv32 ||
      scene?.extras?.current === true || scene?.extras?.asBuilt === true) return [];

  // R34 retains the exact R33 pipe meshes and direct active parents, proven
  // from both original Drive GLBs (identical node/mesh/accessor/BIN prefixes).
  const parent2015 = sceneIndex <= 823 ? 13358 : 13535;
  const otherParent = sceneIndex <= 823 ? 13535 : 13358;
  const ids = [13310, 13314, 13315, 13316, 13317];
  const meshes = [3709, 4429, 4430, 4431, 4432];
  if (!roots.includes(parent2015) || roots.includes(otherParent) || !roots.includes(13319) ||
      !json.nodes[parent2015]?.children?.includes(13310) ||
      !ids.slice(1).every(id => json.nodes[13319]?.children?.includes(id)) ||
      !ids.every((id, i) => json.nodes[id]?.mesh === meshes[i])) return [];
  // Check the actually mounted parent as well, including associated nodes.
  // A stale selection with the right mesh/name under another root is rejected.
  const mounted = sourceModel?.scenes?.[sceneIndex];
  const associations = sourceModel?.parser?.associations;
  const seen = new Set();
  let witness = false;
  for (let node = selected; node && node !== mounted && !seen.has(node) && seen.size < 128; node = node.parent) {
    seen.add(node);
    const association = associations?.get?.(node);
    const boundId = association?.nodes;
    // A loader-suffixed name is not evidence by itself. It is accepted only
    // with the structurally restored source-node index and matching parent.
    const id = ids.includes(boundId) ? boundId :
      ids.find(id => json.nodes[id]?.name === node.name);
    if (id === undefined) continue;
    const sourceName = json.nodes[id]?.name;
    if ((boundId !== undefined && boundId !== id) ||
        (node.name !== sourceName && !(boundId === id && sameSourceName(node.name, sourceName))) ||
        (association?.meshes !== undefined && association.meshes !== json.nodes[id].mesh)) return [];
    const parentId = id === 13310 ? parent2015 : 13319;
    const binding = associations?.get?.(node.parent)?.nodes;
    const parentName = json.nodes[parentId]?.name;
    if ((binding !== undefined && binding !== parentId) ||
        (node.parent?.name !== parentName &&
         !(binding === parentId && sameSourceName(node.parent?.name, parentName)))) return [];
    witness = true;
  }
  if (!witness) return [];
  return kitchenWastewaterClashEntriesForExactSource(
    sourceModel, sha, sceneIndex, selected, source);
}
