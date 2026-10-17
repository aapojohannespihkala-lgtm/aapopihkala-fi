/**
 * Source-bound IKEA ODENSVIK 001.939.37 D1F WORK_TEST one-link scene selector.
 * Only the all-40-pointer successor is accepted. No CURRENT / as-built / human QA.
 */
export const D1F_ODENSVIK_CANDIDATE_ID = 'd1f-odensvik-00193937-basin-correction-20261017';
export const D1F_ODENSVIK_REVIEW_ID = D1F_ODENSVIK_CANDIDATE_ID + '-review';
export const D1F_ODENSVIK_SOURCE = Object.freeze({
  bytes: 8876156,
  // Local 40/40 survivor; production source binding must be reconciled before this can load.
  sha256: '362f5dce1041e8f529ed8f69a10d06dad58b59d8bfad0fe9db31c62d870f2e25',
  sceneCount: 112,
  originalSceneCount: 108,
  wcParentSha256: '43d2a17e3f551afb552adbc87d05618e1d22aacd5cbbdd0ffa15625e588264ab',
});
export const D1F_ODENSVIK_VARIANTS = Object.freeze([
  Object.freeze({ variant: 'WEST_ANCHOR_725_895_740', sceneIndex: 108, rootNode: 2428 }),
  Object.freeze({ variant: 'WEST_ANCHOR_740_895_725', sceneIndex: 109, rootNode: 2484 }),
  Object.freeze({ variant: 'EAST_ANCHOR_725_895_740', sceneIndex: 110, rootNode: 2540 }),
  Object.freeze({ variant: 'EAST_ANCHOR_740_895_725', sceneIndex: 111, rootNode: 2596 }),
]);
const fail = () => { throw new Error('D1F_ODENSVIK_SOURCE_SCENE_REJECTED'); };
const isId = value => Number.isInteger(value) && value >= 0;
export const isD1FOdensvikReviewRequested = search =>
  new URLSearchParams(search).get('review') === D1F_ODENSVIK_REVIEW_ID;

const descendants = (nodes, root) => {
  const reached = new Set();
  const pending = [root];
  while (pending.length) {
    const id = pending.pop();
    if (!isId(id) || id >= nodes.length || reached.has(id)) fail();
    reached.add(id);
    const children = nodes[id]?.children ?? [];
    if (!Array.isArray(children)) fail();
    pending.push(...children);
  }
  return reached;
};

/** Pure raw glTF JSON structural gate. Does not, by itself, authenticate file bytes. */
export function selectD1FOdensvikScene(source, variant = D1F_ODENSVIK_VARIANTS[0].variant) {
  const row = D1F_ODENSVIK_VARIANTS.find(r => r.variant === variant);
  if (!row || source?.scenes?.length !== D1F_ODENSVIK_SOURCE.sceneCount ||
      !Array.isArray(source.nodes) || source.nodes.length !== 2652 ||
      source.asset?.version !== '2.0') fail();
  // Test all four source roots, not just the user-selected variant.
  for (const item of D1F_ODENSVIK_VARIANTS) {
    const scene = source.scenes[item.sceneIndex];
    const node = source.nodes[item.rootNode];
    const root = node?.extras;
    if (JSON.stringify(scene?.nodes) !== JSON.stringify([item.rootNode]) ||
        !scene?.name?.includes('ODENSVIK 00193937') ||
        !scene.name.includes(item.variant) ||
        !node?.name?.includes(item.variant) ||
        !node.name.includes('ODENSVIK00193937_WORK_TEST') ||
        scene?.extras?.WORK_TEST_ONLY !== true ||
        scene.extras.current !== false ||
        scene.extras.Canonical !== false ||
        scene.extras.asBuilt !== false ||
        scene.extras.publishToCURRENT !== false ||
        scene.extras.HUMAN_REVIEW !== 'NOT_RUN' ||
        scene.extras.productNumber !== '001.939.37' ||
        scene.extras.parentApprovedWCModelSha256 !== D1F_ODENSVIK_SOURCE.wcParentSha256 ||
        root?.WORK_TEST_ONLY !== true ||
        root?.current !== false || root?.Canonical !== false ||
        root?.asBuilt !== false || root?.publishToCURRENT !== false ||
        root?.HUMAN_REVIEW !== 'NOT_RUN') fail();
    const links = [
      root.counterNode, root.cabinetNode,
      ...Object.values(root.surfaceNodes ?? {}),
      ...Object.values(root.themoNodes ?? {}),
    ];
    if (Object.keys(root.surfaceNodes ?? {}).length !== 5 ||
        Object.keys(root.themoNodes ?? {}).length !== 3 ||
        links.length !== 10 || new Set(links).size !== 10) fail();
    const reachable = descendants(source.nodes, item.rootNode);
    if (!links.every(id => isId(id) && reachable.has(id))) fail();
  }
  return Object.freeze({
    variant: row.variant, sceneIndex: row.sceneIndex, rootNode: row.rootNode,
    current: false, canonical: false, asBuilt: false, humanReview: 'NOT_RUN',
    individualProductionPixelsVerified: false, sourceSemanticTargetsVerified: 40,
  });
}

/** Verified 8.8MB GLB identity before any GLTFLoader parsing or visual review. */
export async function verifyD1FOdensvikRawGlb(sourceBytes, variant) {
  const bytes = sourceBytes instanceof ArrayBuffer
    ? new Uint8Array(sourceBytes)
    : sourceBytes instanceof Uint8Array ? sourceBytes : null;
  if (!bytes || bytes.byteLength !== D1F_ODENSVIK_SOURCE.bytes ||
      typeof globalThis.crypto?.subtle?.digest !== 'function') fail();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2 ||
      view.getUint32(8, true) !== bytes.byteLength ||
      view.getUint32(16, true) !== 0x4e4f534a) fail();
  const jsonLen = view.getUint32(12, true);
  const binAt = 20 + jsonLen;
  if (jsonLen < 4 || jsonLen % 4 !== 0 || binAt + 8 > bytes.byteLength ||
      view.getUint32(binAt + 4, true) !== 0x004e4942 ||
      binAt + 8 + view.getUint32(binAt, true) !== bytes.byteLength) fail();
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  const sha = Array.from(new Uint8Array(digest), v => v.toString(16).padStart(2, '0')).join('');
  if (sha !== D1F_ODENSVIK_SOURCE.sha256) fail();
  let source;
  try { source = JSON.parse(new TextDecoder().decode(bytes.subarray(20, binAt))); }
  catch { fail(); }
  return selectD1FOdensvikScene(source, variant);
}

/**
 * Single same-origin, credentialed, no-redirect fetch. Fails closed if future
 * WORK_TEST publisher still points at the older four-pointer or original GLB.
 */
export async function loadD1FOdensvikReview({
  candidate, search, loader, fetcher = globalThis.fetch,
  origin = globalThis.location?.origin ?? 'https://aapopihkala.fi',
}) {
  const query = new URLSearchParams(search);
  const variant = query.get('wallVariant') ?? D1F_ODENSVIK_VARIANTS[0].variant;
  const path = '/private-model/work-test/' + D1F_ODENSVIK_CANDIDATE_ID + '.glb';
  if (!candidate || candidate.id !== D1F_ODENSVIK_CANDIDATE_ID ||
      candidate.path !== path || query.get('review') !== D1F_ODENSVIK_REVIEW_ID ||
      candidate.expectedSize !== D1F_ODENSVIK_SOURCE.bytes ||
      candidate.expectedSha256 !== D1F_ODENSVIK_SOURCE.sha256 ||
      !D1F_ODENSVIK_VARIANTS.some(r => r.variant === variant) ||
      typeof loader?.parseAsync !== 'function' || typeof fetcher !== 'function') fail();
  const expected = new URL(path, origin);
  if (expected.protocol !== 'https:' || expected.origin !== origin) fail();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  let raw;
  try {
    const response = await fetcher(path, {
      credentials: 'same-origin', mode: 'same-origin', cache: 'no-store',
      redirect: 'error', signal: controller.signal,
      headers: { Accept: 'model/gltf-binary,application/octet-stream;q=0.9' },
    });
    const returned = new URL(response?.url ?? '', origin);
    if (response?.status !== 200 || response.redirected || returned.href !== expected.href) fail();
    raw = await response.arrayBuffer();
  } finally { clearTimeout(timeout); }
  const selected = await verifyD1FOdensvikRawGlb(raw, variant);
  const gltf = await loader.parseAsync(raw, path.replace(/[^/]+$/, ''));
  const scene = gltf.scenes?.[selected.sceneIndex];
  if (gltf.scenes?.length !== D1F_ODENSVIK_SOURCE.sceneCount ||
      scene?.children?.length !== 1 ||
      !scene.children[0]?.name?.includes(variant) ||
      !scene.children[0]?.name?.includes('ODENSVIK00193937_WORK_TEST')) fail();
  gltf.scene = scene;
  return Object.freeze({
    gltf, selected,
    asset: Object.freeze({ bytes: raw.byteLength, sha256: D1F_ODENSVIK_SOURCE.sha256 }),
    humanReview: 'NOT_RUN', individualProductionPixelsVerified: false,
  });
}
