const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const ensureStyles = () => {
  if (document.querySelector('[data-snapshot-calendar-week-number-styles]')) return;

  const style = document.createElement('style');
  style.dataset.snapshotCalendarWeekNumberStyles = 'true';
  style.textContent = `
    body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-calendar__week {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0 0 0 0) !important;
      clip-path: inset(50%) !important;
      white-space: nowrap !important;
      border: 0 !important;
    }

    body:has(.snapshot-shell) .snapshot-calendar__month-grid {
      grid-template-columns: 12px repeat(7, 10px);
    }

    body:has(.snapshot-shell) .snapshot-calendar__month-week {
      display: grid;
      place-items: center end;
      color: var(--stone-light);
      font-family: inherit;
      font-size: inherit;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      line-height: 1;
      letter-spacing: inherit;
      transform: translateX(-3px);
    }

    body:has(.snapshot-shell) .snapshot-calendar__month-week.is-current-week {
      color: var(--ink);
      font-weight: 750;
    }

    body:has(.snapshot-shell) .snapshot-calendar__month-day.is-past:not(.is-current-week):not(.is-today) {
      color: var(--stone-light);
    }

    body:has(.snapshot-shell) .snapshot-calendar__month-day.is-current-week {
      color: var(--ink-soft);
    }

    body:has(.snapshot-shell) .snapshot-calendar__month-day.is-current-week.is-today {
      color: var(--ink);
      font-weight: 750;
    }

    body:has(.snapshot-shell) .snapshot-calendar__month-day.is-today::after {
      content: none !important;
    }

    @media (min-width: 641px) {
      body:has(.snapshot-shell) .snapshot-calendar__month-grid {
        grid-auto-rows: 8px;
        margin-top: 0;
      }
    }

    @media (max-width: 640px) {
      body:has(.snapshot-shell) .snapshot-calendar__month-grid {
        grid-template-columns: 7px repeat(7, 6px);
      }

      body:has(.snapshot-shell) .snapshot-calendar__month-week {
        transform: translateX(-2px);
      }
    }

    @media (max-width: 380px), (max-width: 640px) and (max-height: 720px) {
      body:has(.snapshot-shell) .snapshot-calendar__month-grid {
        grid-template-columns: 6px repeat(7, 5px);
      }

      body:has(.snapshot-shell) .snapshot-calendar__month-week {
        transform: translateX(-2px);
      }
    }
  `;

  document.head.append(style);
};

const getIsoWeekNumber = (date: Date) => {
  const target = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  ));
  const weekday = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - weekday);

  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const decorateMonthGrid = (root: HTMLElement) => {
  const grid = root.querySelector<HTMLElement>('[data-snapshot-month-calendar]');
  const signature = grid?.dataset.monthCalendarSignature;
  if (!grid || !signature) return false;

  const [yearToken, monthToken, dayToken] = signature.split('-');
  const year = Number(yearToken);
  const month = Number(monthToken);
  const day = Number(dayToken);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;

  const dayCells = Array.from(
    grid.querySelectorAll<HTMLElement>('.snapshot-calendar__month-day')
  );
  if (dayCells.length === 0 || dayCells.length % 7 !== 0) return false;

  const rowCount = dayCells.length / 7;
  const currentWeekLabels = grid.querySelectorAll('[data-snapshot-month-week]');
  if (
    grid.dataset.snapshotWeekNumberSignature === signature &&
    currentWeekLabels.length === rowCount
  ) {
    return true;
  }

  currentWeekLabels.forEach((label) => label.remove());

  const firstDay = new Date(Date.UTC(year, month, 1));
  const mondayOffset = (firstDay.getUTCDay() + 6) % 7;
  const firstMonday = new Date(Date.UTC(year, month, 1 - mondayOffset));
  const currentWeekIndex = Math.floor((mondayOffset + day - 1) / 7);
  const fragment = document.createDocumentFragment();

  dayCells.forEach((cell, index) => {
    if (index % 7 === 0) {
      const rowIndex = index / 7;
      const weekStart = new Date(firstMonday.getTime() + rowIndex * WEEK_MS);
      const week = document.createElement('div');
      week.className = 'snapshot-calendar__month-week';
      week.dataset.snapshotMonthWeek = 'true';
      if (rowIndex === currentWeekIndex) {
        week.classList.add('is-current-week');
        week.dataset.snapshotCurrentWeek = 'true';
      }
      week.textContent = String(getIsoWeekNumber(weekStart)).padStart(2, '0');
      fragment.append(week);
    }

    if (Math.floor(index / 7) === currentWeekIndex && cell.dataset.snapshotMonthCalendarDay) {
      cell.classList.add('is-current-week');
    }

    fragment.append(cell);
  });

  grid.replaceChildren(fragment);
  grid.dataset.snapshotWeekNumberSignature = signature;
  return true;
};

export const initSnapshotCalendarWeekNumbers = () => {
  const root = document.querySelector<HTMLElement>('[data-current-snapshot]');
  if (!root || root.dataset.calendarWeekNumbersInitialized === 'true') return;

  root.dataset.calendarWeekNumbersInitialized = 'true';
  ensureStyles();

  const apply = () => decorateMonthGrid(root);
  apply();

  const observer = new MutationObserver(() => apply());
  observer.observe(root, { childList: true, subtree: true });

  window.addEventListener(
    'pagehide',
    () => observer.disconnect(),
    { once: true }
  );
};
