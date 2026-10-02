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
};

export const createHeightScaleController = ({
  canvas,
  scale,
  ticks,
}: HeightScaleControllerArgs) => {
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
    }
  };

  const invalidate = () => {
    signature = '';
  };

  const render = ({ minZ, maxZ, stepM, viewportHeight }: HeightScaleRenderInput) => {
    const spanZ = Math.max(maxZ - minZ, 0.001);
    const nextSignature = [minZ, maxZ, stepM, viewportHeight]
      .map((value) => Number(value).toFixed(3))
      .join('|');
    if (nextSignature === signature) return false;
    signature = nextSignature;

    ticks.replaceChildren();
    const first = Math.ceil((minZ - 1e-9) / stepM) * stepM;
    for (let value = first; value <= maxZ + 1e-9; value += stepM) {
      const normalized = (maxZ - value) / spanZ;
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

    canvas.dataset.heightScaleMinZ = minZ.toFixed(3);
    canvas.dataset.heightScaleMaxZ = maxZ.toFixed(3);
    canvas.dataset.heightScaleStepM = String(stepM);
    canvas.dataset.heightScaleFrame = 'YLIS-G1-LOCAL';
    return true;
  };

  return { invalidate, render, setVisible };
};
