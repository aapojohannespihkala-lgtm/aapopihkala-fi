const initializeDateElement = (
  dateElement: HTMLElement
) => {
  if (
    dateElement.dataset.dateEasterEgg ===
    'true'
  ) return;

  const datetime =
    dateElement.getAttribute('datetime');

  if (!datetime) return;

  dateElement.dataset.dateEasterEgg =
    'true';
  dateElement.dataset.originalDate =
    dateElement.textContent ?? '';
  dateElement.dataset.isoDate =
    datetime.slice(0, 10);
  dateElement.dataset.isoVisible =
    'false';
  dateElement.tabIndex = 0;
  dateElement.setAttribute(
    'role',
    'button'
  );
  dateElement.setAttribute(
    'title',
    'Toggle date format'
  );

  const toggleDate = () => {
    const showIso =
      dateElement.dataset.isoVisible !==
      'true';

    dateElement.dataset.isoVisible =
      showIso ? 'true' : 'false';
    dateElement.textContent = showIso
      ? dateElement.dataset.isoDate ?? ''
      : dateElement.dataset.originalDate ?? '';
  };

  dateElement.addEventListener(
    'click',
    toggleDate
  );
  dateElement.addEventListener(
    'keydown',
    (event) => {
      if (
        event.key !== 'Enter' &&
        event.key !== ' '
      ) return;

      event.preventDefault();
      toggleDate();
    }
  );
};

const initializeDateElements = () => {
  document
    .querySelectorAll('time.post-date')
    .forEach((dateElement) => {
      if (!(dateElement instanceof HTMLElement)) {
        return;
      }

      initializeDateElement(dateElement);
    });
};

export const initializeDateFormatToggle = () => {
  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      initializeDateElements,
      { once: true }
    );
    return;
  }

  initializeDateElements();
};
