// Source-based estimates for periods not published by an instrument.
// A computed value is never a reported return, and never replaces one.
export const PERIOD_DAYS = {
  today: 1, week1: 7, month1: 30, month3: 91, month6: 182,
  ytd: 0, year1: 365, year3: 1095, year5: 1826,
} as const;
export type PortfolioPeriod = keyof typeof PERIOD_DAYS;
export type PortfolioChanges = Record<PortfolioPeriod, number | null>;
export type PeriodEstimateDetail = {
  sourcePeriod: PortfolioPeriod;
  sourceReturnPercent: number;
  sourceDays: number;
  targetDays: number;
  sourceObservedAt: string;
  sourceAgeDays: number;
  method: 'geometric-period-scaling' | 'compound-3m-over-91-days';
};

type PeriodItem = {
  changes: PortfolioChanges;
  observedAt: string;
  estimatedPeriods?: PortfolioPeriod[];
  estimationDetails?: Partial<Record<PortfolioPeriod, PeriodEstimateDetail>>;
  estimationMethod?: string;
  unresolvedPeriods?: PortfolioPeriod[];
};

const DAY_MS = 86_400_000;
const PERIODS = Object.keys(PERIOD_DAYS) as PortfolioPeriod[];

const daysByPeriod = (period: PortfolioPeriod, observedAt: string): number => {
  if (period !== 'ytd') return PERIOD_DAYS[period];
  const observed = Date.parse(observedAt + 'T00:00:00Z');
  const year = Number(observedAt.slice(0, 4));
  return Math.max(1, Math.ceil((observed - Date.UTC(year, 0, 1)) / DAY_MS));
};

export const estimatePortfolioPeriods = <T extends PeriodItem>(
  item: T,
  now = new Date(),
): T & {
  estimatedPeriods?: PortfolioPeriod[];
  estimationDetails?: Partial<Record<PortfolioPeriod, PeriodEstimateDetail>>;
  unresolvedPeriods?: PortfolioPeriod[];
} => {
  const observed = /^\d{4}-\d{2}-\d{2}$/.test(item.observedAt)
    ? Date.parse(item.observedAt + 'T00:00:00Z') : NaN;
  if (!Number.isFinite(observed) || new Date(observed).toISOString().slice(0, 10) !== item.observedAt ||
      observed > now.getTime() + DAY_MS) {
    return { ...item, unresolvedPeriods: PERIODS.filter((p) => item.changes[p] === null) };
  }
  const ageDays = Math.max(0, Math.floor((now.getTime() - observed) / DAY_MS));
  const changes = { ...item.changes };
  const estimated = new Set<PortfolioPeriod>(item.estimatedPeriods ?? []);
  const details = { ...(item.estimationDetails ?? {}) };
  const sources = PERIODS.flatMap((period) => {
    const value = item.changes[period];
    return !estimated.has(period) && typeof value === 'number' &&
      Number.isFinite(value) && value > -100
      ? [{ period, value, days: daysByPeriod(period, item.observedAt) }]
      : [];
  });

  // Preserve existing OP quarterly-based estimates, and supply their provenance.
  const quarter = sources.find((source) => source.period === 'month3');
  if (quarter && item.estimationMethod === 'compound-3m-over-91-days') {
    for (const period of estimated) {
      if (details[period]) continue;
      details[period] = {
        sourcePeriod: 'month3', sourceReturnPercent: quarter.value,
        sourceDays: quarter.days, targetDays: daysByPeriod(period, item.observedAt),
        sourceObservedAt: item.observedAt, sourceAgeDays: ageDays,
        method: 'compound-3m-over-91-days',
      };
    }
  }

  for (const period of PERIODS) {
    if (changes[period] !== null) continue;
    const targetDays = daysByPeriod(period, item.observedAt);
    const candidates = sources.filter((source) => source.days > 0);
    // Pick the closest genuinely reported horizon, never another projection.
    candidates.sort((a, b) =>
      Math.abs(Math.log(a.days / targetDays)) - Math.abs(Math.log(b.days / targetDays)));
    const source = candidates[0];
    if (!source) continue;
    const value = (Math.pow(1 + source.value / 100, targetDays / source.days) - 1) * 100;
    if (!Number.isFinite(value)) continue;
    changes[period] = value;
    estimated.add(period);
    details[period] = {
      sourcePeriod: source.period, sourceReturnPercent: source.value,
      sourceDays: source.days, targetDays, sourceObservedAt: item.observedAt,
      sourceAgeDays: ageDays, method: 'geometric-period-scaling',
    };
  }

  return {
    ...item,
    changes,
    estimatedPeriods: [...estimated],
    estimationDetails: details,
    estimationMethod: item.estimationMethod ??
      (estimated.size ? 'geometric-period-scaling' : undefined),
    unresolvedPeriods: PERIODS.filter((period) => changes[period] === null),
  };
};

export const estimatePortfolioItemIfValid = (raw: unknown): unknown => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  const item = raw as Record<string, unknown>;
  if (typeof item.observedAt !== 'string' ||
      !item.changes || typeof item.changes !== 'object' ||
      Array.isArray(item.changes)) return raw;
  const changes = item.changes as Record<string, unknown>;
  if (!PERIODS.every((period) =>
    changes[period] === null ||
    (typeof changes[period] === 'number' && Number.isFinite(changes[period])))) return raw;
  const estimated = Array.isArray(item.estimatedPeriods)
    ? item.estimatedPeriods.filter((p): p is PortfolioPeriod =>
      typeof p === 'string' && PERIODS.includes(p as PortfolioPeriod))
    : undefined;
  return estimatePortfolioPeriods({
    ...item, observedAt: item.observedAt, changes: changes as PortfolioChanges,
    estimatedPeriods: estimated,
  });
};
