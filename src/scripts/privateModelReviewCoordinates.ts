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
      coordinateFrame: 'YLIS-G1-LOCAL',
      exactXY: false,
      currentGeometry: false,
      canonical: false,
      asBuilt: false,
    },
  };
};
