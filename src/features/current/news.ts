import { prototypeNewsItems } from './newsPrototypeData';
import {
  applyNewsFeedback,
  createEmptyNewsPreferenceProfile,
  getNewsPreferenceSignals,
  selectDiverseNewsItems,
  type NewsFeedback,
  type NewsItem,
  type NewsPreferenceProfile,
} from './newsPreferences';

const PROFILE_STORAGE_KEY = 'current.news.profile.v1';
const DAILY_STORAGE_KEY = 'current.news.daily.v1';
const HELSINKI_TIME_ZONE = 'Europe/Helsinki';
const VISIBLE_COUNT = 3;

type DailyNewsState = {
  version: 1;
  date: string;
  visible: string[];
  seen: string[];
};

const itemsById = new Map(prototypeNewsItems.map((item) => [item.id, item]));

const getHelsinkiDateKey = () => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: HELSINKI_TIME_ZONE,
  }).formatToParts(new Date());

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${get('year')}-${get('month')}-${get('day')}`;
};

const readJson = (key: string): unknown => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeJson = (key: string, value: unknown) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The prototype remains usable without persistence when storage is blocked.
  }
};

const toNumberRecord = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1])
    )
  );
};

const readProfile = (): NewsPreferenceProfile => {
  const raw = readJson(PROFILE_STORAGE_KEY);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return createEmptyNewsPreferenceProfile();
  }

  const candidate = raw as Partial<NewsPreferenceProfile>;
  if (candidate.version !== 1) return createEmptyNewsPreferenceProfile();

  const up = candidate.ratings?.up;
  const down = candidate.ratings?.down;

  return {
    version: 1,
    ratings: {
      up: typeof up === 'number' && Number.isFinite(up) ? up : 0,
      down: typeof down === 'number' && Number.isFinite(down) ? down : 0,
    },
    categories: toNumberRecord(candidate.categories),
    tags: toNumberRecord(candidate.tags),
    kinds: toNumberRecord(candidate.kinds),
    sources: toNumberRecord(candidate.sources),
    localities: toNumberRecord(candidate.localities),
  };
};

const createDailyState = (profile: NewsPreferenceProfile): DailyNewsState => ({
  version: 1,
  date: getHelsinkiDateKey(),
  visible: selectDiverseNewsItems(prototypeNewsItems, profile, VISIBLE_COUNT).map((item) => item.id),
  seen: [],
});

const readDailyState = (profile: NewsPreferenceProfile): DailyNewsState => {
  const raw = readJson(DAILY_STORAGE_KEY);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return createDailyState(profile);

  const candidate = raw as Partial<DailyNewsState>;
  const visible = Array.isArray(candidate.visible)
    ? candidate.visible.filter((id): id is string => typeof id === 'string' && itemsById.has(id))
    : [];
  const seen = Array.isArray(candidate.seen)
    ? [...new Set(candidate.seen.filter((id): id is string => typeof id === 'string' && itemsById.has(id)))]
    : [];

  if (
    candidate.version !== 1 ||
    candidate.date !== getHelsinkiDateKey() ||
    visible.length !== VISIBLE_COUNT ||
    new Set(visible).size !== VISIBLE_COUNT
  ) {
    return createDailyState(profile);
  }

  return {
    version: 1,
    date: candidate.date,
    visible,
    seen,
  };
};

const itemLabel = (value: string) => value.replaceAll('-', ' ').toUpperCase();

export const initCurrentNewsPrototype = () => {
  const root = document.querySelector<HTMLElement>('[data-current-news]');
  if (!root || root.dataset.currentNewsInitialized === 'true') return;
  root.dataset.currentNewsInitialized = 'true';

  const slots = [...root.querySelectorAll<HTMLElement>('[data-news-slot]')];
  const status = root.querySelector<HTMLElement>('[data-news-feedback-status]');
  const resetButton = root.querySelector<HTMLButtonElement>('[data-news-reset]');

  let profile = readProfile();
  let daily = readDailyState(profile);

  const save = () => {
    writeJson(PROFILE_STORAGE_KEY, profile);
    writeJson(DAILY_STORAGE_KEY, daily);
  };

  const getVisibleItems = () =>
    daily.visible.map((id) => itemsById.get(id)).filter((item): item is NewsItem => Boolean(item));

  const getCandidatesForSlot = (slotIndex: number) => {
    const blocked = new Set(daily.seen);
    daily.visible.forEach((id, index) => {
      if (index !== slotIndex) blocked.add(id);
    });

    return prototypeNewsItems.filter((item) => !blocked.has(item.id));
  };

  const renderSlot = (slot: HTMLElement, slotIndex: number) => {
    const item = itemsById.get(daily.visible[slotIndex]);
    const meta = slot.querySelector<HTMLElement>('[data-news-meta]');
    const title = slot.querySelector<HTMLElement>('[data-news-title]');
    const detail = slot.querySelector<HTMLElement>('[data-news-detail]');
    const buttons = [...slot.querySelectorAll<HTMLButtonElement>('[data-news-feedback]')];

    if (!item) {
      slot.removeAttribute('data-news-item-id');
      if (meta) meta.textContent = 'POOL / EMPTY';
      if (title) title.textContent = 'No prototype item available';
      if (detail) detail.textContent = 'RESET LOCAL LEARNING TO START AGAIN';
      buttons.forEach((button) => (button.disabled = true));
      return;
    }

    slot.dataset.newsItemId = item.id;
    if (meta) meta.textContent = `${itemLabel(item.category)} / ${item.source.toUpperCase()}`;
    if (title) title.textContent = item.title;
    if (detail) detail.textContent = `${itemLabel(item.kind)} / ${itemLabel(item.locality)}`;

    const hasReplacement = getCandidatesForSlot(slotIndex).some((candidate) => candidate.id !== item.id);
    buttons.forEach((button) => (button.disabled = !hasReplacement));
  };

  const renderDebug = () => {
    const pool = root.querySelector<HTMLElement>('[data-news-debug-pool]');
    const remaining = root.querySelector<HTMLElement>('[data-news-debug-remaining]');
    const seen = root.querySelector<HTMLElement>('[data-news-debug-seen]');
    const up = root.querySelector<HTMLElement>('[data-news-debug-up]');
    const down = root.querySelector<HTMLElement>('[data-news-debug-down]');
    const signalsTarget = root.querySelector<HTMLElement>('[data-news-debug-signals]');

    const unavailable = new Set([...daily.seen, ...daily.visible]);
    const remainingCount = prototypeNewsItems.filter((item) => !unavailable.has(item.id)).length;

    if (pool) pool.textContent = String(prototypeNewsItems.length);
    if (remaining) remaining.textContent = String(remainingCount);
    if (seen) seen.textContent = String(daily.seen.length);
    if (up) up.textContent = String(profile.ratings.up);
    if (down) down.textContent = String(profile.ratings.down);

    if (signalsTarget) {
      signalsTarget.replaceChildren();
      const signals = getNewsPreferenceSignals(profile);

      if (signals.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'news-debug__empty';
        empty.textContent = 'NO LEARNING SIGNAL YET';
        signalsTarget.append(empty);
      } else {
        for (const signal of signals) {
          const row = document.createElement('p');
          row.className = 'news-debug__signal';
          row.dataset.newsDebugSignal = '';

          const label = document.createElement('span');
          label.textContent = signal.label;

          const value = document.createElement('span');
          value.textContent = `${signal.score >= 0 ? '+' : ''}${signal.score.toFixed(2)}`;

          row.append(label, value);
          signalsTarget.append(row);
        }
      }
    }
  };

  const render = () => {
    slots.forEach(renderSlot);
    renderDebug();
  };

  const rate = (slotIndex: number, feedback: NewsFeedback) => {
    const item = itemsById.get(daily.visible[slotIndex]);
    if (!item) return;

    profile = applyNewsFeedback(profile, item, feedback);
    if (!daily.seen.includes(item.id)) daily.seen.push(item.id);

    const context = getVisibleItems().filter((_, index) => index !== slotIndex);
    const replacement = selectDiverseNewsItems(
      getCandidatesForSlot(slotIndex).filter((candidate) => candidate.id !== item.id),
      profile,
      1,
      context
    )[0];

    if (replacement) daily.visible[slotIndex] = replacement.id;

    save();
    render();

    if (status) {
      const label = feedback === 'up' ? 'Thumbs up' : 'Thumbs down';
      status.textContent = replacement
        ? `${label}. New prototype item shown in slot ${slotIndex + 1}.`
        : `${label}. The prototype pool is exhausted for this slot.`;
    }
  };

  root.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const button = target.closest<HTMLButtonElement>('[data-news-feedback]');
    if (!button || button.disabled) return;

    const slot = button.closest<HTMLElement>('[data-news-slot]');
    const slotIndex = Number(slot?.dataset.slotIndex);
    const feedback = button.dataset.newsFeedback;

    if (!Number.isInteger(slotIndex) || (feedback !== 'up' && feedback !== 'down')) return;
    rate(slotIndex, feedback);
  });

  resetButton?.addEventListener('click', () => {
    profile = createEmptyNewsPreferenceProfile();
    daily = createDailyState(profile);
    save();
    render();
    if (status) status.textContent = 'Local news learning reset.';
  });

  save();
  render();
  window.dispatchEvent(new CustomEvent('current:data-updated'));
};
