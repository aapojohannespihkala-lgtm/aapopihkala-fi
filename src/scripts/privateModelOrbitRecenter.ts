import { Raycaster, Vector2, type Object3D, type PerspectiveCamera, type Mesh } from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Return the first actually visible, renderable surface on the camera's centre ray.
 * A ray miss is NOT permission to invent a focus distance or move the camera.
 * Geometry is read-only: hidden floors and helper lines do not become pivot anchors.
 */
export function visibleOrbitFocus(
  root: Object3D | null,
  camera: PerspectiveCamera,
): { point: import('three').Vector3; distance: number } | null {
  if (!root?.visible) return null;
  const meshes: Object3D[] = [];
  root.updateWorldMatrix(true, true);
  root.traverseVisible((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    if (!materials.some((material) => material && material.visible &&
      material.depthTest !== false && !('wireframe' in material && material.wireframe === true) &&
      (material.opacity ?? 1) >= 0.45)) return;
    meshes.push(mesh);
  });
  if (!meshes.length) return null;

  camera.updateWorldMatrix(true, false);
  const raycaster = new Raycaster();
  raycaster.setFromCamera(new Vector2(0, 0), camera);
  const hit = raycaster.intersectObjects(meshes, false)
    .find((entry) => Number.isFinite(entry.distance) && entry.distance > 0.01);
  return hit ? { point: hit.point.clone(), distance: hit.distance } : null;
}

export type OrbitRecenterOptions = {
  canvas: HTMLCanvasElement;
  camera: PerspectiveCamera;
  controls: OrbitControls;
  getScene: () => Object3D | null;
  isActive: () => boolean;
  dragThresholdPx?: number;
};

/**
 * OrbitControls is allowed to move its target during zoomToCursor; the separate
 * middle-button fixed-eye look also changes target. On the next actual LEFT drag
 * (never on a click), put an off-target pivot under the centre sightline, if a
 * visible source mesh is hit. Preserve the camera eye and look direction.
 *
 * This intentionally does not run in the render loop, switch views, or infer
 * any physical 3D location from the model's metadata.
 */
export function installOrbitRecenterOnDrag({
  canvas, camera, controls, getScene, isActive, dragThresholdPx = 5,
}: OrbitRecenterOptions): () => void {
  let pending = false;
  let pressed: { id: number; x: number; y: number } | null = null;

  const onWheel = () => { if (isActive() && controls.enableZoom) pending = true; };
  const onLookEnd = () => { if (isActive()) pending = true; };
  const onDown = (event: PointerEvent) => {
    if (event.button !== 0 || event.pointerType !== 'mouse' ||
      !isActive() || !controls.enabled || !controls.enableRotate) return;
    pressed = { id: event.pointerId, x: event.clientX, y: event.clientY };
  };
  const onMove = (event: PointerEvent) => {
    if (!pressed || pressed.id !== event.pointerId) return;
    if (!(event.buttons & 1)) { pressed = null; return; }
    if (Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) < dragThresholdPx) return;
    pressed = null;
    if (!pending || !isActive() || !controls.enabled || !controls.enableRotate) return;
    pending = false;

    const focus = visibleOrbitFocus(getScene(), camera);
    if (!focus) return;
    const originalTarget = controls.target.clone();
    // Avoid microscopic re-anchoring and ignore focus points directly at the eye.
    if (originalTarget.distanceToSquared(focus.point) < 0.01 * 0.01) return;
    const eye = camera.position.clone();
    const direction = camera.getWorldDirection(eye.clone().set(0, 0, 0));
    const toFocus = focus.point.clone().sub(eye).normalize();
    // A target outside the current centre ray would snap the camera's direction.
    if (direction.dot(toFocus) < 0.999999) return;

    const poseBefore = camera.quaternion.clone();
    controls.target.copy(focus.point);
    controls.update();
    const noEyeDrift = camera.position.distanceToSquared(eye) < 1e-8;
    const noLookJump = 1 - Math.abs(camera.quaternion.dot(poseBefore)) < 1e-8;
    if (!noEyeDrift || !noLookJump) {
      controls.target.copy(originalTarget);
      camera.position.copy(eye);
      camera.quaternion.copy(poseBefore);
      controls.update();
      camera.position.copy(eye);
      camera.quaternion.copy(poseBefore);
    }
  };
  const clear = (event: PointerEvent) => {
    if (pressed?.id === event.pointerId) pressed = null;
  };
  const clearCapture = () => { pressed = null; };

  canvas.addEventListener('wheel', onWheel, { capture: true, passive: true });
  canvas.addEventListener('private-model-look-end', onLookEnd);
  canvas.addEventListener('pointerdown', onDown, { capture: true });
  canvas.addEventListener('pointermove', onMove, { capture: true });
  canvas.addEventListener('pointerup', clear, { capture: true });
  canvas.addEventListener('pointercancel', clear, { capture: true });
  canvas.addEventListener('lostpointercapture', clearCapture);

  return () => {
    canvas.removeEventListener('wheel', onWheel, { capture: true });
    canvas.removeEventListener('private-model-look-end', onLookEnd);
    canvas.removeEventListener('pointerdown', onDown, { capture: true });
    canvas.removeEventListener('pointermove', onMove, { capture: true });
    canvas.removeEventListener('pointerup', clear, { capture: true });
    canvas.removeEventListener('pointercancel', clear, { capture: true });
    canvas.removeEventListener('lostpointercapture', clearCapture);
  };
}
