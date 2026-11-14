// SHA-locked, source-only C80 PA2 416-scene receiver. The caller must hash the full GLB bytes.
// Does not publish, rebind sourceLinks, assert physical pipe continuity, or imply HUMAN_REVIEW.
export const C80_416_GLB_SHA256 = '49022c55d50cfc80f5a20382115e74bc92e7f31049eea485b93424493347eb7e';
export const C80_416_GLB_BYTES = 54430452;
export const C80_416_ZIP_SHA256 = '4a9205371dca1555de7a66c2224ee3ceb9eb32a80d74e4dcf2221f81987bee76';
export const C80_416_ZIP_DRIVE_ID = '11glQvz1YP63pL-bI-lmCRhUkz2MxKDN8';
export const C80_416_PARENT_GLB_SHA256 = '39d8ecbd5195bd52734274bae2e5041b8e6d6fe0a32722bc545cf03ecfd0ed21';
export const C80_416_PA2_PRIOR_GLB_SHA256 = '5926a027b144e2d1e667b511efcc171a54f12a54dbad42933d2ab46bddcd229c';
export const C80_416_VISUAL_DONOR_GLB_SHA256 = '3cbe4ae31939bf29acee339c1b8422842e5a430bc13ce13ac84379575aa8f473';
export const C80_416_SCENE_COUNT = 416;
export const C80_416_NODE_COUNT = 12154;
export const C80_416_MESH_COUNT = 4572;
export const C80_416_DEFAULT_SCENE = 292;
// The source erroneously names scene 412/413 "CLOSED". Semantic glazing comes from
// the verified oldScene 405 (ONE_OPEN) / 407 (STACKED), NOT the scene name.
export const C80_416_SCENES = Object.freeze({
  "410": {
    "name": "PA2_WC_MJ89_SAVO_JAMB_BLUE_WALL_VP1_FOUR_PIPE_ENDS_CLOSED_1F_FROM_401_WORK_TEST",
    "count": 288,
    "rootFnv": "6ae2fe67",
    "floor": "1F",
    "glazing": "CLOSED",
    "cutaway": false,
    "oldScene": 401,
    "cofitScene": 392,
    "pa2Root": 12150,
    "oldRoot": 12141
  },
  "411": {
    "name": "PA2_WC_MJ89_SAVO_JAMB_BLUE_WALL_VP1_FOUR_PIPE_ENDS_CLOSED_BOTH_FROM_403_WORK_TEST",
    "count": 463,
    "rootFnv": "c91b8c5c",
    "floor": "BOTH",
    "glazing": "CLOSED",
    "cutaway": false,
    "oldScene": 403,
    "cofitScene": 394,
    "pa2Root": 12153,
    "oldRoot": 12143
  },
  "412": {
    "name": "PA2_WC_MJ89_SAVO_JAMB_BLUE_WALL_VP1_FOUR_PIPE_ENDS_CLOSED_BOTH_FROM_405_WORK_TEST",
    "count": 463,
    "rootFnv": "e613a5f4",
    "floor": "BOTH",
    "glazing": "ONE_OPEN",
    "cutaway": false,
    "oldScene": 405,
    "cofitScene": 396,
    "pa2Root": 12153,
    "oldRoot": 12143
  },
  "413": {
    "name": "PA2_WC_MJ89_SAVO_JAMB_BLUE_WALL_VP1_FOUR_PIPE_ENDS_CLOSED_BOTH_FROM_407_WORK_TEST",
    "count": 463,
    "rootFnv": "90d7e32e",
    "floor": "BOTH",
    "glazing": "STACKED",
    "cutaway": false,
    "oldScene": 407,
    "cofitScene": 398,
    "pa2Root": 12153,
    "oldRoot": 12143
  },
  "414": {
    "name": "PA2_WC_MJ89_SAVO_JAMB_BLUE_WALL_VP1_FOUR_PIPE_ENDS_CLOSED_1F_FROM_408_WORK_TEST",
    "count": 288,
    "rootFnv": "41fc246a",
    "floor": "1F",
    "glazing": "CLOSED",
    "cutaway": true,
    "oldScene": 408,
    "cofitScene": 399,
    "pa2Root": 12150,
    "oldRoot": 12141
  },
  "415": {
    "name": "PA2_WC_MJ89_SAVO_JAMB_BLUE_WALL_VP1_FOUR_PIPE_ENDS_CLOSED_BOTH_FROM_409_WORK_TEST",
    "count": 463,
    "rootFnv": "de0fd2fd",
    "floor": "BOTH",
    "glazing": "CLOSED",
    "cutaway": true,
    "oldScene": 409,
    "cofitScene": 400,
    "pa2Root": 12153,
    "oldRoot": 12143
  }
});
export function c80416RootFnv32(indices) {
  if (!Array.isArray(indices)) return null;
  let h = 2166136261;
  for (const n of indices) {
    if (!Number.isInteger(n) || n < 0) return null;
    h = Math.imul(h ^ n, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}
export function resolveC80416SceneIndex(sha, floor, glazing = 'CLOSED', cutaway = false) {
  if (sha !== C80_416_GLB_SHA256 ||
      !['1F','BOTH'].includes(floor) ||
      !['CLOSED','ONE_OPEN','STACKED'].includes(glazing) ||
      typeof cutaway !== 'boolean') return null;
  const matches = Object.entries(C80_416_SCENES).filter(([,spec]) =>
    spec.floor === floor && spec.glazing === glazing && spec.cutaway === cutaway);
  return matches.length === 1 ? Number(matches[0][0]) : null;
}
export function isC80416SourceScene(gltf, authenticatedGLBSHA256, sceneIndex,
                                  floor = null, glazing = null, cutaway = null) {
  const spec = C80_416_SCENES[sceneIndex], scene = gltf?.scenes?.[sceneIndex], nodes = gltf?.nodes;
  if (authenticatedGLBSHA256 !== C80_416_GLB_SHA256 || !spec || !scene || !nodes ||
      (floor !== null && floor !== spec.floor) ||
      (glazing !== null && glazing !== spec.glazing) ||
      (cutaway !== null && cutaway !== spec.cutaway) ||
      gltf?.scene !== C80_416_DEFAULT_SCENE ||
      gltf?.scenes?.length !== C80_416_SCENE_COUNT ||
      nodes.length !== C80_416_NODE_COUNT ||
      gltf?.meshes?.length !== C80_416_MESH_COUNT ||
      gltf?.asset?.extras?.ModelStage !== 'WORK_TEST' ||
      gltf?.asset?.extras?.current !== false ||
      gltf?.asset?.extras?.asBuilt !== false ||
      gltf?.asset?.extras?.HUMAN_REVIEW !== 'NOT_RUN' ||
      scene.name !== spec.name || !Array.isArray(scene.nodes) ||
      scene.nodes.length !== spec.count ||
      new Set(scene.nodes).size !== spec.count ||
      scene.nodes.some(n => !Number.isInteger(n) || n < 0 || n >= C80_416_NODE_COUNT) ||
      c80416RootFnv32(scene.nodes) !== spec.rootFnv ||
      scene.extras?.modelStage !== 'WORK_TEST_HOST_HOLD' ||
      scene.extras?.current !== false || scene.extras?.asBuilt !== false ||
      scene.extras?.sourceLinksBindingVerified !== false ||
      scene.extras?.notProductionWebGL !== true ||
      scene.extras?.parentSourceExact?.DriveId !== '1OxPGywJ_fKfw3QLsJKryEexLjIhtsAfr' ||
      scene.extras?.parentSourceExact?.sha256 !== C80_416_PA2_PRIOR_GLB_SHA256 ||
      scene.extras?.visualDonorSourceExact?.sha256 !== C80_416_VISUAL_DONOR_GLB_SHA256)
    return false;
  const joint = scene.extras?.PA2FourPipeEnds20261114, cofit = scene.extras?.ownerWallAndVp1Cofit;
  if (joint?.stage !== spec.floor || joint?.oldScene !== spec.oldScene ||
      joint?.sourceGLBSHA256 !== C80_416_PARENT_GLB_SHA256 ||
      joint?.oldPA2Root !== spec.oldRoot || joint?.newPA2Root !== spec.pa2Root ||
      joint?.geometryStatus !== 'WORK_TEST_ONLY' ||
      joint?.sourceLinksBindingVerified !== false ||
      joint?.productionWebGL !== 'NOT_RUN' ||
      joint?.humanReview !== 'NOT_RUN' || joint?.current !== false || joint?.asBuilt !== false ||
      cofit?.originalScene !== spec.cofitScene ||
      cofit?.physicalHiddenRouteVerified !== false ||
      cofit?.originalSourceLinksBoundForNewSHA !== false ||
      cofit?.productionWebGLVerified !== false ||
      cofit?.humanReview !== 'NOT_RUN')
    return false;
  if (!scene.nodes.includes(spec.pa2Root) || scene.nodes.includes(spec.oldRoot) ||
      scene.nodes.includes(12032) || scene.nodes.includes(12065) ||
      [11829,11908,11912].some(n => scene.nodes.includes(n)))
    return false;
  if (JSON.stringify(nodes[12150]?.children) !== '[12148,12149]' ||
      JSON.stringify(nodes[12153]?.children) !== '[12151,12152]' ||
      !nodes[12148]?.children?.includes(12144) ||
      !nodes[12149]?.children?.includes(12145) ||
      !nodes[12151]?.children?.includes(12146) ||
      !nodes[12152]?.children?.includes(12147))
    return false;
  for (const [i,mesh,stage,old] of [[12144,4570,'1F',12030],[12145,4571,'1F',12040],
                                    [12146,4570,'BOTH',12063],[12147,4571,'BOTH',12073]]) {
    const node = nodes[i];
    if (node?.mesh !== mesh || node?.extras?.stage !== stage ||
        node?.extras?.sourceNode !== old || node?.extras?.sourceLinksBound !== false ||
        node?.extras?.sourceGLBSHA256 !== C80_416_PARENT_GLB_SHA256 ||
        node?.extras?.connectionGeometryAssumed !== true ||
        node?.extras?.CURRENT !== false || node?.extras?.asBuilt !== false) return false;
  }
  return gltf.meshes[4570]?.extras?.sourceTargetS2 === 12029 &&
         gltf.meshes[4570]?.extras?.sourceTargetValveBody === 12006 &&
         gltf.meshes[4571]?.extras?.sourceTargetS2 === 12039 &&
         gltf.meshes[4571]?.extras?.sourceTargetValveBody === 11999 &&
         gltf.meshes[4570]?.extras?.sourceLinksBindingVerified === false &&
         gltf.meshes[4571]?.extras?.sourceLinksBindingVerified === false;
}
