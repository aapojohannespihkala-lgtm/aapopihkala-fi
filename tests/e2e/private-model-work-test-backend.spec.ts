import { expect, test } from '@playwright/test';

import {
  PRIVATE_WORK_TEST_CANDIDATES,
  PRIVATE_WORK_TEST_CATALOG_PATH,
  PRIVATE_WORK_TEST_IMPORT_PATH,
  PRIVATE_WORK_TEST_UPLOAD_PREFIX,
  PRIVATE_WORK_TEST_PUBLISH_PREFIX,
  PRIVATE_WORK_TEST_VERIFY_CATALOG_PATH,
  PRIVATE_WORK_TEST_VERIFY_GLB_PREFIX,
  getPrivateWorkTestCandidate,
  getPrivateWorkTestCandidateById,
  getPrivateWorkTestUploadCandidate,
  getPrivateWorkTestPublishCandidate,
  getPrivateWorkTestVerifyCandidate,
  handlePrivateWorkTestPublish,
  handlePrivateWorkTestRequest,
  isPrivateWorkTestObjectValid,
  isPrivateWorkTestPath,
  isTrustedPrivateWorkTestResolvedSourceUrl,
  isTrustedPrivateWorkTestSourceUrl,
  validatePrivateWorkTestUploadBytes,
  writePrivateWorkTestCandidateFromRequest,
} from '../../worker/privateWorkTest';
import {
  privateModelPublisherClaimError,
  privateModelReadbackClaimError,
  verifyPrivateModelPublisherAccess,
  verifyPrivateModelReadbackAccess,
  type PrivateModelEnv,
} from '../../worker/privateModel';

test('private WORK_TEST route matching is bounded to the dedicated prefix', () => {
  expect(isPrivateWorkTestPath('/private-model/work-test')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/catalog.json')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/import.json')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/upload/p143h-scalgo-label-axis.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/publish/p150g-whole-building-end-plinth.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/verify/catalog.json')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/verify/p150g-whole-building-end-plinth.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p136b-d-current-wall-corrected.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p137j-d1f-user-current-doors.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/g3-locus-site-p06-axis-corrected.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p139n-federated-kvv-review.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p139ab-z-credible-wastewater-review.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p143a-scalgo-terrain.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p143f-scalgo-contours.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p143g-scalgo-cartography.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p143h-scalgo-label-axis.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p143j-scalgo-label-flow.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p144c-g3-1974-iv-on-p143h.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p145b-1974-iv-section-worktargets.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p155cb-d-storage-roof.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p151c-whole-building-carrier.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p150fr-whole-building-substructure.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p150g-whole-building-end-plinth.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p156i-2017-kvv-main-presentation.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p161-multisource-systems-carrier.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p170a-p161-review-visibility.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p170d-p161-review-visibility-correction.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p171c-d-stair-opening-guard-lowwall-junction.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p173d-whole-building-d-wall-hr67-rebase.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p174a-r2-west-gable-termination-correction.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p175b-r3-near-building-flatter-terrain.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p176a-hr6-full-visible-west-gable-termination-correction.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p177b-hr6-direct-d-storage-north-wall-line-corrected.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p178b-d-stair-guard-lowwall-junction-closure.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p181b-r1-ac-storage-ground-contact-substructure-terrain-rebase.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p184d-whole-building-survivor-island-x-source-chain.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p164b-d-corrected-stair.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p167f-whole-building-precise-stair.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p168a-whole-building-roof-eave-correction.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p169a-whole-building-ac-storage-visible.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p169f-whole-building-ac-storage-doors.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p159-whole-building-storage-context.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p160-d-composite-architecture.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p154c-d-wall-cutouts.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-test/p153c-d-stair-guard-lowwall.glb')).toBe(true);
  expect(isPrivateWorkTestPath('/private-model/work-testing')).toBe(false);
  expect(isPrivateWorkTestPath('/private-model/model.glb')).toBe(false);
});

test('private WORK_TEST candidate allowlist exposes named review routes including P145B, P155C-B, P151C, P150F-R, P150G and P156I', () => {
  expect(PRIVATE_WORK_TEST_CANDIDATES).toHaveLength(42);

  const p136b = PRIVATE_WORK_TEST_CANDIDATES[0];
  expect(p136b.id).toBe('p136b-d-current-wall-corrected');
  expect(p136b.objectKey).toBe('work-test/p136b-d-current-wall-corrected.glb');
  expect(p136b.expectedSize).toBe(1_149_768);
  expect(p136b.expectedSha256).toBe(
    '8a0f78f3f150f43fda65c93f9536594fe72d7713a6a6a946191e00b61cc4f4bf',
  );

  const p137j = PRIVATE_WORK_TEST_CANDIDATES[1];
  expect(p137j.id).toBe('p137j-d1f-user-current-doors');
  expect(p137j.objectKey).toBe('work-test/p137j-d1f-user-current-doors.glb');
  expect(p137j.expectedSize).toBe(1_154_364);
  expect(p137j.expectedSha256).toBe(
    '9e8a7286b1fbeb9730cf1a8ed358fbd07391c5cc7bb084320b30a4506b3186a4',
  );

  const locus = PRIVATE_WORK_TEST_CANDIDATES[2];
  expect(locus.id).toBe('g3-locus-site-p06-axis-corrected');
  expect(locus.objectKey).toBe('work-test/g3-locus-site-p06-axis-corrected.glb');
  expect(locus.expectedSize).toBe(1_158_672);
  expect(locus.expectedSha256).toBe(
    '0b4549b160fadf9c6c15adc1fb04fc0c0b0f9b46e6e19b6844a55205356d7efb',
  );

  const p139n = PRIVATE_WORK_TEST_CANDIDATES[3];
  expect(p139n.id).toBe('p139n-federated-kvv-review');
  expect(p139n.objectKey).toBe('work-test/p139n-federated-kvv-review.glb');
  expect(p139n.expectedSize).toBe(1_193_724);
  expect(p139n.expectedSha256).toBe(
    'b713b9cc29b1e865dc7ca0b640589d9d1440cffe5e665297c6760745a149e515',
  );

  const p139ab = PRIVATE_WORK_TEST_CANDIDATES[4];
  expect(p139ab.id).toBe('p139ab-z-credible-wastewater-review');
  expect(p139ab.objectKey).toBe('work-test/p139ab-z-credible-wastewater-review.glb');
  expect(p139ab.expectedSize).toBe(1_199_352);
  expect(p139ab.expectedSha256).toBe(
    '6470e7c529546231725856e94c11203d86b1e66f0e6645bb36ce01aec2275159',
  );

  const p143a = PRIVATE_WORK_TEST_CANDIDATES[5];
  expect(p143a.id).toBe('p143a-scalgo-terrain');
  expect(p143a.objectKey).toBe('work-test/p143a-scalgo-terrain.glb');
  expect(p143a.expectedSize).toBe(1_352_620);
  expect(p143a.expectedSha256).toBe(
    '383e26a1ebbae28afa3caf3bbf614368574a5eca93db422b451369edac95961e',
  );

  const p143f = PRIVATE_WORK_TEST_CANDIDATES[6];
  expect(p143f.id).toBe('p143f-scalgo-contours');
  expect(p143f.objectKey).toBe('work-test/p143f-scalgo-contours.glb');
  expect(p143f.expectedSize).toBe(1_481_704);
  expect(p143f.expectedSha256).toBe(
    '2f0be722f43a0e47ad59f2c65e1f1449a6e5af51b80811e71f8a5dc9a28fbfb0',
  );

  const p143g = PRIVATE_WORK_TEST_CANDIDATES[7];
  expect(p143g.id).toBe('p143g-scalgo-cartography');
  expect(p143g.objectKey).toBe('work-test/p143g-scalgo-cartography.glb');
  expect(p143g.expectedSize).toBe(1_661_536);
  expect(p143g.expectedSha256).toBe(
    'fdde532b713249178111a9e830ebe6b52cf8a600b9f206fdc049abb072d55e02',
  );

  const p143h = PRIVATE_WORK_TEST_CANDIDATES[8];
  expect(p143h.id).toBe('p143h-scalgo-label-axis');
  expect(p143h.objectKey).toBe('work-test/p143h-scalgo-label-axis.glb');
  expect(p143h.expectedSize).toBe(1_673_484);
  expect(p143h.expectedSha256).toBe(
    '768972c522f63de0629020874f690b796b54f7c6d70125248d51f39b8d682c56',
  );

  const p143j = PRIVATE_WORK_TEST_CANDIDATES[9];
  expect(p143j.id).toBe('p143j-scalgo-label-flow');
  expect(p143j.objectKey).toBe('work-test/p143j-scalgo-label-flow.glb');
  expect(p143j.expectedSize).toBe(1_684_500);
  expect(p143j.expectedSha256).toBe(
    '4c2cea0eccff70754952750b12be7c24d150545feac0e17b3f86ebbb24c28578',
  );

  const p144c = PRIVATE_WORK_TEST_CANDIDATES[10];
  expect(p144c.id).toBe('p144c-g3-1974-iv-on-p143h');
  expect(p144c.objectKey).toBe('work-test/p144c-g3-1974-iv-on-p143h.glb');
  expect(p144c.expectedSize).toBe(1_720_068);
  expect(p144c.expectedSha256).toBe(
    '739e5cfed61edae7464af4edf77dfdf4c34354def6f88c993c2ca62f2c29ece1',
  );

  const p145b = PRIVATE_WORK_TEST_CANDIDATES[11];
  expect(p145b.id).toBe('p145b-1974-iv-section-worktargets');
  expect(p145b.objectKey).toBe('work-test/p145b-1974-iv-section-worktargets.glb');
  expect(p145b.expectedSize).toBe(1_732_508);
  expect(p145b.expectedSha256).toBe(
    '0d6754bde828bba9b7e78806c5ab8eac0a11a5077f43b8f3a5410f74e16c40e9',
  );

  const p155cb = PRIVATE_WORK_TEST_CANDIDATES[12];
  expect(p155cb.id).toBe('p155cb-d-storage-roof');
  expect(p155cb.objectKey).toBe('work-test/p155cb-d-storage-roof.glb');
  expect(p155cb.expectedSize).toBe(1_187_956);
  expect(p155cb.expectedSha256).toBe(
    '9adf08632a89b8a76540addd611e7d5b6a9be59b76b3e4e871621b6f624f7c82',
  );

  const p151c = PRIVATE_WORK_TEST_CANDIDATES[13];
  expect(p151c.id).toBe('p151c-whole-building-carrier');
  expect(p151c.objectKey).toBe('work-test/p151c-whole-building-carrier.glb');
  expect(p151c.expectedSize).toBe(1_913_540);
  expect(p151c.expectedSha256).toBe(
    '67581d3d4f4a444c182a89c56c09235a22e6055e7f9edd7d0d28a6960329b043',
  );

  const p150fr = getPrivateWorkTestCandidateById('p150fr-whole-building-substructure');
  expect(p150fr).toMatchObject({
    id: 'p150fr-whole-building-substructure',
    objectKey: 'work-test/p150fr-whole-building-substructure.glb',
    expectedSize: 1_919_860,
    expectedSha256: '13ca8995e873982a91d7fe1bd82eff97a3a09f9688507b2fa488244cca1b0e03',
  });

  const p150g = getPrivateWorkTestCandidateById('p150g-whole-building-end-plinth');
  expect(p150g).toMatchObject({
    id: 'p150g-whole-building-end-plinth',
    label: 'P150G whole-building end-plinth correction - WORK_TEST',
    path: '/private-model/work-test/p150g-whole-building-end-plinth.glb',
    objectKey: 'work-test/p150g-whole-building-end-plinth.glb',
    expectedSize: 1_986_004,
    expectedSha256: 'a17fdc1cbc29c4ecfcab3e94554b5ea5860c9a19db33e21f24c324acf70d6d89',
  });

  const p156i = getPrivateWorkTestCandidateById('p156i-2017-kvv-main-presentation');
  expect(p156i).toMatchObject({
    id: 'p156i-2017-kvv-main-presentation',
    objectKey: 'work-test/p156i-2017-kvv-main-presentation.glb',
    expectedSize: 1_848_532,
    expectedSha256: '072890e75cd693c05dc705d6a5581e999b9124d37d99aa914336c0a1d9b3ef3f',
  });

  const p161 = getPrivateWorkTestCandidateById('p161-multisource-systems-carrier');
  expect(p161).toMatchObject({
    id: 'p161-multisource-systems-carrier',
    label: 'P161 multisource systems review carrier - WORK_TEST',
    path: '/private-model/work-test/p161-multisource-systems-carrier.glb',
    objectKey: 'work-test/p161-multisource-systems-carrier.glb',
    expectedSize: 1_858_948,
    expectedSha256: '7413fa57b423260cfff9554fae96a8167fba48d03a7c570806a509e58e3ca65d',
  });

  const p170a = getPrivateWorkTestCandidateById('p170a-p161-review-visibility');
  expect(p170a).toMatchObject({
    id: 'p170a-p161-review-visibility',
    label: 'P170A P161 review visibility presentation successor - WORK_TEST',
    path: '/private-model/work-test/p170a-p161-review-visibility.glb',
    objectKey: 'work-test/p170a-p161-review-visibility.glb',
    expectedSize: 1_877_872,
    expectedSha256: '447e587b9903ec36056df2fa414620086a601bbfb5f3fcdd89a9cb9928e86368',
  });

  const p170d = getPrivateWorkTestCandidateById('p170d-p161-review-visibility-correction');
  expect(p170d).toMatchObject({
    id: 'p170d-p161-review-visibility-correction',
    label: 'P170D-R2 P161 review visibility placement correction - WORK_TEST',
    path: '/private-model/work-test/p170d-p161-review-visibility-correction.glb',
    objectKey: 'work-test/p170d-p161-review-visibility-correction.glb',
    expectedSize: 1_887_248,
    expectedSha256: '7f2bb6a65617e81f05c58b4d732e3c96c781f890ea5c3364e28cdaa996c6520e',
  });

  const p171c = getPrivateWorkTestCandidateById('p171c-d-stair-opening-guard-lowwall-junction');
  expect(p171c).toMatchObject({
    id: 'p171c-d-stair-opening-guard-lowwall-junction',
    label: 'P171C D stair opening + guard/lowWall junction - WORK_TEST',
    path: '/private-model/work-test/p171c-d-stair-opening-guard-lowwall-junction.glb',
    objectKey: 'work-test/p171c-d-stair-opening-guard-lowwall-junction.glb',
    expectedSize: 2_110_432,
    expectedSha256: 'ccacc928d7913886755dba7bb04d3dd3cc9f84e5a03dbd63170c29622b64e706',
  });

  const p173d = getPrivateWorkTestCandidateById('p173d-whole-building-d-wall-hr67-rebase');
  expect(p173d).toMatchObject({
    id: 'p173d-whole-building-d-wall-hr67-rebase',
    label: 'P173D whole-building D wall HR-6/HR-7 rebase - WORK_TEST',
    path: '/private-model/work-test/p173d-whole-building-d-wall-hr67-rebase.glb',
    objectKey: 'work-test/p173d-whole-building-d-wall-hr67-rebase.glb',
    expectedSize: 2_119_784,
    expectedSha256: '3d7144b0ea1841be6b9ef790e02ad807287d22c1b2a1e45fafae0f193c61ed7f',
  });

  const p174aR2 = getPrivateWorkTestCandidateById('p174a-r2-west-gable-termination-correction');
  expect(p174aR2).toMatchObject({
    id: 'p174a-r2-west-gable-termination-correction',
    label: 'P174A-R2 HR-6 west-gable termination correction - WORK_TEST',
    path: '/private-model/work-test/p174a-r2-west-gable-termination-correction.glb',
    objectKey: 'work-test/p174a-r2-west-gable-termination-correction.glb',
    expectedSize: 2_130_116,
    expectedSha256: '7a44320e649ac0d6611a3124ba62fce5e4848c0266d4ad10da4220cd06ac7e20',
  });

  const p175bR3 = getPrivateWorkTestCandidateById('p175b-r3-near-building-flatter-terrain');
  expect(p175bR3).toMatchObject({
    id: 'p175b-r3-near-building-flatter-terrain',
    label: 'P175B-R3 near-building flatter terrain - WORK_TEST',
    path: '/private-model/work-test/p175b-r3-near-building-flatter-terrain.glb',
    objectKey: 'work-test/p175b-r3-near-building-flatter-terrain.glb',
    expectedSize: 2_307_636,
    expectedSha256: 'a70dfac3b0f21011f042d0112d9d5283c450e863bd2dbdb8776bfec902c92b60',
  });

  const p176a = getPrivateWorkTestCandidateById('p176a-hr6-full-visible-west-gable-termination-correction');
  expect(p176a).toMatchObject({
    id: 'p176a-hr6-full-visible-west-gable-termination-correction',
    label: 'P176A HR-6 full visible west-gable termination correction - WORK_TEST',
    path: '/private-model/work-test/p176a-hr6-full-visible-west-gable-termination-correction.glb',
    objectKey: 'work-test/p176a-hr6-full-visible-west-gable-termination-correction.glb',
    expectedSize: 2_143_792,
    expectedSha256: 'bf8172b6661205906f588d7db3e1b1f416045ffef4d26208f12cef02df221dc5',
  });

  const p177b = getPrivateWorkTestCandidateById('p177b-hr6-direct-d-storage-north-wall-line-corrected');
  expect(p177b).toMatchObject({
    id: 'p177b-hr6-direct-d-storage-north-wall-line-corrected',
    label: 'P177B HR-6 direct D-storage north wall-line correction - WORK_TEST',
    path: '/private-model/work-test/p177b-hr6-direct-d-storage-north-wall-line-corrected.glb',
    objectKey: 'work-test/p177b-hr6-direct-d-storage-north-wall-line-corrected.glb',
    expectedSize: 2_155_224,
    expectedSha256: '37317206852db2adc95af4726e028a7297f6f42cd1552794e067093ba6fa2ca1',
  });

  const p178b = getPrivateWorkTestCandidateById('p178b-d-stair-guard-lowwall-junction-closure');
  expect(p178b).toMatchObject({
    id: 'p178b-d-stair-guard-lowwall-junction-closure',
    label: 'P178B D stair guard/lowWall visible junction closure - WORK_TEST',
    path: '/private-model/work-test/p178b-d-stair-guard-lowwall-junction-closure.glb',
    objectKey: 'work-test/p178b-d-stair-guard-lowwall-junction-closure.glb',
    expectedSize: 2_165_344,
    expectedSha256: 'a60111c6f0bc25d56e00c446cf2088b96e96f4f87051233abd8c2f23a248ef9b',
  });

  const p181bR1 = getPrivateWorkTestCandidateById('p181b-r1-ac-storage-ground-contact-substructure-terrain-rebase');
  expect(p181bR1).toMatchObject({
    id: 'p181b-r1-ac-storage-ground-contact-substructure-terrain-rebase',
    label: 'P181B-R1 A-C storage ground-contact/substructure + terrain rebase - WORK_TEST',
    path: '/private-model/work-test/p181b-r1-ac-storage-ground-contact-substructure-terrain-rebase.glb',
    objectKey: 'work-test/p181b-r1-ac-storage-ground-contact-substructure-terrain-rebase.glb',
    expectedSize: 2_861_664,
    expectedSha256: '3cddee192ae2af0d85bb650482aaa1596dfd883e5f0b3d25c42c4b451b3e6239',
  });

  const p184d = getPrivateWorkTestCandidateById('p184d-whole-building-survivor-island-x-source-chain');
  expect(p184d).toMatchObject({
    id: 'p184d-whole-building-survivor-island-x-source-chain',
    label: 'P184D whole-building survivor island source-chain-X correction - WORK_TEST',
    path: '/private-model/work-test/p184d-whole-building-survivor-island-x-source-chain.glb',
    objectKey: 'work-test/p184d-whole-building-survivor-island-x-source-chain.glb',
    expectedSize: 2_878_416,
    expectedSha256: '3544b069f1cc059af1e4fa219e8aefb909153515efd00cd9ce589178d4a07522',
  });

  const p184g = getPrivateWorkTestCandidateById('p184g-whole-building-survivor-island-x-axis-selfconsistency');
  expect(p184g).toMatchObject({
    id: 'p184g-whole-building-survivor-island-x-axis-selfconsistency',
    label: 'P184G whole-building survivor island X axis self-consistency - WORK_TEST',
    path: '/private-model/work-test/p184g-whole-building-survivor-island-x-axis-selfconsistency.glb',
    objectKey: 'work-test/p184g-whole-building-survivor-island-x-axis-selfconsistency.glb',
    expectedSize: 2_896_392,
    expectedSha256: '94fe2edb781530b76c09286aa39b7ab0c22cc35a028627b32ac833df3e24e9e2',
  });

  const m5b = getPrivateWorkTestCandidateById('m5b-roof-stormwater-current-planned');
  expect(m5b).toMatchObject({
    id: 'm5b-roof-stormwater-current-planned',
    label: 'M5B roof stormwater current/planned variants - WORK_TEST',
    path: '/private-model/work-test/m5b-roof-stormwater-current-planned.glb',
    objectKey: 'work-test/m5b-roof-stormwater-current-planned.glb',
    expectedSize: 2_898_064,
    expectedSha256: '0802c082425c9e2f231b1681a6bceec825e3d63e038ca43b02dd86d872f6c08f',
  });

  const p185c = getPrivateWorkTestCandidateById('p185c-d2015-electrical-source-overlay');
  expect(p185c).toMatchObject({
    id: 'p185c-d2015-electrical-source-overlay',
    label: 'P185C D2015 electrical source overlay - WORK_TEST',
    path: '/private-model/work-test/p185c-d2015-electrical-source-overlay.glb',
    objectKey: 'work-test/p185c-d2015-electrical-source-overlay.glb',
    expectedSize: 2_934_024,
    expectedSha256: '9599dec3db6a8cf1961f5db1a91d9722566dadd9a4176861e1e087722a3cea6c',
  });

  const m5a = getPrivateWorkTestCandidateById('m5a-drain-topology');
  expect(m5a).toMatchObject({
    id: 'm5a-drain-topology',
    label: 'M5A drainage topology presentation - WORK_TEST',
    path: '/private-model/work-test/m5a-drain-topology.glb',
    objectKey: 'work-test/m5a-drain-topology.glb',
    expectedSize: 2_882_760,
    expectedSha256: '3116b8e6a38b5942f5500754bb5a948d0e8194c7d6afe4cbdb1f4b5ac6a0b640',
  });

  const p164b = getPrivateWorkTestCandidateById('p164b-d-corrected-stair');
  expect(p164b).toMatchObject({
    id: 'p164b-d-corrected-stair',
    label: 'P164B D corrected stair topology - WORK_TEST',
    path: '/private-model/work-test/p164b-d-corrected-stair.glb',
    objectKey: 'work-test/p164b-d-corrected-stair.glb',
    expectedSize: 1_583_912,
    expectedSha256: 'db35b42575f1e287905d97d89483982b9354e60b1a8fe806ab29fb26d6103ca9',
  });

  const p167f = getPrivateWorkTestCandidateById('p167f-whole-building-precise-stair');
  expect(p167f).toMatchObject({
    id: 'p167f-whole-building-precise-stair',
    label: 'P167F whole-building precise stair successor - WORK_TEST',
    path: '/private-model/work-test/p167f-whole-building-precise-stair.glb',
    objectKey: 'work-test/p167f-whole-building-precise-stair.glb',
    expectedSize: 2_070_576,
    expectedSha256: '66e8589ec8b904cde6fee3b80ba7c0e01db0f1d66ed88455a6d5ddf9f9442bd8',
  });

  const p168a = getPrivateWorkTestCandidateById('p168a-whole-building-roof-eave-correction');
  expect(p168a).toMatchObject({
    id: 'p168a-whole-building-roof-eave-correction',
    label: 'P168A whole-building roof/eave correction - WORK_TEST',
    path: '/private-model/work-test/p168a-whole-building-roof-eave-correction.glb',
    objectKey: 'work-test/p168a-whole-building-roof-eave-correction.glb',
    expectedSize: 2_076_876,
    expectedSha256: 'a9d0672283f15f2ab8cbd527242cb8982b1dab81e86e86b7dad1bfe42dbd1590',
  });

  const p169a = getPrivateWorkTestCandidateById('p169a-whole-building-ac-storage-visible');
  expect(p169a).toMatchObject({
    id: 'p169a-whole-building-ac-storage-visible',
    label: 'P169A whole-building A-C storage visible envelope - WORK_TEST',
    path: '/private-model/work-test/p169a-whole-building-ac-storage-visible.glb',
    objectKey: 'work-test/p169a-whole-building-ac-storage-visible.glb',
    expectedSize: 2_093_060,
    expectedSha256: '12036d1c70e8568a37246d3fe4fe76917095c37ad3f0155e488a8b039c8cfe7b',
  });

  const p169f = getPrivateWorkTestCandidateById('p169f-whole-building-ac-storage-doors');
  expect(p169f).toMatchObject({
    id: 'p169f-whole-building-ac-storage-doors',
    label: 'P169F A-C storage doors - WORK_TEST',
    path: '/private-model/work-test/p169f-whole-building-ac-storage-doors.glb',
    objectKey: 'work-test/p169f-whole-building-ac-storage-doors.glb',
    expectedSize: 2_104_452,
    expectedSha256: '36d4e73eb32ea5d629d4a755cbcdbdc65fbd9f7dd38a8e871f7e40d8ef687e15',
  });

  const p159 = getPrivateWorkTestCandidateById('p159-whole-building-storage-context');
  expect(p159).toMatchObject({
    id: 'p159-whole-building-storage-context',
    label: 'P159 whole-building storage context successor - WORK_TEST',
    path: '/private-model/work-test/p159-whole-building-storage-context.glb',
    objectKey: 'work-test/p159-whole-building-storage-context.glb',
    expectedSize: 1_992_656,
    expectedSha256: '085877147e8ee50b69d8fa932bdb6d25bece04be187ec5453e9f73de50d1a5d0',
  });

  const p160 = getPrivateWorkTestCandidateById('p160-d-composite-architecture');
  expect(p160).toMatchObject({
    id: 'p160-d-composite-architecture',
    label: 'P160 D composite architecture carrier - WORK_TEST',
    path: '/private-model/work-test/p160-d-composite-architecture.glb',
    objectKey: 'work-test/p160-d-composite-architecture.glb',
    expectedSize: 1_559_168,
    expectedSha256: '773b64f6413237111c9abf6420ccdf52ee5f61f90717618a1fe855f85000f3d7',
  });

  const p154c = getPrivateWorkTestCandidateById('p154c-d-wall-cutouts');
  expect(p154c).toMatchObject({
    id: 'p154c-d-wall-cutouts',
    objectKey: 'work-test/p154c-d-wall-cutouts.glb',
    expectedSize: 1_535_172,
    expectedSha256: '0653be4435879acb479ca272dc8fd4a3c7299c863c0082797236d4c5c20167c0',
  });

  const p153c = getPrivateWorkTestCandidateById('p153c-d-stair-guard-lowwall');
  expect(p153c).toMatchObject({
    id: 'p153c-d-stair-guard-lowwall',
    objectKey: 'work-test/p153c-d-stair-guard-lowwall.glb',
    expectedSize: 1_743_512,
    expectedSha256: '03525ed32e75f721c90dee0a566abea2d00c742a5f4d29ec43c2b13fafe7ed94',
  });

  for (const candidate of PRIVATE_WORK_TEST_CANDIDATES) {
    expect(getPrivateWorkTestCandidate(candidate.path)?.id).toBe(candidate.id);
    expect(getPrivateWorkTestCandidateById(candidate.id)?.path).toBe(candidate.path);
  }
  expect(getPrivateWorkTestCandidateById('not-allowlisted')).toBeNull();
  const p143hUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p143h-scalgo-label-axis.glb`;
  expect(getPrivateWorkTestUploadCandidate(p143hUploadPath)?.id).toBe('p143h-scalgo-label-axis');
  const p143jUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p143j-scalgo-label-flow.glb`;
  expect(getPrivateWorkTestUploadCandidate(p143jUploadPath)?.id).toBe('p143j-scalgo-label-flow');
  const p145bUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p145b-1974-iv-section-worktargets.glb`;
  expect(getPrivateWorkTestUploadCandidate(p145bUploadPath)?.id).toBe('p145b-1974-iv-section-worktargets');
  const p155cbUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p155cb-d-storage-roof.glb`;
  expect(getPrivateWorkTestUploadCandidate(p155cbUploadPath)?.id).toBe('p155cb-d-storage-roof');
  const p151cUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p151c-whole-building-carrier.glb`;
  expect(getPrivateWorkTestUploadCandidate(p151cUploadPath)?.id).toBe('p151c-whole-building-carrier');
  const p150frUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p150fr-whole-building-substructure.glb`;
  expect(getPrivateWorkTestUploadCandidate(p150frUploadPath)?.id).toBe('p150fr-whole-building-substructure');
  const p150gUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p150g-whole-building-end-plinth.glb`;
  expect(getPrivateWorkTestUploadCandidate(p150gUploadPath)?.id).toBe('p150g-whole-building-end-plinth');
  const p156iUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p156i-2017-kvv-main-presentation.glb`;
  expect(getPrivateWorkTestUploadCandidate(p156iUploadPath)?.id).toBe('p156i-2017-kvv-main-presentation');
  const p161UploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p161-multisource-systems-carrier.glb`;
  expect(getPrivateWorkTestUploadCandidate(p161UploadPath)?.id).toBe('p161-multisource-systems-carrier');
  const p170aUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p170a-p161-review-visibility.glb`;
  expect(getPrivateWorkTestUploadCandidate(p170aUploadPath)?.id).toBe('p170a-p161-review-visibility');
  const p170dUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p170d-p161-review-visibility-correction.glb`;
  expect(getPrivateWorkTestUploadCandidate(p170dUploadPath)?.id).toBe(
    'p170d-p161-review-visibility-correction',
  );
  const p171cUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p171c-d-stair-opening-guard-lowwall-junction.glb`;
  expect(getPrivateWorkTestUploadCandidate(p171cUploadPath)?.id).toBe(
    'p171c-d-stair-opening-guard-lowwall-junction',
  );
  const p173dUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p173d-whole-building-d-wall-hr67-rebase.glb`;
  expect(getPrivateWorkTestUploadCandidate(p173dUploadPath)?.id).toBe(
    'p173d-whole-building-d-wall-hr67-rebase',
  );
  const p174aR2UploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p174a-r2-west-gable-termination-correction.glb`;
  expect(getPrivateWorkTestUploadCandidate(p174aR2UploadPath)?.id).toBe(
    'p174a-r2-west-gable-termination-correction',
  );
  const p175bR3UploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p175b-r3-near-building-flatter-terrain.glb`;
  expect(getPrivateWorkTestUploadCandidate(p175bR3UploadPath)?.id).toBe(
    'p175b-r3-near-building-flatter-terrain',
  );
  const p176aUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p176a-hr6-full-visible-west-gable-termination-correction.glb`;
  expect(getPrivateWorkTestUploadCandidate(p176aUploadPath)?.id).toBe(
    'p176a-hr6-full-visible-west-gable-termination-correction',
  );
  const p177bUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p177b-hr6-direct-d-storage-north-wall-line-corrected.glb`;
  expect(getPrivateWorkTestUploadCandidate(p177bUploadPath)?.id).toBe(
    'p177b-hr6-direct-d-storage-north-wall-line-corrected',
  );
  const p178bUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p178b-d-stair-guard-lowwall-junction-closure.glb`;
  expect(getPrivateWorkTestUploadCandidate(p178bUploadPath)?.id).toBe(
    'p178b-d-stair-guard-lowwall-junction-closure',
  );
  const p181bR1UploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p181b-r1-ac-storage-ground-contact-substructure-terrain-rebase.glb`;
  expect(getPrivateWorkTestUploadCandidate(p181bR1UploadPath)?.id).toBe('p181b-r1-ac-storage-ground-contact-substructure-terrain-rebase');

  const p164bUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p164b-d-corrected-stair.glb`;
  expect(getPrivateWorkTestUploadCandidate(p164bUploadPath)?.id).toBe('p164b-d-corrected-stair');
  const p167fUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p167f-whole-building-precise-stair.glb`;
  expect(getPrivateWorkTestUploadCandidate(p167fUploadPath)?.id).toBe('p167f-whole-building-precise-stair');
  const p168aUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p168a-whole-building-roof-eave-correction.glb`;
  expect(getPrivateWorkTestUploadCandidate(p168aUploadPath)?.id).toBe('p168a-whole-building-roof-eave-correction');
  const p169aUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p169a-whole-building-ac-storage-visible.glb`;
  expect(getPrivateWorkTestUploadCandidate(p169aUploadPath)?.id).toBe('p169a-whole-building-ac-storage-visible');
  const p169fUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p169f-whole-building-ac-storage-doors.glb`;
  expect(getPrivateWorkTestUploadCandidate(p169fUploadPath)?.id).toBe('p169f-whole-building-ac-storage-doors');
  const p159UploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p159-whole-building-storage-context.glb`;
  expect(getPrivateWorkTestUploadCandidate(p159UploadPath)?.id).toBe('p159-whole-building-storage-context');
  const p160UploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p160-d-composite-architecture.glb`;
  expect(getPrivateWorkTestUploadCandidate(p160UploadPath)?.id).toBe('p160-d-composite-architecture');
  const p154cUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p154c-d-wall-cutouts.glb`;
  expect(getPrivateWorkTestUploadCandidate(p154cUploadPath)?.id).toBe('p154c-d-wall-cutouts');
  const p153cUploadPath = `${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p153c-d-stair-guard-lowwall.glb`;
  expect(getPrivateWorkTestUploadCandidate(p153cUploadPath)?.id).toBe('p153c-d-stair-guard-lowwall');
  expect(getPrivateWorkTestUploadCandidate(`${p143hUploadPath}/extra`)).toBeNull();
  expect(getPrivateWorkTestUploadCandidate(`${PRIVATE_WORK_TEST_UPLOAD_PREFIX}../model.glb`)).toBeNull();
  expect(getPrivateWorkTestUploadCandidate(`${PRIVATE_WORK_TEST_UPLOAD_PREFIX}not-allowlisted.glb`)).toBeNull();
  const p150gPublishPath = `${PRIVATE_WORK_TEST_PUBLISH_PREFIX}p150g-whole-building-end-plinth.glb`;
  expect(getPrivateWorkTestPublishCandidate(p150gPublishPath)?.id).toBe(
    'p150g-whole-building-end-plinth',
  );
  const p184gPublishPath = `${PRIVATE_WORK_TEST_PUBLISH_PREFIX}p184g-whole-building-survivor-island-x-axis-selfconsistency.glb`;
  expect(getPrivateWorkTestPublishCandidate(p184gPublishPath)?.id).toBe(
    'p184g-whole-building-survivor-island-x-axis-selfconsistency',
  );
  const m5bPublishPath = `${PRIVATE_WORK_TEST_PUBLISH_PREFIX}m5b-roof-stormwater-current-planned.glb`;
  expect(getPrivateWorkTestPublishCandidate(m5bPublishPath)?.id).toBe(
    'm5b-roof-stormwater-current-planned',
  );
  const p185cPublishPath = `${PRIVATE_WORK_TEST_PUBLISH_PREFIX}p185c-d2015-electrical-source-overlay.glb`;
  expect(getPrivateWorkTestPublishCandidate(p185cPublishPath)?.id).toBe(
    'p185c-d2015-electrical-source-overlay',
  );
  expect(getPrivateWorkTestPublishCandidate(`${PRIVATE_WORK_TEST_PUBLISH_PREFIX}not-allowlisted.glb`)).toBeNull();
  expect(
    getPrivateWorkTestVerifyCandidate(
      `${PRIVATE_WORK_TEST_VERIFY_GLB_PREFIX}p150g-whole-building-end-plinth.glb`,
    )?.id,
  ).toBe('p150g-whole-building-end-plinth');
  expect(
    getPrivateWorkTestVerifyCandidate(
      `${PRIVATE_WORK_TEST_VERIFY_GLB_PREFIX}m5b-roof-stormwater-current-planned.glb`,
    )?.id,
  ).toBe('m5b-roof-stormwater-current-planned');
  expect(
    getPrivateWorkTestVerifyCandidate(
      `${PRIVATE_WORK_TEST_VERIFY_GLB_PREFIX}p185c-d2015-electrical-source-overlay.glb`,
    )?.id,
  ).toBe('p185c-d2015-electrical-source-overlay');
  expect(
    getPrivateWorkTestVerifyCandidate(`${PRIVATE_WORK_TEST_VERIFY_GLB_PREFIX}not-allowlisted.glb`),
  ).toBeNull();
  expect(getPrivateWorkTestCandidate('/private-model/work-test/model.glb')).toBeNull();
  expect(getPrivateWorkTestCandidate('/private-model/work-test/../model.glb')).toBeNull();
  expect(getPrivateWorkTestCandidate('/private-model/work-test/p136b-d-current-wall-corrected.glb/extra')).toBeNull();
});

test('private WORK_TEST candidates require exact R2 size and SHA metadata before availability', () => {
  for (const candidate of PRIVATE_WORK_TEST_CANDIDATES) {
    expect(
      isPrivateWorkTestObjectValid(
        {
          size: candidate.expectedSize,
          customMetadata: { sha256: candidate.expectedSha256 },
        },
        candidate,
      ),
    ).toBe(true);

    expect(
      isPrivateWorkTestObjectValid(
        {
          size: candidate.expectedSize + 1,
          customMetadata: { sha256: candidate.expectedSha256 },
        },
        candidate,
      ),
    ).toBe(false);

    expect(
      isPrivateWorkTestObjectValid(
        {
          size: candidate.expectedSize,
          customMetadata: { sha256: '00'.repeat(32) },
        },
        candidate,
      ),
    ).toBe(false);

    expect(isPrivateWorkTestObjectValid({ size: candidate.expectedSize }, candidate)).toBe(false);
  }
});

test('private WORK_TEST direct upload validation requires exact size and SHA-256', async () => {
  const abc = new Uint8Array([0x61, 0x62, 0x63]).buffer;
  const expected = {
    expectedSize: 3,
    expectedSha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  };

  await expect(validatePrivateWorkTestUploadBytes(abc, expected)).resolves.toBeNull();
  await expect(
    validatePrivateWorkTestUploadBytes(abc, { ...expected, expectedSize: 4 }),
  ).resolves.toBe('upload-size-mismatch');
  await expect(
    validatePrivateWorkTestUploadBytes(abc, { ...expected, expectedSha256: '00'.repeat(32) }),
  ).resolves.toBe('upload-sha256-mismatch');
});

test('private WORK_TEST ingest accepts only signed oaiusercontent raw-file URLs', () => {
  const trusted =
    'https://sdmntprdenmarkeast.oaiusercontent.com/files/abc123/raw?se=2026-09-29T10%3A00%3A00Z&sig=signature';

  expect(isTrustedPrivateWorkTestSourceUrl(trusted)).toBe(true);
  expect(
    isTrustedPrivateWorkTestResolvedSourceUrl(
      'https://sdmntprdenmarkeast.oaiusercontent.com/files/abc123/raw',
    ),
  ).toBe(true);
  expect(isTrustedPrivateWorkTestResolvedSourceUrl(trusted)).toBe(true);
  expect(
    isTrustedPrivateWorkTestResolvedSourceUrl(
      'https://sdmntprdenmarkeast.oaiusercontent.com.evil.example/files/abc123/raw',
    ),
  ).toBe(false);
  expect(
    isTrustedPrivateWorkTestSourceUrl(
      'https://sdmntprdenmarkeast.oaiusercontent.com/files/abc123/raw?se=x',
    ),
  ).toBe(false);
  expect(
    isTrustedPrivateWorkTestSourceUrl(
      'https://sdmntprdenmarkeast.oaiusercontent.com/files/abc123/not-raw?se=x&sig=y',
    ),
  ).toBe(false);
  expect(
    isTrustedPrivateWorkTestSourceUrl(
      'https://sdmntprdenmarkeast.oaiusercontent.com.evil.example/files/abc123/raw?se=x&sig=y',
    ),
  ).toBe(false);
  expect(
    isTrustedPrivateWorkTestSourceUrl(
      'http://sdmntprdenmarkeast.oaiusercontent.com/files/abc123/raw?se=x&sig=y',
    ),
  ).toBe(false);
});

test('private WORK_TEST ingest fails closed before R2 access without Access configuration', async () => {
  let bucketReads = 0;
  let bucketWrites = 0;
  const env = {
    ASSETS: {
      fetch: async () => new Response('unused'),
    },
    PRIVATE_MODEL_BUCKET: {
      get: async () => {
        bucketReads += 1;
        return null;
      },
      put: async () => {
        bucketWrites += 1;
        throw new Error('must not write');
      },
    },
  } as unknown as PrivateModelEnv;

  const response = await handlePrivateWorkTestRequest(
    new Request(`https://example.test${PRIVATE_WORK_TEST_IMPORT_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId: PRIVATE_WORK_TEST_CANDIDATES[0].id,
        sourceUrl:
          'https://sdmntprdenmarkeast.oaiusercontent.com/files/abc123/raw?se=x&sig=y',
      }),
    }),
    env,
  );

  expect(response.status).toBe(404);
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  expect(bucketReads).toBe(0);
  expect(bucketWrites).toBe(0);
});

test('private WORK_TEST direct upload fails closed before R2 access without Access configuration', async () => {
  let bucketReads = 0;
  let bucketWrites = 0;
  const env = {
    ASSETS: {
      fetch: async () => new Response('unused'),
    },
    PRIVATE_MODEL_BUCKET: {
      get: async () => {
        bucketReads += 1;
        return null;
      },
      put: async () => {
        bucketWrites += 1;
        throw new Error('must not write');
      },
    },
  } as unknown as PrivateModelEnv;

  const candidate = PRIVATE_WORK_TEST_CANDIDATES.find(
    (entry) => entry.id === 'p143h-scalgo-label-axis',
  );
  expect(candidate).toBeTruthy();

  const response = await handlePrivateWorkTestRequest(
    new Request(
      `https://example.test${PRIVATE_WORK_TEST_UPLOAD_PREFIX}p143h-scalgo-label-axis.glb`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'model/gltf-binary' },
        body: new Uint8Array([1, 2, 3]),
      },
    ),
    env,
  );

  expect(response.status).toBe(404);
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  expect(bucketReads).toBe(0);
  expect(bucketWrites).toBe(0);
});

test('private WORK_TEST catalog fails closed before R2 access without Access configuration', async () => {
  let bucketReads = 0;
  const env: PrivateModelEnv = {
    ASSETS: {
      fetch: async () => new Response('unused'),
    },
    PRIVATE_MODEL_BUCKET: {
      get: async () => {
        bucketReads += 1;
        return null;
      },
    },
  };

  const response = await handlePrivateWorkTestRequest(
    new Request(`https://example.test${PRIVATE_WORK_TEST_CATALOG_PATH}`, { method: 'GET' }),
    env,
  );

  expect(response.status).toBe(404);
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  expect(response.headers.get('X-Robots-Tag')).toContain('noindex');
  expect(bucketReads).toBe(0);
});

test('private WORK_TEST backend rejects writes before auth or R2 access', async () => {
  let bucketReads = 0;
  const env: PrivateModelEnv = {
    ASSETS: {
      fetch: async () => new Response('unused'),
    },
    PRIVATE_MODEL_BUCKET: {
      get: async () => {
        bucketReads += 1;
        return null;
      },
    },
  };

  const response = await handlePrivateWorkTestRequest(
    new Request('https://example.test/private-model/work-test/p136b-d-current-wall-corrected.glb', {
      method: 'POST',
    }),
    env,
  );

  expect(response.status).toBe(405);
  expect(response.headers.get('Allow')).toBe('GET, HEAD');
  expect(bucketReads).toBe(0);
});


const createAccessJwtSigner = async (teamOrigin: string, kid: string) => {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  );
  const jwk = (await crypto.subtle.exportKey('jwk', keyPair.publicKey)) as JsonWebKey & {
    kid?: string;
  };
  jwk.kid = kid;

  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const sign = async (payload: Record<string, unknown>) => {
    const header = encode({ alg: 'RS256', kid });
    const body = encode({ iss: teamOrigin, ...payload });
    const signed = `${header}.${body}`;
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      keyPair.privateKey,
      new TextEncoder().encode(signed),
    );
    return `${signed}.${Buffer.from(signature).toString('base64url')}`;
  };

  return { jwk, sign };
};

test('private publisher claims require an Access service-token application identity', () => {
  const expected = 'publisher-client.access';
  expect(
    privateModelPublisherClaimError(
      { type: 'app', sub: '', common_name: expected },
      expected,
    ),
  ).toBeNull();
  expect(
    privateModelPublisherClaimError(
      { type: 'org', sub: '', common_name: expected },
      expected,
    ),
  ).toBe('publisher-token-type');
  expect(
    privateModelPublisherClaimError(
      { type: 'app', sub: 'human-user', common_name: expected },
      expected,
    ),
  ).toBe('publisher-token-sub');
  expect(
    privateModelPublisherClaimError(
      { type: 'app', sub: '', common_name: 'other-client.access' },
      expected,
    ),
  ).toBe('publisher-common-name');
});

test('private publisher Access JWT requires publisher audience and exact service-token client id', async () => {
  const originalFetch = globalThis.fetch;
  const teamOrigin = 'https://publisher-unit.cloudflareaccess.com';
  const signer = await createAccessJwtSigner(teamOrigin, 'publisher-unit-key');
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    expect(String(input)).toBe(`${teamOrigin}/cdn-cgi/access/certs`);
    return Response.json({ keys: [signer.jwk] });
  }) as typeof fetch;

  const env = {
    ASSETS: { fetch: async () => new Response('unused') },
    CF_ACCESS_TEAM_DOMAIN: teamOrigin,
    CF_ACCESS_AUD: 'viewer-aud',
    CF_ACCESS_PUBLISHER_AUD: 'publisher-aud',
    CF_ACCESS_PUBLISHER_COMMON_NAME: 'publisher-client.access',
  } satisfies PrivateModelEnv;
  const now = Math.floor(Date.now() / 1000);

  const verify = async (payload: Record<string, unknown>) => {
    const token = await signer.sign({ exp: now + 300, ...payload });
    return verifyPrivateModelPublisherAccess(
      new Request('https://example.test/private-model/work-test/publish/example.glb', {
        headers: { 'cf-access-jwt-assertion': token },
      }),
      env,
    );
  };

  try {
    await expect(
      verify({
        type: 'app',
        aud: ['publisher-aud'],
        sub: '',
        common_name: 'publisher-client.access',
      }),
    ).resolves.toBe(true);
    await expect(
      verify({
        type: 'app',
        aud: ['viewer-aud'],
        sub: '',
        common_name: 'publisher-client.access',
      }),
    ).resolves.toBe(false);
    await expect(
      verify({
        type: 'app',
        aud: ['publisher-aud'],
        sub: '',
        common_name: 'other-client.access',
      }),
    ).resolves.toBe(false);
    await expect(
      verify({
        type: 'app',
        aud: ['publisher-aud'],
        sub: 'human-user',
        common_name: 'publisher-client.access',
      }),
    ).resolves.toBe(false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('machine publisher binary writer validates bytes, handles R2 failures and is idempotent', async () => {
  const bytes = new Uint8Array([0x61, 0x62, 0x63]);
  const candidate = {
    id: 'unit-candidate',
    label: 'Unit candidate',
    path: '/private-model/work-test/unit-candidate.glb',
    objectKey: 'work-test/unit-candidate.glb',
    expectedSize: 3,
    expectedSha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  };
  const stored = {
    body: new ReadableStream<Uint8Array>(),
    size: candidate.expectedSize,
    customMetadata: { sha256: candidate.expectedSha256 },
  };
  let object: typeof stored | null = null;
  let writes = 0;
  const bucket = {
    get: async () => object,
    put: async () => {
      writes += 1;
      object = stored;
      return stored;
    },
  };

  const request = () =>
    new Request('https://example.test/private-model/work-test/publish/unit-candidate.glb', {
      method: 'PUT',
      headers: {
        'Content-Type': 'model/gltf-binary',
        'Content-Length': '3',
      },
      body: bytes,
    });

  await expect(
    writePrivateWorkTestCandidateFromRequest(request(), bucket, candidate),
  ).resolves.toEqual({ ok: true, alreadyReady: false });
  expect(writes).toBe(1);

  await expect(
    writePrivateWorkTestCandidateFromRequest(request(), bucket, candidate),
  ).resolves.toEqual({ ok: true, alreadyReady: true });
  expect(writes).toBe(1);

  await expect(
    writePrivateWorkTestCandidateFromRequest(
      new Request('https://example.test/private-model/work-test/publish/unit-candidate.glb', {
        method: 'PUT',
        headers: { 'Content-Type': 'model/gltf-binary' },
        body: new Uint8Array([0x61, 0x62]),
      }),
      bucket,
      candidate,
    ),
  ).resolves.toMatchObject({ ok: false, error: 'upload-size-mismatch', status: 422 });

  const wrongShaCandidate = { ...candidate, expectedSha256: '00'.repeat(32) };
  await expect(
    writePrivateWorkTestCandidateFromRequest(request(), bucket, wrongShaCandidate),
  ).resolves.toMatchObject({ ok: false, error: 'upload-sha256-mismatch', status: 422 });

  const writeFailBucket = {
    get: async () => null,
    put: async () => {
      throw new Error('write failed');
    },
  };
  await expect(
    writePrivateWorkTestCandidateFromRequest(request(), writeFailBucket, candidate),
  ).resolves.toMatchObject({ ok: false, error: 'r2-write-failed', status: 500 });

  let readbackGetCount = 0;
  const readbackFailBucket = {
    get: async () => {
      readbackGetCount += 1;
      if (readbackGetCount === 1) return null;
      throw new Error('post-write readback failed');
    },
    put: async () => stored,
  };
  await expect(
    writePrivateWorkTestCandidateFromRequest(request(), readbackFailBucket, candidate),
  ).resolves.toMatchObject({ ok: false, error: 'r2-readback-failed', status: 500 });
  expect(readbackGetCount).toBe(2);
});

test('machine publish route fails closed without publisher Access configuration', async () => {
  let bucketReads = 0;
  let bucketWrites = 0;
  const env = {
    ASSETS: { fetch: async () => new Response('unused') },
    PRIVATE_MODEL_BUCKET: {
      get: async () => {
        bucketReads += 1;
        return null;
      },
      put: async () => {
        bucketWrites += 1;
        throw new Error('must not write');
      },
    },
    CF_ACCESS_TEAM_DOMAIN: 'https://publisher-unit.cloudflareaccess.com',
    CF_ACCESS_AUD: 'viewer-aud',
  } as unknown as PrivateModelEnv;

  const response = await handlePrivateWorkTestRequest(
    new Request(
      `https://example.test${PRIVATE_WORK_TEST_PUBLISH_PREFIX}p150g-whole-building-end-plinth.glb`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'model/gltf-binary' },
        body: new Uint8Array([1, 2, 3]),
      },
    ),
    env,
  );

  expect(response.status).toBe(404);
  expect(bucketReads).toBe(0);
  expect(bucketWrites).toBe(0);
});


test('machine publisher route combines valid publisher JWT auth with binary validation and R2 write', async () => {
  const originalFetch = globalThis.fetch;
  const teamOrigin = 'https://publisher-route-unit.cloudflareaccess.com';
  const signer = await createAccessJwtSigner(teamOrigin, 'publisher-route-unit-key');
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    expect(String(input)).toBe(`${teamOrigin}/cdn-cgi/access/certs`);
    return Response.json({ keys: [signer.jwk] });
  }) as typeof fetch;

  const candidate = {
    id: 'unit-candidate',
    label: 'Unit candidate',
    path: '/private-model/work-test/unit-candidate.glb',
    objectKey: 'work-test/unit-candidate.glb',
    expectedSize: 3,
    expectedSha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  };
  const stored = {
    body: new ReadableStream<Uint8Array>(),
    size: candidate.expectedSize,
    customMetadata: { sha256: candidate.expectedSha256 },
  };
  let object: typeof stored | null = null;
  let writes = 0;
  const env = {
    ASSETS: { fetch: async () => new Response('unused') },
    PRIVATE_MODEL_BUCKET: {
      get: async () => object,
      put: async () => {
        writes += 1;
        object = stored;
        return stored;
      },
    },
    CF_ACCESS_TEAM_DOMAIN: teamOrigin,
    CF_ACCESS_AUD: 'viewer-aud',
    CF_ACCESS_PUBLISHER_AUD: 'publisher-aud',
    CF_ACCESS_PUBLISHER_COMMON_NAME: 'publisher-client.access',
  } as unknown as PrivateModelEnv;
  const now = Math.floor(Date.now() / 1000);
  const token = await signer.sign({
    type: 'app',
    aud: ['publisher-aud'],
    exp: now + 300,
    sub: '',
    common_name: 'publisher-client.access',
  });

  try {
    const response = await handlePrivateWorkTestPublish(
      new Request('https://example.test/private-model/work-test/publish/unit-candidate.glb', {
        method: 'PUT',
        headers: {
          'cf-access-jwt-assertion': token,
          'Content-Type': 'model/gltf-binary',
          'Content-Length': '3',
        },
        body: new Uint8Array([0x61, 0x62, 0x63]),
      }),
      env,
      candidate,
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ready: true,
      published: true,
      candidate: { id: 'unit-candidate' },
    });
    expect(writes).toBe(1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('machine readback claims require a distinct service-token application identity', () => {
  const expected = 'readback-client.access';
  expect(
    privateModelReadbackClaimError(
      { type: 'app', sub: '', common_name: expected },
      expected,
    ),
  ).toBeNull();
  expect(
    privateModelReadbackClaimError(
      { type: 'app', sub: '', common_name: 'publisher-client.access' },
      expected,
    ),
  ).toBe('readback-common-name');
});

test('machine readback endpoints accept only readback JWT and expose only catalog plus allowlisted GLB', async () => {
  const originalFetch = globalThis.fetch;
  const teamOrigin = 'https://readback-route-unit.cloudflareaccess.com';
  const signer = await createAccessJwtSigner(teamOrigin, 'readback-route-unit-key');
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    expect(String(input)).toBe(`${teamOrigin}/cdn-cgi/access/certs`);
    return Response.json({ keys: [signer.jwk] });
  }) as typeof fetch;

  const p150g = getPrivateWorkTestCandidateById('p150g-whole-building-end-plinth');
  expect(p150g).toBeTruthy();
  const body = new TextEncoder().encode('unit-readback');
  const stored = {
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(body);
        controller.close();
      },
    }),
    size: p150g!.expectedSize,
    customMetadata: { sha256: p150g!.expectedSha256 },
  };
  let catalogListReads = 0;
  let catalogHeadReads = 0;
  let bodyReads = 0;
  const env = {
    ASSETS: { fetch: async () => new Response('unused') },
    PRIVATE_MODEL_BUCKET: {
      list: async (options?: { prefix?: string; limit?: number; include?: string[] }) => {
        catalogListReads += 1;
        expect(options).toMatchObject({
          prefix: 'work-test/',
          limit: 1000,
          include: ['customMetadata'],
        });
        return {
          objects: [
            {
              key: p150g!.objectKey,
              size: p150g!.expectedSize,
              customMetadata: { sha256: p150g!.expectedSha256 },
            },
          ],
          truncated: false,
        };
      },
      head: async (key: string) => {
        catalogHeadReads += 1;
        return key === p150g!.objectKey
          ? {
              size: p150g!.expectedSize,
              customMetadata: { sha256: p150g!.expectedSha256 },
            }
          : null;
      },
      get: async (key: string) => {
        bodyReads += 1;
        return key === p150g!.objectKey ? stored : null;
      },
    },
    CF_ACCESS_TEAM_DOMAIN: teamOrigin,
    CF_ACCESS_AUD: 'viewer-aud',
    CF_ACCESS_PUBLISHER_AUD: 'publisher-aud',
    CF_ACCESS_PUBLISHER_COMMON_NAME: 'publisher-client.access',
    CF_ACCESS_READBACK_AUD: 'readback-aud',
    CF_ACCESS_READBACK_COMMON_NAME: 'readback-client.access',
  } as unknown as PrivateModelEnv;
  const now = Math.floor(Date.now() / 1000);
  const readbackToken = await signer.sign({
    type: 'app',
    aud: ['readback-aud'],
    exp: now + 300,
    sub: '',
    common_name: 'readback-client.access',
  });
  const publisherToken = await signer.sign({
    type: 'app',
    aud: ['publisher-aud'],
    exp: now + 300,
    sub: '',
    common_name: 'publisher-client.access',
  });
  const viewerToken = await signer.sign({
    aud: ['viewer-aud'],
    exp: now + 300,
    sub: 'human-user',
  });

  try {
    const catalog = await handlePrivateWorkTestRequest(
      new Request(`https://example.test${PRIVATE_WORK_TEST_VERIFY_CATALOG_PATH}`, {
        headers: { 'cf-access-jwt-assertion': readbackToken },
      }),
      env,
    );
    expect(catalog.status).toBe(200);
    await expect(catalog.json()).resolves.toMatchObject({
      candidates: [
        {
          id: 'p150g-whole-building-end-plinth',
          path: '/private-model/work-test/p150g-whole-building-end-plinth.glb',
        },
      ],
    });
    expect(catalogListReads).toBe(1);
    expect(catalogHeadReads).toBe(0);
    expect(bodyReads).toBe(0);

    const viewerCatalog = await handlePrivateWorkTestRequest(
      new Request(`https://example.test${PRIVATE_WORK_TEST_CATALOG_PATH}`, {
        headers: { 'cf-access-jwt-assertion': viewerToken },
      }),
      env,
    );
    expect(viewerCatalog.status).toBe(200);
    await expect(viewerCatalog.json()).resolves.toMatchObject({
      candidates: [
        {
          id: 'p150g-whole-building-end-plinth',
          path: '/private-model/work-test/p150g-whole-building-end-plinth.glb',
        },
      ],
    });
    expect(catalogListReads).toBe(2);
    expect(catalogHeadReads).toBe(0);

    const verifyPath =
      `${PRIVATE_WORK_TEST_VERIFY_GLB_PREFIX}p150g-whole-building-end-plinth.glb`;
    const head = await handlePrivateWorkTestRequest(
      new Request(`https://example.test${verifyPath}`, {
        method: 'HEAD',
        headers: { 'cf-access-jwt-assertion': readbackToken },
      }),
      env,
    );
    expect(head.status).toBe(200);
    expect(head.headers.get('Content-Length')).toBe(String(p150g!.expectedSize));
    expect(bodyReads).toBe(1);

    for (const token of [publisherToken, viewerToken]) {
      const denied = await handlePrivateWorkTestRequest(
        new Request(`https://example.test${verifyPath}`, {
          headers: { 'cf-access-jwt-assertion': token },
        }),
        env,
      );
      expect(denied.status).toBe(404);
    }

    const writeDenied = await handlePrivateWorkTestRequest(
      new Request(`https://example.test${verifyPath}`, {
        method: 'PUT',
        headers: { 'cf-access-jwt-assertion': readbackToken },
      }),
      env,
    );
    expect(writeDenied.status).toBe(405);
    expect(writeDenied.headers.get('Allow')).toBe('GET, HEAD');

    const notAllowlisted = await handlePrivateWorkTestRequest(
      new Request(
        'https://example.test/private-model/work-test/verify/not-allowlisted.glb',
        { headers: { 'cf-access-jwt-assertion': readbackToken } },
      ),
      env,
    );
    expect(notAllowlisted.status).toBe(404);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('readback Access JWT requires readback audience and exact service-token client id', async () => {
  const originalFetch = globalThis.fetch;
  const teamOrigin = 'https://readback-auth-unit.cloudflareaccess.com';
  const signer = await createAccessJwtSigner(teamOrigin, 'readback-auth-unit-key');
  globalThis.fetch = (async () => Response.json({ keys: [signer.jwk] })) as typeof fetch;
  const env = {
    ASSETS: { fetch: async () => new Response('unused') },
    CF_ACCESS_TEAM_DOMAIN: teamOrigin,
    CF_ACCESS_READBACK_AUD: 'readback-aud',
    CF_ACCESS_READBACK_COMMON_NAME: 'readback-client.access',
  } as unknown as PrivateModelEnv;
  const now = Math.floor(Date.now() / 1000);

  const verify = async (payload: Record<string, unknown>) => {
    const token = await signer.sign({ exp: now + 300, ...payload });
    return verifyPrivateModelReadbackAccess(
      new Request('https://example.test/private-model/work-test/verify/catalog.json', {
        headers: { 'cf-access-jwt-assertion': token },
      }),
      env,
    );
  };

  try {
    await expect(
      verify({
        type: 'app',
        aud: ['readback-aud'],
        sub: '',
        common_name: 'readback-client.access',
      }),
    ).resolves.toBe(true);
    await expect(
      verify({
        type: 'app',
        aud: ['publisher-aud'],
        sub: '',
        common_name: 'publisher-client.access',
      }),
    ).resolves.toBe(false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
