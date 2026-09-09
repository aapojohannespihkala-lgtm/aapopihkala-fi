type LiigaStanding = {
  id: string;
  rank: number;
  games: number;
  wins: number;
  ties: number;
  losses: number;
  bonusPoints: number;
  points: number;
  goalDifference: number;
};

type IlvesStanding = LiigaStanding & {
  totalTeams: number;
};

type LiigaGame = {
  id: number | string | null;
  start: string;
  homeTeamId: string;
  homeTeam: string;
  awayTeamId: string;
  awayTeam: string;
  homeGoals: number | null;
  awayGoals: number | null;
  gameTime: number | null;
  spectators?: number | null;
};

type LiigaLastGame = LiigaGame & {
  homeGoals: number;
  awayGoals: number;
  ilvesResult: 'W' | 'L' | 'T';
  finish: 'REGULATION' | 'OVERTIME' | 'SHOOTOUT';
};

type LiigaLiveGame = LiigaGame & {
  homeGoals: number;
  awayGoals: number;
};

type LiigaResponse = {
  season: number;
  generatedAt?: string;
  standings: LiigaStanding[];
  ilvesStanding: IlvesStanding | null;
  lastIlvesGame: LiigaLastGame | null;
  nextIlvesGame: LiigaGame | null;
  nextHomeIlvesGame: LiigaGame | null;
  liveIlvesGame: LiigaLiveGame | null;
};

type MatchScope = 'last' | 'next' | 'live';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const LIVE_REFRESH_INTERVAL_MS = 30 * 1000;
const HELSINKI_TIME_ZONE = 'Europe/Helsinki';

const formatSeason = (season: number) =>
  Number.isFinite(season) ? `${season - 1}-${String(season).slice(-2)}` : '--';

const formatGameDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';

  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: HELSINKI_TIME_ZONE,
  })
    .format(date)
    .toUpperCase();
};

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

const finishLabel = (finish: LiigaLastGame['finish']) => {
  if (finish === 'OVERTIME') return 'OT';
  if (finish === 'SHOOTOUT') return 'SO';
  return 'REG';
};

const matchupLabel = (game: LiigaGame) => `${game.homeTeam} / ${game.awayTeam}`;

const ilvesVenueLabel = (game: LiigaGame) => game.homeTeamId === 'ilves' ? 'HOME' : 'AWAY';

const setMatchMark = (mark: SVGUseElement | null, teamId: string | null) => {
  if (!mark) return;
  const svg = mark.closest('svg');
  if (!teamId) {
    svg?.setAttribute('hidden', '');
    return;
  }
  svg?.removeAttribute('hidden');
  mark.setAttribute('href', `#liiga-match-mark-${teamId}`);
};

const renderMatchTeams = (root: HTMLElement, scope: MatchScope, game: LiigaGame | null) => {
  const homeTeam = root.querySelector<HTMLElement>(`[data-liiga-${scope}-home-team]`);
  const awayTeam = root.querySelector<HTMLElement>(`[data-liiga-${scope}-away-team]`);
  const homeMark = root.querySelector<SVGUseElement>(`[data-liiga-${scope}-home-mark]`);
  const awayMark = root.querySelector<SVGUseElement>(`[data-liiga-${scope}-away-mark]`);
  const homeWrap = root.querySelector<HTMLElement>(`[data-liiga-${scope}-home-side]`);
  const awayWrap = root.querySelector<HTMLElement>(`[data-liiga-${scope}-away-side]`);

  if (!homeTeam || !awayTeam || !homeMark || !awayMark || !homeWrap || !awayWrap) return;

  homeTeam.textContent = game?.homeTeam ?? '--';
  awayTeam.textContent = game?.awayTeam ?? '--';
  setMatchMark(homeMark, game?.homeTeamId ?? null);
  setMatchMark(awayMark, game?.awayTeamId ?? null);
  homeWrap.classList.toggle('is-ilves', game?.homeTeamId === 'ilves');
  awayWrap.classList.toggle('is-ilves', game?.awayTeamId === 'ilves');
};

const renderStandings = (root: HTMLElement, standings: LiigaStanding[]) => {
  const table = root.querySelector<HTMLElement>('[data-liiga-standings]');
  if (!table) return;

  for (const entry of standings) {
    const row = table.querySelector<HTMLElement>(`[data-liiga-row="${entry.id}"]`);
    if (!row) continue;

    row.dataset.liigaRank = String(entry.rank);
    row.querySelector<HTMLElement>('[data-liiga-rank]')!.textContent = String(entry.rank);
    row.querySelector<HTMLElement>('[data-liiga-games]')!.textContent = String(entry.games);
    row.querySelector<HTMLElement>('[data-liiga-wins]')!.textContent = String(entry.wins);
    row.querySelector<HTMLElement>('[data-liiga-ties]')!.textContent = String(entry.ties);
    row.querySelector<HTMLElement>('[data-liiga-losses]')!.textContent = String(entry.losses);
    row.querySelector<HTMLElement>('[data-liiga-bonus]')!.textContent = String(entry.bonusPoints);
    row.querySelector<HTMLElement>('[data-liiga-points]')!.textContent = String(entry.points);
    row.querySelector<HTMLElement>('[data-liiga-difference]')!.textContent =
      entry.goalDifference > 0 ? `+${entry.goalDifference}` : String(entry.goalDifference);

    row.classList.toggle('is-ilves', entry.id === 'ilves');
    table.append(row);
  }
};

const renderLastGame = (root: HTMLElement, game: LiigaLastGame | null) => {
  const matchup = root.querySelector<HTMLElement>('[data-liiga-last-matchup]');
  const score = root.querySelector<HTMLElement>('[data-liiga-last-score]');
  const date = root.querySelector<HTMLElement>('[data-liiga-last-date]');
  const result = root.querySelector<HTMLElement>('[data-liiga-last-result]');
  const audience = root.querySelector<HTMLElement>('[data-liiga-last-audience]');
  if (!matchup || !score || !date || !result || !audience) return;

  renderMatchTeams(root, 'last', game);

  if (!game) {
    matchup.textContent = 'NO COMPLETED GAME';
    score.textContent = '-- - --';
    date.textContent = '--';
    result.textContent = 'WAITING';
    audience.textContent = 'ATTENDANCE --';
    return;
  }

  matchup.textContent = matchupLabel(game);
  score.textContent = `${game.homeGoals} - ${game.awayGoals}`;
  date.textContent = formatGameDate(game.start);
  result.textContent = `${game.ilvesResult === 'W' ? 'WIN' : game.ilvesResult === 'L' ? 'LOSS' : 'DRAW'} / ${finishLabel(game.finish)}`;
  audience.textContent = typeof game.spectators === 'number' && Number.isFinite(game.spectators)
    ? `ATTENDANCE ${game.spectators}`
    : 'ATTENDANCE --';
};

const renderNextGame = (
  root: HTMLElement,
  game: LiigaGame | null,
  nextHomeGame: LiigaGame | null,
) => {
  const matchup = root.querySelector<HTMLElement>('[data-liiga-next-matchup]');
  const date = root.querySelector<HTMLElement>('[data-liiga-next-date]');
  const venue = root.querySelector<HTMLElement>('[data-liiga-next-venue]');
  const homeStrip = root.querySelector<HTMLElement>('[data-liiga-next-home]');
  const homeOpponent = root.querySelector<HTMLElement>('[data-liiga-next-home-opponent]');
  const homeDate = root.querySelector<HTMLElement>('[data-liiga-next-home-date]');
  if (!matchup || !date || !venue || !homeStrip || !homeOpponent || !homeDate) return;

  renderMatchTeams(root, 'next', game);

  if (!game) {
    matchup.textContent = 'NO SCHEDULED GAME';
    date.textContent = '--';
    venue.textContent = 'SEASON SCHEDULE';
  } else {
    matchup.textContent = matchupLabel(game);
    date.textContent = formatGameDateTime(game.start);
    venue.textContent = `${ilvesVenueLabel(game)} / NEXT`;
  }

  const repeatsNextGame = Boolean(
    game &&
    nextHomeGame &&
    (
      (game.id !== null && nextHomeGame.id !== null && String(game.id) === String(nextHomeGame.id)) ||
      (
        game.start === nextHomeGame.start &&
        game.homeTeamId === nextHomeGame.homeTeamId &&
        game.awayTeamId === nextHomeGame.awayTeamId
      )
    )
  );

  if (!nextHomeGame || repeatsNextGame) {
    homeStrip.hidden = true;
    return;
  }

  homeStrip.hidden = false;
  homeOpponent.textContent = nextHomeGame.homeTeamId === 'ilves'
    ? nextHomeGame.awayTeam
    : nextHomeGame.homeTeam;
  homeDate.textContent = formatGameDateTime(nextHomeGame.start);
};

const renderIlvesStanding = (root: HTMLElement, standing: IlvesStanding | null) => {
  const header = root.querySelector<HTMLElement>('[data-liiga-ilves-position]');
  const position = root.querySelector<HTMLElement>('[data-liiga-position]');
  const meta = root.querySelector<HTMLElement>('[data-liiga-position-meta]');
  if (!header || !position || !meta) return;

  if (!standing) {
    header.textContent = '#-- / --';
    position.textContent = '-- / --';
    meta.textContent = 'WAITING FOR STANDINGS';
    return;
  }

  header.textContent = `#${standing.rank} / ${standing.totalTeams}`;
  position.textContent = `${standing.rank} / ${standing.totalTeams}`;
  meta.textContent = `${standing.points} P / ${standing.games} GP`;
};

const renderLiveGame = (root: HTMLElement, game: LiigaLiveGame | null) => {
  const card = root.querySelector<HTMLElement>('[data-liiga-live-card]');
  const matchup = root.querySelector<HTMLElement>('[data-liiga-live-matchup]');
  const score = root.querySelector<HTMLElement>('[data-liiga-live-score]');
  const clock = root.querySelector<HTMLElement>('[data-liiga-live-clock]');
  if (!card || !matchup || !score || !clock) return;

  card.hidden = !game;
  root.classList.toggle('is-live', Boolean(game));
  if (!game) return;

  renderMatchTeams(root, 'live', game);
  matchup.textContent = matchupLabel(game);
  score.textContent = `${game.homeGoals} - ${game.awayGoals}`;
  clock.textContent = formatGameClock(game.gameTime);
};

export const initCurrentLiiga = () => {
  const root = document.querySelector<HTMLElement>('[data-current-liiga]');
  if (!root || root.dataset.liigaInitialized === 'true') return;
  root.dataset.liigaInitialized = 'true';

  const errorTarget = root.querySelector<HTMLElement>('[data-liiga-error]');
  const retry = root.querySelector<HTMLButtonElement>('[data-liiga-retry]');
  const seasonTarget = root.querySelector<HTMLElement>('[data-liiga-season]');
  const statusTarget = root.querySelector<HTMLElement>('[data-liiga-status]');

  if (!errorTarget || !retry || !seasonTarget || !statusTarget) return;

  let refreshTimer = 0;

  const scheduleRefresh = (isLive: boolean) => {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(
      () => void load(),
      isLive ? LIVE_REFRESH_INTERVAL_MS : REFRESH_INTERVAL_MS,
    );
  };

  const load = async () => {
    root.setAttribute('aria-busy', 'true');
    errorTarget.hidden = true;
    statusTarget.textContent = 'LOADING / LIIGA';
    let hasLiveGame = false;

    try {
      const response = await fetch(`/api/current/liiga?_=${Date.now()}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Liiga request failed: ${response.status}`);

      const data = (await response.json()) as LiigaResponse;
      if (!Array.isArray(data.standings)) throw new Error('Invalid Liiga standings');

      hasLiveGame = Boolean(data.liveIlvesGame);
      seasonTarget.textContent = formatSeason(data.season);
      renderStandings(root, data.standings);
      renderIlvesStanding(root, data.ilvesStanding);
      renderLastGame(root, data.lastIlvesGame);
      renderNextGame(root, data.nextIlvesGame, data.nextHomeIlvesGame);
      renderLiveGame(root, data.liveIlvesGame);
      statusTarget.textContent = hasLiveGame ? 'LIVE / ILVES' : 'LIVE / LIIGA';

      window.dispatchEvent(
        new CustomEvent('current:data-updated', {
          detail: { source: 'liiga', at: data.generatedAt ?? new Date().toISOString() },
        })
      );
    } catch {
      errorTarget.hidden = false;
      statusTarget.textContent = 'UNAVAILABLE';
    } finally {
      root.setAttribute('aria-busy', 'false');
      scheduleRefresh(hasLiveGame);
    }
  };

  retry.addEventListener('click', () => {
    window.clearTimeout(refreshTimer);
    void load();
  });
  void load();

  window.addEventListener(
    'pagehide',
    () => {
      window.clearTimeout(refreshTimer);
    },
    { once: true }
  );
};
