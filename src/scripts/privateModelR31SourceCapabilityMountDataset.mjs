/**
 * Synchronize only the displayed source-capability label when a GLB scene is
 * mounted, replaced, or cleared. The caller supplies the already authenticated
 * loaded SHA and the exact-SHA capability lookup. This does NOT authorize any
 * geometry, sourceLinks, layer or publication change.
 */
export function syncR31SourceCapabilityMountDataset(canvas, mountedRoot, loadedSha, lookup) {
  const capability = mountedRoot && typeof lookup === 'function'
    ? lookup(loadedSha)
    : null;
  const label = typeof capability?.label === 'string' ? capability.label : '';
  if (canvas?.dataset) canvas.dataset.r31SourceCapabilities = label;
  return label;
}
