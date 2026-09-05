export const initializeGridInteraction = () => {
  const grid = document.querySelector('[data-site-grid]');
  const modeReadout = document.querySelector('[data-a-readout]');

  if (!(grid instanceof HTMLElement) || !(modeReadout instanceof HTMLElement)) return;
  if (grid.dataset.gridInteractionInitialized === 'true') return;

  grid.dataset.gridInteractionInitialized = 'true';

  const syncVisibility = () => {
    grid.classList.toggle('is-visible', modeReadout.dataset.mode === 'grid');
  };

  const observer = new MutationObserver(syncVisibility);
  observer.observe(modeReadout, {
    attributes: true,
    attributeFilter: ['data-mode'],
  });

  const cleanup = () => {
    observer.disconnect();
  };

  syncVisibility();
  window.addEventListener('pagehide', cleanup, { once: true });
};
