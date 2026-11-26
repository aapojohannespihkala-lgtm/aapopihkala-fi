import * as THREE from 'three';
import { closestClearanceBetweenSelectedSurfaces } from './privateModelSurfaceClearance.mjs';

/**
 * WORK_TEST source-mesh bridge for minimum 3D clearance. The existing helper
 * works in G1 (+X east, +Y north, +Z up) while glTF/THREE uses world Y-up.
 * This bridge NEVER claims that a raycast hit, visible mesh or as-built
 * geometry has been verified: the caller must independently certify both
 * source identities, clipping and unobscured triangles, including materials.
 *
 * Caller callbacks MUST return the boolean true (not truthy):
 * acceptsSourceMesh({mesh,sourceId}) - selected identity/source permission.
 * acceptsClippedTriangle(context) - entire triangle rendered inside current
 * local/global/floor clipping and visible material, not presentation-only.
 * isTriangleFrontmost(context) - entire triangle eligible under current
 * occlusion/frontmost policy. Uncertain/partly clipped faces are rejected.
 *
 * No UI controls, raycaster state or model geometry are changed.
 */
const finite=(...x)=>x.every(Number.isFinite);
const MAX_TRIANGLES_PER_SOURCE=64;
const isVisibleInHierarchy=(mesh)=>{
  for(let node=mesh;node;node=node.parent) if(node.visible===false) return false;
  return true;
};
const pointG1=(p)=>Object.freeze({
  xM:p.x,yM:-p.z,sourceHeightYUpM:p.y,
});
const usableMesh=(mesh,maxTriangles)=>{
  const geom=mesh?.geometry,position=geom?.attributes?.position,index=geom?.index;
  if(!mesh?.isMesh || mesh.isInstancedMesh || mesh.isSkinnedMesh ||
     !geom?.isBufferGeometry || !position ||
     geom.morphAttributes?.position?.length ||
     !isVisibleInHierarchy(mesh) ||
     !Number.isInteger(position.count) || position.count<3 ||
     !mesh.matrixWorld?.isMatrix4) return false;
  const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  if(!materials.length || !materials.some(m=>m?.visible===true)) return false;
  const elementCount=index ? index.count : position.count;
  if(!Number.isInteger(elementCount) || elementCount%3!==0 ||
     elementCount<3 || elementCount/3>maxTriangles) return false;
  const draw=geom.drawRange;
  if(draw && (draw.start!==0 ||
     (Number.isFinite(draw.count) && draw.count<elementCount))) return false;
  return true;
};
const readSource=(selected,maxTriangles,acceptsSourceMesh,
  acceptsClippedTriangle,isTriangleFrontmost)=>{
  const sourceId=selected?.sourceId,mesh=selected?.mesh;
  if(typeof sourceId!=='string' || !sourceId.trim() ||
     !usableMesh(mesh,maxTriangles) ||
     acceptsSourceMesh({mesh,sourceId})!==true) return null;
  // Update only this object's world matrix. No geometry or scene edits.
  mesh.updateWorldMatrix?.(true,false);
  const matrix=mesh.matrixWorld;
  const e=matrix.elements;
  if(e.length!==16 || !e.every(Number.isFinite) ||
     !finite(e[3],e[7],e[11],e[15]) ||
     e[3]!==0 || e[7]!==0 || e[11]!==0 ||
     Math.abs(e[15]-1)>1e-12 ||
     !Number.isFinite(matrix.determinant()) ||
     Math.abs(matrix.determinant())<1e-12) return null;
  const position=mesh.geometry.attributes.position,index=mesh.geometry.index;
  const count=(index?index.count:position.count)/3;
  const triangles=[],visible=[];
  for(let i=0;i<count;i++){
    const worldTriangle=[];
    for(let j=0;j<3;j++){
      const vertex=index ? index.getX(3*i+j) : 3*i+j;
      if(!Number.isInteger(vertex)||vertex<0||vertex>=position.count) return null;
      const x=position.getX(vertex),y=position.getY(vertex),z=position.getZ(vertex);
      if(!finite(x,y,z)) return null;
      const w=new THREE.Vector3(x,y,z).applyMatrix4(matrix);
      if(!finite(w.x,w.y,w.z)) return null;
      worldTriangle.push(w);
    }
    const triangle=Object.freeze(worldTriangle.map(pointG1));
    triangles.push(triangle);
    const context=Object.freeze({
      mesh,sourceId,triangleIndex:i,
      triangleG1:triangle,worldTriangle:Object.freeze(worldTriangle),
    });
    visible.push(acceptsClippedTriangle(context)===true &&
      isTriangleFrontmost(context)===true);
  }
  return {surface:{sourceId,triangles},visible};
};

/**
 * Two *explicitly selected different* source meshes. All requested source,
 * clipping and frontmost predicates are mandatory. Fail closed if the
 * viewer cannot establish their truth for each complete triangle.
 * Maximum 64 triangles/mesh, 4096 triangle pairs, no deformed or partial
 * BufferGeometry. For larger sources the caller must first provide a
 * separately validated bounded selection, not silently truncate a mesh.
 */
export const closestVisibleSourceMeshClearance=({
  sourceA,sourceB,acceptsSourceMesh,acceptsClippedTriangle,
  isTriangleFrontmost,maxTrianglesPerSource=MAX_TRIANGLES_PER_SOURCE,
}={})=>{
  if(!sourceA||!sourceB||sourceA.mesh===sourceB.mesh ||
     sourceA.sourceId===sourceB.sourceId ||
     typeof acceptsSourceMesh!=='function' ||
     typeof acceptsClippedTriangle!=='function' ||
     typeof isTriangleFrontmost!=='function' ||
     !Number.isInteger(maxTrianglesPerSource) ||
     maxTrianglesPerSource<1 ||
     maxTrianglesPerSource>MAX_TRIANGLES_PER_SOURCE) return null;
  try{
    const a=readSource(sourceA,maxTrianglesPerSource,acceptsSourceMesh,
      acceptsClippedTriangle,isTriangleFrontmost);
    const b=readSource(sourceB,maxTrianglesPerSource,acceptsSourceMesh,
      acceptsClippedTriangle,isTriangleFrontmost);
    if(!a||!b) return null;
    const result=closestClearanceBetweenSelectedSurfaces({
      surfaceA:a.surface,surfaceB:b.surface,
      acceptsTriangleA:(_t,i)=>a.visible[i]===true,
      acceptsTriangleB:(_t,i)=>b.visible[i]===true,
    });
    return result ? Object.freeze({
      ...result,meshWorldToG1Adapter:true,
      renderedSourceChecksCallerSupplied:true,
    }) : null;
  }catch{
    return null;
  }
};
