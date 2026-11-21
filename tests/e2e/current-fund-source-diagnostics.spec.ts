import { expect, test } from '@playwright/test';
import { diagnoseCurrentFundSource } from '../../functions/api/current/portfolio-source-diagnostics';

test('source probe reports only safe status and exact-ISIN parse coverage', async () => {
  const payload = '{"isin":"SE0013801479","currency":"EUR"},"navInfo":{' +
    '"latestNav":{"date":"2026-11-19","value":208.47},' +
    '"returns":[{"development":43.39,"period":"YEAR_5"}]}';
  const fakeFetch = async (_url: RequestInfo | URL, _init?: RequestInit) =>
    new Response(payload, { status: 200, headers: { 'Content-Length': String(payload.length) } });
  const result = await diagnoseCurrentFundSource(
    'storebrand-japan', fakeFetch as typeof fetch, 1000,
  );
  expect(result.status).toBe(200);
  const body = await result.json();
  expect(body).toMatchObject({
    id: 'storebrand-japan', source: 'www.nordnet.fi', httpStatus: 200,
    parsed: true, observedAt: '2026-11-19', populatedPeriods: 1,
  });
  expect(result.headers.get('cache-control')).toBe('no-store');
  expect(JSON.stringify(body)).not.toContain('208.47');
});

test('source probe records upstream HTTP failures without exposing response body', async () => {
  const response = await diagnoseCurrentFundSource(
    'nordnet-finland',
    (async () => new Response('challenge html secret marker', { status: 403 })) as typeof fetch,
    1000,
  );
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data).toMatchObject({
    id: 'nordnet-finland', httpStatus: 403, parsed: false, reason: 'http_error',
  });
  expect(JSON.stringify(data)).not.toContain('secret marker');
});

test('source probe refuses unknown fund IDs', async () => {
  const response = await diagnoseCurrentFundSource(
    'arbitrary-hostname.invalid', (async () => { throw Error('must not run'); }) as typeof fetch,
  );
  expect(response.status).toBe(400);
});
