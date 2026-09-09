type LiigaScheduleGame = {
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

type LiigaScheduleResponse = {
  generatedAt?: string;
  liveGames?: LiigaScheduleGame[];
  upcomingGames?: LiigaScheduleGame[];
};

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const LIVE_REFRESH_INTERVAL_MS = 30 * 1000;
const HELSINKI_TIME_ZONE = 'Europe/Helsinki';
const SVG_NS = 'http://www.w3.org/2000/svg';

const dayKey = (value: string | Date) =>
  new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: HELSINKI_TIME_ZONE,
  }).format(typeof value === 'string' ? new Date(value) : value);

const formatDay = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    timeZone: HELSINKI_TIME_ZONE,
  }).format(date).toUpperCase();
};

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: HELSINKI_TIME_ZONE,
  }).format(date);
};

const formatGameClock = (value: number | null) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return 'LIVE';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const createScheduleSection = (root: HTMLElement) => {
  const existing = root.querySelector<HTMLElement>('[data-liiga-schedule]');
  if (existing) return existing;

  const section = document.createElement('section');
  section.className = 'liiga-schedule-section';
  section.dataset.liigaSchedule = '';
  section.setAttribute('aria-labelledby', 'liiga-schedule-title');
  section.innerHTML = `
    <div class="liiga-panel-heading liiga-schedule-heading">
      <p id="liiga-schedule-title">GAMES / LIVE & UPCOMING</p>
      <p data-liiga-schedule-meta>LOADING</p>
    </div>
    <div class="liiga-schedule-groups" data-liiga-schedule-groups></div>
    <p class="liiga-schedule-empty" data-liiga-schedule-empty hidden>NO UPCOMING GAMES</p>
  `;

  const ilves = root.querySelector('.liiga-ilves');
  if (ilves) ilves.insertAdjacentElement('afterend', section);
  else root.append(section);
  return section;
};

const createTeam = (teamId: string, teamName: string, away = false) => {
  const wrap = document.createElement('div');
  wrap.className = `liiga-schedule-team${away ? ' liiga-schedule-team--away' : ''}${teamId === 'ilves' ? ' is-ilves' : ''}`;

  const name = document.createElement('span');
  name.className = 'liiga-schedule-team__name';
  name.textContent = teamName;

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'liiga-match-team__mark liiga-schedule-team__mark');
  svg.setAttribute('viewBox', '0 0 48 48');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `#liiga-match-mark-${teamId}`);
  svg.append(use);

  if (away) wrap.append(svg, name);
  else wrap.append(name, svg);
  return wrap;
};

const createGameRow = (game: LiigaScheduleGame, isLive: boolean) => {
  const row = document.createElement('article');
  row.className = `liiga-schedule-game${isLive ? ' is-live' : ''}`;
  row.dataset.liigaScheduleGame = String(game.id ?? `${game.homeTeamId}-${game.awayTeamId}-${game.start}`);
  if (isLive) row.dataset.liigaScheduleLive = '';

  const center = document.createElement('div');
  center.className = 'liiga-schedule-game__center';

  const primary = document.createElement('strong');
  primary.className = 'liiga-schedule-game__primary';
  primary.textContent = isLive
    ? `${game.homeGoals ?? 0} - ${game.awayGoals ?? 0}`
    : formatTime(game.start);

  const secondary = document.createElement('span');
  secondary.className = 'liiga-schedule-game__secondary';
  secondary.textContent = isLive ? `LIVE / ${formatGameClock(game.gameTime)}` : 'SCHEDULED';
  center.append(primary, secondary);

  row.append(
    createTeam(game.homeTeamId, game.homeTeam),
    center,
    createTeam(game.awayTeamId, game.awayTeam, true),
  );
  return row;
};

const createGroup = (label: string, games: LiigaScheduleGame[], isLive: boolean, today = false) => {
  const group = document.createElement('section');
  group.className = `liiga-schedule-day${isLive ? ' is-live' : ''}`;
  if (isLive) group.setAttribute('aria-live', 'polite');

  const heading = document.createElement('div');
  heading.className = 'liiga-schedule-day__heading';

  const title = document.createElement('span');
  title.textContent = isLive ? 'LIVE NOW' : today ? 'TODAY' : label;
  const date = document.createElement('span');
  date.textContent = isLive ? `${games.length} ${games.length === 1 ? 'GAME' : 'GAMES'}` : label;
  heading.append(title, date);

  const list = document.createElement('div');
  list.className = 'liiga-schedule-list';
  games.forEach((game) => list.append(createGameRow(game, isLive)));
  group.append(heading, list);
  return group;
};

const renderSchedule = (section: HTMLElement, liveGames: LiigaScheduleGame[], upcomingGames: LiigaScheduleGame[]) => {
  const groups = section.querySelector<HTMLElement>('[data-liiga-schedule-groups]');
  const meta = section.querySelector<HTMLElement>('[data-liiga-schedule-meta]');
  const empty = section.querySelector<HTMLElement>('[data-liiga-schedule-empty]');
  if (!groups || !meta || !empty) return;

  groups.replaceChildren();
  meta.textContent = liveGames.length > 0
    ? `LIVE ${liveGames.length} / NEXT ${upcomingGames.length}`
    : `NEXT ${upcomingGames.length}`;

  if (liveGames.length > 0) groups.append(createGroup('LIVE', liveGames, true));

  const byDay = new Map<string, LiigaScheduleGame[]>();
  upcomingGames.forEach((game) => {
    const key = dayKey(game.start);
    const bucket = byDay.get(key) ?? [];
    bucket.push(game);
    byDay.set(key, bucket);
  });

  const today = dayKey(new Date());
  byDay.forEach((games, key) => {
    groups.append(createGroup(formatDay(games[0]?.start ?? ''), games, false, key === today));
  });

  empty.hidden = liveGames.length > 0 || upcomingGames.length > 0;
};

export const initCurrentLiigaSchedule = () => {
  const root = document.querySelector<HTMLElement>('[data-current-liiga]');
  if (!root || root.dataset.liigaScheduleInitialized === 'true') return;
  root.dataset.liigaScheduleInitialized = 'true';

  const section = createScheduleSection(root);
  const meta = section.querySelector<HTMLElement>('[data-liiga-schedule-meta]');
  let refreshTimer = 0;

  const scheduleRefresh = (hasLiveGames: boolean) => {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(
      () => void load(),
      hasLiveGames ? LIVE_REFRESH_INTERVAL_MS : REFRESH_INTERVAL_MS,
    );
  };

  const load = async () => {
    let hasLiveGames = false;
    try {
      const response = await fetch(`/api/current/liiga-schedule?_=${Date.now()}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Liiga schedule request failed: ${response.status}`);

      const data = (await response.json()) as LiigaScheduleResponse;
      const liveGames = Array.isArray(data.liveGames) ? data.liveGames : [];
      const upcomingGames = Array.isArray(data.upcomingGames) ? data.upcomingGames : [];
      hasLiveGames = liveGames.length > 0;
      renderSchedule(section, liveGames, upcomingGames);
      root.classList.toggle('has-league-live-games', hasLiveGames);
    } catch {
      if (meta) meta.textContent = 'SCHEDULE UNAVAILABLE';
    } finally {
      scheduleRefresh(hasLiveGames);
    }
  };

  void load();
  window.addEventListener('pagehide', () => window.clearTimeout(refreshTimer), { once: true });
};
