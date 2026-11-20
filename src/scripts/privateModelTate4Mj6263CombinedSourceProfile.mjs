// Fail-closed source profile for the 13 Nov 2026 TATE4 + MJ62 + MJ63R2
// combined WORK_TEST/HOST_HOLD GLB. NOT a production or as-built approval.
// G2b TYÖ EI AUTO: https://drive.google.com/file/d/1N5XOx_Nnd51dK2QQ4iOg1FzIyRJzQboz/view
export const TATE4_MJ6263_SOURCE_SHA256 = '8aaadccfaa880e7693337467a00d9efb53d4d5e332d377be10d1e353e87e25c5';
export const TATE4_MJ6263_SOURCE_BYTES = 53943060;
export const TATE4_MJ6263_PARENT_SHA256 = 'ea4050b463a886ff0cb0c7d544495e6c753d9b87e76459f134c1d439e42a215b';
export const TATE4_MJ6263_MJ62_SHA256 = '4fed8b19d45aae96e6efe7a4dcda173cd4ca8af1da7d11e165d02dccf60f6d8e';
export const TATE4_MJ6263_MJ63_SHA256 = '2e251b08c94f3f4bee8c51eabf66b93b86b03d2b15c90ee2b306fbc15c7db008';
export const TATE4_MJ6263_PARENT_FLOORS = Object.freeze({'1F':350,'2F':351,BOTH:352});
export const TATE4_MJ6263_SCENES = Object.freeze({
  353: Object.freeze({floor:'1F',state:'CLOSED',parent:350,roots:289,fnv:'5441c54f',name:'C80_TATE_MJ62_MJ63_1F_CLOSED_WORK_TEST_HOST_HOLD_20261113__scene353'}),
  354: Object.freeze({floor:'2F',state:'CLOSED',parent:351,roots:184,fnv:'4e28cbb7',name:'C80_TATE_MJ62_MJ63_2F_CLOSED_WORK_TEST_HOST_HOLD_20261113__scene354'}),
  355: Object.freeze({floor:'BOTH',state:'CLOSED',parent:352,roots:464,fnv:'51902f0b',name:'C80_TATE_MJ62_MJ63_BOTH_CLOSED_WORK_TEST_HOST_HOLD_20261113__scene355'}),
  356: Object.freeze({floor:'2F',state:'ONE_OPEN',parent:351,roots:184,fnv:'7929c305',name:'C80_TATE_MJ62_MJ63_2F_ONE_OPEN_WORK_TEST_HOST_HOLD_20261113__scene356'}),
  357: Object.freeze({floor:'BOTH',state:'ONE_OPEN',parent:352,roots:464,fnv:'ef3d35c7',name:'C80_TATE_MJ62_MJ63_BOTH_ONE_OPEN_WORK_TEST_HOST_HOLD_20261113__scene357'}),
  358: Object.freeze({floor:'2F',state:'STACKED',parent:351,roots:184,fnv:'7c88cd5f',name:'C80_TATE_MJ62_MJ63_2F_STACKED_WORK_TEST_HOST_HOLD_20261113__scene358'}),
  359: Object.freeze({floor:'BOTH',state:'STACKED',parent:352,roots:464,fnv:'e3608573',name:'C80_TATE_MJ62_MJ63_BOTH_STACKED_WORK_TEST_HOST_HOLD_20261113__scene359'}),
});
export const TATE4_MJ6263_MJ62_NEW = Object.freeze([12077,12078,12079,12080,12081,12082,12083,12084,12085]);
export const TATE4_MJ6263_MJ63_NEW = Object.freeze([12086,12087,12088,12089,12090,12091,12092,12093,12094,12095,12096]);
export const TATE4_MJ6263_OWNER_MJ62_DOC = 'https://docs.google.com/document/d/1yQrVBIFVXKdB3k1UGreLGr8dOnv-pGwdAO2q4rpSh8Q/edit';
export const TATE4_MJ6263_OWNER_MJ63_DOC = 'https://docs.google.com/document/d/1Ql8rf73ZAdIeA0hQYZzRntMfz3jbqHwpQEjOPNnuh2U/edit';

export function tate4Mj6263RootsFnv32(roots) {
  if (!Array.isArray(roots)) return null;
  let h=2166136261;
  for (const id of roots) {
    if(!Number.isInteger(id)||id<0) return null;
    h=Math.imul(h^id,16777619)>>>0;
  }
  return h.toString(16).padStart(8,'0');
}
function activeNodes(json,roots) {
  if(!Array.isArray(json?.nodes)||!Array.isArray(roots)) return null;
  const seen=new Set(),todo=[...roots];
  while(todo.length) {
    const id=todo.pop();
    if(!Number.isInteger(id)||id<0||id>=json.nodes.length||!json.nodes[id]) return null;
    if(seen.has(id)) continue;
    seen.add(id);
    const children=json.nodes[id].children;
    if(children!==undefined && !Array.isArray(children)) return null;
    if(children) todo.push(...children);
  }
  return seen;
}
function hasLink(links,role,url) {
  return Array.isArray(links) && links.some(x=>x?.role===role&&(x.doc===url||x.link===url));
}

// The caller MUST hash raw inner GLB bytes, not ZIP bytes or file names.
// Scene indices are glTF indices; __sceneN names are separate target names.
export function isTate4Mj6263CombinedSourceScene(json, loadedGlbSha256, sceneIndex, floor=null) {
  const p=TATE4_MJ6263_SCENES[sceneIndex],scene=json?.scenes?.[sceneIndex];
  const a=json?.asset?.extras,i=scene?.extras?.integration;
  if(loadedGlbSha256!==TATE4_MJ6263_SOURCE_SHA256 || !p ||
     (floor!==null&&floor!==p.floor) ||
     json.scene!==292 || json.scenes?.length!==360 ||
     json.nodes?.length!==12097 || json.meshes?.length!==4549 ||
     a?.Canonical!==false || a?.canonical!==false ||
     a?.current!==false || a?.asBuilt!==false || a?.ModelStage!=='WORK_TEST' ||
     !Object.entries(TATE4_MJ6263_PARENT_FLOORS).every(([k,v])=>a?.viewerFloorScenes?.[k]===v) ||
     scene?.name!==p.name || !Array.isArray(scene?.nodes) ||
     scene.nodes.length!==p.roots || new Set(scene.nodes).size!==p.roots ||
     tate4Mj6263RootsFnv32(scene.nodes)!==p.fnv ||
     scene.extras?.stage!=='WORK_TEST_HOST_HOLD' ||
     scene.extras?.current!==false || scene.extras?.asBuilt!==false ||
     scene.extras?.productionWebGL!=='NOT_RUN' || scene.extras?.humanReview!=='NOT_RUN' ||
     scene.extras?.physicalConnectionsVerified!==0 ||
     scene.extras?.sourceParentGLBSHA256!==TATE4_MJ6263_PARENT_SHA256 ||
     i?.task!=='GPT6-TATE4-MJ62-MJ63-INTEGRAATIO-20261113' ||
     i?.floor!==p.floor || i?.parentScene!==p.parent || i?.glazingState!==p.state ||
     i?.sourceGLBSHA256?.tate4!==TATE4_MJ6263_PARENT_SHA256 ||
     i?.sourceGLBSHA256?.mj62!==TATE4_MJ6263_MJ62_SHA256 ||
     i?.sourceGLBSHA256?.mj63!==TATE4_MJ6263_MJ63_SHA256) return false;
  const used=activeNodes(json,scene.nodes);
  if(!used || used.has(11315)) return false; // Old remote-room vent must stay out.
  const expectedMj62=p.state==='ONE_OPEN'?[12077]:p.state==='STACKED'?[12078,12079,12080,12081,12082,12083,12084,12085]:[];
  const mj63=p.floor!=='2F';
  for(const id of TATE4_MJ6263_MJ62_NEW)
    if(used.has(id)!==expectedMj62.includes(id)) return false;
  for(const id of TATE4_MJ6263_MJ63_NEW)
    if(used.has(id)!==mj63) return false;
  for(const id of TATE4_MJ6263_MJ62_NEW) {
    const n=json.nodes[id];
    if(n?.mesh!==1859 ||
       n?.name!==(id===12077?'MJ62_C80_D2F_LEFT_END_OPEN_SOURCE_OWNER_20261111_WORK_TEST_HOST_HOLD':
         `MJ62_C80_D2F_STACK_PANEL_${String(id-12077).padStart(2,'0')}_SOURCE_OWNER_20261111_WORK_TEST_HOST_HOLD`) ||
       n?.extras?.measuredKinematics!==false || n?.extras?.safeCleaningApproved!==false ||
       !hasLink(n?.extras?.sourceLinks,'ownerCurrentMovement',TATE4_MJ6263_OWNER_MJ62_DOC)) return false;
  }
  const vent=json.nodes[12092],duct=json.nodes[12096];
  if(vent?.name!=='MJ63R2_WARDROBE_EXHAUST_VALVE_IN_ROOM_ADJACENT_TO_OUTDOOR_STORAGE' ||
     vent?.children?.join(',')!=='12093,12094,12095' || vent?.extras?.wallHostNode!==7999 ||
     !hasLink(vent?.extras?.sourceLinks,'ownerCorrection',TATE4_MJ6263_OWNER_MJ63_DOC) ||
     duct?.name!=='MJ63R2_INNER_ROOM_THROUGH_STORAGE_TO_OUTSIDE_SINGLE_SEALED_DUCT_WORK_TEST' ||
     duct?.mesh!==4548 || duct?.extras?.geomAssumed!==true ||
     duct?.extras?.sealed!==true || duct?.extras?.storageAirConnection!==false ||
     duct?.extras?.E220SConnection!==false ||
     !hasLink(duct?.extras?.sourceLinks,'owner2026Correction',TATE4_MJ6263_OWNER_MJ63_DOC)) return false;
  for(let id=12086;id<=12091;id++) {
    const n=json.nodes[id];
    if(n?.mesh!==4542+id-12086 || n?.extras?.physicalAirflowMeasured!==false) return false;
  }
  for(let id=12093;id<=12095;id++) {
    const n=json.nodes[id];
    if(n?.mesh!==460+id-12093 || n?.extras?.physicalXYZ!=='WORK_ASSUMPTION') return false;
  }
  return true;
}
