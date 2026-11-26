// Owner review 15.11.2026: the single-plane 2F plank floor sits exactly at the
// 1F wall-top height (Z 2.763) and z-fought with them. Bias only the materials
// of that named floor mesh toward the camera; geometry and colours unchanged.
const FLOOR_NAME = /^C80R2_V33_D2F_PALE_PLANK_FLOOR_SINGLE_PLANE/;
const done = new WeakSet();
const isFloor = object => {
  for (let node = object, depth = 0; node && depth < 3; node = node.parent, depth += 1)
    if (FLOOR_NAME.test(node.name ?? '')) return true;
  return false;
};
export function applyD2FFloorDepthBias(root) {
  if (!root || typeof root.traverse !== 'function' || done.has(root)) return 0;
  done.add(root);
  let count = 0;
  root.traverse(object => {
    if (object?.isMesh !== true || !isFloor(object)) return;
    for (const material of [].concat(object.material)) {
      if (!material || material.userData?.ylisFloorDepthBias) continue;
      // Gap strips are drawn over the planks: keep them a step closer.
      const gap = /GAP/.test(material.name ?? '');
      material.polygonOffset = true;
      material.polygonOffsetFactor = -1;
      material.polygonOffsetUnits = gap ? -4 : -2;
      material.userData = { ...(material.userData ?? {}), ylisFloorDepthBias: true };
      material.needsUpdate = true;
      count += 1;
    }
  });
  return count;
}
