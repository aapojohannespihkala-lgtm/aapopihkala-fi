import { D1F_BATHROOM_ID, D1F_BATHROOM_ASSET, selectD1FBathroomScene } from './privateModelD1FBathroomScene.mjs';
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

export function selectD1FCombinedWallWorkTestScene(gltf, requestedVariant, candidateId = 'd1f-combined-wall-2990-lobby-fixed-20261013') {
  if(candidateId === D1F_BATHROOM_ID) return selectD1FBathroomScene(gltf, requestedVariant);
  const selectedIndex = D1F_COMBINED_WALL_VARIANTS.indexOf(requestedVariant);
  if (selectedIndex < 0) fail('variant must be one of four exact named alternatives');
  const asset = candidateId === undefined ? null :
    (Object.prototype.hasOwnProperty.call(D1F_COMBINED_WALL_ASSETS, candidateId)
      ? D1F_COMBINED_WALL_ASSETS[candidateId] : fail('unknown source candidate'));
  const measuredCounter = asset?.measuredCounter === true;
  const corrections = asset?.fourUserCorrections === true;
  const finishedFaces = asset?.finishedFaces2360 === true;
  const sourceRecord = corrections ? 'G2_D1F_FOUR_USER_REVIEW_CORRECTIONS_20261014_2330' : finishedFaces ? 'G2_D1F_KPH_FINISHED_FACE_2360_FOUR_HYPOTHESES_20261014_1600' : 'G2_D1F_KPH_BASIN_SOURCE_FACE_X3P888_WORK_TEST_20261014';
  const sceneStart = corrections ? 84 : finishedFaces ? 80 : measuredCounter ? 76 : D1F_COMBINED_SCENE_START;
  const sceneCount = corrections ? 88 : finishedFaces ? 84 : measuredCounter ? 80 : 72;
  const json = gltf?.parser?.json;
  if (!Array.isArray(gltf?.scenes) || gltf.scenes.length !== sceneCount ||
      !Array.isArray(json?.scenes) || json.scenes.length !== sceneCount ||
      !Array.isArray(json.nodes) || json.nodes[798]?.mesh !== 406 ||
      !json.scenes[5]?.nodes?.includes(817) ||
      !json.nodes[817]?.children?.includes(798)) {
    fail('original D1F scene5/source carrier is absent or different');
  }
  if (!isWorkOnly(json.extras?.combined2990WallWorkTest)) fail('GLB family metadata not WORK_TEST only');
  if (measuredCounter && json.scene !== sceneStart) fail('measured counter default scene');

  const identified = new Set();
  const identifiedCounters = new Set();
  for (let i = 0; i < D1F_COMBINED_WALL_VARIANTS.length; i++) {
    const variant = D1F_COMBINED_WALL_VARIANTS[i];
    const index = sceneStart + i;
    const rawScene = json.scenes[index];
    const actualScene = gltf.scenes[index];
    const expectedName = measuredCounter
      ? 'D1F MEASURED 140 100 2350 B710 ' + variant + ' WORK_TEST NOT CURRENT WITH MEASURED COUNTER' + (finishedFaces ? ' FINISHED FACE 2360 WORK HYPOTHESIS' : '') + (corrections ? ' FOUR USER CORRECTIONS' : '')
      : 'D1F COMBINED 2990MM ' + variant + ' WORK_TEST NOT CURRENT';
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
    if (measuredCounter) {
      const counterId = rawScene.extras.counterNode;
      const rawRoot = json.nodes[rawScene.nodes[0]];
      const rawCounter = json.nodes[counterId];
      if (rawScene.extras.parentCombinedScene !== 68 + i ||
          rawScene.extras.parentMeasuredScene !== 72 + i ||
          rawScene.extras.sourceFieldWidthResidualMm !== 18 ||
          rawScene.extras.residualResolution !== (finishedFaces ? 'WORK_GEOMETRY_ONLY_PHYSICAL_ANCHOR_OPEN' : 'OPEN_NOT_GUESSED') ||
          rawScene.extras.counterSourceRecord !== sourceRecord ||
          !Number.isInteger(counterId) || identifiedCounters.has(counterId) ||
          !rawRoot?.children?.includes(counterId) || rawRoot.extras?.counterNode !== counterId ||
          rawRoot.extras?.parentMeasuredRoot !== json.scenes[72 + i]?.nodes?.[0] ||
          rawCounter?.mesh !== (corrections ? 616 : 611) ||
          !isWorkOnly(rawCounter.extras) ||
          rawCounter.extras.logicalFixtureId !== 'D1F_KPH_BASIN_TOP_WORK_PROXY_01' ||
          rawCounter.extras.absoluteFaceSurveyVerified !== false) fail('measured counter source binding');
      if (finishedFaces) {
        const west = variant.startsWith('WEST_');
        const faces = west ? [3.888, 6.248] : [3.906, 6.266];
        if (rawScene.extras.parentMeasuredCounterScene !== 76 + i ||
            rawRoot.extras?.parentMeasuredCounterRoot !== json.scenes[76 + i]?.nodes?.[0] ||
            rawScene.extras.sourceRecord !== sourceRecord ||
            rawScene.extras.workGeometryWidthResidualMm !== 0 ||
            rawScene.extras.modelClearWidthMm !== 2360 || rawScene.extras.fieldClearWidthMm !== 2360 ||
            JSON.stringify(rawScene.extras.workingFinishedFacesXM) !== JSON.stringify(faces) ||
            rawCounter.extras.workingHostFaceXM !== faces[0] ||
            rawCounter.extras.physicalFinishedFaceVerified !== false ||
            JSON.stringify(rawCounter.translation ?? [0, 0, 0]) !== JSON.stringify(west ? [0, 0, 0] : [0.018, 0, 0])) {
          fail('finished face work hypothesis binding');
        }
      }
      if (corrections && (rawScene.extras.parentFinishedFaceScene !== 80 + i ||
          rawRoot.extras?.parentFinishedFaceRoot !== json.scenes[80 + i]?.nodes?.[0] ||
          rawScene.extras.visualRoomFootprints !== false || rawRoot.extras?.visualRoomFootprints !== false ||
          rawRoot.extras?.backgroundRoomFootprintSourceNodes?.length !== 10 ||
          rawCounter.extras.presentationSlabThicknessMm !== 60 || rawCounter.extras.thicknessMeasured !== false)) {
        fail('four user corrections source lineage');
      }
      identifiedCounters.add(counterId);
    }
  }

  const scene = gltf.scenes[sceneStart + selectedIndex];
  const root = scene.children[0];
  const expectedRootName = measuredCounter
    ? 'D1F_MEASURED_WALL_ROOT_BABYLON_Y_UP_' + requestedVariant + '_WITH_MEASURED_COUNTER' + (finishedFaces ? '_FINISHED_FACE_2360_WORK_HYPOTHESIS' : '') + (corrections ? '__FOUR_USER_CORRECTIONS' : '')
    : 'P136B_VIEW_ROOT_D_CURRENT_INTERIOR_CORRECTED_BABYLON_Y_UP_COMBINED_' + requestedVariant;
  if (root.name !== expectedRootName ||
      root.userData?.sourceNodeIndex !== 817 ||
      !isWorkOnly(root.userData) ||
      root.userData.alignmentHypothesis !== 'WORK_MODEL_LOBBY_FACE_ANCHOR_FIXED' ||
      root.userData.physicalFinishedFloorSurfacesNotMaterialized !== true ||
      root.userData.sourceRootQuaternionPreserved !== true) fail('architecture root contract');

  const children = walk(root);
  if (corrections && children.some(o => o.userData?.representationKind === 'referenceFootprint')) {
    fail('room footprints must remain background data, never reachable review geometry');
  }
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
  let counter = null;
  if (measuredCounter) {
    const counters = children.filter(o => o.userData?.logicalFixtureId === 'D1F_KPH_BASIN_TOP_WORK_PROXY_01');
    if (counters.length !== 1 || !isWorkOnly(counters[0].userData) ||
        !root.children.includes(counters[0]) || counters[0].visible === false ||
        counters[0].name !== 'D1F_KPH_COUNTER_WORK_TEST_' + requestedVariant + (finishedFaces ? '_FINISHED_FACE_2360' : '') + (corrections ? '__FOUR_USER_CORRECTIONS' : '') ||
        counters[0].userData.sourceRecord !== sourceRecord ||
        counters[0].userData.sourceHostFaceXM !== 3.888 ||
        counters[0].userData.finishedFloorWorkZM !== 0.08 ||
        counters[0].userData.absoluteFaceSurveyVerified !== false) fail('one visible source-bound measured counter required');
    if (finishedFaces) {
      const west = requestedVariant.startsWith('WEST_');
      if (counters[0].userData.workingHostFaceXM !== (west ? 3.888 : 3.906) ||
          counters[0].userData.physicalFinishedFaceVerified !== false ||
          Math.abs(counters[0].position?.x - (west ? 0 : 0.018)) > 1e-8 ||
          counters[0].position?.y !== 0 || counters[0].position?.z !== 0 ||
          wall.userData.sourceRecord !== sourceRecord || wall.userData.measuredWidthMm !== 2360 ||
          wall.userData.physicalWidthAnchorResolved !== false || wall.userData.saunaDoorHandResolved !== false) {
        fail('runtime finished face binding');
      }
    }
    counter = counters[0];
  }
  // Never make visual, publishing or physical-survey claims from metadata alone.
  return Object.freeze({
    scene, sceneIndex: sceneStart + selectedIndex, variant: requestedVariant, wall, corners, counter,
    workTestOnly: true,
    absolutePhysicalXYVerified: false,
    rawGlbByteIdentityVerified: false,
    productionRenderedRoisVerified: false,
    humanReview: 'NOT_RUN',
  });
}

export const D1F_COMBINED_WALL_ASSETS = Object.freeze({
  [D1F_BATHROOM_ID]: D1F_BATHROOM_ASSET,
  'd1f-combined-wall-2990-lobby-fixed-20261013': Object.freeze({
    bytes: 3542276,
    sha256: '87bc69051fbd01deb99b283e5ae124c8abb0bdca1e39593d2b5617b61a4efdda',
  }),
  'd1f-combined-wall-115-100-20261013': Object.freeze({
    bytes: 3544904,
    sha256: '1cb9a785e51a00b8abe9bbd81801c25326f5219740bdc18176649ee39b35b0a2',
  }),
  'd1f-measured-wall-140-100-2350-b710-basin-20261014': Object.freeze({
    bytes: 3602032,
    sha256: '7da6b1e6ada391556ca3600346f1586ed2507ac86b4e489cb689e6e6cd11de71',
    measuredCounter: true,
  }),
  'd1f-finished-face-2360-wall-basin-20261014': Object.freeze({
    bytes: 3654796,
    sha256: '826633aba10b590935dc029358b1233957ab37ee7e167a5adfdab713617d8523',
    measuredCounter: true,
    finishedFaces2360: true,
  }),
  'd1f-four-review-corrections-20261014': Object.freeze({
    bytes: 3725836,
    sha256: '9184920f910dca957f70aaba70774e47880c794a14c6156c451f7fa45a917824',
    measuredCounter: true,
    finishedFaces2360: true,
    fourUserCorrections: true,
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
  const selected = selectD1FCombinedWallWorkTestScene(gltf, variant, candidate.id);
  if (asset.finishedFaces2360) {
    // Presentation of the verified review only. Keep the immutable source
    // material and other scene hypotheses unchanged.
    const cloneReviewCounterMaterial = material => {
      if (material?.isMaterial !== true || typeof material.clone !== 'function') {
        fail('finished counter review material');
      }
      const clone = material.clone();
      clone.opacity = 0.8;
      clone.transparent = true;
      clone.depthWrite = false;
      clone.needsUpdate = true;
      return clone;
    };
    const counter = selected.counter;
    counter.material = Array.isArray(counter.material)
      ? counter.material.map(cloneReviewCounterMaterial)
      : cloneReviewCounterMaterial(counter.material);
  }
  gltf.scene = selected.scene;
  return { gltf, selected, asset, rawGlbByteIdentityVerified: true };
}


