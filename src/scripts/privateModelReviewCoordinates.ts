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
