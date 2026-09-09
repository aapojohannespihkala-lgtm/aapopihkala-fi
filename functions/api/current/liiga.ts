import { LIIGA_TEAMS, getLiigaTeamBySourceId } from '../../../src/config/liigaTeams';

type LiigaGameTeam = {
  teamId?: string | null;
  goals?: number | null;
};

type LiigaGame = {
  id?: number | string | null;
  start?: string | null;
  homeTeam?: LiigaGameTeam | null;
  awayTeam?: LiigaGameTeam | null;
  finishedType?: string | null;
  started?: boolean | null;
  ended?: boolean | null;
  gameTime?: number | null;
  cacheUpdateDate?: string | null;
};

type TeamStanding = {
  id: string;
  name: string;
  abbreviation: string;
  games: number;
  wins: number;
  ties: number;
  losses: number;
  bonusPoints: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
};

const LIIGA_GAMES_URLS = [
  'https://liiga.fi/api/v2/games',
  'https://liiga.fi/api/v2/schedule',
] as const;
const UPSTREAM_TIMEOUT_MS = 8_000;

const getSeasonId = (now = new Date()) => {
  const helsinki = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    timeZone: 'Europe/Helsinki',
  }).formatToParts(now);

  const year = Number(helsinki.find((part) => part.type === 'year')?.value ?? now.getUTCFullYear());
  const month = Number(helsinki.find((part) => part.type === 'month')?.value ?? now.getUTCMonth() + 1);
  return month >= 7 ? year + 1 : year;
};

const fetchWithTimeout = async (url: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    return await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'aapopihkala.fi Current Liiga',
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const firstString = (...values: unknown[]) => {
  const value = values.find((candidate) => typeof candidate === 'string' && candidate.length > 0);
  return typeof value === 'string' ? value : null;
};

const finiteNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const finiteGoal = (value: unknown) => finiteNumber(value);

const normalizeTeam = (
  value: unknown,
  fallbackId: unknown,
  fallbackGoals: unknown,
): LiigaGameTeam | null => {
  const team = asRecord(value);
  const sourceId = firstString(
    team?.teamId,
    team?.id,
    team?.name,
    team?.abbreviation,
    typeof value === 'string' ? value : null,
    fallbackId,
  );
  const goals = finiteGoal(team?.goals ?? team?.score ?? fallbackGoals);

  if (!sourceId && goals === null) return null;
  return { teamId: sourceId, goals };
};

const normalizeGame = (value: unknown): LiigaGame | null => {
  const game = asRecord(value);
  if (!game) return null;

  const homeTeam = normalizeTeam(
    game.homeTeam ?? game.home,
    game.homeTeamId ?? game.homeId,
    game.homeGoals ?? game.homeScore,
  );
  const awayTeam = normalizeTeam(
    game.awayTeam ?? game.away,
    game.awayTeamId ?? game.awayId,
    game.awayGoals ?? game.awayScore,
  );
  if (!homeTeam?.teamId || !awayTeam?.teamId) return null;

  const status = firstString(game.finishedType, game.status, game.gameStatus) ?? '';
  const normalizedStatus = status.toUpperCase();
  const ended = typeof game.ended === 'boolean'
    ? game.ended
    : normalizedStatus.includes('ENDED') ||
      normalizedStatus.includes('FINISHED') ||
      normalizedStatus.includes('FINAL');

  return {
    id: typeof game.id === 'number' || typeof game.id === 'string'
      ? game.id
      : typeof game.gameId === 'number' || typeof game.gameId === 'string'
        ? game.gameId
        : null,
    start: firstString(game.start, game.startTime, game.date, game.gameDate),
    homeTeam,
    awayTeam,
    finishedType: status || null,
    started: typeof game.started === 'boolean' ? game.started : null,
    ended,
    gameTime: finiteNumber(game.gameTime),
    cacheUpdateDate: firstString(game.cacheUpdateDate, game.updatedAt, game.modifiedAt),
  };
};

const extractGameArray = (payload: unknown): unknown[] | null => {
  if (Array.isArray(payload)) return payload;

  const root = asRecord(payload);
  if (!root) return null;

  for (const key of ['games', 'schedule', 'items', 'rows']) {
    if (Array.isArray(root[key])) return root[key] as unknown[];
  }

  const data = asRecord(root.data);
  if (!data) return null;

  for (const key of ['games', 'schedule', 'items', 'rows']) {
    if (Array.isArray(data[key])) return data[key] as unknown[];
  }

  return null;
};

const parseGames = (payload: unknown) => {
  const items = extractGameArray(payload);
  if (!items) return null;

  const games = items
    .map(normalizeGame)
    .filter((game): game is LiigaGame => game !== null);

  return games.length > 0 ? games : null;
};

const fetchLiigaGames = async (season: number) => {
  const failures: string[] = [];

  for (const endpoint of LIIGA_GAMES_URLS) {
    const url = new URL(endpoint);
    url.searchParams.set('tournament', 'runkosarja');
    url.searchParams.set('season', String(season));

    try {
      const response = await fetchWithTimeout(url.toString());
      if (!response.ok) {
        failures.push(`${url.pathname}: HTTP ${response.status}`);
        continue;
      }

      const games = parseGames(await response.json());
      if (!games) {
        failures.push(`${url.pathname}: no games in response`);
        continue;
      }

      return { games, endpoint: url.pathname };
    } catch (error) {
      failures.push(
        `${url.pathname}: ${error instanceof Error && error.name === 'AbortError' ? 'timeout' : 'request failed'}`
      );
    }
  }

  throw new Error(failures.join(' | ') || 'Liiga upstream unavailable');
};

const finishedInRegulation = (game: LiigaGame) => {
  const finishedType = game.finishedType?.toUpperCase() ?? '';
  if (finishedType.includes('REGULAR')) return true;
  if (finishedType.includes('OVERTIME') || finishedType.includes('SHOOTOUT')) return false;

  return typeof game.gameTime === 'number' && game.gameTime <= 3_600;
};

const createStandings = (games: LiigaGame[]) => {
  const standings = new Map<string, TeamStanding>(
    LIIGA_TEAMS.map((team) => [
      team.id,
      {
        id: team.id,
        name: team.name,
        abbreviation: team.abbreviation,
        games: 0,
        wins: 0,
        ties: 0,
        losses: 0,
        bonusPoints: 0,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
      },
    ])
  );

  for (const game of games) {
    if (game.ended !== true) continue;

    const home = game.homeTeam?.teamId ? getLiigaTeamBySourceId(game.homeTeam.teamId) : null;
    const away = game.awayTeam?.teamId ? getLiigaTeamBySourceId(game.awayTeam.teamId) : null;
    const homeGoals = finiteGoal(game.homeTeam?.goals);
    const awayGoals = finiteGoal(game.awayTeam?.goals);

    if (!home || !away || homeGoals === null || awayGoals === null || homeGoals === awayGoals) continue;

    const homeStanding = standings.get(home.id);
    const awayStanding = standings.get(away.id);
    if (!homeStanding || !awayStanding) continue;

    homeStanding.games += 1;
    awayStanding.games += 1;
    homeStanding.goalsFor += homeGoals;
    homeStanding.goalsAgainst += awayGoals;
    awayStanding.goalsFor += awayGoals;
    awayStanding.goalsAgainst += homeGoals;

    const homeWon = homeGoals > awayGoals;
    const winner = homeWon ? homeStanding : awayStanding;
    const loser = homeWon ? awayStanding : homeStanding;

    if (finishedInRegulation(game)) {
      winner.wins += 1;
      loser.losses += 1;
      winner.points += 3;
    } else {
      winner.ties += 1;
      loser.ties += 1;
      winner.bonusPoints += 1;
      winner.points += 2;
      loser.points += 1;
    }
  }

  return [...standings.values()]
    .map((team) => ({
      ...team,
      goalDifference: team.goalsFor - team.goalsAgainst,
    }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.wins - a.wins ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.name.localeCompare(b.name, 'fi')
    )
    .map((team, index) => ({ ...team, rank: index + 1 }));
};

const getLastIlvesGame = (games: LiigaGame[]) => {
  const candidates = games
    .filter((game) => {
      if (game.ended !== true || !game.start) return false;
      const home = game.homeTeam?.teamId ? getLiigaTeamBySourceId(game.homeTeam.teamId) : null;
      const away = game.awayTeam?.teamId ? getLiigaTeamBySourceId(game.awayTeam.teamId) : null;
      return home?.id === 'ilves' || away?.id === 'ilves';
    })
    .sort((a, b) => String(b.start).localeCompare(String(a.start)));

  const game = candidates[0];
  if (!game?.start) return null;

  const home = game.homeTeam?.teamId ? getLiigaTeamBySourceId(game.homeTeam.teamId) : null;
  const away = game.awayTeam?.teamId ? getLiigaTeamBySourceId(game.awayTeam.teamId) : null;
  const homeGoals = finiteGoal(game.homeTeam?.goals);
  const awayGoals = finiteGoal(game.awayTeam?.goals);

  if (!home || !away || homeGoals === null || awayGoals === null) return null;

  const ilvesGoals = home.id === 'ilves' ? homeGoals : awayGoals;
  const opponentGoals = home.id === 'ilves' ? awayGoals : homeGoals;
  const finishedType = game.finishedType?.toUpperCase() ?? '';

  return {
    id: game.id ?? null,
    start: game.start,
    homeTeamId: home.id,
    homeTeam: home.name,
    awayTeamId: away.id,
    awayTeam: away.name,
    homeGoals,
    awayGoals,
    ilvesResult: ilvesGoals > opponentGoals ? 'W' : ilvesGoals < opponentGoals ? 'L' : 'T',
    finish:
      finishedType.includes('SHOOTOUT')
        ? 'SHOOTOUT'
        : finishedType.includes('OVERTIME')
          ? 'OVERTIME'
          : 'REGULATION',
  };
};

export const onRequestGet = async () => {
  const season = getSeasonId();

  try {
    const { games, endpoint } = await fetchLiigaGames(season);
    const generatedAt =
      games
        .map((game) => game.cacheUpdateDate)
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
        .sort()
        .at(-1) ?? new Date().toISOString();

    return Response.json(
      {
        season,
        generatedAt,
        source: 'Liiga',
        upstream: endpoint,
        standings: createStandings(games),
        lastIlvesGame: getLastIlvesGame(games),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=180',
        },
      }
    );
  } catch (error) {
    return Response.json(
      {
        error: 'Liiga data request failed',
        detail: error instanceof Error ? error.message : 'Unknown upstream error',
      },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
};
