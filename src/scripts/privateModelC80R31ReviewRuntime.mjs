/**
 * C80 R31 independent opt-in viewer handoff for ONE authenticated source GLB.
 * Requires caller-calculated SHA-256 of the complete, authenticated GLB.
 * Never switches between distinct GLB assets, registers viewer routes, or
 * binds sourceLinks. A real production WebGL acceptance is still required.
 */
import {
 c80530RenderedRootPathMatches,
 c80530SnapshotRenderedSourceTree,
 c80530RenderedSourceTreeUnchanged,
} from './privateModelC80530V27FloorRuntime.mjs';
import {
 C80_R31_SCENE752_SOURCES,
 C80_R31_SCENE753_SOURCE,
 C80_R31_SCENE754_SOURCE,
 C80_R31_SCENE756_SOURCE,
 C80_R31_R300_SOURCE,
 C80_R31_R300_VIEWS,
 isC80R31Scene752Source,
 isC80R31Scene753Source,
 isC80R31Scene754Source,
 isC80R31Scene756Source,
 isC80R31R300CopperSource,
 C80_R31_SCENE771772_2F_R300_SOURCE,
 c80R31Scene752RootsFnv32,
 isC80R31Scene771772Source,
} from './privateModelC80R31Scene752SourceReceipt.mjs';
import {rehydrateIncompleteScene} from './privateModelSourceSceneRehydrate.mjs';

export const C80_R31_R300_WORK_TEST_ID='c80-r31-r300-sc759-sc760-work-test';

/** Bind the R300 review to the one canonical protected catalog entry. */
export function r300WorkTestSource(candidate){
 if(candidate.id!==C80_R31_R300_WORK_TEST_ID)return undefined;
 if(candidate.path!==`/private-model/work-test/${C80_R31_R300_WORK_TEST_ID}.glb`)
  throw new Error('C80_R31_R300_CANDIDATE_PATH_MISMATCH');
 return C80_R31_R300_SOURCE;
}

/**
 * R31 9e0bf34f: ONE authenticated GLB with whole-D normal/service (769/770) and
 * 2F normal/service (771/772). Normal shows the R300 plexi screen, service hides it.
 * Source identity only; WORK_TEST/HOST_HOLD, never CURRENT/as-built.
 */
export const C80_R31_9E0B_WORK_TEST_ID='c80-r31-9e0bf34f-d-2f-sc769-sc772-work-test';
const S9=C80_R31_SCENE771772_2F_R300_SOURCE;
export const C80_R31_9E0B_SOURCE=Object.freeze({
 glbSha256:S9.glbSha256,glbBytes:S9.glbBytes,zipDriveId:S9.zipDriveId,zipSha256:S9.zipSha256,
 sceneCount:S9.sceneCount,nodeCount:S9.nodeCount,meshCount:S9.meshCount,
 materialCount:S9.materialCount,accessorCount:S9.accessorCount,
 bufferViewCount:S9.bufferViewCount,defaultScene:S9.defaultScene,
});
export const C80_R31_9E0B_VIEWS=Object.freeze({
 dNormal:Object.freeze({role:'R31_9E0B_D_NORMAL_PLEXI_ON',sceneIndex:S9.bothNormalScene,
  rootCount:S9.bothNormalRootCount,rootFnv32:S9.bothNormalFnv32,floor:'BOTH',plexi:true,label:'D normaali'}),
 dService:Object.freeze({role:'R31_9E0B_D_SERVICE_PLEXI_OFF',sceneIndex:S9.bothServiceScene,
  rootCount:S9.bothServiceRootCount,rootFnv32:S9.bothServiceFnv32,floor:'BOTH',plexi:false,label:'D huolto'}),
 upperNormal:Object.freeze({role:S9.normal.role,sceneIndex:S9.normal.index,
  rootCount:S9.normal.rootCount,rootFnv32:S9.normal.rootFnv32,floor:'2F',plexi:true,label:'Yläkerta normaali'}),
 upperService:Object.freeze({role:S9.service.role,sceneIndex:S9.service.index,
  rootCount:S9.service.rootCount,rootFnv32:S9.service.rootFnv32,floor:'2F',plexi:false,label:'Yläkerta huolto'}),
});
/**
 * R32H c26d99c1 (CLAUDE-R32-KAYTTOON-20261123): R32 envelope (gable boarding/brick,
 * T12 gutters + 5 downpipes) + P6 V8 carport with 2022 gutters + K3 D2F hallface
 * SW04/SW05, append-only on the R31 chain (same node indices below 13761).
 * Whole-D normal/service 814/815 and 2F normal/service 816/817. WORK_TEST/HOST_HOLD.
 */
export const C80_R32H_WORK_TEST_ID='c80-r32h-c26d99c1-d-2f-sc814-sc817-work-test';
export const C80_R32H_SOURCE=Object.freeze({
 glbSha256:'c26d99c11ffef90859ff17cad5edecf7ab22d811baddfa0506794ecdbef6294c',glbBytes:64668060,
 zipDriveId:'1UM0piMfbS-XwdfbByCWJ0oL2e9molOq1',
 zipSha256:'406c60bc39ecc24f72b08f5c60f7eb4019cf6a610e5255f3d619ff8d7b9f583a',
 baseGlbSha256:'29114e10fe7de711fba1465b8b1fb310b9433893f02f189b477f7d3536dbc97d',
 sceneCount:818,nodeCount:13840,meshCount:5237,materialCount:824,
 accessorCount:11427,bufferViewCount:11433,defaultScene:292,
 envelopeRoot:13809,p6Root:7583,p6GutterRoot:13812,sw04:13813,sw05:13839,
 replacedHallRoots:Object.freeze([13507,13531]),plexi:11625,
});
export const C80_R32H_VIEWS=Object.freeze({
 dNormal:Object.freeze({role:'R32H_D_NORMAL_PLEXI_ON',sceneIndex:814,rootCount:500,rootFnv32:'4c071047',
  floor:'BOTH',plexi:true,label:'D normaali',name:'Ylisrinne_R32_HALLFACE_SW04SW05_BOTH_NORMAL_HALLFACE_WORK_TEST_HOST_HOLD__scene814'}),
 dService:Object.freeze({role:'R32H_D_SERVICE_PLEXI_OFF',sceneIndex:815,rootCount:499,rootFnv32:'b837574d',
  floor:'BOTH',plexi:false,label:'D huolto',name:'Ylisrinne_R32_HALLFACE_SW04SW05_BOTH_SERVICE_HALLFACE_PLEXI_OFF_WORK_TEST_HOST_HOLD__scene815'}),
 upperNormal:Object.freeze({role:'R32H_2F_NORMAL_PLEXI_ON',sceneIndex:816,rootCount:204,rootFnv32:'ce2f48cc',
  floor:'2F',plexi:true,label:'Yläkerta normaali',name:'Ylisrinne_R32_HALLFACE_SW04SW05_2F_NORMAL_HALLFACE_WORK_TEST_HOST_HOLD__scene816'}),
 upperService:Object.freeze({role:'R32H_2F_SERVICE_PLEXI_OFF',sceneIndex:817,rootCount:203,rootFnv32:'8076a96f',
  floor:'2F',plexi:false,label:'Yläkerta huolto',name:'Ylisrinne_R32_HALLFACE_SW04SW05_2F_SERVICE_HALLFACE_PLEXI_OFF_WORK_TEST_HOST_HOLD__scene817'}),
});
/**
 * R33 3a226f98 (CLAUDE-D2FWC-DOOR-CLASH-R33-20261123): R32H + D2F WC open door leaf out of
 * the wall end and floor (COW 8031->13840, levers 9199/9200->13844/13845, path
 * 12643/12642/12492->13843/13842/13841). Append-only: R32H nodes/scenes/BIN identical.
 * Whole-D normal/service 818/819 and 2F normal/service 820/821. WORK_TEST/HOST_HOLD.
 */
export const C80_R33_WORK_TEST_ID='c80-r33-3a226f98-d-2f-sc818-sc821-work-test';
export const C80_R33_SOURCE=Object.freeze({
 glbSha256:'3a226f987d5605eff523029d580b760167ae4a32f13ddd51248fe933d913c54c',glbBytes:64697168,
 zipDriveId:'13Wb5Og60oBFl_gWoEcAqXL22gy7MZZFg',
 zipSha256:'1317cb338978ad921e2bd7c443947e2d68e09c8992fe0f934df2bf892a954a74',
 baseGlbSha256:C80_R32H_SOURCE.glbSha256,
 sceneCount:822,nodeCount:13846,meshCount:5237,materialCount:824,
 accessorCount:11427,bufferViewCount:11433,defaultScene:292,
 envelopeRoot:13809,p6Root:7583,p6GutterRoot:13812,sw04:13813,sw05:13839,
 replacedHallRoots:Object.freeze([13507,13531,12643,9199,9200]),plexi:11625,
 extraRoots:Object.freeze([13843,13844,13845]),wcDoorLeaf:13840,
});
export const C80_R33_VIEWS=Object.freeze({
 dNormal:Object.freeze({role:'R33_D_NORMAL_PLEXI_ON',sceneIndex:818,rootCount:500,rootFnv32:'b77b9ae3',
  floor:'BOTH',plexi:true,label:'D normaali',name:'Ylisrinne_R33_D2F_WC_DOOR_CLEAR_BOTH_NORMAL_PLEXI_ON_WORK_TEST_HOST_HOLD__scene818'}),
 dService:Object.freeze({role:'R33_D_SERVICE_PLEXI_OFF',sceneIndex:819,rootCount:499,rootFnv32:'a8f7cd19',
  floor:'BOTH',plexi:false,label:'D huolto',name:'Ylisrinne_R33_D2F_WC_DOOR_CLEAR_BOTH_SERVICE_PLEXI_OFF_WORK_TEST_HOST_HOLD__scene819'}),
 upperNormal:Object.freeze({role:'R33_2F_NORMAL_PLEXI_ON',sceneIndex:820,rootCount:204,rootFnv32:'fa8341b8',
  floor:'2F',plexi:true,label:'Yläkerta normaali',name:'Ylisrinne_R33_D2F_WC_DOOR_CLEAR_2F_NORMAL_PLEXI_ON_WORK_TEST_HOST_HOLD__scene820'}),
 upperService:Object.freeze({role:'R33_2F_SERVICE_PLEXI_OFF',sceneIndex:821,rootCount:203,rootFnv32:'60e85063',
  floor:'2F',plexi:false,label:'Yläkerta huolto',name:'Ylisrinne_R33_D2F_WC_DOOR_CLEAR_2F_SERVICE_PLEXI_OFF_WORK_TEST_HOST_HOLD__scene821'}),
});
/** R32H-family models (R32H and its append-only successors): exact source + views. */
export const C80_R32H_FAMILY=Object.freeze([
 Object.freeze({source:C80_R32H_SOURCE,views:C80_R32H_VIEWS}),
 Object.freeze({source:C80_R33_SOURCE,views:C80_R33_VIEWS}),
]);
export const r32hFamilyOf=sha=>C80_R32H_FAMILY.find(m=>m.source.glbSha256===sha)??null;
export const isR32HFamilySha=sha=>!!r32hFamilyOf(sha);
/** Exact R32H-family view gate: SHA, array counts, stage, scene name, root count/FNV and the required roots. */
export function isC80R32HSceneSource(json,sha,index,role,floor){
 const m=r32hFamilyOf(sha);
 const v=m&&Object.values(m.views).find(x=>x.role===role&&x.sceneIndex===index);
 const a=json?.asset?.extras,s=m?.source;
 if(!v||sha!==s.glbSha256||(floor!==undefined&&floor!==v.floor)||
  json?.scene!==s.defaultScene||json?.scenes?.length!==s.sceneCount||
  json?.nodes?.length!==s.nodeCount||json?.meshes?.length!==s.meshCount||
  json?.materials?.length!==s.materialCount||json?.accessors?.length!==s.accessorCount||
  json?.bufferViews?.length!==s.bufferViewCount||
  a?.ModelStage!=='WORK_TEST'||a?.current!==false||a?.asBuilt!==false||
  a?.HUMAN_REVIEW!=='NOT_RUN')return false;
 const scene=json.scenes[index],r=scene?.nodes;
 if(scene?.name!==v.name||!Array.isArray(r)||r.length!==v.rootCount||new Set(r).size!==r.length||
  c80R31Scene752RootsFnv32(r)!==v.rootFnv32)return false;
 const must=v.floor==='BOTH'?[s.envelopeRoot,s.p6Root,s.p6GutterRoot,s.sw04,s.sw05]:[s.sw04,s.sw05];
 if(!must.every(x=>r.includes(x))||s.replacedHallRoots.some(x=>r.includes(x))||
  r.includes(s.plexi)!==v.plexi||!(s.extraRoots??[]).every(x=>r.includes(x)))return false;
 const e=scene.extras??{};
 return e.current!==true&&e.asBuilt!==true&&e.CURRENT!==true;
}
/** R31-family viewer models (same R31 node indices, D/2F view pairs, R31 viewer runtime). */
export const isR31FamilyViewerSha=sha=>sha===C80_R31_9E0B_SOURCE.glbSha256||isR32HFamilySha(sha);
const sameList=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>v===b[i]);
/** Exact whole-D pair gate: SHA, counts, stage, root counts/FNV and the plexi-only difference. */
export function isC80R31Scene769770Source(json,sha,index,role,floor){
 const v=Object.values(C80_R31_9E0B_VIEWS).find(x=>x.role===role&&x.floor==='BOTH');
 const a=json?.asset?.extras,s=C80_R31_9E0B_SOURCE;
 if(!v||index!==v.sceneIndex||sha!==s.glbSha256||(floor!==undefined&&floor!=='BOTH')||
  json?.scene!==s.defaultScene||json?.scenes?.length!==s.sceneCount||
  json?.nodes?.length!==s.nodeCount||json?.meshes?.length!==s.meshCount||
  json?.materials?.length!==s.materialCount||json?.accessors?.length!==s.accessorCount||
  json?.bufferViews?.length!==s.bufferViewCount||
  a?.ModelStage!=='WORK_TEST'||a?.current!==false||a?.asBuilt!==false||
  a?.HUMAN_REVIEW!=='NOT_RUN')return false;
 const n=json.scenes[S9.bothNormalScene]?.nodes,sv=json.scenes[S9.bothServiceScene]?.nodes;
 if(!Array.isArray(n)||!Array.isArray(sv)||new Set(n).size!==n.length||new Set(sv).size!==sv.length||
  n.length!==S9.bothNormalRootCount||sv.length!==S9.bothServiceRootCount||
  c80R31Scene752RootsFnv32(n)!==S9.bothNormalFnv32||
  c80R31Scene752RootsFnv32(sv)!==S9.bothServiceFnv32||
  !sameList(sv,n.filter(x=>x!==S9.plexi))||!n.includes(S9.plexi)||
  ![S9.r300,S9.newP02,S9.copper].every(x=>n.includes(x)&&sv.includes(x)))return false;
 const e=json.scenes[index]?.extras??{};
 return e.current!==true&&e.asBuilt!==true&&e.CURRENT!==true;
}
const r31View=view=>Object.freeze({
 spec:Object.freeze({...C80_R31_9E0B_SOURCE,...view}),
 verify:view.floor==='BOTH'
  ?(json,sha,i)=>isC80R31Scene769770Source(json,sha,i,view.role,'BOTH')
  :(json,sha,i)=>isC80R31Scene771772Source(json,sha,i,view.role,'2F'),
 exactRootCount:true,
});

const r32hView=(view,source=C80_R32H_SOURCE)=>Object.freeze({
 spec:Object.freeze({...source,...view}),
 verify:(json,sha,i)=>isC80R32HSceneSource(json,sha,i,view.role,view.floor),
 exactRootCount:true,
});

/**
 * Source-lock Layerit to original authenticated R31 review scene receipts.
 * Never infer current/as-built identity or layer classes from scene names.
 */
export function r31ViewerLayerSceneReceipt(json, loadedSha, sceneIndex) {
 const family = r32hFamilyOf(loadedSha);
 if (family) {
  const r32 = Object.values(family.views).find(v => v.sceneIndex === sceneIndex);
  return r32 && isC80R32HSceneSource(json, loadedSha, sceneIndex, r32.role, r32.floor)
   ? Object.freeze({sourceSha256: loadedSha, sceneIndex, role: r32.role, floor: r32.floor}) : null;
 }
 if (loadedSha !== C80_R31_9E0B_SOURCE.glbSha256) return null;
 const view = Object.values(C80_R31_9E0B_VIEWS).find(v => v.sceneIndex === sceneIndex);
 if (!view) return null;
 const proven = view.floor === 'BOTH'
  ? isC80R31Scene769770Source(json, loadedSha, sceneIndex, view.role, view.floor)
  : isC80R31Scene771772Source(json, loadedSha, sceneIndex, view.role, view.floor);
 return proven ? Object.freeze({sourceSha256: loadedSha, sceneIndex, role: view.role, floor: view.floor}) : null;
}

/** Layer binding scope derives exclusively from an authenticated R31 scene receipt.
 * R31 2F views must not inherit a WHOLE/BOTH fallback from the inactive D UI.
 */
export function r31ViewerLayerBindingScope(json, loadedSha, sceneIndex) {
  const proof = r31ViewerLayerSceneReceipt(json, loadedSha, sceneIndex);
  return proof ? Object.freeze({area: 'D', floor: proof.floor}) : null;
}

/** Candidate id -> exact source + named views. Unknown ids are not R31 reviews. */
export function r31WorkTestReview(candidate){
 const table={
  [C80_R31_R300_WORK_TEST_ID]:{source:C80_R31_R300_SOURCE,views:C80_R31_R300_VIEWS,
   labels:{normal:'Normaali',service:'Huolto'},title:'NIBE R300'},
  [C80_R31_9E0B_WORK_TEST_ID]:{source:C80_R31_9E0B_SOURCE,views:C80_R31_9E0B_VIEWS,
   labels:Object.fromEntries(Object.entries(C80_R31_9E0B_VIEWS).map(([k,v])=>[k,v.label])),title:'C80 R31 D'},
  [C80_R32H_WORK_TEST_ID]:{source:C80_R32H_SOURCE,views:C80_R32H_VIEWS,
   labels:Object.fromEntries(Object.entries(C80_R32H_VIEWS).map(([k,v])=>[k,v.label])),title:'C80 R32 D'},
  [C80_R33_WORK_TEST_ID]:{source:C80_R33_SOURCE,views:C80_R33_VIEWS,
   labels:Object.fromEntries(Object.entries(C80_R33_VIEWS).map(([k,v])=>[k,v.label])),title:'C80 R33 D'},
 };
 const r=Object.hasOwn(table,candidate?.id)?table[candidate.id]:undefined;
 if(!r)return undefined;
 if(candidate.path!==`/private-model/work-test/${candidate.id}.glb`)
  throw new Error('C80_R31_CANDIDATE_PATH_MISMATCH');
 return Object.freeze({id:candidate.id,...r});
}

const r300Role=view=>Object.freeze({
 spec:Object.freeze({...C80_R31_R300_SOURCE,...view}),
 verify:(json,sha,i)=>isC80R31R300CopperSource(json,sha,i,view.role,'BOTH'),
 exactRootCount:true,
});

export const C80_R31_REVIEW_ROLES=Object.freeze({
 K5_PINK_OFF:Object.freeze({
  spec:C80_R31_SCENE752_SOURCES.k5,
  verify:(json,sha,i)=>isC80R31Scene752Source(json,sha,i,'k5','BOTH'),
 }),
 RAIN5:Object.freeze({
  spec:C80_R31_SCENE752_SOURCES.rain5,
  verify:(json,sha,i)=>isC80R31Scene752Source(json,sha,i,'rain5','BOTH'),
 }),
 RAIN5_K5_OFF:Object.freeze({
  spec:C80_R31_SCENE753_SOURCE,
  verify:(json,sha,i)=>isC80R31Scene753Source(
   json,sha,i,C80_R31_SCENE753_SOURCE.role,'BOTH'),
 }),
 RAIN5_K5_OFF_H18116_VISUAL:Object.freeze({
  spec:C80_R31_SCENE754_SOURCE,
  verify:(json,sha,i)=>isC80R31Scene754Source(
   json,sha,i,C80_R31_SCENE754_SOURCE.role,'BOTH'),
 }),
 L16_CURVE_KIV_CASE_COMBINED:Object.freeze({
  spec:C80_R31_SCENE756_SOURCE,
  verify:(json,sha,i)=>isC80R31Scene756Source(
   json,sha,i,C80_R31_SCENE756_SOURCE.role,'BOTH'),
 }),
 [C80_R31_R300_VIEWS.normal.role]:r300Role(C80_R31_R300_VIEWS.normal),
 [C80_R31_R300_VIEWS.service.role]:r300Role(C80_R31_R300_VIEWS.service),
 ...Object.fromEntries(Object.values(C80_R31_9E0B_VIEWS).map(v=>[v.role,r31View(v)])),
 ...Object.fromEntries(Object.values(C80_R32H_VIEWS).map(v=>[v.role,r32hView(v)])),
 ...Object.fromEntries(Object.values(C80_R33_VIEWS).map(v=>[v.role,r32hView(v,C80_R33_SOURCE)])),
});

const matchesRenderedScene=(gltf,scene,i,cfg)=>{
 const json=gltf.parser?.json;
 return !!scene&&scene.name===json?.scenes?.[i]?.name&&
  (!cfg.exactRootCount||scene.children?.length===cfg.spec.rootCount)&&
  c80530RenderedRootPathMatches(json,scene,i,gltf.parser?.associations);
};

/** Restore any shared glTF children moved by the loader before mounting either R300 view. */
export async function prepareC80R31R300ReviewScenes(gltf,authenticatedSha){
 return prepareC80R31ReviewScenes(gltf,authenticatedSha,C80_R31_R300_VIEWS);
}
/** Same for any exact R31 view set (all views must pass their source gate first). */
export async function prepareC80R31ReviewScenes(gltf,authenticatedSha,viewSet){
 const views=Object.values(viewSet);
 const json=gltf?.parser?.json;
 const cfgs=views.map(v=>C80_R31_REVIEW_ROLES[v.role]);
 if(!Array.isArray(gltf?.scenes)||cfgs.some(c=>!c)||
  cfgs.some(c=>gltf.scenes.length!==c.spec.sceneCount)||
  !views.every((view,k)=>cfgs[k].verify(json,authenticatedSha,view.sceneIndex)))
  throw new Error('C80_R31_REVIEW_SOURCE_MISMATCH');
 for(const view of views){
  if(!resolveC80R31ReviewScene(gltf,authenticatedSha,view.role)){
   const rebuilt=await rehydrateIncompleteScene(gltf,view.sceneIndex,{force:true});
   if(!resolveC80R31ReviewScene(gltf,authenticatedSha,view.role))
    throw new Error('C80_R31_REVIEW_GRAPH_MISMATCH');
   // The initial loader association map predates these verified scene copies.
   // Keep the exact node indices on the mounted copies for Layers discovery.
   const associations=gltf.parser.associations;
   if(rebuilt&&associations instanceof Map)for(const [object,node] of rebuilt)
    associations.set(object,{...associations.get(object),nodes:node});
  }
 }
}

/** Exact source role and Object3D binding, not a viewer mount or publication. */
export function resolveC80R31ReviewScene(gltf,authenticatedSha,role){
 const cfg=Object.hasOwn(C80_R31_REVIEW_ROLES,role)?C80_R31_REVIEW_ROLES[role]:null;
 const json=gltf?.parser?.json;
 if(!cfg||typeof authenticatedSha!=='string'||!json||
  !Array.isArray(gltf?.scenes)||
  gltf.scenes.length!==cfg.spec.sceneCount||
  authenticatedSha!==cfg.spec.glbSha256)return null;
 const i=cfg.spec.sceneIndex,scene=gltf.scenes[i];
 if(!cfg.verify(json,authenticatedSha,i)||!matchesRenderedScene(gltf,scene,i,cfg))return null;
 return Object.freeze({scene,sceneIndex:i,role,authenticatedSha,
  sceneName:scene.name,rootCount:json.scenes[i].nodes.length});
}

/** A mount is accepted only when its target identity and optional proof hold.
 * All failures attempt to restore the exact previous mount. If rollback is
 * unverified, caller MUST permanently quarantine this staging handle.
 */
export function c80R31AtomicReviewMount({mount,mounted,previous,target,verifyTarget}){
 if(typeof mount!=='function'||typeof mounted!=='function')
  throw new Error('C80_R31_REVIEW_MOUNT_CONTRACT');
 let error;
 try{
  mount(target);
  if(mounted()!==target||
   (typeof verifyTarget==='function'&&!verifyTarget()))
   throw new Error('C80_R31_REVIEW_MOUNT_MISMATCH');
  return {ok:true};
 }catch(e){error=e;}
 try{
  mount(previous);
  if(mounted()!==previous)
   throw new Error('C80_R31_REVIEW_ROLLBACK_MISMATCH');
  return {ok:false,restored:true,error};
 }catch(rollbackError){
  return {ok:false,restored:false,error,rollbackError};
 }
}

/** Switch only between the prepared R300 pair in the existing viewer mount. */
export async function createC80R31R300ViewSwitch({gltf,authenticatedSha,mount,mounted}){
 return createC80R31ViewSwitch({gltf,authenticatedSha,mount,mounted,views:C80_R31_R300_VIEWS});
}
/** Switch only between the prepared views of ONE authenticated R31 GLB. The first view is the default. */
export async function createC80R31ViewSwitch({gltf,authenticatedSha,mount,mounted,views}){
 await prepareC80R31ReviewScenes(gltf,authenticatedSha,views);
 const first=Object.keys(views)[0];
 const byView=Object.fromEntries(Object.entries(views).map(([name,view])=>{
  const proof=resolveC80R31ReviewScene(gltf,authenticatedSha,view.role);
  return [name,{
   ...proof,snapshot:c80530SnapshotRenderedSourceTree(proof.scene,proof.rootCount),
  }];
 }));
 if(Object.values(byView).some(view=>!view.snapshot))
  throw new Error('C80_R31_REVIEW_GRAPH_MISMATCH');
 let quarantined=false;
 const activeView=()=>{
  if(quarantined)return null;
  return Object.keys(byView).find(name=>byView[name].scene===mounted())??null;
 };
 return Object.freeze({
  normalScene:byView[first].scene,
  defaultView:first,
  views:Object.freeze(Object.keys(byView)),
  activeView,
  select(name){
   const current=activeView();
   if(!current||!Object.hasOwn(byView,name))return false;
   if(current===name)return true;
   const target=byView[name];
   const valid=()=>c80530RenderedSourceTreeUnchanged(target.scene,target.snapshot)&&
    resolveC80R31ReviewScene(gltf,authenticatedSha,target.role)?.scene===target.scene;
   if(!valid())return false;
   const outcome=c80R31AtomicReviewMount({
    mount,mounted,previous:byView[current].scene,target:target.scene,verifyTarget:valid,
   });
   if(!outcome.ok&&!outcome.restored){
    quarantined=true;
    throw new Error('C80_R31_REVIEW_ROLLBACK_UNVERIFIED',{cause:outcome.rollbackError});
   }
   return outcome.ok;
  },
 });
}

export function createC80R31ReviewRuntime({
 gltf,authenticatedSha,role,mount,mounted,
}){
 if(typeof mount!=='function'||typeof mounted!=='function')
  throw new Error('C80_R31_REVIEW_MOUNT_CONTRACT');
 const proof=resolveC80R31ReviewScene(gltf,authenticatedSha,role);
 if(!proof)throw new Error('C80_R31_REVIEW_SOURCE_MISMATCH');
 const {scene,sceneIndex,rootCount}=proof,json=gltf.parser.json;
 const cfg=C80_R31_REVIEW_ROLES[role];
 const snapshot=c80530SnapshotRenderedSourceTree(scene,rootCount);
 if(!snapshot)throw new Error('C80_R31_REVIEW_GRAPH_MISMATCH');
 let previous=null,active=false,disposed=false,quarantined=false;
 const live=()=>!disposed&&!quarantined&&
  gltf.scenes?.[sceneIndex]===scene&&
  c80530RenderedSourceTreeUnchanged(scene,snapshot)&&
  matchesRenderedScene(gltf,scene,sceneIndex,cfg)&&
  cfg.verify(json,authenticatedSha,sceneIndex);
 const quarantine=()=>{
  quarantined=true;disposed=true;active=false;previous=null;
 };
 return Object.freeze({
  role,sceneIndex,sourceSha256:authenticatedSha,
  sceneName:proof.sceneName,rootCount,
  stage:'WORK_TEST_HOST_HOLD',
  get available(){return !disposed&&!quarantined;},
  get active(){return active;},
  get quarantined(){return quarantined;},
  get selectedScene(){return quarantined?null:scene;},
  get sourceLinksBound(){return false;},
  get publicationAllowed(){return false;},
  get physicalHostVerified(){return false;},
  get productionWebGLVerified(){return false;},
  get humanReview(){return 'NOT_RUN';},
  get current(){return false;},
  get asBuilt(){return false;},
  /** Preview only after external authentication. Never called automatically. */
  preview(){
   if(active||!live())return null;
   let before;
   try{before=mounted();}catch{return null;}
   if(before===scene)return null;
   const outcome=c80R31AtomicReviewMount({
    mount,mounted,previous:before,target:scene,verifyTarget:live,
   });
   if(!outcome.ok){
    if(!outcome.restored){
     quarantine();
     throw new Error('C80_R31_REVIEW_ROLLBACK_UNVERIFIED',
      {cause:outcome.rollbackError});
    }
    return null;
   }
   previous=before;active=true;
   return Object.freeze({sceneIndex,role,stage:'WORK_TEST_HOST_HOLD'});
  },
  /** Restore the exact earlier mount; do not promote or retain this model. */
  restore(){
   if(disposed||quarantined||!active)return false;
   let found;
   try{found=mounted();}catch{quarantine();return false;}
   if(found!==scene){quarantine();return false;}
   const outcome=c80R31AtomicReviewMount({
    mount,mounted,previous:scene,target:previous,
   });
   if(!outcome.ok){
    if(!outcome.restored){
     quarantine();
     throw new Error('C80_R31_REVIEW_ROLLBACK_UNVERIFIED',
      {cause:outcome.rollbackError});
    }
    return false;
   }
   previous=null;active=false;
   return true;
  },
  dispose(){
   if(active)throw new Error('C80_R31_REVIEW_RESTORE_FIRST');
   disposed=true;
  },
 });
}
