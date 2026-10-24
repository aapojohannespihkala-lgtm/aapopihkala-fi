import {
  applyPrivateGlbRevalidation,
  privateGlbEtag,
  privateGlbIfNoneMatchHits,
  privateGlbNotModified,
} from './privateGlbRevalidation';
// @ts-ignore - immutable source identity shared with the viewer.
import { D1F_SERVICE_ASSET, D1F_SERVICE_PREVIOUS, D1F_SERVICE_CENTERED, D1F_SERVICE_CLOSED_LID_450 } from '../src/scripts/privateModelD1FServiceContract.mjs';
// @ts-ignore - immutable 124-scene D1F shower WORK_TEST identity.
import { D1F_SHOWER_PHOTO_SOURCE } from '../src/scripts/privateModelD1FShowerPhotoSourceContract.mjs';
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
  // P184D latest-survivor registration: exact P184D whole-building island source-chain-X successor.
  {
    id: 'p184d-whole-building-survivor-island-x-source-chain',
    label: 'P184D whole-building survivor island source-chain-X correction - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p184d-whole-building-survivor-island-x-source-chain.glb`,
    objectKey: 'work-test/p184d-whole-building-survivor-island-x-source-chain.glb',
    expectedSize: 2_878_416,
    expectedSha256: '3544b069f1cc059af1e4fa219e8aefb909153515efd00cd9ce589178d4a07522',
  },
  // P184G release registration: exact axis-self-consistent whole-building survivor.
  {
    id: 'p184g-whole-building-survivor-island-x-axis-selfconsistency',
    label: 'P184G whole-building survivor island X axis self-consistency - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p184g-whole-building-survivor-island-x-axis-selfconsistency.glb`,
    objectKey: 'work-test/p184g-whole-building-survivor-island-x-axis-selfconsistency.glb',
    expectedSize: 2_896_392,
    expectedSha256: '94fe2edb781530b76c09286aa39b7ab0c22cc35a028627b32ac833df3e24e9e2',
  },
  // M5B release registration: exact persisted roof-stormwater current/planned WORK_TEST successor.
  {
    id: 'm5b-roof-stormwater-current-planned',
    label: 'M5B roof stormwater current/planned variants - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/m5b-roof-stormwater-current-planned.glb`,
    objectKey: 'work-test/m5b-roof-stormwater-current-planned.glb',
    expectedSize: 2_899_988,
    expectedSha256: '4286e8920c2f5539b909d090f4c0929b896afde61f2f1f070374cad00b581f58',
  },
  // M5B-Z2R: exact M5A-Z2-parented structural rebuild; planned variant is WORK_TEST, not CURRENT.
  {
    id: 'm5b-z2r-roof-stormwater-structural-rebuilt',
    label: 'M5B-Z2R roof stormwater structural rebuilt - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/m5b-z2r-roof-stormwater-structural-rebuilt.glb`,
    objectKey: 'work-test/m5b-z2r-roof-stormwater-structural-rebuilt.glb',
    expectedSize: 2_976_824,
    expectedSha256: '4f2fc0738907fb2a35722739ea8f1f108aeab78c1e63dc09777e55be6604a1d2',
  },
  // P185C viewer/release registration: exact persisted D2015 electrical source overlay.
  {
    id: 'p185c-d2015-electrical-source-overlay',
    label: 'P185C D2015 electrical source overlay - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p185c-d2015-electrical-source-overlay.glb`,
    objectKey: 'work-test/p185c-d2015-electrical-source-overlay.glb',
    expectedSize: 2_934_024,
    expectedSha256: '9599dec3db6a8cf1961f5db1a91d9722566dadd9a4176861e1e087722a3cea6c',
  },
  // P185C-X2 release registration: exact persisted p28-corrected D2015 D 1F electrical source overlay.
  {
    id: 'p185c-x2-d2015-electrical-source-overlay-p28-corrected',
    label: 'P185C-X2 D2015 electrical source overlay p28-corrected - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p185c-x2-d2015-electrical-source-overlay-p28-corrected.glb`,
    objectKey: 'work-test/p185c-x2-d2015-electrical-source-overlay-p28-corrected.glb',
    expectedSize: 2_935_172,
    expectedSha256: '6bcfc10f9b04323229e10b8b3d7f72d2d96458b9dd4170d19a1effd986564b32',
  },
  // P186B viewer/release registration: exact persisted D2015 D 2F wiring source overlay.
  {
    id: 'p186b-d2015-d2f-wiring-mainmass-source-overlay',
    label: 'P186B D 2F wiring main-mass source overlay - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p186b-d2015-d2f-wiring-mainmass-source-overlay.glb`,
    objectKey: 'work-test/p186b-d2015-d2f-wiring-mainmass-source-overlay.glb',
    expectedSize: 3_117_312,
    expectedSha256: '4b5de6b1f99cd3d85de71f826f4e7b7e481c17c1d5dd5e0d508dd8b500866236',
  },
  // P186D-X1 viewer/release registration: exact persisted p28-corrected D2015 lighting source markers.
  {
    id: 'p186d-x1-d2015-lighting-source-markers-p28-corrected',
    label: 'P186D-X1 D2015 lighting source markers p28-corrected - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p186d-x1-d2015-lighting-source-markers-p28-corrected.glb`,
    objectKey: 'work-test/p186d-x1-d2015-lighting-source-markers-p28-corrected.glb',
    expectedSize: 3_166_100,
    expectedSha256: '3283b5938b8aeeb3e627d8ae1b31d0912ce7c7b6239829161dcae6ce991ca868',
  },
  // P186C-X2R release registration: exact persisted p28-corrected D2015 D 1F floor-heating work-route successor.
  {
    id: 'p186c-x2r-d2015-floor-heating-work-routes-p28-corrected',
    label: 'P186C-X2R D2015 floor-heating work routes p28-corrected - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p186c-x2r-d2015-floor-heating-work-routes-p28-corrected.glb`,
    objectKey: 'work-test/p186c-x2r-d2015-floor-heating-work-routes-p28-corrected.glb',
    expectedSize: 3_190_212,
    expectedSha256: '47ab3668fe2b722570216b4b749611b2a6f5f8bd9b157fc91d88ae73bdf34272',
  },
  // P186E-X1 release registration: exact persisted p28-corrected D2015 electrical source-label anchors.
  {
    id: 'p186e-x1-d2015-electrical-source-label-anchors-p28-corrected',
    label: 'P186E-X1 D2015 electrical source label anchors p28-corrected - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p186e-x1-d2015-electrical-source-label-anchors-p28-corrected.glb`,
    objectKey: 'work-test/p186e-x1-d2015-electrical-source-label-anchors-p28-corrected.glb',
    expectedSize: 3_217_892,
    expectedSha256: 'a92cecbdb419048ca985bbc91663f7c511929924bf889cabc8cc3847602dacb5',
  },
  // P186F-X1 release registration: exact persisted D Themo room-level presentation anchors.
  {
    id: 'p186f-x1-d-themo-room-presentation',
    label: 'P186F-X1 D Themo room presentation - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p186f-x1-d-themo-room-presentation.glb`,
    objectKey: 'work-test/p186f-x1-d-themo-room-presentation.glb',
    expectedSize: 3_199_332,
    expectedSha256: '4459d528ddd821958f04b0f4d1be800bdc8aaef9290a792ba72bab95209d83db',
  },
  // P186F-X2 release registration: exact persisted D Themo room-adjacent WORK_TEST successor.
  {
    id: 'p186f-x2-d-themo-room-adjacent-work-assumption',
    label: 'P186F-X2 D Themo room-adjacent work assumption - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p186f-x2-d-themo-room-adjacent-work-assumption.glb`,
    objectKey: 'work-test/p186f-x2-d-themo-room-adjacent-work-assumption.glb',
    expectedSize: 3_201_932,
    expectedSha256: '59fad8cfab19ad6981f53c7969b2d9bd6f33161fe33de0fc23152e6ec38c029f',
  },
  // P186F-X4 exact persisted successor: scene66 carries the corrected three-Themo WORK_TEST presentation.
  // Physical Themo XY, wall host and current door clearance remain explicitly unverified.
  {
    id: 'p186f-x4-d-themo-door-plan-clear-work-assumption',
    label: 'P186F-X4 D Themo door-plan-clear work assumption - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/p186f-x4-d-themo-door-plan-clear-work-assumption.glb`,
    objectKey: 'work-test/p186f-x4-d-themo-door-plan-clear-work-assumption.glb',
    expectedSize: 3_228_624,
    expectedSha256: '3089d0f58c23044aa5606d6e8a3306e8dcacaddbcc38961fa22a240e345fbb9f',
  },
  // M5A viewer/release registration: exact persisted drainage topology presentation WORK_TEST.
  {
    id: 'm5a-drain-topology',
    label: 'M5A drainage topology presentation - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/m5a-drain-topology.glb`,
    objectKey: 'work-test/m5a-drain-topology.glb',
    expectedSize: 2_903_856,
    expectedSha256: 'e9455f8be8062ce7ebeca3046711896f12d990aad53e03226d87afc416bbb69e',
  },
  // M5A-R2 whole-building CURRENT candidate: exact metadata-only successor of reviewed drainage topology.
  {
    id: 'm5a-r2-whole-building-current-candidate-r730',
    label: 'M5A-R2 whole-building CURRENT candidate R730 - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/m5a-r2-whole-building-current-candidate-r730.glb`,
    objectKey: 'work-test/m5a-r2-whole-building-current-candidate-r730.glb',
    expectedSize: 2_907_116,
    expectedSha256: 'bc531cecf7f5131ea18ad0d5f16c60526e08c982b9af3c9153a7c7ae5e3d9334',
  },
  // M5A-R3 Z1C release registration: exact persisted relative-Z functional NW-continuity successor.
  {
    id: 'm5a-r3-z1c-relative-z-functional-nw-continuity',
    label: 'M5A-R3 Z1C relative-Z functional NW continuity - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/m5a-r3-z1c-relative-z-functional-nw-continuity.glb`,
    objectKey: 'work-test/m5a-r3-z1c-relative-z-functional-nw-continuity.glb',
    expectedSize: 2_930_908,
    expectedSha256: '26b459e66f0bd1749d273de54f120836a76f6a4ada9f66f185651452010505b6',
  },
  // M5A-Z2 release registration: exact persisted host-floor-datum absolute-Z WORK_TEST successor.
  {
    id: 'm5a-z2-absolute-z-host-floor-datum',
    label: 'M5A-Z2 drainage absolute-Z host-floor datum - WORK_TEST',
    path: `${PRIVATE_WORK_TEST_PREFIX}/m5a-z2-absolute-z-host-floor-datum.glb`,
    objectKey: 'work-test/m5a-z2-absolute-z-host-floor-datum.glb',
    expectedSize: 2_958_672,
    expectedSha256: 'e15e265ee4267bb26214eaaab338b786388afb2d3a5b9dc37ecdb92e0815d4cb',
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

const M5A_Z2D_D100_D300_DIAMETER_CANDIDATE = {
  id: 'm5a-z2d-d100-d300-diameter',
  label: 'M5A-Z2D D100 pipes + D300/D315 wells - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/m5a-z2d-d100-d300-diameter.glb`,
  objectKey: 'work-test/m5a-z2d-d100-d300-diameter.glb',
  expectedSize: 3_085_140,
  expectedSha256: '15047af6e2f7db2080f554d241d66625a6797f5e24ae737b19627ae1f4aa87fd',
} as const satisfies PrivateWorkTestCandidate;

// R1125 is the exact, immutable source-metadata successor of the G2b drainage WORK_TEST.
// Five route diameters have a general salaoja nominal Ø100 class; PVK discharge
// and parking physical diameters remain UNKNOWN. Never publish to CURRENT.
const M5A_R1125_PVK_DIAMETER_SOURCE_SPLIT_CANDIDATE = {
  id: 'm5a-r1125-pvk-diameter-source-split',
  label: 'M5A R1125 5 salaoja nominal D100 + 2 PVK diameter UNKNOWN - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/m5a-r1125-pvk-diameter-source-split.glb`,
  objectKey: 'work-test/m5a-r1125-pvk-diameter-source-split.glb',
  expectedSize: 3_112_432,
  expectedSha256: 'c465417fc101e7de495d0a04bb4feb2bee61b80cd5efccf876f6eb76326f9a48',
} as const satisfies PrivateWorkTestCandidate;

// R1125's original source scene63 remains immutable and independently available.
// The exact, G2b-persisted ZIP holds ONE inner scene64 GLB with seven visual
// source-route numbers. Five carry only system-general nominal D100 metadata;
// the two PVK physical diameters, installed coordinates and as-built status
// remain UNKNOWN. One local 4-camera QA had a 1-pixel parity warning.
// Publisher allowlisting is NOT viewer autoload, WebGL pixel QA or human review.
const M5A_R1125_SCENE64_NUMBERED_ROUTES_CANDIDATE = {
  id: 'm5a-r1125-scene64-seven-numbered-route-labels-20261018',
  label: 'M5A R1125 seven source-ID route numbers - noncanonical WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/m5a-r1125-scene64-seven-numbered-route-labels-20261018.glb`,
  objectKey: 'work-test/m5a-r1125-scene64-seven-numbered-route-labels-20261018.glb',
  expectedSize: 3_179_132,
  expectedSha256: 'f5e504df44a3b8d58d61bcc3c7af45639a4d53fd17e8c07ef39346e969d0536d',
} as const satisfies PrivateWorkTestCandidate;

const M5A_Z2D_R1090_WELL_TOP_GROUND_SURFACE_CANDIDATE = {
  id: 'm5a-z2d-r1090-well-top-ground-surface',
  label: 'M5A-Z2D R1090 well-top ground-surface correction - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/m5a-z2d-r1090-well-top-ground-surface.glb`,
  objectKey: 'work-test/m5a-z2d-r1090-well-top-ground-surface.glb',
  expectedSize: 3_103_036,
  expectedSha256: '3adf908ae64ff75a235823223f32b1cf36de16fb03321e75c8816dd16212739a',
} as const satisfies PrivateWorkTestCandidate;

// Presentation-only planned SOK2/SOK3 raise markers; the source quote names neither
// well nor raise heights, and this candidate never represents an as-built extension.
const M5A_R1115_SOK23_PLANNED_RAISE_PRESENCE_CANDIDATE = {
  id: 'm5a-r1115-sok23-planned-raise-presence',
  label: 'M5A R1115 planned SOK2/SOK3 well raise presence - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/m5a-r1115-sok23-planned-raise-presence.glb`,
  objectKey: 'work-test/m5a-r1115-sok23-planned-raise-presence.glb',
  expectedSize: 3_108_436,
  expectedSha256: '5dd97f9d6b1bd7c2c4c6e39920b5d8899178f01f6857effb05b7b38686cb534b',
} as const satisfies PrivateWorkTestCandidate;

const M5B_R1109_FIVE_DOWNSPOUT_PRESENCE_ZONES_CANDIDATE = {
  id: 'm5b-r1109-five-downspout-presence-zones',
  label: 'M5B R1109 five downspout presence zones - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/m5b-r1109-five-downspout-presence-zones.glb`,
  objectKey: 'work-test/m5b-r1109-five-downspout-presence-zones.glb',
  expectedSize: 3_102_172,
  expectedSha256: '92275bb2ecf61054c0bb015d69800b85a899d11f9170a485ccbf62238373fc10',
} as const satisfies PrivateWorkTestCandidate;

// P137E source-bound D1F scene67: original P123C wall + three wall-mounted Themos.
// Exact raw Drive file 17FqR79AIjJhScxdydK0HG1RX0P53e0wf was authenticated
// by the machine publisher; this is WORK_TEST, not CURRENT or as-built.
const P137E_D1F_THREE_WALL_MOUNTED_THEMOS_CANDIDATE = {
  id: 'p137e-d1f-three-wall-mounted-themos',
  label: 'P137E D1F P123C original wall + three Themos - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/p137e-d1f-three-wall-mounted-themos.glb`,
  objectKey: 'work-test/p137e-d1f-three-wall-mounted-themos.glb',
  expectedSize: 3_258_268,
  expectedSha256: '07331f15ca223a5db8e0e8ea8955d7707f880cef23ca80b09dc6611730ae0b7d',
} as const satisfies PrivateWorkTestCandidate;

// Source-preserving D1F four-variant wall hypothesis, retained as WORK_TEST.
// Exact identity is independently derived from complete raw Drive bytes.
const D1F_COMBINED_WALL_115_100_CANDIDATE = {
  id: 'd1f-combined-wall-115-100-20261013',
  label: 'D1F combined 115/100 wall hypothesis - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/d1f-combined-wall-115-100-20261013.glb`,
  objectKey: 'work-test/d1f-combined-wall-115-100-20261013.glb',
  expectedSize: 3_544_904,
  expectedSha256: '1cb9a785e51a00b8abe9bbd81801c25326f5219740bdc18176649ee39b35b0a2',
} as const satisfies PrivateWorkTestCandidate;

const D1F_MEASURED_WALL_BASIN_CANDIDATE = {
  id: 'd1f-measured-wall-140-100-2350-b710-basin-20261014',
  label: 'D1F - seinät ja allastaso - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/d1f-measured-wall-140-100-2350-b710-basin-20261014.glb`,
  objectKey: 'work-test/d1f-measured-wall-140-100-2350-b710-basin-20261014.glb',
  expectedSize: 3602032,
  expectedSha256: '7da6b1e6ada391556ca3600346f1586ed2507ac86b4e489cb689e6e6cd11de71',
} as const satisfies PrivateWorkTestCandidate;

const D1F_FINISHED_FACE_2360_CANDIDATE = {
  id: 'd1f-finished-face-2360-wall-basin-20261014',
  label: 'D1F - 2360 mm valmispinnat ja allastaso - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/d1f-finished-face-2360-wall-basin-20261014.glb`,
  objectKey: 'work-test/d1f-finished-face-2360-wall-basin-20261014.glb',
  expectedSize: 3654796,
  expectedSha256: '826633aba10b590935dc029358b1233957ab37ee7e167a5adfdab713617d8523',
} as const satisfies PrivateWorkTestCandidate;

const D1F_FOUR_REVIEW_CORRECTIONS_CANDIDATE = {
  id: 'd1f-four-review-corrections-20261014',
  label: 'D1F - katselmuksen neljä korjausta - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/d1f-four-review-corrections-20261014.glb`,
  objectKey: 'work-test/d1f-four-review-corrections-20261014.glb',
  expectedSize: 3725836,
  expectedSha256: '9184920f910dca957f70aaba70774e47880c794a14c6156c451f7fa45a917824',
} as const satisfies PrivateWorkTestCandidate;

const D1F_BATHROOM_SURFACES_CANDIDATE = {
  id: 'd1f-bathroom-surfaces-cabinet-20261015',
  label: 'D1F - kylpyhuoneen pinnat ja laatikosto - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/d1f-bathroom-surfaces-cabinet-20261015.glb`,
  objectKey: 'work-test/d1f-bathroom-surfaces-cabinet-20261015.glb',
  expectedSize: 5568028,
  expectedSha256: '330dd1fdd0476f2fc323b69fe8a09a15359d0f50381a91f32aa0b1a04d10b256',
} as const satisfies PrivateWorkTestCandidate;

const D1F_WC_THEMO_CANDIDATE = {
  id: 'd1f-wc-enclosure-themos-20261015',
  label: 'D1F - wc:n koteloseinä ja Themot - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/d1f-wc-enclosure-themos-20261015.glb`,
  objectKey: 'work-test/d1f-wc-enclosure-themos-20261015.glb',
  expectedSize: 6823992,
  expectedSha256: '58996e56efbcfa6900e668ebb31d76d05fa7c7e4b95a285f629b49189d3bc4e3',
} as const satisfies PrivateWorkTestCandidate;

const D1F_SERVICE_CANDIDATE = {
  id: 'd1f-bathroom-service-heating-20261015',
  label: 'D1F - kylpyhuone, huolto ja lattialämmitys - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/d1f-bathroom-service-heating-20261015.glb`,
  objectKey: 'work-test/d1f-bathroom-service-heating-20261015.glb',
  expectedSize: D1F_SERVICE_PREVIOUS.asset.bytes,
  expectedSha256: D1F_SERVICE_PREVIOUS.asset.sha256,
} as const satisfies PrivateWorkTestCandidate;

const D1F_WC3530_CENTERED_CANDIDATE = {
  id: 'd1f-wc-nordic3530-centered-20261016',
  label: 'D1F - WC Nordic³ 3530 keskitetty - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/d1f-wc-nordic3530-centered-20261016.glb`,
  objectKey: 'work-test/d1f-wc-nordic3530-centered-20261016.glb',
  expectedSize: D1F_SERVICE_CENTERED.asset.bytes,
  expectedSha256: D1F_SERVICE_CENTERED.asset.sha256,
} as const satisfies PrivateWorkTestCandidate;

const D1F_WC450_CLOSED_CANDIDATE = {
  id: 'd1f-wc-closed-lid-450-20261016',
  label: 'D1F - WC Nordic³ 3530, kansi 450 mm - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/d1f-wc-closed-lid-450-20261016.glb`,
  objectKey: 'work-test/d1f-wc-closed-lid-450-20261016.glb',
  expectedSize: D1F_SERVICE_CLOSED_LID_450.asset.bytes,
  expectedSha256: D1F_SERVICE_CLOSED_LID_450.asset.sha256,
} as const satisfies PrivateWorkTestCandidate;

const D1F_WC450_SURFACE_FIX_CANDIDATE = {
  id: 'd1f-wc-closed-lid-450-surface-fix-20261017',
  label: 'D1F - WC Nordic³ 3530, korjattu kansi 450 mm - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/d1f-wc-closed-lid-450-surface-fix-20261017.glb`,
  objectKey: 'work-test/d1f-wc-closed-lid-450-surface-fix-20261017.glb',
  expectedSize: D1F_SERVICE_ASSET.bytes,
  expectedSha256: D1F_SERVICE_ASSET.sha256,
} as const satisfies PrivateWorkTestCandidate;

// Source-bound, noncanonical 124-scene photo + curved shower glass; no human review or CURRENT promotion.
// Exact read-only ODENSVIK 001.939.37 bowl + integrated countertop successor.
// Product-shape WORK_TEST only; the measured counter outline and accepted WC remain unchanged.
const D1F_ODENSVIK_BASIN_CORRECTION_CANDIDATE = {
  id: 'd1f-odensvik-00193937-basin-correction-20261017',
  label: 'D1F - IKEA ODENSVIK 001.939.37 allas ja taso - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/d1f-odensvik-00193937-basin-correction-20261017.glb`,
  objectKey: 'work-test/d1f-odensvik-00193937-basin-correction-20261017.glb',
  expectedSize: 8876156,
  expectedSha256: '362f5dce1041e8f529ed8f69a10d06dad58b59d8bfad0fe9db31c62d870f2e25',
} as const satisfies PrivateWorkTestCandidate;

// Exact G2b source-corrected ODENSVIK successor: 104 counter side-face
// winding repairs. The ZIP has exactly one glTF2 GLB; enforce the inner GLB
// bytes/hash, never the ZIP hash. It preserves the original 40 source semantic
// pointers in scenes 108..111 and previews NEW corrected scene112 by default.
// This is a distinct noncanonical WORK_TEST candidate, NOT a replacement for
// the formal old-source 40-pointer viewer review or any human approval.
const D1F_ODENSVIK_WINDING_CORRECTED_ZIP_CANDIDATE = {
  id: 'd1f-odensvik-00193937-counter-winding-fixed-20261018',
  label: 'D1F - IKEA ODENSVIK 001.939.37 tasopinnat korjattu - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/d1f-odensvik-00193937-counter-winding-fixed-20261018.glb`,
  objectKey: 'work-test/d1f-odensvik-00193937-counter-winding-fixed-20261018.glb',
  expectedSize: 8899324,
  expectedSha256: 'e9cbdd7dbebeab78d57939f8758c5cb467f481d79f6bb1550f5e35f09344a1bb',
} as const satisfies PrivateWorkTestCandidate;

// Source-verified merged D1F KPH 01+02+04 WORK_TEST only: square drains,
// shower chrome details, 65 mm riser continuity and basin faucet. The source
// is a Drive ZIP with ONE raw GLB; expected bytes/hash refer to that GLB,
// never to the ZIP. This candidate is NOT current/as-built or human approved.
const D1F_KPH_010204_ZIP_CANDIDATE = {
  id: 'd1f-kph-010204-square-drains-shower-faucet-20261018',
  label: 'D1F KPH - neliökaivot, suihkut ja hanat - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/d1f-kph-010204-square-drains-shower-faucet-20261018.glb`,
  objectKey: 'work-test/d1f-kph-010204-square-drains-shower-faucet-20261018.glb',
  expectedSize: 9042688,
  expectedSha256: '01ff6b883e3aeeb291261f7dfb6e17a89e61e3b913e6b30766a157cb07bb2f7c',
} as const satisfies PrivateWorkTestCandidate;

const D1F_SHOWER_PHOTO_CANDIDATE = {
  id: 'd1f-shower-glass-photo-20261016',
  label: 'D1F - kaareva suihkulasi 900x900 ja laattapinnat - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/d1f-shower-glass-photo-20261016.glb`,
  objectKey: 'work-test/d1f-shower-glass-photo-20261016.glb',
  expectedSize: D1F_SHOWER_PHOTO_SOURCE.bytes,
  expectedSha256: D1F_SHOWER_PHOTO_SOURCE.sha256,
} as const satisfies PrivateWorkTestCandidate;

// Noncanonical source156 D1F room with user-correct Bosch-left, U-sauna,
// two photo-derived shower pulls, white shelf and user-measured 305 mm mirror
// separation CONDITIONALLY modeled from an unverified sauna-wall reference.
// Optional scene157 retains historical HELMI six lights and photo tile marks,
// never asserts installed count/geometry. Exact source-bound WORK_TEST only;
// current physical XY, tiles, shelf fit and heater clearance remain UNKNOWN.
// No CURRENT/canonical/asBuilt/HUMAN_REVIEW promotion.
const D1F_SCENE156_SOURCE_ROOM_WORK_TEST_CANDIDATE = {
  id: 'd1f-source156-mirror305-k2-oak-u-two-pulls-20261018',
  label: 'D1F source156 - K2, U-sauna, 2 vedintä, hylly, ehdollinen peili305 - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/d1f-source156-mirror305-k2-oak-u-two-pulls-20261018.glb`,
  objectKey: 'work-test/d1f-source156-mirror305-k2-oak-u-two-pulls-20261018.glb',
  expectedSize: 9792656,
  expectedSha256: '14eed1eff91785682ac7d5c7cd0e9dec6b2ba053f41f539242e2ab120a29af51',
} as const satisfies PrivateWorkTestCandidate;

// Presentation-only SOURCE156 source-preserving seven per-target perspective camera
// scenes158..164, each with reversible wall2448 cutaway. Default scene156
// and all original nodes/meshes/BIN remain unchanged. Existing ZIP on G2b
// is immutable source; expectedSize/hash bind to its ONLY contained real GLB.
// No source geometry, CURRENT, canonical, as-built or HUMAN_REVIEW promotion.
const D1F_SOURCE156_SEVEN_CAMERA_CUTAWAY_CANDIDATE = {
  id: 'd1f-source156-seven-camera-cutaway-20261019',
  label: 'D1F source156 - seitsemän kohdenäkymää ja esityksellinen seinän piilotus - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/d1f-source156-seven-camera-cutaway-20261019.glb`,
  objectKey: 'work-test/d1f-source156-seven-camera-cutaway-20261019.glb',
  expectedSize: 9919356,
  expectedSha256: '68318b8d41b7919f0afde842ca9d311d8612e2173ded5374c6cb76f118491782',
} as const satisfies PrivateWorkTestCandidate;

// Noncanonical combined source156 successor from exact G2b, default source156 intact.
// Optional scenes165..174: seven original cameras, visual floor v02 (pitch
// assumed 100mm / 104mm unresolved), and three unmeasured KPH07 B face
// offset alternatives (+/-25mm). Presentation-only WORK_TEST, never as-built.
const D1F_SOURCE156_FLOOR_V02_B_SEVEN_CAMERA_CANDIDATE = {
  id: 'd1f-source156-floor-v02-b-seven-cameras-20261019',
  label: 'D1F source156 - 7 kameraa, lattia v02 ja 3 B-oviaukkovaihtoehtoa - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/d1f-source156-floor-v02-b-seven-cameras-20261019.glb`,
  objectKey: 'work-test/d1f-source156-floor-v02-b-seven-cameras-20261019.glb',
  expectedSize: 10112304,
  expectedSha256: 'a3ab1928ec415678b026513e95e88278b8983ff56b547a071186a63dbf1f6757',
} as const satisfies PrivateWorkTestCandidate;

// PoC 19.10.2026: SHARED300 scene299 (sauna U + PC90, two sauna windows, 2 IV,
// 2 drains, M5A/M5B) extracted verbatim as the GLB's ONLY/default scene, so the
// generic viewer path (gltf.scene) shows it with no scene selector. Geometry
// bytes identical to source scene299 (737 primitives, verified digest).
// Source: Drive 1M7UGzi5hE1Ng5RZRMftXUdmcmsgr-AvK; publish-work-test extracts
// scene 299 itself (registry extractScene). WORK_TEST, never as-built.
const SHARED300_SCENE299_DEFAULT_CANDIDATE = {
  id: 'shared300-sauna-windows-scene299-default-20261019',
  label: 'Yhteismalli 300 - sauna, 2 ikkunaa, IV, kaivot (scene299 oletuksena) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/shared300-sauna-windows-scene299-default-20261019.glb`,
  objectKey: 'work-test/shared300-sauna-windows-scene299-default-20261019.glb',
  expectedSize: 1754724,
  expectedSha256: '9da91ef4a972e0c16c919d092e2768f338ae4861a161afc05d991adc3286c60a',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-19 from Drive queue file 1ONonk83k_sVz5G42Ggq10ZJdgn_lnf5d
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_LINJASTOTESTI_SHARED300_SAUNA_1ONONK83_CANDIDATE = {
  id: 'auto-linjastotesti-shared300-sauna-1ononk83',
  label: 'Auto: LINJASTOTESTI SHARED300 sauna (scene299) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-linjastotesti-shared300-sauna-1ononk83.glb`,
  objectKey: 'work-test/auto-linjastotesti-shared300-sauna-1ononk83.glb',
  expectedSize: 1754724,
  expectedSha256: '9da91ef4a972e0c16c919d092e2768f338ae4861a161afc05d991adc3286c60a',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-19 from Drive queue file 1qLW0IOGP50y-WMHco9dIjsJoQDKtH4Sl
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_KOKO_RAKENNUS_T12_TONTTIRAJA_KATTOLUUKKU1985_WORK_TEST_20261019_1QLW0IOG_CANDIDATE = {
  id: 'auto-ylisrinne-koko-rakennus-t12-tonttiraja-kattoluukku1985-work-test-20261019-1qlw0iog',
  label: 'Auto: Ylisrinne KOKO RAKENNUS T12 tonttiraja kattoluukku1985 WORK TEST 20261019 (scene63) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-koko-rakennus-t12-tonttiraja-kattoluukku1985-work-test-20261019-1qlw0iog.glb`,
  objectKey: 'work-test/auto-ylisrinne-koko-rakennus-t12-tonttiraja-kattoluukku1985-work-test-20261019-1qlw0iog.glb',
  expectedSize: 1449896,
  expectedSha256: '9ac546d1eb7842f9afc66486d4aff406317e0c4675b8cae1f00c12507355c8f6',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-19 from Drive queue file 1wVoUCZRUZFtv34yL0XdP0GOV3oCwRyAu
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SALAOJAT_KOKO_JARJESTELMA_LOPPUKATSELMUS_WORK_TEST_20261020_1WVOUCZR_CANDIDATE = {
  id: 'auto-ylisrinne-salaojat-koko-jarjestelma-loppukatselmus-work-test-20261020-1wvouczr',
  label: 'Auto: Ylisrinne SALAOJAT KOKO JARJESTELMA LOPPUKATSELMUS WORK TEST 20261020 - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-salaojat-koko-jarjestelma-loppukatselmus-work-test-20261020-1wvouczr.glb`,
  objectKey: 'work-test/auto-ylisrinne-salaojat-koko-jarjestelma-loppukatselmus-work-test-20261020-1wvouczr.glb',
  expectedSize: 911532,
  expectedSha256: '4023df3c712245484635acac64dd020691ebd27756f928c5a88936f269b45c99',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-19 from Drive queue file 1i7yH3uNvKfLpJmKqsRukpHreUDHifgsb
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D1F_KPH09_THEMO_KYTKINLINJA_WORK_TEST_SOURCE68_20261019_1I7YH3UN_CANDIDATE = {
  id: 'auto-ylisrinne-d1f-kph09-themo-kytkinlinja-work-test-source68-20261019-1i7yh3un',
  label: 'Auto: Ylisrinne D1F KPH09 THEMO KYTKINLINJA WORK TEST SOURCE68 20261019 (scene68) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d1f-kph09-themo-kytkinlinja-work-test-source68-20261019-1i7yh3un.glb`,
  objectKey: 'work-test/auto-ylisrinne-d1f-kph09-themo-kytkinlinja-work-test-source68-20261019-1i7yh3un.glb',
  expectedSize: 45028,
  expectedSha256: 'ae65fab043f4662926dc3b72fdb85d9e315a824b2074e5a3e339dd06c768ab40',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-20 from Drive queue file 1ECb-CHk91Hrqlm_y9vQLbyvQscxaJXqk
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D1F_KPH09_KEINU_JA_KIERTO_WORK_TEST_20261020_1ECBCHK9_CANDIDATE = {
  id: 'auto-ylisrinne-d1f-kph09-keinu-ja-kierto-work-test-20261020-1ecbchk9',
  label: 'Auto: Ylisrinne D1F KPH09 KEINU JA KIERTO WORK TEST 20261020 (scene69) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d1f-kph09-keinu-ja-kierto-work-test-20261020-1ecbchk9.glb`,
  objectKey: 'work-test/auto-ylisrinne-d1f-kph09-keinu-ja-kierto-work-test-20261020-1ecbchk9.glb',
  expectedSize: 122452,
  expectedSha256: '0f8388e98717baeef3bad9f2e2f9a8c32b8e312bf3488250e4c17382cacf3b02',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-20 from Drive queue file 1dyf7YBK0_cn0FQ6k001MjlZXG-zuYlDv
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SHARED301_KPH09_ROCKER_ROTARY_USER_TOP1020_WORK_TEST_20261020_1DYF7YBK_CANDIDATE = {
  id: 'auto-ylisrinne-shared301-kph09-rocker-rotary-user-top1020-work-test-20261020-1dyf7ybk',
  label: 'Auto: Ylisrinne SHARED301 KPH09 rocker rotary user top1020 WORK TEST 20261020 (scene300) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-shared301-kph09-rocker-rotary-user-top1020-work-test-20261020-1dyf7ybk.glb`,
  objectKey: 'work-test/auto-ylisrinne-shared301-kph09-rocker-rotary-user-top1020-work-test-20261020-1dyf7ybk.glb',
  expectedSize: 1763244,
  expectedSha256: 'f6fe60721af16b478b40452ac89207c71ac980023990aace8d5bda2d204d25d7',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-20 from Drive queue file 1hiDRKmiwITXCUQHVnyRODgjC6mjHRXdh
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SHARED302_KPH09_PHOTO_PROPORTIONS_WORK_TEST_20261020_1HIDRKMI_CANDIDATE = {
  id: 'auto-ylisrinne-shared302-kph09-photo-proportions-work-test-20261020-1hidrkmi',
  label: 'Auto: Ylisrinne SHARED302 KPH09 photo proportions WORK TEST 20261020 (scene301) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-shared302-kph09-photo-proportions-work-test-20261020-1hidrkmi.glb`,
  objectKey: 'work-test/auto-ylisrinne-shared302-kph09-photo-proportions-work-test-20261020-1hidrkmi.glb',
  expectedSize: 1792816,
  expectedSha256: '94ce14fe308a1591db31a72a0db01f5fdcb125865c95d117377fd9f7d1f4d6dd',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-20 from Drive queue file 1UPlDDRwI3-s4TWOJoVvBtt90DgbJ6MX4
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2015_SAHKO_RYHMAT_JA_ERIKOISMERKINNAT_P186E_X1_WORK_TEST_20261020_1UPLDDRW_CANDIDATE = {
  id: 'auto-ylisrinne-d2015-sahko-ryhmat-ja-erikoismerkinnat-p186e-x1-work-test-20261020-1uplddrw',
  label: 'Auto: Ylisrinne D2015 SAHKO RYHMAT JA ERIKOISMERKINNAT P186E X1 WORK TEST 20261020 (scene64) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2015-sahko-ryhmat-ja-erikoismerkinnat-p186e-x1-work-test-20261020-1uplddrw.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2015-sahko-ryhmat-ja-erikoismerkinnat-p186e-x1-work-test-20261020-1uplddrw.glb',
  expectedSize: 1699408,
  expectedSha256: 'd73ba921b05bad28bc482be61bbe5be71e03d3abe6de77c95014de88c5e44cd4',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-20 from Drive queue file 1yEtnbQuRY1ezbKRCy-gld0n9UXxcc4g-
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SALAOJAT_RING_R2_KAIVOT_KULMISSA_PVK_D500_WORK_TEST_20261020_1YETNBQU_CANDIDATE = {
  id: 'auto-ylisrinne-salaojat-ring-r2-kaivot-kulmissa-pvk-d500-work-test-20261020-1yetnbqu',
  label: 'Auto: Ylisrinne SALAOJAT RING R2 KAIVOT KULMISSA PVK D500 WORK TEST 20261020 (scene1) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-salaojat-ring-r2-kaivot-kulmissa-pvk-d500-work-test-20261020-1yetnbqu.glb`,
  objectKey: 'work-test/auto-ylisrinne-salaojat-ring-r2-kaivot-kulmissa-pvk-d500-work-test-20261020-1yetnbqu.glb',
  expectedSize: 843296,
  expectedSha256: '2c089c20ff548e82e3202a358fab6e497f6c0f0e7e9fbfc237ba5f86955fd08b',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-20 from Drive queue file 1TVd8-o38QYyOWTQEveXNIps6MaD9uVPX
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2015_LATTIALAMMITYS_KAAPELIT_ABC_P186C_X2R_WORK_TEST_20261020_1TVD8O38_CANDIDATE = {
  id: 'auto-ylisrinne-d2015-lattialammitys-kaapelit-abc-p186c-x2r-work-test-20261020-1tvd8o38',
  label: 'Auto: Ylisrinne D2015 LATTIALAMMITYS KAAPELIT ABC P186C X2R WORK TEST 20261020 - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2015-lattialammitys-kaapelit-abc-p186c-x2r-work-test-20261020-1tvd8o38.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2015-lattialammitys-kaapelit-abc-p186c-x2r-work-test-20261020-1tvd8o38.glb',
  expectedSize: 3190212,
  expectedSha256: '47ab3668fe2b722570216b4b749611b2a6f5f8bd9b157fc91d88ae73bdf34272',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-20 from Drive queue file 1YOvlX2V1BTyTQjMXG01yyW3mjYoJ1-9R
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D_TERASSI_WORK_TEST_20261020_1YOVLX2V_CANDIDATE = {
  id: 'auto-ylisrinne-d-terassi-work-test-20261020-1yovlx2v',
  label: 'Auto: Ylisrinne D TERASSI WORK TEST 20261020 (scene300) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d-terassi-work-test-20261020-1yovlx2v.glb`,
  objectKey: 'work-test/auto-ylisrinne-d-terassi-work-test-20261020-1yovlx2v.glb',
  expectedSize: 1629380,
  expectedSha256: '3973db8ac654a33581ba57453dff366278dc0bbdb58c7162c11785b33cc43d80',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-21 from Drive queue file 1L_TfR1LYWzC4o4uZUwJF_qS7icwyO1_A
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2015_P186E_X1_ERILLISVIENTI_WORK_TEST_20261021_1LTFR1LY_CANDIDATE = {
  id: 'auto-ylisrinne-d2015-p186e-x1-erillisvienti-work-test-20261021-1ltfr1ly',
  label: 'Auto: Ylisrinne D2015 P186E X1 ERILLISVIENTI WORK TEST 20261021 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2015-p186e-x1-erillisvienti-work-test-20261021-1ltfr1ly.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2015-p186e-x1-erillisvienti-work-test-20261021-1ltfr1ly.glb',
  expectedSize: 1700608,
  expectedSha256: 'd09cb8dbd253a23adada353490379e8fdd83be4babb53f6f72741b3da7165346',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-21 from Drive queue file 1sNJ66tNEmKtV2pIJQVdYywD_ZWtq32bm
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SHARED302_GLTF_RAKENNEKORJAUS_WORK_TEST_20261021_1SNJ66TN_CANDIDATE = {
  id: 'auto-ylisrinne-shared302-gltf-rakennekorjaus-work-test-20261021-1snj66tn',
  label: 'Auto: Ylisrinne SHARED302 GLTF RAKENNEKORJAUS WORK TEST 20261021 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-shared302-gltf-rakennekorjaus-work-test-20261021-1snj66tn.glb`,
  objectKey: 'work-test/auto-ylisrinne-shared302-gltf-rakennekorjaus-work-test-20261021-1snj66tn.glb',
  expectedSize: 1802568,
  expectedSha256: '04da121a089dba6df8ea9229edb92ed3e10d72bc9b53a427f29b06a232b0c6b1',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-21 from Drive queue file 1JzKNHgqHBtQGfG4-0-rJKh04rTjj3EmG
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2015_D2F_SOURCELINKS_WORK_TEST_20261021_1JZKNHGQ_CANDIDATE = {
  id: 'auto-ylisrinne-d2015-d2f-sourcelinks-work-test-20261021-1jzknhgq',
  label: 'Auto: Ylisrinne D2015 D2F sourceLinks WORK TEST 20261021 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2015-d2f-sourcelinks-work-test-20261021-1jzknhgq.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2015-d2f-sourcelinks-work-test-20261021-1jzknhgq.glb',
  expectedSize: 1709536,
  expectedSha256: 'cf0f55c1a9b4d9b5747a5981b317634096d15dc1b3485ee7bb07f195d7ef943f',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-21 from Drive queue file 15zEaBSUD86glDS4Ik0mHA-Oq2jF7ySMS
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SHARED302_KPH09_LASIKAARI_RITILAT_KYTKINKEHYS_WORK_TEST_20261021_15ZEABSU_CANDIDATE = {
  id: 'auto-ylisrinne-shared302-kph09-lasikaari-ritilat-kytkinkehys-work-test-20261021-15zeabsu',
  label: 'Auto: Ylisrinne SHARED302 KPH09 lasikaari ritilat kytkinkehys WORK TEST 20261021 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-shared302-kph09-lasikaari-ritilat-kytkinkehys-work-test-20261021-15zeabsu.glb`,
  objectKey: 'work-test/auto-ylisrinne-shared302-kph09-lasikaari-ritilat-kytkinkehys-work-test-20261021-15zeabsu.glb',
  expectedSize: 1834120,
  expectedSha256: 'd533ca18e16d16e0e1f7bb5b7dc37119f92f082511461160de2552f81157eec3',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-21 from Drive queue file 10yZxIpu_YSxJYUSCbjsDY1reb4i1civq
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SALAOJAT_RING_R2_SOURCELINKS_WORK_TEST_20261021_10YZXIPU_CANDIDATE = {
  id: 'auto-ylisrinne-salaojat-ring-r2-sourcelinks-work-test-20261021-10yzxipu',
  label: 'Auto: Ylisrinne SALAOJAT RING R2 SOURCELINKS WORK TEST 20261021 (scene1) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-salaojat-ring-r2-sourcelinks-work-test-20261021-10yzxipu.glb`,
  objectKey: 'work-test/auto-ylisrinne-salaojat-ring-r2-sourcelinks-work-test-20261021-10yzxipu.glb',
  expectedSize: 847988,
  expectedSha256: '6ecb6c9be1c128af90bf7ea3a2ddf33b2179a6811b28333057094e40d490e9e2',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-21 from Drive queue file 1vCG9VUEtoI3uwShlzMIulvsYdN0jcESj
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D_TERASSI_SOURCELINKS_WORK_TEST_20261021_1VCG9VUE_CANDIDATE = {
  id: 'auto-ylisrinne-d-terassi-sourcelinks-work-test-20261021-1vcg9vue',
  label: 'Auto: Ylisrinne D TERASSI sourceLinks WORK TEST 20261021 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d-terassi-sourcelinks-work-test-20261021-1vcg9vue.glb`,
  objectKey: 'work-test/auto-ylisrinne-d-terassi-sourcelinks-work-test-20261021-1vcg9vue.glb',
  expectedSize: 1678324,
  expectedSha256: '16f14507b32474d2739b86117c2675e348492b4e2b43137ccfa9a15df173ab94',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-21 from Drive queue file 1AaD4L-4SGxAe4Dss2cHKwRurtED-6rVV
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_VALOAUKOT_SOURCELINKS8_WORK_TEST_20261021_1AAD4L4S_CANDIDATE = {
  id: 'auto-ylisrinne-t12-valoaukot-sourcelinks8-work-test-20261021-1aad4l4s',
  label: 'Auto: Ylisrinne T12 valoaukot sourceLinks8 WORK TEST 20261021 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-valoaukot-sourcelinks8-work-test-20261021-1aad4l4s.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-valoaukot-sourcelinks8-work-test-20261021-1aad4l4s.glb',
  expectedSize: 1460584,
  expectedSha256: '637195039b01cd6d6342c8b518aa39ae104015fb919ff9abdfbbee853ea6c70d',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-21 from Drive queue file 1KDUbcHtiMH82SQf118bGWldo_wQccRAW
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_AC_TILATOPOLOGIA36_WORK_TEST_20261021_1KDUBCHT_CANDIDATE = {
  id: 'auto-ylisrinne-t12-ac-tilatopologia36-work-test-20261021-1kdubcht',
  label: 'Auto: Ylisrinne T12 AC tilatopologia36 WORK TEST 20261021 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-ac-tilatopologia36-work-test-20261021-1kdubcht.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-ac-tilatopologia36-work-test-20261021-1kdubcht.glb',
  expectedSize: 1500224,
  expectedSha256: 'c69a3042cee586dfc4fe83ead104d366c653b7f44ba78016e90ba853a4ca2cf2',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-21 from Drive queue file 1L9NlrvNzOYYbVehItgq5VFifB5hx00aB
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SHARED302_KPH09_M5B_SOK_KULMAT_SOURCELINKS_WORK_TEST_20261021_1L9NLRVN_CANDIDATE = {
  id: 'auto-ylisrinne-shared302-kph09-m5b-sok-kulmat-sourcelinks-work-test-20261021-1l9nlrvn',
  label: 'Auto: Ylisrinne SHARED302 KPH09 M5B SOK kulmat sourceLinks WORK TEST 20261021 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-shared302-kph09-m5b-sok-kulmat-sourcelinks-work-test-20261021-1l9nlrvn.glb`,
  objectKey: 'work-test/auto-ylisrinne-shared302-kph09-m5b-sok-kulmat-sourcelinks-work-test-20261021-1l9nlrvn.glb',
  expectedSize: 1834724,
  expectedSha256: '671a7007b0a83150da91fb8eb83efea7a9474874349b0088492ce7e9826b909c',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-21 from Drive queue file 1nEXuOHVREQcWULGST8SsXgOOkoVMT_m2
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SALAOJAT_RING_R2_BOUNDARY_MARKERS_SOURCELINKS_WORK_TEST_20261021_1NEXUOHV_CANDIDATE = {
  id: 'auto-ylisrinne-salaojat-ring-r2-boundary-markers-sourcelinks-work-test-20261021-1nexuohv',
  label: 'Auto: Ylisrinne SALAOJAT RING R2 BOUNDARY MARKERS SOURCELINKS WORK TEST 20261021 (scene1) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-salaojat-ring-r2-boundary-markers-sourcelinks-work-test-20261021-1nexuohv.glb`,
  objectKey: 'work-test/auto-ylisrinne-salaojat-ring-r2-boundary-markers-sourcelinks-work-test-20261021-1nexuohv.glb',
  expectedSize: 849768,
  expectedSha256: 'a404cd21ea229f49b196213bc43cd77478a33eb656b38508a759a315eff124cb',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-21 from Drive queue file 1whVaUwZduxVDg42EMy2XnUDSswgR82s3
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SHARED302_PEILIKAAPPI_SOURCELINKS15_WORK_TEST_20261021_1WHVAUWZ_CANDIDATE = {
  id: 'auto-ylisrinne-shared302-peilikaappi-sourcelinks15-work-test-20261021-1whvauwz',
  label: 'Auto: Ylisrinne SHARED302 peilikaappi sourceLinks15 WORK TEST 20261021 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-shared302-peilikaappi-sourcelinks15-work-test-20261021-1whvauwz.glb`,
  objectKey: 'work-test/auto-ylisrinne-shared302-peilikaappi-sourcelinks15-work-test-20261021-1whvauwz.glb',
  expectedSize: 1802244,
  expectedSha256: 'ab4b32355291b6dcb52353d8ba1523d8197ae8ee5959873efaa85a673a9c041e',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-21 from Drive queue file 1z6J7hrV-xt4dburgqWume2f2i8rhunp3
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SHARED302_PEILIKAAPPI_SEINALAHDE_WORK_TEST_20261021_1Z6J7HRV_CANDIDATE = {
  id: 'auto-ylisrinne-shared302-peilikaappi-seinalahde-work-test-20261021-1z6j7hrv',
  label: 'Auto: Ylisrinne SHARED302 peilikaappi seinalahde WORK TEST 20261021 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-shared302-peilikaappi-seinalahde-work-test-20261021-1z6j7hrv.glb`,
  objectKey: 'work-test/auto-ylisrinne-shared302-peilikaappi-seinalahde-work-test-20261021-1z6j7hrv.glb',
  expectedSize: 1804964,
  expectedSha256: '31ea3d5376cd7fd9b753392bcb9ef7078ad7daeec19e09083722cf35bba1d122',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-21 from Drive queue file 184mV2hzawCkaZOYYxrvNJAChjKUM02G5
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2015_IV_P145A_SOURCELINKS_WORK_TEST_20261021_184MV2HZ_CANDIDATE = {
  id: 'auto-ylisrinne-d2015-iv-p145a-sourcelinks-work-test-20261021-184mv2hz',
  label: 'Auto: Ylisrinne D2015 IV P145A sourceLinks WORK TEST 20261021 (scene35) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2015-iv-p145a-sourcelinks-work-test-20261021-184mv2hz.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2015-iv-p145a-sourcelinks-work-test-20261021-184mv2hz.glb',
  expectedSize: 776376,
  expectedSha256: 'd54c86126650dd2b9a62b8079704d15e4eefd32d7551e2f1665764cee3dedcf8',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-21 from Drive queue file 1BV68sDQUI-0KAVkfxvOvjWICi6Phk7yX
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SHARED302_PEILIKAAPPI_SISAINEN_SEINAVIITE_WORK_TEST_20261021_1BV68SDQ_CANDIDATE = {
  id: 'auto-ylisrinne-shared302-peilikaappi-sisainen-seinaviite-work-test-20261021-1bv68sdq',
  label: 'Auto: Ylisrinne SHARED302 peilikaappi sisainen seinaviite WORK TEST 20261021 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-shared302-peilikaappi-sisainen-seinaviite-work-test-20261021-1bv68sdq.glb`,
  objectKey: 'work-test/auto-ylisrinne-shared302-peilikaappi-sisainen-seinaviite-work-test-20261021-1bv68sdq.glb',
  expectedSize: 56028,
  expectedSha256: '12ee5949f854a6021ca27b8ce38b74fb8e7ace54efc0a3e2c30884d60acfe8e4',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-21 from Drive queue file 11O4zcXXoRx4S-oceCQuuwDupUwUYyBLj
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SHARED302_KPH09_NORDIC3_3530_WC_KOMPONENTTI_WORK_TEST_20261022_11O4ZCXX_CANDIDATE = {
  id: 'auto-ylisrinne-shared302-kph09-nordic3-3530-wc-komponentti-work-test-20261022-11o4zcxx',
  label: 'Auto: Ylisrinne SHARED302 KPH09 Nordic3 3530 WC komponentti WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-shared302-kph09-nordic3-3530-wc-komponentti-work-test-20261022-11o4zcxx.glb`,
  objectKey: 'work-test/auto-ylisrinne-shared302-kph09-nordic3-3530-wc-komponentti-work-test-20261022-11o4zcxx.glb',
  expectedSize: 1861780,
  expectedSha256: 'cd7faacfb666e4f3c2c384722af9832f5225fb126070ec46f3389401146d0bff',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-21 from Drive queue file 1bOvc16koTpbPwHImNiTgAbnPZ2h8tS-d
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SHARED302_KPH09_NORDIC3_3530_WC_V2_WORK_TEST_20261022_1BOVC16K_CANDIDATE = {
  id: 'auto-ylisrinne-shared302-kph09-nordic3-3530-wc-v2-work-test-20261022-1bovc16k',
  label: 'Auto: Ylisrinne SHARED302 KPH09 Nordic3 3530 WC v2 WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-shared302-kph09-nordic3-3530-wc-v2-work-test-20261022-1bovc16k.glb`,
  objectKey: 'work-test/auto-ylisrinne-shared302-kph09-nordic3-3530-wc-v2-work-test-20261022-1bovc16k.glb',
  expectedSize: 1892624,
  expectedSha256: '5ac167ba3278a23eb76f32ea73c5d7ec33c24c6a0027234f0182b667b072d7aa',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-21 from Drive queue file 1MOWkPIT_bGw7K9Lm_2p4kzsF2zGEmb4K
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SHARED302_KPH09_IV_KATTOLIITOS_WORK_TEST_20261022_1MOWKPIT_CANDIDATE = {
  id: 'auto-ylisrinne-shared302-kph09-iv-kattoliitos-work-test-20261022-1mowkpit',
  label: 'Auto: Ylisrinne SHARED302 KPH09 IV kattoliitos WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-shared302-kph09-iv-kattoliitos-work-test-20261022-1mowkpit.glb`,
  objectKey: 'work-test/auto-ylisrinne-shared302-kph09-iv-kattoliitos-work-test-20261022-1mowkpit.glb',
  expectedSize: 1910768,
  expectedSha256: '267c4b79d01d812d85ca8039580631d306a4d56fe08143dc842eb6e818ef6f75',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-21 from Drive queue file 1X3wVdJSzLa9lU4i_65K9JtjiegDj7lts
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SHARED302_KPH09_LASIKAARI_SUUNTA_WORK_TEST_20261021_1X3WVDJS_CANDIDATE = {
  id: 'auto-ylisrinne-shared302-kph09-lasikaari-suunta-work-test-20261021-1x3wvdjs',
  label: 'Auto: Ylisrinne SHARED302 KPH09 lasikaari suunta WORK TEST 20261021 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-shared302-kph09-lasikaari-suunta-work-test-20261021-1x3wvdjs.glb`,
  objectKey: 'work-test/auto-ylisrinne-shared302-kph09-lasikaari-suunta-work-test-20261021-1x3wvdjs.glb',
  expectedSize: 1834896,
  expectedSha256: '5103c176f7072749ed2a2e74c457bd3103ff659419997f57784e21589eefba32',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-21 from Drive queue file 1Eo3afqzaJlccnJnUDpearNPApO3IE-1C
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_G3_2017_KVV_XY_SOURCE_LINES_WORK_TEST_20261022_1EO3AFQZ_CANDIDATE = {
  id: 'auto-ylisrinne-g3-2017-kvv-xy-source-lines-work-test-20261022-1eo3afqz',
  label: 'Auto: Ylisrinne G3 2017 KVV XY SOURCE LINES WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-g3-2017-kvv-xy-source-lines-work-test-20261022-1eo3afqz.glb`,
  objectKey: 'work-test/auto-ylisrinne-g3-2017-kvv-xy-source-lines-work-test-20261022-1eo3afqz.glb',
  expectedSize: 27144,
  expectedSha256: 'ea1794ccb4586dfcb0147482a63a77012fe148e73fd154450bb1dec5fbb35ec7',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-21 from Drive queue file 19OzaJrdgQOr8sKI1CL_4uFM9qH3FT63T
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SHARED302_SOURCELINKS6_METADATA_ONLY_OLD_KPH_GEOMETRY_WORK_TEST_20261022_19OZAJRD_CANDIDATE = {
  id: 'auto-ylisrinne-shared302-sourcelinks6-metadata-only-old-kph-geometry-work-test-20261022-19ozajrd',
  label: 'Auto: Ylisrinne SHARED302 sourceLinks6 METADATA ONLY OLD KPH GEOMETRY WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-shared302-sourcelinks6-metadata-only-old-kph-geometry-work-test-20261022-19ozajrd.glb`,
  objectKey: 'work-test/auto-ylisrinne-shared302-sourcelinks6-metadata-only-old-kph-geometry-work-test-20261022-19ozajrd.glb',
  expectedSize: 1831296,
  expectedSha256: 'c968bdc0b80bb3610f087beb4f3e5b401181b70a8dc07ff17c3fab5cf93d60a0',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-21 from Drive queue file 10LodCsNJebQ7tTwXwRY9c3YY_LOc3hpV
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SHARED302_KPH09_HAVAINTOTILA8_9_SOURCELINKS_WORK_TEST_20261022_10LODCSN_CANDIDATE = {
  id: 'auto-ylisrinne-shared302-kph09-havaintotila8-9-sourcelinks-work-test-20261022-10lodcsn',
  label: 'Auto: Ylisrinne SHARED302 KPH09 havaintotila8 9 sourceLinks WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-shared302-kph09-havaintotila8-9-sourcelinks-work-test-20261022-10lodcsn.glb`,
  objectKey: 'work-test/auto-ylisrinne-shared302-kph09-havaintotila8-9-sourcelinks-work-test-20261022-10lodcsn.glb',
  expectedSize: 1916104,
  expectedSha256: 'e036b01009e93afce159cf8271d3dbc603ca2230fb072172342ec3dfe858e8e5',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1LDxjEYAhwy34D9pEWiQux4j-qW-3LjHA
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2015_P186E_X1_HIERARCHY_ORIG_SCENE64_WORK_TEST_20261021_1LDXJEYA_CANDIDATE = {
  id: 'auto-ylisrinne-d2015-p186e-x1-hierarchy-orig-scene64-work-test-20261021-1ldxjeya',
  label: 'Auto: Ylisrinne D2015 P186E X1 HIERARCHY ORIG SCENE64 WORK TEST 20261021 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2015-p186e-x1-hierarchy-orig-scene64-work-test-20261021-1ldxjeya.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2015-p186e-x1-hierarchy-orig-scene64-work-test-20261021-1ldxjeya.glb',
  expectedSize: 1699404,
  expectedSha256: 'ab9630b88a6ceb46083d87d2a5bb4ee539fb70a727c9d5c4e9033ab6404c4d84',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1tNJfn6mzQBYtp--4F8E29DFoyJI7zfDo
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2015_P186E_X1_SOURCE_LINKS34_ORIG_SCENE64_WORK_TEST_20261022_1TNJFN6M_CANDIDATE = {
  id: 'auto-ylisrinne-d2015-p186e-x1-source-links34-orig-scene64-work-test-20261022-1tnjfn6m',
  label: 'Auto: Ylisrinne D2015 P186E X1 SOURCE LINKS34 ORIG SCENE64 WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2015-p186e-x1-source-links34-orig-scene64-work-test-20261022-1tnjfn6m.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2015-p186e-x1-source-links34-orig-scene64-work-test-20261022-1tnjfn6m.glb',
  expectedSize: 1719116,
  expectedSha256: '1deab150ddce572617c0a5de2f0c9181216560629d301ec2656376a0dfdd3d7d',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1IRVBu_X7luDiEBGl-uN_1_lcaauKKA7g
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SHARED302_KPH09_KYTKINKEHYS_B_MITTAMETADATA_WORK_TEST_20261022_1IRVBUX7_CANDIDATE = {
  id: 'auto-ylisrinne-shared302-kph09-kytkinkehys-b-mittametadata-work-test-20261022-1irvbux7',
  label: 'Auto: Ylisrinne SHARED302 KPH09 kytkinkehys B mittametadata WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-shared302-kph09-kytkinkehys-b-mittametadata-work-test-20261022-1irvbux7.glb`,
  objectKey: 'work-test/auto-ylisrinne-shared302-kph09-kytkinkehys-b-mittametadata-work-test-20261022-1irvbux7.glb',
  expectedSize: 1917064,
  expectedSha256: '8d32e6f2d251adb3f22f784e4f8cf19ac48bdfe7f3babb6febdfc723bbfde054',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1Ppcuqb9nBH5wu815ezftJtN9i8gAvbVf
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SHARED302_KPH09_ALANUPPI_VALOHIMMENNIN_WORK_TEST_20261022_1PPCUQB9_CANDIDATE = {
  id: 'auto-ylisrinne-shared302-kph09-alanuppi-valohimmennin-work-test-20261022-1ppcuqb9',
  label: 'Auto: Ylisrinne SHARED302 KPH09 alanuppi valohimmennin WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-shared302-kph09-alanuppi-valohimmennin-work-test-20261022-1ppcuqb9.glb`,
  objectKey: 'work-test/auto-ylisrinne-shared302-kph09-alanuppi-valohimmennin-work-test-20261022-1ppcuqb9.glb',
  expectedSize: 1918396,
  expectedSha256: 'f188b8ca224e728943703a25edd640ed45dc0f440e3a8ad600d577ac98ac646a',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1saP5z_nngUfg73e3XuivUyc6ccASs5TT
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SHARED302_KPH09_IV1_SISAKATON_AUKOTUS_WORK_TEST_20261022_1SAP5ZNN_CANDIDATE = {
  id: 'auto-ylisrinne-shared302-kph09-iv1-sisakaton-aukotus-work-test-20261022-1sap5znn',
  label: 'Auto: Ylisrinne SHARED302 KPH09 IV1 sisakaton aukotus WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-shared302-kph09-iv1-sisakaton-aukotus-work-test-20261022-1sap5znn.glb`,
  objectKey: 'work-test/auto-ylisrinne-shared302-kph09-iv1-sisakaton-aukotus-work-test-20261022-1sap5znn.glb',
  expectedSize: 1946300,
  expectedSha256: 'a86b1477059b62278f8fb10a48781f152d1cb5f31401abf64975fead6a8f5934',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1Bi7z2nVQM-NMHE7k1Frmdcm7eYv-jsNf
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2F_VK1_PAX_A_WORK_TEST_20261022_1BI7Z2NV_CANDIDATE = {
  id: 'auto-ylisrinne-d2f-vk1-pax-a-work-test-20261022-1bi7z2nv',
  label: 'Auto: Ylisrinne D2F VK1 PAX A WORK TEST 20261022 (scene60) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2f-vk1-pax-a-work-test-20261022-1bi7z2nv.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2f-vk1-pax-a-work-test-20261022-1bi7z2nv.glb',
  expectedSize: 1423464,
  expectedSha256: '32224709f8c56a8af7a34a040352d853a5a6f7b06e13c2fa506af6f42a604569',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 11G28b0JLqK51glj_8uGOFkPujjNg_fY-
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2F_VK1_PAX_B_WORK_TEST_20261022_11G28B0J_CANDIDATE = {
  id: 'auto-ylisrinne-d2f-vk1-pax-b-work-test-20261022-11g28b0j',
  label: 'Auto: Ylisrinne D2F VK1 PAX B WORK TEST 20261022 (scene61) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2f-vk1-pax-b-work-test-20261022-11g28b0j.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2f-vk1-pax-b-work-test-20261022-11g28b0j.glb',
  expectedSize: 1420600,
  expectedSha256: '1a081853db5ea2fbd2c24b1d3c3637c0b223361c9d1189e812c673113bff74f7',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1IxVViTLWDF-FBHlL3whmHXYWq5JRkkUB
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_KATTOLUUKKU_1985_SOURCELINKS_V2_WORK_TEST_20261022_1IXVVITL_CANDIDATE = {
  id: 'auto-ylisrinne-t12-kattoluukku-1985-sourcelinks-v2-work-test-20261022-1ixvvitl',
  label: 'Auto: Ylisrinne T12 KATTOLUUKKU 1985 sourceLinks v2 WORK TEST 20261022 (scene63) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-kattoluukku-1985-sourcelinks-v2-work-test-20261022-1ixvvitl.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-kattoluukku-1985-sourcelinks-v2-work-test-20261022-1ixvvitl.glb',
  expectedSize: 1450388,
  expectedSha256: '34cfe9659e9df97feaee0a5a248271e29f8cf13857ebac3988f824270de468c6',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1sz2jKx7OMUefIjmnCyIE-gMP_Lvspfqf
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SALAOJAT_RING_R2_NW_SUUNNITELMAVIITE_WORK_TEST_20261022_1SZ2JKX7_CANDIDATE = {
  id: 'auto-ylisrinne-salaojat-ring-r2-nw-suunnitelmaviite-work-test-20261022-1sz2jkx7',
  label: 'Auto: Ylisrinne SALAOJAT RING R2 NW suunnitelmaviite WORK TEST 20261022 (scene1) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-salaojat-ring-r2-nw-suunnitelmaviite-work-test-20261022-1sz2jkx7.glb`,
  objectKey: 'work-test/auto-ylisrinne-salaojat-ring-r2-nw-suunnitelmaviite-work-test-20261022-1sz2jkx7.glb',
  expectedSize: 896836,
  expectedSha256: 'a892cc96c33dafd8070e881fa836b56f9530d7cbcb0dc0c066112c224e9fe7ba',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1LW1JpF-MtAcZ4M38SwoNLVuLnYcijCL0
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2F_VK1_PAX15_SOURCELINKS_V2_20261022_1LW1JPFM_CANDIDATE = {
  id: 'auto-ylisrinne-d2f-vk1-pax15-sourcelinks-v2-20261022-1lw1jpfm',
  label: 'Auto: Ylisrinne D2F VK1 PAX15 SourceLinks v2 20261022 (scene60) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2f-vk1-pax15-sourcelinks-v2-20261022-1lw1jpfm.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2f-vk1-pax15-sourcelinks-v2-20261022-1lw1jpfm.glb',
  expectedSize: 1429348,
  expectedSha256: 'e9c68cafa09f7457919c0fa0ac1f98e8ff86450f003c82262a7fd7eaa180bef7',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1IWKei29dZbcbZHj34yEBf9KhRaEO7S8Z
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2F_VK1_PAX15_SOURCELINKS_V2_20261022_1IWKEI29_CANDIDATE = {
  id: 'auto-ylisrinne-d2f-vk1-pax15-sourcelinks-v2-20261022-1iwkei29',
  label: 'Auto: Ylisrinne D2F VK1 PAX15 SourceLinks v2 20261022 (scene61) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2f-vk1-pax15-sourcelinks-v2-20261022-1iwkei29.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2f-vk1-pax15-sourcelinks-v2-20261022-1iwkei29.glb',
  expectedSize: 1425524,
  expectedSha256: '38905f7ef51240071c696af8fdcee0a085199789d2c5715bf211adb90c929863',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1ob3o-Qh5cYki8g-IRQqrIKegPo0h2C8W
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SALAOJAT_RING_R2_PVK_CLEARANCE_WORK_TEST_20261022_1OB3OQH5_CANDIDATE = {
  id: 'auto-ylisrinne-salaojat-ring-r2-pvk-clearance-work-test-20261022-1ob3oqh5',
  label: 'Auto: Ylisrinne SALAOJAT RING R2 PVK clearance WORK TEST 20261022 (scene1) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-salaojat-ring-r2-pvk-clearance-work-test-20261022-1ob3oqh5.glb`,
  objectKey: 'work-test/auto-ylisrinne-salaojat-ring-r2-pvk-clearance-work-test-20261022-1ob3oqh5.glb',
  expectedSize: 897924,
  expectedSha256: 'bffc2e61a1d73c8fe0ff317c907796bfcb97a31ce33a6d33ad0bf2b5841748ba',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1bZB45b9sWCXw2Kji6Ps6lX80oa5F6Q1_
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SALAOJAT_RING_R2_PVK_CLEARANCE_SOK12_NAKYVYYS_WORK_TEST_20261022_1BZB45B9_CANDIDATE = {
  id: 'auto-ylisrinne-salaojat-ring-r2-pvk-clearance-sok12-nakyvyys-work-test-20261022-1bzb45b9',
  label: 'Auto: Ylisrinne SALAOJAT RING R2 PVK clearance SOK12 NAKYVYYS WORK TEST 20261022 (scene2) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-salaojat-ring-r2-pvk-clearance-sok12-nakyvyys-work-test-20261022-1bzb45b9.glb`,
  objectKey: 'work-test/auto-ylisrinne-salaojat-ring-r2-pvk-clearance-sok12-nakyvyys-work-test-20261022-1bzb45b9.glb',
  expectedSize: 899872,
  expectedSha256: 'fe9e0b0c6affa84565c18b668780730b89d944bfd4a1a9bc3b39d1176152b3f7',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1WdqV2K5BSyrmVdzKNV6GXfj-JqG_vYht
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2015_D2F_KESKUSKAAVIO2014_SOURCELINKS_WORK_TEST_20261022_1WDQV2K5_CANDIDATE = {
  id: 'auto-ylisrinne-d2015-d2f-keskuskaavio2014-sourcelinks-work-test-20261022-1wdqv2k5',
  label: 'Auto: Ylisrinne D2015 D2F keskuskaavio2014 sourceLinks WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2015-d2f-keskuskaavio2014-sourcelinks-work-test-20261022-1wdqv2k5.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2015-d2f-keskuskaavio2014-sourcelinks-work-test-20261022-1wdqv2k5.glb',
  expectedSize: 1718700,
  expectedSha256: 'd16d6c3e14eafaa8da09d0cef17dcabe3c36aab5a5cae05c97eea5e2e50f6403',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1DjaesisGH_brRucGyoDxTrV9pEmbnnK5
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SHARED302_KPH09_IV1_SOURCEDOCID_V2_WORK_TEST_20261022_1DJAESIS_CANDIDATE = {
  id: 'auto-ylisrinne-shared302-kph09-iv1-sourcedocid-v2-work-test-20261022-1djaesis',
  label: 'Auto: Ylisrinne SHARED302 KPH09 IV1 SourceDocId v2 WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-shared302-kph09-iv1-sourcedocid-v2-work-test-20261022-1djaesis.glb`,
  objectKey: 'work-test/auto-ylisrinne-shared302-kph09-iv1-sourcedocid-v2-work-test-20261022-1djaesis.glb',
  expectedSize: 1946584,
  expectedSha256: '4f8fb2ecf3fde8470c1d1260773fda47109b34d17bc8847b783975220153a20a',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 18JRz20WWuAm5MRzsA8HgbGSEfRbyKOPw
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_G1C_AUTOKATOS_P6_NELJA_KATETTUA_WORK_TEST_20261022_18JRZ20W_CANDIDATE = {
  id: 'auto-ylisrinne-g1c-autokatos-p6-nelja-katettua-work-test-20261022-18jrz20w',
  label: 'Auto: Ylisrinne G1c autokatos P6 nelja katettua WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-g1c-autokatos-p6-nelja-katettua-work-test-20261022-18jrz20w.glb`,
  objectKey: 'work-test/auto-ylisrinne-g1c-autokatos-p6-nelja-katettua-work-test-20261022-18jrz20w.glb',
  expectedSize: 25796,
  expectedSha256: 'dcc6635a02daf9eab237d3b3024468cf3c8e1266986b6cb317f74ce8dce40576',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1tDrlK2zGyclyaj6MpB9NJbhjEBC2XyRK
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_VALOAUKOT_KATTOPINNAN_NAKYVYYS_WORK_TEST_20261022_1TDRLK2Z_CANDIDATE = {
  id: 'auto-ylisrinne-t12-valoaukot-kattopinnan-nakyvyys-work-test-20261022-1tdrlk2z',
  label: 'Auto: Ylisrinne T12 valoaukot kattopinnan nakyvyys WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-valoaukot-kattopinnan-nakyvyys-work-test-20261022-1tdrlk2z.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-valoaukot-kattopinnan-nakyvyys-work-test-20261022-1tdrlk2z.glb',
  expectedSize: 1462688,
  expectedSha256: '36acafdae87f6906bdba30bf010787c85fe2b12d420565ef84c91709a6e0d9a5',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1eIBP5HcxRoGiRAG3CDYl5aQMcuD_qkXZ
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SALAOJAT_RING_R2_SOK12_OPASTEIDEN_LAHDELINKIT_WORK_TEST_20261022_1EIBP5HC_CANDIDATE = {
  id: 'auto-ylisrinne-salaojat-ring-r2-sok12-opasteiden-lahdelinkit-work-test-20261022-1eibp5hc',
  label: 'Auto: Ylisrinne SALAOJAT RING R2 SOK12 OPASTEIDEN LAHDELINKIT WORK TEST 20261022 (scene3) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-salaojat-ring-r2-sok12-opasteiden-lahdelinkit-work-test-20261022-1eibp5hc.glb`,
  objectKey: 'work-test/auto-ylisrinne-salaojat-ring-r2-sok12-opasteiden-lahdelinkit-work-test-20261022-1eibp5hc.glb',
  expectedSize: 934668,
  expectedSha256: '31734bfc3f118e7a8eab64abd86d05fb63ba20b1ad51b524ac4f31266fe9a2a1',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 10jd6Xh1MW0XzL7z-78xAE1xJmQ7auxJR
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SHARED302_KPH09_IV1_DOCID_V2_SAUNA_2IKKUNAA_V074_SOURCELINKS_WORK_TEST_20261022_10JD6XH1_CANDIDATE = {
  id: 'auto-ylisrinne-shared302-kph09-iv1-docid-v2-sauna-2ikkunaa-v074-sourcelinks-work-test-20261022-10jd6xh1',
  label: 'Auto: Ylisrinne SHARED302 KPH09 IV1 DocId v2 sauna 2ikkunaa V074 sourceLinks WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-shared302-kph09-iv1-docid-v2-sauna-2ikkunaa-v074-sourcelinks-work-test-20261022-10jd6xh1.glb`,
  objectKey: 'work-test/auto-ylisrinne-shared302-kph09-iv1-docid-v2-sauna-2ikkunaa-v074-sourcelinks-work-test-20261022-10jd6xh1.glb',
  expectedSize: 1955744,
  expectedSha256: '01fcbc97d42ade4760c376278b0dfee3259093a26cfa66762a7ee8479227527c',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 17x6TTnsQu9GPVKbFRUt2Ycfj76juAY-E
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SHARED302_KPH09_VIESER_DESIGN_51290_WORK_TEST_20261022_17X6TTNS_CANDIDATE = {
  id: 'auto-ylisrinne-shared302-kph09-vieser-design-51290-work-test-20261022-17x6ttns',
  label: 'Auto: Ylisrinne SHARED302 KPH09 Vieser Design 51290 WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-shared302-kph09-vieser-design-51290-work-test-20261022-17x6ttns.glb`,
  objectKey: 'work-test/auto-ylisrinne-shared302-kph09-vieser-design-51290-work-test-20261022-17x6ttns.glb',
  expectedSize: 1977192,
  expectedSha256: '6ebb5e34b2ad4b3bb8bcc7e1f439f58343041f2fdef8dfada6ca380657eb5768',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1oEd6mbdQiOZyHB07ll5rEUlcbNEXmult
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SHARED302_KPH09_KAIVONKANNET_VALOKUVA_20VIILTOA_WORK_TEST_20261022_1OED6MBD_CANDIDATE = {
  id: 'auto-ylisrinne-shared302-kph09-kaivonkannet-valokuva-20viiltoa-work-test-20261022-1oed6mbd',
  label: 'Auto: Ylisrinne SHARED302 KPH09 kaivonkannet VALOKUVA 20viiltoa WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-shared302-kph09-kaivonkannet-valokuva-20viiltoa-work-test-20261022-1oed6mbd.glb`,
  objectKey: 'work-test/auto-ylisrinne-shared302-kph09-kaivonkannet-valokuva-20viiltoa-work-test-20261022-1oed6mbd.glb',
  expectedSize: 1958344,
  expectedSha256: 'a17bfa21c4c5e32e2c97f5e894281e3882639b0959a1df7002f15c854f47b201',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1yu3vUTaY5fxWwJSaNxuv7dU_h8BLyicx
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_SHARED302_KPH09_KAIVONKANNET_VALOKUVA_VIILLOT_REUNA_TUMMA_WORK_TEST_20261022_1YU3VUTA_CANDIDATE = {
  id: 'auto-ylisrinne-shared302-kph09-kaivonkannet-valokuva-viillot-reuna-tumma-work-test-20261022-1yu3vuta',
  label: 'Auto: Ylisrinne SHARED302 KPH09 kaivonkannet valokuva viillot reuna tumma WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-shared302-kph09-kaivonkannet-valokuva-viillot-reuna-tumma-work-test-20261022-1yu3vuta.glb`,
  objectKey: 'work-test/auto-ylisrinne-shared302-kph09-kaivonkannet-valokuva-viillot-reuna-tumma-work-test-20261022-1yu3vuta.glb',
  expectedSize: 1964100,
  expectedSha256: '4c137c91094a77de585df9a07f785aa43fd4f2223c9ac22a18959248304de6e9',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1mP4FcTeUy9ATJ9vsY6Jb8nxkquhRl165
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D_TERASSI_L_ASKELMA_V2_WORK_TEST_20261022_1MP4FCTE_CANDIDATE = {
  id: 'auto-ylisrinne-d-terassi-l-askelma-v2-work-test-20261022-1mp4fcte',
  label: 'Auto: Ylisrinne D TERASSI L ASKELMA v2 WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d-terassi-l-askelma-v2-work-test-20261022-1mp4fcte.glb`,
  objectKey: 'work-test/auto-ylisrinne-d-terassi-l-askelma-v2-work-test-20261022-1mp4fcte.glb',
  expectedSize: 1697304,
  expectedSha256: '946287bc423bdc55d7c508a5b0c33780e31331586a5e1716bc398a5b4876fa11',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1ieXmv8DEJwekT8yubAK3MD4g2NOdrCJF
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_G1C_P6_4KATETTUA_DOCID_WORK_TEST_20261022_1IEXMV8D_CANDIDATE = {
  id: 'auto-ylisrinne-g1c-p6-4katettua-docid-work-test-20261022-1iexmv8d',
  label: 'Auto: Ylisrinne G1c P6 4katettua DocId work test 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-g1c-p6-4katettua-docid-work-test-20261022-1iexmv8d.glb`,
  objectKey: 'work-test/auto-ylisrinne-g1c-p6-4katettua-docid-work-test-20261022-1iexmv8d.glb',
  expectedSize: 183736,
  expectedSha256: 'd36c8e7cbc845957bf835ac284f436f4eaeb934cf313c4e3dc223491192ce002',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1CtoPnCOwQn5Lt-8HgSky0beCgQ39iYKD
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_8_VALOAUKON_ROOLIMERKIT_WORK_TEST_20261022_1CTOPNCO_CANDIDATE = {
  id: 'auto-ylisrinne-t12-8-valoaukon-roolimerkit-work-test-20261022-1ctopnco',
  label: 'Auto: Ylisrinne T12 8 valoaukon roolimerkit WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-8-valoaukon-roolimerkit-work-test-20261022-1ctopnco.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-8-valoaukon-roolimerkit-work-test-20261022-1ctopnco.glb',
  expectedSize: 1509196,
  expectedSha256: '69ba949f118026a45e478e3c6fe7b7406734520627466459252cbe0d70837910',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1YRn2dLK0ZMxdVmCf2Qpxuct6F-GXwNPs
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_KPH09_20_VIILTOA_VALOKUVASTA_TARKISTETTU_WORK_TEST_20261022_1YRN2DLK_CANDIDATE = {
  id: 'auto-ylisrinne-kph09-20-viiltoa-valokuvasta-tarkistettu-work-test-20261022-1yrn2dlk',
  label: 'Auto: Ylisrinne KPH09 20 viiltoa valokuvasta TARKISTETTU WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-kph09-20-viiltoa-valokuvasta-tarkistettu-work-test-20261022-1yrn2dlk.glb`,
  objectKey: 'work-test/auto-ylisrinne-kph09-20-viiltoa-valokuvasta-tarkistettu-work-test-20261022-1yrn2dlk.glb',
  expectedSize: 2002112,
  expectedSha256: 'db67604823671b701fb4822688d66da98362eb19068301496cac1eef53c0e73e',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1wJqJBT9LQc7snBMON2v0Lfe859-5beAc
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D_TERASSI_L_ASKELMA_V3_WORK_TEST_20261022_1WJQJBT9_CANDIDATE = {
  id: 'auto-ylisrinne-d-terassi-l-askelma-v3-work-test-20261022-1wjqjbt9',
  label: 'Auto: Ylisrinne D TERASSI L ASKELMA v3 WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d-terassi-l-askelma-v3-work-test-20261022-1wjqjbt9.glb`,
  objectKey: 'work-test/auto-ylisrinne-d-terassi-l-askelma-v3-work-test-20261022-1wjqjbt9.glb',
  expectedSize: 1703200,
  expectedSha256: '6f1c480cce3584d3496624c72830c29be42fbdc654cac6c8f415a3da6e2dbc26',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1Uqgn-UTCo6xUgmDSLya-sEHHEzielxy9
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D_TERASSI_L_ASKELMA_V4_LOCAL_TERRAIN_CLIP_WORK_TEST_20261022_1UQGNUTC_CANDIDATE = {
  id: 'auto-ylisrinne-d-terassi-l-askelma-v4-local-terrain-clip-work-test-20261022-1uqgnutc',
  label: 'Auto: Ylisrinne D TERASSI L ASKELMA v4 LOCAL TERRAIN CLIP WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d-terassi-l-askelma-v4-local-terrain-clip-work-test-20261022-1uqgnutc.glb`,
  objectKey: 'work-test/auto-ylisrinne-d-terassi-l-askelma-v4-local-terrain-clip-work-test-20261022-1uqgnutc.glb',
  expectedSize: 1758672,
  expectedSha256: '54815d68cdb384ba3721201288da08754ae38b25c6d7bc07219e19019e7909d8',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1O_R2PXpg86kpav-hQ6U_GYwG6cfnjVm-
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_8_VALOAUKON_3D_FOOTPRINTIT_WORK_TEST_20261022_1OR2PXPG_CANDIDATE = {
  id: 'auto-ylisrinne-t12-8-valoaukon-3d-footprintit-work-test-20261022-1or2pxpg',
  label: 'Auto: Ylisrinne T12 8 valoaukon 3D footprintit WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-8-valoaukon-3d-footprintit-work-test-20261022-1or2pxpg.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-8-valoaukon-3d-footprintit-work-test-20261022-1or2pxpg.glb',
  expectedSize: 1515192,
  expectedSha256: 'f7d46806f68473f0325bca3013f9ca518d8d8421a93ff5b5d5baa2524a0a3e52',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1iMCi825D-Pk4jzGQ3mUyXcUuI0tvXfPQ
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D1F_ETEISEN_KAAPIT_2015_5_MODULES_WORK_TEST_20261022_1IMCI825_CANDIDATE = {
  id: 'auto-ylisrinne-d1f-eteisen-kaapit-2015-5-modules-work-test-20261022-1imci825',
  label: 'Auto: Ylisrinne D1F ETEISEN KAAPIT 2015 5 MODULES WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d1f-eteisen-kaapit-2015-5-modules-work-test-20261022-1imci825.glb`,
  objectKey: 'work-test/auto-ylisrinne-d1f-eteisen-kaapit-2015-5-modules-work-test-20261022-1imci825.glb',
  expectedSize: 45240,
  expectedSha256: '90135df65caf09dbf996288a7b5cb272224c45de742ccd54692050cbe04669a5',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1bc9Ji7W6DvJmKsKQJVKpDfLrccT2c3JG
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_KPH09_20_VIILTOA_OMISTAJAN_AUKOTUSHYVAKSYNTA_METADATA_WORK_TEST_20261022_1BC9JI7W_CANDIDATE = {
  id: 'auto-ylisrinne-kph09-20-viiltoa-omistajan-aukotushyvaksynta-metadata-work-test-20261022-1bc9ji7w',
  label: 'Auto: Ylisrinne KPH09 20 viiltoa OMISTAJAN AUKOTUSHYVAKSYNTA METADATA WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-kph09-20-viiltoa-omistajan-aukotushyvaksynta-metadata-work-test-20261022-1bc9ji7w.glb`,
  objectKey: 'work-test/auto-ylisrinne-kph09-20-viiltoa-omistajan-aukotushyvaksynta-metadata-work-test-20261022-1bc9ji7w.glb',
  expectedSize: 2005324,
  expectedSha256: '6cab3b21177446fe377b703231feddf6837e3b47e0b141627fd866bfad393a2c',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1wVgYfGtl5EhCV5lFVwkB_x8WHhSMXAMT
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2F_2015_3_OVILEHTEA_AVATTU_SULJETTU_WORK_TEST_20261022_1WVGYFGT_CANDIDATE = {
  id: 'auto-ylisrinne-d2f-2015-3-ovilehtea-avattu-suljettu-work-test-20261022-1wvgyfgt',
  label: 'Auto: Ylisrinne D2F 2015 3 OVILEHTEA AVATTU SULJETTU WORK TEST 20261022 (scene60) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2f-2015-3-ovilehtea-avattu-suljettu-work-test-20261022-1wvgyfgt.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2f-2015-3-ovilehtea-avattu-suljettu-work-test-20261022-1wvgyfgt.glb',
  expectedSize: 1425124,
  expectedSha256: '5781e76c91141e6d4d2aa5f254bed16c1986e5767fe86c49074745aea59a89b1',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1um19Vwz2-1wxqpApw8IX48sX9tGE34JX
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2F_2015_KEITTION_SEINAKAAPIT_WORK_TEST_20261022_1UM19VWZ_CANDIDATE = {
  id: 'auto-ylisrinne-d2f-2015-keittion-seinakaapit-work-test-20261022-1um19vwz',
  label: 'Auto: Ylisrinne D2F 2015 KEITTION SEINAKAAPIT WORK TEST 20261022 (scene62) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2f-2015-keittion-seinakaapit-work-test-20261022-1um19vwz.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2f-2015-keittion-seinakaapit-work-test-20261022-1um19vwz.glb',
  expectedSize: 1471436,
  expectedSha256: 'e0a99b96886db16b22a744a54de8b585dcfe42704fd7f87f8917093a3ecfea46',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1NZfANJfWBhfImQ5-IbLhVeBJmih6XkDQ
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D1F_ETEISEN_KAAPIT_2015_GAP_APPROX300_WORK_TEST_20261022_1NZFANJF_CANDIDATE = {
  id: 'auto-ylisrinne-d1f-eteisen-kaapit-2015-gap-approx300-work-test-20261022-1nzfanjf',
  label: 'Auto: Ylisrinne D1F ETEISEN KAAPIT 2015 GAP APPROX300 WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d1f-eteisen-kaapit-2015-gap-approx300-work-test-20261022-1nzfanjf.glb`,
  objectKey: 'work-test/auto-ylisrinne-d1f-eteisen-kaapit-2015-gap-approx300-work-test-20261022-1nzfanjf.glb',
  expectedSize: 51076,
  expectedSha256: 'c7278007d2c020d0d77a42a52abf3c29ce726aa04a4867e93b064ad082ac636a',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1PPWekwQm27xYHKgY4lBexZKh3Rq5fw0f
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D_TERASSI_L_ASKELMA_V5_TERRAIN_EDGE_CONTINUITY_WORK_TEST_20261022_1PPWEKWQ_CANDIDATE = {
  id: 'auto-ylisrinne-d-terassi-l-askelma-v5-terrain-edge-continuity-work-test-20261022-1ppwekwq',
  label: 'Auto: Ylisrinne D TERASSI L ASKELMA v5 TERRAIN EDGE CONTINUITY WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d-terassi-l-askelma-v5-terrain-edge-continuity-work-test-20261022-1ppwekwq.glb`,
  objectKey: 'work-test/auto-ylisrinne-d-terassi-l-askelma-v5-terrain-edge-continuity-work-test-20261022-1ppwekwq.glb',
  expectedSize: 1761500,
  expectedSha256: 'ed919e5a8dbd472035a25661800af08d6ad3e2068f86b352ccf6a1ca42139789',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1KjeK3btHfuKeDwsrl4MoqhgPpca7xwSh
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2F_2015_KEITTION_SEINAKAAPIT_SOURCELINKS_WORK_TEST_20261022_1KJEK3BT_CANDIDATE = {
  id: 'auto-ylisrinne-d2f-2015-keittion-seinakaapit-sourcelinks-work-test-20261022-1kjek3bt',
  label: 'Auto: Ylisrinne D2F 2015 KEITTION SEINAKAAPIT SOURCELINKS WORK TEST 20261022 (scene62) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2f-2015-keittion-seinakaapit-sourcelinks-work-test-20261022-1kjek3bt.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2f-2015-keittion-seinakaapit-sourcelinks-work-test-20261022-1kjek3bt.glb',
  expectedSize: 1478140,
  expectedSha256: '1259e9efe065ec9cb5889de0e34763999d65b2245c340a7c49296f36e8534e13',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1IuH5kd_RemsMygvCe8uTlN4QVvMnxX7u
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_A_D_PAASISAANKAYNTIEN_OVILEHDET_WORK_TEST_20261022_1IUH5KDR_CANDIDATE = {
  id: 'auto-ylisrinne-t12-a-d-paasisaankayntien-ovilehdet-work-test-20261022-1iuh5kdr',
  label: 'Auto: Ylisrinne T12 A-D PAASISAANKAYNTIEN OVILEHDET WORK TEST 20261022 (scene1) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-a-d-paasisaankayntien-ovilehdet-work-test-20261022-1iuh5kdr.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-a-d-paasisaankayntien-ovilehdet-work-test-20261022-1iuh5kdr.glb',
  expectedSize: 1528548,
  expectedSha256: 'faec257ac15fb42337fe7ab3400ae0c3d1186d2cf32ab95723dd7431a8bd3491',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1TgcZxno3Xqd77hZXpPDokHUjcPtXDMBt
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_2015_LASTENHUONE_NORDLI3_ME3104_SOURCE_ONLY_WORK_TEST_20261022_1TGCZXNO_CANDIDATE = {
  id: 'auto-ylisrinne-2015-lastenhuone-nordli3-me3104-source-only-work-test-20261022-1tgczxno',
  label: 'Auto: Ylisrinne 2015 LASTENHUONE NORDLI3 ME3104 SOURCE ONLY WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-2015-lastenhuone-nordli3-me3104-source-only-work-test-20261022-1tgczxno.glb`,
  objectKey: 'work-test/auto-ylisrinne-2015-lastenhuone-nordli3-me3104-source-only-work-test-20261022-1tgczxno.glb',
  expectedSize: 56384,
  expectedSha256: 'd93bcb28388352b7a9bd325e68219b2ae912d0bd46da55aafe981f4b05f85893',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1NflAqxgnbWk44ABL2f-jsSb7ljmxaPdd
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_1974_AC_1F_MARKATILASEINAT_WORK_TEST_20261022_1NFLAQXG_CANDIDATE = {
  id: 'auto-ylisrinne-t12-1974-ac-1f-markatilaseinat-work-test-20261022-1nflaqxg',
  label: 'Auto: Ylisrinne T12 1974 AC 1F MARKATILASEINAT WORK TEST 20261022 (scene2) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-1974-ac-1f-markatilaseinat-work-test-20261022-1nflaqxg.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-1974-ac-1f-markatilaseinat-work-test-20261022-1nflaqxg.glb',
  expectedSize: 1575040,
  expectedSha256: '5b2c34e80fd0b4022e5e08c63ef67d7f41aaf6bf2a29021649fe0f92ee928942',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1a6EvZLMDAecyqNEuS7Yqr6uw1KPCmmKJ
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2F_2015_KEITTION_KAAPIT_SISAOVET_KIINNI_SOURCELINKS_WORK_TEST_20261022_1A6EVZLM_CANDIDATE = {
  id: 'auto-ylisrinne-d2f-2015-keittion-kaapit-sisaovet-kiinni-sourcelinks-work-test-20261022-1a6evzlm',
  label: 'Auto: Ylisrinne D2F 2015 KEITTION KAAPIT SISAOVET KIINNI SOURCELINKS WORK TEST 20261022 (scene63) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2f-2015-keittion-kaapit-sisaovet-kiinni-sourcelinks-work-test-20261022-1a6evzlm.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2f-2015-keittion-kaapit-sisaovet-kiinni-sourcelinks-work-test-20261022-1a6evzlm.glb',
  expectedSize: 1468884,
  expectedSha256: 'adf533122bdb204dc0e6eba8cf6e2b61e2916bb4d3eb24bb9acdf37e7fe22c07',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1dxw1YUzH7YQDjhcNWB-4wBxF2uNUHa4z
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_1974_ABC_2F_HUONEJAKOSEINAT_WORK_TEST_20261022_1DXW1YUZ_CANDIDATE = {
  id: 'auto-ylisrinne-t12-1974-abc-2f-huonejakoseinat-work-test-20261022-1dxw1yuz',
  label: 'Auto: Ylisrinne T12 1974 ABC 2F HUONEJAKOSEINAT WORK TEST 20261022 (scene4) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-1974-abc-2f-huonejakoseinat-work-test-20261022-1dxw1yuz.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-1974-abc-2f-huonejakoseinat-work-test-20261022-1dxw1yuz.glb',
  expectedSize: 1599716,
  expectedSha256: 'fe8f82c9c0794afdac8315b1168fae07b465e24da68b4fae23288504677762fa',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1I5zenUuuA3qI93WAlZvHIKs99V6kyMnE
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_2015_LASTENHUONE_9KALUSTETTA_SKALAND_SIGURD_WORK_TEST_20261022_1I5ZENUU_CANDIDATE = {
  id: 'auto-ylisrinne-2015-lastenhuone-9kalustetta-skaland-sigurd-work-test-20261022-1i5zenuu',
  label: 'Auto: Ylisrinne 2015 LASTENHUONE 9KALUSTETTA SKALAND SIGURD WORK TEST 20261022 (scene2) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-2015-lastenhuone-9kalustetta-skaland-sigurd-work-test-20261022-1i5zenuu.glb`,
  objectKey: 'work-test/auto-ylisrinne-2015-lastenhuone-9kalustetta-skaland-sigurd-work-test-20261022-1i5zenuu.glb',
  expectedSize: 72060,
  expectedSha256: '0cc2ab054e4575737ee5250778deb6b13c0406a8b3f3a9363f0a8e118b936d48',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1Vv-kqrn5uJOQOpqIf6jplnZ0-8bfIcst
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_1974_ABC_1F_ETELA_TK_VH_SOURCE_PLAN_WORK_TEST_20261022_1VVKQRN5_CANDIDATE = {
  id: 'auto-ylisrinne-t12-1974-abc-1f-etela-tk-vh-source-plan-work-test-20261022-1vvkqrn5',
  label: 'Auto: Ylisrinne T12 1974 ABC 1F ETELA TK VH SOURCE PLAN WORK TEST 20261022 (scene6) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-1974-abc-1f-etela-tk-vh-source-plan-work-test-20261022-1vvkqrn5.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-1974-abc-1f-etela-tk-vh-source-plan-work-test-20261022-1vvkqrn5.glb',
  expectedSize: 1611584,
  expectedSha256: '574ecf2073d5154ccfec6458258bdac992012f105f1a39b871be3da7a91e6418',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1Ye5pz6ItsEY3j4EwsmIc73jwqD9_J-aa
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_1974_ABC_1F_ETEINEN_KAYTAVA_JAKOSEINAT_WORK_TEST_20261022_1YE5PZ6I_CANDIDATE = {
  id: 'auto-ylisrinne-t12-1974-abc-1f-eteinen-kaytava-jakoseinat-work-test-20261022-1ye5pz6i',
  label: 'Auto: Ylisrinne T12 1974 ABC 1F ETEINEN KAYTAVA JAKOSEINAT WORK TEST 20261022 (scene6) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-1974-abc-1f-eteinen-kaytava-jakoseinat-work-test-20261022-1ye5pz6i.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-1974-abc-1f-eteinen-kaytava-jakoseinat-work-test-20261022-1ye5pz6i.glb',
  expectedSize: 1635624,
  expectedSha256: '853cfa5b47d572fedfffd956201f168a8ff551e5c4808fd12096668830b9cad6',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1-rqzyqWyuUa_pXaTkylfsgi44lK9HHBH
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_1974_ABC_1F_H_SEINAT_TK_VH_YHDISTE_WORK_TEST_20261022_1RQZYQWY_CANDIDATE = {
  id: 'auto-ylisrinne-t12-1974-abc-1f-h-seinat-tk-vh-yhdiste-work-test-20261022-1rqzyqwy',
  label: 'Auto: Ylisrinne T12 1974 ABC 1F H SEINAT TK VH YHDISTE WORK TEST 20261022 (scene8) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-1974-abc-1f-h-seinat-tk-vh-yhdiste-work-test-20261022-1rqzyqwy.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-1974-abc-1f-h-seinat-tk-vh-yhdiste-work-test-20261022-1rqzyqwy.glb',
  expectedSize: 1647796,
  expectedSha256: 'fc131968d200bf569e5e3bffeceab6744e7adefab2bafb6ff970dd607986930b',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1OmRGZYs5YJj8QZhjojr3rxtiUj0uMkv1
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_1974_ABC_2F_WC_SEINAT_YHDISTE_WORK_TEST_20261022_1OMRGZYS_CANDIDATE = {
  id: 'auto-ylisrinne-t12-1974-abc-2f-wc-seinat-yhdiste-work-test-20261022-1omrgzys',
  label: 'Auto: Ylisrinne T12 1974 ABC 2F WC SEINAT YHDISTE WORK TEST 20261022 (scene10) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-1974-abc-2f-wc-seinat-yhdiste-work-test-20261022-1omrgzys.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-1974-abc-2f-wc-seinat-yhdiste-work-test-20261022-1omrgzys.glb',
  expectedSize: 1673348,
  expectedSha256: '2a211e3bb50af2ea287fa55cf9d2091b2547be7431167dc713aeb572db7b6a6b',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1-jIoo3I3DuYfDLoFKudA8pvI9jdUY_MH
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_1974_ABC_1F_H_TKVH_2F_WC_YHDISTE_WORK_TEST_20261022_1JIOO3I3_CANDIDATE = {
  id: 'auto-ylisrinne-t12-1974-abc-1f-h-tkvh-2f-wc-yhdiste-work-test-20261022-1jioo3i3',
  label: 'Auto: Ylisrinne T12 1974 ABC 1F H TKVH 2F WC YHDISTE WORK TEST 20261022 (scene10) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-1974-abc-1f-h-tkvh-2f-wc-yhdiste-work-test-20261022-1jioo3i3.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-1974-abc-1f-h-tkvh-2f-wc-yhdiste-work-test-20261022-1jioo3i3.glb',
  expectedSize: 1673288,
  expectedSha256: 'dcece085d6acad0fa4b9221949b1bec2892595961d8efa538df668948a1e245b',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1BFmYFmWH0HseZRpJXJNsHDDXpAkcO4Zi
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_1974_ABC_3_PORRASTA_WORK_TEST_20261022_1BFMYFMW_CANDIDATE = {
  id: 'auto-ylisrinne-t12-1974-abc-3-porrasta-work-test-20261022-1bfmyfmw',
  label: 'Auto: Ylisrinne T12 1974 ABC 3 PORRASTA WORK TEST 20261022 (scene12) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-1974-abc-3-porrasta-work-test-20261022-1bfmyfmw.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-1974-abc-3-porrasta-work-test-20261022-1bfmyfmw.glb',
  expectedSize: 1727804,
  expectedSha256: '8ec680e55a916d7a13569603ff7a98bbcd591a9ef129673752655af190d1363c',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1dsE7LF0Lfi3WosXaI5zPMSB0Z2JGxCIz
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_KPH09_SAUNA_U_IKKUNAT_MITAT_WORK_TEST_20261022_1DSE7LF0_CANDIDATE = {
  id: 'auto-ylisrinne-kph09-sauna-u-ikkunat-mitat-work-test-20261022-1dse7lf0',
  label: 'Auto: Ylisrinne KPH09 SAUNA U ikkunat mitat WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-kph09-sauna-u-ikkunat-mitat-work-test-20261022-1dse7lf0.glb`,
  objectKey: 'work-test/auto-ylisrinne-kph09-sauna-u-ikkunat-mitat-work-test-20261022-1dse7lf0.glb',
  expectedSize: 2004700,
  expectedSha256: 'aa472c409a92c07ed3f0ada8c7d5fc16395311179aeb609f60493937b6b622cb',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1-VcJuDcj8va5GjIY8vk04qU1oV9rLsmw
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_KPH09_SAUNA_IKKUNAT_SYMMETRIA_USER_CONFIRMED_WORK_TEST_20261022_1VCJUDCJ_CANDIDATE = {
  id: 'auto-ylisrinne-kph09-sauna-ikkunat-symmetria-user-confirmed-work-test-20261022-1vcjudcj',
  label: 'Auto: Ylisrinne KPH09 SAUNA ikkunat symmetria USER CONFIRMED WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-kph09-sauna-ikkunat-symmetria-user-confirmed-work-test-20261022-1vcjudcj.glb`,
  objectKey: 'work-test/auto-ylisrinne-kph09-sauna-ikkunat-symmetria-user-confirmed-work-test-20261022-1vcjudcj.glb',
  expectedSize: 2007012,
  expectedSha256: '36748312830d67553af044de433a36dc12bc8756ac688b6dadd07582fd820eb1',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1jvCReIWl7ulcB-1nBJge03QpiSBbgZ7T
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_KPH09_LASIKAARI_WCKANSI_OWNER_REVIEW_META_WORK_TEST_20261022_1JVCREIW_CANDIDATE = {
  id: 'auto-ylisrinne-kph09-lasikaari-wckansi-owner-review-meta-work-test-20261022-1jvcreiw',
  label: 'Auto: Ylisrinne KPH09 LASIKAARI WCKANSI OWNER REVIEW META WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-kph09-lasikaari-wckansi-owner-review-meta-work-test-20261022-1jvcreiw.glb`,
  objectKey: 'work-test/auto-ylisrinne-kph09-lasikaari-wckansi-owner-review-meta-work-test-20261022-1jvcreiw.glb',
  expectedSize: 2007012,
  expectedSha256: '6816daf86a9ffb769a6cff760f8fc72eb19639aee28ee8215adf3bcbf0bbc72a',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1UmyoVPoqjYs4arhrTcM4PrWqSiWJY5hJ
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2F_2024_KITCHEN_PHOTO_CORRECTED_R1_WITH_DOORS_WORK_TEST_20261022_1UMYOVPO_CANDIDATE = {
  id: 'auto-ylisrinne-d2f-2024-kitchen-photo-corrected-r1-with-doors-work-test-20261022-1umyovpo',
  label: 'Auto: Ylisrinne D2F 2024 KITCHEN PHOTO CORRECTED R1 WITH DOORS WORK TEST 20261022 (scene65) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2f-2024-kitchen-photo-corrected-r1-with-doors-work-test-20261022-1umyovpo.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2f-2024-kitchen-photo-corrected-r1-with-doors-work-test-20261022-1umyovpo.glb',
  expectedSize: 1550632,
  expectedSha256: 'd6ca3c593a414e9b1d051d29ee5d4d5bd138b8316b317046a5068dad9c83b0c5',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1VMOOmQLyDkwHWSfbhLhQO8xLhdyr60BM
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D1F_KAAPIT_ULKOSEINAPUOLI_PROVENANSSI_WORK_TEST_20261022_1VMOOMQL_CANDIDATE = {
  id: 'auto-ylisrinne-d1f-kaapit-ulkoseinapuoli-provenanssi-work-test-20261022-1vmoomql',
  label: 'Auto: Ylisrinne D1F KAAPIT ULKOSEINAPUOLI PROVENANSSI WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d1f-kaapit-ulkoseinapuoli-provenanssi-work-test-20261022-1vmoomql.glb`,
  objectKey: 'work-test/auto-ylisrinne-d1f-kaapit-ulkoseinapuoli-provenanssi-work-test-20261022-1vmoomql.glb',
  expectedSize: 52380,
  expectedSha256: 'b3c0efcfa3b3d05033be529f106e25dff71a277c01b4bafdb010d82dffed2d0f',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1KHYpx9FjR0MvbV3u47RZj80l7uB8zniA
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2F_2024_KITCHEN_R2_3X600_TALL_QA_VERIFIED_WORK_TEST_20261022_1KHYPX9F_CANDIDATE = {
  id: 'auto-ylisrinne-d2f-2024-kitchen-r2-3x600-tall-qa-verified-work-test-20261022-1khypx9f',
  label: 'Auto: Ylisrinne D2F 2024 KITCHEN R2 3X600 TALL QA VERIFIED WORK TEST 20261022 (scene67) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2f-2024-kitchen-r2-3x600-tall-qa-verified-work-test-20261022-1khypx9f.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2f-2024-kitchen-r2-3x600-tall-qa-verified-work-test-20261022-1khypx9f.glb',
  expectedSize: 1559200,
  expectedSha256: '04ca0d2f5b720aefcaec104ebf1e9f3e85cd0018cb2e7c6692d9c6d394317d93',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 13p6mzdMTHAKRsxRmp_ZWZXcg4MBHCXzQ
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D1F_KAAPIT_PAATYJEN_KUVATARKISTUS_WORK_TEST_20261022_13P6MZDM_CANDIDATE = {
  id: 'auto-ylisrinne-d1f-kaapit-paatyjen-kuvatarkistus-work-test-20261022-13p6mzdm',
  label: 'Auto: Ylisrinne D1F KAAPIT PAATYJEN KUVATARKISTUS WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d1f-kaapit-paatyjen-kuvatarkistus-work-test-20261022-13p6mzdm.glb`,
  objectKey: 'work-test/auto-ylisrinne-d1f-kaapit-paatyjen-kuvatarkistus-work-test-20261022-13p6mzdm.glb',
  expectedSize: 54596,
  expectedSha256: '0cff0db1fe997817b10d292f0aa258fe4b6b0f4e44fab740840a06c7a382daa2',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1mocYC5Pnd7K3IXasXAH9n79R33QbA00l
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2F_2024_KITCHEN_R3_AISLE1200_PHOTO_WORK_TEST_20261022_1MOCYC5P_CANDIDATE = {
  id: 'auto-ylisrinne-d2f-2024-kitchen-r3-aisle1200-photo-work-test-20261022-1mocyc5p',
  label: 'Auto: Ylisrinne D2F 2024 KITCHEN R3 AISLE1200 PHOTO WORK TEST 20261022 (scene69) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2f-2024-kitchen-r3-aisle1200-photo-work-test-20261022-1mocyc5p.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2f-2024-kitchen-r3-aisle1200-photo-work-test-20261022-1mocyc5p.glb',
  expectedSize: 1560516,
  expectedSha256: '4f58e953a26d25db9143057760d6ddf137cf7eba476ac6246de317375ae165ee',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1Jj1KLIBBD7Rn8UVVugu5bYUL_dPOVqHg
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D_TERASSI_L_ASKELMA_V6_WEST_LEG_TERRAIN_BLEND_WORK_TEST_20261022_1JJ1KLIB_CANDIDATE = {
  id: 'auto-ylisrinne-d-terassi-l-askelma-v6-west-leg-terrain-blend-work-test-20261022-1jj1klib',
  label: 'Auto: Ylisrinne D TERASSI L ASKELMA v6 WEST LEG TERRAIN BLEND WORK TEST 20261022 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d-terassi-l-askelma-v6-west-leg-terrain-blend-work-test-20261022-1jj1klib.glb`,
  objectKey: 'work-test/auto-ylisrinne-d-terassi-l-askelma-v6-west-leg-terrain-blend-work-test-20261022-1jj1klib.glb',
  expectedSize: 1807136,
  expectedSha256: '6738c0660ac2bc7191e05d701cf12208d062b70c82e0bee932d5be7145ac6d6f',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1T-TtkQO510WhmZwzv2xot9RkGAm8yVNY
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D1F_KAAPIT_G1_AKSELISUUNTA_TYOKOHDISTUS_WORK_TEST_20261022_1TTTKQO5_CANDIDATE = {
  id: 'auto-ylisrinne-d1f-kaapit-g1-akselisuunta-tyokohdistus-work-test-20261022-1tttkqo5',
  label: 'Auto: Ylisrinne D1F KAAPIT G1 AKSELISUUNTA TYOKOHDISTUS WORK TEST 20261022 (scene2) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d1f-kaapit-g1-akselisuunta-tyokohdistus-work-test-20261022-1tttkqo5.glb`,
  objectKey: 'work-test/auto-ylisrinne-d1f-kaapit-g1-akselisuunta-tyokohdistus-work-test-20261022-1tttkqo5.glb',
  expectedSize: 58464,
  expectedSha256: '9497856206a0bffafeb30dd1d8533e2c9a01871ea40bd7a5e945cbbcb50cf68f',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-22 from Drive queue file 1uPg3bXeQjcWc44LnlBXbHhAT6yBJcRv1
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D1F_KAAPIT_POHJAPIIRUSTUS_XY_VYOHYKE_WORK_TEST_20261022_1UPG3BXE_CANDIDATE = {
  id: 'auto-ylisrinne-d1f-kaapit-pohjapiirustus-xy-vyohyke-work-test-20261022-1upg3bxe',
  label: 'Auto: Ylisrinne D1F KAAPIT POHJAPIIRUSTUS XY VYOHYKE WORK TEST 20261022 (scene3) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d1f-kaapit-pohjapiirustus-xy-vyohyke-work-test-20261022-1upg3bxe.glb`,
  objectKey: 'work-test/auto-ylisrinne-d1f-kaapit-pohjapiirustus-xy-vyohyke-work-test-20261022-1upg3bxe.glb',
  expectedSize: 61816,
  expectedSha256: 'e5a9279fe8bfee4fcdc2d8ea7ec59e2b7056e5694d6c307ef9f86c3fce2d5fc5',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-23 from Drive queue file 1XOld_YLurqS-NHzXWotzywD0YiP4nFOK
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D_TERASSI_LASKELMA_V7_45JIIRI_MAASTO_WORK_TEST_20261023_1XOLDYLU_CANDIDATE = {
  id: 'auto-ylisrinne-d-terassi-laskelma-v7-45jiiri-maasto-work-test-20261023-1xoldylu',
  label: 'Auto: Ylisrinne D TERASSI LASKELMA v7 45JIIRI MAASTO WORK TEST 20261023 (scene2) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d-terassi-laskelma-v7-45jiiri-maasto-work-test-20261023-1xoldylu.glb`,
  objectKey: 'work-test/auto-ylisrinne-d-terassi-laskelma-v7-45jiiri-maasto-work-test-20261023-1xoldylu.glb',
  expectedSize: 1974448,
  expectedSha256: '375743bb163055d7f04c2d7e0465f651c13be16875b4093ffa88434aa6352f33',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-23 from Drive queue file 1oj3Rqau_EmybkFyYPaIKH1Kd8RnBLUup
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D1F_KAAPIT_RAKO_LEVEYS_AVOIN_WORK_TEST_20261023_1OJ3RQAU_CANDIDATE = {
  id: 'auto-ylisrinne-d1f-kaapit-rako-leveys-avoin-work-test-20261023-1oj3rqau',
  label: 'Auto: Ylisrinne D1F KAAPIT RAKO LEVEYS AVOIN WORK TEST 20261023 (scene4) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d1f-kaapit-rako-leveys-avoin-work-test-20261023-1oj3rqau.glb`,
  objectKey: 'work-test/auto-ylisrinne-d1f-kaapit-rako-leveys-avoin-work-test-20261023-1oj3rqau.glb',
  expectedSize: 56088,
  expectedSha256: 'e3b1721b0613e10845de06096a9c0b6bc6482974bd86b510e255b4c40fcae973',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-23 from Drive queue file 1k19ILGoXs93ChiOF6NLBctWzt_cFvsU9
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2F_2024_KITCHEN_R4_4TALL_OWNER_REVIEW_WORK_TEST_20261023_1K19ILGO_CANDIDATE = {
  id: 'auto-ylisrinne-d2f-2024-kitchen-r4-4tall-owner-review-work-test-20261023-1k19ilgo',
  label: 'Auto: Ylisrinne D2F 2024 KITCHEN R4 4TALL OWNER REVIEW WORK TEST 20261023 (scene70) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2f-2024-kitchen-r4-4tall-owner-review-work-test-20261023-1k19ilgo.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2f-2024-kitchen-r4-4tall-owner-review-work-test-20261023-1k19ilgo.glb',
  expectedSize: 1542784,
  expectedSha256: '15acb14c7d10b6e3a980251032812136f82ef7d032ff879a99476aac0c84743a',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-23 from Drive queue file 1k6osskJK6yQ76KO5iEgvHzhu-qlMikpt
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2F_KEITTIO_R4_4_KORKEAA_OWNER_WORK_TEST_20261023_1K6OSSKJ_CANDIDATE = {
  id: 'auto-ylisrinne-d2f-keittio-r4-4-korkeaa-owner-work-test-20261023-1k6osskj',
  label: 'Auto: Ylisrinne D2F KEITTIO R4 4 KORKEAA OWNER WORK TEST 20261023 (scene71) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2f-keittio-r4-4-korkeaa-owner-work-test-20261023-1k6osskj.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2f-keittio-r4-4-korkeaa-owner-work-test-20261023-1k6osskj.glb',
  expectedSize: 1543748,
  expectedSha256: 'f9904a46efa93b513a8e420983c6f9c669e87afeec59b1fa83944a0686453bba',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-23 from Drive queue file 1im1g_ftN0Nx_VdrUGoLhHhMDdcEspIm8
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2F_KEITTIO_R6_SAAREKE_VIINIKAAPPI_ETUJAKO_WORK_TEST_20261023_1IM1GFTN_CANDIDATE = {
  id: 'auto-ylisrinne-d2f-keittio-r6-saareke-viinikaappi-etujako-work-test-20261023-1im1gftn',
  label: 'Auto: Ylisrinne D2F KEITTIO R6 SAAREKE VIINIKAAPPI ETUJAKO WORK TEST 20261023 (scene75) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2f-keittio-r6-saareke-viinikaappi-etujako-work-test-20261023-1im1gftn.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2f-keittio-r6-saareke-viinikaappi-etujako-work-test-20261023-1im1gftn.glb',
  expectedSize: 1613008,
  expectedSha256: 'c32db95b5e09254a285b7482620f2902b6a4c3bc14e0ea04bc3fb92649084089',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-23 from Drive queue file 1kRpYPKwdndQ66-RQyKymSAohoadbID9J
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D_TERASSI_NAKOSUOJA_V8_KUVARISTIKKO_WORK_TEST_20261023_1KRPYPKW_CANDIDATE = {
  id: 'auto-ylisrinne-d-terassi-nakosuoja-v8-kuvaristikko-work-test-20261023-1krpypkw',
  label: 'Auto: Ylisrinne D TERASSI NAKOSUOJA V8 KUVARISTIKKO WORK TEST 20261023 (scene3) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d-terassi-nakosuoja-v8-kuvaristikko-work-test-20261023-1krpypkw.glb`,
  objectKey: 'work-test/auto-ylisrinne-d-terassi-nakosuoja-v8-kuvaristikko-work-test-20261023-1krpypkw.glb',
  expectedSize: 1957836,
  expectedSha256: 'cbe3909b39d1fab8826a6010c607eee81db016de71f6cc23779cc36913a7dc89',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-23 from Drive queue file 1h4iL6ylqt0xWB-vbD_Iqmhb8Mj6NrhRW
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2F_2015_3_OVILEHTEA_R2_KAYNTIVALYS_TYO_OLETUS_WORK_TEST_20261023_1H4IL6YL_CANDIDATE = {
  id: 'auto-ylisrinne-d2f-2015-3-ovilehtea-r2-kayntivalys-tyo-oletus-work-test-20261023-1h4il6yl',
  label: 'Auto: Ylisrinne D2F 2015 3 OVILEHTEA R2 KAYNTIVALYS TYO OLETUS WORK TEST 20261023 (scene63) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2f-2015-3-ovilehtea-r2-kayntivalys-tyo-oletus-work-test-20261023-1h4il6yl.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2f-2015-3-ovilehtea-r2-kayntivalys-tyo-oletus-work-test-20261023-1h4il6yl.glb',
  expectedSize: 1416900,
  expectedSha256: 'a3f5a4f085d28afc915f4493e447d34a482470d050d586a006bf523de3afb802',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-23 from Drive queue file 16Pqh2JB1qcbn1VJpnaWdsU7F9VtZpGYp
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2F_KEITTIO_R13_KULMA_LAATAT_2X2_VAAKAKEHYS_SAUMAVIITE_WORK_TEST_20261023_16PQH2JB_CANDIDATE = {
  id: 'auto-ylisrinne-d2f-keittio-r13-kulma-laatat-2x2-vaakakehys-saumaviite-work-test-20261023-16pqh2jb',
  label: 'Auto: Ylisrinne D2F KEITTIO R13 KULMA LAATAT 2X2 VAAKAKEHYS SAUMAVIITE WORK TEST 20261023 (scene85) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2f-keittio-r13-kulma-laatat-2x2-vaakakehys-saumaviite-work-test-20261023-16pqh2jb.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2f-keittio-r13-kulma-laatat-2x2-vaakakehys-saumaviite-work-test-20261023-16pqh2jb.glb',
  expectedSize: 1722292,
  expectedSha256: '24fb142b52c56376eb506a39d2d3403c71399f6905b104f213f54033560ce4b3',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-23 from Drive queue file 1rThFo9ZvvAZpwlYPxWcVhRNetzPrUtvI
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D_TERASSI_NAKOSUOJA_V12_KAKSI_PANEELIA_PORRASTUS_MAASTO_WORK_TEST_20261023_1RTHFO9Z_CANDIDATE = {
  id: 'auto-ylisrinne-d-terassi-nakosuoja-v12-kaksi-paneelia-porrastus-maasto-work-test-20261023-1rthfo9z',
  label: 'Auto: Ylisrinne D TERASSI NAKOSUOJA V12 KAKSI PANEELIA PORRASTUS MAASTO WORK TEST 20261023 (scene7) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d-terassi-nakosuoja-v12-kaksi-paneelia-porrastus-maasto-work-test-20261023-1rthfo9z.glb`,
  objectKey: 'work-test/auto-ylisrinne-d-terassi-nakosuoja-v12-kaksi-paneelia-porrastus-maasto-work-test-20261023-1rthfo9z.glb',
  expectedSize: 1945964,
  expectedSha256: '39b9396ca8358510e3412e903b478f7974854ef50e92a132cbe1213337a46309',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-23 from Drive queue file 1Iqk4jDjP_cB_3wUpNDsC7gsyxcoQHwLK
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D_TERASSI_NAKOSUOJA_V11_KOLME_PORRASTETTUA_ELEMENTTIA_KATSELMUS01_WORK_TEST_20261023_1IQK4JDJ_CANDIDATE = {
  id: 'auto-ylisrinne-d-terassi-nakosuoja-v11-kolme-porrastettua-elementtia-katselmus01-work-test-20261023-1iqk4jdj',
  label: 'Auto: Ylisrinne D TERASSI NAKOSUOJA V11 KOLME PORRASTETTUA ELEMENTTIA KATSELMUS01 WORK TEST 20261023 (scene6) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d-terassi-nakosuoja-v11-kolme-porrastettua-elementtia-katselmus01-work-test-20261023-1iqk4jdj.glb`,
  objectKey: 'work-test/auto-ylisrinne-d-terassi-nakosuoja-v11-kolme-porrastettua-elementtia-katselmus01-work-test-20261023-1iqk4jdj.glb',
  expectedSize: 1960184,
  expectedSha256: '1ba5285405aee34f7d39b5c04fec088b48c53e250e780cb8f710c3657fe31ae0',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1BuwWESQoJ0DUrZj1Tlju4GBQQ-xtX6cY
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2F_KEITTIO_R19_VINOT_REIAT_MAADOITUS_WORK_TEST_20261023_1BUWWESQ_CANDIDATE = {
  id: 'auto-ylisrinne-d2f-keittio-r19-vinot-reiat-maadoitus-work-test-20261023-1buwwesq',
  label: 'Auto: Ylisrinne D2F KEITTIO R19 VINOT REIAT MAADOITUS WORK TEST 20261023 (scene97) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2f-keittio-r19-vinot-reiat-maadoitus-work-test-20261023-1buwwesq.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2f-keittio-r19-vinot-reiat-maadoitus-work-test-20261023-1buwwesq.glb',
  expectedSize: 1866736,
  expectedSha256: '40bbd1e79344aa4852cecff330c85bfe063384913d621e8ffe30eeddaa8e2f5f',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1GmgdD8I0irwiuDLDSUkSZkU3eJZVW_qR
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_1974_ABCD_2F_HUONEJAKOSEINAT_WORK_TEST_20261023_1GMGDD8I_CANDIDATE = {
  id: 'auto-ylisrinne-t12-1974-abcd-2f-huonejakoseinat-work-test-20261023-1gmgdd8i',
  label: 'Auto: Ylisrinne T12 1974 ABCD 2F HUONEJAKOSEINAT WORK TEST 20261023 (scene6) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-1974-abcd-2f-huonejakoseinat-work-test-20261023-1gmgdd8i.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-1974-abcd-2f-huonejakoseinat-work-test-20261023-1gmgdd8i.glb',
  expectedSize: 1607200,
  expectedSha256: '857d29313d7e8ebc8827e70cf2ef01be5664aa0d44b1638cdce70600e9747fff',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1e82YZUOIbUzjmd0sLfl1r99FznpCXNvH
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_KATON_HARJAPELLIT_VISUAL_PROXY_WORK_TEST_20261023_1E82YZUO_CANDIDATE = {
  id: 'auto-ylisrinne-t12-katon-harjapellit-visual-proxy-work-test-20261023-1e82yzuo',
  label: 'Auto: Ylisrinne T12 KATON HARJAPELLIT VISUAL PROXY WORK TEST 20261023 (scene64) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-katon-harjapellit-visual-proxy-work-test-20261023-1e82yzuo.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-katon-harjapellit-visual-proxy-work-test-20261023-1e82yzuo.glb',
  expectedSize: 1454800,
  expectedSha256: '8df8c24e05f0774ff953737d86c9e2fc9eebcc09b05f41e317a80a1fadc12696',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 16DuH4cpl5-RKJGF9EC8hwx3RmvqWZyMg
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_ABC_1974_2F_WALLS_D2F_R19_2026_COMBINED_WORK_TEST_20261023_16DUH4CP_CANDIDATE = {
  id: 'auto-ylisrinne-t12-abc-1974-2f-walls-d2f-r19-2026-combined-work-test-20261023-16duh4cp',
  label: 'Auto: Ylisrinne T12 ABC 1974 2F WALLS D2F R19 2026 COMBINED WORK TEST 20261023 (scene98) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-abc-1974-2f-walls-d2f-r19-2026-combined-work-test-20261023-16duh4cp.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-abc-1974-2f-walls-d2f-r19-2026-combined-work-test-20261023-16duh4cp.glb',
  expectedSize: 1891916,
  expectedSha256: 'e1764063a76395cde3c698c876271323c4d29fdbf44d19f5ca9794907affddb0',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1aWoCYNd0oWXwMr0chey38tGvZR-5ExIp
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2015_R476_KAHDEKSAN_LAHDEMERKKIA_WORK_TEST_20261023_1AWOCYND_CANDIDATE = {
  id: 'auto-ylisrinne-d2015-r476-kahdeksan-lahdemerkkia-work-test-20261023-1awocynd',
  label: 'Auto: Ylisrinne D2015 R476 KAHDEKSAN LAHDEMERKKIA WORK TEST 20261023 (scene65) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2015-r476-kahdeksan-lahdemerkkia-work-test-20261023-1awocynd.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2015-r476-kahdeksan-lahdemerkkia-work-test-20261023-1awocynd.glb',
  expectedSize: 1718336,
  expectedSha256: '5e63fa24872407e57bfc86a2ec7d041949617eeb98083fcc2f3b730bc877c55d',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1QIve3F4qaBs4UsErZ7aLF8rEWmTpGHm9
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2015_2F_3D_SEINAT_WORK_TEST_20261023_1QIVE3F4_CANDIDATE = {
  id: 'auto-ylisrinne-d2015-2f-3d-seinat-work-test-20261023-1qive3f4',
  label: 'Auto: Ylisrinne D2015 2F 3D SEINAT WORK TEST 20261023 (scene6) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2015-2f-3d-seinat-work-test-20261023-1qive3f4.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2015-2f-3d-seinat-work-test-20261023-1qive3f4.glb',
  expectedSize: 119264,
  expectedSha256: '35a7940f98cc43adad6e2a1196944410b55d6643f99af3529385d24c01f36fc5',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1KkJEDPVf3lmzFrNmlwDYXa3S_qLE-BNx
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D_TERASSI_V13_LSTEP_CONTINUOUS_VERTICAL_BRIDGE_WORK_TEST_20261023_1KKJEDPV_CANDIDATE = {
  id: 'auto-ylisrinne-d-terassi-v13-lstep-continuous-vertical-bridge-work-test-20261023-1kkjedpv',
  label: 'Auto: Ylisrinne D TERASSI V13 LSTEP CONTINUOUS VERTICAL BRIDGE WORK TEST 20261023 (scene6) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d-terassi-v13-lstep-continuous-vertical-bridge-work-test-20261023-1kkjedpv.glb`,
  objectKey: 'work-test/auto-ylisrinne-d-terassi-v13-lstep-continuous-vertical-bridge-work-test-20261023-1kkjedpv.glb',
  expectedSize: 1360888,
  expectedSha256: '7afe91abffc30b2998253075677f6788ee12b525b7f391cf710cc541acf39c34',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1nSZI_7liguiqjLSrOvBDPosJ-Lp2xbuf
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_D2015_2F_HUONE3_4_SEINAPROXY_WORK_TEST_20261023_1NSZI7LI_CANDIDATE = {
  id: 'auto-ylisrinne-t12-d2015-2f-huone3-4-seinaproxy-work-test-20261023-1nszi7li',
  label: 'Auto: Ylisrinne T12 D2015 2F HUONE3 4 SEINAPROXY WORK TEST 20261023 (scene9) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-d2015-2f-huone3-4-seinaproxy-work-test-20261023-1nszi7li.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-d2015-2f-huone3-4-seinaproxy-work-test-20261023-1nszi7li.glb',
  expectedSize: 1621600,
  expectedSha256: '2afa22732311c335fa5fd8dc42cfb353fa5e54e34997539ed8b310eae3fa3a8d',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1xw8H1lCp-VE4vaRWOJc1RmaPLTfOWADm
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_AC_1F_WETWALLS_ABC_2F_WALLS_D2F_R19_COMBINED_WORK_TEST_20261023_1XW8H1LC_CANDIDATE = {
  id: 'auto-ylisrinne-t12-ac-1f-wetwalls-abc-2f-walls-d2f-r19-combined-work-test-20261023-1xw8h1lc',
  label: 'Auto: Ylisrinne T12 AC 1F WETWALLS ABC 2F WALLS D2F R19 COMBINED WORK TEST 20261023 (scene99) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-ac-1f-wetwalls-abc-2f-walls-d2f-r19-combined-work-test-20261023-1xw8h1lc.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-ac-1f-wetwalls-abc-2f-walls-d2f-r19-combined-work-test-20261023-1xw8h1lc.glb',
  expectedSize: 1942012,
  expectedSha256: 'e54d9fbe27e00be8ceb78b62e634e67e5821c4fdcb8260d0df06137b11fb255d',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1l6_FNEhBJ1LFfh3BFA1DV7AVEPBYwstI
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_P6_1974_AVOIN_AUTOKATOS_PILARIT_VARASTO_WORK_TEST_20261023_1L6FNEHB_CANDIDATE = {
  id: 'auto-ylisrinne-p6-1974-avoin-autokatos-pilarit-varasto-work-test-20261023-1l6fnehb',
  label: 'Auto: Ylisrinne P6 1974 AVOIN AUTOKATOS PILARIT VARASTO WORK TEST 20261023 (scene1) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-p6-1974-avoin-autokatos-pilarit-varasto-work-test-20261023-1l6fnehb.glb`,
  objectKey: 'work-test/auto-ylisrinne-p6-1974-avoin-autokatos-pilarit-varasto-work-test-20261023-1l6fnehb.glb',
  expectedSize: 322596,
  expectedSha256: 'ae7cdedf0e1df10bf9411bf81505051d604d808612f789680419068c47c31d5f',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1slfLgLn9lnt4i5KySsxJB-ydNiLGYvaV
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_1974_ABC_1F_SAUNATUPA_PORRAS_ETEINEN_WALLS_WORK_TEST_20261023_1SLFLGLN_CANDIDATE = {
  id: 'auto-ylisrinne-t12-1974-abc-1f-saunatupa-porras-eteinen-walls-work-test-20261023-1slflgln',
  label: 'Auto: Ylisrinne T12 1974 ABC 1F SAUNATUPA PORRAS ETEINEN WALLS WORK TEST 20261023 (scene4) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-1974-abc-1f-saunatupa-porras-eteinen-walls-work-test-20261023-1slflgln.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-1974-abc-1f-saunatupa-porras-eteinen-walls-work-test-20261023-1slflgln.glb',
  expectedSize: 1620384,
  expectedSha256: '1a6cafa3f2766e2d927565853c2227d0912b833d1722df544cc2bc9a964d0595',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1JaIyOAZChGer19f4v7ijWUOSkSac9xf9
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_EI141_PALOVAROITIN_MODEL_LEVEL_WORK_TEST_20261023_1JAIYOAZ_CANDIDATE = {
  id: 'auto-ylisrinne-ei141-palovaroitin-model-level-work-test-20261023-1jaiyoaz',
  label: 'Auto: Ylisrinne Ei141 palovaroitin MODEL LEVEL WORK TEST 20261023 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-ei141-palovaroitin-model-level-work-test-20261023-1jaiyoaz.glb`,
  objectKey: 'work-test/auto-ylisrinne-ei141-palovaroitin-model-level-work-test-20261023-1jaiyoaz.glb',
  expectedSize: 144188,
  expectedSha256: '1e14fe5a03b5f34a34c48df27183d268a7cf883a05754edf6fc3680d58efb238',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1PMs2p76JK11CNsfBqGgBaqimu1IlCK9n
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2015_1F_UUDET_3D_SEINAT_JA_1F2F_YHD_WORK_TEST_20261023_1PMS2P76_CANDIDATE = {
  id: 'auto-ylisrinne-d2015-1f-uudet-3d-seinat-ja-1f2f-yhd-work-test-20261023-1pms2p76',
  label: 'Auto: Ylisrinne D2015 1F UUDET 3D SEINAT JA 1F2F YHD WORK TEST 20261023 (scene8) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2015-1f-uudet-3d-seinat-ja-1f2f-yhd-work-test-20261023-1pms2p76.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2015-1f-uudet-3d-seinat-ja-1f2f-yhd-work-test-20261023-1pms2p76.glb',
  expectedSize: 147656,
  expectedSha256: 'bc9647d55df6f8f124d914b1b8c3b1f3abbaa0ff73751985e87a57644d90b1f3',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 17lw0rdnjzPwr5-4x0Dq2zrKIIvte0p4o
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2015_10_KIV100_TUOTEMALLIT_R2_WORK_TEST_20261023_17LW0RDN_CANDIDATE = {
  id: 'auto-ylisrinne-d2015-10-kiv100-tuotemallit-r2-work-test-20261023-17lw0rdn',
  label: 'Auto: Ylisrinne D2015 10 KIV100 TUOTEMALLIT R2 WORK TEST 20261023 (scene6) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2015-10-kiv100-tuotemallit-r2-work-test-20261023-17lw0rdn.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2015-10-kiv100-tuotemallit-r2-work-test-20261023-17lw0rdn.glb',
  expectedSize: 1837424,
  expectedSha256: '7e5cc57f8b96a6f1c0e6f509af839fe81cbbd57ea03f6f0440291dd15f8b2a07',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 19vMxH1hEggSPPfBXr-DjOR2x8bCABMh-
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_ABC_1974_1F_18_SISAOVEA_WORK_TEST_20261023_19VMXH1H_CANDIDATE = {
  id: 'auto-ylisrinne-t12-abc-1974-1f-18-sisaovea-work-test-20261023-19vmxh1h',
  label: 'Auto: Ylisrinne T12 ABC 1974 1F 18 SISAOVEA WORK TEST 20261023 (scene100) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-abc-1974-1f-18-sisaovea-work-test-20261023-19vmxh1h.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-abc-1974-1f-18-sisaovea-work-test-20261023-19vmxh1h.glb',
  expectedSize: 1967288,
  expectedSha256: 'a814fe4a43a2ea5f1759de6efa980b3d65b984a3a07cb5a127524dad1dad1c0b',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1oIIzXs0e3-gdINaphw8Pgd_RDfgU99Dj
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_D2015_2F_WC_ALTAAN_JA_ISTUIMEN_GEOMETRIA_WORK_TEST_20261023_1OIIZXS0_CANDIDATE = {
  id: 'auto-ylisrinne-t12-d2015-2f-wc-altaan-ja-istuimen-geometria-work-test-20261023-1oiizxs0',
  label: 'Auto: Ylisrinne T12 D2015 2F WC ALTAAN JA ISTUIMEN GEOMETRIA WORK TEST 20261023 (scene11) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-d2015-2f-wc-altaan-ja-istuimen-geometria-work-test-20261023-1oiizxs0.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-d2015-2f-wc-altaan-ja-istuimen-geometria-work-test-20261023-1oiizxs0.glb',
  expectedSize: 1682004,
  expectedSha256: 'e59bf79d972f0328fe3d3c2fc746e3fc559e456a3a25cd6397ba2334b489e479',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1EkoIlDAJNIsOrKRCKY4K39ZXFtAtxsXC
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_1974_KVV_73_PIIRUSTUSLINJAN_3D_SOURCE_LOCAL_WORK_TEST_20261023_1EKOILDA_CANDIDATE = {
  id: 'auto-ylisrinne-1974-kvv-73-piirustuslinjan-3d-source-local-work-test-20261023-1ekoilda',
  label: 'Auto: Ylisrinne 1974 KVV 73 piirustuslinjan 3D SOURCE LOCAL WORK TEST 20261023 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-1974-kvv-73-piirustuslinjan-3d-source-local-work-test-20261023-1ekoilda.glb`,
  objectKey: 'work-test/auto-ylisrinne-1974-kvv-73-piirustuslinjan-3d-source-local-work-test-20261023-1ekoilda.glb',
  expectedSize: 93504,
  expectedSha256: '4abb1016a5505b3e098a1a314a6e1c88af2a3ceaa05b4c707ac08996bc14e61d',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1MtAvmVlncP0my377tJDlf-g8X-kDMgVU
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_ARK2_1985_KATTOIKKUNA_AB_SOUTH_WORK_TEST_20261023_1MTAVMVL_CANDIDATE = {
  id: 'auto-ylisrinne-t12-ark2-1985-kattoikkuna-ab-south-work-test-20261023-1mtavmvl',
  label: 'Auto: Ylisrinne T12 ARK2 1985 KATTOIKKUNA AB SOUTH WORK TEST 20261023 (scene64) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-ark2-1985-kattoikkuna-ab-south-work-test-20261023-1mtavmvl.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-ark2-1985-kattoikkuna-ab-south-work-test-20261023-1mtavmvl.glb',
  expectedSize: 1460052,
  expectedSha256: 'f8a62b78ad5929ca47949aedc7c4d285e0bc30e1ed8cde74c7751d22e7b5d12e',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1n2JLT-COYTOS6oQRcRCq1XWRKYX2w2pO
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_1985_POHJOISJULKISIVUN_PUUSALEIKKO_WORK_TEST_20261023_1N2JLTCO_CANDIDATE = {
  id: 'auto-ylisrinne-t12-1985-pohjoisjulkisivun-puusaleikko-work-test-20261023-1n2jltco',
  label: 'Auto: Ylisrinne T12 1985 POHJOISJULKISIVUN PUUSALEIKKO WORK TEST 20261023 (scene65) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-1985-pohjoisjulkisivun-puusaleikko-work-test-20261023-1n2jltco.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-1985-pohjoisjulkisivun-puusaleikko-work-test-20261023-1n2jltco.glb',
  expectedSize: 1544000,
  expectedSha256: '049b68d12452a52377bf3ffdda5c59001f96482e77ea531cbf9ea2e059ed5d8b',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1JNzv5CNanvrnM6Hcvcmw95iT7nzJEQym
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_AIRAM_COMPACT_TILT_IP44_4107625_PRODUCT_WORK_TEST_20261024_1JNZV5CN_CANDIDATE = {
  id: 'auto-ylisrinne-airam-compact-tilt-ip44-4107625-product-work-test-20261024-1jnzv5cn',
  label: 'Auto: Ylisrinne Airam Compact Tilt IP44 4107625 PRODUCT WORK TEST 20261024 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-airam-compact-tilt-ip44-4107625-product-work-test-20261024-1jnzv5cn.glb`,
  objectKey: 'work-test/auto-ylisrinne-airam-compact-tilt-ip44-4107625-product-work-test-20261024-1jnzv5cn.glb',
  expectedSize: 87552,
  expectedSha256: '678037ea7b29171d98fe845f0f514c27bddbc4b9eb37a5c17b8f56be0108ab0b',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 13_1FwW1QW3eGpPKOXIq6Lcv-2i6U8JjE
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_1974_ABC_2F_KOLME_HISTORIALLISTA_KEITTIOKALUSTERYHMAA_WORK_TEST_20261023_131FWW1Q_CANDIDATE = {
  id: 'auto-ylisrinne-t12-1974-abc-2f-kolme-historiallista-keittiokalusteryhmaa-work-test-20261023-131fww1q',
  label: 'Auto: Ylisrinne T12 1974 ABC 2F KOLME HISTORIALLISTA KEITTIOKALUSTERYHMAA WORK TEST 20261023 (scene6) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-1974-abc-2f-kolme-historiallista-keittiokalusteryhmaa-work-test-20261023-131fww1q.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-1974-abc-2f-kolme-historiallista-keittiokalusteryhmaa-work-test-20261023-131fww1q.glb',
  expectedSize: 1656480,
  expectedSha256: 'd1adf0d41fc9ae0f27bb73e6d20084aa2e0c4a4982a98068486b6828c0d21847',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1jV_BkLobFcBx_u02l2wNArp1_Blr_mdd
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2015_VILPE_E220S_ROOF_FAN_WORK_TEST_20261024_1JVBKLOB_CANDIDATE = {
  id: 'auto-ylisrinne-d2015-vilpe-e220s-roof-fan-work-test-20261024-1jvbklob',
  label: 'Auto: Ylisrinne D2015 VILPE E220S ROOF FAN WORK TEST 20261024 (scene8) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2015-vilpe-e220s-roof-fan-work-test-20261024-1jvbklob.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2015-vilpe-e220s-roof-fan-work-test-20261024-1jvbklob.glb',
  expectedSize: 1944612,
  expectedSha256: '99440eb91633020d2e7197045c125631aeb7198beb64af34ab33a973cce70a83',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 11qbl7jyLZQYNTmfe3xN16GQdmS2NA12k
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_RAYSTASKOURUT_4_JAKSOA_WORK_TEST_20261024_11QBL7JY_CANDIDATE = {
  id: 'auto-ylisrinne-t12-raystaskourut-4-jaksoa-work-test-20261024-11qbl7jy',
  label: 'Auto: Ylisrinne T12 RAYSTASKOURUT 4 JAKSOA WORK TEST 20261024 (scene65) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-raystaskourut-4-jaksoa-work-test-20261024-11qbl7jy.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-raystaskourut-4-jaksoa-work-test-20261024-11qbl7jy.glb',
  expectedSize: 1474908,
  expectedSha256: '3c0679e92b7fd4952c7defc603eb3f4fa77391078ca2d13fce61498d72209b24',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1XII3Lb7j21bSLSk2Y0mPxTd8Xjv9dJtT
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2015_VILPE_E220S_KATTOIMURI_PRODUCT_WORK_TEST_20261024_1XII3LB7_CANDIDATE = {
  id: 'auto-ylisrinne-d2015-vilpe-e220s-kattoimuri-product-work-test-20261024-1xii3lb7',
  label: 'Auto: Ylisrinne D2015 VILPE E220S KATTOIMURI PRODUCT WORK TEST 20261024 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2015-vilpe-e220s-kattoimuri-product-work-test-20261024-1xii3lb7.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2015-vilpe-e220s-kattoimuri-product-work-test-20261024-1xii3lb7.glb',
  expectedSize: 114076,
  expectedSha256: '2825d4ec2bcc68434bcdcf6896b6a5a617d14482eaf49895761c1d83447414e2',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1tH7DgpswKSbk4mbhY1rWTuEeT0At9-xt
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_1985_ITAPAATY_PYSTYLAUDAT_WORK_TEST_20261024_1TH7DGPS_CANDIDATE = {
  id: 'auto-ylisrinne-t12-1985-itapaaty-pystylaudat-work-test-20261024-1th7dgps',
  label: 'Auto: Ylisrinne T12 1985 ITAPAATY PYSTYLAUDAT WORK TEST 20261024 (scene13) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-1985-itapaaty-pystylaudat-work-test-20261024-1th7dgps.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-1985-itapaaty-pystylaudat-work-test-20261024-1th7dgps.glb',
  expectedSize: 1885380,
  expectedSha256: '9c2769dcf0fc3003383e023805901e706a7c25079754cd6a52b9de90dccafdb4',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1SNWVMU8Zhgt_5dxAkmWWKEr2VjNAz3vX
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2015_1F_V10_VIISI_SISAOVILEHTEA_2015_WORK_TEST_20261024_1SNWVMU8_CANDIDATE = {
  id: 'auto-ylisrinne-d2015-1f-v10-viisi-sisaovilehtea-2015-work-test-20261024-1snwvmu8',
  label: 'Auto: Ylisrinne D2015 1F V10 VIISI SISAOVILEHTEA 2015 WORK TEST 20261024 (scene10) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2015-1f-v10-viisi-sisaovilehtea-2015-work-test-20261024-1snwvmu8.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2015-1f-v10-viisi-sisaovilehtea-2015-work-test-20261024-1snwvmu8.glb',
  expectedSize: 179440,
  expectedSha256: 'eed9dec625d623088792f1f69ebb9e99d0546c59525452c3a4c754f0cfc01579',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1E_2uxVBM0GOsd8lVXEA6ky-m5XEKvW_o
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_1974_ABC_2F_6_DOOR_LEAVES_INTEGRATED_WORK_TEST_20261024_1E2UXVBM_CANDIDATE = {
  id: 'auto-ylisrinne-t12-1974-abc-2f-6-door-leaves-integrated-work-test-20261024-1e2uxvbm',
  label: 'Auto: Ylisrinne T12 1974 ABC 2F 6 DOOR LEAVES INTEGRATED WORK TEST 20261024 (scene100) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-1974-abc-2f-6-door-leaves-integrated-work-test-20261024-1e2uxvbm.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-1974-abc-2f-6-door-leaves-integrated-work-test-20261024-1e2uxvbm.glb',
  expectedSize: 2143272,
  expectedSha256: '81537e35f173ce6f11528e120732faf9a6333bca33f92a8f08bc842d0661d3e4',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1ZlGZ04vNeWcjP7Ssd0tGFJSDUVm7EHLi
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D1F_THEMO_3_ASENNETTUA_TUOTEESITYS_WORK_TEST_20261024_1ZLGZ04V_CANDIDATE = {
  id: 'auto-ylisrinne-d1f-themo-3-asennettua-tuoteesitys-work-test-20261024-1zlgz04v',
  label: 'Auto: Ylisrinne D1F THEMO 3 ASENNETTUA TUOTEESITYS WORK TEST 20261024 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d1f-themo-3-asennettua-tuoteesitys-work-test-20261024-1zlgz04v.glb`,
  objectKey: 'work-test/auto-ylisrinne-d1f-themo-3-asennettua-tuoteesitys-work-test-20261024-1zlgz04v.glb',
  expectedSize: 89788,
  expectedSha256: '9355320d57167568091b38d7195e46aefa5ec2bbceebdf79af67849799cff204',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1ugovvPhrhbD_-kcSfgRhiCcpVcd-wLBc
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_P3_1974_A_C_KEITTIOALAKAAPIT_WORK_TEST_20261024_1UGOVVPH_CANDIDATE = {
  id: 'auto-ylisrinne-p3-1974-a-c-keittioalakaapit-work-test-20261024-1ugovvph',
  label: 'Auto: Ylisrinne P3 1974 A-C KEITTIOALAKAAPIT WORK TEST 20261024 (scene10) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-p3-1974-a-c-keittioalakaapit-work-test-20261024-1ugovvph.glb`,
  objectKey: 'work-test/auto-ylisrinne-p3-1974-a-c-keittioalakaapit-work-test-20261024-1ugovvph.glb',
  expectedSize: 39288,
  expectedSha256: '1ee2df5387e6fea1185e4201502ab982f9b7eeb1c1a484463d6600d476e13d0c',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1U8aK58WfrfdTtZFSgDnUdPnWxDazXM9J
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_WINLED_HELMI_LASIKUUTIO_4141926_PRODUCT_WORK_TEST_20261024_1U8AK58W_CANDIDATE = {
  id: 'auto-ylisrinne-winled-helmi-lasikuutio-4141926-product-work-test-20261024-1u8ak58w',
  label: 'Auto: Ylisrinne Winled HELMI LASIKUUTIO 4141926 PRODUCT WORK TEST 20261024 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-winled-helmi-lasikuutio-4141926-product-work-test-20261024-1u8ak58w.glb`,
  objectKey: 'work-test/auto-ylisrinne-winled-helmi-lasikuutio-4141926-product-work-test-20261024-1u8ak58w.glb',
  expectedSize: 71148,
  expectedSha256: 'bc7c184a47334276604c35641a264aceb25847f5d0e68b19bacdcc6dbe745191',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 19CHPRuqovKkqeSK1anX45S2LVvTgSIJX
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_1974_ABC_1F_KOLME_SAUNAA_LAUTEET_KIUAS_WORK_TEST_20261024_19CHPRUQ_CANDIDATE = {
  id: 'auto-ylisrinne-t12-1974-abc-1f-kolme-saunaa-lauteet-kiuas-work-test-20261024-19chpruq',
  label: 'Auto: Ylisrinne T12 1974 ABC 1F KOLME SAUNAA LAUTEET KIUAS WORK TEST 20261024 (scene6) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-1974-abc-1f-kolme-saunaa-lauteet-kiuas-work-test-20261024-19chpruq.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-1974-abc-1f-kolme-saunaa-lauteet-kiuas-work-test-20261024-19chpruq.glb',
  expectedSize: 1861496,
  expectedSha256: 'f4e2d3b1d228217ee38de50ecd65fee2a16d9fb4c411fd3c1a657b46fc4846af',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 10bifxdF4ZM2LxZQ68xm48daRSNuQHEDj
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2015_SK1_400X150_2KPL_WORK_TEST_20261024_10BIFXDF_CANDIDATE = {
  id: 'auto-ylisrinne-d2015-sk1-400x150-2kpl-work-test-20261024-10bifxdf',
  label: 'Auto: Ylisrinne D2015 SK1 400x150 2kpl WORK TEST 20261024 (scene10) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2015-sk1-400x150-2kpl-work-test-20261024-10bifxdf.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2015-sk1-400x150-2kpl-work-test-20261024-10bifxdf.glb',
  expectedSize: 2029900,
  expectedSha256: '4082c8f49385c957338d405119f70b47b5f983efa362fce1b686094734ee0a75',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1o1p2V82co-F6TX3BSgePKGxTUXrgjb6Y
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_SYOKSYTORVET_5_VYOHYKETTA_WORK_TEST_20261024_1O1P2V82_CANDIDATE = {
  id: 'auto-ylisrinne-t12-syoksytorvet-5-vyohyketta-work-test-20261024-1o1p2v82',
  label: 'Auto: Ylisrinne T12 SYOKSYTORVET 5 VYOHYKETTA WORK TEST 20261024 (scene66) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-syoksytorvet-5-vyohyketta-work-test-20261024-1o1p2v82.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-syoksytorvet-5-vyohyketta-work-test-20261024-1o1p2v82.glb',
  expectedSize: 1568260,
  expectedSha256: '23b59732f90414c3baf987fc10c4d29e95b3ce90094970f7c9399f589e9d39a8',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1dP6V4d-DFkqCupK1EyzSed90KBG8zwZY
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D_TOSHIBA_DAISEIKAI8_25_35_SISAYKSIKKO_ULKOYKSIKKO_PRODUCT_WORK_TEST_20261024_1DP6V4DD_CANDIDATE = {
  id: 'auto-ylisrinne-d-toshiba-daiseikai8-25-35-sisayksikko-ulkoyksikko-product-work-test-20261024-1dp6v4dd',
  label: 'Auto: Ylisrinne D TOSHIBA DAISEIKAI8 25 35 SISAYKSIKKO ULKOYKSIKKO PRODUCT WORK TEST 20261024 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d-toshiba-daiseikai8-25-35-sisayksikko-ulkoyksikko-product-work-test-20261024-1dp6v4dd.glb`,
  objectKey: 'work-test/auto-ylisrinne-d-toshiba-daiseikai8-25-35-sisayksikko-ulkoyksikko-product-work-test-20261024-1dp6v4dd.glb',
  expectedSize: 90548,
  expectedSha256: 'f22e547a10af6ce812cd3ed34104093928a46476e9ada42ba6b9f033283f3932',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1A3wnJ8IQ3dLHf-mzIOdbJcHD_ts-Kj7x
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_1974_ABC_1F_WC_ISTUIMET_PESUALTAAT_WORK_TEST_20261024_1A3WNJ8I_CANDIDATE = {
  id: 'auto-ylisrinne-t12-1974-abc-1f-wc-istuimet-pesualtaat-work-test-20261024-1a3wnj8i',
  label: 'Auto: Ylisrinne T12 1974 ABC 1F WC ISTUIMET PESUALTAAT WORK TEST 20261024 (scene100) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-1974-abc-1f-wc-istuimet-pesualtaat-work-test-20261024-1a3wnj8i.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-1974-abc-1f-wc-istuimet-pesualtaat-work-test-20261024-1a3wnj8i.glb',
  expectedSize: 2111848,
  expectedSha256: 'a957c52963b04b4565e96a0f501a780c6f9a83754ced1cf1238cfbb16189d71a',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1A00vqcxNggKzTIJrZBARwKhPVHxFjn_n
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_1974_ABC_2F_WC_3_TOILETS_3_BASINS_WORK_TEST_20261024_1A00VQCX_CANDIDATE = {
  id: 'auto-ylisrinne-t12-1974-abc-2f-wc-3-toilets-3-basins-work-test-20261024-1a00vqcx',
  label: 'Auto: Ylisrinne T12 1974 ABC 2F WC 3 TOILETS 3 BASINS WORK TEST 20261024 (scene101) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-1974-abc-2f-wc-3-toilets-3-basins-work-test-20261024-1a00vqcx.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-1974-abc-2f-wc-3-toilets-3-basins-work-test-20261024-1a00vqcx.glb',
  expectedSize: 2608752,
  expectedSha256: 'ebb183d217c282e62837922b4b75abfb5754364ea05a6542a2ebfb94d462caf9',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1sBghiTPPAzWKfVqdzrbYfY81UFmDtg8U
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_WINLED_LILJA_6W_4142068_PRODUCT_WORK_TEST_20261024_1SBGHITP_CANDIDATE = {
  id: 'auto-ylisrinne-winled-lilja-6w-4142068-product-work-test-20261024-1sbghitp',
  label: 'Auto: Ylisrinne Winled LILJA 6W 4142068 PRODUCT WORK TEST 20261024 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-winled-lilja-6w-4142068-product-work-test-20261024-1sbghitp.glb`,
  objectKey: 'work-test/auto-ylisrinne-winled-lilja-6w-4142068-product-work-test-20261024-1sbghitp.glb',
  expectedSize: 91044,
  expectedSha256: '4215e95b58eb136b68541eb8b67b2cf406f60412d2a20587ba7255bee2328ca5',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1zrZK-BZd2WDQBGGpORjFyidH5zOQz5iu
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D_TOSHIBA_G2KVP_G2AVP_SISA_ULKO_TUOTEMALLI_WORK_TEST_20261024_1ZRZKBZD_CANDIDATE = {
  id: 'auto-ylisrinne-d-toshiba-g2kvp-g2avp-sisa-ulko-tuotemalli-work-test-20261024-1zrzkbzd',
  label: 'Auto: Ylisrinne D TOSHIBA G2KVP G2AVP SISA ULKO TUOTEMALLI WORK TEST 20261024 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d-toshiba-g2kvp-g2avp-sisa-ulko-tuotemalli-work-test-20261024-1zrzkbzd.glb`,
  objectKey: 'work-test/auto-ylisrinne-d-toshiba-g2kvp-g2avp-sisa-ulko-tuotemalli-work-test-20261024-1zrzkbzd.glb',
  expectedSize: 106836,
  expectedSha256: '8cfe05e06328ef962a0afa86970836445e4cc9aea3fbdf2e27e23a2a2a01a9bc',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1ELDCxXsrM2Xg1QT-HSjDXHjvKo3VMuuF
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2015_KSO100_TUOTEMALLI_2014_WORK_TEST_20261024_1ELDCXXS_CANDIDATE = {
  id: 'auto-ylisrinne-d2015-kso100-tuotemalli-2014-work-test-20261024-1eldcxxs',
  label: 'Auto: Ylisrinne D2015 KSO100 TUOTEMALLI 2014 WORK TEST 20261024 (scene12) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2015-kso100-tuotemalli-2014-work-test-20261024-1eldcxxs.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2015-kso100-tuotemalli-2014-work-test-20261024-1eldcxxs.glb',
  expectedSize: 88616,
  expectedSha256: 'b8801670f7f61340cff9bb669910181dcc21447af0e0ed0b4e14eb3f3d63a4a2',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1zM70kz4yO7JWotvGGE-qqraCeI98GTcU
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_2014_VIEMARIN_TUULETUSPUTKI_2_ALTERNATIIVIA_WORK_TEST_20261024_1ZM70KZ4_CANDIDATE = {
  id: 'auto-ylisrinne-t12-2014-viemarin-tuuletusputki-2-alternatiivia-work-test-20261024-1zm70kz4',
  label: 'Auto: Ylisrinne T12 2014 VIEMARIN TUULETUSPUTKI 2 ALTERNATIIVIA WORK TEST 20261024 (scene67) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-2014-viemarin-tuuletusputki-2-alternatiivia-work-test-20261024-1zm70kz4.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-2014-viemarin-tuuletusputki-2-alternatiivia-work-test-20261024-1zm70kz4.glb',
  expectedSize: 1583960,
  expectedSha256: '2c531f36cfa20cab07a7690138d393474f2849fe96068ced6c37d04207121833',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1RRtKTnmFRMOgwgOx4-9uQR6DALyNzBGe
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_P3_1974_ABC_2F_WC_KALUSTEET_WORK_TEST_20261024_1RRTKTNM_CANDIDATE = {
  id: 'auto-ylisrinne-p3-1974-abc-2f-wc-kalusteet-work-test-20261024-1rrtktnm',
  label: 'Auto: Ylisrinne P3 1974 ABC 2F WC KALUSTEET WORK TEST 20261024 (scene12) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-p3-1974-abc-2f-wc-kalusteet-work-test-20261024-1rrtktnm.glb`,
  objectKey: 'work-test/auto-ylisrinne-p3-1974-abc-2f-wc-kalusteet-work-test-20261024-1rrtktnm.glb',
  expectedSize: 212272,
  expectedSha256: 'affd91a39f8ca33d5b4f2e894091cc571cd1dc85bf3527037bd289a4e33c019a',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 16wxe_g2AxcbxAb6clqWCySR2QuVTmllM
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_MERIKA_1790RS_ELEGANCE_110_TUOTEMALLI_WORK_TEST_20261024_16WXEG2A_CANDIDATE = {
  id: 'auto-merika-1790rs-elegance-110-tuotemalli-work-test-20261024-16wxeg2a',
  label: 'Auto: Merika 1790RS ELEGANCE 110 TUOTEMALLI WORK TEST 20261024 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-merika-1790rs-elegance-110-tuotemalli-work-test-20261024-16wxeg2a.glb`,
  objectKey: 'work-test/auto-merika-1790rs-elegance-110-tuotemalli-work-test-20261024-16wxeg2a.glb',
  expectedSize: 291908,
  expectedSha256: '51bd6af9485b3ac7f07559ec84d9c9759c6b074c4c8177bdb7d159520081c450',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1MNOzYtQdTfeB7kTH_X5KTEJggRqSwp6g
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_BOSCH_WNG254ABSN_PRODUCT_WORK_TEST_20261024_1MNOZYTQ_CANDIDATE = {
  id: 'auto-ylisrinne-bosch-wng254absn-product-work-test-20261024-1mnozytq',
  label: 'Auto: Ylisrinne Bosch WNG254ABSN PRODUCT WORK TEST 20261024 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-bosch-wng254absn-product-work-test-20261024-1mnozytq.glb`,
  objectKey: 'work-test/auto-ylisrinne-bosch-wng254absn-product-work-test-20261024-1mnozytq.glb',
  expectedSize: 124104,
  expectedSha256: '4dd29f13e9d1749fd4bea3504132b8d88873d9784b2a4dc100d8b5066cd96df0',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1nWfZLEwQil9fRETUj0S--REEZlUN7f_H
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_A_C_1974_2F_3_BALCONY_DOOR_LEAVES_3D_WORK_TEST_20261024_1NWFZLEW_CANDIDATE = {
  id: 'auto-ylisrinne-a-c-1974-2f-3-balcony-door-leaves-3d-work-test-20261024-1nwfzlew',
  label: 'Auto: Ylisrinne A C 1974 2F 3 BALCONY DOOR LEAVES 3D WORK TEST 20261024 (scene102) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-a-c-1974-2f-3-balcony-door-leaves-3d-work-test-20261024-1nwfzlew.glb`,
  objectKey: 'work-test/auto-ylisrinne-a-c-1974-2f-3-balcony-door-leaves-3d-work-test-20261024-1nwfzlew.glb',
  expectedSize: 2697516,
  expectedSha256: 'c283dda450be2797a46d27ee668d686d73cf36d76b77c3f1847ff56205209591',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 149xflbjdJMQ1hxyHReTsUVHGxM7F4kRE
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D_BOSCH_WNG254ABSN_KUIVAAVA_PESUKONE_WORK_TEST_20261024_149XFLBJ_CANDIDATE = {
  id: 'auto-ylisrinne-d-bosch-wng254absn-kuivaava-pesukone-work-test-20261024-149xflbj',
  label: 'Auto: Ylisrinne D BOSCH WNG254ABSN KUIVAAVA PESUKONE WORK TEST 20261024 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d-bosch-wng254absn-kuivaava-pesukone-work-test-20261024-149xflbj.glb`,
  objectKey: 'work-test/auto-ylisrinne-d-bosch-wng254absn-kuivaava-pesukone-work-test-20261024-149xflbj.glb',
  expectedSize: 163188,
  expectedSha256: '87660e0a4c54dadfbcfb947e0efd6377cafcdeb5b703ce289100360b5f5a9fd3',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1s9XIkoEzogCgprscTM7TFFs_ANzrbgtG
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2015_KSO125_2014_TUOTEMALLI_WORK_TEST_20261024_1S9XIKOE_CANDIDATE = {
  id: 'auto-ylisrinne-d2015-kso125-2014-tuotemalli-work-test-20261024-1s9xikoe',
  label: 'Auto: Ylisrinne D2015 KSO125 2014 TUOTEMALLI WORK TEST 20261024 (scene14) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2015-kso125-2014-tuotemalli-work-test-20261024-1s9xikoe.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2015-kso125-2014-tuotemalli-work-test-20261024-1s9xikoe.glb',
  expectedSize: 90208,
  expectedSha256: '487aa969dcee7db927e7e2a125de815606398367d492aed72a66a914dacd8b83',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1vV30dzuJT88vHod4v0DDAOHs8ul_dDF9
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_1974_ABC_1F_PK_PESUKONEVARAUKSET_WORK_TEST_20261024_1VV30DZU_CANDIDATE = {
  id: 'auto-ylisrinne-t12-1974-abc-1f-pk-pesukonevaraukset-work-test-20261024-1vv30dzu',
  label: 'Auto: Ylisrinne T12 1974 ABC 1F PK PESUKONEVARAUKSET WORK TEST 20261024 (scene102) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-1974-abc-1f-pk-pesukonevaraukset-work-test-20261024-1vv30dzu.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-1974-abc-1f-pk-pesukonevaraukset-work-test-20261024-1vv30dzu.glb',
  expectedSize: 2237668,
  expectedSha256: '6355e23ff828b571669044234df794e670a16824ac3c2418dbe9386273af4614',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1oPRA6lzo6dQ0ceVcSS_vJxR2jPZ2bPyg
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2015_FLAKTWOODS_KSO125_KKT125_TUOTEMALLI_WORK_TEST_20261024_1OPRA6LZ_CANDIDATE = {
  id: 'auto-ylisrinne-d2015-flaktwoods-kso125-kkt125-tuotemalli-work-test-20261024-1opra6lz',
  label: 'Auto: Ylisrinne D2015 FLAKTWOODS KSO125 KKT125 TUOTEMALLI WORK TEST 20261024 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2015-flaktwoods-kso125-kkt125-tuotemalli-work-test-20261024-1opra6lz.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2015-flaktwoods-kso125-kkt125-tuotemalli-work-test-20261024-1opra6lz.glb',
  expectedSize: 212664,
  expectedSha256: '7e43d4f4d45da6a7eca7d2ddb9d53de19d8b94e93b75c30d1d01b4a60ee0b43d',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 13Ktfkc9XjgWcHyTLCt9Wa7zV6QsmrRBe
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_T12_1974_ABC_1F_2F_WC_KALUSTEET_WORK_TEST_20261024_13KTFKC9_CANDIDATE = {
  id: 'auto-ylisrinne-t12-1974-abc-1f-2f-wc-kalusteet-work-test-20261024-13ktfkc9',
  label: 'Auto: Ylisrinne T12 1974 ABC 1F 2F WC KALUSTEET WORK TEST 20261024 (scene8) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-t12-1974-abc-1f-2f-wc-kalusteet-work-test-20261024-13ktfkc9.glb`,
  objectKey: 'work-test/auto-ylisrinne-t12-1974-abc-1f-2f-wc-kalusteet-work-test-20261024-13ktfkc9.glb',
  expectedSize: 2138348,
  expectedSha256: '06396b5a0fdf1f385916c5d73046f74d9286cd5b2d0fd4b9f1b92c6cf6a86698',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 17yU9P05RsKZZZlZHhIc7-0aENZlxFoci
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D_BOSCH_WNG254ABSN_2026_PRODUCT_WORK_TEST_20261024_17YU9P05_CANDIDATE = {
  id: 'auto-ylisrinne-d-bosch-wng254absn-2026-product-work-test-20261024-17yu9p05',
  label: 'Auto: Ylisrinne D BOSCH WNG254ABSN 2026 PRODUCT WORK TEST 20261024 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d-bosch-wng254absn-2026-product-work-test-20261024-17yu9p05.glb`,
  objectKey: 'work-test/auto-ylisrinne-d-bosch-wng254absn-2026-product-work-test-20261024-17yu9p05.glb',
  expectedSize: 170344,
  expectedSha256: '95e48a5e928802be1b49718bb9f9dc54672da8a7e0807b06a187d99472443135',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1RiUn1Ew6H8th5TyquzrSkXxpnPAHNldd
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_A_C_1974_ETELAPARVEKKEET_KAIDE_G2_WORK_TEST_20261024_1RIUN1EW_CANDIDATE = {
  id: 'auto-ylisrinne-a-c-1974-etelaparvekkeet-kaide-g2-work-test-20261024-1riun1ew',
  label: 'Auto: Ylisrinne A-C 1974 ETELAPARVEKKEET KAIDE G2 WORK TEST 20261024 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-a-c-1974-etelaparvekkeet-kaide-g2-work-test-20261024-1riun1ew.glb`,
  objectKey: 'work-test/auto-ylisrinne-a-c-1974-etelaparvekkeet-kaide-g2-work-test-20261024-1riun1ew.glb',
  expectedSize: 214336,
  expectedSha256: '37e4c9506d466600708f4dcc1f6ae7e9e4a0e3910cdf609dd5fd4b96acde96e9',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1R-2eSIndyHyZPcjncd9215y6YwDbnrb1
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_G1C_P1_VIISI_AVOPAIKKAA_1974_WORK_TEST_20261024_1R2ESIND_CANDIDATE = {
  id: 'auto-ylisrinne-g1c-p1-viisi-avopaikkaa-1974-work-test-20261024-1r2esind',
  label: 'Auto: Ylisrinne G1c P1 VIISI AVOPAIKKAA 1974 WORK TEST 20261024 (scene1) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-g1c-p1-viisi-avopaikkaa-1974-work-test-20261024-1r2esind.glb`,
  objectKey: 'work-test/auto-ylisrinne-g1c-p1-viisi-avopaikkaa-1974-work-test-20261024-1r2esind.glb',
  expectedSize: 220928,
  expectedSha256: '3bfcda7e6d9946ba1edb8d2110941b8287f7ccc03fa7957b6444167a6f5c1c85',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1pHQwtHO6XqXsbOkQfuZMOaVSmvKyYTPh
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D_ULKO_ORAS_431515_VP1_PRODUCT_WORK_TEST_20261024_1PHQWTHO_CANDIDATE = {
  id: 'auto-ylisrinne-d-ulko-oras-431515-vp1-product-work-test-20261024-1phqwtho',
  label: 'Auto: Ylisrinne D ULKO ORAS 431515 VP1 PRODUCT WORK TEST 20261024 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d-ulko-oras-431515-vp1-product-work-test-20261024-1phqwtho.glb`,
  objectKey: 'work-test/auto-ylisrinne-d-ulko-oras-431515-vp1-product-work-test-20261024-1phqwtho.glb',
  expectedSize: 92036,
  expectedSha256: 'f500658e085fc58e15a783e00b416f3ff353cd464ddb3ccc213d38e8ba057597',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1hLtFo5nudcbRioUmpNRv3mSeUA23hqBL
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_P143A_RSTIT_PATOLEVYN_REUNALISTAT_PAATYIHIN_SUUNNITELMA_WORK_TEST_20261024_1HLTFO5N_CANDIDATE = {
  id: 'auto-ylisrinne-p143a-rstit-patolevyn-reunalistat-paatyihin-suunnitelma-work-test-20261024-1hltfo5n',
  label: 'Auto: Ylisrinne P143A RSTIT PATOLEVYN REUNALISTAT PAATYIHIN SUUNNITELMA WORK TEST 20261024 (scene31) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-p143a-rstit-patolevyn-reunalistat-paatyihin-suunnitelma-work-test-20261024-1hltfo5n.glb`,
  objectKey: 'work-test/auto-ylisrinne-p143a-rstit-patolevyn-reunalistat-paatyihin-suunnitelma-work-test-20261024-1hltfo5n.glb',
  expectedSize: 541928,
  expectedSha256: 'd3d804d1b769c646d4a1069bf4acb32f61fd4d873973c292528e2e830cf7bdb2',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1hE4rT9l7g7-rU-JWkUfjEjvjAUNBfXFS
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_P1_1974_5_AVOPAIKKAA_JA_P6_4_KATETTUA_WORK_TEST_20261024_1HE4RT9L_CANDIDATE = {
  id: 'auto-ylisrinne-p1-1974-5-avopaikkaa-ja-p6-4-katettua-work-test-20261024-1he4rt9l',
  label: 'Auto: Ylisrinne P1 1974 5 AVOPAIKKAA JA P6 4 KATETTUA WORK TEST 20261024 (scene1) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-p1-1974-5-avopaikkaa-ja-p6-4-katettua-work-test-20261024-1he4rt9l.glb`,
  objectKey: 'work-test/auto-ylisrinne-p1-1974-5-avopaikkaa-ja-p6-4-katettua-work-test-20261024-1he4rt9l.glb',
  expectedSize: 198868,
  expectedSha256: '6b00287447d0b40f96f0dc5136134d41e8618df3c3d2e46afa568aad4f4a63ec',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1FqroHPqEomEkiUPLtr1VAdvloPrZrrV6
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_ARK4_1985_KATUAITA_PORTTI_WORK_TEST_20261024_1FQROHPQ_CANDIDATE = {
  id: 'auto-ylisrinne-ark4-1985-katuaita-portti-work-test-20261024-1fqrohpq',
  label: 'Auto: Ylisrinne ARK4 1985 KATUAITA PORTTI WORK TEST 20261024 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-ark4-1985-katuaita-portti-work-test-20261024-1fqrohpq.glb`,
  objectKey: 'work-test/auto-ylisrinne-ark4-1985-katuaita-portti-work-test-20261024-1fqrohpq.glb',
  expectedSize: 147148,
  expectedSha256: 'e7455991ea490971869359b61fe5b5229c973202d92ff71eaa63c0d744fceca7',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1EUmHyMUm7DOG0bU9Awe5V9XaZ_mjPVAg
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_G1C_P1_1974_5_AVOPAIKKAA_RASTER_WORK_TEST_20261024_1EUMHYMU_CANDIDATE = {
  id: 'auto-ylisrinne-g1c-p1-1974-5-avopaikkaa-raster-work-test-20261024-1eumhymu',
  label: 'Auto: Ylisrinne G1c P1 1974 5 AVOPAIKKAA RASTER WORK TEST 20261024 (scene1) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-g1c-p1-1974-5-avopaikkaa-raster-work-test-20261024-1eumhymu.glb`,
  objectKey: 'work-test/auto-ylisrinne-g1c-p1-1974-5-avopaikkaa-raster-work-test-20261024-1eumhymu.glb',
  expectedSize: 204596,
  expectedSha256: '424bac284eb7ed915ecb7c5ee5000037a4900fb68d2b6f5e5370c3983c07ec5d',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1JLb7Fn9oUFBIsS1eaiyxdKnig8VTIKu6
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_P1_1974_5_AVOPAIKKAA_P6_HISTORICAL_PARKING_WORK_TEST_20261024_1JLB7FN9_CANDIDATE = {
  id: 'auto-ylisrinne-p1-1974-5-avopaikkaa-p6-historical-parking-work-test-20261024-1jlb7fn9',
  label: 'Auto: Ylisrinne P1 1974 5 AVOPAIKKAA P6 HISTORICAL PARKING WORK TEST 20261024 (scene2) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-p1-1974-5-avopaikkaa-p6-historical-parking-work-test-20261024-1jlb7fn9.glb`,
  objectKey: 'work-test/auto-ylisrinne-p1-1974-5-avopaikkaa-p6-historical-parking-work-test-20261024-1jlb7fn9.glb',
  expectedSize: 348656,
  expectedSha256: '7793915f5109ee8d2606a7fc54cb87f8babb6139a7f60c18aa103c5dfc0f18e3',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1ZPD94P_3yOElUtWbY2LH-Gp9bMd-kNnq
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_P1_1974_PIHAN_HIEKKALAATIKKO_WORK_TEST_20261024_1ZPD94P3_CANDIDATE = {
  id: 'auto-ylisrinne-p1-1974-pihan-hiekkalaatikko-work-test-20261024-1zpd94p3',
  label: 'Auto: Ylisrinne P1 1974 PIHAN HIEKKALAATIKKO WORK TEST 20261024 (scene104) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-p1-1974-pihan-hiekkalaatikko-work-test-20261024-1zpd94p3.glb`,
  objectKey: 'work-test/auto-ylisrinne-p1-1974-pihan-hiekkalaatikko-work-test-20261024-1zpd94p3.glb',
  expectedSize: 1956148,
  expectedSha256: '983390d6b56f6e36c0ff838a27def9a89bea1ffa767dd6e202b300c13f5ad8e0',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1mBGThoWV-HcNr3bumbQLdziw5G6FMUFJ
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_P1_1974_PIHAPUUT_KOIVU_KUUSI_MANTY_WORK_TEST_20261024_1MBGTHOW_CANDIDATE = {
  id: 'auto-ylisrinne-p1-1974-pihapuut-koivu-kuusi-manty-work-test-20261024-1mbgthow',
  label: 'Auto: Ylisrinne P1 1974 PIHAPUUT KOIVU KUUSI MANTY WORK TEST 20261024 (scene1) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-p1-1974-pihapuut-koivu-kuusi-manty-work-test-20261024-1mbgthow.glb`,
  objectKey: 'work-test/auto-ylisrinne-p1-1974-pihapuut-koivu-kuusi-manty-work-test-20261024-1mbgthow.glb',
  expectedSize: 279696,
  expectedSha256: '55a28200f382618bdb7a60b6d8d8e29946a5ae96b31096568939e5182cc91f3d',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1h3z9QOPwWMLEQX6tYS9yxRVHXtZCYVBA
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_ARK4_1985_KATUAIDAN_2M_RAKENNEDETALJI_WORK_TEST_20261024_1H3Z9QOP_CANDIDATE = {
  id: 'auto-ylisrinne-ark4-1985-katuaidan-2m-rakennedetalji-work-test-20261024-1h3z9qop',
  label: 'Auto: Ylisrinne ARK4 1985 KATUAIDAN 2M RAKENNEDETALJI WORK TEST 20261024 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-ark4-1985-katuaidan-2m-rakennedetalji-work-test-20261024-1h3z9qop.glb`,
  objectKey: 'work-test/auto-ylisrinne-ark4-1985-katuaidan-2m-rakennedetalji-work-test-20261024-1h3z9qop.glb',
  expectedSize: 25996,
  expectedSha256: 'a4b806ed6a279d030fb348b19234cb1f61447ede3ecce1b5671aef9345072990',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 18Cb0L31jCT9fGIbZvN5Qjo9QfDEskGlE
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_G1C_P6_AC_PARVEKKEET_YHDISTELMA_WORK_TEST_20261024_18CB0L31_CANDIDATE = {
  id: 'auto-ylisrinne-g1c-p6-ac-parvekkeet-yhdistelma-work-test-20261024-18cb0l31',
  label: 'Auto: Ylisrinne G1c P6 AC PARVEKKEET YHDISTELMA WORK TEST 20261024 (scene1) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-g1c-p6-ac-parvekkeet-yhdistelma-work-test-20261024-18cb0l31.glb`,
  objectKey: 'work-test/auto-ylisrinne-g1c-p6-ac-parvekkeet-yhdistelma-work-test-20261024-18cb0l31.glb',
  expectedSize: 397492,
  expectedSha256: 'a5e5bc3232f1cf6577797fff68f5be45e86ea716422edb0b213c91a2c0a4f7e5',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1Z_Wt5l8Af9WZ6SBdVb_nVFYHrLOsGyTM
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_2025_POSTILAATIKOT_AITAELEMENTTI_WORK_TEST_20261024_1ZWT5L8A_CANDIDATE = {
  id: 'auto-ylisrinne-2025-postilaatikot-aitaelementti-work-test-20261024-1zwt5l8a',
  label: 'Auto: Ylisrinne 2025 POSTILAATIKOT AITAELEMENTTI WORK TEST 20261024 (scene3) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-2025-postilaatikot-aitaelementti-work-test-20261024-1zwt5l8a.glb`,
  objectKey: 'work-test/auto-ylisrinne-2025-postilaatikot-aitaelementti-work-test-20261024-1zwt5l8a.glb',
  expectedSize: 75264,
  expectedSha256: '96b941ac6cd5f1adcac39447686b8d5aa6b83db8f5a05cd724bd63fe74988710',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1dYgVk6l6SDbdoISX2unFuWdTyCBJzJ2Z
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_ARK4_1985_KATUAITA_META_R2_WORK_TEST_20261024_1DYGVK6L_CANDIDATE = {
  id: 'auto-ylisrinne-ark4-1985-katuaita-meta-r2-work-test-20261024-1dygvk6l',
  label: 'Auto: Ylisrinne ARK4 1985 KATUAITA META R2 WORK TEST 20261024 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-ark4-1985-katuaita-meta-r2-work-test-20261024-1dygvk6l.glb`,
  objectKey: 'work-test/auto-ylisrinne-ark4-1985-katuaita-meta-r2-work-test-20261024-1dygvk6l.glb',
  expectedSize: 29104,
  expectedSha256: '079b5238e8f0b3cf63f7e441ef23d0ef304f0ea9b4f409ae39f3fffe72c8cd2f',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1xWMUDLTEdzGZ5-p6P9do98nCmRTyoZpl
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_ULKOMALLI_PARVEKKEET_PIHAPUUT_LEIKKIALUE_WORK_TEST_20261024_1XWMUDLT_CANDIDATE = {
  id: 'auto-ylisrinne-ulkomalli-parvekkeet-pihapuut-leikkialue-work-test-20261024-1xwmudlt',
  label: 'Auto: Ylisrinne ULKOMALLI PARVEKKEET PIHAPUUT LEIKKIALUE WORK TEST 20261024 (scene3) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-ulkomalli-parvekkeet-pihapuut-leikkialue-work-test-20261024-1xwmudlt.glb`,
  objectKey: 'work-test/auto-ylisrinne-ulkomalli-parvekkeet-pihapuut-leikkialue-work-test-20261024-1xwmudlt.glb',
  expectedSize: 543808,
  expectedSha256: '8255de56eef724027a6cf6071d9db8c8595ff966635f4109c7d297f907d12cda',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1C_nW3OdEkuVCTWLmSHm3LKRznGp4V9ze
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_P1_1974_POLYTYS_MATTOTELINE_R2_REBASED_WORK_TEST_20261024_1CNW3ODE_CANDIDATE = {
  id: 'auto-ylisrinne-p1-1974-polytys-mattoteline-r2-rebased-work-test-20261024-1cnw3ode',
  label: 'Auto: Ylisrinne P1 1974 POLYTYS MATTOTELINE R2 REBASED WORK TEST 20261024 (scene4) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-p1-1974-polytys-mattoteline-r2-rebased-work-test-20261024-1cnw3ode.glb`,
  objectKey: 'work-test/auto-ylisrinne-p1-1974-polytys-mattoteline-r2-rebased-work-test-20261024-1cnw3ode.glb',
  expectedSize: 574080,
  expectedSha256: '927a7536116f50bcfeedfcb76f710d34428c8bc014a7608e83a9aab0dbbbed01',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1yGAWyecD0Gl0b11P7K3twmREWN6AXVc3
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_P1_P6_1974_PIHA_YHDISTELMA_AKSELIKORJATTU_WORK_TEST_20261024_1YGAWYEC_CANDIDATE = {
  id: 'auto-ylisrinne-p1-p6-1974-piha-yhdistelma-akselikorjattu-work-test-20261024-1ygawyec',
  label: 'Auto: Ylisrinne P1 P6 1974 PIHA YHDISTELMA AKSELIKORJATTU WORK TEST 20261024 (scene5) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-p1-p6-1974-piha-yhdistelma-akselikorjattu-work-test-20261024-1ygawyec.glb`,
  objectKey: 'work-test/auto-ylisrinne-p1-p6-1974-piha-yhdistelma-akselikorjattu-work-test-20261024-1ygawyec.glb',
  expectedSize: 497920,
  expectedSha256: '69111381ca52df807f01762e08b9e482953250b540d312e181ab1a25923e2d78',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1v75dVGusOvG8R22cYMY7CfsKYo3SpKLO
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2F_R20_TUOTEMITAT_LAHDE_QA_META_WORK_TEST_20261024_1V75DVGU_CANDIDATE = {
  id: 'auto-ylisrinne-d2f-r20-tuotemitat-lahde-qa-meta-work-test-20261024-1v75dvgu',
  label: 'Auto: Ylisrinne D2F R20 TUOTEMITAT LAHDE QA META WORK TEST 20261024 (scene97) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2f-r20-tuotemitat-lahde-qa-meta-work-test-20261024-1v75dvgu.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2f-r20-tuotemitat-lahde-qa-meta-work-test-20261024-1v75dvgu.glb',
  expectedSize: 1936096,
  expectedSha256: 'e27708f2e73d6a4612c0cb79a3c6b3098769fb1c910f220d7359ed0ee3cc1cf2',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1ZYskZQkdEC5FLYDrlH3WMX3rTig1cS30
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_P1_P6_1974_PIHA_YHDISTELMA_POLYTYS_WORK_TEST_20261024_1ZYSKZQK_CANDIDATE = {
  id: 'auto-ylisrinne-p1-p6-1974-piha-yhdistelma-polytys-work-test-20261024-1zyskzqk',
  label: 'Auto: Ylisrinne P1 P6 1974 PIHA YHDISTELMA POLYTYS WORK TEST 20261024 (scene6) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-p1-p6-1974-piha-yhdistelma-polytys-work-test-20261024-1zyskzqk.glb`,
  objectKey: 'work-test/auto-ylisrinne-p1-p6-1974-piha-yhdistelma-polytys-work-test-20261024-1zyskzqk.glb',
  expectedSize: 531484,
  expectedSha256: '8dd3451d9309c3734d7e0b8e06d6b78cafa50415d6d9437a6e8d251f20e38655',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1QCZrgvDmsx4EJjPHk2MORvZkeoadA46q
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2015_IV_P02_XY_SUUNNITELMAVIITE_WORK_TEST_20261024_1QCZRGVD_CANDIDATE = {
  id: 'auto-ylisrinne-d2015-iv-p02-xy-suunnitelmaviite-work-test-20261024-1qczrgvd',
  label: 'Auto: Ylisrinne D2015 IV P02 XY SUUNNITELMAVIITE WORK TEST 20261024 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2015-iv-p02-xy-suunnitelmaviite-work-test-20261024-1qczrgvd.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2015-iv-p02-xy-suunnitelmaviite-work-test-20261024-1qczrgvd.glb',
  expectedSize: 34136,
  expectedSha256: 'd118966b8a1fc3de66dd0192e72ff1a2440441532223a4e3ff28f5480329e0e4',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 18R1scpzaCcwHO8u0a6jpxbDm6geKs2r0
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_P2_1974_ABCD_ETELASISAANKAYNTIEN_TASANTEET_YHD_POLYTYS_WORK_TEST_20261024_18R1SCPZ_CANDIDATE = {
  id: 'auto-ylisrinne-p2-1974-abcd-etelasisaankayntien-tasanteet-yhd-polytys-work-test-20261024-18r1scpz',
  label: 'Auto: Ylisrinne P2 1974 ABCD ETELASISAANKAYNTIEN TASANTEET YHD POLYTYS WORK TEST 20261024 (scene7) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-p2-1974-abcd-etelasisaankayntien-tasanteet-yhd-polytys-work-test-20261024-18r1scpz.glb`,
  objectKey: 'work-test/auto-ylisrinne-p2-1974-abcd-etelasisaankayntien-tasanteet-yhd-polytys-work-test-20261024-18r1scpz.glb',
  expectedSize: 564736,
  expectedSha256: 'caacee649ca80af854b5f8dde7b93ea633c92b5911841d1f6b6b8c29aedc17da',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1w2uMFuhIaPANz6UXtEU694wMuOAkk_E4
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_D2F_KEITTIO_R21_PESAKUPIT_VISUAL_WORK_ASSUMPTION_20261024_1W2UMFUH_CANDIDATE = {
  id: 'auto-ylisrinne-d2f-keittio-r21-pesakupit-visual-work-assumption-20261024-1w2umfuh',
  label: 'Auto: Ylisrinne D2F KEITTIO R21 PESAKUPIT VISUAL WORK ASSUMPTION 20261024 (scene98) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-d2f-keittio-r21-pesakupit-visual-work-assumption-20261024-1w2umfuh.glb`,
  objectKey: 'work-test/auto-ylisrinne-d2f-keittio-r21-pesakupit-visual-work-assumption-20261024-1w2umfuh.glb',
  expectedSize: 1876020,
  expectedSha256: '708ef95d289513b51188f1ea38e7b79bd5065a42761f4407d73ccb21e17dc3bf',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 11jTOivC2G-9z3rUq6-IgYNeqQ8p7CpaW
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_G1_PIHA_PARVEKKEET_P6_PARKKI_POLYTYS_YHD_WORK_TEST_20261024_11JTOIVC_CANDIDATE = {
  id: 'auto-ylisrinne-g1-piha-parvekkeet-p6-parkki-polytys-yhd-work-test-20261024-11jtoivc',
  label: 'Auto: Ylisrinne G1 PIHA PARVEKKEET P6 PARKKI POLYTYS YHD WORK TEST 20261024 (scene4) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-g1-piha-parvekkeet-p6-parkki-polytys-yhd-work-test-20261024-11jtoivc.glb`,
  objectKey: 'work-test/auto-ylisrinne-g1-piha-parvekkeet-p6-parkki-polytys-yhd-work-test-20261024-11jtoivc.glb',
  expectedSize: 741912,
  expectedSha256: 'ea1ab6de29dcf312191b69bde95922a0c89fd69c9c3e975ff3992a1d39b24607',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1irUCixuTYjXwyzwvZlXUXQqufVlPR-cD
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_A_C_1974_ETELAPARVEKKEET_MODUULI_G2_ALT_WORK_TEST_20261024_1IRUCIXU_CANDIDATE = {
  id: 'auto-ylisrinne-a-c-1974-etelaparvekkeet-moduuli-g2-alt-work-test-20261024-1irucixu',
  label: 'Auto: Ylisrinne A-C 1974 ETELAPARVEKKEET MODUULI G2 ALT WORK TEST 20261024 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-a-c-1974-etelaparvekkeet-moduuli-g2-alt-work-test-20261024-1irucixu.glb`,
  objectKey: 'work-test/auto-ylisrinne-a-c-1974-etelaparvekkeet-moduuli-g2-alt-work-test-20261024-1irucixu.glb',
  expectedSize: 395964,
  expectedSha256: 'ad732ca0678c1178b5a4aed3ecac5d9553911667ac4f9138a20ca47daedf0de9',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1XLvnA5PCX_SFVfaboFw4B7sOlCftIhtU
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_P1_1974_ITAPAADYN_PISTEPIHA_L_KULKUALUE_WORK_TEST_20261024_1XLVNA5P_CANDIDATE = {
  id: 'auto-ylisrinne-p1-1974-itapaadyn-pistepiha-l-kulkualue-work-test-20261024-1xlvna5p',
  label: 'Auto: Ylisrinne P1 1974 ITAPAADYN PISTEPIHA L KULKUALUE WORK TEST 20261024 (scene9) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-p1-1974-itapaadyn-pistepiha-l-kulkualue-work-test-20261024-1xlvna5p.glb`,
  objectKey: 'work-test/auto-ylisrinne-p1-1974-itapaadyn-pistepiha-l-kulkualue-work-test-20261024-1xlvna5p.glb',
  expectedSize: 600860,
  expectedSha256: '77d20d1a28b582958a40106e77963ab3560873392b2527131ffe5e7f8b3e07f1',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1d1SB6GgDzRBMCczOFz3y897bv7irPBfX
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_G1_PIHA_PARVEKKEET_PARKKI_P2_TASANTEET_WORK_TEST_20261024_1D1SB6GG_CANDIDATE = {
  id: 'auto-ylisrinne-g1-piha-parvekkeet-parkki-p2-tasanteet-work-test-20261024-1d1sb6gg',
  label: 'Auto: Ylisrinne G1 PIHA PARVEKKEET PARKKI P2 TASANTEET WORK TEST 20261024 (scene5) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-g1-piha-parvekkeet-parkki-p2-tasanteet-work-test-20261024-1d1sb6gg.glb`,
  objectKey: 'work-test/auto-ylisrinne-g1-piha-parvekkeet-parkki-p2-tasanteet-work-test-20261024-1d1sb6gg.glb',
  expectedSize: 780924,
  expectedSha256: '28da6803175b96ee15980d8e764adba04450e4b1b52e730f5afeec3061d074fc',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1ENSB495nf5181CYPrMSIYWSA7El1P0cm
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_P2_1974_ABCD_TASANTEET_METADATA_PARITEETTI_WORK_TEST_20261024_1ENSB495_CANDIDATE = {
  id: 'auto-ylisrinne-p2-1974-abcd-tasanteet-metadata-pariteetti-work-test-20261024-1ensb495',
  label: 'Auto: Ylisrinne P2 1974 ABCD TASANTEET METADATA PARITEETTI WORK TEST 20261024 (scene9) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-p2-1974-abcd-tasanteet-metadata-pariteetti-work-test-20261024-1ensb495.glb`,
  objectKey: 'work-test/auto-ylisrinne-p2-1974-abcd-tasanteet-metadata-pariteetti-work-test-20261024-1ensb495.glb',
  expectedSize: 573020,
  expectedSha256: '2204f45d9664d472e111e7373c3b80f624dec2709009e556b66c22681630f10b',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1y36LmCNtTrQH8c3XzcAiiPe1tJ464rIX
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_G1_PIHA_P2_ITAPAADYN_L_PIHA_WORK_TEST_20261024_1Y36LMCN_CANDIDATE = {
  id: 'auto-ylisrinne-g1-piha-p2-itapaadyn-l-piha-work-test-20261024-1y36lmcn',
  label: 'Auto: Ylisrinne G1 PIHA P2 ITAPAADYN L PIHA WORK TEST 20261024 (scene6) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-g1-piha-p2-itapaadyn-l-piha-work-test-20261024-1y36lmcn.glb`,
  objectKey: 'work-test/auto-ylisrinne-g1-piha-p2-itapaadyn-l-piha-work-test-20261024-1y36lmcn.glb',
  expectedSize: 819904,
  expectedSha256: '7f2fffc36908eb5ade4263976bb812c565d7f6d2058de97533399564d0b3cb6b',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1lgKNwGlXyK3tdmx-Ul_zBSNPnL1hSyrc
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_KATUPUOLI_2026_POSTILAATIKOT_AITA_PUUSTO_WORK_TEST_20261024_1LGKNWGL_CANDIDATE = {
  id: 'auto-ylisrinne-katupuoli-2026-postilaatikot-aita-puusto-work-test-20261024-1lgknwgl',
  label: 'Auto: Ylisrinne KATUPUOLI 2026 POSTILAATIKOT AITA PUUSTO WORK TEST 20261024 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-katupuoli-2026-postilaatikot-aita-puusto-work-test-20261024-1lgknwgl.glb`,
  objectKey: 'work-test/auto-ylisrinne-katupuoli-2026-postilaatikot-aita-puusto-work-test-20261024-1lgknwgl.glb',
  expectedSize: 171680,
  expectedSha256: '4b4fcda9a5d469a4c18f2a4c0fc4c87e6deded109f32e3c00eecdb95c040060f',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1cbf7M1h9x_mju8TSv8JM31oPk7-9q32l
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_ARK2_1985_ETELALAPPEEN_KATTOIKKUNA_AUKKOMERKINNAT_WORK_TEST_20261024_1CBF7M1H_CANDIDATE = {
  id: 'auto-ylisrinne-ark2-1985-etelalappeen-kattoikkuna-aukkomerkinnat-work-test-20261024-1cbf7m1h',
  label: 'Auto: Ylisrinne ARK2 1985 ETELALAPPEEN KATTOIKKUNA AUKKOMERKINNAT WORK TEST 20261024 (scene4) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-ark2-1985-etelalappeen-kattoikkuna-aukkomerkinnat-work-test-20261024-1cbf7m1h.glb`,
  objectKey: 'work-test/auto-ylisrinne-ark2-1985-etelalappeen-kattoikkuna-aukkomerkinnat-work-test-20261024-1cbf7m1h.glb',
  expectedSize: 561560,
  expectedSha256: 'ddea3e9e9e8ff95259deaca86ace05f4d4597a195377952f406fb0e5deb1e1ab',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1KwNaGAl4g2Kz4MPCBYgmETODZQmkqePL
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_KATUPUOLI_2026_POSTILAATIKOT_AITA_PUUSTO_R2_PHOTO_QA_WORK_TEST_20261024_1KWNAGAL_CANDIDATE = {
  id: 'auto-ylisrinne-katupuoli-2026-postilaatikot-aita-puusto-r2-photo-qa-work-test-20261024-1kwnagal',
  label: 'Auto: Ylisrinne KATUPUOLI 2026 POSTILAATIKOT AITA PUUSTO R2 PHOTO QA WORK TEST 20261024 (scene0) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-katupuoli-2026-postilaatikot-aita-puusto-r2-photo-qa-work-test-20261024-1kwnagal.glb`,
  objectKey: 'work-test/auto-ylisrinne-katupuoli-2026-postilaatikot-aita-puusto-r2-photo-qa-work-test-20261024-1kwnagal.glb',
  expectedSize: 198272,
  expectedSha256: '9b65ff35052da4ffed0422c5f0ca06f949f8246e0eb3702aae01905f210eff7b',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1Ud72u3umHm5_5EkAJ1rJZ4sRAm2XuEjM
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_G1_PIHA_D_PARVEKELASIT_8KPL_KENTTAMITTA_WORK_TEST_20261024_1UD72U3U_CANDIDATE = {
  id: 'auto-ylisrinne-g1-piha-d-parvekelasit-8kpl-kenttamitta-work-test-20261024-1ud72u3u',
  label: 'Auto: Ylisrinne G1 PIHA D PARVEKELASIT 8KPL KENTTAMITTA WORK TEST 20261024 (scene7) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-g1-piha-d-parvekelasit-8kpl-kenttamitta-work-test-20261024-1ud72u3u.glb`,
  objectKey: 'work-test/auto-ylisrinne-g1-piha-d-parvekelasit-8kpl-kenttamitta-work-test-20261024-1ud72u3u.glb',
  expectedSize: 825348,
  expectedSha256: '71258687cdc1b968b776ab04984d1e5098dfa94b21d7f077e4156dd2968f3141',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1K6fvLL7flW5mVe95ibAvqR-8KrW_MZnF
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_P6_2022_AUTOKATOKSEN_RANNIT_2_LINJAA_WORK_TEST_20261024_1K6FVLL7_CANDIDATE = {
  id: 'auto-ylisrinne-p6-2022-autokatoksen-rannit-2-linjaa-work-test-20261024-1k6fvll7',
  label: 'Auto: Ylisrinne P6 2022 AUTOKATOKSEN RANNIT 2 LINJAA WORK TEST 20261024 (scene7) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-p6-2022-autokatoksen-rannit-2-linjaa-work-test-20261024-1k6fvll7.glb`,
  objectKey: 'work-test/auto-ylisrinne-p6-2022-autokatoksen-rannit-2-linjaa-work-test-20261024-1k6fvll7.glb',
  expectedSize: 843684,
  expectedSha256: 'd2c3d37aaa98e6183c3bc5f8d821184473f1b716a2e5e8dfffabcceeb566d8e0',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1Ne62_ZvGScfZcuLhTKnqN56o6pjQG2N4
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_P1_1974_POLYTYS_YKSI_KEHIKKO_VAALEANVIHREA_R3_WORK_TEST_20261024_1NE62ZVG_CANDIDATE = {
  id: 'auto-ylisrinne-p1-1974-polytys-yksi-kehikko-vaaleanvihrea-r3-work-test-20261024-1ne62zvg',
  label: 'Auto: Ylisrinne P1 1974 POLYTYS YKSI KEHIKKO VAALEANVIHREA R3 WORK TEST 20261024 (scene6) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-p1-1974-polytys-yksi-kehikko-vaaleanvihrea-r3-work-test-20261024-1ne62zvg.glb`,
  objectKey: 'work-test/auto-ylisrinne-p1-1974-polytys-yksi-kehikko-vaaleanvihrea-r3-work-test-20261024-1ne62zvg.glb',
  expectedSize: 616188,
  expectedSha256: 'fa020e62e70351c5c6f41ced84743449959ec502c13049ca3267fe5f6fbce03f',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1c0u3E5OdhokDf2jsrt9lkN4b_b55QYHE
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_G1_PIHA_D_PARVEKE_ALAKAIDE_5JAKSOA_KUVA_WORK_TEST_20261024_1C0U3E5O_CANDIDATE = {
  id: 'auto-ylisrinne-g1-piha-d-parveke-alakaide-5jaksoa-kuva-work-test-20261024-1c0u3e5o',
  label: 'Auto: Ylisrinne G1 PIHA D PARVEKE ALAKAIDE 5JAKSOA KUVA WORK TEST 20261024 (scene8) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-g1-piha-d-parveke-alakaide-5jaksoa-kuva-work-test-20261024-1c0u3e5o.glb`,
  objectKey: 'work-test/auto-ylisrinne-g1-piha-d-parveke-alakaide-5jaksoa-kuva-work-test-20261024-1c0u3e5o.glb',
  expectedSize: 854512,
  expectedSha256: 'f07c3a38907c0514dd2260620f241e0a1f7e43bcdef25c3a98a43958850bae64',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1l4IFvw6-0-pstIdakM_t7esCLUmFqAJx
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_G1_PIHA_P6_RANNIT_POLYTYS_R3_YKSI_VIHREA_20261024_1L4IFVW6_CANDIDATE = {
  id: 'auto-ylisrinne-g1-piha-p6-rannit-polytys-r3-yksi-vihrea-20261024-1l4ifvw6',
  label: 'Auto: Ylisrinne G1 PIHA P6 RANNIT POLYTYS R3 YKSI VIHREA 20261024 (scene9) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-g1-piha-p6-rannit-polytys-r3-yksi-vihrea-20261024-1l4ifvw6.glb`,
  objectKey: 'work-test/auto-ylisrinne-g1-piha-p6-rannit-polytys-r3-yksi-vihrea-20261024-1l4ifvw6.glb',
  expectedSize: 884932,
  expectedSha256: '29443a42d395a0b720405b8c31f886b43e8e79e35efa3c768d525a642886977d',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1IJX0ep1Lv9VwCjgrHjn1XtjLXeJnyZ_P
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_G1_PIHA_D_PARVEKE_KATON_ALAPINTA_LAUDOITUS_TYOOLETUS_WORK_TEST_20261024_1IJX0EP1_CANDIDATE = {
  id: 'auto-ylisrinne-g1-piha-d-parveke-katon-alapinta-laudoitus-tyooletus-work-test-20261024-1ijx0ep1',
  label: 'Auto: Ylisrinne G1 PIHA D PARVEKE KATON ALAPINTA LAUDOITUS TYOOLETUS WORK TEST 20261024 (scene9) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-g1-piha-d-parveke-katon-alapinta-laudoitus-tyooletus-work-test-20261024-1ijx0ep1.glb`,
  objectKey: 'work-test/auto-ylisrinne-g1-piha-d-parveke-katon-alapinta-laudoitus-tyooletus-work-test-20261024-1ijx0ep1.glb',
  expectedSize: 874544,
  expectedSha256: '1e3adb50c5be52c455b11421efb93c2025cbe42907f552165dcd354d27cb970e',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1Qa6UwFfVHrsFy2YpCeWvgp0zwTNBB3-3
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_G1_PIHA_D_PARVEKELASIT_ALAKAIDE_R3_P6_RANNIT_WORK_TEST_20261024_1QA6UWFF_CANDIDATE = {
  id: 'auto-ylisrinne-g1-piha-d-parvekelasit-alakaide-r3-p6-rannit-work-test-20261024-1qa6uwff',
  label: 'Auto: Ylisrinne G1 PIHA D PARVEKELASIT ALAKAIDE R3 P6 RANNIT WORK TEST 20261024 (scene11) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-g1-piha-d-parvekelasit-alakaide-r3-p6-rannit-work-test-20261024-1qa6uwff.glb`,
  objectKey: 'work-test/auto-ylisrinne-g1-piha-d-parvekelasit-alakaide-r3-p6-rannit-work-test-20261024-1qa6uwff.glb',
  expectedSize: 926740,
  expectedSha256: 'd1c34375c77b73ef8da46461e56a759c7de4ed905fc89fcb0fd02a84d3f306ac',
} as const satisfies PrivateWorkTestCandidate;

// Auto-registered 2026-10-24 from Drive queue file 1LjFXXF_PUcUKEpFeBLhePZhDY1dhT8wf
// by auto-publish-work-test. WORK_TEST, never as-built.
const AUTO_YLISRINNE_G1_PIHA_R3_P6_D_PARVEKE_LASIT_KAIDE_KATON_ALAPINTA_WORK_TEST_20261024_1LJFXXFP_CANDIDATE = {
  id: 'auto-ylisrinne-g1-piha-r3-p6-d-parveke-lasit-kaide-katon-alapinta-work-test-20261024-1ljfxxfp',
  label: 'Auto: Ylisrinne G1 PIHA R3 P6 D PARVEKE LASIT KAIDE KATON ALAPINTA WORK TEST 20261024 (scene13) - WORK_TEST',
  path: `${PRIVATE_WORK_TEST_PREFIX}/auto-ylisrinne-g1-piha-r3-p6-d-parveke-lasit-kaide-katon-alapinta-work-test-20261024-1ljfxxfp.glb`,
  objectKey: 'work-test/auto-ylisrinne-g1-piha-r3-p6-d-parveke-lasit-kaide-katon-alapinta-work-test-20261024-1ljfxxfp.glb',
  expectedSize: 959516,
  expectedSha256: 'ad8fb72729acf72170232989c3e84da33be45c333beef300745861ded1c666f2',
} as const satisfies PrivateWorkTestCandidate;

const PRIVATE_WORK_TEST_RUNTIME_CANDIDATES = [
  ...PRIVATE_WORK_TEST_CANDIDATES,
  M5A_Z2D_D100_D300_DIAMETER_CANDIDATE,
  M5A_Z2D_R1090_WELL_TOP_GROUND_SURFACE_CANDIDATE,
  M5A_R1125_PVK_DIAMETER_SOURCE_SPLIT_CANDIDATE,
  M5A_R1125_SCENE64_NUMBERED_ROUTES_CANDIDATE,
  M5B_R1109_FIVE_DOWNSPOUT_PRESENCE_ZONES_CANDIDATE,
  M5A_R1115_SOK23_PLANNED_RAISE_PRESENCE_CANDIDATE,
  P137E_D1F_THREE_WALL_MOUNTED_THEMOS_CANDIDATE,
  D1F_COMBINED_WALL_115_100_CANDIDATE,
  D1F_MEASURED_WALL_BASIN_CANDIDATE,
  D1F_FINISHED_FACE_2360_CANDIDATE,
  D1F_FOUR_REVIEW_CORRECTIONS_CANDIDATE,
  D1F_BATHROOM_SURFACES_CANDIDATE,
  D1F_WC_THEMO_CANDIDATE,
  D1F_SERVICE_CANDIDATE,
  D1F_WC3530_CENTERED_CANDIDATE,
  D1F_WC450_CLOSED_CANDIDATE,
  D1F_WC450_SURFACE_FIX_CANDIDATE,
  D1F_ODENSVIK_BASIN_CORRECTION_CANDIDATE,
  D1F_ODENSVIK_WINDING_CORRECTED_ZIP_CANDIDATE,
  D1F_KPH_010204_ZIP_CANDIDATE,
  D1F_SHOWER_PHOTO_CANDIDATE,
  D1F_SCENE156_SOURCE_ROOM_WORK_TEST_CANDIDATE,
  D1F_SOURCE156_SEVEN_CAMERA_CUTAWAY_CANDIDATE,
  D1F_SOURCE156_FLOOR_V02_B_SEVEN_CAMERA_CANDIDATE,
  SHARED300_SCENE299_DEFAULT_CANDIDATE,
  AUTO_LINJASTOTESTI_SHARED300_SAUNA_1ONONK83_CANDIDATE,
  AUTO_YLISRINNE_KOKO_RAKENNUS_T12_TONTTIRAJA_KATTOLUUKKU1985_WORK_TEST_20261019_1QLW0IOG_CANDIDATE,
  AUTO_YLISRINNE_SALAOJAT_KOKO_JARJESTELMA_LOPPUKATSELMUS_WORK_TEST_20261020_1WVOUCZR_CANDIDATE,
  AUTO_YLISRINNE_D1F_KPH09_THEMO_KYTKINLINJA_WORK_TEST_SOURCE68_20261019_1I7YH3UN_CANDIDATE,
  AUTO_YLISRINNE_D1F_KPH09_KEINU_JA_KIERTO_WORK_TEST_20261020_1ECBCHK9_CANDIDATE,
  AUTO_YLISRINNE_SHARED301_KPH09_ROCKER_ROTARY_USER_TOP1020_WORK_TEST_20261020_1DYF7YBK_CANDIDATE,
  AUTO_YLISRINNE_SHARED302_KPH09_PHOTO_PROPORTIONS_WORK_TEST_20261020_1HIDRKMI_CANDIDATE,
  AUTO_YLISRINNE_D2015_SAHKO_RYHMAT_JA_ERIKOISMERKINNAT_P186E_X1_WORK_TEST_20261020_1UPLDDRW_CANDIDATE,
  AUTO_YLISRINNE_SALAOJAT_RING_R2_KAIVOT_KULMISSA_PVK_D500_WORK_TEST_20261020_1YETNBQU_CANDIDATE,
  AUTO_YLISRINNE_D2015_LATTIALAMMITYS_KAAPELIT_ABC_P186C_X2R_WORK_TEST_20261020_1TVD8O38_CANDIDATE,
  AUTO_YLISRINNE_D_TERASSI_WORK_TEST_20261020_1YOVLX2V_CANDIDATE,
  AUTO_YLISRINNE_D2015_P186E_X1_ERILLISVIENTI_WORK_TEST_20261021_1LTFR1LY_CANDIDATE,
  AUTO_YLISRINNE_SHARED302_GLTF_RAKENNEKORJAUS_WORK_TEST_20261021_1SNJ66TN_CANDIDATE,
  AUTO_YLISRINNE_D2015_D2F_SOURCELINKS_WORK_TEST_20261021_1JZKNHGQ_CANDIDATE,
  AUTO_YLISRINNE_SHARED302_KPH09_LASIKAARI_RITILAT_KYTKINKEHYS_WORK_TEST_20261021_15ZEABSU_CANDIDATE,
  AUTO_YLISRINNE_SALAOJAT_RING_R2_SOURCELINKS_WORK_TEST_20261021_10YZXIPU_CANDIDATE,
  AUTO_YLISRINNE_D_TERASSI_SOURCELINKS_WORK_TEST_20261021_1VCG9VUE_CANDIDATE,
  AUTO_YLISRINNE_T12_VALOAUKOT_SOURCELINKS8_WORK_TEST_20261021_1AAD4L4S_CANDIDATE,
  AUTO_YLISRINNE_T12_AC_TILATOPOLOGIA36_WORK_TEST_20261021_1KDUBCHT_CANDIDATE,
  AUTO_YLISRINNE_SHARED302_KPH09_M5B_SOK_KULMAT_SOURCELINKS_WORK_TEST_20261021_1L9NLRVN_CANDIDATE,
  AUTO_YLISRINNE_SALAOJAT_RING_R2_BOUNDARY_MARKERS_SOURCELINKS_WORK_TEST_20261021_1NEXUOHV_CANDIDATE,
  AUTO_YLISRINNE_SHARED302_PEILIKAAPPI_SOURCELINKS15_WORK_TEST_20261021_1WHVAUWZ_CANDIDATE,
  AUTO_YLISRINNE_SHARED302_PEILIKAAPPI_SEINALAHDE_WORK_TEST_20261021_1Z6J7HRV_CANDIDATE,
  AUTO_YLISRINNE_D2015_IV_P145A_SOURCELINKS_WORK_TEST_20261021_184MV2HZ_CANDIDATE,
  AUTO_YLISRINNE_SHARED302_PEILIKAAPPI_SISAINEN_SEINAVIITE_WORK_TEST_20261021_1BV68SDQ_CANDIDATE,
  AUTO_YLISRINNE_SHARED302_KPH09_NORDIC3_3530_WC_KOMPONENTTI_WORK_TEST_20261022_11O4ZCXX_CANDIDATE,
  AUTO_YLISRINNE_SHARED302_KPH09_NORDIC3_3530_WC_V2_WORK_TEST_20261022_1BOVC16K_CANDIDATE,
  AUTO_YLISRINNE_SHARED302_KPH09_IV_KATTOLIITOS_WORK_TEST_20261022_1MOWKPIT_CANDIDATE,
  AUTO_YLISRINNE_SHARED302_KPH09_LASIKAARI_SUUNTA_WORK_TEST_20261021_1X3WVDJS_CANDIDATE,
  AUTO_YLISRINNE_G3_2017_KVV_XY_SOURCE_LINES_WORK_TEST_20261022_1EO3AFQZ_CANDIDATE,
  AUTO_YLISRINNE_SHARED302_SOURCELINKS6_METADATA_ONLY_OLD_KPH_GEOMETRY_WORK_TEST_20261022_19OZAJRD_CANDIDATE,
  AUTO_YLISRINNE_SHARED302_KPH09_HAVAINTOTILA8_9_SOURCELINKS_WORK_TEST_20261022_10LODCSN_CANDIDATE,
  AUTO_YLISRINNE_D2015_P186E_X1_HIERARCHY_ORIG_SCENE64_WORK_TEST_20261021_1LDXJEYA_CANDIDATE,
  AUTO_YLISRINNE_D2015_P186E_X1_SOURCE_LINKS34_ORIG_SCENE64_WORK_TEST_20261022_1TNJFN6M_CANDIDATE,
  AUTO_YLISRINNE_SHARED302_KPH09_KYTKINKEHYS_B_MITTAMETADATA_WORK_TEST_20261022_1IRVBUX7_CANDIDATE,
  AUTO_YLISRINNE_SHARED302_KPH09_ALANUPPI_VALOHIMMENNIN_WORK_TEST_20261022_1PPCUQB9_CANDIDATE,
  AUTO_YLISRINNE_SHARED302_KPH09_IV1_SISAKATON_AUKOTUS_WORK_TEST_20261022_1SAP5ZNN_CANDIDATE,
  AUTO_YLISRINNE_D2F_VK1_PAX_A_WORK_TEST_20261022_1BI7Z2NV_CANDIDATE,
  AUTO_YLISRINNE_D2F_VK1_PAX_B_WORK_TEST_20261022_11G28B0J_CANDIDATE,
  AUTO_YLISRINNE_T12_KATTOLUUKKU_1985_SOURCELINKS_V2_WORK_TEST_20261022_1IXVVITL_CANDIDATE,
  AUTO_YLISRINNE_SALAOJAT_RING_R2_NW_SUUNNITELMAVIITE_WORK_TEST_20261022_1SZ2JKX7_CANDIDATE,
  AUTO_YLISRINNE_D2F_VK1_PAX15_SOURCELINKS_V2_20261022_1LW1JPFM_CANDIDATE,
  AUTO_YLISRINNE_D2F_VK1_PAX15_SOURCELINKS_V2_20261022_1IWKEI29_CANDIDATE,
  AUTO_YLISRINNE_SALAOJAT_RING_R2_PVK_CLEARANCE_WORK_TEST_20261022_1OB3OQH5_CANDIDATE,
  AUTO_YLISRINNE_SALAOJAT_RING_R2_PVK_CLEARANCE_SOK12_NAKYVYYS_WORK_TEST_20261022_1BZB45B9_CANDIDATE,
  AUTO_YLISRINNE_D2015_D2F_KESKUSKAAVIO2014_SOURCELINKS_WORK_TEST_20261022_1WDQV2K5_CANDIDATE,
  AUTO_YLISRINNE_SHARED302_KPH09_IV1_SOURCEDOCID_V2_WORK_TEST_20261022_1DJAESIS_CANDIDATE,
  AUTO_YLISRINNE_G1C_AUTOKATOS_P6_NELJA_KATETTUA_WORK_TEST_20261022_18JRZ20W_CANDIDATE,
  AUTO_YLISRINNE_T12_VALOAUKOT_KATTOPINNAN_NAKYVYYS_WORK_TEST_20261022_1TDRLK2Z_CANDIDATE,
  AUTO_YLISRINNE_SALAOJAT_RING_R2_SOK12_OPASTEIDEN_LAHDELINKIT_WORK_TEST_20261022_1EIBP5HC_CANDIDATE,
  AUTO_YLISRINNE_SHARED302_KPH09_IV1_DOCID_V2_SAUNA_2IKKUNAA_V074_SOURCELINKS_WORK_TEST_20261022_10JD6XH1_CANDIDATE,
  AUTO_YLISRINNE_SHARED302_KPH09_VIESER_DESIGN_51290_WORK_TEST_20261022_17X6TTNS_CANDIDATE,
  AUTO_YLISRINNE_SHARED302_KPH09_KAIVONKANNET_VALOKUVA_20VIILTOA_WORK_TEST_20261022_1OED6MBD_CANDIDATE,
  AUTO_YLISRINNE_SHARED302_KPH09_KAIVONKANNET_VALOKUVA_VIILLOT_REUNA_TUMMA_WORK_TEST_20261022_1YU3VUTA_CANDIDATE,
  AUTO_YLISRINNE_D_TERASSI_L_ASKELMA_V2_WORK_TEST_20261022_1MP4FCTE_CANDIDATE,
  AUTO_YLISRINNE_G1C_P6_4KATETTUA_DOCID_WORK_TEST_20261022_1IEXMV8D_CANDIDATE,
  AUTO_YLISRINNE_T12_8_VALOAUKON_ROOLIMERKIT_WORK_TEST_20261022_1CTOPNCO_CANDIDATE,
  AUTO_YLISRINNE_KPH09_20_VIILTOA_VALOKUVASTA_TARKISTETTU_WORK_TEST_20261022_1YRN2DLK_CANDIDATE,
  AUTO_YLISRINNE_D_TERASSI_L_ASKELMA_V3_WORK_TEST_20261022_1WJQJBT9_CANDIDATE,
  AUTO_YLISRINNE_D_TERASSI_L_ASKELMA_V4_LOCAL_TERRAIN_CLIP_WORK_TEST_20261022_1UQGNUTC_CANDIDATE,
  AUTO_YLISRINNE_T12_8_VALOAUKON_3D_FOOTPRINTIT_WORK_TEST_20261022_1OR2PXPG_CANDIDATE,
  AUTO_YLISRINNE_D1F_ETEISEN_KAAPIT_2015_5_MODULES_WORK_TEST_20261022_1IMCI825_CANDIDATE,
  AUTO_YLISRINNE_KPH09_20_VIILTOA_OMISTAJAN_AUKOTUSHYVAKSYNTA_METADATA_WORK_TEST_20261022_1BC9JI7W_CANDIDATE,
  AUTO_YLISRINNE_D2F_2015_3_OVILEHTEA_AVATTU_SULJETTU_WORK_TEST_20261022_1WVGYFGT_CANDIDATE,
  AUTO_YLISRINNE_D2F_2015_KEITTION_SEINAKAAPIT_WORK_TEST_20261022_1UM19VWZ_CANDIDATE,
  AUTO_YLISRINNE_D1F_ETEISEN_KAAPIT_2015_GAP_APPROX300_WORK_TEST_20261022_1NZFANJF_CANDIDATE,
  AUTO_YLISRINNE_D_TERASSI_L_ASKELMA_V5_TERRAIN_EDGE_CONTINUITY_WORK_TEST_20261022_1PPWEKWQ_CANDIDATE,
  AUTO_YLISRINNE_D2F_2015_KEITTION_SEINAKAAPIT_SOURCELINKS_WORK_TEST_20261022_1KJEK3BT_CANDIDATE,
  AUTO_YLISRINNE_T12_A_D_PAASISAANKAYNTIEN_OVILEHDET_WORK_TEST_20261022_1IUH5KDR_CANDIDATE,
  AUTO_YLISRINNE_2015_LASTENHUONE_NORDLI3_ME3104_SOURCE_ONLY_WORK_TEST_20261022_1TGCZXNO_CANDIDATE,
  AUTO_YLISRINNE_T12_1974_AC_1F_MARKATILASEINAT_WORK_TEST_20261022_1NFLAQXG_CANDIDATE,
  AUTO_YLISRINNE_D2F_2015_KEITTION_KAAPIT_SISAOVET_KIINNI_SOURCELINKS_WORK_TEST_20261022_1A6EVZLM_CANDIDATE,
  AUTO_YLISRINNE_T12_1974_ABC_2F_HUONEJAKOSEINAT_WORK_TEST_20261022_1DXW1YUZ_CANDIDATE,
  AUTO_YLISRINNE_2015_LASTENHUONE_9KALUSTETTA_SKALAND_SIGURD_WORK_TEST_20261022_1I5ZENUU_CANDIDATE,
  AUTO_YLISRINNE_T12_1974_ABC_1F_ETELA_TK_VH_SOURCE_PLAN_WORK_TEST_20261022_1VVKQRN5_CANDIDATE,
  AUTO_YLISRINNE_T12_1974_ABC_1F_ETEINEN_KAYTAVA_JAKOSEINAT_WORK_TEST_20261022_1YE5PZ6I_CANDIDATE,
  AUTO_YLISRINNE_T12_1974_ABC_1F_H_SEINAT_TK_VH_YHDISTE_WORK_TEST_20261022_1RQZYQWY_CANDIDATE,
  AUTO_YLISRINNE_T12_1974_ABC_2F_WC_SEINAT_YHDISTE_WORK_TEST_20261022_1OMRGZYS_CANDIDATE,
  AUTO_YLISRINNE_T12_1974_ABC_1F_H_TKVH_2F_WC_YHDISTE_WORK_TEST_20261022_1JIOO3I3_CANDIDATE,
  AUTO_YLISRINNE_T12_1974_ABC_3_PORRASTA_WORK_TEST_20261022_1BFMYFMW_CANDIDATE,
  AUTO_YLISRINNE_KPH09_SAUNA_U_IKKUNAT_MITAT_WORK_TEST_20261022_1DSE7LF0_CANDIDATE,
  AUTO_YLISRINNE_KPH09_SAUNA_IKKUNAT_SYMMETRIA_USER_CONFIRMED_WORK_TEST_20261022_1VCJUDCJ_CANDIDATE,
  AUTO_YLISRINNE_KPH09_LASIKAARI_WCKANSI_OWNER_REVIEW_META_WORK_TEST_20261022_1JVCREIW_CANDIDATE,
  AUTO_YLISRINNE_D2F_2024_KITCHEN_PHOTO_CORRECTED_R1_WITH_DOORS_WORK_TEST_20261022_1UMYOVPO_CANDIDATE,
  AUTO_YLISRINNE_D1F_KAAPIT_ULKOSEINAPUOLI_PROVENANSSI_WORK_TEST_20261022_1VMOOMQL_CANDIDATE,
  AUTO_YLISRINNE_D2F_2024_KITCHEN_R2_3X600_TALL_QA_VERIFIED_WORK_TEST_20261022_1KHYPX9F_CANDIDATE,
  AUTO_YLISRINNE_D1F_KAAPIT_PAATYJEN_KUVATARKISTUS_WORK_TEST_20261022_13P6MZDM_CANDIDATE,
  AUTO_YLISRINNE_D2F_2024_KITCHEN_R3_AISLE1200_PHOTO_WORK_TEST_20261022_1MOCYC5P_CANDIDATE,
  AUTO_YLISRINNE_D_TERASSI_L_ASKELMA_V6_WEST_LEG_TERRAIN_BLEND_WORK_TEST_20261022_1JJ1KLIB_CANDIDATE,
  AUTO_YLISRINNE_D1F_KAAPIT_G1_AKSELISUUNTA_TYOKOHDISTUS_WORK_TEST_20261022_1TTTKQO5_CANDIDATE,
  AUTO_YLISRINNE_D1F_KAAPIT_POHJAPIIRUSTUS_XY_VYOHYKE_WORK_TEST_20261022_1UPG3BXE_CANDIDATE,
  AUTO_YLISRINNE_D_TERASSI_LASKELMA_V7_45JIIRI_MAASTO_WORK_TEST_20261023_1XOLDYLU_CANDIDATE,
  AUTO_YLISRINNE_D1F_KAAPIT_RAKO_LEVEYS_AVOIN_WORK_TEST_20261023_1OJ3RQAU_CANDIDATE,
  AUTO_YLISRINNE_D2F_2024_KITCHEN_R4_4TALL_OWNER_REVIEW_WORK_TEST_20261023_1K19ILGO_CANDIDATE,
  AUTO_YLISRINNE_D2F_KEITTIO_R4_4_KORKEAA_OWNER_WORK_TEST_20261023_1K6OSSKJ_CANDIDATE,
  AUTO_YLISRINNE_D2F_KEITTIO_R6_SAAREKE_VIINIKAAPPI_ETUJAKO_WORK_TEST_20261023_1IM1GFTN_CANDIDATE,
  AUTO_YLISRINNE_D_TERASSI_NAKOSUOJA_V8_KUVARISTIKKO_WORK_TEST_20261023_1KRPYPKW_CANDIDATE,
  AUTO_YLISRINNE_D2F_2015_3_OVILEHTEA_R2_KAYNTIVALYS_TYO_OLETUS_WORK_TEST_20261023_1H4IL6YL_CANDIDATE,
  AUTO_YLISRINNE_D2F_KEITTIO_R13_KULMA_LAATAT_2X2_VAAKAKEHYS_SAUMAVIITE_WORK_TEST_20261023_16PQH2JB_CANDIDATE,
  AUTO_YLISRINNE_D_TERASSI_NAKOSUOJA_V12_KAKSI_PANEELIA_PORRASTUS_MAASTO_WORK_TEST_20261023_1RTHFO9Z_CANDIDATE,
  AUTO_YLISRINNE_D_TERASSI_NAKOSUOJA_V11_KOLME_PORRASTETTUA_ELEMENTTIA_KATSELMUS01_WORK_TEST_20261023_1IQK4JDJ_CANDIDATE,
  AUTO_YLISRINNE_D2F_KEITTIO_R19_VINOT_REIAT_MAADOITUS_WORK_TEST_20261023_1BUWWESQ_CANDIDATE,
  AUTO_YLISRINNE_T12_1974_ABCD_2F_HUONEJAKOSEINAT_WORK_TEST_20261023_1GMGDD8I_CANDIDATE,
  AUTO_YLISRINNE_T12_KATON_HARJAPELLIT_VISUAL_PROXY_WORK_TEST_20261023_1E82YZUO_CANDIDATE,
  AUTO_YLISRINNE_T12_ABC_1974_2F_WALLS_D2F_R19_2026_COMBINED_WORK_TEST_20261023_16DUH4CP_CANDIDATE,
  AUTO_YLISRINNE_D2015_R476_KAHDEKSAN_LAHDEMERKKIA_WORK_TEST_20261023_1AWOCYND_CANDIDATE,
  AUTO_YLISRINNE_D2015_2F_3D_SEINAT_WORK_TEST_20261023_1QIVE3F4_CANDIDATE,
  AUTO_YLISRINNE_D_TERASSI_V13_LSTEP_CONTINUOUS_VERTICAL_BRIDGE_WORK_TEST_20261023_1KKJEDPV_CANDIDATE,
  AUTO_YLISRINNE_T12_D2015_2F_HUONE3_4_SEINAPROXY_WORK_TEST_20261023_1NSZI7LI_CANDIDATE,
  AUTO_YLISRINNE_T12_AC_1F_WETWALLS_ABC_2F_WALLS_D2F_R19_COMBINED_WORK_TEST_20261023_1XW8H1LC_CANDIDATE,
  AUTO_YLISRINNE_P6_1974_AVOIN_AUTOKATOS_PILARIT_VARASTO_WORK_TEST_20261023_1L6FNEHB_CANDIDATE,
  AUTO_YLISRINNE_T12_1974_ABC_1F_SAUNATUPA_PORRAS_ETEINEN_WALLS_WORK_TEST_20261023_1SLFLGLN_CANDIDATE,
  AUTO_YLISRINNE_EI141_PALOVAROITIN_MODEL_LEVEL_WORK_TEST_20261023_1JAIYOAZ_CANDIDATE,
  AUTO_YLISRINNE_D2015_1F_UUDET_3D_SEINAT_JA_1F2F_YHD_WORK_TEST_20261023_1PMS2P76_CANDIDATE,
  AUTO_YLISRINNE_D2015_10_KIV100_TUOTEMALLIT_R2_WORK_TEST_20261023_17LW0RDN_CANDIDATE,
  AUTO_YLISRINNE_T12_ABC_1974_1F_18_SISAOVEA_WORK_TEST_20261023_19VMXH1H_CANDIDATE,
  AUTO_YLISRINNE_T12_D2015_2F_WC_ALTAAN_JA_ISTUIMEN_GEOMETRIA_WORK_TEST_20261023_1OIIZXS0_CANDIDATE,
  AUTO_YLISRINNE_1974_KVV_73_PIIRUSTUSLINJAN_3D_SOURCE_LOCAL_WORK_TEST_20261023_1EKOILDA_CANDIDATE,
  AUTO_YLISRINNE_T12_ARK2_1985_KATTOIKKUNA_AB_SOUTH_WORK_TEST_20261023_1MTAVMVL_CANDIDATE,
  AUTO_YLISRINNE_T12_1985_POHJOISJULKISIVUN_PUUSALEIKKO_WORK_TEST_20261023_1N2JLTCO_CANDIDATE,
  AUTO_YLISRINNE_AIRAM_COMPACT_TILT_IP44_4107625_PRODUCT_WORK_TEST_20261024_1JNZV5CN_CANDIDATE,
  AUTO_YLISRINNE_T12_1974_ABC_2F_KOLME_HISTORIALLISTA_KEITTIOKALUSTERYHMAA_WORK_TEST_20261023_131FWW1Q_CANDIDATE,
  AUTO_YLISRINNE_D2015_VILPE_E220S_ROOF_FAN_WORK_TEST_20261024_1JVBKLOB_CANDIDATE,
  AUTO_YLISRINNE_T12_RAYSTASKOURUT_4_JAKSOA_WORK_TEST_20261024_11QBL7JY_CANDIDATE,
  AUTO_YLISRINNE_D2015_VILPE_E220S_KATTOIMURI_PRODUCT_WORK_TEST_20261024_1XII3LB7_CANDIDATE,
  AUTO_YLISRINNE_T12_1985_ITAPAATY_PYSTYLAUDAT_WORK_TEST_20261024_1TH7DGPS_CANDIDATE,
  AUTO_YLISRINNE_D2015_1F_V10_VIISI_SISAOVILEHTEA_2015_WORK_TEST_20261024_1SNWVMU8_CANDIDATE,
  AUTO_YLISRINNE_T12_1974_ABC_2F_6_DOOR_LEAVES_INTEGRATED_WORK_TEST_20261024_1E2UXVBM_CANDIDATE,
  AUTO_YLISRINNE_D1F_THEMO_3_ASENNETTUA_TUOTEESITYS_WORK_TEST_20261024_1ZLGZ04V_CANDIDATE,
  AUTO_YLISRINNE_P3_1974_A_C_KEITTIOALAKAAPIT_WORK_TEST_20261024_1UGOVVPH_CANDIDATE,
  AUTO_YLISRINNE_WINLED_HELMI_LASIKUUTIO_4141926_PRODUCT_WORK_TEST_20261024_1U8AK58W_CANDIDATE,
  AUTO_YLISRINNE_T12_1974_ABC_1F_KOLME_SAUNAA_LAUTEET_KIUAS_WORK_TEST_20261024_19CHPRUQ_CANDIDATE,
  AUTO_YLISRINNE_D2015_SK1_400X150_2KPL_WORK_TEST_20261024_10BIFXDF_CANDIDATE,
  AUTO_YLISRINNE_T12_SYOKSYTORVET_5_VYOHYKETTA_WORK_TEST_20261024_1O1P2V82_CANDIDATE,
  AUTO_YLISRINNE_D_TOSHIBA_DAISEIKAI8_25_35_SISAYKSIKKO_ULKOYKSIKKO_PRODUCT_WORK_TEST_20261024_1DP6V4DD_CANDIDATE,
  AUTO_YLISRINNE_T12_1974_ABC_1F_WC_ISTUIMET_PESUALTAAT_WORK_TEST_20261024_1A3WNJ8I_CANDIDATE,
  AUTO_YLISRINNE_T12_1974_ABC_2F_WC_3_TOILETS_3_BASINS_WORK_TEST_20261024_1A00VQCX_CANDIDATE,
  AUTO_YLISRINNE_WINLED_LILJA_6W_4142068_PRODUCT_WORK_TEST_20261024_1SBGHITP_CANDIDATE,
  AUTO_YLISRINNE_D_TOSHIBA_G2KVP_G2AVP_SISA_ULKO_TUOTEMALLI_WORK_TEST_20261024_1ZRZKBZD_CANDIDATE,
  AUTO_YLISRINNE_D2015_KSO100_TUOTEMALLI_2014_WORK_TEST_20261024_1ELDCXXS_CANDIDATE,
  AUTO_YLISRINNE_T12_2014_VIEMARIN_TUULETUSPUTKI_2_ALTERNATIIVIA_WORK_TEST_20261024_1ZM70KZ4_CANDIDATE,
  AUTO_YLISRINNE_P3_1974_ABC_2F_WC_KALUSTEET_WORK_TEST_20261024_1RRTKTNM_CANDIDATE,
  AUTO_MERIKA_1790RS_ELEGANCE_110_TUOTEMALLI_WORK_TEST_20261024_16WXEG2A_CANDIDATE,
  AUTO_YLISRINNE_BOSCH_WNG254ABSN_PRODUCT_WORK_TEST_20261024_1MNOZYTQ_CANDIDATE,
  AUTO_YLISRINNE_A_C_1974_2F_3_BALCONY_DOOR_LEAVES_3D_WORK_TEST_20261024_1NWFZLEW_CANDIDATE,
  AUTO_YLISRINNE_D_BOSCH_WNG254ABSN_KUIVAAVA_PESUKONE_WORK_TEST_20261024_149XFLBJ_CANDIDATE,
  AUTO_YLISRINNE_D2015_KSO125_2014_TUOTEMALLI_WORK_TEST_20261024_1S9XIKOE_CANDIDATE,
  AUTO_YLISRINNE_T12_1974_ABC_1F_PK_PESUKONEVARAUKSET_WORK_TEST_20261024_1VV30DZU_CANDIDATE,
  AUTO_YLISRINNE_D2015_FLAKTWOODS_KSO125_KKT125_TUOTEMALLI_WORK_TEST_20261024_1OPRA6LZ_CANDIDATE,
  AUTO_YLISRINNE_T12_1974_ABC_1F_2F_WC_KALUSTEET_WORK_TEST_20261024_13KTFKC9_CANDIDATE,
  AUTO_YLISRINNE_D_BOSCH_WNG254ABSN_2026_PRODUCT_WORK_TEST_20261024_17YU9P05_CANDIDATE,
  AUTO_YLISRINNE_A_C_1974_ETELAPARVEKKEET_KAIDE_G2_WORK_TEST_20261024_1RIUN1EW_CANDIDATE,
  AUTO_YLISRINNE_G1C_P1_VIISI_AVOPAIKKAA_1974_WORK_TEST_20261024_1R2ESIND_CANDIDATE,
  AUTO_YLISRINNE_D_ULKO_ORAS_431515_VP1_PRODUCT_WORK_TEST_20261024_1PHQWTHO_CANDIDATE,
  AUTO_YLISRINNE_P143A_RSTIT_PATOLEVYN_REUNALISTAT_PAATYIHIN_SUUNNITELMA_WORK_TEST_20261024_1HLTFO5N_CANDIDATE,
  AUTO_YLISRINNE_P1_1974_5_AVOPAIKKAA_JA_P6_4_KATETTUA_WORK_TEST_20261024_1HE4RT9L_CANDIDATE,
  AUTO_YLISRINNE_ARK4_1985_KATUAITA_PORTTI_WORK_TEST_20261024_1FQROHPQ_CANDIDATE,
  AUTO_YLISRINNE_G1C_P1_1974_5_AVOPAIKKAA_RASTER_WORK_TEST_20261024_1EUMHYMU_CANDIDATE,
  AUTO_YLISRINNE_P1_1974_5_AVOPAIKKAA_P6_HISTORICAL_PARKING_WORK_TEST_20261024_1JLB7FN9_CANDIDATE,
  AUTO_YLISRINNE_P1_1974_PIHAN_HIEKKALAATIKKO_WORK_TEST_20261024_1ZPD94P3_CANDIDATE,
  AUTO_YLISRINNE_P1_1974_PIHAPUUT_KOIVU_KUUSI_MANTY_WORK_TEST_20261024_1MBGTHOW_CANDIDATE,
  AUTO_YLISRINNE_ARK4_1985_KATUAIDAN_2M_RAKENNEDETALJI_WORK_TEST_20261024_1H3Z9QOP_CANDIDATE,
  AUTO_YLISRINNE_G1C_P6_AC_PARVEKKEET_YHDISTELMA_WORK_TEST_20261024_18CB0L31_CANDIDATE,
  AUTO_YLISRINNE_2025_POSTILAATIKOT_AITAELEMENTTI_WORK_TEST_20261024_1ZWT5L8A_CANDIDATE,
  AUTO_YLISRINNE_ARK4_1985_KATUAITA_META_R2_WORK_TEST_20261024_1DYGVK6L_CANDIDATE,
  AUTO_YLISRINNE_ULKOMALLI_PARVEKKEET_PIHAPUUT_LEIKKIALUE_WORK_TEST_20261024_1XWMUDLT_CANDIDATE,
  AUTO_YLISRINNE_P1_1974_POLYTYS_MATTOTELINE_R2_REBASED_WORK_TEST_20261024_1CNW3ODE_CANDIDATE,
  AUTO_YLISRINNE_P1_P6_1974_PIHA_YHDISTELMA_AKSELIKORJATTU_WORK_TEST_20261024_1YGAWYEC_CANDIDATE,
  AUTO_YLISRINNE_D2F_R20_TUOTEMITAT_LAHDE_QA_META_WORK_TEST_20261024_1V75DVGU_CANDIDATE,
  AUTO_YLISRINNE_P1_P6_1974_PIHA_YHDISTELMA_POLYTYS_WORK_TEST_20261024_1ZYSKZQK_CANDIDATE,
  AUTO_YLISRINNE_D2015_IV_P02_XY_SUUNNITELMAVIITE_WORK_TEST_20261024_1QCZRGVD_CANDIDATE,
  AUTO_YLISRINNE_P2_1974_ABCD_ETELASISAANKAYNTIEN_TASANTEET_YHD_POLYTYS_WORK_TEST_20261024_18R1SCPZ_CANDIDATE,
  AUTO_YLISRINNE_D2F_KEITTIO_R21_PESAKUPIT_VISUAL_WORK_ASSUMPTION_20261024_1W2UMFUH_CANDIDATE,
  AUTO_YLISRINNE_G1_PIHA_PARVEKKEET_P6_PARKKI_POLYTYS_YHD_WORK_TEST_20261024_11JTOIVC_CANDIDATE,
  AUTO_YLISRINNE_A_C_1974_ETELAPARVEKKEET_MODUULI_G2_ALT_WORK_TEST_20261024_1IRUCIXU_CANDIDATE,
  AUTO_YLISRINNE_P1_1974_ITAPAADYN_PISTEPIHA_L_KULKUALUE_WORK_TEST_20261024_1XLVNA5P_CANDIDATE,
  AUTO_YLISRINNE_G1_PIHA_PARVEKKEET_PARKKI_P2_TASANTEET_WORK_TEST_20261024_1D1SB6GG_CANDIDATE,
  AUTO_YLISRINNE_P2_1974_ABCD_TASANTEET_METADATA_PARITEETTI_WORK_TEST_20261024_1ENSB495_CANDIDATE,
  AUTO_YLISRINNE_G1_PIHA_P2_ITAPAADYN_L_PIHA_WORK_TEST_20261024_1Y36LMCN_CANDIDATE,
  AUTO_YLISRINNE_KATUPUOLI_2026_POSTILAATIKOT_AITA_PUUSTO_WORK_TEST_20261024_1LGKNWGL_CANDIDATE,
  AUTO_YLISRINNE_ARK2_1985_ETELALAPPEEN_KATTOIKKUNA_AUKKOMERKINNAT_WORK_TEST_20261024_1CBF7M1H_CANDIDATE,
  AUTO_YLISRINNE_KATUPUOLI_2026_POSTILAATIKOT_AITA_PUUSTO_R2_PHOTO_QA_WORK_TEST_20261024_1KWNAGAL_CANDIDATE,
  AUTO_YLISRINNE_G1_PIHA_D_PARVEKELASIT_8KPL_KENTTAMITTA_WORK_TEST_20261024_1UD72U3U_CANDIDATE,
  AUTO_YLISRINNE_P6_2022_AUTOKATOKSEN_RANNIT_2_LINJAA_WORK_TEST_20261024_1K6FVLL7_CANDIDATE,
  AUTO_YLISRINNE_P1_1974_POLYTYS_YKSI_KEHIKKO_VAALEANVIHREA_R3_WORK_TEST_20261024_1NE62ZVG_CANDIDATE,
  AUTO_YLISRINNE_G1_PIHA_D_PARVEKE_ALAKAIDE_5JAKSOA_KUVA_WORK_TEST_20261024_1C0U3E5O_CANDIDATE,
  AUTO_YLISRINNE_G1_PIHA_P6_RANNIT_POLYTYS_R3_YKSI_VIHREA_20261024_1L4IFVW6_CANDIDATE,
  AUTO_YLISRINNE_G1_PIHA_D_PARVEKE_KATON_ALAPINTA_LAUDOITUS_TYOOLETUS_WORK_TEST_20261024_1IJX0EP1_CANDIDATE,
  AUTO_YLISRINNE_G1_PIHA_D_PARVEKELASIT_ALAKAIDE_R3_P6_RANNIT_WORK_TEST_20261024_1QA6UWFF_CANDIDATE,
  AUTO_YLISRINNE_G1_PIHA_R3_P6_D_PARVEKE_LASIT_KAIDE_KATON_ALAPINTA_WORK_TEST_20261024_1LJFXXFP_CANDIDATE,
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
type PrivateWorkTestListResult = {
  objects: Array<PrivateWorkTestObjectMetadata & { key: string }>;
  truncated: boolean;
  cursor?: string;
};

type PrivateWorkTestBucket = {
  get(key: string): Promise<PrivateWorkTestStoredObject | null>;
  head?(key: string): Promise<PrivateWorkTestObjectMetadata | null>;
  list?(options?: {
    prefix?: string;
    cursor?: string;
    limit?: number;
    include?: string[];
  }): Promise<PrivateWorkTestListResult>;
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
  PRIVATE_WORK_TEST_RUNTIME_CANDIDATES.find((candidate) => candidate.path === pathname) ?? null;

export const getPrivateWorkTestCandidateById = (id: string) =>
  PRIVATE_WORK_TEST_RUNTIME_CANDIDATES.find((candidate) => candidate.id === id) ?? null;

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

const privateWorkTestCatalogListedObjects = async (
  bucket: PrivateWorkTestBucket,
): Promise<Map<string, PrivateWorkTestObjectMetadata> | null> => {
  if (!bucket.list) return null;

  const objects = new Map<string, PrivateWorkTestObjectMetadata>();
  let cursor: string | undefined;

  while (true) {
    const page = await bucket.list({
      prefix: 'work-test/',
      limit: 1000,
      include: ['customMetadata'],
      ...(cursor ? { cursor } : {}),
    });

    for (const object of page.objects) objects.set(object.key, object);

    if (!page.truncated || !page.cursor) break;
    cursor = page.cursor;
  }

  return objects;
};

const privateWorkTestCatalogResponse = async (
  request: Request,
  bucket: PrivateWorkTestBucket,
): Promise<Response> => {
  const candidates = [];
  const listedObjects = await privateWorkTestCatalogListedObjects(bucket);

  for (const candidate of PRIVATE_WORK_TEST_RUNTIME_CANDIDATES) {
    const object = listedObjects
      ? listedObjects.get(candidate.objectKey) ?? null
      : await privateWorkTestCatalogObject(bucket, candidate.objectKey);
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
  revalidate = false,
): Promise<Response> => {
  const object = await bucket.get(candidate.objectKey);

  if (!object || !isPrivateWorkTestObjectValid(object, candidate)) {
    console.info('private-model work-test deny: candidate-not-ready');
    return notFound();
  }

  const headers = privateHeaders();
  object.writeHttpMetadata?.(headers);
  // Viewer route only: the SHA-pinned candidate is a strong validator, so the
  // signed-in browser may keep a private copy and revalidate it (304).
  const etag = revalidate ? privateGlbEtag(candidate.expectedSha256) : null;
  if (etag) {
    applyPrivateGlbRevalidation(headers, etag);
    if (privateGlbIfNoneMatchHits(request, etag)) return privateGlbNotModified(headers, etag, object.body);
  } else {
    headers.set('Cache-Control', 'private, no-store');
  }
  headers.set('Content-Type', 'model/gltf-binary');
  headers.set('Content-Disposition', 'inline');
  headers.set('Content-Length', String(candidate.expectedSize));
  if (!etag && object.etag) headers.set('ETag', object.etag);

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

  return privateWorkTestCandidateResponse(request, bucket, candidate, true);
};


