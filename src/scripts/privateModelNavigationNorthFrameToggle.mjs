/**
 * Opt-in north-frame switch for the existing Ylisrinne orientation gizmo.
 * This does not rotate a model, camera, canvas or measurement coordinates.
 * Source: G2a YLIS-G1-LOCAL -> EPSG:3879, CityGML Building_20328352.
 * https://docs.google.com/document/d/1B59UmyKNKVfXJwIZ9dCTcQXyT6O0l7rESG2YOX6AdHE/edit
 * WORK_TEST visual-only; no current/as-built assertion.
 */
export const G1_MAP_AXES = Object.freeze({
  originE: 25485619.391,
  originN: 6673676.113,
  xE: 0.928963773,
  xN: -0.370170648,
  yE: 0.370170648,
  yN: 0.928963773,
  crs: 'EPSG:3879',
  modelFrame: 'YLIS-G1-LOCAL',
});
const fail = (reason) => { throw new Error('YLIS_NORTH_FRAME: ' + reason); };
const finite = (value) => typeof value === 'number' && Number.isFinite(value);
const validateVector = (x, y) => {
  if (!finite(x) || !finite(y)) fail('finite local X/Y required');
};
export function g1ToMapXY(x, y) {
  validateVector(x, y);
  const a = G1_MAP_AXES;
  return {
    e: a.originE + a.xE * x + a.yE * y,
    n: a.originN + a.xN * x + a.yN * y,
  };
}
export function nextNorthFrame(frame) {
  if (frame === 'local') return 'map';
  if (frame === 'map') return 'local';
  fail('unknown north frame');
}
// G1 -> viewer THREE_WORLD_Y_UP is (X, Z, -Y), per privateModelAiNavigator.
export function northWorldDirection(frame) {
  const a = G1_MAP_AXES;
  if (frame === 'local') return Object.freeze({ x: 0, y: 0, z: -1 });
  if (frame === 'map') return Object.freeze({ x: -a.yE, y: 0, z: -a.yN });
  fail('unknown north frame');
}
function inverseCameraVector(v, q) {
  // THREE inverse camera quaternion: conjugate of a unit quaternion.
  const x = -q.x, y = -q.y, z = -q.z, w = q.w;
  const ix = w * v.x + y * v.z - z * v.y;
  const iy = w * v.y + z * v.x - x * v.z;
  const iz = w * v.z + x * v.y - y * v.x;
  const iw = -x * v.x - y * v.y - z * v.z;
  return {
    x: ix * w + iw * -x + iy * -z - iz * -y,
    y: iy * w + iw * -y + iz * -x - ix * -z,
    z: iz * w + iw * -z + ix * -y - iy * -x,
  };
}
export function projectNorthMarker(quaternion, frame) {
  if (!quaternion || !['x', 'y', 'z', 'w'].every((k) => finite(quaternion[k])))
    fail('finite camera quaternion required');
  const norm = Math.hypot(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
  if (Math.abs(norm - 1) > 0.001) fail('normalized camera quaternion required');
  const v = inverseCameraVector(northWorldDirection(frame), quaternion);
  const flat = Math.hypot(v.x, v.y);
  const endOn = flat <= 0.08;
  const scale = Math.min(1, flat);
  const dx = endOn ? 0 : v.x / flat;
  const dy = endOn ? 0 : -v.y / flat;
  return Object.freeze({
    x: 46 + dx * 25 * scale,
    y: 46 + dy * 25 * scale,
    labelX: endOn ? 55 : 46 + dx * 33 * Math.max(0.55, scale) + 8,
    labelY: endOn ? 37 : 46 + dy * 33 * Math.max(0.55, scale),
    endOn,
    depth: v.z < 0 ? 'toward-view' : 'away-from-view',
  });
}
/**
 * Optional DOM mount. Caller renders the existing orientation gizmo first,
 * then calls controller.render({ quaternion }) so this annotation wins.
 * The created switch changes only SVG arrow/text and its own aria state.
 * No camera object is accepted, and no model or layer state is mutated.
 * @param {{ root?: any, svg?: any, northLabel?: any, buttonHost?: any }} [options]
 */
export function createNorthFrameToggleController({
  root, svg, northLabel, buttonHost = root,
} = {}) {
  const doc = root?.ownerDocument;
  if (!doc?.createElement || !doc?.createElementNS || !svg?.append ||
      !northLabel?.setAttribute || !buttonHost?.append) fail('gizmo DOM elements required');
  const ns = 'http://www.w3.org/2000/svg';
  const line = doc.createElementNS(ns, 'line');
  const marker = doc.createElementNS(ns, 'circle');
  line.setAttribute('x1', '46');
  line.setAttribute('y1', '46');
  line.setAttribute('stroke', 'currentColor');
  line.setAttribute('stroke-width', '2');
  line.dataset.navigationNorth = 'map-arrow';
  marker.setAttribute('r', '3');
  marker.setAttribute('fill', 'currentColor');
  marker.dataset.navigationNorth = 'map-tip';
  svg.append(line, marker);
  const button = doc.createElement('button');
  button.type = 'button';
  button.dataset.navigationNorth = 'toggle';
  button.setAttribute('aria-label', 'Vaihda paikallinen pohjoinen tai karttapohjoinen');
  button.title = 'Muuta vain suunnistusmerkintää, älä kameran tai mallin koordinaatteja';
  buttonHost.append(button);
  const original = {
    text: northLabel.textContent,
    x: northLabel.getAttribute?.('x'),
    y: northLabel.getAttribute?.('y'),
  };
  let frame = 'local', quaternion = null, disposed = false;
  // The existing orientation HUD publishes a rounded active-camera quaternion
  // before updating its readout. Recover that camera pose if the optional
  // overlay was mounted but never received its own render callback.
  // This is READ-ONLY camera state, not a second orientation model.
  const hudQuaternion = () => {
    const items = root.dataset.cameraQuaternion?.split('|');
    if (!items || items.length !== 4 || items.some((v) => v.trim() === '')) return null;
    const values = items.map(Number);
    if (!values.every(finite) || Math.abs(Math.hypot(...values) - 1) > 0.001) return null;
    return { x: values[0], y: values[1], z: values[2], w: values[3] };
  };
  const sync = () => {
    if (disposed) return;
    root.dataset.northFrame = frame;
    root.dataset.northReference = frame === 'local' ? 'YLIS-G1-LOCAL' : 'EPSG:3879';
    // UI name only. Keep EPSG:3879 in machine-readable metadata.
    button.dataset.frameLabel = frame === 'local' ? 'YLIS-G1-LOCAL' : 'ETRS-GK25';
    button.textContent = frame === 'local' ? 'Pohjoinen: rakennus' : 'Pohjoinen: kartta';
    button.setAttribute('aria-pressed', String(frame === 'map'));
    northLabel.textContent = frame === 'local' ? 'N' : 'N kartta';
    const pose = quaternion ?? hudQuaternion();
    // A map marker cannot be projected honestly without the live camera.
    line.style.display = marker.style.display = frame === 'map' && pose ? '' : 'none';
    root.dataset.northProjectionReady = String(Boolean(pose));
    if (!pose) return;
    const p = projectNorthMarker(pose, frame);
    northLabel.setAttribute('x', p.labelX.toFixed(2));
    northLabel.setAttribute('y', p.labelY.toFixed(2));
    northLabel.dataset.depth = p.depth;
    line.setAttribute('x2', p.x.toFixed(2));
    line.setAttribute('y2', p.y.toFixed(2));
    marker.setAttribute('cx', p.x.toFixed(2));
    marker.setAttribute('cy', p.y.toFixed(2));
    marker.dataset.endOn = String(p.endOn);
  };
  const toggle = () => {
    if (disposed) fail('controller disposed');
    frame = nextNorthFrame(frame);
    sync();
    return frame;
  };
  button.addEventListener('click', toggle);
  sync();
  return Object.freeze({
    get frame() { return frame; },
    button,
    render({ quaternion: nextQuaternion } = {}) {
      if (disposed) fail('controller disposed');
      // Validate before publishing a possibly-invalid mark.
      projectNorthMarker(nextQuaternion, frame);
      quaternion = { ...nextQuaternion };
      sync();
      return frame;
    },
    toggle,
    dispose() {
      if (disposed) return;
      disposed = true;
      button.removeEventListener('click', toggle);
      button.remove();
      line.remove();
      marker.remove();
      northLabel.textContent = original.text;
      if (original.x != null) northLabel.setAttribute('x', original.x);
      if (original.y != null) northLabel.setAttribute('y', original.y);
      delete root.dataset.northFrame;
      delete root.dataset.northReference;
      delete root.dataset.northProjectionReady;
    },
  });
}
