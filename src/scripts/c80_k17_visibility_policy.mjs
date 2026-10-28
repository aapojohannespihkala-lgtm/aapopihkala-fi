/**
 * C80-only SOURCE_CONTEXT visibility correction, bound after original controller
 * verifies exact GLB SHA and GLTFLoader node associations.
 * K17 objects remain WORK_TEST source connectors; never proof of physical stairs.
 * Geometry, transforms, materials and identifiers are never changed.
 */
const K17_KIND = 'SOURCE_CONNECTOR_CONTEXT_NOT_FLOOR_ASSIGNMENT';
const K17_NAME = /^C80_SOURCE_CONTEXT__K17_CONNECTION_CONTEXT_(125[4-9]|126[0-7])$/;
const GROUP_NAME = 'C80_SOURCE_CONTEXT_SEPARATE_FROM_FLOOR_CONTENT';
const FAIL = reason => { throw new Error('C80_K17_FAIL_CLOSED: ' + reason); };

export function createC80K17VisibilityPolicy(runtimeGroup, sceneIndex) {
  if (![0,1,2].includes(sceneIndex) || runtimeGroup?.name !== GROUP_NAME + (sceneIndex === 0 ? '' : '_' + sceneIndex) ||
      runtimeGroup?.userData?.name !== GROUP_NAME ||
      runtimeGroup?.userData?.sourceOnly !== true ||
      runtimeGroup?.userData?.physicalHost !== 'HOST_HOLD' ||
      !Array.isArray(runtimeGroup?.children)) FAIL('Unverified C80 context group');
  const expectedCount = [18,22,21][sceneIndex];
  if (runtimeGroup.children.length !== expectedCount) FAIL('Scene context count mismatch');
  const originallyGroupVisible = runtimeGroup.visible;
  const items = runtimeGroup.children.map(obj => {
    const x=obj?.userData ?? {};
    const preserve = x.representationKind === K17_KIND;
    // Three.GLTFLoader allocates a suffix for duplicate C80 2F K17 object
    // names even though the original source node/extras remains canonical.
    const canonicalName = x.name;
    const expectedRuntimeName = canonicalName + (sceneIndex === 2 ? '_1' : '');
    const exactK17Name = K17_NAME.test(canonicalName) && obj.name === expectedRuntimeName;
    if (preserve && (!exactK17Name || !obj.isMesh ||
        x.presentationOnly !== true || x.sourceOnly !== true ||
        x.physicalHost !== 'HOST_HOLD' || x.current !== false || x.asBuilt !== false ||
        !x.ylisViewScope?.objectKey?.startsWith('C80_CONTEXT:K17_CONNECTION_CONTEXT_') ||
        x.ylisViewScope?.storeyScope !== (sceneIndex===1?'1F':'2F'))) {
      FAIL('K17 provenance/source scope mismatch');
    }
    if (!preserve && K17_NAME.test(canonicalName)) FAIL('Inconsistent K17 source kind');
    return { obj, preserve, originalVisible:obj.visible };
  });
  const kept = items.filter(i=>i.preserve);
  if (kept.length !== (sceneIndex===0?0:14) ||
      new Set(kept.map(i=>i.obj.name)).size !== kept.length) FAIL('Wrong K17 set');
  for (let n=1254;n<=1267;n++) {
    if (sceneIndex!==0 && !kept.some(i=>i.obj.userData.name.endsWith('_'+n)))
      FAIL('Missing original K17 reference '+n);
  }
  const restore = () => {
    runtimeGroup.visible = originallyGroupVisible;
    for (const item of items) item.obj.visible = item.originalVisible;
  };
  const apply = (requestedContextVisible) => {
    if (typeof requestedContextVisible !== 'boolean') FAIL('Boolean required');
    // Keep group traversable while its 14 K17 source references remain visible.
    // When ALL context is off in BOTH, all child meshes are hidden.
    runtimeGroup.visible = originallyGroupVisible;
    for (const item of items)
      item.obj.visible = item.originalVisible && (requestedContextVisible || item.preserve);
    return {
      contextVisible: requestedContextVisible && originallyGroupVisible,
      keptK17: requestedContextVisible || !originallyGroupVisible ? 0 : kept.filter(i=>i.originalVisible).length,
      suppressedContext: requestedContextVisible || !originallyGroupVisible ? 0 : items.filter(i=>!i.preserve && i.originalVisible).length
    };
  };
  return Object.freeze({apply,restore, sceneIndex, keptK17Original:kept.length});
}
