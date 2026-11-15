import {C80_437_SCENES} from './privateModelC80437SourceProfile.mjs';
import {nameMatches} from './privateModelSourceNodeAssociations.mjs';
import {
 C80_530_V27_GLB_SHA256 as SHA,
 C80_530_V27_SCENES as SPECS,
 isC80530V27SourceScene as exactScene,
} from './privateModelC80530V27SourceProfile.mjs';

// Only the authenticated 530 opt-in source scenes; no viewer/catalog registration.
export const C80_530_V27_VIEWER_ROLES=Object.freeze({
 '1F':524,'2F':525,
 BOTH:Object.freeze({CLOSED:526,ONE_OPEN:527,STACKED:528,CUTAWAY:529}),
});
export function resolveC80530V27SceneIndex(floor,glazing='CLOSED',cutaway=false){
 if(!['1F','2F','BOTH'].includes(floor)||
    !['CLOSED','ONE_OPEN','STACKED'].includes(glazing)||
    typeof cutaway!=='boolean')return null;
 if(floor!=='BOTH')return !cutaway&&glazing==='CLOSED'?C80_530_V27_VIEWER_ROLES[floor]:null;
 if(cutaway)return glazing==='CLOSED'?529:null;
 return C80_530_V27_VIEWER_ROLES.BOTH[glazing]??null;
}
function liveRole(json,sha,i){
 const spec=SPECS[i];
 return !!spec&&exactScene(json,sha,i,spec.floor);
}
/** The source SHA authenticates JSON; these checks bind actual rendered
 * Object3D hierarchy (including nested glTF node order) to that JSON.
 * GLTFLoader prefixes primitive-only children and suffixes repeated names.
 * Scene-only viewer helpers appended after source roots are ignored.
 */
function treeMatches(json,obj,nodeId,associations,depth=0){
 if(depth>256||!Number.isInteger(nodeId)||nodeId<0||
    nodeId>=json.nodes.length)return false;
 const def=json.nodes[nodeId];
 if(!def||!obj||!nameMatches(obj,def))return false;
 const known=associations?.get?.(obj)?.nodes;
 if(Number.isInteger(known)&&known!==nodeId)return false;
 const ids=def.children??[];
 const children=obj.children??[];
 if(!Array.isArray(ids)||!Array.isArray(children)||children.length<ids.length)return false;
 const offset=children.length-ids.length;
 return ids.every((id,j)=>treeMatches(json,children[offset+j],id,associations,depth+1));
}
export function c80530RenderedRootPathMatches(json,rendered,sceneIndex,associations=null){
 const roots=json?.scenes?.[sceneIndex]?.nodes;
 if(!Array.isArray(roots)||!Array.isArray(json?.nodes)||
    !Array.isArray(rendered?.children)||rendered.children.length<roots.length)return false;
 return roots.every((nodeId,i)=>treeMatches(json,rendered.children[i],nodeId,associations));
}
export function resolveC80530V27Scenes(gltf,sha){
 const json=gltf?.parser?.json;
 if(sha!==SHA||!json||!Array.isArray(gltf?.scenes)||gltf.scenes.length!==530)return null;
 const out=Object.create(null);
 for(const spec of Object.values(SPECS)){
  const i=spec.scene,scene=gltf.scenes[i];
  if(!scene||scene.name!==json.scenes?.[i]?.name||
     !c80530RenderedRootPathMatches(json,scene,i,gltf.parser?.associations)||
     !liveRole(json,sha,i))return null;
  out[i]=scene;
 }
 return new Set(Object.values(out)).size===6?out:null;
}
/**
 * Pin the original GLTFLoader Object3D source graph after SHA/scene validation.
 * The parser's node associations may be missing on a later injected clone,
 * while a matching name and child shape alone are not provenance.
 * Viewer helpers may be appended at scene level, and review can recolor
 * materials. Source descendants, child ordering and geometries remain fixed.
 */
// GLTF source descendants must retain their local placement even if
// their Object3D and geometry references stay unchanged. Scene-level camera
// orientation/presentation is intentionally excluded from this snapshot.
const c80530LocalTransform=obj=>{
 const p=obj?.position,q=obj?.quaternion,s=obj?.scale;
 const values=[
  p?.x??0,p?.y??0,p?.z??0,
  q?.x??0,q?.y??0,q?.z??0,q?.w??1,
  s?.x??1,s?.y??1,s?.z??1,
 ];
 if(!values.every(Number.isFinite))return null;
 const manual=obj?.matrixAutoUpdate===false;
 const matrix=manual?Array.from(obj?.matrix?.elements??[]):null;
 if(manual&&(matrix.length!==16||!matrix.every(Number.isFinite)))return null;
 return {values,matrix,autoUpdate:obj?.matrixAutoUpdate};
};
const c80530SameLocalTransform=(obj,baseline)=>{
 const now=c80530LocalTransform(obj);
 return !!baseline&&!!now&&Object.is(now.autoUpdate,baseline.autoUpdate)&&
  baseline.values.every((v,i)=>Object.is(v,now.values[i]))&&
  ((baseline.matrix===null&&now.matrix===null)||
   (Array.isArray(baseline.matrix)&&Array.isArray(now.matrix)&&
    baseline.matrix.length===now.matrix.length&&
    baseline.matrix.every((v,i)=>Object.is(v,now.matrix[i]))));
};
// Pin the exact source BufferGeometry attribute bindings and typed-array bytes.
// GLTFLoader gives renderable mutable arrays, so Object3D/geometry identity is
// insufficient: in-place vertex/index edits would otherwise bypass source SHA.
// All opt-in 530 scenes share one byte snapshot cache for reused source buffers.
// Material recoloring is intentionally outside this geometry-only guard.
function c80530AttributeArray(attr){
 if(!attr)return null;
 return attr.isInterleavedBufferAttribute?attr.data?.array:attr.array;
}
function c80530AttributeSnapshot(attr,bufferCopies){
 if(!attr)return null;
 const array=c80530AttributeArray(attr);
 const typed=ArrayBuffer.isView(array)&&!(array instanceof DataView);
 let original=null;
 if(typed){
  original=bufferCopies.get(array);
  if(!original){
   original=Uint8Array.from(new Uint8Array(array.buffer,array.byteOffset,array.byteLength));
   bufferCopies.set(array,original);
  }
 }
 return {attr,array,original,count:attr.count,itemSize:attr.itemSize,
  normalized:attr.normalized,offset:attr.offset,stride:attr.data?.stride};
}
function c80530AttributeUnchanged(attr,proof,verified){
 if(!proof)return attr==null;
 if(attr!==proof.attr||c80530AttributeArray(attr)!==proof.array||
    attr.count!==proof.count||attr.itemSize!==proof.itemSize||
    attr.normalized!==proof.normalized||attr.offset!==proof.offset||
    attr.data?.stride!==proof.stride)return false;
 if(!proof.original)return true; // Non-typed GPU-only attributes: reference identity.
 if(verified.has(proof.array))return true;
 const current=new Uint8Array(proof.array.buffer,proof.array.byteOffset,proof.array.byteLength);
 if(current.byteLength!==proof.original.byteLength)return false;
 for(let i=0;i<current.byteLength;i++)
  if(current[i]!==proof.original[i])return false;
 verified.add(proof.array);
 return true;
}
function c80530GeometrySnapshot(geometry,bufferCopies){
 if(!geometry)return null;
 const attrs=Object.entries(geometry.attributes??{}).map(([name,attr])=>[
  name,c80530AttributeSnapshot(attr,bufferCopies)]);
 const morph=Object.entries(geometry.morphAttributes??{}).map(([name,entries])=>[
  name,entries.map(attr=>c80530AttributeSnapshot(attr,bufferCopies))]);
 return {attrs,morph,index:c80530AttributeSnapshot(geometry.index,bufferCopies),
  morphTargetsRelative:geometry.morphTargetsRelative,
  drawStart:geometry.drawRange?.start,drawCount:geometry.drawRange?.count};
}
function c80530GeometryUnchanged(geometry,proof,verified){
 if(!proof)return geometry==null;
 if(!geometry||geometry.morphTargetsRelative!==proof.morphTargetsRelative||
    geometry.drawRange?.start!==proof.drawStart||
    geometry.drawRange?.count!==proof.drawCount)return false;
 const attrs=geometry.attributes??{},morph=geometry.morphAttributes??{};
 if(Object.keys(attrs).length!==proof.attrs.length||
    Object.keys(morph).length!==proof.morph.length||
    !c80530AttributeUnchanged(geometry.index,proof.index,verified))return false;
 for(const [name,snapshot] of proof.attrs)
  if(!Object.prototype.hasOwnProperty.call(attrs,name)||
     !c80530AttributeUnchanged(attrs[name],snapshot,verified))return false;
 for(const [name,items] of proof.morph){
  const actual=morph[name];
  if(!Array.isArray(actual)||actual.length!==items.length||
     !items.every((item,i)=>c80530AttributeUnchanged(actual[i],item,verified)))return false;
 }
 return true;
}

export function c80530SnapshotRenderedSourceTree(scene,rootCount,bufferCopies=new WeakMap()){
 if(!Number.isInteger(rootCount)||rootCount<0||
    !Array.isArray(scene?.children)||scene.children.length<rootCount)return null;
 const roots=scene.children.slice(0,rootCount),records=new Map();
 const visit=obj=>{
  if(!obj||typeof obj!=='object'||records.has(obj)||
     !Array.isArray(obj.children))return false;
  const transform=c80530LocalTransform(obj);
  if(!transform)return false;
  records.set(obj,{children:[...obj.children],geometry:obj.geometry,transform,
   geometryProof:c80530GeometrySnapshot(obj.geometry,bufferCopies)});
  return obj.children.every(visit);
 };
 return roots.every(visit)?{roots,records}:null;
}
export function c80530RenderedSourceTreeUnchanged(scene,proof){
 if(!proof||!Array.isArray(proof.roots)||!(proof.records instanceof Map)||
    !Array.isArray(scene?.children)||scene.children.length<proof.roots.length||
    !proof.roots.every((obj,i)=>scene.children[i]===obj))return false;
 const verified=new Set();
 for(const [obj,record] of proof.records){
  const children=obj?.children;
  if(!Array.isArray(children)||obj.geometry!==record.geometry||
     !c80530GeometryUnchanged(obj.geometry,record.geometryProof,verified)||
     !c80530SameLocalTransform(obj,record.transform)||
     children.length!==record.children.length||
     !record.children.every((child,i)=>children[i]===child))return false;
 }
 return true;
}

export function createC80530V27FloorRuntime({gltf,sha,mount,mounted}){
 if(typeof mount!=='function'||typeof mounted!=='function')
  throw new Error('C80_530_MOUNT_CONTRACT');
 const scenes=resolveC80530V27Scenes(gltf,sha);
 if(!scenes)throw new Error('C80_530_SOURCE_SCENE_MISMATCH');
 const json=gltf.parser.json;
 let floor='BOTH',glazing='CLOSED',cutaway=false,sceneIndex=526;
 let active=false,disposed=false;
 // Capture every source child and mesh geometry, not only the scene roots.
 // This rejects a same-name nested impostor even if loader associations
 // don't record the forged object and the JSON itself stays unchanged.
 const bufferCopies=new WeakMap();
 const graphProof=Object.fromEntries(Object.keys(scenes).map(k=>{
  const i=Number(k),count=json.scenes[i].nodes.length;
  return [i,c80530SnapshotRenderedSourceTree(scenes[i],count,bufferCopies)];
 }));
 if(Object.values(graphProof).some(proof=>!proof))
  throw new Error('C80_530_RENDERED_SOURCE_GRAPH_MISMATCH');
 const pinned=i=>c80530RenderedSourceTreeUnchanged(scenes[i],graphProof[i]);
 const isLive=(i)=>gltf.scenes?.[i]===scenes[i]&&
   scenes[i]?.name===json.scenes?.[i]?.name&&pinned(i)&&
   c80530RenderedRootPathMatches(json,scenes[i],i,gltf.parser?.associations)&&
   liveRole(json,sha,i);
 const mountedHere=()=>mounted()===scenes[sceneIndex];
 const swap=(f,g,c)=>{
  const next=resolveC80530V27SceneIndex(f,g,c);
  if(disposed||next===null||!mountedHere()||!isLive(sceneIndex)||!isLive(next))return null;
  const wasActive=active;active=false;
  try{mount(scenes[next]);}finally{active=wasActive;}
  if(mounted()!==scenes[next])throw new Error('C80_530_SCENE_MOUNT_MISMATCH');
  floor=f;glazing=g;cutaway=c;sceneIndex=next;
  let included=0;
  scenes[next].traverse?.(obj=>{if(obj?.isMesh)included++;});
  return {included,exceptions:[]};
 };
 return {
  available:true,isC80R2Chain:true,isC80530V27:true,
  chainLabel:'C80 530 V27 42 mm maaston seinäleikkaus WORK_TEST_HOST_HOLD',
  floorSceneSource:'C80_530_V27_SOURCE_ONLY',sourceModel:'D_C80',sourceSha256:sha,
  floorSceneNames:{'1F':scenes[524].name,'2F':scenes[525].name,BOTH:scenes[526].name},
  supportsFirstFloor:true,floorOptions:['1F','2F','BOTH'],defaultScene:scenes[526],
  get selectedScene(){return scenes[sceneIndex];},
  get sceneIndex(){return sceneIndex;},
  get floor(){return floor;},
  get glazing(){return glazing;},
  get cutaway(){return cutaway;},
  get active(){return active;},
  get sourceLinksStatus(){return 'NOT_BOUND';},
  get terrainPhysicalHostStatus(){return 'NOT_VERIFIED';},
  get productionWebGLStatus(){return 'NOT_RUN';},
  get publicationStatus(){return 'NOT_AUTHORIZED';},
  apply(next,nextGlazing=glazing){
   const result=swap(next,next==='BOTH'?nextGlazing:'CLOSED',next==='BOTH'?cutaway:false);
   if(result)active=true;
   return result;
  },
  setGlazing(next){return swap(floor,next,cutaway);},
  setCutaway(v){return typeof v==='boolean'?swap(floor,glazing,v):null;},
  restore(){
   if(disposed||!mountedHere()||!isLive(sceneIndex)||!isLive(526))return false;
   mount(scenes[526]);
   if(mounted()!==scenes[526])throw new Error('C80_530_SCENE_MOUNT_MISMATCH');
   floor='BOTH';glazing='CLOSED';cutaway=false;sceneIndex=526;active=false;
   return true;
  },
  enforce(){},referenceCandidates(){return [];},
  dispose(){disposed=true;active=false;},
 };
}
// The terrain root 12254 is architectural site context. The 524 rain-marker
// root 12251 is presentation-only, not technical piping.
const REVIEW_MEP=new Set([
 ...Object.values(C80_437_SCENES).flatMap(s=>s.review??[]),
 12193,12194,12224,12228,12230,12237,12239,12242,
 12243,12244,12245,12246,12247,12248,
]);
export function c80530V27ReviewProfile(json,sha,sceneIndex){
 const spec=SPECS[sceneIndex];
 if(!Number.isInteger(sceneIndex)||!spec||
    !exactScene(json,sha,sceneIndex,spec.floor))return null;
 const roots=json.scenes[sceneIndex].nodes.filter(n=>REVIEW_MEP.has(n));
 if(!roots.length)return null;
 return {
  count:530,floors:{'1F':350,'2F':351,BOTH:352},
  scenes:{[sceneIndex]:{name:json.scenes[sceneIndex].name}},
  roots:{[sceneIndex]:roots.map(n=>({node:n,name:json.nodes[n].name}))},
  physicalTerrainSurveyVerified:false,
  publicationAllowed:false,humanReview:'NOT_RUN',current:false,
 };
}
