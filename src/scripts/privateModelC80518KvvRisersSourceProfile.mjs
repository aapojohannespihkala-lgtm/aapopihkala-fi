/**
 * C80 518 - 2017 A/B/C water risers, source-exact opt-in receipt only.
 * The caller must compute the full original GLB SHA256 from authenticated bytes.
 * This profile never registers/publishes a model or authorizes sourceLinks.
 */
export const C80_518_GLB_SHA256 = '80391a0b63a5f362bc88da59184c14b426098e5db263ff9eafa5b679bfc7c133';
export const C80_518_GLB_BYTES = 55408432;
export const C80_518_ZIP_DRIVE_ID = '1oV3H7v-RCUQcQolfc3Zt-G71ewDq9nEH';
export const C80_518_ZIP_SHA256 = '486c5846c603de96a670f413b8271a58fa2f6d64799943d9d0e03a00fb17434e';
export const C80_518_PARENT_GLB_SHA256 = '0fb646042b135f59dfade6ab88f09e5fe12a57a1a3f6fb1927d7a51cbee0f461';
export const C80_518_SOURCE_1F_ID = '1GjGoz5FMHElZLQjDzOitCant11ewOHtq';
export const C80_518_SOURCE_2F_ID = '12xVc522i-IAj1vjvs7nRf7M9majjdnD6';

const both = Object.freeze([12243,12245,12247,12244,12246,12248]);
const one = Object.freeze([12243,12245,12247]);
const two = Object.freeze([12244,12246,12248]);

// glTF scene indices, NOT the delivery filename __scene514 suffix.
export const C80_518_SCENES = Object.freeze({
  512: Object.freeze({parent:500, floor:'1F', profile:'1F', roots:293, hash:'f1f8724c', newRoots:one}),
  513: Object.freeze({parent:505, floor:'2F', profile:'2F', roots:189, hash:'cf94092b', newRoots:two}),
  514: Object.freeze({parent:508, floor:'BOTH', profile:'BOTH_A', roots:476, hash:'d478501c', newRoots:both}),
  515: Object.freeze({parent:509, floor:'BOTH', profile:'BOTH_B', roots:476, hash:'c6908a10', newRoots:both}),
  516: Object.freeze({parent:510, floor:'BOTH', profile:'BOTH_C', roots:476, hash:'0ad08a1e', newRoots:both}),
  517: Object.freeze({parent:511, floor:'BOTH', profile:'BOTH_D', roots:476, hash:'d1a7d33f', newRoots:both}),
});

export function c80518Fnv32(values) {
  if (!Array.isArray(values)) return null;
  let hash=2166136261;
  for (const id of values) {
    if (!Number.isInteger(id) || id<0) return null;
    hash=Math.imul(hash^id,16777619)>>>0;
  }
  return hash.toString(16).padStart(8,'0');
}

export function isC80518KvvSourceScene(json, authenticatedGlbSha, sceneIndex, floor) {
  const spec=C80_518_SCENES[sceneIndex];
  if (!spec || floor!==spec.floor || authenticatedGlbSha!==C80_518_GLB_SHA256 ||
      json?.scene!==292 || json.asset?.extras?.ModelStage!=='WORK_TEST' ||
      json.asset.extras.current!==false || json.asset.extras.asBuilt!==false ||
      json.asset.extras.HUMAN_REVIEW!=='NOT_RUN' ||
      json.scenes?.length!==518 || json.nodes?.length!==12249 ||
      json.meshes?.length!==4618) return false;

  const s=json.scenes[sceneIndex], p=json.scenes[spec.parent], e=s?.extras;
  const roots=s?.nodes, parents=p?.nodes, delta=e?.newRoots;
  if (!Array.isArray(roots)||!Array.isArray(parents)||!Array.isArray(delta)||
      roots.length!==spec.roots || roots.length!==parents.length+spec.newRoots.length ||
      !parents.every((id,i)=>id===roots[i]) ||
      !spec.newRoots.every((id,i)=>delta[i]===id && roots[parents.length+i]===id) ||
      delta.length!==spec.newRoots.length || new Set(roots).size!==roots.length ||
      c80518Fnv32(roots)!==spec.hash ||
      s.name!==('C80_518_KV2017_ABC_RISERS_'+spec.profile+'_SOURCE_SCENE_'+spec.parent+'_WORK_TEST_HOST_HOLD') ||
      e.stage!=='WORK_TEST_HOST_HOLD' || e.floor!==spec.floor ||
      e.floorProfile!==spec.profile || e.parentScene!==spec.parent ||
      e.sourceGlbSha256!==C80_518_PARENT_GLB_SHA256 ||
      e.current!==false || e.asBuilt!==false ||
      e.sourceLinksBindingVerified!==false ||
      e.productionWebGLVerified!==false || e.humanReviewApproved!==false ||
      (e.sourceLinksBound!==undefined && e.sourceLinksBound!==false) ||
      (e.sourceLinksBoundForNewSHA!==undefined && e.sourceLinksBoundForNewSHA!==false) ||
      e.A_C_terminal!=='source mesh overlap; not physical installed verification' ||
      e.B_terminal!=='not connected to existing source mesh') return false;

  for (let i=0;i<6;i++) {
    const n=json.nodes[12243+i], x=n?.extras;
    const apt=Math.floor(i/2), floorRole=i%2===0?'1F':'2F';
    const expectedSourceNode=[10155,null,10153][apt];
    if (n?.mesh!==4612+i || !n.name?.startsWith('C80_518_KV2017_') ||
        !n.name.includes(['A_RISER','B_RISER','C_RISER'][apt]) ||
        x?.layer!==floorRole || x.m5System!=='VESI' ||
        x.originFileId1F!==C80_518_SOURCE_1F_ID ||
        x.originFileId2F!==C80_518_SOURCE_2F_ID ||
        x.sourceScene!==508 || x.sourceCommonMainNode!==3696 ||
        x.boundTwoFloorSourceNode!==expectedSourceNode ||
        x.stage!=='WORK_TEST_HOST_HOLD' ||
        x.current!==false || x.asBuilt!==false ||
        x.sourceLinksBoundForNewSha!==false ||
        x.hostDimensionMeasured!==false ||
        x.waterMeter!=='VM-20_PLANNED_SCHEMA_ONLY' ||
        x.branchRouting!=='WORK_ASSUMPTION') return false;
    if (i===3 && x.connectionStatus!=='OPEN_UNPLACED_SOURCE_STUB') return false;
    if ((i===1||i===5) && x.connectionStatus!=='SOURCE_MESH_GEOMETRY_CONTACT_WORKTEST') return false;
  }
  return true;
}

export function c80518KvvReceipt(json, sha, sceneIndex, floor) {
  return Object.freeze({
    exactSource:isC80518KvvSourceScene(json,sha,sceneIndex,floor),
    stage:'WORK_TEST_HOST_HOLD',
    sourceLinksBound:false,
    physicalConnectionsVerified:false,
    productionWebGLVerified:false,
    humanReview:'NOT_RUN',
    current:false,
    asBuilt:false,
    publishAllowed:false,
  });
}
