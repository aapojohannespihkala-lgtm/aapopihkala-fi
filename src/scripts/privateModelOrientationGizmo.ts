import { THREE, getTrackedOrbitControls } from './threeRuntime';

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
const endOnThreshold = 0.08;

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
  const isEndOn = projectedLength <= endOnThreshold;
  const directionX = isEndOn ? 0 : cameraVector.x / safeLength;
  const directionY = isEndOn ? 0 : -cameraVector.y / safeLength;
  const scale = Math.min(1, projectedLength);
  const endX = center + directionX * axisRadius * scale;
  const endY = center + directionY * axisRadius * scale;
  const textX = isEndOn
    ? center + 9
    : center + directionX * labelRadius * Math.max(0.55, scale);
  const textY = isEndOn
    ? center - 9
    : center + directionY * labelRadius * Math.max(0.55, scale);

  axis.line.setAttribute('x2', endX.toFixed(2));
  axis.line.setAttribute('y2', endY.toFixed(2));
  axis.tip.setAttribute('cx', endX.toFixed(2));
  axis.tip.setAttribute('cy', endY.toFixed(2));
  axis.tip.dataset.depth = cameraVector.z < 0 ? 'toward-view' : 'away-from-view';
  axis.tip.dataset.endOn = isEndOn ? 'true' : 'false';
  axis.label.setAttribute('x', textX.toFixed(2));
  axis.label.setAttribute('y', textY.toFixed(2));
  axis.label.dataset.depth = cameraVector.z < 0 ? 'toward-view' : 'away-from-view';

  return { endX, endY, textX, textY, cameraZ: cameraVector.z };
};

const toYlis = (vector: THREE.Vector3) =>
  new THREE.Vector3(vector.x, -vector.z, vector.y);

const signed = (value: number, digits = 2) =>
  `${value >= 0 ? '+' : ''}${value.toFixed(digits)}`;

const createReadoutRow = (key: string) => {
  const row = document.createElement('div');
  row.style.display = 'grid';
  row.style.gridTemplateColumns = '43px minmax(0, 1fr)';
  row.style.gap = '5px';

  const label = document.createElement('span');
  label.textContent = key;
  label.style.color = 'var(--viewer-stone-light, #9eabb2)';
  label.style.letterSpacing = '0.03em';

  const value = document.createElement('span');
  value.textContent = '-';
  value.style.minWidth = '0';
  value.style.color = 'var(--viewer-ink-soft, #e1e7ea)';
  value.style.overflowWrap = 'anywhere';

  row.append(label, value);
  return { row, value };
};

const quaternionDistance = (a: QuaternionLike, b: QuaternionLike) =>
  Math.abs(a.x - b.x) +
  Math.abs(a.y - b.y) +
  Math.abs(a.z - b.z) +
  Math.abs(a.w - b.w);

export const createOrientationGizmoController = ({
  root,
  axisX,
  axisY,
  axisZ,
  northLabel,
}: OrientationGizmoControllerArgs) => {
  let signature = '';
  let navigatorSignature = '';

  root.dataset.frame = 'YLIS-G1-LOCAL';
  root.dataset.northAxis = '+Y';

  const canvas =
    root.closest('.viewport')?.querySelector<HTMLCanvasElement>('canvas') ??
    document.querySelector<HTMLCanvasElement>('#private-model-canvas');

  const readout = document.createElement('div');
  readout.id = 'ai-navigator-readout';
  readout.setAttribute('aria-label', 'Kuvakaappauksen YLIS-G1-LOCAL katselutiedot');
  Object.assign(readout.style, {
    display: 'grid',
    gap: '2px',
    marginTop: '5px',
    paddingTop: '5px',
    borderTop: '1px solid var(--viewer-line-soft, #46535d)',
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    fontSize: '8px',
    lineHeight: '1.25',
    fontVariantNumeric: 'tabular-nums',
  });

  const modelRow = createReadoutRow('MODEL');
  const viewRow = createReadoutRow('VIEW');
  const lookRow = createReadoutRow('LOOK');
  const centerRow = createReadoutRow('CENTER');
  const boundsRow = createReadoutRow('BOUNDS');
  readout.append(
    modelRow.row,
    viewRow.row,
    lookRow.row,
    centerRow.row,
    boundsRow.row,
  );
  root.append(readout);

  const findControls = (quaternion: QuaternionLike, projection: 'perspective' | 'orthographic') => {
    if (!canvas) return null;
    const candidates = getTrackedOrbitControls(canvas).filter((controls) => {
      const camera = controls.object as any;
      return projection === 'orthographic'
        ? camera?.isOrthographicCamera === true
        : camera?.isPerspectiveCamera === true;
    });
    if (candidates.length === 0) return null;
    return candidates
      .slice()
      .sort((a, b) => {
        const enabledDelta = Number(Boolean(b.enabled)) - Number(Boolean(a.enabled));
        if (enabledDelta !== 0) return enabledDelta;
        return (
          quaternionDistance((a.object as any).quaternion, quaternion) -
          quaternionDistance((b.object as any).quaternion, quaternion)
        );
      })[0];
  };

  const renderNavigator = (
    quaternion: QuaternionLike,
    projection: 'perspective' | 'orthographic',
  ) => {
    root.style.width = window.matchMedia('(max-width: 760px)').matches ? '176px' : '208px';
    const svg = root.querySelector<SVGElement>('svg');
    if (svg) {
      svg.style.width = window.matchMedia('(max-width: 760px)').matches ? '56px' : '72px';
      svg.style.maxWidth = svg.style.width;
      svg.style.marginInline = 'auto';
    }
    readout.style.fontSize = window.matchMedia('(max-width: 760px)').matches ? '7px' : '8px';

    const controls = findControls(quaternion, projection);
    const camera = controls?.object as any;
    if (!canvas || !controls || !camera) {
      readout.dataset.ready = 'partial';
      root.dataset.aiNavigatorReady = 'partial';
      return false;
    }

    const badge = document.querySelector<HTMLElement>('#model-source-badge');
    const workTestSelect = document.querySelector<HTMLSelectElement>('#work-test-select');
    const sourceKind = badge?.dataset.kind ?? canvas.dataset.modelSource ?? 'current';
    const candidateId =
      canvas.dataset.workTestReviewCandidate ??
      (sourceKind === 'work-test' ? workTestSelect?.value : null) ??
      null;
    const candidateTag = candidateId ? candidateId.split('-')[0]?.toUpperCase() : '';
    const modelLabel =
      sourceKind === 'work-test'
        ? `WORK_TEST${candidateTag ? ' · ' + candidateTag : ''}`
        : 'CURRENT';

    const preset = canvas.dataset.viewPreset ?? 'orbit';
    const elevationDirection = canvas.dataset.elevationDirection;
    const viewLabel =
      preset === 'elevation' && elevationDirection
        ? `ELEV ${elevationDirection.toUpperCase()} · ${projection === 'orthographic' ? 'ORTHO' : 'PERSP'}`
        : `${preset.toUpperCase()} · ${projection === 'orthographic' ? 'ORTHO' : 'PERSP'}`;

    const look = new THREE.Vector3(0, 0, -1)
      .applyQuaternion(camera.quaternion)
      .normalize();
    const lookYlis = toYlis(look).normalize();
    const target = controls.target.clone();
    const targetYlis = toYlis(target);
    const lookLabel =
      `X${signed(lookYlis.x)} Y${signed(lookYlis.y)} Z${signed(lookYlis.z)}`;
    const centerLabel =
      `X${signed(targetYlis.x)} Y${signed(targetYlis.y)} Z${signed(targetYlis.z)}`;

    let halfWidth = 0;
    let halfHeight = 0;
    if (camera.isPerspectiveCamera) {
      const distance = Math.max(camera.position.distanceTo(target), 1e-6);
      halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * distance;
      halfWidth = halfHeight * Math.max(camera.aspect || 1, 1e-6);
    } else if (camera.isOrthographicCamera) {
      halfWidth = Math.abs(camera.right - camera.left) / (2 * Math.max(camera.zoom, 1e-6));
      halfHeight = Math.abs(camera.top - camera.bottom) / (2 * Math.max(camera.zoom, 1e-6));
    }

    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).normalize();
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion).normalize();
    const bounds = new THREE.Box3();
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        const corner = target
          .clone()
          .addScaledVector(right, sx * halfWidth)
          .addScaledVector(up, sy * halfHeight);
        bounds.expandByPoint(toYlis(corner));
      }
    }
    const boundsLabel =
      `X ${bounds.min.x.toFixed(1)}..${bounds.max.x.toFixed(1)} · ` +
      `Y ${bounds.min.y.toFixed(1)}..${bounds.max.y.toFixed(1)} · ` +
      `Z ${bounds.min.z.toFixed(1)}..${bounds.max.z.toFixed(1)}`;

    const nextNavigatorSignature = [
      modelLabel,
      viewLabel,
      lookLabel,
      centerLabel,
      boundsLabel,
    ].join('|');
    if (navigatorSignature === nextNavigatorSignature) return false;
    navigatorSignature = nextNavigatorSignature;

    modelRow.value.textContent = modelLabel;
    viewRow.value.textContent = viewLabel;
    lookRow.value.textContent = lookLabel;
    centerRow.value.textContent = centerLabel;
    boundsRow.value.textContent = boundsLabel;

    readout.dataset.frame = 'YLIS-G1-LOCAL';
    readout.dataset.model = modelLabel;
    readout.dataset.view = viewLabel;
    readout.dataset.look = lookLabel;
    readout.dataset.center = centerLabel;
    readout.dataset.visibleBounds = boundsLabel;
    readout.dataset.boundsBasis = 'camera-target-plane';
    readout.dataset.ready = 'true';
    root.dataset.aiNavigatorReady = 'true';
    canvas.dataset.aiNavigator = 'ready';
    return true;
  };

  const render = ({ quaternion, projection }: OrientationGizmoRenderInput) => {
    const nextSignature = [
      quaternion.x,
      quaternion.y,
      quaternion.z,
      quaternion.w,
    ]
      .map((value) => value.toFixed(5))
      .join('|');

    let axisChanged = false;
    if (signature !== `${projection}|${nextSignature}`) {
      signature = `${projection}|${nextSignature}`;
      axisChanged = true;

      setAxisGeometry(axisX, quaternion);
      const yGeometry = setAxisGeometry(axisY, quaternion);
      setAxisGeometry(axisZ, quaternion);

      northLabel.setAttribute('x', (yGeometry.textX + 8).toFixed(2));
      northLabel.setAttribute('y', yGeometry.textY.toFixed(2));
      northLabel.dataset.depth = yGeometry.cameraZ < 0 ? 'toward-view' : 'away-from-view';

      root.dataset.cameraProjection = projection;
      root.dataset.cameraQuaternion = nextSignature;
      root.dataset.ready = 'true';
    }

    return renderNavigator(quaternion, projection) || axisChanged;
  };

  return { render };
};
