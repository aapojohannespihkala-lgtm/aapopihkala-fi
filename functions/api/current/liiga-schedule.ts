import { getLiigaTeamBySourceId } from '../../../src/config/liigaTeams';

type UpstreamTeam = {
  teamId?: string | null;
  goals?: number | null;
};

type UpstreamGame = {
  id?: number | string | null;
  start?: string | null;
  homeTeam?: UpstreamTeam | null;
  awayTeam?: UpstreamTeam | null;
  finishedType?: string | null;
  started?: boolean | null;
  ended?: boolean | null;
  gameTime?: number | null;
  cacheUpdateDate?: string | null;
};

type ScheduleGame = {
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

const LIIGA_GAMES_URLS = [
  'https://liiga.fi/api/v2/games',
  'https://liiga.fi/api/v2/schedule',
] as const;
const UPSTREAM_TIMEOUT_MS = 8_000;
const UPCOMING_LIMIT = 12;
const MAX_LIVE_DURATION_MS = 4 * 60 * 60 * 1000;

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

const fetchJsonWithTimeout = async (
  url: string,
  timeoutMs = UPSTREAM_TIMEOUT_MS,
  fetchImpl: typeof fetch = fetch,
) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'aapopihkala.fi Current Liiga schedule',
      },
      signal: controller.signal,
    });

    if (!response.ok) return { response, payload: null };
    const payload: unknown = await response.json();
    return { response, payload };
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

const normalizeTeam = (value: unknown, fallbackId: unknown, fallbackGoals: unknown): UpstreamTeam | null => {
  const team = asRecord(value);
  const sourceId = firstString(
    team?.teamId,
    team?.id,
    team?.name,
    team?.abbreviation,
    typeof value === 'string' ? value : null,
    fallbackId,
  );
  const goals = finiteNumber(team?.goals ?? team?.score ?? fallbackGoals);
  if (!sourceId && goals === null) return null;
  return { teamId: sourceId, goals };
};

const normalizeGame = (value: unknown): UpstreamGame | null => {
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
  const gameTime = finiteNumber(game.gameTime);
  const ended = typeof game.ended === 'boolean'
    ? game.ended
    : normalizedStatus.includes('ENDED') || normalizedStatus.includes('FINISHED') || normalizedStatus.includes('FINAL');
  const started = typeof game.started === 'boolean'
    ? game.started
    : ended ||
      normalizedStatus.includes('STARTED') ||
      normalizedStatus.includes('LIVE') ||
      normalizedStatus.includes('PLAYING') ||
      (gameTime !== null && gameTime > 0);

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
    started,
    ended,
    gameTime,
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
  const games = items.map(normalizeGame).filter((game): game is UpstreamGame => game !== null);
  return games.length > 0 ? games : null;
};

const fetchLiigaGames = async (
  season: number,
  upstreamTimeoutMs = UPSTREAM_TIMEOUT_MS,
  fetchImpl: typeof fetch = fetch,
) => {
  const failures: string[] = [];

  for (const endpoint of LIIGA_GAMES_URLS) {
    const url = new URL(endpoint);
    url.searchParams.set('tournament', 'runkosarja');
    url.searchParams.set('season', String(season));

    try {
      const { response, payload } = await fetchJsonWithTimeout(
        url.toString(),
        upstreamTimeoutMs,
        fetchImpl,
      );
      if (!response.ok) {
        failures.push(`${url.pathname}: HTTP ${response.status}`);
        continue;
      }
      const games = parseGames(payload);
      if (!games) {
        failures.push(`${url.pathname}: no games in response`);
        continue;
      }
      return { games, endpoint: url.pathname };
    } catch (error) {
      failures.push(`${url.pathname}: ${error instanceof Error && error.name === 'AbortError' ? 'timeout' : 'request failed'}`);
    }
  }

  throw new Error(failures.join(' | ') || 'Liiga upstream unavailable');
};

const summarizeGame = (game: UpstreamGame): ScheduleGame | null => {
  if (!game.start || !game.homeTeam?.teamId || !game.awayTeam?.teamId) return null;
  const home = getLiigaTeamBySourceId(game.homeTeam.teamId);
  const away = getLiigaTeamBySourceId(game.awayTeam.teamId);
  if (!home || !away) return null;

  return {
    id: game.id ?? null,
    start: game.start,
    homeTeamId: home.id,
    homeTeam: home.name,
    awayTeamId: away.id,
    awayTeam: away.name,
    homeGoals: finiteNumber(game.homeTeam.goals),
    awayGoals: finiteNumber(game.awayTeam.goals),
    gameTime: game.gameTime ?? null,
  };
};

export const isLiigaScheduleGameLive = (game: UpstreamGame, now = new Date()) => {
  if (game.ended === true || !game.start) return false;

  const start = Date.parse(game.start);
  if (!Number.isFinite(start)) return false;

  const nowMs = now.getTime();
  if (nowMs < start || nowMs > start + MAX_LIVE_DURATION_MS) return false;
  if (game.started === true) return true;
  if (typeof game.gameTime === 'number' && game.gameTime > 0) return true;
  return false;
};

const getLiveGames = (games: UpstreamGame[], now = new Date()) =>
  games
    .filter((game) => isLiigaScheduleGameLive(game, now))
    .map(summarizeGame)
    .filter((game): game is ScheduleGame => game !== null)
    .sort((a, b) => a.start.localeCompare(b.start));

const getUpcomingGames = (games: UpstreamGame[], now = new Date()) => {
  const nowMs = now.getTime();
  return games
    .filter((game) => {
      if (game.ended === true || isLiigaScheduleGameLive(game, now) || !game.start) return false;
      const start = Date.parse(game.start);
      return Number.isFinite(start) && start > nowMs;
    })
    .map(summarizeGame)
    .filter((game): game is ScheduleGame => game !== null)
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, UPCOMING_LIMIT);
};

export const fetchLiigaScheduleResponse = async (
  upstreamTimeoutMs = UPSTREAM_TIMEOUT_MS,
  fetchImpl: typeof fetch = fetch,
) => {
  const season = getSeasonId();
  try {
    const { games, endpoint } = await fetchLiigaGames(season, upstreamTimeoutMs, fetchImpl);
    const liveGames = getLiveGames(games);
    const upcomingGames = getUpcomingGames(games);
    const generatedAt = games
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
        liveGames,
        upcomingGames,
      },
      {
        headers: {
          'Cache-Control': liveGames.length > 0
            ? 'public, max-age=15, stale-while-revalidate=30'
            : 'public, max-age=60, stale-while-revalidate=120',
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        error: 'Liiga schedule request failed',
        detail: error instanceof Error ? error.message : 'Unknown upstream error',
      },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
};

export const onRequestGet = () => fetchLiigaScheduleResponse();
