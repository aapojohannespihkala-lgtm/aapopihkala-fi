export type LiigaTeam = {
  id: string;
  name: string;
  abbreviation: string;
  aliases: string[];
  markShape: 'circle' | 'diamond' | 'shield' | 'split' | 'ring' | 'bars';
};

export const LIIGA_TEAMS: LiigaTeam[] = [
  { id: 'hifk', name: 'HIFK', abbreviation: 'IFK', aliases: ['hifk'], markShape: 'shield' },
  { id: 'hpk', name: 'HPK', abbreviation: 'HPK', aliases: ['hpk'], markShape: 'diamond' },
  { id: 'ilves', name: 'Ilves', abbreviation: 'ILV', aliases: ['ilves'], markShape: 'ring' },
  { id: 'jokerit', name: 'Jokerit', abbreviation: 'JOK', aliases: ['jokerit'], markShape: 'split' },
  { id: 'jukurit', name: 'Jukurit', abbreviation: 'JUK', aliases: ['jukurit'], markShape: 'bars' },
  { id: 'jyp', name: 'JYP', abbreviation: 'JYP', aliases: ['jyp'], markShape: 'circle' },
  { id: 'kalpa', name: 'KalPa', abbreviation: 'KAL', aliases: ['kalpa'], markShape: 'shield' },
  { id: 'k-espoo', name: 'K-Espoo', abbreviation: 'KES', aliases: ['kespoo', 'kiekkoespoo'], markShape: 'diamond' },
  { id: 'kookoo', name: 'KooKoo', abbreviation: 'KOO', aliases: ['kookoo'], markShape: 'ring' },
  { id: 'karpat', name: 'Kärpät', abbreviation: 'KÄR', aliases: ['karpat'], markShape: 'split' },
  { id: 'lukko', name: 'Lukko', abbreviation: 'LUK', aliases: ['lukko'], markShape: 'bars' },
  { id: 'pelicans', name: 'Pelicans', abbreviation: 'PEL', aliases: ['pelicans'], markShape: 'circle' },
  { id: 'saipa', name: 'SaiPa', abbreviation: 'SAI', aliases: ['saipa'], markShape: 'shield' },
  { id: 'sport', name: 'Sport', abbreviation: 'SPO', aliases: ['sport', 'vaasansport'], markShape: 'diamond' },
  { id: 'tappara', name: 'Tappara', abbreviation: 'TAP', aliases: ['tappara'], markShape: 'ring' },
  { id: 'tps', name: 'TPS', abbreviation: 'TPS', aliases: ['tps'], markShape: 'split' },
  { id: 'assat', name: 'Ässät', abbreviation: 'ÄSS', aliases: ['assat'], markShape: 'bars' },
];

export const normalizeLiigaTeamKey = (value: string) =>
  value
    .split(':')
    .at(-1)
    ?.normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') ?? '';

const LIIGA_TEAM_BY_ALIAS = new Map(
  LIIGA_TEAMS.flatMap((team) => team.aliases.map((alias) => [alias, team] as const))
);

export const getLiigaTeamBySourceId = (value: string) =>
  LIIGA_TEAM_BY_ALIAS.get(normalizeLiigaTeamKey(value)) ?? null;

export const getLiigaTeamById = (id: string) =>
  LIIGA_TEAMS.find((team) => team.id === id) ?? null;
