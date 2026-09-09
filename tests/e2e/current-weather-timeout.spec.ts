import { expect, test } from '@playwright/test';

import { fetchCurrentExternal } from '../../src/features/current/externalFetchGuard';

test('Open-Meteo requests abort after the bounded weather timeout', async () => {
  let wasAborted = false;

  const hangingFetch = ((
    _input: RequestInfo | URL,
    init?: RequestInit
  ) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener(
      'abort',
      () => {
        wasAborted = true;
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true }
    );
  })) as typeof fetch;

  let thrown: unknown = null;

  try {
    await fetchCurrentExternal(
      hangingFetch,
      'https://api.open-meteo.com/v1/forecast?latitude=60.1719&longitude=24.7314',
      { headers: { Accept: 'application/json' } },
      25
    );
  } catch (error) {
    thrown = error;
  }

  expect(thrown).toBeInstanceOf(DOMException);
  expect((thrown as DOMException).name).toBe('AbortError');
  expect(wasAborted).toBe(true);
});

test('non-weather requests are not given an extra timeout signal', async () => {
  let capturedSignal: AbortSignal | null | undefined;

  const successfulFetch = ((
    _input: RequestInfo | URL,
    init?: RequestInit
  ) => {
    capturedSignal = init?.signal;
    return Promise.resolve(new Response('{}', { status: 200 }));
  }) as typeof fetch;

  const response = await fetchCurrentExternal(
    successfulFetch,
    '/api/current/news',
    { headers: { Accept: 'application/json' } },
    25
  );

  expect(response.status).toBe(200);
  expect(capturedSignal).toBeUndefined();
});

test('standalone Weather leaves loading state when Open-Meteo never responds', async ({ page }) => {
  await page.addInitScript(() => {
    window.fetch = ((
      _input: RequestInfo | URL,
      init?: RequestInit
    ) => new Promise<Response>((_resolve, reject) => {
      const rejectOnAbort = () => {
        reject(new DOMException('Aborted', 'AbortError'));
      };

      if (init?.signal?.aborted) {
        rejectOnAbort();
      } else {
        init?.signal?.addEventListener('abort', rejectOnAbort, { once: true });
      }
    })) as typeof fetch;
  });

  await page.goto('/current/weather/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('[data-current-weather]')).toHaveAttribute('aria-busy', 'false', {
    timeout: 10_000,
  });
  await expect(page.locator('[data-weather-condition]')).toHaveText('Forecast unavailable');
  await expect(page.locator('[data-weather-error]')).toBeVisible();
});
