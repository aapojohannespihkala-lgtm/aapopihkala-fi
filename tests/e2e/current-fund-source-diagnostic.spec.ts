import { test } from '@playwright/test';
import { parseInvestingFundHistory, parseNordnetPublicFund } from '../../functions/api/current/portfolio-fund-recovery';

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
      return { host: new URL(url).hostname, path: new URL(url).pathname.slice(0,95), status: response.status,
        length: body.length, isinPresent: relevant.includes(isin), historyCount: parsed.length,
        historyLatest: parsed.at(-1)?.observedAt ?? null, nordnetNav: nav,
        marker: ix >= 0 ? relevant.slice(Math.max(0,ix-25), ix+95) : relevant.slice(0,100),
      };
    } catch (error) {
      return { host: new URL(url).hostname, path: new URL(url).pathname.slice(0,95),
        error: error instanceof Error ? error.name : 'unknown' };
    }
  }));
  console.log('CURRENT_FUND_SOURCE_PROBE ' + JSON.stringify(results));
});
