import { expect, test } from '@playwright/test';
import { buildInvestingOnlyShortChanges } from '../../functions/api/current/portfolio-complete';
import { projectForestShortPeriods, projectQuarterReturn } from '../../functions/api/current/portfolio-projection';
import {
  buildRecoveredHistoricalFund,
  parseInvestingFundHistory,
  parseNordnetPublicFund,
} from '../../functions/api/current/portfolio-fund-recovery';

test('forest quarterly return is compounded into marked approximate 1D/1W/1M values', () => {
  const forest = projectForestShortPeriods({
    id: 'op-forest-owner-b',
    changes: { today: null, week1: null, month1: null, month3: 6 },
  });
  expect(forest.estimatedPeriods).toEqual(['today', 'week1', 'month1']);
  expect(forest.changes.today).toBeCloseTo((Math.pow(1.06, 1 / 91) - 1) * 100, 9);
  expect(forest.changes.week1).toBeCloseTo((Math.pow(1.06, 7 / 91) - 1) * 100, 9);
  expect(forest.changes.month1).toBeCloseTo((Math.pow(1.06, 30 / 91) - 1) * 100, 9);
  expect(forest.changes.month3).toBe(6);
  expect(projectQuarterReturn(-5, 7)).toBeLessThan(0);
  expect(projectQuarterReturn(-101, 1)).toBeNull();
  const other = { id: 'nordnet-finland', changes: { today: null, week1: null, month1: null, month3: 3 } };
  expect(projectForestShortPeriods(other)).toBe(other);
});

test('forest preserves published returns and estimates only missing periods', () => {
  const mixed = projectForestShortPeriods({
    id: 'op-forest-owner-b',
    changes: { today: 0.4, week1: null, month1: 3.2, month3: 6 },
  });
  expect(mixed.changes.today).toBe(0.4);
  expect(mixed.changes.month1).toBe(3.2);
  expect(mixed.changes.week1).toBeCloseTo((Math.pow(1.06, 7 / 91) - 1) * 100, 9);
  expect(mixed.estimatedPeriods).toEqual(['week1']);
  expect(mixed.estimationMethod).toBe('compound-3m-over-91-days');

  const complete = {
    id: 'op-forest-owner-b',
    changes: { today: 0.4, week1: 1.1, month1: 3.2, month3: 6 },
  };
  expect(projectForestShortPeriods(complete)).toBe(complete);

  const noQuarter = {
    id: 'op-forest-owner-b',
    changes: { today: null, week1: null, month1: 3.2, month3: null },
  };
  expect(projectForestShortPeriods(noQuarter)).toBe(noQuarter);
});

test('fund history parser checks exact ISIN and calculates only periods supported by dates', () => {
  const history = parseInvestingFundHistory(
    'Nordnet Suomi Indeksi - Historical Data ISIN: SE0005993102 ' +
    'Date Price Open High Low Change% ' +
    'Nov 12, 2026 | 104.00 | 104.00 | 104.00 | 104.00 | +1.0% ' +
    'Nov 19, 2026 | 110.00 | 110.00 | 110.00 | 110.00 | +5.7% ' +
    'Nov 20, 2026 | 112.00 | 112.00 | 112.00 | 112.00 | +1.8%',
    'SE0005993102',
  );
  expect(history).toHaveLength(3);
  const spec = { id: 'nordnet-finland' as const, label: 'NORDNET SUOMI INDEKSI', isin: 'SE0005993102' };
  const item = buildRecoveredHistoricalFund(spec, history, new Date('2026-11-21T12:00:00Z'));
  expect(item?.price).toBe(112);
  expect(item?.changes.today).toBeCloseTo((112 / 110 - 1) * 100, 9);
  expect(item?.changes.week1).toBeCloseTo((112 / 104 - 1) * 100, 9);
  expect(item?.changes.month1).toBeNull();
  expect(item?.changes.year5).toBeNull();
  expect(buildRecoveredHistoricalFund(spec, history, new Date('2026-12-11T12:00:00Z'))).toBeNull();
  expect(parseInvestingFundHistory('Historical Data ISIN SE1234567890 Nov 20, 2026 | 100.00 | 100', spec.isin)).toEqual([]);
});

test('Storebrand public NAV recovery enforces share class and currency, and rejects stale dates', () => {
  const spec = { id: 'storebrand-japan' as const, label: 'STOREBRAND JAPAN A EUR', isin: 'SE0013801479',
    nordnet: 'https://www.nordnet.fi/rahastot/lista/storebrand-japan-a-eur-dbe9644c' };
  const html = 'Storebrand Japan A EUR +0,42%20.11. +11,24%12 kk NAV (20.11.)214,32 EUR';
  const current = parseNordnetPublicFund(html, spec, new Date('2026-11-21T12:00:00Z'));
  expect(current?.price).toBe(214.32);
  expect(current?.changes.today).toBeCloseTo(0.42, 9);
  expect(current?.changes.year1).toBeCloseTo(11.24, 9);
  expect(current?.changes.month1).toBeNull();
  expect(parseNordnetPublicFund(html, spec, new Date('2026-12-21T12:00:00Z'))).toBeNull();
  expect(parseNordnetPublicFund(html.replace('Storebrand Japan A EUR','Storebrand Japan A SEK'), spec, new Date('2026-11-21T12:00:00Z'))).toBeNull();
});

test('OP short-period fallback only derives real recent NAV differences, never stale or guessed figures', () => {
  const dates = [
    { observedAt: '2026-11-12', value: 100 },
    { observedAt: '2026-11-19', value: 104 },
    { observedAt: '2026-11-20', value: 105 },
  ];
  const result = buildInvestingOnlyShortChanges(dates, new Date('2026-11-21T12:00:00Z'));
  expect(result?.today).toBeCloseTo((105 / 104 - 1) * 100, 8);
  expect(result?.week1).toBeCloseTo((105 / 100 - 1) * 100, 8);
  expect(buildInvestingOnlyShortChanges(dates, new Date('2026-12-21T12:00:00Z'))).toBeNull();
  expect(buildInvestingOnlyShortChanges(dates.slice(1), new Date('2026-11-21T12:00:00Z'))?.week1).toBeNull();
});
