const ensureLayoutStyles = () => {
  if (document.querySelector('[data-snapshot-calendar-layout-styles]')) return;

  const style = document.createElement('style');
  style.dataset.snapshotCalendarLayoutStyles = 'true';
  style.textContent = `
    body:has(.snapshot-shell) .snapshot-titleblock.snapshot-titleblock--calendar-split {
      position: relative;
      grid-template-columns: minmax(0, 1fr) 172px;
      gap: 18px;
    }

    body:has(.snapshot-shell) .snapshot-titleblock--calendar-split #current-snapshot-title {
      min-width: 0;
      grid-column: 1;
    }

    body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-titleblock__meta {
      position: absolute;
      left: 50%;
      top: 50%;
      min-width: 112px !important;
      max-width: none;
      transform: translate(-50%, -50%);
      z-index: 1;
      justify-items: center;
      gap: 4px;
      text-align: center;
      pointer-events: none;
    }

    body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-calendar__date,
    body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-calendar__week {
      white-space: nowrap;
    }

    body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-calendar__date {
      font-size: 0.54rem;
      font-weight: 650;
      letter-spacing: 0.05em;
    }

    body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-calendar__week {
      font-size: 0.4rem;
      font-weight: 550;
      letter-spacing: 0.05em;
    }

    body:has(.snapshot-shell) .snapshot-calendar__solar-panel {
      min-width: 0;
      width: 172px;
      grid-column: 2;
      justify-self: end;
      align-self: center;
      display: grid;
      justify-items: stretch;
      align-items: center;
      padding: 0;
      border: 0;
    }

    body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__solar {
      min-width: 0;
      display: grid;
      grid-template-columns: auto minmax(76px, 1fr) auto;
      align-items: end;
      gap: 5px;
      margin: 0;
      color: var(--stone-light);
      font-size: 0.4rem;
      font-weight: 500;
      line-height: 1.15;
      letter-spacing: 0.045em;
    }

    body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__solar svg {
      display: block;
      width: 100%;
      height: 31px !important;
      overflow: visible;
      color: color-mix(in srgb, var(--stone-light) 72%, transparent);
    }

    body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__solar time {
      padding-bottom: 1px;
      font-size: inherit;
      line-height: inherit;
      letter-spacing: inherit;
      white-space: nowrap;
    }

    body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__daylight {
      margin-top: 3px;
      color: var(--stone);
      text-align: center;
      font-size: 0.42rem;
      font-weight: 500;
      line-height: 1.15;
      letter-spacing: 0.055em;
      white-space: nowrap;
    }

    @media (max-width: 640px) {
      body:has(.snapshot-shell) .snapshot-titleblock.snapshot-titleblock--calendar-split {
        position: static;
        grid-template-columns: minmax(0, 1fr) 48px 94px;
        gap: 3px;
        padding-left: 10px;
        padding-right: 10px;
      }

      body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-number__minor--seconds {
        font-size: 0.66em;
      }

      body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-titleblock__meta {
        position: static;
        left: auto;
        top: auto;
        min-width: 48px !important;
        max-width: 48px;
        transform: none;
        justify-self: center;
        align-self: center;
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
        width: 94px;
        grid-column: 3;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__solar {
        grid-template-columns: auto minmax(38px, 1fr) auto;
        gap: 3px;
        font-size: 0.28rem;
        letter-spacing: 0.03em;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__solar svg {
        height: 26px !important;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__daylight {
        margin-top: 1px;
        font-size: 0.31rem;
      }
    }

    @media (max-width: 380px), (max-height: 720px) {
      body:has(.snapshot-shell) .snapshot-titleblock.snapshot-titleblock--calendar-split {
        grid-template-columns: minmax(0, 1fr) 42px 82px;
        gap: 2px;
        padding-left: 8px;
        padding-right: 8px;
      }

      body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-titleblock__meta {
        min-width: 42px !important;
        max-width: 42px;
      }

      body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-calendar__date {
        font-size: 0.28rem;
      }

      body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-calendar__week {
        font-size: 0.24rem;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar-panel {
        width: 82px;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__solar {
        grid-template-columns: auto minmax(32px, 1fr) auto;
        gap: 2px;
        font-size: 0.24rem;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__solar svg {
        height: 24px !important;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__daylight {
        font-size: 0.27rem;
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
  svg?.removeAttribute('preserveAspectRatio');

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
