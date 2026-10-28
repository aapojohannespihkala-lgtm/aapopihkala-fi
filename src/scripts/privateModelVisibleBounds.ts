import { THREE } from './threeRuntime';

export const computeVisibleBounds = (
  root: any,
  includeNonMeshGeometry = false,
  excludeSourceContextFromFit = false,
) => {
  const bounds = new THREE.Box3();
  let found = false;
  const presentation = root.userData?.C80Presentation;
  // C80's floor scenes retain display-only context outside the occupied floor.
  // Exclude it from camera fitting only; keep visibility, picking and full-context
  // bounds under their existing owners. Other sources keep their old bounds.
  const fitC80Content = excludeSourceContextFromFit &&
    presentation?.sourceContextSeparated === true &&
    ['BOTH', '1F', '2F'].includes(presentation.view);

  root.updateMatrixWorld(true);
  root.traverse((object: any) => {
    const boundsEligible =
      object.isMesh ||
      (includeNonMeshGeometry && (object.isLine || object.isLineSegments || object.isPoints));
    if (!boundsEligible || !object.visible || !object.geometry) return;
    if (fitC80Content && object.name.startsWith('C80_SOURCE_CONTEXT__')) return;

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

