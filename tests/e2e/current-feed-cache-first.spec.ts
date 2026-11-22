import { expect, test } from '@playwright/test';
import {
  serveCurrentFeedWithLastKnownGood,
  servePortfolioWithLastKnownGood,
  serveWidgetWithLastKnownGood,
} from '../../worker/index';

const makeCache = () => {
  const saved = new Map<string, Response>();
  return {
    async match(request: Request) {
      return saved.get(request.url)?.clone();
    },
    async put(request: Request, response: Response) {
      saved.set(request.url, response.clone());
    },
  };
};

test('market macro feed uses recently validated edge data without rerunning upstream', async () => {
  const request = new Request('https://aapopihkala.fi/api/current/markets');
  const cache = makeCache();
  const body = {
    items: [{ id: 'euribor-3m', value: 2.1, observedAt: '2026-11-20' }],
    series: [
      { id: 'euribor-3m', points: [{ value: 2.1, observedAt: '2026-11-20' }] },
      { id: 'world', points: [{ value: 100, observedAt: '2026-11-20' }] },
    ],
  };
  let loads = 0;
  const first = await serveCurrentFeedWithLastKnownGood(
    request, 'markets', async () => { loads++; return Response.json(body); }, cache, true,
  );
  expect(first.status).toBe(200);
  const cached = await serveCurrentFeedWithLastKnownGood(
    request, 'markets', async () => { loads++; throw Error('unnecessary upstream'); }, cache, true,
  );
  expect(loads).toBe(1);
  expect(cached.headers.get('x-current-cache')).toBe('recent');
  expect((await cached.json()).items[0].id).toBe('euribor-3m');

  const liveSmoke = await serveCurrentFeedWithLastKnownGood(
    new Request(request.url + '?live_smoke=1'), 'markets',
    async () => { loads++; return Response.json({ error: 'upstream_unavailable' }, { status: 502 }); },
    cache, true,
  );
  expect(liveSmoke.status).toBe(502);
  expect(loads).toBe(2);
});

test('widget v2 uses recent cache while live_smoke probes sources', async () => {
  const cache = makeCache();
  const request = new Request('https://aapopihkala.fi/api/current/widget-v2?channel=prod');
  const data = { schemaVersion: 2, channel: 'prod', generatedAt: new Date().toISOString(), sections: [{ id: 'weather' }] };
  let loads = 0;
  await serveWidgetWithLastKnownGood(
    request, async () => { loads++; return Response.json(data); }, cache, 4_000, undefined, true,
  );
  const cached = await serveWidgetWithLastKnownGood(
    request, async () => { loads++; throw Error('should not refresh'); }, cache, 4_000, undefined, true,
  );
  expect(loads).toBe(1);
  expect(cached.headers.get('x-widget-cache')).toBe('recent');
  expect((await cached.json()).schemaVersion).toBe(2);

  const smoke = await serveWidgetWithLastKnownGood(
    new Request(request.url + '&live_smoke=1'),
    async () => { loads++; return Response.json({ error: 'upstream' }, { status: 503 }); },
    cache, 4_000, undefined, true,
  );
  expect(smoke.status).toBe(503);
  expect(loads).toBe(2);
});

test('incomplete real portfolio is cached separately and never portrayed as 19 of 19', async () => {
  const cache = makeCache();
  const request = new Request('https://aapopihkala.fi/api/current/markets?portfolio=1&v=6');
  const ids = [
    'ishares-world', 'ishares-europe', 'nordnet-sweden', 'spiltan-investmentbolag',
    'franklin-sp500-climate', 'xact-norden', 'nordea', 'marimekko', 'remedy',
    'op-asia-index-a', 'op-europe-index-a', 'op-world-index-a',
    'op-forest-owner-b', 'btc', 'bnb', 'eth',
  ];
  const body = {
    expected: 19,
    items: ids.map((id) => ({
      id, label: id, observedAt: '2026-11-20', price: 10,
      changes: { today: 1, week1: 2, month1: 3, month3: 4, month6: 5, ytd: 6, year1: 7, year3: 8, year5: 9 },
    })),
    unavailable: ['handelsbanken-usa', 'nordnet-finland', 'storebrand-japan'],
    source: 'live partial sources',
  };
  let loads = 0;
  const first = await servePortfolioWithLastKnownGood(
    request, async () => { loads++; return Response.json(body); }, cache, true,
  );
  expect(first.status).toBe(200);
  const cached = await servePortfolioWithLastKnownGood(
    request, async () => { loads++; throw Error('unnecessary retry'); }, cache, true,
  );
  expect(loads).toBe(1);
  expect(cached.headers.get('x-portfolio-cache')).toBe('recent');
  const data = await cached.json();
  expect(data.items).toHaveLength(16);
  expect(data.unavailable).toEqual(body.unavailable);
  expect(data.expected).toBe(19);

  const smoke = await servePortfolioWithLastKnownGood(
    new Request(request.url + '&live_smoke=1'),
    async () => { loads++; return Response.json({ error: 'upstream' }, { status: 502 }); },
    cache, true,
  );
  expect(smoke.status).toBe(502);
  expect(loads).toBe(2);
});
