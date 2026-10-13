/**
 * Fail-closed scene selector for the four D1F combined wall WORK_TEST alternatives.
 * Source/render identity is NOT established by this in-memory structural check.
 * The caller must separately authenticate original raw GLB bytes and prove
 * the wall and three corners with individual production pixel evidence.
 */
export const D1F_COMBINED_WALL_VARIANTS = Object.freeze([
  'WEST_ANCHOR_725_895_740',
  'WEST_ANCHOR_740_895_725',
  'EAST_ANCHOR_725_895_740',
  'EAST_ANCHOR_740_895_725',
]);
export const D1F_COMBINED_SCENE_START = 68;
const CORNERS = Object.freeze([
  'CORNER_NORTH_X2337',
  'CORNER_SOUTH_X2337',
  'CORNER_MIDDLE_X2589',
]);
const THEMOS = Object.freeze([1091, 1096, 1101]);
const fail = (reason) => { throw new Error('D1F_COMBINED_WALL_CONTRACT_REJECTED: ' + reason); };
const isWorkOnly = (u) =>
  u?.WORK_TEST_ONLY === true &&
  u?.current === false &&
  u?.Canonical === false &&
  u?.asBuilt === false &&
  u?.publishToCURRENT === false &&
  u?.HUMAN_REVIEW === 'NOT_RUN' &&
  u?.physicalAbsoluteXYZVerified === false;

const walk = (root) => {
  const seen = new Set();
  const result = [];
  const visit = (object) => {
    if (!object || typeof object !== 'object' || seen.has(object)) fail('scene graph cycle or shared node');
    seen.add(object);
    result.push(object);
    for (const child of object.children ?? []) visit(child);
  };
  visit(root);
  return result;
};

export function selectD1FCombinedWallWorkTestScene(gltf, requestedVariant) {
  const selectedIndex = D1F_COMBINED_WALL_VARIANTS.indexOf(requestedVariant);
  if (selectedIndex < 0) fail('variant must be one of four exact named alternatives');
  const json = gltf?.parser?.json;
  if (!Array.isArray(gltf?.scenes) || gltf.scenes.length !== 72 ||
      !Array.isArray(json?.scenes) || json.scenes.length !== 72 ||
      !Array.isArray(json.nodes) || json.nodes[798]?.mesh !== 406 ||
      !json.scenes[5]?.nodes?.includes(817) ||
      !json.nodes[817]?.children?.includes(798)) {
    fail('original D1F scene5/source carrier is absent or different');
  }
  if (!isWorkOnly(json.extras?.combined2990WallWorkTest)) fail('GLB family metadata not WORK_TEST only');

  const identified = new Set();
  for (let i = 0; i < D1F_COMBINED_WALL_VARIANTS.length; i++) {
    const variant = D1F_COMBINED_WALL_VARIANTS[i];
    const index = D1F_COMBINED_SCENE_START + i;
    const rawScene = json.scenes[index];
    const actualScene = gltf.scenes[index];
    const expectedName = 'D1F COMBINED 2990MM ' + variant + ' WORK_TEST NOT CURRENT';
    if (rawScene?.name !== expectedName ||
        // GLTFLoader sanitizes spaces in runtime names; the raw source name
        // remains authoritative, and unrelated runtime names still fail closed.
        (actualScene?.name !== expectedName &&
          actualScene?.name !== expectedName.replace(/\s/g, '_')) ||
        rawScene.nodes?.length !== 1 ||
        !isWorkOnly(rawScene.extras) ||
        rawScene.extras.sourceSceneIndex !== 5 ||
        rawScene.extras.variant !== variant ||
        rawScene.extras.physicalWidthAnchorResolved !== false ||
        rawScene.extras.saunaDoorHandResolved !== false ||
        actualScene.children?.length !== 1) fail('scene name, root, or source provenance');
    if (identified.has(rawScene.nodes[0])) fail('variant scenes share one source root');
    identified.add(rawScene.nodes[0]);
  }

  const scene = gltf.scenes[D1F_COMBINED_SCENE_START + selectedIndex];
  const root = scene.children[0];
  const expectedRootName =
    'P136B_VIEW_ROOT_D_CURRENT_INTERIOR_CORRECTED_BABYLON_Y_UP_COMBINED_' + requestedVariant;
  if (root.name !== expectedRootName ||
      root.userData?.sourceNodeIndex !== 817 ||
      !isWorkOnly(root.userData) ||
      root.userData.alignmentHypothesis !== 'WORK_MODEL_LOBBY_FACE_ANCHOR_FIXED' ||
      root.userData.physicalFinishedFloorSurfacesNotMaterialized !== true ||
      root.userData.sourceRootQuaternionPreserved !== true) fail('architecture root contract');

  const children = walk(root);
  const walls = children.filter(o => o.userData?.sourceNodeIndex === 798);
  if (walls.length !== 1 || !isWorkOnly(walls[0].userData) ||
      walls[0].userData.displayContextOnly !== false) fail('one actual replacement wall carrier required');
  const wall = walls[0];
  if (wall.visible === false) fail('target wall hidden');

  const corners = CORNERS.map(name => {
    const matches = children.filter(o => o.userData?.independentlyAddressableCorner === name);
    if (matches.length !== 1 || !isWorkOnly(matches[0].userData) ||
        matches[0].name !== name + '_' + requestedVariant ||
        matches[0].visible === false ||
        !wall.children?.includes(matches[0])) fail('corner missing, hidden, duplicated, or not on wall carrier: ' + name);
    return { name, object: matches[0] };
  });
  for (const sourceNodeId of THEMOS) {
    const matches = children.filter(o => o.userData?.sourceNodeIndex === sourceNodeId);
    if (matches.length !== 1 || !isWorkOnly(matches[0].userData) ||
        !root.children?.includes(matches[0])) fail('three original Themo hosts not preserved');
  }
  // Never make visual, publishing or physical-survey claims from metadata alone.
  return Object.freeze({
    scene, variant: requestedVariant, wall, corners,
    workTestOnly: true,
    absolutePhysicalXYVerified: false,
    rawGlbByteIdentityVerified: false,
    productionRenderedRoisVerified: false,
    humanReview: 'NOT_RUN',
  });
}

export const D1F_COMBINED_WALL_ASSETS = Object.freeze({
  'd1f-combined-wall-2990-lobby-fixed-20261013': Object.freeze({
    bytes: 3542276,
    sha256: '87bc69051fbd01deb99b283e5ae124c8abb0bdca1e39593d2b5617b61a4efdda',
  }),
  'd1f-combined-wall-115-100-20261013': Object.freeze({
    bytes: 3544904,
    sha256: '1cb9a785e51a00b8abe9bbd81801c25326f5219740bdc18176649ee39b35b0a2',
  }),
});

export function isD1FCombinedWallReviewRequested(search) {
  const review = new URLSearchParams(search).get('review');
  return Object.keys(D1F_COMBINED_WALL_ASSETS).some(id => review === id + '-review');
}

/**
 * Actual viewer entry point: authenticate bytes before invoking its npm loader.
 * Dependencies can be injected for offline regression; no browser writes occur.
 * @param {{candidate: {id: string, path: string}, search: string,
 *   loader: {parseAsync: (bytes: ArrayBuffer, path: string) => Promise<any>},
 *   fetcher?: typeof fetch, origin?: string, timeoutMs?: number,
 *   digest?: (bytes: ArrayBuffer) => Promise<ArrayBuffer>}} options
 */
export async function loadD1FCombinedWallReview({
  candidate, search, loader, fetcher = globalThis.fetch,
  origin = globalThis.location?.origin ?? 'https://aapopihkala.fi',
  timeoutMs = 25_000,
  digest = bytes => globalThis.crypto.subtle.digest('SHA-256', bytes),
}) {
  const asset = Object.prototype.hasOwnProperty.call(D1F_COMBINED_WALL_ASSETS, candidate?.id)
    ? D1F_COMBINED_WALL_ASSETS[candidate.id] : null;
  const query = new URLSearchParams(search);
  const variant = query.get('wallVariant') ?? D1F_COMBINED_WALL_VARIANTS[0];
  const path = '/private-model/work-test/' + candidate?.id + '.glb';
  if (!asset || query.get('review') !== candidate.id + '-review' ||
      !D1F_COMBINED_WALL_VARIANTS.includes(variant) || candidate.path !== path ||
      typeof fetcher !== 'function' || typeof digest !== 'function' ||
      typeof loader?.parseAsync !== 'function' || !Number.isInteger(timeoutMs) ||
      timeoutMs < 1 || timeoutMs > 25_000) fail('exact review, variant, or fetch configuration');
  const requested = new URL(path, origin);
  if (requested.protocol !== 'https:' || requested.origin !== origin) fail('same-origin HTTPS required');
  const controller = new AbortController();
  let timer;
  let bytes;
  try {
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error('D1F_COMBINED_WALL_FETCH_TIMEOUT'));
        controller.abort();
      }, timeoutMs);
    });
    bytes = await Promise.race([deadline, (async () => {
      const response = await fetcher(path, {
        credentials: 'same-origin', mode: 'same-origin', redirect: 'error',
        cache: 'no-store', signal: controller.signal,
        headers: { Accept: 'model/gltf-binary' },
      });
      const returned = new URL(response?.url ?? '', origin);
      if (response?.status !== 200 || response.redirected ||
          returned.href !== requested.href) fail('exact source response');
      const body = await response.arrayBuffer();
      if (body.byteLength !== asset.bytes) fail('raw GLB byte length');
      const hash = Array.from(new Uint8Array(await digest(body)),
        b => b.toString(16).padStart(2, '0')).join('');
      if (hash !== asset.sha256) fail('raw GLB SHA256');
      return body;
    })()]);
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
  const gltf = await loader.parseAsync(bytes, '/private-model/work-test/');
  const selected = selectD1FCombinedWallWorkTestScene(gltf, variant);
  gltf.scene = selected.scene;
  return { gltf, selected, asset, rawGlbByteIdentityVerified: true };
}

