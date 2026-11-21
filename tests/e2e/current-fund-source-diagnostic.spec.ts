import { test } from '@playwright/test';
import { parseInvestingFundHistory, parseNordnetPublicFund, parseNordnetEmbeddedFund } from '../../functions/api/current/portfolio-fund-recovery';

test('diagnose which public fund sources are reachable from CI', async () => {
  const urls = [
    'https://fi.investing.com/funds/usa-index-a1-eur-historical-data',
    'https://au.investing.com/funds/usa-index-a1-eur-historical-data',
    'https://fi.investing.com/funds/nordnet-superrahasto-suomi-historical-data',
    'https://nordnetab.com/funds/our-funds/',
    'https://www.nordnet.fi/rahastot/lista/storebrand-japan-a-eur-dbe9644c',
    'https://www.nordnet.fi/rahastot/lista/nordnet-suomi-indeksi-eur-a401761d',
    'https://ycharts.com/mutual_funds/M:SE0013801479/net_asset_value',
    'https://api.prod.nntech.io/instrument-screening/v2/mutual-funds/web/storebrand-japan-a-eur-dbe9644c',
    'https://api.prod.nntech.io/instrument-screening/v2/mutual-funds/web/nordnet-suomi-indeksi-eur-a401761d',
    'https://www.nordnet.se/fonder/lista/handelsbanken-usa-index-a1-eur-348def3b',
    'https://www.nordnet.fi/rahastot/lista/handelsbanken-usa-index-a1-eur-348def3b',
    'https://www.spiltanfonder.se/fonder/spiltan-aktiefond-investmentbolag',
    'https://www.nordnet.se/fonder/lista/nordnet-sverige-index-sek-aa7a9014',
    'https://api.prod.nntech.io/instrument-screening/v2/mutual-funds/web/nordnet-sverige-index-sek-aa7a9014',
  ];
  const results = await Promise.all(urls.map(async (url) => {
    const timeout = AbortSignal.timeout(9000);
    try {
      const response = await fetch(url, { signal: timeout, headers: {
        Accept: 'text/html,application/json;q=0.9',
        'User-Agent': 'Mozilla/5.0 (compatible; Current public feed monitoring)',
        'x-locale': 'fi-FI',
      } });
      const body = await response.text();
      const isin = url.includes('usa-index') ? 'SE0006800140' :
        url.includes('nordnet') ? 'SE0005993102' : 'SE0013801479';
      const parsed = url.includes('investing.com') ? parseInvestingFundHistory(body, isin) : [];
      const relevant = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      const ix = relevant.indexOf(isin);
      const nav = url.includes('storebrand-japan-a-eur') && !url.includes('api.prod')
        ? parseNordnetPublicFund(body, {
          id: 'storebrand-japan', label: 'STOREBRAND JAPAN A EUR', isin: 'SE0013801479',
        }, new Date('2026-11-21T12:00:00Z'))?.observedAt ?? null : null;
      const embedded = url.includes('/rahastot/lista/') || url.includes('/fonder/lista/')
        ? parseNordnetEmbeddedFund(body, {
          id: url.includes('storebrand-japan') ? 'storebrand-japan'
            : url.includes('handelsbanken-usa') ? 'handelsbanken-usa'
            : url.includes('nordnet-sverige') ? 'nordnet-sweden'
            : 'nordnet-finland',
          label: 'live matched fund',
          isin: url.includes('storebrand-japan') ? 'SE0013801479'
            : url.includes('handelsbanken-usa') ? 'SE0006800140'
            : url.includes('nordnet-sverige') ? 'SE0002756973' : 'SE0005993102',
        }, new Date('2026-11-21T12:00:00Z')) : null;
      const patterns = ['navInfo', 'YEAR_5', 'yield_5y', 'MONTH_3', 'annual_growth', 'NAV (', 'Senaste NAV', '5 år:'];
      const matches = patterns.flatMap((term) => {
        const offset = body.indexOf(term);
        return offset < 0 ? [] : [{ term, around: body.slice(Math.max(0, offset - 25), offset + 110).replace(/\\n/g, ' ') }];
      });
      return { host: new URL(url).hostname, path: new URL(url).pathname.slice(0,95), status: response.status,
        length: body.length, isinPresent: relevant.includes(isin), historyCount: parsed.length,
        historyLatest: parsed.at(-1)?.observedAt ?? null, nordnetNav: nav,
        marker: ix >= 0 ? relevant.slice(Math.max(0,ix-25), ix+95) : relevant.slice(0,100), matches,
        embedded: embedded ? {id: embedded.id, price: embedded.price,
          observedAt: embedded.observedAt, year5: embedded.changes.year5,
          periods: Object.entries(embedded.changes).filter(([_, v]) => v !== null).map(([k]) => k)} : null,
      };
    } catch (error) {
      return { host: new URL(url).hostname, path: new URL(url).pathname.slice(0,95),
        error: error instanceof Error ? error.name : 'unknown' };
    }
  }));
  console.log('CURRENT_FUND_SOURCE_PROBE ' + JSON.stringify(results));
});
