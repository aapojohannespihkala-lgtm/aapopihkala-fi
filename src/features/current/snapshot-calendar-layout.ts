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
      min-width: 144px !important;
      max-width: none;
      transform: translate(-50%, -50%);
      z-index: 1;
      justify-items: center;
      gap: 4px;
      text-align: center;
      pointer-events: none;
    }

    body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-calendar__weekday,
    body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-calendar__date,
    body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-calendar__week {
      white-space: nowrap;
    }

    body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-calendar__weekday {
      font-size: 0.64rem;
      font-weight: 550;
      letter-spacing: 0.07em;
    }

    body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-calendar__date {
      font-size: 0.88rem;
      font-weight: 650;
      letter-spacing: 0.05em;
    }

    body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-calendar__week {
      font-size: 0.64rem;
      font-weight: 550;
      letter-spacing: 0.07em;
    }

    body:has(.snapshot-shell) .snapshot-calendar__month-grid {
      display: grid;
      grid-template-columns: repeat(7, 10px);
      grid-auto-rows: 10px;
      gap: 1px;
      margin-top: 1px;
      color: var(--stone);
      font-size: 0.42rem;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      line-height: 1;
      letter-spacing: 0;
      text-transform: none;
    }

    body:has(.snapshot-shell) .snapshot-calendar__month-day {
      position: relative;
      display: grid;
      place-items: center;
      min-width: 0;
      color: var(--stone-light);
    }

    body:has(.snapshot-shell) .snapshot-calendar__month-day.is-past {
      color: var(--ink-soft);
    }

    body:has(.snapshot-shell) .snapshot-calendar__month-day.is-outside {
      color: color-mix(in srgb, var(--stone-light) 48%, transparent);
      font-size: 0.82em;
    }

    body:has(.snapshot-shell) .snapshot-calendar__month-day.is-today {
      color: var(--ink);
      font-weight: 750;
    }

    body:has(.snapshot-shell) .snapshot-calendar__month-day.is-today::after {
      content: '';
      position: absolute;
      width: 11px;
      height: 11px;
      border: 1px solid var(--ink-soft);
      border-radius: 50%;
      box-sizing: border-box;
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
      align-items: center;
      gap: 5px;
      margin: 0;
      color: var(--stone-light);
      font-size: 0.54rem;
      font-weight: 550;
      line-height: 1.15;
      letter-spacing: 0.045em;
    }

    body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__solar svg {
      display: block;
      width: 100%;
      height: 42px !important;
      overflow: visible;
      color: color-mix(in srgb, var(--stone-light) 72%, transparent);
    }

    body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__solar time {
      padding-bottom: 0;
      color: var(--ink-soft);
      font-size: inherit;
      font-weight: 600;
      line-height: inherit;
      letter-spacing: inherit;
      white-space: nowrap;
      transform: translateY(-0.18em);
    }

    body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__daylight {
      margin-top: 3px;
      color: var(--ink-soft);
      text-align: center;
      font-size: 0.56rem;
      font-weight: 600;
      line-height: 1.15;
      letter-spacing: 0.055em;
      white-space: nowrap;
    }

    @media (min-width: 641px) and (max-height: 720px) {
      body:has(.snapshot-shell) .snapshot-titleblock.snapshot-titleblock--calendar-split {
        min-height: 102px;
        padding: 9px 20px 11px;
      }
    }

    @media (max-width: 640px) {
      body:has(.snapshot-shell) .snapshot-titleblock.snapshot-titleblock--calendar-split {
        position: relative;
        grid-template-columns: minmax(0, 1fr) 94px;
        gap: 8px;
        padding-left: 10px;
        padding-right: 10px;
      }

      body:has(.snapshot-shell) .snapshot-titleblock--calendar-split #current-snapshot-title {
        font-size: clamp(2.25rem, 10.4vw, 2.55rem) !important;
        letter-spacing: -0.065em;
      }

      body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-titleblock__meta {
        position: absolute;
        left: 57%;
        top: 50%;
        min-width: 72px !important;
        max-width: 72px;
        box-sizing: border-box;
        transform: translate(-50%, -50%);
        justify-self: auto;
        align-self: auto;
        gap: 2px;
        padding-left: 0;
        text-align: center;
      }

      body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-calendar__weekday,
      body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-calendar__week {
        font-size: 0.39rem;
      }

      body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-calendar__date {
        font-size: 0.43rem;
      }

      body:has(.snapshot-shell) .snapshot-calendar__month-grid {
        grid-template-columns: repeat(7, 6px);
        grid-auto-rows: 6px;
        gap: 1px;
        margin-top: 1px;
        font-size: 0.28rem;
      }

      body:has(.snapshot-shell) .snapshot-calendar__month-day.is-today::after {
        width: 7px;
        height: 7px;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar-panel {
        width: 94px;
        grid-column: 2;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__solar {
        grid-template-columns: auto minmax(40px, 1fr) auto;
        gap: 3px;
        font-size: 0.48rem;
        letter-spacing: 0.025em;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__solar svg {
        height: 34px !important;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__solar time {
        transform: translateY(-0.18em);
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__daylight {
        margin-top: 1px;
        font-size: 0.5rem;
      }
    }

    @media (max-width: 380px), (max-width: 640px) and (max-height: 720px) {
      body:has(.snapshot-shell) .snapshot-titleblock.snapshot-titleblock--calendar-split {
        grid-template-columns: minmax(0, 1fr) 88px;
        gap: 6px;
        padding-left: 8px;
        padding-right: 8px;
      }

      body:has(.snapshot-shell) .snapshot-titleblock--calendar-split #current-snapshot-title {
        font-size: clamp(2.1rem, 10vw, 2.35rem) !important;
      }

      body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-titleblock__meta {
        left: 56.5%;
        min-width: 68px !important;
        max-width: 68px;
        transform: translate(-50%, -50%);
        padding-left: 0;
      }

      body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-calendar__weekday,
      body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-calendar__week {
        font-size: 0.34rem;
      }

      body:has(.snapshot-shell) .snapshot-titleblock--calendar-split .snapshot-calendar__date {
        font-size: 0.37rem;
      }

      body:has(.snapshot-shell) .snapshot-calendar__month-grid {
        grid-template-columns: repeat(7, 5px);
        grid-auto-rows: 5px;
        gap: 1px;
        font-size: 0.24rem;
      }

      body:has(.snapshot-shell) .snapshot-calendar__month-day.is-today::after {
        width: 6px;
        height: 6px;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar-panel {
        width: 88px;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__solar {
        grid-template-columns: auto minmax(36px, 1fr) auto;
        gap: 2px;
        font-size: 0.43rem;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__solar svg {
        height: 30px !important;
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__solar time {
        transform: translateY(-0.18em);
      }

      body:has(.snapshot-shell) .snapshot-calendar__solar-panel .snapshot-calendar__daylight {
        font-size: 0.44rem;
      }
    }
  `;

  document.head.append(style);
};

const WEEKDAY_NAMES: Record<string, string> = {
  MON: 'MONDAY',
  TUE: 'TUESDAY',
  WED: 'WEDNESDAY',
  THU: 'THURSDAY',
  FRI: 'FRIDAY',
  SAT: 'SATURDAY',
  SUN: 'SUNDAY',
};

const MONTH_INDEXES: Record<string, number> = {
  JAN: 0,
  FEB: 1,
  MAR: 2,
  APR: 3,
  MAY: 4,
  JUN: 5,
  JUL: 6,
  AUG: 7,
  SEP: 8,
  SEPT: 8,
  OCT: 9,
  NOV: 10,
  DEC: 11,
};

const compactCalendarText = (root: HTMLElement) => {
  const meta = root.querySelector<HTMLElement>('.snapshot-titleblock__meta');
  const date = root.querySelector<HTMLElement>('[data-snapshot-calendar-date]');
  const week = root.querySelector<HTMLElement>('[data-snapshot-calendar-week]');
  if (!meta || !date || !week) return;

  let weekday = root.querySelector<HTMLElement>('[data-snapshot-calendar-weekday]');
  if (!weekday) {
    weekday = document.createElement('div');
    weekday.className = 'snapshot-calendar__weekday';
    weekday.dataset.snapshotCalendarWeekday = 'true';
    date.before(weekday);
  }

  const dateText = date.textContent?.trim() ?? '';
  const dateMatch = dateText.match(/^([A-Z]{3,9})\s*\/\s*(\d{2})\s+([A-Z]{3,4})\s+(\d{4})$/);
  if (dateMatch) {
    const [, weekdayToken, day, month, year] = dateMatch;
    const weekdayText = WEEKDAY_NAMES[weekdayToken.slice(0, 3)] ?? weekdayToken;
    const formattedDate = `${day} ${month} ${year}`;

    if (weekday.textContent !== weekdayText) weekday.textContent = weekdayText;
    if (date.textContent !== formattedDate) date.textContent = formattedDate;
  }

  const weekText = week.textContent?.trim() ?? '';
  const weekMatch = weekText.match(/^WEEK\s*\/?\s*(\d{1,2})$/);
  if (weekMatch) {
    const formattedWeek = `WEEK ${weekMatch[1].padStart(2, '0')}`;
    if (week.textContent !== formattedWeek) week.textContent = formattedWeek;
  }
};

const renderMonthGrid = (root: HTMLElement) => {
  const meta = root.querySelector<HTMLElement>('.snapshot-titleblock__meta');
  const date = root.querySelector<HTMLElement>('[data-snapshot-calendar-date]');
  if (!meta || !date) return;

  const dateText = date.textContent?.trim() ?? '';
  const dateMatch = dateText.match(/^(\d{2})\s+([A-Z]{3,4})\s+(\d{4})$/);
  if (!dateMatch) return;

  const [, dayToken, monthToken, yearToken] = dateMatch;
  const month = MONTH_INDEXES[monthToken];
  const day = Number(dayToken);
  const year = Number(yearToken);
  if (month === undefined || !Number.isInteger(day) || !Number.isInteger(year)) return;

  const signature = `${year}-${month}-${day}`;
  let grid = meta.querySelector<HTMLElement>('[data-snapshot-month-calendar]');
  if (grid?.dataset.monthCalendarSignature === signature) return;

  if (!grid) {
    grid = document.createElement('div');
    grid.className = 'snapshot-calendar__month-grid';
    grid.dataset.snapshotMonthCalendar = 'true';
    grid.setAttribute('aria-hidden', 'true');
    meta.append(grid);
  }

  const firstDay = new Date(Date.UTC(year, month, 1));
  const mondayOffset = (firstDay.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cellCount = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;
  const cells: HTMLElement[] = [];

  for (let index = 0; index < cellCount; index += 1) {
    const cell = document.createElement('div');
    cell.className = 'snapshot-calendar__month-day';
    const calendarDay = index - mondayOffset + 1;

    if (calendarDay < 1 || calendarDay > daysInMonth) {
      cell.classList.add('is-outside');
      cell.textContent = '·';
    } else {
      cell.dataset.snapshotMonthCalendarDay = String(calendarDay);
      cell.textContent = String(calendarDay);

      if (calendarDay < day) cell.classList.add('is-past');
      if (calendarDay === day) {
        cell.classList.add('is-today');
        cell.dataset.snapshotMonthCalendarToday = 'true';
      }
    }

    cells.push(cell);
  }

  grid.replaceChildren(...cells);
  grid.dataset.monthCalendarSignature = signature;
};

const compactDaylightText = (root: HTMLElement) => {
  const daylight = root.querySelector<HTMLElement>('[data-snapshot-calendar-daylight]');
  if (!daylight) return;

  const text = daylight.textContent?.trim() ?? '';
  const compact = text.replace(/^DAYLIGHT\s*\/\s*/i, '');
  if (compact && compact !== text) daylight.textContent = compact;
};

const applyCalendarLayout = (root: HTMLElement) => {
  const titleblock = root.querySelector<HTMLElement>('.snapshot-titleblock');
  const meta = root.querySelector<HTMLElement>('.snapshot-titleblock__meta');
  const solar = root.querySelector<HTMLElement>('[data-snapshot-calendar-solar]');
  const daylight = root.querySelector<HTMLElement>('[data-snapshot-calendar-daylight]');
  if (!titleblock || !meta || !solar || !daylight) return false;

  ensureLayoutStyles();
  compactCalendarText(root);
  renderMonthGrid(root);
  compactDaylightText(root);

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
  meta.setAttribute('aria-label', 'Helsinki weekday, date and ISO week number');
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
    renderMonthGrid(root);
    compactDaylightText(root);
  });

  observer.observe(root, { childList: true, subtree: true, characterData: true });

  window.addEventListener(
    'pagehide',
    () => observer.disconnect(),
    { once: true }
  );
};
