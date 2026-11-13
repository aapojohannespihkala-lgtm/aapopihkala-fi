// Private C80 VP1 hidden exterior hose successor, SHA-locked source-only receipt.
// No auto publication, sourceLinks rebind, CURRENT, production WebGL, or HUMAN_REVIEW.
// Filename __scene379 never identifies a glTF internal scene.
export const VP1_383_GLB_SHA256='bcd50cd5fdb821cab3b1c43ad40a83dbe46d7f1f33e5ba8f9c3b23768122209c';
export const VP1_383_GLB_SIZE=54131280;
export const VP1_383_ZIP_SHA256='42299c96626e0748d9cc2ecd164d7ee7b9052fa0ec89482fc1844b1c418dd68f';
export const VP1_383_DRIVE_ID='19o8_cvPhKym17pO_UybYKHEQ83PKBoFm';
export const VP1_383_BASE_SHA256='6dbde452dec2842130adcaa8c92699ac5b9dae0130800e53b1fe829385853d90';
export const VP1_383_SCENE_COUNT=383;
export const VP1_383_NODE_COUNT=12120;
export const VP1_383_MESH_COUNT=4561;
export const VP1_383_DEFAULT_SCENE=292;
export const VP1_383_SCENES=Object.freeze({
  378:{name:'C80_MJ89_KP010_VP1_NO_VISIBLE_OUTDOOR_HOSE_1F_CLOSED_WORK_TEST_HOST_HOLD__scene378',floor:'1F',glazing:'CLOSED',cutaway:false,count:290,rootFnv:'55daef41',vp1Root:12117},
  379:{name:'C80_MJ89_KP010_VP1_NO_VISIBLE_OUTDOOR_HOSE_BOTH_CLOSED_WORK_TEST_HOST_HOLD__scene379',floor:'BOTH',glazing:'CLOSED',cutaway:false,count:465,rootFnv:'c08c1ef7',vp1Root:12119},
  380:{name:'C80_MJ89_KP010_VP1_NO_VISIBLE_OUTDOOR_HOSE_BOTH_ONE_OPEN_WORK_TEST_HOST_HOLD__scene380',floor:'BOTH',glazing:'ONE_OPEN',cutaway:false,count:464,rootFnv:'9e548cda',vp1Root:12119},
  381:{name:'C80_MJ89_KP010_VP1_NO_VISIBLE_OUTDOOR_HOSE_BOTH_STACKED_WORK_TEST_HOST_HOLD__scene381',floor:'BOTH',glazing:'STACKED',cutaway:false,count:464,rootFnv:'a36aaf32',vp1Root:12119},
  382:{name:'C80_MJ89_KP010_VP1_NO_VISIBLE_OUTDOOR_HOSE_BOTH_PK1_CUTAWAY_WORK_TEST_HOST_HOLD__scene382',floor:'BOTH',glazing:'CLOSED',cutaway:true,count:465,rootFnv:'fbca1ae2',vp1Root:12119},
});
export function vp1383RootFnv32(ids){
  if(!Array.isArray(ids))return null;
  let hash=2166136261;
  for(const id of ids){
    if(!Number.isInteger(id)||id<0)return null;
    hash=Math.imul(hash^id,16777619)>>>0;
  }
  return hash.toString(16).padStart(8,'0');
}
// A correct outer ZIP or familiar filename is insufficient. The trusted
// loader hashes all 54,131,280 inner GLB bytes before supplying loadedSha.
export function isVP1383SourceScene(gltfJson,loadedSha,index,floor=null,glazing=null,cutaway=null){
  const spec=VP1_383_SCENES[index],scene=gltfJson?.scenes?.[index];
  if(loadedSha!==VP1_383_GLB_SHA256||!spec||!scene||
    (floor!==null&&spec.floor!==floor)||
    (glazing!==null&&spec.glazing!==glazing)||
    (cutaway!==null&&spec.cutaway!==cutaway)||
    gltfJson?.scene!==VP1_383_DEFAULT_SCENE||
    gltfJson?.scenes?.length!==VP1_383_SCENE_COUNT||
    gltfJson?.nodes?.length!==VP1_383_NODE_COUNT||
    gltfJson?.meshes?.length!==VP1_383_MESH_COUNT||
    gltfJson?.asset?.extras?.ModelStage!=='WORK_TEST'||
    gltfJson?.asset?.extras?.current!==false||
    gltfJson?.asset?.extras?.asBuilt!==false||
    gltfJson?.asset?.extras?.HUMAN_REVIEW!=='NOT_RUN'||
    scene.name!==spec.name||
    !Array.isArray(scene.nodes)||scene.nodes.length!==spec.count||
    new Set(scene.nodes).size!==spec.count||
    scene.nodes.some(i=>!Number.isInteger(i)||i<0||i>=VP1_383_NODE_COUNT)||
    vp1383RootFnv32(scene.nodes)!==spec.rootFnv||
    !scene.nodes.includes(spec.vp1Root)||
    scene.nodes.includes(12042)||scene.nodes.includes(12075)||
    !scene.nodes.includes(9003)||
    scene.extras?.ownerFeedback!=='2026-11-14 outdoor hose not visible in reality'||
    scene.extras?.concealedRoute!=='WORK_TEST_ASSUMPTION'||
    scene.extras?.sourceBaseSHA256!==VP1_383_BASE_SHA256||
    scene.extras?.sourceLinksBindingVerified!==false||
    scene.extras?.productionWebGL!=='NOT_RUN'||
    scene.extras?.HUMAN_REVIEW!=='NOT_RUN'||
    scene.extras?.asBuilt!==false)return false;
  const n=gltfJson.nodes;
  if(n[12114]?.mesh!==4560||n[12115]?.mesh!==4560||
    n[12114]?.extras?.asBuilt!==false||n[12115]?.extras?.asBuilt!==false||
    n[12114]?.extras?.physicalConnectionsVerified!==0||
    n[12115]?.extras?.physicalConnectionsVerified!==0||
    JSON.stringify(n[12116]?.children)!==JSON.stringify([12025,12026,12027,12028,12029,12030,12031,12114,12033,12034,12035])||
    JSON.stringify(n[12117]?.children)!=='[12116,12041]'||
    JSON.stringify(n[12118]?.children)!==JSON.stringify([12058,12059,12060,12061,12062,12063,12064,12115,12066,12067,12068])||
    JSON.stringify(n[12119]?.children)!=='[12118,12074]'||
    !n[12114]?.name?.includes('VP1_KV_INDOOR_UNDER_BENCH_HIDDEN')||
    !n[12115]?.name?.includes('VP1_KV_INDOOR_UNDER_BENCH_HIDDEN')||
    gltfJson.meshes[4560]?.name!=='VP1_D1F_KV_UNDER_BENCH_HIDDEN_BEHIND_SOUTH_FACADE_OWNER20261114_WORK_TEST')return false;
  return true;
}
export function resolveVP1383SourceSceneIndex(sha,floor,glazing='CLOSED',cutaway=false){
  if(sha!==VP1_383_GLB_SHA256||
    !['1F','2F','BOTH'].includes(floor)||
    !['CLOSED','ONE_OPEN','STACKED'].includes(glazing)||
    typeof cutaway!=='boolean')return null;
  const hits=Object.entries(VP1_383_SCENES).filter(([,s])=>
    s.floor===floor&&s.glazing===glazing&&s.cutaway===cutaway);
  return hits.length===1?Number(hits[0][0]):null;
}
