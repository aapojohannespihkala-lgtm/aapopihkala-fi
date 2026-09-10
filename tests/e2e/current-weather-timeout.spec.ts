import { expect, test } from '@playwright/test';

import {
  fetchCurrentExternal,
  fetchCurrentGuarded,
} from '../../src/features/current/externalFetchGuard';

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

test('weather timeout remains bounded when the caller supplies an AbortSignal', async () => {
  let wasAborted = false;
  const caller = new AbortController();

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

  const startedAt = Date.now();
  await expect(
    fetchCurrentExternal(
      hangingFetch,
      'https://api.open-meteo.com/v1/forecast?latitude=60.1719&longitude=24.7314',
      { signal: caller.signal },
      25
    )
  ).rejects.toMatchObject({ name: 'AbortError' });

  expect(wasAborted).toBe(true);
  expect(Date.now() - startedAt).toBeLessThan(1_000);
});

test('caller abort is forwarded to the guarded weather request', async () => {
  const caller = new AbortController();
  const abortReason = new DOMException('Caller cancelled weather request', 'AbortError');
  let guardedSignal: AbortSignal | null | undefined;

  const hangingFetch = ((
    _input: RequestInfo | URL,
    init?: RequestInit
  ) => new Promise<Response>((_resolve, reject) => {
    guardedSignal = init?.signal;
    init?.signal?.addEventListener(
      'abort',
      () => reject(init.signal?.reason ?? new DOMException('Aborted', 'AbortError')),
      { once: true }
    );
  })) as typeof fetch;

  const request = fetchCurrentExternal(
    hangingFetch,
    'https://api.open-meteo.com/v1/forecast?latitude=60.1719&longitude=24.7314',
    { signal: caller.signal },
    5_000
  );

  caller.abort(abortReason);

  await expect(request).rejects.toBe(abortReason);
  expect(guardedSignal).toBeInstanceOf(AbortSignal);
  expect(guardedSignal?.aborted).toBe(true);
  expect(guardedSignal?.reason).toBe(abortReason);
});

test('Snapshot Current API requests abort after the bounded Snapshot timeout', async () => {
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

  await expect(
    fetchCurrentGuarded(
      hangingFetch,
      '/api/current/liiga',
      { headers: { Accept: 'application/json' } },
      {
        pageUrl: 'https://aapopihkala.fi/current/snapshot/',
        snapshotApiTimeoutMs: 25,
      }
    )
  ).rejects.toMatchObject({ name: 'AbortError' });

  expect(wasAborted).toBe(true);
});

test('Snapshot timeout does not leak to other Current pages', async () => {
  let capturedSignal: AbortSignal | null | undefined;

  const successfulFetch = ((
    _input: RequestInfo | URL,
    init?: RequestInit
  ) => {
    capturedSignal = init?.signal;
    return Promise.resolve(new Response('{}', { status: 200 }));
  }) as typeof fetch;

  const response = await fetchCurrentGuarded(
    successfulFetch,
    '/api/current/liiga',
    { headers: { Accept: 'application/json' } },
    { pageUrl: 'https://aapopihkala.fi/current/liiga/' }
  );

  expect(response.status).toBe(200);
  expect(capturedSignal).toBeUndefined();
});

test('non-weather requests are not given an extra timeout signal by the legacy external helper', async () => {
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
