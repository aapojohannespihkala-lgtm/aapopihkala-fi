import type {
  NewsCategory,
  NewsKind,
  NewsLanguage,
  NewsLocality,
} from '../../../src/features/current/newsPreferences';

type Feed = {
  id: string;
  sourceId: string;
  source: string;
  url: string;
  host: string;
  language: NewsLanguage;
  locality: NewsLocality;
  category: NewsCategory;
  kind: NewsKind;
  score: number;
  tags: string[];
};

type Entry = {
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  categories: string[];
};

type Item = Entry & {
  id: string;
  language: NewsLanguage;
  source: string;
  sourceId: string;
  category: NewsCategory;
  locality: NewsLocality;
  tags: string[];
  kind: NewsKind;
  baseScore: number;
};

type SourceStatus = { id: string; name: string; status: 'ok' | 'partial' | 'error'; count: number };

const FEEDS: Feed[] = [
  {
    id: 'soundi', sourceId: 'soundi', source: 'Soundi', url: 'https://www.soundi.fi/feed',
    host: 'soundi.fi', language: 'fi', locality: 'finland', category: 'music', kind: 'news',
    score: 0.86, tags: ['finnish-music'],
  },
  {
    id: 'pelaaja', sourceId: 'pelaaja', source: 'Pelaaja', url: 'https://www.pelaaja.fi/feed/',
    host: 'pelaaja.fi', language: 'fi', locality: 'finland', category: 'games', kind: 'news',
    score: 0.92, tags: ['games', 'finnish-games'],
  },
  {
    id: 'muropaketti-games', sourceId: 'muropaketti-games', source: 'Muropaketti',
    url: 'https://muropaketti.com/pelit/feed', host: 'muropaketti.com', language: 'fi',
    locality: 'finland', category: 'games', kind: 'news', score: 0.82,
    tags: ['games', 'finnish-games'],
  },
  {
    id: 'muropaketti-films', sourceId: 'muropaketti-films', source: 'Muropaketti',
    url: 'https://muropaketti.com/elokuvat/feed', host: 'muropaketti.com', language: 'fi',
    locality: 'finland', category: 'film', kind: 'news', score: 0.78,
    tags: ['film', 'finnish-film-source'],
  },
  {
    id: 'episodi', sourceId: 'episodi', source: 'Episodi', url: 'https://www.episodi.fi/feed/',
    host: 'episodi.fi', language: 'fi', locality: 'finland', category: 'film', kind: 'news',
    score: 0.66, tags: ['film', 'finnish-film-source'],
  },
  {
    id: 'inferno', sourceId: 'inferno', source: 'Inferno', url: 'https://www.inferno.fi/feed',
    host: 'inferno.fi', language: 'fi', locality: 'finland', category: 'music', kind: 'news',
    score: 0.91, tags: ['metal', 'finnish-metal'],
  },
  {
    id: 'kulttuuritoimitus', sourceId: 'kulttuuritoimitus', source: 'Kulttuuritoimitus',
    url: 'https://kulttuuritoimitus.fi/feed', host: 'kulttuuritoimitus.fi', language: 'fi',
    locality: 'finland', category: 'culture', kind: 'news', score: 0.94,
    tags: ['finnish-culture'],
  },
  {
    id: 'pitchfork-news', sourceId: 'pitchfork', source: 'Pitchfork',
    url: 'https://pitchfork.com/feed/feed-news/rss', host: 'pitchfork.com', language: 'en',
    locality: 'international', category: 'music', kind: 'news', score: 0.82, tags: ['music-news'],
  },
  {
    id: 'pitchfork-albums', sourceId: 'pitchfork', source: 'Pitchfork',
    url: 'https://pitchfork.com/feed/reviews/best/albums/rss', host: 'pitchfork.com', language: 'en',
    locality: 'international', category: 'music', kind: 'review', score: 0.94,
    tags: ['album', 'best-new-music'],
  },
  {
    id: 'pitchfork-reissues', sourceId: 'pitchfork', source: 'Pitchfork',
    url: 'https://pitchfork.com/feed/reviews/best/reissues/rss', host: 'pitchfork.com', language: 'en',
    locality: 'international', category: 'music', kind: 'reissue', score: 1.02,
    tags: ['reissue', 'archive', 'best-new-music'],
  },
  {
    id: 'quietus', sourceId: 'quietus', source: 'The Quietus', url: 'https://thequietus.com/feed/',
    host: 'thequietus.com', language: 'en', locality: 'international', category: 'music', kind: 'news',
    score: 0.93, tags: ['experimental'],
  },
  {
    id: 'angry-metal-guy', sourceId: 'angry-metal-guy', source: 'Angry Metal Guy',
    url: 'https://www.angrymetalguy.com/feed/', host: 'angrymetalguy.com', language: 'en',
    locality: 'international', category: 'music', kind: 'review', score: 0.98,
    tags: ['metal', 'metal-review'],
  },
  {
    id: 'comics-journal', sourceId: 'comics-journal', source: 'The Comics Journal',
    url: 'https://www.tcj.com/feed/', host: 'tcj.com', language: 'en', locality: 'international',
    category: 'comics', kind: 'news', score: 0.91, tags: ['comics', 'independent'],
  },
];

const MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const MAX_PER_FEED = 16;
const MAX_PER_SOURCE = 14;
const MAX_ITEMS = 48;
const MAX_SUMMARY_LENGTH = 190;

const entities: Record<string, string> = {
  amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"', hellip: '…',
  ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', mdash: '—', ndash: '–',
};

const decode = (value: string) => value.replace(
  /&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi,
  (match, entity: string) => {
    if (entity.startsWith('#x')) return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    if (entity.startsWith('#')) return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    return entities[entity.toLowerCase()] ?? match;
  }
);

const text = (value: string) => decode(
  value.replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/i, '$1').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
);

const tag = (block: string, name: string) => {
  const safe = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = block.match(new RegExp(`<${safe}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${safe}>`, 'i'));
  return match ? text(match[1]) : '';
};

const tags = (block: string, name: string) => {
  const safe = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...block.matchAll(new RegExp(`<${safe}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${safe}>`, 'gi'))]
    .map((match) => text(match[1])).filter(Boolean);
};

const cleanSummary = (value: string, title: string) => {
  let result = value
    .replace(/\s+The post\s+[\s\S]*$/i, '')
    .replace(/\s+(?:Continue reading|Read more|Lue lisää)(?:\s|$)[\s\S]*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!result) return '';

  const normalizedTitle = title.toLocaleLowerCase('en-US').replace(/\s+/g, ' ').trim();
  const normalizedResult = result.toLocaleLowerCase('en-US');
  if (normalizedResult.startsWith(normalizedTitle)) {
    result = result.slice(title.length).replace(/^[\s:–—-]+/, '').trim();
  }

  if (result.length <= MAX_SUMMARY_LENGTH) return result;
  const clipped = result.slice(0, MAX_SUMMARY_LENGTH - 1);
  const boundary = clipped.lastIndexOf(' ');
  const end = boundary >= 110 ? boundary : clipped.length;
  return `${clipped.slice(0, end).trimEnd()}…`;
};

const cleanUrl = (raw: string, host: string) => {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    const hostname = url.hostname.toLowerCase();
    if (hostname !== host && !hostname.endsWith(`.${host}`)) return null;
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith('utm_') || key === 'source' || key === 'output') url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return null;
  }
};

const cleanDate = (raw: string) => {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  const age = Date.now() - date.getTime();
  if (age > MAX_AGE || age < -24 * 60 * 60 * 1000) return null;
  return date.toISOString();
};

const parse = (xml: string, feed: Feed): Entry[] =>
  (xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) ?? [])
    .map((block) => {
      const title = tag(block, 'title');
      const url = cleanUrl(tag(block, 'link'), feed.host);
      const publishedAt = cleanDate(tag(block, 'pubDate') || tag(block, 'dc:date'));
      const summary = cleanSummary(tag(block, 'description') || tag(block, 'content:encoded'), title);
      return title && url && publishedAt
        ? { title, summary, url, publishedAt, categories: tags(block, 'category') }
        : null;
    })
    .filter((entry): entry is Entry => Boolean(entry))
    .slice(0, MAX_PER_FEED);

const haystack = (entry: Entry) => `${entry.title} ${entry.categories.join(' ')}`.toLocaleLowerCase('en-US');
const tagHaystack = (entry: Entry) => `${haystack(entry)} ${entry.summary.toLocaleLowerCase('en-US')}`;

const categoryFor = (feed: Feed, entry: Entry): NewsCategory => {
  if (feed.sourceId === 'comics-journal') return 'comics';
  if (feed.sourceId === 'pelaaja' || feed.sourceId === 'muropaketti-games') return 'games';
  if (feed.sourceId === 'muropaketti-films' || feed.sourceId === 'episodi') return 'film';
  if (feed.sourceId === 'inferno' || feed.sourceId === 'angry-metal-guy') return 'music';
  const value = haystack(entry);
  if (/\b(elokuva|film|cinema|movie)\b/.test(value)) return 'film';
  if (/\b(arkkitehtuuri|architecture|urbanism|kaupunkisuunnittelu)\b/.test(value)) return 'architecture';
  if (/\b(muotoilu|design|illustration)\b/.test(value)) return 'design';
  if (/\b(kirja|kirjallisuus|literature|book)\b/.test(value)) return 'books';
  if (/\b(taide|art|gallery)\b/.test(value)) return 'art';
  if (/\b(game|gaming|peli|pelit)\b/.test(value)) return 'games';
  return feed.category;
};

const kindFor = (feed: Feed, entry: Entry): NewsKind => {
  const value = haystack(entry);
  if (/\b(haastattelu|interview|q&a)\b/.test(value)) return 'interview';
  if (/\b(arvio|review|reviews|criticism|levyarvio)\b/.test(value)) return 'review';
  if (/\b(reissue|reissues|uudelleenjulkaisu|deluxe edition)\b/.test(value)) return 'reissue';
  if (/\b(obituary|rip|dies|died|kuoli|on kuollut)\b/.test(value)) return 'obituary';
  if (/\b(retrospective|archive|archival|anniversary|arkisto)\b/.test(value)) return 'retrospective';
  if (/\b(exhibition|näyttely)\b/.test(value)) return 'exhibition';
  if (/\b(new album|debut album|uusi albumi|uuden albumin|julkaisee albumin|uusi levy|tuleva levy)\b/.test(value)) return 'release';
  return feed.kind;
};

const slug = (value: string) => value.toLocaleLowerCase('en-US').normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 42);

const keywordTags: Array<[string, RegExp]> = [
  ['reissue', /\b(reissue|uudelleenjulkaisu)\b/], ['archive', /\b(archive|archival|arkisto)\b/],
  ['ambient', /\bambient\b/], ['electronic', /\b(electronic|elektroninen)\b/],
  ['experimental', /\b(experimental|kokeellinen)\b/], ['jazz', /\bjazz\b/],
  ['post-punk', /\bpost[- ]punk\b/], ['punk', /\bpunk\b/],
  ['black-metal', /\bblack metal\b/], ['death-metal', /\bdeath metal\b/],
  ['doom-metal', /\bdoom metal\b/], ['progressive-metal', /\bprogressive metal\b/],
  ['post-metal', /\bpost[- ]metal\b/], ['folk-metal', /\bfolk metal\b/],
  ['melodic-death-metal', /\bmelodic death metal\b/], ['thrash-metal', /\bthrash metal\b/],
  ['power-metal', /\bpower metal\b/], ['metalcore', /\bmetalcore\b/],
  ['metal', /\b(metal|metalli)\b/],
  ['gta', /\b(gta(?:\s*(?:6|vi))?|grand theft auto)\b/], ['remedy', /\bremedy\b/],
  ['playstation', /\b(playstation|ps[456])\b/], ['xbox', /\bxbox\b/], ['nintendo', /\bnintendo\b/],
  ['indie-games', /\b(indie games?|indiepelit?|indiepeli)\b/], ['retro-games', /\b(retro games?|retropelit?|retropeli)\b/],
  ['game-design', /\b(game design|gameplay design|pelisuunnittelu)\b/],
  ['game-preservation', /\b(game preservation|pelihistoria|pelien säilyttäminen)\b/],
  ['restoration', /\b(restoration|restored|restaurointi|restauroitu)\b/],
  ['film-history', /\b(film history|cinema history|elokuvahistoria)\b/],
  ['film-festival', /\b(film festival|cannes|venice film festival|sundance)\b|elokuvafestivaali/u],
  ['horror', /\b(horror|kauhu)\b/], ['sci-fi', /\b(sci[- ]?fi|science fiction|tieteiselokuva)\b/],
  ['animation', /\b(animation|animaatio|anime)\b/], ['streaming', /(?:^|[^\p{L}\p{N}])(?:netflix(?:istä|ista|issä|issa|iin|in)?|hbo max|prime video|disney\+|suoratoisto)(?=$|[^\p{L}\p{N}])/u],
  ['director', /\b(director|ohjaaja|ohjaajan)\b/], ['album', /\b(album|levy|levyn)\b/],
];

const scoreBoost: Record<NewsKind, number> = {
  discovery: 0.08, exhibition: 0.12, interview: 0.16, news: 0, obituary: 0.1,
  release: 0.08, reissue: 0.18, retrospective: 0.18, review: 0.15,
};

const buildTags = (feed: Feed, entry: Entry, category: NewsCategory, kind: NewsKind) => {
  const result = new Set([...feed.tags, category, kind]);
  if (feed.locality === 'finland') result.add('finnish');
  for (const value of entry.categories.slice(0, 6)) {
    const normalized = slug(value);
    if (normalized.length >= 2) result.add(normalized);
  }
  const value = tagHaystack(entry);
  for (const [name, pattern] of keywordTags) if (pattern.test(value)) result.add(name);
  return [...result].slice(0, 16);
};

const noise = (feed: Feed, entry: Entry) => {
  const value = `${entry.title} ${entry.summary}`.toLocaleLowerCase('fi-FI');
  let penalty = [
    /\bkatso video\b/, /\bmusiikkivideo\b/, /\bkiertue\b/, /\bkeikalle\b/,
    /\btour dates?\b/, /\bshares? new video\b/,
  ].filter((pattern) => pattern.test(value)).length * 0.08;

  if (feed.sourceId === 'episodi') {
    penalty += [
      /tänään tv:ssä/, /illalla tv:ssä/, /poistuu netflixistä/,
      /\bnetflixistä poistuu\b/, /\bilmaiskatselussa\b/, /\bnyt katsottavissa\b/,
      /\brotten tomatoes\b/, /\bimdb\b/,
    ].filter((pattern) => pattern.test(value)).length * 0.12;
  }

  return Math.min(0.48, penalty);
};

const hash = (value: string) => {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(36);
};

const toItem = (feed: Feed, entry: Entry): Item => {
  const category = categoryFor(feed, entry);
  const kind = kindFor(feed, entry);
  return {
    ...entry,
    id: `${feed.sourceId}-${hash(entry.url)}`,
    language: feed.language,
    source: feed.source,
    sourceId: feed.sourceId,
    category,
    locality: feed.locality,
    tags: buildTags(feed, entry, category, kind),
    kind,
    baseScore: Math.max(0.35, Math.min(1.25, feed.score + scoreBoost[kind] - noise(feed, entry))),
  };
};

const titleWords = (title: string) => new Set(title.toLocaleLowerCase('en-US').normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '').split(/[^\p{L}\p{N}]+/u)
  .filter((word) => word.length >= 3 && !['the', 'and', 'for', 'from', 'with', 'uusi', 'uutta', 'uuden', 'ja'].includes(word)));

const nearDuplicate = (left: Item, right: Item) => {
  if (left.category !== right.category) return false;
  const a = titleWords(left.title);
  const b = titleWords(right.title);
  if (a.size < 4 || b.size < 4) return false;
  let overlap = 0;
  for (const word of a) if (b.has(word)) overlap += 1;
  return overlap / Math.min(a.size, b.size) >= 0.76;
};

const dedupe = (items: Item[]) => {
  const selected: Item[] = [];
  const urls = new Set<string>();
  const titles = new Set<string>();
  for (const item of [...items].sort((a, b) => b.baseScore - a.baseScore)) {
    const normalized = item.title.toLocaleLowerCase('en-US').replace(/\s+/g, ' ').trim();
    if (urls.has(item.url) || titles.has(normalized) || selected.some((other) => nearDuplicate(other, item))) continue;
    urls.add(item.url); titles.add(normalized); selected.push(item);
  }
  return selected;
};

const balance = (items: Item[]) => {
  const groups = new Map<string, Item[]>();
  for (const item of items) groups.set(item.sourceId, [...(groups.get(item.sourceId) ?? []), item]);
  return [...groups.values()].flatMap((group) => group
    .sort((a, b) => b.baseScore - a.baseScore || Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, MAX_PER_SOURCE))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || b.baseScore - a.baseScore)
    .slice(0, MAX_ITEMS);
};

const fetchFeed = async (feed: Feed) => {
  const response = await fetch(feed.url, {
    headers: {
      Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.5',
      'User-Agent': 'aapopihkala.fi Current News/1.0',
    },
  });
  if (!response.ok) throw new Error(`${feed.id}:${response.status}`);
  const xml = await response.text();
  if (!/<rss\b/i.test(xml)) throw new Error(`${feed.id}:invalid-feed`);
  return parse(xml, feed).map((entry) => toItem(feed, entry));
};

const statuses = (results: PromiseSettledResult<Item[]>[]): SourceStatus[] => {
  const grouped = new Map<string, { id: string; name: string; feeds: number; failed: number; count: number }>();
  FEEDS.forEach((feed, index) => {
    const current = grouped.get(feed.sourceId) ?? { id: feed.sourceId, name: feed.source, feeds: 0, failed: 0, count: 0 };
    current.feeds += 1;
    const result = results[index];
    if (result.status === 'fulfilled') current.count += result.value.length;
    else current.failed += 1;
    grouped.set(feed.sourceId, current);
  });
  return [...grouped.values()].map((source) => ({
    id: source.id,
    name: source.name,
    status: source.count === 0 ? 'error' : source.failed > 0 ? 'partial' : 'ok',
    count: source.count,
  }));
};

export const onRequestGet = async () => {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const sources = statuses(results);
  const items = balance(dedupe(results.flatMap((result) => result.status === 'fulfilled' ? result.value : [])));
  const generatedAt = new Date().toISOString();

  if (items.length < 3) {
    return new Response(JSON.stringify({ error: 'news_feed_unavailable', generatedAt, sources }), {
      status: 502,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  return new Response(JSON.stringify({ generatedAt, items, sources }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=900, s-maxage=900, stale-while-revalidate=3600',
    },
  });
};