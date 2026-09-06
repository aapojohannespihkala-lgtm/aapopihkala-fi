export type NewsCategory =
  | 'music'
  | 'film'
  | 'comics'
  | 'games'
  | 'architecture'
  | 'design'
  | 'art'
  | 'books'
  | 'culture';

export type NewsLocality = 'finland' | 'nordic' | 'international';

export type NewsKind =
  | 'release'
  | 'review'
  | 'interview'
  | 'news'
  | 'retrospective'
  | 'reissue'
  | 'exhibition'
  | 'discovery';

export type NewsItem = {
  id: string;
  title: string;
  source: string;
  sourceId: string;
  category: NewsCategory;
  locality: NewsLocality;
  tags: string[];
  kind: NewsKind;
  baseScore: number;
};

export type NewsFeedback = 'up' | 'down';

export type NewsPreferenceProfile = {
  version: 1;
  ratings: {
    up: number;
    down: number;
  };
  categories: Record<string, number>;
  tags: Record<string, number>;
  kinds: Record<string, number>;
  sources: Record<string, number>;
  localities: Record<string, number>;
};

export type NewsPreferenceSignal = {
  label: string;
  score: number;
};

const FEEDBACK_WEIGHTS = {
  up: {
    category: 0.35,
    tag: 0.6,
    kind: 0.45,
    source: 0.15,
    locality: 0.1,
  },
  down: {
    category: -0.15,
    tag: -0.3,
    kind: -0.25,
    source: -0.05,
    locality: -0.05,
  },
} as const;

const clamp = (value: number) => Math.max(-4, Math.min(4, value));

const addWeight = (record: Record<string, number>, key: string, amount: number) => {
  record[key] = clamp((record[key] ?? 0) + amount);
};

export const createEmptyNewsPreferenceProfile = (): NewsPreferenceProfile => ({
  version: 1,
  ratings: { up: 0, down: 0 },
  categories: {},
  tags: {},
  kinds: {},
  sources: {},
  localities: {},
});

export const applyNewsFeedback = (
  profile: NewsPreferenceProfile,
  item: NewsItem,
  feedback: NewsFeedback
): NewsPreferenceProfile => {
  const next: NewsPreferenceProfile = {
    version: 1,
    ratings: { ...profile.ratings },
    categories: { ...profile.categories },
    tags: { ...profile.tags },
    kinds: { ...profile.kinds },
    sources: { ...profile.sources },
    localities: { ...profile.localities },
  };

  next.ratings[feedback] += 1;

  const weights = FEEDBACK_WEIGHTS[feedback];
  addWeight(next.categories, item.category, weights.category);
  addWeight(next.kinds, item.kind, weights.kind);
  addWeight(next.sources, item.sourceId, weights.source);
  addWeight(next.localities, item.locality, weights.locality);

  for (const tag of item.tags) addWeight(next.tags, tag, weights.tag);

  return next;
};

const average = (values: number[]) =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

export const scoreNewsItem = (item: NewsItem, profile: NewsPreferenceProfile) => {
  const tagScores = item.tags.map((tag) => profile.tags[tag] ?? 0);
  const preferenceScore =
    (profile.categories[item.category] ?? 0) * 0.55 +
    average(tagScores) * 0.75 +
    (profile.kinds[item.kind] ?? 0) * 0.6 +
    (profile.sources[item.sourceId] ?? 0) * 0.25 +
    (profile.localities[item.locality] ?? 0) * 0.15;

  const knownSignals = [
    profile.categories[item.category] ?? 0,
    profile.kinds[item.kind] ?? 0,
    profile.sources[item.sourceId] ?? 0,
    ...tagScores,
  ];
  const unknownShare =
    knownSignals.filter((value) => Math.abs(value) < 0.05).length / Math.max(1, knownSignals.length);
  const discoveryScore = unknownShare * 0.12;

  return item.baseScore + preferenceScore + discoveryScore;
};

const diversityPenalty = (item: NewsItem, context: NewsItem[]) => {
  let penalty = 0;

  for (const existing of context) {
    if (existing.category === item.category) penalty += 0.4;
    if (existing.sourceId === item.sourceId) penalty += 0.5;
    if (existing.kind === item.kind) penalty += 0.12;

    const overlap = item.tags.filter((tag) => existing.tags.includes(tag)).length;
    penalty += Math.min(0.24, overlap * 0.08);
  }

  return penalty;
};

export const selectDiverseNewsItems = (
  items: NewsItem[],
  profile: NewsPreferenceProfile,
  count: number,
  initialContext: NewsItem[] = []
) => {
  const available = [...items];
  const selected: NewsItem[] = [];
  const context = [...initialContext];

  while (available.length > 0 && selected.length < count) {
    available.sort((left, right) => {
      const rightScore = scoreNewsItem(right, profile) - diversityPenalty(right, context);
      const leftScore = scoreNewsItem(left, profile) - diversityPenalty(left, context);
      return rightScore - leftScore || left.id.localeCompare(right.id);
    });

    const next = available.shift();
    if (!next) break;

    selected.push(next);
    context.push(next);
  }

  return selected;
};

export const getNewsPreferenceSignals = (
  profile: NewsPreferenceProfile,
  limit = 8
): NewsPreferenceSignal[] => {
  const collect = (prefix: string, record: Record<string, number>) =>
    Object.entries(record).map(([key, score]) => ({
      label: `${prefix} / ${key.replaceAll('-', ' ').toUpperCase()}`,
      score,
    }));

  return [
    ...collect('TAG', profile.tags),
    ...collect('CATEGORY', profile.categories),
    ...collect('KIND', profile.kinds),
    ...collect('SOURCE', profile.sources),
  ]
    .filter((signal) => Math.abs(signal.score) >= 0.05)
    .sort((left, right) => Math.abs(right.score) - Math.abs(left.score) || right.score - left.score)
    .slice(0, limit);
};
