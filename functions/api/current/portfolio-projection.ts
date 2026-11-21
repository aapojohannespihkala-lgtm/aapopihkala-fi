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
  const today = projectQuarterReturn(quarter, 1);
  const week1 = projectQuarterReturn(quarter, 7);
  const month1 = projectQuarterReturn(quarter, 30);
  if (today === null || week1 === null || month1 === null) return item;
  return {
    ...item,
    changes: { ...item.changes, today, week1, month1 },
    estimatedPeriods: [...FOREST_ESTIMATED_PERIODS],
    estimationMethod: 'compound-3m-over-91-days',
  };
};
