import * as THREE from 'three';
import type { WorkTest3DPoint } from './privateModelWorkTest3DPoint';

/** Two clicked visible model-surface points in YLIS-G1-LOCAL (metres). */
export type PointMeasurePoint = Pick<WorkTest3DPoint, 'xM' | 'yM' | 'sourceHeightYUpM'>;

export type PointMeasureResult = Readonly<{
  dxM: number;
  dyM: number;
  dzM: number;
  horizontalM: number;
  distanceM: number;
}>;

export const measureBetweenPoints = (a: PointMeasurePoint, b: PointMeasurePoint): PointMeasureResult => {
  const dxM = b.xM - a.xM;
  const dyM = b.yM - a.yM;
  const dzM = b.sourceHeightYUpM - a.sourceHeightYUpM;
  const horizontalM = Math.hypot(dxM, dyM);
  return Object.freeze({ dxM, dyM, dzM, horizontalM, distanceM: Math.hypot(horizontalM, dzM) });
};

const fi = (value: number, digits = 3) =>
  (Math.abs(value) < 0.5 * 10 ** -digits ? 0 : value).toFixed(digits).replace('.', ',');
const signedFi = (value: number) => {
  const text = fi(value);
  return text.startsWith('-') ? `−${text.slice(1)}` : `+${text}`;
};

/** Main line and detail line for the result panel (millimetre precision, model values). */
export const formatPointMeasureFi = (result: PointMeasureResult) => ({
  main: `${fi(result.distanceM)} m`,
  detail: `vaaka ${fi(result.horizontalM)} m · ΔZ ${signedFi(result.dzM)} m · ΔX ${signedFi(result.dxM)} · ΔY ${signedFi(result.dyM)}`,
});

const toViewerWorld = (point: PointMeasurePoint) =>
  new THREE.Vector3(point.xM, point.sourceHeightYUpM, -point.yM);

/**
 * Screen-sized markers and a line drawn on top of the model. The overlay is a
 * direct child of the scene (never of the model root), so it is excluded from
 * picking, bounds, fitting and edge rendering.
 */
export const createPointMeasureOverlay = (scene: THREE.Object3D) => {
  const group = new THREE.Group();
  group.name = 'POINT_MEASURE_OVERLAY';
  group.userData.PresentationOnly = true;
  group.renderOrder = 1000;
  group.visible = false;

  const markerMaterial = new THREE.PointsMaterial({
    color: 0xffc94a,
    size: 9,
    sizeAttenuation: false,
    depthTest: false,
    depthWrite: false,
    transparent: true,
  });
  const markerGeometry = new THREE.BufferGeometry();
  markerGeometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6), 3));
  const markers = new THREE.Points(markerGeometry, markerMaterial);
  markers.renderOrder = 1001;
  markers.frustumCulled = false;

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xffc94a,
    depthTest: false,
    depthWrite: false,
    transparent: true,
  });
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6), 3));
  const line = new THREE.Line(lineGeometry, lineMaterial);
  line.renderOrder = 1000;
  line.frustumCulled = false;

  group.add(line, markers);
  scene.add(group);

  const show = (a: PointMeasurePoint, b: PointMeasurePoint | null) => {
    const start = toViewerWorld(a);
    const end = b ? toViewerWorld(b) : start;
    const markerPositions = markerGeometry.getAttribute('position') as THREE.BufferAttribute;
    markerPositions.setXYZ(0, start.x, start.y, start.z);
    markerPositions.setXYZ(1, end.x, end.y, end.z);
    markerPositions.needsUpdate = true;
    markerGeometry.setDrawRange(0, b ? 2 : 1);
    const linePositions = lineGeometry.getAttribute('position') as THREE.BufferAttribute;
    linePositions.setXYZ(0, start.x, start.y, start.z);
    linePositions.setXYZ(1, end.x, end.y, end.z);
    linePositions.needsUpdate = true;
    line.visible = Boolean(b);
    group.visible = true;
  };

  const clear = () => {
    group.visible = false;
  };

  return { show, clear };
};
