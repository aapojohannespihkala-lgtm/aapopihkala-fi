import { expect, test } from '@playwright/test';
import { summarizeWidgetPortfolio } from '../../functions/api/current/widget';
import { buildWidgetV2Payload } from '../../functions/api/current/widget-v2';

const periods = ['today','week1','month1','month3','month6','ytd','year1','year3','year5'];
const emptyChanges = () => Object.fromEntries(periods.map((p) => [p, null]));
const sourceFund = (id: string, overrides: Record<string, unknown> = {}) => ({
  id, symbol: id.toUpperCase(), observedAt: '2026-11-20', price: 17,
  changes: { ...emptyChanges(), month3: 9, ...overrides },
});

test('Widget market card uses source estimates without new requests and exposes 1D/1M/1Y provenance', () => {
  const holdings = [
    'ishares-world', 'handelsbanken-usa', 'nordnet-finland', 'btc', 'remedy',
  ].map((id) => sourceFund(id));
  const summary = summarizeWidgetPortfolio({ items: holdings },
    new Date('2026-11-21T12:00:00Z'));
  expect(summary?.estimatedCounts.today).toEqual({ estimated: 5, total: 5 });
  expect(summary?.estimatedCounts.month1).toEqual({ estimated: 5, total: 5 });
  expect(summary?.estimatedCounts.year1).toEqual({ estimated: 5, total: 5 });
  expect(summary?.unresolvedSelected).toEqual([]);
  expect(summary?.world).toBeCloseTo((Math.pow(1.09, 1 / 91) - 1) * 100, 8);
  expect(summary?.selectedSources.world).toMatchObject({
    estimated: true, symbol: 'ISHARES-WORLD', observedAt: '2026-11-20',
    detail: { sourcePeriod: 'month3', sourceReturnPercent: 9,
      sourceDays: 91, targetDays: 1, sourceAgeDays: 1,
      method: 'geometric-period-scaling' },
  });
  const widget = buildWidgetV2Payload({
    markets: summary, updated: '2026-11-21T12:00:00Z',
  }, null, 'prod', '2026-11-21T12:00:00Z');
  const card = widget.sections.find((section) => section.id === 'markets');
  expect(card?.primary).toMatch(/^≈\+\d+\.\d{2}%$/);
  expect(card?.detail).toContain('1M ≈+');
  expect(card?.detail).toContain('1Y ≈+');
  expect(card?.detail).toContain('1D MEDIAN: 5/5 SOURCE-BASED ESTIMATES');
  expect(card?.rows).toHaveLength(5);
  expect(card?.rows?.every((row) => row.value.startsWith('≈+') && row.value.includes('%')))
    .toBe(true);
  expect(card?.rows?.[0].secondary).toMatch(/≈ MONTH3 \/ \+9.00% \/ 91D→1D \/ GEOMETRIC \/ ISHARES-WORLD \/ 2026-11-20 \/ AGE 1D/);
});

test('Widget distinguishes actual returns from estimated ones and never overwrites verified figures', () => {
  const data = summarizeWidgetPortfolio({
    items: [
      sourceFund('ishares-world', {today: 2.5,month1: 4,year1: 15}),
      sourceFund('handelsbanken-usa'),
      sourceFund('nordnet-finland'),
      sourceFund('btc'),
      sourceFund('remedy'),
    ],
  }, new Date('2026-11-21T12:00:00Z'));
  expect(data?.world).toBe(2.5);
  expect(data?.estimatedCounts.today).toEqual({ estimated: 4, total: 5 });
  const card = buildWidgetV2Payload({ markets:data },null,'prod').sections.find(
    (section) => section.id === 'markets');
  const actual = card?.rows?.find((row) => row.label === 'WORLD');
  const estimated = card?.rows?.find((row) => row.label === 'USA');
  expect(actual?.value).toBe('+2.50%');
  expect(actual?.secondary).toBe('ISHARES-WORLD / 2026-11-20');
  expect(estimated?.value).toMatch(/^≈\+/);
  expect(card?.primary).toMatch(/^≈/);
  expect(card?.detail).toContain('1Y MEDIAN: 4/5 SOURCE-BASED ESTIMATES');
});

test('Widget never invents returns for entirely missing source periods', () => {
  const summary = summarizeWidgetPortfolio({
    items: [sourceFund('ishares-world', {month3: null})],
  }, new Date('2026-11-21T12:00:00Z'));
  expect(summary?.world).toBeNull();
  expect(summary?.unresolvedSelected).toContain('world');
  expect(summary?.estimatedCounts.today.total).toBe(0);
  const payload = buildWidgetV2Payload({
    markets: { ...summary, median: 0.2 },
  }, null, 'prod');
  const card = payload.sections.find((section) => section.id === 'markets');
  expect(card?.detail).toContain('SOURCE GAPS: world');
  // A source gap is a failing coverage condition, never a fabricated 0%.
  expect(card?.rows?.[0].value).toBe('--');
});
