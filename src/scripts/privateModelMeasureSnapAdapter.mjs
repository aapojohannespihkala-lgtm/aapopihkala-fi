import * as THREE from 'three';
import {chooseMeasureFeatureSnap,extractMeasureFeatureEdges} from './privateModelMeasureGeometry.mjs';

const finite=(...values)=>values.every(Number.isFinite);
const g1FromWorld=(p)=>({xM:p.x,yM:-p.z,sourceHeightYUpM:p.y});
const worldFromG1=(p)=>new THREE.Vector3(p.xM,p.sourceHeightYUpM,-p.yM);
const validG1=(p)=>p && finite(p.xM,p.yM,p.sourceHeightYUpM);
const isValidRect=(r)=>r && finite(r.left,r.top,r.width,r.height) && r.width>0 && r.height>0;
const MAX_TRIANGLES=30000;

/**
 * Convert a *previously validated frontmost source-mesh hit* into a corner/edge
 * snap candidate in the viewer's G1 coordinates. This adapter does NOT replace
 * the visibility-filtered source picker: both mandatory callbacks must return
 * true before a candidate is accepted.
 *
 * acceptsFrontmostHit(hit): the caller checks mesh visibility, hidden triangle
 * material groups, all ancestor visibility, non-presentation-only status,
 * local/global clipping and whether this is the frontmost eligible source hit.
 *
 * isFeatureVisible({sourceMesh,pointWorld,pointG1,kind,frontmostHit}):
 * the caller checks the candidate itself against the same visibility/clipping
 * rules and raycast occlusion. A visible hit does NOT imply its faraway edge
 * candidates are visible. Fail closed if either callback is absent.
 *
 * Intended for per-click usage, not every mouse-move frame. Large geometries
 * are rejected instead of running an unbounded full-mesh feature-edge scan.
 * WORK_TEST only: no surveyed dimensions or as-built assertions.
 */
export const snapFromVisibleMeshHit=({
  frontmostHit,camera,rect,pointerPx,acceptsFrontmostHit,isFeatureVisible,
  tolerancePx=12,maxWorldGapM=0.4,creaseDegrees=25,maxTriangles=MAX_TRIANGLES,
}={})=>{
  if(typeof acceptsFrontmostHit!=='function' ||
     typeof isFeatureVisible!=='function' ||
     !frontmostHit || acceptsFrontmostHit(frontmostHit)!==true ||
     !camera?.isCamera || !isValidRect(rect) ||
     !pointerPx || !finite(pointerPx.x,pointerPx.y) ||
     pointerPx.x<rect.left || pointerPx.x>rect.left+rect.width ||
     pointerPx.y<rect.top || pointerPx.y>rect.top+rect.height ||
     !Number.isInteger(maxTriangles) || maxTriangles<1 ||
     maxTriangles>MAX_TRIANGLES) return null;
  const mesh=frontmostHit.object;
  const geometry=mesh?.geometry;
  const positions=geometry?.attributes?.position;
  const index=geometry?.index;
  if(!mesh?.isMesh || !geometry?.isBufferGeometry || !positions ||
     !Number.isInteger(positions.count) || positions.count<3 ||
     !finite(frontmostHit.point?.x,frontmostHit.point?.y,frontmostHit.point?.z) ||
     !mesh.matrixWorld?.elements || !camera.projectionMatrix?.elements ||
     !camera.matrixWorldInverse?.elements) return null;
  const triangleCount=index ? index.count/3 : positions.count/3;
  if(!Number.isInteger(triangleCount) || triangleCount<1 ||
     triangleCount>maxTriangles || (index && !Number.isInteger(index.count))) return null;
  // Update only the given object's matrices: never reorient or mutate the model.
  mesh.updateWorldMatrix?.(true,false);
  camera.updateMatrixWorld?.(true);
  const modelMatrix=mesh.matrixWorld.clone();
  const viewProjection=new THREE.Matrix4().multiplyMatrices(
    camera.projectionMatrix,camera.matrixWorldInverse,
  );
  if(![...modelMatrix.elements,...viewProjection.elements].every(Number.isFinite)) return null;

  const positionArray=new Float64Array(positions.count*3);
  for(let i=0;i<positions.count;i++){
    const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
    if(!finite(x,y,z)) return null;
    positionArray.set([x,y,z],3*i);
  }
  const indices=index ? new Uint32Array(index.count) : null;
  if(indices) for(let i=0;i<index.count;i++){
    const v=index.getX(i);
    if(!Number.isInteger(v) || v<0 || v>=positions.count) return null;
    indices[i]=v;
  }
  const toG1=(x,y,z)=>g1FromWorld(new THREE.Vector3(x,y,z).applyMatrix4(modelMatrix));
  const segments=extractMeasureFeatureEdges({
    positions:positionArray,indices,toG1,creaseDegrees,maxTriangles,
  });
  if(!segments.length) return null;

  const projectToScreen=(p)=>{
    if(!validG1(p)) return {visible:false};
    const w=worldFromG1(p);
    const clip=new THREE.Vector4(w.x,w.y,w.z,1).applyMatrix4(viewProjection);
    if(!finite(clip.x,clip.y,clip.z,clip.w) || clip.w<=1e-9) return {visible:false};
    const nx=clip.x/clip.w,ny=clip.y/clip.w,nz=clip.z/clip.w;
    if(!finite(nx,ny,nz) || nx< -1 || nx>1 || ny< -1 || ny>1 ||
       nz< -1 || nz>1) return {visible:false};
    return {
      x:rect.left+(nx+1)*rect.width/2,
      y:rect.top+(1-ny)*rect.height/2,
      visible:true,invW:1/clip.w,
    };
  };
  const snap=chooseMeasureFeatureSnap({
    pointerPx,hitPointG1:g1FromWorld(frontmostHit.point),segments,
    projectToScreen,tolerancePx,maxWorldGapM,
    isCandidateVisible:(p,kind)=>
      isFeatureVisible({
        sourceMesh:mesh,pointWorld:worldFromG1(p),
        pointG1:p,kind,frontmostHit,
      })===true,
  });
  // Keep only plain G1 coordinates: no mutable mesh or internal raycast object
  // is persisted as part of the measurement's user-facing values.
  return snap && Object.freeze({
    kind:snap.kind,pointG1:Object.freeze({...snap.pointG1}),
    distancePx:snap.distancePx,workTestOnly:true,
  });
};
