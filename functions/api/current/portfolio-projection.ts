// OP Metsänomistaja B publishes an official NAV only quarterly. These are
// smooth-equivalent returns calculated from the *last observed* three-month
// return. They are neither published daily NAVs nor forecasts.
export const FOREST_ESTIMATED_PERIODS = ['today', 'week1', 'month1'] as const;
export type ForestEstimatedPeriod = (typeof FOREST_ESTIMATED_PERIODS)[number];

export const projectQuarterReturn = (quarterReturnPercent: number, days: number) => {
  if (!Number.isFinite(quarterReturnPercent) || quarterReturnPercent <= -100) return null;
  if (!Number.isFinite(days) || days < 0) return null;
  // Use a fixed 91-day quarter for comparable chart columns.
  const result = (Math.pow(1 + quarterReturnPercent / 100, days / 91) - 1) * 100;
  return Number.isFinite(result) ? result : null;
};

export const projectForestShortPeriods = <T extends {
  id: string;
  changes: { today: number | null; week1: number | null; month1: number | null; month3: number | null };
}>(item: T): T & { estimatedPeriods?: ForestEstimatedPeriod[]; estimationMethod?: string } => {
  if (item.id !== 'op-forest-owner-b') return item;
  const quarter = item.changes.month3;
  if (quarter === null) return item;
  // A reported source return always takes precedence over a projection.
  // Estimate only genuinely missing periods and label only those cells.
  const changes = { ...item.changes };
  const estimatedPeriods: ForestEstimatedPeriod[] = [];
  const periods: [ForestEstimatedPeriod, number][] = [
    ['today', 1], ['week1', 7], ['month1', 30],
  ];
  for (const [period, days] of periods) {
    if (changes[period] !== null) continue;
    const estimated = projectQuarterReturn(quarter, days);
    if (estimated === null) return item;
    changes[period] = estimated;
    estimatedPeriods.push(period);
  }
  if (estimatedPeriods.length === 0) return item;
  return {
    ...item,
    changes,
    estimatedPeriods,
    estimationMethod: 'compound-3m-over-91-days',
  };
};
