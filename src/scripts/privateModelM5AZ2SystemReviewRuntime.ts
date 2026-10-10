import { THREE } from './threeRuntime';
import {
  m5aR1115ReviewQuestionScope,
  m5aR1115ReviewTargetIds,
  m5aR1115SceneIndex,
  prepareM5AR1115PlannedRaiseReviewPresentation,
  m5aZ2ExpectedTargetKeys,
} from './privateModelM5AZ2ReviewPresentation';
import {
  getRequestedReviewCandidateId,
  isM5AZ2SystemReviewCandidateId,
  isM5AZ2SystemReviewId,
  m5aR1115CandidateId,
  m5aR1115ReviewId,
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
  'wellDiameterPresentationWork',
  'referenceRouteWork',
  'pipeDiameterPresentationWork',
  'unresolvedBoundaryMarker',
]);
const drawableM5AZ2Keys = new Set<string>(m5aZ2ExpectedTargetKeys);

const isSupersededR1090ReferenceRoute = (data: any) =>
  String(data.Pass ?? '') === 'M5A-Z2D-R1090' &&
  String(data.representationKind ?? '') === 'referenceRouteWork';

// This complements, but does not replace, the source/no-promotion checks in the
// presentation helper. A keyed material-bearing object is not proof of pixels.
export const getUndrawableM5AZ2TargetKeys = (sceneRoot: any): string[] => {
  const undrawable: string[] = [];
  sceneRoot?.updateMatrixWorld?.(true);
  sceneRoot?.traverse?.((object: any) => {
    const data = object.userData ?? {};
    if (isSupersededR1090ReferenceRoute(data)) return;
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


export type M5AR1115ReviewRuntimeState = {
  standardViewPreset: 'drainage';
  targetBounds: any;
  dataset: Record<string, string>;
  statusText: string;
};

export const createM5AR1115ReviewRuntimeState = (
  presentation: ReturnType<typeof prepareM5AR1115PlannedRaiseReviewPresentation>,
): M5AR1115ReviewRuntimeState => {
  if (!presentation.ready) {
    throw new Error(
      `M5A R1115 review source contract not ready: missing=${presentation.missingTargetIds.join(',')} duplicate=${presentation.duplicateTargetIds.join(',')} semantic=${presentation.semanticViolationTargetIds.join(',')}`,
    );
  }
  if (presentation.sceneIndex !== m5aR1115SceneIndex) {
    throw new Error(
      `M5A R1115 review scene mismatch: expected ${m5aR1115SceneIndex}, got ${presentation.sceneIndex}`,
    );
  }
  if (
    presentation.targetRenderableCount !== m5aR1115ReviewTargetIds.length ||
    presentation.expectedTargetRenderableCount !== m5aR1115ReviewTargetIds.length ||
    presentation.foundTargetIds.join(',') !== m5aR1115ReviewTargetIds.join(',')
  ) {
    throw new Error('M5A R1115 persisted target identity/count mismatch');
  }
  if (presentation.semanticViolationCount !== 0) {
    throw new Error(
      `M5A R1115 no-promotion semantic violations: ${presentation.semanticViolationCount}`,
    );
  }
  if (presentation.createdProxyCount !== 0 || presentation.usesPersistedSourceTargets !== true) {
    throw new Error('M5A R1115 review must use persisted source targets without generated proxies');
  }
  if (presentation.reviewQuestionScope !== m5aR1115ReviewQuestionScope) {
    throw new Error('M5A R1115 review question scope mismatch');
  }
  if (!presentation.targetBounds || presentation.targetBounds.isEmpty?.()) {
    throw new Error('M5A R1115 review target bounds missing');
  }
  if (presentation.humanReview !== 'NOT_RUN') {
    throw new Error('M5A R1115 HUMAN_REVIEW must remain NOT_RUN before production render proof');
  }

  return {
    standardViewPreset: 'drainage',
    targetBounds: presentation.targetBounds,
    dataset: {
      workTestReviewMode: m5aR1115ReviewId,
      m5aR1115CandidateId,
      m5aR1115ReviewVariant: 'PLANNED_WELL_RAISE_PRESENCE',
      m5aR1115SceneIndex: String(m5aR1115SceneIndex),
      m5aR1115TargetIds: m5aR1115ReviewTargetIds.join(','),
      m5aR1115TargetRenderableCount: String(presentation.targetRenderableCount),
      m5aR1115ContextRenderableCount: String(presentation.contextRenderableCount),
      m5aR1115TargetOpacity: presentation.targetOpacity.toFixed(2),
      m5aR1115ContextOpacity: presentation.contextOpacity.toFixed(2),
      m5aR1115ViewerMarkerScale: presentation.viewerMarkerScale.toFixed(2),
      m5aR1115ViewerScalePhysicalClaim: 'false',
      m5aR1115Planned: 'true',
      m5aR1115Ordered: 'false',
      m5aR1115Implemented: 'false',
      m5aR1115PlannedRaiseHeightKnown: 'false',
      m5aR1115PhysicalWellDiameterClaim: 'false',
      m5aR1115PhysicalWellHeightClaim: 'false',
      m5aR1115PhysicalRaiseHeightClaim: 'false',
      m5aR1115ExactXYClaim: 'false',
      m5aR1115ExactZClaim: 'false',
      m5aR1115CurrentGeometryClaim: 'false',
      m5aR1115AsBuiltClaim: 'false',
      m5aR1115Canonical: 'false',
      m5aR1115PublishToCurrent: 'false',
      m5aR1115HumanReview: 'NOT_RUN',
      m5aR1115ReviewCameraMode: 'PERSPECTIVE_FREE_ORBIT_TARGET_BOUNDS',
      standardViewPreset: 'drainage',
    },
    statusText:
      `SOK2/SOK3 korotustarve - WORK_TEST / persisted markers 2/2 / targets 80 % / context 20 % / viewer scale ${presentation.viewerMarkerScale.toFixed(2)}x / scene ${m5aR1115SceneIndex} / HUMAN_REVIEW NOT_RUN`,
  };
};


export const m5aR1115ExpectedSceneName =
  'M5A R1115 TWO SOK PLANNED WELL RAISE PRESENCE (UNKNOWN HEIGHT) WORK_TEST';

export const selectM5AR1115ReviewScene = (gltf: any) => {
  const scene = gltf?.scenes?.[m5aR1115SceneIndex];
  if (!scene) throw new Error('M5A R1115 review scene 64 missing');
  if (String(scene.name ?? '') !== m5aR1115ExpectedSceneName) {
    throw new Error('M5A R1115 review scene identity mismatch');
  }

  const presentation = prepareM5AR1115PlannedRaiseReviewPresentation(scene);
  const runtimeState = createM5AR1115ReviewRuntimeState(presentation);
  return { scene, presentation, runtimeState };
};
