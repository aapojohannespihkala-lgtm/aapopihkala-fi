/** Viewer-only raycast priority for source-verified technical review palettes.
 * Never infer a technical system from a GLB name, opacity or node index.
 * The role is attached only to disposable materials owned by the review.
 */
export const TECHNICAL_REVIEW_PICK_ROLE = 'ylisTechnicalReviewPickRole';

export function markTechnicalReviewPickMaterials(materials) {
  if (!materials?.systems || typeof materials.systems !== 'object') return materials;
  const mark = (material, role) => {
    if (!material || typeof material !== 'object') return;
    material.userData = { ...(material.userData ?? {}), [TECHNICAL_REVIEW_PICK_ROLE]: role };
  };
  mark(materials.surface, 'context');
  mark(materials.line, 'context');
  for (const material of Object.values(materials.systems)) mark(material, 'system');
  return materials;
}

export function technicalReviewHitRole(hit) {
  const material = hit?.object?.material;
  const index = hit?.face?.materialIndex;
  // Multi-material intersections must name their specific face material.
  const selected = Array.isArray(material)
    ? (Number.isInteger(index) && index >= 0 && index < material.length
      ? material[index] : null)
    : material;
  const role = selected?.userData?.[TECHNICAL_REVIEW_PICK_ROLE];
  return role === 'context' || role === 'system' ? role : null;
}

/** Preserve ordinary front-most picking. Only see through a run of GREY
 * review context surfaces to a real rendered SYSTEM surface. Any untagged
 * eligible hit stops the look-through, and an untagged/absent system keeps
 * the selectable foreground building shell. Inputs retain raycaster order.
 */
export function firstVisibleTechnicalReviewHit(hits, acceptsHit) {
  let foreground = null;
  for (const hit of hits ?? []) {
    if (!acceptsHit(hit)) continue;
    const role = technicalReviewHitRole(hit);
    if (!foreground) {
      foreground = hit;
      if (role !== 'context') return hit;
      continue;
    }
    if (role === 'system') return hit;
    if (role !== 'context') return foreground;
  }
  return foreground;
}
