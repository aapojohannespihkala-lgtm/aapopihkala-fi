import { Matrix4, Plane, Raycaster, Vector2, Vector3 } from 'three';

/**
 * Source-anchored P137E pointer position for the YLIS-G1-LOCAL XY plan.
 * An explicitly source-verified rigid YLIS-G1 -> Three.js world transform,
 * source-bounded XY footprint and source-local floor Z are MANDATORY.
 *
 * This module does not infer physical installations, model transforms or floors.
 * It creates no marker, writes no source and cannot claim HUMAN_REVIEW.
 * Viewer integration must bind these inputs from an exact authenticated scene.
 */
const reject = reason => { throw new Error('P137E_SOURCE_XY_READOUT_REJECTED:' + reason); };
const finite = value => typeof value === 'number' && Number.isFinite(value);
const almost = (a,b,tol=1e-6) => Math.abs(a-b)<=tol;
const validRigid = m => {
  if (!m?.isMatrix4 || !Array.isArray(m.elements) || m.elements.length!==16 ||
      !m.elements.every(finite) || !almost(m.determinant(),1)) return false;
  const e=m.elements;
  const basis=[
    new Vector3(e[0],e[1],e[2]),
    new Vector3(e[4],e[5],e[6]),
    new Vector3(e[8],e[9],e[10]),
  ];
  return basis.every(v=>almost(v.lengthSq(),1)) &&
    almost(basis[0].dot(basis[1]),0) &&
    almost(basis[0].dot(basis[2]),0) &&
    almost(basis[1].dot(basis[2]),0) &&
    almost(e[3],0) && almost(e[7],0) && almost(e[11],0) &&
    almost(e[15],1);
};
const validBounds = b => b && [b.minX,b.maxX,b.minY,b.maxY].every(finite) &&
  b.maxX>b.minX && b.maxY>b.minY &&
  b.maxX-b.minX<500 && b.maxY-b.minY<500;

/**
 * Returns null for a pointer ray missing the specified source floor plane or
 * outside the explicit source XY extent. The raw result retains metre values
 * without synthetic rounding or inferred G1 origin.
 */
export function locateP137ESourceXYAtPointer({
  camera, pointerNdc, worldFromYlisG1, sourceTransformVerified,
  floorLocalZ, sourceBounds,
}={}) {
  if (!camera?.isCamera || !(camera.isPerspectiveCamera || camera.isOrthographicCamera) ||
      typeof camera.updateMatrixWorld !== 'function' ||
      !pointerNdc || !finite(pointerNdc.x) || !finite(pointerNdc.y) ||
      Math.abs(pointerNdc.x)>1 || Math.abs(pointerNdc.y)>1 ||
      sourceTransformVerified!==true ||
      !validRigid(worldFromYlisG1) ||
      !finite(floorLocalZ) || Math.abs(floorLocalZ)>100 ||
      !validBounds(sourceBounds)) {
    reject('missing exact source transform, floor, camera or bounded pointer');
  }
  camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix();
  const worldPoint = new Vector3(0,0,floorLocalZ).applyMatrix4(worldFromYlisG1);
  const worldNormal = new Vector3(0,0,1).transformDirection(worldFromYlisG1);
  const plane = new Plane().setFromNormalAndCoplanarPoint(worldNormal,worldPoint);
  const raycaster = new Raycaster();
  raycaster.setFromCamera(new Vector2(pointerNdc.x,pointerNdc.y),camera);
  const hit = raycaster.ray.intersectPlane(plane,new Vector3());
  if (!hit) return null;
  const local = hit.clone().applyMatrix4(new Matrix4().copy(worldFromYlisG1).invert());
  if (!almost(local.z,floorLocalZ,1e-5) ||
      local.x<sourceBounds.minX || local.x>sourceBounds.maxX ||
      local.y<sourceBounds.minY || local.y>sourceBounds.maxY) return null;
  return Object.freeze({
    sourceCoordinateSystem:'YLIS-G1-LOCAL',sourceXMetres:local.x,sourceYMetres:local.y,
    sourceFloorZMetres:floorLocalZ,
    coordinateMethod:'RAY_TO_EXPLICIT_SOURCE_FLOOR_WITH_RIGID_INVERSE',
    transformProvenance:'CALLER_VERIFIED_SOURCE_MATRIX',
    presentationOnly:true,physicalDevicePositionVerified:false,
    current:false,canonical:false,asBuilt:false,humanReview:'NOT_RUN',
  });
}
