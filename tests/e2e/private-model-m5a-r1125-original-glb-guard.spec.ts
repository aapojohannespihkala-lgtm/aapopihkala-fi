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
