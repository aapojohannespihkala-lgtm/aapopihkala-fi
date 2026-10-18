import { expect, test } from '@playwright/test';
import { THREE } from '../../src/scripts/threeRuntime';
// @ts-ignore -- source-bound standalone ESM detector
import { detectM5AR1125PerSourceRenderDelta as prove,
  snapshotM5AR1125RenderCamera as snapshot } from '../../src/scripts/privateModelM5AR1125PerSourceRenderDelta.mjs';
// @ts-ignore -- existing source scene/camera validation
import { deriveM5AR1125SourceCameraCenters as derive } from '../../src/scripts/privateModelM5AR1125SourceCameraCenters.mjs';
// @ts-ignore -- existing source palette contract
import { m5aR1125SourcePixelKinds } from '../../src/scripts/privateModelM5AR1125SourceRoiPixelProof.mjs';

// Synthetic regression using actual Three indexed geometry. These fixtures
// cannot authenticate the original GLB, production WebGL or HUMAN_REVIEW.
const width = 1000, height = 600;
const keys = Object.keys(m5aR1125SourcePixelKinds);
const kindOf = (key: string): string =>
  (m5aR1125SourcePixelKinds as Readonly<Record<string, string>>)[key]!;
const color: Record<string, number[]> = {
  wellGray: [150, 154, 159, 255], routeCyan: [18, 140, 180, 255],
  boundaryYellow: [200, 145, 65, 255],
};
const background = [0, 0, 0, 255];
const positions = keys.map((key, index) => ({
  key, x: 100 + index % 5 * 200, y: 100 + Math.floor(index / 5) * 200,
}));
const rect = (frame: Uint8Array, x: number, y: number, pixel: number[], halfX = 5, halfY = 5) => {
  for (let dy = -halfY; dy <= halfY; dy++) {
    for (let dx = -halfX; dx <= halfX; dx++) {
      const off = ((y + dy) * width + x + dx) * 4;
      for (let k = 0; k < 4; k++) frame[off + k] = pixel[k]!;
    }
  }
};
const patch = (frame: Uint8Array, x: number, y: number, pixel: number[]) => rect(frame, x, y, pixel);
const flags = {
  Canonical: false, presentationOnly: true, workAssumption: true,
  exactXYClaim: false, exactZClaim: false, currentGeometryClaim: false,
  asBuiltClaim: false, publishToCURRENT: false,
};
const fixture = (longRoutes = false) => {
  const sceneRoot = new THREE.Group();
  sceneRoot.userData = {
    ...flags, sourceDiameterCorrectionContract: 'G2_R1125',
    sourceDiameterClassBreakdown: '5_SALAOJA_AGGREGATE_NOMINAL_100MM__2_PVK_UNKNOWN',
    humanReview: 'NOT_RUN',
  };
  const camera = new THREE.OrthographicCamera(0, width, height, 0, 0.1, 100);
  camera.position.z = 10;
  camera.lookAt(0, 0, 0);
  const objects = new Map<string, THREE.Object3D>();
  const sharedRouteMaterial = new THREE.MeshBasicMaterial({ color: 0x128cb4 });
  const sharedBoundaryGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-5.5, 0, 0), new THREE.Vector3(5.5, 0, 0),
  ]);
  const baseline = new Uint8Array(width * height * 4);
  for (let i = 3; i < baseline.length; i += 4) baseline[i] = 255;
  const paint = (frame: Uint8Array, p: typeof positions[number], pixel: number[]) => {
    const halfX = longRoutes && [6, 7, 8].includes(keys.indexOf(p.key)) ? 60 : 5;
    rect(frame, p.x, p.y, pixel, halfX, kindOf(p.key) === 'boundaryYellow' ? 0 : 5);
  };
  for (const p of positions) {
    const kind = kindOf(p.key);
    const halfX = longRoutes && [6, 7, 8].includes(keys.indexOf(p.key)) ? 60 : 5;
    const object = kind === 'boundaryYellow'
      ? new THREE.LineSegments(sharedBoundaryGeometry, new THREE.LineBasicMaterial({ color: 0xc89141 }))
      : new THREE.Mesh(new THREE.PlaneGeometry(2 * halfX + 1, 11),
          kind === 'routeCyan' ? sharedRouteMaterial : new THREE.MeshBasicMaterial({ color: 0x969a9f }));
    object.position.set(p.x + 0.5, height - p.y - 0.5, 0);
    object.userData = {
      ...flags, Pass: 'M5A-Z2D-R1036',
      representationKind: kind === 'wellGray' ? 'wellDiameterPresentationWork' :
        kind === 'routeCyan' ? 'pipeDiameterPresentationWork' : 'unresolvedBoundaryMarker',
      ...(kind === 'boundaryYellow'
        ? { boundaryRole: p.key.replace('boundary:', ''), boundaryStatus: 'UNRESOLVED_BOUNDARY' }
        : { G2IdCandidate: p.key }),
    };
    objects.set(p.key, object);
    sceneRoot.add(object);
    paint(baseline, p, color[kind]!);
  }
  const sourceScene = { sceneRoot, camera, THREE, sceneIndex: 63 };
  const projections = derive({ ...sourceScene, imageWidth: width, imageHeight: height }).centers;
  const cameraState = snapshot({ camera, width, height });
  const mutedFrames: Record<string, Uint8Array> = {};
  const restoredFrames: Record<string, Uint8Array> = {};
  const muted: Record<string, number[]> = {}, restored: Record<string, number[]> = {};
  for (const p of positions) {
    mutedFrames[p.key] = baseline.slice();
    paint(mutedFrames[p.key]!, p, background);
    restoredFrames[p.key] = baseline.slice();
    muted[p.key] = [...cameraState]; restored[p.key] = [...cameraState];
  }
  return {
    baseline, mutedFrames, restoredFrames, projections, width, height,
    sourceScene, cameraStates: { baseline: [...cameraState], muted, restored }, objects,
  };
};

test('13 complete source hides pass with independent indexed geometry and exact restoration', () => {
  const result = prove(fixture());
  expect(result.requiredSourceCount).toBe(13);
  expect(result.allSourceTargetsIsolated).toBe(true);
  for (const p of result.sourceIsolation) {
    expect(p.originalClassPixels).toBe(p.kind === 'boundaryYellow' ? 11 : 121);
    expect(p.isolatedClassPixels).toBe(p.originalClassPixels);
    expect(p.remainingClassPixels).toBe(0);
    expect(p.exclusiveRemainingPixels).toBe(0);
    expect(p.restoreChangedPixels).toBe(0);
    expect(p.peersPreserved).toBe(true);
    expect(Object.values(p.peerClassLossPixels)).toEqual(Array(12).fill(0));
    expect(p.outsideChangedPixels).toBe(0);
    expect(p.passed).toBe(true);
  }
  expect(result.originalGlbDigestAuthenticated).toBe(false);
  expect(result.productionProvenanceVerified).toBe(false);
  expect(result.humanReview).toBe('NOT_RUN');
});

test('unrelated same-color geometry cannot substitute for a muted source', () => {
  const args = fixture();
  args.mutedFrames[keys[0]!] = args.baseline.slice();
  expect(prove(args).sourceIsolation[0].passed).toBe(false);
  args.mutedFrames[keys[0]!] = args.mutedFrames[keys[1]!]!;
  expect(prove(args).allSourceTargetsIsolated).toBe(false);
});

test('one unrelated off-geometry changed pixel fails, without a global noise allowance', () => {
  const args = fixture();
  args.mutedFrames[keys[0]!]![0] = 1;
  const result = prove(args);
  expect(result.sourceIsolation[0].outsideChangedPixels).toBe(1);
  expect(result.sourceIsolation[0].passed).toBe(false);
});

test('partial center hide with sufficient lost pixels fails', () => {
  const args = fixture(), first = positions[0]!;
  const isolated = args.baseline.slice();
  rect(isolated, first.x, first.y, background, 1, 1);
  args.mutedFrames[first.key] = isolated;
  expect(prove(args).sourceIsolation[0]).toMatchObject({
    isolatedClassPixels: 9, remainingClassPixels: 112, passed: false,
  });
});

for (const index of [6, 7, 8]) {
  test('long source route ' + keys[index] + ' cannot pass when only its midpoint is hidden', () => {
    const args = fixture(true), p = positions[index]!;
    const partial = args.baseline.slice(), complete = args.mutedFrames[p.key]!;
    const radius = Math.max(12, Math.round(Math.min(width, height) * 0.035));
    for (let y = p.y - radius; y <= p.y + radius; y++) {
      for (let x = p.x - radius; x <= p.x + radius; x++) {
        if ((x - p.x) ** 2 + (y - p.y) ** 2 > radius ** 2) continue;
        const off = (y * width + x) * 4;
        partial.set(complete.subarray(off, off + 4), off);
      }
    }
    args.mutedFrames[p.key] = partial;
    const target = prove(args).sourceIsolation[index];
    expect(target.remainingClassPixels).toBe(0); // old midpoint check alone passed
    expect(target.isolatedClassPixels).toBeGreaterThan(8);
    expect(target.exclusiveRemainingPixels).toBeGreaterThan(500);
    expect(target.outsideChangedPixels).toBe(0);
    expect(target.peersPreserved).toBe(true);
    expect(target.passed).toBe(false);
  });
}

test('correctly hidden long source routes pass without loosening outside-geometry changes', () => {
  const result = prove(fixture(true));
  expect(result.allSourceTargetsIsolated).toBe(true);
  for (const index of [6, 7, 8]) {
    expect(result.sourceIsolation[index].exclusiveLostPixels).toBe(1331);
    expect(result.sourceIsolation[index].outsideChangedPixels).toBe(0);
  }
});

test('peer loss is detected beyond its midpoint and with shared route material', () => {
  const args = fixture(true);
  const peer = positions[6]!;
  // Hiding a well must not erase the far end of a route outside either center ROI.
  rect(args.mutedFrames[keys[0]!]!, peer.x + 50, peer.y, background, 1, 1);
  const result = prove(args).sourceIsolation[0];
  expect((result.peerClassLossPixels as Record<string, number>)[peer.key]).toBe(9);
  expect(result.peersPreserved).toBe(false);
  expect(result.passed).toBe(false);
});

test('shared boundary geometry does not permit both instances to disappear', () => {
  const args = fixture();
  const a = positions[11]!, b = positions[12]!;
  rect(args.mutedFrames[a.key]!, b.x, b.y, background, 5, 0);
  const target = prove(args).sourceIsolation[11];
  expect((target.peerClassLossPixels as Record<string, number>)[b.key]).toBe(11);
  expect(target.peersPreserved).toBe(false);
  expect(target.passed).toBe(false);
});

test('cross-palette peer lost inside target center ROI cannot pass', () => {
  const args = fixture(), well = positions[0]!, far = positions[4]!;
  const near = { x: well.x + 15, y: well.y + 15 };
  for (const frame of [args.baseline, ...Object.values(args.mutedFrames), ...Object.values(args.restoredFrames)]) {
    patch(frame, far.x, far.y, background);
    patch(frame, near.x, near.y, color.routeCyan!);
  }
  patch(args.mutedFrames[far.key]!, near.x, near.y, background);
  patch(args.mutedFrames[well.key]!, near.x, near.y, background);
  args.objects.get(far.key)!.position.set(near.x + 0.5, height - near.y - 0.5, 0);
  args.projections = derive({ ...args.sourceScene, imageWidth: width, imageHeight: height }).centers;
  const target = prove(args).sourceIsolation[0];
  expect((target.peerClassLossPixels as Record<string, number>)[far.key]).toBe(121);
  expect(target.peersPreserved).toBe(false);
  expect(target.passed).toBe(false);
});

test('subthreshold peer class loss is rejected', () => {
  const args = fixture(), route = positions[4]!;
  patch(args.mutedFrames[keys[0]!]!, route.x, route.y, [18, 140, 145, 255]);
  const target = prove(args).sourceIsolation[0];
  expect((target.peerClassLossPixels as Record<string, number>)[route.key]).toBe(121);
  expect(target.passed).toBe(false);
});

test('yellow/gray borderline pixels cannot prove two palettes', () => {
  const args = fixture(), well = positions[0]!;
  patch(args.baseline, well.x, well.y, [180, 145, 105, 255]);
  expect(prove(args).sourceIsolation[0].originalClassPixels).toBe(0);
  expect(prove(args).sourceIsolation[0].passed).toBe(false);
});

test('missing, malformed or foreign isolation/restoration frame fails closed', () => {
  for (const category of ['mutedFrames', 'restoredFrames'] as const) {
    const missing = fixture();
    delete missing[category][keys[0]!];
    expect(() => prove(missing)).toThrow(/source/);
    const malformed = fixture();
    malformed[category][keys[0]!] = new Uint8Array(9);
    expect(() => prove(malformed)).toThrow(/source/);
  }
  const foreign = fixture();
  foreign.mutedFrames.untrusted = foreign.baseline.slice();
  expect(() => prove(foreign)).toThrow(/source/);
});

test('duplicate, out-of-frame or source-inconsistent centers fail closed', () => {
  const dup = fixture();
  dup.projections[1] = { ...dup.projections[1], key: keys[0]! };
  expect(() => prove(dup)).toThrow(/duplicate/);
  const out = fixture();
  out.projections[1] = { ...out.projections[1], u: 1.5 };
  expect(() => prove(out)).toThrow(/duplicate/);
  const wrong = fixture();
  wrong.projections[1] = { ...wrong.projections[1], u: wrong.projections[1].u + 0.01 };
  expect(() => prove(wrong)).toThrow(/mismatch/);
});

test('a supplied mask cannot replace original source geometry', () => {
  const args = fixture();
  const supplied = { ...args, sourceScene: undefined,
    sourceMasks: Object.fromEntries(keys.map(key => [key, new Uint8Array(width * height).fill(1)])),
  };
  expect(() => prove(supplied)).toThrow(/source geometry/);
});

test('wrong, duplicate or promoted source identity cannot produce footprint proof', () => {
  const wrong = fixture();
  wrong.objects.get(keys[0]!)!.userData.G2IdCandidate = 'FOREIGN';
  expect(() => prove(wrong)).toThrow(/missing exact/);
  const duplicate = fixture();
  duplicate.sourceScene.sceneRoot.add(duplicate.objects.get(keys[0]!)!.clone());
  expect(() => prove(duplicate)).toThrow(/duplicate/);
  const promoted = fixture();
  promoted.objects.get(keys[0]!)!.userData.asBuiltClaim = true;
  expect(() => prove(promoted)).toThrow(/unsafe source/);
});

test('changed capture camera or viewport cannot reuse a source footprint', () => {
  const args = fixture();
  args.cameraStates.muted[keys[0]!]![2] += 0.001;
  expect(() => prove(args)).toThrow(/camera\/viewport mismatch/);
  const changed = fixture();
  changed.sourceScene.camera.position.x += 0.1;
  expect(() => prove(changed)).toThrow(/mismatch/);
});

test('a single changed restoration byte cannot pass', () => {
  const args = fixture();
  args.restoredFrames[keys[0]!]![0] = 1;
  expect(prove(args).sourceIsolation[0]).toMatchObject({ restoreChangedPixels: 1, passed: false });
});

test('fully occluded source footprint remains NOT_PROVEN', () => {
  const args = fixture(), source = positions[0]!;
  // A neutral occluder leaves no source-colored positive evidence.
  for (const frame of [args.baseline, ...Object.values(args.mutedFrames), ...Object.values(args.restoredFrames)]) {
    patch(frame, source.x, source.y, background);
  }
  const target = prove(args).sourceIsolation[0];
  expect(target.footprintStatus).toBe('NOT_PROVEN');
  expect(target.passed).toBe(false);
});


test('source pixel detector rejects oversized 27-frame viewport before scanning any frames',()=>{
  const poisonedFrames = new Proxy({}, {
    ownKeys(){throw new Error('oversized frame enumeration reached');},
  });
  const oversized = {
    baseline:new Uint8Array(1921*1200*4), mutedFrames:poisonedFrames,
    restoredFrames:poisonedFrames, projections:[], width:1921, height:1200,
    sourceScene:undefined, cameraStates:undefined,
  };
  // 2,305,200 pixels is above the actual 2,304,000 capture maximum;
  // no 13 source frame keys or geometry may be scanned.
  expect(()=>prove(oversized)).toThrow(/R1125 requires exact original RGBA/);
  const boundary={...oversized,width:1920,height:1200,
    baseline:new Uint8Array(1920*1200*4)};
  // The exact allowed boundary gets past the size gate to frame validation.
  expect(()=>prove(boundary)).toThrow(/oversized frame enumeration reached/);
});
