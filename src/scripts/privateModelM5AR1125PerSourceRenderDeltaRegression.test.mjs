// Synthetic algorithm regression for issue #1270. No private GLB, screenshot,
// production WebGL or physical/as-built claim is used or authenticated here.
// Run: node --test src/scripts/privateModelM5AR1125PerSourceRenderDeltaRegression.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectM5AR1125PerSourceRenderDelta,
  snapshotM5AR1125RenderCamera,
} from './privateModelM5AR1125PerSourceRenderDelta.mjs';
import { deriveM5AR1125SourceCameraCenters } from './privateModelM5AR1125SourceCameraCenters.mjs';
import { m5aR1125SourcePixelKinds as kinds } from './privateModelM5AR1125SourceRoiPixelProof.mjs';

const W = 256, H = 256, N = W * H;
const keys = Object.keys(kinds);
const colors = {
  wellGray: [145, 154, 162],
  routeCyan: [22, 144, 190],
  boundaryYellow: [215, 152, 36],
};
const matrix = (x = 0, y = 0, z = 0) => ({ elements: [
  1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1,
] });
class Vector3 {
  constructor(x = 0, y = 0, z = 0) { Object.assign(this, { x, y, z }); }
  clone() { return new Vector3(this.x, this.y, this.z); }
  sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
  distanceTo(v) { return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z); }
  lerp(v, t) {
    this.x += (v.x - this.x) * t; this.y += (v.y - this.y) * t;
    this.z += (v.z - this.z) * t; return this;
  }
  applyMatrix4(m) {
    const e = m.elements, { x, y, z } = this;
    this.x = e[0] * x + e[4] * y + e[8] * z + e[12];
    this.y = e[1] * x + e[5] * y + e[9] * z + e[13];
    this.z = e[2] * x + e[6] * y + e[10] * z + e[14];
    return this;
  }
  project() { this.x /= 10; this.y /= 10; this.z = 0; return this; }
  setFromMatrixPosition(m) {
    this.x = m.elements[12]; this.y = m.elements[13]; this.z = m.elements[14];
    return this;
  }
}
class Box3 {
  setFromObject(o) {
    const p = o.geometry.getAttribute('position');
    this.points = Array.from({ length: p.count }, (_, i) =>
      new Vector3(p.getX(i), p.getY(i), p.getZ(i)).applyMatrix4(o.matrixWorld));
    return this;
  }
  isEmpty() { return !this.points?.length; }
  getCenter(out) {
    const axis = key => this.points.map(p => p[key]);
    out.x = (Math.min(...axis('x')) + Math.max(...axis('x'))) / 2;
    out.y = (Math.min(...axis('y')) + Math.max(...axis('y'))) / 2;
    out.z = (Math.min(...axis('z')) + Math.max(...axis('z'))) / 2;
    return out;
  }
}
const THREE = { Vector3, Box3 };
const meshVertices = (width, height) => [
  [-width / 2, -height / 2, 0], [width / 2, -height / 2, 0],
  [width / 2, height / 2, 0], [-width / 2, height / 2, 0],
];
const geometry = (vertices, mesh) => ({
  drawRange: { start: 0, count: Infinity },
  getAttribute: () => ({
    itemSize: 3, count: vertices.length,
    getX: i => vertices[i][0], getY: i => vertices[i][1], getZ: i => vertices[i][2],
  }),
  getIndex: () => mesh ? {
    count: 6, getX: i => [0, 1, 2, 0, 2, 3][i],
  } : null,
});
const locations = [
  [-6, 6.5], [-2, 6.5], [2, 6.5], [6, 6.5],
  [-6, 1], [-2, 1], [2, 1], [6, 1], [-5, -3], [0, -3], [5, -3],
  [-4, -7], [4, -7],
];

function fixture() {
  const objects = keys.map((key, i) => {
    const kind = kinds[key], mesh = kind !== 'boundaryYellow';
    const [cx, cy] = locations[i];
    const width = kind === 'routeCyan' ? 3 : kind === 'wellGray' ? 1 : 1.2;
    const height = kind === 'routeCyan' ? 0.55 : kind === 'wellGray' ? 1 : 0;
    const flags = {
      Pass: 'M5A-Z2D-R1090', Canonical: false, presentationOnly: true,
      workAssumption: true, exactXYClaim: false, exactZClaim: false,
      currentGeometryClaim: false, asBuiltClaim: false, publishToCURRENT: false,
      representationKind: kind === 'routeCyan' ? 'referenceRouteWork' :
        kind === 'wellGray' ? 'wellMarkerWork' : 'unresolvedBoundaryMarker',
    };
    if (kind === 'boundaryYellow') {
      flags.boundaryRole = key.slice('boundary:'.length);
      flags.boundaryStatus = 'UNRESOLVED_BOUNDARY';
    } else flags.G2IdCandidate = key;
    return {
      userData: flags, visible: true, parent: null, material: { visible: true, opacity: 1 },
      isMesh: mesh, isLine: !mesh, isLineSegments: !mesh,
      matrixWorld: matrix(cx, cy),
      geometry: geometry(mesh ? meshVertices(width, height) :
        [[-width / 2, 0, 0], [width / 2, 0, 0]], mesh),
      cx, cy, width, height, kind,
    };
  });
  const sceneRoot = {
    userData: {
      sourceDiameterCorrectionContract: 'G2_R1125',
      sourceDiameterClassBreakdown: '5_SALAOJA_AGGREGATE_NOMINAL_100MM__2_PVK_UNKNOWN',
      Canonical: false, presentationOnly: true, workAssumption: true,
      humanReview: 'NOT_RUN', currentGeometryClaim: false,
      asBuiltClaim: false, publishToCURRENT: false,
    },
    visible: true,
    updateMatrixWorld() {},
    traverse(fn) { fn(this); objects.forEach(fn); },
  };
  objects.forEach(o => { o.parent = sceneRoot; });
  const camera = {
    isOrthographicCamera: true, left: -10, right: 10, top: 10, bottom: -10,
    matrixWorld: matrix(0, 0, 20), projectionMatrix: matrix(),
    updateMatrixWorld() {}, updateProjectionMatrix() {},
    getWorldDirection(v) { v.x = 0; v.y = 0; v.z = -1; return v; },
  };
  const sourceScene = { sceneIndex: 63, sceneRoot, camera, THREE };
  const projections = deriveM5AR1125SourceCameraCenters({
    ...sourceScene, imageWidth: W, imageHeight: H,
  }).centers;
  const baseline = new Uint8ClampedArray(N * 4).fill(255);
  const owner = new Int8Array(N).fill(-1);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const wx = (x + 0.5 - W / 2) * 20 / W;
    const wy = (H / 2 - y - 0.5) * 20 / H;
    objects.forEach((o, i) => {
      if (Math.abs(wx - o.cx) < o.width / 2 - 0.01 &&
          Math.abs(wy - o.cy) < (o.kind === 'boundaryYellow' ? 0.035 : o.height / 2 - 0.01)) {
        const off = (y * W + x) * 4;
        baseline.set([...colors[o.kind], 255], off);
        owner[y * W + x] = i;
      }
    });
  }
  const mutedFrames = {}, restoredFrames = {};
  keys.forEach((key, index) => {
    const muted = baseline.slice();
    for (let i = 0; i < N; i++) {
      if (owner[i] === index) muted.set([255, 255, 255, 255], i * 4);
    }
    mutedFrames[key] = muted;
    restoredFrames[key] = baseline.slice();
  });
  const snap = snapshotM5AR1125RenderCamera({ camera, width: W, height: H });
  const cameraStates = {
    baseline: [...snap],
    muted: Object.fromEntries(keys.map(k => [k, [...snap]])),
    restored: Object.fromEntries(keys.map(k => [k, [...snap]])),
  };
  return {
    args: { baseline, mutedFrames, restoredFrames, projections,
      width: W, height: H, sourceScene, cameraStates },
    owner,
  };
}
const run = f => detectM5AR1125PerSourceRenderDelta(f.args);
const white = (frame, pixel) => frame.set([255, 255, 255, 255], pixel * 4);

test('all 13 synthetic source targets disappear throughout the projected footprint', () => {
  const f = fixture(), result = run(f);
  assert.equal(result.requiredSourceCount, 13);
  assert.equal(result.allSourceTargetsIsolated, true);
  assert.ok(result.sourceIsolation.every(x => x.passed && x.exclusiveRemainingPixels === 0));
  assert.equal(result.originalGlbDigestAuthenticated, false);
  assert.equal(result.productionProvenanceVerified, false);
  assert.equal(result.humanReview, 'NOT_RUN');
});

test('three long routes reject midpoint-only deletion with outer source pixels intact', () => {
  for (const suffix of ['SOK1_SOK2_001', 'SOK3_BUILDING_END_001', 'SOK2_BUILDING_END_001']) {
    const f = fixture(), key = keys.find(k => k.endsWith(suffix));
    assert.ok(key, suffix);
    const idx = keys.indexOf(key), p = f.args.projections.find(p => p.key === key);
    const cx = Math.round(p.u * (W - 1)), cy = Math.round(p.v * (H - 1));
    const altered = f.args.baseline.slice();
    const radius = Math.max(12, Math.round(Math.min(W, H) * 0.035));
    for (let i = 0; i < N; i++) {
      const x = i % W, y = Math.floor(i / W);
      if (f.owner[i] === idx && (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2) {
        white(altered, i);
      }
    }
    f.args.mutedFrames[key] = altered;
    const result = run(f);
    const o = result.sourceIsolation.find(x => x.key === key);
    assert.equal(result.allSourceTargetsIsolated, false, suffix);
    assert.ok(o.exclusiveRemainingPixels > 0, suffix);
    assert.equal(o.passed, false, suffix);
  }
});

test('a color-matched peer removed by a shared-material toggle is rejected', () => {
  const f = fixture(), target = keys.find(k => k.endsWith('SOK1_SOK2_001'));
  const altered = f.args.baseline.slice();
  for (let i = 0; i < N; i++) {
    if (f.owner[i] >= 0 && kinds[keys[f.owner[i]]] === 'routeCyan') white(altered, i);
  }
  f.args.mutedFrames[target] = altered;
  const result = run(f), o = result.sourceIsolation.find(x => x.key === target);
  assert.equal(o.passed, false);
  assert.ok(o.outsideChangedPixels > 0 || !o.peersPreserved);
});

test('single off-footprint changed pixel and altered restore each reject isolation', () => {
  const f = fixture(), key = keys[0];
  f.args.mutedFrames[key][0] = 0;
  let o = run(f).sourceIsolation.find(x => x.key === key);
  assert.ok(o.outsideChangedPixels > 0);
  assert.equal(o.passed, false);
  const g = fixture();
  g.args.restoredFrames[key][0] = 0;
  o = run(g).sourceIsolation.find(x => x.key === key);
  assert.ok(o.restoreChangedPixels > 0);
  assert.equal(o.passed, false);
});

test('missing source, forged projection, camera drift and duplicate identity fail closed', () => {
  const f = fixture();
  assert.throws(() => run({ args: { ...f.args, sourceScene: null } }), /source|scene/i);
  const g = fixture();
  g.args.projections[0].u += 0.03;
  assert.throws(() => run(g), /mismatch|ambiguous/i);
  const h = fixture();
  h.args.cameraStates.muted[keys[0]][2] += 0.0001;
  assert.throws(() => run(h), /camera\/viewport mismatch/i);
  const j = fixture(), oldTraverse = j.args.sourceScene.sceneRoot.traverse;
  j.args.sourceScene.sceneRoot.traverse = fn => {
    let firstSource = null;
    oldTraverse(object => {
      if (object.userData?.G2IdCandidate === keys[0]) firstSource = object;
      fn(object);
    });
    assert.ok(firstSource, 'source fixture must contain first target');
    fn({ ...firstSource, userData: { ...firstSource.userData } });
  };
  assert.throws(() => run(j), /duplicate source target/i);
});
