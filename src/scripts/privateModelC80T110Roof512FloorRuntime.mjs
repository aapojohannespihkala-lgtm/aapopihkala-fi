import {C80_437_SCENES} from './privateModelC80437SourceProfile.mjs';
import {C80_T110_512_GLB_SHA256 as SHA,C80_T110_512_SCENES as SPECS,
 isC80T110Roof512SourceScene as exactScene}
 from './privateModelC80T110Roof512SourceProfile.mjs';

// Only the seven authenticated, opt-in 512 scenes. No new first-floor scene exists.
export const C80_T110_512_VIEWER_ROLES=Object.freeze({
 '2F':Object.freeze({CLOSED:505,ONE_OPEN:506,STACKED:507}),
 BOTH:Object.freeze({CLOSED:508,ONE_OPEN:509,STACKED:510,CUTAWAY:511}),
});
export function resolveC80T110Roof512SceneIndex(floor,glazing,cutaway=false){
 if(!['2F','BOTH'].includes(floor)||!['CLOSED','ONE_OPEN','STACKED'].includes(glazing)||
    typeof cutaway!=='boolean'||(cutaway&&(floor!=='BOTH'||glazing!=='CLOSED')))return null;
 return cutaway?511:C80_T110_512_VIEWER_ROLES[floor][glazing]??null;
}
export function resolveC80T110Roof512Scenes(gltf,sha){
 const json=gltf?.parser?.json;
 if(sha!==SHA||!json||!Array.isArray(gltf?.scenes)||gltf.scenes.length!==512)return null;
 const out=Object.create(null);
 for(const spec of Object.values(SPECS)){
  const i=spec.scene,s=gltf.scenes[i];
  if(!s||s.name!==json.scenes?.[i]?.name||!exactScene(json,sha,i,spec.floor))return null;
  out[i]=s;
 }
 return new Set(Object.values(out)).size===7?out:null;
}
export function createC80T110Roof512FloorRuntime({gltf,sha,mount,mounted}){
 if(typeof mount!=='function'||typeof mounted!=='function')
  throw new Error('C80_T110_512_MOUNT_CONTRACT');
 const scenes=resolveC80T110Roof512Scenes(gltf,sha);
 if(!scenes)throw new Error('C80_T110_512_SOURCE_SCENE_MISMATCH');
 let floor='BOTH',glazing='CLOSED',cutaway=false,sceneIndex=508,active=false,disposed=false;
 const mountedHere=()=>Object.values(scenes).includes(mounted());
 const swap=(f,g,c)=>{
  const next=resolveC80T110Roof512SceneIndex(f,g,c);
  if(disposed||next===null||!mountedHere()||
     !exactScene(gltf.parser.json,sha,next,f))return null;
  const wasActive=active;active=false;
  try{mount(scenes[next]);}finally{active=wasActive;}
  if(mounted()!==scenes[next])throw new Error('C80_T110_512_SCENE_MOUNT_MISMATCH');
  floor=f;glazing=g;cutaway=c;sceneIndex=next;
  let included=0;
  scenes[next].traverse?.(obj=>{if(obj?.isMesh)included++;});
  return {included,exceptions:[]};
 };
 return {
  available:true,isC80R2Chain:true,isC80T110Roof512:true,
  chainLabel:'C80 512 T110 WORK_TEST_HOST_HOLD',
  floorSceneSource:'C80_T110_512_SOURCE_ONLY',
  sourceModel:'D_C80',sourceSha256:sha,
  floorSceneNames:{'2F':scenes[505].name,BOTH:scenes[508].name},
  supportsFirstFloor:false,floorOptions:['2F','BOTH'],
  defaultScene:scenes[508],
  get selectedScene(){return scenes[sceneIndex];},
  get sceneIndex(){return sceneIndex;},
  get floor(){return floor;},
  get glazing(){return glazing;},
  get cutaway(){return cutaway;},
  get active(){return active;},
  get roofHostStatus(){return 'NOT_VERIFIED';},
  get sourceLinksStatus(){return 'NOT_BOUND';},
  get publicationStatus(){return 'NOT_AUTHORIZED';},
  apply(next,nextGlazing=glazing){
   const r=swap(next,nextGlazing,next==='BOTH'?cutaway:false);
   if(r)active=true;
   return r;
  },
  setGlazing(next){return swap(floor,next,cutaway);},
  setCutaway(value){return typeof value==='boolean'?swap(floor,glazing,value):null;},
  restore(){
   // Revalidate the destination after construction, like every other scene switch.
   if(disposed||!mountedHere()||
      !exactScene(gltf.parser.json,sha,508,'BOTH'))return false;
   mount(scenes[508]);
   if(mounted()!==scenes[508])throw new Error('C80_T110_512_SCENE_MOUNT_MISMATCH');
   floor='BOTH';glazing='CLOSED';cutaway=false;sceneIndex=508;active=false;
   return true;
  },
  enforce(){},referenceCandidates(){return [];},
  dispose(){disposed=true;active=false;},
 };
}
// Known technical roots only. Structural H24 frame 12238 must never be highlighted as MEP.
const HISTORICAL=new Set(Object.values(C80_437_SCENES).flatMap(s=>s.review??[]));
const MEP=new Set([...HISTORICAL,12193,12194,12224,12228,12230,12237,12239,12242]);
export function c80T110Roof512ReviewProfile(json,sha,sceneIndex){
 const spec=SPECS[sceneIndex];
 if(!Number.isInteger(sceneIndex)||!spec||
    !exactScene(json,sha,sceneIndex,spec.floor))return null;
 const roots=json.scenes[sceneIndex].nodes.filter(n=>n!==12238&&MEP.has(n));
 if(!roots.includes(spec.root))return null;
 return {
  count:512,floors:{'2F':351,BOTH:352},
  scenes:{[sceneIndex]:{name:json.scenes[sceneIndex].name}},
  roots:{[sceneIndex]:roots.map(n=>({node:n,name:json.nodes[n].name}))},
  physicalRoofOpeningVerified:false,publicationAllowed:false,
  humanReview:'NOT_RUN',current:false,
 };
}
