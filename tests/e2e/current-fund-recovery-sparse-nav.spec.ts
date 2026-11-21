import { expect, test } from '@playwright/test';
import { buildRecoveredHistoricalFund } from '../../functions/api/current/portfolio-fund-recovery';

const spec = { id: 'nordnet-finland' as const, label: 'NORDNET SUOMI INDEKSI', isin: 'SE0005993102' };
const now = new Date('2026-11-21T12:00:00Z');

test('sparse NAV history never mislabels an eight-day change as 1D', () => {
  const item = buildRecoveredHistoricalFund(spec, [
    { observedAt: '2026-11-12', value: 104 },
    { observedAt: '2026-11-20', value: 112 },
  ], now);
  expect(item?.price).toBe(112);
  expect(item?.changes.today).toBeNull();
  // 12 November is only one calendar day before the 13 November 7-day reference.
  expect(item?.changes.week1).toBeCloseTo((112 / 104 - 1) * 100, 9);
});

test('an old NAV cannot supply either the 1D or the 1W period', () => {
  const item = buildRecoveredHistoricalFund(spec, [
    { observedAt: '2026-10-30', value: 100 },
    { observedAt: '2026-11-20', value: 112 },
  ], now);
  expect(item?.price).toBe(112);
  expect(item?.changes.today).toBeNull();
  expect(item?.changes.week1).toBeNull();
  expect(item?.changes.month1).toBeNull();
});

test('genuine previous-trading-day NAV across a weekend is preserved', () => {
  const item = buildRecoveredHistoricalFund(spec, [
    { observedAt: '2026-11-13', value: 100 },
    { observedAt: '2026-11-16', value: 102 },
  ], new Date('2026-11-17T12:00:00Z'));
  expect(item?.changes.today).toBeCloseTo(2, 9);
  expect(item?.changes.week1).toBeNull();
});

test('old weekly reference is rejected even when recent daily NAVs exist', () => {
  const item = buildRecoveredHistoricalFund(spec, [
    { observedAt: '2026-11-05', value: 90 },
    { observedAt: '2026-11-19', value: 110 },
    { observedAt: '2026-11-20', value: 112 },
  ], now);
  expect(item?.changes.today).toBeCloseTo((112 / 110 - 1) * 100, 9);
  expect(item?.changes.week1).toBeNull();
});
