const blockedLegacyKeys = new Set([
  'g',
  'm',
  'c',
  'n',
  'p',
  'e',
  's',
]);

const isTypingTarget = (
  target: EventTarget | null
) => {
  if (!(target instanceof Element)) return false;

  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"]'
    )
  );
};

export const initializeLegacyShortcuts = () => {
  const readout =
    document.querySelector('[data-a-readout]');

  if (!(readout instanceof HTMLElement)) return;

  if (
    readout.dataset.siteShortcutsInitialized ===
    'true'
  ) return;

  readout.dataset.siteShortcutsInitialized =
    'true';

  const handleKeydown = (
    event: KeyboardEvent
  ) => {
    if (event.defaultPrevented) return;
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.altKey
    ) return;
    if (isTypingTarget(event.target)) return;

    const key =
      event.key.toLowerCase();

    if (key === 'l') {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.assign('/lab/');
      return;
    }

    if (blockedLegacyKeys.has(key)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  const cleanup = () => {
    window.removeEventListener(
      'keydown',
      handleKeydown,
      true
    );
  };

  window.addEventListener(
    'keydown',
    handleKeydown,
    true
  );
  window.addEventListener(
    'pagehide',
    cleanup,
    { once: true }
  );
};
