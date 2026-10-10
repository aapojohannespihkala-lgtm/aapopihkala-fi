import {
  createTargetBoundReviewAnchor,
  type ReviewCoordinateValue,
  type ReviewPlacementFloor,
} from './privateModelReviewCoordinates';
import type { PlacementReviewContext } from './privateModelReviewPlacementDraft';

/**
 * P137E placement interaction bridge for the existing private-model plan
 * camera and existing XY crosshair. The caller owns actual canvas events.
 *
 * This file does not register listeners, make feature activation decisions,
 * create persistence endpoints or modify the source model. The approved
 * context must be supplied by the existing G2/review routing.
 */
export type PlacementCoordinatePanelPort = {
  open: (context: PlacementReviewContext) => void;
  setClickedCoordinate: (coordinate: ReviewCoordinateValue, floor: ReviewPlacementFloor) => boolean;
  cancel: () => void;
};

export type PlacementBridgeViewerPort = {
  /** MUST stay false until the Themo and drainage activation gates have passed. */
  canActivatePlacement: () => boolean;
  getActivePlanFloor: () => ReviewPlacementFloor | null;
  isPlanCameraActive: () => boolean;
  getInteractionMode: () => 'navigate' | 'select' | 'place';
  /** Use existing YLIS-G1-LOCAL plane/ray intersection, never screenshot pixels. */
  readPlanCoordinateAtClientPoint: (clientX: number, clientY: number) => ReviewCoordinateValue | null;
  /** Show only the existing presentation-only review crosshair. */
  renderReviewCrosshair: (clientX: number, clientY: number) => void;
};

export type PlacementBridgeResult =
  | 'BLOCKED_ACTIVATION'
  | 'NO_ACTIVE_D_FLOOR'
  | 'INVALID_CONTEXT'
  | 'INACTIVE'
  | 'WRONG_FLOOR_OR_MODE'
  | 'NO_COORDINATE'
  | 'ACCEPTED';

export const createPlacementReviewCoordinateBridge = ({
  panel,
  viewer,
}: {
  panel: PlacementCoordinatePanelPort;
  viewer: PlacementBridgeViewerPort;
}) => {
  let context: PlacementReviewContext | null = null;

  const cancel = () => {
    context = null;
    panel.cancel();
  };

  const begin = (nextContext: PlacementReviewContext): PlacementBridgeResult => {
    cancel();
    if (!viewer.canActivatePlacement()) return 'BLOCKED_ACTIVATION';
    if (
      !viewer.isPlanCameraActive() ||
      viewer.getInteractionMode() !== 'place' ||
      !viewer.getActivePlanFloor()
    ) return 'NO_ACTIVE_D_FLOOR';

    if (
      !nextContext ||
      nextContext.floor !== viewer.getActivePlanFloor() ||
      !Array.isArray(nextContext.approvedWallHosts) ||
      !createTargetBoundReviewAnchor({
        targetId: nextContext.targetId,
        floor: nextContext.floor,
        coordinate: { xM: 0, yM: 0 },
      })
    ) return 'INVALID_CONTEXT';

    context = nextContext;
    panel.open(context);
    return 'ACCEPTED';
  };

  const onPlanCanvasClick = (clientX: number, clientY: number): PlacementBridgeResult => {
    if (!context) return 'INACTIVE';
    if (!viewer.canActivatePlacement()) {
      cancel();
      return 'BLOCKED_ACTIVATION';
    }
    if (
      !viewer.isPlanCameraActive() ||
      viewer.getActivePlanFloor() !== context.floor ||
      viewer.getInteractionMode() !== 'place'
    ) {
      cancel();
      return 'WRONG_FLOOR_OR_MODE';
    }

    const coordinate = viewer.readPlanCoordinateAtClientPoint(clientX, clientY);
    if (!coordinate || !Number.isFinite(coordinate.xM) || !Number.isFinite(coordinate.yM)) {
      return 'NO_COORDINATE';
    }
    // Update the panel before drawing a marker: a rejected point must never
    // appear to be accepted as a new placement.
    if (!panel.setClickedCoordinate(coordinate, context.floor)) return 'NO_COORDINATE';
    viewer.renderReviewCrosshair(clientX, clientY);
    return 'ACCEPTED';
  };

  const onViewerStateChange = () => {
    if (!context) return;
    if (
      !viewer.canActivatePlacement() ||
      !viewer.isPlanCameraActive() ||
      viewer.getActivePlanFloor() !== context.floor ||
      viewer.getInteractionMode() !== 'place'
    ) cancel();
  };

  return {
    begin,
    onPlanCanvasClick,
    onViewerStateChange,
    cancel,
    hasActiveTarget: () => context !== null,
  };
};
