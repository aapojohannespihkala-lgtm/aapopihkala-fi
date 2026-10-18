/**
 * Immutable, source-authenticated 116-scene ODENSVIK corrected-counter
 * WORK_TEST viewer binding. This is NOT the older 112-scene formal review.
 * Source: G2b Drive ZIP 1cuXc2ZWLvECspu8z2Haa7FalK6L14qjL.
 */
export const D1F_ODENSVIK_WINDING_CANDIDATE_ID =
  'd1f-odensvik-00193937-counter-winding-fixed-20261018';
export const D1F_ODENSVIK_WINDING_REVIEW_ID =
  D1F_ODENSVIK_WINDING_CANDIDATE_ID + '-review';
export const D1F_ODENSVIK_WINDING_SOURCE = Object.freeze({
  bytes: 8899324,
  sha256: 'e9cbdd7dbebeab78d57939f8758c5cb467f481d79f6bb1550f5e35f09344a1bb',
  sceneCount: 116,
  defaultScene: 112,
  sourceSceneStart: 108,
  correctedCounterMesh: 768,
  originalCounterMesh: 765,
});
export const D1F_ODENSVIK_WINDING_VARIANTS = Object.freeze([
  Object.freeze({variant:'WEST_ANCHOR_725_895_740',sceneIndex:112,rootNode:2653,counterNode:2652}),
  Object.freeze({variant:'WEST_ANCHOR_740_895_725',sceneIndex:113,rootNode:2655,counterNode:2654}),
  Object.freeze({variant:'EAST_ANCHOR_725_895_740',sceneIndex:114,rootNode:2657,counterNode:2656}),
  Object.freeze({variant:'EAST_ANCHOR_740_895_725',sceneIndex:115,rootNode:2659,counterNode:2658}),
]);
const reject = reason => { throw new Error('ODENSVIK_WINDING_SOURCE_REJECTED:' + reason); };
export const isD1FOdensvikWindingReviewRequested = search =>
  new URLSearchParams(search).get('review') === D1F_ODENSVIK_WINDING_REVIEW_ID;

const cleanId = value => Number.isInteger(value) && value >= 0;
export function selectD1FOdensvikWindingScene(source, variant = D1F_ODENSVIK_WINDING_VARIANTS[0].variant) {
  const selected = D1F_ODENSVIK_WINDING_VARIANTS.find(v => v.variant === variant);
  const scenes = source?.scenes, nodes = source?.nodes, meshes = source?.meshes;
  if (!selected || source?.asset?.version !== '2.0' ||
      source.scene !== 112 || !Array.isArray(scenes) || scenes.length !== 116 ||
      !Array.isArray(nodes) || nodes.length !== 2660 ||
      !Array.isArray(meshes) || meshes.length !== 769) reject('invalid-source-envelope');
  const allTargets = new Set();
  let selectedBowl = -1;
  for (const [i, row] of D1F_ODENSVIK_WINDING_VARIANTS.entries()) {
    const scene = scenes[row.sceneIndex], root = nodes[row.rootNode], meta = root?.extras;
    const flags = scene?.extras;
    if (JSON.stringify(scene?.nodes) !== JSON.stringify([row.rootNode]) ||
        !scene?.name?.includes(row.variant) ||
        !scene.name.includes('COUNTER_WINDING_CORRECTED_WORK_TEST') ||
        !root?.name?.includes(row.variant) ||
        !root.name.endsWith('ODENSVIK00193937_WORK_TEST_WINDING_CORRECTED') ||
        !Array.isArray(root.children) || root.children.length !== 43 ||
        meta?.counterNode !== row.counterNode ||
        meta?.counterFaceWindingCorrected !== true ||
        meta?.counterFaceWindingSourceMesh !== 765 ||
        meta?.counterFaceWindingNewMesh !== 768 ||
        flags?.sourceScenePreserved !== 108 + i ||
        flags?.sourceCounterMesh !== 765 || flags?.correctedCounterMesh !== 768 ||
        flags?.counterFaceWindingCorrected !== true ||
        flags?.productNumber !== '001.939.37' ||
        flags?.WORK_TEST_ONLY !== true || flags?.current !== false ||
        flags?.Canonical !== false || flags?.asBuilt !== false ||
        flags?.publishToCURRENT !== false || flags?.HUMAN_REVIEW !== 'NOT_RUN' ||
        meta?.WORK_TEST_ONLY !== true || meta?.current !== false ||
        meta?.Canonical !== false || meta?.asBuilt !== false ||
        meta?.publishToCURRENT !== false || meta?.HUMAN_REVIEW !== 'NOT_RUN') reject('scene-or-provenance');
    const targets = [
      meta.counterNode, meta.cabinetNode,
      ...Object.values(meta.surfaceNodes ?? {}),
      ...Object.values(meta.themoNodes ?? {}),
    ];
    if (Object.keys(meta.surfaceNodes ?? {}).length !== 5 ||
        Object.keys(meta.themoNodes ?? {}).length !== 3 ||
        targets.length !== 10 || new Set(targets).size !== 10 ||
        !targets.every(id => cleanId(id) && root.children.includes(id) && !allTargets.has(id)))
      reject('40-target-source-binding');
    for (const id of targets) allTargets.add(id);
    const counter = nodes[row.counterNode];
    const bowlMatches = root.children.filter(id =>
      nodes[id]?.name?.startsWith('D1F_SERVICE_BASIN_BOWL_'));
    const bowlNode = bowlMatches[0];
    if (counter?.mesh !== 768 || !counter?.name?.includes('WINDING_FIX104') ||
        !root.children.includes(row.counterNode) ||
        bowlMatches.length !== 1 ||
        ![766,767].includes(nodes[bowlNode]?.mesh) ||
        nodes[meta.cabinetNode]?.mesh !== 624) reject('original-bowl-counter-cabinet');
    if (row.sceneIndex === selected.sceneIndex) selectedBowl = bowlNode;
    // The preserved old scene remains distinct, not silently reassigned.
    const old = scenes[108 + i];
    if (JSON.stringify(old?.nodes) !== JSON.stringify([2428 + 56*i]) ||
        old?.extras?.counterFaceWindingCorrected === true)
      reject('historical-source-scene-overwritten');
  }
  if (allTargets.size !== 40 || selectedBowl < 0) reject('incomplete-semantic-source');
  const root = nodes[selected.rootNode], meta = root.extras;
  return Object.freeze({
    variant:selected.variant, sceneIndex:selected.sceneIndex,
    rootNode:selected.rootNode, counterNode:selected.counterNode,
    bowlNode:selectedBowl, cabinetNode:meta.cabinetNode,
    sourceTargetCount:40, humanReview:'NOT_RUN',
    individualProductionPixelsVerified:false, current:false, canonical:false, asBuilt:false,
  });
}

export async function verifyD1FOdensvikWindingGlb(input, variant) {
  const bytes = input instanceof Uint8Array ? input :
    input instanceof ArrayBuffer ? new Uint8Array(input) : null;
  if (!bytes || bytes.byteLength !== D1F_ODENSVIK_WINDING_SOURCE.bytes ||
      typeof globalThis.crypto?.subtle?.digest !== 'function')
    reject('source-size-or-crypto');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0,true)!==0x46546c67 || view.getUint32(4,true)!==2 ||
      view.getUint32(8,true)!==bytes.byteLength ||
      view.getUint32(16,true)!==0x4e4f534a) reject('invalid-glb-header');
  const jsonLength = view.getUint32(12,true), binAt = 20 + jsonLength;
  if (jsonLength < 4 || jsonLength%4 !== 0 || binAt + 8 > bytes.length ||
      view.getUint32(binAt+4,true)!==0x004e4942 ||
      binAt+8+view.getUint32(binAt,true)!==bytes.length)
    reject('invalid-glb-chunks');
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const sha = [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
  if (sha !== D1F_ODENSVIK_WINDING_SOURCE.sha256) reject('wrong-raw-sha256');
  let source;
  try { source = JSON.parse(new TextDecoder().decode(bytes.subarray(20,binAt))); }
  catch { reject('invalid-gltf-json'); }
  return selectD1FOdensvikWindingScene(source, variant);
}

/** Credentials never leave the same-origin production viewer; no upload or fallback. */
export async function loadD1FOdensvikWindingReview({
  candidate, search, loader, fetcher = globalThis.fetch,
  origin = globalThis.location?.origin ?? 'https://aapopihkala.fi',
}) {
  const query = new URLSearchParams(search);
  const variant = query.get('wallVariant') ?? D1F_ODENSVIK_WINDING_VARIANTS[0].variant;
  const path = '/private-model/work-test/' + D1F_ODENSVIK_WINDING_CANDIDATE_ID + '.glb';
  if (!candidate || candidate.id !== D1F_ODENSVIK_WINDING_CANDIDATE_ID ||
      candidate.path !== path ||
      query.get('review') !== D1F_ODENSVIK_WINDING_REVIEW_ID ||
      candidate.expectedSize !== D1F_ODENSVIK_WINDING_SOURCE.bytes ||
      candidate.expectedSha256 !== D1F_ODENSVIK_WINDING_SOURCE.sha256 ||
      !D1F_ODENSVIK_WINDING_VARIANTS.some(v=>v.variant===variant) ||
      typeof loader?.parseAsync !== 'function' || typeof fetcher !== 'function')
    reject('candidate-review-identity');
  const url = new URL(path, origin);
  if (url.protocol !== 'https:' || url.origin !== origin) reject('untrusted-origin');
  const controller = new AbortController();
  const timeout = setTimeout(()=>controller.abort(),25000);
  let raw;
  try {
    const response = await fetcher(path, {
      credentials:'same-origin', mode:'same-origin', redirect:'error',
      cache:'no-store', signal:controller.signal,
      headers:{Accept:'model/gltf-binary,application/octet-stream;q=0.9'},
    });
    const returned = new URL(response?.url ?? '',origin);
    if (response?.status !== 200 || response.redirected || returned.href !== url.href)
      reject('untrusted-asset-response');
    raw = await response.arrayBuffer();
  } finally { clearTimeout(timeout); }
  const selected = await verifyD1FOdensvikWindingGlb(raw,variant);
  const gltf = await loader.parseAsync(raw,path.replace(/[^/]+$/,''));
  const scene = gltf.scenes?.[selected.sceneIndex];
  const root = scene?.children?.[0];
  if (gltf.scenes?.length !== 116 || scene?.children?.length !== 1 ||
      !root?.name?.endsWith('ODENSVIK00193937_WORK_TEST_WINDING_CORRECTED') ||
      !root?.name?.includes(selected.variant) ||
      root.children.length !== 43) reject('rendered-scene-mismatch');
  gltf.scene = scene;
  return Object.freeze({
    gltf, selected, asset:Object.freeze({
      bytes:raw.byteLength, sha256:D1F_ODENSVIK_WINDING_SOURCE.sha256,
    }), humanReview:'NOT_RUN', individualProductionPixelsVerified:false,
  });
}
