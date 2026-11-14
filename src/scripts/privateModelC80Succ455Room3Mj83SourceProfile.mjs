/**
 * Original 483-scene SUCC455 + ROOM3 + owner-point SAVO MJ83 source-only receipt.
 * Authenticated SHA must be calculated from all actual GLB bytes outside this
 * module, never copied from filename, scene name or unauthenticated metadata.
 * Does NOT register an upload, bind sourceLinks or authorize publication.
 */
export const C80_SUCC455_SAVO483_GLB_SHA256 = '9f24462311166d3c9e75bea5ff0aed8ada21d20094cd92e1b90f2de8895dd487';
export const C80_SUCC455_SAVO483_GLB_BYTES = 54973904;
export const C80_SUCC455_SAVO483_ZIP_SHA256 = '53e6f72e477d0d24f09d262247d39a5574b835911e2a8b4c01a315cc7ffeb72b';
export const C80_SUCC455_SAVO483_ZIP_DRIVE_ID = '1Kz1etD708DcLNBGaKXW4N55gFcDk9O8J';
export const C80_SUCC455_SAVO483_PARENT_GLB_SHA256 = 'dbb310a015a545d4c2b3ca4175265adc1f6bc7be3fb06d840f921491e572162f';
export const C80_SUCC455_SAVO483_PARENT_ZIP_DRIVE_ID = '1_JB1jKLVyrwVwyKHSO368YqDPjU9Xwzl';
export const C80_SUCC455_SAVO483_DONOR_GLB_SHA256 = 'dafe740cd1f0fd4bf483b2fac35edefd617adc20cf4404e23bf451976363bf56';
export const C80_SUCC455_SAVO483_DONOR_ZIP_DRIVE_ID = '1RAVTbylCZwQKB0siLZnr0i_NcGwF5v9K';
export const C80_SUCC455_SAVO483_SOURCE_LINKS_BOUND = false;
export const C80_SUCC455_SAVO483_PUBLISH_ALLOWED = false;
export const C80_SUCC455_SAVO483_PRODUCTION_WEBGL_VERIFIED = false;
export const C80_SUCC455_SAVO483_HUMAN_REVIEW = 'NOT_RUN';

// glTF internal scene index, not the ZIP filename's __scene suffix.
// Immutable 476-scene parent, seven opt-in copies with exactly one changed root.
const rows = [
 [476,469,'2F',185,180,'976dabb5',411],
 [477,470,'BOTH',467,448,'51061107',412],
 [478,471,'2F',185,179,'a3bf10c3',413],
 [479,472,'BOTH',467,447,'3fde1b73',414],
 [480,473,'2F',185,172,'4ee51845',415],
 [481,474,'BOTH',467,440,'9a055605',416],
 [482,475,'BOTH',467,448,'c0818292',418],
];
export const C80_SUCC455_SAVO483_SCENES = Object.freeze(Object.fromEntries(rows.map(
 ([scene,parentScene,floor,rootCount,replaceAt,rootFnv,sourceSceneIndex]) => [
 scene,Object.freeze({scene,parentScene,floor,rootCount,replaceAt,rootFnv,sourceSceneIndex,
 name:'C80_SUCC455_ROOM3_MJ83_SAVO_KEYPAD_COFIT_FROM_SCENE_'+parentScene+'_WORK_TEST_HOST_HOLD'})]
)));
export function c80Succ455Savo483Fnv32(ids) {
 if(!Array.isArray(ids))return null;
 let hash=2166136261;
 for(const id of ids){
   if(!Number.isInteger(id)||id<0)return null;
   hash=Math.imul(hash^id,16777619)>>>0;
 }
 return hash.toString(16).padStart(8,'0');
}
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function descendants(nodes,roots){
 const visited=new Set(),stack=[...roots];
 while(stack.length){
   const i=stack.pop();
   if(!Number.isInteger(i)||i<0||i>=nodes.length)return null;
   if(visited.has(i))continue;
   visited.add(i);
   const kids=nodes[i]?.children;
   if(kids!==undefined && !Array.isArray(kids))return null;
   if(kids)stack.push(...kids);
 }
 return visited;
}
/** Exact identity and presentation guards for the seven authentic new scenes. */
export function isC80Succ455Savo483SourceScene(json,authenticatedSha,sceneIndex,floor) {
 const spec=C80_SUCC455_SAVO483_SCENES[sceneIndex];
 if(authenticatedSha!==C80_SUCC455_SAVO483_GLB_SHA256||!spec||
    (floor!==undefined&&floor!==spec.floor)||
    json?.scene!==292||json?.asset?.extras?.ModelStage!=='WORK_TEST'||
    json.asset.extras.current!==false||json.asset.extras.asBuilt!==false||
    json.asset.extras.HUMAN_REVIEW!=='NOT_RUN'||
    json.scenes?.length!==483||json.nodes?.length!==12225||json.meshes?.length!==4601)return false;
 const source=json.scenes[spec.parentScene], scene=json.scenes[sceneIndex];
 const before=source?.nodes,roots=scene?.nodes,e=scene?.extras;
 if(scene?.name!==spec.name||!Array.isArray(before)||!Array.isArray(roots)||
    before.length!==spec.rootCount||roots.length!==spec.rootCount||
    new Set(roots).size!==roots.length||before[spec.replaceAt]!==12057||
    roots[spec.replaceAt]!==12224||
    !roots.every((n,i)=>i===spec.replaceAt||n===before[i])||
    c80Succ455Savo483Fnv32(roots)!==spec.rootFnv||
    e?.stage!=='WORK_TEST_HOST_HOLD'||e.floor!==spec.floor||
    e.sourceSceneIndex!==spec.sourceSceneIndex||e.sourceScene!==spec.parentScene-9||
    e.newDoorLeaf!==12195||e.newCOWRootNode!==12222||
    e.oldDoorLeafHiddenInThisSceneOnly!==8028||
    e.notVisibleStairTransferGrilles!==true||e.current!==false||
    e.asBuilt!==false||e.sourceLinksBound!==false||
    e.sourceLinksBindingVerified!==false||e.sourceLinks!=='NOT_BOUND'||
    e.productionWebGLVerified!==false||e.humanReviewApproved!==false||
    e.savoMJ83OwnerPointCofit?.stage!=='WORK_TEST_HOST_HOLD')return false;
 const mj=e.savoMJ83OwnerPointCofit;
 if(mj.sourceScene!==spec.parentScene||
    mj.sourceGlbSha256!==C80_SUCC455_SAVO483_PARENT_GLB_SHA256||
    mj.sourceDriveId!==C80_SUCC455_SAVO483_PARENT_ZIP_DRIVE_ID||
    mj.donorMJ83GLBSHA256!==C80_SUCC455_SAVO483_DONOR_GLB_SHA256||
    mj.donorDriveId!==C80_SUCC455_SAVO483_DONOR_ZIP_DRIVE_ID||
    mj.donorNode!==12110||mj.donorRoot!==12111||
    mj.newKeypadNode!==12223||mj.newKeypadRoot!==12224||
    mj.oldKeypadSuppressed!==12057||mj.sharedMesh!==4540||
    mj.physicalHostMeasured!==false||mj.sourceLinksBound!==false||
    mj.productionWebGL!=='NOT_RUN'||mj.HUMAN_REVIEW!=='NOT_RUN'||
    mj.current!==false||mj.asBuilt!==false)return false;
 const key=json.nodes[12223],wrapper=json.nodes[12224];
 if(key?.name!=='C80_SUCC455_ROOM3_MJ83_SAVO_OWNER_RIGHT_KEYPAD_WORK_TEST_HOST_HOLD'||
    key.mesh!==4540||key.extras?.sourceMJ83GLBSHA256!==C80_SUCC455_SAVO483_DONOR_GLB_SHA256||
    key.extras?.newNodeIndex!==12223||key.extras?.sourceLinksBoundForNewSHA!==false||
    !Array.isArray(key.matrix)||key.matrix.length!==16||
    Math.abs(key.matrix[12]-7.569)>1e-8||
    wrapper?.name!=='C80_SUCC455_ROOM3_MJ83_SAVO_RIGHT_KEYPAD_ROOT_WORK_TEST_HOST_HOLD'||
    !equal(wrapper.children,[12223])||
    wrapper.extras?.newNodeIndex!==12224||wrapper.extras?.sourceLinksBoundForNewSHA!==false||
    wrapper.extras?.current!==false||wrapper.extras?.asBuilt!==false||
    !equal(json.nodes[12222]?.children,[12221])||
    json.nodes[12195]?.mesh!==4577)return false;
 const reachable=descendants(json.nodes,roots);
 if(!reachable||![12195,12222,12223,12224].every(n=>reachable.has(n))||
    [12057,8028,10156,10157,10158,10159].some(n=>reachable.has(n)))return false;
 return true;
}
export function c80Succ455Savo483Receipt(json,authenticatedSha,sceneIndex,floor) {
 return Object.freeze({exactSource:isC80Succ455Savo483SourceScene(json,authenticatedSha,sceneIndex,floor),
   sourceLinksBound:false,publishAllowed:false,productionWebGLVerified:false,
   humanReview:'NOT_RUN',current:false,asBuilt:false,stage:'WORK_TEST_HOST_HOLD'});
}
