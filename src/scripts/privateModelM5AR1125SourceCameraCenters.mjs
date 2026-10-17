import { m5aR1125SourcePixelKinds } from './privateModelM5AR1125SourceRoiPixelProof.mjs';

// Scene- and source-bound projected centers for the EXISTING R1125 pixel detector.
// This prepares technical input only: it does not authenticate GLB bytes, capture
// a production screenshot, decide physical pipe geometry or approve HUMAN_REVIEW.
const sourceKeys = Object.keys(m5aR1125SourcePixelKinds);
const allowedPasses = new Set(['M5A-Z2', 'M5A-Z2D-R1036', 'M5A-Z2D-R1090']);
const kinds = new Set([
  'wellMarkerWork', 'wellDiameterPresentationWork',
  'referenceRouteWork', 'pipeDiameterPresentationWork',
  'unresolvedBoundaryMarker',
]);
const expectedBreakdown = '5_SALAOJA_AGGREGATE_NOMINAL_100MM__2_PVK_UNKNOWN';

const keyFor = (object) => {
  const d = object.userData ?? {};
  if (typeof d.G2IdCandidate === 'string' && d.G2IdCandidate) return d.G2IdCandidate;
  if (d.representationKind === 'unresolvedBoundaryMarker') {
    return 'boundary:' + String(d.boundaryRole ?? '');
  }
  return '';
};

const validSource = (object) => {
  const d = object.userData ?? {};
  return allowedPasses.has(String(d.Pass ?? '')) &&
    kinds.has(String(d.representationKind ?? '')) &&
    d.Canonical === false &&
    d.presentationOnly === true &&
    d.workAssumption === true &&
    d.exactXYClaim === false &&
    d.exactZClaim === false &&
    d.currentGeometryClaim === false &&
    d.asBuiltClaim === false &&
    d.publishToCURRENT === false;
};

// A projectable point is not proof that its source primitive can draw pixels.
// Reject definitively invisible materials before producing review projections.
// A mixed-material mesh remains eligible when at least one material can draw;
// exact per-target pixel evidence is still checked by the downstream renderer.
const materialIsVisible = (material) => {
  const list = Array.isArray(material) ? material : [material];
  return list.length > 0 && list.some((m) => {
    if (!m || m.visible === false || m.colorWrite === false) return false;
    const opacity = Number(m.opacity ?? 1);
    const alphaTest = Number(m.alphaTest ?? 0);
    return Number.isFinite(opacity) && opacity > 0 && opacity <= 1 &&
      Number.isFinite(alphaTest) && alphaTest >= 0 && alphaTest < 1 &&
      opacity > alphaTest;
  });
};

const inVisibleHierarchy = (o, root) => {
  let node = o;
  while (node) {
    if (node.visible === false) return false;
    if (node === root) return true;
    node = node.parent;
  }
  return false;
};

// Keep a route's representative point on its source centerline rather than
// using the center of a route's potentially empty bounding box. Lines and
// LineSegments are handled separately; meshes use the world-space bounding box.
const representativeSourcePoint = (object, THREE) => {
  const geom = object.geometry;
  const pos = geom?.getAttribute?.('position');
  if (!pos || !Number.isInteger(pos.count) || pos.count < 2 ||
      pos.count > 300000) {
    throw new Error('R1125 source primitive has invalid position geometry');
  }
  if (object.isLine || object.isLineSegments) {
    const index = geom.getIndex?.();
    const count = index ? index.count : pos.count;
    if (!Number.isInteger(count) || count < 2 || count > 300000 ||
        (object.isLineSegments && count % 2)) {
      throw new Error('R1125 source line indices invalid');
    }
    const point = (i) => {
      const v = index ? index.getX(i) : i;
      if (!Number.isInteger(v) || v < 0 || v >= pos.count) {
        throw new Error('R1125 source line index out of range');
      }
      return new THREE.Vector3(pos.getX(v), pos.getY(v), pos.getZ(v))
        .applyMatrix4(object.matrixWorld);
    };
    const segments = [];
    let total = 0;
    const step = object.isLineSegments ? 2 : 1;
    for (let i = 0; i + 1 < count; i += step) {
      const a = point(i), b = point(i + 1);
      const length = a.distanceTo(b);
      if (!Number.isFinite(length)) throw new Error('R1125 source line length invalid');
      if (length > 0) { total += length; segments.push({ a, b, length }); }
    }
    if (total <= 0 || !segments.length) throw new Error('R1125 source line is degenerate');
    let remaining = total / 2;
    for (const segment of segments) {
      if (remaining <= segment.length) {
        return segment.a.clone().lerp(segment.b, remaining / segment.length);
      }
      remaining -= segment.length;
    }
    throw new Error('R1125 route midpoint unavailable');
  }
  if (!object.isMesh) throw new Error('R1125 source target is not a mesh or line');
  const bbox = new THREE.Box3().setFromObject(object);
  if (bbox.isEmpty()) throw new Error('R1125 mesh bounds empty');
  return bbox.getCenter(new THREE.Vector3());
};

export function deriveM5AR1125SourceCameraCenters({
  sceneRoot, camera, THREE, sceneIndex, imageWidth, imageHeight,
}) {
  if (sceneIndex !== 63 ||
      !THREE?.Vector3 || !THREE?.Box3 ||
      !Number.isInteger(imageWidth) || imageWidth < 128 ||
      !Number.isInteger(imageHeight) || imageHeight < 128 ||
      imageWidth * imageHeight > 16000000) {
    throw new Error('R1125 requires scene63 and a bounded exact canvas viewport');
  }
  const d = sceneRoot?.userData ?? {};
  if (!sceneRoot?.traverse || !sceneRoot?.updateMatrixWorld ||
      d.sourceDiameterCorrectionContract !== 'G2_R1125' ||
      d.sourceDiameterClassBreakdown !== expectedBreakdown ||
      // Bind the projected camera targets to the original scene63 root.
      // Child-level WORK_TEST flags cannot override a promoted source root.
      d.Canonical !== false ||
      d.presentationOnly !== true ||
      d.workAssumption !== true ||
      d.humanReview !== 'NOT_RUN' ||
      d.currentGeometryClaim !== false ||
      d.asBuiltClaim !== false ||
      d.publishToCURRENT !== false) {
    throw new Error('R1125 source scene63 provenance or no-promotion contract mismatch');
  }
  if (!camera?.updateMatrixWorld || !camera?.getWorldDirection ||
      (!camera.isPerspectiveCamera && !camera.isOrthographicCamera)) {
    throw new Error('R1125 camera projection unavailable');
  }
  const viewportAspect = imageWidth / imageHeight;
  const cameraAspect = camera.isPerspectiveCamera
    ? camera.aspect
    : (camera.right - camera.left) / (camera.top - camera.bottom);
  if (!Number.isFinite(cameraAspect) ||
      Math.abs(cameraAspect - viewportAspect) > 0.02) {
    throw new Error('R1125 camera and screenshot aspect mismatch');
  }
  sceneRoot.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix?.();
  const cameraDirection = camera.getWorldDirection(new THREE.Vector3());
  const cameraPosition = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
  const objectsByKey = new Map();
  sceneRoot.traverse((object) => {
    const key = keyFor(object);
    if (!Object.hasOwn(m5aR1125SourcePixelKinds, key)) return;
    if (objectsByKey.has(key)) {
      throw new Error('R1125 duplicate source target: ' + key);
    }
    objectsByKey.set(key, object);
  });
  if (objectsByKey.size !== sourceKeys.length) {
    throw new Error('R1125 missing exact source targets: ' +
      sourceKeys.filter((key) => !objectsByKey.has(key)).join(','));
  }
  const centers = sourceKeys.map((key) => {
    const object = objectsByKey.get(key);
    if (!validSource(object) || !inVisibleHierarchy(object, sceneRoot) ||
        !materialIsVisible(object.material) ||
        (!object.isMesh && !object.isLine && !object.isLineSegments)) {
      throw new Error('R1125 invisible or unsafe source primitive: ' + key);
    }
    const kind = m5aR1125SourcePixelKinds[key];
    const rep = object.userData.representationKind;
    if ((kind === 'wellGray' &&
         rep !== 'wellMarkerWork' && rep !== 'wellDiameterPresentationWork') ||
        (kind === 'routeCyan' &&
         rep !== 'referenceRouteWork' && rep !== 'pipeDiameterPresentationWork') ||
        (kind === 'boundaryYellow' &&
         (rep !== 'unresolvedBoundaryMarker' ||
          !object.isLineSegments ||
          object.userData.boundaryStatus !== 'UNRESOLVED_BOUNDARY'))) {
      throw new Error('R1125 source kind mismatch: ' + key);
    }
    const worldPoint = representativeSourcePoint(object, THREE);
    if (![worldPoint.x, worldPoint.y, worldPoint.z].every(Number.isFinite) ||
        worldPoint.clone().sub(cameraPosition).dot(cameraDirection) <= 0) {
      throw new Error('R1125 target behind camera or nonfinite: ' + key);
    }
    const ndc = worldPoint.clone().project(camera);
    if (![ndc.x, ndc.y, ndc.z].every(Number.isFinite) ||
        Math.abs(ndc.x) >= 1 || Math.abs(ndc.y) >= 1 ||
        ndc.z < -1 || ndc.z > 1) {
      throw new Error('R1125 target clipped or outside viewport: ' + key);
    }
    return { key, u: (ndc.x + 1) / 2, v: (1 - ndc.y) / 2 };
  });
  const radius = Math.max(12, Math.round(Math.min(imageWidth, imageHeight) * 0.035));
  for (let i = 0; i < centers.length; i++) {
    for (let j = i + 1; j < centers.length; j++) {
      if (m5aR1125SourcePixelKinds[centers[i].key] !==
          m5aR1125SourcePixelKinds[centers[j].key]) continue;
      const dx = (centers[i].u - centers[j].u) * (imageWidth - 1);
      const dy = (centers[i].v - centers[j].v) * (imageHeight - 1);
      if (dx * dx + dy * dy <= (2 * radius) ** 2) {
        throw new Error('R1125 ambiguous same-palette projected ROI');
      }
    }
  }
  return {
    sourceSceneIndex: 63,
    sourceTargetCount: 13,
    centers,
    radiusPx: radius,
    originalGlbDigestAuthenticated: false,
    productionScreenshotVerified: false,
    humanReview: 'NOT_RUN',
  };
}
