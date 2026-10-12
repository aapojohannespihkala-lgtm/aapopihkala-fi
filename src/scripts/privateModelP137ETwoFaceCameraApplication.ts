import { OrthographicCamera, Vector3 } from 'three';
import {
  p137eTwoFaceTargets,
  type P137ETwoFaceDescriptor,
} from './privateModelP137ETwoSidedSourceCamera';

/**
 * Apply a verified source-camera descriptor to the EXISTING D1F viewer camera.
 * The caller must first run selectP137EScene67FocusedReview and
 * deriveP137ETwoFaceSourceCameras on the actual original scene67 subtree.
 * This never loads a GLB, changes the model, saves physical placement, or
 * authenticates production pixels/HUMAN_REVIEW.
 */
export type P137ESourceFaceOrbitControls = {
  target: Vector3;
  update: () => void;
};
export type P137EFaceViewport = Readonly<{ width: number; height: number }>;

const fail = (reason: string): never => {
  throw new Error('P137E camera application source-only: ' + reason);
};
const finiteTuple = (value: unknown): value is readonly [number, number, number] =>
  Array.isArray(value) && value.length === 3 &&
  value.every((v) => typeof v === 'number' && Number.isFinite(v));

export function applyP137ETwoFaceSourceCamera(
  camera: OrthographicCamera,
  controls: P137ESourceFaceOrbitControls,
  source: P137ETwoFaceDescriptor,
  viewport: P137EFaceViewport,
): Readonly<{
  face: 'NORTH' | 'SOUTH';
  sourceIds: readonly string[];
  sourceOnly: true;
  productionRenderVerified: false;
  humanReview: 'NOT_RUN';
}> {
  // Complete preflight before ANY mutation to a live camera or its controls.
  if (!camera?.isOrthographicCamera ||
      !(controls?.target instanceof Vector3) ||
      typeof controls.update !== 'function') fail('orthographic camera and orbit target required');
  if (!Number.isFinite(viewport?.width) || !Number.isFinite(viewport?.height) ||
      viewport.width <= 0 || viewport.height <= 0) fail('viewport dimensions');
  const aspect = viewport.width / viewport.height;
  if (aspect < 0.5 || aspect > 4) fail('viewport aspect outside source contract');
  if (!source || source.sourceOnly !== true ||
      source.productionRenderVerified !== false ||
      (source.face !== 'NORTH' && source.face !== 'SOUTH')) {
    fail('WORK_TEST source descriptor or face');
  }

  const wanted = p137eTwoFaceTargets.filter((x) => x.side === source.face)
    .map((x) => x.id);
  if (!Array.isArray(source.sourceIds) ||
      source.sourceIds.length !== wanted.length ||
      source.sourceIds.some((id, i) => id !== wanted[i]) ||
      new Set(source.sourceIds).size !== wanted.length) {
    fail('three source device identities cannot be swapped or duplicated');
  }
  if (!finiteTuple(source.eye) || !finiteTuple(source.target) ||
      !finiteTuple(source.up) ||
      !Number.isFinite(source.orthoHalfHeight) ||
      source.orthoHalfHeight < 0.36 || source.orthoHalfHeight > 5) {
    fail('source camera vectors or bounded frustum');
  }
  const eye = new Vector3(...source.eye);
  const target = new Vector3(...source.target);
  const up = new Vector3(...source.up);
  const separation = eye.clone().sub(target);
  if (separation.length() < 0.4 || separation.length() > 0.9 ||
      (source.face === 'NORTH' ? separation.z >= -0.4 : separation.z <= 0.4) ||
      Math.abs(separation.y) > 0.12 ||
      up.y < 0.98 || Math.abs(up.dot(separation.normalize())) > 0.08) {
    fail('original P123C opposite wall-face orientation');
  }

  const halfHeight = source.orthoHalfHeight;
  const halfWidth = halfHeight * aspect;
  camera.position.copy(eye);
  camera.up.copy(up);
  camera.left = -halfWidth;
  camera.right = halfWidth;
  camera.top = halfHeight;
  camera.bottom = -halfHeight;
  camera.zoom = 1;
  camera.updateProjectionMatrix();
  camera.lookAt(target);
  controls.target.copy(target);
  controls.update();

  return Object.freeze({
    face: source.face,
    sourceIds: Object.freeze([...source.sourceIds]),
    sourceOnly: true as const,
    productionRenderVerified: false as const,
    humanReview: 'NOT_RUN' as const,
  });
}
