type AMode = '' | 'cross' | 'elev' | 'grid' | 'area';

const modes: AMode[] = ['cross', 'elev', 'grid', 'area', ''];

export const initializeACoordinateInteraction = () => {
  const readout = document.querySelector('[data-a-readout]');
  const label = document.querySelector('[data-a-readout-label]');
  const axis = document.querySelector('[data-a-axis]');
  const axisVertical = document.querySelector('[data-a-axis-vertical]');
  const axisHorizontal = document.querySelector('[data-a-axis-horizontal]');

  if (
    !(readout instanceof HTMLElement) ||
    !(label instanceof HTMLElement) ||
    !(axis instanceof HTMLElement) ||
    !(axisVertical instanceof HTMLElement) ||
    !(axisHorizontal instanceof HTMLElement)
  ) return;

  if (readout.dataset.aCoordinateInteractionInitialized === 'true') return;
  readout.dataset.aCoordinateInteractionInitialized = 'true';

  let modeIndex = -1;
  let pointer = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.5,
  };

  const isTypingTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
  };

  const padCoordinate = (value: number) =>
    String(Math.max(0, Math.round(value))).padStart(4, '0');

  const updatePosition = () => {
    readout.style.left = `${pointer.x}px`;
    readout.style.top = `${pointer.y}px`;
    axisVertical.style.left = `${pointer.x}px`;
    axisHorizontal.style.top = `${pointer.y}px`;

    const mode = readout.dataset.mode as AMode | undefined;
    if (mode !== 'elev' && mode !== 'grid') return;

    const y = Math.max(0, Math.min(window.innerHeight, pointer.y));
    const level = ((window.innerHeight - y) / Math.max(1, window.innerHeight)) * 30;
    label.textContent =
      `X ${padCoordinate(pointer.x)} / Y ${padCoordinate(pointer.y)} / ELEV +${level.toFixed(1)}`;
  };

  const setMode = (mode: AMode) => {
    document.body.classList.toggle('site-a-mode', Boolean(mode));
    readout.dataset.mode = mode;
    readout.classList.toggle('is-visible', Boolean(mode));
    axis.classList.toggle('is-visible', mode === 'elev' || mode === 'grid');
    updatePosition();
  };

  const cycleMode = () => {
    modeIndex = (modeIndex + 1) % modes.length;
    setMode(modes[modeIndex]);
  };

  const resetMode = () => {
    modeIndex = -1;
    setMode('');
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (isTypingTarget(event.target)) return;

    const key = event.key.toLowerCase();

    if (key === 'a') {
      event.preventDefault();
      event.stopImmediatePropagation();
      cycleMode();
      return;
    }

    if (key === 'escape') resetMode();
  };

  const handlePointerMove = (event: PointerEvent) => {
    pointer = {
      x: event.clientX,
      y: event.clientY,
    };
    updatePosition();
  };

  const handleResize = () => {
    updatePosition();
  };

  const cleanup = () => {
    window.removeEventListener('keydown', handleKeydown, true);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('resize', handleResize);
    document.body.classList.remove('site-a-mode');
  };

  setMode('');
  window.addEventListener('keydown', handleKeydown, true);
  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('pagehide', cleanup, { once: true });
};
