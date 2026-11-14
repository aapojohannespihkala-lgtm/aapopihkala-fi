// Read-only SHA-locked source receipt for SUCC453 owner LED cofit.
// This module neither registers a model in the viewer nor authorizes publication,
// sourceLinks, actual built conditions, production WebGL, or HUMAN_REVIEW.
// Caller MUST compute authenticatedGlbSha256 from complete GLB bytes.
export const C80_SUCC453_GLB_SHA256 = '5a3d857bc08fb18cb1a992727a2409923291e5a5577d9f2e34253d3765973351';
export const C80_SUCC453_GLB_BYTES = 54654832;
export const C80_SUCC453_ZIP_SHA256 = 'b57636b226862b6d42430e6fa6447a7b0c1d295efab4c20e690460449c79fab4';
export const C80_SUCC453_ZIP_DRIVE_ID = '1vV6JL4IGCVdYQsG9aLbYj_gvo02r58Rs';
export const C80_SUCC453_PARENT_GLB_SHA256 = '1aa5afa39606abe6465d2f9dbb482a5834d768b55403c687831738befad44505';
export const C80_SUCC453_LED_DONOR_GLB_SHA256 = '4937729bc7d8a9993c585ce28f3d51b44dcf57f9ec13e3b92d6c98b932830352';
export const C80_SUCC453_SOURCE_ONLY = true;
export const C80_SUCC453_SOURCE_LINKS_BOUND = false;
export const C80_SUCC453_PRODUCTION_WEBGL_VERIFIED = false;
export const C80_SUCC453_HUMAN_REVIEW = 'NOT_RUN';
export const C80_SUCC453_PUBLISH_ALLOWED = false;
// Known source metadata mismatch: WC root n12171 extras.new2FWCNodes
// contains [12168,12169], but actual children are [12169,12170].
// n12168 belongs to kitchen LED B. The wrong extras pair MUST NOT be
// used as a sourceLinks or node-index binding. Geometry has the correct children.
export const C80_SUCC453_WC_INDEX_METADATA_HOLD = Object.freeze({
  claimed:[12168,12169], actual:[12169,12170], node:12171
});
export const C80_SUCC453_SCENES = Object.freeze({
  "446": {
    "name": "C80_SUCC453_OWNER_LED2F_SUCC446_V85_WHITE_CO_FIT_FROM_SCENE438_WORK_TEST_HOST_HOLD",
    "floor": "2F",
    "parentScene": 438,
    "rootCount": 185,
    "rootFnv": "6633cd82"
  },
  "447": {
    "name": "C80_SUCC453_OWNER_LED2F_SUCC446_V85_WHITE_CO_FIT_FROM_SCENE439_WORK_TEST_HOST_HOLD",
    "floor": "BOTH",
    "parentScene": 439,
    "rootCount": 467,
    "rootFnv": "56d9d08f"
  },
  "448": {
    "name": "C80_SUCC453_OWNER_LED2F_SUCC446_V85_WHITE_CO_FIT_FROM_SCENE440_WORK_TEST_HOST_HOLD",
    "floor": "2F",
    "parentScene": 440,
    "rootCount": 185,
    "rootFnv": "623cf080"
  },
  "449": {
    "name": "C80_SUCC453_OWNER_LED2F_SUCC446_V85_WHITE_CO_FIT_FROM_SCENE441_WORK_TEST_HOST_HOLD",
    "floor": "BOTH",
    "parentScene": 441,
    "rootCount": 467,
    "rootFnv": "ca131e25"
  },
  "450": {
    "name": "C80_SUCC453_OWNER_LED2F_SUCC446_V85_WHITE_CO_FIT_FROM_SCENE442_WORK_TEST_HOST_HOLD",
    "floor": "2F",
    "parentScene": 442,
    "rootCount": 185,
    "rootFnv": "6f89435a"
  },
  "451": {
    "name": "C80_SUCC453_OWNER_LED2F_SUCC446_V85_WHITE_CO_FIT_FROM_SCENE443_WORK_TEST_HOST_HOLD",
    "floor": "BOTH",
    "parentScene": 443,
    "rootCount": 467,
    "rootFnv": "ba927a35"
  },
  "452": {
    "name": "C80_SUCC453_OWNER_LED2F_SUCC446_V85_WHITE_CO_FIT_FROM_SCENE445_WORK_TEST_HOST_HOLD",
    "floor": "BOTH",
    "parentScene": 445,
    "rootCount": 467,
    "rootFnv": "41250562"
  }
});
export function c80Succ453RootFnv32(ids) {
  if (!Array.isArray(ids)) return null;
  let h=2166136261;
  for (const n of ids) {
    if (!Number.isInteger(n) || n<0) return null;
    h=Math.imul(h^n,16777619)>>>0;
  }
  return h.toString(16).padStart(8,'0');
}
const exact=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function isC80Succ453OwnerLedSourceScene(gltf, authenticatedGlbSha256, index, floor=null) {
  const spec=C80_SUCC453_SCENES[index];
  const s=gltf?.scenes?.[index],nodes=gltf?.nodes,meshes=gltf?.meshes;
  if (authenticatedGlbSha256!==C80_SUCC453_GLB_SHA256 || !spec || !s ||
      (floor!==null && floor!==spec.floor) ||
      gltf?.scene!==292 || gltf?.scenes?.length!==453 || nodes?.length!==12172 ||
      meshes?.length!==4577 ||
      gltf?.asset?.extras?.ModelStage!=='WORK_TEST' || gltf?.asset?.extras?.current!==false ||
      gltf?.asset?.extras?.asBuilt!==false || gltf?.asset?.extras?.HUMAN_REVIEW!=='NOT_RUN' ||
      s.name!==spec.name || !Array.isArray(s.nodes) || s.nodes.length!==spec.rootCount ||
      new Set(s.nodes).size!==spec.rootCount ||
      s.nodes.some(i=>!Number.isInteger(i)||i<0||i>=nodes.length) ||
      c80Succ453RootFnv32(s.nodes)!==spec.rootFnv ||
      s.extras?.floor!==spec.floor || s.extras?.stage!=='WORK_TEST_HOST_HOLD' ||
      s.extras?.sourceLinks!=='NOT_BOUND' || s.extras?.sourceLinksBindingVerified!==false ||
      s.extras?.wcLEDRelocatedCount!==1 || s.extras?.wcLEDNewCount!==0 ||
      s.extras?.publishState!=='HOST_HOLD' || s.extras?.humanReview!=='NOT_RUN' ||
      s.extras?.v85WhitePlinthSUCC437Cofit?.stage!=='WORK_TEST_HOST_HOLD' ||
      !s.name.includes('_FROM_SCENE'+spec.parentScene+'_') ||
      ![12164,12165,12166,12167,12168,12171].every(i=>s.nodes.includes(i)) ||
      [11845,11856,11857,12169,12170].some(i=>s.nodes.includes(i))) return false;
  const root=nodes[12171];
  const wcChildren=root?.children;
  if (root?.name!=='OWNER20261114_2F_LED24_P06_RELOCATED_ROOT_WORK_TEST_HOST_HOLD' ||
      !Array.isArray(wcChildren) || !exact(wcChildren.slice(-2),[12169,12170]) ||
      wcChildren.includes(11856)||wcChildren.includes(11857)||
      !exact(root?.extras?.new2FWCNodes,C80_SUCC453_WC_INDEX_METADATA_HOLD.claimed) ||
      root?.extras?.noDuplicateWC!==true ||
      root?.extras?.cofitDonorOriginalGLBSha256!==C80_SUCC453_LED_DONOR_GLB_SHA256 ||
      root?.extras?.cofitReceiverOriginalGLBSha256!==C80_SUCC453_PARENT_GLB_SHA256 ||
      nodes[12164]?.mesh!==4576 || nodes[12169]?.mesh!==4497 ||
      nodes[12170]?.mesh!==4498 || nodes[12168]?.mesh!==2406 ||
      meshes[4576]?.primitives?.[0]?.material!==534 ||
      !nodes[12169]?.name?.includes('WC_RELOCATED_TRIM') ||
      !nodes[12170]?.name?.includes('WC_RELOCATED_CENTER')) return false;
  return true; // Source identity only; no publication or sourceLinks binding.
}
export function resolveC80Succ453OwnerLedSourceSceneIndex(authenticatedSha256, parentScene, floor) {
  if(authenticatedSha256!==C80_SUCC453_GLB_SHA256||!Number.isInteger(parentScene)||
     !['2F','BOTH'].includes(floor))return null;
  const matches=Object.entries(C80_SUCC453_SCENES).filter(([,s])=>
    s.parentScene===parentScene && s.floor===floor);
  return matches.length===1?Number(matches[0][0]):null;
}
export function c80Succ453SourceReceipt(gltf,sha,index) {
  const exactSource=isC80Succ453OwnerLedSourceScene(gltf,sha,index);
  return Object.freeze({exactSource,publishAllowed:false,sourceLinksBound:false,
    productionWebGLVerified:false,humanReview:'NOT_RUN',
    metadataHolds:exactSource?['WC_ROOT_EXTRA_INDEX_PAIR_MISMATCH_12171']:[]});
}
