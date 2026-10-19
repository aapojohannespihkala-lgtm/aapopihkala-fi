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
      hasVisibleMaterial(object) &&
      !hasPresentationOnlyAncestor(object,modelRoot);
  });
  const p=visibleHit?.point;
  if(!p || ![p.x,p.y,p.z].every(Number.isFinite)) return null;
  return Object.freeze({
    xM:p.x,yM:-p.z,sourceHeightYUpM:p.y,
    coordinateFrame:'YLIS-G1-LOCAL' as const,
    interpretation:'WORK_TEST_MODEL_POINT_ONLY' as const,
    exactXY:false as const,humanReview:'NOT_RUN' as const,
    current:false as const,canonical:false as const,asBuilt:false as const,
  });
};
