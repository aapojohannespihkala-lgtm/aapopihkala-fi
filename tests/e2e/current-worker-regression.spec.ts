import { expect, test } from '@playwright/test';
import worker from '../../worker/index';

const buildWorkerElectricityFixture = () => ({
  prices: [
    {
      price: 1.23,
      startDate: '2026-09-06T14:00:00.000Z',
      endDate: '2026-09-06T14:15:00.000Z',
    },
  ],
});

test('Worker serves Current electricity API and keeps static assets as fallback', async () => {
  const originalFetch = globalThis.fetch;
  const upstreamFixture = buildWorkerElectricityFixture();

  globalThis.fetch = async (input, init) => {
    expect(String(input)).toBe('https://api.porssisahko.net/v2/latest-prices.json');
    expect(new Headers(init?.headers).get('Accept')).toBe('application/json');

    return new Response(JSON.stringify(upstreamFixture), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const env = {
    ASSETS: {
      fetch: async (request: Request) =>
        new Response(`asset:${new URL(request.url).pathname}`, { status: 200 }),
    },
  };

  try {
    const apiResponse = await worker.fetch(
      new Request('https://aapopihkala.fi/api/current/electricity'),
      env
    );

    expect(apiResponse.status).toBe(200);
    expect(await apiResponse.json()).toEqual(upstreamFixture);

    const staticResponse = await worker.fetch(
      new Request('https://aapopihkala.fi/current/'),
      env
    );

    expect(staticResponse.status).toBe(200);
    expect(await staticResponse.text()).toBe('asset:/current/');

    const methodResponse = await worker.fetch(
      new Request('https://aapopihkala.fi/api/current/electricity', { method: 'POST' }),
      env
    );

    expect(methodResponse.status).toBe(405);
    expect(methodResponse.headers.get('allow')).toBe('GET');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
