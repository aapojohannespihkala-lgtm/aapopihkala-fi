import { m5aR1125SourcePixelKinds } from './privateModelM5AR1125SourceRoiPixelProof.mjs';
import { deriveM5AR1125SourceCameraCenters } from './privateModelM5AR1125SourceCameraCenters.mjs';

// Technical comparison only. The caller must separately authenticate the raw
// GLB and actual browser captures. No caller-provided raster mask is trusted.
// Geometry/camera are validated here, but cannot authenticate screenshot bytes.
const kinds = m5aR1125SourcePixelKinds;
const names = Object.keys(kinds);
const sourcePixelKind = (pixels, off) => {
  if (pixels[off + 3] < 220) return null;
  const r = pixels[off], g = pixels[off + 1], b = pixels[off + 2];
  const gray = r > 75 && r < 215 && g > 80 && g < 225 &&
    b > 85 && b < 235 && Math.abs(r - g) < 42 && Math.abs(g - b) < 44;
  const cyan = g > 92 && b > 110 && r < g * 0.62 &&
    b > g * 1.04 && b < g * 1.9;
  const yellow = r > 120 && g > 78 && r > g * 1.07 &&
    b < g * 0.73 && r < g * 1.9;
  return cyan ? 'routeCyan' : yellow ? 'boundaryYellow' :
    gray ? 'wellGray' : null;
};
const colored = (kind, pixels, off) => sourcePixelKind(pixels, off) === kind;
// A hidden source is visibly gone only when painted RGB changes. Alpha-only
// differences remain disallowed in the strict restore/off-footprint checks.
export const sourceVisibleRgbDelta = (before, hidden, off) =>
  Math.max(...[0, 1, 2].map(k => Math.abs(before[off + k] - hidden[off + k])));
const frameValid = (pixels, length) =>
  (pixels instanceof Uint8Array || pixels instanceof Uint8ClampedArray) &&
  pixels.length === length;

export function snapshotM5AR1125RenderCamera({ camera, width, height }) {
  if (!camera?.updateMatrixWorld ||
      (!camera.isPerspectiveCamera && !camera.isOrthographicCamera) ||
      !Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error('R1125 source camera snapshot unavailable');
  }
  camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix();
  const snapshot = [width, height, ...camera.matrixWorld.elements,
    ...camera.projectionMatrix.elements];
  if (snapshot.length !== 34 || !snapshot.every(Number.isFinite)) {
    throw new Error('R1125 invalid source camera snapshot');
  }
  return Object.freeze(snapshot);
}

const distanceToSegment2 = (x, y, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y;
  const length2 = dx * dx + dy * dy;
  const t = length2 === 0 ? 0 :
    Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / length2));
  return (x - a.x - t * dx) ** 2 + (y - a.y - t * dy) ** 2;
};
const edge = (a, b, x, y) => (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);

// Independent projection of indexed triangles/line segments, never a mask
// inferred from screenshot differences. One pixel of triangle edge padding and
// 1.5 pixels for native one-pixel lines include raster antialiasing conservatively.
// Outside this geometry-derived support, even a single changed byte fails.
const sourceFootprints = (sourceScene, width, height) => {
  if (!sourceScene) throw new Error('R1125 requires original source geometry, not a supplied mask');
  const derived = deriveM5AR1125SourceCameraCenters({
    ...sourceScene, imageWidth: width, imageHeight: height,
  });
  const { sceneRoot, camera, THREE } = sourceScene;
  const coverage = new Uint16Array(width * height);
  const objects = new Map();
  sceneRoot.traverse(object => {
    const d = object.userData ?? {};
    const key = d.G2IdCandidate ||
      (d.representationKind === 'unresolvedBoundaryMarker' ? 'boundary:' + d.boundaryRole : '');
    if (Object.hasOwn(kinds, key)) objects.set(key, object);
  });
  let rasterTests = 0;
  names.forEach((key, objectIndex) => {
    const object = objects.get(key);
    if (object.isInstancedMesh || object.isSkinnedMesh ||
        object.isLineLoop || object.morphTargetInfluences?.some(x => x !== 0)) {
      throw new Error('R1125 unsupported deformed source primitive');
    }
    const geometry = object.geometry, position = geometry.getAttribute('position');
    const index = geometry.getIndex();
    const length = index ? index.count : position.count;
    const start = geometry.drawRange?.start ?? 0;
    const count = Math.min(geometry.drawRange?.count ?? Infinity, length - start);
    const step = object.isMesh ? 3 : object.isLineSegments ? 2 : 1;
    if (position.itemSize !== 3 || !Number.isInteger(start) || start < 0 ||
        !Number.isInteger(count) || count < (object.isMesh ? 3 : 2) ||
        start + count > length || length > 300000 ||
        (object.isMesh && (count % 3 || start % 3)) ||
        (object.isLineSegments && (count % 2 || start % 2))) {
      throw new Error('R1125 malformed source triangle/line geometry');
    }
    const point = i => {
      const vertex = index ? index.getX(i) : i;
      if (!Number.isInteger(vertex) || vertex < 0 || vertex >= position.count) {
        throw new Error('R1125 source index out of range');
      }
      const p = new THREE.Vector3(position.getX(vertex), position.getY(vertex),
        position.getZ(vertex)).applyMatrix4(object.matrixWorld).project(camera);
      if (![p.x, p.y, p.z].every(Number.isFinite) ||
          Math.abs(p.x) > 1 || Math.abs(p.y) > 1 || p.z < -1 || p.z > 1) {
        throw new Error('R1125 full source footprint clipped or invalid');
      }
      return { x: (p.x + 1) * width / 2, y: (1 - p.y) * height / 2 };
    };
    for (let i = start; i + (object.isMesh ? 2 : 1) < start + count; i += step) {
      const a = point(i), b = point(i + 1), c = object.isMesh ? point(i + 2) : null;
      const vertices = c ? [a, b, c] : [a, b];
      const pad = c ? 1 : 1.5;
      const minX = Math.max(0, Math.floor(Math.min(...vertices.map(p => p.x)) - pad));
      const maxX = Math.min(width - 1, Math.ceil(Math.max(...vertices.map(p => p.x)) + pad));
      const minY = Math.max(0, Math.floor(Math.min(...vertices.map(p => p.y)) - pad));
      const maxY = Math.min(height - 1, Math.ceil(Math.max(...vertices.map(p => p.y)) + pad));
      rasterTests += (maxX - minX + 1) * (maxY - minY + 1);
      if (rasterTests > 50000000) throw new Error('R1125 source projection raster budget exceeded');
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const px = x + 0.5, py = y + 0.5;
          const e1 = edge(a, b, px, py), e2 = c ? edge(b, c, px, py) : 0;
          const e3 = c ? edge(c, a, px, py) : 0;
          const inTriangle = c && Math.abs(edge(a, b, c.x, c.y)) > 1e-12 &&
            ((e1 >= 0 && e2 >= 0 && e3 >= 0) || (e1 <= 0 && e2 <= 0 && e3 <= 0));
          if (inTriangle || distanceToSegment2(px, py, a, b) <= pad * pad ||
              (c && (distanceToSegment2(px, py, b, c) <= pad * pad ||
                distanceToSegment2(px, py, c, a) <= pad * pad))) {
            coverage[y * width + x] |= 1 << objectIndex;
          }
        }
      }
    }
  });
  return { coverage, centers: derived.centers };
};

/**
 * Prove disappearance throughout each source's exclusive projected footprint,
 * retain the original midpoint floor and all twelve peers, and restore exactly.
 * Fully occluded sources are NOT_PROVEN. Camera snapshots are consistency
 * checks, not authentication of caller-supplied frames or original GLB bytes.
 */
export function detectM5AR1125PerSourceRenderDelta({
  baseline, mutedFrames, restoredFrames, projections, width, height,
  sourceScene, cameraStates,
}) {
  const recordValid = frames => frames && typeof frames === 'object' &&
    !Array.isArray(frames) && Object.keys(frames).length === 13 &&
    names.every(key => Object.hasOwn(frames, key) && frameValid(frames[key], baseline.length));
  if (!Number.isInteger(width) || width < 128 ||
      !Number.isInteger(height) || height < 128 ||
      // Match the 27-frame WebGL capture contract before any source-footprint or frame scan.
      width * height > 2304000 ||
      !frameValid(baseline, width * height * 4) ||
      !recordValid(mutedFrames) || !recordValid(restoredFrames) ||
      !Array.isArray(projections) || projections.length !== 13) {
    throw new Error('R1125 requires exact original RGBA and 13 source-isolation/restoration frames');
  }
  const positions = new Map();
  for (const p of projections) {
    if (!p || !Object.hasOwn(kinds, p.key) || positions.has(p.key) ||
        !Number.isFinite(p.u) || !Number.isFinite(p.v) ||
        p.u <= 0 || p.u >= 1 || p.v <= 0 || p.v >= 1) {
      throw new Error('R1125 invalid/duplicate projected source identity');
    }
    positions.set(p.key, {
      x: Math.round(p.u * (width - 1)), y: Math.round(p.v * (height - 1)), u: p.u, v: p.v,
    });
  }
  if (positions.size !== names.length || names.some(key => !positions.has(key))) {
    throw new Error('R1125 missing source identity');
  }
  const { coverage, centers } = sourceFootprints(sourceScene, width, height);
  if (centers.some(p => Math.abs(p.u - positions.get(p.key).u) > 1e-8 ||
      Math.abs(p.v - positions.get(p.key).v) > 1e-8)) {
    throw new Error('R1125 source geometry and projected center mismatch');
  }
  const snapshot = snapshotM5AR1125RenderCamera({ camera: sourceScene.camera, width, height });
  const sameCamera = state => Array.isArray(state) && state.length === snapshot.length &&
    state.every((n, i) => Number.isFinite(n) && n === snapshot[i]);
  if (!sameCamera(cameraStates?.baseline) ||
      !cameraStates?.muted || !cameraStates?.restored ||
      Object.keys(cameraStates.muted).length !== 13 ||
      Object.keys(cameraStates.restored).length !== 13 ||
      names.some(key => !sameCamera(cameraStates.muted[key]) ||
        !sameCamera(cameraStates.restored[key]))) {
    throw new Error('R1125 capture camera/viewport mismatch');
  }
  const radius = Math.max(12, Math.round(Math.min(width, height) * 0.035));
  const radius2 = radius * radius;
  const entries = names.map((key, i) => ({ key, bit: 1 << i, kind: kinds[key], ...positions.get(key) }));
  const baselineClass = new Uint8Array(width * height);
  const classCode = { wellGray: 1, routeCyan: 2, boundaryYellow: 3 };
  for (let i = 0; i < baselineClass.length; i++) {
    baselineClass[i] = classCode[sourcePixelKind(baseline, i * 4)] ?? 0;
  }
  const observations = entries.map(target => {
    const muted = mutedFrames[target.key], restored = restoredFrames[target.key];
    const minimum = target.kind === 'boundaryYellow' ? 2 : 8;
    let originalClassPixels = 0, isolatedClassPixels = 0, remainingClassPixels = 0;
    let localChangedPixels = 0, outsideChangedPixels = 0, restoreChangedPixels = 0;
    let exclusiveOriginalPixels = 0, exclusiveLostPixels = 0, exclusiveRemainingPixels = 0;
    let exclusiveRgbLostPixels = 0;
    const peerClassLossPixels = {}, peerBaseline = {}, peerRemaining = {};
    entries.forEach(peer => {
      if (peer.key !== target.key) {
        peerClassLossPixels[peer.key] = 0; peerBaseline[peer.key] = 0; peerRemaining[peer.key] = 0;
      }
    });
    for (let i = 0; i < width * height; i++) {
      const off = i * 4, x = i % width, y = (i / width) | 0;
      const inside = (x - target.x) ** 2 + (y - target.y) ** 2 <= radius2;
      const beforeKind = baselineClass[i], afterKind = classCode[sourcePixelKind(muted, off)] ?? 0;
      const before = beforeKind === classCode[target.kind], after = afterKind === classCode[target.kind];
      let delta = 0, restoreDelta = 0;
      for (let k = 0; k < 4; k++) {
        delta = Math.max(delta, Math.abs(baseline[off + k] - muted[off + k]));
        restoreDelta = Math.max(restoreDelta, Math.abs(baseline[off + k] - restored[off + k]));
      }
      const rgbDelta = sourceVisibleRgbDelta(baseline, muted, off);
      if (restoreDelta !== 0) restoreChangedPixels++;
      if (inside) {
        if (before) { originalClassPixels++; if (!after) isolatedClassPixels++; }
        if (after) remainingClassPixels++;
        if (rgbDelta > 36) localChangedPixels++;
      }
      if (delta !== 0 && !(coverage[i] & target.bit)) outsideChangedPixels++;
      // Overlap cannot establish object identity. Only exclusively owned
      // geometry can supply the full-footprint target positive/negative proof.
      if (coverage[i] === target.bit) {
        if (before) {
          exclusiveOriginalPixels++;
          if (!after) {
            exclusiveLostPixels++;
            if (rgbDelta > 36) exclusiveRgbLostPixels++;
          }
        }
        if (after) exclusiveRemainingPixels++;
      }
      if (coverage[i]) for (const peer of entries) {
        if (peer.key === target.key || !(coverage[i] & peer.bit)) continue;
        const peerBefore = beforeKind === classCode[peer.kind], peerAfter = afterKind === classCode[peer.kind];
        if (peerBefore) {
          if (coverage[i] === peer.bit) peerBaseline[peer.key]++;
          if (!peerAfter) peerClassLossPixels[peer.key]++;
        }
        if (peerAfter && coverage[i] === peer.bit) peerRemaining[peer.key]++;
      }
    }
    const peersPreserved = entries.every(peer => peer.key === target.key ||
      (peerBaseline[peer.key] >= (peer.kind === 'boundaryYellow' ? 2 : 8) &&
       peerRemaining[peer.key] >= (peer.kind === 'boundaryYellow' ? 2 : 8) &&
       peerClassLossPixels[peer.key] === 0));
    const passed = originalClassPixels >= minimum && isolatedClassPixels >= minimum &&
      remainingClassPixels === 0 && localChangedPixels >= minimum &&
      exclusiveOriginalPixels >= minimum && exclusiveLostPixels >= minimum &&
      exclusiveRgbLostPixels >= minimum &&
      exclusiveRemainingPixels === 0 && peersPreserved &&
      outsideChangedPixels === 0 && restoreChangedPixels === 0;
    return {
      key: target.key, kind: target.kind, originalClassPixels, isolatedClassPixels,
      remainingClassPixels, localChangedPixels, outsideChangedPixels, restoreChangedPixels,
      exclusiveOriginalPixels, exclusiveLostPixels, exclusiveRgbLostPixels,
      exclusiveRemainingPixels,
      peerClassLossPixels, peersPreserved, minimum, passed,
      footprintStatus: exclusiveOriginalPixels >= minimum ? 'VISIBLE_EXCLUSIVE_SOURCE_PIXELS' : 'NOT_PROVEN',
    };
  });
  return {
    requiredSourceCount: 13, sourceIsolation: observations,
    allSourceTargetsIsolated: observations.every(x => x.passed),
    footprintEvidenceScope: 'EXCLUSIVE_SOURCE_GEOMETRY_SCREEN_PIXELS',
    originalGlbDigestAuthenticated: false,
    productionProvenanceVerified: false,
    humanReview: 'NOT_RUN',
  };
}

