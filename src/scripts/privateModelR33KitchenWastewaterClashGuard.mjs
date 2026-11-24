/**
 * R33 D2F kitchen wastewater: inherited 2015/2026 pipe-surface intersection
 * from original G2b SHA3a226f98, scenes818-821. SOURCE_WARNING only.
 * No real pipe connection, floor penetration or as-built is inferred.
 */
import { c80R31Scene752RootsFnv32 } from './privateModelC80R31Scene752SourceReceipt.mjs';
import { kitchenWastewaterClashEntriesForExactSource } from './privateModelR32HKitchenWastewaterClashGuard.mjs';

export const R33_KITCHEN_WASTEWATER_SOURCE = Object.freeze({
  glbSha256: '3a226f987d5605eff523029d580b760167ae4a32f13ddd51248fe933d913c54c',
  nodeCount: 13846,
  sceneCount: 822,
  meshCount: 5237,
  modelName: 'R33',
  views: Object.freeze([
    Object.freeze({ sceneIndex: 818, rootCount: 500, rootFnv32: 'b77b9ae3',
      name: 'Ylisrinne_R33_D2F_WC_DOOR_CLEAR_BOTH_NORMAL_PLEXI_ON_WORK_TEST_HOST_HOLD__scene818' }),
    Object.freeze({ sceneIndex: 819, rootCount: 499, rootFnv32: 'a8f7cd19',
      name: 'Ylisrinne_R33_D2F_WC_DOOR_CLEAR_BOTH_SERVICE_PLEXI_OFF_WORK_TEST_HOST_HOLD__scene819' }),
    Object.freeze({ sceneIndex: 820, rootCount: 204, rootFnv32: 'fa8341b8',
      name: 'Ylisrinne_R33_D2F_WC_DOOR_CLEAR_2F_NORMAL_PLEXI_ON_WORK_TEST_HOST_HOLD__scene820' }),
    Object.freeze({ sceneIndex: 821, rootCount: 203, rootFnv32: '60e85063',
      name: 'Ylisrinne_R33_D2F_WC_DOOR_CLEAR_2F_SERVICE_PLEXI_OFF_WORK_TEST_HOST_HOLD__scene821' }),
  ]),
});

/** Fail closed for all non-original R33 scenes, all stale roots and unverified stages. */
export function r33KitchenWastewaterClashSelectionEntries(sourceModel, sha, sceneIndex, selected) {
  const source = R33_KITCHEN_WASTEWATER_SOURCE;
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

  return kitchenWastewaterClashEntriesForExactSource(
    sourceModel, sha, sceneIndex, selected, source);
}
