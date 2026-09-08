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

type LiigaLastGame = {
  start: string;
  homeTeamId: string;
  homeTeam: string;
  awayTeamId: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  ilvesResult: 'W' | 'L' | 'T';
  finish: 'REGULATION' | 'OVERTIME' | 'SHOOTOUT';
};

type LiigaResponse = {
  season: number;
  generatedAt?: string;
  standings: LiigaStanding[];
  lastIlvesGame: LiigaLastGame | null;
};

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
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

const finishLabel = (finish: LiigaLastGame['finish']) => {
  if (finish === 'OVERTIME') return 'OT';
  if (finish === 'SHOOTOUT') return 'SO';
  return 'REG';
};

const cloneTeamMark = (root: HTMLElement, teamId: string, target: HTMLElement | null) => {
  if (!target) return;
  const source = root.querySelector<HTMLElement>(`[data-liiga-club-mark="${teamId}"]`);
  const mark = source?.querySelector('svg');
  target.replaceChildren();
  if (mark) target.append(mark.cloneNode(true));
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
  const empty = root.querySelector<HTMLElement>('[data-liiga-last-empty]');
  const panel = root.querySelector<HTMLElement>('[data-liiga-last-game]');
  if (!panel || !empty) return;

  if (!game) {
    panel.hidden = true;
    empty.hidden = false;
    return;
  }

  panel.hidden = false;
  empty.hidden = true;

  root.querySelector<HTMLElement>('[data-liiga-last-date]')!.textContent = formatGameDate(game.start);
  root.querySelector<HTMLElement>('[data-liiga-last-result]')!.textContent =
    game.ilvesResult === 'W' ? 'ILVES WIN' : game.ilvesResult === 'L' ? 'ILVES LOSS' : 'DRAW';
  root.querySelector<HTMLElement>('[data-liiga-last-finish]')!.textContent = finishLabel(game.finish);
  root.querySelector<HTMLElement>('[data-liiga-last-home-name]')!.textContent = game.homeTeam;
  root.querySelector<HTMLElement>('[data-liiga-last-away-name]')!.textContent = game.awayTeam;
  root.querySelector<HTMLElement>('[data-liiga-last-home-score]')!.textContent = String(game.homeGoals);
  root.querySelector<HTMLElement>('[data-liiga-last-away-score]')!.textContent = String(game.awayGoals);

  cloneTeamMark(root, game.homeTeamId, root.querySelector<HTMLElement>('[data-liiga-last-home-mark]'));
  cloneTeamMark(root, game.awayTeamId, root.querySelector<HTMLElement>('[data-liiga-last-away-mark]'));
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

  const load = async () => {
    root.setAttribute('aria-busy', 'true');
    errorTarget.hidden = true;
    statusTarget.textContent = 'LOADING / LIIGA';

    try {
      const response = await fetch(`/api/current/liiga?_=${Date.now()}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Liiga request failed: ${response.status}`);

      const data = (await response.json()) as LiigaResponse;
      if (!Array.isArray(data.standings)) throw new Error('Invalid Liiga standings');

      seasonTarget.textContent = formatSeason(data.season);
      renderStandings(root, data.standings);
      renderLastGame(root, data.lastIlvesGame);
      statusTarget.textContent = 'LIVE / LIIGA';

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
    }
  };

  retry.addEventListener('click', () => void load());
  void load();

  refreshTimer = window.setInterval(() => void load(), REFRESH_INTERVAL_MS);
  window.addEventListener(
    'pagehide',
    () => {
      window.clearInterval(refreshTimer);
    },
    { once: true }
  );
};
