import { D1F_BATHROOM_ASSET, D1F_BATHROOM_TARGETS, bathroomGeometryBounds } from './privateModelD1FBathroomScene.mjs';
export const D1F_BATHROOM_SUPPRESSION=Object.freeze(Object.fromEntries(D1F_BATHROOM_TARGETS.map(id=>[id,
 ['I03','CORNER_NORTH_X2337','CORNER_SOUTH_X2337','CORNER_MIDDLE_X2589','LOBBY_DOOR_REVEALS','B_WALL_CONTINUITY'].includes(id)
 ? 'CONTINUOUS_WALL_DECLARED_SOURCE_TRIANGLES_ONLY' : id+'_NODE_VISIBILITY_ONLY'])));
const reject=()=>{throw new Error('D1F_BATHROOM_PIXEL_RUNTIME_REJECTED');};
const near=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<.00001;
export function createD1FBathroomPixelRuntime({THREE,selected,sourceSha,camera,controls,canvas,render}){
 if(sourceSha!==D1F_BATHROOM_ASSET.sha256||selected?.bathroomReview!==true||!camera?.isPerspectiveCamera||!selected.wall?.isMesh)reject();
 selected.scene.updateMatrixWorld(true);
 const wall=selected.wall,sourceGeometry=wall.geometry,sourceIndex=sourceGeometry.index.array;
 const objects=new Map([['BASIN',selected.counter],['CABINET',selected.cabinet],...Object.entries(selected.surfaces)]);
 const patches=new Map(Object.entries(selected.surfaceTargets).map(([id,offsets])=>[id,{offsets:[...offsets],vertices:bathroomGeometryBounds(wall,offsets).vertices}]));
 const initialVisibility=new Map([...new Set([wall,...objects.values()])].map(o=>[o,o.visible]));
 const original={position:camera.position.clone(),quaternion:camera.quaternion.clone(),up:camera.up.clone(),
  aspect:camera.aspect,fov:camera.fov,near:camera.near,far:camera.far,target:controls.target.clone(),
  enabled:controls.enabled,damping:controls.enableDamping,autoRotate:controls.autoRotate};
 let prepared=null,hidden=null,masked=null,locked=null,disposed=false;
 const fingerprint=()=>{camera.updateMatrixWorld(true);return JSON.stringify({projection:camera.projectionMatrix.toArray(),pose:camera.matrixWorld.toArray()});};
 const pinFrame=()=>{
  if(disposed||!locked)return;
  camera.position.copy(locked.position);camera.quaternion.copy(locked.quaternion);camera.up.copy(locked.up);
  camera.projectionMatrix.copy(locked.projection);camera.projectionMatrixInverse.copy(locked.inverse);
  camera.aspect=locked.aspect;camera.fov=locked.fov;camera.updateMatrixWorld(true);
 };
 const restoreTarget=()=>{
  if(patches.has(hidden)){wall.geometry=sourceGeometry;masked?.dispose();masked=null;}
  else if(hidden)objects.get(hidden).visible=true;
  hidden=null;render();return wall.geometry===sourceGeometry;
 };
 const inspectCorrections=()=>{
  if(wall.geometry!==sourceGeometry)reject();
  const sb=bathroomGeometryBounds(selected.counter),cb=bathroomGeometryBounds(selected.cabinet);
  const db=bathroomGeometryBounds(wall,patches.get('LOBBY_DOOR_REVEALS').offsets);
  const b=bathroomGeometryBounds(wall,patches.get('B_WALL_CONTINUITY').offsets),wb=bathroomGeometryBounds(wall);
  if(!near(sb.hi[2]-sb.lo[2],.060)||!near(cb.lo[2]-.080,.220)||!near(cb.hi[2],sb.lo[2])||
   !near(db.hi[0]-db.lo[0],.710)||!near(db.hi[2]-db.lo[2],1.935)||!near(b.hi[2],2.760)||!near(wb.hi[2],2.760))reject();
  for(const [id,o] of Object.entries(selected.surfaces)){
   const bb=bathroomGeometryBounds(o),z=id.includes('CEILING')?2.430:id==='ORDINARY_FLOOR'?0:.080;
   if(!near(bb.lo[2],z)||!near(bb.hi[2],z))reject();
  }
  let footprints=0;selected.scene.traverse(o=>{if(o.userData?.representationKind==='referenceFootprint')footprints++;});
  if(footprints!==0)reject();
  return {state:'GEOMETRY_VERIFIED',gate:'PASS_BATHROOM_SURFACES_CABINET_CONTINUOUS_WALLS_LOADED_GEOMETRY',
   glbSha256:sourceSha,variant:selected.variant,clearDoorWidthMm:710,clearDoorHeightMm:1935,
   counterThicknessMm:60,counterThicknessMeasured:true,cabinetDimensionsMm:[995,480,585],
   cabinetFloorClearanceMm:220,cabinetFreeEdgeInsetsMm:[15,15,15],wetFloorRelativeMm:80,
   kphCeilingSourceZM:2.430,kphRoomHeightApproxMm:2350,saunaCeilingHeightMeasured:false,
   saunaCeilingSourceZM:2.430,saunaCeilingHeightBasis:'WORK_HYPOTHESIS_SAME_AS_KPH',
   fullWallTopSourceZM:2.760,wallContinuationMeasured:false,reachableRoomFootprintCount:footprints,
   pixelsVerifiedByThisRuntime:false,humanReview:'NOT_RUN'};
 };
 inspectCorrections();
 const prepare=(targetId,viewIndex=0)=>{
  if(disposed||!D1F_BATHROOM_TARGETS.includes(targetId)||!Number.isInteger(viewIndex)||viewIndex<0||viewIndex>3)reject();
  if(!restoreTarget())reject();
  for(const [o,v] of initialVisibility)o.visible=v;
  for(const [id,o] of objects)if(id.includes('CEILING'))o.visible=id===targetId;
  const object=patches.has(targetId)?wall:objects.get(targetId);
  if(!object?.visible)reject();
  const vertices=patches.has(targetId)?patches.get(targetId).vertices:bathroomGeometryBounds(object).vertices;
  object.updateWorldMatrix(true,false);
  const points=vertices.map(i=>new THREE.Vector3().fromBufferAttribute(object.geometry.attributes.position,i).applyMatrix4(object.matrixWorld));
  const bounds=new THREE.Box3().setFromPoints(points),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  const rect=canvas.getBoundingClientRect(),width=Math.round(rect.width),height=Math.round(rect.height);
  if(width<320||height<320||![...size.toArray(),...center.toArray()].every(Number.isFinite))reject();
  const flat=targetId.includes('FLOOR')||targetId.includes('CEILING');
  const interior=targetId==='I03'&&viewIndex===0,door=targetId==='LOBBY_DOOR_REVEALS'&&viewIndex===0;
  camera.aspect=width/height;camera.fov=flat?65:interior||door?80:targetId==='CABINET'?50:original.fov;
  const distance=Math.max(size.y/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)))*1.35,Math.max(size.x,size.z)*2.8);
  camera.up.set(0,1,0);
  if(flat){
   const fit=Math.max(size.z,size.x/camera.aspect)/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)))*1.4;
   const dirs=[[.01,.01],[.10,.01],[-.10,.01],[.01,-.10]],d=dirs[viewIndex];
   camera.position.copy(center).add(new THREE.Vector3(d[0],1,d[1]).normalize().multiplyScalar(fit));
   camera.up.set(0,0,-1);
  }else if(interior)camera.position.copy(center).add(new THREE.Vector3(0,0,1.95));
  else if(door)camera.position.set(center.x-.20,1.30,-3.55);
  else if(targetId==='CABINET'&&viewIndex===0)camera.position.copy(center).add(new THREE.Vector3(1.35,.12,.95));
  else if(targetId==='BASIN'&&viewIndex===0)camera.position.copy(center).add(new THREE.Vector3(1.35,1.5,.85));
  else if(targetId==='B_WALL_CONTINUITY'&&viewIndex===0)camera.position.set(1.73,7.70,-4.31);
  else {const dirs=[[1,1],[-1,1],[1,-1],[-1,-1]],[x,z]=dirs[viewIndex];camera.position.copy(center).add(new THREE.Vector3(x,.25,z).normalize().multiplyScalar(distance));}
  controls.enabled=false;controls.enableDamping=false;controls.autoRotate=false;controls.target.copy(center);
  controls.update();controls.update();camera.lookAt(center);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  const projected=points.map(p=>p.clone().project(camera));
  if(projected.some(p=>![p.x,p.y,p.z].every(Number.isFinite)||p.z< -1||p.z>1))reject();
  const xs=projected.map(p=>(p.x+1)*width/2),ys=projected.map(p=>(1-p.y)*height/2);
  const x=Math.floor(Math.min(...xs))-3,y=Math.floor(Math.min(...ys))-3,right=Math.ceil(Math.max(...xs))+3,bottom=Math.ceil(Math.max(...ys))+3;
  if(x<0||y<0||right>width||bottom>height||right-x<8||bottom-y<8)reject();
  locked={position:camera.position.clone(),quaternion:camera.quaternion.clone(),up:camera.up.clone(),aspect:camera.aspect,
   fov:camera.fov,projection:camera.projectionMatrix.clone(),inverse:camera.projectionMatrixInverse.clone()};
  prepared={targetId,viewIndex,width,height,roi:{x,y,width:right-x,height:bottom-y},cameraFingerprint:fingerprint(),
   glbSha256:sourceSha,variant:selected.variant,suppressionMethod:D1F_BATHROOM_SUPPRESSION[targetId],
   roiProvenance:'PROJECTED_EXACT_TARGET_GEOMETRY',targetIdentityVerified:true,
   ...(patches.has(targetId)?{sourceTargetIndices:{count:patches.get(targetId).offsets.length*3,
    sourceVertices:[...vertices],offsets:[...patches.get(targetId).offsets]}}:{}),
   pixelsVerifiedByThisRuntime:false,humanReview:'NOT_RUN'};
  render();return {...prepared,state:'PREPARED'};
 };
 const suppress=targetId=>{
  if(disposed||!prepared||prepared.targetId!==targetId||hidden||fingerprint()!==prepared.cameraFingerprint)reject();
  if(patches.has(targetId)){
   const omit=new Set(patches.get(targetId).offsets),keep=[];
   for(let i=0;i<sourceIndex.length;i+=3)if(!omit.has(i))keep.push(sourceIndex[i],sourceIndex[i+1],sourceIndex[i+2]);
   if(keep.length!==sourceIndex.length-omit.size*3)reject();
   masked=sourceGeometry.clone();masked.setIndex(keep);wall.geometry=masked;
  }else objects.get(targetId).visible=false;
  hidden=targetId;render();return {...prepared,state:'SUPPRESSED'};
 };
 const restore=()=>{
  if(disposed||!prepared||!restoreTarget()||fingerprint()!==prepared.cameraFingerprint)reject();
  return {...prepared,state:'RESTORED',suppressionRestored:true};
 };
 const dispose=()=>{
  if(disposed)return;locked=null;restoreTarget();for(const [o,v]of initialVisibility)o.visible=v;
  camera.position.copy(original.position);camera.quaternion.copy(original.quaternion);camera.up.copy(original.up);
  Object.assign(camera,{aspect:original.aspect,fov:original.fov,near:original.near,far:original.far});
  controls.target.copy(original.target);controls.enabled=original.enabled;controls.enableDamping=original.damping;controls.autoRotate=original.autoRotate;
  camera.updateProjectionMatrix();camera.updateMatrixWorld(true);disposed=true;render();
 };
 return Object.freeze({prepare,suppress,restore,dispose,pinFrame,inspectCorrections});
}
