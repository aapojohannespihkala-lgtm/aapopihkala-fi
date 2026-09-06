type CurrentDataUpdatedDetail = {
  at?: string;
};

const HELSINKI_TIME_ZONE = 'Europe/Helsinki';

export const initCurrentClock = () => {
  const dateTarget = document.querySelector<HTMLElement>('[data-current-date]');
  const timeTarget = document.querySelector<HTMLElement>('[data-current-time]');
  const updatedTarget = document.querySelector<HTMLElement>('[data-current-updated]');

  if (!dateTarget || !timeTarget || !updatedTarget) return;
  if (document.documentElement.dataset.currentClockInitialized === 'true') return;

  document.documentElement.dataset.currentClockInitialized = 'true';

  const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: HELSINKI_TIME_ZONE,
  });

  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: HELSINKI_TIME_ZONE,
  });

  const renderClock = () => {
    const now = new Date();
    dateTarget.textContent = dateFormatter.format(now).toUpperCase();
    timeTarget.textContent = timeFormatter.format(now);
  };

  const renderUpdated = (date: Date) => {
    updatedTarget.textContent = timeFormatter.format(date);
  };

  const onDataUpdated = (event: Event) => {
    const detail = (event as CustomEvent<CurrentDataUpdatedDetail>).detail;
    const date = detail?.at ? new Date(detail.at) : new Date();
    renderUpdated(Number.isNaN(date.getTime()) ? new Date() : date);
  };

  renderClock();
  window.setInterval(renderClock, 30_000);
  window.addEventListener('current:data-updated', onDataUpdated);
};
