import { expect, test } from '@playwright/test';
import {
  parseNordnetManagerNav,
  parseNordnetPublicFund,
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
