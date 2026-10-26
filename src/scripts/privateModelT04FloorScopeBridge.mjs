/**
 * T04 SOURCE_ONLY scope/material bridge for multi-primitive glTF source nodes.
 * Fail closed unless every renderable primitive belonging to ONE source
 * objectKey has its own source-verified local clipping plane installed.
 * The caller MUST prove loaded model SHA and G1 local-to-world transform.
 */
export function createT04FloorScopeBridge({ mainScope, sharedMeshes, clippingAdapters } = {}) {
  if (!mainScope || !Array.isArray(sharedMeshes) || !sharedMeshes.length ||
      !Array.isArray(clippingAdapters) || clippingAdapters.length !== sharedMeshes.length)
    throw new Error('T04_UNCONFIGURED');
  let disposed = false;
  const restoreMaterials = () => { for (const c of clippingAdapters) c.restore(); };
  const apply = (floor, evidence = {}) => {
    if (disposed) return { status: 'HOLD', reason: 'BRIDGE_DISPOSED' };
    if (floor === 'WHOLE') {
      mainScope.restore();
      restoreMaterials();
      return { status: 'WHOLE_ORIGINAL', report: null };
    }
    if (floor === 'BOTH') {
      restoreMaterials();
      return { status: 'D_BOTH_ORIGINAL', report: mainScope.apply('BOTH') };
    }
    if (floor !== '1F' && floor !== '2F') return { status: 'HOLD', reason: 'INVALID_FLOOR' };
    const successes = [];
    let lastReason = 'SOURCE_NOT_VERIFIED';
    for (const c of clippingAdapters) {
      const result = c.apply({ ...evidence, floor });
      const accepted = result.ok && result.materialClipped && c.active && c.activeFloor === floor;
      if (!accepted) { lastReason = result.reason; break; }
      successes.push(result);
    }
    const allVerified = successes.length === clippingAdapters.length;
    if (!allVerified) restoreMaterials();
    const sourceObjectKey = evidence.expectedObjectKey;
    const permit = allVerified ? {
      sourceObjectKey,
      meshes: sharedMeshes,
      clippedNow: () => clippingAdapters.every(c => c.active && c.activeFloor === floor),
    } : null;
    let report = mainScope.apply(floor, permit);
    const granted = allVerified && mainScope.t04Granted;
    if (!granted) {
      restoreMaterials();
      // If validation failed after installing a subset of source materials,
      // re-run the plain scope so no group remains visible without clipping.
      report = mainScope.apply(floor);
    }
    return { status: granted ? 'T04_CLIPPED_SOURCE' : 'T04_HOLD',
      clipReason: granted ? 'FULL_SOURCE_NODE_CLIPPED' : lastReason, report,
      t04ObjectKey: granted ? sourceObjectKey : null,
      primitiveCount: granted ? sharedMeshes.length : 0 };
  };
  const enforce = () => mainScope.enforce();
  const dispose = () => { mainScope.restore(); for (const c of clippingAdapters) c.dispose(); disposed = true; };
  return { apply, enforce, dispose };
}
