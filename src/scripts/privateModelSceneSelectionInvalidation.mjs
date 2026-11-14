/**
 * Invalidate a displayed object and its source card before a different glTF
 * scene root is mounted. An integer node index can mean a different object
 * across scenes or SHA versions, and must never retain a stale selection.
 *
 * Same-root camera/orbit changes preserve the user's selection.
 * This is a presentation guard, not a sourceLinks/CURRENT/as-built grant.
 */
export const shouldInvalidateModelSelection = ({ mountedRoot, nextRoot, selectedObject }) =>
  selectedObject != null && mountedRoot !== nextRoot;
