// 1974 drawing reference for YLIS-G1-LOCAL Z=0 (C-D finished floor).
// This is NOT a verified N2000 vertical datum / transform of EPSG:3879.
export const YLIS_1974_DRAWING_DATUM_M = 21.75;

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

  const setVisible = (visible: boolean) => {
    scale.hidden = !visible;
    canvas.dataset.heightScaleVisible = visible ? 'true' : 'false';
    if (!visible) {
      ticks.replaceChildren();
      signature = '';
      delete canvas.dataset.heightScaleMinZ;
      delete canvas.dataset.heightScaleMaxZ;
      delete canvas.dataset.heightScaleStepM;
      delete canvas.dataset.heightScaleLocalMinZ;
      delete canvas.dataset.heightScaleLocalMaxZ;
      delete canvas.dataset.heightScaleDatumOffsetM;
      delete canvas.dataset.heightScaleDatumStatus;
      delete canvas.dataset.heightScaleFrame;
      delete canvas.dataset.heightScaleNorthReference;
    }
  };

  const invalidate = () => {
    signature = '';
  };

  const render = ({ minZ, maxZ, stepM, viewportHeight, mapNorth }: HeightScaleRenderInput) => {
    const offsetM = mapNorth ? YLIS_1974_DRAWING_DATUM_M : 0;
    const displayMinZ = minZ + offsetM;
    const displayMaxZ = maxZ + offsetM;
    const spanZ = Math.max(maxZ - minZ, 0.001);
    const nextSignature = [minZ, maxZ, stepM, viewportHeight]
      .map((value) => Number(value).toFixed(3))
      .concat(mapNorth ? 'map' : 'local')
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
      label.textContent = `${prefix}${normalizedValue.toFixed(1).replace('.', ',')} m`;

      ticks.append(guide, tick, label);
    }

    canvas.dataset.heightScaleMinZ = displayMinZ.toFixed(3);
    canvas.dataset.heightScaleMaxZ = displayMaxZ.toFixed(3);
    canvas.dataset.heightScaleLocalMinZ = minZ.toFixed(3);
    canvas.dataset.heightScaleLocalMaxZ = maxZ.toFixed(3);
    canvas.dataset.heightScaleStepM = String(stepM);
    canvas.dataset.heightScaleDatumOffsetM = offsetM.toFixed(3);
    canvas.dataset.heightScaleDatumStatus = mapNorth ? '1974-drawing-reference-unverified-n2000' : 'local';
    canvas.dataset.heightScaleFrame = mapNorth ? 'YLIS-1974-DRAWING-Z' : 'YLIS-G1-LOCAL';
    canvas.dataset.heightScaleNorthReference = mapNorth ? 'EPSG:3879' : 'YLIS-G1-LOCAL';
    const caption = mapNorth ? 'ETRS-GK25 · Z suunnitelmakorko (ei N2000)' : 'YLIS-G1-LOCAL Z';
    if (title) title.textContent = caption;
    scale.setAttribute('aria-label', `${caption}, korkeusasteikko`);
    return true;
  };

  return { invalidate, render, setVisible };
};
