const GPS_ACTIVE_GRACE_MS = 30_000;

const timestampOf = (value: string) => {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

export const hslActiveGpsLabel = ({
  departureAt,
  previous,
  hasVehicle,
  atStop,
  now = Date.now(),
}: {
  departureAt: string;
  previous: boolean;
  hasVehicle: boolean;
  atStop: boolean;
  now?: number;
}) => {
  if (previous || !hasVehicle) return null;
  const departureMs = timestampOf(departureAt);
  if (departureMs === null || departureMs >= now - GPS_ACTIVE_GRACE_MS) return null;
  return atStop ? 'AT STOP' : 'TRACKING';
};

export const initCurrentHslActiveLabels = () => {
  const departures = document.querySelector<HTMLElement>('[data-hsl-departures]');
  if (!departures || departures.dataset.hslActiveLabelsInitialized === 'true') return;
  departures.dataset.hslActiveLabelsInitialized = 'true';

  const decorate = () => {
    for (const row of departures.querySelectorAll<HTMLElement>('[data-hsl-departure]')) {
      const countdown = row.querySelector<HTMLElement>('[data-hsl-countdown]');
      const vehicle = row.querySelector<HTMLElement>('.hsl-departure__vehicle');
      const departureAt = countdown?.dataset.hslCountdown;
      if (!countdown || !departureAt) continue;

      const label = hslActiveGpsLabel({
        departureAt,
        previous: row.dataset.hslPrevious === 'true',
        hasVehicle: Boolean(vehicle),
        atStop: vehicle?.textContent?.includes('AT STOP') === true,
      });

      if (label && countdown.textContent !== label) {
        countdown.textContent = label;
      }
    }
  };

  decorate();
  new MutationObserver(decorate).observe(departures, {
    childList: true,
    subtree: true,
    characterData: true,
  });
};
