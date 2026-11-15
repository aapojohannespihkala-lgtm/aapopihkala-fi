import {
 C80_524_RAIN_GLB_SHA256 as SHA,
 C80_524_RAIN_SCENES as SPECS,
 isC80524RainSourceScene as exactScene,
} from './privateModelC80524RainZonesSourceProfile.mjs';
import {C80_437_SCENES} from './privateModelC80437SourceProfile.mjs';
import {nameMatches} from './privateModelSourceNodeAssociations.mjs';

// A/B/C/D are the source's BOTH profiles inherited from glTF 514-517.
// Their 512 ancestors correspond to CLOSED/ONE_OPEN/STACKED/CUTAWAY.
// These are real glTF scene indices, never ZIP filename suffixes.
export const C80_524_RAIN_VIEWER_ROLES=Object.freeze({
 '1F':518,'2F':519,
 BOTH:Object.freeze({CLOSED:520,ONE_OPEN:521,STACKED:522,CUTAWAY:523}),
});
const ROLE_PROFILE=Object.freeze({
 518:'1F',519:'2F',520:'BOTH_A',521:'BOTH_B',522:'BOTH_C',523:'BOTH_D',
});
export function resolveC80524RainSceneIndex(floor,glazing='CLOSED',cutaway=false){
 if(!['1F','2F','BOTH'].includes(floor)||
    !['CLOSED','ONE_OPEN','STACKED'].includes(glazing)||
    typeof cutaway!=='boolean')return null;
 if(floor!=='BOTH')return glazing==='CLOSED'&&!cutaway?C80_524_RAIN_VIEWER_ROLES[floor]:null;
 if(cutaway)return glazing==='CLOSED'?C80_524_RAIN_VIEWER_ROLES.BOTH.CUTAWAY:null;
 return C80_524_RAIN_VIEWER_ROLES.BOTH[glazing]??null;
}
function exactRole(json,sha,sceneIndex){
 const spec=SPECS[sceneIndex];
 const extras=json?.scenes?.[sceneIndex]?.extras;
 return !!spec&&exactScene(json,sha,sceneIndex,spec.floor)&&
   extras?.floorProfile===ROLE_PROFILE[sceneIndex]&&
   extras?.glTFSceneIndex===sceneIndex;
}
/** Verify the rendered root order against the authenticated glTF node index path.
 * GLTFLoader may append numeric suffixes to names when a node repeats.
 * Viewer helpers added after source roots are ignored, not interpreted as source.
 */
export function c80524RenderedRootPathMatches(json, rendered, sceneIndex, associations=null) {
 const roots=json?.scenes?.[sceneIndex]?.nodes;
 if(!Array.isArray(roots)||!Array.isArray(json?.nodes)||
    !Array.isArray(rendered?.children)||rendered.children.length<roots.length)return false;
 return roots.every((nodeId,i)=>{
  const object=rendered.children[i];
  const binding=associations?.get?.(object);
  // Loader associations can be pruned in multi-scene GLBs. A missing node
  // association is not proof of identity, but a contradictory one must never
  // pass just because the root name matches.
  if(binding&&Object.prototype.hasOwnProperty.call(binding,'nodes')&&binding.nodes!==nodeId)return false;
  return Number.isInteger(nodeId)&&nodeId>=0&&nodeId<json.nodes.length&&
    !!json.nodes[nodeId]&&nameMatches(object,json.nodes[nodeId]);
 });
}

/** Read-only authentic source, no loader/catalog registration or publication. */
export function resolveC80524RainScenes(gltf,sha){
 const json=gltf?.parser?.json;
 if(sha!==SHA||!json||!Array.isArray(gltf?.scenes)||gltf.scenes.length!==524)return null;
 const scenes=Object.create(null);
 for(const sceneIndex of Object.keys(SPECS).map(Number)){
  const scene=gltf.scenes[sceneIndex];
  if(!scene||scene.name!==json.scenes?.[sceneIndex]?.name||
     !c80524RenderedRootPathMatches(json,scene,sceneIndex,gltf.parser?.associations)||
     !exactRole(json,sha,sceneIndex))return null;
  scenes[sceneIndex]=scene;
 }
 return new Set(Object.values(scenes)).size===6?scenes:null;
}
// Bind the original post-parse Three.js Object3D graph and local transforms.
// Only source descendants are pinned, NOT the mounted scene group's transform.
// Technical-review materials and scene-level helpers remain editable.
// Matrix4 can be lazily updated by Three.js when matrixAutoUpdate=true, so
// capture its exact elements only for explicitly manual source matrices.
const localTransform = obj => {
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
 return {values,matrix,manual,autoUpdate:obj?.matrixAutoUpdate};
};
const sameLocalTransform = (obj,baseline) => {
 const now=localTransform(obj);
 return !!baseline&&!!now&&now.autoUpdate===baseline.autoUpdate&&
  baseline.values.every((v,i)=>Object.is(v,now.values[i]))&&
  ((baseline.matrix===null&&now.matrix===null)||
   (Array.isArray(baseline.matrix)&&Array.isArray(now.matrix)&&
    baseline.matrix.length===now.matrix.length&&
    baseline.matrix.every((v,i)=>Object.is(v,now.matrix[i]))));
};
export function c80524SnapshotRenderedSourceRoots(scene,count){
 if(!Number.isInteger(count)||count<0||!Array.isArray(scene?.children)||
    scene.children.length<count)return null;
 const roots=scene.children.slice(0,count),refs=new Map();
 const capture=(obj)=>{
  if(!obj||typeof obj!=='object'||refs.has(obj))return;
  const children=Array.isArray(obj.children)?obj.children:[];
  const transform=localTransform(obj);
  if(!transform)throw new Error('C80_524_RENDERED_SOURCE_INVALID_LOCAL_TRANSFORM');
  refs.set(obj,{children:[...children],geometry:obj.geometry,transform});
  for(const child of children)capture(child);
 };
 for(const root of roots)capture(root);
 return {roots,refs};
}
export function c80524RenderedSourceRootsUnchanged(scene,proof){
 const current=scene?.children;
 if(!proof||!Array.isArray(current)||current.length<proof.roots.length||
    !proof.roots.every((root,i)=>current[i]===root))return false;
 for(const [obj,baseline] of proof.refs){
  const children=Array.isArray(obj?.children)?obj.children:[];
  if(obj?.geometry!==baseline.geometry||
     !sameLocalTransform(obj,baseline.transform)||
     children.length!==baseline.children.length||
     !baseline.children.every((child,i)=>children[i]===child))return false;
 }
 return true;
}

export function createC80524RainFloorRuntime({gltf,sha,mount,mounted}){
 if(typeof mount!=='function'||typeof mounted!=='function')
  throw new Error('C80_524_MOUNT_CONTRACT');
 const scenes=resolveC80524RainScenes(gltf,sha);
 if(!scenes)throw new Error('C80_524_SOURCE_SCENE_MISMATCH');
 const json=gltf.parser.json;
 const graphProof=Object.fromEntries(Object.keys(SPECS).map(id=>[
  id,c80524SnapshotRenderedSourceRoots(scenes[id],json.scenes[id].nodes.length),
 ]));
 let floor='BOTH',glazing='CLOSED',cutaway=false,sceneIndex=520;
 let active=false,disposed=false;
 const isLive=(i)=>gltf.scenes?.[i]===scenes[i]&&
   scenes[i]?.name===json.scenes?.[i]?.name&&
   c80524RenderedSourceRootsUnchanged(scenes[i],graphProof[i])&&
   c80524RenderedRootPathMatches(json,scenes[i],i,gltf.parser?.associations)&&exactRole(json,sha,i);
 const mountedHere=()=>mounted()===scenes[sceneIndex];
 const switchTo=(f,g,c)=>{
  const next=resolveC80524RainSceneIndex(f,g,c);
  if(disposed||next===null||!mountedHere()||!isLive(sceneIndex)||!isLive(next))return null;
  const previousActive=active;
  active=false;
  try{mount(scenes[next]);}finally{active=previousActive;}
  if(mounted()!==scenes[next])throw new Error('C80_524_SCENE_MOUNT_MISMATCH');
  floor=f;glazing=g;cutaway=c;sceneIndex=next;
  let included=0;
  scenes[next].traverse?.(obj=>{if(obj?.isMesh)included++;});
  return {included,exceptions:[]};
 };
 return {
  available:true,isC80R2Chain:true,isC80524Rain:true,
  chainLabel:'C80 524 D-päädyn kaksi sadevesien läsnäolovyöhykettä (WORK_TEST_HOST_HOLD)',
  floorSceneSource:'C80_524_R1110_SOURCE_ONLY',sourceModel:'D_C80',sourceSha256:sha,
  floorSceneNames:{'1F':scenes[518].name,'2F':scenes[519].name,BOTH:scenes[520].name},
  supportsFirstFloor:true,floorOptions:['1F','2F','BOTH'],defaultScene:scenes[520],
  get selectedScene(){return scenes[sceneIndex];},
  get sceneIndex(){return sceneIndex;},
  get floor(){return floor;},
  get glazing(){return glazing;},
  get cutaway(){return cutaway;},
  get active(){return active;},
  get sourceLinksStatus(){return 'NOT_BOUND';},
  get downspoutPhysicalRouteStatus(){return 'NOT_VERIFIED';},
  get publicationStatus(){return 'NOT_AUTHORIZED';},
  apply(next,nextGlazing=glazing){
   const result=switchTo(next,next==='BOTH'?nextGlazing:'CLOSED',next==='BOTH'?cutaway:false);
   if(result)active=true;
   return result;
  },
  setGlazing(next){return switchTo(floor,next,cutaway);},
  setCutaway(value){return typeof value==='boolean'?switchTo(floor,glazing,value):null;},
  restore(){
   if(disposed||!mountedHere()||!isLive(sceneIndex)||!isLive(520))return false;
   mount(scenes[520]);
   if(mounted()!==scenes[520])throw new Error('C80_524_SCENE_MOUNT_MISMATCH');
   floor='BOTH';glazing='CLOSED';cutaway=false;sceneIndex=520;active=false;
   return true;
  },
  enforce(){},referenceCandidates(){return [];},
  dispose(){disposed=true;active=false;},
 };
}

// Technical review keeps the inherited 437 MEP roots plus the later C80 MEP
// roots (L150/A-C sewer, Savo, T110 roof vent, 518 water risers). The 505 H24
// frame (12238) and the 524 rain presence zones (12251) are not MEP and stay
// grey; the zones are presentation-only source markers, never pipes.
const C80_524_REVIEW_MEP=new Set([
 ...Object.values(C80_437_SCENES).flatMap(s=>s.review??[]),
 12193,12194,12224,12228,12230,12237,12239,12242,12243,12244,12245,12246,12247,12248,
]);
export function c80524RainReviewProfile(json,sha,sceneIndex){
 const spec=SPECS[sceneIndex];
 if(!Number.isInteger(sceneIndex)||!spec||!exactScene(json,sha,sceneIndex,spec.floor))return null;
 const roots=json.scenes[sceneIndex].nodes.filter(n=>C80_524_REVIEW_MEP.has(n));
 if(!roots.length)return null;
 return {
  count:524,floors:{'1F':350,'2F':351,BOTH:352},
  scenes:{[sceneIndex]:{name:json.scenes[sceneIndex].name}},
  roots:{[sceneIndex]:roots.map(n=>({node:n,name:json.nodes[n].name}))},
 };
}
