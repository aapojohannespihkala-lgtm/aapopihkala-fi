import { formatReviewCoordinate } from './privateModelReviewMath';

export type ReviewCoordinateValue = {
  xM: number;
  yM: number;
};

const emptyCoordinateText = 'X - / Y -';

export const formatReviewCoordinateText = (coordinate: ReviewCoordinateValue) =>
  `X ${formatReviewCoordinate(coordinate.xM)} m / Y ${formatReviewCoordinate(coordinate.yM)} m`;

export const clearReviewPointerState = (canvas: HTMLElement, coordinatePointer: HTMLElement) => {
  coordinatePointer.textContent = emptyCoordinateText;
  delete canvas.dataset.reviewPointerX;
  delete canvas.dataset.reviewPointerY;
};

export const setReviewPointerState = (
  canvas: HTMLElement,
  coordinatePointer: HTMLElement,
  coordinate: ReviewCoordinateValue,
) => {
  coordinatePointer.textContent = formatReviewCoordinateText(coordinate);
  canvas.dataset.reviewPointerX = coordinate.xM.toFixed(3);
  canvas.dataset.reviewPointerY = coordinate.yM.toFixed(3);
};

export const clearReviewAnchorState = (canvas: HTMLElement, coordinateAnchor: HTMLElement) => {
  coordinateAnchor.textContent = emptyCoordinateText;
  delete canvas.dataset.reviewAnchorX;
  delete canvas.dataset.reviewAnchorY;
};

export const setReviewAnchorState = (
  canvas: HTMLElement,
  coordinateAnchor: HTMLElement,
  coordinate: ReviewCoordinateValue,
) => {
  coordinateAnchor.textContent = formatReviewCoordinateText(coordinate);
  canvas.dataset.reviewAnchorX = coordinate.xM.toFixed(3);
  canvas.dataset.reviewAnchorY = coordinate.yM.toFixed(3);
};

type ActivateReviewCoordinatePanelArgs = {
  canvas: HTMLElement;
  coordinatePanel: HTMLElement;
  coordinateFloor: HTMLElement;
  coordinatePointer: HTMLElement;
  floor: '1F' | '2F';
};

export const activateReviewCoordinatePanel = ({
  canvas,
  coordinatePanel,
  coordinateFloor,
  coordinatePointer,
  floor,
}: ActivateReviewCoordinatePanelArgs) => {
  coordinatePanel.hidden = false;
  coordinateFloor.textContent = `D ${floor}`;
  clearReviewPointerState(canvas, coordinatePointer);
  canvas.dataset.reviewCoordinateFrame = 'YLIS-G1-LOCAL';
  canvas.dataset.reviewGridVisible = 'true';
  canvas.dataset.reviewGridMajorStepM = '1';
  canvas.dataset.reviewGridMinorStepM = '0.5';
};

type DeactivateReviewCoordinatePanelArgs = {
  canvas: HTMLElement;
  coordinatePanel: HTMLElement;
  coordinatePointer: HTMLElement;
};

export const deactivateReviewCoordinatePanel = ({
  canvas,
  coordinatePanel,
  coordinatePointer,
}: DeactivateReviewCoordinatePanelArgs) => {
  coordinatePanel.hidden = true;
  clearReviewPointerState(canvas, coordinatePointer);
  canvas.dataset.reviewGridVisible = 'false';
};

/**
 * P137E target-bound review anchors. This is a review observation contract, not
 * a model mutation or a claim that the physical device was measured in place.
 * It deliberately does not activate the UI or publish model geometry.
 */
export type ReviewPlacementFloor = '1F' | '2F';

export type TargetBoundReviewAnchor = {
  targetId: string;
  apartment: 'D';
  floor: ReviewPlacementFloor;
  coordinateFrame: 'YLIS-G1-LOCAL';
  xM: number;
  yM: number;
  representationKind: 'HUMAN_REVIEW_ANCHOR';
  /** The click denotes the object's centre, unless the free note explicitly says otherwise. */
  targetPoint: 'OBJECT_CENTER';
  approximate: true;
  humanReview: 'NOT_RUN';
  exactXY: false;
  currentGeometry: false;
  canonical: false;
  asBuilt: false;
};

export type ApprovedReviewWallHost = {
  g2Id: string;
  floor: ReviewPlacementFloor;
  coordinateFrame: 'YLIS-G1-LOCAL';
  approvalEvidenceId: string;
  approved: true;
  axis: 'X_FIXED' | 'Y_FIXED';
  fixedM: number;
  startM: number;
  endM: number;
  /**
   * True only when source-host openings for the relevant span are known.
   * Unknown openings must not be interpreted as a solid wall.
   */
  openingsComplete: boolean;
  openings: ReadonlyArray<{ startM: number; endM: number }>;
};

export type ReviewPlacementResolution =
  | {
      status: 'UNMAPPED';
      reason:
        | 'NO_APPROVED_HOST'
        | 'OPENING_OVERLAP'
        | 'OUTSIDE_TOLERANCE'
        | 'AMBIGUOUS_HOST';
      anchor: TargetBoundReviewAnchor;
      proposal: null;
    }
  | {
      status: 'HOST_PROPOSED_WORK_TEST';
      reason: null;
      anchor: TargetBoundReviewAnchor;
      proposal: {
        hostG2Id: string;
        hostApprovalEvidenceId: string;
        xM: number;
        yM: number;
        perpendicularResidualM: number;
        /** Hint from clicked side of approved wall centreline; not a verified room or face. */
        wallSideHint: 'X_NEGATIVE' | 'X_POSITIVE' | 'Y_NEGATIVE' | 'Y_POSITIVE' | null;
        coordinateFrame: 'YLIS-G1-LOCAL';
        exactXY: false;
        currentGeometry: false;
        canonical: false;
        asBuilt: false;
      };
    };

const isFiniteNumber = (value: number) => Number.isFinite(value);
const isNonEmptyIdentity = (value: string) =>
  typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(value);

export const createTargetBoundReviewAnchor = ({
  targetId,
  floor,
  coordinate,
}: {
  targetId: string;
  floor: ReviewPlacementFloor;
  coordinate: ReviewCoordinateValue;
}): TargetBoundReviewAnchor | null => {
  if (!isNonEmptyIdentity(targetId) || (floor !== '1F' && floor !== '2F')) return null;
  if (!isFiniteNumber(coordinate?.xM) || !isFiniteNumber(coordinate?.yM)) return null;
  return {
    targetId,
    apartment: 'D',
    floor,
    coordinateFrame: 'YLIS-G1-LOCAL',
    xM: coordinate.xM,
    yM: coordinate.yM,
    representationKind: 'HUMAN_REVIEW_ANCHOR',
    targetPoint: 'OBJECT_CENTER',
    approximate: true,
    humanReview: 'NOT_RUN',
    exactXY: false,
    currentGeometry: false,
    canonical: false,
    asBuilt: false,
  };
};

const isUsableApprovedWallHost = (host: ApprovedReviewWallHost, floor: ReviewPlacementFloor) =>
  host.approved === true &&
  host.floor === floor &&
  host.coordinateFrame === 'YLIS-G1-LOCAL' &&
  isNonEmptyIdentity(host.g2Id) &&
  isNonEmptyIdentity(host.approvalEvidenceId) &&
  (host.axis === 'X_FIXED' || host.axis === 'Y_FIXED') &&
  [host.fixedM, host.startM, host.endM].every(isFiniteNumber) &&
  host.startM < host.endM &&
  host.openingsComplete === true &&
  Array.isArray(host.openings) &&
  host.openings.every(
    (opening) =>
      isFiniteNumber(opening.startM) &&
      isFiniteNumber(opening.endM) &&
      opening.startM < opening.endM &&
      opening.startM >= host.startM &&
      opening.endM <= host.endM,
  );

/**
 * Only a proven, unambiguous wall can receive a WORK_TEST placement proposal.
 * Unknown wall/approval/openings => UNMAPPED, never an invented coordinate.
 * Vertical mounting height and wall side remain unresolved independently.
 */
export const resolveTargetBoundReviewAnchor = (
  anchor: TargetBoundReviewAnchor,
  hosts: ReadonlyArray<ApprovedReviewWallHost>,
  maxResidualM = 0.03,
): ReviewPlacementResolution => {
  const fail = (reason: Extract<ReviewPlacementResolution, { status: 'UNMAPPED' }>['reason']) =>
    ({ status: 'UNMAPPED' as const, reason, anchor, proposal: null });

  if (
    anchor.apartment !== 'D' ||
    anchor.coordinateFrame !== 'YLIS-G1-LOCAL' ||
    (anchor.floor !== '1F' && anchor.floor !== '2F') ||
    !isFiniteNumber(anchor.xM) ||
    !isFiniteNumber(anchor.yM) ||
    !Number.isFinite(maxResidualM) ||
    maxResidualM < 0 ||
    maxResidualM > 0.25
  ) return fail('NO_APPROVED_HOST');

  const usable = hosts.filter((host) => isUsableApprovedWallHost(host, anchor.floor));
  if (usable.length === 0) return fail('NO_APPROVED_HOST');

  const nearWall = usable.flatMap((host) => {
    const alongM = host.axis === 'X_FIXED' ? anchor.yM : anchor.xM;
    const acrossM = host.axis === 'X_FIXED' ? anchor.xM : anchor.yM;
    if (alongM < host.startM || alongM > host.endM) return [];
    const residualM = Math.abs(acrossM - host.fixedM);
    if (residualM > maxResidualM) return [];
    const openingOverlap = host.openings.some(
      (opening) => alongM >= opening.startM && alongM <= opening.endM,
    );
    return [{ host, residualM, openingOverlap }];
  });

  if (nearWall.length === 0) return fail('OUTSIDE_TOLERANCE');
  if (nearWall.some((item) => item.openingOverlap)) return fail('OPENING_OVERLAP');

  nearWall.sort((a, b) => a.residualM - b.residualM);
  if (nearWall.length > 1 && nearWall[1].residualM - nearWall[0].residualM <= 0.001) {
    return fail('AMBIGUOUS_HOST');
  }
  const nearest = nearWall[0];
  const { host } = nearest;
  const across = host.axis === 'X_FIXED' ? anchor.xM : anchor.yM;
  const signedOffset = across - host.fixedM;
  // Do not guess the side if the click lies on the wall centreline within 5 mm.
  const wallSideHint = Math.abs(signedOffset) <= 0.005
    ? null
    : host.axis === 'X_FIXED'
      ? (signedOffset > 0 ? 'X_POSITIVE' : 'X_NEGATIVE')
      : (signedOffset > 0 ? 'Y_POSITIVE' : 'Y_NEGATIVE');
  return {
    status: 'HOST_PROPOSED_WORK_TEST',
    reason: null,
    anchor,
    proposal: {
      hostG2Id: host.g2Id,
      hostApprovalEvidenceId: host.approvalEvidenceId,
      xM: host.axis === 'X_FIXED' ? host.fixedM : anchor.xM,
      yM: host.axis === 'Y_FIXED' ? host.fixedM : anchor.yM,
      perpendicularResidualM: nearest.residualM,
      wallSideHint,
      coordinateFrame: 'YLIS-G1-LOCAL',
      exactXY: false,
      currentGeometry: false,
      canonical: false,
      asBuilt: false,
    },
  };
};


/**
 * Minimal free-text review observation. Keep the user's original words alongside
 * any conservative numeric interpretation. No floor datum => no physical Z.
 */
export type ReviewFreeNoteHeight =
  | { status: 'NOT_SPECIFIED' | 'AMBIGUOUS'; aboveFinishedFloorM: null; zM: null }
  | { status: 'FLOOR_RELATIVE_PARSED'; aboveFinishedFloorM: number; zM: null };

export type TargetBoundReviewObservation = {
  anchor: TargetBoundReviewAnchor;
  noteRaw: string;
  height: ReviewFreeNoteHeight;
  targetPoint: 'OBJECT_CENTER';
  interpretation: 'WORK_TEST_ONLY';
  verifiedWallSide: false;
  exactZ: false;
};

const noteHeightAmount = String.raw`(-?\d+(?:[.,]\d+)?)\s*(cm|m)\b`;
const heightWithLabel = new RegExp(
  String.raw`\b(?:korkeus|keskipisteen\s+korkeus)\s*(?:on\s+|[:=]\s*)?` + noteHeightAmount,
  'gi',
);
const anyQuantity = new RegExp(noteHeightAmount, 'gi');

const toFloorHeight = (amount: string, unit: string): number | null => {
  const value = Number(amount.replace(',', '.')) * (unit.toLowerCase() === 'cm' ? 0.01 : 1);
  // Limit to a conservative indoor review range. This is not a floor/ceiling fact.
  return Number.isFinite(value) && value >= 0 && value <= 10 ? value : null;
};

/**
 * Explicitly labelled height wins over unrelated dimensions. A single '120 cm'
 * shorthand is a floor-relative centre height for D interior objects.
 * Ambiguous/multiple candidate heights and underground/depth contexts fail closed.
 */
export const parseReviewFreeNoteHeight = (noteRaw: string): ReviewFreeNoteHeight => {
  const unresolved = (status: 'NOT_SPECIFIED' | 'AMBIGUOUS'): ReviewFreeNoteHeight =>
    ({ status, aboveFinishedFloorM: null, zM: null });
  if (typeof noteRaw !== 'string' || noteRaw.length > 2000) return unresolved('AMBIGUOUS');
  const undergroundOrDepth = /\b(?:maanpinnan|syvyys|syvyyttä|halkaisija|putken\s+syvyys)\b/i.test(noteRaw);
  if (undergroundOrDepth) return unresolved('NOT_SPECIFIED');

  const labelled = [...noteRaw.matchAll(heightWithLabel)];
  const quantities = [...noteRaw.matchAll(anyQuantity)];
  if (labelled.length > 1) return unresolved('AMBIGUOUS');

  let chosen: RegExpMatchArray | undefined;
  if (labelled.length === 1) {
    chosen = labelled[0];
  } else if (quantities.length === 1) {
    const clearlyFloorHeight = /\b(?:lattiasta|lattiapinnasta|valmiista\s+lattiasta|lattian\s+pinnasta)\b/i.test(noteRaw);
    const loneHeight = /^\s*(?:noin\s+|n\.\s*)?-?\d+(?:[.,]\d+)?\s*(?:cm|m)\b/i.test(noteRaw);
    const horizontalDimension = /\b(?:vasemmalle|oikealle|leveys|pituus|etäisyys|seinää\s+pitkin)\b/i.test(noteRaw);
    if ((clearlyFloorHeight || loneHeight) && !horizontalDimension) chosen = quantities[0];
  } else if (quantities.length > 1) {
    return unresolved('AMBIGUOUS');
  }
  if (!chosen) return unresolved('NOT_SPECIFIED');
  const amount = labelled.length === 1 ? chosen[1] : chosen[1];
  const unit = chosen[2];
  const aboveFinishedFloorM = toFloorHeight(amount, unit);
  if (aboveFinishedFloorM === null) return unresolved('AMBIGUOUS');
  return { status: 'FLOOR_RELATIVE_PARSED', aboveFinishedFloorM, zM: null };
};

export const createTargetBoundReviewObservation = (
  anchor: TargetBoundReviewAnchor,
  noteRaw: string,
): TargetBoundReviewObservation | null => {
  if (typeof noteRaw !== 'string' || noteRaw.length > 2000) return null;
  return {
    anchor,
    noteRaw,
    height: parseReviewFreeNoteHeight(noteRaw),
    targetPoint: 'OBJECT_CENTER',
    interpretation: 'WORK_TEST_ONLY',
    verifiedWallSide: false,
    exactZ: false,
  };
};
