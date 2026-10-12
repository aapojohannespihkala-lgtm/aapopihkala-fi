import { test, expect } from '@playwright/test';
// @ts-ignore - source-only ESM module has no separate TypeScript declaration
import { authenticateM5AR1125OriginalGlb, inspectM5AR1125Scene63Source,
  R1125_ORIGINAL_GLB } from '../../src/scripts/privateModelM5AR1125OriginalGlbGuard.mjs';
// @ts-ignore - current source identity map is ESM without a TS declaration
import { m5aR1125SourcePixelKinds as kinds } from
  '../../src/scripts/privateModelM5AR1125SourceRoiPixelProof.mjs';

const sourceKeys = Object.keys(kinds);
const palette: Record<string, number[]> = {
  wellGray: [0.62, 0.67, 0.72, 1],
  routeCyan: [0.09, 0.65, 0.82, 1],
  boundaryYellow: [0.92, 0.72, 0.16, 1],
};
const fixture = (): any => {
  const gltf: any = {
    scenes: Array.from({ length: 64 }, () => ({ nodes: [], extras: {} })),
    nodes: [],
    meshes: [],
    materials: [],
  };
  gltf.scenes[63].extras = {
    sourceDiameterCorrectionContract: 'G2_R1125',
    sourceDiameterClassBreakdown:
      '5_SALAOJA_AGGREGATE_NOMINAL_100MM__2_PVK_UNKNOWN',
    Canonical: false,
    presentationOnly: true,
    workAssumption: true,
    currentGeometryClaim: false,
    asBuiltClaim: false,
    publishToCURRENT: false,
    humanReview: 'NOT_RUN',
  };
  sourceKeys.forEach((key, index) => {
    const kind = kinds[key as keyof typeof kinds] as string;
    const extras = {
      Pass: kind === 'wellGray' ? 'M5A-Z2D-R1090' : 'M5A-Z2D-R1036',
      representationKind: kind === 'wellGray'
        ? 'wellDiameterPresentationWork'
        : kind === 'routeCyan' ? 'pipeDiameterPresentationWork'
          : 'unresolvedBoundaryMarker',
      ...(kind === 'boundaryYellow'
        ? { boundaryRole: key.replace('boundary:', ''),
            boundaryStatus: 'UNRESOLVED_BOUNDARY' }
        : { G2IdCandidate: key }),
      Canonical: false,
      presentationOnly: true,
      workAssumption: true,
      exactXYClaim: false,
      exactZClaim: false,
      currentGeometryClaim: false,
      asBuiltClaim: false,
      publishToCURRENT: false,
      ...(kind === 'routeCyan' ? {
        sourceDiameterCorrectionContract: 'G2_R1125',
        pipeDiameterMmSource: key === 'G2_DRAIN_LINK_PVK_DISCHARGE_001' ||
          key === 'G2_DRAIN_LINK_PVK_PARKING_001' ? null : 100,
        pipeDiameterMmNominalSource: key === 'G2_DRAIN_LINK_PVK_DISCHARGE_001' ||
          key === 'G2_DRAIN_LINK_PVK_PARKING_001' ? null : 100,
        pipeMaterialSource: key === 'G2_DRAIN_LINK_PVK_DISCHARGE_001' ||
          key === 'G2_DRAIN_LINK_PVK_PARKING_001' ? null : 'muovi',
        ...(key === 'G2_DRAIN_LINK_PVK_DISCHARGE_001' ||
            key === 'G2_DRAIN_LINK_PVK_PARKING_001'
          ? {}
          : { pipeDiameterMmSourceScope: 'AGGREGATE_SALAOJA_SYSTEM_NOT_INDIVIDUAL_ROUTE' }),
        presentationDiameterMm: 100,
        presentationDiameterRole: 'WORK_TEST_VISUAL_PROXY',
        physicalDiameterPerRouteSourceVerified: false,
        physicalDiameterAsBuiltClaim: false,
        diameterIsPhysicalAsBuiltClaim: false,
        physicalNominalDiameterStatus: key === 'G2_DRAIN_LINK_PVK_DISCHARGE_001' ||
          key === 'G2_DRAIN_LINK_PVK_PARKING_001'
          ? 'UNKNOWN'
          : 'GENERAL_SALAOJA_SYSTEM_NOMINAL_CLASS_NOT_PER_BRANCH_MEASUREMENT',
        pipeDiameterSourceRole: key === 'G2_DRAIN_LINK_PVK_DISCHARGE_001' ||
          key === 'G2_DRAIN_LINK_PVK_PARKING_001'
          ? 'PVK_SOURCE_DIAMETER_UNKNOWN_PRESENTATION_D100'
          : 'SALAOJA_SYSTEM_NOMINAL_D100_NOT_INDIVIDUALLY_MEASURED',
        pipeDiameterEvidence: key === 'G2_DRAIN_LINK_PVK_DISCHARGE_001' ||
          key === 'G2_DRAIN_LINK_PVK_PARKING_001'
          ? 'UNRESOLVED_PVK_BRANCH_DIAMETER_NOT_INDIVIDUALLY_SUPPORTED'
          : '2026_REPORT_SALAOJA_SYSTEM_NOMINAL_D100_NOT_PER_ROUTE_AS_BUILT',
      } : {}),
    };
    gltf.nodes.push({ name: 'SOURCE_' + index, mesh: index, extras });
    gltf.meshes.push({ primitives: [{
      mode: kind === 'boundaryYellow' ? 1 : 4,
      material: index,
    }] });
    gltf.materials.push({
      pbrMetallicRoughness: { baseColorFactor: [...palette[kind]] },
    });
    gltf.scenes[63].nodes.push(index);
  });
  return gltf;
};

test('original source GLB identity is pinned to Drive bytes, not viewer URL', () => {
  expect(R1125_ORIGINAL_GLB).toEqual({
    driveFileId: '13qxYc9PF7Z6eo_OXs1RrYCyo5CbTIAKs',
    sha256: 'c465417fc101e7de495d0a04bb4feb2bee61b80cd5efccf876f6eb76326f9a48',
    bytes: 3112432, sceneIndex: 63, sourceTargetCount: 13,
  });
});

test('synthetic source shape proves exactly 4+7+2 but NEVER authenticates bytes', () => {
  const result = inspectM5AR1125Scene63Source(fixture());
  expect(result.sourceTargetCount).toBe(13);
  expect(result.sourceTargets.map((x: { key: string }) => x.key)).toEqual(sourceKeys);
  expect(result.requiredCounts).toEqual({
    wellGray: 4, routeCyan: 7, boundaryYellow: 2,
  });
  expect(result.sourceShapeVerified).toBe(true);
  expect(result.originalGlbDigestAuthenticated).toBe(false);
  expect(result.productionScreenshotVerified).toBe(false);
  expect(result.humanReview).toBe('NOT_RUN');
});

test('exact raw bytes gate rejects nonexistent or tampered source', () => {
  expect(() => authenticateM5AR1125OriginalGlb(new Uint8Array(32)))
    .toThrow(/byte length mismatch/);
  expect(() => authenticateM5AR1125OriginalGlb(
    new Uint8Array(R1125_ORIGINAL_GLB.bytes),
  )).toThrow(/digest mismatch/);
});

test('wrong scene provenance and forged human approval are rejected', () => {
  const wrong = fixture();
  wrong.scenes[63].extras.sourceDiameterCorrectionContract = 'G2_R1090';
  expect(() => inspectM5AR1125Scene63Source(wrong)).toThrow(/provenance/);
  const approved = fixture();
  approved.scenes[63].extras.humanReview = 'PASS';
  expect(() => inspectM5AR1125Scene63Source(approved)).toThrow(/provenance/);
});

test('missing, duplicated, and malformed source nodes fail closed', () => {
  const missing = fixture();
  missing.scenes[63].nodes.pop();
  expect(() => inspectM5AR1125Scene63Source(missing)).toThrow(/missing exact 13/);
  const duplicate = fixture();
  duplicate.nodes.push({ ...duplicate.nodes[0] });
  duplicate.scenes[63].nodes.push(duplicate.nodes.length - 1);
  expect(() => inspectM5AR1125Scene63Source(duplicate)).toThrow(/duplicate exact/);
  const invalid = fixture();
  invalid.scenes[63].nodes.push(900000);
  expect(() => inspectM5AR1125Scene63Source(invalid)).toThrow(/invalid scene node/);
});

test('original yellow unresolved boundaries must remain LINE primitives', () => {
  const wrong = fixture();
  const i = sourceKeys.indexOf('boundary:PVK_PARKING');
  wrong.meshes[i].primitives[0].mode = 4;
  expect(() => inspectM5AR1125Scene63Source(wrong)).toThrow(/primitive type/);
  const promoted = fixture();
  promoted.nodes[i].extras.boundaryStatus = 'RESOLVED';
  expect(() => inspectM5AR1125Scene63Source(promoted)).toThrow(/boundary status/);
});

test('source color and physical promotion flags cannot be rewritten silently', () => {
  const wrongColor = fixture();
  wrongColor.materials[3].pbrMetallicRoughness.baseColorFactor[0] = 0.05;
  expect(() => inspectM5AR1125Scene63Source(wrongColor)).toThrow(/palette/);
  const promoted = fixture();
  promoted.nodes[3].extras.publishToCURRENT = true;
  expect(() => inspectM5AR1125Scene63Source(promoted)).toThrow(/unsafe source/);
});

test('source ID cannot be relabeled as foreign or exact Z evidence', () => {
  const renamed = fixture();
  renamed.nodes[0].extras.G2IdCandidate = 'NOT_THE_ORIGINAL_SOURCE';
  expect(() => inspectM5AR1125Scene63Source(renamed)).toThrow(/missing exact 13/);
  const exactZ = fixture();
  exactZ.nodes[0].extras.exactZClaim = true;
  expect(() => inspectM5AR1125Scene63Source(exactZ)).toThrow(/unsafe source/);
});

test('all seven exact route IDs keep five nominal Ø100 and two unknown PVK source classes', () => {
  const gltf = fixture();
  const source = inspectM5AR1125Scene63Source(gltf);
  expect(source.requiredCounts.routeCyan).toBe(7);
  const routes = gltf.scenes[63].nodes.map((i: number) => gltf.nodes[i].extras)
    .filter((x: { representationKind: string }) =>
      x.representationKind === 'pipeDiameterPresentationWork');
  expect(routes).toHaveLength(7);
  expect(routes.filter((x: { pipeDiameterMmNominalSource: number | null }) =>
    x.pipeDiameterMmNominalSource === 100)).toHaveLength(5);
  expect(routes.filter((x: { physicalNominalDiameterStatus: string }) =>
    x.physicalNominalDiameterStatus === 'UNKNOWN')).toHaveLength(2);
  expect(routes.every((x: { presentationDiameterRole: string;
    physicalDiameterPerRouteSourceVerified: boolean }) =>
    x.presentationDiameterRole === 'WORK_TEST_VISUAL_PROXY' &&
    x.physicalDiameterPerRouteSourceVerified === false)).toBe(true);
});

test('PVK source diameter cannot silently change from unknown to measured Ø100', () => {
  for (const key of ['G2_DRAIN_LINK_PVK_DISCHARGE_001',
    'G2_DRAIN_LINK_PVK_PARKING_001']) {
    for (const mutation of [
      { pipeDiameterMmSource: 100 },
      { pipeDiameterMmNominalSource: 100 },
      { physicalNominalDiameterStatus: 'GENERAL_SALAOJA_SYSTEM_NOMINAL_CLASS_NOT_PER_BRANCH_MEASUREMENT' },
      { pipeDiameterSourceRole: 'SALAOJA_SYSTEM_NOMINAL_D100_NOT_INDIVIDUALLY_MEASURED' },
      { pipeMaterialSource: 'muovi' },
    ]) {
      const gltf = fixture();
      Object.assign(gltf.nodes[sourceKeys.indexOf(key)].extras, mutation);
      expect(() => inspectM5AR1125Scene63Source(gltf))
        .toThrow(/source diameter class\/proxy mismatch/);
    }
  }
});

test('five drainage route class values never become route measurements or as-built', () => {
  const key = 'G2_DRAIN_LINK_PVK_SOK1_001';
  for (const mutation of [
    { physicalDiameterPerRouteSourceVerified: true },
    { physicalDiameterAsBuiltClaim: true },
    { diameterIsPhysicalAsBuiltClaim: true },
    { pipeDiameterMmSource: null },
    { pipeDiameterMmNominalSource: null },
    { pipeDiameterMmSourceScope: 'INDIVIDUAL_SURVEYED_ROUTE' },
    { presentationDiameterRole: 'MEASURED_PHYSICAL_DIAMETER' },
    { presentationDiameterMm: 315 },
  ]) {
    const gltf = fixture();
    Object.assign(gltf.nodes[sourceKeys.indexOf(key)].extras, mutation);
    expect(() => inspectM5AR1125Scene63Source(gltf))
      .toThrow(/source diameter class\/proxy mismatch/);
  }
});
