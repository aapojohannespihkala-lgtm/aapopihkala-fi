import {
  PRIVATE_MODEL_PREFIX,
  verifyPrivateModelAccess,
  verifyPrivateModelPublisherAccess,
  verifyPrivateModelReadbackAccess,
  type PrivateModelEnv,
} from './privateModel';

const PRIVATE_WORK_TEST_PREFIX = `${PRIVATE_MODEL_PREFIX}/work-test`;
export const PRIVATE_WORK_TEST_CATALOG_PATH = `${PRIVATE_WORK_TEST_PREFIX}/catalog.json`;
export const PRIVATE_WORK_TEST_IMPORT_PATH = `${PRIVATE_WORK_TEST_PREFIX}/import.json`;
export const PRIVATE_WORK_TEST_UPLOAD_PREFIX = `${PRIVATE_WORK_TEST_PREFIX}/upload/`;
export const PRIVATE_WORK_TEST_PUBLISH_PREFIX = `${PRIVATE_WORK_TEST_PREFIX}/publish/`;
export const PRIVATE_WORK_TEST_VERIFY_PREFIX = `${PRIVATE_WORK_TEST_PREFIX}/verify`;
export const PRIVATE_WORK_TEST_VERIFY_CATALOG_PATH = `${PRIVATE_WORK_TEST_VERIFY_PREFIX}/catalog.json`;
export const PRIVATE_WORK_TEST_VERIFY_GLB_PREFIX = `${PRIVATE_WORK_TEST_VERIFY_PREFIX}/`;

export type PrivateWorkTestCandidate = {
  id: string;
  label: string;
  path: string;
  objectKey: string;
  expectedSize: number;
  expectedSha256: string;
};

export const PRIVATE_WORK_TEST_CANDIDATES = [
  {
    id: 'p136b-d-current-wall-corrected',
    label: 'p136B - D current wall corrected',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p136b-d-current-wall-corrected.glb`,
    objectKey: 'work-test/p136b-d-current-wall-corrected.glb',
    expectedSize: 1_149_768,
    expectedSha256: '8a0f78f3f150f43fda65c93f9536594fe72d7713a6a6a946191e00b61cc4f4bf',
  },
  {
    id: 'p137j-d1f-user-current-doors',
    label: 'p138D architecture baseline - p137J geometry',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p137j-d1f-user-current-doors.glb`,
    objectKey: 'work-test/p137j-d1f-user-current-doors.glb',
    expectedSize: 1_154_364,
    expectedSha256: '9e8a7286b1fbeb9730cf1a8ed358fbd07391c5cc7bb084320b30a4506b3186a4',
  },
  {
    id: 'g3-locus-site-p06-axis-corrected',
    label: 'G3 Locus site p06 - axis corrected',
    path: `${PRIVATE_WORK_TEST_PREFIX}/g3-locus-site-p06-axis-corrected.glb`,
    objectKey: 'work-test/g3-locus-site-p06-axis-corrected.glb',
    expectedSize: 1_158_672,
    expectedSha256: '0b4549b160fadf9c6c15adc1fb04fc0c0b0f9b46e6e19b6844a55205356d7efb',
  },
  {
    id: 'p139n-federated-kvv-review',
    label: 'p139N federated KVV review - PLAN ONLY',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p139n-federated-kvv-review.glb`,
    objectKey: 'work-test/p139n-federated-kvv-review.glb',
    expectedSize: 1_193_724,
    expectedSha256: 'b713b9cc29b1e865dc7ca0b640589d9d1440cffe5e665297c6760745a149e515',
  },
  {
    id: 'p139ab-z-credible-wastewater-review',
    label: 'p139AB Z-uskottavuus - jätevesi',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p139ab-z-credible-wastewater-review.glb`,
    objectKey: 'work-test/p139ab-z-credible-wastewater-review.glb',
    expectedSize: 1_199_352,
    expectedSha256: '6470e7c529546231725856e94c11203d86b1e66f0e6645bb36ce01aec2275159',
  },
  {
    id: 'p143a-scalgo-terrain',
    label: 'p143A SCALGO terrain + architecture - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p143a-scalgo-terrain.glb`,
    objectKey: 'work-test/p143a-scalgo-terrain.glb',
    expectedSize: 1_352_620,
    expectedSha256: '383e26a1ebbae28afa3caf3bbf614368574a5eca93db422b451369edac95961e',
  },
  {
    id: 'p143f-scalgo-contours',
    label: 'p143F SCALGO terrain + contours - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p143f-scalgo-contours.glb`,
    objectKey: 'work-test/p143f-scalgo-contours.glb',
    expectedSize: 1_481_704,
    expectedSha256: '2f0be722f43a0e47ad59f2c65e1f1449a6e5af51b80811e71f8a5dc9a28fbfb0',
  },
  {
    id: 'p143g-scalgo-cartography',
    label: 'p143G SCALGO smoothed cartography - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p143g-scalgo-cartography.glb`,
    objectKey: 'work-test/p143g-scalgo-cartography.glb',
    expectedSize: 1_661_536,
    expectedSha256: 'fdde532b713249178111a9e830ebe6b52cf8a600b9f206fdc049abb072d55e02',
  },
  {
    id: 'p143h-scalgo-label-axis',
    label: 'p143H SCALGO technical labels + paired barbs - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p143h-scalgo-label-axis.glb`,
    objectKey: 'work-test/p143h-scalgo-label-axis.glb',
    expectedSize: 1_673_484,
    expectedSha256: '768972c522f63de0629020874f690b796b54f7c6d70125248d51f39b8d682c56',
  },
  {
    id: 'p143j-scalgo-label-flow',
    label: 'p143J SCALGO building-bypass label flow - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p143j-scalgo-label-flow.glb`,
    objectKey: 'work-test/p143j-scalgo-label-flow.glb',
    expectedSize: 1_684_500,
    expectedSha256: '4c2cea0eccff70754952750b12be7c24d150545feac0e17b3f86ebbb24c28578',
  },
  {
    id: 'p144c-g3-1974-iv-on-p143h',
    label: 'P144C G3 1974 IV anchors + p143H cartography - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p144c-g3-1974-iv-on-p143h.glb`,
    objectKey: 'work-test/p144c-g3-1974-iv-on-p143h.glb',
    expectedSize: 1_720_068,
    expectedSha256: '739e5cfed61edae7464af4edf77dfdf4c34354def6f88c993c2ca62f2c29ece1',
  },
  // P145C contract: presentation-only work targets; no physical Z, topology-link or penetration claim.
  {
    id: 'p145b-1974-iv-section-worktargets',
    label: 'P145B 1974 IV section work-targets - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p145b-1974-iv-section-worktargets.glb`,
    objectKey: 'work-test/p145b-1974-iv-section-worktargets.glb',
    expectedSize: 1_732_508,
    expectedSha256: '0d6754bde828bba9b7e78806c5ab8eac0a11a5077f43b8f3a5410f74e16c40e9',
  },
  // P155D viewer integration: exact P155C-B presentation-only storage-roof candidate.
  {
    id: 'p155cb-d-storage-roof',
    label: 'P155C-B D storage roof presentation - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p155cb-d-storage-roof.glb`,
    objectKey: 'work-test/p155cb-d-storage-roof.glb',
    expectedSize: 1_187_956,
    expectedSha256: '9adf08632a89b8a76540addd611e7d5b6a9be59b76b3e4e871621b6f624f7c82',
  },
  // P151D viewer integration: exact P151C whole-building minimum review carrier.
  {
    id: 'p151c-whole-building-carrier',
    label: 'P151C whole-building minimum review carrier - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p151c-whole-building-carrier.glb`,
    objectKey: 'work-test/p151c-whole-building-carrier.glb',
    expectedSize: 1_913_540,
    expectedSha256: '67581d3d4f4a444c182a89c56c09235a22e6055e7f9edd7d0d28a6960329b043',
  },
  // P150F-R viewer integration: metadata-corrected whole-building + substructure successor.
  {
    id: 'p150fr-whole-building-substructure',
    label: 'P150F-R whole-building + substructure successor - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p150fr-whole-building-substructure.glb`,
    objectKey: 'work-test/p150fr-whole-building-substructure.glb',
    expectedSize: 1_919_860,
    expectedSha256: '13ca8995e873982a91d7fe1bd82eff97a3a09f9688507b2fa488244cca1b0e03',
  },
  // P150G viewer integration: whole-building end-plinth human-review correction successor.
  {
    id: 'p150g-whole-building-end-plinth',
    label: 'P150G whole-building end-plinth correction - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p150g-whole-building-end-plinth.glb`,
    objectKey: 'work-test/p150g-whole-building-end-plinth.glb',
    expectedSize: 1_986_004,
    expectedSha256: 'a17fdc1cbc29c4ecfcab3e94554b5ea5860c9a19db33e21f24c324acf70d6d89',
  },
  // P156K viewer integration: exact P156I 2017 KVV presentation-only candidate.
  {
    id: 'p156i-2017-kvv-main-presentation',
    label: 'P156I 2017 KVV mainCandidate presentation - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p156i-2017-kvv-main-presentation.glb`,
    objectKey: 'work-test/p156i-2017-kvv-main-presentation.glb',
    expectedSize: 1_848_532,
    expectedSha256: '072890e75cd693c05dc705d6a5581e999b9124d37d99aa914336c0a1d9b3ef3f',
  },
  // P161 viewer integration: exact multisource systems review carrier.
  {
    id: 'p161-multisource-systems-carrier',
    label: 'P161 multisource systems review carrier - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p161-multisource-systems-carrier.glb`,
    objectKey: 'work-test/p161-multisource-systems-carrier.glb',
    expectedSize: 1_858_948,
    expectedSha256: '7413fa57b423260cfff9554fae96a8167fba48d03a7c570806a509e58e3ca65d',
  },
  // P170B viewer integration: exact P170A P161 review-visibility successor.
  {
    id: 'p170a-p161-review-visibility',
    label: 'P170A P161 review visibility presentation successor - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p170a-p161-review-visibility.glb`,
    objectKey: 'work-test/p170a-p161-review-visibility.glb',
    expectedSize: 1_877_872,
    expectedSha256: '447e587b9903ec36056df2fa414620086a601bbfb5f3fcdd89a9cb9928e86368',
  },
  // P170D-R2 viewer/release integration: corrected spatial review visibility successor.
  {
    id: 'p170d-p161-review-visibility-correction',
    label: 'P170D-R2 P161 review visibility placement correction - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p170d-p161-review-visibility-correction.glb`,
    objectKey: 'work-test/p170d-p161-review-visibility-correction.glb',
    expectedSize: 1_887_248,
    expectedSha256: '7f2bb6a65617e81f05c58b4d732e3c96c781f890ea5c3364e28cdaa996c6520e',
  },
  // P171E viewer/release integration: exact P171C D stair opening + guard/lowWall junction successor.
  {
    id: 'p171c-d-stair-opening-guard-lowwall-junction',
    label: 'P171C D stair opening + guard/lowWall junction - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p171c-d-stair-opening-guard-lowwall-junction.glb`,
    objectKey: 'work-test/p171c-d-stair-opening-guard-lowwall-junction.glb',
    expectedSize: 2_110_432,
    expectedSha256: 'ccacc928d7913886755dba7bb04d3dd3cc9f84e5a03dbd63170c29622b64e706',
  },
  // P173F viewer/review integration: exact P173D whole-building D wall HR-6/HR-7 semantic rebase successor.
  {
    id: 'p173d-whole-building-d-wall-hr67-rebase',
    label: 'P173D whole-building D wall HR-6/HR-7 rebase - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p173d-whole-building-d-wall-hr67-rebase.glb`,
    objectKey: 'work-test/p173d-whole-building-d-wall-hr67-rebase.glb',
    expectedSize: 2_119_784,
    expectedSha256: '3d7144b0ea1841be6b9ef790e02ad807287d22c1b2a1e45fafae0f193c61ed7f',
  },
  // P174C viewer/review integration: exact P174A-R2 HR-6 west-gable north-termination successor.
  {
    id: 'p174a-r2-west-gable-termination-correction',
    label: 'P174A-R2 HR-6 west-gable termination correction - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p174a-r2-west-gable-termination-correction.glb`,
    objectKey: 'work-test/p174a-r2-west-gable-termination-correction.glb',
    expectedSize: 2_130_116,
    expectedSha256: '7a44320e649ac0d6611a3124ba62fce5e4848c0266d4ad10da4220cd06ac7e20',
  },
  // P175D viewer/review integration: exact persisted P175B-R3 near-building terrain refinement successor.
  {
    id: 'p175b-r3-near-building-flatter-terrain',
    label: 'P175B-R3 near-building flatter terrain - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p175b-r3-near-building-flatter-terrain.glb`,
    objectKey: 'work-test/p175b-r3-near-building-flatter-terrain.glb',
    expectedSize: 2_307_636,
    expectedSha256: 'a70dfac3b0f21011f042d0112d9d5283c450e863bd2dbdb8776bfec902c92b60',
  },
  // P176C viewer/review integration: exact P176A full-visible west-gable carrier correction successor.
  {
    id: 'p176a-hr6-full-visible-west-gable-termination-correction',
    label: 'P176A HR-6 full visible west-gable termination correction - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p176a-hr6-full-visible-west-gable-termination-correction.glb`,
    objectKey: 'work-test/p176a-hr6-full-visible-west-gable-termination-correction.glb',
    expectedSize: 2_143_792,
    expectedSha256: 'bf8172b6661205906f588d7db3e1b1f416045ffef4d26208f12cef02df221dc5',
  },
  // P177D viewer/review integration: exact P177B direct D-storage north wall-line correction successor.
  {
    id: 'p177b-hr6-direct-d-storage-north-wall-line-corrected',
    label: 'P177B HR-6 direct D-storage north wall-line correction - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p177b-hr6-direct-d-storage-north-wall-line-corrected.glb`,
    objectKey: 'work-test/p177b-hr6-direct-d-storage-north-wall-line-corrected.glb',
    expectedSize: 2_155_224,
    expectedSha256: '37317206852db2adc95af4726e028a7297f6f42cd1552794e067093ba6fa2ca1',
  },
  // P178D viewer/review integration: exact P178B D stair guard/lowWall visible junction closure successor.
  {
    id: 'p178b-d-stair-guard-lowwall-junction-closure',
    label: 'P178B D stair guard/lowWall visible junction closure - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p178b-d-stair-guard-lowwall-junction-closure.glb`,
    objectKey: 'work-test/p178b-d-stair-guard-lowwall-junction-closure.glb',
    expectedSize: 2_165_344,
    expectedSha256: 'a60111c6f0bc25d56e00c446cf2088b96e96f4f87051233abd8c2f23a248ef9b',
  },
  // P181 V4 viewer/review integration: exact persisted P181B-R1 A-C storage ground-contact/substructure + terrain rebase successor.
  {
    id: 'p181b-r1-ac-storage-ground-contact-substructure-terrain-rebase',
    label: 'P181B-R1 A-C storage ground-contact/substructure + terrain rebase - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p181b-r1-ac-storage-ground-contact-substructure-terrain-rebase.glb`,
    objectKey: 'work-test/p181b-r1-ac-storage-ground-contact-substructure-terrain-rebase.glb',
    expectedSize: 2_861_664,
    expectedSha256: '3cddee192ae2af0d85bb650482aaa1596dfd883e5f0b3d25c42c4b451b3e6239',
  },
  // P164D-V viewer integration: exact P164B corrected-stair successor.
  {
    id: 'p164b-d-corrected-stair',
    label: 'P164B D corrected stair topology - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p164b-d-corrected-stair.glb`,
    objectKey: 'work-test/p164b-d-corrected-stair.glb',
    expectedSize: 1_583_912,
    expectedSha256: 'db35b42575f1e287905d97d89483982b9354e60b1a8fe806ab29fb26d6103ca9',
  },
  // P167H viewer integration: exact P167F whole-building precise-stair successor.
  {
    id: 'p167f-whole-building-precise-stair',
    label: 'P167F whole-building precise stair successor - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p167f-whole-building-precise-stair.glb`,
    objectKey: 'work-test/p167f-whole-building-precise-stair.glb',
    expectedSize: 2_070_576,
    expectedSha256: '66e8589ec8b904cde6fee3b80ba7c0e01db0f1d66ed88455a6d5ddf9f9442bd8',
  },
  // P168C viewer integration: exact P168A whole-building roof/eave correction successor.
  {
    id: 'p168a-whole-building-roof-eave-correction',
    label: 'P168A whole-building roof/eave correction - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p168a-whole-building-roof-eave-correction.glb`,
    objectKey: 'work-test/p168a-whole-building-roof-eave-correction.glb',
    expectedSize: 2_076_876,
    expectedSha256: 'a9d0672283f15f2ab8cbd527242cb8982b1dab81e86e86b7dad1bfe42dbd1590',
  },
  // P169C viewer integration: exact P169A whole-building A-C storage visible envelope.
  {
    id: 'p169a-whole-building-ac-storage-visible',
    label: 'P169A whole-building A-C storage visible envelope - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p169a-whole-building-ac-storage-visible.glb`,
    objectKey: 'work-test/p169a-whole-building-ac-storage-visible.glb',
    expectedSize: 2_093_060,
    expectedSha256: '12036d1c70e8568a37246d3fe4fe76917095c37ad3f0155e488a8b039c8cfe7b',
  },
  // P169G viewer integration: exact P169F A-C storage-door presentation successor.
  {
    id: 'p169f-whole-building-ac-storage-doors',
    label: 'P169F A-C storage doors - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p169f-whole-building-ac-storage-doors.glb`,
    objectKey: 'work-test/p169f-whole-building-ac-storage-doors.glb',
    expectedSize: 2_104_452,
    expectedSha256: '36d4e73eb32ea5d629d4a755cbcdbdc65fbd9f7dd38a8e871f7e40d8ef687e15',
  },
  // P159 viewer integration: exact whole-building storage context successor.
  {
    id: 'p159-whole-building-storage-context',
    label: 'P159 whole-building storage context successor - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p159-whole-building-storage-context.glb`,
    objectKey: 'work-test/p159-whole-building-storage-context.glb',
    expectedSize: 1_992_656,
    expectedSha256: '085877147e8ee50b69d8fa932bdb6d25bece04be187ec5453e9f73de50d1a5d0',
  },
  // P160 viewer integration: exact D composite architecture carrier.
  {
    id: 'p160-d-composite-architecture',
    label: 'P160 D composite architecture carrier - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p160-d-composite-architecture.glb`,
    objectKey: 'work-test/p160-d-composite-architecture.glb',
    expectedSize: 1_559_168,
    expectedSha256: '773b64f6413237111c9abf6420ccdf52ee5f61f90717618a1fe855f85000f3d7',
  },
  // P154E-B viewer integration: exact P154C D wall-solid + cutout candidate.
  {
    id: 'p154c-d-wall-cutouts',
    label: 'P154C D wall solids + door/window cutouts - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p154c-d-wall-cutouts.glb`,
    objectKey: 'work-test/p154c-d-wall-cutouts.glb',
    expectedSize: 1_535_172,
    expectedSha256: '0653be4435879acb479ca272dc8fd4a3c7299c863c0082797236d4c5c20167c0',
  },
  // P153E-B viewer integration: exact P153C D stair + guard/lowWall candidate.
  {
    id: 'p153c-d-stair-guard-lowwall',
    label: 'P153C D stair + guard/lowWall - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p153c-d-stair-guard-lowwall.glb`,
    objectKey: 'work-test/p153c-d-stair-guard-lowwall.glb',
    expectedSize: 1_743_512,
    expectedSha256: '03525ed32e75f721c90dee0a566abea2d00c742a5f4d29ec43c2b13fafe7ed94',
  },
] as const satisfies readonly PrivateWorkTestCandidate[];

type PrivateWorkTestObjectMetadata = {
  size?: number;
  etag?: string;
  customMetadata?: Record<string, string>;
  writeHttpMetadata?: (headers: Headers) => void;
};

type PrivateWorkTestStoredObject = PrivateWorkTestObjectMetadata & {
  body: ReadableStream<Uint8Array> | null;
};

type PrivateWorkTestBucket = {
  get(key: string): Promise<PrivateWorkTestStoredObject | null>;
  head?(key: string): Promise<PrivateWorkTestObjectMetadata | null>;
  put(
    key: string,
    value: ArrayBuffer,
    options: {
      httpMetadata: {
        contentType: string;
        contentDisposition: string;
        cacheControl: string;
      };
      customMetadata: Record<string, string>;
    },
  ): Promise<PrivateWorkTestStoredObject>;
};

type PrivateWorkTestSeedResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | 'source-fetch-failed'
        | 'source-fetch-timeout'
        | 'source-fetch-denied'
        | 'source-size-mismatch'
        | 'source-sha256-mismatch'
        | 'r2-write-failed'
        | 'r2-readback-failed';
      status: number;
    };

const PRIVATE_WORK_TEST_SOURCE_TIMEOUT_MS = 25_000;

const privateHeaders = () =>
  new Headers({
    'Cache-Control': 'private, no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
  });

const notFound = () =>
  new Response('Not found', {
    status: 404,
    headers: privateHeaders(),
  });

const methodNotAllowed = (allow = 'GET, HEAD') => {
  const headers = privateHeaders();
  headers.set('Allow', allow);
  return new Response('Method not allowed', { status: 405, headers });
};

const privateJsonResponse = (request: Request, payload: unknown, status = 200) => {
  const body = JSON.stringify(payload);
  const headers = privateHeaders();
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Content-Length', String(new TextEncoder().encode(body).byteLength));
  return new Response(request.method === 'HEAD' ? null : body, {
    status,
    headers,
  });
};

export const isPrivateWorkTestPath = (pathname: string) =>
  pathname === PRIVATE_WORK_TEST_PREFIX || pathname.startsWith(`${PRIVATE_WORK_TEST_PREFIX}/`);

export const getPrivateWorkTestCandidate = (pathname: string) =>
  PRIVATE_WORK_TEST_CANDIDATES.find((candidate) => candidate.path === pathname) ?? null;

export const getPrivateWorkTestCandidateById = (id: string) =>
  PRIVATE_WORK_TEST_CANDIDATES.find((candidate) => candidate.id === id) ?? null;

export const getPrivateWorkTestUploadCandidate = (pathname: string) => {
  if (!pathname.startsWith(PRIVATE_WORK_TEST_UPLOAD_PREFIX) || !pathname.endsWith('.glb')) return null;
  const candidateId = pathname.slice(PRIVATE_WORK_TEST_UPLOAD_PREFIX.length, -'.glb'.length);
  if (!/^[a-z0-9-]+$/.test(candidateId)) return null;
  return getPrivateWorkTestCandidateById(candidateId);
};

export const getPrivateWorkTestPublishCandidate = (pathname: string) => {
  if (!pathname.startsWith(PRIVATE_WORK_TEST_PUBLISH_PREFIX) || !pathname.endsWith('.glb')) return null;
  const candidateId = pathname.slice(PRIVATE_WORK_TEST_PUBLISH_PREFIX.length, -'.glb'.length);
  if (!/^[a-z0-9-]+$/.test(candidateId)) return null;
  return getPrivateWorkTestCandidateById(candidateId);
};

export const getPrivateWorkTestVerifyCandidate = (pathname: string) => {
  if (!pathname.startsWith(PRIVATE_WORK_TEST_VERIFY_GLB_PREFIX) || !pathname.endsWith('.glb')) {
    return null;
  }
  const candidateId = pathname.slice(PRIVATE_WORK_TEST_VERIFY_GLB_PREFIX.length, -'.glb'.length);
  if (!/^[a-z0-9-]+$/.test(candidateId)) return null;
  return getPrivateWorkTestCandidateById(candidateId);
};

export const isTrustedPrivateWorkTestSourceUrl = (value: string) => {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.port &&
      url.hostname.endsWith('.oaiusercontent.com') &&
      url.pathname.startsWith('/files/') &&
      url.pathname.endsWith('/raw') &&
      url.searchParams.has('sig') &&
      url.searchParams.has('se') &&
      !url.hash
    );
  } catch {
    return false;
  }
};

export const isTrustedPrivateWorkTestResolvedSourceUrl = (value: string) => {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.port &&
      url.hostname.endsWith('.oaiusercontent.com') &&
      url.pathname.startsWith('/files/') &&
      url.pathname.endsWith('/raw') &&
      !url.hash
    );
  } catch {
    return false;
  }
};

const sha256Hex = async (value: ArrayBuffer) => {
  const digest = await crypto.subtle.digest('SHA-256', value);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const privateWorkTestSourceBytes = async (
  candidate: PrivateWorkTestCandidate,
  sourceUrl: string,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<
  | { ok: true; bytes: ArrayBuffer }
  | Exclude<PrivateWorkTestSeedResult, { ok: true }>
> => {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const sourcePromise = (async () => {
    let sourceResponse: Response;
    try {
      sourceResponse = await fetchImpl(sourceUrl, {
        headers: { Accept: 'model/gltf-binary, application/octet-stream;q=0.9, */*;q=0.1' },
        redirect: 'follow',
        cache: 'no-store',
        signal: controller.signal,
      });
    } catch {
      return { ok: false, error: 'source-fetch-failed', status: 502 } as const;
    }

    if (
      !sourceResponse.ok ||
      !sourceResponse.url ||
      !isTrustedPrivateWorkTestResolvedSourceUrl(sourceResponse.url)
    ) {
      return { ok: false, error: 'source-fetch-denied', status: 502 } as const;
    }

    const declaredLength = sourceResponse.headers.get('Content-Length');
    if (
      declaredLength &&
      Number.isFinite(Number(declaredLength)) &&
      Number(declaredLength) !== candidate.expectedSize
    ) {
      return { ok: false, error: 'source-size-mismatch', status: 422 } as const;
    }

    let bytes: ArrayBuffer;
    try {
      bytes = await sourceResponse.arrayBuffer();
    } catch {
      return { ok: false, error: 'source-fetch-failed', status: 502 } as const;
    }

    if (bytes.byteLength !== candidate.expectedSize) {
      return { ok: false, error: 'source-size-mismatch', status: 422 } as const;
    }

    const sha256 = await sha256Hex(bytes);
    if (sha256 !== candidate.expectedSha256) {
      return { ok: false, error: 'source-sha256-mismatch', status: 422 } as const;
    }

    return { ok: true, bytes } as const;
  })();

  void sourcePromise.catch(() => undefined);
  const timeoutPromise = new Promise<
    Exclude<PrivateWorkTestSeedResult, { ok: true }>
  >((resolve) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      resolve({ ok: false, error: 'source-fetch-timeout', status: 504 });
    }, timeoutMs);
  });

  try {
    return await Promise.race([sourcePromise, timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
};

export const seedPrivateWorkTestCandidateFromSource = async (
  candidate: PrivateWorkTestCandidate,
  sourceUrl: string,
  bucket: PrivateWorkTestBucket,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = PRIVATE_WORK_TEST_SOURCE_TIMEOUT_MS,
): Promise<PrivateWorkTestSeedResult> => {
  const source = await privateWorkTestSourceBytes(
    candidate,
    sourceUrl,
    fetchImpl,
    timeoutMs,
  );
  if (!source.ok) return source;

  try {
    await bucket.put(candidate.objectKey, source.bytes, {
      httpMetadata: {
        contentType: 'model/gltf-binary',
        contentDisposition: 'inline',
        cacheControl: 'private, no-store',
      },
      customMetadata: {
        sha256: candidate.expectedSha256,
      },
    });
  } catch {
    return { ok: false, error: 'r2-write-failed', status: 500 };
  }

  let written: PrivateWorkTestStoredObject | null;
  try {
    written = await bucket.get(candidate.objectKey);
  } catch {
    console.info('private-model work-test import deny: r2-readback');
    return { ok: false, error: 'r2-readback-failed', status: 500 };
  }

  if (!written || !isPrivateWorkTestObjectValid(written, candidate)) {
    console.info('private-model work-test import deny: r2-readback');
    return { ok: false, error: 'r2-readback-failed', status: 500 };
  }

  return { ok: true };
};

export const validatePrivateWorkTestUploadBytes = async (
  bytes: ArrayBuffer,
  expected: Pick<PrivateWorkTestCandidate, 'expectedSize' | 'expectedSha256'>,
) => {
  if (bytes.byteLength !== expected.expectedSize) return 'upload-size-mismatch' as const;
  const sha256 = await sha256Hex(bytes);
  if (sha256 !== expected.expectedSha256) return 'upload-sha256-mismatch' as const;
  return null;
};

export const isPrivateWorkTestObjectValid = (
  object: { size?: number; customMetadata?: Record<string, string> },
  candidate: PrivateWorkTestCandidate,
) =>
  object.size === candidate.expectedSize &&
  object.customMetadata?.sha256?.trim().toLowerCase() === candidate.expectedSha256;

type PrivateWorkTestBinaryWriteResult =
  | { ok: true; alreadyReady: boolean }
  | {
      ok: false;
      error:
        | 'upload-content-type'
        | 'upload-size-mismatch'
        | 'upload-sha256-mismatch'
        | 'upload-body-read-failed'
        | 'r2-write-failed'
        | 'r2-readback-failed';
      status: number;
    };

export const writePrivateWorkTestCandidateFromRequest = async (
  request: Request,
  bucket: PrivateWorkTestBucket,
  candidate: PrivateWorkTestCandidate,
): Promise<PrivateWorkTestBinaryWriteResult> => {
  const contentType = request.headers.get('Content-Type')?.split(';', 1)[0]?.trim().toLowerCase();
  if (contentType !== 'model/gltf-binary' && contentType !== 'application/octet-stream') {
    return { ok: false, error: 'upload-content-type', status: 415 };
  }

  const declaredLength = request.headers.get('Content-Length');
  if (
    declaredLength &&
    Number.isFinite(Number(declaredLength)) &&
    Number(declaredLength) !== candidate.expectedSize
  ) {
    return { ok: false, error: 'upload-size-mismatch', status: 422 };
  }

  let bytes: ArrayBuffer;
  try {
    bytes = await request.arrayBuffer();
  } catch {
    return { ok: false, error: 'upload-body-read-failed', status: 400 };
  }

  const validationError = await validatePrivateWorkTestUploadBytes(bytes, candidate);
  if (validationError) return { ok: false, error: validationError, status: 422 };

  let existing: PrivateWorkTestStoredObject | null;
  try {
    existing = await bucket.get(candidate.objectKey);
  } catch {
    return { ok: false, error: 'r2-readback-failed', status: 500 };
  }
  if (existing && isPrivateWorkTestObjectValid(existing, candidate)) {
    return { ok: true, alreadyReady: true };
  }

  try {
    await bucket.put(candidate.objectKey, bytes, {
      httpMetadata: {
        contentType: 'model/gltf-binary',
        contentDisposition: 'inline',
        cacheControl: 'private, no-store',
      },
      customMetadata: {
        sha256: candidate.expectedSha256,
      },
    });
  } catch {
    return { ok: false, error: 'r2-write-failed', status: 500 };
  }

  let written: PrivateWorkTestStoredObject | null;
  try {
    written = await bucket.get(candidate.objectKey);
  } catch {
    return { ok: false, error: 'r2-readback-failed', status: 500 };
  }
  if (!written || !isPrivateWorkTestObjectValid(written, candidate)) {
    return { ok: false, error: 'r2-readback-failed', status: 500 };
  }

  return { ok: true, alreadyReady: false };
};

const binaryWriteResponse = (
  request: Request,
  candidate: PrivateWorkTestCandidate,
  result: PrivateWorkTestBinaryWriteResult,
  mode: 'upload' | 'publish',
) => {
  if (!result.ok) return privateJsonResponse(request, { error: result.error }, result.status);
  return privateJsonResponse(request, {
    candidate: { id: candidate.id, label: candidate.label, path: candidate.path },
    ready: true,
    seeded: !result.alreadyReady,
    alreadyReady: result.alreadyReady,
    ...(mode === 'upload'
      ? { uploaded: !result.alreadyReady }
      : { published: !result.alreadyReady }),
  });
};

const handlePrivateWorkTestUpload = async (
  request: Request,
  env: PrivateModelEnv,
  candidate: PrivateWorkTestCandidate,
): Promise<Response> => {
  if (!(await verifyPrivateModelAccess(request, env))) return notFound();
  if (request.method !== 'PUT') return methodNotAllowed('PUT');

  const bucket = env.PRIVATE_MODEL_BUCKET as unknown as PrivateWorkTestBucket | undefined;
  if (!bucket) {
    console.info('private-model work-test upload deny: bucket-binding');
    return notFound();
  }

  const result = await writePrivateWorkTestCandidateFromRequest(request, bucket, candidate);
  return binaryWriteResponse(request, candidate, result, 'upload');
};

export const handlePrivateWorkTestPublish = async (
  request: Request,
  env: PrivateModelEnv,
  candidate: PrivateWorkTestCandidate,
): Promise<Response> => {
  if (!(await verifyPrivateModelPublisherAccess(request, env))) return notFound();
  if (request.method !== 'PUT') return methodNotAllowed('PUT');

  const bucket = env.PRIVATE_MODEL_BUCKET as unknown as PrivateWorkTestBucket | undefined;
  if (!bucket) {
    console.info('private-model work-test publish deny: bucket-binding');
    return notFound();
  }

  const result = await writePrivateWorkTestCandidateFromRequest(request, bucket, candidate);
  return binaryWriteResponse(request, candidate, result, 'publish');
};

const privateWorkTestCatalogObject = async (
  bucket: PrivateWorkTestBucket,
  objectKey: string,
): Promise<PrivateWorkTestObjectMetadata | null> => {
  if (bucket.head) return bucket.head(objectKey);

  const object = await bucket.get(objectKey);
  if (object?.body) {
    try {
      await object.body.cancel();
    } catch {
      // Metadata is already available; cancellation is best-effort for legacy test/fallback buckets.
    }
  }
  return object;
};

const privateWorkTestCatalogResponse = async (
  request: Request,
  bucket: PrivateWorkTestBucket,
): Promise<Response> => {
  const candidates = [];

  for (const candidate of PRIVATE_WORK_TEST_CANDIDATES) {
    const object = await privateWorkTestCatalogObject(bucket, candidate.objectKey);
    if (!object || !isPrivateWorkTestObjectValid(object, candidate)) continue;

    candidates.push({
      id: candidate.id,
      label: candidate.label,
      path: candidate.path,
    });
  }

  return privateJsonResponse(request, { candidates });
};

const privateWorkTestCandidateResponse = async (
  request: Request,
  bucket: PrivateWorkTestBucket,
  candidate: PrivateWorkTestCandidate,
): Promise<Response> => {
  const object = await bucket.get(candidate.objectKey);

  if (!object || !isPrivateWorkTestObjectValid(object, candidate)) {
    console.info('private-model work-test deny: candidate-not-ready');
    return notFound();
  }

  const headers = privateHeaders();
  object.writeHttpMetadata?.(headers);
  headers.set('Content-Type', 'model/gltf-binary');
  headers.set('Content-Disposition', 'inline');
  headers.set('Content-Length', String(candidate.expectedSize));
  if (object.etag) headers.set('ETag', object.etag);

  return new Response(request.method === 'HEAD' ? null : object.body, {
    status: 200,
    headers,
  });
};

const handlePrivateWorkTestMachineReadback = async (
  request: Request,
  env: PrivateModelEnv,
  candidate: PrivateWorkTestCandidate | null,
): Promise<Response> => {
  if (request.method !== 'GET' && request.method !== 'HEAD') return methodNotAllowed();
  if (!(await verifyPrivateModelReadbackAccess(request, env))) return notFound();

  const bucket = env.PRIVATE_MODEL_BUCKET as unknown as PrivateWorkTestBucket | undefined;
  if (!bucket) {
    console.info('private-model work-test verify deny: bucket-binding');
    return notFound();
  }

  if (!candidate) return privateWorkTestCatalogResponse(request, bucket);
  return privateWorkTestCandidateResponse(request, bucket, candidate);
};

const handlePrivateWorkTestImport = async (
  request: Request,
  env: PrivateModelEnv,
): Promise<Response> => {
  if (!(await verifyPrivateModelAccess(request, env))) return notFound();
  if (request.method !== 'POST') return methodNotAllowed('POST');

  const bucket = env.PRIVATE_MODEL_BUCKET as unknown as PrivateWorkTestBucket | undefined;
  if (!bucket) {
    console.info('private-model work-test import deny: bucket-binding');
    return notFound();
  }

  let payload: { candidateId?: unknown; sourceUrl?: unknown };
  try {
    payload = (await request.json()) as { candidateId?: unknown; sourceUrl?: unknown };
  } catch {
    return privateJsonResponse(request, { error: 'invalid-json' }, 400);
  }

  if (
    typeof payload.candidateId !== 'string' ||
    typeof payload.sourceUrl !== 'string' ||
    payload.sourceUrl.length > 5000
  ) {
    return privateJsonResponse(request, { error: 'invalid-request' }, 400);
  }

  const candidate = getPrivateWorkTestCandidateById(payload.candidateId);
  if (!candidate || !isTrustedPrivateWorkTestSourceUrl(payload.sourceUrl)) {
    console.info('private-model work-test import deny: candidate-or-source');
    return notFound();
  }

  const existing = await bucket.get(candidate.objectKey);
  if (existing && isPrivateWorkTestObjectValid(existing, candidate)) {
    return privateJsonResponse(request, {
      candidate: { id: candidate.id, label: candidate.label, path: candidate.path },
      ready: true,
      seeded: false,
    });
  }

  const seeded = await seedPrivateWorkTestCandidateFromSource(
    candidate,
    payload.sourceUrl,
    bucket,
  );
  if (!seeded.ok) {
    return privateJsonResponse(request, { error: seeded.error }, seeded.status);
  }

  return privateJsonResponse(request, {
    candidate: { id: candidate.id, label: candidate.label, path: candidate.path },
    ready: true,
    seeded: true,
  });
};

export const handlePrivateWorkTestRequest = async (
  request: Request,
  env: PrivateModelEnv,
): Promise<Response> => {
  const pathname = new URL(request.url).pathname;

  if (pathname === PRIVATE_WORK_TEST_IMPORT_PATH) {
    return handlePrivateWorkTestImport(request, env);
  }

  const publishCandidate = getPrivateWorkTestPublishCandidate(pathname);
  if (publishCandidate) {
    return handlePrivateWorkTestPublish(request, env, publishCandidate);
  }

  const uploadCandidate = getPrivateWorkTestUploadCandidate(pathname);
  if (uploadCandidate) {
    return handlePrivateWorkTestUpload(request, env, uploadCandidate);
  }

  if (pathname === PRIVATE_WORK_TEST_VERIFY_CATALOG_PATH) {
    return handlePrivateWorkTestMachineReadback(request, env, null);
  }

  const verifyCandidate = getPrivateWorkTestVerifyCandidate(pathname);
  if (verifyCandidate) {
    return handlePrivateWorkTestMachineReadback(request, env, verifyCandidate);
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') return methodNotAllowed();
  if (!(await verifyPrivateModelAccess(request, env))) return notFound();

  const bucket = env.PRIVATE_MODEL_BUCKET as unknown as PrivateWorkTestBucket | undefined;
  if (!bucket) {
    console.info('private-model work-test deny: bucket-binding');
    return notFound();
  }

  if (pathname === PRIVATE_WORK_TEST_CATALOG_PATH) {
    return privateWorkTestCatalogResponse(request, bucket);
  }

  const candidate = getPrivateWorkTestCandidate(pathname);
  if (!candidate) return notFound();

  return privateWorkTestCandidateResponse(request, bucket, candidate);
};
