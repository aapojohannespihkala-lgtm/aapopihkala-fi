// Source-only C80 410 GLB receiver. Authenticated inner GLB SHA is mandatory.
// No sourceLinks binding, viewer integration, publication, CURRENT, production WebGL, or HUMAN_REVIEW.
export const C80_410_GLB_SHA256='39d8ecbd5195bd52734274bae2e5041b8e6d6fe0a32722bc545cf03ecfd0ed21';
export const C80_410_GLB_BYTES=54306784;
export const C80_410_ZIP_SHA256='c617cb2fc9427ec60f351ad52f9cbffb5f3c9aedb347c33536ffaf99301a1314';
export const C80_410_ZIP_DRIVE_ID='1tTb2BWgMthUOQiWD48t8kgKAqGf6iW-U';
export const C80_410_PARENT_GLB_SHA256='33ace4a6a2dc3d15f3893eb42da9e8de954e39aeb7fdfbeee4ed5107e609216d';
export const C80_410_WALL_DONOR_GLB_SHA256='6282983f6cb753e60891f4e19e1cb86285655b8e00248f9e62470507aa5776df';
export const C80_410_VP1_DONOR_GLB_SHA256='bcd50cd5fdb821cab3b1c43ad40a83dbe46d7f1f33e5ba8f9c3b23768122209c';
export const C80_410_SCENE_COUNT=410;
export const C80_410_NODE_COUNT=12144;
export const C80_410_MESH_COUNT=4570;
export const C80_410_DEFAULT_SCENE=292;
export const C80_410_SCENES=Object.freeze({
  "401": {
    "name": "C80_PA2_WC_MJ89_WALL_CONCEALED_VP1_NO_EXPOSED_PIPE_FROM_392_WORK_TEST_HOST_HOLD",
    "floor": "1F",
    "glazing": "CLOSED",
    "cutaway": false,
    "count": 288,
    "rootFnv": "7c9a8408",
    "vp1Root": 12141,
    "parentScene": 392
  },
  "402": {
    "name": "C80_PA2_WC_MJ89_WALL_CONCEALED_VP1_NO_EXPOSED_PIPE_FROM_393_WORK_TEST_HOST_HOLD",
    "floor": "2F",
    "glazing": "CLOSED",
    "cutaway": false,
    "count": 181,
    "rootFnv": "84c3e923",
    "vp1Root": null,
    "parentScene": 393
  },
  "403": {
    "name": "C80_PA2_WC_MJ89_WALL_CONCEALED_VP1_NO_EXPOSED_PIPE_FROM_394_WORK_TEST_HOST_HOLD",
    "floor": "BOTH",
    "glazing": "CLOSED",
    "cutaway": false,
    "count": 463,
    "rootFnv": "3616298e",
    "vp1Root": 12143,
    "parentScene": 394
  },
  "404": {
    "name": "C80_PA2_WC_MJ89_WALL_CONCEALED_VP1_NO_EXPOSED_PIPE_FROM_395_WORK_TEST_HOST_HOLD",
    "floor": "2F",
    "glazing": "ONE_OPEN",
    "cutaway": false,
    "count": 181,
    "rootFnv": "c93d3d47",
    "vp1Root": null,
    "parentScene": 395
  },
  "405": {
    "name": "C80_PA2_WC_MJ89_WALL_CONCEALED_VP1_NO_EXPOSED_PIPE_FROM_396_WORK_TEST_HOST_HOLD",
    "floor": "BOTH",
    "glazing": "ONE_OPEN",
    "cutaway": false,
    "count": 463,
    "rootFnv": "c26176ba",
    "vp1Root": 12143,
    "parentScene": 396
  },
  "406": {
    "name": "C80_PA2_WC_MJ89_WALL_CONCEALED_VP1_NO_EXPOSED_PIPE_FROM_397_WORK_TEST_HOST_HOLD",
    "floor": "2F",
    "glazing": "STACKED",
    "cutaway": false,
    "count": 181,
    "rootFnv": "0a53c2d3",
    "vp1Root": null,
    "parentScene": 397
  },
  "407": {
    "name": "C80_PA2_WC_MJ89_WALL_CONCEALED_VP1_NO_EXPOSED_PIPE_FROM_398_WORK_TEST_HOST_HOLD",
    "floor": "BOTH",
    "glazing": "STACKED",
    "cutaway": false,
    "count": 463,
    "rootFnv": "00b2ef10",
    "vp1Root": 12143,
    "parentScene": 398
  },
  "408": {
    "name": "C80_PA2_WC_MJ89_WALL_CONCEALED_VP1_NO_EXPOSED_PIPE_FROM_399_WORK_TEST_HOST_HOLD",
    "floor": "1F",
    "glazing": "CLOSED",
    "cutaway": true,
    "count": 288,
    "rootFnv": "2723e8dd",
    "vp1Root": 12141,
    "parentScene": 399
  },
  "409": {
    "name": "C80_PA2_WC_MJ89_WALL_CONCEALED_VP1_NO_EXPOSED_PIPE_FROM_400_WORK_TEST_HOST_HOLD",
    "floor": "BOTH",
    "glazing": "CLOSED",
    "cutaway": true,
    "count": 463,
    "rootFnv": "28115747",
    "vp1Root": 12143,
    "parentScene": 400
  }
});
export function c80410RootFnv32(ids){
  if(!Array.isArray(ids))return null;
  let h=2166136261;
  for(const n of ids){if(!Number.isInteger(n)||n<0)return null;h=Math.imul(h^n,16777619)>>>0;}
  return h.toString(16).padStart(8,'0');
}
// The caller must hash the full binary GLB bytes, not a file name or claimed digest.
export function isC80410SourceScene(gltf,authenticatedGlbSHA256,index,floor=null,glazing=null,cutaway=null){
  const spec=C80_410_SCENES[index],scene=gltf?.scenes?.[index];
  if(authenticatedGlbSHA256!==C80_410_GLB_SHA256||!spec||!scene||
    (floor!==null&&floor!==spec.floor)||(glazing!==null&&glazing!==spec.glazing)||
    (cutaway!==null&&cutaway!==spec.cutaway)||
    gltf?.scene!==292||gltf?.scenes?.length!==410||gltf?.nodes?.length!==12144||gltf?.meshes?.length!==4570||
    gltf?.asset?.extras?.ModelStage!=='WORK_TEST'||gltf?.asset?.extras?.current!==false||
    gltf?.asset?.extras?.asBuilt!==false||gltf?.asset?.extras?.HUMAN_REVIEW!=='NOT_RUN'||
    scene.name!==spec.name||!Array.isArray(scene.nodes)||scene.nodes.length!==spec.count||
    new Set(scene.nodes).size!==spec.count||
    scene.nodes.some(n=>!Number.isInteger(n)||n<0||n>=12144)||
    c80410RootFnv32(scene.nodes)!==spec.rootFnv||
    scene.extras?.modelStage!=='WORK_TEST_HOST_HOLD'||scene.extras?.current!==false||
    scene.extras?.asBuilt!==false||scene.extras?.sourceLinksBindingVerified!==false)return false;
  const meta=scene.extras?.ownerWallAndVp1Cofit;
  if(meta?.stage!=='WORK_TEST_HOST_HOLD'||meta?.originalScene!==spec.parentScene||
    JSON.stringify(meta?.wallWireOriginalDirectRootsNotRendered)!=='[11829,11908,11912]'||
    JSON.stringify(meta?.vp1OriginalVisibleNodesCOW)!=='[12032,12065]'||
    meta?.originalSourceGLBSHA256!==C80_410_PARENT_GLB_SHA256||
    meta?.wireDonorGLBSHA256!==C80_410_WALL_DONOR_GLB_SHA256||
    meta?.vp1DonorGLBSHA256!==C80_410_VP1_DONOR_GLB_SHA256||
    meta?.physicalHiddenRouteVerified!==false||meta?.originalSourceLinksBoundForNewSHA!==false||
    meta?.productionWebGLVerified!==false||meta?.humanReview!=='NOT_RUN'||
    meta?.CURRENT!==false||meta?.asBuilt!==false)return false;
  if([11829,11908,11912,12032,12065].some(n=>scene.nodes.includes(n))||
    (spec.vp1Root===null?(scene.nodes.includes(12141)||scene.nodes.includes(12143)):
       !scene.nodes.includes(spec.vp1Root))||
    (spec.floor==='2F'?scene.nodes.includes(9003):!scene.nodes.includes(9003)))return false;
  const n=gltf.nodes;
  return n[12138]?.mesh===4569&&n[12139]?.mesh===4569&&
    n[12138]?.extras?.asBuilt===false&&n[12139]?.extras?.asBuilt===false&&
    n[12138]?.extras?.physicalConnectionsVerified===0&&n[12139]?.extras?.physicalConnectionsVerified===0&&
    JSON.stringify(n[12140]?.children)==='[12025,12026,12027,12028,12029,12117,12031,12138,12033,12034,12035]'&&
    JSON.stringify(n[12141]?.children)==='[12140,12122]'&&
    JSON.stringify(n[12142]?.children)==='[12058,12059,12060,12061,12062,12119,12064,12139,12066,12067,12068]'&&
    JSON.stringify(n[12143]?.children)==='[12142,12125]'&&
    gltf.meshes[4569]?.name==='C80_OWNER_VP1_NO_EXPOSED_FACADE_PIPE_CONCEALED_20261114_COFIT';
}
export function resolveC80410SceneIndex(sha,floor,glazing='CLOSED',cutaway=false){
  if(sha!==C80_410_GLB_SHA256||!['1F','2F','BOTH'].includes(floor)||
      !['CLOSED','ONE_OPEN','STACKED'].includes(glazing)||typeof cutaway!=='boolean')return null;
  const matches=Object.entries(C80_410_SCENES).filter(([,s])=>
    s.floor===floor&&s.glazing===glazing&&s.cutaway===cutaway);
  return matches.length===1?Number(matches[0][0]):null;
}
