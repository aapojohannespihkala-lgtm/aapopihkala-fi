import { getLiigaMarkPaths, isLiigaMarkFilled } from '../../config/liigaMarks';
import { getLiigaTeamById } from '../../config/liigaTeams';

type SnapshotLiigaStanding = {
  rank: number;
  games: number;
  points: number;
  totalTeams: number;
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
  ilvesStanding: SnapshotLiigaStanding | null;
  lastIlvesGame: SnapshotLiigaLastGame | null;
  nextIlvesGame: SnapshotLiigaGame | null;
  liveIlvesGame: SnapshotLiigaGame | null;
};

const HELSINKI_TIME_ZONE = 'Europe/Helsinki';
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const LIVE_REFRESH_INTERVAL_MS = 30 * 1000;
const SVG_NS = 'http://www.w3.org/2000/svg';

const formatGameDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';

  const datePart = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    timeZone: HELSINKI_TIME_ZONE,
  })
    .format(date)
    .replace(',', '')
    .toUpperCase();
  const timePart = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: HELSINKI_TIME_ZONE,
  }).format(date);

  return `${datePart} / ${timePart}`;
};

const formatGameClock = (value: number | null) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return 'LIVE';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const getTeamAbbreviation = (teamId: string, fallback: string) =>
  getLiigaTeamById(teamId)?.abbreviation ?? fallback.slice(0, 3).toUpperCase();

const createTeamMark = (teamId: string) => {
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

const renderTeam = (
  root: HTMLElement,
  side: 'home' | 'away',
  teamId: string,
  teamName: string,
) => {
  setText(root, `[data-snapshot-liiga-${side}-team]`, getTeamAbbreviation(teamId, teamName));
  const markTarget = root.querySelector<HTMLElement>(`[data-snapshot-liiga-${side}-mark]`);
  if (!markTarget) return;
  const mark = createTeamMark(teamId);
  markTarget.replaceChildren(...(mark ? [mark] : []));
};

const renderGame = (root: HTMLElement, game: SnapshotLiigaGame | null, score: string) => {
  if (!game) {
    setText(root, '[data-snapshot-liiga-home-team]', '---');
    setText(root, '[data-snapshot-liiga-away-team]', '---');
    setText(root, '[data-snapshot-liiga-score]', '--');
    root.querySelector<HTMLElement>('[data-snapshot-liiga-home-mark]')?.replaceChildren();
    root.querySelector<HTMLElement>('[data-snapshot-liiga-away-mark]')?.replaceChildren();
    return;
  }

  renderTeam(root, 'home', game.homeTeamId, game.homeTeam);
  renderTeam(root, 'away', game.awayTeamId, game.awayTeam);
  setText(root, '[data-snapshot-liiga-score]', score);
};

const renderStanding = (root: HTMLElement, standing: SnapshotLiigaStanding | null) => {
  if (!standing) {
    setText(root, '[data-snapshot-liiga-position]', '#-- / --');
    setText(root, '[data-snapshot-liiga-meta]', '-- P / -- GP');
    return;
  }

  setText(root, '[data-snapshot-liiga-position]', `#${standing.rank} / ${standing.totalTeams}`);
  setText(root, '[data-snapshot-liiga-meta]', `${standing.points} P / ${standing.games} GP`);
};

const renderLastGame = (root: HTMLElement, game: SnapshotLiigaLastGame | null) => {
  const target = root.querySelector<HTMLElement>('[data-snapshot-liiga-last]');
  if (!target) return;

  if (!game) {
    target.textContent = 'LAST / --';
    return;
  }

  target.textContent = `LAST / ${game.homeGoals}-${game.awayGoals} ${game.ilvesResult}`;
};

const renderSnapshotLiiga = (root: HTMLElement, data: SnapshotLiigaResponse) => {
  const live = data.liveIlvesGame;
  const next = data.nextIlvesGame;
  root.classList.toggle('is-live', Boolean(live));
  root.classList.remove('is-unavailable');

  renderStanding(root, data.ilvesStanding);
  renderLastGame(root, data.lastIlvesGame);

  if (live && typeof live.homeGoals === 'number' && typeof live.awayGoals === 'number') {
    renderGame(root, live, `${live.homeGoals}-${live.awayGoals}`);
    setText(root, '[data-snapshot-liiga-state]', 'LIVE');
    setText(root, '[data-snapshot-liiga-schedule]', formatGameClock(live.gameTime));
    root.querySelector<HTMLElement>('[data-snapshot-liiga-last]')?.setAttribute('hidden', '');
    return;
  }

  root.querySelector<HTMLElement>('[data-snapshot-liiga-last]')?.removeAttribute('hidden');

  if (!next) {
    renderGame(root, null, '--');
    setText(root, '[data-snapshot-liiga-state]', 'NEXT');
    setText(root, '[data-snapshot-liiga-schedule]', 'NO SCHEDULED GAME');
    return;
  }

  renderGame(root, next, 'VS');
  setText(root, '[data-snapshot-liiga-state]', `NEXT / ${next.homeTeamId === 'ilves' ? 'HOME' : 'AWAY'}`);
  setText(root, '[data-snapshot-liiga-schedule]', formatGameDateTime(next.start));
};

const ensureStyles = () => {
  if (document.querySelector('[data-snapshot-liiga-styles]')) return;

  const style = document.createElement('style');
  style.dataset.snapshotLiigaStyles = 'true';
  style.textContent = `
    body:has(.snapshot-shell) .snapshot-rates__main {
      grid-template-columns: minmax(0, 0.9fr) minmax(148px, 1.1fr);
      gap: 12px;
    }

    body:has(.snapshot-shell) .snapshot-liiga {
      min-width: 0;
      overflow: hidden;
      align-self: stretch;
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr) auto auto;
      align-content: center;
      gap: 2px;
      padding-left: 12px;
      border-left: 1px solid var(--line);
      color: var(--ink-soft);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      text-transform: uppercase;
    }

    body:has(.snapshot-shell) .snapshot-liiga__header,
    body:has(.snapshot-shell) .snapshot-liiga__schedule,
    body:has(.snapshot-shell) .snapshot-liiga__match,
    body:has(.snapshot-shell) .snapshot-liiga__team {
      min-width: 0;
      display: flex;
      align-items: center;
    }

    body:has(.snapshot-shell) .snapshot-liiga__header {
      justify-content: space-between;
      gap: 6px;
      font-size: 0.48rem;
      line-height: 1;
      letter-spacing: 0.05em;
    }

    body:has(.snapshot-shell) .snapshot-liiga__name {
      color: var(--ink-soft);
      font-weight: 700;
      text-decoration: none;
    }

    body:has(.snapshot-shell) .snapshot-liiga__name:hover,
    body:has(.snapshot-shell) .snapshot-liiga__name:focus-visible {
      color: var(--moss-deep);
      text-decoration: underline;
      text-underline-offset: 0.16em;
    }

    body:has(.snapshot-shell) .snapshot-liiga__position {
      color: var(--ink);
      font-size: 0.58rem;
      font-weight: 750;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    body:has(.snapshot-shell) .snapshot-liiga__meta,
    body:has(.snapshot-shell) .snapshot-liiga__last {
      margin: 0;
      color: var(--stone);
      font-size: 0.37rem;
      line-height: 1;
      letter-spacing: 0.045em;
      white-space: nowrap;
    }

    body:has(.snapshot-shell) .snapshot-liiga__match {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
      align-items: center;
      gap: 4px;
    }

    body:has(.snapshot-shell) .snapshot-liiga__team {
      gap: 3px;
      overflow: hidden;
    }

    body:has(.snapshot-shell) .snapshot-liiga__team--away {
      justify-content: end;
    }

    body:has(.snapshot-shell) .snapshot-liiga__team b {
      overflow: hidden;
      color: var(--ink-soft);
      font-size: 0.45rem;
      font-weight: 700;
      line-height: 1;
      letter-spacing: 0.035em;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    body:has(.snapshot-shell) .snapshot-liiga__mark-wrap {
      flex: 0 0 auto;
      width: 20px;
      height: 20px;
      color: var(--ink-soft);
    }

    body:has(.snapshot-shell) .snapshot-liiga__mark {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    body:has(.snapshot-shell) .snapshot-liiga__score {
      color: var(--ink);
      font-size: 0.58rem;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      line-height: 1;
      white-space: nowrap;
    }

    body:has(.snapshot-shell) .snapshot-liiga__schedule {
      justify-content: space-between;
      gap: 5px;
      font-size: 0.36rem;
      font-weight: 600;
      line-height: 1;
      letter-spacing: 0.035em;
      white-space: nowrap;
    }

    body:has(.snapshot-shell) .snapshot-liiga__state {
      color: var(--ink-soft);
    }

    body:has(.snapshot-shell) .snapshot-liiga__schedule time {
      overflow: hidden;
      color: var(--stone);
      text-overflow: ellipsis;
    }

    body:has(.snapshot-shell) .snapshot-liiga.is-live .snapshot-liiga__state,
    body:has(.snapshot-shell) .snapshot-liiga.is-live .snapshot-liiga__score {
      color: var(--ink);
      font-weight: 850;
    }

    body:has(.snapshot-shell) .snapshot-liiga.is-live .snapshot-liiga__score {
      font-size: 0.7rem;
    }

    body:has(.snapshot-shell) .snapshot-liiga.is-unavailable .snapshot-liiga__match,
    body:has(.snapshot-shell) .snapshot-liiga.is-unavailable .snapshot-liiga__last {
      opacity: 0.55;
    }

    @media (max-width: 640px) {
      body:has(.snapshot-shell) .snapshot-rates__main {
        grid-template-columns: minmax(0, 0.82fr) minmax(136px, 1.18fr);
        gap: 7px;
      }

      body:has(.snapshot-shell) .snapshot-liiga {
        gap: 1px;
        padding-left: 7px;
      }

      body:has(.snapshot-shell) .snapshot-liiga__header {
        font-size: 0.42rem;
      }

      body:has(.snapshot-shell) .snapshot-liiga__position {
        font-size: 0.5rem;
      }

      body:has(.snapshot-shell) .snapshot-liiga__meta,
      body:has(.snapshot-shell) .snapshot-liiga__last {
        font-size: 0.32rem;
      }

      body:has(.snapshot-shell) .snapshot-liiga__mark-wrap {
        width: 17px;
        height: 17px;
      }

      body:has(.snapshot-shell) .snapshot-liiga__team b {
        font-size: 0.39rem;
      }

      body:has(.snapshot-shell) .snapshot-liiga__score {
        font-size: 0.5rem;
      }

      body:has(.snapshot-shell) .snapshot-liiga__schedule {
        font-size: 0.31rem;
      }

      body:has(.snapshot-shell) .snapshot-liiga.is-live .snapshot-liiga__score {
        font-size: 0.61rem;
      }
    }

    @media (max-width: 380px), (max-height: 720px) {
      body:has(.snapshot-shell) .snapshot-rates__main {
        grid-template-columns: minmax(0, 0.78fr) minmax(124px, 1.22fr);
        gap: 5px;
      }

      body:has(.snapshot-shell) .snapshot-liiga {
        padding-left: 5px;
      }

      body:has(.snapshot-shell) .snapshot-liiga__header {
        font-size: 0.36rem;
      }

      body:has(.snapshot-shell) .snapshot-liiga__position {
        font-size: 0.43rem;
      }

      body:has(.snapshot-shell) .snapshot-liiga__meta {
        font-size: 0.28rem;
      }

      body:has(.snapshot-shell) .snapshot-liiga__mark-wrap {
        width: 14px;
        height: 14px;
      }

      body:has(.snapshot-shell) .snapshot-liiga__team b,
      body:has(.snapshot-shell) .snapshot-liiga__schedule {
        font-size: 0.28rem;
      }

      body:has(.snapshot-shell) .snapshot-liiga__score {
        font-size: 0.44rem;
      }

      body:has(.snapshot-shell) .snapshot-liiga__last {
        display: none;
      }
    }
  `;
  document.head.append(style);
};

const ensureSnapshotLiiga = () => {
  const snapshot = document.querySelector<HTMLElement>('[data-current-snapshot]');
  const rates = snapshot?.querySelector<HTMLElement>('.snapshot-panel--rates');
  const main = rates?.querySelector<HTMLElement>('.snapshot-rates__main');
  if (!snapshot || !rates || !main) return null;

  const existing = main.querySelector<HTMLElement>('[data-snapshot-liiga]');
  if (existing) return existing;

  rates.querySelector<HTMLElement>('.snapshot-panel__heading h2')!.textContent = 'RATES + ILVES / 04';
  const source = rates.querySelector<HTMLElement>('.snapshot-source');
  if (source) source.textContent = 'DATA / ECB · BANK OF FINLAND + LIIGA';

  const section = document.createElement('section');
  section.className = 'snapshot-liiga';
  section.dataset.snapshotLiiga = 'true';
  section.setAttribute('aria-label', 'Ilves Liiga status');
  section.setAttribute('aria-live', 'polite');
  section.innerHTML = `
    <div class="snapshot-liiga__header">
      <a class="snapshot-liiga__name" href="/current/liiga/">ILVES</a>
      <strong class="snapshot-liiga__position" data-snapshot-liiga-position>#-- / --</strong>
    </div>
    <p class="snapshot-liiga__meta" data-snapshot-liiga-meta>-- P / -- GP</p>
    <div class="snapshot-liiga__match">
      <span class="snapshot-liiga__team">
        <span class="snapshot-liiga__mark-wrap" data-snapshot-liiga-home-mark></span>
        <b data-snapshot-liiga-home-team>---</b>
      </span>
      <strong class="snapshot-liiga__score" data-snapshot-liiga-score>--</strong>
      <span class="snapshot-liiga__team snapshot-liiga__team--away">
        <b data-snapshot-liiga-away-team>---</b>
        <span class="snapshot-liiga__mark-wrap" data-snapshot-liiga-away-mark></span>
      </span>
    </div>
    <p class="snapshot-liiga__schedule">
      <span class="snapshot-liiga__state" data-snapshot-liiga-state>NEXT</span>
      <time data-snapshot-liiga-schedule>--</time>
    </p>
    <p class="snapshot-liiga__last" data-snapshot-liiga-last>LAST / --</p>
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
    refreshTimer = window.setTimeout(() => void load(), isLive ? LIVE_REFRESH_INTERVAL_MS : REFRESH_INTERVAL_MS);
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
        })
      );
    } catch {
      root.classList.remove('is-live');
      root.classList.add('is-unavailable');
      setText(root, '[data-snapshot-liiga-state]', 'UNAVAILABLE');
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
    { once: true }
  );
};
