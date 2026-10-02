import { THREE } from './threeRuntime';

export const computeVisibleBounds = (root: any, includeNonMeshGeometry = false) => {
  const bounds = new THREE.Box3();
  let found = false;

  root.updateMatrixWorld(true);
  root.traverse((object: any) => {
    const boundsEligible =
      object.isMesh ||
      (includeNonMeshGeometry && (object.isLine || object.isLineSegments || object.isPoints));
    if (!boundsEligible || !object.visible || !object.geometry) return;

    let current = object.parent;
    while (current && current !== root.parent) {
      if (!current.visible) return;
      current = current.parent;
    }

    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    if (!object.geometry.boundingBox) return;

    const objectBounds = object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld);
    if (objectBounds.isEmpty()) return;
    bounds.union(objectBounds);
    found = true;
  });

  return found ? bounds : null;
};
