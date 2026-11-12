// Fail-closed, SHA-locked receiver for the TATE4 + MJ72 photo-relative
// covered socket WORK_TEST. This does not publish the ZIP, verify wiring,
// rebind GLB sourceLinks, or authorize CURRENT/as-built use.
// G2b TYÖ EI AUTO: https://drive.google.com/file/d/1fIlDhiB-234Loabrv55fg_xr-4Ojb5jh/view
export const TATE4_MJ72_SOURCE_SHA256 = '75c56ed388a45d2adad7cdef5c93bdb42c5c2b77d924e494bf7449d728f245d3';
export const TATE4_MJ72_PARENT_SHA256 = 'ea4050b463a886ff0cb0c7d544495e6c753d9b87e76459f134c1d439e42a215b';
export const TATE4_MJ72_DONOR_SHA256 = '43794ae5e2ded351cc0bff77cd352e8f010acb4d37e0416049f8c2c6ad6e69c8';
export const TATE4_MJ72_SCENE_COUNT = 356;
export const TATE4_MJ72_NODE_COUNT = 12085;
export const TATE4_MJ72_MESH_COUNT = 4549;
export const TATE4_MJ72_DEFAULT_SCENE = 292;
export const TATE4_MJ72_PARENT_FLOORS = Object.freeze({'1F':350,'2F':351,BOTH:352});
export const TATE4_MJ72_FLOORS = Object.freeze({'1F':353,'2F':354,BOTH:355});
export const TATE4_MJ72_ROOT = 12084;
export const TATE4_MJ72_LEGACY_ROOT = 11542;
export const TATE4_MJ72_CHILDREN = Object.freeze([12077,12078,12079,12080,12081,12082,12083]);
export const TATE4_MJ72_PART_NAMES = Object.freeze([
  'MJ72_OWNER2026_STORAGE_SOCKET_HOUSING_WORK_TEST_HOST_HOLD',
  'MJ72_OWNER2026_STORAGE_SOCKET_LEFT_CLOSED_FLAP_WORK_TEST_HOST_HOLD',
  'MJ72_OWNER2026_STORAGE_SOCKET_RIGHT_CLOSED_FLAP_WORK_TEST_HOST_HOLD',
  'MJ72_OWNER2026_STORAGE_SOCKET_LEFT_TOP_HINGE_WORK_TEST_HOST_HOLD',
  'MJ72_OWNER2026_STORAGE_SOCKET_RIGHT_TOP_HINGE_WORK_TEST_HOST_HOLD',
  'MJ72_OWNER2026_STORAGE_SOCKET_LEFT_LOWER_TAB_WORK_TEST_HOST_HOLD',
  'MJ72_OWNER2026_STORAGE_SOCKET_RIGHT_LOWER_TAB_WORK_TEST_HOST_HOLD',
]);

export const TATE4_MJ72_SCENES = Object.freeze({
  353: Object.freeze({floor:'1F',name:'TATE4_MJ72_D1F_STORAGE_UPPER_TWO_COVERS_1F_WORK_TEST_HOST_HOLD_20261112',count:282,fnv:'d3c43f59',parentScene:350,donorScene:374,socket:true}),
  354: Object.freeze({floor:'2F',name:'TATE4_MJ72_D1F_STORAGE_UPPER_TWO_COVERS_2F_WORK_TEST_HOST_HOLD_20261112',count:184,fnv:'4e28cbb7',parentScene:351,donorScene:375,socket:false}),
  355: Object.freeze({floor:'BOTH',name:'TATE4_MJ72_D1F_STORAGE_UPPER_TWO_COVERS_BOTH_WORK_TEST_HOST_HOLD_20261112',count:457,fnv:'67a33a7b',parentScene:352,donorScene:376,socket:true}),
});
export const TATE4_MJ72_PHOTO_URL = 'https://drive.google.com/file/d/1Tlxfbs5f-vzkMRVVcWEpSqLyC-Kjwrer/view';
export const TATE4_MJ72_OWNER_DOC = 'https://docs.google.com/document/d/18_PBZ5QxJD_4X0vfxuQz5PTaWTNB-tDNWNs2FUu2SHI/edit';
export function tate4Mj72RootsFnv32(roots) {
  if (!Array.isArray(roots)) return null;
  let value=2166136261;
  for (const id of roots) {
    if (!Number.isInteger(id) || id<0) return null;
    value=Math.imul(value^id,16777619)>>>0;
  }
  return value.toString(16).padStart(8,'0');
}
function active(json, roots) {
  const nodes=json?.nodes;
  if (!Array.isArray(nodes) || !Array.isArray(roots)) return null;
  const visited=new Set(), queue=[...roots];
  while(queue.length) {
    const id=queue.pop();
    if(!Number.isInteger(id) || id<0 || id>=nodes.length || !nodes[id]) return null;
    if(visited.has(id)) continue;
    visited.add(id);
    const children=nodes[id].children;
    if(children!==undefined && !Array.isArray(children)) return null;
    if(children) queue.push(...children);
  }
  return visited;
}
function photoLinks(links) {
  return Array.isArray(links) &&
    links.some(link=>link?.role==='OWNER_PHOTO_VISIBLE_2026' && link?.url===TATE4_MJ72_PHOTO_URL) &&
    links.some(link=>link?.role==='MJ72_DOC_CURRENT_PHOTO' && link?.url===TATE4_MJ72_OWNER_DOC);
}
// The actual downloaded inner GLB bytes must have been SHA256 checked by
// the caller. GLB suffixes, ZIP hash, similar names and parent SHA never match.
export function isTate4Mj72SocketSourceScene(json, loadedSha, sceneIndex, floor=null) {
  const expected=TATE4_MJ72_SCENES[sceneIndex];
  const scene=json?.scenes?.[sceneIndex], a=json?.asset?.extras;
  if(loadedSha!==TATE4_MJ72_SOURCE_SHA256 || !expected ||
    (floor!==null && floor!==expected.floor) ||
    json?.scene!==TATE4_MJ72_DEFAULT_SCENE ||
    json?.scenes?.length!==TATE4_MJ72_SCENE_COUNT ||
    json?.nodes?.length!==TATE4_MJ72_NODE_COUNT ||
    json?.meshes?.length!==TATE4_MJ72_MESH_COUNT ||
    a?.current!==false || a?.asBuilt!==false || a?.canonical!==false ||
    a?.ModelStage!=='WORK_TEST' ||
    !Object.entries(TATE4_MJ72_PARENT_FLOORS).every(([name,index])=>a?.viewerFloorScenes?.[name]===index) ||
    scene?.name!==expected.name ||
    !Array.isArray(scene?.nodes) || scene.nodes.length!==expected.count ||
    scene.nodes.length!==new Set(scene.nodes).size ||
    tate4Mj72RootsFnv32(scene.nodes)!==expected.fnv ||
    scene?.extras?.TATE4ParentExactGLBSHA256!==TATE4_MJ72_PARENT_SHA256 ||
    scene?.extras?.MJ72DonorExactGLBSHA256!==TATE4_MJ72_DONOR_SHA256 ||
    scene?.extras?.sourceScene!==expected.parentScene ||
    scene?.extras?.MJ72SourceScene!==expected.donorScene ||
    scene?.extras?.newRoot!==(expected.socket?TATE4_MJ72_ROOT:null) ||
    scene?.extras?.legacySocketInactiveNewOptIn!==expected.socket ||
    scene?.extras?.newSocketPhotoRelativeNotMeasured!==true ||
    scene?.extras?.C70AndDefaultUnchanged!==true ||
    scene?.extras?.modelStage!=='WORK_TEST_HOST_HOLD' ||
    scene?.extras?.current!==false || scene?.extras?.asBuilt!==false ||
    scene?.extras?.productionWebGLVerified!==false ||
    scene?.extras?.humanReviewVerified!==false) return false;
  const used=active(json,scene.nodes),root=json.nodes[TATE4_MJ72_ROOT],parts=json.nodes;
  if(!used || used.has(TATE4_MJ72_LEGACY_ROOT) ||
    used.has(TATE4_MJ72_ROOT)!==expected.socket) return false;
  if(!root || root.name!=='MJ72_OWNER2026_STORAGE_SOCKET_TWO_CLOSED_COVERS_UPPER_DOOR_WALL_COW_ROOT_WORK_TEST_HOST_HOLD' || !Array.isArray(root.children) ||
    root.children.join(',')!==TATE4_MJ72_CHILDREN.join(',') ||
    root.extras?.supersedesRootInOptInScenesOnly!==TATE4_MJ72_LEGACY_ROOT ||
    root.extras?.TATE4ParentExactGLBSHA256!==TATE4_MJ72_PARENT_SHA256 ||
    root.extras?.MJ72donorExactGLBSHA256!==TATE4_MJ72_DONOR_SHA256 ||
    root.extras?.modelStage!=='WORK_TEST_HOST_HOLD' ||
    root.extras?.exact2026XYZMeasured!==false ||
    root.extras?.physicalElectricalConnectionVerified!==false ||
    root.extras?.electricalOutletCountVerified!==false ||
    root.extras?.closedCoverCountVisible!==2 ||
    root.extras?.sourceLinksBindingNewSHA!=='NOT_VERIFIED; source URL provenance only' ||
    !photoLinks(root.extras?.sourceLinks)) return false;
  for(let i=0;i<TATE4_MJ72_CHILDREN.length;i++) {
    const part=parts[TATE4_MJ72_CHILDREN[i]];
    if(!part || part.name!==TATE4_MJ72_PART_NAMES[i] || part.mesh!==4542+i ||
      part.extras?.provenanceDonorNodeIndex!==12057+i ||
      part.extras?.sourceMJ72GLBSHA256!==TATE4_MJ72_DONOR_SHA256 ||
      part.extras?.physicalMountingHeightVerified!==false ||
      part.extras?.electricalCircuitVerified!==false ||
      part.extras?.photoApproximation!==true ||
      part.extras?.currentGLBSourceLinksBindingVerified!==false ||
      !photoLinks(part.extras?.sourceLinks) ||
      used.has(TATE4_MJ72_CHILDREN[i])!==expected.socket) return false;
  }
  return true;
}
