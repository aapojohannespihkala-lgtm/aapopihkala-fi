// SHA-locked, read-only receiver for C80 M6263 + MJ72 + KIV005 + PK1.
// The trusted caller must independently hash the complete inner GLB. The
// __sceneN filename is not a glTF scene index and is never used for identity.
// This is not a publisher, sourceLinks rebind, WebGL test or HUMAN_REVIEW.
// G2b TYÖ EI AUTO: https://drive.google.com/file/d/152JZBJ5VtfvtQUXwgUuy27dhsDv7GXHV/view
export const SUCCESSOR_R1_SHA256='31dc12c484fcf951c4373387b9653e26206a8ac3bc4978d5d980daeac3a6ade2';
export const SUCCESSOR_R1_DRIVE_ID='152JZBJ5VtfvtQUXwgUuy27dhsDv7GXHV';
export const SUCCESSOR_R1_ZIP_SHA256='f0d42d10f9e7a1a8f4135a8a5b319145d25dceccff317a4a5a1d7c059107fafe';
export const SUCCESSOR_R1_DONORS=Object.freeze({"base":"8aaadccfaa880e7693337467a00d9efb53d4d5e332d377be10d1e353e87e25c5","pk1":"332286731a009b9857d52f4abb427a33dfc47ded80788ed9c936df28d30b26cb","mj72":"75c56ed388a45d2adad7cdef5c93bdb42c5c2b77d924e494bf7449d728f245d3","kiv005":"113c3e027c7e210a3b1d20417c9be0d78070b739bc1650c88bcb5ae47db3abbf"});
export const SUCCESSOR_R1_SCENES=Object.freeze({"360":{"name":"C80_M6263_MJ72_KIV005_1F_CLOSED_WORK_TEST_HOST_HOLD_20261113","floor":"1F","glazing":"CLOSED","cutaway":false,"parent":353,"count":289,"fnv":"5beeb483","replacements":{"MJ72":[11542,12098]}},"361":{"name":"C80_M6263_MJ72_KIV005_2F_CLOSED_WORK_TEST_HOST_HOLD_20261113","floor":"2F","glazing":"CLOSED","cutaway":false,"parent":354,"count":184,"fnv":"5aac64ee","replacements":{"KIV005":[8913,12106]}},"362":{"name":"C80_M6263_MJ72_KIV005_BOTH_CLOSED_WORK_TEST_HOST_HOLD_20261113","floor":"BOTH","glazing":"CLOSED","cutaway":false,"parent":355,"count":464,"fnv":"f787d22e","replacements":{"MJ72":[11542,12098],"KIV005":[8913,12106]}},"363":{"name":"C80_M6263_MJ72_KIV005_2F_ONE_OPEN_WORK_TEST_HOST_HOLD_20261113","floor":"2F","glazing":"ONE_OPEN","cutaway":false,"parent":356,"count":184,"fnv":"f1407ff0","replacements":{"KIV005":[8913,12106]}},"364":{"name":"C80_M6263_MJ72_KIV005_BOTH_ONE_OPEN_WORK_TEST_HOST_HOLD_20261113","floor":"BOTH","glazing":"ONE_OPEN","cutaway":false,"parent":357,"count":464,"fnv":"a5b54c2e","replacements":{"MJ72":[11542,12098],"KIV005":[8913,12106]}},"365":{"name":"C80_M6263_MJ72_KIV005_2F_STACKED_WORK_TEST_HOST_HOLD_20261113","floor":"2F","glazing":"STACKED","cutaway":false,"parent":358,"count":184,"fnv":"58c2863e","replacements":{"KIV005":[8913,12106]}},"366":{"name":"C80_M6263_MJ72_KIV005_BOTH_STACKED_WORK_TEST_HOST_HOLD_20261113","floor":"BOTH","glazing":"STACKED","cutaway":false,"parent":359,"count":464,"fnv":"cafe4ece","replacements":{"MJ72":[11542,12098],"KIV005":[8913,12106]}},"367":{"name":"C80_M6263_MJ72_KIV005_PK1_CUTAWAY_1F_CLOSED_WORK_TEST_HOST_HOLD_20261113","floor":"1F","glazing":"CLOSED","cutaway":true,"parent":353,"count":289,"fnv":"76511606","replacements":{"MJ72":[11542,12098],"PK1_CUTAWAY":[2220,12097]}},"368":{"name":"C80_M6263_MJ72_KIV005_PK1_CUTAWAY_BOTH_CLOSED_WORK_TEST_HOST_HOLD_20261113","floor":"BOTH","glazing":"CLOSED","cutaway":true,"parent":355,"count":464,"fnv":"245ed495","replacements":{"MJ72":[11542,12098],"KIV005":[8913,12106],"PK1_CUTAWAY":[2220,12097]}}});
export const SUCCESSOR_R1_SCENE_COUNT=369;
export const SUCCESSOR_R1_NODE_COUNT=12108;
export const SUCCESSOR_R1_MESH_COUNT=4556;
export const SUCCESSOR_R1_DEFAULT_SCENE=292;
export function successorR1RootFnv32(roots){
  if(!Array.isArray(roots))return null;
  let hash=2166136261;
  for(const id of roots){
    if(!Number.isInteger(id)||id<0)return null;
    hash=Math.imul(hash^id,16777619)>>>0;
  }
  return hash.toString(16).padStart(8,'0');
}
function hasSourceLink(list,role,field,url){
  return Array.isArray(list)&&list.some(x=>x?.role===role&&x?.[field]===url);
}
const PHOTO='https://drive.google.com/file/d/1Tlxfbs5f-vzkMRVVcWEpSqLyC-Kjwrer/view';
const DOC='https://docs.google.com/document/d/18_PBZ5QxJD_4X0vfxuQz5PTaWTNB-tDNWNs2FUu2SHI/edit';
const KIV='https://docs.google.com/document/d/1oUyzHXMLPGI1SU7Wf8lCCllmmCjc-bvNReIaP_b-rQE/edit';
function validImportedNodes(nodes){
  const pk=nodes?.[12097],mj=nodes?.[12098],kv=nodes?.[12106],tip=nodes?.[12107];
  if(!Array.isArray(nodes)||nodes.length!==SUCCESSOR_R1_NODE_COUNT||
     pk?.name!=='PK1_INSPECT_1F_C77_WRAPPER_NO_PRESENTATION_CABINET_2202_WORK_TEST'||
     pk?.extras?.stage!=='WORK_TEST_SOURCE_ONLY_STAGING_HOLD'||
     pk?.extras?.current!==false||pk?.extras?.asBuilt!==false||
     pk?.extras?.canPublish!==false||pk?.extras?.canApplyToViewer!==false||
     !Array.isArray(pk.children)||pk.children.length!==58||
     new Set(pk.children).size!==58||pk.children.includes(2202)||
     mj?.name!=='MJ72_OWNER2026_STORAGE_SOCKET_TWO_CLOSED_COVERS_UPPER_DOOR_WALL_COW_ROOT_WORK_TEST_HOST_HOLD'||
     mj?.extras?.modelStage!=='WORK_TEST_HOST_HOLD'||
     mj?.extras?.current!==false||mj?.extras?.asBuilt!==false||
     mj?.extras?.closedCoverCountVisible!==2||mj?.extras?.exact2026XYZMeasured!==false||
     mj?.extras?.physicalElectricalConnectionVerified!==false||
     mj?.extras?.sourceLinksBindingNewSHA!=='NOT_VERIFIED; source URL provenance only'||
     JSON.stringify(mj.children)!=='[12099,12100,12101,12102,12103,12104,12105]'||
     !hasSourceLink(mj.extras.sourceLinks,'OWNER_PHOTO_VISIBLE_2026','url',PHOTO)||
     !hasSourceLink(mj.extras.sourceLinks,'MJ72_DOC_CURRENT_PHOTO','url',DOC)||
     kv?.name!=='C80R2_V29_KIV_WALLFIT_2F_OWNER2026_KIV005_POINT_COW_GROUP_WORK_TEST_HOST_HOLD'||
     kv?.extras?.notCurrent!==true||kv?.extras?.notAsBuilt!==true||
     kv?.extras?.humanReview!=='NOT_RUN'||
     JSON.stringify(kv.children)!=='[8908,8909,8910,8911,12107]'||
     !hasSourceLink(kv.extras.sourceLinks,'OWNER2026_APPROX_VISUAL_MARK','link',KIV)||
     !tip?.name?.endsWith('__OWNER2026_POINT_X2897_Y10590_Z5045')||
     tip?.extras?.realWallHostVerified!==false)return false;
  const names=['HOUSING','LEFT_CLOSED_FLAP','RIGHT_CLOSED_FLAP','LEFT_TOP_HINGE','RIGHT_TOP_HINGE','LEFT_LOWER_TAB','RIGHT_LOWER_TAB'];
  for(let i=0;i<7;i++){
    const p=nodes[12099+i],ex=p?.extras;
    if(p?.name!=='MJ72_OWNER2026_STORAGE_SOCKET_'+names[i]+'_WORK_TEST_HOST_HOLD'||
       p?.mesh!==4549+i||
       ex?.sourceMJ72GLBSHA256!=='43794ae5e2ded351cc0bff77cd352e8f010acb4d37e0416049f8c2c6ad6e69c8'||
       ex?.currentGLBSourceLinksBindingVerified!==false||
       ex?.physicalMountingHeightVerified!==false||
       ex?.electricalCircuitVerified!==false||
       !hasSourceLink(ex?.sourceLinks,'OWNER_PHOTO_VISIBLE_2026','url',PHOTO))return false;
  }
  return true;
}
// A positive match identifies an opt-in source scene only. It must never be
// treated as CURRENT/as-built or proof of sourceLinks/WebGL/owner approval.
export function isM6263Mj72Kiv005Pk1SuccessorSourceScene(json,loadedSha,sceneIndex,floor=null,glazing=null,cutaway=null){
  const e=SUCCESSOR_R1_SCENES[sceneIndex],s=json?.scenes?.[sceneIndex];
  const a=json?.asset?.extras,x=s?.extras,y=x?.successorIntegration,r=s?.nodes;
  if(loadedSha!==SUCCESSOR_R1_SHA256||!e||
     (floor!==null&&floor!==e.floor)||(glazing!==null&&glazing!==e.glazing)||
     (cutaway!==null&&cutaway!==e.cutaway)||
     json?.scene!==SUCCESSOR_R1_DEFAULT_SCENE||
     json?.scenes?.length!==SUCCESSOR_R1_SCENE_COUNT||
     json?.meshes?.length!==SUCCESSOR_R1_MESH_COUNT||
     a?.Canonical!==false||a?.ModelStage!=='WORK_TEST'||
     a?.current!==false||a?.asBuilt!==false||a?.HUMAN_REVIEW!=='NOT_RUN'||
     a?.viewerFloorScenes?.['1F']!==350||a?.viewerFloorScenes?.['2F']!==351||
     a?.viewerFloorScenes?.BOTH!==352||
     s?.name!==e.name||!Array.isArray(r)||r.length!==e.count||
     new Set(r).size!==r.length||
     r.some(n=>!Number.isInteger(n)||n<0||n>=SUCCESSOR_R1_NODE_COUNT)||
     successorR1RootFnv32(r)!==e.fnv||
     x?.stage!=='WORK_TEST_HOST_HOLD'||x?.current!==false||x?.asBuilt!==false||
     x?.physicalConnectionsVerified!==0||x?.productionWebGL!=='NOT_RUN'||
     x?.humanReview!=='NOT_RUN'||
     y?.stage!=='WORK_TEST_HOST_HOLD'||y?.defaultSceneUnchanged!==true||
     y?.sourceSceneInternal!==e.parent||y?.sourceLinksBindingVerified!==false||
     y?.productionWebGLVerified!==false||y?.humanReview!=='NOT_RUN'||
     y?.current!==false||y?.asBuilt!==false||
     y?.cutawayIsNonPhysical!==e.cutaway||
     !Object.entries(SUCCESSOR_R1_DONORS).every(([k,v])=>y?.sourceGlbSha256?.[k]===v)||
     JSON.stringify(y?.donorReplacementRoots)!==JSON.stringify(e.replacements)||
     !validImportedNodes(json?.nodes))return false;
  for(const pair of Object.values(e.replacements)){
    if(r.includes(pair[0])||!r.includes(pair[1]))return false;
  }
  if(r.includes(12098)!==Boolean(e.replacements.MJ72)||
     r.includes(12106)!==Boolean(e.replacements.KIV005)||
     r.includes(12097)!==Boolean(e.replacements.PK1_CUTAWAY)||
     r.includes(11542)||r.includes(8913)||
     (e.cutaway&&r.includes(2220)))return false;
  return true;
}
