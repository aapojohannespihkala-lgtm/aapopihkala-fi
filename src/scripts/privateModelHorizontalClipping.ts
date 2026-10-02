import { THREE } from './threeRuntime';

type HorizontalClippingRenderer = {
  clippingPlanes: THREE.Plane[];
};

type HorizontalClippingControllerArgs = {
  canvas: HTMLElement;
  renderer: HorizontalClippingRenderer;
  enabledInput: HTMLInputElement;
  heightInput: HTMLInputElement;
  valueOutput: HTMLOutputElement;
};

export const createHorizontalClippingController = ({
  canvas,
  renderer,
  enabledInput,
  heightInput,
  valueOutput,
}: HorizontalClippingControllerArgs) => {
  const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);

  const apply = () => {
    const requestedHeight = Number(heightInput.value);
    const enabled =
      enabledInput.checked && !enabledInput.disabled && Number.isFinite(requestedHeight);

    heightInput.disabled = !enabled;
    valueOutput.textContent = Number.isFinite(requestedHeight)
      ? `${requestedHeight.toFixed(2)} m`
      : '-';

    if (enabled) {
      plane.normal.set(0, -1, 0);
      plane.constant = requestedHeight;
      renderer.clippingPlanes = [plane];
      canvas.dataset.horizontalClip = 'active';
      canvas.dataset.horizontalClipHeightM = requestedHeight.toFixed(3);
      canvas.dataset.horizontalClipSide = 'above';
      return;
    }

    renderer.clippingPlanes = [];
    canvas.dataset.horizontalClip = 'inactive';
    delete canvas.dataset.horizontalClipHeightM;
    delete canvas.dataset.horizontalClipSide;
  };

  const reset = () => {
    renderer.clippingPlanes = [];
    enabledInput.checked = false;
    enabledInput.disabled = true;
    heightInput.disabled = true;
    heightInput.min = '0';
    heightInput.max = '1';
    heightInput.step = '0.05';
    heightInput.value = '1';
    valueOutput.textContent = '-';
    canvas.dataset.horizontalClip = 'inactive';
    delete canvas.dataset.horizontalClipHeightM;
    delete canvas.dataset.horizontalClipMinY;
    delete canvas.dataset.horizontalClipMaxY;
    delete canvas.dataset.horizontalClipSide;
  };

  const configureRange = (scene: THREE.Object3D) => {
    scene.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(scene);
    if (
      bounds.isEmpty() ||
      !Number.isFinite(bounds.min.y) ||
      !Number.isFinite(bounds.max.y)
    ) {
      return false;
    }

    const minY = bounds.min.y;
    const maxY = Math.max(bounds.max.y, minY + 0.01);
    const step = Math.max((maxY - minY) / 200, 0.01);
    heightInput.min = String(minY);
    heightInput.max = String(maxY);
    heightInput.step = String(step);
    heightInput.value = String(maxY);
    valueOutput.textContent = `${maxY.toFixed(2)} m`;
    enabledInput.disabled = false;
    canvas.dataset.horizontalClipMinY = minY.toFixed(3);
    canvas.dataset.horizontalClipMaxY = maxY.toFixed(3);
    return true;
  };

  return { apply, configureRange, reset };
};
