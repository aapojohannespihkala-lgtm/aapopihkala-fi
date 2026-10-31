import { isSourceSceneRoot } from './privateModelSourceNodeAssociations.mjs';
// C80-015 / DBOTH-WP3: the exact HI20 WHOLE23 scene has the 1F floor
// but omits the unified 2F floor already present in its BOTH51 source scene.
// Restore only that existing mesh1795 as a reversible WORK_TEST view copy.
// No new geometry, no scene array modification, no CURRENT/as-built claim.
export const C015_SOURCE_SHA =
  '15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
const floorId = 5892;
const floorName = 'HI20_WP2_C017_NORTH_86MM_GAP_FLOOR_BOTH_OPTIN_WORK_TEST_HOST_HOLD';
const unavailable = reason => ({
  available:false, reason, count:0, enabled:false,
  setEnabled:()=>false, dispose:()=>{},
});
export function createHi20C015WholeFloorPresentation(gltf, verifiedSha) {
  const json = gltf?.parser?.json;
  const association = gltf?.parser?.associations;
  if (verifiedSha !== C015_SOURCE_SHA || json?.asset?.version !== '2.0' ||
      json.asset?.extras?.current !== false ||
      json.asset?.extras?.asBuilt !== false ||
      json.scene !== 0 || json.scenes?.length !== 52 ||
      gltf?.scenes?.length !== 52 ||
      typeof association?.get !== 'function')
    return unavailable('source-sha-or-scenes');
  const whole = gltf.scenes[23];
  const both = gltf.scenes[51];
  const node = json.nodes?.[floorId];
  const mesh = json.meshes?.[1795];
  if (!isSourceSceneRoot(whole) || !isSourceSceneRoot(both) ||
      !json.scenes[51]?.nodes?.includes(floorId) ||
      json.scenes[23]?.nodes?.includes(floorId) ||
      node?.name !== floorName || node.mesh !== 1795 ||
      node.extras?.stage !== 'WORK_TEST' ||
      node.extras?.physicalHost !== 'HOST_HOLD' ||
      node.extras?.current !== false ||
      node.extras?.asBuilt !== false ||
      Math.abs(node.extras?.areaM2 - 63.006272305026044) > 1e-5 ||
      node.extras?.addedStripAreaM2 !== 0.15479991851807995 ||
      node.extras?.sourceFloorNode !== 5869 ||
      node.extras?.sourceMesh !== 1787 ||
      node.extras?.humanReview !== 'NOT_RUN' ||
      node.extras?.sourceHI20GLBSHA256 !== '8ddb398d9eb981d92ed444afcfad93ceb2224b1ce9898599553ede9b4136b87d' ||
      !Array.isArray(node.extras?.sourceLinks) ||
      !node.extras.sourceLinks.includes('C80-017 HI20 floor') ||
      mesh?.name !== 'HI20_WP2_C80-017_NORTH_86MM_GAP_FILLED_ONE_TOPOLOGIC_FLOOR' ||
      mesh?.primitives?.length !== 1 || mesh.primitives[0].material !== 216 ||
      mesh.extras?.physicalHost !== 'HOST_HOLD' ||
      !Array.isArray(mesh.extras?.originalSourceNodes) ||
      mesh.extras.originalSourceNodes.join(',') !== '5229,5317,5319')
    return unavailable('floor-source-identity');
  // Prevent a shared ancestor or an existing floor presentation from
  // introducing a coincident surface into WHOLE23.
  let preexisting = false;
  whole.traverse?.(obj => {
    const source = association.get(obj);
    if (source?.nodes === floorId || source?.meshes === 1795) preexisting = true;
  });
  if (preexisting) return unavailable('whole-already-has-floor');
  const sourceRoots = both.children.filter(obj =>
    obj?.isMesh === true && obj.name === floorName &&
    association.get(obj)?.nodes === floorId);
  if (sourceRoots.length !== 1 || sourceRoots[0].visible !== true)
    return unavailable('source-floor-instance');
  const source = sourceRoots[0];
  if (!source.geometry || !source.material || Array.isArray(source.material) ||
      source.material.name !== 'HI02_C80-015_2F_FLOOR_PALE_NEUTRAL_WORK_TEST')
    return unavailable('source-floor-material');
  // Source is a root in BOTH51. Reuse exactly the same local transform.
  const copy = source.clone(false);
  if (!copy?.isMesh || copy.name !== source.name ||
      copy.geometry !== source.geometry || copy.material !== source.material ||
      !copy.position?.equals?.(source.position) ||
      !copy.quaternion?.equals?.(source.quaternion) ||
      !copy.scale?.equals?.(source.scale))
    return unavailable('source-floor-clone');
  // Do not assign an invented parser association for a new source-scene
  // pairing. The source object in scene51 remains the canonical pick target.
  copy.userData = { ...copy.userData, workTestDisplaySourceScene:51,
    workTestDisplaySourceNode:floorId };
  whole.add(copy);
  let enabled = true;
  return {
    available:true, reason:null, count:1,
    get enabled(){return enabled;},
    setEnabled(next){enabled=Boolean(next);copy.visible=enabled;return true;},
    dispose(){whole.remove(copy);enabled=false;},
  };
}
