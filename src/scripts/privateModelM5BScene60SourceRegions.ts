import { THREE } from './threeRuntime';
import {
  m5bCurrentVerticalDownspoutProxyIds,
  m5bVerticalDownspoutProxyRadius,
} from './privateModelM5BReviewPresentation';
import { m5bCandidateId, m5bCurrentReviewId } from './privateModelWorkTest';

/**
 * Project the actual five M5B scene60 review-proxy meshes through the ACTUAL
 * THREE camera into isolated screenshot ROIs. This is one INPUT to the
 * independent RGBA five-pixel verifier, not a pixel or production proof.
 * No source GLB authentication, physical placement or review approval.
 */
const fail = (why: string): never => {
  throw new Error('M5B scene60 projected source regions: ' + why);
};
const required = (value: unknown, why: string): void => {
  if (!value) fail(why);
};

type Input = {
  sceneRoot: THREE.Object3D;
  camera: THREE.Camera;
  sceneIndex: number;
  reviewId: string;
  candidateId: string;
  imageWidth: number;
  imageHeight: number;
};

const finiteVector = (value: THREE.Vector3) =>
  [value.x, value.y, value.z].every(Number.isFinite);

const positiveMaterial = (object: THREE.Mesh) => {
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  return materials.length === 1 && materials.every((mat: THREE.Material) =>
    mat.visible !== false && Number(mat.opacity) >= 0.6 &&
    mat.depthTest === false && mat.depthWrite === false);
};

export const deriveM5BScene60SourceRegions = ({
  sceneRoot, camera, sceneIndex, reviewId, candidateId, imageWidth, imageHeight,
}: Input) => {
  required(sceneIndex === 60 &&
    reviewId === m5bCurrentReviewId &&
    candidateId === m5bCandidateId &&
    Number.isSafeInteger(imageWidth) && imageWidth >= 256 && imageWidth <= 2048 &&
    Number.isSafeInteger(imageHeight) && imageHeight >= 256 && imageHeight <= 2048,
  'wrong original scene60 review or screenshot size');
  required(sceneRoot instanceof THREE.Object3D &&
    sceneRoot.visible !== false &&
    sceneRoot.userData?.publishToCURRENT !== true &&
    sceneRoot.userData?.Canonical !== true &&
    sceneRoot.userData?.humanReview !== 'PASS' &&
    sceneRoot.userData?.HUMAN_REVIEW !== 'PASS',
  'unsafe source scene root');
  required(camera instanceof THREE.Camera &&
    (camera instanceof THREE.PerspectiveCamera ||
     camera instanceof THREE.OrthographicCamera),
  'real THREE projection camera required');
  const aspect = imageWidth / imageHeight;
  const cameraAspect = camera instanceof THREE.PerspectiveCamera
    ? camera.aspect
    : (camera.right - camera.left) / (camera.top - camera.bottom);
  required(Number.isFinite(cameraAspect) && Math.abs(cameraAspect - aspect) < 0.015,
    'camera/screenshot aspect mismatch');

  sceneRoot.updateMatrixWorld(true);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  const cameraPosition = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
  const cameraDirection = camera.getWorldDirection(new THREE.Vector3());
  const expected = new Set<string>(m5bCurrentVerticalDownspoutProxyIds);
  const found = new Map<string, THREE.Mesh>();
  sceneRoot.traverse((object) => {
    if (!expected.has(object.name)) return;
    required(!found.has(object.name), 'duplicate exact scene60 source proxy');
    required(object instanceof THREE.Mesh,
      'source proxy must remain a real visible THREE mesh');
    found.set(object.name, object as THREE.Mesh);
  });
  required(found.size === expected.size,
    'missing one or more of five actual scene60 source proxies');

  const project = (world: THREE.Vector3) => {
    required(finiteVector(world) &&
      world.clone().sub(cameraPosition).dot(cameraDirection) > 0,
    'source proxy behind camera');
    const p = world.clone().project(camera);
    required(finiteVector(p) &&
      Math.abs(p.x) < 1 && Math.abs(p.y) < 1 && p.z >= -1 && p.z <= 1,
    'source proxy clipped outside actual camera frame');
    return {
      x: (p.x + 1) * (imageWidth - 1) / 2,
      y: (1 - p.y) * (imageHeight - 1) / 2,
    };
  };
  const projectedTargets = m5bCurrentVerticalDownspoutProxyIds.map((logicalProxyId) => {
    const object = found.get(logicalProxyId)!;
    const d = object.userData;
    let visible = true;
    let parent: THREE.Object3D | null = object;
    while (parent) {
      if (parent.visible === false) visible = false;
      if (parent === sceneRoot) break;
      parent = parent.parent;
    }
    required(visible && parent === sceneRoot &&
      object.geometry.type === 'CylinderGeometry' &&
      object.geometry instanceof THREE.CylinderGeometry &&
      Math.abs(object.geometry.parameters.radiusTop - m5bVerticalDownspoutProxyRadius) < 1e-6 &&
      Math.abs(object.geometry.parameters.radiusBottom - m5bVerticalDownspoutProxyRadius) < 1e-6 &&
      d?.G2Id === logicalProxyId &&
      d?.m5bReviewVariant === 'CURRENT' &&
      d?.m5bReviewRole === 'VERTICAL_DOWNSPOUT_PROXY_80' &&
      d?.m5bReviewRenderableForm === 'THICK_VISIBLE_TUBE_PROXY' &&
      d?.viewerDerived === true &&
      d?.presentationOnly === true && d?.workAssumption === true &&
      d?.exactXYClaim === false && d?.exactZClaim === false &&
      d?.currentGeometryClaim === false && d?.asBuiltClaim === false &&
      d?.Canonical === false && d?.publishToCURRENT === false &&
      positiveMaterial(object),
    'unsafe, hidden, non-proxy or promoted source geometry: ' + logicalProxyId);

    // Sample only an ACTUAL middle tube segment. Full 3D box height would
    // overlap adjacent vertical pipes and incorrectly reject usable views.
    const box = new THREE.Box3().setFromObject(object);
    required(!box.isEmpty(), 'actual source proxy bounds unavailable');
    const center = box.getCenter(new THREE.Vector3());
    const center2d = project(center);
    const halfSegment = Math.min(0.24, Math.max(0.06, (box.max.y - box.min.y) * 0.05));
    const sampleOffsets: Array<[number, number, number]> = [
      [m5bVerticalDownspoutProxyRadius, 0, 0],
      [-m5bVerticalDownspoutProxyRadius, 0, 0],
      [0, 0, m5bVerticalDownspoutProxyRadius],
      [0, 0, -m5bVerticalDownspoutProxyRadius],
      [0, halfSegment, 0], [0, -halfSegment, 0],
    ];
    const distance = Math.max(...sampleOffsets.map(([x, y, z]) => {
      const offset = center.clone().add(new THREE.Vector3(x, y, z));
      const p = project(offset);
      return Math.hypot(p.x - center2d.x, p.y - center2d.y);
    }));
    const radius = Math.max(5, Math.ceil(distance + 4));
    const x = Math.round(center2d.x), y = Math.round(center2d.y);
    required(radius <= 96 &&
      x - radius >= 0 && x + radius < imageWidth &&
      y - radius >= 0 && y + radius < imageHeight,
    'actual source proxy ROI clipped');
    return Object.freeze({ logicalProxyId, x, y, radius });
  });
  // Prevent one blue screen patch from satisfying two proxy identities.
  for (let i = 0; i < projectedTargets.length; i++) {
    for (let j = i + 1; j < projectedTargets.length; j++) {
      const a = projectedTargets[i]!, b = projectedTargets[j]!;
      required(Math.hypot(a.x - b.x, a.y - b.y) > a.radius + b.radius,
        'two actual source proxy ROIs overlap in this camera');
    }
  }
  // The sibling five-delta pixel verifier accepts camera keys <=200 chars.
  // Keep all 16 view-matrix elements and projection framing, not a user label.
  const projection = camera.projectionMatrix.elements;
  const cameraKey = 'M5B60_' + [
    ...camera.matrixWorld.elements,
    projection[0], projection[5], projection[10], projection[14],
    imageWidth, imageHeight,
  ].map(v => Number(v).toFixed(4)).join('|');
  required(cameraKey.length <= 200, 'source camera identity too long');
  return Object.freeze({
    sceneIndex: 60 as const,
    reviewId: m5bCurrentReviewId,
    candidateId: m5bCandidateId,
    cameraKey,
    width: imageWidth,
    height: imageHeight,
    projectedTargets: Object.freeze(projectedTargets),
    sourceOnly: true as const,
    sourceProxyCount: 5 as const,
    originalGlbAuthenticated: false as const,
    productionScreenshotVerified: false as const,
    humanReview: 'NOT_RUN' as const,
    publishToCURRENT: false as const,
  });
};
