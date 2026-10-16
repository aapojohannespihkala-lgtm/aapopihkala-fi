/**
 * Narrow WORK_TEST source/variant gate for the 2026-10-16 D1F shower-glass GLB.
 * No viewer installation, promotion, production pixels, or human acceptance is implied.
 */
export const D1F_SHOWER_PHOTO_SOURCE = Object.freeze({
  driveFileId: '1OrL1RVnM7jfAx9aTLn2rEgs0zOuAXdf0',
  bytes: 8914072,
  sha256: '992819363a6e368546e870f9ff2a17ddf0904e760269fc20aec509aa310ba35e',
  sceneCount: 124,
  defaultScene: 120,
  workTestOnly: true,
  humanReview: 'NOT_RUN',
  current: false,
  canonical: false,
  asBuilt: false,
});
export const D1F_SHOWER_PHOTO_VARIANTS = Object.freeze([
  Object.freeze({ name:'WEST_ANCHOR_725_895_740', sceneIndex:120, parentSceneIndex:116, rootNode:2457, parentRootNode:2449, glassNode:2456 }),
  Object.freeze({ name:'WEST_ANCHOR_740_895_725', sceneIndex:121, parentSceneIndex:117, rootNode:2459, parentRootNode:2451, glassNode:2458 }),
  Object.freeze({ name:'EAST_ANCHOR_725_895_740', sceneIndex:122, parentSceneIndex:118, rootNode:2461, parentRootNode:2453, glassNode:2460 }),
  Object.freeze({ name:'EAST_ANCHOR_740_895_725', sceneIndex:123, parentSceneIndex:119, rootNode:2463, parentRootNode:2455, glassNode:2462 }),
]);
const fail = () => { throw new Error('D1F_SHOWER_PHOTO_SOURCE_OR_VARIANT_INVALID'); };
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const isInt = value => Number.isInteger(value) && value >= 0;

/**
 * Structural selection only, NOT raw-byte verification. Caller must perform
 * verifyD1FShowerPhotoRawGlb before trusting this result in a real viewer.
 */
export function selectD1FShowerPhotoScene(gltf, variant = 'WEST_ANCHOR_725_895_740') {
  const row = D1F_SHOWER_PHOTO_VARIANTS.find(r => r.name === variant);
  if (!row || !gltf || gltf.scenes?.length !== 124 || gltf.scene !== 120 ||
      !Array.isArray(gltf.nodes) || !Array.isArray(gltf.meshes) || !Array.isArray(gltf.materials)) fail();
  const metadata = gltf.asset?.extras?.bathroomShowerGlassSuccessor20261016;
  if (!metadata || !same(metadata.newScenes,[120,121,122,123]) ||
      metadata.parentSha256 !== 'd6b69d575193124ee2ca3955e08d68ee7813d60bcf8e5c22fb584cd7499321f7' ||
      metadata.glassHeightWorkAssumptionMm !== 1900 ||
      metadata.current !== false || metadata.canonical !== false ||
      metadata.asBuilt !== false || metadata.publishToCURRENT !== false ||
      metadata.humanReview !== 'NOT_RUN' || metadata.stickers !== 'EXCLUDED') fail();
  const m = gltf.meshes[777], p = m?.primitives, glass = gltf.materials[131], metal = gltf.materials[132];
  if (p?.length !== 3 || m?.name !== 'D1F_ALAJARVI_CURVED_DOUBLE_SHOWER_DOOR_900x900_WORK_TEST' ||
      !same(p.map(v=>v.material),[131,131,132]) || p.some(v=>v.mode!==4 ||
        !isInt(v.indices) || !isInt(v.attributes?.POSITION)) ||
      glass?.alphaMode !== 'BLEND' || glass?.doubleSided !== true ||
      glass?.pbrMetallicRoughness?.baseColorFactor?.[3] >= 1 ||
      metal?.extras?.status !== 'WORK_TEST_APPROX_NOT_MEASURED' ||
      m.extras?.physicalInstallPositionExact !== false ||
      m.extras?.actualHeightMeasured !== false ||
      m.extras?.glassHeightMmWorkAssumption !== 1900) fail();
  // All four variants must be present and exact; no fallback to a historical scene.
  for (const v of D1F_SHOWER_PHOTO_VARIANTS) {
    const scene = gltf.scenes[v.sceneIndex], before = gltf.scenes[v.parentSceneIndex];
    const root = gltf.nodes[v.rootNode], oldRoot = gltf.nodes[v.parentRootNode], glassNode = gltf.nodes[v.glassNode];
    if (!same(scene?.nodes,[v.rootNode]) || !same(before?.nodes,[v.parentRootNode]) ||
        !scene.name?.includes('ALAJARVI 900x900 DOUBLE GLASS WORK_TEST') ||
        !scene.name?.includes(v.name) ||
        !root?.name?.includes(v.name) || !root.name.endsWith('_SHOWER_GLASS_900_WORK_TEST') ||
        !oldRoot?.name?.includes(v.name) || oldRoot.children?.length !== 43 ||
        root.children?.length !== 44 || !same(root.children.slice(0,43),oldRoot.children) ||
        root.children[43] !== v.glassNode ||
        !same([root.matrix,root.translation,root.rotation,root.scale],
              [oldRoot.matrix,oldRoot.translation,oldRoot.rotation,oldRoot.scale]) ||
        glassNode?.mesh !== 777 ||
        glassNode?.name !== 'D1F_ALAJARVI_DOUBLE_CURVED_GLASS_900_WORK_TEST_'+(v.sceneIndex-120) ||
        !same(glassNode.extras?.glassDimensionsMmNominal,[900,900]) ||
        glassNode.extras?.status !== 'WORK_TEST' ||
        glassNode.extras?.noCurrentPromotion !== true ||
        glassNode.extras?.wallAnchorVariant !== (v.name.startsWith('WEST')?'WEST':'EAST')) fail();
  }
  return Object.freeze({
    candidateSourceDriveId:D1F_SHOWER_PHOTO_SOURCE.driveFileId,
    sceneIndex:row.sceneIndex, variant:row.name, rootNode:row.rootNode, glassNode:row.glassNode,
    workTestOnly:true, humanReview:'NOT_RUN', current:false, canonical:false,
    asBuilt:false, authenticatedProductionPixelsVerified:false,
  });
}

/** Full-blob GLB identity, scene serialization and candidate gate. */
export async function verifyD1FShowerPhotoRawGlb(sourceBytes, variant) {
  const bytes = sourceBytes instanceof ArrayBuffer ? new Uint8Array(sourceBytes) :
    sourceBytes instanceof Uint8Array ? sourceBytes : null;
  if (!bytes || bytes.byteLength !== D1F_SHOWER_PHOTO_SOURCE.bytes ||
      typeof globalThis.crypto?.subtle?.digest !== 'function') fail();
  const view = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  if (view.getUint32(0,true)!==0x46546c67 || view.getUint32(4,true)!==2 ||
      view.getUint32(8,true)!==bytes.byteLength) fail();
  const jsonLength=view.getUint32(12,true), jsonType=view.getUint32(16,true);
  const binHeader=20+jsonLength;
  if (jsonType!==0x4e4f534a || jsonLength<4 || jsonLength%4!==0 ||
      binHeader+8>bytes.byteLength ||
      view.getUint32(binHeader+4,true)!==0x004e4942 ||
      binHeader+8+view.getUint32(binHeader,true)!==bytes.byteLength) fail();
  const digest = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',bytes));
  const sha=Array.from(digest,n=>n.toString(16).padStart(2,'0')).join('');
  if (sha!==D1F_SHOWER_PHOTO_SOURCE.sha256) fail();
  let gltf;
  try { gltf=JSON.parse(new TextDecoder().decode(bytes.subarray(20,binHeader))); }
  catch { fail(); }
  return selectD1FShowerPhotoScene(gltf,variant);
}

/** The existing WORK_TEST registry candidate id, not a new data registry. */
export const D1F_SHOWER_PHOTO_CANDIDATE_ID = 'd1f-shower-glass-photo-20261016';
export const D1F_SHOWER_PHOTO_REVIEW_ID = D1F_SHOWER_PHOTO_CANDIDATE_ID + '-review';
export function isD1FShowerPhotoReviewRequested(search) {
  return new URLSearchParams(search).get('review') === D1F_SHOWER_PHOTO_REVIEW_ID;
}

/**
 * Real one-fetch browser entry point. Authenticate exact GLB raw bytes before
 * parsing and selecting a visible WORK_TEST scene; return no scene on failure.
 * Does not add a catalog entry, publish, or prove production-render pixels.
 */
export async function loadD1FShowerPhotoReview({
  candidate, search, loader, fetcher = globalThis.fetch,
  origin = globalThis.location?.origin ?? 'https://aapopihkala.fi',
  timeoutMs = 25_000,
}) {
  const query = new URLSearchParams(search);
  const variant = query.get('wallVariant') ?? D1F_SHOWER_PHOTO_VARIANTS[0].name;
  const expectedPath = '/private-model/work-test/' + D1F_SHOWER_PHOTO_CANDIDATE_ID + '.glb';
  if (!candidate || candidate.id !== D1F_SHOWER_PHOTO_CANDIDATE_ID ||
      candidate.path !== expectedPath || query.get('review') !== D1F_SHOWER_PHOTO_REVIEW_ID ||
      !D1F_SHOWER_PHOTO_VARIANTS.some(row => row.name === variant) ||
      typeof fetcher !== 'function' || typeof loader?.parseAsync !== 'function' ||
      !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 25_000) fail();

  let exact;
  try { exact = new URL(expectedPath, origin); }
  catch { fail(); }
  if (exact.protocol !== 'https:' || exact.origin !== origin) fail();

  const controller = new AbortController();
  let handle;
  let raw;
  try {
    raw = await Promise.race([
      (async () => {
        const response = await fetcher(expectedPath, {
          credentials: 'same-origin', mode: 'same-origin', redirect: 'error',
          cache: 'no-store', signal: controller.signal,
          headers: { Accept: 'model/gltf-binary,application/octet-stream;q=0.9' },
        });
        let returned;
        try { returned = new URL(response?.url ?? '', origin); }
        catch { fail(); }
        if (response?.status !== 200 || response.redirected ||
            returned.href !== exact.href ||
            typeof response.arrayBuffer !== 'function') fail();
        const bytes = await response.arrayBuffer();
        if (!(bytes instanceof ArrayBuffer) || bytes.byteLength !== D1F_SHOWER_PHOTO_SOURCE.bytes) fail();
        return bytes;
      })(),
      new Promise((_, reject) => {
        handle = setTimeout(() => reject(new Error('D1F_SHOWER_PHOTO_FETCH_TIMEOUT')), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(handle);
    controller.abort();
  }

  // Digest + raw JSON scene and GLB BIN chunk are verified before GLTFLoader.
  const selected = await verifyD1FShowerPhotoRawGlb(raw, variant);
  const parsed = await loader.parseAsync(raw, '/private-model/work-test/');
  const scene = parsed?.scenes?.[selected.sceneIndex];
  const sceneRoot = scene?.children?.[0];
  const glassName = 'D1F_ALAJARVI_DOUBLE_CURVED_GLASS_900_WORK_TEST_' + (selected.sceneIndex - 120);
  const glassNodes = (sceneRoot?.children ?? []).filter(o => o.name === glassName);
  if (parsed.scenes.length !== D1F_SHOWER_PHOTO_SOURCE.sceneCount ||
      scene.children?.length !== 1 || glassNodes.length !== 1 ||
      sceneRoot.visible === false || glassNodes[0].visible === false ||
      glassNodes[0].userData?.noCurrentPromotion !== true ||
      glassNodes[0].userData?.status !== 'WORK_TEST') fail();
  let paneCount = 0, metalCount = 0;
  glassNodes[0].traverse(o => {
    if (!o.isMesh) return;
    const materials = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of materials) {
      if (m?.transparent === true && m.opacity > 0 && m.opacity < 1) paneCount++;
      else if (m?.transparent === false && m.opacity === 1) metalCount++;
    }
  });
  if (paneCount !== 2 || metalCount < 1) fail();
  parsed.scene = scene;
  return Object.freeze({
    gltf: parsed, selected, asset: D1F_SHOWER_PHOTO_SOURCE,
    rawGlbByteIdentityVerified: true,
    authenticatedProductionPixelsVerified: false,
    humanReview: 'NOT_RUN',
  });
}
