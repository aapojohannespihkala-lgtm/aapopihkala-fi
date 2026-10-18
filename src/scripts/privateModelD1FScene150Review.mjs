/** Exact D1F scene150 WORK_TEST one-link source binding, not production approval.
 * Immutable G2b ZIP: Drive 1Y_m0H7wTfNilS1d2RLEi9-mci_FyQzZc.
 * Scene150 is the preferred room, scene151 is opt-in illustrative tile styling.
 */
export const D1F_SCENE150_CANDIDATE_ID =
  'd1f-source150-k2-oak-u-glass-two-handles-20261018';
export const D1F_SCENE150_REVIEW_ID = D1F_SCENE150_CANDIDATE_ID + '-review';
export const D1F_SCENE150_SOURCE = Object.freeze({
  bytes: 9628072,
  sha256: '6f0cbbe77d3ab0cbe199477fc78b9e90e98acecf1806b79db67dd6cce22b88cc',
  sceneCount: 152,
  originalScene: 149,
  reviewScene: 150,
  optionalUnmeasuredTileScene: 151,
  legacyGlassNode: 2464,
  roomNode: 2770,
  donorNode: 2771,
  glassWorldNode: 2732,
});
const path = '/private-model/work-test/' + D1F_SCENE150_CANDIDATE_ID + '.glb';
const reject = code => { throw new Error('D1F_SCENE150_REJECTED:' + code); };
const exact = (actual, values) => Array.isArray(actual) && actual.length === values.length &&
  values.every((v, i) => actual[i] === v);
export const isD1FScene150ReviewRequested = search =>
  new URLSearchParams(search).get('review') === D1F_SCENE150_REVIEW_ID;

/** Structural guard based on the exact GLB, before Three.js parses/rendering. */
export function verifyD1FScene150Structure(g) {
  const c = D1F_SCENE150_SOURCE;
  if (g?.asset?.version !== '2.0' || g?.scene !== c.reviewScene ||
      !Array.isArray(g?.scenes) || g.scenes.length !== c.sceneCount ||
      !Array.isArray(g?.nodes) || g.nodes.length !== 2772 ||
      !Array.isArray(g?.meshes) || g.meshes.length !== 1036)
    reject('source-shape');
  const source = g.scenes[c.originalScene], target = g.scenes[c.reviewScene];
  const optional = g.scenes[c.optionalUnmeasuredTileScene];
  if (!String(target?.name).includes('SCENE150_PHOTO_K2_OAK_U_GLASS_TWO_HANDLES') ||
      !exact(target?.nodes, [2770,2615,2640,2653,2707,2771]) ||
      !exact(optional?.nodes, [2770,2615,2640,2653,2707,2725,2771]) ||
      !String(optional?.name).includes('SCENE151_OPTIONAL_TILES') ||
      !exact(source?.nodes, [2731,2615,2640,2653,2707,2725]))
    reject('scene-roots');
  for (const s of [target, optional]) {
    if (s.extras?.CURRENT !== false || s.extras?.canonical !== false ||
        s.extras?.asBuilt !== false || s.extras?.publishToCURRENT !== false ||
        s.extras?.HUMAN_REVIEW !== 'NOT_RUN' || s.extras?.safetyApproved !== false ||
        s.extras?.sourceScene !== (s === target ? 148 : 149))
      reject('approval-or-source');
  }
  if (target.extras?.tileOverlayEnabled !== false ||
      optional.extras?.tileOverlayEnabled !== true ||
      optional.extras?.exactTileSizeOrSplitKnown !== false)
    reject('tile-provenance');
  const room = g.nodes[c.roomNode], donor = g.nodes[c.donorNode];
  const world = g.nodes[c.glassWorldNode];
  if (!String(room?.name).includes('SCENE150_ROOM_K2_PHOTO_RELATION') ||
      !Array.isArray(room?.children) || room.children.length !== 63 ||
      room.children.includes(c.legacyGlassNode) ||
      room.extras?.glassLegacyNode2464OmittedNewSceneOnly !== true ||
      room.extras?.assumedK2OffsetMm !== 35 ||
      room.extras?.assumedOffsetMeasured !== false)
    reject('glass-or-k2-source');
  if (!String(donor?.name).includes('TWO_HANDLE_SOURCE_EXACT_GLASS_REPLACEMENT') ||
      !exact(donor?.children, [c.glassWorldNode]) ||
      donor.extras?.exactUserConfirmedTwoHandles !== true ||
      donor.extras?.handlePositionsMeasured !== false ||
      !Array.isArray(world?.children) || world.children.length !== 37)
    reject('two-handle-donor');
  const names = world.children.map(id => g.nodes[id]?.name ?? '');
  if (names.filter(n => n.startsWith('A_LEFT__')).length !== 17 ||
      names.filter(n => n.startsWith('B_RIGHT__')).length !== 17 ||
      names.filter(n => n.startsWith('GLASS_')).length !== 3)
    reject('two-handle-geometries');
  return Object.freeze({sceneIndex:150, optionalTileSceneIndex:151,
    sourceRoomNode:c.roomNode, donorNode:c.donorNode,
    photoConfirmedTwoHandles:true, k2OffsetMeasured:false, humanReview:'NOT_RUN',
    productionPixelsVerified:false, current:false});
}

function parseExactGlb(raw) {
  const b = new Uint8Array(raw);
  if (b.byteLength !== D1F_SCENE150_SOURCE.bytes ||
      String.fromCharCode(...b.subarray(0, 4)) !== 'glTF')
    reject('source-size-or-magic');
  const v = new DataView(raw);
  if (v.getUint32(4,true) !== 2 || v.getUint32(8,true) !== b.byteLength ||
      v.getUint32(16,true) !== 0x4e4f534a) reject('invalid-glb-header');
  const len = v.getUint32(12,true);
  if (len < 100 || len + 20 >= b.byteLength || len % 4 !== 0)
    reject('glb-json-bounds');
  try { return JSON.parse(new TextDecoder().decode(b.subarray(20,20+len))); }
  catch { reject('invalid-json'); }
}

/** Same-origin SHA-verified WORK_TEST, never a CURRENT or WebGL-pixel PASS. */
export async function loadD1FScene150Review({
  candidate, search, loader, fetcher=fetch,
  origin=globalThis.location?.origin, cryptoApi=globalThis.crypto,
}) {
  if (!isD1FScene150ReviewRequested(search) ||
      candidate?.id !== D1F_SCENE150_CANDIDATE_ID || candidate?.path !== path)
    reject('candidate-review-id');
  if (!origin || !loader?.parseAsync || !cryptoApi?.subtle?.digest)
    reject('unsupported-runtime');
  const canonical = new URL(path,origin);
  if (canonical.origin !== new URL(origin).origin) reject('untrusted-origin');
  const response = await fetcher(path,{
    credentials:'same-origin', mode:'same-origin', redirect:'error', cache:'no-store',
    headers:{Accept:'model/gltf-binary,application/octet-stream;q=0.9'},
  });
  if (response?.status !== 200 || response.redirected ||
      new URL(response?.url ?? '',origin).href !== canonical.href)
    reject('untrusted-response');
  const raw = await response.arrayBuffer();
  if (raw.byteLength !== D1F_SCENE150_SOURCE.bytes) reject('source-size-or-sha');
  const digest = await cryptoApi.subtle.digest('SHA-256',raw);
  const sha256 = Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
  if (sha256 !== D1F_SCENE150_SOURCE.sha256) reject('source-size-or-sha');
  const binding = verifyD1FScene150Structure(parseExactGlb(raw));
  const gltf = await loader.parseAsync(raw,path.slice(0,path.lastIndexOf('/')+1));
  const scene = gltf?.scenes?.[binding.sceneIndex];
  const donor = scene?.children?.find(n=>n.name?.includes('TWO_HANDLE_SOURCE_EXACT_GLASS_REPLACEMENT'));
  if (gltf?.scenes?.length !== D1F_SCENE150_SOURCE.sceneCount ||
      scene?.children?.length !== 6 || !donor ||
      donor.children?.length !== 1 || donor.children[0]?.children?.length !== 37)
    reject('parsed-scene-identity');
  gltf.scene=scene;
  return Object.freeze({gltf,binding,asset:Object.freeze({bytes:raw.byteLength,sha256}),
    humanReview:'NOT_RUN', productionPixelsVerified:false,
    current:false, asBuilt:false});
}
