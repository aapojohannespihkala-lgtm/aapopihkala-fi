import {
  CONDITIONAL_DATUM_STATUS,
  worktestDisplayedZ,
} from './privateModelN2000Worktest';

type HeightScaleControllerArgs = {
  canvas: HTMLElement;
  scale: HTMLElement;
  ticks: HTMLElement;
};

type HeightScaleRenderInput = {
  minZ: number;
  maxZ: number;
  stepM: number;
  viewportHeight: number;
  mapNorth: boolean;
};

export const createHeightScaleController = ({
  canvas,
  scale,
  ticks,
}: HeightScaleControllerArgs) => {
  const title = scale.querySelector('.height-scale-title');
  let signature = '';
  let datumAvailable = false;

  const invalidate = () => {
    signature = '';
  };

  const setVisible = (visible: boolean) => {
    scale.hidden = !visible;
    canvas.dataset.heightScaleVisible = visible ? 'true' : 'false';
    if (!visible) {
      ticks.replaceChildren();
      signature = '';
      delete canvas.dataset.heightScaleMinZ;
      delete canvas.dataset.heightScaleMaxZ;
      delete canvas.dataset.heightScaleLocalMinZ;
      delete canvas.dataset.heightScaleLocalMaxZ;
      delete canvas.dataset.heightScaleStepM;
      delete canvas.dataset.heightScaleDatumOffsetM;
      delete canvas.dataset.heightScaleDatumStatus;
      delete canvas.dataset.heightScaleFrame;
      delete canvas.dataset.heightScaleNorthReference;
    }
  };

  const setDatumAvailable = (available: boolean) => {
    datumAvailable = available;
    invalidate();
  };

  const render = ({ minZ, maxZ, stepM, viewportHeight, mapNorth }: HeightScaleRenderInput) => {
    const mode = mapNorth && datumAvailable ? 'n2000-worktest' : 'local';
    const displayMinZ = worktestDisplayedZ(minZ, mode);
    const displayMaxZ = worktestDisplayedZ(maxZ, mode);
    const offsetM = displayMinZ - minZ;
    const spanZ = Math.max(maxZ - minZ, 0.001);
    const nextSignature = [minZ, maxZ, stepM, viewportHeight]
      .map((value) => Number(value).toFixed(3))
      .concat(mapNorth ? 'map' : 'local', mode)
      .join('|');
    if (nextSignature === signature) return false;
    signature = nextSignature;

    ticks.replaceChildren();
    const first = Math.ceil((displayMinZ - 1e-9) / stepM) * stepM;
    for (let value = first; value <= displayMaxZ + 1e-9; value += stepM) {
      const normalized = (displayMaxZ - value) / spanZ;
      const topPct = Math.max(0, Math.min(100, normalized * 100));
      const isZero = Math.abs(value) < 1e-8;

      const guide = document.createElement('div');
      guide.className = 'height-scale-guide';
      guide.dataset.heightM = value.toFixed(3);
      if (isZero) guide.classList.add('zero');
      guide.style.top = `${topPct}%`;

      const tick = document.createElement('div');
      tick.className = 'height-scale-tick';
      tick.dataset.heightM = value.toFixed(3);
      if (isZero) tick.classList.add('zero');
      tick.style.top = `${topPct}%`;

      const label = document.createElement('div');
      label.className = 'height-scale-label';
      label.dataset.heightM = value.toFixed(3);
      label.style.top = `${topPct}%`;
      const normalizedValue = Math.abs(value) < 0.0005 ? 0 : value;
      const prefix = normalizedValue > 0 ? '+' : '';
      // Keep model/viewer visual precision at decimetres for unverified WORK_TEST.
      label.textContent = `${prefix}${normalizedValue.toFixed(1).replace('.', ',')} m`;

      ticks.append(guide, tick, label);
    }

    canvas.dataset.heightScaleMinZ = displayMinZ.toFixed(3);
    canvas.dataset.heightScaleMaxZ = displayMaxZ.toFixed(3);
    canvas.dataset.heightScaleLocalMinZ = minZ.toFixed(3);
    canvas.dataset.heightScaleLocalMaxZ = maxZ.toFixed(3);
    canvas.dataset.heightScaleStepM = String(stepM);
    canvas.dataset.heightScaleDatumOffsetM = offsetM.toFixed(3);
    canvas.dataset.heightScaleDatumStatus = mode === 'local' ? 'LOCAL' : CONDITIONAL_DATUM_STATUS;
    canvas.dataset.heightScaleFrame = mode === 'local' ? 'YLIS-G1-LOCAL' : 'N2000-CONDITIONAL-WORK_TEST';
    canvas.dataset.heightScaleNorthReference = mapNorth ? 'EPSG:3879' : 'YLIS-G1-LOCAL';
    const caption = mode === 'local'
      ? (mapNorth ? 'ETRS-GK25 · Z paikallinen' : 'YLIS-G1-LOCAL Z')
      : 'N2000';
    if (title && title.textContent !== caption) title.textContent = caption;
    scale.setAttribute('aria-label', `${caption}, korkeusasteikko`);
    return true;
  };

  return { invalidate, render, setVisible, setDatumAvailable };
};
