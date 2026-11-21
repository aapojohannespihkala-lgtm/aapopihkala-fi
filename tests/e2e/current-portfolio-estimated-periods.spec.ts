import { expect, test } from '@playwright/test';
import {
  estimatePortfolioItemIfValid, estimatePortfolioPeriods, type PortfolioChanges,
} from '../../functions/api/current/portfolio-estimation';
import { projectForestShortPeriods } from '../../functions/api/current/portfolio-projection';

const empty = (): PortfolioChanges => ({
  today: null, week1: null, month1: null, month3: null, month6: null,
  ytd: null, year1: null, year3: null, year5: null,
});

test('all 9 missing periods receive provenance-tagged geometric approximations from observed 3M data', () => {
  const changes = { ...empty(), month3: 6 };
  const item = estimatePortfolioPeriods({ id: 'fund', observedAt: '2026-11-20', changes },
    new Date('2026-11-21T12:00:00Z'));
  expect(item.changes.month3).toBe(6);
  expect(item.estimatedPeriods).not.toContain('month3');
  expect(item.estimatedPeriods).toHaveLength(8);
  expect(item.unresolvedPeriods).toEqual([]);
  expect(item.changes.today).toBeCloseTo((Math.pow(1.06, 1 / 91) - 1) * 100, 9);
  expect(item.estimationDetails?.today).toMatchObject({
    sourcePeriod: 'month3', sourceReturnPercent: 6, sourceDays: 91, targetDays: 1,
    sourceObservedAt: '2026-11-20', sourceAgeDays: 1,
  });
  expect(item.estimationDetails?.year5?.method).toBe('geometric-period-scaling');
  expect(changes.today).toBeNull();
});

test('verified 1M/1Y returns are never overwritten and estimated returns are not reused as observations', () => {
  const forest = projectForestShortPeriods({
    id: 'op-forest-owner-b',
    observedAt: '2026-11-20',
    changes: { ...empty(), month1: 3.2, month3: 6, year1: 8 },
  });
  const item = estimatePortfolioPeriods(forest, new Date('2026-11-21T12:00:00Z'));
  expect(item.changes.month1).toBe(3.2);
  expect(item.changes.year1).toBe(8);
  expect(item.estimatedPeriods).toContain('today');
  expect(item.estimatedPeriods).not.toContain('month1');
  expect(item.estimationDetails?.today).toMatchObject({
    sourcePeriod: 'month3', method: 'compound-3m-over-91-days',
  });
  expect(item.estimationDetails?.year5?.sourcePeriod).toBe('year1');
  expect(item.unresolvedPeriods).toEqual([]);
});

test('an entirely unverified or invalid observation cannot become invented percentages', () => {
  const missing = estimatePortfolioPeriods({
    observedAt: '2026-11-20', changes: empty(),
  }, new Date('2026-11-21T12:00:00Z'));
  expect(missing.estimatedPeriods).toEqual([]);
  expect(missing.unresolvedPeriods).toHaveLength(9);
  expect(Object.values(missing.changes).every((value) => value === null)).toBe(true);
  expect(estimatePortfolioItemIfValid({observedAt:'2026-11-20', changes: { today: '100%' }}))
    .toEqual({observedAt:'2026-11-20', changes: { today: '100%' }});
  const invalid = estimatePortfolioPeriods({
    observedAt: 'yesterday', changes: {...empty(), month3: 6},
  });
  expect(invalid.changes.today).toBeNull();
});

test('19 known source-based rows have no missing percentage field in API estimator output', () => {
  const rows = Array.from({ length: 19 }, (_, index) => ({
    id: 'row-' + index,
    observedAt: '2026-11-20',
    changes: { ...empty(), month3: 2 + index },
  }));
  const complete = rows.map((row) => estimatePortfolioItemIfValid(row)) as Array<{
    changes: PortfolioChanges;
    estimatedPeriods: string[];
    unresolvedPeriods: string[];
  }>;
  expect(complete).toHaveLength(19);
  for (const row of complete) {
    expect(Object.values(row.changes).every((value) =>
      typeof value === 'number' && Number.isFinite(value))).toBe(true);
    expect(row.estimatedPeriods).toHaveLength(8);
    expect(row.unresolvedPeriods).toEqual([]);
  }
});
