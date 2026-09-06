import {
  applyNewsFeedback,
  createEmptyNewsPreferenceProfile,
  getNewsPreferenceSignals,
  selectDiverseNewsItems,
  type NewsFeedback,
  type NewsItem,
  type NewsPreferenceProfile,
} from './newsPreferences';

const NEWS_API_URL = '/api/current/news';
const PROFILE_KEY = 'current.news.profile.v1';
const DAILY_KEY = 'current.news.daily.v1';
const HELSINKI_TIME_ZONE = 'Europe/Helsinki';
const VISIBLE_COUNT = 3;
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

type DailyNewsState = {
  version: 1;
  date: string;
  visible: string[];
  seen: string[];
};

type NewsSourceStatus = {
  id: string;
  name: string;
  status: 'ok' | 'partial' | 'error';
  count: number;
};

type NewsApiResponse = {
  generatedAt: string;
  items: NewsItem[];
  sources: NewsSourceStatus[];
};

const dateKey = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: HELSINKI_TIME_ZONE,
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
};

const publishedFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  timeZone: HELSINKI_TIME_ZONE,
});

const readJson = (key: string): unknown => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeJson = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The feed remains usable when storage is blocked.
  }
};

const numberRecord = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1])
    )
  );
};

const readProfile = (): NewsPreferenceProfile => {
  const raw = readJson(PROFILE_KEY);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return createEmptyNewsPreferenceProfile();
  const candidate = raw as Partial<NewsPreferenceProfile>;
  const up = candidate.ratings?.up;
  const down = candidate.ratings?.down;
  if (candidate.version !== 1) return createEmptyNewsPreferenceProfile();

  return {
    version: 1,
    ratings: {
      up: typeof up === 'number' && Number.isFinite(up) ? up : 0,
      down: typeof down === 'number' && Number.isFinite(down) ? down : 0,
    },
    categories: numberRecord(candidate.categories),
    tags: numberRecord(candidate.tags),
    kinds: numberRecord(candidate.kinds),
    sources: numberRecord(candidate.sources),
    localities: numberRecord(candidate.localities),
  };
};

const validItem = (value: unknown): value is NewsItem => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const item = value as Partial<NewsItem>;
  if (
    typeof item.id !== 'string' || !item.id ||
    typeof item.title !== 'string' || !item.title ||
    (item.summary !== undefined && typeof item.summary !== 'string') ||
    typeof item.url !== 'string' ||
    typeof item.publishedAt !== 'string' || Number.isNaN(new Date(item.publishedAt).getTime()) ||
    typeof item.source !== 'string' || !item.source ||
    typeof item.sourceId !== 'string' || !item.sourceId ||
    typeof item.category !== 'string' || typeof item.locality !== 'string' ||
    typeof item.kind !== 'string' || (item.language !== 'fi' && item.language !== 'en') ||
    typeof item.baseScore !== 'number' || !Number.isFinite(item.baseScore) ||
    !Array.isArray(item.tags) || !item.tags.every((tag) => typeof tag === 'string')
  ) return false;

  try {
    const url = new URL(item.url);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

const parseResponse = (value: unknown): NewsApiResponse | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<NewsApiResponse>;
  if (
    typeof candidate.generatedAt !== 'string' ||
    Number.isNaN(new Date(candidate.generatedAt).getTime()) ||
    !Array.isArray(candidate.items) || !candidate.items.every(validItem) ||
    !Array.isArray(candidate.sources)
  ) return null;

  const sources = candidate.sources.filter((source): source is NewsSourceStatus =>
    Boolean(source) && typeof source === 'object' &&
    typeof source.id === 'string' && typeof source.name === 'string' &&
    (source.status === 'ok' || source.status === 'partial' || source.status === 'error') &&
    typeof source.count === 'number' && Number.isFinite(source.count)
  );
  if (sources.length !== candidate.sources.length) return null;

  return {
    generatedAt: candidate.generatedAt,
    items: [...new Map(candidate.items.map((item) => [item.id, item])).values()],
    sources,
  };
};

const createDaily = (profile: NewsPreferenceProfile, items: NewsItem[]): DailyNewsState => ({
  version: 1,
  date: dateKey(),
  visible: selectDiverseNewsItems(items, profile, VISIBLE_COUNT).map((item) => item.id),
  seen: [],
});

const readDaily = (
  profile: NewsPreferenceProfile,
  items: NewsItem[],
  byId: Map<string, NewsItem>
): DailyNewsState => {
  const raw = readJson(DAILY_KEY);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return createDaily(profile, items);
  const candidate = raw as Partial<DailyNewsState>;
  if (candidate.version !== 1 || candidate.date !== dateKey()) return createDaily(profile, items);

  const seen = Array.isArray(candidate.seen)
    ? [...new Set(candidate.seen.filter((id): id is string => typeof id === 'string'))]
    : [];
  const visible = Array.isArray(candidate.visible)
    ? [...new Set(candidate.visible.filter((id): id is string => typeof id === 'string' && byId.has(id)))]
    : [];
  const blocked = new Set([...seen, ...visible]);
  const context = visible.map((id) => byId.get(id)).filter((item): item is NewsItem => Boolean(item));
  const additions = selectDiverseNewsItems(
    items.filter((item) => !blocked.has(item.id)), profile, VISIBLE_COUNT - visible.length, context
  );

  return { version: 1, date: candidate.date, visible: [...visible, ...additions.map((item) => item.id)].slice(0, 3), seen };
};

const label = (value: string) => value.replaceAll('-', ' ').toUpperCase();
const published = (value: string) =>
  publishedFormatter.format(new Date(value)).replace(',', ' / ').toUpperCase();

const categoryName: Record<NewsItem['category'], string> = {
  music: 'Music',
  film: 'Film',
  comics: 'Comics',
  games: 'Games',
  architecture: 'Architecture',
  design: 'Design',
  art: 'Art',
  books: 'Books',
  culture: 'Culture',
};

const contextFor = (item: NewsItem) => {
  const category = categoryName[item.category];
  const hasTag = (tag: string) => item.tags.includes(tag);

  switch (item.kind) {
    case 'review':
      if (item.category === 'music' && hasTag('album')) return 'Album review';
      if (item.category === 'comics') return 'Comics review';
      return `${category} review`;
    case 'interview':
      if (item.category === 'comics') return 'Comics creator interview';
      if (item.category === 'music') return 'Artist interview';
      return `${category} interview`;
    case 'release':
      if (item.category === 'music' && hasTag('album')) return 'New album release';
      if (item.category === 'music') return 'New music release';
      return `${category} release`;
    case 'reissue':
      if (item.category === 'music') return 'Archive reissue';
      return `${category} reissue`;
    case 'retrospective':
      return `${category} retrospective - archive story`;
    case 'obituary':
      return `${category} obituary - cultural legacy`;
    case 'exhibition':
      return `${category} exhibition`;
    case 'discovery':
      return `${category} discovery`;
    case 'news':
    default:
      if (item.locality === 'finland') return `Finnish ${category.toLowerCase()} news`;
      return `${category} news`;
  }
};

export const initCurrentNews = () => {
  const root = document.querySelector<HTMLElement>('[data-current-news]');
  if (!root || root.dataset.currentNewsInitialized === 'true') return;
  root.dataset.currentNewsInitialized = 'true';

  const slots = [...root.querySelectorAll<HTMLElement>('[data-news-slot]')];
  const mode = root.querySelector<HTMLElement>('.news-mode');
  const footerStatus = root.querySelector<HTMLElement>('.news-footer p:last-of-type');
  const liveStatus = root.querySelector<HTMLElement>('[data-news-feedback-status]');
  const reset = root.querySelector<HTMLButtonElement>('[data-news-reset]');

  let profile = readProfile();
  let items: NewsItem[] = [];
  let byId = new Map<string, NewsItem>();
  let daily: DailyNewsState | null = null;
  let sources: NewsSourceStatus[] = [];
  let loading = false;

  const save = () => {
    writeJson(PROFILE_KEY, profile);
    if (daily) writeJson(DAILY_KEY, daily);
  };

  const candidates = (slotIndex: number) => {
    if (!daily) return [];
    const blocked = new Set(daily.seen);
    daily.visible.forEach((id, index) => { if (index !== slotIndex) blocked.add(id); });
    return items.filter((item) => !blocked.has(item.id));
  };

  const renderSlot = (slot: HTMLElement, index: number) => {
    const item = daily ? byId.get(daily.visible[index]) : undefined;
    const meta = slot.querySelector<HTMLElement>('[data-news-meta]');
    const title = slot.querySelector<HTMLElement>('[data-news-title]');
    const context = slot.querySelector<HTMLElement>('[data-news-context]');
    const detail = slot.querySelector<HTMLElement>('[data-news-detail]');
    const buttons = [...slot.querySelectorAll<HTMLButtonElement>('[data-news-feedback]')];

    if (!item) {
      slot.removeAttribute('data-news-item-id');
      if (meta) meta.textContent = loading ? 'FEEDS / LOADING' : 'FEEDS / UNAVAILABLE';
      if (title) title.textContent = loading ? 'Loading live culture feeds' : 'No live item available';
      if (context) context.textContent = loading ? 'Preparing feed summary' : 'No summary available';
      if (detail) detail.textContent = loading ? 'RSS / CURRENT' : 'TRY AGAIN LATER';
      buttons.forEach((button) => { button.disabled = true; });
      return;
    }

    slot.dataset.newsItemId = item.id;
    if (meta) meta.textContent = `${label(item.category)} / ${item.source.toUpperCase()}`;
    if (title) {
      const link = document.createElement('a');
      link.href = item.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = item.title;
      link.style.color = 'inherit';
      link.style.textDecoration = 'none';
      title.replaceChildren(link);
    }
    if (context) context.textContent = item.summary?.trim() || contextFor(item);
    if (detail) detail.textContent = `${label(item.kind)} / ${label(item.locality)} / ${published(item.publishedAt)}`;
    const replaceable = candidates(index).some((candidate) => candidate.id !== item.id);
    buttons.forEach((button) => { button.disabled = !replaceable; });
  };

  const renderDebug = () => {
    const unavailable = new Set([...(daily?.seen ?? []), ...(daily?.visible ?? [])]);
    const set = (selector: string, value: string) => {
      const node = root.querySelector<HTMLElement>(selector);
      if (node) node.textContent = value;
    };
    set('[data-news-debug-pool]', String(items.length));
    set('[data-news-debug-remaining]', String(items.filter((item) => !unavailable.has(item.id)).length));
    set('[data-news-debug-seen]', String(daily?.seen.length ?? 0));
    set('[data-news-debug-up]', String(profile.ratings.up));
    set('[data-news-debug-down]', String(profile.ratings.down));

    const target = root.querySelector<HTMLElement>('[data-news-debug-signals]');
    if (!target) return;
    target.replaceChildren();
    const signals = getNewsPreferenceSignals(profile);
    if (signals.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'news-debug__empty';
      empty.textContent = 'NO LEARNING SIGNAL YET';
      target.append(empty);
      return;
    }
    for (const signal of signals) {
      const row = document.createElement('p');
      row.className = 'news-debug__signal';
      row.dataset.newsDebugSignal = '';
      const left = document.createElement('span');
      const right = document.createElement('span');
      left.textContent = signal.label;
      right.textContent = `${signal.score >= 0 ? '+' : ''}${signal.score.toFixed(2)}`;
      row.append(left, right);
      target.append(row);
    }
  };

  const render = () => {
    slots.forEach(renderSlot);
    renderDebug();
    const working = sources.filter((source) => source.status !== 'error');
    if (mode) mode.textContent = loading
      ? 'LIVE RSS / LOADING'
      : items.length === 0
        ? 'LIVE RSS / UNAVAILABLE'
        : `LIVE RSS / ${working.length} OF ${sources.length} SOURCES`;
    if (footerStatus) footerStatus.textContent = items.length
      ? `FEEDS / ${items.length} ITEMS / ${working.map((source) => source.name.toUpperCase()).join(' · ')}`
      : 'FEEDS / UNAVAILABLE';
  };

  const rate = (index: number, feedback: NewsFeedback) => {
    if (!daily) return;
    const item = byId.get(daily.visible[index]);
    if (!item) return;
    profile = applyNewsFeedback(profile, item, feedback);
    if (!daily.seen.includes(item.id)) daily.seen.push(item.id);
    const context = daily.visible
      .filter((_, slotIndex) => slotIndex !== index)
      .map((id) => byId.get(id))
      .filter((candidate): candidate is NewsItem => Boolean(candidate));
    const replacement = selectDiverseNewsItems(
      candidates(index).filter((candidate) => candidate.id !== item.id), profile, 1, context
    )[0];
    daily.visible[index] = replacement?.id ?? '';
    save();
    render();
    if (liveStatus) liveStatus.textContent = `${feedback === 'up' ? 'Thumbs up' : 'Thumbs down'}. ${replacement ? 'New item shown.' : 'Feed pool exhausted.'}`;
  };

  root.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('[data-news-feedback]');
    if (!button || button.disabled) return;
    const slot = button.closest<HTMLElement>('[data-news-slot]');
    const index = Number(slot?.dataset.slotIndex);
    const feedback = button.dataset.newsFeedback;
    if (Number.isInteger(index) && (feedback === 'up' || feedback === 'down')) rate(index, feedback);
  });

  reset?.addEventListener('click', () => {
    profile = createEmptyNewsPreferenceProfile();
    daily = items.length ? createDaily(profile, items) : null;
    save();
    render();
    if (liveStatus) liveStatus.textContent = 'Local news learning reset.';
  });

  const load = async () => {
    if (loading) return;
    loading = true;
    render();
    try {
      const response = await fetch(NEWS_API_URL, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`news:${response.status}`);
      const data = parseResponse(await response.json());
      if (!data || data.items.length < VISIBLE_COUNT) throw new Error('news:invalid-response');
      items = data.items;
      byId = new Map(items.map((item) => [item.id, item]));
      sources = data.sources;
      profile = readProfile();
      daily = readDaily(profile, items, byId);
      save();
      window.dispatchEvent(new CustomEvent('current:data-updated', { detail: { at: data.generatedAt } }));
    } catch {
      if (items.length === 0) { byId = new Map(); daily = null; sources = []; }
    } finally {
      loading = false;
      render();
    }
  };

  render();
  void load();
  window.setInterval(() => void load(), REFRESH_INTERVAL_MS);
};
