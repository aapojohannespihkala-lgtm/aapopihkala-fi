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

const LIIGA_GAMES_URL = 'https://liiga.fi/api/v1/games';
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

const finiteGoal = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

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
  const url = new URL(LIIGA_GAMES_URL);
  url.searchParams.set('tournament', 'runkosarja');
  url.searchParams.set('season', String(season));

  try {
    const response = await fetchWithTimeout(url.toString());
    if (!response.ok) {
      return Response.json(
        { error: 'Liiga upstream unavailable', status: response.status },
        { status: 502, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      return Response.json(
        { error: 'Liiga upstream response was not an array' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const games = payload as LiigaGame[];
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
        error: error instanceof Error && error.name === 'AbortError'
          ? 'Liiga upstream timed out'
          : 'Liiga data request failed',
      },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
};
