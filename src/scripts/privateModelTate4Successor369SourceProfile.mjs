// Read-only source-exact receiver for the 13 Nov 2026 M6263+MJ72+KIV005+PK1 successor.
// The calling viewer must independently SHA256-verify the complete inner GLB.
// This does not approve sourceLinks rebind, physical hosts, publication, WebGL or as-built.
import {TATE4_MJ6263_SCENES,TATE4_MJ6263_PARENT_SHA256,
 TATE4_MJ6263_MJ62_SHA256,TATE4_MJ6263_MJ63_SHA256,
 tate4Mj6263RootsFnv32} from './privateModelTate4Mj62Mj63SourceProfile.mjs';

export const SUCC369_SHA256='31dc12c484fcf951c4373387b9653e26206a8ac3bc4978d5d980daeac3a6ade2';
export const SUCC369_ZIP_ID='152JZBJ5VtfvtQUXwgUuy27dhsDv7GXHV';
export const SUCC369_PREVIOUS_SHA256='8aaadccfaa880e7693337467a00d9efb53d4d5e332d377be10d1e353e87e25c5';
export const SUCC369_DONOR_SHA256=Object.freeze({
 pk1:'332286731a009b9857d52f4abb427a33dfc47ded80788ed9c936df28d30b26cb',
 mj72:'75c56ed388a45d2adad7cdef5c93bdb42c5c2b77d924e494bf7449d728f245d3',
 kiv005:'113c3e027c7e210a3b1d20417c9be0d78070b739bc1650c88bcb5ae47db3abbf',
});
export const SUCC369_SOURCE_LINKS_BOUND=false;
export const SUCC369_SCENES=Object.freeze({
 360:Object.freeze({base:353,floor:'1F',glazing:'CLOSED',cutaway:false,roots:289,fnv:'5beeb483'}),
 361:Object.freeze({base:354,floor:'2F',glazing:'CLOSED',cutaway:false,roots:184,fnv:'5aac64ee'}),
 362:Object.freeze({base:355,floor:'BOTH',glazing:'CLOSED',cutaway:false,roots:464,fnv:'f787d22e'}),
 363:Object.freeze({base:356,floor:'2F',glazing:'ONE_OPEN',cutaway:false,roots:184,fnv:'f1407ff0'}),
 364:Object.freeze({base:357,floor:'BOTH',glazing:'ONE_OPEN',cutaway:false,roots:464,fnv:'a5b54c2e'}),
 365:Object.freeze({base:358,floor:'2F',glazing:'STACKED',cutaway:false,roots:184,fnv:'58c2863e'}),
 366:Object.freeze({base:359,floor:'BOTH',glazing:'STACKED',cutaway:false,roots:464,fnv:'cafe4ece'}),
 367:Object.freeze({base:353,floor:'1F',glazing:'CLOSED',cutaway:true,roots:289,fnv:'76511606'}),
 368:Object.freeze({base:355,floor:'BOTH',glazing:'CLOSED',cutaway:true,roots:464,fnv:'245ed495'}),
});
function exactSwap(roots,from,to){
 if(roots.filter(x=>x===from).length!==1||roots.includes(to))return null;
 return roots.map(x=>x===from?to:x);
}
function validateImportedNodes(nodes){
 const pk=nodes[12097],original=nodes[2220],mj=nodes[12098],kiv=nodes[12106],kivChild=nodes[12107];
 if(!pk||!original||!mj||!kiv||!kivChild)return false;
 if(pk.name!=='PK1_INSPECT_1F_C77_WRAPPER_NO_PRESENTATION_CABINET_2202_WORK_TEST'||
    pk.extras?.pk1Diagnostic?.removedFromNewScenesOnly!==2202||
    pk.extras?.pk1Diagnostic?.notPhysicalModification!==true||
    pk.extras?.current!==false||pk.extras?.asBuilt!==false||
    !Array.isArray(original.children)||!original.children.includes(2202)||
    JSON.stringify(pk.children)!==JSON.stringify(original.children.filter(x=>x!==2202)))return false;
 if(mj.name!=='MJ72_OWNER2026_STORAGE_SOCKET_TWO_CLOSED_COVERS_UPPER_DOOR_WALL_COW_ROOT_WORK_TEST_HOST_HOLD'||
    mj.extras?.current!==false||mj.extras?.asBuilt!==false||
    mj.extras?.closedCoverCountVisible!==2||
    mj.extras?.sourceLinksBindingNewSHA!=='NOT_VERIFIED; source URL provenance only'||
    !Array.isArray(mj.extras?.sourceLinks)||mj.extras.sourceLinks.length<1||
    JSON.stringify(mj.children)!=='[12099,12100,12101,12102,12103,12104,12105]')return false;
 for(let i=12099;i<=12105;i++){
  const x=nodes[i]?.extras;
  if(x?.currentGLBSourceLinksBindingVerified!==false||
     !Array.isArray(x.sourceLinks)||x.sourceLinks.length===0)return false;
 }
 return kiv.name==='C80R2_V29_KIV_WALLFIT_2F_OWNER2026_KIV005_POINT_COW_GROUP_WORK_TEST_HOST_HOLD'&&
   kiv.extras?.sourceLinksRequireRebind===true&&
   kivChild.extras?.sourceLinksRequireRebind===true&&
   kiv.extras?.notCurrent===true&&kiv.extras?.notAsBuilt===true&&
   Array.isArray(kiv.children)&&kiv.children.includes(12107)&&
   Array.isArray(kiv.extras.sourceLinks)&&kiv.extras.sourceLinks.length>0&&
   Array.isArray(kivChild.extras.sourceLinks)&&kivChild.extras.sourceLinks.length>0;
}
// sceneIndex is glTF scenes[] index, NOT the package name's __sceneN suffix.
// Positive = safe to present as WORK_TEST source only. It is NOT authorization
// to claim a new-SHA sourceLinks binding or to pass production/review gates.
export function isSucc369SourceScene(json,loadedSha,sceneIndex,floor=null,glazing=null,cutaway=null){
 const e=SUCC369_SCENES[sceneIndex],s=json?.scenes?.[sceneIndex],a=json?.asset?.extras;
 if(loadedSha!==SUCC369_SHA256||!e||!s||
    (floor!==null&&floor!==e.floor)||
    (glazing!==null&&glazing!==e.glazing)||
    (cutaway!==null&&cutaway!==e.cutaway)||
    json?.scene!==292||json?.scenes?.length!==369||
    json?.nodes?.length!==12108||json?.meshes?.length!==4556||
    a?.Canonical!==false||a?.ModelStage!=='WORK_TEST'||
    a?.current!==false||a?.asBuilt!==false||a?.HUMAN_REVIEW!=='NOT_RUN'||
    a?.viewerFloorScenes?.['1F']!==350||a?.viewerFloorScenes?.['2F']!==351||
    a?.viewerFloorScenes?.BOTH!==352||!validateImportedNodes(json.nodes))return false;
 const b=json.scenes[e.base],old=TATE4_MJ6263_SCENES[e.base];
 if(!old||!b||!Array.isArray(b.nodes)||
    b.nodes.length!==old.roots||tate4Mj6263RootsFnv32(b.nodes)!==old.fnv||
    b.name!=='C80_TATE_MJ62_MJ63_'+old.floor+'_'+old.glazing+'_WORK_TEST_HOST_HOLD_20261113__scene'+e.base||
    b.extras?.integration?.parentScene!==old.parent)return false;
 const stem='C80_M6263_MJ72_KIV005_'+(e.cutaway?'PK1_CUTAWAY_':'');
 if(s.name!==stem+e.floor+'_'+e.glazing+'_WORK_TEST_HOST_HOLD_20261113'||
    !Array.isArray(s.nodes)||s.nodes.length!==e.roots||
    new Set(s.nodes).size!==s.nodes.length||
    s.nodes.some(x=>!Number.isInteger(x)||x<0||x>=12108)||
    tate4Mj6263RootsFnv32(s.nodes)!==e.fnv)return false;
 const x=s.extras,ing=x?.integration;
 if(x?.current!==false||x?.asBuilt!==false||x?.stage!=='WORK_TEST_HOST_HOLD'||
    x?.humanReview!=='NOT_RUN'||x?.productionWebGL!=='NOT_RUN'||
    x?.physicalConnectionsVerified!==0||
    x?.sourceParentGLBSHA256!==TATE4_MJ6263_PARENT_SHA256||
    ing?.task!=='GPT6-TATE4-MJ62-MJ63-INTEGRAATIO-20261113'||
    ing?.parentScene!==old.parent||ing?.floor!==e.floor||
    ing?.glazingState!==e.glazing||
    ing?.sourceGLBSHA256?.tate4!==TATE4_MJ6263_PARENT_SHA256||
    ing?.sourceGLBSHA256?.mj62!==TATE4_MJ6263_MJ62_SHA256||
    ing?.sourceGLBSHA256?.mj63!==TATE4_MJ6263_MJ63_SHA256)return false;
 let expected=b.nodes;
 if(e.floor!=='2F'){
  expected=exactSwap(expected,11542,12098);
  if(!expected)return false;
 }
 if(e.floor!=='1F'){
  expected=exactSwap(expected,8913,12106);
  if(!expected)return false;
 }
 if(e.cutaway){
  expected=exactSwap(expected,2220,12097);
  if(!expected)return false;
 }
 return JSON.stringify(s.nodes)===JSON.stringify(expected);
}
