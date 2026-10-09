import { THREE } from './threeRuntime';
import { m5aZ2ExpectedTargetKeys } from './privateModelM5AZ2ReviewPresentation';
import {
  getRequestedReviewCandidateId,
  isM5AZ2SystemReviewCandidateId,
  isM5AZ2SystemReviewId,
  m5aZ2LegacyCandidateId,
  m5aZ2LegacyReviewId,
  m5aZ2R1090CandidateId,
  m5aZ2R1090ReviewId,
} from './privateModelWorkTest';

const reviewQueryKey = 'review';

export const m5aZ2SystemReviewRuntimeCandidateIds = Object.freeze([
  m5aZ2LegacyCandidateId,
  m5aZ2R1090CandidateId,
]);

export const m5aZ2SystemReviewRuntimeReviewIds = Object.freeze([
  m5aZ2LegacyReviewId,
  m5aZ2R1090ReviewId,
]);

export const getRequestedM5AZ2SystemReviewId = (search: string) => {
  const reviewId = new URLSearchParams(search).get(reviewQueryKey);
  return isM5AZ2SystemReviewId(reviewId) ? reviewId : null;
};

export const getRequestedM5AZ2SystemCandidateId = (search: string) => {
  const candidateId = getRequestedReviewCandidateId(search);
  return candidateId && isM5AZ2SystemReviewCandidateId(candidateId) ? candidateId : null;
};

export const getActiveM5AZ2SystemReviewId = (search: string) =>
  getRequestedM5AZ2SystemReviewId(search) ?? m5aZ2LegacyReviewId;

export const getActiveM5AZ2SystemCandidateId = (search: string) =>
  getRequestedM5AZ2SystemCandidateId(search) ?? m5aZ2LegacyCandidateId;

export const isM5AZ2SystemReviewRequested = (search: string) =>
  getRequestedM5AZ2SystemReviewId(search) !== null;

const drawableM5AZ2Passes = new Set(['M5A-Z2', 'M5A-Z2D-R1036', 'M5A-Z2D-R1090']);
const drawableM5AZ2Kinds = new Set([
  'wellMarkerWork',
  'referenceRouteWork',
  'pipeDiameterPresentationWork',
  'unresolvedBoundaryMarker',
]);
const drawableM5AZ2Keys = new Set<string>(m5aZ2ExpectedTargetKeys);

// This complements, but does not replace, the source/no-promotion checks in the
// presentation helper. A keyed material-bearing object is not proof of pixels.
export const getUndrawableM5AZ2TargetKeys = (sceneRoot: any): string[] => {
  const undrawable: string[] = [];
  sceneRoot?.updateMatrixWorld?.(true);
  sceneRoot?.traverse?.((object: any) => {
    const data = object.userData ?? {};
    const kind = String(data.representationKind ?? '');
    if (!drawableM5AZ2Passes.has(String(data.Pass ?? '')) || !drawableM5AZ2Kinds.has(kind)) return;
    const key = String(data.G2IdCandidate ?? '') ||
      (kind === 'unresolvedBoundaryMarker' ? 'boundary:' + String(data.boundaryRole ?? '') : '');
    if (!drawableM5AZ2Keys.has(key)) return;

    const geometry = object.geometry;
    const position = geometry?.attributes?.position;
    const count = Number(position?.count ?? 0);
    const indices = Number(geometry?.index?.count ?? count);
    const start = Number(geometry?.drawRange?.start ?? 0);
    const requested = Number(geometry?.drawRange?.count ?? Infinity);
    const drawn = Math.min(indices - start, requested);
    const minimum = object.isMesh ? 3 : (object.isLine || object.isLineSegments ? 2 : object.isPoints ? 1 : Infinity);
    const material = object.material;
    const materials = Array.isArray(material) ? material : [material];
    const hasVisibleMaterial = materials.some((part: any) => part && part.visible !== false);
    let valid =
      Number.isFinite(count) && count >= minimum &&
      Number.isFinite(indices) && indices >= minimum &&
      Number.isFinite(start) && start >= 0 &&
      drawn >= minimum && hasVisibleMaterial && object.visible !== false;
    if (valid) {
      for (let i = 0; i < count; i += 1) {
        if (![position.getX(i), position.getY(i), position.getZ(i)].every(Number.isFinite)) {
          valid = false;
          break;
        }
      }
    }
    if (valid) {
      const bounds = new THREE.Box3().setFromObject(object);
      valid = !bounds.isEmpty() && [
        bounds.min.x, bounds.min.y, bounds.min.z,
        bounds.max.x, bounds.max.y, bounds.max.z,
      ].every(Number.isFinite);
    }
    if (!valid) undrawable.push(key);
  });
  return undrawable;
};
