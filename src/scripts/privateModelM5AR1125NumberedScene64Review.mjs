/** Exact, noncanonical R1125 scene64 one-link source binding.
 * This does not prove browser pixels, physical pipe diameters or HUMAN_REVIEW.
 * Immutable G2b source ZIP Drive 1vzMq8KPnpdlf1oe7ugr98tLuQ9NFW8va.
 */
export const M5A_R1125_NUMBERED_CANDIDATE_ID =
  'm5a-r1125-scene64-seven-numbered-route-labels-20261018';
export const M5A_R1125_NUMBERED_REVIEW_ID = M5A_R1125_NUMBERED_CANDIDATE_ID + '-review';
export const M5A_R1125_NUMBERED_SOURCE = Object.freeze({
  bytes: 3179132,
  sha256: 'f5e504df44a3b8d58d61bcc3c7af45639a4d53fd17e8c07ef39346e969d0536d',
  sceneCount: 65,
  originalScene: 63,
  reviewScene: 64,
  originalRootCount: 19,
  addedRootNode: 1126,
  addedNumberCount: 7,
  originalTargetCount: 13,
});
export const M5A_R1125_NUMBERED_SOURCE_IDS = Object.freeze([
  'G2_DRAIN_LINK_PVK_SOK1_001',
  'G2_DRAIN_LINK_PVK_SOK3_001',
  'G2_DRAIN_LINK_SOK1_SOK2_001',
  'G2_DRAIN_LINK_SOK3_BUILDING_END_001',
  'G2_DRAIN_LINK_SOK2_BUILDING_END_001',
  'G2_DRAIN_LINK_PVK_DISCHARGE_001',
  'G2_DRAIN_LINK_PVK_PARKING_001',
]);
const reject = reason => { throw new Error('M5A_R1125_SCENE64_REJECTED:' + reason); };
const path = '/private-model/work-test/' + M5A_R1125_NUMBERED_CANDIDATE_ID + '.glb';
export const isM5AR1125NumberedScene64Requested = search =>
  new URLSearchParams(search).get('review') === M5A_R1125_NUMBERED_REVIEW_ID;

const exactStrings = (actual, expected) =>
  Array.isArray(actual) && actual.length === expected.length &&
  expected.every((id, i) => actual[i] === id);
const exactArray = (actual, expected) =>
  Array.isArray(actual) && Array.isArray(expected) &&
  actual.length === expected.length && expected.every((value, i) => actual[i] === value);

/** Verify original source scene63 and seven per-G2 route index numerals.
 * Caller must verify exact immutable GLB hash before use in production.
 */
export function verifyM5AR1125Scene64Structure(gltfJson) {
  const g = gltfJson;
  const c = M5A_R1125_NUMBERED_SOURCE;
  if (g?.asset?.version !== '2.0' || !Array.isArray(g.scenes) ||
      g.scenes.length !== c.sceneCount || g.scene !== c.reviewScene ||
      !Array.isArray(g.nodes) || g.nodes.length !== 1222 ||
      !Array.isArray(g.meshes) || g.meshes.length !== 661) reject('source-scene-count');
  const oldScene = g.scenes[c.originalScene];
  const scene = g.scenes[c.reviewScene];
  if (oldScene?.nodes?.length !== c.originalRootCount ||
      scene?.nodes?.length !== c.originalRootCount + 1 ||
      !exactArray(scene.nodes.slice(0,-1), oldScene.nodes) ||
      scene.nodes.at(-1) !== c.addedRootNode ||
      !String(scene.name).includes('SCENE64_SEVEN_SOURCE_INDEX_NUMBERS')) reject('scene64-roots');
  if (scene.extras?.HUMAN_REVIEW !== 'NOT_RUN' ||
      scene.extras?.publishToCURRENT !== false ||
      scene.extras?.Canonical !== false ||
      scene.extras?.asBuiltClaim !== false ||
      scene.extras?.originalSourceTargetsCount !== c.originalTargetCount ||
      scene.extras?.sourceNumberLabelsCount !== c.addedNumberCount ||
      !exactStrings(scene.extras?.sourceG2Ids, M5A_R1125_NUMBERED_SOURCE_IDS))
    reject('promotion-or-source-semantics');
  const donor = g.nodes[c.addedRootNode];
  if (!String(donor?.name).includes('SOURCE_INDEX_NUMBERS_1_7') ||
      !Array.isArray(donor?.children) || donor.children.length !== 95 ||
      donor.extras?.presentationOnly !== true ||
      donor.extras?.HUMAN_REVIEW !== 'NOT_RUN' ||
      !exactStrings(donor.extras?.sourceAnchorG2Ids, M5A_R1125_NUMBERED_SOURCE_IDS))
    reject('donor-source-identity');
  for (let i=0;i<7;i++) {
    const prefix = 'R1125_INDEX_0' + (i+1) + '_' + M5A_R1125_NUMBERED_SOURCE_IDS[i] + '_';
    const corresponding = donor.children.filter(n=>g.nodes[n]?.name?.startsWith(prefix));
    if (corresponding.length < 8 ||
        corresponding.filter(n=>g.nodes[n]?.name === prefix + 'PLATE').length !== 1 ||
        corresponding.filter(n=>g.nodes[n]?.name === prefix + 'ROD').length !== 1)
      reject('source-index-geometry-'+(i+1));
  }
  return Object.freeze({sceneIndex:64,sourceG2Ids:M5A_R1125_NUMBERED_SOURCE_IDS,
    originalTargetCount:13,addedNumerals:7,humanReview:'NOT_RUN',productionPixelsVerified:false});
}

const parseExactGlbJson = raw => {
  const bytes = new Uint8Array(raw);
  if (bytes.byteLength !== M5A_R1125_NUMBERED_SOURCE.bytes ||
      String.fromCharCode(...bytes.subarray(0,4)) !== 'glTF') reject('source-size-or-magic');
  const v = new DataView(raw);
  if (v.getUint32(4,true) !== 2 || v.getUint32(8,true) !== bytes.byteLength ||
      v.getUint32(16,true) !== 0x4e4f534a || v.getUint32(12,true) % 4 !== 0)
    reject('glb-struct');
  const chunkSize = v.getUint32(12,true);
  if (chunkSize < 100 || chunkSize + 20 >= bytes.length) reject('glb-json-bounds');
  let json;
  try { json = JSON.parse(new TextDecoder().decode(bytes.subarray(20,20+chunkSize))); }
  catch { reject('invalid-glb-json'); }
  return json;
};

/** Guard before GLTFLoader parses: same-origin, catalog ID/path, bytes, SHA and structure. */
export async function loadM5AR1125NumberedScene64Review({
  candidate, search, loader, fetcher=fetch, origin=globalThis.location?.origin,
  cryptoApi=globalThis.crypto,
}) {
  if (!isM5AR1125NumberedScene64Requested(search) ||
      candidate?.id !== M5A_R1125_NUMBERED_CANDIDATE_ID || candidate?.path !== path)
    reject('candidate-review-identity');
  const url = new URL(path, origin);
  if (!origin || url.origin !== new URL(origin).origin || !loader?.parseAsync ||
      !cryptoApi?.subtle?.digest) reject('unsupported-verification');
  const response = await fetcher(path, {
    credentials:'same-origin', mode:'same-origin', redirect:'error',cache:'no-store',
    headers:{Accept:'model/gltf-binary,application/octet-stream;q=0.9'},
  });
  if (response?.status !== 200 || response.redirected ||
      new URL(response?.url ?? '',origin).href !== url.href) reject('untrusted-source-response');
  const raw=await response.arrayBuffer();
  if (raw.byteLength !== M5A_R1125_NUMBERED_SOURCE.bytes) reject('source-size-or-sha');
  const digest=await cryptoApi.subtle.digest('SHA-256',raw);
  const hash=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
  if (hash !== M5A_R1125_NUMBERED_SOURCE.sha256) reject('source-size-or-sha');
  const binding=verifyM5AR1125Scene64Structure(parseExactGlbJson(raw));
  const gltf=await loader.parseAsync(raw,path.slice(0,path.lastIndexOf('/')+1));
  const scene=gltf?.scenes?.[binding.sceneIndex];
  const donor=scene?.children?.find(x=>x.name?.includes('SOURCE_INDEX_NUMBERS_1_7'));
  if (gltf?.scenes?.length !== M5A_R1125_NUMBERED_SOURCE.sceneCount ||
      scene?.children?.length !== 20 || !donor || donor.children?.length !== 95)
    reject('rendered-scene-identity');
  gltf.scene=scene;
  return Object.freeze({gltf,binding,asset:Object.freeze({bytes:raw.byteLength,sha256:hash}),
    humanReview:'NOT_RUN',individualProductionPixelsVerified:false});
}
