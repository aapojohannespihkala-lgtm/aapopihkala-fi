import type { PerspectiveCamera } from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/** Direction of a fixed-position camera, measured in world Y-up coordinates. */
export function anglesFromDirection(v: { x: number; y: number; z: number }) {
  const horizontal = Math.hypot(v.x, v.z);
  return { yaw: Math.atan2(v.x, -v.z), pitch: Math.atan2(v.y, horizontal) };
}

export function directionFromAngles(yaw: number, pitch: number) {
  const cp = Math.cos(pitch);
  return { x: Math.sin(yaw) * cp, y: Math.sin(pitch), z: -Math.cos(yaw) * cp };
}

export type MiddleMouseLookOptions = {
  camera: PerspectiveCamera;
  controls: OrbitControls;
  canvas: HTMLCanvasElement;
  radiansPerPixel?: number;
};

/**
 * Middle button: turn the view like a stationary security camera.
 * Do not change left-orbit, right-pan, wheel zoom, or apartment visibility.
 */
export function installMiddleMouseLookAround({
  camera, controls, canvas, radiansPerPixel = 0.003,
}: MiddleMouseLookOptions): () => void {
  const doc = canvas.ownerDocument;
  const win = doc.defaultView;
  if (!win) return () => {};

  let pointerId: number | null = null;
  let lastX = 0;
  let lastY = 0;
  let yaw = 0;
  let pitch = 0;
  let radius = 1;
  let dampingBefore = controls.enableDamping;
  const savedPosition = camera.position.clone();
  const forward = camera.position.clone();
  const pitchLimit = Math.PI / 2 - 0.01;

  const finish = () => {
    if (pointerId === null) return;
    const id = pointerId;
    pointerId = null;
    camera.position.copy(savedPosition);
    camera.lookAt(controls.target);
    controls.enableDamping = dampingBefore;
    if (canvas.hasPointerCapture?.(id)) canvas.releasePointerCapture(id);
  };

  const onDown = (e: PointerEvent) => {
    if (e.button !== 1 || e.pointerType !== 'mouse' || pointerId !== null || !controls.enabled) return;
    e.preventDefault();
    e.stopImmediatePropagation(); // Stop OrbitControls interpreting middle down as dolly/pan.

    // Save the actual position before flushing an earlier orbit damping impulse.
    savedPosition.copy(camera.position);
    forward.copy(controls.target).sub(savedPosition);
    radius = Math.max(forward.length(), 0.0001);
    const angles = anglesFromDirection(forward);
    yaw = angles.yaw;
    pitch = angles.pitch;
    dampingBefore = controls.enableDamping;
    controls.enableDamping = false;
    controls.update();
    camera.position.copy(savedPosition);
    const d = directionFromAngles(yaw, pitch);
    controls.target.set(
      savedPosition.x + d.x * radius,
      savedPosition.y + d.y * radius,
      savedPosition.z + d.z * radius,
    );
    controls.update();

    pointerId = e.pointerId;
    lastX = e.clientX;
    lastY = e.clientY;
    try { canvas.setPointerCapture(e.pointerId); } catch { /* synthetic or lost pointer */ }
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (!(e.buttons & 4) || !controls.enabled) { finish(); return; }
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    yaw += dx * radiansPerPixel;
    pitch = Math.max(-pitchLimit, Math.min(pitchLimit, pitch - dy * radiansPerPixel));
    const d = directionFromAngles(yaw, pitch);
    controls.target.set(
      savedPosition.x + d.x * radius,
      savedPosition.y + d.y * radius,
      savedPosition.z + d.z * radius,
    );
    camera.position.copy(savedPosition);
    controls.update();
    camera.position.copy(savedPosition);
    camera.lookAt(controls.target);
  };

  const onUp = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    finish();
  };
  const onLostCapture = () => finish();
  const onAuxClick = (e: MouseEvent) => {
    if (e.button === 1 && controls.enabled) e.preventDefault();
  };
  const onMouseDown = (e: MouseEvent) => {
    if (e.button === 1 && controls.enabled) e.preventDefault();
  };

  canvas.addEventListener('pointerdown', onDown, { capture: true });
  canvas.addEventListener('mousedown', onMouseDown, { capture: true });
  canvas.addEventListener('auxclick', onAuxClick, { capture: true });
  canvas.addEventListener('lostpointercapture', onLostCapture);
  doc.addEventListener('pointermove', onMove, { capture: true });
  doc.addEventListener('pointerup', onUp, { capture: true });
  doc.addEventListener('pointercancel', onUp, { capture: true });
  win.addEventListener('blur', finish);

  return () => {
    finish();
    canvas.removeEventListener('pointerdown', onDown, { capture: true });
    canvas.removeEventListener('mousedown', onMouseDown, { capture: true });
    canvas.removeEventListener('auxclick', onAuxClick, { capture: true });
    canvas.removeEventListener('lostpointercapture', onLostCapture);
    doc.removeEventListener('pointermove', onMove, { capture: true });
    doc.removeEventListener('pointerup', onUp, { capture: true });
    doc.removeEventListener('pointercancel', onUp, { capture: true });
    win.removeEventListener('blur', finish);
  };
}
