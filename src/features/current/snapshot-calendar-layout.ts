const ensureLayoutStyles = () => {
  if (document.querySelector('[data-snapshot-calendar-layout-styles]')) return;

  const style = document.createElement('style');
  style.dataset.snapshotCalendarLayoutStyles = 'true';
  style.textContent = `
    body:has(.snapshot-shell) .snapshot-titleblock.snapshot-titleblock--calendar-split {
      grid-template-columns: minmax(0, 1fr) 76px 136px;
      gap: 8px;
    }

    body:has(.snapshot-shell) .snapshot-titleblock--calendar-split #current-snapshot-title {
      min-width: 0;
    }

    body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-titleblock__meta {
      min-width: 76px !important;
      max-width: 76px;
      justify-self: center;
      align-self: center;
      gap: 3px;
      text-align: center;
    }

    body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-calendar__date,
    body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-calendar__week {
      white-space: nowrap;
    }

    body:has(.snapshot-shell) .snapshot-calendar__solar-panel {
      min-width: 0;
      width: 136px;
      justify-self: end;
      align-self: stretch;
      display: grid;
      grid-template-rows: minmax(0, 1fr) auto;
      align-items: center;
      padding-left: 10px;
      border-left: 1px solid color-mix(in srgb, var(--ink-soft) 58%, transparent);
    }

    body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__solar {
      min-width: 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 54px auto;
      align-items: center;
      gap: 0 6px;
      margin: 0;
      color: var(--stone);
    }

    body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__solar svg {
      grid-column: 1 / -1;
      grid-row: 1;
      width: 100%;
      height: 54px !important;
      overflow: visible;
    }

    body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__sunrise {
      grid-column: 1;
      grid-row: 2;
      justify-self: start;
    }

    body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__sunset {
      grid-column: 2;
      grid-row: 2;
      justify-self: end;
    }

    body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__solar time {
      padding: 0;
      font-size: 0.36rem;
      line-height: 1;
      letter-spacing: 0.02em;
      white-space: nowrap;
    }

    body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__daylight {
      margin-top: 3px;
      text-align: center;
      font-size: 0.36rem;
      line-height: 1;
      white-space: nowrap;
    }

    @media (max-width: 640px) {
      body:has(.snapshot-shell) .snapshot-titleblock.snapshot-titleblock--calendar-split {
        grid-template-columns: minmax(0, 1fr) 48px 84px;
        gap: 3px;
        padding-left: 10px;
        padding-right: 10px;
      }

      body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-number__minor--seconds {
        font-size: 0.66em;
      }

      body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-titleblock__meta {
        min-width: 48px !important;
        max-width: 48px;
        justify-self: center;
        gap: 2px;
        text-align: center;
      }

      body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-calendar__date {
        font-size: 0.33rem;
      }

      body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-calendar__week {
        font-size: 0.28rem;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar-panel {
        width: 84px;
        padding-left: 6px;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__solar {
        grid-template-rows: 44px auto;
        gap: 0 4px;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__solar svg {
        height: 44px !important;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__solar time,
      body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__daylight {
        font-size: 0.27rem;
      }
    }

    @media (max-width: 380px), (max-height: 720px) {
      body:has(.snapshot-shell) .snapshot-titleblock.snapshot-titleblock--calendar-split {
        grid-template-columns: minmax(0, 1fr) 44px 74px;
        gap: 2px;
        padding-left: 8px;
        padding-right: 8px;
      }

      body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-titleblock__meta {
        min-width: 44px !important;
        max-width: 44px;
      }

      body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-calendar__date {
        font-size: 0.29rem;
      }

      body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-calendar__week {
        font-size: 0.25rem;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar-panel {
        width: 74px;
        padding-left: 5px;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__solar {
        grid-template-rows: 40px auto;
        gap: 0 3px;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__solar svg {
        height: 40px !important;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__solar time,
      body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__daylight {
        font-size: 0.23rem;
      }
    }
  `;

  document.head.append(style);
};

const compactCalendarText = (root: HTMLElement) => {
  const date = root.querySelector<HTMLElement>('[data-snapshot-calendar-date]');
  const week = root.querySelector<HTMLElement>('[data-snapshot-calendar-week]');
  if (!date || !week) return;

  const match = date.textContent?.trim().match(/^([A-Z]{3}) \/ (\d{2}) ([A-Z]{3}) (\d{4})$/);
  if (!match) return;

  const [, weekday, day, month, year] = match;
  const weekMatch = week.textContent?.trim().match(/^WEEK \/ (\d{2})$/);
  const weekNumber = weekMatch?.[1] ?? '--';

  date.textContent = `${weekday} / ${day} ${month}`;
  week.textContent = `${year} / W${weekNumber}`;
};

const applyCalendarLayout = (root: HTMLElement) => {
  const titleblock = root.querySelector<HTMLElement>('.snapshot-titleblock');
  const meta = root.querySelector<HTMLElement>('.snapshot-titleblock__meta');
  const solar = root.querySelector<HTMLElement>('[data-snapshot-calendar-solar]');
  const daylight = root.querySelector<HTMLElement>('[data-snapshot-calendar-daylight]');
  if (!titleblock || !meta || !solar || !daylight) return false;

  ensureLayoutStyles();
  compactCalendarText(root);

  let panel = root.querySelector<HTMLElement>('[data-snapshot-calendar-solar-panel]');
  if (!panel) {
    panel = document.createElement('div');
    panel.className = 'snapshot-calendar__solar-panel';
    panel.dataset.snapshotCalendarSolarPanel = 'true';
    panel.setAttribute('aria-label', 'Sun path and daylight');
    titleblock.append(panel);
  }

  const sunrise = solar.querySelector<HTMLTimeElement>('[data-snapshot-calendar-sunrise]');
  const sunset = solar.querySelector<HTMLTimeElement>('[data-snapshot-calendar-sunset]');
  const svg = solar.querySelector<SVGSVGElement>('svg');

  sunrise?.classList.add('snapshot-calendar__sunrise');
  sunset?.classList.add('snapshot-calendar__sunset');
  svg?.setAttribute('preserveAspectRatio', 'none');

  if (solar.parentElement !== panel) panel.append(solar);
  if (daylight.parentElement !== panel) panel.append(daylight);

  titleblock.classList.add('snapshot-titleblock--calendar-split');
  meta.setAttribute('aria-label', 'Helsinki date and ISO week number');
  return true;
};

export const initSnapshotCalendarLayout = () => {
  const root = document.querySelector<HTMLElement>('[data-current-snapshot]');
  if (!root || root.dataset.calendarLayoutInitialized === 'true') return;

  root.dataset.calendarLayoutInitialized = 'true';

  const apply = () => applyCalendarLayout(root);
  apply();

  const observer = new MutationObserver(() => {
    apply();
    compactCalendarText(root);
  });

  observer.observe(root, { childList: true, subtree: true, characterData: true });

  window.addEventListener(
    'pagehide',
    () => observer.disconnect(),
    { once: true }
  );
};
