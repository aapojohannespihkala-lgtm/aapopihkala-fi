// SHA-locked scene bridge for the append-only V69P12R1 WORK_TEST GLB.
// This does not mark the model CURRENT, as-built, or production-WebGL verified.
export const V69P12R1_SOURCE_SHA256 = 'd39102890470f59d7c2a2e033851a6f3d1481a83fb6180b549acd4cbf22182b3';
export const V69P12R1_SCENE_COUNT = 295;
export const V69P12R1_DEFAULT_SCENE = 292;
export const V69P12R1_FLOORS = Object.freeze({ '1F': 290, '2F': 293, BOTH: 294 });

export function resolveV69P12R1FloorBridge({
  gltf, loadedSourceSha256, sourceKind, hasC70Preview = false, resolveChainScenes,
}) {
  if (sourceKind !== 'work-test' || hasC70Preview ||
      loadedSourceSha256 !== V69P12R1_SOURCE_SHA256 ||
      typeof resolveChainScenes !== 'function') return null;
  const json = gltf?.parser?.json;
  const extras = json?.asset?.extras;
  if (json?.scenes?.length !== V69P12R1_SCENE_COUNT ||
      json?.scene !== V69P12R1_DEFAULT_SCENE ||
      extras?.current !== false || extras?.asBuilt !== false ||
      !extras?.viewerFloorScenes ||
      !Object.entries(V69P12R1_FLOORS).every(([floor, index]) =>
        extras.viewerFloorScenes[floor] === index)) return null;
  const resolved = resolveChainScenes(gltf);
  if (!resolved || !Object.entries(V69P12R1_FLOORS).every(([floor, index]) =>
      resolved.indices?.[floor] === index &&
      resolved.scenes?.[floor] === gltf.scenes?.[index])) return null;
  return resolved;
}
