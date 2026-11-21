import { expect, test } from '@playwright/test';
import {
  parseNordnetManagerNav,
  parseNordnetPublicFund,
  parseNordnetEmbeddedFund,
} from '../../functions/api/current/portfolio-fund-recovery';

test('Nordnet fund-company table restores exact Finland fund NAV without inventing performance', () => {
  const document = `<table><tr><th>Fund</th><th>ISIN</th><th>NAV Price</th><th>NAV Date</th></tr>
  <tr><td>Nordnet Sverige Index</td><td>SE0002756973</td><td>850.54</td><td>19/11</td></tr>
  <tr><td>Nordnet Suomi Indeksi</td><td>SE0005993102</td><td>348.87</td><td>19/11</td></tr>
  <tr><td>Nordnet Norge Indeks</td><td>SE0005993110</td><td>340.94</td><td>19/11</td></tr></table>`;
  const now = new Date('2026-11-21T10:00:00Z');
  const fund = parseNordnetManagerNav(document, now);
  expect(fund).toMatchObject({
    id: 'nordnet-finland', symbol: 'SE0005993102', price: 348.87, observedAt: '2026-11-19',
  });
  expect(Object.values(fund?.changes ?? {})).toEqual(Array(9).fill(null));
  expect(parseNordnetManagerNav(document, new Date('2026-12-04T10:00:00Z'))).toBeNull();
  expect(parseNordnetManagerNav(document.replace('SE0005993102', 'SE0005993103'), now)).toBeNull();
  expect(parseNordnetManagerNav(document.replace('348.87', 'invalid'), now)).toBeNull();
});

test('Nordnet public site NAV recovers Handelsbanken A1 EUR and rejects other share classes', () => {
  const html = `<h1>Handelsbanken USA Index (A1 EUR)</h1>
    <div>+0.28%20.11.</div><p>+8.54%12 kk</p><div>NAV (20.11.)104,66 EUR</div>`;
  const spec = { id: 'handelsbanken-usa' as const,
    label: 'HANDELSBANKEN USA INDEKSI', isin: 'SE0006800140',
    nordnet: 'https://www.nordnet.se/fonder/lista/handelsbanken-usa-index-a1-eur-348def3b' };
  const now = new Date('2026-11-21T10:00:00Z');
  expect(parseNordnetPublicFund(html, spec, now)).toMatchObject({
    id: 'handelsbanken-usa', price: 104.66, observedAt: '2026-11-20',
  });
  expect(parseNordnetPublicFund(html.replace('(A1 EUR)', '(A1 SEK)'), spec, now)).toBeNull();
  expect(parseNordnetPublicFund(html, spec, new Date('2026-12-15T10:00:00Z'))).toBeNull();
});

test('Nordnet structured public fund page supplies validated NAV and all published periods', () => {
  const now = new Date('2026-11-21T10:00:00Z');
  const spec = { id: 'storebrand-japan', label: 'STOREBRAND JAPAN A EUR', isin: 'SE0013801479' };
  const raw = '{"isin":"SE0013801479","currency":"EUR"},"navInfo":{' +
    '"developmentPreviousPercentage":-0.19,' +
    '"latestNav":{"date":"2026-11-19","value":208.4719},' +
    '"returns":[{"development":-0.19,"period":"DAY_1"},' +
    '{"development":4.11,"period":"WEEK_1"},' +
    '{"development":43.39,"period":"YEAR_5"}]}';
  const escaped = raw.replace(/"/g, '\\"');
  for (const body of [raw, escaped]) {
    const result = parseNordnetEmbeddedFund('<script>' + body + '</script>', spec, now);
    expect(result).toMatchObject({
      id: 'storebrand-japan',
      symbol: 'SE0013801479',
      observedAt: '2026-11-19',
      price: 208.4719,
      changes: { today: -0.19, week1: 4.11, year5: 43.39, month1: null },
    });
  }
  expect(parseNordnetEmbeddedFund(raw, spec, new Date('2026-12-21T10:00:00Z'))).toBeNull();
  expect(parseNordnetEmbeddedFund(raw.replace('SE0013801479','SE0013801480'), spec, now)).toBeNull();
  expect(parseNordnetEmbeddedFund(raw.replace('"EUR"', '"SEK"'), spec, now)).toBeNull();
  const noReturns = raw.replace(/,"returns":\[[^\]]+\]/, '');
  expect(parseNordnetEmbeddedFund(noReturns, spec, now)?.changes.year5).toBeNull();
});

test('Nordnet Sweden and Spiltan use matching SEK NAV, not another fund on the page', () => {
  const now = new Date('2026-11-21T10:00:00Z');
  const rows = [
    { id: 'nordnet-sweden', isin: 'SE0002756973', label: 'NORDNET SVERIGE INDEX', value: 850.54 },
    { id: 'spiltan-investmentbolag', isin: 'SE0004297927', label: 'SPILTAN AKTIEFOND INVESTMENTBOLAG', value: 850.32 },
  ];
  const html = rows.map((row) =>
    '{"isin":"' + row.isin + '","currency":"SEK"},"navInfo":{' +
    '"latestNav":{"date":"2026-11-19","value":' + row.value + '},' +
    '"returns":[{"development":24.12,"period":"YEAR_5"}]}').join(' ');
  for (const row of rows) {
    expect(parseNordnetEmbeddedFund(html, row, now)).toMatchObject({
      id: row.id, price: row.value, changes: {year5: 24.12},
    });
  }
});

test('a stale duplicated hydration entry cannot shadow a fresh matching ISIN entry', () => {
  const spec = { id: 'storebrand-japan', label: 'STOREBRAND JAPAN A EUR', isin: 'SE0013801479' };
  const one = (date: string, value: number, change: number) =>
    '{"isin":"SE0013801479","currency":"EUR"},"navInfo":{' +
    '"latestNav":{"date":"' + date + '","value":' + value + '},' +
    '"returns":[{"development":' + change + ',"period":"YEAR_5"}]}';
  const raw = one('2026-10-01', 200, 9) + ' ' + one('2026-11-19', 208.47, 43.39);
  const item = parseNordnetEmbeddedFund(raw, spec, new Date('2026-11-21T10:00:00Z'));
  expect(item).toMatchObject({
    observedAt: '2026-11-19', price: 208.47, changes: { year5: 43.39 },
  });
});
