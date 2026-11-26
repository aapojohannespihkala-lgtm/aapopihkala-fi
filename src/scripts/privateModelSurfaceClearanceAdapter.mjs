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
// A material may be flagged visible but produce no visible pixels.
// Exclude fully transparent blending and depth-only draw passes. Other
// textured alpha/clipping/occlusion still require caller-provided guards.
const rendersVisibleColor=(material)=>material?.visible===true &&
  material.colorWrite!==false &&
  !(material.transparent===true &&
    (!Number.isFinite(material.opacity)||material.opacity<=0));
const usableMesh=(mesh)=>{
  const geom=mesh?.geometry,position=geom?.attributes?.position,index=geom?.index;
  if(!mesh?.isMesh || mesh.isInstancedMesh || mesh.isBatchedMesh || mesh.isSkinnedMesh ||
     !geom?.isBufferGeometry || !position ||
     geom.morphAttributes?.position?.length ||
     !isVisibleInHierarchy(mesh) ||
     !Number.isSafeInteger(position.count) || position.count<3 ||
     !mesh.matrixWorld?.isMatrix4) return false;
  const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  if(!materials.length || !materials.some(rendersVisibleColor)) return false;
  const elementCount=index ? index.count : position.count;
  if(!Number.isSafeInteger(elementCount) || elementCount%3!==0 ||
     elementCount<3) return false;
  const draw=geom.drawRange;
  if(draw && (draw.start!==0 ||
     (Number.isFinite(draw.count) && draw.count<elementCount))) return false;
  return true;
};

// Material arrays need a unique glTF/Three draw group for the selected face;
// a visible OTHER material group is not evidence that this face renders.
const visibleFaceMaterial=(mesh,faceIndex)=>{
  if(!Array.isArray(mesh.material)) return rendersVisibleColor(mesh.material);
  const first=3*faceIndex;
  let selected=null;
  for(const group of mesh.geometry.groups){
    if(!Number.isSafeInteger(group.start)||!Number.isSafeInteger(group.count)||
       group.start<0||group.count<3) return false;
    if(group.start<=first && group.start+group.count>=first+3){
      if(selected!==null) return false; // overlapping material groups
      selected=group.materialIndex;
    }
  }
  return Number.isInteger(selected) && selected>=0 &&
    rendersVisibleColor(mesh.material[selected]);
};
const readSource=(selected,maxTriangles,acceptsSourceMesh,
  acceptsClippedTriangle,isTriangleFrontmost)=>{
  const sourceId=selected?.sourceId,mesh=selected?.mesh;
  if(typeof sourceId!=='string' || !sourceId.trim() ||
     !usableMesh(mesh)) return null;

  const position=mesh.geometry.attributes.position,index=mesh.geometry.index;
  const totalFaces=(index?index.count:position.count)/3;
  const patch=selected.selectedFaceIndices;
  const isPatch=patch!==undefined;
  // For a large source mesh a caller MUST supply face indices from a
  // separately validated, bounded, selected source-hit neighbourhood.
  // Never silently pick the first 64 triangles of a larger mesh.
  if(isPatch && (!Array.isArray(patch) || !patch.length ||
     patch.length>maxTriangles ||
     patch.some(i=>!Number.isSafeInteger(i)||i<0||i>=totalFaces) ||
     new Set(patch).size!==patch.length)) return null;
  if(!isPatch && totalFaces>maxTriangles) return null;
  const faceIndices=isPatch ? [...patch] :
    Array.from({length:totalFaces},(_,i)=>i);
  const anchor=selected.frontmostHit;
  if(isPatch && (!anchor || anchor.object!==mesh ||
     !Number.isSafeInteger(anchor.faceIndex) ||
     !faceIndices.includes(anchor.faceIndex) ||
     !anchor.point ||
     !finite(anchor.point.x,anchor.point.y,anchor.point.z))) return null;
  if(acceptsSourceMesh({
    mesh,sourceId,frontmostHit:anchor,
    selectedFaceIndices:isPatch?Object.freeze([...faceIndices]):undefined,
  })!==true) return null;

  mesh.updateWorldMatrix?.(true,false);
  const matrix=mesh.matrixWorld;
  const e=matrix.elements;
  if(e.length!==16 || !e.every(Number.isFinite) ||
     !finite(e[3],e[7],e[11],e[15]) ||
     e[3]!==0 || e[7]!==0 || e[11]!==0 ||
     Math.abs(e[15]-1)>1e-12 ||
     !Number.isFinite(matrix.determinant()) ||
     Math.abs(matrix.determinant())<1e-12) return null;
  const triangles=[],visible=[];
  for(const faceIndex of faceIndices){
    // A face of a hidden material group must not supply a measurement
    // even if the source object's other material groups are rendered.
    if(!visibleFaceMaterial(mesh,faceIndex)) return null;
    const worldTriangle=[];
    for(let j=0;j<3;j++){
      const vertex=index ? index.getX(3*faceIndex+j) : 3*faceIndex+j;
      if(!Number.isInteger(vertex)||vertex<0||vertex>=position.count) return null;
      const x=position.getX(vertex),y=position.getY(vertex),z=position.getZ(vertex);
      if(!finite(x,y,z)) return null;
      const w=new THREE.Vector3(x,y,z).applyMatrix4(matrix);
      if(!finite(w.x,w.y,w.z)) return null;
      worldTriangle.push(w);
    }
    // A selected face index and a finite hit point are insufficient evidence
    // that they still refer to the SAME face. Scene or geometry changes can
    // leave a stale hit attached to this mesh. Validate its exact world-space
    // triangle before considering even a caller-approved bounded face patch.
    if(isPatch && faceIndex===anchor.faceIndex){
      const closest=new THREE.Triangle(...worldTriangle)
        .closestPointToPoint(anchor.point,new THREE.Vector3());
      if(!finite(closest.x,closest.y,closest.z) ||
         closest.distanceToSquared(anchor.point)>1e-10) return null;
    }
    const triangle=Object.freeze(worldTriangle.map(pointG1));
    triangles.push(triangle);
    const context=Object.freeze({
      mesh,sourceId,triangleIndex:faceIndex,originalFaceIndex:faceIndex,
      frontmostHit:anchor,
      triangleG1:triangle,worldTriangle:Object.freeze(worldTriangle),
    });
    visible.push(acceptsClippedTriangle(context)===true &&
      isTriangleFrontmost(context)===true);
  }
  // If the origin of the selected patch is no longer visible/frontmost,
  // reject the entire candidate rather than using its neighbours.
  if(isPatch && !visible[faceIndices.indexOf(anchor.faceIndex)]) return null;
  return {surface:{sourceId,triangles},visible,faceIndices,isPatch};
};

/**
 * Two *explicitly selected different* source meshes. All requested source,
 * clipping and frontmost predicates are mandatory. A whole mesh is accepted
 * only when <=64 triangles. Large meshes require 1..64 explicit original
 * selectedFaceIndices AND frontmostHit {object,faceIndex,point}; the anchor
 * must itself pass both independent visibility checks. No automatic patch
 * expansion or first-N fallback; result is shortest ONLY within the
 * caller-approved bounded faces, not the minimum for entire source meshes.
 * Output triangle indices always refer to ORIGINAL mesh face indices.
 * Nonfinite, deformed and partially drawn geometry remains fail-closed.
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
      ...result,
      // The pure helper indexes the selected patch. Report original source
      // face IDs, including when selected faces are non-contiguous.
      triangleAIndex:a.faceIndices[result.triangleAIndex],
      triangleBIndex:b.faceIndices[result.triangleBIndex],
      boundedSourcePatch:a.isPatch||b.isPatch,
      entireSelectedMeshesCompared:!a.isPatch&&!b.isPatch,
      meshWorldToG1Adapter:true,
      renderedSourceChecksCallerSupplied:true,
    }) : null;
  }catch{
    return null;
  }
};
