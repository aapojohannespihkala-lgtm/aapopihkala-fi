import { getLiigaMarkPaths, isLiigaMarkFilled } from '../../config/liigaMarks';
import { getLiigaTeamById, getLiigaTeamBySourceId } from '../../config/liigaTeams';

type SnapshotLiigaStanding = {
  rank: number;
  games: number;
  points: number;
  totalTeams: number;
};

type SnapshotLiigaTableTeam = {
  id: string;
  name: string;
  abbreviation: string;
  rank: number;
  points: number;
};

type SnapshotLiigaGame = {
  id: number | string | null;
  start: string;
  homeTeamId: string;
  homeTeam: string;
  awayTeamId: string;
  awayTeam: string;
  homeGoals: number | null;
  awayGoals: number | null;
  gameTime: number | null;
};

type SnapshotLiigaLastGame = SnapshotLiigaGame & {
  homeGoals: number;
  awayGoals: number;
  ilvesResult: 'W' | 'L' | 'T';
};

type SnapshotLiigaResponse = {
  generatedAt?: string;
  standings?: SnapshotLiigaTableTeam[];
  ilvesStanding: SnapshotLiigaStanding | null;
  lastIlvesGame: SnapshotLiigaLastGame | null;
  nextIlvesGame: SnapshotLiigaGame | null;
  liveIlvesGame: SnapshotLiigaGame | null;
};

const HELSINKI_TIME_ZONE = 'Europe/Helsinki';
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const LIVE_REFRESH_INTERVAL_MS = 30 * 1000;
const SVG_NS = 'http://www.w3.org/2000/svg';

const formatGameDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';

  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    timeZone: HELSINKI_TIME_ZONE,
  })
    .format(date)
    .replace(',', '')
    .toUpperCase();
};

const formatGameTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';

  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: HELSINKI_TIME_ZONE,
  }).format(date);
};

const getHelsinkiDateKey = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: HELSINKI_TIME_ZONE,
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  return `${year}-${month}-${day}`;
};

const isGameToday = (value: string, reference: Date) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return getHelsinkiDateKey(date) === getHelsinkiDateKey(reference);
};

const getReferenceTime = (generatedAt?: string) => {
  if (generatedAt) {
    const date = new Date(generatedAt);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return new Date();
};

const formatGameClock = (value: number | null) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return 'LIVE';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const getTeamAbbreviation = (teamId: string, fallback: string) =>
  getLiigaTeamById(teamId)?.abbreviation ?? fallback.slice(0, 3).toUpperCase();

const getTeamDisplayName = (teamId: string, fallback: string) =>
  getLiigaTeamById(teamId)?.name ?? getLiigaTeamBySourceId(fallback)?.name ?? fallback;

const createTeamMark = (teamId: string) => {
  if (teamId === 'ilves') {
    const mark = document.createElement('span');
    mark.className = 'snapshot-liiga__mark snapshot-liiga__mark--ilves';
    mark.setAttribute('aria-hidden', 'true');
    return mark;
  }

  const paths = getLiigaMarkPaths(teamId);
  if (paths.length === 0) return null;

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.classList.add('snapshot-liiga__mark');
  svg.setAttribute('viewBox', '0 0 48 48');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  const filled = isLiigaMarkFilled(teamId);
  paths.forEach((d, index) => {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('vector-effect', 'non-scaling-stroke');

    if (filled) {
      path.setAttribute('fill', 'currentColor');
      path.setAttribute('stroke', 'none');
    } else {
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'currentColor');
      path.setAttribute('stroke-width', index === 0 ? '1.65' : '1.2');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
    }

    svg.append(path);
  });

  return svg;
};

const setText = (root: HTMLElement, selector: string, value: string) => {
  const target = root.querySelector<HTMLElement>(selector);
  if (target) target.textContent = value;
};

const setStandingPosition = (
  root: HTMLElement,
  rank: number | null,
  totalTeams: number | null,
) => {
  const target = root.querySelector<HTMLElement>('[data-snapshot-liiga-position]');
  if (!target) return;

  const hasValues = Number.isFinite(rank) && Number.isFinite(totalTeams);
  const rankText = hasValues ? String(rank) : '--';
  const totalText = hasValues ? String(totalTeams) : '--';

  const rankElement = document.createElement('span');
  rankElement.className = 'snapshot-liiga__position-rank';
  rankElement.textContent = rankText;

  const separator = document.createElement('span');
  separator.className = 'snapshot-liiga__position-separator';
  separator.setAttribute('aria-hidden', 'true');
  separator.textContent = '/';

  const totalElement = document.createElement('span');
  totalElement.className = 'snapshot-liiga__position-total';
  totalElement.textContent = totalText;

  target.replaceChildren(rankElement, separator, totalElement);
  target.setAttribute(
    'aria-label',
    hasValues ? `League position ${rank} of ${totalTeams}` : 'League position unavailable',
  );
};

const setState = (root: HTMLElement, value: string, visible: boolean) => {
  const target = root.querySelector<HTMLElement>('[data-snapshot-liiga-state]');
  if (!target) return;

  target.textContent = value;
  if (visible) target.removeAttribute('hidden');
  else target.setAttribute('hidden', '');
};

const renderTeam = (
  root: HTMLElement,
  side: 'home' | 'away',
  teamId: string,
  teamName: string,
) => {
  const displayName = getTeamDisplayName(teamId, teamName);
  setText(root, `[data-snapshot-liiga-${side}-team]`, displayName);
  const markTarget = root.querySelector<HTMLElement>(`[data-snapshot-liiga-${side}-mark]`);
  if (!markTarget) return;
  const mark = createTeamMark(teamId);
  markTarget.replaceChildren(...(mark ? [mark] : []));
};

const renderGame = (
  root: HTMLElement,
  game: SnapshotLiigaGame | null,
  primary: string,
  secondary: string,
) => {
  if (!game) {
    setText(root, '[data-snapshot-liiga-home-team]', '---');
    setText(root, '[data-snapshot-liiga-away-team]', '---');
    setText(root, '[data-snapshot-liiga-score]', primary);
    setText(root, '[data-snapshot-liiga-schedule]', secondary);
    root.querySelector<HTMLElement>('[data-snapshot-liiga-home-mark]')?.replaceChildren();
    root.querySelector<HTMLElement>('[data-snapshot-liiga-away-mark]')?.replaceChildren();
    return;
  }

  renderTeam(root, 'home', game.homeTeamId, game.homeTeam);
  renderTeam(root, 'away', game.awayTeamId, game.awayTeam);
  setText(root, '[data-snapshot-liiga-score]', primary);
  setText(root, '[data-snapshot-liiga-schedule]', secondary);
};

const renderStanding = (
  root: HTMLElement,
  standing: SnapshotLiigaStanding | null,
  standings: SnapshotLiigaTableTeam[] = [],
) => {
  if (!standing) {
    setStandingPosition(root, null, null);
    setText(root, '[data-snapshot-liiga-comparison]', 'ILV -- P · TOP -- P');
    return;
  }

  setStandingPosition(root, standing.rank, standing.totalTeams);

  const leader = standings.find((team) => team.rank === 1) ?? standings[0] ?? null;
  if (!leader) {
    setText(
      root,
      '[data-snapshot-liiga-comparison]',
      `ILV ${standing.points} P · TOP -- P`,
    );
    return;
  }

  const leaderLabel = leader.id === 'ilves'
    ? 'TOP'
    : getTeamAbbreviation(leader.id, leader.name || leader.abbreviation);

  setText(
    root,
    '[data-snapshot-liiga-comparison]',
    `ILV ${standing.points} P · ${leaderLabel} ${leader.points} P`,
  );
};

const renderLastGame = (root: HTMLElement, game: SnapshotLiigaLastGame | null) => {
  const target = root.querySelector<HTMLElement>('[data-snapshot-liiga-last]');
  if (!target) return;

  if (!game) {
    target.textContent = 'LAST / --';
    return;
  }

  const home = getTeamDisplayName(game.homeTeamId, game.homeTeam);
  const away = getTeamDisplayName(game.awayTeamId, game.awayTeam);
  target.textContent = `LAST / ${home} ${game.homeGoals}-${game.awayGoals} ${away}`;
};

const renderSnapshotLiiga = (root: HTMLElement, data: SnapshotLiigaResponse) => {
  const live = data.liveIlvesGame;
  const next = data.nextIlvesGame;

  root.classList.remove('is-live', 'is-today', 'is-unavailable');
  renderStanding(root, data.ilvesStanding, data.standings ?? []);
  renderLastGame(root, data.lastIlvesGame);

  const last = root.querySelector<HTMLElement>('[data-snapshot-liiga-last]');

  if (live && typeof live.homeGoals === 'number' && typeof live.awayGoals === 'number') {
    root.classList.add('is-live');
    renderGame(
      root,
      live,
      `${live.homeGoals}-${live.awayGoals}`,
      formatGameClock(live.gameTime),
    );
    setState(root, 'LIVE', true);
    last?.setAttribute('hidden', '');
    return;
  }

  last?.removeAttribute('hidden');

  if (!next) {
    renderGame(root, null, '--', 'NO SCHEDULED GAME');
    setState(root, 'NEXT', false);
    return;
  }

  const today = isGameToday(next.start, getReferenceTime(data.generatedAt));
  root.classList.toggle('is-today', today);
  renderGame(root, next, formatGameTime(next.start), formatGameDate(next.start));
  setState(root, today ? 'TODAY' : 'NEXT', false);
};

const ensureStyles = () => {
  if (document.querySelector('[data-snapshot-liiga-styles]')) return;

  const style = document.createElement('style');
  style.dataset.snapshotLiigaStyles = 'true';
  style.textContent = `
    body:has(.snapshot-shell) .snapshot-panel--rates .snapshot-panel__heading--split {
      grid-template-columns:
        44px
        minmax(0, calc(42% - 78px))
        34px
        minmax(0, calc(58% - 34px))
        34px;
    }

    body:has(.snapshot-shell) .snapshot-panel--rates .snapshot-panel__heading--split h2 {
      min-width: 0;
      overflow: hidden;
      white-space: nowrap;
    }

    body:has(.snapshot-shell) .snapshot-panel--rates .snapshot-panel__heading--split .snapshot-panel__heading-secondary {
      border-left: 1px solid color-mix(in srgb, var(--ink-soft) 76%, transparent);
    }

    body:has(.snapshot-shell) .snapshot-rates__main {
      grid-template-columns: minmax(0, 0.42fr) minmax(0, 0.58fr);
      gap: 0;
      align-items: stretch;
    }

    body:has(.snapshot-shell) .snapshot-rates__main > :first-child {
      min-width: 0;
      align-self: center;
      padding-right: 12px;
    }

    body:has(.snapshot-shell) .snapshot-liiga {
      min-width: 0;
      overflow: hidden;
      align-self: stretch;
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr) auto auto;
      align-content: center;
      gap: 4px;
      padding-left: 12px;
      border-left: 1px solid var(--line);
      color: var(--ink-soft);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      text-transform: uppercase;
    }

    body:has(.snapshot-shell) .snapshot-liiga__header,
    body:has(.snapshot-shell) .snapshot-liiga__match,
    body:has(.snapshot-shell) .snapshot-liiga__team,
    body:has(.snapshot-shell) .snapshot-liiga__footer {
      min-width: 0;
      display: flex;
      align-items: center;
    }

    body:has(.snapshot-shell) .snapshot-liiga__header {
      justify-content: space-between;
      gap: 6px;
      font-size: 0.58rem;
      line-height: 1;
      letter-spacing: 0.05em;
    }

    body:has(.snapshot-shell) .snapshot-liiga__name {
      color: var(--ink-soft);
      font-weight: 750;
    }

    body:has(.snapshot-shell) .snapshot-liiga__position {
      color: var(--ink);
      display: inline-flex;
      align-items: baseline;
      gap: 1px;
      font-size: 1.45rem;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      line-height: 0.9;
      white-space: nowrap;
    }

    body:has(.snapshot-shell) .snapshot-liiga__position-rank {
      font-size: 1em;
    }

    body:has(.snapshot-shell) .snapshot-liiga__position-separator {
      color: var(--stone);
      font-size: 0.6em;
      font-weight: 650;
    }

    body:has(.snapshot-shell) .snapshot-liiga__position-total {
      color: var(--stone);
      font-size: 0.52em;
      font-weight: 650;
    }

    body:has(.snapshot-shell) .snapshot-liiga__comparison {
      margin: 0;
      overflow: hidden;
      color: var(--stone);
      font-size: 0.42rem;
      font-weight: 600;
      line-height: 1;
      letter-spacing: 0.035em;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    body:has(.snapshot-shell) .snapshot-liiga__match {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
      width: 100%;
      align-items: center;
      column-gap: 12px;
    }

    body:has(.snapshot-shell) .snapshot-liiga__team {
      width: 100%;
      gap: 6px;
      overflow: visible;
    }

    body:has(.snapshot-shell) .snapshot-liiga__team:not(.snapshot-liiga__team--away) b {
      order: 1;
    }

    body:has(.snapshot-shell) .snapshot-liiga__team:not(.snapshot-liiga__team--away) .snapshot-liiga__mark-wrap {
      order: 2;
    }

    body:has(.snapshot-shell) .snapshot-liiga__team--away .snapshot-liiga__mark-wrap {
      order: 1;
    }

    body:has(.snapshot-shell) .snapshot-liiga__team--away b {
      order: 2;
    }

    body:has(.snapshot-shell) .snapshot-liiga__team b {
      overflow: hidden;
      color: var(--ink-soft);
      max-width: min(24vw, 8rem);
      font-size: 0.56rem;
      font-weight: 700;
      line-height: 1;
      letter-spacing: 0.035em;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    body:has(.snapshot-shell) .snapshot-liiga__mark-wrap {
      flex: 0 0 auto;
      width: 54px;
      height: 54px;
      color: var(--ink-soft);
    }

    body:has(.snapshot-shell) .snapshot-liiga__mark {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    body:has(.snapshot-shell) .snapshot-liiga__mark--ilves {
      overflow: hidden;
      background: currentColor;
      -webkit-mask: url('/icons/current-ilves-mascot-emblem.svg') center / contain no-repeat;
      mask: url('/icons/current-ilves-mascot-emblem.svg') center / contain no-repeat;
    }

    body:has(.snapshot-shell) .snapshot-liiga__match-center {
      min-width: 82px;
      display: grid;
      justify-items: center;
      align-content: center;
      gap: 2px;
    }

    body:has(.snapshot-shell) .snapshot-liiga__score {
      color: var(--ink);
      font-size: 1.18rem;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      line-height: 0.9;
      letter-spacing: -0.025em;
      white-space: nowrap;
    }

    body:has(.snapshot-shell) .snapshot-liiga__match-center time {
      color: var(--stone);
      font-size: 0.36rem;
      font-weight: 600;
      line-height: 1;
      letter-spacing: 0.025em;
      white-space: nowrap;
    }

    body:has(.snapshot-shell) .snapshot-liiga__footer {
      justify-content: space-between;
      gap: 6px;
      color: var(--stone);
      font-size: 0.38rem;
      font-weight: 600;
      line-height: 1;
      letter-spacing: 0.035em;
      white-space: nowrap;
    }

    body:has(.snapshot-shell) .snapshot-liiga__source {
      margin: 0;
      color: var(--stone);
      font-size: 0.34rem;
      font-weight: 600;
      line-height: 1;
      letter-spacing: 0.035em;
      white-space: nowrap;
    }

    body:has(.snapshot-shell) .snapshot-liiga__state {
      color: var(--ink-soft);
    }

    body:has(.snapshot-shell) .snapshot-liiga__last {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    body:has(.snapshot-shell) .snapshot-liiga.is-today .snapshot-liiga__state,
    body:has(.snapshot-shell) .snapshot-liiga.is-today .snapshot-liiga__score,
    body:has(.snapshot-shell) .snapshot-liiga.is-live .snapshot-liiga__state,
    body:has(.snapshot-shell) .snapshot-liiga.is-live .snapshot-liiga__score {
      color: var(--ink);
      font-weight: 850;
    }

    body:has(.snapshot-shell) .snapshot-liiga.is-live .snapshot-liiga__score {
      font-size: 1rem;
    }

    body:has(.snapshot-shell) .snapshot-liiga.is-live .snapshot-liiga__match-center time {
      color: var(--ink-soft);
      font-size: 0.34rem;
    }

    body:has(.snapshot-shell) .snapshot-liiga.is-unavailable .snapshot-liiga__match,
    body:has(.snapshot-shell) .snapshot-liiga.is-unavailable .snapshot-liiga__footer {
      opacity: 0.55;
    }

    @media (max-width: 640px) {
      body:has(.snapshot-shell) .snapshot-panel--rates .snapshot-panel__heading--split {
        grid-template-columns:
          38px
          minmax(0, calc(42% - 68px))
          30px
          minmax(0, calc(58% - 30px))
          30px;
      }

      body:has(.snapshot-shell) .snapshot-rates__main > :first-child {
        padding-right: 7px;
      }

      body:has(.snapshot-shell) .snapshot-liiga {
        gap: 4px;
        padding-left: 7px;
      }

      body:has(.snapshot-shell) .snapshot-liiga__header {
        font-size: 0.48rem;
      }

      body:has(.snapshot-shell) .snapshot-liiga__position {
        font-size: 1.02rem;
      }

      body:has(.snapshot-shell) .snapshot-liiga__position-total {
        font-size: 0.7em;
      }

      body:has(.snapshot-shell) .snapshot-liiga__comparison {
        font-size: 0.4rem;
      }

      body:has(.snapshot-shell) .snapshot-liiga__match {
        column-gap: 5px;
      }

      body:has(.snapshot-shell) .snapshot-liiga__mark-wrap {
        width: 44px;
        height: 44px;
      }

      body:has(.snapshot-shell) .snapshot-liiga__team {
        gap: 2px;
      }

      body:has(.snapshot-shell) .snapshot-liiga__team b {
        max-width: 7rem;
        font-size: 0.46rem;
      }

      body:has(.snapshot-shell) .snapshot-liiga__match-center {
        min-width: 64px;
      }

      body:has(.snapshot-shell) .snapshot-liiga__score {
        font-size: 0.94rem;
      }

      body:has(.snapshot-shell) .snapshot-liiga__match-center time {
        font-size: 0.3rem;
      }

      body:has(.snapshot-shell) .snapshot-liiga__footer {
        font-size: 0.32rem;
      }

      body:has(.snapshot-shell) .snapshot-liiga.is-live .snapshot-liiga__score {
        font-size: 0.88rem;
      }

      body:has(.snapshot-shell) .snapshot-liiga.is-live .snapshot-liiga__match-center time {
        font-size: 0.3rem;
      }
    }

    @media (max-width: 380px), (max-height: 720px) {
      body:has(.snapshot-shell) .snapshot-panel--rates .snapshot-panel__heading--split {
        grid-template-columns:
          33px
          minmax(0, calc(42% - 59px))
          26px
          minmax(0, calc(58% - 26px))
          26px;
      }

      body:has(.snapshot-shell) .snapshot-rates__main > :first-child {
        padding-right: 5px;
      }

      body:has(.snapshot-shell) .snapshot-liiga {
        gap: 1px;
        padding-left: 5px;
      }

      body:has(.snapshot-shell) .snapshot-liiga__header {
        font-size: 0.34rem;
      }

      body:has(.snapshot-shell) .snapshot-liiga__position {
        font-size: 0.84rem;
      }

      body:has(.snapshot-shell) .snapshot-liiga__position-total {
        font-size: 0.68em;
      }

      body:has(.snapshot-shell) .snapshot-liiga__comparison {
        font-size: 0.28rem;
      }

      body:has(.snapshot-shell) .snapshot-liiga__match {
        column-gap: 5px;
      }

      body:has(.snapshot-shell) .snapshot-liiga__mark-wrap {
        width: 36px;
        height: 36px;
      }

      body:has(.snapshot-shell) .snapshot-liiga__team b {
        max-width: 5.5rem;
        font-size: 0.38rem;
      }

      body:has(.snapshot-shell) .snapshot-liiga__match-center {
        min-width: 54px;
      }

      body:has(.snapshot-shell) .snapshot-liiga__score {
        font-size: 0.8rem;
      }

      body:has(.snapshot-shell) .snapshot-liiga__match-center time,
      body:has(.snapshot-shell) .snapshot-liiga__footer {
        font-size: 0.26rem;
      }

      body:has(.snapshot-shell) .snapshot-liiga.is-live .snapshot-liiga__score {
        font-size: 0.74rem;
      }

      body:has(.snapshot-shell) .snapshot-liiga__last {
        display: none;
      }
    }
  `;
  document.head.append(style);
};

const ensureSplitHeading = (rates: HTMLElement) => {
  const heading = rates.querySelector<HTMLElement>('.snapshot-panel__heading');
  const ratesTitle = heading?.querySelector<HTMLElement>('h2');
  const ratesOpen = heading?.querySelector<HTMLAnchorElement>('.snapshot-panel__open');
  if (!heading || !ratesTitle || !ratesOpen) return;

  heading.classList.add('snapshot-panel__heading--split');
  ratesTitle.textContent = 'RATES / 04';
  ratesOpen.href = '/current/rates/';
  ratesOpen.setAttribute('aria-label', 'Open Rates detail');

  if (heading.querySelector('[data-snapshot-liiga-heading]')) return;

  const liigaTitle = ratesTitle.cloneNode(true) as HTMLElement;
  liigaTitle.id = 'snapshot-liiga-label';
  liigaTitle.textContent = 'LIIGA / 05';
  liigaTitle.classList.add('snapshot-panel__heading-secondary');
  liigaTitle.dataset.snapshotLiigaHeading = 'true';

  const liigaOpen = ratesOpen.cloneNode(true) as HTMLAnchorElement;
  liigaOpen.href = '/current/liiga/';
  liigaOpen.setAttribute('aria-label', 'Open Liiga detail');
  liigaOpen.dataset.snapshotLiigaOpen = 'true';

  heading.append(liigaTitle, liigaOpen);
};

const ensureSnapshotLiiga = () => {
  const snapshot = document.querySelector<HTMLElement>('[data-current-snapshot]');
  const rates = snapshot?.querySelector<HTMLElement>('.snapshot-panel--rates');
  const main = rates?.querySelector<HTMLElement>('.snapshot-rates__main');
  if (!snapshot || !rates || !main) return null;

  ensureSplitHeading(rates);

  const existing = main.querySelector<HTMLElement>('[data-snapshot-liiga]');
  if (existing) return existing;

  const section = document.createElement('section');
  section.className = 'snapshot-liiga';
  section.dataset.snapshotLiiga = 'true';
  section.setAttribute('aria-label', 'Ilves Liiga status');
  section.setAttribute('aria-live', 'polite');
  section.innerHTML = `
    <div class="snapshot-liiga__header">
      <span class="snapshot-liiga__name">ILVES</span>
      <strong class="snapshot-liiga__position" data-snapshot-liiga-position aria-label="League position unavailable">
        <span class="snapshot-liiga__position-rank">--</span>
        <span class="snapshot-liiga__position-separator" aria-hidden="true">/</span>
        <span class="snapshot-liiga__position-total">--</span>
      </strong>
    </div>
    <p class="snapshot-liiga__comparison" data-snapshot-liiga-comparison>ILV -- P · TOP -- P</p>
    <div class="snapshot-liiga__match">
      <span class="snapshot-liiga__team">
        <span class="snapshot-liiga__mark-wrap" data-snapshot-liiga-home-mark></span>
        <b data-snapshot-liiga-home-team>---</b>
      </span>
      <span class="snapshot-liiga__match-center">
        <strong class="snapshot-liiga__score" data-snapshot-liiga-score>--</strong>
        <time data-snapshot-liiga-schedule>--</time>
      </span>
      <span class="snapshot-liiga__team snapshot-liiga__team--away">
        <b data-snapshot-liiga-away-team>---</b>
        <span class="snapshot-liiga__mark-wrap" data-snapshot-liiga-away-mark></span>
      </span>
    </div>
    <div class="snapshot-liiga__footer">
      <span class="snapshot-liiga__state" data-snapshot-liiga-state hidden>NEXT</span>
      <span class="snapshot-liiga__last" data-snapshot-liiga-last>LAST / --</span>
    </div>
    <p class="snapshot-liiga__source">DATA / LIIGA</p>
  `;

  main.append(section);
  return section;
};

export const initSnapshotLiiga = () => {
  ensureStyles();
  const root = ensureSnapshotLiiga();
  if (!root || root.dataset.snapshotLiigaInitialized === 'true') return;
  root.dataset.snapshotLiigaInitialized = 'true';

  let refreshTimer = 0;
  let loading = false;

  const scheduleRefresh = (isLive: boolean) => {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(
      () => void load(),
      isLive ? LIVE_REFRESH_INTERVAL_MS : REFRESH_INTERVAL_MS,
    );
  };

  const load = async () => {
    if (loading) return;
    loading = true;
    let isLive = false;

    try {
      const response = await fetch(`/api/current/liiga?_=${Date.now()}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Liiga request failed: ${response.status}`);

      const data = (await response.json()) as SnapshotLiigaResponse;
      renderSnapshotLiiga(root, data);
      isLive = Boolean(data.liveIlvesGame);

      window.dispatchEvent(
        new CustomEvent('current:data-updated', {
          detail: { source: 'liiga', at: data.generatedAt ?? new Date().toISOString() },
        }),
      );
    } catch {
      root.classList.remove('is-live', 'is-today');
      root.classList.add('is-unavailable');
      setState(root, 'UNAVAILABLE', true);
      setText(root, '[data-snapshot-liiga-score]', '--');
      setText(root, '[data-snapshot-liiga-schedule]', '--');
    } finally {
      loading = false;
      scheduleRefresh(isLive);
    }
  };

  document.querySelector<HTMLButtonElement>('[data-snapshot-refresh]')?.addEventListener('click', () => {
    window.clearTimeout(refreshTimer);
    void load();
  });

  void load();

  window.addEventListener(
    'pagehide',
    () => window.clearTimeout(refreshTimer),
    { once: true },
  );
};