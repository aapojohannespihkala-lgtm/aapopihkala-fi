import * as THREE from 'three';
import {hasVisibleMaterial, isEffectivelyVisible} from './privateModelObjectVisibility';

/** A clicked visible mesh point in the viewer's Y-up source-model frame.
 * This is an approximate WORK_TEST observation, NEVER a surveyed coordinate.
 * The existing D-plan convention maps world X->YLIS X and world -Z->YLIS Y.
 */
export type WorkTest3DPoint = Readonly<{
  xM: number;
  yM: number;
  sourceHeightYUpM: number;
  /** The clicked mesh name is a model label, not a verified source-card ID. */
  surfaceObjectName: string | null;
  /** Viewer-facing unit normal in YLIS G1 coordinates; not an as-built mounting claim. */
  surfaceNormalG1: Readonly<{x: number; y: number; z: number}> | null;
  coordinateFrame: 'YLIS-G1-LOCAL';
  interpretation: 'WORK_TEST_MODEL_POINT_ONLY';
  exactXY: false;
  humanReview: 'NOT_RUN';
  current: false;
  canonical: false;
  asBuilt: false;
}>;

type Rect = {left:number;top:number;width:number;height:number};

const hasPresentationOnlyAncestor = (node: THREE.Object3D, root: THREE.Object3D) => {
  let current: THREE.Object3D | null = node;
  while(current && current!==root.parent){
    if(current.userData?.PresentationOnly === true) return true;
    if(current===root) break;
    current=current.parent;
  }
  return false;
};

/** A material array may contain both painted and hidden triangle groups.
 * A hit on a hidden group must not win over a visible surface behind it.
 * Keep single-material picking unchanged and reject unknown group indexes.
 */
const hasVisibleHitMaterial = (hit: THREE.Intersection): boolean => {
  const object = hit.object as THREE.Mesh;
  if (!Array.isArray(object.material)) return hasVisibleMaterial(object);
  const materialIndex = hit.face?.materialIndex;
  if (typeof materialIndex !== 'number' || !Number.isInteger(materialIndex) ||
    materialIndex < 0 || materialIndex >= object.material.length) return false;
  return hasVisibleMaterial({material: object.material[materialIndex]});
};

/** Raycast real visible source meshes only. No ground-plane guesses, no
 * interpolated physical positions, and no coordinates when nothing is hit.
 */
export const pickVisibleWorkTest3DPoint = ({
  clientX, clientY, rect, camera, modelRoot, raycaster,
}:{
  clientX:number;
  clientY:number;
  rect:Rect;
  camera:THREE.Camera;
  modelRoot:THREE.Object3D;
  raycaster:THREE.Raycaster;
}): WorkTest3DPoint | null => {
  if(![clientX,clientY,rect?.left,rect?.top,rect?.width,rect?.height]
    .every((v)=>Number.isFinite(v)) ||
    rect.width<=0 || rect.height<=0 ||
    clientX<rect.left || clientX>rect.left+rect.width ||
    clientY<rect.top || clientY>rect.top+rect.height ||
    modelRoot.children.length===0) return null;

  const ndc = new THREE.Vector2(
    ((clientX-rect.left)/rect.width)*2-1,
    -((clientY-rect.top)/rect.height)*2+1,
  );
  raycaster.setFromCamera(ndc,camera);
  const visibleHit=raycaster.intersectObjects(modelRoot.children,true).find((hit)=>{
    const object=hit.object as THREE.Mesh;
    return object.isMesh===true &&
      isEffectivelyVisible(object,modelRoot) &&
      hasVisibleHitMaterial(hit) &&
      !hasPresentationOnlyAncestor(object,modelRoot);
  });
  const p=visibleHit?.point;
  if(!visibleHit || !p || ![p.x,p.y,p.z].every(Number.isFinite)) return null;
  const objectLabel = visibleHit.object.name.trim().replace(/\s+/g, ' ').slice(0, 100) || null;
  // Mesh normals are local. Transform with inverse-transpose for nonuniform
  // scales and mirror cases; orient the face toward the picking camera.
  const localNormal = visibleHit.face?.normal;
  let surfaceNormalG1: {x:number; y:number; z:number} | null = null;
  if (localNormal) {
    const worldNormal = localNormal.clone().applyMatrix3(
      new THREE.Matrix3().getNormalMatrix(visibleHit.object.matrixWorld),
    );
    if (worldNormal.lengthSq() > 1e-12 &&
        [worldNormal.x, worldNormal.y, worldNormal.z].every(Number.isFinite)) {
      worldNormal.normalize();
      if (worldNormal.dot(raycaster.ray.direction) > 0) worldNormal.negate();
      surfaceNormalG1 = Object.freeze({
        x: worldNormal.x, y: -worldNormal.z, z: worldNormal.y,
      });
    }
  }
  return Object.freeze({
    xM:p.x,yM:-p.z,sourceHeightYUpM:p.y,
    surfaceObjectName:objectLabel, surfaceNormalG1,
    coordinateFrame:'YLIS-G1-LOCAL' as const,
    interpretation:'WORK_TEST_MODEL_POINT_ONLY' as const,
    exactXY:false as const,humanReview:'NOT_RUN' as const,
    current:false as const,canonical:false as const,asBuilt:false as const,
  });
};
