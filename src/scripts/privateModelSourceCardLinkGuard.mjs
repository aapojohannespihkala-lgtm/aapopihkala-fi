/**
 * A mismatched source-card identity cannot authorize the selected object's
 * inherited sourceLinks. The same numeric node index can identify unrelated
 * geometry in another source GLB. Keep ordinary source links for matched,
 * unbound and temporarily unavailable card bundles.
 *
 * Presentation-only fail-closed guard: never grants CURRENT/as-built status.
 */
export const sourceLinksForSelectionEvidence = (evidence, links) =>
  evidence?.state === 'mismatch' ? [] : Array.isArray(links) ? links : [];
