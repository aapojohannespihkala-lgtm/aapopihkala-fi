type QuaternionLike = {
  x: number;
  y: number;
  z: number;
  w: number;
};

type OrientationAxisElements = {
  line: SVGLineElement;
  tip: SVGCircleElement;
  label: SVGTextElement;
  world: { x: number; y: number; z: number };
};

type OrientationGizmoControllerArgs = {
  root: HTMLElement;
  axisX: OrientationAxisElements;
  axisY: OrientationAxisElements;
  axisZ: OrientationAxisElements;
  northLabel: SVGTextElement;
};

type OrientationGizmoRenderInput = {
  quaternion: QuaternionLike;
  projection: 'perspective' | 'orthographic';
};

const center = 46;
const axisRadius = 25;
const labelRadius = 33;
const minimumProjectedScale = 0.18;

const rotateByQuaternion = (
  vector: { x: number; y: number; z: number },
  quaternion: QuaternionLike,
) => {
  const { x, y, z } = vector;
  const qx = quaternion.x;
  const qy = quaternion.y;
  const qz = quaternion.z;
  const qw = quaternion.w;

  const ix = qw * x + qy * z - qz * y;
  const iy = qw * y + qz * x - qx * z;
  const iz = qw * z + qx * y - qy * x;
  const iw = -qx * x - qy * y - qz * z;

  return {
    x: ix * qw + iw * -qx + iy * -qz - iz * -qy,
    y: iy * qw + iw * -qy + iz * -qx - ix * -qz,
    z: iz * qw + iw * -qz + ix * -qy - iy * -qx,
  };
};

const worldToCameraDirection = (
  vector: { x: number; y: number; z: number },
  cameraQuaternion: QuaternionLike,
) =>
  rotateByQuaternion(vector, {
    x: -cameraQuaternion.x,
    y: -cameraQuaternion.y,
    z: -cameraQuaternion.z,
    w: cameraQuaternion.w,
  });

const setAxisGeometry = (
  axis: OrientationAxisElements,
  cameraQuaternion: QuaternionLike,
) => {
  const cameraVector = worldToCameraDirection(axis.world, cameraQuaternion);
  const projectedLength = Math.hypot(cameraVector.x, cameraVector.y);
  const safeLength = Math.max(projectedLength, 1e-9);
  const directionX = projectedLength > 1e-6 ? cameraVector.x / safeLength : 0;
  const directionY = projectedLength > 1e-6 ? -cameraVector.y / safeLength : -1;
  const scale = Math.max(minimumProjectedScale, Math.min(1, projectedLength));
  const endX = center + directionX * axisRadius * scale;
  const endY = center + directionY * axisRadius * scale;
  const textX = center + directionX * labelRadius * Math.max(0.55, scale);
  const textY = center + directionY * labelRadius * Math.max(0.55, scale);

  axis.line.setAttribute('x2', endX.toFixed(2));
  axis.line.setAttribute('y2', endY.toFixed(2));
  axis.tip.setAttribute('cx', endX.toFixed(2));
  axis.tip.setAttribute('cy', endY.toFixed(2));
  axis.label.setAttribute('x', textX.toFixed(2));
  axis.label.setAttribute('y', textY.toFixed(2));
  axis.label.dataset.depth = cameraVector.z < 0 ? 'toward-view' : 'away-from-view';

  return { endX, endY, textX, textY, cameraZ: cameraVector.z };
};

export const createOrientationGizmoController = ({
  root,
  axisX,
  axisY,
  axisZ,
  northLabel,
}: OrientationGizmoControllerArgs) => {
  let signature = '';

  root.dataset.frame = 'YLIS-G1-LOCAL';
  root.dataset.northAxis = '+Y';

  const render = ({ quaternion, projection }: OrientationGizmoRenderInput) => {
    const nextSignature = [
      quaternion.x,
      quaternion.y,
      quaternion.z,
      quaternion.w,
    ]
      .map((value) => value.toFixed(5))
      .join('|');

    if (signature === `${projection}|${nextSignature}`) return false;
    signature = `${projection}|${nextSignature}`;

    setAxisGeometry(axisX, quaternion);
    const yGeometry = setAxisGeometry(axisY, quaternion);
    setAxisGeometry(axisZ, quaternion);

    northLabel.setAttribute('x', (yGeometry.textX + 8).toFixed(2));
    northLabel.setAttribute('y', yGeometry.textY.toFixed(2));
    northLabel.dataset.depth = yGeometry.cameraZ < 0 ? 'toward-view' : 'away-from-view';

    root.dataset.cameraProjection = projection;
    root.dataset.cameraQuaternion = nextSignature;
    root.dataset.ready = 'true';
    return true;
  };

  return { render };
};
